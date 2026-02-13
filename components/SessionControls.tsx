
import React from 'react';
import { Play, Pause, Volume2, FileText, SkipForward, X } from 'lucide-react';

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
    onClear: () => void;
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
    onExport,
    onClear
}) => {
    return (
        <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] md:w-auto">
            <div className="flex items-center justify-center gap-2 md:gap-4 bg-white/80 backdrop-blur-3xl p-2 md:p-2.5 rounded-2xl md:rounded-[2rem] border border-black/5 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)]">
                {/* Skip Silence Toggle */}
                <button
                    onClick={() => setSkipSilence(!skipSilence)}
                    aria-label={skipSilence ? "Disable silence skipping" : "Enable silence skipping"}
                    aria-pressed={skipSilence}
                    className={`w-8 h-8 md:w-10 md:h-10 rounded-full text-[7px] md:text-[8px] font-black uppercase tracking-widest transition-all focus-visible:ring-2 focus-visible:ring-[var(--vidyos-teal)] ${skipSilence ? 'bg-[var(--vidyos-teal)] text-white' : 'hover:bg-black/5 text-black/40'}`}
                >
                    <SkipForward className="w-3 h-3 md:w-4 md:h-4 mx-auto" />
                </button>

                {/* Export Button */}
                <button
                    onClick={onExport}
                    aria-label="Export clean transcript"
                    className="hidden md:flex px-3 py-2 bg-black/5 hover:bg-black/10 rounded-full items-center gap-2 transition-all focus-visible:ring-2 focus-visible:ring-[var(--vidyos-teal)]"
                >
                    <FileText className="w-3 h-3 text-black/60" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-black/60 whitespace-nowrap">Clean</span>
                </button>

                {/* Trash/Clear Button */}
                <button
                    onClick={onClear}
                    title="Clear entire transcript"
                    className="p-2 hover:bg-red-500/10 rounded-full group transition-all"
                >
                    <X className="w-4 h-4 text-black/20 group-hover:text-red-500" />
                </button>

                {/* Main Record/Stop Button + Pause */}
                <div className="flex items-center gap-1 md:gap-2">
                    <button
                        onClick={isRecording ? onStop : onStart}
                        aria-label={isRecording ? "Stop recording" : "Start recording"}
                        className={`group w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-500 focus-visible:ring-2 focus-visible:ring-offset-2 ${isRecording ? 'bg-red-500 focus-visible:ring-red-500' : 'bg-black hover:scale-105 focus-visible:ring-black'}`}
                    >
                        {isRecording ? (
                            <div className="w-3.5 h-3.5 md:w-4 md:h-4 bg-white rounded-md shadow-inner" />
                        ) : (
                            <Play className="w-5 h-5 md:w-6 md:h-6 text-white ml-0.5 fill-white" />
                        )}
                    </button>

                    {/* Pause Button - Only visible when recording */}
                    {isRecording && (
                        <button
                            onClick={() => setIsPaused(!isPaused)}
                            aria-label={isPaused ? "Resume recording" : "Pause recording"}
                            aria-pressed={isPaused}
                            className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all shadow-lg focus-visible:ring-2 focus-visible:ring-offset-2 ${isPaused ? 'bg-orange-500 text-white focus-visible:ring-orange-500' : 'bg-white text-black hover:bg-black hover:text-white focus-visible:ring-black'}`}
                        >
                            {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                        </button>
                    )}
                </div>

                {/* Volume Control */}
                <div className="hidden md:flex items-center gap-2 md:gap-3 px-3 md:px-4 h-8 md:h-10 bg-black/5 rounded-full">
                    <Volume2 className="w-3 h-3 md:w-3.5 md:h-3.5 text-black/30" aria-hidden="true" />
                    <input
                        type="range"
                        min="1"
                        max="5"
                        step="0.1"
                        value={volumeBoost}
                        onChange={(e) => setVolumeBoost(parseFloat(e.target.value))}
                        aria-label="Volume boost level"
                        className="w-12 md:w-16 h-1 accent-black cursor-pointer bg-black/10 rounded-lg"
                    />
                    <span className="text-[8px] md:text-[9px] font-black text-black/40 w-5 md:w-6" aria-live="polite">{volumeBoost.toFixed(1)}x</span>
                </div>
            </div>
        </div>
    );
};

export default SessionControls;

