
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Subject, Session, TranscriptionTurn, Note, Attachment } from '../types';
import { generateSessionInsight } from '../services/gemini';
import { callPerplexity, extractKeywords, explainConcept } from '../services/perplexity';
import QAConsole from './QAConsole';
import TranscriptStream from './TranscriptStream';
import SessionControls from './SessionControls';
import AudioVisualizer from './AudioVisualizer';
import ExpandableModal from './ExpandableModal';
import LiveContextPanel from './LiveContextPanel';
import { ArrowLeft, Share2, Download, Layers, ShieldCheck, Sparkles, Layout, Network, Maximize2, Cpu, X, Activity, Mic } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { masterIntelligence } from '../services/intelligence';
import AgentControlCenter from './AgentControlCenter';
import { useUIStore } from '../stores/useUIStore';
import { CREDIT_COSTS } from '../constants/pricing';
import { useNotificationStore } from '../stores/useNotificationStore';
import { useBackgroundStore } from '../stores/useBackgroundStore';
import { useTranscription, STTProvider } from '../hooks/useTranscription';
import { useSessionSync } from '../hooks/useSessionSync';
import { useKnowledgeStore } from '../stores/useKnowledgeStore';

const KnowledgeGraph = React.lazy(() => import('./EnhancedKnowledgeGraph'));
import DynamicCard from './DynamicCard';
import UnifiedInput from './UnifiedInput';

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
  const { view, setView, navigateTo } = useUIStore();
  const { addNotification } = useNotificationStore();
  const setBackgroundState = useBackgroundStore(state => state.setState);
  const importToKnowledgeStore = useKnowledgeStore(state => state.importConcepts);

  // High-level Domain State
  const [transcription, setTranscription] = useState<TranscriptionTurn[]>(session.turns || []);
  const [concepts, setConcepts] = useState(session.concepts || []);
  const [suggestedQuestions] = useState<string[]>(session.suggestedQuestions || []);
  const [insight, setInsight] = useState<{ summary: string; examQuestions: string[] } | null>(
    session.summary ? { summary: session.summary, examQuestions: session.examQuestions || [] } : null
  );
  const [notes, setNotes] = useState<Note[]>(session.notes || []);
  const [consoleMessages, setConsoleMessages] = useState<Array<{ role: 'user' | 'ai'; text: string }>>([]);
  const [liveQuestions, setLiveQuestions] = useState<string[]>([]);
  const liveQuestionsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // UI State
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [transcriptModalOpen, setTranscriptModalOpen] = useState(false);
  const [consoleModalOpen, setConsoleModalOpen] = useState(false);
  const [graphModalOpen, setGraphModalOpen] = useState(false);
  const [activeAgentResponse, setActiveAgentResponse] = useState<any>(null);
  const [isConsoleExpanded, setIsConsoleExpanded] = useState(false);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Focus top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [session.id]);

  // Reset state when session changes
  useEffect(() => {
    setTranscription(session.turns || []);
    setConcepts(session.concepts || []);
    setNotes(session.notes || []);
    setConsoleMessages([]);
    setInsight(session.summary ? { summary: session.summary, examQuestions: session.examQuestions || [] } : null);
  }, [session.id]);

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
    stopRecording,
    sttProvider,
    setSTTProvider
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

  const handleRefine = async () => {
    if (transcription.length === 0 || isRefining) return;
    setIsRefining(true);
    addNotification('AI Assistant is refining transcript...', 'info');
    try {
      const { refineTranscript } = await import('../services/gemini');
      const refinedTurns = await refineTranscript(transcription);
      if (refinedTurns && refinedTurns.length > 0) {
        setTranscription(refinedTurns);
        addNotification('Transcript refined and sorted', 'success');
      }
    } catch (err) {
      console.error("Refinement failed:", err);
      addNotification('Refinement failed', 'error');
    } finally {
      setIsRefining(false);
    }
  };

  const syncKnowledgeGraph = async () => {
    if (isSyncing || (transcription.length < 5 && consoleMessages.length === 0)) return;
    setIsSyncing(true);
    setBackgroundState('syncing');
    addNotification('Synchronizing Neural Map...', 'info');
    try {
      const charged = await consumeCredits(CREDIT_COSTS.KNOWLEDGE_GRAPH_SYNC, 'Knowledge Graph Sync');
      if (!charged) return;

      const fullText = transcription.map(t => t.text).join('\n');
      const keywords = await extractKeywords(`Analyze lecture data and return 3-5 key concepts as JSON array: [{keyword, explanation, theme, timestamp}]. Data: ${fullText.substring(0, 3000)}`);
      const newConcepts = [...concepts];

      for (const resItem of (keywords as any[])) {
        const kw = typeof resItem === 'string' ? resItem : resItem.keyword;
        if (kw && !newConcepts.some(c => c.keyword.toLowerCase() === kw.toLowerCase())) {
          const explanation = typeof resItem === 'string' ? await explainConcept(kw, fullText) : resItem.explanation;
          newConcepts.push({ keyword: kw, explanation, timestamp: Date.now() });
        }
      }

      setConcepts(newConcepts);

      try {
        await importToKnowledgeStore(newConcepts, session.id);
      } catch (err) {
        console.error("Failed to sync to Knowledge Vault:", err);
      }

      addNotification('Neural Map Synced', 'success');
    } catch (e) {
      addNotification('Neural Sync Failed', 'error');
    } finally {
      setIsSyncing(false);
      setBackgroundState('idle');
    }
  };

  useEffect(() => {
    if (transcription.length > 0 && transcription.length % 10 === 0) {
      syncKnowledgeGraph();
    }
  }, [transcription.length]);

  // Auto-generate live questions from transcript
  useEffect(() => {
    if (transcription.length > 0 && transcription.length % 8 === 0) {
      if (liveQuestionsTimerRef.current) clearTimeout(liveQuestionsTimerRef.current);
      liveQuestionsTimerRef.current = setTimeout(async () => {
        try {
          const recentText = transcription.slice(-8).map(t => t.text).join(' ');
          const res = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Custom-Gemini-Key': localStorage.getItem('custom_gemini_key') || '' },
            body: JSON.stringify({
              model: 'gemini-2.0-flash-exp',
              contents: `Based on this lecture segment, generate 3 short questions a student might be asked in an exam. Return ONLY a JSON array of strings.\n\nSegment: "${recentText.substring(0, 2000)}"`,
              config: { responseMimeType: 'application/json' }
            })
          });
          if (res.ok) {
            const data = await res.json();
            const questions = JSON.parse(data.text || '[]');
            if (Array.isArray(questions)) setLiveQuestions(questions.slice(0, 5));
          }
        } catch (err) {
          console.error('Live questions generation error:', err);
        }
      }, 3000);
    }
    return () => { if (liveQuestionsTimerRef.current) clearTimeout(liveQuestionsTimerRef.current); };
  }, [transcription.length]);

  // Handler: LiveContextPanel feeds new concepts into KG
  const handleLiveConceptsExtracted = useCallback((newConcepts: { keyword: string; explanation: string; timestamp: number }[]) => {
    setConcepts(prev => {
      const existingKeys = new Set(prev.map(c => c.keyword.toLowerCase()));
      const unique = newConcepts.filter(c => !existingKeys.has(c.keyword.toLowerCase()));
      if (unique.length === 0) return prev;
      const merged = [...prev, ...unique];
      // Also sync to knowledge store
      try { importToKnowledgeStore(merged, session.id); } catch (e) { /* silent */ }
      return merged;
    });
  }, [session.id, importToKnowledgeStore]);

  // Handler: Ask about a keyword from LiveContextPanel
  const handleAskAboutKeyword = useCallback((keyword: string) => {
    const question = `Explain "${keyword}" in detail in the context of ${subject.name}. Include exam-relevant points.`;
    setConsoleMessages(prev => [...prev, { role: 'user', text: question }]);
    masterIntelligence.askMasterMind(question, session.id).then(res => {
      setConsoleMessages(prev => [...prev, { role: 'ai', text: res.response || 'Processed.', agent: res.agent }]);
    }).catch(e => console.error('Ask about keyword failed:', e));
  }, [session.id, subject.name]);

  const handleUnifiedSend = async (text: string, attachments: Attachment[], type: 'note' | 'question' | 'todo') => {
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

    if (type === 'question' && text.trim()) {
      try {
        const res = await masterIntelligence.askMasterMind(text, session.id);
        if (res.type && res.type !== 'text') {
          setActiveAgentResponse(res);
        }
        setConsoleMessages(prev => [...prev, { role: 'ai', text: res.response || "I've analyzed your question.", agent: res.agent }]);
      } catch (e) {
        console.error("Auto-AI response failed:", e);
      }
    }
  };

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
      addNotification('Failed to read file', 'error');
    }
  };

  const handleEndClass = async () => {
    if (isRecording) stopRecording();
    setIsSummarizing(true);
    addNotification('Synthesizing Session Insights...', 'info');
    const fullText = transcription.map(t => t.text).join(' ');

    if (fullText.length < 50) {
      addNotification('Transcript too short for synthesis', 'warning');
      setIsSummarizing(false);
      return;
    }

    try {
      const charged = await consumeCredits(CREDIT_COSTS.SESSION_SYNTHESIS, 'Session Synthesis');
      if (!charged) {
        setIsSummarizing(false);
        return;
      }
      const res = await generateSessionInsight(fullText);
      if (res && res.summary) {
        setInsight(res);
        addNotification('Synthesis Complete', 'success');

        // Auto-update session with results
        const updatedSession = {
          ...session,
          summary: res.summary,
          examQuestions: res.examQuestions,
          updatedAt: Date.now()
        };
        onUpdateSession(updatedSession);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error("Synthesis error:", err);
      addNotification('Synthesis Failed: ' + (err instanceof Error ? err.message : 'Unknown error'), 'error');
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
        <main className="lg:col-span-8 space-y-6 order-1">
          <section className="vidyos-card-spatial relative flex flex-col h-[650px] overflow-hidden">
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
              onRefine={handleRefine}
              isRefining={isRefining}
              onClear={() => {
                if (confirm('Clear entire transcript? This cannot be undone.')) {
                  setTranscription([]);
                  addNotification('Transcript cleared', 'info');
                }
              }}
            />
          </section>

          <AnimatePresence>
            {activeAgentResponse && (
              <div className="absolute top-10 left-1/2 -translate-x-1/2 z-[3000] scale-110">
                <button
                  onClick={() => setActiveAgentResponse(null)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center z-[110] shadow-xl"
                >
                  <X className="w-3 h-3" />
                </button>
                <DynamicCard
                  type={activeAgentResponse.type || 'text'}
                  payload={activeAgentResponse.payload || { text: activeAgentResponse.response }}
                  agentName={activeAgentResponse.agent || 'MasterMind'}
                />
              </div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-9 space-y-2">
              <UnifiedInput onSend={handleUnifiedSend} placeholder="Ground a note or ask a doubt..." isLive={isRecording} />
              <div className="flex justify-between items-center px-2">
                <label className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-black/30 cursor-pointer hover:text-black/60 transition-colors">
                  <span className="w-5 h-5 flex items-center justify-center bg-black/5 rounded-full"><Sparkles className="w-3 h-3" /></span>
                  Upload Context (PDF/Text)
                  <input type="file" onChange={handleFileUpload} className="hidden" accept=".txt,.md,.json,.csv" />
                </label>
                {/* STT Provider Toggle */}
                <div className="flex items-center gap-2">
                  <Mic className="w-3 h-3 opacity-30" />
                  <select
                    value={sttProvider}
                    onChange={e => setSTTProvider(e.target.value as STTProvider)}
                    disabled={isRecording}
                    className="text-[9px] font-bold uppercase tracking-wider bg-black/5 border-none rounded-lg px-2 py-1 outline-none cursor-pointer disabled:opacity-30 text-black/50"
                  >
                    <option value="deepgram">Deepgram Nova-2</option>
                    <option value="google-chirp">Google Chirp</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="md:col-span-3 glass-card-2026 p-3 flex items-center gap-4 h-[72px]">
              <div className="bg-white p-1 rounded-lg">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(`${window.location.origin}/api/upload-bridge?sessionId=${session.id}`)}`}
                  alt="QR Bridge"
                  className="w-10 h-10 opacity-80"
                />
              </div>
              <div>
                <p className="text-[7px] font-black uppercase tracking-widest text-black/40 leading-tight">
                  Neural<br />Injector
                </p>
              </div>
            </div>
          </div>
        </main>

        <aside className="lg:col-span-4 space-y-6 order-2">
          <QAConsole
            suggestedQuestions={suggestedQuestions}
            liveQuestions={liveQuestions}
            messages={consoleMessages}
            onMessagesChange={setConsoleMessages}
            onExpand={() => setConsoleModalOpen(true)}
            onAskAI={async (query) => {
              const charged = await consumeCredits(CREDIT_COSTS.DOUBT_RESOLUTION, 'Doubt Resolution');
              if (!charged) return "Insufficient credits.";
              try {
                const res = await masterIntelligence.askMasterMind(query, session.id);
                if (res.type && res.type !== 'text') {
                  setActiveAgentResponse(res);
                }
                return { text: res.response || "I've processed your request.", agent: res.agent };
              } catch (e) {
                console.error("MasterMind Error:", e);
                const context = transcription.slice(-10).map(t => t.text).join(' ');
                const fallbackRes = await callPerplexity(`Context: ${context}\n\nQuestion: ${query}`);
                return { text: fallbackRes, agent: 'ResearchAgent' };
              }
            }}
          />

          <LiveContextPanel
            transcription={transcription}
            subjectName={subject.name}
            onConceptsExtracted={handleLiveConceptsExtracted}
            onAskAbout={handleAskAboutKeyword}
          />

          <AgentControlCenter
            sessionId={session.id}
            onExecuteCommand={async (query) => {
              // We add the message manually so user sees the "Summon" intent
              setConsoleMessages(prev => [...prev, { role: 'user', text: `Summoning Agent specialized in: ${query}` }]);
              try {
                const res = await masterIntelligence.askMasterMind(query, session.id);
                if (res.type && res.type !== 'text') {
                  setActiveAgentResponse(res);
                }
                setConsoleMessages(prev => [...prev, { role: 'ai', text: res.response || "Agent synchronized.", agent: res.agent }]);
              } catch (e) {
                console.error("Agent Summon Error:", e);
              }
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

      <div className="max-w-[1500px] mx-auto px-6 mt-12 mb-24">
        <div className="glass-card-2026 p-1 overflow-hidden relative">
          <div className="px-8 py-6 border-b border-black/[0.03] flex justify-between items-center">
            <div>
              <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-black/40 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[var(--vidyos-teal)]" />
                Neural Knowledge Graph
              </h3>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigateTo('relay_map')}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 rounded-xl transition-all border border-purple-500/20"
              >
                <Network className="w-3.5 h-3.5" />
                <span className="text-[9px] font-black uppercase tracking-widest">Relay Map (3D)</span>
              </button>
              <button onClick={() => setGraphModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-black/5 hover:bg-black/10 rounded-xl transition-all">
                <Maximize2 className="w-3 h-3 opacity-40" />
                <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Expand Map</span>
              </button>
            </div>
          </div>
          <div className="h-[600px] w-full bg-black/[0.01]">
            <React.Suspense fallback={<div className="h-full w-full flex items-center justify-center text-[9px] font-black uppercase opacity-20">Loading Map...</div>}>
              <KnowledgeGraph concepts={concepts} isSyncing={isSyncing} sessionId={session.id} onAgentResponse={setActiveAgentResponse} />
            </React.Suspense>
          </div>
        </div>
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

      <ExpandableModal isOpen={consoleModalOpen} onClose={() => setConsoleModalOpen(false)} title="Doubt Resolution Console">
        <div className="h-[80vh] w-full">
          <QAConsole
            suggestedQuestions={suggestedQuestions}
            messages={consoleMessages}
            onMessagesChange={setConsoleMessages}
            onAskAI={async (query) => {
              const charged = await consumeCredits(CREDIT_COSTS.DOUBT_RESOLUTION, 'Doubt Resolution');
              if (!charged) return "Insufficient credits.";
              try {
                const res = await masterIntelligence.askMasterMind(query, session.id);
                if (res.type && res.type !== 'text') {
                  setActiveAgentResponse(res);
                  return res.response || "I've generated a rich visualization for you.";
                }
                return res.response;
              } catch (e) {
                const context = transcription.slice(-10).map(t => t.text).join(' ');
                return await callPerplexity(`Context: ${context}\n\nQuestion: ${query}`);
              }
            }}
          />
        </div>
      </ExpandableModal>

      <ExpandableModal isOpen={graphModalOpen} onClose={() => setGraphModalOpen(false)} title="Neural Map">
        <div className="h-[70vh] w-full bg-black/[0.01] rounded-3xl overflow-hidden relative">
          <React.Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
            <KnowledgeGraph concepts={concepts} isSyncing={isSyncing} sessionId={session.id} onAgentResponse={setActiveAgentResponse} />
          </React.Suspense>
        </div>
      </ExpandableModal>
    </div>
  );
};

export default SessionView;
