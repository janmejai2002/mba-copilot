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
    `Please summarize the following classroom lecture transcript and generate 3 potential exam questions based on it. Use a professional academic tone.
    
    Transcript:
    ${transcript}`,
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
