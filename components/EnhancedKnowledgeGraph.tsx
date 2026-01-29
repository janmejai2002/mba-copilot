import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Share2, Maximize2, BookOpen, Lightbulb, Calculator, TrendingUp, Download, ZoomIn, ZoomOut, Minimize2, Search, Filter, Route, FileText, Clock, Network } from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface Concept {
    keyword: string;
    explanation: string;
    timestamp: number;
}

interface KnowledgeGraphProps {
    concepts: Concept[];
    isSyncing?: boolean;
}

interface GraphNode extends d3.SimulationNodeDatum {
    id: string;
    label: string;
    explanation: string;
    category: string;
    color: string;
    timestamp: number;
    index?: number;
    cluster?: number;
    importance?: number;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
    source: string | GraphNode;
    target: string | GraphNode;
    strength: number;
}

// Categorize concepts
const categorizeConcept = (keyword: string, explanation: string) => {
    const lower = (keyword + ' ' + explanation).toLowerCase();

    if (lower.includes('formula') || lower.includes('equation') || lower.includes('calculate')) {
        return { type: 'formula', icon: Calculator, color: '#3b82f6', bgColor: '#eff6ff', textColor: '#1e40af' };
    } else if (lower.includes('example') || lower.includes('case') || lower.includes('instance')) {
        return { type: 'example', icon: Lightbulb, color: '#f59e0b', bgColor: '#fffbeb', textColor: '#b45309' };
    } else if (lower.includes('trend') || lower.includes('growth') || lower.includes('increase')) {
        return { type: 'trend', icon: TrendingUp, color: '#10b981', bgColor: '#f0fdf4', textColor: '#065f46' };
    } else {
        return { type: 'concept', icon: BookOpen, color: '#8b5cf6', bgColor: '#faf5ff', textColor: '#6b21a8' };
    }
};

// Find word overlap between concepts
const calculateSimilarity = (text1: string, text2: string): number => {
    const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    return intersection.size / Math.max(words1.size, words2.size, 1);
};

const EnhancedKnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ concepts, isSyncing = false }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [showLearningPath, setShowLearningPath] = useState(false);
    const [highlightedPath, setHighlightedPath] = useState<string[]>([]);

    // Process concepts into nodes with metadata
    const { nodes, links, clusters } = useMemo(() => {
        if (concepts.length === 0) return { nodes: [], links: [], clusters: [] };

        const processedNodes: GraphNode[] = concepts.map((c, i) => {
            const category = categorizeConcept(c.keyword, c.explanation);
            return {
                id: `node-${i}`,
                label: c.keyword.replace(/\*\*/g, '').trim(),
                explanation: c.explanation.replace(/\*\*/g, '').trim(),
                category: category.type,
                color: category.color,
                timestamp: c.timestamp,
                importance: 0
            };
        });

        // Create links based on word similarity
        const processedLinks: GraphLink[] = [];
        for (let i = 0; i < processedNodes.length; i++) {
            for (let j = i + 1; j < processedNodes.length; j++) {
                const similarity = calculateSimilarity(
                    processedNodes[i].label + ' ' + processedNodes[i].explanation,
                    processedNodes[j].label + ' ' + processedNodes[j].explanation
                );
                if (similarity > 0.15) {
                    processedLinks.push({
                        source: processedNodes[i].id,
                        target: processedNodes[j].id,
                        strength: similarity
                    });
                }
            }
            // Sequential connections (chronological)
            if (i < processedNodes.length - 1) {
                processedLinks.push({
                    source: processedNodes[i].id,
                    target: processedNodes[i + 1].id,
                    strength: 0.3
                });
            }
        }

        // Calculate importance (number of connections)
        processedNodes.forEach(node => {
            node.importance = processedLinks.filter(l =>
                (l.source as any) === node.id || (l.target as any) === node.id
            ).length;
        });

        // Simple clustering by category
        const categoryMap: Record<string, number> = {};
        let clusterIndex = 0;
        processedNodes.forEach(node => {
            if (!categoryMap[node.category]) {
                categoryMap[node.category] = clusterIndex++;
            }
            node.cluster = categoryMap[node.category];
        });

        const clusterInfo = Object.entries(categoryMap).map(([cat, idx]) => ({
            id: idx,
            category: cat,
            nodes: processedNodes.filter(n => n.cluster === idx)
        }));

        return { nodes: processedNodes, links: processedLinks, clusters: clusterInfo };
    }, [concepts]);

    // Filter nodes based on search and category
    const filteredNodes = useMemo(() => {
        return nodes.filter(node => {
            const matchesSearch = searchQuery === '' ||
                node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                node.explanation.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = filterCategory === 'all' || node.category === filterCategory;
            return matchesSearch && matchesCategory;
        });
    }, [nodes, searchQuery, filterCategory]);

    // Generate learning path (topological sort based on chronology and connections)
    const generateLearningPath = () => {
        if (nodes.length === 0) return [];

        // Sort by timestamp (chronological order) and importance
        const sorted = [...nodes].sort((a, b) => {
            // Prioritize foundational concepts (high importance, early timestamp)
            const importanceDiff = (b.importance || 0) - (a.importance || 0);
            if (Math.abs(importanceDiff) > 2) return importanceDiff;
            return a.timestamp - b.timestamp;
        });

        return sorted.map(n => n.id);
    };

    useEffect(() => {
        if (!containerRef.current) return;

        const observer = new ResizeObserver((entries) => {
            if (!entries.length) return;
            const { width, height } = entries[0].contentRect;
            setDimensions({ width, height });
        });

        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!svgRef.current || dimensions.width === 0 || filteredNodes.length === 0) return;

        const { width, height } = dimensions;

        // Clear previous graph
        d3.select(svgRef.current).selectAll('*').remove();

        // Filter links to only include filtered nodes
        const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
        const filteredLinks = links.filter(l =>
            filteredNodeIds.has((l.source as any).id || l.source as string) &&
            filteredNodeIds.has((l.target as any).id || l.target as string)
        );

        // Create SVG
        const svg = d3.select(svgRef.current)
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', [0, 0, width, height]);

        // Add zoom behavior
        const g = svg.append('g');
        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
            });
        svg.call(zoom);

        // Create force simulation
        const simulation = d3.forceSimulation<GraphNode>(filteredNodes)
            .force('link', d3.forceLink<GraphNode, GraphLink>(filteredLinks)
                .id(d => d.id)
                .distance(d => 80 / (d.strength + 0.1))
                .strength(d => d.strength * 0.5))
            .force('charge', d3.forceManyBody().strength(-400))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(50))
            .force('x', d3.forceX(width / 2).strength(0.05))
            .force('y', d3.forceY(height / 2).strength(0.05));

        // Draw links
        const link = g.append('g')
            .selectAll('line')
            .data(filteredLinks)
            .join('line')
            .attr('stroke', d => {
                const sourceId = (d.source as GraphNode).id || d.source as string;
                const targetId = (d.target as GraphNode).id || d.target as string;
                if (highlightedPath.includes(sourceId) && highlightedPath.includes(targetId)) {
                    return '#8b5cf6';
                }
                return '#cbd5e1';
            })
            .attr('stroke-opacity', d => {
                const sourceId = (d.source as GraphNode).id || d.source as string;
                const targetId = (d.target as GraphNode).id || d.target as string;
                if (highlightedPath.includes(sourceId) && highlightedPath.includes(targetId)) {
                    return 0.8;
                }
                return 0.2 + d.strength * 0.6;
            })
            .attr('stroke-width', d => 1 + d.strength * 4);

        // Draw nodes
        const node = g.append('g')
            .selectAll('g')
            .data(filteredNodes)
            .join('g')
            .attr('cursor', 'pointer')
            .call(d3.drag<SVGGElement, GraphNode>()
                .on('start', (event, d) => {
                    if (!event.active) simulation.alphaTarget(0.3).restart();
                    d.fx = d.x;
                    d.fy = d.y;
                })
                .on('drag', (event, d) => {
                    d.fx = event.x;
                    d.fy = event.y;
                })
                .on('end', (event, d) => {
                    if (!event.active) simulation.alphaTarget(0);
                    d.fx = null;
                    d.fy = null;
                }));

        // Node Glow/Pulse for Syncing
        const nodeGlow = node.append('circle')
            .attr('r', 25)
            .attr('fill', '#14b8a6')
            .attr('opacity', 0)
            .attr('class', isSyncing ? 'animate-pulse' : '');

        if (isSyncing) {
            nodeGlow
                .transition()
                .duration(2000)
                .attr('opacity', 0.2)
                .style('filter', 'blur(4px)')
                .attr('r', 35);
        }

        // Node circles with size based on importance
        node.append('circle')
            .attr('r', d => 15 + (d.importance || 0) * 2)
            .attr('fill', d => highlightedPath.includes(d.id) ? d.color : d.color + 'cc')
            .attr('stroke', d => highlightedPath.includes(d.id) ? '#fbbf24' : '#fff')
            .attr('stroke-width', d => highlightedPath.includes(d.id) ? 4 : 3)
            .on('click', (event, d) => {
                event.stopPropagation();
                setSelectedNode(d);
            })
            .on('mouseenter', function (event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('r', 15 + (d.importance || 0) * 2 + 5);

                // Highlight connected nodes
                const connectedIds = new Set<string>();
                filteredLinks.forEach(l => {
                    const sourceId = (l.source as GraphNode).id || l.source as string;
                    const targetId = (l.target as GraphNode).id || l.target as string;
                    if (sourceId === d.id) connectedIds.add(targetId);
                    if (targetId === d.id) connectedIds.add(sourceId);
                });

                node.selectAll('circle')
                    .attr('opacity', (n: any) => connectedIds.has(n.id) || n.id === d.id ? 1 : 0.3);
                link.attr('opacity', l => {
                    const sourceId = (l.source as GraphNode).id || l.source as string;
                    const targetId = (l.target as GraphNode).id || l.target as string;
                    return (sourceId === d.id || targetId === d.id) ? 0.8 : 0.1;
                });
            })
            .on('mouseleave', function (event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('r', 15 + (d.importance || 0) * 2);

                node.selectAll('circle').attr('opacity', 1);
                link.attr('opacity', l => 0.2 + l.strength * 0.6);
            });

        // Importance indicator (ring for highly connected nodes)
        node.filter(d => (d.importance || 0) > 3)
            .append('circle')
            .attr('r', d => 20 + (d.importance || 0) * 2)
            .attr('fill', 'none')
            .attr('stroke', d => d.color)
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '4,4')
            .attr('opacity', 0.3)
            .style('pointer-events', 'none');

        // Node labels
        node.append('text')
            .text(d => d.label.length > 20 ? d.label.substring(0, 20) + '...' : d.label)
            .attr('text-anchor', 'middle')
            .attr('dy', d => 25 + (d.importance || 0) * 2)
            .attr('font-size', '10px')
            .attr('font-weight', 'bold')
            .attr('fill', '#1f2937')
            .style('pointer-events', 'none');

        // Learning path indicators
        if (showLearningPath && highlightedPath.length > 0) {
            node.filter(d => highlightedPath.includes(d.id))
                .append('text')
                .text(d => (highlightedPath.indexOf(d.id) + 1).toString())
                .attr('text-anchor', 'middle')
                .attr('dy', 5)
                .attr('font-size', '12px')
                .attr('font-weight', 'bold')
                .attr('fill', '#fff')
                .style('pointer-events', 'none');
        }

        // Update positions on tick
        simulation.on('tick', () => {
            link
                .attr('x1', d => (d.source as GraphNode).x!)
                .attr('y1', d => (d.source as GraphNode).y!)
                .attr('x2', d => (d.target as GraphNode).x!)
                .attr('y2', d => (d.target as GraphNode).y!);

            node.attr('transform', d => `translate(${d.x},${d.y})`);
        });

        // Cleanup
        return () => {
            simulation.stop();
        };
    }, [filteredNodes, links, dimensions.width, dimensions.height, highlightedPath, showLearningPath]);

    const handleZoomIn = () => {
        const svg = d3.select(svgRef.current);
        svg.transition().call(d3.zoom<SVGSVGElement, unknown>().scaleBy as any, 1.3);
    };

    const handleZoomOut = () => {
        const svg = d3.select(svgRef.current);
        svg.transition().duration(500).call(d3.zoom<SVGSVGElement, unknown>().scaleBy as any, 0.7);
    };

    const handleAutoFit = () => {
        if (!svgRef.current || filteredNodes.length === 0) return;
        const { width, height } = dimensions;
        const svg = d3.select(svgRef.current);

        const nodesX = filteredNodes.map(n => n.x!);
        const nodesY = filteredNodes.map(n => n.y!);

        const minX = Math.min(...nodesX) - 50;
        const maxX = Math.max(...nodesX) + 50;
        const minY = Math.min(...nodesY) - 50;
        const maxY = Math.max(...nodesY) + 50;

        const graphWidth = maxX - minX;
        const graphHeight = maxY - minY;

        const scale = Math.min(width / graphWidth, height / graphHeight, 2);
        const translateX = width / 2 - (minX + graphWidth / 2) * scale;
        const translateY = height / 2 - (minY + graphHeight / 2) * scale;

        svg.transition()
            .duration(750)
            .call(d3.zoom<SVGSVGElement, unknown>().transform as any, d3.zoomIdentity.translate(translateX, translateY).scale(scale));
    };

    const handleReset = () => {
        const svg = d3.select(svgRef.current);
        svg.transition().duration(500).call(d3.zoom<SVGSVGElement, unknown>().transform as any, d3.zoomIdentity);
    };

    const exportStudyGuide = () => {
        const learningPath = generateLearningPath();
        const orderedConcepts = learningPath.map(id => nodes.find(n => n.id === id)!).filter(Boolean);

        let markdown = `# Study Guide\n\n`;
        markdown += `Generated: ${new Date().toLocaleDateString()}\n\n`;
        markdown += `## Recommended Learning Path\n\n`;

        orderedConcepts.forEach((node, i) => {
            markdown += `### ${i + 1}. ${node.label}\n\n`;
            markdown += `**Category:** ${node.category}\n\n`;
            markdown += `${node.explanation}\n\n`;
            markdown += `**Connections:** ${links.filter(l =>
                (l.source as any).id === node.id || (l.target as any).id === node.id
            ).length}\n\n`;
            markdown += `---\n\n`;
        });

        const blob = new Blob([markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'study-guide.md';
        a.click();
        URL.revokeObjectURL(url);
    };

    const toggleLearningPath = () => {
        if (!showLearningPath) {
            const path = generateLearningPath();
            setHighlightedPath(path);
            setShowLearningPath(true);
        } else {
            setHighlightedPath([]);
            setShowLearningPath(false);
        }
    };

    return (
        <div className={`apple-card overflow-hidden flex flex-col ${isFullscreen ? 'fixed inset-4 md:inset-8 z-[101]' : 'min-h-[600px]'}`}>
            {/* Header */}
            <div className="flex flex-col gap-4 p-6 border-b border-black/[0.04]">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/30 flex items-center gap-2 mb-1">
                            <Network className="w-3 h-3" />
                            Interactive Knowledge Graph
                        </h3>
                        <p className="text-[9px] text-black/20 font-medium">AI-Powered Concept Network • Drag nodes • Zoom to explore</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-black/[0.03] text-black/40 text-[8px] font-bold rounded-full border border-black/[0.03]">
                            {filteredNodes.length}/{nodes.length} Nodes
                        </span>
                        <button
                            onClick={handleZoomIn}
                            className="p-1.5 hover:bg-black/5 rounded-lg transition-all"
                            title="Zoom in"
                        >
                            <ZoomIn className="w-3 h-3 text-black/30" />
                        </button>
                        <button
                            onClick={handleZoomOut}
                            className="p-1.5 hover:bg-black/5 rounded-lg transition-all"
                            title="Zoom out"
                        >
                            <ZoomOut className="w-3 h-3 text-black/30" />
                        </button>
                        <button
                            onClick={handleAutoFit}
                            className="p-1.5 hover:bg-black/5 rounded-lg transition-all"
                            title="Fit neural map"
                        >
                            <Route className="w-3.5 h-3.5 text-purple-500" />
                        </button>
                        <button
                            onClick={handleReset}
                            className="p-1.5 hover:bg-black/5 rounded-lg transition-all"
                            title="Reset view"
                        >
                            <Minimize2 className="w-3 h-3 text-black/30" />
                        </button>
                        <button
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            className="p-1.5 hover:bg-black/5 rounded-lg transition-all"
                            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                        >
                            <Maximize2 className="w-3 h-3 text-black/30" />
                        </button>
                    </div>
                </div>

                {/* Functional Controls */}
                <div className="flex flex-wrap gap-2">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-black/30" />
                        <input
                            type="text"
                            placeholder="Search concepts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 bg-black/[0.02] border border-black/5 rounded-lg text-[11px] font-medium focus:ring-1 focus:ring-black/20 transition-all outline-none"
                        />
                    </div>
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="px-3 py-2 bg-black/[0.02] border border-black/5 rounded-lg text-[11px] font-bold focus:ring-1 focus:ring-black/20 transition-all outline-none"
                    >
                        <option value="all">All Categories</option>
                        <option value="concept">Concepts</option>
                        <option value="formula">Formulas</option>
                        <option value="example">Examples</option>
                        <option value="trend">Trends</option>
                    </select>
                    <button
                        onClick={toggleLearningPath}
                        className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${showLearningPath
                            ? 'bg-purple-600 text-white shadow-lg'
                            : 'bg-black/[0.02] text-black/60 hover:bg-black/[0.04]'
                            }`}
                    >
                        <Route className="w-3 h-3" />
                        Learning Path
                    </button>
                    <button
                        onClick={exportStudyGuide}
                        className="px-4 py-2 bg-black/[0.02] text-black/60 hover:bg-black/[0.04] rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2"
                    >
                        <FileText className="w-3 h-3" />
                        Export Guide
                    </button>
                </div>
            </div>

            {/* Legend */}
            {concepts.length > 0 && (
                <div className="px-6 py-3 border-b border-black/[0.04] flex flex-wrap gap-x-4 gap-y-2 text-[8px] font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#8b5cf6' }} />
                        <span className="text-black/30">Concept</span>
                    </div>
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#3b82f6' }} />
                        <span className="text-black/30">Formula</span>
                    </div>
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f59e0b' }} />
                        <span className="text-black/30">Example</span>
                    </div>
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#10b981' }} />
                        <span className="text-black/30">Trend</span>
                    </div>
                    <div className="flex items-center gap-1.5 whitespace-nowrap ml-4">
                        <div className="w-3 h-3 rounded-full border-2 border-dashed border-black/30" />
                        <span className="text-black/30">Highly Connected</span>
                    </div>
                </div>
            )}

            {/* Graph Canvas */}
            <div ref={containerRef} className="flex-1 relative bg-gradient-to-br from-indigo-50/30 via-purple-50/20 to-pink-50/30">
                {concepts.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-30 p-8">
                        <Network className="w-16 h-16 mb-4 text-purple-500" strokeWidth={1.5} />
                        <p className="text-sm font-bold uppercase tracking-widest leading-loose text-black/40">
                            Listening for Concepts
                        </p>
                        <p className="text-[10px] text-black/20 mt-2 max-w-xs">
                            The graph will build automatically as concepts are discovered in your lecture
                        </p>
                    </div>
                ) : (
                    <svg ref={svgRef} className="w-full h-full" />
                )}
            </div>

            {/* Selected Node Detail */}
            {selectedNode && (
                <div className="absolute bottom-6 left-6 right-6 bg-white rounded-2xl shadow-2xl border border-black/10 p-6 animate-scale-in max-w-lg mx-auto">
                    <button
                        onClick={() => setSelectedNode(null)}
                        className="absolute top-4 right-4 p-1 hover:bg-black/5 rounded-lg transition-all"
                    >
                        <Minimize2 className="w-4 h-4 text-black/40" />
                    </button>
                    <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: selectedNode.color }}>
                            {selectedNode.category === 'formula' && <Calculator className="w-5 h-5 text-white" />}
                            {selectedNode.category === 'example' && <Lightbulb className="w-5 h-5 text-white" />}
                            {selectedNode.category === 'trend' && <TrendingUp className="w-5 h-5 text-white" />}
                            {selectedNode.category === 'concept' && <BookOpen className="w-5 h-5 text-white" />}
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-lg mb-1">{selectedNode.label}</h4>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="inline-block px-2 py-1 rounded-full text-[8px] font-bold uppercase tracking-wider"
                                    style={{ backgroundColor: selectedNode.color + '20', color: selectedNode.color }}>
                                    {selectedNode.category}
                                </span>
                                <span className="text-[9px] text-black/40 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(selectedNode.timestamp).toLocaleTimeString()}
                                </span>
                                <span className="text-[9px] text-black/40">
                                    {selectedNode.importance || 0} connections
                                </span>
                            </div>
                        </div>
                    </div>
                    <p className="text-sm text-black/70 leading-relaxed max-h-[200px] overflow-y-auto custom-scrollbar">
                        {selectedNode.explanation}
                    </p>
                </div>
            )}

            {/* Learning Path Info */}
            {showLearningPath && highlightedPath.length > 0 && (
                <div className="absolute top-20 right-6 bg-white rounded-2xl shadow-xl border border-purple-200 p-4 max-w-xs animate-scale-in">
                    <div className="flex items-center gap-2 mb-2">
                        <Route className="w-4 h-4 text-purple-600" />
                        <h4 className="font-bold text-sm text-purple-900">Recommended Study Order</h4>
                    </div>
                    <p className="text-[10px] text-black/60 leading-relaxed">
                        Follow the numbered path (1 → {highlightedPath.length}) for optimal learning.
                        Foundational concepts are prioritized based on connections and chronology.
                    </p>
                </div>
            )}
        </div>
    );
};

export default EnhancedKnowledgeGraph;
