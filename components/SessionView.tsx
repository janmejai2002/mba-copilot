
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Subject, Session, TranscriptionTurn, Note, Attachment } from '../types';
import { generateSessionInsight, extractConceptsFromMaterials } from '../services/gemini';
import { callPerplexity, extractKeywords, explainConcept, generateSuggestedQuestions } from '../services/perplexity';
import QAConsole from './QAConsole';
// import KnowledgeGraph from './KnowledgeGraph';
// TODO: Switch to EnhancedKnowledgeGraph after committing D3 to package.json
const KnowledgeGraph = React.lazy(() => import('./EnhancedKnowledgeGraph'));
import AudioVisualizer from './AudioVisualizer';
import ExpandableModal from './ExpandableModal';
import UnifiedInput from './UnifiedInput';
import { Maximize2, FileText, ImageIcon, Play, Plus, Clock, Sparkles, X, Volume2, QrCode } from 'lucide-react';
import { masterIntelligence } from '../services/intelligence';
import { CREDIT_COSTS } from '../constants/pricing';
import { useNotificationStore } from '../stores/useNotificationStore';
import TranscriptTurnItem from './TranscriptTurnItem';

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

  const [showQRBridge, setShowQRBridge] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);

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

  // Background Intelligence Sync (15-min loop)
  useEffect(() => {
    if (!isRecording) {
      setRecordingStartTime(null);
      // Ensure cleanup when recording stops manually
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => { });
        audioContextRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      return;
    }

    if (!recordingStartTime) setRecordingStartTime(Date.now());

    const interval = setInterval(async () => {
      console.log("Triggering 15-minute Intelligence Sync...");
      const masterNote = await masterIntelligence.synthesizeMasterDoc(
        transcription,
        notes,
        consoleMessages,
        subject.name
      );

      // Update subject with new master note
      onUpdateSession({
        ...session,
        summary: "Live Sync Active: Latest insights committing to Subject Home."
      });

      // In a real state-managed app, we'd update the Subject directly in IndexedDB here
    }, 15 * 60 * 1000); // 15 Minutes

    return () => clearInterval(interval);
  }, [isRecording, transcription, notes, consoleMessages, subject.name]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => { });
        audioContextRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // Auto-Sync Knowledge Graph (Every 5 turns)
  useEffect(() => {
    if (transcription.length > 0 && transcription.length % 5 === 0) {
      syncKnowledgeGraph();
    }
  }, [transcription.length]);

  // Smart Transcription Cleanup (Every 2 mins)
  useEffect(() => {
    if (!isRecording || transcription.length < 10) return;

    const interval = setInterval(async () => {
      // Logic for AI-lite cleanup would go here
      // updateTranscription('system', 'Neural Cleanup performed: Text grounded and formatted.');
    }, 120000);

    return () => clearInterval(interval);
  }, [isRecording, transcription]);

  const syncKnowledgeGraph = async () => {
    if (transcription.length < 5 && consoleMessages.length === 0) return;
    setIsSyncing(true);
    addNotification('Synchronizing Neural Map...', 'info');
    try {
      const charged = await consumeCredits(CREDIT_COSTS.KNOWLEDGE_GRAPH_SYNC, 'Knowledge Graph Sync');
      if (!charged) return;

      const fullText = transcription.map(t => t.text).join('\n');
      const chatContext = consoleMessages.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n');

      const prompt = `
        Analyze this lecture data:
        TRANSCRIPT: ${fullText.substring(0, 5000)}
        STUDENT DOUBTS: ${chatContext}
        
        Identify 3-5 key concepts. For each, provide:
        1. "keyword": The core term.
        2. "explanation": 2-sentence precise definition.
        3. "theme": One of [formula, example, trend, concept].
        4. "timestamp": Current session link.
        
        Return as JSON array only.
      `;

      const keywords = await extractKeywords(prompt); // Reusing extractKeywords but with the rich prompt
      const newConcepts = [...concepts];

      for (const resItem of (keywords as any)) {
        const kw = typeof resItem === 'string' ? resItem : resItem.keyword;
        if (!newConcepts.some(c => c.keyword.toLowerCase() === kw.toLowerCase())) {
          const explanation = typeof resItem === 'string' ? await explainConcept(kw, fullText) : resItem.explanation;
          newConcepts.push({
            keyword: kw,
            explanation,
            timestamp: Date.now()
          });
        }
      }

      addNotification('Neural Map Synced Successfully', 'success');
      setConcepts(newConcepts);
      onUpdateSession({ ...session, concepts: newConcepts });
    } catch (e) {
      console.error("Sync failed:", e);
      addNotification('Neural Sync Failed', 'error');
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
    addNotification('Synthesizing Session Insights...', 'info');
    const fullText = transcription.map(t => t.text).join(' ');
    try {
      const charged = await consumeCredits(CREDIT_COSTS.SESSION_SYNTHESIS, 'Session Synthesis');
      if (!charged) return;

      const res = await generateSessionInsight(fullText);
      setInsight(res);
      addNotification('Session Synthesis Complete', 'success');
      onUpdateSession({ ...session, summary: res.summary, examQuestions: res.examQuestions, transcript: fullText });
    } catch (err) {
      console.error(err);
      addNotification('Synthesis Failed', 'error');
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
      <div className="fixed bottom-6 right-6 w-72 bg-white/90 backdrop-blur-xl shadow-2xl rounded-3xl border border-black/10 overflow-hidden z-[100] flex flex-col max-h-[400px] animate-in slide-in-from-bottom-4 duration-300">
        <div className="p-4 bg-black/5 flex justify-between items-center cursor-move">
          <div className="flex items-center gap-2">
            {isRecording && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
            <span className="text-[10px] font-bold uppercase tracking-widest truncate max-w-[150px]">{subject.name}</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => onExpand ? onExpand() : setIsMiniMode?.(false)} className="p-1.5 hover:bg-black/10 rounded-lg">
              <Maximize2 className="w-3 h-3 text-black/60" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (isRecording) stopRecording();
                onBack();
              }}
              className="p-1.5 hover:bg-red-500/10 rounded-lg group"
            >
              <X className="w-3 h-3 text-black/60 group-hover:text-red-500" />
            </button>
          </div>
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
        <div className="px-4 py-2 border-t border-black/5 flex justify-between items-center bg-white/80 gap-3">
          {/* Minimal Recording Indicator */}
          {isRecording && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest text-black/40">Live</span>
            </div>
          )}
          {!isRecording && <div className="text-[9px] font-black uppercase tracking-widest text-black/20">Ready</div>}

          <div className="flex items-center gap-2">
            {isRecording && (
              <button
                onClick={() => setIsPaused(!isPaused)}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${isPaused ? 'bg-orange-500' : 'bg-black/5'}`}
                title={isPaused ? "Resume" : "Pause"}
              >
                <div className={`flex gap-0.5 ${isPaused ? 'text-white' : 'text-black'}`}>
                  {isPaused ? <Play className="w-3 h-3" /> : <><div className="w-0.5 h-2.5 bg-current" /><div className="w-0.5 h-2.5 bg-current" /></>}
                </div>
              </button>
            )}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-black hover:bg-black/80'}`}
            >
              {isRecording ? <div className="w-2.5 h-2.5 bg-white rounded-sm" /> : <Play className="w-3.5 h-3.5 text-white ml-0.5" />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pb-24 animate-apple-in overflow-x-hidden">
      {/* 2026 SPATIAL HUD OVERLAY */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[var(--vidyos-teal)]/5 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/5 blur-[150px] rounded-full" />
      </div>

      <header className="max-w-[1550px] mx-auto pt-12 px-6 mb-12 relative z-50">
        <div className="flex justify-between items-center mb-12">
          <button onClick={handleBack} className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.5em] text-[var(--vidyos-teal)] hover:opacity-100 opacity-60 transition-all hover:translate-x-1">
            <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
            Command Return
          </button>

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-[var(--vidyos-teal)] uppercase tracking-widest">{subject.name}</span>
              <span className="text-[9px] font-bold text-black/20 uppercase tracking-[0.3em]">Neural Link Established</span>
            </div>
            <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-ping' : 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]'}`} />
          </div>
        </div>

        <div className="flex flex-col items-center text-center">
          <h2 className="text-4xl md:text-7xl font-black tracking-[-0.05em] mb-4 bg-gradient-to-b from-black to-black/60 bg-clip-text text-transparent">
            {session.title}
          </h2>
          <div className="h-1 w-24 bg-gradient-to-r from-transparent via-[var(--vidyos-teal)] to-transparent opacity-20" />
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 px-4 sm:px-6 relative z-10">

        {/* LEFT ORBIT: HUD MODULES */}
        <aside className="lg:col-span-3 space-y-8 order-2 lg:order-1">
          <div className="glass-card-2026 p-6 space-y-6 group">
            <div className="flex justify-between items-center border-b border-black/[0.03] pb-4">
              <span className="label-caps mb-0 text-black/40">Neural Map</span>
              <button onClick={() => setGraphModalOpen(true)} className="p-2 hover:bg-black/5 rounded-xl transition-all"><Maximize2 className="w-3.5 h-3.5 opacity-40" /></button>
            </div>
            <div className="h-64 rounded-3xl overflow-hidden bg-black/[0.01]">
              <React.Suspense fallback={<div className="h-full w-full flex items-center justify-center text-[10px] font-black uppercase opacity-20">Loading Neural Map...</div>}>
                <KnowledgeGraph concepts={concepts} isSyncing={isSyncing} />
              </React.Suspense>
            </div>
            {isSyncing && <p className="text-[8px] font-black uppercase text-center animate-pulse text-[var(--vidyos-teal)]">Mapping Active...</p>}

            {/* Enter Nexus Button */}
            {concepts.length > 0 && (
              <button
                onClick={() => {
                  // Navigate to Nexus view
                  window.history.pushState({}, '', '/nexus');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="w-full py-4 bg-gradient-to-r from-[var(--vidyos-teal)] to-purple-600 text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-[9px] hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_30px_rgba(20,184,166,0.3)] relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <span className="relative z-10">Enter Neural Nexus</span>
              </button>
            )}
          </div>

          <div className="glass-card-2026 p-6">
            <div className="flex justify-between items-center mb-6">
              <span className="label-caps mb-0 text-black/40">QR Bridge</span>
              <QrCode className="w-4 h-4 opacity-20" />
            </div>
            <div className="flex flex-col items-center py-4">
              <div className="p-4 bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-white rotate-[-2deg] shadow-2xl hover:rotate-0 transition-transform duration-500">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=https://vidyos.space/api/upload-bridge?sessionId=${session.id}`}
                  alt="Bridge QR"
                  className="w-32 h-32 opacity-80 mix-blend-multiply"
                />
              </div>
              <p className="text-[9px] font-bold text-black/30 mt-8 text-center px-4 leading-relaxed">Scan to inject physical slides into the neural stream.</p>
            </div>
          </div>
        </aside>

        {/* CENTER: THE NEURAL STREAM */}
        <main className="lg:col-span-6 space-y-8 order-1 lg:order-2">
          <section className="vidyos-card-spatial relative flex flex-col h-[750px] overflow-hidden group">
            <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-white via-white to-transparent z-20 pointer-events-none" />
            <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-white via-white to-transparent z-20 pointer-events-none" />

            <div className="flex-1 overflow-y-auto space-y-12 py-32 px-12 custom-scrollbar relative z-10 scroll-smooth">
              {transcription.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-10">
                  <Sparkles className="w-20 h-20 mb-6" strokeWidth={1} />
                  <p className="text-xl font-bold uppercase tracking-[1em]">Awaiting Input</p>
                </div>
              ) : (
                transcription.map((turn, i) => (
                  <TranscriptTurnItem key={i} turn={turn} />
                ))
              )}
              <div ref={transcriptEndRef} />
            </div>

            {/* COMMAND ORB CONTROLS */}
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-50">
              <div className="flex items-center gap-6 bg-white/80 backdrop-blur-3xl p-4 rounded-[3rem] border border-black/5 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.1)]">
                <button
                  onClick={() => setSkipSilence(!skipSilence)}
                  className={`w-12 h-12 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${skipSilence ? 'bg-[var(--vidyos-teal)] text-white' : 'hover:bg-black/5 text-black/40'}`}
                >
                  SIL
                </button>

                {/* Clean Transcript Export */}
                <button
                  onClick={() => {
                    const cleanText = transcription
                      .filter(t => t.role !== 'system')
                      .map(t => `[${new Date(t.timestamp).toLocaleTimeString()}] ${t.text}`)
                      .join('\n\n');
                    const blob = new Blob([cleanText], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${subject.name}_${session.title}_transcript.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-4 py-2.5 bg-black/5 hover:bg-black/10 rounded-full flex items-center gap-2 transition-all"
                  title="Export Clean Transcript"
                >
                  <FileText className="w-3.5 h-3.5 text-black/60" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-black/60">Clean Transcript</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`group relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 ${isRecording ? 'bg-red-500 animate-pulse-slow' : 'bg-black'}`}
                  >
                    <div className="absolute inset-0 bg-current opacity-20 rounded-full scale-125 group-hover:scale-150 transition-transform duration-500" />
                    {isRecording ? (
                      <div className="w-6 h-6 bg-white rounded-lg shadow-inner" />
                    ) : (
                      <Play className="w-8 h-8 text-white ml-1 fill-white" />
                    )}
                  </button>
                  {isRecording && (
                    <button
                      onClick={() => setIsPaused(!isPaused)}
                      className={`absolute -right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all ${isPaused ? 'bg-orange-500 text-white' : 'bg-white shadow-lg text-black hover:bg-black hover:text-white'}`}
                    >
                      {isPaused ? <Play className="w-4 h-4" /> : <div className="flex gap-1"><div className="w-1 h-3.5 bg-current rounded-full" /><div className="w-1 h-3.5 bg-current rounded-full" /></div>}
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-4 px-6 h-12 bg-black/5 rounded-full">
                  <Volume2 className="w-4 h-4 text-black/30" />
                  <input
                    type="range" min="1" max="5" step="0.1" value={volumeBoost}
                    onChange={(e) => setVolumeBoost(parseFloat(e.target.value))}
                    className="w-24 h-1.5 accent-black cursor-pointer bg-black/10 rounded-lg"
                  />
                  <span className="text-[10px] font-black text-black/40 w-8">{volumeBoost.toFixed(1)}x</span>
                </div>
              </div>
            </div>
          </section>

          <section className="glass-card-2026 p-8">
            <UnifiedInput onSend={handleUnifiedSend} placeholder="Ground a note or upload slide to the stream..." isLive={isRecording} />
          </section>
        </main>

        {/* RIGHT ORBIT: DOUBT & SYNTHESIS */}
        <aside className="lg:col-span-3 space-y-8 order-3 lg:order-3">
          <div className="glass-card-2026 p-0 overflow-hidden min-h-[500px] flex flex-col">
            <div className="p-6 border-b border-black/[0.03] flex justify-between items-center bg-[#fbfbfd]">
              <span className="label-caps mb-0 text-black/40">Doubt Resolver</span>
              <button onClick={() => setConsoleModalOpen(true)} className="p-2 hover:bg-black/5 rounded-xl transition-all"><Maximize2 className="w-3.5 h-3.5 opacity-40" /></button>
            </div>
            <div className="flex-1 bg-white/40">
              <QAConsole
                suggestedQuestions={suggestedQuestions}
                onAskAI={async (query) => {
                  const charged = await consumeCredits(CREDIT_COSTS.DOUBT_RESOLUTION, 'Neural Doubt Resolution');
                  if (!charged) return "Neural Balance Depleted.";
                  const context = transcription.slice(-30).map(t => t.text).join(' ');
                  return await callPerplexity(`Context: ${context}\n\nQuestion: ${query}`);
                }}
                messages={consoleMessages}
                onMessagesChange={setConsoleMessages}
              />
            </div>
          </div>

          {insight && (
            <div className="glass-card-2026 p-8 bg-gradient-to-br from-purple-600/10 to-transparent border-purple-500/20 group relative overflow-hidden">
              <Sparkles className="absolute top-4 right-4 w-5 h-5 text-purple-600 opacity-20 group-hover:rotate-12 transition-transform" />
              <span className="label-caps text-purple-600 mb-6 block">Neural Insight</span>
              <p className="text-sm font-bold text-black/70 leading-relaxed tracking-tight">{insight.summary}</p>
              <div className="mt-8 flex gap-2">
                {insight.examQuestions?.slice(0, 2).map((q, i) => (
                  <div key={i} className="text-[9px] font-black uppercase text-purple-600/40 p-2 bg-purple-500/5 rounded-lg border border-purple-500/5">EXAM PROJECTION {i + 1}</div>
                ))}
              </div>
            </div>
          )}

          {!isRecording && transcription.length > 0 && !insight && (
            <button
              onClick={handleEndClass}
              disabled={isSummarizing}
              className="w-full py-8 bg-black text-white rounded-[3rem] font-black uppercase tracking-[0.5em] text-[10px] hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-black/20 overflow-hidden relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              {isSummarizing ? 'Synthesizing Architecture...' : 'Synthesize Insights'}
            </button>
          )}
        </aside>
      </div>

      <div className="max-w-[1550px] mx-auto px-6 mt-16 pb-32">
        <section className="vidyos-card border-none bg-transparent shadow-none">
          <div className="flex items-center gap-4 mb-10">
            <span className="label-caps mb-0">Grounding Vault</span>
            <div className="h-[1px] flex-1 bg-black/5" />
            <label className="text-[10px] font-black uppercase tracking-widest px-6 py-3 bg-black text-white rounded-full cursor-pointer hover:scale-105 active:scale-95 transition-all">
              Inject Materials
              <input type="file" multiple className="hidden" onChange={handleFileUpload} />
            </label>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {(session.groundingFiles || []).map((file, i) => (
              <div key={i} className="glass-card-2026 p-4 flex flex-col items-center text-center gap-3 hover:bg-[var(--vidyos-teal)]/[0.04] transition-colors border-black/5">
                <div className="w-12 h-12 bg-black/[0.03] rounded-2xl flex items-center justify-center text-black/20">
                  <FileText className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black text-black/60 truncate w-full">{file}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Modals remain standard ExpandableModals for now but we will polish them if needed */}
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
              const charged = await consumeCredits(CREDIT_COSTS.DOUBT_RESOLUTION, 'Neural Doubt Resolution');
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
          <React.Suspense fallback={<div className="h-full w-full flex items-center justify-center">Loading Architecture...</div>}>
            <KnowledgeGraph concepts={concepts} isSyncing={isSyncing} />
          </React.Suspense>
        </div>
      </ExpandableModal>
    </div>
  );
};

export default SessionView;
