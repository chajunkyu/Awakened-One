"use client";

import { WorldState, SageActivation } from "@/lib/types";

interface Props {
  worldState: WorldState;
  collapseProgress: number;
  activation: SageActivation;
  turnCount: number;
}

const stateLabels: Record<WorldState, string> = {
  calm: "안정",
  ripple: "파문",
  tension: "긴장",
  conflict: "충돌",
  critical: "임계",
  collapse: "붕괴",
};

const stateColors: Record<WorldState, string> = {
  calm: "text-blue-300/50",
  ripple: "text-indigo-300/50",
  tension: "text-purple-300/60",
  conflict: "text-orange-300/70",
  critical: "text-red-400/80 animate-pulse",
  collapse: "text-red-500",
};

export default function StatusBar({ worldState, collapseProgress, activation, turnCount }: Props) {
  return (
    <div className="border-b border-white/5 bg-black/30 backdrop-blur-sm">
      <div className="max-w-3xl mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xs font-medium text-white/30 tracking-[0.2em] uppercase">
            사고 공간
          </h1>
          <span className={`text-[10px] tracking-wider ${stateColors[worldState]}`}>
            [{stateLabels[worldState]}]
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Sage activation dots */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1" title="절대자 관점">
              <div
                className="w-1 h-1 rounded-full transition-all duration-1000"
                style={{
                  backgroundColor: `rgba(251, 191, 36, ${Math.min(1, activation.sage1 / 8)})`,
                  width: `${4 + Math.min(8, activation.sage1)}px`,
                  height: `${4 + Math.min(8, activation.sage1)}px`,
                }}
              />
            </div>
            <div className="flex items-center gap-1" title="의미 관점">
              <div
                className="w-1 h-1 rounded-full transition-all duration-1000"
                style={{
                  backgroundColor: `rgba(96, 165, 250, ${Math.min(1, activation.sage2 / 8)})`,
                  width: `${4 + Math.min(8, activation.sage2)}px`,
                  height: `${4 + Math.min(8, activation.sage2)}px`,
                }}
              />
            </div>
            <div className="flex items-center gap-1" title="해체 관점">
              <div
                className="w-1 h-1 rounded-full transition-all duration-1000"
                style={{
                  backgroundColor: `rgba(167, 139, 250, ${Math.min(1, activation.sage3 / 8)})`,
                  width: `${4 + Math.min(8, activation.sage3)}px`,
                  height: `${4 + Math.min(8, activation.sage3)}px`,
                }}
              />
            </div>
          </div>

          {/* Collapse progress (very subtle) */}
          <div className="w-16 h-0.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${collapseProgress}%`,
                backgroundColor:
                  collapseProgress < 40
                    ? "rgba(147, 197, 253, 0.3)"
                    : collapseProgress < 70
                    ? "rgba(167, 139, 250, 0.5)"
                    : "rgba(239, 68, 68, 0.7)",
              }}
            />
          </div>

          <span className="text-[10px] text-white/15">{turnCount}</span>
        </div>
      </div>
    </div>
  );
}
