
import React, { useEffect, useState } from 'react';
import { CheckCircle, Lightbulb, X } from 'lucide-react';

interface SmartNotification {
    id: string;
    type: 'concept' | 'question' | 'success';
    message: string;
    timestamp: number;
}

interface SmartNotificationsProps {
    notifications: SmartNotification[];
    onDismiss: (id: string) => void;
}

const SmartNotifications: React.FC<SmartNotificationsProps> = ({ notifications, onDismiss }) => {
    return (
        <div className="fixed top-20 right-6 z-40 space-y-2 max-w-sm">
            {notifications.map((notif) => (
                <div
                    key={notif.id}
                    className="bg-white rounded-xl shadow-lg border border-black/10 p-4 flex items-start gap-3 animate-scale-in"
                >
                    {/* Icon */}
                    <div className={`p-2 rounded-lg flex-shrink-0 ${notif.type === 'concept' ? 'bg-purple-500/10' :
                            notif.type === 'question' ? 'bg-blue-500/10' :
                                'bg-green-500/10'
                        }`}>
                        {notif.type === 'concept' && <Lightbulb className="w-4 h-4 text-purple-600" />}
                        {notif.type === 'question' && <Lightbulb className="w-4 h-4 text-blue-600" />}
                        {notif.type === 'success' && <CheckCircle className="w-4 h-4 text-green-600" />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-black/80 leading-relaxed">
                            {notif.message}
                        </p>
                    </div>

                    {/* Dismiss */}
                    <button
                        onClick={() => onDismiss(notif.id)}
                        className="p-1 hover:bg-black/5 rounded-lg transition-all flex-shrink-0"
                    >
                        <X className="w-3 h-3 text-black/30" />
                    </button>
                </div>
            ))}
        </div>
    );
};

export default SmartNotifications;
