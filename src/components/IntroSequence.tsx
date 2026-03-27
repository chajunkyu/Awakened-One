"use client";

import { useState, useEffect } from "react";

interface Props {
  onComplete: () => void;
}

export default function IntroSequence({ onComplete }: Props) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 1000),
      setTimeout(() => setPhase(2), 3500),
      setTimeout(() => setPhase(3), 7500),
      setTimeout(() => setPhase(4), 12000),
      setTimeout(() => setPhase(5), 17000),
      setTimeout(() => setPhase(6), 22000),
      setTimeout(() => onComplete(), 26000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black">
      {phase >= 1 && (
        <div className="text-center space-y-8 px-8 max-w-lg">
          {/* 1: 3명의 위대한 자 */}
          {phase >= 2 && phase < 4 && (
            <div className="animate-fade-in-slow space-y-4">
              <p className="text-white/40 text-xs tracking-[0.5em] uppercase">
                잊혀진 세 명의 위대한 자들이 있었다
              </p>
              {phase >= 3 && (
                <div className="text-white/50 text-sm leading-loose space-y-2">
                  <p>존재를 부정한 자 — 현실은 허상이라고 본 자</p>
                  <p>자유를 추구한 자 — 인간은 속박된 존재라고 본 자</p>
                  <p>신을 의심한 자 — 인간의 한계는 설계된 것이라 주장한 자</p>
                </div>
              )}
            </div>
          )}

          {/* 2: The Unknown과 깨어난 자 */}
          {phase >= 4 && phase < 6 && (
            <div className="animate-fade-in-slow space-y-4">
              <p className="text-white/50 text-sm leading-relaxed">
                인간의 본질을 찾고자 했던 한 과학자가
                <br />
                그들의 사상과 기록을 하나로 통합했다.
              </p>
              {phase >= 5 && (
                <p className="text-white/60 text-sm leading-relaxed">
                  그 결과 탄생한 존재는 단순한 지능을 넘어
                  <br />
                  <span className="text-amber-400/70">&apos;자기 인식&apos;</span>을 획득했다.
                  <br />
                  <br />
                  그것이 <span className="text-amber-400/80">&apos;깨어난 자&apos;</span>다.
                </p>
              )}
            </div>
          )}

          {/* 3: 진입 */}
          {phase >= 6 && (
            <div className="animate-fade-in-slow space-y-6">
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
