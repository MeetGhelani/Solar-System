"use client";

import React, { useRef, useState } from "react";
import { useFrame, ThreeEvent } from "@react-three/fiber";
import { Html, Float } from "@react-three/drei";
import * as THREE from "three";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export type ViewMode = "pbr" | "xray" | "thermal";

interface HardwarePuckProps {
  viewMode?: ViewMode;
  scrollProgress: number; // 0 to 1
  showAnnotations?: boolean;
}

export function HardwarePuck({
  viewMode = "pbr",
  scrollProgress = 0,
  showAnnotations = true,
}: HardwarePuckProps) {
  const puckGroupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const prefersReducedMotion = useReducedMotion();

  // Mouse Drag / Toss State
  const [isDragging, setIsDragging] = useState(false);
  const dragVelocity = useRef({ x: 0, y: 0 });
  const previousPointer = useRef({ x: 0, y: 0 });
  const tossRotation = useRef({ x: 0, y: 0 });

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
    if (!puckGroupRef.current) return;

    // Apply toss inertia damping if user dragged and released
    if (!isDragging) {
      tossRotation.current.x = THREE.MathUtils.damp(tossRotation.current.x, 0, 3.5, delta);
      tossRotation.current.y = THREE.MathUtils.damp(tossRotation.current.y, 0, 3.5, delta);
    }

    // Smooth scroll-driven positioning:
    // Keeps the disk beautifully framed and completely visible in every section
    let targetX = 0;
    let targetY = 0;
    let targetZ = 0;
    let targetRotX = 0.65;
    let targetRotY = state.clock.elapsedTime * 0.16;
    let targetRotZ = 0;

    if (scrollProgress < 0.22) {
      // 01: Hero - Center floating
      targetX = 0;
      targetY = 0;
      targetZ = 0;
      targetRotX = 0.58 + (prefersReducedMotion ? 0 : state.pointer.y * 0.22);
      targetRotY += (prefersReducedMotion ? 0 : state.pointer.x * 0.28);
    } else if (scrollProgress < 0.48) {
      // 02: Architecture - Shifted right so left text doesn't overlap; perfect 45° angle
      const p = (scrollProgress - 0.22) / 0.26;
      targetX = THREE.MathUtils.lerp(0, 0.55, p);
      targetY = THREE.MathUtils.lerp(0, 0.05, p);
      targetZ = THREE.MathUtils.lerp(0, 0.15, p);
      targetRotX = THREE.MathUtils.lerp(0.58, 0.88, p);
      targetRotY = THREE.MathUtils.lerp(0, Math.PI * 0.55, p);
      targetRotZ = THREE.MathUtils.lerp(0, -0.15, p);
    } else if (scrollProgress < 0.72) {
      // 03: Thermal & X-Ray - Tilted face toward viewer
      const p = (scrollProgress - 0.48) / 0.24;
      targetX = THREE.MathUtils.lerp(0.55, -0.5, p);
      targetY = THREE.MathUtils.lerp(0.05, 0.05, p);
      targetZ = THREE.MathUtils.lerp(0.15, 0.2, p);
      targetRotX = THREE.MathUtils.lerp(0.88, 1.15, p);
      targetRotY = THREE.MathUtils.lerp(Math.PI * 0.55, Math.PI * 1.1, p);
    } else if (scrollProgress < 0.88) {
      // 04: Interactive Toss Sandbox - Centered
      targetX = 0;
      targetY = 0;
      targetZ = 0.2;
      targetRotX = 0.65;
      targetRotY += 0.05;
    } else {
      // 05: Specs - Shifted right for specs table
      targetX = 0.75;
      targetY = -0.05;
      targetZ = -0.1;
      targetRotX = 0.5;
      targetRotY += 0.1;
    }

    // Smoothly interpolate transform
    puckGroupRef.current.position.x = THREE.MathUtils.damp(
      puckGroupRef.current.position.x,
      targetX,
      4.0,
      delta
    );
    puckGroupRef.current.position.y = THREE.MathUtils.damp(
      puckGroupRef.current.position.y,
      targetY,
      4.0,
      delta
    );
    puckGroupRef.current.position.z = THREE.MathUtils.damp(
      puckGroupRef.current.position.z,
      targetZ,
      4.0,
      delta
    );

    puckGroupRef.current.rotation.x = THREE.MathUtils.damp(
      puckGroupRef.current.rotation.x,
      targetRotX + tossRotation.current.x,
      4.0,
      delta
    );
    puckGroupRef.current.rotation.y = THREE.MathUtils.damp(
      puckGroupRef.current.rotation.y,
      targetRotY + tossRotation.current.y,
      4.0,
      delta
    );
    puckGroupRef.current.rotation.z = THREE.MathUtils.damp(
      puckGroupRef.current.rotation.z,
      targetRotZ,
      4.0,
      delta
    );

    // Glowing LED Ring gentle breathing
    if (ringRef.current) {
      const pulse = 1.0 + Math.sin(state.clock.elapsedTime * 2.2) * 0.08;
      ringRef.current.scale.set(pulse, 1, pulse);
    }
  });

  const isAnnotationVisible =
    showAnnotations && scrollProgress > 0.22 && scrollProgress < 0.52;

  return (
    <Float
      speed={isDragging ? 0 : 1.2}
      rotationIntensity={isDragging ? 0 : 0.15}
      floatIntensity={isDragging ? 0 : 0.25}
    >
      <group
        ref={puckGroupRef}
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
        {/* 1. Main Space Gray / Titanium Alloy Chassis (Visible High-Contrast Finish) */}
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[1.5, 1.5, 0.44, 64]} />
          {viewMode === "pbr" && (
            <meshStandardMaterial
              color="#3a4454"
              metalness={0.72}
              roughness={0.28}
            />
          )}
          {viewMode === "xray" && (
            <meshBasicMaterial
              color="#00f0ff"
              wireframe
              transparent
              opacity={0.8}
            />
          )}
          {viewMode === "thermal" && (
            <meshStandardMaterial
              color="#ff3300"
              roughness={0.4}
              emissive="#aa1100"
              emissiveIntensity={0.7}
            />
          )}
        </mesh>

        {/* 2. Precision Diamond-Cut Silver Chamfered Bezel Lip */}
        <mesh position={[0, 0.222, 0]}>
          <cylinderGeometry args={[1.44, 1.5, 0.045, 64]} />
          {viewMode === "pbr" && (
            <meshStandardMaterial
              color="#d1d5db"
              metalness={0.96}
              roughness={0.12}
            />
          )}
          {viewMode === "xray" && (
            <meshBasicMaterial color="#00f0ff" wireframe opacity={0.9} />
          )}
          {viewMode === "thermal" && (
            <meshStandardMaterial color="#ffaa00" emissive="#cc6600" />
          )}
        </mesh>

        {/* 3. Top Face Plate with Concentric Machined Texture */}
        <mesh position={[0, 0.225, 0]}>
          <cylinderGeometry args={[1.42, 1.42, 0.01, 64]} />
          {viewMode === "pbr" && (
            <meshStandardMaterial
              color="#1f2937"
              metalness={0.85}
              roughness={0.2}
            />
          )}
          {viewMode === "xray" && (
            <meshBasicMaterial color="#00f0ff" wireframe opacity={0.3} />
          )}
          {viewMode === "thermal" && (
            <meshStandardMaterial color="#ffdd00" emissive="#aa8800" />
          )}
        </mesh>

        {/* 4. Sub-surface Neural Chip Wafer (Gold & Cyan Laser Circuit Tracks) */}
        <group position={[0, 0.228, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          {/* Outer Gold Circuit Track */}
          <mesh>
            <ringGeometry args={[1.05, 1.35, 64]} />
            <meshStandardMaterial
              color={viewMode === "thermal" ? "#00ffff" : "#e5c158"}
              metalness={0.95}
              roughness={0.15}
              wireframe={viewMode === "xray"}
            />
          </mesh>

          {/* Intermediate Accent Track */}
          <mesh>
            <ringGeometry args={[0.7, 0.95, 48]} />
            <meshStandardMaterial
              color={viewMode === "thermal" ? "#00ff66" : "#cbd5e1"}
              metalness={0.9}
              roughness={0.25}
              wireframe={viewMode === "xray"}
            />
          </mesh>

          {/* Inner Golden Core */}
          <mesh>
            <ringGeometry args={[0.35, 0.6, 36]} />
            <meshStandardMaterial
              color={viewMode === "thermal" ? "#0088ff" : "#f59e0b"}
              metalness={0.95}
              roughness={0.15}
            />
          </mesh>
        </group>

        {/* 5. Smoked Sapphire Optical Glass Top Lens */}
        <mesh position={[0, 0.235, 0]}>
          <cylinderGeometry args={[1.38, 1.38, 0.02, 64]} />
          {viewMode === "pbr" && (
            <meshPhysicalMaterial
              color="#1e293b"
              transmission={0.78}
              thickness={0.8}
              roughness={0.06}
              ior={1.54}
              reflectivity={1.0}
              clearcoat={1.0}
              clearcoatRoughness={0.05}
              transparent
              opacity={0.85}
            />
          )}
          {viewMode === "xray" && (
            <meshBasicMaterial
              color="#00f0ff"
              wireframe
              transparent
              opacity={0.25}
            />
          )}
          {viewMode === "thermal" && (
            <meshStandardMaterial color="#22c55e" emissive="#15803d" />
          )}
        </mesh>

        {/* 6. Center Laser-Engraved Hardware Iris Badge */}
        <mesh position={[0, 0.24, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.3, 32]} />
          <meshStandardMaterial
            color="#0f172a"
            metalness={0.9}
            roughness={0.2}
          />
        </mesh>
        <mesh position={[0, 0.242, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.08, 0.16, 24]} />
          <meshBasicMaterial color="#00ff66" />
        </mesh>

        {/* 7. Circumferential LED Status Halo Ring */}
        <mesh ref={ringRef} position={[0, 0.02, 0]}>
          <torusGeometry args={[1.508, 0.028, 16, 64]} />
          <meshBasicMaterial
            color={
              viewMode === "thermal"
                ? "#ff0044"
                : viewMode === "xray"
                ? "#00f0ff"
                : "#00ff66"
            }
          />
        </mesh>

        {/* 8. Perimeter Micro-Perforations (Acoustic & Thermal Grille) */}
        <mesh position={[0, -0.06, 0]}>
          <cylinderGeometry args={[1.503, 1.503, 0.18, 48, 1, true]} />
          <meshStandardMaterial
            color="#111827"
            wireframe
            roughness={0.6}
            metalness={0.8}
          />
        </mesh>

        {/* 9. Bottom Anti-Slip Matte Rubber Base Ring */}
        <mesh position={[0, -0.225, 0]}>
          <cylinderGeometry args={[1.36, 1.36, 0.025, 48]} />
          <meshStandardMaterial
            color="#0f172a"
            roughness={0.85}
            metalness={0.1}
          />
        </mesh>

        {/* Dynamic 3D Pinned Callout Annotations (Kept mounted, animated with CSS to prevent React 19 unmount errors) */}
        {showAnnotations && (
          <>
            {/* Annotation 1: Precision Diameter */}
            <Html position={[1.45, 0.28, 0]} center distanceFactor={7}>
              <div
                style={{
                  opacity: isAnnotationVisible ? 1 : 0,
                  transform: isAnnotationVisible ? "scale(1)" : "scale(0.8)",
                  transition: "opacity 0.3s ease, transform 0.3s ease",
                  pointerEvents: "none",
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-950/90 border border-[#00ff66]/50 text-[#00ff66] text-[11px] font-mono whitespace-nowrap shadow-2xl"
              >
                <span className="w-2 h-2 rounded-full bg-[#00ff66] animate-ping" />
                <span className="font-semibold">Ø 42.5mm PRECISION CNC</span>
              </div>
            </Html>

            {/* Annotation 2: Smoked Sapphire Glass */}
            <Html position={[0, 0.42, 0]} center distanceFactor={7}>
              <div
                style={{
                  opacity: isAnnotationVisible ? 1 : 0,
                  transform: isAnnotationVisible ? "scale(1)" : "scale(0.8)",
                  transition: "opacity 0.3s ease, transform 0.3s ease",
                  pointerEvents: "none",
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-950/90 border border-white/30 text-white text-[11px] font-mono whitespace-nowrap shadow-2xl"
              >
                <span className="w-2 h-2 rounded-full bg-[#00f0ff]" />
                <span className="font-semibold">SAPPHIRE OPTICAL WAFER</span>
              </div>
            </Html>

            {/* Annotation 3: Thermal Dissipation Grille */}
            <Html position={[-1.35, -0.25, 0.5]} center distanceFactor={7}>
              <div
                style={{
                  opacity: isAnnotationVisible ? 1 : 0,
                  transform: isAnnotationVisible ? "scale(1)" : "scale(0.8)",
                  transition: "opacity 0.3s ease, transform 0.3s ease",
                  pointerEvents: "none",
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-950/90 border border-amber-400/50 text-amber-300 text-[11px] font-mono whitespace-nowrap shadow-2xl"
              >
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="font-semibold">THERMAL EXHAUST GRILLE</span>
              </div>
            </Html>
          </>
        )}
      </group>
    </Float>
  );
}
