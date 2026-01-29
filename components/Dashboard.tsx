
import React, { useState } from 'react';
import { Subject, Session } from '../types';

interface DashboardProps {
  subjects: Subject[];
  sessions: Session[];
  onCreateSubject: (name: string, description: string) => void;
  onStartSession: (subjectId: string, title: string) => void;
  onOpenSession: (id: string) => void;
  onOpenSubject: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ subjects, sessions, onCreateSubject, onStartSession, onOpenSession, onOpenSubject }) => {
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectDesc, setNewSubjectDesc] = useState('');

  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState('');

  return (
    <div className="space-y-16 animate-apple-in">
      <section>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 md:mb-10">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#1d1d1f]">Your Library</h2>
            <p className="text-black/50 mt-1 md:mt-2 text-base md:text-lg font-medium">Manage your academic pillars.</p>
          </div>
          <button
            onClick={() => setShowSubjectModal(true)}
            className="w-full md:w-auto px-8 py-3 apple-btn-primary hover:opacity-90 active:scale-95 text-sm"
          >
            Add Subject
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {subjects.map(subject => (
            <div
              key={subject.id}
              onClick={() => onOpenSubject(subject.id)}
              className="apple-card p-6 md:p-8 flex flex-col justify-between h-56 md:h-64 cursor-pointer group hover:bg-black/[0.01]"
            >
              <div>
                <div className="flex justify-between items-start mb-2 md:mb-3">
                  <h3 className="text-xl md:text-2xl font-bold tracking-tight text-[#1d1d1f] group-hover:text-blue-600 transition-colors">{subject.name}</h3>
                  <div className="w-8 h-8 rounded-full bg-black/[0.03] flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                  </div>
                </div>
                <p className="text-xs md:text-sm text-black/50 leading-relaxed line-clamp-2 md:line-clamp-3 font-medium">{subject.description}</p>
              </div>

              <div className="flex items-center justify-between mt-4">
                <span className="text-[10px] font-bold text-black/30 uppercase tracking-widest">
                  {sessions.filter(s => s.subjectId === subject.id).length} Recordings
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedSubjectId(subject.id); setShowSessionModal(true); }}
                  className="px-4 py-2 bg-black text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-black/80 active:scale-90 transition-all opacity-0 group-hover:opacity-100"
                >
                  Start New
                </button>
              </div>
            </div>
          ))}
          {subjects.length === 0 && (
            <div className="col-span-full py-32 text-center apple-card bg-transparent border-dashed border-2 flex flex-col items-center justify-center border-black/10">
              <p className="text-black/30 font-medium">Your library is empty. Add your first subject to begin.</p>
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold tracking-tight mb-8 text-[#1d1d1f]">Recent Activity</h2>
        <div className="grid grid-cols-1 gap-4">
          {sessions.slice().reverse().map(session => (
            <div
              key={session.id}
              onClick={() => onOpenSession(session.id)}
              className="apple-card p-4 md:p-6 flex items-center justify-between cursor-pointer group hover:bg-black/[0.01]"
            >
              <div className="flex items-center gap-4 md:gap-6 flex-1 min-w-0">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-black/[0.03] flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all duration-300 flex-shrink-0">
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
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
                    <span className="hidden sm:inline">Summarized</span>
                    <span className="sm:hidden">Ready</span>
                  </span>
                )}
                <svg className="w-4 h-4 md:w-5 md:h-5 text-black/20 group-hover:text-black group-hover:translate-x-1 transition-all flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Migration / Maintenance */}
      <div className="flex justify-center py-10 opacity-30 hover:opacity-100 transition-opacity gap-12">
        <button
          onClick={async () => {
            if (!confirm("This will merge all separate sessions from the same day into single master sessions. Continue?")) return;

            try {
              const { MBADatabase } = await import('../services/db');
              const db = new MBADatabase();
              await db.open();

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
              alert(`Consolidation Complete! Merged ${mergeCount} daily groups. Please refresh the page.`);
              window.location.reload();
            } catch (e) {
              console.error(e);
              alert("Migration failed. See console.");
            }
          }}
          className="text-[10px] uppercase tracking-widest font-bold border-b border-black"
        >
          Consolidate Database
        </button>

        <button
          onClick={async () => {
            try {
              const res = await fetch('/timetable.json');
              if (!res.ok) throw new Error("No timetable file found. Run 'node scripts/fetch_timetable.js' first.");

              const data = await res.json();
              if (!Array.isArray(data) || data.length === 0) {
                alert("Timetable file is empty.");
                return;
              }

              const { MBADatabase } = await import('../services/db');
              const db = new MBADatabase();
              await db.open();

              let added = 0;
              const uniqueSubjects = new Set<string>();

              data.forEach((row: any) => {
                if (row[1]) uniqueSubjects.add(row[1]);
              });

              for (const name of uniqueSubjects) {
                const exists = await db.subjects.where('name').equals(name).first();
                if (!exists && name.length > 2) {
                  await db.subjects.add({
                    id: crypto.randomUUID(),
                    name: name,
                    description: 'Imported from ERP Timetable',
                    createdAt: Date.now()
                  });
                  added++;
                }
              }

              alert(`Import successful! Added ${added} new subjects.`);
              window.location.reload();

            } catch (e) {
              alert(e);
            }
          }}
          className="text-[10px] uppercase tracking-widest font-bold border-b border-blue-600 text-blue-600"
        >
          Import Timetable
        </button>
      </div>

      {/* Modals */}
      {showSubjectModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-bold mb-6">New Subject</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-black/40 mb-1 block">Name</label>
                <input
                  type="text"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-black/10 focus:ring-1 focus:ring-black outline-none transition-all"
                  placeholder="e.g. Marketing Management"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-black/40 mb-1 block">Description</label>
                <textarea
                  value={newSubjectDesc}
                  onChange={(e) => setNewSubjectDesc(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-black/10 focus:ring-1 focus:ring-black outline-none transition-all h-24"
                  placeholder="Key concepts, syllabus overview..."
                />
              </div>
            </div>
            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setShowSubjectModal(false)}
                className="flex-1 py-3 border border-black/10 rounded-xl text-sm font-semibold hover:bg-black/5 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => { onCreateSubject(newSubjectName, newSubjectDesc); setShowSubjectModal(false); setNewSubjectName(''); setNewSubjectDesc(''); }}
                className="flex-1 py-3 bg-black text-white rounded-xl text-sm font-semibold hover:bg-black/80 transition-all"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {showSessionModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-bold mb-2">Class Session</h3>
            <p className="text-black/50 text-sm mb-6">Record and transcribe this lecture.</p>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-black/40 mb-1 block">Session Title</label>
              <input
                type="text"
                value={newSessionTitle}
                onChange={(e) => setNewSessionTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-black/10 focus:ring-1 focus:ring-black outline-none transition-all"
                placeholder="e.g. Week 4: Brand Strategy"
              />
            </div>
            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setShowSessionModal(false)}
                className="flex-1 py-3 border border-black/10 rounded-xl text-sm font-semibold hover:bg-black/5 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => { onStartSession(selectedSubjectId!, newSessionTitle); setShowSessionModal(false); setNewSessionTitle(''); }}
                className="flex-1 py-3 bg-black text-white rounded-xl text-sm font-semibold hover:bg-black/80 transition-all"
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
