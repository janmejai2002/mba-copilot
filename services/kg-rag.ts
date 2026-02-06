// KG-RAG (Knowledge Graph Retrieval Augmented Generation) Service
// Ground AI responses in user's knowledge graph for personalized answers

import { SemanticNode, useKnowledgeStore } from '../stores/useKnowledgeStore';
import { getOrCreateEmbedding, cosineSimilarity } from './embeddings';
import { callPerplexity } from './perplexity';

interface RAGContext {
    relevantNodes: SemanticNode[];
    prerequisiteChain: SemanticNode[];
    suggestedReview: SemanticNode[];
}

interface RAGResponse {
    answer: string;
    context: RAGContext;
    confidence: number;
    sources: string[];
}

/**
 * Find prerequisite chain for a concept
 * Traces back through parent relationships to find foundational concepts
 */
export const findPrerequisiteChain = (
    node: SemanticNode,
    allNodes: Map<string, SemanticNode>,
    maxDepth: number = 5
): SemanticNode[] => {
    const chain: SemanticNode[] = [];
    const visited = new Set<string>();

    const traverse = (currentNode: SemanticNode, depth: number) => {
        if (depth >= maxDepth || visited.has(currentNode.id)) return;
        visited.add(currentNode.id);

        // Find concepts that this one builds upon (higher similarity, lower depth)
        const prerequisites = Array.from(allNodes.values())
            .filter(n =>
                n.id !== currentNode.id &&
                n.depth < currentNode.depth &&
                !visited.has(n.id)
            )
            .map(n => ({
                node: n,
                similarity: cosineSimilarity(currentNode.embedding, n.embedding)
            }))
            .filter(item => item.similarity > 0.6)
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 2);

        prerequisites.forEach(({ node: prereq }) => {
            chain.push(prereq);
            traverse(prereq, depth + 1);
        });
    };

    traverse(node, 0);
    return chain;
};

/**
 * Find concepts that need review based on query context
 */
export const findSuggestedReview = (
    relevantNodes: SemanticNode[],
    allNodes: Map<string, SemanticNode>
): SemanticNode[] => {
    const now = Date.now();

    // Find nodes that are:
    // 1. Connected to relevant nodes
    // 2. Due for review (nextReview <= now)
    // 3. Low mastery

    const connectedIds = new Set<string>();
    relevantNodes.forEach(node => {
        node.connections.forEach(conn => connectedIds.add(conn.targetId));
    });

    return Array.from(allNodes.values())
        .filter(node =>
            connectedIds.has(node.id) &&
            (node.srs.nextReview <= now || node.srs.mastery < 0.5)
        )
        .sort((a, b) => a.srs.mastery - b.srs.mastery)
        .slice(0, 5);
};

/**
 * Build RAG context from user's knowledge graph
 */
export const buildRAGContext = async (
    query: string,
    nodes: Map<string, SemanticNode>,
    topK: number = 5
): Promise<RAGContext> => {
    // Generate query embedding
    const queryEmbedding = await getOrCreateEmbedding(query);

    // Find most relevant nodes
    const nodeArray = Array.from(nodes.values());
    const scored = nodeArray.map(node => ({
        node,
        similarity: cosineSimilarity(queryEmbedding, node.embedding)
    }));

    const relevantNodes = scored
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK)
        .filter(s => s.similarity > 0.5)
        .map(s => s.node);

    // Build prerequisite chain for most relevant node
    const prerequisiteChain = relevantNodes.length > 0
        ? findPrerequisiteChain(relevantNodes[0], nodes)
        : [];

    // Find concepts that should be reviewed
    const suggestedReview = findSuggestedReview(relevantNodes, nodes);

    return {
        relevantNodes,
        prerequisiteChain,
        suggestedReview
    };
};

/**
 * Format knowledge context for AI prompt
 */
