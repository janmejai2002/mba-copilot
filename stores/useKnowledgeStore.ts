import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SRSItem, createSRSItem, calculateNextReview, calculateDecay, getDueItems } from '../services/spaced-repetition';
import { getOrCreateEmbedding, cosineSimilarity } from '../services/embeddings';

// Semantic Knowledge Node with embeddings and SRS
export interface SemanticNode {
    id: string;
    label: string;
    explanation: string;
    category: 'concept' | 'formula' | 'example' | 'trend' | 'definition';
    embedding: number[];
    srs: SRSItem;
    depth: number;
    parentId?: string;
    childIds: string[];
    connections: { targetId: string; strength: number }[];
    timestamp: number;
    examProbability?: number;
    position3D?: [number, number, number]; // UMAP projected coordinates
    sessionId?: string; // Links concepts to a specific lecture
}

interface KnowledgeStore {
    nodes: Map<string, SemanticNode>;
    isProcessing: boolean;
    lastSync: number;

    // Node management
    addNode: (label: string, explanation: string, category: SemanticNode['category'], sessionId?: string) => Promise<string>;
    updateNode: (id: string, updates: Partial<SemanticNode>) => void;
    removeNode: (id: string) => void;
    getNode: (id: string) => SemanticNode | undefined;

    // Semantic operations
    findSimilarNodes: (query: string, topK?: number) => Promise<SemanticNode[]>;
    buildConnections: () => Promise<void>;

    // SRS operations
    reviewNode: (id: string, quality: 0 | 1 | 2 | 3 | 4 | 5) => void;
    getDueNodes: () => SemanticNode[];
    getNodeMastery: (id: string) => number;

    // Bulk operations
    importConcepts: (concepts: { keyword: string; explanation: string; timestamp: number }[], sessionId?: string) => Promise<void>;
    clearAll: () => void;

    // Stats
    getStats: () => {
        total: number;
        mastered: number;
        learning: number;
        dueNow: number;
        averageMastery: number;
    };
}

