
import React, { useState, useEffect } from 'react';
import { Subject, Session } from './types';
import Dashboard from './components/Dashboard';
import SessionView from './components/SessionView';
import SubjectHome from './components/SubjectHome';
import Auth from './components/Auth';
import Layout from './components/Layout';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import { storage, setDriveToken } from './services/db';
import { GoogleUser } from './services/googleDrive';

const App: React.FC = () => {
  const [user, setUser] = useState<GoogleUser | null>(() => {
    const saved = localStorage.getItem('mba_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);
  const [view, setView] = useState<'dashboard' | 'subject_home' | 'session'>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [isMiniMode, setIsMiniMode] = useState(false);
  const [hash, setHash] = useState(window.location.hash);

  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (user) {
      setDriveToken(user.accessToken);
      initDB();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  async function initDB() {
    setIsLoading(true);
    // Sync with Drive
    await storage.pullFromDrive();

    const savedSubjects = await storage.getAllSubjects();
    const savedSessions = await storage.getAllSessions();
    setSubjects(savedSubjects);
    setSessions(savedSessions);

    // Trigger Timetable Sync in background
    if (user) {
      import('./services/timetable').then(({ applyTimetableSync }) => {
        applyTimetableSync(user.id).then(() => {
          storage.getAllSubjects().then(setSubjects);
          storage.getAllSessions().then(setSessions);
        });
      });
    }

    setIsLoading(false);
  }

  const handleAuthComplete = (googleUser: GoogleUser) => {
    setUser(googleUser);
    localStorage.setItem('mba_user', JSON.stringify(googleUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('mba_user');
    setSubjects([]);
    setSessions([]);
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const createSubject = async (name: string, description: string) => {
    const newSubject: Subject = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user?.id,
      name,
      description,
      createdAt: Date.now()
    };
    await storage.saveSubject(newSubject);
    setSubjects([...subjects, newSubject]);
  };

  const startSession = async (subjectId: string, title: string) => {
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
      id: Math.random().toString(36).substr(2, 9),
      userId: user?.id,
      subjectId,
      title,
      date: Date.now(),
      transcript: '',
      turns: [],
      groundingFiles: [],
      groundingFileDetails: []
    };
    await storage.saveSession(newSession);
    setSessions([...sessions, newSession]);
    setActiveSessionId(newSession.id);
    setIsMiniMode(false);
    setView('session');
  };

  const updateSession = async (updatedSession: Session) => {
    await storage.saveSession(updatedSession);
    setSessions(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));
  };

  const [showNewSessionModal, setShowNewSessionModal] = useState(false);

  if (isLoading) {
    return <div className="h-screen w-screen flex items-center justify-center font-bold text-black/20 animate-pulse bg-[#f5f5f7]">Syncing with Drive...</div>;
  }

  if (!user) {
    return <Auth onAuthComplete={handleAuthComplete} />;
  }

  if (hash === '#privacy') {
    return <Layout darkMode={darkMode} onToggleDarkMode={() => setDarkMode(!darkMode)} userEmail={user?.email} onLogout={handleLogout}><PrivacyPolicy /></Layout>;
  }

  if (hash === '#terms') {
    return <Layout darkMode={darkMode} onToggleDarkMode={() => setDarkMode(!darkMode)} userEmail={user?.email} onLogout={handleLogout}><TermsOfService /></Layout>;
  }

  return (
    <Layout darkMode={darkMode} onToggleDarkMode={() => setDarkMode(!darkMode)} userEmail={user.email} onLogout={handleLogout}>
      {view === 'dashboard' && (
        <Dashboard
          subjects={subjects}
          sessions={sessions}
          onCreateSubject={createSubject}
          onStartSession={startSession}
          onOpenSession={(id) => {
            setActiveSessionId(id);
            setIsMiniMode(false);
            setView('session');
          }}
          onOpenSubject={(id) => {
            setActiveSubjectId(id);
            setView('subject_home');
          }}
        />
      )}

      {view === 'subject_home' && activeSubjectId && (
        <SubjectHome
          subject={subjects.find(s => s.id === activeSubjectId)!}
          sessions={sessions.filter(s => s.subjectId === activeSubjectId)}
          onBack={() => setView('dashboard')}
          onOpenSession={(id) => {
            setActiveSessionId(id);
            setView('session');
          }}
          onStartNewSession={() => {
            setShowNewSessionModal(true);
          }}
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
                    startSession(activeSubjectId, (e.target as HTMLInputElement).value);
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
                  startSession(activeSubjectId, input.value || 'Untitled Session');
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

      {view === 'session' && activeSessionId && (
        <SessionView
          session={sessions.find(s => s.id === activeSessionId)!}
          subject={subjects.find(s => s.id === sessions.find(sess => sess.id === activeSessionId)?.subjectId)!}
          onBack={() => {
            if (activeSubjectId) {
              setView('subject_home');
            } else {
              setView('dashboard');
            }
          }}
          onUpdateSession={updateSession}
          isMiniMode={isMiniMode}
          setIsMiniMode={setIsMiniMode}
        />
      )}

      {activeSessionId && isMiniMode && view !== 'session' && (
        <div className="fixed inset-0 pointer-events-none z-[100]">
          <div className="pointer-events-auto">
            <SessionView
              session={sessions.find(s => s.id === activeSessionId)!}
              subject={subjects.find(s => s.id === sessions.find(sess => sess.id === activeSessionId)?.subjectId)!}
              onBack={() => { }}
              onUpdateSession={updateSession}
              isMiniMode={true}
              setIsMiniMode={setIsMiniMode}
              onExpand={() => {
                setIsMiniMode(false);
                setView('session');
              }}
            />
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
