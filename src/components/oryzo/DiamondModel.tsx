"use client";

import React, { useRef, useMemo, useState } from "react";
import { useFrame, ThreeEvent } from "@react-three/fiber";
import { Html, Float } from "@react-three/drei";
import * as THREE from "three";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export type DiamondViewMode = "pbr" | "xray" | "thermal" | "prism";

interface DiamondModelProps {
  viewMode?: DiamondViewMode;
  scrollProgress: number; // 0 to 1
  showAnnotations?: boolean;
}

// Generates an authentic Brilliant-Cut Faceted Diamond BufferGeometry
function createBrilliantDiamondGeometry(segments = 16): THREE.BufferGeometry {
  const geom = new THREE.BufferGeometry();
  const vertices: number[] = [];

  const tableY = 0.65;
  const tableR = 0.75;

  const starY = 0.52;
  const starR = 1.08;

  const girdleTopY = 0.18;
  const girdleR = 1.45;

  const girdleBottomY = 0.1;

  const culetY = -1.35; // Bottom sharp point

  // Helper to push a triangle with independent face normals (flat faceted look)
  const addTriangle = (
    p1: [number, number, number],
    p2: [number, number, number],
    p3: [number, number, number]
  ) => {
    vertices.push(...p1, ...p2, ...p3);
  };

  const addQuad = (
    p1: [number, number, number],
    p2: [number, number, number],
    p3: [number, number, number],
    p4: [number, number, number]
  ) => {
    addTriangle(p1, p2, p3);
    addTriangle(p1, p3, p4);
  };

  // Generate rings of vertices
  const tableVerts: [number, number, number][] = [];
  const starVerts: [number, number, number][] = [];
  const girdleTopVerts: [number, number, number][] = [];
  const girdleBottomVerts: [number, number, number][] = [];

  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const halfAngle = ((i + 0.5) / segments) * Math.PI * 2;

    tableVerts.push([
      Math.cos(angle) * tableR,
      tableY,
      Math.sin(angle) * tableR,
    ]);

    starVerts.push([
      Math.cos(halfAngle) * starR,
      starY,
      Math.sin(halfAngle) * starR,
    ]);

    girdleTopVerts.push([
      Math.cos(angle) * girdleR,
      girdleTopY,
      Math.sin(angle) * girdleR,
    ]);

    girdleBottomVerts.push([
      Math.cos(angle) * girdleR,
      girdleBottomY,
      Math.sin(angle) * girdleR,
    ]);
  }

  // 1. Table Facet (Top flat octagon / n-gon)
  const centerTop: [number, number, number] = [0, tableY, 0];
  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments;
    addTriangle(centerTop, tableVerts[i], tableVerts[next]);
  }

  // 2. Crown Star Facets (Triangles between Table and Star ring)
  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments;
    addTriangle(tableVerts[i], starVerts[i], tableVerts[next]);
  }

  // 3. Kite & Upper Girdle Facets (Connecting Star ring to Girdle)
  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments;
    addTriangle(tableVerts[next], starVerts[i], girdleTopVerts[next]);
    addTriangle(starVerts[i], girdleTopVerts[i], girdleTopVerts[next]);
  }

  // 4. Girdle Edge (Thin vertical cylindrical band)
  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments;
    addQuad(
      girdleTopVerts[i],
      girdleTopVerts[next],
      girdleBottomVerts[next],
      girdleBottomVerts[i]
    );
  }

  // 5. Pavilion Facets (Lower faceted cone converging to the sharp culet tip)
  const culet: [number, number, number] = [0, culetY, 0];
  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments;
    addTriangle(girdleBottomVerts[i], girdleBottomVerts[next], culet);
  }

  geom.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3)
  );
  geom.computeVertexNormals();

  return geom;
}

// Floating rainbow prismatic sparkles
function generatePrismaticSparkles(count = 90): Float32Array {
  const positions: number[] = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = 1.6 + Math.random() * 1.2;
    const y = -1.2 + Math.random() * 2.4;
    positions.push(Math.cos(angle) * r, y, Math.sin(angle) * r);
  }
  return new Float32Array(positions);
}

