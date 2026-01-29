
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Subject, Session, TranscriptionTurn, Note, Attachment } from '../types';
import { generateSessionInsight, extractConceptsFromMaterials } from '../services/gemini';
import { callPerplexity, extractKeywords, explainConcept, generateSuggestedQuestions } from '../services/perplexity';
import QAConsole from './QAConsole';
// import KnowledgeGraph from './KnowledgeGraph';
// TODO: Switch to EnhancedKnowledgeGraph after committing D3 to package.json
import KnowledgeGraph from './EnhancedKnowledgeGraph';
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
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState<TranscriptionTurn[]>(session.turns || []);
  const [concepts, setConcepts] = useState<{ keyword: string; explanation: string; timestamp: number }[]>(session.concepts || []);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>(session.suggestedQuestions || []);
  const [insight, setInsight] = useState<{ summary: string; examQuestions: string[] } | null>(session.summary ? { summary: session.summary, examQuestions: session.examQuestions || [] } : null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [volumeBoost, setVolumeBoost] = useState(session.volumeBoost || 1.0);
  const [isPaused, setIsPaused] = useState(false);
  const [skipSilence, setSkipSilence] = useState(false);
  const [lastSaved, setLastSaved] = useState(Date.now());
  const [contextSaved, setContextSaved] = useState(false);
  const [notes, setNotes] = useState<Note[]>(session.notes || []);

  const [transcriptModalOpen, setTranscriptModalOpen] = useState(false);
  const [consoleModalOpen, setConsoleModalOpen] = useState(false);
  const [graphModalOpen, setGraphModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const [notifications, setNotifications] = useState<Array<{ id: string; type: 'concept' | 'question' | 'success'; message: string; timestamp: number }>>([]);
  const [consoleMessages, setConsoleMessages] = useState<Array<{ role: 'user' | 'ai'; text: string }>>([]);

  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  const volumeBoostRef = useRef(volumeBoost);
  const isPausedRef = useRef(isPaused);
  const skipSilenceRef = useRef(skipSilence);

  useEffect(() => { volumeBoostRef.current = volumeBoost; }, [volumeBoost]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { skipSilenceRef.current = skipSilence; }, [skipSilence]);

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

  const syncKnowledgeGraph = async () => {
    if (transcription.length < 5) return;
    setIsSyncing(true);
    try {
      const charged = await consumeCredits(10, 'Knowledge Graph Sync');
      if (!charged) return;

      const fullText = transcription.map(t => t.text).join('\n');
      const keywords = await extractKeywords(fullText);
      const newConcepts = [...concepts];

      for (const kw of keywords) {
        if (!newConcepts.some(c => c.keyword.toLowerCase() === kw.toLowerCase())) {
          const explanation = await explainConcept(kw, fullText);
          newConcepts.push({
            keyword: kw,
            explanation,
            timestamp: Date.now()
          });
        }
      }

      setConcepts(newConcepts);
      onUpdateSession({ ...session, concepts: newConcepts });
    } catch (e) {
      console.error("Sync failed:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    // Only auto-scroll if user is already near the bottom (within 100px)
    // This prevents annoying jumps when user is reading earlier transcript
    if (transcriptEndRef.current) {
      const container = transcriptEndRef.current.parentElement;
      if (container) {
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
        if (isNearBottom) {
          transcriptEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    }
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
      let token = localStorage.getItem('custom_deepgram_key') || import.meta.env.VITE_DEEPGRAM_API_KEY;

      if (!token) {
        try {
          const tokenResponse = await fetch('/api/deepgram-token');
          if (tokenResponse.ok) {
            const data = await tokenResponse.json();
            token = data.token;
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
          if (isPausedRef.current) return; // Don't send data if paused

          const inputData = e.inputBuffer.getChannelData(0);

          // Skip silence check
          if (skipSilenceRef.current) {
            let sum = 0;
            for (let i = 0; i < inputData.length; i++) {
              sum += inputData[i] * inputData[i];
            }
            const rms = Math.sqrt(sum / inputData.length);
            if (rms < 0.01) return; // Threshold for silence
          }

          const pcmData = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            const boosted = inputData[i] * volumeBoostRef.current;
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
  }, [updateTranscription, transcription.length, volumeBoost, isPaused, skipSilence]);

  const stopRecording = () => {
    setIsRecording(false);

    // Close WebSocket connection
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => { });
      audioContextRef.current = null;
    }

    // Stop all media tracks (this removes the red recording indicator)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        track.enabled = false; // Extra safety
      });
      streamRef.current = null;
    }

    // Clear analyser state
    setAnalyser(null);
  };

  const handleEndClass = async () => {
    if (isRecording) stopRecording();
    setIsSummarizing(true);
    const fullText = transcription.map(t => t.text).join(' ');
    try {
      const charged = await consumeCredits(20, 'Session Synthesis');
      if (!charged) return;

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
        <div className="p-4 border-t border-black/5 flex justify-between items-center bg-white/80 gap-3">
          <AudioVisualizer analyser={analyser} />
          <div className="flex items-center gap-2">
            {isRecording && (
              <button
                onClick={() => setIsPaused(!isPaused)}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isPaused ? 'bg-orange-500' : 'bg-black/5'}`}
                title={isPaused ? "Resume" : "Pause"}
              >
                <div className={`flex gap-1 ${isPaused ? 'text-white' : 'text-black'}`}>
                  {isPaused ? <Play className="w-4 h-4" /> : <div className="flex gap-0.5"><div className="w-1 h-3 bg-current" /><div className="w-1 h-3 bg-current" /></div>}
                </div>
              </button>
            )}
            <button onClick={isRecording ? stopRecording : startRecording} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-500' : 'bg-black'}`}>
              {isRecording ? <div className="w-3 h-3 bg-white rounded-sm" /> : <Play className="w-4 h-4 text-white ml-0.5" />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1550px] mx-auto pb-24 animate-apple-in px-6">
      <header className="flex flex-col gap-8 mb-16 relative">
        <button onClick={handleBack} className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.4em] text-[var(--vidyos-teal)] hover:opacity-60 transition-all w-fit">
          <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
          Return to Library
        </button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 md:gap-10">
          <div className="flex-1 w-full group">
            <span className="label-caps mb-3">{subject.name} • Session Active</span>
            <h2 className="text-3xl md:text-5xl font-black tracking-[-0.04em] mb-0 pr-10">{session.title}</h2>
          </div>

          <div className="flex flex-wrap items-center gap-3 md:gap-4 w-full md:w-auto bg-[var(--glass-heavy)] p-2 md:p-3 rounded-[2rem] md:rounded-[2.5rem] border border-[var(--glass-border)] backdrop-blur-xl shadow-[var(--shadow-premium)]">
            <div className="flex items-center gap-2 px-2">
              <button
                onClick={() => setVolumeBoost(prev => prev === 2.0 ? 1.0 : 2.0)}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${volumeBoost === 2.0 ? 'bg-[var(--vidyos-gold)] text-white' : 'hover:bg-black/5 text-[var(--text-muted)]'}`}
                title="Audio Amplifier (2x Gain)"
              >
                2X
              </button>
              <button
                onClick={() => setSkipSilence(!skipSilence)}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${skipSilence ? 'bg-[var(--vidyos-teal)] text-white' : 'hover:bg-black/5 text-[var(--text-muted)]'}`}
                title="Skip silence automatically"
              >
                SIL
              </button>
            </div>

            <div className="h-8 w-[1px] bg-[var(--glass-border)] mx-1" />

            {isRecording && (
              <button
                onClick={() => setIsPaused(!isPaused)}
                className={`flex items-center gap-3 px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${isPaused ? 'bg-orange-500 text-white animate-pulse' : 'bg-black/5 text-[var(--text-main)] hover:bg-black/10'}`}
              >
                {isPaused ? <Play className="w-4 h-4" /> : <div className="flex gap-1"><div className="w-1 h-3.5 bg-current" /><div className="w-1 h-3.5 bg-current" /></div>}
                {isPaused ? 'Resume' : 'Pause'}
              </button>
            )}

            {isRecording && <AudioVisualizer analyser={analyser} />}

            {/* Manual Minimize Button */}
            {isRecording && setIsMiniMode && (
              <button
                onClick={() => {
                  setIsMiniMode(true);
                  onBack();
                }}
                className="w-10 h-10 bg-black/5 hover:bg-black text-[var(--text-main)] hover:text-white rounded-full flex items-center justify-center transition-all"
                title="Minimize Layer"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}

            {isRecording ? (
              <button
                onClick={stopRecording}
                className="px-8 py-3 bg-red-500 text-white rounded-full font-black uppercase tracking-widest text-[11px] animate-pulse shadow-xl shadow-red-500/20"
              >
                End Recording
              </button>
            ) : (
              <div className="flex gap-3">
                {transcription.length > 0 && !insight && (
                  <button
                    onClick={handleEndClass}
                    disabled={isSummarizing}
                    className="btn-fusion"
                  >
                    {isSummarizing ? 'Synthesizing...' : <> <Sparkles className="w-4 h-4" /> Synthesize insights</>}
                  </button>
                )}
                <button
                  onClick={startRecording}
                  className="btn-fusion"
                >
                  {transcription.length > 0 ? 'Resume Capture' : 'Initiate Capture'}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
          {isRecording && (
            <section className="sticky top-28 z-20">
              <div className="vidyos-card p-3 rounded-[3rem] bg-white/60">
                <UnifiedInput onSend={handleUnifiedSend} placeholder="Insert neural trigger or upload slide..." isLive={true} />
              </div>
            </section>
          )}

          <section className="vidyos-card flex flex-col h-[700px] p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--vidyos-teal-light)] rounded-full -mr-32 -mt-32 blur-3xl opacity-30 pointer-events-none" />
            <div className="flex justify-between items-center mb-8 border-b border-[var(--glass-border)] pb-6">
              <div className="flex items-center gap-4">
                <h3 className="label-caps mb-0">Live Transcription Layer</h3>
                <div className="px-3 py-1 bg-[var(--vidyos-teal-light)] rounded-full text-[9px] font-black text-[var(--vidyos-teal)] uppercase tracking-widest animate-pulse">Syncing</div>
              </div>
              <button onClick={() => setTranscriptModalOpen(true)} className="w-10 h-10 bg-black/5 hover:bg-black hover:text-white rounded-full flex items-center justify-center transition-all">
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-8 custom-scrollbar pr-6">
              {transcription.map((turn, i) => (
                <div key={i} className={`flex gap-8 group ${turn.role === 'system' ? 'opacity-40 italic' : ''}`}>
                  <div className="min-w-[70px] text-[10px] font-black text-[var(--text-muted)] pt-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                    {new Date(turn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className={`text-md leading-relaxed font-semibold ${turn.text.includes('[NOTE') ? 'text-[var(--vidyos-teal)] border-l-4 border-[var(--vidyos-teal)] pl-6 py-2' : 'text-[var(--text-main)] opacity-90'}`}>
                    {turn.text}
                  </div>
                </div>
              ))}
              <div ref={transcriptEndRef} />
            </div>
          </section>

          <section className="vidyos-card p-10">
            <div className="flex justify-between items-center mb-10">
              <div>
                <span className="label-caps">Knowledge Anchor</span>
                <h3 className="text-2xl font-black text-[var(--text-main)]">Reference Materials</h3>
              </div>
              <label className="btn-fusion" style={{ padding: '12px 24px', fontSize: '0.75rem' }}>
                Bulk Upload
                <input type="file" multiple className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
            <div className="flex flex-wrap gap-4">
              {(session.groundingFiles || []).map((file, i) => (
                <div key={i} className="flex items-center gap-3 px-6 py-3 bg-[var(--glass-heavy)] rounded-2xl border border-[var(--glass-border)] hover:border-[var(--vidyos-teal-glow)] transition-all group">
                  <FileText className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--vidyos-teal)]" />
                  <span className="text-[12px] font-black text-[var(--text-main)]">{file}</span>
                </div>
              ))}
              {notes.flatMap(n => n.attachments || []).map((att) => (
                <div key={att.id} className="flex items-center gap-3 px-6 py-3 bg-[var(--vidyos-teal-light)] border border-[var(--vidyos-teal-glow)] rounded-2xl">
                  <ImageIcon className="w-4 h-4 text-[var(--vidyos-teal)]" />
                  <span className="text-[12px] font-black text-[var(--vidyos-teal)]">{att.name}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="lg:col-span-4 space-y-10">
          <div className="vidyos-card p-2 bg-transparent shadow-none border-none">
            <QAConsole
              suggestedQuestions={suggestedQuestions}
              onAskAI={async (query) => {
                const charged = await consumeCredits(5, 'Neural Doubt Resolution');
                if (!charged) return "Insufficient Neural Balance. Please recharge the protocol.";

                const context = transcription.slice(-50).map(t => t.text).join(' ');
                return await callPerplexity(`Context: ${context}\n\nQuestion: ${query}`);
              }}
              messages={consoleMessages}
              onMessagesChange={setConsoleMessages}
              onExpand={() => setConsoleModalOpen(true)}
            />
          </div>

          <div className="vidyos-card p-1">
            <KnowledgeGraph concepts={concepts} isSyncing={isSyncing} />
          </div>

          {insight && (
            <div className="vidyos-card p-10 bg-[var(--vidyos-teal-light)] border-[var(--vidyos-teal-glow)] relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                <Sparkles className="w-8 h-8 text-[var(--vidyos-teal)] opacity-20" />
              </div>
              <h3 className="label-caps text-[var(--vidyos-teal)] mb-6">Cognitive Synthesis</h3>
              <p className="text-[13px] font-black text-[var(--text-main)] leading-relaxed opacity-90">{insight.summary}</p>
            </div>
          )}
        </aside>
      </div>

      <ExpandableModal isOpen={transcriptModalOpen} onClose={() => setTranscriptModalOpen(false)} title="Transcription History">
        <div className="p-10 space-y-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {transcription.map((turn, i) => (
            <div key={i} className="flex gap-8 group">
              <span className="text-[11px] font-black text-[var(--text-muted)] w-20 pt-1.5 opacity-40">{new Date(turn.timestamp).toLocaleTimeString()}</span>
              <p className="text-md font-bold text-[var(--text-main)] leading-relaxed">{turn.text}</p>
            </div>
          ))}
        </div>
      </ExpandableModal>

      <ExpandableModal isOpen={consoleModalOpen} onClose={() => setConsoleModalOpen(false)} title="Neural Doubt Resolution">
        <div className="p-4 h-[80vh]">
          <QAConsole
            suggestedQuestions={suggestedQuestions}
            onAskAI={async (query) => {
              const charged = await consumeCredits(5, 'Neural Doubt Resolution');
              if (!charged) return "Insufficient Neural Balance. Please recharge the protocol.";

              const context = transcription.slice(-100).map(t => t.text).join(' ');
              return await callPerplexity(`Context: ${context}\n\nQuestion: ${query}`);
            }}
            messages={consoleMessages}
            onMessagesChange={setConsoleMessages}
          />
        </div>
      </ExpandableModal>

      <ExpandableModal
        isOpen={graphModalOpen}
        onClose={() => setGraphModalOpen(false)}
        title="Knowledge Architecture"
        actions={
          <button
            onClick={syncKnowledgeGraph}
            disabled={isSyncing}
            className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${isSyncing ? 'bg-black/5 text-black/20' : 'bg-black text-white hover:scale-110 active:scale-95'}`}
          >
            {isSyncing ? 'Neural Sync...' : 'Force Neural Sync'}
          </button>
        }
      >
        <div className="h-[80vh]">
          <KnowledgeGraph concepts={concepts} isSyncing={isSyncing} />
        </div>
      </ExpandableModal>
    </div>
  );
};

export default SessionView;
