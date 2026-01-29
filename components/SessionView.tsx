
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Subject, Session, TranscriptionTurn, Note, Attachment } from '../types';
import { generateSessionInsight, extractConceptsFromMaterials } from '../services/gemini';
import { callPerplexity, extractKeywords, explainConcept, generateSuggestedQuestions } from '../services/perplexity';
import QAConsole from './QAConsole';
import KnowledgeGraph from './KnowledgeGraph';
import AudioVisualizer from './AudioVisualizer';
import ExpandableModal from './ExpandableModal';
import UnifiedInput from './UnifiedInput';
import { Maximize2, FileText, ImageIcon, Play, Plus, Clock, Sparkles } from 'lucide-react';

interface SessionViewProps {
  session: Session;
  subject: Subject;
  onBack: () => void;
  onUpdateSession: (session: Session) => void;
  isMiniMode?: boolean;
  setIsMiniMode?: (val: boolean) => void;
  onExpand?: () => void;
}

const SessionView: React.FC<SessionViewProps> = ({
  session,
  subject,
  onBack,
  onUpdateSession,
  isMiniMode = false,
  setIsMiniMode,
  onExpand
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState<TranscriptionTurn[]>(session.turns || []);
  const [concepts, setConcepts] = useState<{ keyword: string; explanation: string; timestamp: number }[]>(session.concepts || []);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>(session.suggestedQuestions || []);
  const [insight, setInsight] = useState<{ summary: string; examQuestions: string[] } | null>(session.summary ? { summary: session.summary, examQuestions: session.examQuestions || [] } : null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [volumeBoost, setVolumeBoost] = useState(2.0);
  const [lastSaved, setLastSaved] = useState(Date.now());
  const [contextSaved, setContextSaved] = useState(false);
  const [notes, setNotes] = useState<Note[]>(session.notes || []);

  const [transcriptModalOpen, setTranscriptModalOpen] = useState(false);
  const [consoleModalOpen, setConsoleModalOpen] = useState(false);
  const [graphModalOpen, setGraphModalOpen] = useState(false);

  const [notifications, setNotifications] = useState<Array<{ id: string; type: 'concept' | 'question' | 'success'; message: string; timestamp: number }>>([]);
  const [consoleMessages, setConsoleMessages] = useState<Array<{ role: 'user' | 'ai'; text: string }>>([]);

  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() - lastSaved > 10000 && transcription.length > 0) {
        onUpdateSession({
          ...session,
          transcript: transcription.map(t => t.text).join('\n'),
          turns: transcription,
          concepts,
          suggestedQuestions,
          aiContext: session.aiContext
        });
        setLastSaved(Date.now());
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [transcription, concepts, suggestedQuestions, session.aiContext, lastSaved]);

  const handleBack = () => {
    if (isRecording && setIsMiniMode) {
      setIsMiniMode(true);
      onBack();
    } else {
      onBack();
    }
  };

  const handleContextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdateSession({ ...session, aiContext: e.target.value });
    setContextSaved(false);
    setTimeout(() => setContextSaved(true), 1000);
  };

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [transcription]);

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
    const updatedNotes = [...notes, newNote];
    setNotes(updatedNotes);

    // Auto-persist notes
    onUpdateSession({
      ...session,
      notes: updatedNotes
    });

    if (text) {
      updateTranscription('system', `[NOTE (${type}): ${text}]`);
    }
  };

  const startRecording = useCallback(async () => {
    try {
      let token = import.meta.env.VITE_DEEPGRAM_API_KEY;

      if (!token) {
        try {
          const tokenResponse = await fetch('/api/deepgram-token');
          if (tokenResponse.ok) {
            const contentType = tokenResponse.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
              const data = await tokenResponse.json();
              token = data.token;
            }
          }
        } catch (e) {
          console.warn("API Token fetch failed, checking local env...");
        }
      }

      if (!token) {
        throw new Error('No Deepgram token found.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      const model = 'nova-2';
      const url = `wss://api.deepgram.com/v1/listen?model=${model}&language=en-IN&smart_format=true&punctuate=true&diarize=true&encoding=linear16&sample_rate=16000`;

      const socket = new WebSocket(url, ['token', token]);
      socketRef.current = socket;

      socket.onopen = () => {
        setIsRecording(true);
        if (transcription.length > 0) {
          updateTranscription('system', 'Recording Resumed');
        }

        const source = audioContext.createMediaStreamSource(stream);
        const analyserNode = audioContext.createAnalyser();
        analyserNode.fftSize = 256;
        source.connect(analyserNode);
        setAnalyser(analyserNode);

        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        source.connect(processor);
        processor.connect(audioContext.destination);

        processor.onaudioprocess = (e) => {
          if (socket.readyState !== WebSocket.OPEN) return;
          const inputData = e.inputBuffer.getChannelData(0);
          const pcmData = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            const boosted = inputData[i] * volumeBoost;
            pcmData[i] = Math.max(-1, Math.min(1, boosted)) * 0x7FFF;
          }
          socket.send(pcmData.buffer);
        };
      };

      socket.onmessage = (message) => {
        const data = JSON.parse(message.data);
        if (data.channel?.alternatives?.[0]?.transcript && data.is_final) {
          const transcript = data.channel.alternatives[0].transcript;
          updateTranscription('user', transcript);
        }
      };

      socket.onerror = (error) => {
        console.error("Deepgram WebSocket Error:", error);
        setIsRecording(false);
      };

      socket.onclose = () => {
        setIsRecording(false);
      };

    } catch (err) {
      console.error("Failed to start session:", err);
      setIsRecording(false);
    }
  }, [updateTranscription, transcription.length, volumeBoost]);

  const stopRecording = () => {
    setIsRecording(false);
    if (socketRef.current) socketRef.current.close();
    if (audioContextRef.current) audioContextRef.current.close().catch(() => { });
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
  };

  const handleEndClass = async () => {
    if (isRecording) stopRecording();
    setIsSummarizing(true);
    const fullText = transcription.map(t => t.text).join(' ');
    try {
      const res = await generateSessionInsight(fullText);
      setInsight(res);
      onUpdateSession({ ...session, summary: res.summary, examQuestions: res.examQuestions, transcript: fullText });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newFileDetails = await Promise.all(files.map(async (file) => {
        return new Promise<any>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              id: crypto.randomUUID(),
              name: file.name,
              type: file.type,
              size: file.size,
              data: reader.result as string
            });
          };
          reader.readAsDataURL(file);
        });
      }));

      onUpdateSession({
        ...session,
        groundingFiles: [...(session.groundingFiles || []), ...files.map(f => f.name)],
        groundingFileDetails: [...(session.groundingFileDetails || []), ...newFileDetails]
      });
    }
  };

  if (isMiniMode) {
    return (
      <div className="fixed bottom-6 right-6 w-96 bg-white/90 backdrop-blur-xl shadow-2xl rounded-3xl border border-black/10 overflow-hidden z-[100] flex flex-col max-h-[500px]">
        <div className="p-4 bg-black/5 flex justify-between items-center cursor-move">
          <div className="flex items-center gap-2">
            {isRecording && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
            <span className="text-[10px] font-bold uppercase tracking-widest truncate max-w-[150px]">{subject.name}</span>
          </div>
          <button onClick={() => onExpand ? onExpand() : setIsMiniMode?.(false)} className="p-1.5 hover:bg-black/10 rounded-lg">
            <Maximize2 className="w-4 h-4 text-black/60" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-white/50">
          {transcription.slice(-5).map((turn, i) => (
            <div key={i} className={`text-xs ${turn.role === 'system' ? 'text-center opacity-50 py-1' : ''}`}>
              {turn.role !== 'system' && <span className="font-bold opacity-30 block text-[9px] mb-0.5">{new Date(turn.timestamp).toLocaleTimeString()}</span>}
              <p className={`${turn.role === 'model' ? 'italic text-blue-600' : 'text-black/80'}`}>{turn.text}</p>
            </div>
          ))}
          <div ref={transcriptEndRef} />
        </div>
        <div className="p-4 border-t border-black/5 flex justify-between items-center bg-white/80">
          <AudioVisualizer analyser={analyser} />
          <button onClick={isRecording ? stopRecording : startRecording} className={`w-10 h-10 rounded-full flex items-center justify-center ${isRecording ? 'bg-red-500' : 'bg-black'}`}>
            {isRecording ? <div className="w-3 h-3 bg-white rounded-sm" /> : <Play className="w-4 h-4 text-white ml-0.5" />}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto pb-12 animate-apple-in px-4">
      <header className="flex flex-col gap-6 mb-10">
        <button onClick={handleBack} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-black/30 hover:text-black transition-all w-fit">
          Back to Library
        </button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="flex-1 w-full">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/30 mb-1.5 block">{subject.name}</span>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#1d1d1f] leading-tight">{session.title}</h2>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-black/[0.03] px-3 py-2 rounded-2xl">
              <span className="text-[10px] font-bold text-black/60">{volumeBoost}x</span>
            </div>
            {isRecording && <AudioVisualizer analyser={analyser} />}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`px-6 py-2.5 rounded-full font-bold uppercase tracking-widest text-[11px] ${isRecording ? 'bg-red-500 text-white' : 'bg-black text-white'}`}
            >
              {isRecording ? 'End Session' : 'Live Copilot'}
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          {isRecording && (
            <section className="sticky top-4 z-20">
              <UnifiedInput onSend={handleUnifiedSend} placeholder="Type a note or upload slide..." isLive={true} />
            </section>
          )}

          <section className="apple-card flex flex-col h-[600px] p-8">
            <div className="flex justify-between items-center mb-6 border-b border-black/[0.03] pb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/30">Live Transcription</h3>
                <button onClick={() => setTranscriptModalOpen(true)} className="p-1.5 hover:bg-black/5 rounded-lg">
                  <Maximize2 className="w-3 h-3 text-black/30" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pr-4">
              {transcription.map((turn, i) => (
                <div key={i} className={`flex gap-6 ${turn.role === 'system' ? 'opacity-60 italic' : ''}`}>
                  <div className="min-w-[60px] text-[9px] font-bold text-black/20 pt-1">
                    {new Date(turn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className={`text-sm leading-relaxed ${turn.text.includes('[NOTE') ? 'text-blue-600 font-bold' : 'text-black/90'}`}>
                    {turn.text}
                  </div>
                </div>
              ))}
              <div ref={transcriptEndRef} />
            </div>
          </section>

          <section className="apple-card p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/30">Reference Materials</h3>
              <label className="cursor-pointer bg-black/5 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-black/10">
                Bulk Upload
                <input type="file" multiple className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
            <div className="flex flex-wrap gap-3">
              {(session.groundingFiles || []).map((file, i) => (
                <div key={i} className="flex items-center gap-2.5 px-4 py-2 bg-black/[0.03] rounded-xl border border-black/[0.01]">
                  <FileText className="w-3.5 h-3.5 text-black/40" />
                  <span className="text-[11px] font-bold text-black/60">{file}</span>
                </div>
              ))}
              {notes.flatMap(n => n.attachments || []).map((att) => (
                <div key={att.id} className="flex items-center gap-2.5 px-4 py-2 bg-blue-50 border border-blue-100 rounded-xl">
                  <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-[11px] font-bold text-blue-600">{att.name}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="lg:col-span-4 space-y-8">
          <QAConsole
            suggestedQuestions={suggestedQuestions}
            onAskAI={async (query) => {
              const context = transcription.slice(-50).map(t => t.text).join(' ');
              return await callPerplexity(`Context: ${context}\n\nQuestion: ${query}`);
            }}
            messages={consoleMessages}
            onMessagesChange={setConsoleMessages}
          />
          <KnowledgeGraph concepts={concepts} />
          {insight && (
            <div className="apple-card p-6 bg-blue-50/50">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3 text-blue-600/40">Smart Summary</h3>
              <p className="text-[12px] font-bold text-blue-900/80">{insight.summary}</p>
            </div>
          )}
        </aside>
      </div>

      <ExpandableModal isOpen={transcriptModalOpen} onClose={() => setTranscriptModalOpen(false)} title="Transcription">
        <div className="p-6 space-y-4">
          {transcription.map((turn, i) => (
            <div key={i} className="flex gap-4">
              <span className="text-[9px] font-bold text-black/20 w-12 pt-1">{new Date(turn.timestamp).toLocaleTimeString()}</span>
              <p className="text-sm">{turn.text}</p>
            </div>
          ))}
        </div>
      </ExpandableModal>

      <ExpandableModal isOpen={consoleModalOpen} onClose={() => setConsoleModalOpen(false)} title="Doubt Console">
        <QAConsole onAskAI={async (q) => callPerplexity(q)} messages={consoleMessages} onMessagesChange={setConsoleMessages} />
      </ExpandableModal>

      <ExpandableModal isOpen={graphModalOpen} onClose={() => setGraphModalOpen(false)} title="Knowledge Graph">
        <KnowledgeGraph concepts={concepts} />
      </ExpandableModal>
    </div>
  );
};

export default SessionView;
