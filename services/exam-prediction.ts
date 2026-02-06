// Exam Prediction Service
// AI-powered exam probability prediction based on concept analysis

import { SemanticNode, useKnowledgeStore } from '../stores/useKnowledgeStore';
import { cosineSimilarity } from './embeddings';

export interface ExamPrediction {
    nodeId: string;
    label: string;
    probability: number;
    confidence: 'high' | 'medium' | 'low';
    reasons: string[];
}

interface PredictionFactors {
    professorEmphasis: number;    // 0-1 based on mention frequency
    conceptCentrality: number;    // 0-1 based on graph connections
    syllabusAlignment: number;    // 0-1 based on syllabus keywords
    recencyWeight: number;        // 0-1 based on when discussed
    complexityScore: number;      // 0-1 based on depth and prerequisites
}

// Keywords that indicate exam importance
const EMPHASIS_KEYWORDS = [
    'important', 'exam', 'test', 'remember', 'critical', 'key concept',
    'make sure', 'note this', 'pay attention', 'fundamental', 'essential',
    'must know', 'will be on', 'commonly asked', 'frequently tested'
];

// Keywords indicating formula/calculation questions
const FORMULA_KEYWORDS = [
    'formula', 'calculate', 'compute', 'equation', 'solve', 'derive',
    'npv', 'irr', 'wacc', 'capm', 'roi', 'cagr', 'ratio'
];

/**
 * Analyze transcript for emphasis patterns
 */
export const analyzeEmphasis = (transcript: string): Map<string, number> => {
    const emphasisMap = new Map<string, number>();
    const sentences = transcript.toLowerCase().split(/[.!?]+/);

    sentences.forEach(sentence => {
        const hasEmphasis = EMPHASIS_KEYWORDS.some(kw => sentence.includes(kw));
        const hasFormula = FORMULA_KEYWORDS.some(kw => sentence.includes(kw));

        if (hasEmphasis || hasFormula) {
            // Extract potential concept words (capitalized or quoted)
            const words = sentence.match(/\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b|"([^"]+)"|'([^']+)'/g) || [];
            words.forEach(word => {
                const cleanWord = word.replace(/["']/g, '').trim();
                if (cleanWord.length > 2) {
                    const current = emphasisMap.get(cleanWord) || 0;
                    emphasisMap.set(cleanWord, current + (hasEmphasis ? 2 : 1));
                }
            });
        }
    });

    return emphasisMap;
};

/**
 * Calculate concept centrality based on graph connections
 */
export const calculateCentrality = (node: SemanticNode, allNodes: SemanticNode[]): number => {
    if (allNodes.length === 0) return 0;

    // Degree centrality: normalized connection count
    const maxConnections = Math.max(...allNodes.map(n => n.connections.length), 1);
    const degreeCentrality = node.connections.length / maxConnections;

    // Weighted by connection strength
    const avgStrength = node.connections.length > 0
        ? node.connections.reduce((sum, c) => sum + c.strength, 0) / node.connections.length
        : 0;

    return (degreeCentrality * 0.6) + (avgStrength * 0.4);
};

/**
 * Calculate recency weight (more recent = higher weight)
 */
export const calculateRecency = (timestamp: number, allTimestamps: number[]): number => {
    if (allTimestamps.length === 0) return 0.5;

    const minTime = Math.min(...allTimestamps);
    const maxTime = Math.max(...allTimestamps);
    const range = maxTime - minTime;

    if (range === 0) return 1;

    return (timestamp - minTime) / range;
};

/**
 * Calculate complexity score based on depth and category
 */
export const calculateComplexity = (node: SemanticNode): number => {
    const depthWeight = Math.min(node.depth / 3, 1) * 0.4;

    const categoryWeights: Record<string, number> = {
        formula: 0.9,
        concept: 0.7,
        definition: 0.5,
        trend: 0.6,
        example: 0.3
    };

    const categoryWeight = (categoryWeights[node.category] || 0.5) * 0.6;

    return depthWeight + categoryWeight;
};

/**
 * Generate exam predictions for all nodes
 */
export const generateExamPredictions = (
    nodes: SemanticNode[],
    transcript?: string
): ExamPrediction[] => {
    if (nodes.length === 0) return [];

    const emphasisMap = transcript ? analyzeEmphasis(transcript) : new Map();
    const allTimestamps = nodes.map(n => n.timestamp);

    const predictions: ExamPrediction[] = nodes.map(node => {
        const factors: PredictionFactors = {
            professorEmphasis: (emphasisMap.get(node.label) || 0) / 10,
            conceptCentrality: calculateCentrality(node, nodes),
            syllabusAlignment: 0.5, // Default, could be enhanced with syllabus analysis
            recencyWeight: calculateRecency(node.timestamp, allTimestamps),
            complexityScore: calculateComplexity(node)
        };

        // Weighted probability calculation
        const probability = Math.min(1,
            factors.professorEmphasis * 0.35 +
            factors.conceptCentrality * 0.25 +
            factors.syllabusAlignment * 0.15 +
            factors.recencyWeight * 0.1 +
            factors.complexityScore * 0.15
        );

        // Generate reasons
        const reasons: string[] = [];
        if (factors.professorEmphasis > 0.5) reasons.push('Frequently emphasized by professor');
        if (factors.conceptCentrality > 0.6) reasons.push('Central concept with many connections');
        if (node.category === 'formula') reasons.push('Formula-based question likely');
        if (factors.recencyWeight > 0.8) reasons.push('Recently discussed topic');
        if (factors.complexityScore > 0.7) reasons.push('Complex topic requiring deep understanding');

        const confidence: 'high' | 'medium' | 'low' =
            probability > 0.7 ? 'high' :
                probability > 0.4 ? 'medium' : 'low';

        return {
            nodeId: node.id,
            label: node.label,
            probability,
            confidence,
            reasons
        };
    });

    // Sort by probability
    return predictions.sort((a, b) => b.probability - a.probability);
};

/**
 * Get top predicted exam topics
 */
export const getTopExamTopics = (
    nodes: SemanticNode[],
    transcript?: string,
    limit: number = 10
): ExamPrediction[] => {
    const predictions = generateExamPredictions(nodes, transcript);
    return predictions.slice(0, limit);
};

/**
 * Generate study priority list based on predictions and mastery
 */
export const generateStudyPriority = (
    nodes: SemanticNode[],
    transcript?: string
): { nodeId: string; priority: 'critical' | 'high' | 'medium' | 'low'; reason: string }[] => {
    const predictions = generateExamPredictions(nodes, transcript);

    return nodes.map(node => {
        const prediction = predictions.find(p => p.nodeId === node.id);
        const examProb = prediction?.probability || 0;
        const mastery = node.srs.mastery;

        // High exam probability + low mastery = critical
        // High exam probability + high mastery = medium (review)
        // Low exam probability + low mastery = low
        // Low exam probability + high mastery = low (skip)

        const priorityScore = examProb * (1 - mastery);

        let priority: 'critical' | 'high' | 'medium' | 'low';
        let reason: string;

        if (priorityScore > 0.6) {
            priority = 'critical';
            reason = 'High exam likelihood, needs more practice';
        } else if (priorityScore > 0.4) {
            priority = 'high';
            reason = examProb > 0.5 ? 'Likely exam topic, moderate mastery' : 'Good foundation, needs reinforcement';
        } else if (priorityScore > 0.2) {
            priority = 'medium';
            reason = 'Moderate importance, adequate understanding';
        } else {
            priority = 'low';
            reason = mastery > 0.7 ? 'Well mastered' : 'Lower exam probability';
        }

        return { nodeId: node.id, priority, reason };
    }).sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
};
