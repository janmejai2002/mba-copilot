
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Subject, Session, TranscriptionTurn } from '../types';
import { generateSessionInsight, extractConceptsFromMaterials } from '../services/gemini';
import { callPerplexity, extractKeywords, explainConcept, generateSuggestedQuestions } from '../services/perplexity';
import QAConsole from './QAConsole';
import KnowledgeGraph from './KnowledgeGraph';
import AudioVisualizer from './AudioVisualizer';
import ExpandableModal from './ExpandableModal';
// GoogleGenAI import removed - using proxy
import { Maximize2 } from 'lucide-react';

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
  const [volumeBoost, setVolumeBoost] = useState(2.0); // 2x default boost
  const [lastSaved, setLastSaved] = useState(Date.now());
  const [contextSaved, setContextSaved] = useState(false);

  // Modal states for expandable panels
  const [transcriptModalOpen, setTranscriptModalOpen] = useState(false);
  const [consoleModalOpen, setConsoleModalOpen] = useState(false);
  const [graphModalOpen, setGraphModalOpen] = useState(false);

  // Smart features state
  const [notifications, setNotifications] = useState<Array<{ id: string; type: 'concept' | 'question' | 'success'; message: string; timestamp: number }>>([]);
  const [sessionStartTime, setSessionStartTime] = useState(Date.now());
  const [sessionDuration, setSessionDuration] = useState(0);

  // Console messages state to persist across modal open/close
  const [consoleMessages, setConsoleMessages] = useState<Array<{ role: 'user' | 'ai'; text: string }>>([]);

  // Auto-save every 10 seconds if changes detected
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
        console.log("Auto-saved session");
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
    // Debounce the "Saved" indicator
    const timeout = setTimeout(() => setContextSaved(true), 1000);
    return () => clearTimeout(timeout);
  };

  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  // Auto-scroll transcription
  useEffect(() => {
    // block: 'nearest' ensures we don't scroll the entire page, just the container if needed
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [transcription]);

  // Handle immediate persistence whenever transcription, concepts, or suggested questions change
  const lastSavedLength = useRef(0);
  useEffect(() => {
    const questionsChanged = suggestedQuestions.length !== (session.suggestedQuestions?.length || 0);
    if ((transcription.length > 0 && transcription.length !== lastSavedLength.current) ||
      concepts.length > (session.concepts?.length || 0) || questionsChanged) {
      const fullText = transcription.map(t => t.text).join(' ');
      onUpdateSession({
        ...session,
        transcript: fullText,
        turns: transcription,
        concepts: concepts,
        suggestedQuestions: suggestedQuestions
      });
      lastSavedLength.current = transcription.length;
    }
  }, [transcription, concepts, suggestedQuestions, session, onUpdateSession]);

  // Perplexity Brain: Analyzing transcript for new MBA concepts every 45 seconds
  const lastConceptAnalyzedIndex = useRef(0);
  useEffect(() => {
    if (!isRecording || transcription.length < lastConceptAnalyzedIndex.current + 3) return;

    const analyzeConcepts = async () => {
      const newText = transcription.slice(lastConceptAnalyzedIndex.current).map(t => t.text).join(' ');
      if (!newText.trim()) return;

      lastConceptAnalyzedIndex.current = transcription.length;

      try {
        const keywords = await extractKeywords(newText);
        for (const kw of keywords) {
          if (!concepts.some(c => c.keyword.toLowerCase() === kw.toLowerCase())) {
            const explanation = await explainConcept(kw, newText);
            setConcepts(prev => [...prev, { keyword: kw, explanation, timestamp: Date.now() }]);
          }
        }
      } catch (e) {
        console.error("Concept Analysis Error:", e);
      }
    };

    const timer = setTimeout(analyzeConcepts, 15000);
    return () => clearTimeout(timer);
  }, [isRecording, transcription, concepts]);

  // Perplexity Brain: Generating suggested questions every 60 seconds
  const lastQuestionAnalyzedIndex = useRef(0);
  useEffect(() => {
    if (!isRecording || transcription.length < lastQuestionAnalyzedIndex.current + 5) return;

    const generateQuestions = async () => {
      const windowText = transcription.slice(-15).map(t => t.text).join(' ');
      if (!windowText.trim()) return;

      lastQuestionAnalyzedIndex.current = transcription.length;

      try {
        const questions = await generateSuggestedQuestions(windowText);
        setSuggestedQuestions(questions);
      } catch (e) {
        console.error("Question Generation Error:", e);
      }
    };

    const timer = setTimeout(generateQuestions, 20000);
    return () => clearTimeout(timer);
  }, [isRecording, transcription]);

  const updateTranscription = useCallback((role: 'user' | 'model' | 'system', text: string) => {
    setTranscription(prev => {
      const lastTurn = prev[prev.length - 1];
      if (lastTurn && lastTurn.role === role) {
        // Merge with last turn if speaker is the same
        const updatedTurns = [...prev];
        updatedTurns[updatedTurns.length - 1] = {
          ...lastTurn,
          text: lastTurn.text + " " + text
        };
        return updatedTurns;
      } else {
        // Create new turn
        return [...prev, { role, text, timestamp: Date.now() }];
      }
    });
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const tokenResponse = await fetch('/api/deepgram-token');
      if (!tokenResponse.ok) {
        throw new Error('Failed to fetch Deepgram token');
      }
      const { token } = await tokenResponse.json();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      const model = 'nova-2';
      // Using en-IN for Hinglish. Added diarize/punctuate to better handle mixed speech.
      const keywordParams = concepts.length > 0 ? `&keywords=${concepts.slice(-10).map(c => encodeURIComponent(c.keyword)).join(',')}` : '';
      const url = `wss://api.deepgram.com/v1/listen?model=${model}&language=en-IN&smart_format=true&punctuate=true&diarize=true&encoding=linear16&sample_rate=16000${keywordParams}`;

      const socket = new WebSocket(url, ['token', token]);
      socketRef.current = socket;

      socket.onopen = () => {
        setIsRecording(true);

        // If resuming a session, mark the break
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
            // Apply volume boost and clipping protection
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
        console.log("Deepgram WebSocket Closed");
        setIsRecording(false);
      };

    } catch (err) {
      console.error("Failed to start session:", err);
      setIsRecording(false);
    }
  }, [updateTranscription]);

  const stopRecording = () => {
    setIsRecording(false);
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

  const handleEndClass = async () => {
    if (isRecording) stopRecording();
    setIsSummarizing(true);

    const fullText = transcription.map(t => t.text).join(' ');
    try {
      const res = await generateSessionInsight(fullText || "The lecture covered branding and market positioning.");
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
      const files = Array.from(e.target.files) as File[];

      const newFileDetails = await Promise.all(files.map(async (file) => {
        return new Promise<import('../types').GroundingFileDetail>((resolve) => {
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

      // Populate Knowledge Graph from new materials
      extractConceptsFromMaterials(files.map(f => f.name)).then(newConcepts => {
        setConcepts(prev => {
          const merged = [...prev];
          newConcepts.forEach((nc: any) => {
            if (!merged.some(c => c.keyword.toLowerCase() === nc.keyword.toLowerCase())) {
              merged.push({ ...nc, timestamp: Date.now() });
            }
          });
          return merged;
        });
      }).catch(err => console.error("Material Analysis Failed", err));
    }
  };

  if (isMiniMode) {
    return (
      <div className="fixed bottom-6 right-6 w-[calc(100vw-48px)] md:w-96 bg-white/90 backdrop-blur-xl shadow-2xl rounded-3xl border border-black/10 overflow-hidden z-[100] animate-in slide-in-from-bottom-10 fade-in duration-300 flex flex-col max-h-[400px] md:max-h-[500px]">
        {/* Mini Header */}
        <div className="p-4 bg-black/5 flex justify-between items-center cursor-move draggable">
          <div className="flex items-center gap-2">
            {isRecording && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
            <span className="text-[10px] font-bold uppercase tracking-widest truncate max-w-[150px]">{subject.name}</span>
          </div>
          <button
            onClick={() => onExpand ? onExpand() : setIsMiniMode?.(false)}
            className="p-1.5 hover:bg-black/10 rounded-lg transition-colors"
          >
            <Maximize2 className="w-4 h-4 text-black/60" />
          </button>
        </div>

        {/* Mini Transcript */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-white/50">
          {transcription.slice(-5).map((turn, i) => (
            <div key={i} className={`text-xs ${turn.role === 'system' ? 'text-center opacity-50 py-1' : ''}`}>
              {turn.role !== 'system' && <span className="font-bold opacity-30 block text-[9px] mb-0.5">{new Date(turn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
              <p className={`${turn.role === 'model' ? 'italic text-blue-600' : 'text-black/80'}`}>{turn.text}</p>
            </div>
          ))}
          <div ref={transcriptEndRef} />
        </div>

        {/* Mini Controls */}
        <div className="p-4 border-t border-black/5 flex justify-between items-center bg-white/80">
          <div className="flex items-center gap-2">
            {isRecording && <AudioVisualizer analyser={analyser} />}
          </div>
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-black hover:bg-black/80'}`}
          >
            {isRecording ? (
              <span className="w-3 h-3 bg-white rounded-sm" />
            ) : (
              <svg className="w-4 h-4 text-white ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 3l14 9-14 9V3z" /></svg>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto pb-12 animate-apple-in px-4">
      <header className="flex flex-col gap-6 mb-10">
        <button onClick={handleBack} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-black/30 hover:text-black transition-all w-fit">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
          Back to Library
        </button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="flex-1 w-full">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/30 mb-1.5 block">{subject.name}</span>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#1d1d1f] leading-tight">{session.title}</h2>
            <p className="text-black/40 mt-1 text-sm font-medium">{new Date(session.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-black/[0.03] px-3 md:px-4 py-2 rounded-2xl border border-black/[0.03]">
              <span className="text-[9px] md:text-[10px] font-bold text-black/30 uppercase tracking-widest hidden sm:inline">Mic Boost</span>
              <input
                type="range" min="1" max="10" step="0.5"
                value={volumeBoost}
                onChange={(e) => setVolumeBoost(parseFloat(e.target.value))}
                className="w-12 md:w-16 h-1 bg-black/10 rounded-lg appearance-none cursor-pointer accent-black"
              />
              <span className="text-[10px] font-bold text-black/60">{volumeBoost}x</span>
            </div>

            <div className="flex-shrink-0">
              {isRecording && <AudioVisualizer analyser={analyser} />}
            </div>

            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2.5 px-5 md:px-6 py-2.5 apple-btn-primary active:scale-95 shadow-sm ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'hover:opacity-90'}`}
            >
              {isRecording ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span className="text-[11px] font-bold uppercase tracking-widest">End Session</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                  <span className="text-[11px] font-bold uppercase tracking-widest">Live Copilot</span>
                </>
              )}
            </button>
            {/* Mini Player Toggle */}
            <button
              onClick={() => setIsMiniMode(true)}
              className="p-2.5 bg-black/[0.03] rounded-xl text-black/40 hover:text-black hover:bg-black/10 transition-all"
              title="Pop-out Mini Player"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
            </button>

            {!insight && (
              <button
                onClick={handleEndClass}
                disabled={isSummarizing || transcription.length === 0}
                className="px-6 py-2.5 apple-btn-secondary hover:bg-[#e8e8ed] disabled:opacity-30 text-[11px] font-bold uppercase tracking-widest"
              >
                {isSummarizing ? 'Analyzing...' : 'Generate Insight'}
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Content Area */}
        <div className="lg:col-span-12 xl:col-span-8 space-y-6 md:space-y-8">
          {/* Transcript Card */}
          <section className="apple-card p-4 md:p-8 min-h-[400px] md:min-h-[500px] flex flex-col h-[calc(100vh-280px)] md:h-[calc(100vh-320px)] max-h-[800px] group">
            <div className="flex justify-between items-center mb-6 md:mb-8 border-b border-black/[0.03] pb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/30">Live Transcription</h3>
                <button
                  onClick={() => setTranscriptModalOpen(true)}
                  className="expand-btn p-1.5 hover:bg-black/5 rounded-lg transition-all"
                  title="Expand transcript"
                >
                  <Maximize2 className="w-3 h-3 text-black/30" />
                </button>
              </div>
              {isRecording && <span className="text-[9px] font-bold text-red-500 uppercase tracking-widest flex items-center gap-2 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span className="hidden sm:inline">Live Broadcast</span>
                <span className="sm:hidden">Live</span>
              </span>}
            </div>

            <div className="flex-1 space-y-4 md:space-y-6 overflow-y-auto pr-4 custom-scrollbar">
              {transcription.map((turn, i) => (
                turn.role === 'system' ? (
                  <div key={i} className="flex items-center gap-3 md:gap-4 py-3 md:py-4 opacity-30">
                    <div className="h-px bg-black/20 flex-1" />
                    <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-black/60">{turn.text} • {new Date(turn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <div className="h-px bg-black/20 flex-1" />
                  </div>
                ) : (
                  <div key={i} className={`flex gap-4 md:gap-6 group transition-opacity ${turn.role === 'model' ? 'opacity-40 italic' : ''}`}>
                    <div className="min-w-[45px] md:min-w-[60px] text-[8px] md:text-[9px] font-bold text-black/20 pt-1 tracking-wider">
                      {new Date(turn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-[13px] md:text-[14px] leading-relaxed text-black/90 font-medium selection:bg-black selection:text-white max-w-[90%] md:max-w-[85%]">
                      {turn.text}
                    </div>
                  </div>
                )
              ))}
              <div ref={transcriptEndRef} />
              {transcription.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-10 py-20">
                  <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                  <p className="text-sm font-bold uppercase tracking-widest">Standby</p>
                </div>
              )}
            </div>
          </section>

          {/* Context Card */}
          <section className="apple-card p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/30">Academic Grounding</h3>
              </div>
              <label className="cursor-pointer apple-btn-secondary px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-[#e8e8ed]">
                Add Materials
                <input type="file" multiple className="hidden" onChange={handleFileUpload} accept=".pdf,.pptx,.jpg,.png" />
              </label>
            </div>

            <div className="flex flex-wrap gap-3">
              {(session.groundingFiles || []).map((file, i) => (
                <div key={i} className="flex items-center gap-2.5 px-4 py-2 bg-black/[0.03] rounded-xl border border-black/[0.02] transition-all hover:bg-white hover:border-black/10">
                  <svg className="w-3.5 h-3.5 text-black/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  <span className="text-[11px] font-bold text-black/60 truncate max-w-[120px]">{file}</span>
                </div>
              ))}
              {(!session.groundingFiles || session.groundingFiles.length === 0) && (
                <p className="text-[10px] font-medium text-black/20 italic">No supplemental grounding provided.</p>
              )}
            </div>

            <div className="mt-6 border-t border-black/5 pt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/30">Additional Context for AI</label>
                {contextSaved && <span className="text-[9px] text-green-600 font-medium">✓ Saved</span>}
              </div>
              <textarea
                className="w-full text-xs p-3 rounded-xl bg-black/[0.03] border-none focus:ring-1 focus:ring-black/20 outline-none resize-none h-20 placeholder:text-black/20"
                placeholder="e.g. 'Focus on indian market context', 'I am weak in finance terms', etc."
                value={session.aiContext || ''}
                onChange={handleContextChange}
              />
            </div>
          </section>
        </div>

        {/* Intelligence Sidebar Area */}
        <aside className="lg:col-span-12 xl:col-span-4 space-y-8 h-full">
          <QAConsole
            suggestedQuestions={suggestedQuestions}
            onAskAI={async (query) => {
              // Get context from recent transcript (last 50 turns for better context)
              const context = transcription.slice(-50).map(t => t.text).join(' ');

              // Get context from uploaded grounding files (metadata)
              const fileContext = (session.groundingFileDetails || [])
                .map(f => `File: ${f.name} (Type: ${f.type})`)
                .join('; ');

              const prompt = `Student Question: ${query}
                
                Current Lecture Context: "${context}"
                
                Uploaded Study Materials: ${fileContext || "No files uploaded."}
                
                User Instructions/Context: "${session.aiContext || "None provided."}"
                
                Subject: ${subject.name}
                
                Instructions:
                1. Answer the student's question directly using the lecture context and study materials provided.
                2. If the answer is in the transcript, cite it.
                3. If the answer is likely in the study materials (based on their names/types), mention that.
                4. Do NOT say "I cannot see what's happening" - assume the provided text IS what is happening.
                4. Do NOT say "I cannot see what's happening" - assume the provided text IS what is happening.
                5. Use clear formatting with bullet points where appropriate.`;
              return await callPerplexity(prompt);
            }}
            onExpand={() => setConsoleModalOpen(true)}
            messages={consoleMessages}
            onMessagesChange={setConsoleMessages}
          />

          <KnowledgeGraph concepts={concepts} />

          {insight && (
            <div className="space-y-6 animate-apple-in pb-10">
              <div className="apple-card p-6 bg-blue-50/50 border-blue-100/50 shadow-none">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3 text-blue-600/40">Smart Summary</h3>
                <p className="text-[12px] leading-relaxed font-bold text-blue-900/80">{insight.summary}</p>
              </div>

              <div className="apple-card p-6 border-black/[0.02]">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-6 text-black/30">Examination Prep</h3>
                <div className="space-y-4">
                  {insight.examQuestions.map((q, i) => (
                    <div key={i} className="flex gap-4 items-start bg-black/[0.01] p-3 rounded-xl border border-black/[0.02]">
                      <div className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-[9px] font-bold flex-shrink-0">{i + 1}</div>
                      <p className="text-[11px] leading-relaxed font-bold text-[#1d1d1f]">{q}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
          }
        </aside>
      </div>

      {/* Expandable Modals */}
      <ExpandableModal
        isOpen={transcriptModalOpen}
        onClose={() => setTranscriptModalOpen(false)}
        title="Live Transcription"
      >
        <div className="space-y-6 p-6">
          {transcription.map((turn, i) => (
            turn.role === 'system' ? (
              <div key={i} className="flex items-center gap-4 py-4 opacity-30">
                <div className="h-px bg-black/20 flex-1" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-black/60">{turn.text} • {new Date(turn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <div className="h-px bg-black/20 flex-1" />
              </div>
            ) : (
              <div key={i} className={`flex gap-6 group transition-opacity ${turn.role === 'model' ? 'opacity-40 italic' : ''}`}>
                <div className="min-w-[60px] text-[9px] font-bold text-black/20 pt-1 tracking-wider">
                  {new Date(turn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-[14px] leading-relaxed text-black/90 font-medium selection:bg-black selection:text-white max-w-[85%]">
                  {turn.text}
                </div>
              </div>
            )
          ))}
        </div>
      </ExpandableModal>

      <ExpandableModal
        isOpen={consoleModalOpen}
        onClose={() => setConsoleModalOpen(false)}
        title="Doubt Console"
      >
        <QAConsole
          suggestedQuestions={suggestedQuestions}
          messages={consoleMessages}
          onMessagesChange={setConsoleMessages}
          onAskAI={async (query: string) => {
            const prompt = `Context: ${transcription.map(t => t.text).join(' ')}
              
              Question: ${query}
              
              Instructions:
              1. Answer based on the lecture context above.
              2. Use LaTeX for math ($inline$ or $$block$$).
              3. Use clear formatting.`;
            return await callPerplexity(prompt);
          }}
        />
      </ExpandableModal>

      <ExpandableModal
        isOpen={graphModalOpen}
        onClose={() => setGraphModalOpen(false)}
        title="Knowledge Graph"
      >
        <KnowledgeGraph concepts={concepts} />
      </ExpandableModal>
    </div>
  );
};

export default SessionView;
