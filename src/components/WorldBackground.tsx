"use client";

import { WorldState } from "@/lib/types";

interface Props {
  worldState: WorldState;
  collapseProgress: number;
}

const stateStyles: Record<WorldState, {
  bg: string;
  particles: string;
  overlay: string;
}> = {
  calm: {
    bg: "from-gray-950 via-slate-900 to-gray-950",
    particles: "opacity-20",
    overlay: "",
  },
  ripple: {
    bg: "from-gray-950 via-slate-800 to-indigo-950",
    particles: "opacity-30",
    overlay: "",
  },
  tension: {
    bg: "from-indigo-950 via-purple-950 to-slate-900",
    particles: "opacity-50",
    overlay: "bg-purple-500/5",
  },
  conflict: {
    bg: "from-purple-950 via-red-950 to-amber-950",
    particles: "opacity-70",
    overlay: "bg-red-500/5",
  },
  critical: {
    bg: "from-red-950 via-orange-950 to-red-950",
    particles: "opacity-90",
    overlay: "bg-red-500/10 animate-pulse",
  },
  collapse: {
    bg: "from-white via-white to-white",
    particles: "opacity-0",
    overlay: "",
  },
};

export default function WorldBackground({ worldState, collapseProgress }: Props) {
  const style = stateStyles[worldState];

  return (
    <div className="fixed inset-0 -z-10 transition-all duration-[3000ms]">
      {/* Base gradient */}
      <div
        className={`absolute inset-0 bg-gradient-to-b ${style.bg} transition-all duration-[3000ms]`}
      />

      {/* Floating particles */}
      <div className={`absolute inset-0 ${style.particles} transition-opacity duration-[2000ms]`}>
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${2 + Math.random() * 4}px`,
              height: `${2 + Math.random() * 4}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              backgroundColor:
                worldState === "calm" || worldState === "ripple"
                  ? "rgba(147, 197, 253, 0.4)"
                  : worldState === "tension"
                  ? "rgba(167, 139, 250, 0.5)"
                  : worldState === "conflict"
                  ? "rgba(251, 146, 60, 0.5)"
                  : "rgba(239, 68, 68, 0.6)",
              animation: `float ${6 + Math.random() * 8}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Screen shake for conflict+ */}
      {(worldState === "conflict" || worldState === "critical") && (
        <div className="absolute inset-0 animate-subtle-shake" />
      )}

      {/* Glitch lines for critical */}
      {worldState === "critical" && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="absolute h-px bg-red-400/30"
              style={{
                width: `${30 + Math.random() * 70}%`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 30}%`,
                animation: `glitch-line ${0.5 + Math.random() * 2}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Overlay */}
      {style.overlay && (
        <div className={`absolute inset-0 ${style.overlay} transition-all duration-[2000ms]`} />
      )}

      {/* Collapse progress bar (hidden, just a visual cue via vignette) */}
      <div
        className="absolute inset-0 transition-all duration-1000"
        style={{
          boxShadow: `inset 0 0 ${collapseProgress * 2}px ${collapseProgress / 2}px rgba(${
            collapseProgress > 70 ? "239, 68, 68" : "147, 51, 234"
          }, ${collapseProgress / 200})`,
        }}
      />
    </div>
  );
}
