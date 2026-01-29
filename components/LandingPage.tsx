
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

interface LandingPageProps {
    onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
    const canvasRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // --- THREE.JS ENGINE ---
        let scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, crystal: THREE.Group;
        let mouseX = 0, mouseY = 0;
        let targetX = 0, targetY = 0;

        const initThree = () => {
            if (!canvasRef.current) return;

            scene = new THREE.Scene();
            camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.z = 6;

            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.2));
            canvasRef.current.appendChild(renderer.domElement);

            // Antigravity Crystal Geometry
            const geometry = new THREE.IcosahedronGeometry(2, 0);
            const material = new THREE.MeshPhysicalMaterial({
                color: 0xffffff,
                metalness: 0.1,
                roughness: 0.05,
                transmission: 0.95,
                thickness: 1.5,
                transparent: true,
                opacity: 0.4,
                clearcoat: 1,
                clearcoatRoughness: 0,
            });

            const wireframeMaterial = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                wireframe: true,
                transparent: true,
                opacity: 0.1
            });

            crystal = new THREE.Group();
            const mesh = new THREE.Mesh(geometry, material);
            const wireframe = new THREE.Mesh(geometry, wireframeMaterial);
            crystal.add(mesh);
            crystal.add(wireframe);
            scene.add(crystal);

            // Inner core for depth
            const innerGeometry = new THREE.IcosahedronGeometry(1.2, 1);
            const innerMaterial = new THREE.MeshPhongMaterial({
                color: 0xffffff,
                emissive: 0xffffff,
                emissiveIntensity: 0.1,
                transparent: true,
                opacity: 0.1,
                flatShading: true
            });
            const innerMesh = new THREE.Mesh(innerGeometry, innerMaterial);
            crystal.add(innerMesh);

            const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            scene.add(ambientLight);

            const pointLight = new THREE.PointLight(0xffffff, 15);
            pointLight.position.set(5, 5, 5);
            scene.add(pointLight);

            const blueLight = new THREE.PointLight(0x0066ff, 10);
            blueLight.position.set(-5, -5, 5);
            scene.add(blueLight);

            const animate = () => {
                requestAnimationFrame(animate);
                const time = Date.now() * 0.001;

                // Gentle levitation and rotation
                crystal.position.y = Math.sin(time * 0.5) * 0.2;
                crystal.rotation.y += 0.005;
                crystal.rotation.z += 0.002;

                // Magnetic Mouse Pull
                targetX = (mouseX * 2);
                targetY = (mouseY * 2);
                crystal.position.x += (targetX - crystal.position.x) * 0.05;
                crystal.position.y += (-targetY - crystal.position.y) * 0.05;

                renderer.render(scene, camera);
            };

            animate();
        };

        const handleMouseMove = (e: MouseEvent) => {
            mouseX = (e.clientX / window.innerWidth) * 2 - 1;
            mouseY = (e.clientY / window.innerHeight) * 2 - 1;
        };

        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };

        initThree();
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('resize', handleResize);

        // --- GSAP ANIMATIONS ---
        gsap.registerPlugin(ScrollTrigger);

        gsap.from('.reveal', {
            opacity: 0,
            y: 30,
            duration: 1.2,
            stagger: 0.15,
            ease: 'power4.out'
        });

        document.querySelectorAll('.scroll-reveal').forEach((el) => {
            gsap.to(el, {
                opacity: 1,
                y: 0,
                duration: 1.2,
                ease: "power4.out",
                scrollTrigger: {
                    trigger: el,
                    start: "top 85%",
                }
            });
        });

        // Lecture Bar Animation
        gsap.to('.lecture-bar', {
            height: (i) => ["60%", "90%", "40%", "80%", "50%", "95%", "30%", "70%"][i % 8],
            duration: 2,
            stagger: 0.1,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', handleResize);
            if (renderer) renderer.dispose();
            if (canvasRef.current) canvasRef.current.innerHTML = '';
        };
    }, []);

    return (
        <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden selection:bg-white selection:text-black font-sans">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                
                :root {
                    --font-sans: 'Inter', -apple-system, system-ui, sans-serif;
                    --font-mono: "SF Mono", "Fira Code", monospace;
                }

                body {
                    font-family: var(--font-sans);
                }

                .grid-overlay {
                    position: fixed;
                    top: 0; left: 0; width: 100%; height: 100%;
                    background-image: 
                        linear-gradient(to right, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(255, 255, 255, 0.08) 1px, transparent 1px);
                    background-size: 80px 80px;
                    pointer-events: none;
                    z-index: 1;
                    opacity: 0.3;
                }

                .hero-section {
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    position: relative;
                    z-index: 3;
                    pointer-events: none;
                    text-align: center;
                }

                .hero-content {
                    max-width: 900px;
                    pointer-events: auto;
                }

                h1 {
                    font-size: clamp(3.5rem, 10vw, 6.5rem);
                    font-weight: 800;
                    letter-spacing: -0.04em;
                    line-height: 0.95;
                    margin-bottom: 32px;
                    background: linear-gradient(180deg, #fff 0%, rgba(255,255,255,0.4) 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .cta-button {
                    background: #fff;
                    color: #000;
                    padding: 18px 40px;
                    border-radius: 2px;
                    text-decoration: none;
                    font-weight: 700;
                    font-size: 0.9rem;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    transition: transform 0.3s cubic-bezier(0.23, 1, 0.32, 1), background 0.3s;
                    display: inline-block;
                    border: none;
                    cursor: pointer;
                }

                .cta-button:hover {
                    transform: scale(1.05);
                    background: #f0f0f0;
                }

                .glass-card {
                    background: rgba(10, 10, 10, 0.7);
                    backdrop-filter: blur(20px) saturate(180%);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    transition: border-color 0.3s ease, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
                }

                .glass-card:hover {
                    border-color: rgba(255, 255, 255, 0.2);
                    transform: translateY(-5px);
                }

                .mono-tag {
                    font-family: var(--font-mono);
                    font-size: 0.7rem;
                    text-transform: uppercase;
                    letter-spacing: 0.3em;
                    color: rgba(255,255,255,0.4);
                    margin-bottom: 24px;
                    display: block;
                }

                /* Bento Visuals */
                .lecture-bar {
                    flex: 1;
                    background: linear-gradient(to top, rgba(255,255,255,0.05), rgba(255,255,255,0.8));
                    border-top: 1px solid rgba(255,255,255,0.3);
                    border-radius: 1px;
                }

                .storage-viz {
                    position: relative;
                    width: 240px;
                    height: 240px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                @keyframes rotate-reverse {
                    from { transform: rotate(360deg); }
                    to { transform: rotate(0deg); }
                }

                @keyframes orbit-rotate {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                .orbit-ring {
                    position: absolute;
                    border: 1px dashed rgba(255,255,255,0.1);
                    border-radius: 50%;
                }

                .sync-point {
                    width: 6px; height: 6px;
                    background: #fff;
                    border-radius: 50%;
                    position: absolute;
                    top: -3px; left: 50%;
                    box-shadow: 0 0 10px #fff;
                }
            `}</style>

            <div className="grid-overlay" />

            <header className="fixed top-0 w-full h-[72px] flex items-center justify-between px-10 z-[100] border-b border-white/5 backdrop-blur-3xl bg-black/60">
                <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-white rounded-sm" />
                    <span className="font-extrabold tracking-tighter text-lg uppercase italic">MBA COPILOT</span>
                </div>
                <nav className="hidden lg:flex items-center gap-10">
                    <a href="#lectures" className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 hover:text-white transition-colors">Features</a>
                    <a href="#storage" className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 hover:text-white transition-colors">Continuity</a>
                    <a href="#" className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 hover:text-white transition-colors">Network</a>
                    <button
                        onClick={onGetStarted}
                        className="text-[10px] font-bold uppercase tracking-[0.2em] border border-white/20 px-6 py-2.5 rounded-full hover:bg-white hover:text-black transition-all"
                    >
                        Log In
                    </button>
                </nav>
            </header>

            {/* Hero Section */}
            <div id="hero-canvas" className="fixed inset-0 z-2">
                <div ref={canvasRef} className="w-full h-full" />
            </div>

            <section className="hero-section">
                <div className="hero-content">
                    <span className="mono-tag reveal">The New Standard of Academic Leverage</span>
                    <h1 className="reveal">
                        Cognitive Leverage<br />
                        <span className="text-white/30 italic">for MBA Leaders.</span>
                    </h1>
                    <p className="max-w-xl mx-auto text-xl md:text-2xl text-white/50 mb-12 leading-relaxed reveal">
                        The high-performance companion that transcribes, indexes, and reasons through your entire curriculum in real-time.
                    </p>
                    <div className="reveal">
                        <button onClick={onGetStarted} className="cta-button">Initialize Protocol</button>
                    </div>
                </div>
            </section>

            {/* Bento Section */}
            <section className="relative z-10 px-6 md:px-12 py-32 max-w-[1400px] mx-auto">
                <div className="grid grid-cols-12 gap-6">

                    {/* Feature 1 */}
                    <div id="lectures" className="col-span-12 lg:col-span-8 glass-card p-12 rounded-sm scroll-reveal flex flex-col justify-between h-[500px] relative overflow-hidden group">
                        <div className="relative z-10">
                            <span className="mono-tag">01 / Neural Architecture</span>
                            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter mb-6">Hyper-Indexed Lectures</h2>
                            <p className="text-white/40 max-w-sm text-lg leading-relaxed">
                                Every spoken word is instantly converted into a searchable, multidimensional knowledge graph.
                            </p>
                        </div>

                        <div className="flex items-end gap-1.5 h-48 absolute bottom-0 right-12 left-12 md:left-auto md:w-[60%] pointer-events-none">
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
                                <div key={i} className="lecture-bar" />
                            ))}
                        </div>
                    </div>

                    {/* Feature 2 */}
                    <div id="storage" className="col-span-12 lg:col-span-4 glass-card p-12 rounded-sm scroll-reveal h-[500px] flex flex-col items-center text-center">
                        <div className="mb-auto text-left w-full">
                            <span className="mono-tag">02 / CONTINUITY</span>
                            <h2 className="text-3xl font-bold tracking-tight mb-4">Infinite Storage</h2>
                            <p className="text-white/30">Native Google Drive & Notion sync for your history.</p>
                        </div>

                        <div className="storage-viz">
                            <div className="orbit-ring w-[100px] h-[100px]" style={{ animation: 'orbit-rotate 8s linear infinite' }}><div className="sync-point" /></div>
                            <div className="orbit-ring w-[180px] h-[180px]" style={{ animation: 'rotate-reverse 12s linear infinite' }}><div className="sync-point" /></div>
                            <div className="orbit-ring w-[240px] h-[240px]" style={{ animation: 'orbit-rotate 20s linear infinite' }}><div className="sync-point" /></div>
                            <div className="w-16 h-16 bg-white/10 border border-white/20 flex items-center justify-center rotate-45 backdrop-blur-md">
                                <div className="w-8 h-8 bg-white/20" />
                            </div>
                        </div>
                    </div>

                    {/* Feature 3 */}
                    <div className="col-span-12 lg:col-span-4 glass-card p-12 rounded-sm scroll-reveal h-[400px]">
                        <span className="mono-tag">03 / Precision</span>
                        <h2 className="text-3xl font-bold tracking-tight mb-4">Case Study Synthesizer</h2>
                        <p className="text-white/30">Connect dots between Case Studies from Term 1 and modeling in Term 6 automatically.</p>
                    </div>

                    {/* Feature 4 */}
                    <div className="col-span-12 lg:col-span-8 glass-card p-12 rounded-sm scroll-reveal h-[400px] relative overflow-hidden">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="mono-tag">04 / Interface</span>
                                <h2 className="text-4xl font-bold tracking-tighter mb-4">Skeletal Executive UI</h2>
                                <p className="text-white/30 max-w-md">Minimalist, distraction-free environment built for high-stakes decision making and deep focus sessions.</p>
                            </div>
                            <div className="font-mono text-[9px] text-white/20 text-right leading-relaxed hidden md:block">
                                ANALYZING_CORE_CURRICULUM... [OK]<br />
                                MAPPING_EXTERNALITIES... [OK]<br />
                                GENERATING_FRAMEWORKS... [OK]
                            </div>
                        </div>
                        <div className="mt-12 h-px bg-white/5 w-full relative">
                            <div className="absolute top-0 left-0 h-full bg-white w-20 animate-pulse shadow-[0_0_15px_#fff]" />
                        </div>
                    </div>

                </div>
            </section>

            <footer className="px-10 py-20 border-t border-white/5 bg-[#050505] flex flex-col md:flex-row justify-between items-center gap-10">
                <div className="flex items-center gap-3 opacity-40">
                    <div className="w-4 h-4 bg-white rounded-sm" />
                    <span className="font-bold tracking-tighter text-sm uppercase">MBA COPILOT — 2026</span>
                </div>
                <div className="flex gap-8">
                    <a href="/#privacy" className="text-[10px] font-mono tracking-widest text-white/30 hover:text-white transition-colors">PRIVACY_POLICY</a>
                    <a href="/#terms" className="text-[10px] font-mono tracking-widest text-white/30 hover:text-white transition-colors">TERMS_OF_SERVICE</a>
                    <a href="#" className="text-[10px] font-mono tracking-widest text-white/30 hover:text-white transition-colors">SOVEREIGN_STATUS</a>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
