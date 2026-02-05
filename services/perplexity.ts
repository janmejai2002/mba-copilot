
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

/**
 * Extracts key concepts or answers questions using Perplexity.
 * If the transcript parameter looks like a prompt (contains 'analyze' or 'format'), 
 * it is used as-is. Otherwise, it's wrapped in a keyword extraction prompt.
 */
export async function extractKeywords(transcript: string) {
    const isAlreadyPrompt = transcript.toLowerCase().includes('analyze') || transcript.toLowerCase().includes('format') || transcript.length < 500;

    const prompt = isAlreadyPrompt
        ? transcript
        : `Identify the 5-7 most important academic concepts or keywords from this lecture transcript. 
           For each, provide a brief 1-sentence explanation. 
           Format as a JSON array of objects: [{"keyword": "...", "explanation": "..."}].
           Return ONLY the JSON.

           Transcript: ${transcript}`;

    try {
        const response = await callPerplexity(prompt);
        // Find JSON in response
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return [];
    } catch (error) {
        console.error('Failed to extract keywords:', error);
        return [];
    }
}

export async function explainConcept(concept: string, context: string = '') {
    const prompt = `Explain the academic concept "${concept}" in the context of an MBA student. ${context ? `Context from lecture: ${context}` : ''} Keep it professional and insightful. Use LaTeX for any formulas.`;
    return callPerplexity(prompt);
}

export const generateSuggestedQuestions = async (transcript: string) => {
    const prompt = `Based on the following lecture transcript, generate 3 short, thought-provoking questions a student could ask to deepen their understanding.
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
