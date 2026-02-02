
import React from 'react';
import { Home, BookOpen, Settings, LogOut, Sun, Moon, Info, Zap, Sparkles, Brain } from 'lucide-react';
import CreditWallet from './CreditWallet';

interface SidebarProps {
    activeView: string;
    onViewChange: (view: any) => void;
    darkMode: boolean;
    onToggleDarkMode: () => void;
    userEmail?: string | null;
    onLogout?: () => void;
    onOpenSettings: () => void;
    onOpenPricing: () => void;
    credits?: number;
    tier?: string;
}

const Sidebar: React.FC<SidebarProps> = ({
    activeView,
    onViewChange,
    darkMode,
    onToggleDarkMode,
    userEmail,
    onLogout,
    onOpenSettings,
    onOpenPricing,
    credits = 0,
    tier = 'Synthesist'
}) => {
    const navItems = [
        { id: 'dashboard', icon: Home, label: 'Hub' },
        { id: 'subjects', icon: BookOpen, label: 'Library' },
        { id: 'nexus', icon: Zap, label: 'The Nexus' },
        { id: 'practice', icon: Brain, label: 'Active Recall' },
    ];

    return (
        <aside className="fixed bottom-0 left-0 w-full h-16 md:h-screen md:w-20 md:left-0 md:top-0 z-[1100] flex flex-row md:flex-col items-center justify-around md:justify-start md:py-6 bg-white/70 dark:bg-black/70 backdrop-blur-3xl border-t md:border-t-0 md:border-r border-black/5 dark:border-white/5 transition-all">
            {/* Logo */}
            <div
                className="hidden md:flex w-10 h-10 bg-black dark:bg-white rounded-xl items-center justify-center cursor-pointer mb-8 group hover:scale-110 active:scale-95 transition-all shadow-xl shadow-black/10 dark:shadow-white/10"
                onClick={() => onViewChange('dashboard')}
            >
                <span className="text-white dark:text-black font-black text-lg">V</span>
            </div>

            {/* Nav Items */}
            <div className="flex flex-row md:flex-col gap-3 md:gap-6 items-center">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeView === item.id || (item.id === 'dashboard' && activeView === 'dashboard');

                    return (
                        <button
                            key={item.id}
                            onClick={() => onViewChange(item.id)}
                            className={`group relative w-10 h-10 flex items-center justify-center rounded-xl transition-all ${isActive
                                ? 'bg-black text-white dark:bg-white dark:text-black shadow-md'
                                : 'text-black/30 dark:text-white/30 hover:bg-black/5 dark:hover:bg-white/5 hover:text-black dark:hover:text-white'
                                }`}
                        >
                            <Icon className="w-4.5 h-4.5" />
                            <span className="absolute left-full ml-4 px-2 py-1 bg-black text-white text-[9px] font-black uppercase tracking-widest rounded-md opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all pointer-events-none whitespace-nowrap">
                                {item.label}
                            </span>
                        </button>
                    );
                })}

                <div className="hidden md:block w-6 h-px bg-black/5 dark:bg-white/5 mx-auto my-1" />

                <button
                    onClick={onOpenSettings}
                    className="group relative w-10 h-10 flex items-center justify-center rounded-xl text-black/30 dark:text-white/30 hover:bg-black/5 dark:hover:bg-white/5 hover:text-black dark:hover:text-white transition-all"
                >
                    <Settings className="w-4.5 h-4.5" />
                    <span className="absolute left-full ml-4 px-2 py-1 bg-black text-white text-[9px] font-black uppercase tracking-widest rounded-md opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all pointer-events-none">
                        Settings
                    </span>
                </button>

                <button
                    onClick={onOpenPricing}
                    className="group relative w-10 h-10 flex items-center justify-center rounded-xl text-[var(--vidyos-gold)] hover:bg-[var(--vidyos-gold-light)] dark:hover:bg-[var(--vidyos-gold)]/10 transition-all shadow-sm"
                >
                    <Sparkles className="w-4.5 h-4.5" />
                    <span className="absolute left-full ml-4 px-2 py-1 bg-[var(--vidyos-gold)] text-white text-[9px] font-black uppercase tracking-widest rounded-md opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all pointer-events-none whitespace-nowrap">
                        Sovereign
                    </span>
                </button>
            </div>

            {/* Bottom Controls - Combined or hidden on mobile to avoid crowding */}
            <div className="hidden md:flex flex-col mt-auto gap-4 pb-6 items-center">
                <button
                    onClick={onToggleDarkMode}
                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-black/5 dark:bg-white/5 text-black/40 dark:text-white/40 hover:scale-110 active:scale-95 transition-all"
                >
                    {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                </button>

                {onLogout && (
                    <button
                        onClick={onLogout}
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-50 text-red-500/60 hover:bg-red-500 hover:text-white transition-all"
                        title="Logout"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                    </button>
                )}

                <div className="relative group/user">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--vidyos-teal)] to-[var(--vidyos-gold)] flex items-center justify-center text-white font-bold text-xs ring-2 ring-transparent group-hover/user:ring-black/5 dark:group-hover/user:ring-white/10 transition-all cursor-crosshair shadow-lg">
                        {userEmail ? userEmail.charAt(0).toUpperCase() : '?'}
                    </div>

                    {/* Hover Card: Credit Wallet */}
                    <div className="absolute bottom-12 left-0 w-80 opacity-0 translate-y-4 pointer-events-none group-hover/user:opacity-100 group-hover/user:translate-y-0 group-hover/user:pointer-events-auto transition-all duration-500 z-[2000]">
                        <CreditWallet credits={credits} tier={tier} onRecharge={onOpenPricing} />
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
