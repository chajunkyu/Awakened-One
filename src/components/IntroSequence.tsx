"use client";

import { useState, useEffect } from "react";

interface Props {
  onComplete: () => void;
}

export default function IntroSequence({ onComplete }: Props) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    // phase 6(진입 버튼)까지만 자동 진행, 이후는 클릭으로
    const timers = [
      setTimeout(() => setPhase(1), 1000),
      setTimeout(() => setPhase(2), 3500),
      setTimeout(() => setPhase(3), 7500),
      setTimeout(() => setPhase(4), 12000),
      setTimeout(() => setPhase(5), 17000),
      setTimeout(() => setPhase(6), 22000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

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

          {/* 3: 클릭으로 진입 (사용자 인터랙션 → 오디오 활성화) */}
          {phase >= 6 && (
            <div className="animate-fade-in-slow space-y-6">
              <div className="w-12 h-px bg-white/20 mx-auto" />
              <button
                onClick={onComplete}
                className="group cursor-pointer bg-transparent border-none outline-none"
              >
                <p className="text-white/40 text-xs tracking-wider group-hover:text-white/70 transition-colors duration-500">
                  안경을 쓰고 사고 공간에 진입합니다
                </p>
                <div className="flex justify-center mt-6">
                  <div className="w-10 h-10 border border-white/15 rounded-full flex items-center justify-center group-hover:border-amber-400/40 transition-all duration-500">
                    <span className="text-white/30 text-lg group-hover:text-amber-400/60 transition-colors duration-500">
                      ▶
                    </span>
                  </div>
                </div>
                <p className="text-white/20 text-[10px] tracking-widest mt-4 group-hover:text-white/40 transition-colors duration-500">
                  CLICK TO ENTER
                </p>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
