import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Sparkles } from 'lucide-react';

interface LandingPageProps {
    onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        // --- 2026 KNOWLEDGE ARCHITECTURE ENGINE ---
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({
            canvas: canvasRef.current,
            alpha: true,
            antialias: true,
            powerPreference: "high-performance"
        });

        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.position.setZ(80);

        // --- SHADERS: LIQUID GLASS ORBS ---
        const holoVertex = `
            varying vec2 vUv;
            varying float vGlow;
            uniform float uTime;
            void main() {
                vUv = uv;
                vec3 pos = position;
                pos.x += sin(pos.y * 5.0 + uTime) * 0.05;
                vGlow = pow(0.7 - dot(normalize(normalMatrix * normal), vec3(0,0,1)), 3.0);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
        `;
        const holoFragment = `
            varying vec2 vUv;
            varying float vGlow;
            uniform vec3 uColor;
            void main() {
                gl_FragColor = vec4(uColor + vGlow, 0.45);
            }
        `;

        // --- SACRED GEOMETRY CENTERPIECE ---
        const mandalaGroup = new THREE.Group();
        const mandalaMat = new THREE.MeshStandardMaterial({
            color: 0xb45309, // Vidyos Gold 
            wireframe: true,
            transparent: true,
            opacity: 0.12
        });

