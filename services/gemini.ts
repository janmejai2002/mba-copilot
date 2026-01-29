// No longer using direct AI SDK in frontend for security - calls /api/gemini proxy instead

// Use process.env.API_KEY directly as per guidelines
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
    'gemini-1.5-flash-preview-0514',
    `Please summarize the following classroom lecture transcript and generate 3 potential exam questions based on it. Use a professional MBA tone.
    
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
    'gemini-2.0-flash',
    `Based on these file names uploaded as study material for an MBA class, predict 5 core concepts or technical terms that are likely contained in them. Provide a brief 1-sentence explanation for each.
    
    Files: ${fileNames.join(', ')}`,
    {
      responseMimeType: "application/json"
    }
  );

  return JSON.parse(response.text || '[]');
};
