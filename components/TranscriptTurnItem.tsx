
import React from 'react';
import { TranscriptionTurn } from '../types';

interface Props {
    turn: TranscriptionTurn;
}

const TranscriptTurnItem: React.FC<Props> = React.memo(({ turn }) => {
    return (
        <div className={`flex flex-col gap-4 animate-spatial-in ${turn.role === 'system' ? 'opacity-30 scale-95 origin-center' : ''}`}>
            <div className="flex items-center gap-4">
                <span className="text-[10px] font-black text-[var(--vidyos-teal)] uppercase tracking-widest">
                    {turn.role === 'user' ? 'Stream' : turn.role === 'system' ? 'Protocol' : 'Insight'}
                </span>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-black/5 to-transparent shadow-sm" />
                <span className="text-[9px] font-bold text-black/20 uppercase">
                    {new Date(turn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>
            <div className={`text-xl md:text-2xl font-bold leading-[1.6] tracking-tight ${turn.role === 'user' ? 'text-black font-semibold' : 'text-purple-600 font-medium italic'} break-words`}>
                {turn.text}
            </div>
        </div>
    );
});

export default TranscriptTurnItem;