        const soulMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(18, 1), mandalaMat);
        const ringMesh = new THREE.Mesh(new THREE.TorusKnotGeometry(14, 0.4, 128, 16), mandalaMat);
        mandalaGroup.add(soulMesh, ringMesh);
        scene.add(mandalaGroup);

        // --- HOLOGRAPHIC GRID FLOORS ---
        const topGrid = new THREE.GridHelper(600, 40, 0x14b8a6, 0x14b8a6);
        topGrid.position.y = 100;
        topGrid.material.transparent = true;
        topGrid.material.opacity = 0.03;
        scene.add(topGrid);

        const bottomGrid = new THREE.GridHelper(600, 40, 0xb45309, 0xb45309);
        bottomGrid.position.y = -100;
        bottomGrid.material.transparent = true;
        bottomGrid.material.opacity = 0.03;
        scene.add(bottomGrid);

        // --- KNOWLEDGE ORBS ---
        const orbs: THREE.Mesh[] = [];
        const sphereGeo = new THREE.SphereGeometry(1, 32, 32);
        const colors = [new THREE.Color(0x14b8a6), new THREE.Color(0xb45309), new THREE.Color(0xffffff)];

        for (let i = 0; i < 30; i++) {
            const mat = new THREE.ShaderMaterial({
                vertexShader: holoVertex,
                fragmentShader: holoFragment,
                uniforms: { uTime: { value: 0 }, uColor: { value: colors[i % 3] } },
                transparent: true
            });
            const orb = new THREE.Mesh(sphereGeo, mat);
            const scale = Math.random() * 6 + 2;
            orb.scale.set(scale, scale, scale);
            orb.position.set(
                THREE.MathUtils.randFloatSpread(250),
                THREE.MathUtils.randFloatSpread(150),
                THREE.MathUtils.randFloatSpread(100)
            );
            orb.userData = { vel: new THREE.Vector3(Math.random() * 0.02 - 0.01, Math.random() * 0.02 - 0.01, Math.random() * 0.02 - 0.01) };
            scene.add(orb);
            orbs.push(orb);
        }

        // --- NEURAL CONNECTIONS ---
        const lineMat = new THREE.LineBasicMaterial({ color: 0x14b8a6, transparent: true, opacity: 0.06 });
        const lines: { line: THREE.Line; o1: THREE.Mesh; o2: THREE.Mesh }[] = [];
        for (let i = 0; i < 15; i++) {
            const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
            const line = new THREE.Line(geo, lineMat);
            scene.add(line);
            lines.push({ line, o1: orbs[i], o2: orbs[i + 15] });
        }

        // --- LIGHTING ---
        scene.add(new THREE.AmbientLight(0xffffff, 0.9));
        const p1 = new THREE.PointLight(0xffffff, 1.5);
        p1.position.set(50, 50, 50);
        scene.add(p1);

        // --- INTERACTION ---
        let mx = 0, my = 0, tx = 0, ty = 0;
        const onMouseMove = (e: MouseEvent) => {
            tx = (e.clientX / window.innerWidth) - 0.5;
            ty = (e.clientY / window.innerHeight) - 0.5;
        };
        window.addEventListener('mousemove', onMouseMove);

        const animate = () => {
            const frameId = requestAnimationFrame(animate);
            const time = performance.now() * 0.001;

            mx += (tx - mx) * 0.05;
            my += (ty - my) * 0.05;

            mandalaGroup.rotation.y += 0.002;
            mandalaGroup.position.y = Math.sin(time) * 4;

            orbs.forEach(orb => {
                (orb.material as THREE.ShaderMaterial).uniforms.uTime.value = time;
                orb.position.add(orb.userData.vel);
                orb.position.x += mx * 0.04;
                orb.position.y -= my * 0.04;
                if (Math.abs(orb.position.x) > 120) orb.userData.vel.x *= -1;
                if (Math.abs(orb.position.y) > 90) orb.userData.vel.y *= -1;
            });

            lines.forEach(l => {
                l.line.geometry.setFromPoints([l.o1.position, l.o2.position]);
                l.line.geometry.attributes.position.needsUpdate = true;
            });

            camera.position.z = 80 + window.scrollY * -0.012;
            camera.position.x = mx * 20;
            camera.position.y = -my * 20;
            camera.lookAt(0, 0, 0);

            renderer.render(scene, camera);
            return frameId;
        };

        const frameId = animate();

        // --- GSAP REVEALS ---
        gsap.registerPlugin(ScrollTrigger);
        gsap.from('.f-reveal', { opacity: 0, y: 50, duration: 1.5, stagger: 0.2, ease: "power4.out" });

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            cancelAnimationFrame(frameId);
            renderer.dispose();
        };
    }, []);

    return (
        <div className="min-h-screen bg-[#fcfcfd] text-[#09090b] selection:bg-[#14b8a6] selection:text-white font-outfit overflow-x-hidden">
            <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-1" />

            {/* Premium Nav */}
            <nav className="fixed top-8 left-1/2 -translate-x-1/2 w-[90%] max-w-[1400px] z-[1000] px-10 py-4 bg-white/40 backdrop-blur-[45px] border border-black/5 rounded-full flex justify-between items-center shadow-premium">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                        <span className="text-white font-black text-xl">V</span>
                    </div>
                    <div>
                        <span className="text-sm font-black tracking-widest uppercase">Vidyos</span>
                        <span className="block text-[8px] font-bold text-[#14b8a6] tracking-[0.4em] uppercase">Fusion OS</span>
                    </div>
                </div>
                <div className="flex items-center gap-10">
                    <div className="hidden md:flex gap-8">
                        <a href="#lab" className="text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity" aria-label="Neural Lab Features">Neural Lab</a>
                        <a href="#continuity" className="text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity" aria-label="Privacy & Continuity">Continuity</a>
                    </div>
                    <button onClick={onGetStarted} className="px-6 py-2.5 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-110 active:scale-95 transition-all">
                        Initiate Synapse
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative h-screen flex flex-col justify-center items-center text-center px-6 z-10 pt-20">
                <span className="f-reveal text-[#14b8a6] text-[11px] font-black uppercase tracking-[0.8em] mb-8">Personal Truth Engine</span>
                <h1 className="f-reveal text-[3.5rem] md:text-[9rem] font-black tracking-[-0.06em] leading-[0.85] mb-12 bg-gradient-to-b from-black to-black/40 bg-clip-text text-transparent">
                    MBA CLASS<br />MAPPER.
                </h1>
                <p className="f-reveal text-[1.5rem] font-bold text-black/40 max-w-2xl leading-relaxed mb-16">
                    The ultimate AI study copilot. A cognitive mirror that grounds AI reasoning in your actual MBA materials, PDFs, and lectures—zero hallucination, infinite depth.
                </p>
                <div className="f-reveal">
                    <button onClick={onGetStarted} className="btn-primary" style={{ padding: '24px 60px', fontSize: '1.2rem' }}>
                        Begin Synthesis
                    </button>
                    <div className="mt-8 flex items-center justify-center gap-4 opacity-30">
                        <div className="w-12 h-px bg-black" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Scroll to Explore Neural Hub</span>
                        <div className="w-12 h-px bg-black" />
                    </div>
                </div>
            </section>

            {/* Bento Lab */}
            <section id="lab" className="relative z-10 px-6 md:px-12 py-40 max-w-[1450px] mx-auto grid grid-cols-12 gap-10">

                {/* Module 01: Neural Grounding */}
                <div className="col-span-12 lg:col-span-8 vidyos-card p-16 h-[600px] flex flex-col justify-between group overflow-hidden">
                    <div className="relative z-10">
                        <span className="label-caps">Module 01 / Neural Grounding</span>
                        <h2 className="text-5xl font-black tracking-tighter mb-8 leading-tight">Your PDF + Your Professor<br /><span className="text-[#14b8a6]">Synthesized.</span></h2>
                        <p className="text-xl font-bold text-black/40 max-w-md leading-relaxed">
                            Stop asking generic AIs. Ask Vidyos about the specific theory on Slide 44 of Lecture 12. Complete source verification.
                        </p>
                    </div>
                    <div className="relative h-32 flex items-center justify-center opacity-30 group-hover:opacity-100 transition-all duration-1000">
                        <div className="w-full h-px bg-gradient-to-r from-transparent via-[#14b8a6] to-transparent" />
                        <div className="absolute w-20 h-20 border-2 border-[#14b8a6] rounded-full animate-ping" />
                    </div>
                </div>

                {/* Module 02: Cognitive Flow */}
                <div className="col-span-12 lg:col-span-4 vidyos-card p-12 h-[600px] flex flex-col items-center justify-center text-center">
                    <span className="label-caps">Retention Metrics</span>
                    <div className="my-12 relative">
                        <div className="text-[6rem] font-black text-[#14b8a6] leading-none">94%</div>
                        <span className="text-[11px] font-black uppercase tracking-widest opacity-40">Deep Retention Level</span>
                    </div>
                    <p className="font-bold text-black/40">Bio-feedback transcription ensures your brain stays in high-beta state during synthesis.</p>
                </div>

                {/* Module 03: Local Sovereignty */}
                <div id="continuity" className="col-span-12 lg:col-span-4 vidyos-card p-12 h-[450px] bg-black text-white">
                    <span className="label-caps text-[#14b8a6]">Identity Hub</span>
                    <h3 className="text-3xl font-black mb-6 mt-4">Local First.<br />Sovereign AI.</h3>
                    <p className="opacity-40 font-bold leading-relaxed">Your data never leaves your infrastructure. Local NPU processing for Hinglish transcription means zero latency and total MBA data sovereignty.</p>
                </div>

                {/* Module 04: The Predictor */}
                <div className="col-span-12 lg:col-span-8 vidyos-card p-16 h-[450px] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-10">
                        <Sparkles className="w-16 h-16 text-[#b45309] opacity-20" />
                    </div>
                    <span className="label-caps">Module 04 / Examination Engine</span>
                    <h3 className="text-4xl font-black mb-6 mt-2">The Exam Predictor.</h3>
                    <p className="text-black/40 font-bold max-w-lg leading-relaxed">Automatically identifies potential examination questions based on lecturer emphasis and syllabus frequency. Study less, learn specifically.</p>
                    <div className="mt-8 flex gap-3">
                        <div className="px-5 py-2 rounded-full border border-black/5 text-[10px] font-black uppercase tracking-widest">Auto-Flashcards</div>
                        <div className="px-5 py-2 rounded-full border border-black/5 text-[10px] font-black uppercase tracking-widest">Emphasis Tracking</div>
                    </div>
                </div>

            </section>

            {/* Footer */}
            <footer className="relative bg-white border-t border-black/5 py-40 flex flex-col items-center z-10 px-6">
                <h2 className="text-[8rem] md:text-[14rem] font-black text-black opacity-[0.03] absolute top-20 pointer-events-none">FUSION</h2>
                <div className="flex flex-col items-center gap-10">
                    <div className="w-16 h-16 bg-black rounded-3xl flex items-center justify-center">
                        <span className="text-white font-black text-3xl">V</span>
                    </div>
                    <div className="flex gap-16">
                        <a href="/#privacy" className="text-[11px] font-black uppercase tracking-[0.4em] opacity-40 hover:opacity-100 transition-opacity">Privacy</a>
                        <a href="/#terms" className="text-[11px] font-black uppercase tracking-[0.4em] opacity-40 hover:opacity-100 transition-opacity">Terms</a>
                        <a href="#" className="text-[11px] font-black uppercase tracking-[0.4em] opacity-40 hover:opacity-100 transition-opacity">Contact</a>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[1em] opacity-20 mt-10">Knowledge, Reimagined • 2026</p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
