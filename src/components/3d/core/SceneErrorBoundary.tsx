"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class SceneErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Three.js Scene Error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center w-full h-full min-h-[380px] p-6 text-center rounded-2xl border border-red-500/20 bg-neutral-950/80 backdrop-blur-md">
          <div className="p-3 mb-4 rounded-full bg-red-500/10 border border-red-500/30 text-red-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">3D Context Disrupted</h3>
          <p className="text-xs text-neutral-400 max-w-sm mb-5">
            The WebGL context encountered an issue. Try restarting the scene.
          </p>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-4 py-2 text-xs font-mono font-medium rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-300 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reload 3D Engine
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
