
import React from 'react';
import { Sun, Moon, LogOut, User, Settings, Sparkles } from 'lucide-react';
import SettingsModal from './SettingsModal';
import Sidebar from './Sidebar';
import PricingModal from './PricingModal';

interface LayoutProps {
  children: React.ReactNode;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  userEmail?: string | null;
  onLogout?: () => void;
  activeView: string;
  onViewChange: (view: any) => void;
  isPricingOpen?: boolean;
  onOpenPricing?: () => void;
  onClosePricing?: () => void;
  credits?: number;
  tier?: string;
}

import Background3D from './Background3D';

const Layout: React.FC<LayoutProps> = ({
  children,
  darkMode,
  onToggleDarkMode,
  userEmail,
  onLogout,
  activeView,
  onViewChange,
  isPricingOpen: externalIsPricingOpen,
  onOpenPricing,
  onClosePricing,
  credits = 0,
  tier = 'Synthesist'
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [isPricingOpen, setIsPricingOpen] = React.useState(false);

  const finalIsPricingOpen = externalIsPricingOpen !== undefined ? externalIsPricingOpen : isPricingOpen;
  const finalOnOpenPricing = onOpenPricing || (() => setIsPricingOpen(true));
  const finalOnClosePricing = onClosePricing || (() => setIsPricingOpen(false));

  return (
    <div className="min-h-screen selection:bg-[var(--vidyos-teal)] selection:text-white transition-colors duration-700">
      <Background3D />

      <Sidebar
        activeView={activeView}
        onViewChange={onViewChange}
        darkMode={darkMode}
        onToggleDarkMode={onToggleDarkMode}
        userEmail={userEmail}
        onLogout={onLogout}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenPricing={finalOnOpenPricing}
        credits={credits}
        tier={tier}
      />

      {/* Modern Top Minimal Bar (Optional/Hidden on scroll if needed) */}
      <header className="fixed top-0 left-24 right-0 h-10 z-[1000] px-10 flex justify-between items-center bg-white/5 dark:bg-black/5 backdrop-blur-sm border-b border-black/[0.03] dark:border-white/[0.03] pointer-events-none">
        <div className="flex items-center gap-4">
          <span className="text-[9px] font-black uppercase tracking-[0.4em] opacity-30 text-[var(--text-main)]">MMXXVI Neural Arch</span>
        </div>
        <div className="flex items-center gap-6">
          {userEmail && (
            <div className="flex items-center gap-2 opacity-20">
              <Sparkles className="w-3 h-3 text-[var(--vidyos-teal)]" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-main)]">Cognitive Sync Active</span>
            </div>
          )}
        </div>
      </header>

      <main className="md:pl-24 pt-10 md:pt-20 pb-24 md:pb-20 pr-6 md:pr-12 max-w-[1700px] min-h-screen relative z-10 transition-all">
        {children}
      </main>

      <footer className="pt-24 pb-12 border-t border-[var(--glass-border)] bg-[var(--glass-heavy)] backdrop-blur-[30px] mt-40">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex justify-center gap-12 mb-8">
            <button
              onClick={() => onViewChange('privacy')}
              className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] hover:text-[var(--vidyos-teal)] transition-colors"
            >
              Privacy
            </button>
            <button
              onClick={() => onViewChange('terms')}
              className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] hover:text-[var(--vidyos-teal)] transition-colors"
            >
              Terms
            </button>
            <button
              onClick={() => onViewChange('refund_policy')}
              className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] hover:text-[var(--vidyos-teal)] transition-colors"
            >
              Refunds
            </button>
            <a
              href="mailto:support@vidyos.ai"
              className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] hover:text-[var(--vidyos-teal)] transition-colors"
            >
              Contact
            </a>
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
      <PricingModal isOpen={finalIsPricingOpen} onClose={finalOnClosePricing} />
    </div>
  );
};

export default Layout;
