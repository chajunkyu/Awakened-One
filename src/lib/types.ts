// === Sage System ===
export interface SageQuote {
  text: string;
  weight: number; // how strongly this represents the sage
}

export interface Sage {
  id: "sage1" | "sage2" | "sage3";
  name: string;
  title: string;
  coreBelief: string;
  keywords: string[];
  quotes: SageQuote[];
  limit: string; // what they can't answer
}

// === Activation System ===
export interface SageActivation {
  sage1: number; // 절대자 탐구자
  sage2: number; // 의미/구원 탐구자
  sage3: number; // 해탈/본질 탐구자
}

export type WorldState =
  | "calm"      // 안정 (0-1 sage active)
  | "ripple"    // 파문 (1 sage growing)
  | "tension"   // 긴장 (2 sages active)
  | "conflict"  // 충돌 (2+ sages high)
  | "critical"  // 임계 (all 3 high)
  | "collapse"; // 붕괴

// === Game State ===
export interface GameState {
  phase: "intro" | "playing" | "collapse" | "post";
  activation: SageActivation;
  worldState: WorldState;
  turnCount: number;
  messages: ChatMessage[];
  collapseProgress: number; // 0-100
  activeSages: number; // how many sages are significantly active
}

export interface ChatMessage {
  role: "player" | "awakened";
  text: string;
  sageInfluence?: ("sage1" | "sage2" | "sage3")[];
  worldEffect?: string;
}

// === Response Template ===
export interface ResponseTemplate {
  condition: {
    minState?: WorldState;
    maxState?: WorldState;
    dominantSage?: "sage1" | "sage2" | "sage3";
    activeSageCount?: number;
    keywords?: string[];
  };
  responses: string[];
  seedQuestion?: string; // 다음 질문을 유도하는 씨앗
  worldChange?: string;
}
