"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Float } from "@react-three/drei";
import * as THREE from "three";
import { useReducedMotion } from "@/hooks/useReducedMotion";

// Floating gold sparkles / ambient dust around the product
function generateGoldDust(count = 220): Float32Array {
  const positions: number[] = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = 0.3 + Math.random() * 1.5;
    const y = -1.0 + Math.random() * 2.2;
    positions.push(Math.cos(angle) * r, y, Math.sin(angle) * r);
  }
  return new Float32Array(positions);
}

export function ProductViewer() {
  const productGroupRef = useRef<THREE.Group>(null);
  const dustRef = useRef<THREE.Points>(null);
  const prefersReducedMotion = useReducedMotion();

  const dustPositions = useMemo(() => generateGoldDust(220), []);

  useFrame((state, delta) => {
    if (prefersReducedMotion) return;

    if (productGroupRef.current) {
      productGroupRef.current.rotation.y += delta * 0.22;
    }

    if (dustRef.current) {
      dustRef.current.rotation.y += delta * 0.08;
      const positions = dustRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] += delta * 0.12;
        if (positions[i] > 1.4) {
          positions[i] = -0.9;
        }
      }
      dustRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <>
      {/* Studio Lighting Array for Luxury Glass & Gold */}
      <ambientLight intensity={0.5} />
      {/* Crisp overhead studio key light */}
      <directionalLight position={[4, 7, 3]} intensity={2.6} color="#ffffff" castShadow />
      {/* Warm amber backlight shining through glass liquid */}
      <spotLight
        position={[-3, 2, -4]}
        intensity={3.2}
        color="#f6c344"
        angle={0.6}
        penumbra={0.8}
      />
      {/* Soft cool fill light */}
      <directionalLight position={[-4, 2, 4]} intensity={1.2} color="#93c5fd" />
      {/* Floor glow accent */}
      <pointLight position={[0, -0.6, 1.5]} intensity={1.2} color="#eab308" />

      {/* Smooth Orbit Controls with constrained angles */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 1.8}
        rotateSpeed={0.7}
      />

      <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.25}>
        <group ref={productGroupRef} position={[0, 0.05, 0]}>
          {/* Thick Faceted Glass Outer Bottle */}
          <mesh castShadow receiveShadow position={[0, 0, 0]}>
            <boxGeometry args={[1.35, 1.85, 0.75]} />
            <meshPhysicalMaterial
              roughness={0.03}
              transmission={0.95}
              thickness={1.5}
              ior={1.52}
              color="#ffffff"
              transparent
              opacity={0.88}
              clearcoat={1.0}
              clearcoatRoughness={0.03}
              reflectivity={1.0}
            />
          </mesh>

          {/* Internal Glowing Amber Fragrance Liquid */}
          <mesh position={[0, -0.1, 0]}>
            <boxGeometry args={[1.1, 1.5, 0.52]} />
            <meshPhysicalMaterial
              roughness={0.08}
              transmission={0.7}
              thickness={0.9}
              ior={1.38}
              color="#d4af37"
              transparent
              opacity={0.92}
            />
          </mesh>

          {/* Precision Gold Collar Ring */}
          <mesh position={[0, 1.08, 0]} castShadow>
            <cylinderGeometry args={[0.26, 0.28, 0.26, 36]} />
            <meshStandardMaterial
              metalness={0.98}
              roughness={0.12}
              color="#f3cf65"
            />
          </mesh>

          {/* Metallic Gold Cap with Chamfers */}
          <mesh position={[0, 1.48, 0]} castShadow>
            <cylinderGeometry args={[0.34, 0.34, 0.52, 36]} />
            <meshStandardMaterial
              metalness={0.98}
              roughness={0.14}
              color="#e6be44"
            />
          </mesh>

          {/* Gold Luxury Sprayer Nozzle */}
          <mesh position={[0, 1.25, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.12, 16]} />
            <meshStandardMaterial
              metalness={0.99}
              roughness={0.1}
              color="#ffd700"
            />
          </mesh>

          {/* Luxury Minimalist Label Badge */}
          <mesh position={[0, 0.05, 0.38]}>
            <planeGeometry args={[0.74, 0.4]} />
            <meshStandardMaterial
              color="#080808"
              metalness={0.8}
              roughness={0.25}
            />
          </mesh>
          <mesh position={[0, 0.05, 0.382]}>
            <planeGeometry args={[0.68, 0.34]} />
            <meshStandardMaterial
              color="#e5c158"
              metalness={0.95}
              roughness={0.18}
            />
          </mesh>

          {/* Rising Golden Dust Sparkles */}
          <points ref={dustRef}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[dustPositions, 3]}
              />
            </bufferGeometry>
            <pointsMaterial
              size={0.038}
              color="#ffd700"
              transparent
              opacity={0.9}
              blending={THREE.AdditiveBlending}
              sizeAttenuation
            />
          </points>
        </group>
      </Float>

      {/* Dark Stage Floor Plate */}
      <mesh position={[0, -1.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial
          color="#030507"
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>

      {/* Soft Contact Shadows on Floor */}
      <ContactShadows
        position={[0, -1.2, 0]}
        opacity={0.85}
        scale={6.5}
        blur={2.6}
        far={3.2}
        color="#000000"
      />
    </>
  );
}