export function DiamondModel({
  viewMode = "pbr",
  scrollProgress = 0,
  showAnnotations = true,
}: DiamondModelProps) {
  const diamondGroupRef = useRef<THREE.Group>(null);
  const sparklesRef = useRef<THREE.Points>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const prefersReducedMotion = useReducedMotion();

  // Mouse Drag / Toss State
  const [isDragging, setIsDragging] = useState(false);
  const dragVelocity = useRef({ x: 0, y: 0 });
  const previousPointer = useRef({ x: 0, y: 0 });
  const tossRotation = useRef({ x: 0, y: 0 });

  const geometry = useMemo(() => createBrilliantDiamondGeometry(16), []);
  const sparklePositions = useMemo(() => generatePrismaticSparkles(110), []);

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setIsDragging(true);
    previousPointer.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setIsDragging(false);
  };

  useFrame((state, delta) => {
    if (!diamondGroupRef.current) return;

    if (!isDragging) {
      tossRotation.current.x = THREE.MathUtils.damp(tossRotation.current.x, 0, 3.5, delta);
      tossRotation.current.y = THREE.MathUtils.damp(tossRotation.current.y, 0, 3.5, delta);
    }

    // Scroll-driven target orientation
    let targetX = 0;
    let targetY = 0;
    let targetZ = 0;
    let targetRotX = 0.35;
    let targetRotY = state.clock.elapsedTime * 0.22;
    let targetRotZ = 0;

    if (scrollProgress < 0.22) {
      // 01: Hero Center
      targetX = 0;
      targetY = 0.1;
      targetZ = 0;
      targetRotX = 0.35 + (prefersReducedMotion ? 0 : state.pointer.y * 0.25);
      targetRotY += (prefersReducedMotion ? 0 : state.pointer.x * 0.35);
    } else if (scrollProgress < 0.48) {
      // 02: Architecture - Macro facet close-up on the right
      const p = (scrollProgress - 0.22) / 0.26;
      targetX = THREE.MathUtils.lerp(0, 0.65, p);
      targetY = THREE.MathUtils.lerp(0.1, 0.15, p);
      targetZ = THREE.MathUtils.lerp(0, 0.45, p);
      targetRotX = THREE.MathUtils.lerp(0.35, 0.75, p);
      targetRotY = THREE.MathUtils.lerp(0, Math.PI * 0.65, p);
      targetRotZ = THREE.MathUtils.lerp(0, -0.2, p);
    } else if (scrollProgress < 0.72) {
      // 03: Optical Dispersion / Refraction Mode
      const p = (scrollProgress - 0.48) / 0.24;
      targetX = THREE.MathUtils.lerp(0.65, -0.55, p);
      targetY = THREE.MathUtils.lerp(0.15, 0.1, p);
      targetZ = THREE.MathUtils.lerp(0.45, 0.35, p);
      targetRotX = THREE.MathUtils.lerp(0.75, 1.15, p);
      targetRotY = THREE.MathUtils.lerp(Math.PI * 0.65, Math.PI * 1.35, p);
    } else if (scrollProgress < 0.88) {
      // 04: Interactive Toss Sandbox
      targetX = 0;
      targetY = 0.1;
      targetZ = 0.3;
      targetRotX = 0.45;
      targetRotY += 0.08;
    } else {
      // 05: Specs Table
      targetX = 0.8;
      targetY = 0.05;
      targetZ = 0;
      targetRotX = 0.35;
      targetRotY += 0.12;
    }

    // Damp position & rotation
    diamondGroupRef.current.position.x = THREE.MathUtils.damp(
      diamondGroupRef.current.position.x,
      targetX,
      4.0,
      delta
    );
    diamondGroupRef.current.position.y = THREE.MathUtils.damp(
      diamondGroupRef.current.position.y,
      targetY,
      4.0,
      delta
    );
    diamondGroupRef.current.position.z = THREE.MathUtils.damp(
      diamondGroupRef.current.position.z,
      targetZ,
      4.0,
      delta
    );

    diamondGroupRef.current.rotation.x = THREE.MathUtils.damp(
      diamondGroupRef.current.rotation.x,
      targetRotX + tossRotation.current.x,
      4.0,
      delta
    );
    diamondGroupRef.current.rotation.y = THREE.MathUtils.damp(
      diamondGroupRef.current.rotation.y,
      targetRotY + tossRotation.current.y,
      4.0,
      delta
    );
    diamondGroupRef.current.rotation.z = THREE.MathUtils.damp(
      diamondGroupRef.current.rotation.z,
      targetRotZ,
      4.0,
      delta
    );

    // Orbiting Prismatic Sparkles
    if (sparklesRef.current) {
      sparklesRef.current.rotation.y += delta * 0.15;
      sparklesRef.current.rotation.x += delta * 0.05;
    }

    // Floating Prismatic Halo Ring
    if (ringRef.current) {
      const pulse = 1.0 + Math.sin(state.clock.elapsedTime * 2.0) * 0.08;
      ringRef.current.scale.set(pulse, pulse, 1);
    }
  });

  const isAnnotationVisible =
    showAnnotations && scrollProgress > 0.22 && scrollProgress < 0.52;

  return (
    <Float
      speed={isDragging ? 0 : 1.5}
      rotationIntensity={isDragging ? 0 : 0.2}
      floatIntensity={isDragging ? 0 : 0.3}
    >
      <group
        ref={diamondGroupRef}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={(e) => {
          if (isDragging) {
            const dx = e.clientX - previousPointer.current.x;
            const dy = e.clientY - previousPointer.current.y;
            previousPointer.current = { x: e.clientX, y: e.clientY };

            tossRotation.current.y += dx * 0.008;
            tossRotation.current.x += dy * 0.008;
            dragVelocity.current = { x: dx * 0.01, y: dy * 0.01 };
          }
        }}
      >
        {/* 1. Main Brilliant-Cut Polished Diamond Mesh */}
        <mesh geometry={geometry} castShadow receiveShadow>
          {viewMode === "pbr" && (
            <meshPhysicalMaterial
              color="#f8fafc"
              roughness={0.0}
              metalness={0.05}
              transmission={0.96}
              thickness={2.4}
              ior={2.417} // Real Diamond Index of Refraction
              clearcoat={1.0}
              clearcoatRoughness={0.0}
              reflectivity={1.0}
              specularIntensity={2.5}
              specularColor="#ffffff"
              transparent
              opacity={0.95}
              flatShading={true} // Crisp individual facet glints!
            />
          )}

          {viewMode === "prism" && (
            <meshPhysicalMaterial
              color="#c7d2fe"
              roughness={0.02}
              transmission={0.92}
              thickness={2.8}
              ior={2.42}
              iridescence={0.95} // Prismatic dispersion simulation
              iridescenceIOR={1.8}
              iridescenceThicknessRange={[100, 600]}
              clearcoat={1.0}
              transparent
              opacity={0.95}
              flatShading={true}
            />
          )}

          {viewMode === "xray" && (
            <meshBasicMaterial
              color="#00f0ff"
              wireframe
              transparent
              opacity={0.85}
            />
          )}

          {viewMode === "thermal" && (
            <meshStandardMaterial
              color="#ff2200"
              roughness={0.3}
              emissive="#ff5500"
              emissiveIntensity={0.65}
              flatShading={true}
            />
          )}
        </mesh>

        {/* 2. Inner Refractive Prismatic Core */}
        <mesh scale={[0.65, 0.65, 0.65]} position={[0, -0.1, 0]}>
          <octahedronGeometry args={[1, 0]} />
          <meshPhysicalMaterial
            color="#00f0ff"
            roughness={0.1}
            transmission={0.7}
            ior={1.8}
            wireframe={viewMode === "xray"}
            transparent
            opacity={0.5}
          />
        </mesh>

        {/* 3. Orbiting Prismatic Caustic Sparkles */}
        <points ref={sparklesRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[sparklePositions, 3]}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.045}
            color="#a5f3fc"
            transparent
            opacity={0.85}
            blending={THREE.AdditiveBlending}
            sizeAttenuation
          />
        </points>

        {/* 4. Subtle Orbital Refraction Ring */}
        <mesh ref={ringRef} rotation={[Math.PI / 2.2, 0, 0]} position={[0, 0.1, 0]}>
          <torusGeometry args={[1.75, 0.015, 16, 96]} />
          <meshBasicMaterial
            color={viewMode === "prism" ? "#d946ef" : "#00f0ff"}
            transparent
            opacity={0.35}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* 3D Pinned Callout Annotations */}
        {showAnnotations && (
          <>
            {/* Annotation 1: Table & Crown Angle */}
            <Html position={[1.2, 0.45, 0]} center distanceFactor={7}>
              <div
                style={{
                  opacity: isAnnotationVisible ? 1 : 0,
                  transform: isAnnotationVisible ? "scale(1)" : "scale(0.8)",
                  transition: "opacity 0.3s ease, transform 0.3s ease",
                  pointerEvents: "none",
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-950/90 border border-[#00f0ff]/50 text-[#00f0ff] text-[11px] font-mono whitespace-nowrap shadow-2xl"
              >
                <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-ping" />
                <span className="font-semibold">57 FACETS • BRILLIANT CUT</span>
              </div>
            </Html>

            {/* Annotation 2: Diamond IOR */}
            <Html position={[0, 0.78, 0]} center distanceFactor={7}>
              <div
                style={{
                  opacity: isAnnotationVisible ? 1 : 0,
                  transform: isAnnotationVisible ? "scale(1)" : "scale(0.8)",
                  transition: "opacity 0.3s ease, transform 0.3s ease",
                  pointerEvents: "none",
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-950/90 border border-white/30 text-white text-[11px] font-mono whitespace-nowrap shadow-2xl"
              >
                <span className="w-2 h-2 rounded-full bg-[#e0e7ff]" />
                <span className="font-semibold">IOR 2.417 • FLAWLESS CLARITY (FL)</span>
              </div>
            </Html>

            {/* Annotation 3: Pavilion Angle */}
            <Html position={[-1.15, -0.75, 0.4]} center distanceFactor={7}>
              <div
                style={{
                  opacity: isAnnotationVisible ? 1 : 0,
                  transform: isAnnotationVisible ? "scale(1)" : "scale(0.8)",
                  transition: "opacity 0.3s ease, transform 0.3s ease",
                  pointerEvents: "none",
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-950/90 border border-purple-400/50 text-purple-300 text-[11px] font-mono whitespace-nowrap shadow-2xl"
              >
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                <span className="font-semibold">40.75° PAVILION REFLECTION</span>
              </div>
            </Html>
          </>
        )}
      </group>
    </Float>
  );
}
