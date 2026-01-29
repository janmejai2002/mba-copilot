
import React, { useState } from 'react';
import { Subject, Session } from '../types';
import { X, Clock, Play, Calendar, AlertCircle, Plus, Trash2 } from 'lucide-react';

interface DashboardProps {
  subjects: Subject[];
  sessions: Session[];
  onCreateSubject: (name: string, description: string) => void;
  onStartSession: (subjectId: string, title: string) => void;
  onOpenSession: (id: string) => void;
  onOpenSubject: (id: string) => void;
  onDeleteSubject: (id: string) => void;
  onClearAllSubjects: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  subjects,
  sessions,
  onCreateSubject,
  onStartSession,
  onOpenSession,
  onOpenSubject,
  onDeleteSubject,
  onClearAllSubjects
}) => {
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectDesc, setNewSubjectDesc] = useState('');

  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState('');

  const todayStr = new Date().toDateString();
  const sessionsForToday = sessions
    .filter(s => new Date(s.date).toDateString() === todayStr)
    .sort((a, b) => a.date - b.date);

  const currentClass = sessionsForToday.find(s => {
    const now = Date.now();
    // Class is "current" if it's within 90 mins of start time
    return now >= s.date && now <= (s.date + 1.5 * 3600 * 1000);
  });

  return (
    <div className="space-y-24 animate-apple-in">

      {/* Today's Agenda Header */}
      {sessionsForToday.length > 0 && (
        <section className="vidyos-card relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-[var(--vidyos-teal-light)] to-transparent pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-10">
              <div className="p-3 bg-[var(--vidyos-teal)] rounded-2xl shadow-xl shadow-[var(--vidyos-teal-glow)]">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <h3 className="label-caps mb-0 pt-1">Active Schedule • {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {sessionsForToday.map(session => {
                const isNow = session.id === currentClass?.id;
                const subject = subjects.find(sub => sub.id === session.subjectId);
                return (
                  <div
                    key={session.id}
                    onClick={() => onOpenSession(session.id)}
                    className={`p-8 rounded-[2.5rem] border transition-all cursor-pointer group relative ${isNow ? 'bg-[var(--text-main)] border-[var(--text-main)] shadow-2xl scale-[1.05] z-20' : 'bg-white/50 border-[var(--glass-border)] hover:bg-white'
                      }`}
                  >
                    {isNow && <div className="absolute -top-3 -right-3 bg-red-500 text-white text-[9px] font-900 px-3 py-1.5 rounded-full uppercase tracking-widest animate-pulse border-4 border-white dark:border-slate-900 z-30">Live Now</div>}
                    <div className="flex justify-between items-start mb-6">
                      <span className={`text-[11px] font-black uppercase tracking-widest ${isNow ? 'text-white/50' : 'text-[var(--vidyos-teal)]'}`}>
                        {new Date(session.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isNow ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); onOpenSession(session.id); }}
                          className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 active:scale-90 transition-all shadow-2xl"
                        >
                          <Play className="w-5 h-5 fill-current" />
                        </button>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center">
                          <Calendar className="w-4 h-4 text-[var(--text-muted)]" />
                        </div>
                      )}
                    </div>
                    <h4 className={`font-black text-xl leading-snug mb-3 ${isNow ? 'text-white' : 'text-[var(--text-main)]'}`}>{session.title}</h4>
                    <p className={`text-[12px] font-bold tracking-wide truncate ${isNow ? 'text-white/50' : 'text-[var(--text-muted)]'}`}>{subject?.name || "Unknown Subject"}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
          <div>
            <span className="label-caps">Academic Assets</span>
            <h2 className="section-title">Your Library</h2>
          </div>
          <button
            onClick={() => setShowSubjectModal(true)}
            className="btn-fusion"
          >
            <Plus className="w-5 h-5" />
            Add Subject
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {subjects.map(subject => (
            <div
              key={subject.id}
              onClick={() => onOpenSubject(subject.id)}
              className="vidyos-card min-h-[300px] flex flex-col justify-between cursor-pointer group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--vidyos-teal-light)] rounded-full -mr-16 -mt-16 transition-all group-hover:scale-150 group-hover:bg-[var(--vidyos-teal-glow)] opacity-50" />

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Permanently delete ${subject.name}? This will remove all associated sessions.`)) {
                    onDeleteSubject(subject.id);
                  }
                }}
                className="absolute top-6 right-6 p-2 text-black/10 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all z-20"
                title="Delete Subject"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-2xl font-black tracking-tight text-[var(--text-main)] group-hover:text-[var(--vidyos-teal)] transition-colors pr-10">{subject.name}</h3>
                  <div className="w-12 h-12 rounded-full border border-[var(--glass-border)] flex items-center justify-center group-hover:bg-[var(--text-main)] group-hover:text-white transition-all shadow-premium">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                  </div>
                </div>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed line-clamp-3 font-semibold opacity-80">{subject.description}</p>
              </div>

              <div className="flex items-center justify-between mt-10 relative z-10">
                <span className="text-[11px] font-black text-[var(--vidyos-teal)] uppercase tracking-widest opacity-60">
                  {sessions.filter(s => s.subjectId === subject.id).length} Recordings
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedSubjectId(subject.id); setShowSessionModal(true); }}
                  className="btn-fusion"
                  style={{ padding: '10px 20px', fontSize: '0.7rem' }}
                >
                  Start New
                </button>
              </div>
            </div>
          ))}
          {subjects.length === 0 && (
            <div className="col-span-full py-40 text-center vidyos-card bg-transparent border-dashed border-2 flex flex-col items-center justify-center border-[var(--glass-border)]">
              <p className="text-[var(--text-muted)] font-black text-xl uppercase tracking-widest opacity-30 italic">Library Empty • Architecture Required</p>
            </div>
          )}
        </div>
      </section>

      <section>
        <div className="mb-10">
          <span className="label-caps">Historical Data</span>
          <h2 className="text-3xl font-black tracking-tight text-[var(--text-main)]">Recent Synthesis</h2>
        </div>
        <div className="grid grid-cols-1 gap-6">
          {sessions.slice().reverse().slice(0, 10).map(session => (
            <div
              key={session.id}
              onClick={() => onOpenSession(session.id)}
              className="vidyos-card p-6 md:p-8 flex items-center justify-between cursor-pointer group hover:bg-white"
            >
              <div className="flex items-center gap-6 flex-1 min-w-0">
                <div className="w-14 h-14 rounded-2xl border border-[var(--glass-border)] flex items-center justify-center group-hover:bg-[var(--text-main)] group-hover:text-white transition-all duration-500 flex-shrink-0 shadow-premium">
                  <Play className="w-5 h-5 fill-current" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-xl text-[var(--text-main)] tracking-tight truncate">{session.title}</h4>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-[11px] font-black text-[var(--vidyos-teal)] uppercase tracking-widest">{subjects.find(s => s.id === session.subjectId)?.name}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--vidyos-teal-light)]" />
                    <span className="text-[11px] text-[var(--text-muted)] font-bold uppercase tracking-wide opacity-60">{new Date(session.date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6 ml-6">
                {session.summary && (
                  <span className="px-4 py-1.5 bg-[var(--vidyos-teal-light)] text-[10px] font-black text-[var(--vidyos-teal)] uppercase tracking-widest rounded-full border border-[var(--vidyos-teal-glow)] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--vidyos-teal)]" />
                    Synthesized
                  </span>
                )}
                <div className="w-10 h-10 rounded-full border border-[var(--glass-border)] flex items-center justify-center group-hover:bg-[var(--vidyos-teal)] group-hover:text-white transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Migration / Maintenance */}
      <div className="flex flex-col md:flex-row items-center justify-center py-24 gap-12 border-t border-[var(--glass-border)] opacity-40 hover:opacity-100 transition-all">
        <button
          onClick={async () => {
            if (!confirm("This will merge all separate sessions from the same day into single master sessions. Continue?")) return;
            try {
              const { db } = await import('../services/db');
              const allSessions = await db.sessions.toArray();
              const sessionsBySubjectAndDate: { [key: string]: Session[] } = {};
              allSessions.forEach(session => {
                const dateKey = new Date(session.date).toDateString();
                const key = `${session.subjectId}_${dateKey}`;
                if (!sessionsBySubjectAndDate[key]) sessionsBySubjectAndDate[key] = [];
                sessionsBySubjectAndDate[key].push(session);
              });
              let mergeCount = 0;
              for (const key in sessionsBySubjectAndDate) {
                const group = sessionsBySubjectAndDate[key];
                if (group.length > 1) {
                  group.sort((a, b) => a.date - b.date);
                  const master = group[0];
                  for (let i = 1; i < group.length; i++) {
                    const s = group[i];
                    if (!master.turns) master.turns = [];
                    master.turns.push({ role: 'system', text: `Session Merge: ${new Date(s.date).toLocaleTimeString()}`, timestamp: s.date });
                    if (s.turns) master.turns = master.turns.concat(s.turns);
                    master.transcript += '\n\n' + (s.transcript || '');
                    if (s.groundingFiles) master.groundingFiles = [...(master.groundingFiles || []), ...s.groundingFiles];
                    if (s.groundingFileDetails) master.groundingFileDetails = [...(master.groundingFileDetails || []), ...s.groundingFileDetails];
                    if (s.concepts) master.concepts = [...(master.concepts || []), ...s.concepts];
                    await db.sessions.delete(s.id);
                  }
                  if (master.groundingFiles) master.groundingFiles = [...new Set(master.groundingFiles)];
                  await db.sessions.put(master);
                  mergeCount++;
                }
              }
              alert(`Consolidation Complete! Merged ${mergeCount} daily groups.`);
              window.location.reload();
            } catch (e) { console.error(e); alert("Migration failed."); }
          }}
          className="text-[11px] uppercase tracking-[0.3em] font-black border-b-2 border-[var(--text-main)] hover:text-[var(--vidyos-teal)] hover:border-[var(--vidyos-teal)] transition-all"
        >
          Optimize Neural Core
        </button>

        <button
          onClick={onClearAllSubjects}
          className="text-[11px] uppercase tracking-[0.3em] font-black border-b-2 border-red-500 text-red-500 hover:text-red-700 transition-all"
        >
          Purge Cognitive Framework
        </button>
      </div>

      {/* Modals */}
      {showSubjectModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-white/10 backdrop-blur-md p-4 px-6">
          <div className="vidyos-card max-w-lg w-full shadow-2xl animate-scale-in border-[var(--vidyos-teal-glow)] bg-white/90">
            <h3 className="text-4xl font-black mb-3 tracking-tight text-[var(--text-main)]">New Subject</h3>
            <p className="text-[var(--text-muted)] text-md mb-10 font-bold opacity-70">Define a new academic pillar in your library.</p>
            <div className="space-y-8">
              <div>
                <label className="label-caps opacity-50">Subject Name</label>
                <input
                  type="text"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  className="w-full px-6 py-5 bg-black/5 border border-transparent rounded-[2rem] text-md font-bold placeholder:text-black/10 outline-none focus:bg-white focus:border-[var(--vidyos-teal-glow)] transition-all"
                  placeholder="e.g. Strategic Management"
                />
              </div>
              <div>
                <label className="label-caps opacity-50">Description</label>
                <textarea
                  value={newSubjectDesc}
                  onChange={(e) => setNewSubjectDesc(e.target.value)}
                  className="w-full px-6 py-5 bg-black/5 border border-transparent rounded-[2rem] text-md font-bold placeholder:text-black/10 outline-none focus:bg-white focus:border-[var(--vidyos-teal-glow)] transition-all h-40 resize-none"
                  placeholder="Goals, syllabus, key objectives..."
                />
              </div>
            </div>
            <div className="mt-12 flex gap-4">
              <button
                onClick={() => setShowSubjectModal(false)}
                className="flex-1 py-5 bg-black/5 text-[var(--text-muted)] rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-black/10 transition-all font-outfit"
              >
                Cancel
              </button>
              <button
                onClick={() => { onCreateSubject(newSubjectName, newSubjectDesc); setShowSubjectModal(false); setNewSubjectName(''); setNewSubjectDesc(''); }}
                className="flex-1 btn-fusion"
              >
                Create Asset
              </button>
            </div>
          </div>
        </div>
      )}

      {showSessionModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-white/10 backdrop-blur-md p-4 px-6">
          <div className="vidyos-card max-w-lg w-full shadow-2xl animate-scale-in border-[var(--vidyos-teal-glow)] bg-white/90">
            <h3 className="text-4xl font-black mb-3 tracking-tight text-[var(--text-main)]">Class Session</h3>
            <p className="text-[var(--text-muted)] text-md mb-10 font-bold opacity-70">Initiate live cognitive capture.</p>
            <div className="space-y-8">
              <div>
                <label className="label-caps opacity-50">Session Title</label>
                <input
                  type="text"
                  autoFocus
                  value={newSessionTitle}
                  onChange={(e) => setNewSessionTitle(e.target.value)}
                  className="w-full px-6 py-5 bg-black/5 border border-transparent rounded-[2rem] text-md font-bold placeholder:text-black/10 outline-none focus:bg-white focus:border-[var(--vidyos-teal-glow)] transition-all"
                  placeholder="e.g. Lecture 04: Brand Topology"
                />
              </div>
            </div>
            <div className="mt-12 flex gap-4">
              <button
                onClick={() => setShowSessionModal(false)}
                className="flex-1 py-5 bg-black/5 text-[var(--text-muted)] rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-black/10 transition-all font-outfit"
              >
                Cancel
              </button>
              <button
                onClick={() => { onStartSession(selectedSubjectId!, newSessionTitle); setShowSessionModal(false); setNewSessionTitle(''); }}
                className="flex-1 btn-fusion"
              >
                Begin Capture
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
