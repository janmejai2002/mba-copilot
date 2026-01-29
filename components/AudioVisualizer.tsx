
import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
    analyser: AnalyserNode | null;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ analyser }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);

    useEffect(() => {
        if (!analyser || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const width = 140;
        const height = 40;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            analyser.getByteFrequencyData(dataArray);

            ctx.clearRect(0, 0, width, height);

            // Skeletal Design: Thin lines, subtle glows, high precision
            const barCount = 40;
            const barWidth = width / barCount;
            const centerY = height / 2;

            ctx.lineWidth = 1.5;
            ctx.lineCap = 'round';

            for (let i = 0; i < barCount; i++) {
                const dataIndex = Math.floor((i / barCount) * (bufferLength / 2));
                const value = dataArray[dataIndex] / 255;
                const barHeight = Math.max(2, value * height * 0.8);

                // Alternating dot and line pattern for "skeletal" technical look
                const x = i * barWidth + barWidth / 2;

                // Draw bar logic
                const opacity = 0.1 + value * 0.9;
                ctx.strokeStyle = `rgba(0, 0, 0, ${opacity})`;

                ctx.beginPath();
                ctx.moveTo(x, centerY - barHeight / 2);
                ctx.lineTo(x, centerY + barHeight / 2);
                ctx.stroke();

                // Add a tiny "technical" dot at the ends for high intensity
                if (value > 0.5) {
                    ctx.fillStyle = `rgba(59, 130, 246, ${value * 0.5})`;
                    ctx.beginPath();
                    ctx.arc(x, centerY - barHeight / 2, 1, 0, Math.PI * 2);
                    ctx.arc(x, centerY + barHeight / 2, 1, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Draw a very thin core reference line
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(0, centerY);
            ctx.lineTo(width, centerY);
            ctx.stroke();

            animationRef.current = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            if (animationRef.current !== null) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [analyser]);

    return (
        <div className="flex items-center px-4 py-2 bg-black/[0.02] rounded-2xl border border-black/[0.03]">
            <canvas
                ref={canvasRef}
                style={{ width: '140px', height: '40px' }}
            />
        </div>
    );
};

export default AudioVisualizer;
