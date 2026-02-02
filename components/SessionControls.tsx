
import React from 'react';
import { Play, Volume2, FileText } from 'lucide-react';

interface SessionControlsProps {
    isRecording: boolean;
    isPaused: boolean;
    setIsPaused: (val: boolean) => void;
    skipSilence: boolean;
    setSkipSilence: (val: boolean) => void;
    volumeBoost: number;
    setVolumeBoost: (val: number) => void;
    onStart: () => void;
    onStop: () => void;
    onExport: () => void;
}

const SessionControls: React.FC<SessionControlsProps> = ({
    isRecording,
    isPaused,
    setIsPaused,
    skipSilence,
    setSkipSilence,
    volumeBoost,
    setVolumeBoost,
    onStart,
    onStop,
    onExport
}) => {
    return (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50">
            <div className="flex items-center gap-4 bg-white/80 backdrop-blur-3xl p-2.5 rounded-[2rem] border border-black/5 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)]">
                <button
                    onClick={() => setSkipSilence(!skipSilence)}
                    className={`w-10 h-10 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${skipSilence ? 'bg-[var(--vidyos-teal)] text-white' : 'hover:bg-black/5 text-black/40'}`}
                >
                    SIL
                </button>

                <button
                    onClick={onExport}
                    className="px-3 py-2 bg-black/5 hover:bg-black/10 rounded-full flex items-center gap-2 transition-all"
                    title="Export Clean Transcript"
                >
                    <FileText className="w-3 h-3 text-black/60" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-black/60 whitespace-nowrap">Clean</span>
                </button>

                <div className="flex items-center gap-2">
                    <button
                        onClick={isRecording ? onStop : onStart}
                        className={`group relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 ${isRecording ? 'bg-red-500' : 'bg-black hover:scale-105'}`}
                    >
                        {isRecording ? (
                            <div className="w-4 h-4 bg-white rounded-md shadow-inner" />
                        ) : (
                            <Play className="w-6 h-6 text-white ml-0.5 fill-white" />
                        )}
                    </button>
                    {isRecording && (
                        <button
                            onClick={() => setIsPaused(!isPaused)}
                            className={`absolute -right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-lg ${isPaused ? 'bg-orange-500 text-white' : 'bg-white text-black hover:bg-black hover:text-white'}`}
                        >
                            {isPaused ? <Play className="w-3 h-3" /> : <div className="flex gap-0.5"><div className="w-0.5 h-2.5 bg-current rounded-full" /><div className="w-0.5 h-2.5 bg-current rounded-full" /></div>}
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-3 px-4 h-10 bg-black/5 rounded-full">
                    <Volume2 className="w-3.5 h-3.5 text-black/30" />
                    <input
                        type="range" min="1" max="5" step="0.1" value={volumeBoost}
                        onChange={(e) => setVolumeBoost(parseFloat(e.target.value))}
                        className="w-16 h-1 accent-black cursor-pointer bg-black/10 rounded-lg"
                    />
                    <span className="text-[9px] font-black text-black/40 w-6">{volumeBoost.toFixed(1)}x</span>
                </div>
            </div>
        </div>
    );
};

export default SessionControls;
