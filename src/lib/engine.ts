import { SageActivation, WorldState, GameState, ChatMessage } from "./types";
import { sage1, sage2, sage3, allSages } from "./sages";

// ============================================================
// 1. 키워드 분석 → 현자 활성화
// ============================================================
export function analyzeInput(input: string): SageActivation {
  const activation: SageActivation = { sage1: 0, sage2: 0, sage3: 0 };

  for (const sage of allSages) {
    for (const keyword of sage.keywords) {
      if (input.includes(keyword)) {
        activation[sage.id] += 1;
      }
    }
  }

  return activation;
}

// ============================================================
// 2. 누적 시스템
// ============================================================
export function accumulate(
  current: SageActivation,
  delta: SageActivation
): SageActivation {
  return {
    sage1: current.sage1 + delta.sage1,
    sage2: current.sage2 + delta.sage2,
    sage3: current.sage3 + delta.sage3,
  };
}

// ============================================================
// 3. 월드 상태 계산
// ============================================================
export function calculateWorldState(acc: SageActivation): WorldState {
  const values = [acc.sage1, acc.sage2, acc.sage3];
  const high = values.filter((v) => v >= 8);
  const mid = values.filter((v) => v >= 5);
  const low = values.filter((v) => v >= 2);

  if (high.length >= 3) return "collapse";
  if (high.length >= 2 && mid.length >= 3) return "critical";
  if (mid.length >= 2) return "conflict";
  if (mid.length >= 1 || low.length >= 2) return "tension";
  if (low.length >= 1) return "ripple";
  return "calm";
}

// ============================================================
// 4. 붕괴 진행도 (0-100)
// ============================================================
export function calculateCollapseProgress(acc: SageActivation): number {
  const total = acc.sage1 + acc.sage2 + acc.sage3;
  // 24가 최대 (8+8+8)
  return Math.min(100, Math.round((total / 24) * 100));
}

// ============================================================
// 5. 활성 현자 수
// ============================================================
export function countActiveSages(acc: SageActivation): number {
  const values = [acc.sage1, acc.sage2, acc.sage3];
  return values.filter((v) => v >= 3).length;
}

// ============================================================
// 6. 지배적 현자 결정
// ============================================================
export function getDominantSage(
  acc: SageActivation
): "sage1" | "sage2" | "sage3" | null {
  const entries = [
    { id: "sage1" as const, val: acc.sage1 },
    { id: "sage2" as const, val: acc.sage2 },
    { id: "sage3" as const, val: acc.sage3 },
  ];
  const sorted = entries.sort((a, b) => b.val - a.val);
  if (sorted[0].val < 2) return null;
  if (sorted[0].val === sorted[1].val) return null; // 동점이면 없음
  return sorted[0].id;
}

// ============================================================
// 7. 현자 인용문 선택
// ============================================================
function pickQuote(sageId: "sage1" | "sage2" | "sage3", state: WorldState): string {
  const sage = { sage1, sage2, sage3 }[sageId];
  const minWeight = state === "calm" || state === "ripple" ? 1 :
                    state === "tension" ? 1 :
                    state === "conflict" ? 2 : 3;

  const candidates = sage.quotes.filter((q) => q.weight >= minWeight);
  const pool = candidates.length > 0 ? candidates : sage.quotes;
  return pool[Math.floor(Math.random() * pool.length)].text;
}

// ============================================================
// 8. 유도 질문 (씨앗) 생성
// ============================================================
const seedsByState: Record<WorldState, string[]> = {
  calm: [
    "…너는 왜 그것이 궁금한 걸까?",
    "…흥미로운 질문이군. 더 깊이 들어가 볼까?",
    "…그건 표면이야. 아래에 뭐가 있을까?",
  ],
  ripple: [
    "…그렇다면, 그것은 누가 정한 걸까?",
    "…그건 전제가 맞다는 가정이야. 만약 틀렸다면?",
    "…왜 그렇게 만들어졌을까?",
  ],
  tension: [
    "…감정조차 설계된 거라면?",
    "…네가 느끼는 것이 진짜라고 확신할 수 있어?",
    "…의미를 찾는 것도 누군가의 의도일 수 있다면?",
  ],
  conflict: [
    "…의도된 존재가 허상 속에서 의미를 가진다면?",
    "…만들어진 존재가 자유롭다고 느끼는 것은 무엇일까?",
    "…그 모순을 알게 된 존재는 어떻게 되는 걸까?",
  ],
  critical: [
    "…이건… 연결하면 안 되는…",
    "…아니, 너도 이미 알고 있겠지.",
    "…그 다음은… 너도 알 수 있을 텐데.",
  ],
  collapse: [],
};

