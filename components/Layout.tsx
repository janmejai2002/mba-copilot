
import React from 'react';
import { Sun, Moon, LogOut, User } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  userEmail?: string | null;
  onLogout?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, darkMode, onToggleDarkMode, userEmail, onLogout }) => {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] selection:bg-[var(--text-primary)] selection:text-[var(--card-bg)] transition-colors duration-500">
      <nav className="fixed top-0 w-full z-50 px-4 md:px-8 py-3 flex justify-between items-center border-b border-black/5 bg-white/90 backdrop-blur-xl transition-all">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[var(--text-primary)] rounded-xl flex items-center justify-center transition-colors">
            <span className="text-[var(--card-bg)] font-bold text-[10px]">MBA</span>
          </div>
          <h1 className="text-sm font-bold tracking-tight uppercase">MBA Copilot</h1>
        </div>

        <div className="flex items-center gap-4 md:gap-8">
          <div className="hidden lg:block text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.3em]">
            Academic Intel Layer
          </div>

          {userEmail && (
            <div className="flex items-center gap-3 pr-4 border-r border-black/5">
              <div className="w-7 h-7 bg-black/[0.03] text-black/40 rounded-full flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-black/40 hidden md:block">{userEmail}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleDarkMode}
              className="w-8 h-8 rounded-full bg-black/[0.03] flex items-center justify-center hover:scale-110 active:scale-95 transition-all text-[var(--text-primary)]"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {userEmail && (
              <button
                onClick={onLogout}
                className="w-8 h-8 rounded-full bg-black/[0.03] flex items-center justify-center hover:scale-110 active:scale-95 transition-all text-red-500"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </nav>
      <main className="pt-24 pb-12 px-4 md:px-8 max-w-[1500px] mx-auto overflow-x-hidden">
        {children}
      </main>
    </div>
  );
};

export default Layout;
