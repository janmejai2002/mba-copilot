import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as d3 from 'd3';
import { Maximize2, Minimize2, ZoomIn, ZoomOut, RefreshCw, Sparkles, Clock, ChevronDown, Layers3 } from 'lucide-react';
import { Concept } from '../types';
import { DepthExpansionService } from '../services/depthExpansion';

interface NeuralNexusProps {
    concepts: Concept[];
    isSyncing?: boolean;
    onNodeClick?: (concept: Concept) => void;
    sessionContext?: string;
}

interface GraphNode extends d3.SimulationNodeDatum {
    id: string;
    label: string;
    explanation: string;
    category: string;
    color: string;
    importance: number;
    timestamp: number;
    depth: number;
    parentId?: string;
    children?: Concept[];
    isExpanded: boolean;
    x?: number;
    y?: number;
    z?: number;
}

const NeuralNexus: React.FC<NeuralNexusProps> = ({ concepts, isSyncing, onNodeClick, sessionContext = '' }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<{
        scene: THREE.Scene;
        camera: THREE.PerspectiveCamera;
        renderer: THREE.WebGLRenderer;
        controls: OrbitControls;
        objects: THREE.Group;
        lines: THREE.Group;
    } | null>(null);

    const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
    const [timelinePosition, setTimelinePosition] = useState(100); // 0-100%
    const [isExpanding, setIsExpanding] = useState(false);
    const [expandedConcepts, setExpandedConcepts] = useState<Map<string, Concept>>(new Map());

    // Temporal filtering
    const filteredConcepts = useMemo(() => {
        if (concepts.length === 0) return [];
        const minTime = Math.min(...concepts.map(c => c.timestamp));
        const maxTime = Math.max(...concepts.map(c => c.timestamp));
        const cutoffTime = minTime + ((maxTime - minTime) * timelinePosition / 100);
        return concepts.filter(c => c.timestamp <= cutoffTime);
    }, [concepts, timelinePosition]);

    // Process concepts into nodes
    const nodes: GraphNode[] = useMemo(() => {
        const allNodes: GraphNode[] = [];

        filteredConcepts.forEach((c, i) => {
            const expanded = expandedConcepts.get(c.keyword);
            const nodeData = expanded || c;

            allNodes.push({
                id: `node-${i}`,
                label: nodeData.keyword,
                explanation: nodeData.explanation,
                category: nodeData.category || 'concept',
                color: getColorByCategory(nodeData.category || 'concept'),
                importance: 1 + (nodeData.depth || 0) * 0.5,
                timestamp: nodeData.timestamp,
                depth: nodeData.depth || 0,
                parentId: nodeData.parentId,
                children: nodeData.children,
                isExpanded: nodeData.isExpanded || false,
                x: (Math.random() - 0.5) * 400,
                y: (Math.random() - 0.5) * 400,
                z: (Math.random() - 0.5) * 400
            });

            // Add child nodes if expanded
            if (nodeData.children && nodeData.children.length > 0) {
                nodeData.children.forEach((child, childIdx) => {
                    allNodes.push({
                        id: `node-${i}-child-${childIdx}`,
                        label: child.keyword,
                        explanation: child.explanation,
                        category: child.category || 'concept',
                        color: getColorByCategory(child.category || 'concept'),
                        importance: 1 + (child.depth || 0) * 0.5,
                        timestamp: child.timestamp,
                        depth: child.depth || 0,
                        parentId: child.parentId,
                        children: child.children,
                        isExpanded: child.isExpanded || false,
                        x: (Math.random() - 0.5) * 400,
                        y: (Math.random() - 0.5) * 400,
                        z: (Math.random() - 0.5) * 400
                    });
                });
            }
        });

        return allNodes;
    }, [filteredConcepts, expandedConcepts]);

    const links = useMemo(() => {
        const l = [];
        for (let i = 0; i < nodes.length; i++) {
            // Connect to parent
            if (nodes[i].parentId) {
                const parent = nodes.find(n => n.label === nodes[i].parentId);
                if (parent) {
                    l.push({ source: parent.id, target: nodes[i].id });
                }
            }
            // Sequential connections for root nodes
            if (i > 0 && !nodes[i].parentId && !nodes[i - 1].parentId) {
                l.push({ source: nodes[i - 1].id, target: nodes[i].id });
            }
            // Random cross-links
            if (i > 2 && Math.random() > 0.7 && !nodes[i].parentId) {
                l.push({ source: nodes[i].id, target: nodes[Math.floor(Math.random() * i)].id });
            }
        }
        return l;
    }, [nodes]);

    const handleExpandNode = async (node: GraphNode) => {
        if (node.isExpanded || node.depth >= 3) return;

        setIsExpanding(true);
        try {
            const concept: Concept = {
                keyword: node.label,
                explanation: node.explanation,
                timestamp: node.timestamp,
                depth: node.depth,
                category: node.category as any
            };

            const children = await DepthExpansionService.expandConcept({
                concept,
                targetDepth: node.depth + 1,
                sessionContext
            });

            const expandedConcept: Concept = {
                ...concept,
                children,
                isExpanded: true
            };

            setExpandedConcepts(prev => new Map(prev).set(node.label, expandedConcept));
        } catch (error) {
            console.error('Expansion failed:', error);
        } finally {
            setIsExpanding(false);
        }
    };

    function getColorByCategory(category: string): string {
        const colors: Record<string, string> = {
            formula: '#f59e0b',
            trend: '#8b5cf6',
            example: '#10b981',
            concept: '#14b8a6',
            definition: '#3b82f6'
        };
        return colors[category] || '#14b8a6';
    }

    useEffect(() => {
        if (!containerRef.current) return;

        // --- SCENE SETUP ---
        const scene = new THREE.Scene();
        scene.background = new THREE.Color('#000005');
        scene.fog = new THREE.FogExp2('#000005', 0.001);

        const camera = new THREE.PerspectiveCamera(75, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 5000);
        camera.position.z = 800;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        containerRef.current.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;

        const objects = new THREE.Group();
        const lines = new THREE.Group();
        scene.add(objects);
        scene.add(lines);

        // --- ATMOSPHERE (STARS) ---
        const starGeo = new THREE.BufferGeometry();
        const starCoords = [];
        for (let i = 0; i < 2000; i++) {
            starCoords.push((Math.random() - 0.5) * 3000, (Math.random() - 0.5) * 3000, (Math.random() - 0.5) * 3000);
        }
        starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starCoords, 3));
        const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.7, transparent: true, opacity: 0.5 });
        scene.add(new THREE.Points(starGeo, starMat));

        // --- LIGHTING ---
        const ambientLight = new THREE.AmbientLight(0x404040, 2);
        scene.add(ambientLight);
        const pointLight = new THREE.PointLight(0x14b8a6, 2, 1000);
        scene.add(pointLight);

        sceneRef.current = { scene, camera, renderer, controls, objects, lines };

        // --- D3 FORCE SIMULATION (3D) ---
        const simulation = d3.forceSimulation<GraphNode>(nodes)
            .force('link', d3.forceLink(links).id((d: any) => d.id).distance(150))
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(0, 0))
            .on('tick', () => {
                nodes.forEach(node => {
                    if (node.z === undefined) node.z = (Math.random() - 0.5) * 200;
                    node.z += (Math.random() - 0.5) * 2;

                    const mesh = objects.children.find(m => (m as any).nodeId === node.id);
                    if (mesh) {
                        mesh.position.set(node.x || 0, node.y || 0, node.z || 0);
                    }
                });

                lines.clear();
                links.forEach(link => {
                    const source = nodes.find(n => n.id === ((link.source as any).id || link.source));
                    const target = nodes.find(n => n.id === ((link.target as any).id || link.target));
                    if (source && target) {
                        const geometry = new THREE.BufferGeometry().setFromPoints([
                            new THREE.Vector3(source.x || 0, source.y || 0, source.z || 0),
                            new THREE.Vector3(target.x || 0, target.y || 0, target.z || 0)
                        ]);
                        const material = new THREE.LineBasicMaterial({ color: 0x14b8a6, transparent: true, opacity: 0.2 });
                        lines.add(new THREE.Line(geometry, material));
                    }
                });
            });

        // --- CREATE MESHES ---
        nodes.forEach(node => {
            const geometry = new THREE.SphereGeometry(node.importance * 3, 32, 32);
            const material = new THREE.MeshPhongMaterial({
                color: node.color,
                emissive: node.color,
                emissiveIntensity: 0.5,
                shininess: 100
            });
            const mesh = new THREE.Mesh(geometry, material);
            (mesh as any).nodeId = node.id;
            mesh.position.set(node.x || 0, node.y || 0, node.z || 0);
            objects.add(mesh);

            // Add glow ring
            const ringGeo = new THREE.TorusGeometry(node.importance * 4, 0.2, 16, 100);
            const ringMat = new THREE.MeshBasicMaterial({ color: node.color, transparent: true, opacity: 0.3 });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = Math.random() * Math.PI;
            mesh.add(ring);
        });

        // --- ANIMATION LOOP ---
        const animate = () => {
            if (!sceneRef.current) return;
            requestAnimationFrame(animate);
            controls.update();

            objects.children.forEach(mesh => {
                mesh.children.forEach(child => {
                    child.rotation.y += 0.01;
                });
            });

            renderer.render(scene, camera);
        };
        animate();

        // --- INTERACTION ---
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        const onMouseMove = (event: MouseEvent) => {
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect) {
                mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
                mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            }
        };

        const onClick = () => {
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(objects.children);
            if (intersects.length > 0) {
                const nodeId = (intersects[0].object as any).nodeId;
                const node = nodes.find(n => n.id === nodeId);
                if (node) {
                    setSelectedNode(node);
                    if (onNodeClick) {
                        const concept: Concept = {
                            keyword: node.label,
                            explanation: node.explanation,
                            timestamp: node.timestamp,
                            depth: node.depth,
                            category: node.category as any
                        };
                        onNodeClick(concept);
                    }
                }
            } else {
                setSelectedNode(null);
            }
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('click', onClick);

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('click', onClick);
            simulation.stop();
            renderer.dispose();
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        };
    }, [nodes, links]);

    return (
        <div className="relative w-full h-full min-h-[500px] bg-black overflow-hidden rounded-[2.5rem]">
            <div ref={containerRef} className="w-full h-full" />

            {/* HUD Overlay */}
            <div className="absolute top-8 left-8 pointer-events-none">
                <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-[var(--vidyos-teal)] mb-2">Neural Nexus 3.0</h3>
                <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest">Temporal 4-Layer Intelligence Graph</p>
            </div>

            {/* Temporal Timeline */}
            <div className="absolute bottom-32 left-1/2 -translate-x-1/2 w-full max-w-2xl px-8 pointer-events-auto">
                <div className="bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-6">
                    <div className="flex items-center gap-4 mb-4">
                        <Clock className="w-4 h-4 text-[var(--vidyos-teal)]" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Thought Progression</span>
                        <span className="ml-auto text-[10px] font-black text-[var(--vidyos-teal)]">{Math.round(timelinePosition)}%</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={timelinePosition}
                        onChange={(e) => setTimelinePosition(Number(e.target.value))}
                        className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-[var(--vidyos-teal)]"
                    />
                </div>
            </div>

            <div className="absolute bottom-8 right-8 flex gap-4">
                <button className="p-3 bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl hover:bg-white/20 transition-all">
                    <Sparkles className="w-4 h-4 text-[var(--vidyos-teal)]" />
                </button>
                <div className="flex items-center gap-2 px-6 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl">
                    <div className="w-2 h-2 bg-[var(--vidyos-teal)] rounded-full animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{nodes.length} Neural Nodes</span>
                </div>
            </div>

            {selectedNode && (
                <div className="absolute top-1/2 left-8 -translate-y-1/2 w-80 bg-white/10 backdrop-blur-3xl border border-white/20 rounded-[2.5rem] p-8 animate-apple-in shadow-2xl">
                    <button onClick={() => setSelectedNode(null)} className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-xl">
                        <Minimize2 className="w-3 h-3 text-white/40" />
                    </button>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(20,184,166,0.5)]" style={{ backgroundColor: selectedNode.color }}>
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h4 className="text-white font-black text-lg tracking-tight">{selectedNode.label}</h4>
                            <div className="flex items-center gap-2">
                                <Layers3 className="w-3 h-3 text-[var(--vidyos-teal)]" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-[var(--vidyos-teal)]">Depth {selectedNode.depth}</span>
                            </div>
                        </div>
                    </div>
                    <p className="text-white/70 text-sm leading-relaxed mb-6 font-medium">
                        {selectedNode.explanation}
                    </p>
                    {selectedNode.depth < 3 && !selectedNode.isExpanded && (
                        <button
                            onClick={() => handleExpandNode(selectedNode)}
                            disabled={isExpanding}
                            className="w-full py-3 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all flex items-center justify-center gap-2"
                        >
                            {isExpanding ? 'Expanding...' : <><ChevronDown className="w-4 h-4" /> Drill Deeper</>}
                        </button>
                    )}
                    {selectedNode.children && selectedNode.children.length > 0 && (
                        <div className="mt-4 text-[9px] text-white/40 font-bold uppercase tracking-widest">
                            {selectedNode.children.length} Sub-Concepts Loaded
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NeuralNexus;
