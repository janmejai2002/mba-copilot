
import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
    analyser: AnalyserNode | null;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ analyser }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>();

    useEffect(() => {
        if (!analyser || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        const dpr = window.devicePixelRatio || 1;
        canvas.width = 120 * dpr;
        canvas.height = 40 * dpr;
        ctx.scale(dpr, dpr);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        let phase = 0;

        const draw = () => {
            analyser.getByteFrequencyData(dataArray);

            // Clear with fade effect
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect(0, 0, 120, 40);

            // Calculate average volume
            const average = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
            const normalizedAverage = average / 255;

            // Draw 3D wave bars
            const barCount = 24;
            const barWidth = 120 / barCount;

            for (let i = 0; i < barCount; i++) {
                const dataIndex = Math.floor((i / barCount) * bufferLength);
                const value = dataArray[dataIndex] / 255;

                // Create wave effect
                const waveOffset = Math.sin(phase + i * 0.3) * 0.2;
                const height = (value + waveOffset) * 30;

                // 3D perspective effect
                const x = i * barWidth;
                const perspective = 1 - (i / barCount) * 0.3;
                const scaledHeight = height * perspective;

                // Gradient based on intensity
                const gradient = ctx.createLinearGradient(x, 40 - scaledHeight, x, 40);
                const hue = 220 + (value * 60); // Blue to cyan
                gradient.addColorStop(0, `hsla(${hue}, 70%, 50%, 0.9)`);
                gradient.addColorStop(1, `hsla(${hue}, 70%, 30%, 0.6)`);

                ctx.fillStyle = gradient;

                // Draw bar with rounded top
                ctx.beginPath();
                ctx.roundRect(x + 1, 40 - scaledHeight, barWidth - 2, scaledHeight, [2, 2, 0, 0]);
                ctx.fill();

                // Add glow effect for high values
                if (value > 0.6) {
                    ctx.shadowBlur = 8;
                    ctx.shadowColor = `hsla(${hue}, 70%, 50%, ${value})`;
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
            }

            // Draw waveform overlay
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();

            for (let i = 0; i < 120; i++) {
                const dataIndex = Math.floor((i / 120) * bufferLength);
                const value = dataArray[dataIndex] / 255;
                const y = 20 - (value * 15) + Math.sin(phase + i * 0.1) * 3;

                if (i === 0) {
                    ctx.moveTo(i, y);
                } else {
                    ctx.lineTo(i, y);
                }
            }
            ctx.stroke();

            // Pulse circle in center
            const pulseSize = 3 + normalizedAverage * 5;
            const pulseGradient = ctx.createRadialGradient(60, 20, 0, 60, 20, pulseSize);
            pulseGradient.addColorStop(0, `rgba(59, 130, 246, ${normalizedAverage})`);
            pulseGradient.addColorStop(1, 'rgba(59, 130, 246, 0)');

            ctx.fillStyle = pulseGradient;
            ctx.beginPath();
            ctx.arc(60, 20, pulseSize, 0, Math.PI * 2);
            ctx.fill();

            phase += 0.05;
            animationRef.current = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [analyser]);

    return (
        <div className="relative">
            <canvas
                ref={canvasRef}
                className="rounded-xl shadow-inner bg-gradient-to-br from-white to-gray-50 border border-black/5"
                style={{ width: '120px', height: '40px' }}
            />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />
        </div>
    );
};

export default AudioVisualizer;
