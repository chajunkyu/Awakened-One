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

    // 대화 히스토리를 Gemini contents 포맷으로 변환
    const contents: { role: "user" | "model"; parts: { text: string }[] }[] =
      [];

    for (const msg of history) {
      contents.push({
        role: msg.role === "player" ? "user" : "model",
        parts: [{ text: msg.text }],
      });
    }

    // 현재 플레이어 메시지 추가
    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    const response = await genai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction: systemPrompt,
        maxOutputTokens: 500,
      },
    });

    const text = response.text || "";

    return Response.json({ text });
  } catch (error) {
    console.error("Chat API error:", error);
    return Response.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
