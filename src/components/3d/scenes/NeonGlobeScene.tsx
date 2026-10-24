"use client";

import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { createWorldGlobeData, GlobeMapData } from "@/lib/three/worldMap";

// Orbiting satellites/data telemetry
function generateOrbitingParticles(count = 140, minR = 1.62, maxR = 2.15): Float32Array {
  const positions: number[] = [];
  for (let i = 0; i < count; i++) {
    const phi = Math.acos(-1 + (2 * i) / count);
    const theta = Math.sqrt(count * Math.PI) * phi;
    const r = minR + Math.random() * (maxR - minR);

    positions.push(
      r * Math.cos(theta) * Math.sin(phi),
      r * Math.sin(theta) * Math.sin(phi),
      r * Math.cos(phi)
    );
  }
  return new Float32Array(positions);
}

export function NeonGlobe() {
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const orbitsRef = useRef<THREE.Points>(null);
  const prefersReducedMotion = useReducedMotion();

  // Procedural high-accuracy world map data (texture + 3D point cloud)
  const mapData: GlobeMapData = useMemo(() => createWorldGlobeData(1.4), []);
  const orbitPositions = useMemo(() => generateOrbitingParticles(140), []);

  useEffect(() => {
    return () => {
      mapData.canvasTexture.dispose();
    };
  }, [mapData]);

  useFrame((state, delta) => {
    if (prefersReducedMotion) return;

    if (orbitsRef.current) {
      orbitsRef.current.rotation.y -= delta * 0.14;
      orbitsRef.current.rotation.x += delta * 0.04;
    }

    if (atmosphereRef.current) {
      const s = 1.0 + Math.sin(state.clock.elapsedTime * 1.6) * 0.015;
      atmosphereRef.current.scale.set(s, s, s);
    }
  });

  return (
    <>
      {/* Interactive Orbit Controls with smooth mouse/touch drag, auto-spin & zoom */}
      <OrbitControls
        enableDamping={true}
        dampingFactor={0.06}
        autoRotate={!prefersReducedMotion}
        autoRotateSpeed={0.8}
        enableZoom={true}
        minDistance={2.4}
        maxDistance={6.5}
        rotateSpeed={0.8}
        enablePan={false}
      />

      <group>
        {/* 1. Base Earth Sphere with Continent & Country Border Map */}
        <mesh>
          <sphereGeometry args={[1.4, 64, 48]} />
          <meshBasicMaterial
            map={mapData.canvasTexture}
            color="#ffffff"
            transparent
            opacity={0.92}
          />
        </mesh>

        {/* 2. Concentric Neon-Green Wireframe Grid (Meridians & Parallels) */}
        <mesh>
          <sphereGeometry args={[1.408, 36, 20]} />
          <meshBasicMaterial
            color="#00ff66"
            wireframe
            transparent
            opacity={0.25}
            depthWrite={false}
          />
        </mesh>

        {/* 3. High-Density Glowing Continental Land Points */}
        {mapData.landPoints.length > 0 && (
          <points>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[mapData.landPoints, 3]}
              />
            </bufferGeometry>
            <pointsMaterial
              size={0.032}
              color="#00ff66"
              transparent
              opacity={0.85}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              sizeAttenuation
            />
          </points>
        )}

        {/* 4. Bright Border & Coastline Highlight Points */}
        {mapData.borderPoints.length > 0 && (
          <points>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[mapData.borderPoints, 3]}
              />
            </bufferGeometry>
            <pointsMaterial
              size={0.045}
              color="#39ff14"
              transparent
              opacity={0.95}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              sizeAttenuation
            />
          </points>
        )}

        {/* 5. Glowing Atmospheric Rim Shell */}
        <mesh ref={atmosphereRef}>
          <sphereGeometry args={[1.56, 48, 48]} />
          <meshBasicMaterial
            color="#00ff66"
            transparent
            opacity={0.16}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* 6. Orbiting Telemetry Satellites */}
        <points ref={orbitsRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[orbitPositions, 3]}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.042}
            color="#39ff14"
            transparent
            opacity={0.8}
            blending={THREE.AdditiveBlending}
            sizeAttenuation
          />
        </points>
      </group>
    </>
  );
}
