"use client";

import React from "react";
import { DiamondViewMode } from "./DiamondModel";
import { Maximize2, Minimize2, Sparkles, Cpu, Flame, Gem } from "lucide-react";

interface TelemetryHUDProps {
  viewMode: DiamondViewMode;
  onSetViewMode: (mode: DiamondViewMode) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  scrollSection: string;
}

export function TelemetryHUD({
  viewMode,
  onSetViewMode,
  isFullscreen,
  onToggleFullscreen,
  scrollSection,
}: TelemetryHUDProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 py-4 backdrop-blur-xl bg-[#090b0e]/80 border-b border-white/8 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand & Live System Status */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center font-mono font-bold text-xs text-black shadow-[0_0_15px_rgba(56,189,248,0.5)]">
            <Gem className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-widest text-white uppercase">
                ORYZO // DIAMOND
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                FLAWLESS D-GRADE
              </span>
            </div>
            <p className="text-[10px] font-mono text-neutral-400">
              57-FACET BRILLIANT CUT • IOR 2.417
            </p>
          </div>
        </div>

        {/* Live Telemetry Data Ticker */}
        <div className="hidden lg:flex items-center gap-6 text-[11px] font-mono text-neutral-400 border-x border-white/10 px-6">
          <div>
            <span className="text-neutral-500">STAGE:</span>{" "}
            <span className="text-white font-medium">{scrollSection}</span>
          </div>
          <div>
            <span className="text-neutral-500">CLARITY:</span>{" "}
            <span className="text-cyan-400">FL (FLAWLESS)</span>
          </div>
          <div>
            <span className="text-neutral-500">COLOR:</span>{" "}
            <span className="text-white">D (COLORLESS)</span>
          </div>
          <div>
            <span className="text-neutral-500">CUT:</span>{" "}
            <span className="text-emerald-400">EXCELLENT</span>
          </div>
        </div>

        {/* View Mode Switcher & Fullscreen Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mode Switcher */}
          <div className="flex items-center p-1 rounded-lg bg-neutral-900/90 border border-white/10 text-xs font-mono">
            <button
              onClick={() => onSetViewMode("pbr")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                viewMode === "pbr"
                  ? "bg-white/15 text-white font-semibold shadow"
                  : "text-neutral-400 hover:text-white"
              }`}
              title="Brilliant Polish PBR"
            >
              <Gem className="w-3 h-3 text-cyan-300" />
              <span className="hidden sm:inline">BRILLIANT</span>
            </button>

            <button
              onClick={() => onSetViewMode("prism")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                viewMode === "prism"
                  ? "bg-purple-500/25 text-purple-300 font-semibold shadow"
                  : "text-neutral-400 hover:text-white"
              }`}
              title="Prismatic Rainbow Dispersion"
            >
              <Sparkles className="w-3 h-3 text-purple-300" />
              <span className="hidden sm:inline">PRISM</span>
            </button>

            <button
              onClick={() => onSetViewMode("xray")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                viewMode === "xray"
                  ? "bg-[#00f0ff]/20 text-[#00f0ff] font-semibold shadow"
                  : "text-neutral-400 hover:text-white"
              }`}
              title="Facet Wireframe Lattice"
            >
              <Cpu className="w-3 h-3 text-[#00f0ff]" />
              <span className="hidden sm:inline">FACETS</span>
            </button>

            <button
              onClick={() => onSetViewMode("thermal")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                viewMode === "thermal"
                  ? "bg-red-500/20 text-red-400 font-semibold shadow"
                  : "text-neutral-400 hover:text-white"
              }`}
              title="Thermal Infrared Mode"
            >
              <Flame className="w-3 h-3 text-red-400" />
              <span className="hidden sm:inline">HEAT</span>
            </button>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={onToggleFullscreen}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5 text-cyan-400" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Reserve / Inquire CTA */}
          <a
            href="#inquire"
            className="hidden sm:flex items-center px-3.5 py-1.5 text-xs font-mono font-semibold rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 text-black hover:from-cyan-300 hover:to-blue-400 transition-all shadow-[0_0_20px_rgba(56,189,248,0.4)] cursor-pointer"
          >
            ACQUIRE DIAMOND
          </a>
        </div>
      </div>
    </header>
  );
}
