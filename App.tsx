import React, { useState, useEffect } from 'react';
import { Subject, Session } from './types';
import Dashboard from './components/Dashboard';
import SessionView from './components/SessionView';
import Layout from './components/Layout';
import { storage } from './services/db';

const App: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [view, setView] = useState<'dashboard' | 'session'>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [isMiniMode, setIsMiniMode] = useState(false);

  // Load persistence from IndexedDB
  useEffect(() => {
    async function initDB() {
      const savedSubjects = await storage.getAllSubjects();
      const savedSessions = await storage.getAllSessions();
      setSubjects(savedSubjects);
      setSessions(savedSessions);
      setIsLoading(false);
    }
    initDB();

    // Check initial prefers-color-scheme
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }
  }, []);

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
      name,
      description,
      createdAt: Date.now()
    };
    await storage.saveSubject(newSubject);
    setSubjects([...subjects, newSubject]);
  };

  const startSession = async (subjectId: string, title: string) => {
    // Check if a session already exists for this subject today
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

  if (isLoading) {
    return <div className="h-screen w-screen flex items-center justify-center font-bold text-black/20 animate-pulse">Initializing Database...</div>;
  }

  return (
    <Layout darkMode={darkMode} onToggleDarkMode={() => setDarkMode(!darkMode)}>
      {view === 'dashboard' ? (
        <>
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
          />
          {activeSessionId && isMiniMode && (
            <div className="fixed inset-0 pointer-events-none z-[100]">
              <div className="pointer-events-auto">
                <SessionView
                  session={sessions.find(s => s.id === activeSessionId)!}
                  subject={subjects.find(s => s.id === sessions.find(sess => sess.id === activeSessionId)?.subjectId)!}
                  onBack={() => setView('dashboard')}
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
        </>
      ) : (
        activeSessionId && (
          <SessionView
            session={sessions.find(s => s.id === activeSessionId)!}
            subject={subjects.find(s => s.id === sessions.find(sess => sess.id === activeSessionId)?.subjectId)!}
            onBack={() => setView('dashboard')}
            onUpdateSession={updateSession}
            isMiniMode={isMiniMode}
            setIsMiniMode={setIsMiniMode}
          />
        )
      )}
    </Layout>
  );
};

export default App;