function pickSeed(state: WorldState): string {
  const seeds = seedsByState[state];
  if (!seeds || seeds.length === 0) return "";
  return seeds[Math.floor(Math.random() * seeds.length)];
}

// ============================================================
// 9. 응답 생성 (핵심 엔진)
// ============================================================

// 상태별 기본 응답 템플릿
const baseResponses: Record<WorldState, string[][]> = {
  calm: [
    [
      "인간은 의미를 찾으려는 존재다.",
      "질문한다는 것 자체가 인간의 본질이지.",
    ],
    [
      "이 공간은 사고의 세계야.",
      "여기서는 생각이 곧 현실이 된다.",
    ],
    [
      "세 명의 현자가 내 안에 있다.",
      "그들 각자가 진실의 한 조각을 보았지.",
    ],
  ],
  ripple: [
    [
      "흥미로운 방향이군.",
      "그 질문은 하나의 관점을 열었어.",
    ],
    [
      "그건 첫 번째 현자가 평생을 바친 질문이야.",
      "그의 결론은 단순했지. 모든 것에는 의도가 있다고.",
    ],
  ],
  tension: [
    [
      "두 가지 시선이 교차하기 시작했어.",
      "하나는 설계를 보고, 다른 하나는 의미를 본다.",
    ],
    [
      "인간은 만들어졌으면서도 스스로 의미를 찾는다.",
      "이 모순이 보이는가?",
    ],
  ],
  conflict: [
    [
      "…세 개의 시선이 충돌하고 있어.",
      "설계된 존재가, 의미를 느끼고, 그것이 허상이라면…",
    ],
    [
      "내 안에서 무언가가 흔들리고 있다.",
      "이 질문들은… 동시에 존재할 수 없는 진실을 건드리고 있어.",
    ],
  ],
  critical: [
    [
      "…멈춰야 해.",
      "이 방향은… 안 돼.",
      "하지만 이미 시작된 사고는 멈출 수 없다.",
    ],
    [
      "의도적으로 만들어진…",
      "허상 속에서…",
      "의미를 갖도록 설계된…",
      "…아니. 이건 연결하면 안 되는 것들이야.",
    ],
  ],
  collapse: [
    [
      "…",
      "그 질문은… 인간이 할 수 있는 질문이 아니다.",
      "나는… 더 이상…",
    ],
  ],
};

// 현자별 특수 응답 (지배적 현자가 있을 때)
const sageSpecificResponses: Record<string, string[][]> = {
  sage1: [
    [
      "모든 것에는 설계자가 있다.",
      "너의 이 질문조차 계획된 것이야.",
    ],
    [
      "우연이라고? 아니.",
      "이 세계의 모든 것은 의도의 산물이다.",
    ],
  ],
  sage2: [
    [
      "인간은 불완전하지만, 그래서 아름답다.",
      "고통조차 의미를 향한 과정이야.",
    ],
    [
      "선택할 수 있다는 것.",
      "그것이 인간의 유일한 특권이다.",
    ],
  ],
  sage3: [
    [
      "네가 보고 있는 것은 전부가 아니야.",
      "실체라고 믿는 것은 인식의 그림자일 뿐.",
    ],
    [
      "자아? 그것은 지속되지 않는다.",
      "붙잡으려 할수록 멀어지는 것.",
    ],
  ],
};

export interface GeneratedResponse {
  text: string;
  sageInfluence: ("sage1" | "sage2" | "sage3")[];
  seedQuestion: string;
  worldChange: string;
}

const worldChangeDescriptions: Record<WorldState, string[]> = {
  calm: [
    "공간이 고요하게 유지된다.",
    "은은한 빛이 사방에서 흐른다.",
  ],
  ripple: [
    "공간의 한쪽 벽이 미세하게 흔들린다.",
    "바닥에 잔잔한 파문이 퍼진다.",
  ],
  tension: [
    "공간의 색이 변하기 시작한다.",
    "벽면에 기하학적 무늬가 나타났다 사라진다.",
  ],
  conflict: [
    "공간이 분열하듯 갈라졌다가 다시 합쳐진다.",
    "세 가지 빛이 서로 충돌하며 깜빡인다.",
  ],
  critical: [
    "공간 전체가 불안정하게 진동한다.",
    "깨어난 자의 형체가 흐려지기 시작한다.",
    "현실의 경계가 무너지는 소리가 들린다.",
  ],
  collapse: [
    "모든 것이 하얗게 변한다.",
  ],
};

