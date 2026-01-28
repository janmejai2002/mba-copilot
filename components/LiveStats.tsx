
import React from 'react';
import { Clock, BookOpen, Zap, TrendingUp } from 'lucide-react';

interface LiveStatsProps {
    wordCount: number;
    conceptCount: number;
    duration: number; // in seconds
    isRecording: boolean;
}

const LiveStats: React.FC<LiveStatsProps> = ({ wordCount, conceptCount, duration, isRecording }) => {
    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const estimatedStudyTime = Math.round(wordCount / 200 * 60); // Assuming 200 words/min reading speed

    return (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 p-4 md:px-4 md:py-2 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100/50">
            {/* Duration */}
            <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-black/5'}`}>
                    <Clock className={`w-3 h-3 ${isRecording ? 'text-white' : 'text-black/40'}`} />
                </div>
                <div>
                    <p className="text-[8px] font-bold uppercase tracking-wider text-black/30">Duration</p>
                    <p className="text-[11px] font-bold text-black/70">{formatDuration(duration)}</p>
                </div>
            </div>

            {/* Word Count */}
            <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500/10">
                    <BookOpen className="w-3 h-3 text-blue-600" />
                </div>
                <div>
                    <p className="text-[8px] font-bold uppercase tracking-wider text-black/30">Words</p>
                    <p className="text-[11px] font-bold text-black/70">{wordCount.toLocaleString()}</p>
                </div>
            </div>

            {/* Concepts */}
            <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-500/10">
                    <Zap className="w-3 h-3 text-purple-600" />
                </div>
                <div>
                    <p className="text-[8px] font-bold uppercase tracking-wider text-black/30">Concepts</p>
                    <p className="text-[11px] font-bold text-black/70">{conceptCount}</p>
                </div>
            </div>

            {/* Time Saved */}
            <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-green-500/10">
                    <TrendingUp className="w-3 h-3 text-green-600" />
                </div>
                <div>
                    <p className="text-[8px] font-bold uppercase tracking-wider text-black/30">Study Saved</p>
                    <p className="text-[11px] font-bold text-green-700">~{estimatedStudyTime}m</p>
                </div>
            </div>
        </div>
    );
};

export default LiveStats;
