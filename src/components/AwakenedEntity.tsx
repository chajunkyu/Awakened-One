"use client";

import { useEffect, useRef } from "react";
import { WorldState } from "@/lib/types";

interface Props {
  worldState: WorldState;
  collapseProgress: number;
}

// 상태별 엔티티 설정
interface EntityConfig {
  baseColor: [number, number, number];     // RGB
  glowColor: [number, number, number];
  spikeCount: number;
  spikeLength: number;
  spikeSpeed: number;       // 가시 애니메이션 속도
  moveSpeed: number;        // 위치 이동 속도
  moveRange: number;        // 이동 반경 (0~1, 화면 비율)
  pulseSpeed: number;       // 맥동 속도
  pulseAmount: number;      // 맥동 크기
  baseRadius: number;       // 기본 반지름 (px)
  glowIntensity: number;    // 글로우 강도
  trailLength: number;      // 잔상 개수
}

const ENTITY_CONFIGS: Record<WorldState, EntityConfig> = {
  calm: {
    baseColor: [80, 200, 120],       // 초록
    glowColor: [80, 200, 120],
    spikeCount: 0,
    spikeLength: 0,
    spikeSpeed: 0,
    moveSpeed: 0.3,
    moveRange: 0.05,
    pulseSpeed: 0.8,
    pulseAmount: 3,
    baseRadius: 40,
    glowIntensity: 0.3,
    trailLength: 0,
  },
  ripple: {
    baseColor: [100, 180, 140],      // 초록 → 살짝 변화
    glowColor: [100, 200, 160],
    spikeCount: 3,
    spikeLength: 8,
    spikeSpeed: 1,
    moveSpeed: 0.5,
    moveRange: 0.08,
    pulseSpeed: 1.0,
    pulseAmount: 5,
    baseRadius: 42,
    glowIntensity: 0.4,
    trailLength: 2,
  },
  tension: {
    baseColor: [160, 140, 200],      // 보라
    glowColor: [140, 100, 220],
    spikeCount: 6,
    spikeLength: 15,
    spikeSpeed: 2,
    moveSpeed: 0.8,
    moveRange: 0.12,
    pulseSpeed: 1.5,
    pulseAmount: 8,
    baseRadius: 45,
    glowIntensity: 0.5,
    trailLength: 3,
  },
  conflict: {
    baseColor: [220, 100, 60],       // 주황 → 빨간
    glowColor: [240, 80, 50],
    spikeCount: 12,
    spikeLength: 25,
    spikeSpeed: 4,
    moveSpeed: 2.0,
    moveRange: 0.25,
    pulseSpeed: 2.5,
    pulseAmount: 12,
    baseRadius: 50,
    glowIntensity: 0.7,
    trailLength: 5,
  },
  critical: {
    baseColor: [240, 50, 50],        // 빨간
    glowColor: [255, 30, 30],
    spikeCount: 20,
    spikeLength: 40,
    spikeSpeed: 8,
    moveSpeed: 4.0,
    moveRange: 0.4,
    pulseSpeed: 4.0,
    pulseAmount: 18,
    baseRadius: 55,
    glowIntensity: 0.9,
    trailLength: 8,
  },
  collapse: {
    baseColor: [255, 255, 255],
    glowColor: [255, 255, 255],
    spikeCount: 30,
    spikeLength: 60,
    spikeSpeed: 12,
    moveSpeed: 6.0,
    moveRange: 0.5,
    pulseSpeed: 6.0,
    pulseAmount: 25,
    baseRadius: 60,
    glowIntensity: 1.0,
    trailLength: 12,
  },
};

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpConfig(from: EntityConfig, to: EntityConfig, t: number): EntityConfig {
  return {
    baseColor: [
      lerp(from.baseColor[0], to.baseColor[0], t),
      lerp(from.baseColor[1], to.baseColor[1], t),
      lerp(from.baseColor[2], to.baseColor[2], t),
    ],
    glowColor: [
      lerp(from.glowColor[0], to.glowColor[0], t),
      lerp(from.glowColor[1], to.glowColor[1], t),
      lerp(from.glowColor[2], to.glowColor[2], t),
    ],
    spikeCount: Math.round(lerp(from.spikeCount, to.spikeCount, t)),
    spikeLength: lerp(from.spikeLength, to.spikeLength, t),
    spikeSpeed: lerp(from.spikeSpeed, to.spikeSpeed, t),
    moveSpeed: lerp(from.moveSpeed, to.moveSpeed, t),
    moveRange: lerp(from.moveRange, to.moveRange, t),
    pulseSpeed: lerp(from.pulseSpeed, to.pulseSpeed, t),
    pulseAmount: lerp(from.pulseAmount, to.pulseAmount, t),
    baseRadius: lerp(from.baseRadius, to.baseRadius, t),
    glowIntensity: lerp(from.glowIntensity, to.glowIntensity, t),
    trailLength: Math.round(lerp(from.trailLength, to.trailLength, t)),
  };
}

