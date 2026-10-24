"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export function LiquidMetalHero() {
  const meshRef = useRef<THREE.Mesh>(null);
  const cyanLightRef = useRef<THREE.PointLight>(null);
  const violetLightRef = useRef<THREE.PointLight>(null);
  const blueLightRef = useRef<THREE.DirectionalLight>(null);
  const prefersReducedMotion = useReducedMotion();

  useFrame((state, delta) => {
    if (prefersReducedMotion) return;

    const t = state.clock.elapsedTime;

    if (meshRef.current) {
      // Fluid multi-axis organic rotation with cursor tilt
      meshRef.current.rotation.x = Math.sin(t * 0.35) * 0.35 + state.pointer.y * 0.45;
      meshRef.current.rotation.y += delta * 0.38;
      meshRef.current.rotation.z = Math.cos(t * 0.28) * 0.25 - state.pointer.x * 0.45;

      // Organic breathing scale
      const pulse = 1.0 + Math.sin(t * 1.4) * 0.035;
      meshRef.current.scale.set(pulse, pulse, pulse);
    }

    // Dynamic sweeping rim lights creating iridescent color waves
    if (cyanLightRef.current) {
      cyanLightRef.current.position.x = Math.sin(t * 1.4) * 4.2;
      cyanLightRef.current.position.y = Math.cos(t * 1.1) * 3.5;
      cyanLightRef.current.position.z = Math.sin(t * 0.8) * 3.5;
    }
    if (violetLightRef.current) {
      violetLightRef.current.position.x = Math.cos(t * 1.3) * -4.2;
      violetLightRef.current.position.y = Math.sin(t * 1.2) * -3.2;
      violetLightRef.current.position.z = Math.cos(t * 0.9) * 3.5;
    }
  });

  return (
    <>
      {/* Cinematic Studio Lighting Rig */}
      <ambientLight intensity={0.5} />

      {/* Cyber Cyan Specular Rim Light */}
      <pointLight
        ref={cyanLightRef}
        position={[3.5, 2.5, 3]}
        intensity={4.5}
        color="#00f0ff"
        distance={14}
      />

      {/* Radiant Violet / Magenta Accent Light */}
      <pointLight
        ref={violetLightRef}
        position={[-3.5, -2, -2]}
        intensity={5.0}
        color="#c026d3"
        distance={14}
      />

      {/* Deep Electric Blue Studio Key Light */}
      <directionalLight
        ref={blueLightRef}
        position={[0, 4.5, 3.5]}
        intensity={2.2}
        color="#3b82f6"
      />

      {/* Crisp White Top Glint */}
      <spotLight
        position={[0, 6, 0]}
        intensity={2.0}
        color="#ffffff"
        angle={0.5}
        penumbra={0.7}
      />

      {/* Floating Fluid Liquid-Metal Mesh */}
      <Float speed={1.8} rotationIntensity={0.4} floatIntensity={0.6}>
        <mesh ref={meshRef} position={[0, 0, 0]}>
          {/* High-tessellation folded organic torus knot */}
          <torusKnotGeometry args={[1.08, 0.4, 256, 64, 2, 3]} />
          <meshPhysicalMaterial
            color="#1e293b"
            metalness={0.99}
            roughness={0.06}
            clearcoat={1.0}
            clearcoatRoughness={0.04}
            reflectivity={1.0}
            iridescence={0.96}
            iridescenceIOR={1.75}
            iridescenceThicknessRange={[100, 520]}
            envMapIntensity={3.0}
          />
        </mesh>
      </Float>

      {/* Orbital Neon Ring Horizon */}
      <mesh rotation={[Math.PI / 2.3, 0, 0]}>
        <torusGeometry args={[1.9, 0.016, 16, 120]} />
        <meshBasicMaterial
          color="#00f0ff"
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </>
  );
}
