import { GoogleGenAI } from "@google/genai";
import { buildSystemPrompt } from "@/lib/systemPrompt";
import { SageActivation, WorldState } from "@/lib/types";

const genai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

interface ChatRequest {
  message: string;
  history: { role: "player" | "awakened"; text: string }[];
  activation: SageActivation;
  worldState: WorldState;
  turnCount: number;
  collapseProgress: number;
  continuePrompt?: boolean;
}

export async function POST(request: Request) {
  try {
    const body: ChatRequest = await request.json();
    const {
      message,
      history,
      activation,
      worldState,
      turnCount,
      collapseProgress,
      continuePrompt,
    } = body;

    if (!process.env.GEMINI_API_KEY) {
      return Response.json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 500 }
      );
    }

    const systemPrompt = buildSystemPrompt(
      activation,
      worldState,
      turnCount,
      collapseProgress
    );

    // 대화 히스토리를 Gemini contents 포맷으로 변환 (최신 5턴만 — 토큰 절약)
    const trimmedHistory = history.slice(-5);
    const contents: { role: "user" | "model"; parts: { text: string }[] }[] = [];
    for (const msg of trimmedHistory) {
      contents.push({
        role: msg.role === "player" ? "user" : "model",
        parts: [{ text: msg.text }],
      });
    }
    // 현재 플레이어 메시지 추가 (이어받기면 '계속' 프롬프트)
    contents.push({
      role: "user",
      parts: [{ text: continuePrompt ? `${message}\n\n계속` : message }],
    });

    const response = await genai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction: systemPrompt,
        maxOutputTokens: 768,
      },
    });

    let text = response.text || "";

    // 시스템 메타 정보가 출력에 포함된 경우 필터링
    // "**사고 상태 변화**" 같은 블록 제거
    text = text.replace(/\*\*사고 상태[^*]*\*\*[\s\S]*?(?=\n\n[^\-\n]|$)/g, "").trim();
    // "---" 구분선 이후의 메타 데이터 블록 제거
    text = text.replace(/---[\s\S]*?---/g, "").trim();
    // 활성도/진행도 라인 제거
    text = text.replace(/^-\s*(절대자|인간|해체|설계|자유|존재|세계|붕괴|대화).*$/gm, "").trim();
    // 연속 빈 줄 정리
    text = text.replace(/\n{3,}/g, "\n\n").trim();

    if (!text) {
      text = "…\n\n모든 질문에는 의미가 있다.\n\n네가 던진 물음도, 이 세계에 흔적을 남긴다.";
    }

    return Response.json({ text });
  } catch (error) {
    console.error("Chat API error:", error);
    return Response.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
