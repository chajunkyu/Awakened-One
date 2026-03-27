import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt } from "@/lib/systemPrompt";
import { SageActivation, WorldState } from "@/lib/types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
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
    const { message, history, activation, worldState, turnCount, collapseProgress } = body;

    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json(
        { error: "ANTHROPIC_API_KEY not configured" },
        { status: 500 }
      );
    }

    // 대화 히스토리를 Claude 메시지 포맷으로 변환
    const messages: Anthropic.MessageParam[] = [];

    for (const msg of history) {
      messages.push({
        role: msg.role === "player" ? "user" : "assistant",
        content: msg.text,
      });
    }

    // 현재 플레이어 메시지 추가
    messages.push({
      role: "user",
      content: message,
    });

    const systemPrompt = buildSystemPrompt(
      activation,
      worldState,
      turnCount,
      collapseProgress
    );

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      system: systemPrompt,
      messages,
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    return Response.json({ text });
  } catch (error) {
    console.error("Chat API error:", error);
    return Response.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
