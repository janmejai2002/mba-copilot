
import React from 'react';
import { TranscriptionTurn } from '../types';
import TranscriptTurnItem from './TranscriptTurnItem';
import { Sparkles } from 'lucide-react';

interface TranscriptStreamProps {
    transcription: TranscriptionTurn[];
    transcriptEndRef: React.RefObject<HTMLDivElement | null>;
}

const TranscriptStream: React.FC<TranscriptStreamProps> = ({ transcription, transcriptEndRef }) => {
    return (
        <div className="flex-1 overflow-y-auto space-y-6 md:space-y-12 py-12 px-4 md:px-12 custom-scrollbar relative z-10 scroll-smooth">
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
    );
};

export default TranscriptStream;
