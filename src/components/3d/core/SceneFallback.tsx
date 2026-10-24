"use client";

import React from "react";
import { MonitorX } from "lucide-react";

export function SceneFallback({ title = "3D Experience Requires WebGL" }: { title?: string }) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full min-h-[380px] p-8 text-center rounded-2xl border border-white/10 bg-neutral-900/60 backdrop-blur-md">
      <div className="p-3 mb-4 rounded-xl bg-white/5 border border-white/10 text-neutral-400">
        <MonitorX className="w-8 h-8" />
      </div>
      <h4 className="text-base font-semibold text-white mb-1.5">{title}</h4>
      <p className="text-xs text-neutral-400 max-w-sm mb-4 leading-relaxed">
        Your browser or hardware acceleration appears to have WebGL disabled. Enable hardware acceleration in your browser settings to enjoy real-time 3D shaders and animations.
      </p>
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-800/80 border border-neutral-700/60 text-[11px] font-mono text-neutral-300">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        Fallback Static Mode Active
      </div>
    </div>
  );
}
