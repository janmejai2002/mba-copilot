
import { DEFAULT_MODEL, GEMINI_MODELS } from '../constants/models';

// No longer using direct AI SDK in frontend for security - calls /api/gemini proxy instead

const callGeminiProxy = async (model: string, contents: string, config?: any) => {
  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Custom-Gemini-Key': localStorage.getItem('custom_gemini_key') || ''
    },
    body: JSON.stringify({ model, contents, config })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to call Gemini API');
  }

  const data = await response.json();
  return data;
};

export const generateSessionInsight = async (transcript: string) => {
  const response = await callGeminiProxy(
    DEFAULT_MODEL,
    `Analyze this MBA lecture transcript and provide:
    1. A concise summary (max 3 sentences).
    2. A list of 3-5 potential exam questions based on the content.
    
    Transcript: ${transcript.substring(0, 10000)}... (truncated)

    Output format (JSON):
    {
        "summary": "...",
        "examQuestions": ["Q1", "Q2", "Q3"]
    }`,
    {
      responseMimeType: "application/json"
    }
  );

  return JSON.parse(response.text || '{}');
};

export const extractConceptsFromMaterials = async (fileNames: string[]) => {
  const response = await callGeminiProxy(
    GEMINI_MODELS.FLASH_2_0,
    `Based on these file names uploaded as study material for this class, predict 5 core concepts or technical terms that are likely contained in them. Provide a brief 1-sentence explanation for each.
    
    Files: ${fileNames.join(', ')}`,
    {
      responseMimeType: "application/json"
    }
  );

  return JSON.parse(response.text || '[]');
};

export const extractConceptsFromTranscript = async (transcript: string) => {
  const response = await callGeminiProxy(
    DEFAULT_MODEL,
    `Analyze this lecture transcript and extract 5 key concepts for a knowledge graph.
      
      Transcript: ${transcript.substring(0, 5000)}...
  
      Output JSON array:
      [
        { "keyword": "Term", "explanation": "Definition..." }
      ]`,
    {
      responseMimeType: "application/json"
    }
  );

  return JSON.parse(response.text || '[]');
};

export const refineTranscript = async (turns: any[]) => {
  const fullText = turns.map(t => `${t.role}: ${t.text}`).join('\n');
  const response = await callGeminiProxy(
    GEMINI_MODELS.FLASH_2_0,
    `Refine this lecture transcript. Fix typos, remove filler words like "um", "uh", "you know", and format it into clear speaker turns. Maintain the original context and technical MBA terminology. Keep it professional.
    
    Raw Transcript:
    ${fullText.substring(0, 8000)}

    Output JSON array of turns:
    [
      { "role": "user" | "model", "text": "...", "timestamp": number }
    ]`,
    {
      responseMimeType: "application/json"
    }
  );

  return JSON.parse(response.text || '[]');
};
