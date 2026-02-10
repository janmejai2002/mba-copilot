import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useBackgroundStore, BackgroundState } from '../stores/useBackgroundStore';

/**
 * OrganicBackground3D - A living, breathing 3D background that responds to application state.
 * Lightweight version with WebGL error handling to prevent GPU crashes.
 */
const Background3D: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const animationRef = useRef<number>(0);
    const contextLostRef = useRef(false);

    const { state, intensity, accentColor, pulseSpeed } = useBackgroundStore();

    const stateRef = useRef<BackgroundState>(state);
    const intensityRef = useRef(intensity);
    const accentColorRef = useRef(accentColor);
    const pulseSpeedRef = useRef(pulseSpeed);

    useEffect(() => {
        stateRef.current = state;
        intensityRef.current = intensity;
        accentColorRef.current = accentColor;
        pulseSpeedRef.current = pulseSpeed;
    }, [state, intensity, accentColor, pulseSpeed]);

    useEffect(() => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;

        // --- WebGL context loss handling ---
        const handleContextLost = (e: Event) => {
            e.preventDefault();
            contextLostRef.current = true;
            cancelAnimationFrame(animationRef.current);
            console.warn('Background3D: WebGL context lost, pausing rendering.');
        };
        const handleContextRestored = () => {
            contextLostRef.current = false;
            console.log('Background3D: WebGL context restored.');
        };
        canvas.addEventListener('webglcontextlost', handleContextLost);
        canvas.addEventListener('webglcontextrestored', handleContextRestored);

        // --- Check WebGL availability ---
        let renderer: THREE.WebGLRenderer;
        try {
            renderer = new THREE.WebGLRenderer({
                canvas,
                alpha: true,
                antialias: false,            // Disabled for performance
                powerPreference: "low-power", // Prevent GPU strain
                failIfMajorPerformanceCaveat: true // Don't run on weak GPUs
            });
        } catch (e) {
            console.warn('Background3D: WebGL not available or too slow, skipping.', e);
            return;
        }

        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Cap at 1.5x
        renderer.setSize(window.innerWidth, window.innerHeight);
        rendererRef.current = renderer;

        // --- SCENE SETUP (Lightweight) ---
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 100;

        // --- BREATHING CORE MESH ---
        const coreGeometry = new THREE.IcosahedronGeometry(18, 1); // Reduced detail from 2 to 1
        const coreMaterial = new THREE.MeshBasicMaterial({ // BasicMaterial instead of Standard (no lighting needed)
            color: 0x14b8a6,
            wireframe: true,
            transparent: true,
            opacity: 0.12
        });
        const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
        scene.add(coreMesh);

        // Secondary ring
        const ringGeometry = new THREE.TorusKnotGeometry(14, 0.5, 64, 8); // Reduced segments from 128,16 to 64,8
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xfbbf24,
            wireframe: true,
            transparent: true,
            opacity: 0.08
        });
        const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
        scene.add(ringMesh);

        // --- SYNAPSE PARTICLE SYSTEM (Reduced) ---
        const particleCount = 80; // Reduced from 200
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        const palette = [
            new THREE.Color(0x14b8a6),
            new THREE.Color(0xfbbf24),
            new THREE.Color(0xffffff),
        ];

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            const radius = 30 + Math.random() * 60;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);

            velocities[i3] = (Math.random() - 0.5) * 0.02;
            velocities[i3 + 1] = (Math.random() - 0.5) * 0.02;
            velocities[i3 + 2] = (Math.random() - 0.5) * 0.02;

            const color = palette[i % 3];
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;
        }

        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const particleMaterial = new THREE.PointsMaterial({
            size: 2,
            vertexColors: true,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });

        const particles = new THREE.Points(particleGeometry, particleMaterial);
        scene.add(particles);

        // --- NEURAL CONNECTION LINES (Reduced) ---
        const connectionMaterial = new THREE.LineBasicMaterial({
            color: 0x14b8a6,
            transparent: true,
            opacity: 0.06
        });

        const connections: THREE.Line[] = [];
        for (let i = 0; i < 15; i++) { // Reduced from 30
            const points = [
                new THREE.Vector3(
                    (Math.random() - 0.5) * 150,
                    (Math.random() - 0.5) * 100,
                    (Math.random() - 0.5) * 80
                ),
                new THREE.Vector3(
                    (Math.random() - 0.5) * 150,
                    (Math.random() - 0.5) * 100,
                    (Math.random() - 0.5) * 80
                )
            ];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, connectionMaterial.clone());
            connections.push(line);
            scene.add(line);
        }

        // Removed heavy grid helpers to reduce draw calls

        // --- INTERACTION ---
        let mouseX = 0, mouseY = 0;
        let targetX = 0, targetY = 0;

        const onMouseMove = (e: MouseEvent) => {
            targetX = (e.clientX / window.innerWidth) - 0.5;
            targetY = (e.clientY / window.innerHeight) - 0.5;
        };
        window.addEventListener('mousemove', onMouseMove);

        const onResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', onResize);

        // --- ANIMATION LOOP ---
        const clock = new THREE.Clock();

        const animate = () => {
            if (contextLostRef.current) return; // Stop if context lost
            animationRef.current = requestAnimationFrame(animate);

            const elapsed = clock.getElapsedTime();
            const currentIntensity = intensityRef.current;
            const currentPulseSpeed = pulseSpeedRef.current;
            const currentState = stateRef.current;

            // Smooth mouse following
            mouseX += (targetX - mouseX) * 0.05;
            mouseY += (targetY - mouseY) * 0.05;

            // Breathing animation
            const breathAmplitude = 0.1 + currentIntensity * 0.15;
            const breathScale = 1 + Math.sin(elapsed * currentPulseSpeed) * breathAmplitude;
            coreMesh.scale.setScalar(breathScale);
            coreMesh.rotation.y += 0.002 * currentPulseSpeed;
            coreMesh.rotation.x = Math.sin(elapsed * 0.3) * 0.1;

            ringMesh.rotation.y -= 0.001 * currentPulseSpeed;
            ringMesh.rotation.z += 0.0005;
            ringMesh.scale.setScalar(breathScale * 0.95);

            // State-based color
            const targetColor = new THREE.Color(accentColorRef.current);
            coreMaterial.color.lerp(targetColor, 0.02);

            coreMaterial.opacity = 0.08 + currentIntensity * 0.12;
            particleMaterial.opacity = 0.3 + currentIntensity * 0.5;

            // Particle animation
            const posArray = particleGeometry.attributes.position.array as Float32Array;
            for (let i = 0; i < particleCount; i++) {
                const i3 = i * 3;
                const speedMultiplier = 0.5 + currentIntensity * 1.5;
                posArray[i3] += velocities[i3] * speedMultiplier;
                posArray[i3 + 1] += velocities[i3 + 1] * speedMultiplier;
                posArray[i3 + 2] += velocities[i3 + 2] * speedMultiplier;

                posArray[i3] += mouseX * 0.02;
                posArray[i3 + 1] -= mouseY * 0.02;

                const dist = Math.sqrt(
                    posArray[i3] ** 2 + posArray[i3 + 1] ** 2 + posArray[i3 + 2] ** 2
                );
                if (dist > 100) {
                    const scale = 30 / dist;
                    posArray[i3] *= scale;
                    posArray[i3 + 1] *= scale;
                    posArray[i3 + 2] *= scale;
                }

                if (currentState === 'recording') {
                    const pulsePhase = Math.sin(elapsed * 4 + i * 0.1);
                    posArray[i3] += pulsePhase * 0.1;
                    posArray[i3 + 1] += pulsePhase * 0.1;
                } else if (currentState === 'syncing') {
                    posArray[i3 + 1] += 0.05;
                    if (posArray[i3 + 1] > 60) posArray[i3 + 1] = -60;
                } else if (currentState === 'thinking') {
                    const angle = elapsed * 2 + i * 0.1;
                    posArray[i3] += Math.cos(angle) * 0.03;
                    posArray[i3 + 2] += Math.sin(angle) * 0.03;
                }
            }
            particleGeometry.attributes.position.needsUpdate = true;

            // Connection line animation
            connections.forEach((line, i) => {
                const lineMaterial = line.material as THREE.LineBasicMaterial;
                lineMaterial.opacity = 0.03 + Math.sin(elapsed * 2 + i) * 0.03 * currentIntensity;
                lineMaterial.color.lerp(targetColor, 0.01);
            });

            // Camera parallax
            camera.position.x = mouseX * 30;
            camera.position.y = -mouseY * 20;
            camera.position.z = 100 - window.scrollY * 0.02;
            camera.lookAt(0, 0, 0);

            try {
                renderer.render(scene, camera);
            } catch (e) {
                console.warn('Background3D: Render error, stopping animation.', e);
                cancelAnimationFrame(animationRef.current);
            }
        };

        animate();

        // --- CLEANUP ---
        return () => {
            canvas.removeEventListener('webglcontextlost', handleContextLost);
            canvas.removeEventListener('webglcontextrestored', handleContextRestored);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('resize', onResize);
            cancelAnimationFrame(animationRef.current);

            scene.traverse((object) => {
                if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Points) {
                    object.geometry.dispose();
                    if (Array.isArray(object.material)) {
                        object.material.forEach(m => m.dispose());
                    } else if (object.material) {
                        (object.material as THREE.Material).dispose();
                    }
                }
            });

            renderer.dispose();
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            id="organic-background"
            aria-hidden="true"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: -1,
                pointerEvents: 'none'
            }}
        />
    );
};

export default Background3D;
