"use client";

import { useEffect, useRef } from "react";
import { WorldState } from "@/lib/types";

interface Props {
  worldState: WorldState;
  collapseProgress: number;
}

// 상태별 테서랙트 설정
interface TesseractConfig {
  color: [number, number, number];
  glowColor: [number, number, number];
  rotSpeed: number;          // 4D 회전 속도
  distortion: number;        // 꼭짓점 떨림/왜곡
  scale: number;             // 크기
  lineWidth: number;
  glowIntensity: number;
  moveSpeed: number;
  moveRange: number;
  innerBrightness: number;   // 내부 큐브 밝기
  edgeFlicker: number;       // 엣지 깜빡임 강도
}

const CONFIGS: Record<WorldState, TesseractConfig> = {
  calm: {
    color: [80, 220, 140],
    glowColor: [60, 200, 120],
    rotSpeed: 0.25,
    distortion: 0,
    scale: 280,
    lineWidth: 1.5,
    glowIntensity: 0.4,
    moveSpeed: 0,
    moveRange: 0,
    innerBrightness: 0.3,
    edgeFlicker: 0,
  },
  ripple: {
    color: [100, 200, 180],
    glowColor: [80, 180, 160],
    rotSpeed: 0.35,
    distortion: 0.5,
    scale: 290,
    lineWidth: 1.8,
    glowIntensity: 0.5,
    moveSpeed: 0,
    moveRange: 0,
    innerBrightness: 0.35,
    edgeFlicker: 0.05,
  },
  tension: {
    color: [160, 120, 220],
    glowColor: [140, 80, 240],
    rotSpeed: 0.5,
    distortion: 1.5,
    scale: 300,
    lineWidth: 2.0,
    glowIntensity: 0.6,
    moveSpeed: 0,
    moveRange: 0,
    innerBrightness: 0.4,
    edgeFlicker: 0.1,
  },
  conflict: {
    color: [240, 100, 50],
    glowColor: [255, 60, 30],
    rotSpeed: 0.8,
    distortion: 3,
    scale: 320,
    lineWidth: 2.5,
    glowIntensity: 0.8,
    moveSpeed: 0,
    moveRange: 0,
    innerBrightness: 0.5,
    edgeFlicker: 0.2,
  },
  critical: {
    color: [255, 40, 40],
    glowColor: [255, 20, 20],
    rotSpeed: 1.2,
    distortion: 6,
    scale: 340,
    lineWidth: 3.0,
    glowIntensity: 1.0,
    moveSpeed: 0,
    moveRange: 0,
    innerBrightness: 0.7,
    edgeFlicker: 0.4,
  },
  collapse: {
    color: [255, 255, 255],
    glowColor: [255, 255, 255],
    rotSpeed: 3.0,
    distortion: 12,
    scale: 380,
    lineWidth: 4.0,
    glowIntensity: 1.0,
    moveSpeed: 0,
    moveRange: 0,
    innerBrightness: 1.0,
    edgeFlicker: 0.8,
  },
};

// ── 4D 하이퍼큐브 지오메트리 ──

// 16 꼭짓점: (±1, ±1, ±1, ±1)
const VERTICES_4D: [number, number, number, number][] = [];
for (let i = 0; i < 16; i++) {
  VERTICES_4D.push([
    (i & 1) ? 1 : -1,
    (i & 2) ? 1 : -1,
    (i & 4) ? 1 : -1,
    (i & 8) ? 1 : -1,
  ]);
}

// 32 엣지: 정확히 1개 좌표만 다른 꼭짓점 쌍
const EDGES: [number, number][] = [];
for (let i = 0; i < 16; i++) {
  for (let j = i + 1; j < 16; j++) {
    let diff = 0;
    for (let k = 0; k < 4; k++) {
      if (VERTICES_4D[i][k] !== VERTICES_4D[j][k]) diff++;
    }
    if (diff === 1) EDGES.push([i, j]);
  }
}

