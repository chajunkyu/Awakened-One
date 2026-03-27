"use client";

import { useState, useCallback, useEffect } from "react";
import { GameState } from "@/lib/types";
import {
  createInitialState,
  getIntroMessages,
  processPlayerInput,
} from "@/lib/engine";
import WorldBackground from "./WorldBackground";
import StatusBar from "./StatusBar";
import ChatInterface from "./ChatInterface";
import IntroSequence from "./IntroSequence";
import CollapseSequence from "./CollapseSequence";
import PostCollapse from "./PostCollapse";

export default function GameEngine() {
  const [gameState, setGameState] = useState<GameState>(createInitialState());
  const [showIntro, setShowIntro] = useState(true);
  const [showCollapse, setShowCollapse] = useState(false);
  const [inputDisabled, setInputDisabled] = useState(false);

  // 인트로 완료 → 깨어난 자의 첫 메시지들
  const handleIntroComplete = useCallback(() => {
    setShowIntro(false);
    const introMessages = getIntroMessages();

    // 메시지를 순차적으로 표시
    let delay = 0;
    introMessages.forEach((msg, i) => {
      delay += 1500 + (msg.text.length * 30); // 텍스트 길이에 따라 딜레이
      setTimeout(() => {
        setGameState((prev) => ({
          ...prev,
          phase: "playing",
          messages: [...prev.messages, msg],
        }));
      }, delay);
    });
  }, []);

  // 플레이어 입력 처리
  const handleSend = useCallback(
    (text: string) => {
      if (gameState.phase !== "playing" || inputDisabled) return;

      setInputDisabled(true);

      // 플레이어 메시지 즉시 표시
      setGameState((prev) => ({
        ...prev,
        messages: [...prev.messages, { role: "player", text }],
      }));

      // 깨어난 자의 응답 (딜레이)
      setTimeout(() => {
        setGameState((prev) => {
          const newState = processPlayerInput(text, prev);

          // 붕괴 체크
          if (newState.phase === "collapse") {
            setTimeout(() => setShowCollapse(true), 1000);
          }

          return newState;
        });
        setInputDisabled(false);
      }, 1200 + Math.random() * 800);
    },
    [gameState.phase, inputDisabled]
  );

  // 붕괴 완료
  const handleCollapseComplete = useCallback(() => {
    setShowCollapse(false);
    setGameState((prev) => ({ ...prev, phase: "post" }));
  }, []);

  // 재시작
  const handleRestart = useCallback(() => {
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
