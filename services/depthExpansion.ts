import { Concept } from '../types';

interface DepthExpansionRequest {
    concept: Concept;
    targetDepth: number;
    sessionContext: string;
}

/**
 * AI-Powered 4-Layer Depth Expansion Service
 * Generates nested sub-concepts for any given concept using Gemini AI
 */
export class DepthExpansionService {
    private static readonly MAX_DEPTH = 3;
    private static readonly CHILDREN_PER_LAYER = 4;

    /**
     * Expand a concept to the next depth level using AI
     */
    static async expandConcept(request: DepthExpansionRequest): Promise<Concept[]> {
        const { concept, targetDepth, sessionContext } = request;

        if (targetDepth > this.MAX_DEPTH) {
            throw new Error('Maximum depth of 3 exceeded');
        }

        const prompt = `
You are an expert knowledge architect. Given a concept, generate exactly ${this.CHILDREN_PER_LAYER} sub-concepts that represent deeper layers of understanding.

**Parent Concept**: ${concept.keyword}
**Explanation**: ${concept.explanation}
**Current Depth**: ${concept.depth || 0}
**Target Depth**: ${targetDepth}
**Session Context**: ${sessionContext}

Generate ${this.CHILDREN_PER_LAYER} sub-concepts that:
1. Break down the parent concept into fundamental components
2. Provide actionable, specific insights
3. Are relevant to the session context
4. Follow this hierarchy:
   - Depth 0 (Root): High-level themes
   - Depth 1: Core principles and definitions
   - Depth 2: Applications and examples
   - Depth 3: Edge cases and advanced nuances

Return ONLY a JSON array of objects with this structure:
[
  {
    "keyword": "Sub-concept name",
    "explanation": "Detailed explanation (2-3 sentences)",
    "category": "formula" | "trend" | "example" | "concept" | "definition"
  }
]
`;

        try {
            const response = await fetch('/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            });

            if (!response.ok) throw new Error('AI expansion failed');

            const data = await response.json();
            const rawText = data.text || '';

            // Extract JSON from markdown code blocks if present
            const jsonMatch = rawText.match(/```json\n([\s\S]*?)\n```/) || rawText.match(/\[[\s\S]*\]/);
            const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : rawText;

            const subConcepts = JSON.parse(jsonStr);

            return subConcepts.map((sc: any, index: number) => ({
                keyword: sc.keyword,
                explanation: sc.explanation,
                timestamp: Date.now() + index,
                depth: targetDepth,
                parentId: concept.keyword,
                category: sc.category || 'concept',
                children: [],
                isExpanded: false,
                connections: []
            }));
        } catch (error) {
            console.error('Depth expansion error:', error);
            // Fallback: generate placeholder concepts
            return this.generateFallbackConcepts(concept, targetDepth);
        }
    }

    /**
     * Fallback concept generation if AI fails
     */
    private static generateFallbackConcepts(parent: Concept, depth: number): Concept[] {
        const templates = [
            { keyword: `${parent.keyword} - Foundation`, explanation: `Core principles underlying ${parent.keyword}`, category: 'definition' as const },
            { keyword: `${parent.keyword} - Application`, explanation: `Practical applications of ${parent.keyword}`, category: 'example' as const },
            { keyword: `${parent.keyword} - Analysis`, explanation: `Critical analysis of ${parent.keyword}`, category: 'concept' as const },
            { keyword: `${parent.keyword} - Extension`, explanation: `Advanced concepts building on ${parent.keyword}`, category: 'trend' as const }
        ];

        return templates.map((t, i) => ({
            ...t,
            timestamp: Date.now() + i,
            depth,
            parentId: parent.keyword,
            children: [],
            isExpanded: false,
            connections: []
        }));
    }

    /**
     * Build a complete 4-layer hierarchy for a root concept
     */
    static async buildFullHierarchy(rootConcept: Concept, sessionContext: string): Promise<Concept> {
        const expandedRoot = { ...rootConcept, depth: 0, children: [], isExpanded: true };

        // Layer 1
        const layer1 = await this.expandConcept({ concept: expandedRoot, targetDepth: 1, sessionContext });
        expandedRoot.children = layer1;

        // Layer 2 (expand first 2 children of layer 1)
        for (let i = 0; i < Math.min(2, layer1.length); i++) {
            const layer2 = await this.expandConcept({ concept: layer1[i], targetDepth: 2, sessionContext });
            layer1[i].children = layer2;
            layer1[i].isExpanded = true;
        }

        // Layer 3 (expand first child of first layer 2 concept)
        if (layer1[0]?.children && layer1[0].children.length > 0) {
            const layer3 = await this.expandConcept({ concept: layer1[0].children[0], targetDepth: 3, sessionContext });
            layer1[0].children[0].children = layer3;
            layer1[0].children[0].isExpanded = true;
        }

        return expandedRoot;
    }
}
