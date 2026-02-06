
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Subject, Session, TranscriptionTurn, Note, Attachment } from '../types';
import { generateSessionInsight } from '../services/gemini';
import { callPerplexity, extractKeywords, explainConcept } from '../services/perplexity';
import QAConsole from './QAConsole';
import TranscriptStream from './TranscriptStream';
import SessionControls from './SessionControls';
import AudioVisualizer from './AudioVisualizer';
import ExpandableModal from './ExpandableModal';
import UnifiedInput from './UnifiedInput';
import { Maximize2, Sparkles, X } from 'lucide-react';
import { masterIntelligence } from '../services/intelligence';
import { CREDIT_COSTS } from '../constants/pricing';
import { useNotificationStore } from '../stores/useNotificationStore';
import { useBackgroundStore } from '../stores/useBackgroundStore';
import { useTranscription } from '../hooks/useTranscription';
import { useSessionSync } from '../hooks/useSessionSync';

const KnowledgeGraph = React.lazy(() => import('./EnhancedKnowledgeGraph'));

interface SessionViewProps {
  session: Session;
  subject: Subject;
  onBack: () => void;
  onUpdateSession: (session: Session) => void;
  isMiniMode?: boolean;
  setIsMiniMode?: (val: boolean) => void;
  onExpand?: () => void;
  consumeCredits: (amount: number, operation: string) => Promise<boolean>;
}

