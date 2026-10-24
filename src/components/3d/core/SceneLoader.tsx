"use client";

import React from "react";

export function SceneLoader({ label = "Initializing Neural 3D Engine..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full min-h-[380px] bg-neutral-950/70 backdrop-blur-sm rounded-2xl border border-white/5 select-none">
      {/* High-tech pulsing reticle */}
      <div className="relative w-16 h-16 flex items-center justify-center mb-5">
        <div className="absolute inset-0 rounded-full border-2 border-[#00ff66]/20 animate-ping" />
        <div className="absolute inset-1 rounded-full border border-dashed border-[#00ff66]/40 animate-spin [animation-duration:8s]" />
        <div className="w-8 h-8 rounded-full border-2 border-t-[#00ff66] border-r-[#00ff66] border-b-transparent border-l-transparent animate-spin [animation-duration:1.2s]" />
        <div className="w-2 h-2 rounded-full bg-[#00ff66] shadow-[0_0_12px_#00ff66]" />
      </div>

      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[#00ff66] animate-pulse" />
        <p className="font-mono text-xs tracking-wider uppercase text-neutral-300">
          {label}
        </p>
      </div>

      <div className="w-36 h-0.5 mt-3 bg-neutral-800 rounded-full overflow-hidden">
        <div className="w-full h-full bg-gradient-to-r from-transparent via-[#00ff66] to-transparent animate-pulse" />
      </div>
    </div>
  );
}