// 4D 회전 (평면별)
function rotate4D(
  v: [number, number, number, number],
  angles: { xy: number; xz: number; xw: number; yz: number; yw: number; zw: number }
): [number, number, number, number] {
  let [x, y, z, w] = v;

  // XY 평면
  let c = Math.cos(angles.xy), s = Math.sin(angles.xy);
  [x, y] = [x * c - y * s, x * s + y * c];

  // XZ 평면
  c = Math.cos(angles.xz); s = Math.sin(angles.xz);
  [x, z] = [x * c - z * s, x * s + z * c];

  // XW 평면
  c = Math.cos(angles.xw); s = Math.sin(angles.xw);
  [x, w] = [x * c - w * s, x * s + w * c];

  // YZ 평면
  c = Math.cos(angles.yz); s = Math.sin(angles.yz);
  [y, z] = [y * c - z * s, y * s + z * c];

  // YW 평면
  c = Math.cos(angles.yw); s = Math.sin(angles.yw);
  [y, w] = [y * c - w * s, y * s + w * c];

  // ZW 평면
  c = Math.cos(angles.zw); s = Math.sin(angles.zw);
  [z, w] = [z * c - w * s, z * s + w * c];

  return [x, y, z, w];
}

// 4D → 2D 투영 (원근)
function project4Dto2D(
  v: [number, number, number, number],
  scale: number
): { x: number; y: number; depth: number } {
  const wDist = 3; // 4D 카메라 거리
  const zDist = 4; // 3D 카메라 거리

  // 4D → 3D 원근투영
  const wFactor = 1 / (wDist - v[3]);
  const x3 = v[0] * wFactor;
  const y3 = v[1] * wFactor;
  const z3 = v[2] * wFactor;

  // 3D → 2D 원근투영
  const zFactor = 1 / (zDist - z3);
  const x2 = x3 * zFactor * scale;
  const y2 = y3 * zFactor * scale;

  // depth: 가까울수록 밝게
  const depth = (wFactor + zFactor) * 0.5;

  return { x: x2, y: y2, depth };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpConfig(from: TesseractConfig, to: TesseractConfig, t: number): TesseractConfig {
  return {
    color: [lerp(from.color[0], to.color[0], t), lerp(from.color[1], to.color[1], t), lerp(from.color[2], to.color[2], t)],
    glowColor: [lerp(from.glowColor[0], to.glowColor[0], t), lerp(from.glowColor[1], to.glowColor[1], t), lerp(from.glowColor[2], to.glowColor[2], t)],
    rotSpeed: lerp(from.rotSpeed, to.rotSpeed, t),
    distortion: lerp(from.distortion, to.distortion, t),
    scale: lerp(from.scale, to.scale, t),
    lineWidth: lerp(from.lineWidth, to.lineWidth, t),
    glowIntensity: lerp(from.glowIntensity, to.glowIntensity, t),
    moveSpeed: lerp(from.moveSpeed, to.moveSpeed, t),
    moveRange: lerp(from.moveRange, to.moveRange, t),
    innerBrightness: lerp(from.innerBrightness, to.innerBrightness, t),
    edgeFlicker: lerp(from.edgeFlicker, to.edgeFlicker, t),
  };
}

export default function AwakenedEntity({ worldState, collapseProgress }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const targetConfigRef = useRef<TesseractConfig>(CONFIGS[worldState]);
  const currentConfigRef = useRef<TesseractConfig>({ ...CONFIGS[worldState] });

  useEffect(() => {
    targetConfigRef.current = CONFIGS[worldState];
  }, [worldState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let time = 0;

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
      time += 0.016;

      // 부드럽게 설정 전환 (느리게: 0.008)
      currentConfigRef.current = lerpConfig(currentConfigRef.current, targetConfigRef.current, 0.008);
      const cfg = currentConfigRef.current;

      // 반응형 위치: 모바일(768px 미만)은 우측 상단, 데스크톱은 중앙
      const isMobile = w < 768;
      const cx = isMobile ? w * 0.7 : w * 0.5;
      const cy = isMobile ? h * 0.22 : h * 0.45;

      // ── 클리어 ──
      ctx.clearRect(0, 0, w, h);

      // ── 4D 회전 각도 (강한 비대칭 — 각 평면 속도가 매우 다름) ──
      const spd = cfg.rotSpeed;
      const angles = {
        xy: time * spd * 1.0,
        xz: time * spd * 0.23,
        xw: time * spd * 1.7,
        yz: time * spd * 0.11,
        yw: time * spd * 0.67,
        zw: time * spd * 0.41,
      };

      // ── 꼭짓점 변환 ──
      const projected: { x: number; y: number; depth: number }[] = [];
      for (let i = 0; i < 16; i++) {
        let v = rotate4D(VERTICES_4D[i], angles);

        // 왜곡 (distortion) — 상태가 위험할수록 꼭짓점이 흔들림
        if (cfg.distortion > 0) {
          v = [
            v[0] + Math.sin(time * 3 + i * 0.7) * cfg.distortion * 0.02,
            v[1] + Math.cos(time * 2.7 + i * 1.1) * cfg.distortion * 0.02,
            v[2] + Math.sin(time * 3.3 + i * 0.5) * cfg.distortion * 0.02,
            v[3] + Math.cos(time * 2.1 + i * 1.3) * cfg.distortion * 0.02,
          ];
        }

        // 모바일에서는 크기를 60%로 축소
        const effectiveScale = isMobile ? cfg.scale * 0.6 : cfg.scale;
        projected.push(project4Dto2D(v, effectiveScale));
      }

      const [r, g, b] = cfg.color;
      const [gr, gg, gb] = cfg.glowColor;

      // ── 중심 글로우 ──
      const glowRadius = cfg.scale * 2;
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
      glow.addColorStop(0, `rgba(${gr}, ${gg}, ${gb}, ${cfg.glowIntensity * 0.15})`);
      glow.addColorStop(0.4, `rgba(${gr}, ${gg}, ${gb}, ${cfg.glowIntensity * 0.05})`);
      glow.addColorStop(1, `rgba(${gr}, ${gg}, ${gb}, 0)`);
      ctx.beginPath();
      ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      // ── 엣지 그리기 ──
      // 글로우 레이어 (두껍고 투명한 선)
      ctx.lineCap = "round";
      for (const [i, j] of EDGES) {
        const a = projected[i];
        const bv = projected[j];

        // 엣지 깜빡임
        let alpha = 0.15 + (a.depth + bv.depth) * 0.3;
        if (cfg.edgeFlicker > 0) {
          alpha *= 1 - cfg.edgeFlicker * Math.abs(Math.sin(time * 5 + i * 2 + j));
        }

        ctx.beginPath();
        ctx.moveTo(cx + a.x, cy + a.y);
        ctx.lineTo(cx + bv.x, cy + bv.y);
        ctx.strokeStyle = `rgba(${gr}, ${gg}, ${gb}, ${Math.max(0, alpha * 0.4)})`;
        ctx.lineWidth = cfg.lineWidth * 4;
        ctx.stroke();
      }

      // 메인 선 레이어
      for (const [i, j] of EDGES) {
        const a = projected[i];
        const bv = projected[j];

        const depthAlpha = 0.3 + (a.depth + bv.depth) * 0.5;
        let alpha = Math.min(1, depthAlpha);

        if (cfg.edgeFlicker > 0) {
          alpha *= 1 - cfg.edgeFlicker * Math.abs(Math.sin(time * 5 + i * 2 + j));
        }

        // 내부 큐브 vs 외부 큐브 구분 (w 좌표 기준)
        const isInner = (VERTICES_4D[i][3] === VERTICES_4D[j][3]) && VERTICES_4D[i][3] === -1;
        const brightness = isInner ? cfg.innerBrightness : 1;

        ctx.beginPath();
        ctx.moveTo(cx + a.x, cy + a.y);
        ctx.lineTo(cx + bv.x, cy + bv.y);
        ctx.strokeStyle = `rgba(${Math.round(r * brightness)}, ${Math.round(g * brightness)}, ${Math.round(b * brightness)}, ${Math.max(0, alpha)})`;
        ctx.lineWidth = cfg.lineWidth * (0.5 + (a.depth + bv.depth) * 0.5);
        ctx.stroke();
      }

      // ── 꼭짓점 포인트 ──
      for (let i = 0; i < 16; i++) {
        const p = projected[i];
        const pointAlpha = 0.4 + p.depth * 0.6;
        const pointSize = cfg.lineWidth * (0.8 + p.depth * 0.8);

        ctx.beginPath();
        ctx.arc(cx + p.x, cy + p.y, pointSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${Math.min(255, r + 80)}, ${Math.min(255, g + 80)}, ${Math.min(255, b + 80)}, ${Math.min(1, pointAlpha)})`;
        ctx.fill();
      }

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