const SessionView: React.FC<SessionViewProps> = ({
  session,
  subject,
  onBack,
  onUpdateSession,
  isMiniMode = false,
  setIsMiniMode,
  onExpand,
  consumeCredits
}) => {
  const { addNotification } = useNotificationStore();
  const setBackgroundState = useBackgroundStore(state => state.setState);

  // High-level Domain State
  const [transcription, setTranscription] = useState<TranscriptionTurn[]>(session.turns || []);
  const [concepts, setConcepts] = useState(session.concepts || []);
  const [suggestedQuestions] = useState<string[]>(session.suggestedQuestions || []);
  const [insight, setInsight] = useState<{ summary: string; examQuestions: string[] } | null>(
    session.summary ? { summary: session.summary, examQuestions: session.examQuestions || [] } : null
  );
  const [notes, setNotes] = useState<Note[]>(session.notes || []);
  const [consoleMessages, setConsoleMessages] = useState<Array<{ role: 'user' | 'ai'; text: string }>>([]);

  // UI State
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [transcriptModalOpen, setTranscriptModalOpen] = useState(false);
  const [consoleModalOpen, setConsoleModalOpen] = useState(false);
  const [graphModalOpen, setGraphModalOpen] = useState(false);

  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Reset state when session changes
  useEffect(() => {
    setTranscription(session.turns || []);
    setConcepts(session.concepts || []);
    setNotes(session.notes || []);
    setConsoleMessages([]);
    setInsight(session.summary ? { summary: session.summary, examQuestions: session.examQuestions || [] } : null);
  }, [session.id]); // Only trigger on ID change (new session)

  // Hook: Transcription Engine
  const {
    isRecording,
    isPaused,
    setIsPaused,
    volumeBoost,
    setVolumeBoost,
    skipSilence,
    setSkipSilence,
    analyser,
    startRecording,
    stopRecording
  } = useTranscription((text) => {
    updateTranscription('user', text);
  });

  // Hook: Background Persistence
  useSessionSync(session, onUpdateSession, transcription, concepts, suggestedQuestions);

  // Intel Logic
  const updateTranscription = useCallback((role: 'user' | 'model' | 'system', text: string) => {
    setTranscription(prev => {
      const lastTurn = prev[prev.length - 1];
      if (lastTurn && lastTurn.role === role) {
        const updatedTurns = [...prev];
        updatedTurns[updatedTurns.length - 1] = {
          ...lastTurn,
          text: lastTurn.text + " " + text
        };
        return updatedTurns;
      } else {
        return [...prev, { role, text, timestamp: Date.now() }];
      }
    });
  }, []);

  const syncKnowledgeGraph = async () => {
    if (transcription.length < 5 && consoleMessages.length === 0) return;
    setIsSyncing(true);
    setBackgroundState('syncing'); // Activate syncing visuals
    addNotification('Synchronizing Neural Map...', 'info');
    try {
      const charged = await consumeCredits(CREDIT_COSTS.KNOWLEDGE_GRAPH_SYNC, 'Knowledge Graph Sync');
      if (!charged) return;

      const fullText = transcription.map(t => t.text).join('\n');
      const chatContext = consoleMessages.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n');

      const prompt = `Analyze lecture data and return 3-5 key concepts as JSON array: [{keyword, explanation, theme, timestamp}]. Data: ${fullText.substring(0, 3000)}`;
      const keywords = await extractKeywords(prompt);
      const newConcepts = [...concepts];

      // Type-safe iteration over extracted keywords
      interface ExtractedKeyword { keyword: string; explanation: string; theme?: string; }
      const typedKeywords = keywords as (string | ExtractedKeyword)[];

      for (const resItem of typedKeywords) {
        const kw = typeof resItem === 'string' ? resItem : resItem.keyword;
        if (kw && !newConcepts.some(c => c.keyword.toLowerCase() === kw.toLowerCase())) {
          const explanation = typeof resItem === 'string' ? await explainConcept(kw, fullText) : resItem.explanation;
          newConcepts.push({ keyword: kw, explanation, timestamp: Date.now() });
        }
      }

      setConcepts(newConcepts);
      addNotification('Neural Map Synced', 'success');
    } catch (e) {
      addNotification('Neural Sync Failed', 'error');
    } finally {
      setIsSyncing(false);
      setBackgroundState('idle'); // Return to calm state
    }
  };

  useEffect(() => {
    if (transcription.length > 0 && transcription.length % 10 === 0) {
      syncKnowledgeGraph();
    }
  }, [transcription.length]);

  const handleUnifiedSend = (text: string, attachments: Attachment[], type: 'note' | 'question' | 'todo') => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      sessionId: session.id,
      timestamp: Date.now(),
      content: text,
      attachments: attachments,
      type: type === 'note' ? 'insight' : type as any,
      status: 'pending'
    };
    setNotes(prev => [...prev, newNote]);
    if (text) updateTranscription('system', `[NOTE (${type}): ${text}]`);
  };

  // Handle File Upload (Context)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    addNotification('Uploading context...', 'info');

    try {
      const text = await file.text();
      const groundingFile = {
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type,
        data: text,
        size: file.size
      };

      const updatedSession = { ...session };
      updatedSession.groundingFileDetails = [...(updatedSession.groundingFileDetails || []), groundingFile];

      updateTranscription('system', `[Uploaded Context: ${file.name}]`);
      onUpdateSession(updatedSession);
      addNotification('✅ Context added to session', 'success');
    } catch (err) {
      console.error(err);
      addNotification('Failed to read file', 'error');
    }
  };

  const handleEndClass = async () => {
    if (isRecording) stopRecording();
    setIsSummarizing(true);
    addNotification('Synthesizing Session Insights...', 'info');
    const fullText = transcription.map(t => t.text).join(' ');
    try {
      const charged = await consumeCredits(CREDIT_COSTS.SESSION_SYNTHESIS, 'Session Synthesis');
      if (!charged) return;
      const res = await generateSessionInsight(fullText);
      setInsight(res);
      addNotification('Synthesis Complete', 'success');
    } catch (err) {
      addNotification('Synthesis Failed', 'error');
    } finally {
      setIsSummarizing(false);
    }
  };

  if (isMiniMode) {
    return (
      <div className="fixed bottom-6 right-6 w-72 bg-white/90 backdrop-blur-xl shadow-2xl rounded-3xl border border-black/10 overflow-hidden z-[100] flex flex-col max-h-[400px] animate-in slide-in-from-bottom-4">
        <div className="p-4 bg-black/5 flex justify-between items-center">
          <div className="flex items-center gap-2">
            {isRecording && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
            <span className="text-[10px] font-bold uppercase truncate max-w-[150px]">{subject.name}</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => onExpand?.()} className="p-1.5 hover:bg-black/10 rounded-lg">
              <Maximize2 className="w-3 h-3 text-black/60" />
            </button>
            <button onClick={onBack} className="p-1.5 hover:bg-red-500/10 rounded-lg">
              <X className="w-3 h-3 text-black/60 hover:text-red-500" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {transcription.slice(-5).map((turn, i) => (
            <div key={i} className="text-xs">
              <p className={turn.role === 'model' ? 'italic text-blue-600' : 'text-black/80'}>{turn.text}</p>
            </div>
          ))}
          <div ref={transcriptEndRef} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pb-16 animate-apple-in overflow-x-hidden">
      <header className="max-w-[1400px] mx-auto pt-8 px-6 mb-8 relative z-50">
        <div className="flex justify-between items-center mb-6">
          <button onClick={onBack} className="flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.4em] text-[var(--vidyos-teal)] opacity-60 hover:opacity-100 transition-all">
            Return to Command
          </button>
          <div className="flex items-center gap-4">
            <span className="text-[9px] font-black text-[var(--vidyos-teal)] uppercase tracking-widest">{subject.name}</span>
            <div className={`w-1.5 h-1.5 rounded-full ${isRecording ? 'bg-red-500 animate-ping' : 'bg-green-500 shadow-sm'}`} />
          </div>
        </div>
        <div className="flex flex-col items-center text-center">
          <h2 className="text-3xl md:text-5xl font-black tracking-[-0.04em] mb-2 bg-gradient-to-b from-black to-black/60 bg-clip-text text-transparent">
            {session.title}
          </h2>
        </div>
      </header>

      <div className="max-w-[1500px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 px-6 relative z-10">
        <aside className="lg:col-span-3 space-y-6 order-2 lg:order-1">
          <div className="glass-card-2026 p-5">
            <div className="flex justify-between items-center pb-3 border-b border-black/5 mb-3">
              <span className="label-caps mb-0 text-black/40 text-[9px]">Neural Map</span>
              <button onClick={() => setGraphModalOpen(true)} className="p-1.5 hover:bg-black/5 rounded-lg"><Maximize2 className="w-3 h-3 opacity-40" /></button>
            </div>
            <div className="h-48 rounded-2xl overflow-hidden bg-black/[0.01]">
              <React.Suspense fallback={<div className="h-full w-full flex items-center justify-center text-[9px] font-black uppercase opacity-20">Loading Map...</div>}>
                <KnowledgeGraph concepts={concepts} isSyncing={isSyncing} />
              </React.Suspense>
            </div>
          </div>
          <div className="glass-card-2026 p-5 flex flex-col items-center">
            <span className="label-caps mb-3 text-black/40 text-[9px]">Neural Injector</span>
            <div className="p-3 bg-white/40 backdrop-blur-md rounded-2xl border border-white shadow-xl mb-3">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.origin}/api/upload-bridge?sessionId=${session.id}`)}`}
                alt="QR Bridge"
                className="w-28 h-28 opacity-80"
              />
            </div>
            <p className="text-[8px] font-black uppercase tracking-widest text-black/30 text-center leading-tight">
              Scan to inject physical <br /> slides into stream
            </p>
          </div>
        </aside>

        <main className="lg:col-span-6 space-y-6 order-1 lg:order-2">
          <section className="vidyos-card-spatial relative flex flex-col h-[600px] overflow-hidden">
            {analyser && <AudioVisualizer analyser={analyser} />}
            <TranscriptStream transcription={transcription} transcriptEndRef={transcriptEndRef} />
            <SessionControls
              isRecording={isRecording}
              isPaused={isPaused}
              setIsPaused={setIsPaused}
              skipSilence={skipSilence}
              setSkipSilence={setSkipSilence}
              volumeBoost={volumeBoost}
              setVolumeBoost={setVolumeBoost}
              onStart={startRecording}
              onStop={stopRecording}
              onExport={() => {/* Export Logic */ }}
            />
          </section>
          <div className="space-y-2">
            <UnifiedInput onSend={handleUnifiedSend} placeholder="Ground a note or upload slide..." isLive={isRecording} />
            <div className="flex justify-between items-center px-2">
              <label className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-black/30 cursor-pointer hover:text-black/60 transition-colors">
                <span className="w-5 h-5 flex items-center justify-center bg-black/5 rounded-full"><Sparkles className="w-3 h-3" /></span>
                Upload Context (PDF/Text)
                <input type="file" onChange={handleFileUpload} className="hidden" accept=".txt,.md,.json,.csv" />
              </label>
            </div>
          </div>
        </main>

        <aside className="lg:col-span-3 space-y-6 order-3">
          <QAConsole
            suggestedQuestions={suggestedQuestions}
            messages={consoleMessages}
            onMessagesChange={setConsoleMessages}
            onAskAI={async (query) => {
              const charged = await consumeCredits(CREDIT_COSTS.DOUBT_RESOLUTION, 'Doubt Resolution');
              if (!charged) return "Insufficient credits.";
              const context = transcription.slice(-10).map(t => t.text).join(' ');
              return await callPerplexity(`Context: ${context}\n\nQuestion: ${query}`);
            }}
          />
          {insight && (
            <div className="glass-card-2026 p-6 bg-gradient-to-br from-purple-600/10 to-transparent border-purple-500/20">
              <Sparkles className="w-4 h-4 text-purple-600 opacity-20 mb-3" />
              <p className="text-xs font-bold text-black/70 leading-relaxed">{insight.summary}</p>
            </div>
          )}
          {!isRecording && transcription.length > 0 && !insight && (
            <button
              onClick={handleEndClass}
              disabled={isSummarizing}
              className="w-full py-4 bg-black text-white rounded-2xl font-black uppercase text-[9px] tracking-[0.4em] hover:scale-[1.02] transition-all"
            >
              {isSummarizing ? 'Synthesizing...' : 'Synthesize Insights'}
            </button>
          )}
        </aside>
      </div>

      <ExpandableModal isOpen={transcriptModalOpen} onClose={() => setTranscriptModalOpen(false)} title="Transcription History">
        <div className="p-10 space-y-8 max-h-[80vh] overflow-y-auto">
          {transcription.map((turn, i) => (
            <div key={i} className="flex gap-8">
              <span className="text-[11px] font-black opacity-40 w-20">{new Date(turn.timestamp).toLocaleTimeString()}</span>
              <p className="text-md font-bold leading-relaxed">{turn.text}</p>
            </div>
          ))}
        </div>
      </ExpandableModal>

      <ExpandableModal isOpen={graphModalOpen} onClose={() => setGraphModalOpen(false)} title="Neural Map">
        <div className="h-[70vh] w-full bg-black/[0.01] rounded-3xl overflow-hidden relative">
          <React.Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
            <KnowledgeGraph concepts={concepts} isSyncing={isSyncing} />
          </React.Suspense>
        </div>
      </ExpandableModal>
    </div>

  );
};

export default SessionView;
