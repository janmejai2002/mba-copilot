// Semantic Embedding Service using Gemini API
// Generates 768-dimensional embeddings for semantic similarity

const EMBEDDING_MODEL = 'text-embedding-004';

interface EmbeddingResponse {
    embedding: number[];
    values?: number[];
}

/**
 * Generate semantic embedding for a text using Gemini's embedding model
 * 
 * How to get Gemini API Key:
 * 1. Go to https://aistudio.google.com/apikey
 * 2. Click "Create API Key"
 * 3. Copy the key and save it in Settings > Custom Gemini Key
 */
export const generateEmbedding = async (text: string): Promise<number[]> => {
    const apiKey = localStorage.getItem('custom_gemini_key');

    if (!apiKey) {
        console.warn('No Gemini API key found. Using fallback hash-based pseudo-embedding.');
        return generateFallbackEmbedding(text);
    }

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/${EMBEDDING_MODEL}:embedContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: `models/${EMBEDDING_MODEL}`,
                    content: { parts: [{ text }] }
                })
            }
        );

        if (!response.ok) {
            throw new Error(`Embedding API error: ${response.status}`);
        }

        const data = await response.json();
        return data.embedding?.values || [];
    } catch (error) {
        console.error('Embedding generation failed:', error);
        return generateFallbackEmbedding(text);
    }
};

/**
 * Batch generate embeddings for multiple texts (more efficient)
 */
export const generateBatchEmbeddings = async (texts: string[]): Promise<number[][]> => {
    const apiKey = localStorage.getItem('custom_gemini_key');

    if (!apiKey) {
        return texts.map(text => generateFallbackEmbedding(text));
    }

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/${EMBEDDING_MODEL}:batchEmbedContents?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requests: texts.map(text => ({
                        model: `models/${EMBEDDING_MODEL}`,
                        content: { parts: [{ text }] }
                    }))
                })
            }
        );

        if (!response.ok) {
            throw new Error(`Batch embedding API error: ${response.status}`);
        }

        const data = await response.json();
        return data.embeddings?.map((e: EmbeddingResponse) => e.values || []) || [];
    } catch (error) {
        console.error('Batch embedding failed:', error);
        return texts.map(text => generateFallbackEmbedding(text));
    }
};

/**
 * Calculate cosine similarity between two embeddings
 */
export const cosineSimilarity = (a: number[], b: number[]): number => {
    if (a.length !== b.length || a.length === 0) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
};

/**
 * Find top-k most similar embeddings
 */
export const findSimilar = (
    queryEmbedding: number[],
    embeddings: { id: string; embedding: number[] }[],
    topK: number = 5
): { id: string; similarity: number }[] => {
    const similarities = embeddings.map(item => ({
        id: item.id,
        similarity: cosineSimilarity(queryEmbedding, item.embedding)
    }));

    return similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK);
};

/**
 * Fallback: Generate a pseudo-embedding from text using character hashing
 * This provides basic semantic grouping without API calls
 */
const generateFallbackEmbedding = (text: string): number[] => {
    const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, '');
    const words = normalized.split(/\s+/).filter(w => w.length > 2);

    // Create 128-dim pseudo-embedding based on word features
    const embedding = new Array(128).fill(0);

    words.forEach((word, wordIdx) => {
        for (let i = 0; i < word.length; i++) {
            const charCode = word.charCodeAt(i);
            const position = (charCode * (wordIdx + 1)) % 128;
            embedding[position] += 1 / (wordIdx + 1);
        }
    });

    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? embedding.map(v => v / magnitude) : embedding;
};

/**
 * Cache embeddings in IndexedDB for efficiency
 */
export const cacheEmbedding = async (key: string, embedding: number[]): Promise<void> => {
    try {
        const cache = JSON.parse(localStorage.getItem('embedding_cache') || '{}');
        cache[key] = embedding;
        localStorage.setItem('embedding_cache', JSON.stringify(cache));
    } catch (e) {
        console.warn('Failed to cache embedding:', e);
    }
};

export const getCachedEmbedding = (key: string): number[] | null => {
    try {
        const cache = JSON.parse(localStorage.getItem('embedding_cache') || '{}');
        return cache[key] || null;
    } catch {
        return null;
    }
};

/**
 * Get or generate embedding (with caching)
 */
export const getOrCreateEmbedding = async (text: string): Promise<number[]> => {
    const cacheKey = text.substring(0, 100); // Use first 100 chars as key
    const cached = getCachedEmbedding(cacheKey);

    if (cached) {
        return cached;
    }

    const embedding = await generateEmbedding(text);
    await cacheEmbedding(cacheKey, embedding);
    return embedding;
};
