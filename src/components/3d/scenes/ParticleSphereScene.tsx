"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useReducedMotion } from "@/hooks/useReducedMotion";

// Generate Fibonacci Sphere coordinates for uniform point distribution
function generateSphereParticles(count = 8500, radius = 1.38): Float32Array {
  const positions = new Float32Array(count * 3);
  const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle

  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = phi * i;

    positions[i * 3] = Math.cos(theta) * r * radius;
    positions[i * 3 + 1] = y * radius;
    positions[i * 3 + 2] = Math.sin(theta) * r * radius;
  }

  return positions;
}

// Optimized GPU simplex/harmonic wave displacement shader
const particleVertexShader = `
  uniform float uTime;
  uniform vec2 uMouse;
  attribute vec3 originalPosition;
  varying float vDisplacement;
  varying vec3 vPos;

  // Multi-frequency harmonic wave noise
  float getNoise(vec3 p, float t) {
    float n = sin(p.x * 3.8 + t * 1.6) * cos(p.y * 3.8 + t * 1.3) * sin(p.z * 3.8 + t * 1.5);
    n += 0.5 * sin(p.x * 7.5 - t * 2.4) * cos(p.z * 7.5 + t * 2.0);
    n += 0.25 * sin(p.y * 14.0 + t * 3.0);
    return n;
  }

  void main() {
    vPos = originalPosition;
    vec3 pos = originalPosition;

    // Harmonic wave displacement
    float noise = getNoise(pos, uTime);
    vDisplacement = noise;

    // Displace vertices along normal vector
    vec3 normal = normalize(pos);
    pos += normal * (noise * 0.32);

    // Dynamic mouse repulsion shockwave
    vec2 screenPos = pos.xy;
    float dist = distance(screenPos, uMouse);
    float mouseWave = smoothstep(1.8, 0.0, dist) * 0.42 * sin(dist * 14.0 - uTime * 4.5);
    pos += normal * mouseWave;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = (20.0 / -mvPosition.z) * (1.0 + noise * 0.45);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const particleFragmentShader = `
  varying float vDisplacement;
  varying vec3 vPos;

  void main() {
    float d = distance(gl_PointCoord, vec2(0.5));
    if (d > 0.5) discard;

    // Radial intensity falloff for neon glow
    float alpha = smoothstep(0.5, 0.04, d);

    // Color gradient from electric green to bright neon lime
    vec3 deepGreen = vec3(0.0, 0.9, 0.35);
    vec3 electricGreen = vec3(0.2, 1.0, 0.45);
    vec3 peakHighlight = vec3(0.65, 1.0, 0.85);

    vec3 color = mix(deepGreen, electricGreen, clamp(vDisplacement + 0.5, 0.0, 1.0));
    color = mix(color, peakHighlight, clamp(vDisplacement * 1.8 - 0.4, 0.0, 1.0));

    gl_FragColor = vec4(color, alpha * 0.92);
  }
`;

export function ParticleSphere() {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const prefersReducedMotion = useReducedMotion();

  const particlePositions = useMemo(() => generateSphereParticles(8500, 1.38), []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
    }),
    []
  );

  useFrame((state, delta) => {
    if (materialRef.current) {
      if (!prefersReducedMotion) {
        materialRef.current.uniforms.uTime.value += delta;
      }
      materialRef.current.uniforms.uMouse.value.lerp(
        new THREE.Vector2(state.pointer.x * 2.2, state.pointer.y * 2.2),
        0.12
      );
    }

    if (pointsRef.current && !prefersReducedMotion) {
      pointsRef.current.rotation.y += delta * 0.15;
      pointsRef.current.rotation.x = state.pointer.y * 0.2;
    }
  });

  return (
    <group>
      {/* Dense 8,500 Particle GPU Shader Field */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePositions, 3]}
          />
          <bufferAttribute
            attach="attributes-originalPosition"
            args={[particlePositions, 3]}
          />
        </bufferGeometry>
        <shaderMaterial
          ref={materialRef}
          vertexShader={particleVertexShader}
          fragmentShader={particleFragmentShader}
          uniforms={uniforms}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Atmospheric Inner Glow Core */}
      <mesh>
        <sphereGeometry args={[1.05, 32, 32]} />
        <meshBasicMaterial
          color="#003b17"
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Outer Volumetric Corona */}
      <mesh>
        <sphereGeometry args={[1.75, 32, 32]} />
        <meshBasicMaterial
          color="#00ff66"
          transparent
          opacity={0.07}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