export const useKnowledgeStore = create<KnowledgeStore>()(
    persist(
        (set, get) => ({
            nodes: new Map(),
            isProcessing: false,
            lastSync: 0,

            addNode: async (label, explanation, category, sessionId) => {
                const id = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

                set({ isProcessing: true });

                try {
                    // Generate semantic embedding
                    const embedding = await getOrCreateEmbedding(`${label}: ${explanation}`);

                    const node: SemanticNode = {
                        id,
                        label,
                        explanation,
                        category,
                        embedding,
                        srs: createSRSItem(id),
                        depth: 0,
                        childIds: [],
                        connections: [],
                        timestamp: Date.now(),
                        sessionId
                    };

                    set(state => {
                        const newNodes = new Map(state.nodes);
                        newNodes.set(id, node);
                        return { nodes: newNodes, isProcessing: false };
                    });

                    return id;
                } catch (error) {
                    set({ isProcessing: false });
                    throw error;
                }
            },

            updateNode: (id, updates) => {
                set(state => {
                    const node = state.nodes.get(id);
                    if (!node) return state;

                    const newNodes = new Map(state.nodes);
                    newNodes.set(id, { ...node, ...updates });
                    return { nodes: newNodes };
                });
            },

            removeNode: (id) => {
                set(state => {
                    const newNodes = new Map(state.nodes);
                    newNodes.delete(id);
                    return { nodes: newNodes };
                });
            },

            getNode: (id) => get().nodes.get(id),

            findSimilarNodes: async (query, topK = 5) => {
                const queryEmbedding = await getOrCreateEmbedding(query);
                const nodes = Array.from(get().nodes.values());

                const scored = nodes.map(node => ({
                    node,
                    similarity: cosineSimilarity(queryEmbedding, node.embedding)
                }));

                return scored
                    .sort((a, b) => b.similarity - a.similarity)
                    .slice(0, topK)
                    .map(s => s.node);
            },

            buildConnections: async () => {
                set({ isProcessing: true });

                const nodes = Array.from(get().nodes.values());
                const SIMILARITY_THRESHOLD = 0.7;

                // Calculate pairwise similarities and create connections
                for (let i = 0; i < nodes.length; i++) {
                    const connections: { targetId: string; strength: number }[] = [];

                    for (let j = 0; j < nodes.length; j++) {
                        if (i === j) continue;

                        const similarity = cosineSimilarity(nodes[i].embedding, nodes[j].embedding);
                        if (similarity >= SIMILARITY_THRESHOLD) {
                            connections.push({ targetId: nodes[j].id, strength: similarity });
                        }
                    }

                    // Keep top 5 connections per node
                    const topConnections = connections
                        .sort((a, b) => b.strength - a.strength)
                        .slice(0, 5);

                    get().updateNode(nodes[i].id, { connections: topConnections });
                }

                set({ isProcessing: false, lastSync: Date.now() });
            },

            reviewNode: (id, quality) => {
                set(state => {
                    const node = state.nodes.get(id);
                    if (!node) return state;

                    const updatedSRS = calculateNextReview(node.srs, quality);

                    const newNodes = new Map(state.nodes);
                    newNodes.set(id, { ...node, srs: updatedSRS });
                    return { nodes: newNodes };
                });
            },

            getDueNodes: () => {
                const nodes = Array.from(get().nodes.values());
                const srsItems = nodes.map(n => n.srs);
                const dueItems = getDueItems(srsItems);
                const dueIds = new Set(dueItems.map(i => i.id));
                return nodes.filter(n => dueIds.has(n.id));
            },

            getNodeMastery: (id) => {
                const node = get().nodes.get(id);
                if (!node) return 0;
                return calculateDecay(node.srs);
            },

            importConcepts: async (concepts, sessionId) => {
                set({ isProcessing: true });

                for (const concept of concepts) {
                    const category = categorizeConcept(concept.keyword, concept.explanation);
                    await get().addNode(concept.keyword, concept.explanation, category, sessionId);
                }

                // Build connections after import
                await get().buildConnections();

                set({ isProcessing: false });
            },

            clearAll: () => {
                set({ nodes: new Map(), lastSync: 0 });
            },

            getStats: () => {
                const nodes = Array.from(get().nodes.values());
                const srsItems = nodes.map(n => n.srs);

                const mastered = nodes.filter(n => n.srs.mastery >= 0.7).length;
                const learning = nodes.filter(n => n.srs.mastery > 0 && n.srs.mastery < 0.7).length;
                const dueNow = getDueItems(srsItems).length;
                const averageMastery = nodes.length > 0
                    ? nodes.reduce((sum, n) => sum + n.srs.mastery, 0) / nodes.length
                    : 0;

                return {
                    total: nodes.length,
                    mastered,
                    learning,
                    dueNow,
                    averageMastery
                };
            }
        }),
        {
            name: 'knowledge-store',
            partialize: (state) => ({
                nodes: Array.from(state.nodes.entries()),
                lastSync: state.lastSync
            }),
            merge: (persisted: any, current) => ({
                ...current,
                nodes: new Map(persisted?.nodes || []),
                lastSync: persisted?.lastSync || 0
            })
        }
    )
);

// Helper to categorize concepts
function categorizeConcept(keyword: string, explanation: string): SemanticNode['category'] {
    const lower = (keyword + ' ' + explanation).toLowerCase();

    if (lower.includes('formula') || lower.includes('equation') || lower.includes('calculate') || /[=+\-*\/^]/.test(lower)) {
        return 'formula';
    } else if (lower.includes('example') || lower.includes('case') || lower.includes('instance')) {
        return 'example';
    } else if (lower.includes('trend') || lower.includes('growth') || lower.includes('increase') || lower.includes('decrease')) {
        return 'trend';
    } else if (lower.includes('definition') || lower.includes('means') || lower.includes('refers to')) {
        return 'definition';
    } else {
        return 'concept';
    }
}
