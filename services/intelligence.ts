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

        const prompt = `
      You are the Master Scribe for the subject "${subjectName}". 
      Analyze the following lecture materials:
      
      TRANSCRIPT:
      ${fullTranscript}
      
      STUDENT NOTES:
      ${notesSummary}
      
      Q&A BRAINSTORMING:
      ${chatsSummary}
      
      TASK:
      Create a comprehensive, structured, and evolving master document for this subject.
      Use professional academic markdown. Highlight formulas, key dates, and cross-references.
      This doc should be the ULTIMATE resource for the student to revise for exams.
      If this is an update, ensure it flows well with previous content.
    `;

        // In a real implementation with GCP, this would call Vertex AI.
        // For now, we reuse the existing gemini service which we will upgrade.
        const res = await generateSessionInsight(prompt);
        return res.summary;
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
