"use client";

import React from "react";
import { Globe, Box, Sparkles, Orbit, CheckCircle2 } from "lucide-react";

export type SceneId = "globe" | "product" | "particles" | "liquid";

interface SceneOption {
  id: SceneId;
  index: string;
  title: string;
  tagline: string;
  badge?: string;
  badgeColor?: string;
  icon: React.ReactNode;
  interactionHint: string;
}

export const SCENE_OPTIONS: SceneOption[] = [
  {
    id: "globe",
    index: "01",
    title: "Neon 3D Globe",
    tagline:
      "A rotating globe with glowing continent outlines, neon green wireframes, and a dark futuristic background. Ideal for a technology or AI website.",
    badge: "Recommended for your AI website",
    badgeColor: "bg-[#00ff66]/15 text-[#00ff66] border-[#00ff66]/30",
    icon: <Globe className="w-5 h-5 text-[#00ff66]" />,
    interactionHint: "Drag with mouse/touch to spin globe • Scroll to zoom",
  },
  {
    id: "product",
    index: "02",
    title: "3D Product Model",
    tagline:
      "A realistic perfume bottle with physical glass transmission, liquid refractions, gold accents, contact shadows, and floating sparkles.",
    badge: "Interactive Product Showcase",
    badgeColor: "bg-amber-400/15 text-amber-300 border-amber-400/30",
    icon: <Box className="w-5 h-5 text-amber-400" />,
    interactionHint: "Drag with mouse/touch to rotate 360°",
  },
  {
    id: "particles",
    index: "03",
    title: "Interactive 3D Background",
    tagline:
      "Animated particles, floating geometric objects, glowing effects, and mouse-responsive wave ripple deformation.",
    badge: "Generative GPU Shader",
    badgeColor: "bg-emerald-400/15 text-emerald-300 border-emerald-400/30",
    icon: <Sparkles className="w-5 h-5 text-emerald-400" />,
    interactionHint: "Hover mouse to trigger shockwave ripples",
  },
  {
    id: "liquid",
    index: "04",
    title: "Abstract 3D Hero Element",
    tagline:
      "A liquid-metal sculpture with smooth animation, cinematic multi-color rim lighting, and a premium landing-page aesthetic.",
    badge: "Iridescent Chrome Material",
    badgeColor: "bg-cyan-400/15 text-cyan-300 border-cyan-400/30",
    icon: <Orbit className="w-5 h-5 text-cyan-400" />,
    interactionHint: "Move cursor for dynamic specular highlights",
  },
];

interface SceneSwitcherProps {
  activeScene: SceneId;
  onSelectScene: (id: SceneId) => void;
}

export function SceneSwitcher({ activeScene, onSelectScene }: SceneSwitcherProps) {
  return (
    <div className="flex flex-col gap-3.5 w-full">
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <h2 className="text-xs font-mono font-semibold uppercase tracking-widest text-neutral-400">
          Select Active 3D Scene
        </h2>
        <span className="text-[11px] font-mono text-[#00ff66]">
          4 Production Scenes Loaded
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {SCENE_OPTIONS.map((scene) => {
          const isActive = activeScene === scene.id;

          return (
            <button
              key={scene.id}
              onClick={() => onSelectScene(scene.id)}
              className={`group relative text-left p-4 rounded-xl transition-all duration-300 cursor-pointer border ${
                isActive
                  ? "bg-neutral-900/90 border-[#00ff66]/50 shadow-[0_0_25px_rgba(0,255,102,0.15)] ring-1 ring-[#00ff66]/30"
                  : "bg-neutral-950/60 border-white/8 hover:border-white/20 hover:bg-neutral-900/50"
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`p-2.5 rounded-lg border transition-colors ${
                    isActive
                      ? "bg-white/10 border-[#00ff66]/40"
                      : "bg-white/5 border-white/10 group-hover:bg-white/8"
                  }`}
                >
                  {scene.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-neutral-500 font-bold">
                        {scene.index} —
                      </span>
                      <h3
                        className={`text-sm font-semibold tracking-tight transition-colors ${
                          isActive ? "text-white" : "text-neutral-200 group-hover:text-white"
                        }`}
                      >
                        {scene.title}
                      </h3>
                    </div>

                    {isActive && (
                      <CheckCircle2 className="w-4 h-4 text-[#00ff66] flex-shrink-0 animate-in fade-in" />
                    )}
                  </div>

                  <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed mb-2.5">
                    {scene.tagline}
                  </p>

                  <div className="flex flex-wrap items-center gap-2">
                    {scene.badge && (
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${scene.badgeColor}`}
                      >
                        {scene.badge}
                      </span>
                    )}

                    <span className="text-[10px] font-mono text-neutral-500">
                      • {scene.interactionHint}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
