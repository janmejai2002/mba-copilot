
import { useState, useRef, useCallback, useEffect } from 'react';
import { TranscriptionTurn } from '../types';
import { useBackgroundStore } from '../stores/useBackgroundStore';

export function useTranscription(onTranscriptReceived: (text: string) => void) {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [volumeBoost, setVolumeBoost] = useState(1.0);
    const [skipSilence, setSkipSilence] = useState(false);
    const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

    // Background state for organic animations
    const setBackgroundState = useBackgroundStore(state => state.setState);

    const socketRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const volumeBoostRef = useRef(volumeBoost);
    const isPausedRef = useRef(isPaused);
    const skipSilenceRef = useRef(skipSilence);

    useEffect(() => { volumeBoostRef.current = volumeBoost; }, [volumeBoost]);
    useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
    useEffect(() => { skipSilenceRef.current = skipSilence; }, [skipSilence]);

    const stopRecording = useCallback(() => {
        setIsRecording(false);
        setIsPaused(false);
        setBackgroundState('idle'); // Reset background to calm state

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

        setAnalyser(null);
    }, []);

    const startRecording = useCallback(async () => {
        try {
            let token = localStorage.getItem('custom_deepgram_key') || import.meta.env.VITE_DEEPGRAM_API_KEY;

            if (!token) {
                const tokenResponse = await fetch('/api/deepgram-token');
                if (tokenResponse.ok) {
                    const data = await tokenResponse.json();
                    token = data.token;
                }
            }

            if (!token) throw new Error('Deepgram token missing');

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
                setBackgroundState('recording'); // Activate recording visuals
                const source = audioContext.createMediaStreamSource(stream);
                const analyserNode = audioContext.createAnalyser();
                analyserNode.fftSize = 256;
                source.connect(analyserNode);
                setAnalyser(analyserNode);

                const processor = audioContext.createScriptProcessor(4096, 1, 1);
                source.connect(processor);
                processor.connect(audioContext.destination);

                processor.onaudioprocess = (e) => {
                    if (socket.readyState !== WebSocket.OPEN || isPausedRef.current) return;

                    const inputData = e.inputBuffer.getChannelData(0);

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
            };

            socket.onmessage = (message) => {
                const data = JSON.parse(message.data);
                if (data.channel?.alternatives?.[0]?.transcript && data.is_final) {
                    onTranscriptReceived(data.channel.alternatives[0].transcript);
                }
            };

            socket.onerror = stopRecording;
            socket.onclose = stopRecording;

        } catch (err) {
            console.error("Transcription error:", err);
            stopRecording();
        }
    }, [onTranscriptReceived, stopRecording]);

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
        stopRecording
    };
}
