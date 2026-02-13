
import { useState, useRef, useCallback, useEffect } from 'react';
import { TranscriptionTurn } from '../types';
import { useBackgroundStore } from '../stores/useBackgroundStore';

export type STTProvider = 'deepgram' | 'google-chirp';

export function useTranscription(onTranscriptReceived: (text: string) => void) {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [volumeBoost, setVolumeBoost] = useState(1.0);
    const [skipSilence, setSkipSilence] = useState(false);
    const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
    const [sttProvider, setSTTProvider] = useState<STTProvider>(
        (localStorage.getItem('stt_provider') as STTProvider) || 'deepgram'
    );

    const setBackgroundState = useBackgroundStore(state => state.setState);

    const socketRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);

    const volumeBoostRef = useRef(volumeBoost);
    const isPausedRef = useRef(isPaused);
    const skipSilenceRef = useRef(skipSilence);

    useEffect(() => { volumeBoostRef.current = volumeBoost; }, [volumeBoost]);
    useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
    useEffect(() => { skipSilenceRef.current = skipSilence; }, [skipSilence]);

    // Persist provider choice
    useEffect(() => {
        localStorage.setItem('stt_provider', sttProvider);
    }, [sttProvider]);

    const stopRecording = useCallback(() => {
        setIsRecording(false);
        setIsPaused(false);
        setBackgroundState('idle');

        if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
        }

        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current = null;
        }

        if (audioContextRef.current) {
            audioContextRef.current.close().catch(() => { });
            audioContextRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        setAnalyser(null);
    }, []);

    // ===== DEEPGRAM ENGINE =====
    const startDeepgram = useCallback(async (stream: MediaStream, audioContext: AudioContext) => {
        let token = localStorage.getItem('custom_deepgram_key') || import.meta.env.VITE_DEEPGRAM_API_KEY;

        if (!token) {
            const tokenResponse = await fetch('/api/deepgram-token');
            if (tokenResponse.ok) {
                const data = await tokenResponse.json();
                token = data.token;
            }
        }

        if (!token) throw new Error('Deepgram token missing');

        const model = 'nova-2';
        const url = `wss://api.deepgram.com/v1/listen?model=${model}&language=en-IN&smart_format=true&punctuate=true&diarize=true&encoding=linear16&sample_rate=16000`;

        const socket = new WebSocket(url, ['token', token]);
        socketRef.current = socket;

        socket.onopen = async () => {
            setIsRecording(true);
            setBackgroundState('recording');
            const source = audioContext.createMediaStreamSource(stream);
            const analyserNode = audioContext.createAnalyser();
            analyserNode.fftSize = 256;
            source.connect(analyserNode);
            setAnalyser(analyserNode);

            try {
                await audioContext.audioWorklet.addModule('/worklets/audio-processor.js');
                const workletNode = new AudioWorkletNode(audioContext, 'audio-processor');
                source.connect(workletNode);
                workletNode.connect(audioContext.destination);

                workletNode.port.onmessage = (event) => {
                    if (socket.readyState !== WebSocket.OPEN || isPausedRef.current) return;

                    const inputData = event.data;

                    if (skipSilenceRef.current) {
                        let sum = 0;
                        for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
                        if (Math.sqrt(sum / inputData.length) < 0.01) return;
                    }

                    const pcmData = new Int16Array(inputData.length);
                    for (let i = 0; i < inputData.length; i++) {
                        const boosted = inputData[i] * volumeBoostRef.current;
                        pcmData[i] = Math.max(-1, Math.min(1, boosted)) * 0x7FFF;
                    }
                    socket.send(pcmData.buffer);
                };
            } catch (err) {
                console.error("AudioWorklet failed:", err);
            }
        };

        socket.onmessage = (message) => {
            const data = JSON.parse(message.data);
            if (data.channel?.alternatives?.[0]?.transcript && data.is_final) {
                onTranscriptReceived(data.channel.alternatives[0].transcript);
            }
        };

        socket.onerror = stopRecording;
        socket.onclose = stopRecording;
    }, [onTranscriptReceived, stopRecording]);

    // ===== GOOGLE CHIRP ENGINE (via backend proxy) =====
    const startGoogleChirp = useCallback(async (stream: MediaStream, audioContext: AudioContext) => {
        setIsRecording(true);
        setBackgroundState('recording');

        const source = audioContext.createMediaStreamSource(stream);
        const analyserNode = audioContext.createAnalyser();
        analyserNode.fftSize = 256;
        source.connect(analyserNode);
        setAnalyser(analyserNode);

        // Google Cloud STT V2 uses REST-based streaming via the backend
        // We'll send audio chunks to our backend which proxies to Google STT
        const mediaRecorder = new MediaRecorder(stream, {
            mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : 'audio/webm'
        });
        mediaRecorderRef.current = mediaRecorder;

        let audioChunks: Blob[] = [];

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0 && !isPausedRef.current) {
                audioChunks.push(event.data);
            }
        };

        // Send audio every 3 seconds for transcription
        const sendInterval = setInterval(async () => {
            if (audioChunks.length === 0 || isPausedRef.current) return;

            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            audioChunks = [];

            try {
                const formData = new FormData();
                formData.append('audio', audioBlob, 'audio.webm');
                formData.append('language', 'en-IN');
                formData.append('model', 'chirp_2');

                const response = await fetch('/api/agent/transcribe', {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.transcript && data.transcript.trim()) {
                        onTranscriptReceived(data.transcript);
                    }
                }
            } catch (err) {
                console.error('Google Chirp transcription error:', err);
            }
        }, 3000);

        mediaRecorder.start(1000); // Capture 1-second chunks

        // Store interval for cleanup
        const originalStop = stopRecording;
        const cleanupInterval = () => {
            clearInterval(sendInterval);
        };

        // We need to clean up the interval when recording stops
        const checkStopped = setInterval(() => {
            if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
                clearInterval(sendInterval);
                clearInterval(checkStopped);
            }
        }, 1000);

    }, [onTranscriptReceived, stopRecording]);

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            audioContextRef.current = audioContext;

            if (sttProvider === 'google-chirp') {
                await startGoogleChirp(stream, audioContext);
            } else {
                await startDeepgram(stream, audioContext);
            }
        } catch (err) {
            console.error("Transcription error:", err);
            stopRecording();
        }
    }, [sttProvider, startDeepgram, startGoogleChirp, stopRecording]);

    useEffect(() => {
        return () => {
            stopRecording();
        };
    }, [stopRecording]);

    return {
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
    };
}