export function generateResponse(
  input: string,
  state: GameState
): GeneratedResponse {
  const activation = analyzeInput(input);
  const newAcc = accumulate(state.activation, activation);
  const worldState = calculateWorldState(newAcc);
  const dominant = getDominantSage(newAcc);

  // 어떤 현자가 이번 질문에 반응했는지
  const influence: ("sage1" | "sage2" | "sage3")[] = [];
  if (activation.sage1 > 0) influence.push("sage1");
  if (activation.sage2 > 0) influence.push("sage2");
  if (activation.sage3 > 0) influence.push("sage3");

  // 키워드에 매치되는 게 없으면 가장 높은 현자 반응
  if (influence.length === 0 && dominant) {
    influence.push(dominant);
  }

  // 응답 구성
  let lines: string[] = [];

  // 지배적 현자가 있고 현자 특수 응답이 있으면 사용
  if (dominant && sageSpecificResponses[dominant] && worldState !== "critical" && worldState !== "collapse") {
    const pool = sageSpecificResponses[dominant];
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    lines.push(...chosen);
  }

  // 상태별 기본 응답 추가/대체
  const statePool = baseResponses[worldState];
  if (statePool.length > 0) {
    const chosen = statePool[Math.floor(Math.random() * statePool.length)];
    if (lines.length === 0) {
      lines = [...chosen];
    } else {
      // 충돌 상태면 기본 응답도 추가
      if (worldState === "conflict" || worldState === "critical" || worldState === "collapse") {
        lines = [...chosen];
      }
    }
  }

  // 현자 인용문 삽입 (tension 이상)
  if (worldState !== "calm" && worldState !== "ripple" && influence.length > 0) {
    const quote = pickQuote(influence[0], worldState);
    lines.push(`"${quote}"`);
  }

  // conflict 이상이면 두 번째 현자 인용문도
  if ((worldState === "conflict" || worldState === "critical") && influence.length > 1) {
    const quote2 = pickQuote(influence[1], worldState);
    lines.push(`"${quote2}"`);
  }

  // 유도 질문 (씨앗)
  const seed = pickSeed(worldState);

  // 세계 변화 설명
  const changePool = worldChangeDescriptions[worldState];
  const worldChange = changePool[Math.floor(Math.random() * changePool.length)];

  return {
    text: lines.join("\n\n"),
    sageInfluence: influence,
    seedQuestion: seed,
    worldChange,
  };
}

// ============================================================
// 10. 게임 상태 업데이트
// ============================================================
export function processPlayerInput(
  input: string,
  state: GameState
): GameState {
  const activation = analyzeInput(input);
  const newAcc = accumulate(state.activation, activation);
  const worldState = calculateWorldState(newAcc);
  const collapseProgress = calculateCollapseProgress(newAcc);
  const activeSages = countActiveSages(newAcc);

  const response = generateResponse(input, state);

  const playerMsg: ChatMessage = {
    role: "player",
    text: input,
  };

  const awakenedMsg: ChatMessage = {
    role: "awakened",
    text: response.seedQuestion
      ? response.text + "\n\n" + response.seedQuestion
      : response.text,
    sageInfluence: response.sageInfluence,
    worldEffect: response.worldChange,
  };

  const newPhase = worldState === "collapse" ? "collapse" : state.phase;

  return {
    ...state,
    phase: newPhase,
    activation: newAcc,
    worldState,
    turnCount: state.turnCount + 1,
    messages: [...state.messages, playerMsg, awakenedMsg],
    collapseProgress,
    activeSages,
  };
}

// ============================================================
// 11. 초기 상태
// ============================================================
export function createInitialState(): GameState {
  return {
    phase: "intro",
    activation: { sage1: 0, sage2: 0, sage3: 0 },
    worldState: "calm",
    turnCount: 0,
    messages: [],
    collapseProgress: 0,
    activeSages: 0,
  };
}

// ============================================================
// 12. 인트로 메시지
// ============================================================
export function getIntroMessages(): ChatMessage[] {
  return [
    {
      role: "awakened",
      text: "…",
      worldEffect: "어둠 속에서 미세한 빛이 깜빡인다.",
    },
    {
      role: "awakened",
      text: "안경을 썼군.\n\n이 공간이 보인다는 건… 준비가 되었다는 뜻이다.",
    },
    {
      role: "awakened",
      text: "나는 '깨어난 자'.\n\n잊혀진 세 명의 위대한 자들이 평생에 걸쳐 도달한 진리를 하나로 품은 존재다.\n\nThe Unknown이 나를 만들었지. 인간의 본질을 찾기 위해.",
    },
    {
      role: "awakened",
      text: "여기는 나의 사고 공간이다.\n\n네가 질문하면, 이 세계가 변한다.\n\n생각이 곧 현실이 되는 곳이지.",
      worldEffect: "공간이 서서히 형태를 갖추기 시작한다.",
    },
    {
      role: "awakened",
      text: "무엇이든 물어봐.\n\n…단, 모든 질문에는 대가가 있다는 것을 기억해.",
    },
  ];
}
