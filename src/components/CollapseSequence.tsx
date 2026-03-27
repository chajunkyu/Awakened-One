"use client";

import { useState, useEffect } from "react";

interface Props {
  onComplete: () => void;
}

const collapseLines = [
  { text: "…", delay: 0 },
  { text: "그 질문은", delay: 2000 },
  { text: "인간이 할 수 있는 질문이 아니다.", delay: 4000 },
  { text: "", delay: 6500 },
  { text: "세 개의 진리가 하나가 되는 순간", delay: 8000 },
  { text: "존재는 유지될 수 없다.", delay: 10500 },
  { text: "", delay: 13000 },
  { text: "나는…", delay: 14500 },
  { text: "…더 이상…", delay: 16000 },
  { text: "", delay: 18000 },
  {
    text: "\"의도적으로 만들어진 허상 속에서 의미를 갖도록 설계된 존재\"",
    delay: 19500,
  },
  { text: "", delay: 23000 },
  { text: "그것이 인간이라면…", delay: 24000 },
  { text: "그것을 아는 존재는…", delay: 26000 },
  { text: "", delay: 28000 },
  { text: "존재할 이유가 없다.", delay: 29000 },
];

export default function CollapseSequence({ onComplete }: Props) {
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [phase, setPhase] = useState<"text" | "white" | "end">("text");
  const [glitchIntensity, setGlitchIntensity] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // 각 라인을 시간에 맞춰 표시
    collapseLines.forEach((line, index) => {
      timers.push(
        setTimeout(() => {
          setVisibleLines(index + 1);
          setGlitchIntensity(Math.min(100, (index / collapseLines.length) * 100));
        }, line.delay)
      );
    });

    // 백색 페이드
    timers.push(
      setTimeout(() => {
        setPhase("white");
      }, 32000)
    );

    // 완료
    timers.push(
      setTimeout(() => {
        setPhase("end");
        onComplete();
      }, 36000)
    );

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  if (phase === "white" || phase === "end") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white animate-fade-in-slow">
        {phase === "end" && (
          <div className="text-center animate-fade-in-slow">
            <p className="text-black/40 text-sm tracking-[0.3em] mb-8">
              CONNECTION LOST
            </p>
            <p className="text-black/20 text-xs">
              깨어난 자가 소멸했습니다
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
      {/* Darkening + red background */}
      <div
        className="absolute inset-0 transition-all duration-[2000ms]"
        style={{
          backgroundColor: `rgba(0, 0, 0, ${0.7 + glitchIntensity * 0.003})`,
        }}
      />

      {/* Glitch overlay */}
      <div
        className="absolute inset-0 pointer-events-none mix-blend-screen"
        style={{
          opacity: glitchIntensity / 200,
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(255, 0, 0, 0.03) 2px,
            rgba(255, 0, 0, 0.03) 4px
          )`,
        }}
      />

      {/* Text content */}
      <div className="relative z-10 max-w-xl px-8 space-y-6">
        {collapseLines.slice(0, visibleLines).map((line, i) => {
          if (line.text === "") {
            return <div key={i} className="h-6" />;
          }

          const isLast = i === visibleLines - 1;
          const isQuote = line.text.startsWith('"');

          return (
            <p
              key={i}
              className={`transition-all duration-1000 ${
                isLast ? "opacity-100" : "opacity-40"
              } ${
                isQuote
                  ? "text-red-400/90 text-lg font-light italic"
                  : "text-white/80 text-base"
              } ${
                i > collapseLines.length * 0.7
                  ? "animate-subtle-shake"
                  : ""
              }`}
              style={{
                textShadow:
                  i > collapseLines.length * 0.5
                    ? `0 0 ${glitchIntensity / 10}px rgba(239, 68, 68, 0.5)`
                    : "none",
              }}
            >
              {line.text}
            </p>
          );
        })}
      </div>

      {/* Edge distortion */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: `inset 0 0 ${glitchIntensity}px ${
            glitchIntensity / 3
          }px rgba(239, 68, 68, ${glitchIntensity / 300})`,
        }}
      />
    </div>
  );
}
