import React from 'react';
import { Sun, Moon } from 'lucide-react';

const Layout: React.FC<{ children: React.ReactNode; darkMode: boolean; onToggleDarkMode: () => void }> = ({ children, darkMode, onToggleDarkMode }) => {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] selection:bg-[var(--text-primary)] selection:text-[var(--card-bg)] transition-colors duration-500">
      <nav className="fixed top-0 w-full z-50 px-4 md:px-8 py-3 flex justify-between items-center border-b border-black/5 bg-white/90 backdrop-blur-xl transition-all">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[var(--text-primary)] rounded-xl flex items-center justify-center transition-colors">
            <span className="text-[var(--card-bg)] font-bold text-[10px]">MBA</span>
          </div>
          <h1 className="text-sm font-bold tracking-tight uppercase">Copilot</h1>
        </div>

        <div className="flex items-center gap-4 md:gap-8">
          <div className="hidden lg:block text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.3em]">
            Academic Intel Layer
          </div>

          <button
            onClick={onToggleDarkMode}
            className="w-8 h-8 rounded-full bg-[var(--apple-gray-100)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all text-[var(--text-primary)]"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </nav>
      <main className="pt-24 pb-12 px-4 md:px-8 max-w-[1500px] mx-auto overflow-x-hidden">
        {children}
      </main>
    </div>
  );
};

export default Layout;