const formatContextForPrompt = (context: RAGContext): string => {
    if (context.relevantNodes.length === 0) {
        return 'No relevant concepts found in your knowledge base.';
    }

    let formatted = '## Your Knowledge Context\n\n';

    formatted += '### Relevant Concepts You\'ve Learned:\n';
    context.relevantNodes.forEach((node, i) => {
        formatted += `${i + 1}. **${node.label}** (${Math.round(node.srs.mastery * 100)}% mastery)\n`;
        formatted += `   ${node.explanation}\n\n`;
    });

    if (context.prerequisiteChain.length > 0) {
        formatted += '\n### Prerequisites (concepts this builds upon):\n';
        context.prerequisiteChain.forEach(node => {
            formatted += `- ${node.label}: ${node.explanation.substring(0, 100)}...\n`;
        });
    }

    if (context.suggestedReview.length > 0) {
        formatted += '\n### Related concepts you should review:\n';
        context.suggestedReview.forEach(node => {
            formatted += `- ${node.label} (${Math.round(node.srs.mastery * 100)}% mastery)\n`;
        });
    }

    return formatted;
};

/**
 * Query with knowledge graph grounding (KG-RAG)
 */
export const queryWithKGRAG = async (
    query: string,
    transcript?: string
): Promise<RAGResponse> => {
    const { nodes } = useKnowledgeStore.getState();

    // Build context from knowledge graph
    const context = await buildRAGContext(query, nodes);

    // Format context for AI
    const kgContext = formatContextForPrompt(context);

    // Build enhanced prompt
    const enhancedPrompt = `You are a personalized AI tutor. The student has learned certain concepts already, shown below. 
Use their existing knowledge to explain the answer, making connections to what they already know.
If they're missing prerequisite knowledge, point that out gently.

${kgContext}

${transcript ? `## Recent Lecture Context:\n${transcript.slice(-2000)}\n\n` : ''}

## Student's Question:
${query}

Please answer in a way that:
1. Connects to concepts they already know
2. Highlights any gaps in prerequisite knowledge
3. Suggests which related concepts they should review
4. Uses simple, clear language`;

    // Call AI with KG-grounded context
    const answer = await callPerplexity(enhancedPrompt);

    // Calculate confidence based on context quality
    const confidence = Math.min(1,
        (context.relevantNodes.length / 5) * 0.5 +
        (context.relevantNodes.reduce((sum, n) => sum + n.srs.mastery, 0) / Math.max(context.relevantNodes.length, 1)) * 0.5
    );

    return {
        answer,
        context,
        confidence,
        sources: context.relevantNodes.map(n => n.label)
    };
};

/**
 * Get personalized learning path for a topic
 */
export const getLearningPath = async (
    targetTopic: string
): Promise<{ steps: { label: string; explanation: string; mastery: number }[]; estimatedTime: number }> => {
    const { nodes } = useKnowledgeStore.getState();
    const context = await buildRAGContext(targetTopic, nodes);

    // Build path from prerequisites to target
    const steps = [
        ...context.prerequisiteChain.reverse().map(n => ({
            label: n.label,
            explanation: n.explanation,
            mastery: n.srs.mastery
        })),
        ...context.relevantNodes.slice(0, 1).map(n => ({
            label: n.label,
            explanation: n.explanation,
            mastery: n.srs.mastery
        }))
    ];

    // Estimate time based on mastery gaps
    const estimatedTime = steps.reduce((time, step) => {
        const masteryGap = 1 - step.mastery;
        return time + Math.round(masteryGap * 15); // 15 min max per concept
    }, 0);

    return { steps, estimatedTime };
};

/**
 * Find what concepts the user should learn next
 */
export const suggestNextConcepts = async (
    currentTopic: string,
    limit: number = 3
): Promise<{ label: string; reason: string }[]> => {
    const { nodes, findSimilarNodes } = useKnowledgeStore.getState();

    // Find similar concepts they haven't mastered
    const similar = await findSimilarNodes(currentTopic, 10);

    const suggestions = similar
        .filter(node => node.srs.mastery < 0.7)
        .slice(0, limit)
        .map(node => ({
            label: node.label,
            reason: node.srs.mastery === 0
                ? 'New related concept to explore'
                : `Related concept at ${Math.round(node.srs.mastery * 100)}% mastery`
        }));

    return suggestions;
};
