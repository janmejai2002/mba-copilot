
export interface ConceptExplainer {
    keyword: string;
    explanation: string;
    source?: string;
    timestamp: number;
}

export const callPerplexity = async (prompt: string) => {
    const response = await fetch('/api/perplexity', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-custom-perplexity-key': localStorage.getItem('custom_perplexity_key') || ''
        },
        body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to call Perplexity API');
    }

    const data = await response.json();
    return data.choices[0].message.content;
};

export const extractKeywords = async (transcript: string) => {
    const prompt = `From the following MBA lecture transcript, identify the 2 most important technical business keywords or concepts that were mentioned. 
  Provide the result as a raw JSON array of strings only.
  
  Transcript: ${transcript}`;

    try {
        const res = await callPerplexity(prompt);
        // Try to parse JSON from the response
        const jsonStr = res.replace(/```json|```/g, '').trim();
        return JSON.parse(jsonStr) as string[];
    } catch (e) {
        console.error('Failed to extract keywords', e);
        return [];
    }
};

export const explainConcept = async (keyword: string, context: string) => {
    const prompt = `Explain the business concept "${keyword}" in the context of this lecture: "${context}". 
  Provide a concise 2-sentence explanation suitable for an MBA student.`;

    return await callPerplexity(prompt);
};

export const generateSuggestedQuestions = async (transcript: string) => {
    const prompt = `Based on the following MBA lecture transcript, generate 3 short, thought-provoking questions a student could ask to deepen their understanding.
  Provide the result as a raw JSON array of strings only.
  
  Transcript: ${transcript}`;

    try {
        const res = await callPerplexity(prompt);
        const jsonStr = res.replace(/```json|```/g, '').trim();
        return JSON.parse(jsonStr) as string[];
    } catch (e) {
        console.error('Failed to generate questions', e);
        return [];
    }
};
