"use client";

import React, { ReactNode, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { useWebGLSupport } from "@/hooks/useWebGLSupport";
import { SceneErrorBoundary } from "./SceneErrorBoundary";
import { SceneLoader } from "./SceneLoader";
import { SceneFallback } from "./SceneFallback";

interface ThreeSceneProps {
  children: ReactNode;
  cameraPosition?: [number, number, number];
  fov?: number;
  className?: string;
  backgroundColor?: string;
  loaderLabel?: string;
}

export function ThreeScene({
  children,
  cameraPosition = [0, 0, 4.5],
  fov = 45,
  className = "w-full h-full min-h-[420px]",
  backgroundColor = "#030708",
  loaderLabel = "Loading 3D Scene...",
}: ThreeSceneProps) {
  const { isSupported, checked } = useWebGLSupport();

  if (!checked) {
    return <SceneLoader label={loaderLabel} />;
  }

  if (!isSupported) {
    return <SceneFallback />;
  }

  return (
    <SceneErrorBoundary>
      <div className={`relative overflow-hidden select-none ${className}`}>
        <Suspense fallback={<SceneLoader label={loaderLabel} />}>
          <Canvas
            camera={{ position: cameraPosition, fov }}
            dpr={[1, 1.5]}
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: "high-performance",
            }}
          >
            <color attach="background" args={[backgroundColor]} />
            {children}
          </Canvas>
        </Suspense>
      </div>
    </SceneErrorBoundary>
  );
}
