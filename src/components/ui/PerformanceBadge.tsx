"use client";

import React, { useState, useEffect } from "react";
import { Activity, Cpu, RotateCcw } from "lucide-react";

interface PerformanceBadgeProps {
  onResetCamera?: () => void;
  activeSceneTitle: string;
}

export function PerformanceBadge({ onResetCamera, activeSceneTitle }: PerformanceBadgeProps) {
  const [fps, setFps] = useState<number>(60);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animId: number;

    const loop = () => {
      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastTime)));
        frameCount = 0;
        lastTime = now;
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-neutral-950/80 border border-white/10 backdrop-blur-md">
      <div className="flex items-center gap-4">
        {/* FPS Indicator */}
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-[#00ff66]" />
          <span className="font-mono text-xs text-neutral-300">
            <strong className="text-white font-semibold">{fps}</strong> FPS
          </span>
        </div>

        {/* WebGL Status */}
        <div className="flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-[#00f0ff]" />
          <span className="font-mono text-xs text-neutral-400">
            WebGL 2.0 <span className="text-[#00ff66]">Active</span>
          </span>
        </div>

        {/* Current scene */}
        <div className="hidden sm:flex items-center gap-2 border-l border-white/10 pl-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00ff66] animate-pulse" />
          <span className="font-mono text-xs text-neutral-300 truncate">
            {activeSceneTitle}
          </span>
        </div>
      </div>

      {onResetCamera && (
        <button
          onClick={onResetCamera}
          className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 transition-colors cursor-pointer"
          title="Reset Camera & Angle"
        >
          <RotateCcw className="w-3 h-3 text-neutral-400" />
          Reset View
        </button>
      )}
    </div>
  );
}
