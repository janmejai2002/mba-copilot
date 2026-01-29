
export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  accessToken: string;
  expiresAt: number;
}

export interface Concept {
  keyword: string;
  explanation: string;
  timestamp: number;
  depth?: number; // 0 = root, 1-3 = nested layers
  parentId?: string; // Reference to parent concept
  children?: Concept[]; // Nested sub-concepts
  isExpanded?: boolean; // AI-generated expansion flag
  connections?: string[]; // IDs of related concepts
  category?: 'formula' | 'trend' | 'example' | 'concept' | 'definition';
}

export interface Subject {
  id: string;
  userId?: string;
  name: string;
  code?: string; // Short code like FM2, OPR, etc.
  faculty?: string; // Professor name
  description?: string;
  createdAt: number;
  masterDoc?: string;
  masterDocUpdated?: number;
}

export interface Session {
  id: string;
  userId?: string;
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
  volumeBoost?: number;
  notes?: Note[];
}

export interface GroundingFileDetail {
  id: string;
  name: string;
  type: string;
  data: string; // Base64 or Blob URL (using Base64 for stability in IndexedDB)
  size: number;
}

export interface GroundingMaterial {
  id: string;
  subjectId: string;
  name: string;
  type: string;
  data: string; // Base64
  size: number;
  uploadedAt: number;
  status: 'indexed' | 'processing' | 'failed';
}

export interface TranscriptionTurn {
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: number;
}

export interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'file';
  url: string; // Base64 or Blob URL
  size: number;
}

export interface Note {
  id: string;
  sessionId: string;
  timestamp: number; // Linked to recording time
  content: string;
  attachments?: Attachment[];
  type: 'insight' | 'question' | 'todo';
  status: 'pending' | 'committed';
}

export interface SubjectKnowledgeBase {
  subjectId: string;
  totalHours: number;
  keyThemes: string[];
  aggregatedNotes: Note[];
}

export interface VidyosUser extends GoogleUser {
  credits: number;
  isSovereign: boolean;
  tier: 'Synthesist' | 'Sovereign';
  lastRechargeAt?: number;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  amount: number; // Positive for recharge, negative for consumption
  type: 'recharge' | 'transcription' | 'synthesis' | 'exam_nexus';
  description: string;
  timestamp: number;
}
