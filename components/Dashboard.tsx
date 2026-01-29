
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
    <div className="space-y-16 animate-apple-in">

      {/* Today's Agenda Header */}
      {sessionsForToday.length > 0 && (
        <section className="bg-white border border-black/[0.04] rounded-[2.5rem] p-8 md:p-10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-blue-50/50 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-blue-500 rounded-lg shadow-lg shadow-blue-500/20">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/40">Active Schedule • {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {sessionsForToday.map(session => {
                const isNow = session.id === currentClass?.id;
                const subject = subjects.find(sub => sub.id === session.subjectId);
                return (
                  <div
                    key={session.id}
                    onClick={() => onOpenSession(session.id)}
                    className={`p-6 rounded-[2rem] border transition-all cursor-pointer group relative ${isNow ? 'bg-black border-black shadow-2xl shadow-black/10 scale-[1.02]' : 'bg-[#fbfbfd] border-black/[0.04] hover:bg-white'
                      }`}
                  >
                    {isNow && <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest animate-pulse border-2 border-white z-20">Now In Session</div>}
                    <div className="flex justify-between items-start mb-4">
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${isNow ? 'text-white/40' : 'text-black/30'}`}>
                        {new Date(session.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isNow ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); onOpenSession(session.id); }}
                          className="p-3 bg-white text-black rounded-full hover:scale-110 active:scale-90 transition-all shadow-xl shadow-white/10"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-black/[0.03] flex items-center justify-center">
                          <Calendar className="w-3 h-3 text-black/20" />
                        </div>
                      )}
                    </div>
                    <h4 className={`font-bold text-lg leading-tight mb-2 ${isNow ? 'text-white' : 'text-[#1d1d1f]'}`}>{session.title}</h4>
                    <p className={`text-[11px] font-medium truncate ${isNow ? 'text-white/40' : 'text-black/40'}`}>{subject?.name || "Unknown Subject"}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 md:mb-10">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#1d1d1f]">Your Library</h2>
            <p className="text-black/50 mt-1 md:mt-2 text-base md:text-lg font-medium">Manage your academic pillars.</p>
          </div>
          <button
            onClick={() => setShowSubjectModal(true)}
            className="w-full md:w-auto px-8 py-4 bg-black text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-black/80 active:scale-95 transition-all shadow-xl shadow-black/5 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Subject
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {subjects.map(subject => (
            <div
              key={subject.id}
              onClick={() => onOpenSubject(subject.id)}
              className="apple-card p-6 md:p-8 flex flex-col justify-between h-56 md:h-64 cursor-pointer group hover:bg-black/[0.01] relative"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Permanently delete ${subject.name}? This will remove all associated sessions.`)) {
                    onDeleteSubject(subject.id);
                  }
                }}
                className="absolute top-4 right-4 p-2 text-black/10 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all z-20"
                title="Delete Subject"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div>
                <div className="flex justify-between items-start mb-2 md:mb-3">
                  <h3 className="text-xl md:text-2xl font-bold tracking-tight text-[#1d1d1f] group-hover:text-blue-600 transition-colors pr-8">{subject.name}</h3>
                  <div className="w-8 h-8 rounded-full bg-black/[0.03] flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all shadow-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                  </div>
                </div>
                <p className="text-xs md:text-sm text-black/40 leading-relaxed line-clamp-2 md:line-clamp-3 font-medium">{subject.description}</p>
              </div>

              <div className="flex items-center justify-between mt-4">
                <span className="text-[10px] font-bold text-black/20 uppercase tracking-widest">
                  {sessions.filter(s => s.subjectId === subject.id).length} Recordings
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedSubjectId(subject.id); setShowSessionModal(true); }}
                  className="px-4 py-2 bg-black text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-black/80 active:scale-90 transition-all opacity-0 group-hover:opacity-100 shadow-lg shadow-black/10"
                >
                  Start New
                </button>
              </div>
            </div>
          ))}
          {subjects.length === 0 && (
            <div className="col-span-full py-32 text-center apple-card bg-transparent border-dashed border-2 flex flex-col items-center justify-center border-black/10">
              <p className="text-black/30 font-medium font-serif italic">Your library is empty. Let's build your architecture.</p>
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold tracking-tight mb-8 text-[#1d1d1f]">Recent Activity</h2>
        <div className="grid grid-cols-1 gap-4">
          {sessions.slice().reverse().slice(0, 10).map(session => (
            <div
              key={session.id}
              onClick={() => onOpenSession(session.id)}
              className="apple-card p-4 md:p-6 flex items-center justify-between cursor-pointer group hover:bg-black/[0.01]"
            >
              <div className="flex items-center gap-4 md:gap-6 flex-1 min-w-0">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-black/[0.03] flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all duration-300 flex-shrink-0">
                  <Play className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-base md:text-lg text-[#1d1d1f] tracking-tight truncate">{session.title}</h4>
                  <div className="flex items-center gap-2 md:gap-3 mt-1 overflow-hidden">
                    <span className="text-[10px] font-bold text-black/30 uppercase tracking-widest truncate">{subjects.find(s => s.id === session.subjectId)?.name}</span>
                    <span className="w-1 h-1 rounded-full bg-black/10 flex-shrink-0" />
                    <span className="text-[10px] text-black/40 font-medium whitespace-nowrap">{new Date(session.date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 md:gap-4 ml-4">
                {session.summary && (
                  <span className="px-2 md:px-3 py-1 bg-green-50 text-[8px] md:text-[10px] font-bold text-green-600 uppercase tracking-widest rounded-full border border-green-100 flex items-center gap-1 md:gap-1.5 whitespace-nowrap">
                    <span className="w-1 h-1 rounded-full bg-green-500" />
                    Summarized
                  </span>
                )}
                <svg className="w-4 h-4 md:w-5 md:h-5 text-black/20 group-hover:text-black group-hover:translate-x-1 transition-all flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Migration / Maintenance */}
      <div className="flex justify-center py-20 opacity-30 hover:opacity-100 transition-all gap-12 border-t border-black/[0.04]">
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
                    master.turns.push({
                      role: 'system',
                      text: `Session Merge: ${new Date(s.date).toLocaleTimeString()}`,
                      timestamp: s.date
                    });

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
            } catch (e) {
              console.error(e);
              alert("Migration failed.");
            }
          }}
          className="text-[10px] uppercase tracking-widest font-bold border-b border-black hover:text-black transition-colors"
        >
          Consolidate Database
        </button>

        <button
          onClick={onClearAllSubjects}
          className="text-[10px] uppercase tracking-widest font-bold border-b border-red-600 text-red-600 hover:text-red-700 transition-colors"
        >
          Wipe Subject Library
        </button>
      </div>

      {/* Modals */}
      {showSubjectModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl animate-apple-in border border-black/5">
            <h3 className="text-3xl font-bold mb-2 tracking-tight">New Subject</h3>
            <p className="text-black/40 text-sm mb-8 font-medium">Add a new academic pillar to your library.</p>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-black/30 mb-2 block">Name</label>
                <input
                  type="text"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  className="w-full px-5 py-4 bg-black/[0.03] border border-black/[0.05] rounded-2xl text-sm font-medium placeholder:text-black/20 outline-none focus:border-black/20 focus:bg-white transition-all underline-none"
                  placeholder="e.g. Marketing Management"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-black/30 mb-2 block">Description</label>
                <textarea
                  value={newSubjectDesc}
                  onChange={(e) => setNewSubjectDesc(e.target.value)}
                  className="w-full px-5 py-4 bg-black/[0.03] border border-black/[0.05] rounded-2xl text-sm font-medium placeholder:text-black/20 outline-none focus:border-black/20 focus:bg-white transition-all h-28 resize-none"
                  placeholder="Key concepts, syllabus overview..."
                />
              </div>
            </div>
            <div className="mt-10 flex gap-3">
              <button
                onClick={() => setShowSubjectModal(false)}
                className="flex-1 py-4 bg-black/[0.03] text-black/40 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-black/5 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => { onCreateSubject(newSubjectName, newSubjectDesc); setShowSubjectModal(false); setNewSubjectName(''); setNewSubjectDesc(''); }}
                className="flex-1 py-4 bg-black text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-black/10 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {showSessionModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl animate-apple-in border border-black/5">
            <h3 className="text-3xl font-bold mb-2 tracking-tight">Class Session</h3>
            <p className="text-black/40 text-sm mb-8 font-medium">Record and transcribe this lecture.</p>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-black/30 mb-2 block">Session Title</label>
              <input
                type="text"
                autoFocus
                value={newSessionTitle}
                onChange={(e) => setNewSessionTitle(e.target.value)}
                className="w-full px-5 py-4 bg-black/[0.03] border border-black/[0.05] rounded-2xl text-sm font-medium placeholder:text-black/20 outline-none focus:border-black/20 focus:bg-white transition-all"
                placeholder="e.g. Week 4: Brand Strategy"
              />
            </div>
            <div className="mt-10 flex gap-3">
              <button
                onClick={() => setShowSessionModal(false)}
                className="flex-1 py-4 bg-black/[0.03] text-black/40 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-black/5 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => { onStartSession(selectedSubjectId!, newSessionTitle); setShowSessionModal(false); setNewSessionTitle(''); }}
                className="flex-1 py-4 bg-black text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-black/10 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Begin Copilot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
