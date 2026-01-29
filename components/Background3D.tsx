
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const Background3D: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        // --- 2026 EXPERIMENTAL "KNOWLEDGE ARCHITECTURE" ENGINE ---
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

        // --- Custom Shader: Liquid Glass ---
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
            gl_FragColor = vec4(uColor + vGlow, 0.4);
        }
    `;

        // --- SACRED GEOMETRY CENTERPIECE ---
        const mandalaGroup = new THREE.Group();
        const mandalaMat = new THREE.MeshStandardMaterial({
            color: 0xfbbf24,
            wireframe: true,
            transparent: true,
            opacity: 0.15
        });

        const soulMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(15, 1), mandalaMat);
        const ringMesh = new THREE.Mesh(new THREE.TorusKnotGeometry(12, 0.5, 128, 16), mandalaMat);
        mandalaGroup.add(soulMesh, ringMesh);
        scene.add(mandalaGroup);

        // --- HOLOGRAPHIC GRID FLOOR ---
        const floorGrid = new THREE.GridHelper(600, 60, 0x14b8a6, 0x14b8a6);
        floorGrid.position.y = -80;
        floorGrid.material.transparent = true;
        floorGrid.material.opacity = 0.05;
        scene.add(floorGrid);

        // --- LIQUID KNOWLEDGE ORBS ---
        const orbs: any[] = [];
        const palette = [new THREE.Color(0x14b8a6), new THREE.Color(0xfbbf24), new THREE.Color(0xffffff)];
        const orbGeo = new THREE.SphereGeometry(1, 32, 32);

        for (let i = 0; i < 25; i++) {
            const material = new THREE.ShaderMaterial({
                vertexShader: holoVertex,
                fragmentShader: holoFragment,
                uniforms: {
                    uTime: { value: 0 },
                    uColor: { value: palette[i % 3] }
                },
                transparent: true
            });
            const orb = new THREE.Mesh(orbGeo, material);
            const size = Math.random() * 8 + 2;
            orb.scale.set(size, size, size);
            orb.position.set(
                THREE.MathUtils.randFloatSpread(200),
                THREE.MathUtils.randFloatSpread(150),
                THREE.MathUtils.randFloatSpread(100)
            );

            orb.userData = {
                vel: new THREE.Vector3(Math.random() * 0.02 - 0.01, Math.random() * 0.02 - 0.01, Math.random() * 0.02 - 0.01)
            };

            scene.add(orb);
            orbs.push(orb);
        }

        // --- NEURAL CONNECTIONS ---
        const connectionMat = new THREE.LineBasicMaterial({ color: 0x14b8a6, transparent: true, opacity: 0.08 });
        const connections: any[] = [];
        for (let i = 0; i < 12; i++) {
            const points = [new THREE.Vector3(), new THREE.Vector3()];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, connectionMat);
            scene.add(line);
            connections.push({ line, o1: orbs[i], o2: orbs[i + 12] });
        }

        // --- LIGHTING ---
        const p1 = new THREE.PointLight(0xffffff, 1.2);
        p1.position.set(40, 40, 40);
        const p2 = new THREE.PointLight(0xfbbf24, 0.6);
        p2.position.set(-40, -40, 20);
        scene.add(p1, p2, new THREE.AmbientLight(0xffffff, 0.8));

        // --- INTERACTION ---
        let mx = 0, my = 0, tX = 0, tY = 0, sY = 0;

        const onMouseMove = (e: MouseEvent) => {
            tX = (e.clientX / window.innerWidth) - 0.5;
            tY = (e.clientY / window.innerHeight) - 0.5;
        };
        window.addEventListener('mousemove', onMouseMove);

        const onResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', onResize);

        const animate = () => {
            const frameId = requestAnimationFrame(animate);
            const time = performance.now() * 0.001;

            mx += (tX - mx) * 0.04;
            my += (tY - my) * 0.04;

            mandalaGroup.rotation.y += 0.0015;
            mandalaGroup.rotation.z += 0.0008;
            mandalaGroup.position.y = Math.sin(time) * 3;

            orbs.forEach(orb => {
                orb.material.uniforms.uTime.value = time;
                orb.position.add(orb.userData.vel);

                orb.position.x += mx * 0.05;
                orb.position.y -= my * 0.05;

                if (Math.abs(orb.position.x) > 100) orb.userData.vel.x *= -1;
                if (Math.abs(orb.position.y) > 80) orb.userData.vel.y *= -1;
            });

            connections.forEach(c => {
                c.line.geometry.setFromPoints([c.o1.position, c.o2.position]);
                c.line.geometry.attributes.position.needsUpdate = true;
            });

            const currentScroll = window.scrollY;
            sY += (currentScroll - sY) * 0.08;

            camera.position.z = 80 + sY * -0.015;
            camera.position.x = mx * 25;
            camera.position.y = -my * 25;
            camera.lookAt(0, 0, 0);

            renderer.render(scene, camera);
            return frameId;
        };

        const frameId = animate();

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('resize', onResize);
            cancelAnimationFrame(frameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            id="bg-canvas"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: -1, // Changed to -1 to be below all UI
                pointerEvents: 'none'
            }}
        />
    );
};

export default Background3D;
