"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { GameState, ChatMessage } from "@/lib/types";
import {
  createInitialState,
  getIntroMessages,
  analyzeInput,
  accumulate,
  calculateWorldState,
  calculateCollapseProgress,
  countActiveSages,
} from "@/lib/engine";
import { AmbientEngine } from "@/lib/audio";
import WorldBackground from "./WorldBackground";
import StatusBar from "./StatusBar";
import ChatInterface from "./ChatInterface";
import IntroSequence from "./IntroSequence";
import CollapseSequence from "./CollapseSequence";
import PostCollapse from "./PostCollapse";

async function fetchAIResponse(
  message: string,
  history: { role: "player" | "awakened"; text: string }[],
  state: GameState
): Promise<string> {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        history: history.map((m) => ({ role: m.role, text: m.text })),
        activation: state.activation,
        worldState: state.worldState,
        turnCount: state.turnCount,
        collapseProgress: state.collapseProgress,
      }),
    });

    if (!res.ok) {
      throw new Error(`API error: ${res.status}`);
    }

    const data = await res.json();
    return data.text;
  } catch (error) {
    console.error("AI response error:", error);
    // 폴백: API 실패 시 기본 응답
    return "…\n\n연결이 흔들린다.\n\n다시 물어봐.";
  }
}

export default function GameEngine() {
  const [gameState, setGameState] = useState<GameState>(createInitialState());
  const [showIntro, setShowIntro] = useState(true);
  const [showCollapse, setShowCollapse] = useState(false);
  const [inputDisabled, setInputDisabled] = useState(false);
  const [audioStarted, setAudioStarted] = useState(false);
  const audioRef = useRef<AmbientEngine | null>(null);

  // 오디오 엔진 초기화 (사용자 인터랙션 후)
  const startAudio = useCallback(() => {
    if (audioStarted) return;
    const engine = new AmbientEngine();
    engine.start();
    audioRef.current = engine;
    setAudioStarted(true);
  }, [audioStarted]);

  // 세계 상태 변경 시 오디오 전환
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.transition(gameState.worldState);
    }
  }, [gameState.worldState]);

  // 컴포넌트 언마운트 시 오디오 정리
  useEffect(() => {
    return () => {
      audioRef.current?.stop();
    };
  }, []);

  // 인트로 완료 → 깨어난 자의 첫 메시지들 + 오디오 시작
  const handleIntroComplete = useCallback(() => {
    startAudio();
    setShowIntro(false);
    const introMessages = getIntroMessages();

    // 메시지를 순차적으로 표시
    let delay = 0;
    introMessages.forEach((msg) => {
      delay += 1500 + msg.text.length * 30;
      setTimeout(() => {
        setGameState((prev) => ({
          ...prev,
          phase: "playing",
          messages: [...prev.messages, msg],
        }));
      }, delay);
    });
  }, [startAudio]);

  // 플레이어 입력 처리 (Claude API 연동)
  const handleSend = useCallback(
    async (text: string) => {
      if (gameState.phase !== "playing" || inputDisabled) return;

      setInputDisabled(true);

      // 1. 키워드 분석 → 현자 활성화 (클라이언트에서 처리)
      const activation = analyzeInput(text);
      const newAcc = accumulate(gameState.activation, activation);
      const worldState = calculateWorldState(newAcc);
      const collapseProgress = calculateCollapseProgress(newAcc);
      const activeSages = countActiveSages(newAcc);

      // 어떤 현자가 반응했는지
      const influence: ("sage1" | "sage2" | "sage3")[] = [];
      if (activation.sage1 > 0) influence.push("sage1");
      if (activation.sage2 > 0) influence.push("sage2");
      if (activation.sage3 > 0) influence.push("sage3");

      // 2. 플레이어 메시지 즉시 표시
      const playerMsg: ChatMessage = { role: "player", text };
      setGameState((prev) => ({
        ...prev,
        messages: [...prev.messages, playerMsg],
      }));

      // 3. Claude API로 응답 생성
      const stateForAPI: GameState = {
        ...gameState,
        activation: newAcc,
        worldState,
        collapseProgress,
        turnCount: gameState.turnCount + 1,
      };

      const aiText = await fetchAIResponse(
        text,
        gameState.messages,
        stateForAPI
      );

      // 4. 깨어난 자 응답 + 상태 업데이트
      const awakenedMsg: ChatMessage = {
        role: "awakened",
        text: aiText,
        sageInfluence: influence.length > 0 ? influence : undefined,
      };

      const isCollapse = worldState === "collapse";

      setGameState((prev) => ({
        ...prev,
        phase: isCollapse ? "collapse" : prev.phase,
        activation: newAcc,
        worldState,
        turnCount: prev.turnCount + 1,
        messages: [...prev.messages, awakenedMsg],
        collapseProgress,
        activeSages,
      }));

      if (isCollapse) {
        setTimeout(() => setShowCollapse(true), 1000);
      }

      setInputDisabled(false);
    },
    [gameState, inputDisabled]
  );

  // 붕괴 완료 → 오디오 정지
  const handleCollapseComplete = useCallback(() => {
    audioRef.current?.stop();
    setShowCollapse(false);
    setGameState((prev) => ({ ...prev, phase: "post" }));
  }, []);

  // 재시작 → 오디오 리셋
  const handleRestart = useCallback(() => {
    audioRef.current?.stop();
    audioRef.current = null;
    setAudioStarted(false);
    setGameState(createInitialState());
    setShowIntro(true);
    setShowCollapse(false);
    setInputDisabled(false);
  }, []);

  return (
    <div className="h-screen flex flex-col relative">
      {/* Dynamic Background */}
      <WorldBackground
        worldState={gameState.worldState}
        collapseProgress={gameState.collapseProgress}
      />

      {/* Intro */}
      {showIntro && <IntroSequence onComplete={handleIntroComplete} />}

      {/* Collapse */}
      {showCollapse && (
        <CollapseSequence onComplete={handleCollapseComplete} />
      )}

      {/* Post-collapse */}
      {gameState.phase === "post" && !showCollapse && (
        <PostCollapse gameState={gameState} onRestart={handleRestart} />
      )}

      {/* Main Game UI */}
      {!showIntro && gameState.phase !== "post" && (
        <>
          <StatusBar
            worldState={gameState.worldState}
            collapseProgress={gameState.collapseProgress}
            activation={gameState.activation}
            turnCount={gameState.turnCount}
          />
          <div className="flex-1 overflow-hidden">
            <ChatInterface
              messages={gameState.messages}
              worldState={gameState.worldState}
              onSend={handleSend}
              disabled={
                inputDisabled ||
                gameState.phase === "collapse" ||
                gameState.phase === "intro"
              }
            />
          </div>
        </>
      )}
    </div>
  );
}
