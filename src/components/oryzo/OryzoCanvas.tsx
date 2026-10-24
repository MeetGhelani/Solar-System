"use client";

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import { DiamondModel, DiamondViewMode } from "./DiamondModel";
import { SceneLoader } from "@/components/3d/core/SceneLoader";

interface OryzoCanvasProps {
  scrollProgress: number;
  viewMode: DiamondViewMode;
  className?: string;
}

export function OryzoCanvas({
  scrollProgress,
  viewMode,
  className = "w-full h-full",
}: OryzoCanvasProps) {
  return (
    <div className={`relative overflow-hidden select-none ${className}`}>
      <Suspense fallback={<SceneLoader label="Calibrating Crystalline Facets..." />}>
        <Canvas
          camera={{ position: [0, 0, 4.4], fov: 42 }}
          dpr={[1, 1.5]}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
          }}
        >
          {/* Studio Lighting Array for Faceted Polished Diamond */}
          {/* Base ambient illumination */}
          <ambientLight intensity={1.2} color="#ffffff" />

          {/* Crisp Top Key Spotlight for Facet Sparkles */}
          <spotLight
            position={[0, 8, 3]}
            intensity={4.5}
            color="#ffffff"
            angle={0.6}
            penumbra={0.4}
            castShadow
          />

          {/* Prismatic Cyan Rim Light */}
          <directionalLight
            position={[5, 4, 3]}
            intensity={3.0}
            color="#38bdf8"
          />

          {/* Prismatic Violet / Magenta Accent Light */}
          <directionalLight
            position={[-5, -2, -2]}
            intensity={3.2}
            color="#c084fc"
          />

          {/* Warm Tungsten Underlight for Internal Caustic Glow */}
          <pointLight
            position={[0, -2, 2]}
            intensity={2.2}
            color="#fef08a"
            distance={8}
          />

          {/* Backlight for Transmission Transparency */}
          <directionalLight
            position={[0, 3, -5]}
            intensity={2.8}
            color="#ffffff"
          />

          {/* 3D Polished Diamond Model */}
          <DiamondModel
            viewMode={viewMode}
            scrollProgress={scrollProgress}
            showAnnotations={true}
          />

          {/* Soft Ground Contact Shadow */}
          <ContactShadows
            position={[0, -1.5, 0]}
            opacity={0.65}
            scale={6.0}
            blur={2.2}
            far={3.0}
            color="#000000"
          />
        </Canvas>
      </Suspense>
    </div>
  );
}
