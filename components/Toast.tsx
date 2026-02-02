
import React from 'react';
import { useNotificationStore, NotificationType } from '../stores/useNotificationStore';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const icons: Record<NotificationType, React.ReactNode> = {
    info: <Info className="w-5 h-5 text-blue-500" />,
    success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
};

const Toast: React.FC = () => {
    const { notifications, removeNotification } = useNotificationStore();

    return (
        <div className="fixed bottom-8 left-8 z-[9999] flex flex-col gap-3 pointer-events-none">
            {notifications.map((n) => (
                <div
                    key={n.id}
                    className="pointer-events-auto flex items-center gap-4 bg-white/90 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border border-black/5 min-w-[300px] animate-in slide-in-from-left-4 duration-300 group"
                >
                    <div className="flex-shrink-0">
                        {icons[n.type]}
                    </div>
                    <p className="flex-1 text-sm font-bold text-black/70">
                        {n.message}
                    </p>
                    <button
                        onClick={() => removeNotification(n.id)}
                        className="p-1 hover:bg-black/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <X className="w-4 h-4 text-black/30" />
                    </button>
                </div>
            ))}
        </div>
    );
};

export default Toast;
