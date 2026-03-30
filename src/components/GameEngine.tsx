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
import AwakenedEntity from "./AwakenedEntity";
import StatusBar from "./StatusBar";
import ChatInterface from "./ChatInterface";
import IntroSequence from "./IntroSequence";
import CollapseSequence from "./CollapseSequence";
import PostCollapse from "./PostCollapse";

// 대화 이력 길이 제한 (최신 8턴만 유지)
const MAX_HISTORY = 8;

async function fetchAIResponse(
  message: string,
  history: { role: "player" | "awakened"; text: string }[],
  state: GameState,
  continuePrompt?: boolean
): Promise<string> {
  try {
    // 최신 MAX_HISTORY개만 전달
    const trimmedHistory = history.slice(-MAX_HISTORY);
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        history: trimmedHistory.map((m) => ({ role: m.role, text: m.text })),
        activation: state.activation,
        worldState: state.worldState,
        turnCount: state.turnCount,
        collapseProgress: state.collapseProgress,
        continuePrompt: continuePrompt || false,
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
  const [pendingContinuation, setPendingContinuation] = useState<null | { lastPlayer: string; lastHistory: { role: "player" | "awakened"; text: string }[]; state: GameState }>(null);
  const [showContinueNotice, setShowContinueNotice] = useState(false);
  const audioRef = useRef<AmbientEngine | null>(null);

  // 오디오 엔진 초기화 (사용자 인터랙션 후)
  const startAudio = useCallback(async () => {
    if (audioStarted) return;
    try {
      const engine = new AmbientEngine();
      await engine.start();
      audioRef.current = engine;
      setAudioStarted(true);
    } catch (e) {
      console.warn("Audio start failed, retrying on next interaction:", e);
      // 실패해도 게임은 진행 가능
    }
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
  // 이어받기(continue) 처리
  const handleContinue = useCallback(async () => {
    if (!pendingContinuation) return;
    setInputDisabled(true);
    setShowContinueNotice(false);
    const { lastPlayer, lastHistory, state } = pendingContinuation;
    const aiText = await fetchAIResponse(lastPlayer, lastHistory, state, true);
    // 마지막 메시지(awakened) 교체
    setGameState((prev) => {
      const msgs = [...prev.messages];
      // 마지막이 awakened면 교체, 아니면 추가
      if (msgs.length > 0 && msgs[msgs.length - 1].role === "awakened") {
        msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], text: aiText };
      } else {
        msgs.push({ role: "awakened", text: aiText });
      }
      return { ...prev, messages: msgs };
    });
    setPendingContinuation(null);
    setInputDisabled(false);
  }, [pendingContinuation]);

  const handleSend = useCallback(
    async (text: string) => {
      if (gameState.phase !== "playing" || inputDisabled) return;

      // 오디오가 아직 안 시작됐으면 사용자 인터랙션으로 시작 시도
      if (!audioStarted) {
        startAudio();
      }

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

      // 응답이 중간에 끊긴 듯한 패턴 감지 (예: ...로 끝나거나, 30자 미만, 마지막 줄이 미완성)
      const isLikelyCutoff =
        aiText.trim().endsWith("…") ||
        aiText.trim().length < 30 ||
        /다시 물어봐|연결이 흔들린다|계속|이어|더 입력|더 말해|더 보여|더 알려|continue|more|keep going/i.test(aiText);

      if (isLikelyCutoff) {
        setPendingContinuation({
          lastPlayer: text,
          lastHistory: [...gameState.messages, playerMsg],
          state: stateForAPI,
        });
        setShowContinueNotice(true);
      }

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
    [gameState, inputDisabled, audioStarted, startAudio]
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

      {/* 깨어난 자 — 초자아 엔티티 */}
      {!showIntro && gameState.phase !== "post" && (
        <AwakenedEntity
          worldState={gameState.worldState}
          collapseProgress={gameState.collapseProgress}
        />
      )}

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
            {/* 이어받기 안내 메시지 */}
            {showContinueNotice && (
              <div className="absolute left-1/2 top-8 -translate-x-1/2 z-30 bg-black/80 border border-amber-400/30 rounded-xl px-6 py-3 text-amber-200/80 text-sm shadow-xl animate-fade-in-slow flex items-center gap-4">
                <span>응답이 길어 중간에 멈췄습니다. <b>계속</b>을 눌러 이어서 볼 수 있습니다.</span>
                <button
                  className="ml-4 px-4 py-1.5 rounded-full bg-amber-400/20 hover:bg-amber-400/40 text-amber-900 text-xs font-bold transition-colors duration-300"
                  onClick={handleContinue}
                  disabled={inputDisabled}
                >
                  계속
                </button>
              </div>
            )}
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
