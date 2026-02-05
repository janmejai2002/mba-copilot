import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
    Pen, Highlighter, Eraser, Type, Square, Circle,
    ArrowRight, Undo, Redo, Trash2, Download, Palette
} from 'lucide-react';

interface DrawingCanvasProps {
    initialData?: string;
    onSave?: (dataUrl: string) => void;
    className?: string;
}

type Tool = 'pen' | 'highlighter' | 'eraser' | 'text' | 'rectangle' | 'circle' | 'arrow';

interface DrawingState {
    tool: Tool;
    color: string;
    lineWidth: number;
    isDrawing: boolean;
}

const COLORS = [
    '#000000', '#ffffff', '#ef4444', '#f59e0b', '#10b981',
    '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'
];

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ initialData, onSave, className = '' }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);

    const [state, setState] = useState<DrawingState>({
        tool: 'pen',
        color: '#000000',
        lineWidth: 3,
        isDrawing: false
    });

    const [history, setHistory] = useState<ImageData[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [showColorPicker, setShowColorPicker] = useState(false);

    const lastPoint = useRef<{ x: number; y: number } | null>(null);
    const startPoint = useRef<{ x: number; y: number } | null>(null);

    // Initialize canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const container = canvas.parentElement;
        if (!container) return;

        // Set canvas size to match container
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        contextRef.current = ctx;

        // Clear to white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Load initial data if provided
        if (initialData) {
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0);
                saveToHistory();
            };
            img.src = initialData;
        } else {
            saveToHistory();
        }

        // Handle resize
        const handleResize = () => {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
            ctx.putImageData(imageData, 0, 0);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const saveToHistory = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = contextRef.current;
        if (!canvas || !ctx) return;

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        setHistory(prev => {
            const newHistory = prev.slice(0, historyIndex + 1);
            return [...newHistory, imageData].slice(-50); // Keep last 50 states
        });
        setHistoryIndex(prev => Math.min(prev + 1, 49));
    }, [historyIndex]);

    const undo = useCallback(() => {
        if (historyIndex <= 0) return;

        const ctx = contextRef.current;
        if (!ctx) return;

        const newIndex = historyIndex - 1;
        ctx.putImageData(history[newIndex], 0, 0);
        setHistoryIndex(newIndex);
    }, [history, historyIndex]);

    const redo = useCallback(() => {
        if (historyIndex >= history.length - 1) return;

        const ctx = contextRef.current;
        if (!ctx) return;

        const newIndex = historyIndex + 1;
        ctx.putImageData(history[newIndex], 0, 0);
        setHistoryIndex(newIndex);
    }, [history, historyIndex]);

    const clearCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = contextRef.current;
        if (!canvas || !ctx) return;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        saveToHistory();
    }, [saveToHistory]);

    const exportCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const dataUrl = canvas.toDataURL('image/png');
        onSave?.(dataUrl);

        // Also trigger download
        const link = document.createElement('a');
        link.download = `notes-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
    }, [onSave]);

    const getCoordinates = (e: React.PointerEvent | PointerEvent): { x: number; y: number; pressure: number } => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0, pressure: 0.5 };

        const rect = canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            pressure: e.pressure || 0.5
        };
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        const { x, y, pressure } = getCoordinates(e);
        const ctx = contextRef.current;
        if (!ctx) return;

        setState(prev => ({ ...prev, isDrawing: true }));
        lastPoint.current = { x, y };
        startPoint.current = { x, y };

        // Set drawing style based on tool
        switch (state.tool) {
            case 'pen':
                ctx.globalCompositeOperation = 'source-over';
                ctx.strokeStyle = state.color;
                ctx.lineWidth = state.lineWidth * pressure;
                break;
            case 'highlighter':
                ctx.globalCompositeOperation = 'multiply';
                ctx.strokeStyle = state.color;
                ctx.lineWidth = state.lineWidth * 4;
                ctx.globalAlpha = 0.3;
                break;
            case 'eraser':
                ctx.globalCompositeOperation = 'destination-out';
                ctx.lineWidth = state.lineWidth * 5;
                break;
        }

        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!state.isDrawing) return;

        const { x, y, pressure } = getCoordinates(e);
        const ctx = contextRef.current;
        if (!ctx || !lastPoint.current) return;

        if (['pen', 'highlighter', 'eraser'].includes(state.tool)) {
            // Pressure-sensitive line width for pen
            if (state.tool === 'pen') {
                ctx.lineWidth = state.lineWidth * (pressure * 2);
            }

            ctx.lineTo(x, y);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x, y);
        }

        lastPoint.current = { x, y };
    };

    const handlePointerUp = () => {
        const ctx = contextRef.current;
        if (!ctx) return;

        if (state.isDrawing) {
            ctx.closePath();

            // Reset context state
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 1;

            // Draw shapes on pointer up
            if (['rectangle', 'circle', 'arrow'].includes(state.tool) && startPoint.current && lastPoint.current) {
                drawShape(startPoint.current, lastPoint.current);
            }

            saveToHistory();
        }

        setState(prev => ({ ...prev, isDrawing: false }));
        lastPoint.current = null;
        startPoint.current = null;
    };

    const drawShape = (start: { x: number; y: number }, end: { x: number; y: number }) => {
        const ctx = contextRef.current;
        if (!ctx) return;

        ctx.strokeStyle = state.color;
        ctx.lineWidth = state.lineWidth;
        ctx.beginPath();

        switch (state.tool) {
            case 'rectangle':
                ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
                break;
            case 'circle':
                const radiusX = Math.abs(end.x - start.x) / 2;
                const radiusY = Math.abs(end.y - start.y) / 2;
                const centerX = start.x + (end.x - start.x) / 2;
                const centerY = start.y + (end.y - start.y) / 2;
                ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
                ctx.stroke();
                break;
            case 'arrow':
                // Draw line
                ctx.moveTo(start.x, start.y);
                ctx.lineTo(end.x, end.y);
                ctx.stroke();

                // Draw arrowhead
                const angle = Math.atan2(end.y - start.y, end.x - start.x);
                const headLen = 15;
                ctx.beginPath();
                ctx.moveTo(end.x, end.y);
                ctx.lineTo(
                    end.x - headLen * Math.cos(angle - Math.PI / 6),
                    end.y - headLen * Math.sin(angle - Math.PI / 6)
                );
                ctx.moveTo(end.x, end.y);
                ctx.lineTo(
                    end.x - headLen * Math.cos(angle + Math.PI / 6),
                    end.y - headLen * Math.sin(angle + Math.PI / 6)
                );
                ctx.stroke();
                break;
        }
    };

    const toolButtons: { tool: Tool; icon: React.ReactNode; label: string }[] = [
        { tool: 'pen', icon: <Pen className="w-4 h-4" />, label: 'Pen' },
        { tool: 'highlighter', icon: <Highlighter className="w-4 h-4" />, label: 'Highlighter' },
        { tool: 'eraser', icon: <Eraser className="w-4 h-4" />, label: 'Eraser' },
        { tool: 'text', icon: <Type className="w-4 h-4" />, label: 'Text' },
        { tool: 'rectangle', icon: <Square className="w-4 h-4" />, label: 'Rectangle' },
        { tool: 'circle', icon: <Circle className="w-4 h-4" />, label: 'Circle' },
        { tool: 'arrow', icon: <ArrowRight className="w-4 h-4" />, label: 'Arrow' },
    ];

    return (
        <div className={`flex flex-col h-full ${className}`}>
            {/* Toolbar */}
            <div className="flex items-center gap-2 p-2 bg-white/5 border-b border-white/10">
                {/* Tool buttons */}
                <div className="flex gap-1 bg-black/20 rounded-lg p-1">
                    {toolButtons.map(({ tool, icon, label }) => (
                        <button
                            key={tool}
                            onClick={() => setState(prev => ({ ...prev, tool }))}
                            className={`p-2 rounded-lg transition-all ${state.tool === tool
                                    ? 'bg-[var(--vidyos-teal)] text-white'
                                    : 'text-white/60 hover:text-white hover:bg-white/10'
                                }`}
                            title={label}
                        >
                            {icon}
                        </button>
                    ))}
                </div>

                <div className="w-px h-6 bg-white/10" />

                {/* Color picker */}
                <div className="relative">
                    <button
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        className="p-2 rounded-lg hover:bg-white/10 transition-all flex items-center gap-2"
                    >
                        <div
                            className="w-5 h-5 rounded-full border-2 border-white/30"
                            style={{ backgroundColor: state.color }}
                        />
                        <Palette className="w-4 h-4 text-white/60" />
                    </button>

                    {showColorPicker && (
                        <div className="absolute top-full left-0 mt-2 p-2 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl flex gap-1 z-50">
                            {COLORS.map(color => (
                                <button
                                    key={color}
                                    onClick={() => {
                                        setState(prev => ({ ...prev, color }));
                                        setShowColorPicker(false);
                                    }}
                                    className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 ${state.color === color ? 'border-white scale-110' : 'border-transparent'
                                        }`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Line width */}
                <input
                    type="range"
                    min="1"
                    max="20"
                    value={state.lineWidth}
                    onChange={(e) => setState(prev => ({ ...prev, lineWidth: Number(e.target.value) }))}
                    className="w-20 accent-[var(--vidyos-teal)]"
                />

                <div className="w-px h-6 bg-white/10" />

                {/* History controls */}
                <button
                    onClick={undo}
                    disabled={historyIndex <= 0}
                    className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all"
                    title="Undo"
                >
                    <Undo className="w-4 h-4" />
                </button>
                <button
                    onClick={redo}
                    disabled={historyIndex >= history.length - 1}
                    className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all"
                    title="Redo"
                >
                    <Redo className="w-4 h-4" />
                </button>

                <div className="flex-1" />

                {/* Actions */}
                <button
                    onClick={clearCanvas}
                    className="p-2 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-400/10 transition-all"
                    title="Clear"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
                <button
                    onClick={exportCanvas}
                    className="p-2 rounded-lg text-[var(--vidyos-teal)] hover:bg-[var(--vidyos-teal)]/10 transition-all"
                    title="Export"
                >
                    <Download className="w-4 h-4" />
                </button>
            </div>

            {/* Canvas */}
            <div className="flex-1 relative bg-white cursor-crosshair touch-none">
                <canvas
                    ref={canvasRef}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                    className="absolute inset-0 w-full h-full"
                    style={{ touchAction: 'none' }}
                />
            </div>
        </div>
    );
};

export default DrawingCanvas;
