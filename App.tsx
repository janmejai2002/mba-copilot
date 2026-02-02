
import React, { useState, useEffect } from 'react';
import { Subject, Session } from './types';
import Dashboard from './components/Dashboard';
import SessionView from './components/SessionView';
import SubjectHome from './components/SubjectHome';
import Auth from './components/Auth';
import Layout from './components/Layout';
import LandingPage from './components/LandingPage';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import RefundPolicy from './components/RefundPolicy';
import OnboardingWizard from './components/OnboardingWizard';
import ExamNexus from './components/ExamNexus';
import Practice from './components/Practice';
import { setDriveToken, onAuthError, storage } from './services/db';
import { GoogleUser } from './types';
import { paymentService } from './services/payment';
import { securityService } from './services/security';
import TimetableTest from './components/TimetableTest';
import TimetableValidator from './components/TimetableValidator';
import NexusView from './pages/NexusView';

// Zustand Stores
import { useAuthStore } from './stores/useAuthStore';
import { useUIStore } from './stores/useUIStore';
import { useSubjectStore } from './stores/useSubjectStore';
import { useSessionStore } from './stores/useSessionStore';
import { useCreditStore } from './stores/useCreditStore';

const App: React.FC = () => {
  const { user, showAuth, showOnboarding, isSovereign, setUser, setShowAuth, setShowOnboarding, setIsSovereign, logout } = useAuthStore();
  const { view, isLoading, darkMode, showPricing, setView, setIsLoading, setDarkMode, setShowPricing, navigateTo } = useUIStore();
  const { subjects, activeSubjectId, loadSubjects, addSubject, deleteSubject, clearAllSubjects, setActiveSubjectId } = useSubjectStore();
  const { sessions, activeSessionId, isMiniMode, loadSessions, addSession, updateSession, deleteSession, setActiveSessionId, setIsMiniMode } = useSessionStore();
  const { credits, loadCredits, consumeCredits } = useCreditStore();

  const [hash, setHash] = useState(window.location.hash);

  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash);
    const handleLocationChange = () => {
      const path = window.location.pathname.replace('/', '') || 'dashboard';
      if (['dashboard', 'subject_home', 'session', 'nexus', 'practice', 'privacy', 'terms', 'refund_policy', 'pricing'].includes(path)) {
        if (path === 'pricing') {
          setView('dashboard');
          setShowPricing(true);
        } else {
          setView(path as any);
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleLocationChange);

    // Initial path check
    handleLocationChange();

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, [setView, setShowPricing]);

  useEffect(() => {
    if (user) {
      if (Date.now() > user.expiresAt) {
        logout();
        return;
      }
      setDriveToken(user.accessToken);
      initDB();
      checkSubscription();
      loadCredits();
    } else {
      setIsLoading(false);
    }

    const unsubscribeAuthError = onAuthError(() => {
      alert("Your Google session has expired or is invalid. Please log in again.");
      logout();
    });

    return () => {
      unsubscribeAuthError();
    };
  }, [user]);

  async function checkSubscription() {
    const status = await paymentService.getSubscriptionStatus();
    setIsSovereign(status.isSovereign);
  }

  async function initDB() {
    setIsLoading(true);
    // Sync with Drive
    await storage.pullFromDrive();

    // Initialize default subjects if none exist
    if (user) {
      await storage.initializeDefaultSubjects(user.id);
    }

    await Promise.all([
      loadSubjects(),
      loadSessions()
    ]);

    setIsLoading(false);
  }

  const handleAuthComplete = (googleUser: GoogleUser) => {
    setUser(googleUser);
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleCreateSubject = async (name: string, description: string) => {
    const canProceed = await securityService.verifyDeviceQuota();
    if (!canProceed) {
      alert("Sovereign Shield: Device Quota Exceeded. You have already reached the limit for free accounts on this device.");
      return;
    }

    if (!isSovereign && subjects.length >= 10) {
      setShowPricing(true);
      return;
    }

    const newSubject: Subject = {
      id: crypto.randomUUID(),
      userId: user?.id,
      name,
      description,
      createdAt: Date.now()
    };
    await addSubject(newSubject);
  };

  const handleStartSession = async (subjectId: string, title: string) => {
    const today = new Date().toDateString();
    const existingSession = sessions.find(s =>
      s.subjectId === subjectId &&
      new Date(s.date).toDateString() === today
    );

    if (existingSession) {
      setActiveSessionId(existingSession.id);
      setIsMiniMode(false);
      setView('session');
      return;
    }

    const newSession: Session = {
      id: crypto.randomUUID(),
      userId: user?.id,
      subjectId,
      title,
      date: Date.now(),
      transcript: '',
      turns: [],
      groundingFiles: [],
      groundingFileDetails: []
    };
    await addSession(newSession);
    setActiveSessionId(newSession.id);
    setIsMiniMode(false);
    setView('session');
  };

  const handleCreateScheduledSessions = async (subjectId: string, dates: Date[]) => {
    const { format } = await import('date-fns');
    for (const date of dates) {
      const newSession: Session = {
        id: crypto.randomUUID(),
        userId: user?.id,
        subjectId,
        title: format(date, 'MMM dd, yyyy'),
        date: date.getTime(),
        transcript: '',
        turns: [],
        groundingFiles: [],
        groundingFileDetails: []
      };
      await addSession(newSession);
    }
  };

  const [showNewSessionModal, setShowNewSessionModal] = useState(false);

  if (hash === '#privacy') {
    return (
      <Layout
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        userEmail={user?.email}
        onLogout={logout}
        activeView="privacy"
        onViewChange={() => window.location.hash = ''}
        isPricingOpen={showPricing}
        onOpenPricing={() => setShowPricing(true)}
        onClosePricing={() => setShowPricing(false)}
      >
        <PrivacyPolicy />
      </Layout>
    );
  }

  if (hash === '#terms') {
    return (
      <Layout
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        userEmail={user?.email}
        onLogout={logout}
        activeView="terms"
        onViewChange={() => window.location.hash = ''}
        isPricingOpen={showPricing}
        onOpenPricing={() => setShowPricing(true)}
        onClosePricing={() => setShowPricing(false)}
      >
        <TermsOfService />
      </Layout>
    );
  }

  if (hash === '#parser') return <TimetableTest />;
  if (hash === '#validator') return <TimetableValidator />;

  if (isLoading) {
    return <div className="h-screen w-screen flex items-center justify-center font-bold text-black/20 animate-pulse bg-[#f5f5f7]">Syncing with Drive...</div>;
  }

  if (!user && !showAuth) {
    return <LandingPage onGetStarted={() => setShowAuth(true)} />;
  }

  if (!user && showAuth) {
    return <Auth onAuthComplete={handleAuthComplete} />;
  }

  if (user && showOnboarding) {
    return <OnboardingWizard onComplete={() => setShowOnboarding(false)} />;
  }

  return (
    <Layout
      darkMode={darkMode}
      onToggleDarkMode={() => setDarkMode(!darkMode)}
      userEmail={user?.email}
      onLogout={logout}
      activeView={view}
      onViewChange={(newView) => navigateTo(newView)}
      onClosePricing={() => setShowPricing(false)}
      credits={credits}
      tier={isSovereign ? 'Sovereign' : 'Synthesist'}
    >
      {view === 'dashboard' && (
        <Dashboard
          subjects={subjects}
          sessions={sessions}
          onCreateSubject={handleCreateSubject}
          onStartSession={handleStartSession}
          onOpenSession={(id) => {
            setActiveSessionId(id);
            setIsMiniMode(false);
            setView('session');
          }}
          onOpenSubject={(id) => {
            setActiveSubjectId(id);
            setView('subject_home');
          }}
          onDeleteSubject={deleteSubject}
          onDeleteSession={deleteSession}
          onClearAllSubjects={clearAllSubjects}
        />
      )}

      {view === 'subject_home' && activeSubjectId && (
        <SubjectHome
          subject={subjects.find(s => s.id === activeSubjectId)!}
          sessions={sessions.filter(s => s.subjectId === activeSubjectId)}
          onBack={() => navigateTo('dashboard')}
          onOpenSession={(id) => {
            setActiveSessionId(id);
            setView('session');
          }}
          onStartNewSession={() => setShowNewSessionModal(true)}
          onCreateScheduledSessions={(dates) => handleCreateScheduledSessions(activeSubjectId, dates)}
        />
      )}

      {view === 'nexus' && (
        <ExamNexus
          subjects={subjects}
          sessions={sessions}
          onOpenSession={(id) => {
            setActiveSessionId(id);
            setView('session');
          }}
        />
      )}

      {view === 'practice' && (
        <Practice
          subjects={subjects}
          sessions={sessions}
        />
      )}

      {showNewSessionModal && activeSubjectId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-bold mb-2">Class Session</h3>
            <p className="text-black/50 text-sm mb-6">Start recording for {subjects.find(s => s.id === activeSubjectId)?.name}</p>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-black/40 mb-1 block">Session Title</label>
              <input
                type="text"
                autoFocus
                className="w-full px-4 py-3 rounded-xl border border-black/10 focus:ring-1 focus:ring-black outline-none transition-all"
                placeholder="e.g. Week 4: Brand Strategy"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleStartSession(activeSubjectId, (e.target as HTMLInputElement).value);
                    setShowNewSessionModal(false);
                  }
                }}
              />
            </div>
            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setShowNewSessionModal(false)}
                className="flex-1 py-3 border border-black/10 rounded-xl text-sm font-semibold hover:bg-black/5 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const input = document.querySelector('input[placeholder="e.g. Week 4: Brand Strategy"]') as HTMLInputElement;
                  handleStartSession(activeSubjectId, input.value || 'Untitled Session');
                  setShowNewSessionModal(false);
                }}
                className="flex-1 py-3 bg-black text-white rounded-xl text-sm font-semibold hover:bg-black/80 transition-all"
              >
                Begin
              </button>
            </div>
          </div>
        </div>
      )}

      {activeSessionId && (
        <div className={view === 'session' ? 'block animate-apple-in' : 'fixed inset-0 pointer-events-none z-[100]'}>
          <div className={view === 'session' ? '' : 'pointer-events-auto'}>
            <SessionView
              session={sessions.find(s => s.id === activeSessionId)!}
              subject={subjects.find(s => s.id === sessions.find(sess => sess.id === activeSessionId)?.subjectId)!}
              onBack={() => {
                if (activeSubjectId) {
                  navigateTo('subject_home');
                } else {
                  navigateTo('dashboard');
                }
              }}
              onUpdateSession={updateSession}
              isMiniMode={view !== 'session'}
              setIsMiniMode={(mini) => {
                if (mini) {
                  setView('dashboard');
                } else {
                  setView('session');
                }
              }}
              onExpand={() => setView('session')}
              consumeCredits={consumeCredits}
            />
          </div>
        </div>
      )}

      {view === 'nexus' && activeSessionId && (
        <NexusView
          session={sessions.find(s => s.id === activeSessionId)!}
          onBack={() => navigateTo('session')}
        />
      )}

      {view === 'privacy' && <PrivacyPolicy />}
      {view === 'terms' && <TermsOfService />}
      {view === 'refund_policy' && <RefundPolicy />}
    </Layout>
  );
};

export default App;
