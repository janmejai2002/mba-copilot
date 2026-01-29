
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
        // --- THREE.JS HERO ---
        let scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, crystal: THREE.Mesh;
        let mouseX = 0, mouseY = 0;
        let targetX = 0, targetY = 0;

        const initThree = () => {
            if (!canvasRef.current) return;

            scene = new THREE.Scene();
            camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.z = 5;

            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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
                reflectivity: 1,
                clearcoat: 1,
                clearcoatRoughness: 0,
            });

            crystal = new THREE.Mesh(geometry, material);
            scene.add(crystal);

            // Lights
            const pointLight = new THREE.PointLight(0xffffff, 20);
            pointLight.position.set(5, 5, 5);
            scene.add(pointLight);

            const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            scene.add(ambientLight);

            const animate = () => {
                requestAnimationFrame(animate);

                // Gentle levitation
                const time = Date.now() * 0.001;
                crystal.position.y = Math.sin(time * 0.5) * 0.2;
                crystal.rotation.y += 0.005;
                crystal.rotation.z += 0.002;

                // Magnetic pull effect
                targetX = (mouseX * 0.001);
                targetY = (mouseY * 0.001);

                crystal.position.x += (targetX - crystal.position.x) * 0.05;
                crystal.position.y += (-targetY - crystal.position.y) * 0.05;

                renderer.render(scene, camera);
            };

            animate();
        };

        const handleMouseMove = (e: MouseEvent) => {
            mouseX = e.clientX - window.innerWidth / 2;
            mouseY = e.clientY - window.innerHeight / 2;
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

        // Hero reveals
        gsap.to('.reveal', {
            opacity: 1,
            y: 0,
            duration: 1.2,
            stagger: 0.2,
            ease: 'expo.out'
        });

        // Bento items scroll reveal
        gsap.from('.feature-card', {
            scrollTrigger: {
                trigger: '.bento-grid',
                start: 'top 80%',
            },
            opacity: 0,
            y: 40,
            duration: 1,
            stagger: 0.1,
            ease: 'power3.out'
        });

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', handleResize);
            if (renderer) renderer.dispose();
            if (canvasRef.current) canvasRef.current.innerHTML = '';
        };
    }, []);

    return (
        <div className="noise min-h-screen bg-[#050505] text-white overflow-x-hidden selection:bg-white selection:text-black">
            <style>{`
        .noise::before {
          content: "";
          position: fixed;
          top: 0; left: 0; width: 100%; height: 100%;
          opacity: 0.04;
          pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
          z-index: 50;
        }
        .hero-title {
          font-size: clamp(3rem, 8vw, 6.5rem);
          line-height: 0.95;
          font-weight: 500;
          letter-spacing: -0.04em;
        }
        .reveal { opacity: 0; transform: translateY(30px); }
        .glass {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .bento-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 1.5rem;
        }
        .archive-layer {
          transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .archive-card:hover .archive-layer {
          transform: translateY(-10px) rotateX(5deg);
        }
      `}</style>

            {/* Navigation */}
            <nav className="fixed top-0 w-full z-[100] glass py-4 px-8 flex justify-between items-center transition-all">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                        <div className="w-4 h-4 bg-black rotate-45"></div>
                    </div>
                    <span className="font-medium tracking-tight text-lg">MBA Copilot</span>
                </div>
                <div className="hidden md:flex gap-8 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                    <a href="#features" className="hover:text-white transition-colors">Technology</a>
                    <a href="#features" className="hover:text-white transition-colors">Privacy</a>
                    <a href="/#terms" className="hover:text-white transition-colors">Safety</a>
                </div>
                <button
                    onClick={onGetStarted}
                    className="text-[10px] font-bold uppercase tracking-widest px-6 py-2.5 border border-white/20 rounded-full hover:bg-white hover:text-black transition-all"
                >
                    Auth Portal
                </button>
            </nav>

            {/* Canvas Wrapper */}
            <div ref={canvasRef} className="fixed top-0 right-0 w-full h-screen z-[-1] pointer-events-none" />

            {/* Hero Section */}
            <section className="relative min-h-screen pt-48 pb-20 px-8 max-w-7xl mx-auto flex flex-col items-start justify-center">
                <div className="text-[10px] font-bold uppercase tracking-[0.3em] mb-6 text-white/40 reveal">
                    High-Performance Academic Intelligence
                </div>
                <h1 className="hero-title mb-8 reveal">
                    The Archive<br />
                    <span className="text-white/30">Redefined.</span>
                </h1>
                <p className="max-w-xl text-lg md:text-xl text-white/50 mb-10 leading-relaxed font-medium reveal">
                    Transform your MBA experience with an AI-driven knowledge engine that indexes, synthesizes, and evolves with your curriculum.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 reveal">
                    <button
                        onClick={onGetStarted}
                        className="px-10 py-4 bg-white text-black rounded-full font-bold hover:scale-105 transition-all shadow-2xl shadow-white/10"
                    >
                        Get Started
                    </button>
                    <button className="px-10 py-4 rounded-full border border-white/10 glass hover:bg-white/5 transition-all font-bold">
                        Watch Engine
                    </button>
                </div>
            </section>

            {/* Bento Grid Features */}
            <section id="features" className="px-8 py-32 max-w-7xl mx-auto">
                <div className="bento-grid">
                    {/* Feature 1 */}
                    <div className="col-span-12 md:col-span-8 glass p-12 rounded-[3rem] relative overflow-hidden group feature-card">
                        <div className="relative z-10 h-full flex flex-col justify-between">
                            <div>
                                <div className="text-[10px] uppercase font-bold tracking-widest mb-4 text-white/40">Real-time Processing</div>
                                <h3 className="text-4xl font-medium mb-4">Hyper-Indexed Lectures</h3>
                                <p className="text-white/40 max-w-md text-lg">Every word, slide, and nuance is instantly mapped to your core knowledge graph using semantic vectoring.</p>
                            </div>
                            <div className="mt-12 flex gap-3 overflow-hidden">
                                <div className="h-24 w-40 glass rounded-2xl border-white/10 animate-pulse" />
                                <div className="h-24 w-40 glass rounded-2xl border-white/10 animate-pulse delay-75" />
                                <div className="h-24 w-40 glass rounded-2xl border-white/10 animate-pulse delay-150" />
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/5 to-transparent pointer-events-none" />
                    </div>

                    {/* Feature 2: Speed */}
                    <div className="col-span-12 md:col-span-4 glass p-8 rounded-[3rem] flex flex-col justify-center items-center text-center feature-card">
                        <div className="text-7xl font-light mb-4 tracking-tighter">0.4<span className="text-white/20">ms</span></div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">Inference Latency</div>
                    </div>

                    {/* Feature 3: Archive */}
                    <div className="col-span-12 md:col-span-4 glass p-12 rounded-[3rem] archive-card overflow-hidden feature-card">
                        <div className="text-[10px] font-bold uppercase tracking-widest mb-6 text-white/40">Sync Protocol</div>
                        <h4 className="text-2xl font-medium mb-4">Infinite Archive</h4>
                        <div className="relative h-40 mt-10">
                            <div className="archive-layer absolute top-0 w-full h-16 glass rounded-2xl opacity-100" />
                            <div className="archive-layer absolute top-6 w-full h-16 glass rounded-2xl opacity-50" />
                            <div className="archive-layer absolute top-12 w-full h-16 glass rounded-2xl opacity-20" />
                        </div>
                    </div>

                    {/* Feature 4: Strategic Synthesis */}
                    <div className="col-span-12 md:col-span-8 glass p-12 rounded-[3rem] flex flex-col justify-between overflow-hidden feature-card">
                        <div className="flex justify-between items-start">
                            <h3 className="text-4xl font-medium tracking-tight">Strategic<br />Synthesis</h3>
                            <div className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center">
                                <div className="w-4 h-4 border-t-2 border-r-2 border-white rotate-45 transform translate-x-[-1px] translate-y-[1px]" />
                            </div>
                        </div>
                        <div className="mt-12 flex items-end gap-6 h-40">
                            <div className="w-full bg-white/5 h-24 rounded-2xl transition-all hover:h-32" />
                            <div className="w-full bg-white/10 h-40 rounded-2xl shadow-2xl shadow-white/5" />
                            <div className="w-full bg-white/5 h-32 rounded-2xl transition-all hover:h-40" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="px-8 py-24 border-t border-white/5 bg-[#080808] flex flex-col md:flex-row justify-between items-center gap-10">
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/20">
                    © 2026 MBA Copilot Engine &bull; Academic Data Sovereignty
                </div>
                <div className="flex gap-12 text-[10px] font-bold uppercase tracking-widest text-white/40">
                    <a href="/#privacy" className="hover:text-white transition-colors">Privacy</a>
                    <a href="/#terms" className="hover:text-white transition-colors">Terms</a>
                    <a href="#" className="hover:text-white transition-colors">Status</a>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
