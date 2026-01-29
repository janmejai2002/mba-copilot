
import React, { useState } from 'react';

interface ExtractedClass {
    date: string;
    time: string;
    subject: string;
    room: string;
    faculty: string;
    raw: string;
}

const TimetableValidator: React.FC = () => {
    const [csvUrl, setCsvUrl] = useState('https://docs.google.com/spreadsheets/d/1Q11tXArxJqN9aUMRSSwpbKJss6xzy0OAwVwmUzgHaTw/export?format=csv&gid=0');
    const [status, setStatus] = useState<'idle' | 'fetching' | 'analyzing' | 'done' | 'error'>('idle');
    const [log, setLog] = useState<string[]>([]);
    const [classes, setClasses] = useState<ExtractedClass[]>([]);
    const [error, setError] = useState<string | null>(null);

    const addLog = (msg: string) => setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

    const analyzeTimetable = async () => {
        setStatus('fetching');
        setLog([]);
        setClasses([]);
        setError(null);
        addLog(`Initiating fetch from source: ${csvUrl}`);

        try {
            const response = await fetch(csvUrl);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const text = await response.text();
            addLog(`Successfully fetched ${text.length} bytes of raw CSV data.`);

            setStatus('analyzing');
            addLog("Starting structure analysis...");

            // Robust CSV parser that handles newlines inside quotes
            const parseFullCSV = (data: string) => {
                const rows = [];
                let currentColumn = '';
                let currentRow: string[] = [];
                let inQuotes = false;

                for (let i = 0; i < data.length; i++) {
                    const char = data[i];
                    const nextChar = data[i + 1];

                    if (char === '"') {
                        if (inQuotes && nextChar === '"') {
                            currentColumn += '"';
                            i++;
                        } else {
                            inQuotes = !inQuotes;
                        }
                    } else if (char === ',' && !inQuotes) {
                        currentRow.push(currentColumn.trim());
                        currentColumn = '';
                    } else if ((char === '\r' || char === '\n') && !inQuotes) {
                        if (currentRow.length > 0 || currentColumn !== '') {
                            currentRow.push(currentColumn.trim());
                            rows.push(currentRow);
                        }
                        currentColumn = '';
                        currentRow = [];
                        if (char === '\r' && nextChar === '\n') i++;
                    } else {
                        currentColumn += char;
                    }
                }
                if (currentColumn !== '' || currentRow.length > 0) {
                    currentRow.push(currentColumn.trim());
                    rows.push(currentRow);
                }
                return rows;
            };

            const allRows = parseFullCSV(text);
            addLog(`Total CSV rows detected: ${allRows.length}`);

            const header = allRows[0] || [];
            addLog(`Detected Headers: ${header.slice(0, 5).join(' | ')} (Bounded A-E)`);

            // 1. Build Course Look-up Table (Scanning columns H-K)
            const courseLookup: Record<string, { name: string; faculty: string }> = {};
            addLog("Reading faculty/mapping catalog (H-K)...");

            allRows.forEach((row, idx) => {
                const code = row[7]?.trim(); // Column H
                const name = row[8]?.trim(); // Column I
                const facultyArr = row[10]?.trim(); // Column K

                if (code && name && code !== "Course Code") {
                    courseLookup[code] = { name, faculty: facultyArr || "Unknown" };
                }
            });
            addLog(`Built lookup index for ${Object.keys(courseLookup).length} subjects.`);

            // 2. Define Time Slots (Bounded to B-E)
            const slots = [
                { index: 1, time: header[1] || '09:00 AM - 10:30 AM' },
                { index: 2, time: header[2] || '11:00 AM - 12:30 PM' },
                { index: 3, time: header[3] || '14:00 PM - 15:30 PM' },
                { index: 4, time: header[4] || '16:00 PM - 17:30 PM' }
            ];

            const extracted: ExtractedClass[] = [];
            let currentActiveDate = "";
            const dateAnchorRegex = /^[A-Z][a-z]{2}\s\d{1,2}.*?\d{4}/;

            addLog("Extracting curriculum grid from Row 10...");
            // i=9 is the 10th row
            for (let i = 9; i < allRows.length; i++) {
                const row = allRows[i];
                if (!row) continue;

                // Sync the date context
                const rawDateCell = row[0] || "";
                if (dateAnchorRegex.test(rawDateCell)) {
                    currentActiveDate = rawDateCell;
                }

                if (!currentActiveDate) continue;

                // Only scan columns index 1, 2, 3, 4 (B, C, D, E)
                slots.forEach(slot => {
                    const content = row[slot.index];
                    if (content && content.includes('[') && content.length > 3) {
                        const parts = content.split('\n').map(p => p.trim());
                        const subjectPart = parts[0] || "";

                        // Extract Code and Room
                        const subjectCode = subjectPart.split('[')[0]?.trim() || "Unknown";
                        const room = subjectPart.match(/\[(.*?)\]/)?.[1] || "Unknown";

                        // Direct extraction of Session and Section from the entire cell
                        const sessionMatch = content.match(/\[(\d+)\]/);
                        const sectionMatch = content.match(/\[([EFG])\]/i);

                        const sessionNum = sessionMatch ? sessionMatch[1] : "?";
                        const sectionLetter = sectionMatch ? sectionMatch[1].toUpperCase() : "?";

                        // Final data assembly
                        const lookup = courseLookup[subjectCode];
                        const subjectName = lookup ? lookup.name : subjectCode;

                        // Faculty check (Full name or Initials fallback)
                        let faculty = lookup ? lookup.faculty : parts[1]?.replace(/[\[\]]/g, '');
                        if (!faculty || faculty === "Unknown") faculty = parts[1]?.replace(/[\[\]]/g, '') || "Unknown";

                        extracted.push({
                            date: currentActiveDate,
                            time: slot.time,
                            subject: `${subjectName} (Session ${sessionNum})`,
                            room: room,
                            faculty: `${faculty} [Sec ${sectionLetter}]`,
                            raw: content
                        });
                    }
                });
            }

            setClasses(extracted);
            addLog(`Protocol synchronized. Extracted ${extracted.length} valid class entries.`);
            setStatus('done');

        } catch (err: any) {
            setError(err.message);
            setStatus('error');
            addLog(`ERROR: ${err.message}`);
        }
    };

    return (
        <div className="p-10 bg-[#050505] text-white min-h-screen font-sans selection:bg-white selection:text-black">
            <div className="max-w-[1400px] mx-auto">
                <header className="mb-20 border-b border-white/5 pb-10">
                    <h1 className="text-6xl font-black tracking-tighter mb-4 italic uppercase bg-gradient-to-r from-white to-white/20 bg-clip-text text-transparent">Grid Analyst</h1>
                    <div className="flex items-center gap-4">
                        <div className="px-3 py-1 bg-white/10 text-white/40 font-mono text-[10px] tracking-widest rounded-full uppercase">ERP Synchronization Protocol</div>
                        <div className="h-[1px] flex-1 bg-white/5" />
                    </div>
                </header>

                <div className="grid lg:grid-cols-12 gap-10">
                    {/* Control Core */}
                    <div className="lg:col-span-4 space-y-10">
                        <section className="bg-white/[0.02] border border-white/5 p-8 rounded-sm">
                            <label className="block text-[10px] font-bold uppercase tracking-[0.4em] text-white/30 mb-6">Source Target</label>
                            <input
                                type="text"
                                className="w-full bg-black border border-white/10 p-4 mb-8 font-mono text-xs focus:outline-none focus:border-white/40 transition-all text-white/60"
                                value={csvUrl}
                                onChange={(e) => setCsvUrl(e.target.value)}
                            />
                            <button
                                onClick={analyzeTimetable}
                                disabled={status === 'fetching' || status === 'analyzing'}
                                className="w-full py-6 bg-white text-black font-black uppercase tracking-[0.3em] text-[10px] hover:invert transition-all disabled:opacity-20"
                            >
                                {status === 'fetching' || status === 'analyzing' ? 'Processing Signals...' : 'Run Extraction Logic'}
                            </button>
                        </section>

                        <section className="bg-black border border-white/5 rounded-sm overflow-hidden">
                            <div className="px-8 py-4 bg-white/5 border-b border-white/5 text-[9px] font-bold tracking-widest text-white/30 uppercase">Neural Log</div>
                            <div className="p-8 h-[400px] overflow-y-auto font-mono text-[10px] leading-relaxed space-y-3 scrollbar-hide">
                                {log.map((l, i) => (
                                    <div key={i} className="text-white/40 border-l-2 border-white/10 pl-4 py-1 hover:border-white/30 transition-all">
                                        <span className="text-white/10 mr-2">{i.toString().padStart(3, '0')}</span>
                                        {l}
                                    </div>
                                ))}
                                {(status === 'fetching' || status === 'analyzing') && <div className="animate-pulse text-white mt-4">_EXEC_PROTOCOL...</div>}
                                {log.length === 0 && <div className="text-white/5 italic">Awaiting kernel initialization...</div>}
                            </div>
                        </section>
                    </div>

                    {/* Data Visualization */}
                    <div className="lg:col-span-8">
                        <div className="flex items-center justify-between mb-8">
                            <label className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/30 italic">Validated Entities</label>
                            {classes.length > 0 && <span className="text-[10px] font-mono text-green-500 bg-green-500/5 px-3 py-1 rounded-full border border-green-500/20">{classes.length} Entities Parsed</span>}
                        </div>

                        <div className="bg-white/[0.01] border border-white/5 rounded-sm min-h-[600px] backdrop-blur-3xl">
                            {status === 'idle' && (
                                <div className="h-[600px] flex flex-col items-center justify-center space-y-6 opacity-30">
                                    <div className="w-20 h-20 border border-white/10 flex items-center justify-center animate-spin-slow">
                                        <div className="w-10 h-10 border border-white/20" />
                                    </div>
                                    <div className="font-mono text-[10px] tracking-[0.5em] uppercase pointer-events-none">Awaiting Analysis</div>
                                </div>
                            )}

                            {status === 'done' && (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-white/5 text-white/20 font-mono text-[9px] uppercase tracking-[0.3em]">
                                                <th className="p-6 font-medium">Temporal Signature</th>
                                                <th className="p-6 font-medium">Slot</th>
                                                <th className="p-6 font-medium">Curriculum</th>
                                                <th className="p-6 font-medium">Venue</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/[0.02]">
                                            {classes.map((cls, idx) => (
                                                <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                                                    <td className="p-6">
                                                        <div className="text-xs font-mono text-white/40">{cls.date.replace(/["\n]/g, '')}</div>
                                                    </td>
                                                    <td className="p-6">
                                                        <div className="text-xs font-mono text-white/60 tracking-tighter">{cls.time}</div>
                                                    </td>
                                                    <td className="p-6">
                                                        <div className="text-sm font-bold tracking-tight mb-1">{cls.subject}</div>
                                                        <div className="text-[10px] text-white/30 font-medium tracking-wide">{cls.faculty}</div>
                                                    </td>
                                                    <td className="p-6">
                                                        <div className="text-[10px] font-mono text-white/40 bg-white/5 py-1 px-3 inline-block border border-white/5">{cls.room}</div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {status === 'done' && classes.length > 0 && (
                                <div className="p-10 border-t border-white/5 bg-white/[0.005]">
                                    <div className="flex items-center justify-between p-8 border border-white/5 bg-black rounded-lg">
                                        <div>
                                            <div className="text-white text-sm font-bold mb-1 italic">Reconciliation Ready</div>
                                            <div className="text-white/40 text-xs">Verify the data mappings above to finalize integration.</div>
                                        </div>
                                        <div className="flex gap-4">
                                            <button className="px-8 py-3 bg-white text-black text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">Apply to Core</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .animate-spin-slow { animation: spin 8s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                ::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};

export default TimetableValidator;