export default function AwakenedEntity({ worldState, collapseProgress }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const stateRef = useRef<WorldState>(worldState);
  const targetConfigRef = useRef<EntityConfig>(ENTITY_CONFIGS[worldState]);
  const currentConfigRef = useRef<EntityConfig>({ ...ENTITY_CONFIGS[worldState] });
  const posRef = useRef({ x: 0.5, y: 0.45 }); // 화면 중앙 약간 위
  const velRef = useRef({ x: 0, y: 0 });
  const trailRef = useRef<{ x: number; y: number; alpha: number }[]>([]);

  // 상태 변경 시 타겟 설정 업데이트
  useEffect(() => {
    stateRef.current = worldState;
    targetConfigRef.current = ENTITY_CONFIGS[worldState];
  }, [worldState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let time = 0;
    const LERP_SPEED = 0.02; // 설정 전환 속도

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    function animate() {
      if (!canvas || !ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      time += 0.016; // ~60fps

      // 설정을 부드럽게 보간
      const cur = currentConfigRef.current;
      const tgt = targetConfigRef.current;
      currentConfigRef.current = lerpConfig(cur, tgt, LERP_SPEED);
      const cfg = currentConfigRef.current;

      // --- 위치 업데이트 ---
      const pos = posRef.current;
      const vel = velRef.current;

      // 랜덤 가속도 (이동 속도/범위에 비례)
      vel.x += (Math.random() - 0.5) * cfg.moveSpeed * 0.002;
      vel.y += (Math.random() - 0.5) * cfg.moveSpeed * 0.002;

      // 중앙으로 돌아오는 힘
      const cx = 0.5, cy = 0.45;
      vel.x += (cx - pos.x) * 0.003;
      vel.y += (cy - pos.y) * 0.003;

      // 감쇠
      vel.x *= 0.98;
      vel.y *= 0.98;

      // 이동 범위 제한
      pos.x = Math.max(0.5 - cfg.moveRange, Math.min(0.5 + cfg.moveRange, pos.x + vel.x));
      pos.y = Math.max(0.45 - cfg.moveRange, Math.min(0.45 + cfg.moveRange, pos.y + vel.y));

      const ex = pos.x * w;
      const ey = pos.y * h;

      // --- 잔상 ---
      if (cfg.trailLength > 0) {
        trailRef.current.unshift({ x: ex, y: ey, alpha: 0.3 });
        while (trailRef.current.length > cfg.trailLength) {
          trailRef.current.pop();
        }
      } else {
        trailRef.current = [];
      }

      // --- 그리기 ---
      ctx.clearRect(0, 0, w, h);

      // 맥동
      const pulse = Math.sin(time * cfg.pulseSpeed) * cfg.pulseAmount;
      const radius = cfg.baseRadius + pulse;

      const [r, g, b] = cfg.baseColor;
      const [gr, gg, gb] = cfg.glowColor;

      // 잔상 그리기
      trailRef.current.forEach((trail, i) => {
        const a = trail.alpha * (1 - i / trailRef.current.length) * 0.5;
        const tr = radius * (1 - i * 0.08);
        ctx.beginPath();
        ctx.arc(trail.x, trail.y, tr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
        ctx.fill();
      });

      // 글로우
      const glow = ctx.createRadialGradient(ex, ey, radius * 0.2, ex, ey, radius * 3);
      glow.addColorStop(0, `rgba(${gr}, ${gg}, ${gb}, ${cfg.glowIntensity * 0.4})`);
      glow.addColorStop(0.5, `rgba(${gr}, ${gg}, ${gb}, ${cfg.glowIntensity * 0.1})`);
      glow.addColorStop(1, `rgba(${gr}, ${gg}, ${gb}, 0)`);
      ctx.beginPath();
      ctx.arc(ex, ey, radius * 3, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      // 메인 구체
      const bodyGrad = ctx.createRadialGradient(
        ex - radius * 0.3, ey - radius * 0.3, radius * 0.1,
        ex, ey, radius
      );
      bodyGrad.addColorStop(0, `rgba(${Math.min(255, r + 60)}, ${Math.min(255, g + 60)}, ${Math.min(255, b + 60)}, 0.9)`);
      bodyGrad.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, 0.7)`);
      bodyGrad.addColorStop(1, `rgba(${r * 0.5}, ${g * 0.5}, ${b * 0.5}, 0.4)`);

      ctx.beginPath();
      ctx.arc(ex, ey, radius, 0, Math.PI * 2);
      ctx.fillStyle = bodyGrad;
      ctx.fill();

      // --- 가시 (spikes) ---
      if (cfg.spikeCount > 0 && cfg.spikeLength > 0) {
        for (let i = 0; i < cfg.spikeCount; i++) {
          const angle = (i / cfg.spikeCount) * Math.PI * 2 + time * cfg.spikeSpeed * 0.3;
          const spikeLen = cfg.spikeLength * (0.5 + 0.5 * Math.sin(time * cfg.spikeSpeed + i * 1.7));

          const x1 = ex + Math.cos(angle) * radius;
          const y1 = ey + Math.sin(angle) * radius;
          const x2 = ex + Math.cos(angle) * (radius + spikeLen);
          const y2 = ey + Math.sin(angle) * (radius + spikeLen);

          // 삼각형 가시
          const perpAngle = angle + Math.PI / 2;
          const baseWidth = 3 + spikeLen * 0.15;
          const bx1 = x1 + Math.cos(perpAngle) * baseWidth;
          const by1 = y1 + Math.sin(perpAngle) * baseWidth;
          const bx2 = x1 - Math.cos(perpAngle) * baseWidth;
          const by2 = y1 - Math.sin(perpAngle) * baseWidth;

          ctx.beginPath();
          ctx.moveTo(bx1, by1);
          ctx.lineTo(x2, y2);
          ctx.lineTo(bx2, by2);
          ctx.closePath();

          const spikeAlpha = 0.3 + cfg.glowIntensity * 0.5;
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${spikeAlpha})`;
          ctx.fill();
        }
      }

      // 내부 코어 (밝은 점)
      const coreGrad = ctx.createRadialGradient(ex, ey, 0, ex, ey, radius * 0.4);
      coreGrad.addColorStop(0, `rgba(255, 255, 255, ${0.3 + cfg.glowIntensity * 0.4})`);
      coreGrad.addColorStop(1, `rgba(255, 255, 255, 0)`);
      ctx.beginPath();
      ctx.arc(ex, ey, radius * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.fill();

      animRef.current = requestAnimationFrame(animate);
    }

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 1, opacity: collapseProgress > 95 ? 0 : 1, transition: "opacity 2s" }}
    />
  );
}
