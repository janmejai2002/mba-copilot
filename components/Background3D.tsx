import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { useBackgroundStore, BackgroundState } from '../stores/useBackgroundStore';

/**
 * OrganicBackground3D - A living, breathing 3D background that responds to application state.
 * 
 * Features:
 * - Breathing mesh that expands/contracts based on app activity
 * - GPU-driven particle system (synapse nodes)
 * - Energy flow ribbons that respond to user actions
 * - State-reactive color and animation intensity
 * 
 * States: idle, recording, syncing, thinking, error
 */
const Background3D: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const animationRef = useRef<number>(0);

    // Zustand store for reactive state
    const { state, intensity, accentColor, pulseSpeed } = useBackgroundStore();

    // Refs for animation values that update reactively
    const stateRef = useRef<BackgroundState>(state);
    const intensityRef = useRef(intensity);
    const accentColorRef = useRef(accentColor);
    const pulseSpeedRef = useRef(pulseSpeed);

    // Update refs when store changes
    useEffect(() => {
        stateRef.current = state;
        intensityRef.current = intensity;
        accentColorRef.current = accentColor;
        pulseSpeedRef.current = pulseSpeed;
    }, [state, intensity, accentColor, pulseSpeed]);

    useEffect(() => {
        if (!canvasRef.current) return;

        // --- SCENE SETUP ---
        const scene = new THREE.Scene();
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 100;

        // Use WebGL2 Renderer with modern features
        // Note: For full WebGPU support, you would use WebGPURenderer when Three.js stabilizes it
        const renderer = new THREE.WebGLRenderer({
            canvas: canvasRef.current,
            alpha: true,
            antialias: true,
            powerPreference: "high-performance"
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(window.innerWidth, window.innerHeight);
        rendererRef.current = renderer;

        // --- BREATHING CORE MESH (Organic Heart) ---
        const coreGeometry = new THREE.IcosahedronGeometry(18, 2);
        const coreMaterial = new THREE.MeshStandardMaterial({
            color: 0x14b8a6,
            wireframe: true,
            transparent: true,
            opacity: 0.12
        });
        const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
        scene.add(coreMesh);

        // Secondary ring (torus knot)
        const ringGeometry = new THREE.TorusKnotGeometry(14, 0.5, 128, 16);
        const ringMaterial = new THREE.MeshStandardMaterial({
            color: 0xfbbf24,
            wireframe: true,
            transparent: true,
            opacity: 0.08
        });
        const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
        scene.add(ringMesh);

        // --- SYNAPSE PARTICLE SYSTEM ---
        const particleCount = 200;
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        const colors = new Float32Array(particleCount * 3);

        const palette = [
            new THREE.Color(0x14b8a6), // Teal
            new THREE.Color(0xfbbf24), // Gold
            new THREE.Color(0xffffff), // White
        ];

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;

            // Distribute in sphere
            const radius = 30 + Math.random() * 60;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);

            velocities[i3] = (Math.random() - 0.5) * 0.02;
            velocities[i3 + 1] = (Math.random() - 0.5) * 0.02;
            velocities[i3 + 2] = (Math.random() - 0.5) * 0.02;

            sizes[i] = Math.random() * 3 + 1;

            const color = palette[i % 3];
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;
        }

        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
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

        // --- NEURAL CONNECTION LINES ---
        const connectionMaterial = new THREE.LineBasicMaterial({
            color: 0x14b8a6,
            transparent: true,
            opacity: 0.06
        });

        const connections: THREE.Line[] = [];
        for (let i = 0; i < 30; i++) {
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

        // --- HOLOGRAPHIC GRID FLOORS ---
        const topGrid = new THREE.GridHelper(600, 40, 0x14b8a6, 0x14b8a6);
        topGrid.position.y = 80;
        (topGrid.material as THREE.Material).transparent = true;
        (topGrid.material as THREE.Material).opacity = 0.02;
        scene.add(topGrid);

        const bottomGrid = new THREE.GridHelper(600, 40, 0xfbbf24, 0xfbbf24);
        bottomGrid.position.y = -80;
        (bottomGrid.material as THREE.Material).transparent = true;
        (bottomGrid.material as THREE.Material).opacity = 0.02;
        scene.add(bottomGrid);

        // --- LIGHTING ---
        scene.add(new THREE.AmbientLight(0xffffff, 0.8));
        const pointLight = new THREE.PointLight(0xffffff, 1.2);
        pointLight.position.set(50, 50, 50);
        scene.add(pointLight);

        const accentLight = new THREE.PointLight(0x14b8a6, 0.5);
        accentLight.position.set(-40, -40, 30);
        scene.add(accentLight);

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
            animationRef.current = requestAnimationFrame(animate);
            const elapsed = clock.getElapsedTime();
            const currentIntensity = intensityRef.current;
            const currentPulseSpeed = pulseSpeedRef.current;
            const currentState = stateRef.current;

            // Smooth mouse following
            mouseX += (targetX - mouseX) * 0.05;
            mouseY += (targetY - mouseY) * 0.05;

            // --- BREATHING ANIMATION ---
            const breathAmplitude = 0.1 + currentIntensity * 0.15;
            const breathScale = 1 + Math.sin(elapsed * currentPulseSpeed) * breathAmplitude;
            coreMesh.scale.setScalar(breathScale);
            coreMesh.rotation.y += 0.002 * currentPulseSpeed;
            coreMesh.rotation.x = Math.sin(elapsed * 0.3) * 0.1;

            // Ring counter-rotation
            ringMesh.rotation.y -= 0.001 * currentPulseSpeed;
            ringMesh.rotation.z += 0.0005;
            ringMesh.scale.setScalar(breathScale * 0.95);

            // --- STATE-BASED COLOR UPDATES ---
            const targetColor = new THREE.Color(accentColorRef.current);
            (coreMaterial as THREE.MeshStandardMaterial).color.lerp(targetColor, 0.02);
            accentLight.color.lerp(targetColor, 0.02);

            // Opacity based on intensity
            coreMaterial.opacity = 0.08 + currentIntensity * 0.12;
            particleMaterial.opacity = 0.3 + currentIntensity * 0.5;

            // --- PARTICLE ANIMATION ---
            const posArray = particleGeometry.attributes.position.array as Float32Array;
            for (let i = 0; i < particleCount; i++) {
                const i3 = i * 3;

                // Apply velocity with state-based speed multiplier
                const speedMultiplier = 0.5 + currentIntensity * 1.5;
                posArray[i3] += velocities[i3] * speedMultiplier;
                posArray[i3 + 1] += velocities[i3 + 1] * speedMultiplier;
                posArray[i3 + 2] += velocities[i3 + 2] * speedMultiplier;

                // Mouse influence
                posArray[i3] += mouseX * 0.02;
                posArray[i3 + 1] -= mouseY * 0.02;

                // Boundary check - wrap around
                const dist = Math.sqrt(
                    posArray[i3] ** 2 + posArray[i3 + 1] ** 2 + posArray[i3 + 2] ** 2
                );
                if (dist > 100) {
                    const scale = 30 / dist;
                    posArray[i3] *= scale;
                    posArray[i3 + 1] *= scale;
                    posArray[i3 + 2] *= scale;
                }

                // State-specific behaviors
                if (currentState === 'recording') {
                    // Pulsing outward during recording
                    const pulsePhase = Math.sin(elapsed * 4 + i * 0.1);
                    posArray[i3] += pulsePhase * 0.1;
                    posArray[i3 + 1] += pulsePhase * 0.1;
                } else if (currentState === 'syncing') {
                    // Directional flow upward during sync
                    posArray[i3 + 1] += 0.05;
                    if (posArray[i3 + 1] > 60) posArray[i3 + 1] = -60;
                } else if (currentState === 'thinking') {
                    // Orbital motion during AI processing
                    const angle = elapsed * 2 + i * 0.1;
                    posArray[i3] += Math.cos(angle) * 0.03;
                    posArray[i3 + 2] += Math.sin(angle) * 0.03;
                }
            }
            particleGeometry.attributes.position.needsUpdate = true;

            // --- CONNECTION LINE ANIMATION ---
            connections.forEach((line, i) => {
                const lineMaterial = line.material as THREE.LineBasicMaterial;
                lineMaterial.opacity = 0.03 + Math.sin(elapsed * 2 + i) * 0.03 * currentIntensity;
                lineMaterial.color.lerp(targetColor, 0.01);
            });

            // --- CAMERA PARALLAX ---
            camera.position.x = mouseX * 30;
            camera.position.y = -mouseY * 20;
            camera.position.z = 100 - window.scrollY * 0.02;
            camera.lookAt(0, 0, 0);

            renderer.render(scene, camera);
        };

        animate();

        // --- CLEANUP ---
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('resize', onResize);
            cancelAnimationFrame(animationRef.current);

            // Proper Three.js disposal
            scene.traverse((object) => {
                if (object instanceof THREE.Mesh) {
                    object.geometry.dispose();
                    if (Array.isArray(object.material)) {
                        object.material.forEach(m => m.dispose());
                    } else if (object.material) {
                        object.material.dispose();
                    }
                }
                if (object instanceof THREE.Line) {
                    object.geometry.dispose();
                    if (object.material instanceof THREE.Material) {
                        object.material.dispose();
                    }
                }
                if (object instanceof THREE.Points) {
                    object.geometry.dispose();
                    if (object.material instanceof THREE.Material) {
                        object.material.dispose();
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
