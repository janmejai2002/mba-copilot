import { Session, TranscriptionTurn, Note, Concept } from '../types';
import { generateSessionInsight } from './gemini';
import { extractKeywords, explainConcept } from './perplexity';

export interface MasterIntelligenceUpdate {
    masterNote: string;
    newConcepts: Concept[];
    suggestedQuestions: string[];
}

class MasterIntelligenceService {
    private static instance: MasterIntelligenceService;

    public static getInstance(): MasterIntelligenceService {
        if (!MasterIntelligenceService.instance) {
            MasterIntelligenceService.instance = new MasterIntelligenceService();
        }
        return MasterIntelligenceService.instance;
    }

    /**
     * Synthesizes a "Master Doc" from all session data
     * This is a "heavy" call designed for Gemini 1.5 Pro (via Google Cloud credits)
     */
    public async synthesizeMasterDoc(
        transcript: TranscriptionTurn[],
        existingNotes: Note[],
        chats: any[],
        subjectName: string
    ): Promise<string> {
        const fullTranscript = transcript.map(t => t.text).join('\n');
        const notesSummary = existingNotes.map(n => n.content).join('\n');
        const chatsSummary = chats.map(c => `Q: ${c.text}\nAI: ${c.response}`).join('\n');

        console.log("🚀 Calling Agentic Synthesis on GCP...");

        try {
            const response = await fetch('/api/agent/synthesis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject: subjectName,
                    transcript: fullTranscript,
                    notes: notesSummary,
                    chats: chatsSummary
                })
            });

            if (!response.ok) throw new Error("Synthesis Agent failed");
            const data = await response.json();
            return data.master_doc;
        } catch (error) {
            console.error("Agentic Synthesis failed, falling back to basic Gemini:", error);
            const res = await generateSessionInsight(fullTranscript);
            return res.summary;
        }
    }

    /**
     * Identifies logical links between concepts based on timestamps
     */
    public async mapTimelineConnections(concepts: Concept[], transcript: TranscriptionTurn[]): Promise<any[]> {
        // Logic to find which concepts were discussed near each other in time
        return concepts.map(c => ({
            ...c,
            timelineLink: transcript.findIndex(t => t.timestamp === c.timestamp)
        }));
    }
}

export const masterIntelligence = MasterIntelligenceService.getInstance();
