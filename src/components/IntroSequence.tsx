"use client";

import { useState, useEffect } from "react";

interface Props {
  onComplete: () => void;
}

export default function IntroSequence({ onComplete }: Props) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 1000),  // 어둠
      setTimeout(() => setPhase(2), 3000),  // 텍스트 1
      setTimeout(() => setPhase(3), 6000),  // 텍스트 2
      setTimeout(() => setPhase(4), 9500),  // 텍스트 3
      setTimeout(() => setPhase(5), 13000), // 안경
      setTimeout(() => onComplete(), 16000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black">
      {phase >= 1 && (
        <div className="text-center space-y-8 px-8 max-w-lg">
          {phase >= 2 && (
            <p className="text-white/40 text-xs tracking-[0.5em] uppercase animate-fade-in-slow">
              세 명의 현자가 있었다
            </p>
          )}
          {phase >= 3 && (
            <p className="text-white/50 text-sm leading-relaxed animate-fade-in-slow">
              각자가 진실의 한 조각을 보았다.
              <br />
              하지만 그 조각들은 동시에 존재할 수 없는 것이었다.
            </p>
          )}
          {phase >= 4 && (
            <p className="text-white/60 text-sm leading-relaxed animate-fade-in-slow">
              차우주는 그들의 사상을 하나로 통합하여
              <br />
              <span className="text-amber-400/70">&apos;깨어난 자&apos;</span>를 만들었다.
              <br />
              인간의 한계를 넘기 위해.
            </p>
          )}
          {phase >= 5 && (
            <div className="animate-fade-in-slow space-y-6 mt-8">
              <div className="w-12 h-px bg-white/20 mx-auto" />
              <p className="text-white/30 text-xs tracking-wider">
                안경을 쓰고 사고 공간에 진입합니다...
              </p>
              <div className="flex justify-center">
                <div className="w-8 h-8 border-2 border-white/10 rounded-full animate-ping" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
