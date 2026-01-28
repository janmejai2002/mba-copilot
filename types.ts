
export interface Subject {
  id: string;
  name: string;
  description: string;
  createdAt: number;
}

export interface Session {
  id: string;
  subjectId: string;
  title: string;
  date: number;
  transcript: string; // Flat text version
  turns?: TranscriptionTurn[]; // Structured history
  concepts?: { keyword: string; explanation: string; timestamp: number }[];
  suggestedQuestions?: string[];
  summary?: string;
  examQuestions?: string[];
  groundingFiles?: string[];
  groundingFileDetails?: GroundingFileDetail[];
  aiContext?: string; // User-provided text context
}

export interface GroundingFileDetail {
  id: string;
  name: string;
  type: string;
  data: string; // Base64 or Blob URL (using Base64 for stability in IndexedDB)
  size: number;
}

export interface TranscriptionTurn {
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: number;
}
