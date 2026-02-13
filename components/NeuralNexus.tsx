import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
    Sparkles, Clock, Layers3, Brain, Zap, BookOpen,
    TrendingUp, Calculator, FileText, Target, RotateCcw,
    ZoomIn, ZoomOut, Maximize2, Play, Pause
} from 'lucide-react';
import { useKnowledgeStore, SemanticNode } from '../stores/useKnowledgeStore';
import { getMasteryLevel, calculateDecay } from '../services/spaced-repetition';
import { masterIntelligence } from '../services/intelligence';

interface NeuralNexusProps {
    sessionId?: string;
    onNodeClick?: (node: SemanticNode) => void;
    onAgentResponse?: (res: any) => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
    concept: <BookOpen className="w-4 h-4" />,
    formula: <Calculator className="w-4 h-4" />,
    example: <FileText className="w-4 h-4" />,
    trend: <TrendingUp className="w-4 h-4" />,
    definition: <Brain className="w-4 h-4" />
};

const CATEGORY_COLORS: Record<string, string> = {
    concept: '#14b8a6',
    formula: '#f59e0b',
    example: '#10b981',
    trend: '#8b5cf6',
    definition: '#3b82f6'
};

const NeuralNexus: React.FC<NeuralNexusProps> = ({ sessionId, onNodeClick, onAgentResponse }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<{
        scene: THREE.Scene;
        camera: THREE.PerspectiveCamera;
        renderer: THREE.WebGLRenderer;
        controls: OrbitControls;
        nodeGroup: THREE.Group;
        lineGroup: THREE.Group;
        animationId: number;
    } | null>(null);

    const { nodes, getStats, getDueNodes, reviewNode, buildConnections, isProcessing } = useKnowledgeStore();
    const [selectedNode, setSelectedNode] = useState<SemanticNode | null>(null);
    const [isAutoRotate, setIsAutoRotate] = useState(true);
    const [viewMode, setViewMode] = useState<'3d' | 'mastery' | 'timeline'>('3d');
    const [showDueOnly, setShowDueOnly] = useState(false);

    const stats = getStats();
    const dueNodes = getDueNodes();

    // Convert Map to array for rendering
    const nodeArray = useMemo(() => {
        const arr = Array.from(nodes.values());
        let filtered = arr;

        if (sessionId) {
            // Filter by session ID (assuming node has filtered property or we filter by source)
            // If nodes don't have sessionId, we might need a workaround.
            // Assuming nodes might have a 'sessionId' or 'sourceId' property.
            filtered = arr.filter(n => (n as any).sessionId === sessionId || (n as any).sourceId === sessionId);
        }

        if (showDueOnly) {
            const dueIds = new Set(dueNodes.map(n => n.id));
            filtered = filtered.filter(n => dueIds.has(n.id));
        }
        return filtered;
    }, [nodes, showDueOnly, dueNodes, sessionId]);

    // Initialize Three.js scene
    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight;

        // Scene setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color('#030712');
        scene.fog = new THREE.FogExp2('#030712', 0.0008);

        // Camera
        const camera = new THREE.PerspectiveCamera(60, width / height, 1, 5000);
        camera.position.set(0, 0, 500);

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);

        // Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.autoRotate = isAutoRotate;
        controls.autoRotateSpeed = 0.5;

        // Node and Line groups
        const nodeGroup = new THREE.Group();
        const lineGroup = new THREE.Group();
        scene.add(nodeGroup);
        scene.add(lineGroup);

        // Ambient starfield
        const starGeometry = new THREE.BufferGeometry();
        const starPositions = [];
        for (let i = 0; i < 3000; i++) {
            starPositions.push(
                (Math.random() - 0.5) * 4000,
                (Math.random() - 0.5) * 4000,
                (Math.random() - 0.5) * 4000
            );
        }
        starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
        const starMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 1,
            transparent: true,
            opacity: 0.4
        });
        scene.add(new THREE.Points(starGeometry, starMaterial));

        // Lighting
        scene.add(new THREE.AmbientLight(0x404040, 1.5));
        const pointLight = new THREE.PointLight(0x14b8a6, 2, 1000);
        pointLight.position.set(100, 100, 100);
        scene.add(pointLight);

        const pointLight2 = new THREE.PointLight(0xf59e0b, 1, 800);
        pointLight2.position.set(-100, -100, 50);
        scene.add(pointLight2);

        // Store references
        sceneRef.current = { scene, camera, renderer, controls, nodeGroup, lineGroup, animationId: 0 };

        // Animation loop
        const animate = () => {
            if (!sceneRef.current) return;
            sceneRef.current.animationId = requestAnimationFrame(animate);

            controls.update();

            // Gentle node oscillation
            nodeGroup.children.forEach((mesh, i) => {
                mesh.position.y += Math.sin(Date.now() * 0.001 + i) * 0.02;
                mesh.rotation.y += 0.002;
            });

            renderer.render(scene, camera);
        };
        animate();

        // Raycaster for interaction
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        const onMouseMove = (event: MouseEvent) => {
            const rect = container.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        };

        const onClick = () => {
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(nodeGroup.children);

            if (intersects.length > 0) {
                const nodeId = (intersects[0].object as any).userData?.nodeId;
                const node = nodes.get(nodeId);
                if (node) {
                    setSelectedNode(node);
                    onNodeClick?.(node);
                }
            } else {
                setSelectedNode(null);
            }
        };

        container.addEventListener('mousemove', onMouseMove);
        container.addEventListener('click', onClick);

        // Resize handler
        const onResize = () => {
            if (!containerRef.current) return;
            const w = containerRef.current.clientWidth;
            const h = containerRef.current.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };
        window.addEventListener('resize', onResize);

        return () => {
            container.removeEventListener('mousemove', onMouseMove);
            container.removeEventListener('click', onClick);
            window.removeEventListener('resize', onResize);

            if (sceneRef.current) {
                cancelAnimationFrame(sceneRef.current.animationId);
                sceneRef.current.renderer.dispose();
            }
            container.innerHTML = '';
        };
    }, []);

    // Update auto-rotate
    useEffect(() => {
        if (sceneRef.current) {
            sceneRef.current.controls.autoRotate = isAutoRotate;
        }
    }, [isAutoRotate]);

    // Update nodes in scene
    useEffect(() => {
        if (!sceneRef.current) return;

        const { nodeGroup, lineGroup } = sceneRef.current;

        // Clear existing
        nodeGroup.clear();
        lineGroup.clear();

        // Position nodes in 3D space
        const positions = new Map<string, THREE.Vector3>();
        const nodeList = nodeArray;

        nodeList.forEach((node, i) => {
            const phi = Math.acos(-1 + (2 * i) / nodeList.length);
            const theta = Math.sqrt(nodeList.length * Math.PI) * phi;
            const radius = 200 + node.depth * 50;

            const x = radius * Math.cos(theta) * Math.sin(phi);
            const y = radius * Math.sin(theta) * Math.sin(phi);
            const z = radius * Math.cos(phi);

            positions.set(node.id, new THREE.Vector3(x, y, z));

            // Node size based on mastery
            const mastery = calculateDecay(node.srs);
            const baseSize = 8 + node.connections.length * 2;
            const size = baseSize * (0.5 + mastery * 0.5);

            // Color based on category and mastery
            const categoryColor = new THREE.Color(CATEGORY_COLORS[node.category] || '#14b8a6');
            const masteryLevel = getMasteryLevel(mastery);

            // Create node mesh
            const geometry = new THREE.SphereGeometry(size, 32, 32);
            const material = new THREE.MeshPhongMaterial({
                color: categoryColor,
                emissive: categoryColor,
                emissiveIntensity: 0.3 + mastery * 0.4,
                shininess: 100,
                transparent: true,
                opacity: 0.5 + mastery * 0.5
            });

            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(x, y, z);
            (mesh as any).userData = { nodeId: node.id };
            nodeGroup.add(mesh);

            // Add glowing ring for mastered nodes
            if (mastery >= 0.7) {
                const ringGeometry = new THREE.TorusGeometry(size * 1.5, 0.5, 16, 100);
                const ringMaterial = new THREE.MeshBasicMaterial({
                    color: 0x10b981,
                    transparent: true,
                    opacity: 0.6
                });
                const ring = new THREE.Mesh(ringGeometry, ringMaterial);
                ring.rotation.x = Math.PI / 2;
                mesh.add(ring);
            }

            // Add pulsing core for due items
            if (node.srs.nextReview <= Date.now()) {
                const coreGeometry = new THREE.SphereGeometry(size * 0.3, 16, 16);
                const coreMaterial = new THREE.MeshBasicMaterial({
                    color: 0xef4444,
                    transparent: true,
                    opacity: 0.8
                });
                const core = new THREE.Mesh(coreGeometry, coreMaterial);
                mesh.add(core);
            }
        });

        // Draw connections
        nodeList.forEach(node => {
            const sourcePos = positions.get(node.id);
            if (!sourcePos) return;

            node.connections.forEach(conn => {
                const targetPos = positions.get(conn.targetId);
                if (!targetPos) return;

                const geometry = new THREE.BufferGeometry().setFromPoints([sourcePos, targetPos]);
                const material = new THREE.LineBasicMaterial({
                    color: 0x14b8a6,
                    transparent: true,
                    opacity: 0.1 + conn.strength * 0.3
                });
                lineGroup.add(new THREE.Line(geometry, material));
            });
        });
    }, [nodeArray]);

    const handleReview = (quality: 0 | 1 | 2 | 3 | 4 | 5) => {
        if (selectedNode) {
            reviewNode(selectedNode.id, quality);
            setSelectedNode(null);
        }
    };

    const handleRebuildConnections = async () => {
        await buildConnections();
    };

    return (
        <div className="relative w-full h-full min-h-[600px] bg-[#030712] overflow-hidden rounded-3xl">
            {/* 3D Canvas Container */}
            <div ref={containerRef} className="w-full h-full" />

            {/* Top HUD */}
            <div className="absolute top-6 left-6 right-6 flex justify-between items-start pointer-events-none">
                <div>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-[var(--vidyos-teal)] mb-1 flex items-center gap-2">
                        <Brain className="w-4 h-4" />
                        Neural Nexus 4.0
                    </h3>
                    <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest">
                        Semantic Knowledge Graph • Spaced Repetition
                    </p>
                </div>

                <div className="flex items-center gap-3 pointer-events-auto">
                    {/* View mode selector */}
                    <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
                        {(['3d', 'mastery', 'timeline'] as const).map(mode => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${viewMode === mode ? 'bg-[var(--vidyos-teal)] text-white' : 'text-white/40 hover:text-white/70'
                                    }`}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>

                    {/* Auto-rotate toggle */}
                    <button
                        onClick={() => setIsAutoRotate(!isAutoRotate)}
                        className={`p-2 rounded-xl border transition-all ${isAutoRotate ? 'bg-[var(--vidyos-teal)]/20 border-[var(--vidyos-teal)]/50' : 'bg-white/5 border-white/10'
                            }`}
                        title="Auto-rotate"
                    >
                        {isAutoRotate ? <Pause className="w-4 h-4 text-[var(--vidyos-teal)]" /> : <Play className="w-4 h-4 text-white/40" />}
                    </button>

                    {/* Rebuild connections */}
                    <button
                        onClick={handleRebuildConnections}
                        disabled={isProcessing}
                        className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all disabled:opacity-50"
                        title="Rebuild connections"
                    >
                        <RotateCcw className={`w-4 h-4 text-white/40 ${isProcessing ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end pointer-events-none">
                <div className="flex gap-4 pointer-events-auto">
                    {/* Stats cards */}
                    <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-3">
                        <div className="text-[9px] text-white/40 font-bold uppercase tracking-widest mb-1">Total Nodes</div>
                        <div className="text-2xl font-black text-white">{stats.total}</div>
                    </div>
                    <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-3">
                        <div className="text-[9px] text-white/40 font-bold uppercase tracking-widest mb-1">Mastered</div>
                        <div className="text-2xl font-black text-green-400">{stats.mastered}</div>
                    </div>
                    <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-3">
                        <div className="text-[9px] text-white/40 font-bold uppercase tracking-widest mb-1">Due Now</div>
                        <div className="text-2xl font-black text-red-400">{stats.dueNow}</div>
                    </div>
                    <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-3">
                        <div className="text-[9px] text-white/40 font-bold uppercase tracking-widest mb-1">Avg Mastery</div>
                        <div className="text-2xl font-black text-[var(--vidyos-teal)]">{Math.round(stats.averageMastery * 100)}%</div>
                    </div>
                </div>

                {/* Filter toggle */}
                <button
                    onClick={() => setShowDueOnly(!showDueOnly)}
                    className={`flex items-center gap-2 px-5 py-3 rounded-2xl border transition-all pointer-events-auto ${showDueOnly
                        ? 'bg-red-500/20 border-red-500/50 text-red-400'
                        : 'bg-white/5 border-white/10 text-white/40 hover:text-white/70'
                        }`}
                >
                    <Target className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                        {showDueOnly ? 'Showing Due' : 'Show Due Only'}
                    </span>
                </button>
            </div>

            {/* Legend */}
            <div className="absolute top-24 left-6 space-y-2 pointer-events-none">
                {Object.entries(CATEGORY_COLORS).map(([category, color]) => (
                    <div key={category} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                        <span className="text-[9px] text-white/40 font-bold uppercase tracking-widest capitalize">{category}</span>
                    </div>
                ))}
            </div>

            {/* Selected Node Panel */}
            {selectedNode && (
                <div className="absolute top-1/2 right-6 -translate-y-1/2 w-80 bg-black/60 backdrop-blur-xl border border-white/20 rounded-3xl p-6 animate-in slide-in-from-right duration-300 pointer-events-auto">
                    <div className="flex items-start gap-3 mb-4">
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: CATEGORY_COLORS[selectedNode.category] }}
                        >
                            {CATEGORY_ICONS[selectedNode.category]}
                        </div>
                        <div className="flex-1">
                            <h4 className="text-white font-black text-lg leading-tight">{selectedNode.label}</h4>
                            <div className="flex items-center gap-2 mt-1">
                                <Layers3 className="w-3 h-3 text-[var(--vidyos-teal)]" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-[var(--vidyos-teal)]">
                                    Depth {selectedNode.depth}
                                </span>
                                <span className="text-white/20">•</span>
                                <span className="text-[9px] font-black uppercase tracking-widest text-white/40">
                                    {selectedNode.connections.length} connections
                                </span>
                            </div>
                        </div>
                    </div>

                    <p className="text-white/70 text-sm leading-relaxed mb-4">
                        {selectedNode.explanation}
                    </p>

                    {/* Mastery bar */}
                    <div className="mb-4">
                        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest mb-2">
                            <span className="text-white/40">Mastery</span>
                            <span className="text-[var(--vidyos-teal)]">{Math.round(selectedNode.srs.mastery * 100)}%</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-[var(--vidyos-teal)] to-green-400 transition-all duration-500"
                                style={{ width: `${selectedNode.srs.mastery * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Review buttons */}
                    {selectedNode.srs.nextReview <= Date.now() && (
                        <div className="space-y-2">
                            <p className="text-[9px] font-black uppercase tracking-widest text-red-400 mb-2">⚡ Due for Review</p>
                            <div className="grid grid-cols-3 gap-2">
                                <button onClick={() => handleReview(1)} className="py-2 bg-red-500/20 text-red-400 rounded-xl text-[9px] font-black uppercase hover:bg-red-500/30 transition-all">
                                    Forgot
                                </button>
                                <button onClick={() => handleReview(3)} className="py-2 bg-yellow-500/20 text-yellow-400 rounded-xl text-[9px] font-black uppercase hover:bg-yellow-500/30 transition-all">
                                    Hard
                                </button>
                                <button onClick={() => handleReview(5)} className="py-2 bg-green-500/20 text-green-400 rounded-xl text-[9px] font-black uppercase hover:bg-green-500/30 transition-all">
                                    Easy
                                </button>
                            </div>
                        </div>
                    )}

                    {selectedNode.srs.nextReview > Date.now() && (
                        <div className="flex items-center gap-2 text-[9px] text-white/40">
                            <Clock className="w-3 h-3" />
                            <span className="font-bold uppercase tracking-widest">
                                Next review: {new Date(selectedNode.srs.nextReview).toLocaleDateString()}
                            </span>
                        </div>
                    )}

                    <div className="mt-6 pt-6 border-t border-white/10 flex gap-3">
                        <button
                            onClick={async () => {
                                if (!sessionId || !selectedNode) return;
                                try {
                                    const res = await masterIntelligence.askMasterMind(`Elaborate on "${selectedNode.label}" and its structural role in the knowledge graph.`, sessionId, selectedNode.label);
                                    if (onAgentResponse) onAgentResponse(res);
                                } catch (e) {
                                    console.error("MasterMind Nexus Error:", e);
                                }
                            }}
                            className="flex-1 py-3 bg-[var(--vidyos-teal)] text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.05] active:scale-[0.95] transition-all shadow-lg shadow-[var(--vidyos-teal)]/20"
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            Ask MasterMind
                        </button>
                    </div>
                </div>
            )}

            {/* Empty state */}
            {
                nodeArray.length === 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                        <Brain className="w-16 h-16 text-white/10 mb-4" />
                        <h3 className="text-xl font-black text-white/30 mb-2">No Knowledge Nodes Yet</h3>
                        <p className="text-sm text-white/20 max-w-md">
                            Start a learning session to populate your neural knowledge graph. Concepts will appear here with semantic connections and spaced repetition tracking.
                        </p>
                    </div>
                )
            }
        </div >
    );
};

export default NeuralNexus;
