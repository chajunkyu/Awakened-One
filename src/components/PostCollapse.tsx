"use client";

import { GameState } from "@/lib/types";

interface Props {
  gameState: GameState;
  onRestart: () => void;
}

export default function PostCollapse({ gameState, onRestart }: Props) {
  return (
    <div className="fixed inset-0 z-40 bg-gray-950 flex items-center justify-center">
      <div className="max-w-lg text-center px-8 space-y-8 animate-fade-in-slow">
        {/* Log summary */}
        <div className="space-y-4">
          <p className="text-white/20 text-xs tracking-[0.3em] uppercase">
            기록
          </p>
          <div className="w-8 h-px bg-white/10 mx-auto" />
        </div>

        <div className="space-y-3 text-sm text-white/40">
          <p>대화 횟수: {gameState.turnCount}</p>
          <p>
            활성화된 관점: 절대자({gameState.activation.sage1}) / 의미(
            {gameState.activation.sage2}) / 해체({gameState.activation.sage3})
          </p>
        </div>

        <div className="w-16 h-px bg-white/10 mx-auto" />

        <div className="space-y-4">
          <p className="text-white/60 text-sm leading-relaxed">
            세 명의 현자는 각각 진실을 보았다.
            <br />
            하지만 동시에 보면 존재할 수 없는 진실이었다.
          </p>
          <p className="text-amber-400/40 text-xs italic">
            &quot;그 질문은 인간이 할 수 있는 질문이 아니다.&quot;
          </p>
        </div>

        <div className="w-16 h-px bg-white/10 mx-auto" />

        <p className="text-white/20 text-xs">
          깨어난 자는 소멸했습니다.
          <br />
          하지만 질문은 남아 있습니다.
        </p>

        <button
          onClick={onRestart}
          className="mt-8 px-6 py-2.5 border border-white/10 rounded-full text-xs text-white/30 hover:text-white/60 hover:border-white/30 transition-all"
        >
          다시 시작하기
        </button>

        <p className="text-white/10 text-[10px]">
          다른 질문은 다른 세계를 만듭니다.
        </p>
      </div>
    </div>
  );
}
