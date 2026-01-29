
import React from 'react';
import { Sun, Moon, LogOut, User, Settings } from 'lucide-react';
import SettingsModal from './SettingsModal';

interface LayoutProps {
  children: React.ReactNode;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  userEmail?: string | null;
  onLogout?: () => void;
}

import Background3D from './Background3D';

const Layout: React.FC<LayoutProps> = ({ children, darkMode, onToggleDarkMode, userEmail, onLogout }) => {
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

  return (
    <div className="min-h-screen selection:bg-[var(--vidyos-teal)] selection:text-white transition-colors duration-700">
      <Background3D />

      {/* 2026 Floating Glass Nav */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-[1400px] z-[1000] px-8 py-4 flex justify-between items-center border border-[var(--glass-border)] bg-[var(--glass-heavy)] backdrop-blur-[45px] rounded-[100px] shadow-[var(--shadow-premium)] transition-all">
        <div className="flex items-center gap-4 group cursor-pointer" onClick={() => window.location.hash = ''}>
          <div className="w-10 h-10 bg-[var(--text-main)] rounded-2xl flex items-center justify-center transition-all group-hover:rotate-[10deg] group-hover:scale-110">
            <span className="text-white font-black text-xl">V</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-black tracking-widest uppercase text-[var(--text-main)]">Vidyos</h1>
            <span className="text-[9px] font-bold text-[var(--vidyos-teal)] uppercase tracking-[0.4em] opacity-80">Fusion OS</span>
          </div>
        </div>

        <div className="flex items-center gap-6 md:gap-10">
          <div className="hidden lg:block text-[10px] font-900 text-[var(--text-muted)] uppercase tracking-[0.6em] opacity-50">
            Intelligent Layer MMXXVI
          </div>

          <div className="flex items-center gap-3">
            {userEmail && (
              <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-white/40 dark:bg-black/20 rounded-full border border-black/5">
                <User className="w-3.5 h-3.5 text-[var(--vidyos-teal)]" />
                <span className="text-[10px] font-bold text-[var(--text-main)] opacity-60">{userEmail}</span>
              </div>
            )}

            <div className="flex items-center gap-2 p-1.5 bg-black/5 dark:bg-white/5 rounded-full">
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white hover:scale-110 active:scale-95 transition-all text-[var(--text-muted)] hover:text-[var(--text-main)]"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>

              <button
                onClick={onToggleDarkMode}
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white hover:scale-110 active:scale-95 transition-all text-[var(--text-main)]"
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {userEmail && (
                <button
                  onClick={onLogout}
                  className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white hover:scale-110 active:scale-95 transition-all text-red-500/60"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-6 md:px-12 max-w-[1700px] mx-auto min-h-screen relative z-10">
        {children}
      </main>

      <footer className="pt-24 pb-12 border-t border-[var(--glass-border)] bg-[var(--glass-heavy)] backdrop-blur-[30px] mt-40">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex justify-center gap-12 mb-8">
            <button
              onClick={() => window.location.hash = 'privacy'}
              className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] hover:text-[var(--vidyos-teal)] transition-colors"
            >
              Privacy
            </button>
            <button
              onClick={() => window.location.hash = 'terms'}
              className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] hover:text-[var(--vidyos-teal)] transition-colors"
            >
              Terms
            </button>
          </div>
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 bg-[var(--text-main)] rounded-lg flex items-center justify-center opacity-20">
              <span className="text-white font-black text-xs">V</span>
            </div>
            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.8em] opacity-40">
              &copy; MMXXVI &bull; VIDYOS FUSION OS
            </p>
          </div>
        </div>
      </footer>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};

export default Layout;
