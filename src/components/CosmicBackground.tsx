"use client";

import { useEffect, useRef } from "react";
import { WorldState } from "@/lib/types";

interface Props {
  worldState: WorldState;
  collapseProgress: number;
}

// ── 상태별 설정 ──
interface CosmicConfig {
  // 배경 그라데이션
  bgColors: [string, string, string]; // top, mid, bottom
  // 파티클 네트워크
  particleColor: [number, number, number];
  particleCount: number;
  connectionDist: number;
  connectionAlpha: number;
  particleSpeed: number;
  // 중심 발광
  coreColor: [number, number, number];
  coreGlowColor: [number, number, number];
  coreSize: number;
  corePulseSpeed: number;
  corePulseAmount: number;
  coreRayCount: number;
  coreRayLength: number;
  coreIntensity: number;
  // 테서랙트
  tessColor: [number, number, number];
  tessRotSpeed: number;
  tessScale: number;
  tessLineWidth: number;
  tessDistortion: number;
  tessAlpha: number;
}

const CONFIGS: Record<WorldState, CosmicConfig> = {
  calm: {
    bgColors: ["#0a1628", "#0d2137", "#081820"],
    particleColor: [100, 200, 180],
    particleCount: 80,
    connectionDist: 150,
    connectionAlpha: 0.12,
    particleSpeed: 0.3,
    coreColor: [120, 220, 160],
    coreGlowColor: [80, 200, 140],
    coreSize: 30,
    corePulseSpeed: 0.6,
    corePulseAmount: 8,
    coreRayCount: 12,
    coreRayLength: 200,
    coreIntensity: 0.5,
    tessColor: [180, 220, 255],
    tessRotSpeed: 0.25,
    tessScale: 280,
    tessLineWidth: 1.8,
    tessDistortion: 0,
    tessAlpha: 0.85,
  },
  ripple: {
    bgColors: ["#0c1830", "#10253f", "#0a1e2e"],
    particleColor: [110, 190, 200],
    particleCount: 90,
    connectionDist: 155,
    connectionAlpha: 0.15,
    particleSpeed: 0.4,
    coreColor: [140, 210, 180],
    coreGlowColor: [100, 200, 160],
    coreSize: 35,
    corePulseSpeed: 0.8,
    corePulseAmount: 10,
    coreRayCount: 16,
    coreRayLength: 230,
    coreIntensity: 0.6,
    tessColor: [160, 210, 255],
    tessRotSpeed: 0.35,
    tessScale: 290,
    tessLineWidth: 2.0,
    tessDistortion: 0.5,
    tessAlpha: 0.85,
  },
  tension: {
    bgColors: ["#14102a", "#1a1040", "#120e28"],
    particleColor: [160, 130, 220],
    particleCount: 100,
    connectionDist: 160,
    connectionAlpha: 0.18,
    particleSpeed: 0.5,
    coreColor: [200, 160, 240],
    coreGlowColor: [160, 100, 240],
    coreSize: 40,
    corePulseSpeed: 1.2,
    corePulseAmount: 14,
    coreRayCount: 20,
    coreRayLength: 260,
    coreIntensity: 0.7,
    tessColor: [220, 160, 255],
    tessRotSpeed: 0.5,
    tessScale: 300,
    tessLineWidth: 2.2,
    tessDistortion: 1.5,
    tessAlpha: 0.9,
  },
  conflict: {
    bgColors: ["#1a0e14", "#2a1018", "#1e0c10"],
    particleColor: [240, 140, 80],
    particleCount: 120,
    connectionDist: 170,
    connectionAlpha: 0.22,
    particleSpeed: 0.7,
    coreColor: [255, 180, 80],
    coreGlowColor: [255, 100, 40],
    coreSize: 50,
    corePulseSpeed: 1.8,
    corePulseAmount: 20,
    coreRayCount: 28,
    coreRayLength: 320,
    coreIntensity: 0.85,
    tessColor: [255, 200, 100],
    tessRotSpeed: 0.8,
    tessScale: 320,
    tessLineWidth: 2.5,
    tessDistortion: 3,
    tessAlpha: 0.9,
  },
  critical: {
    bgColors: ["#1e0808", "#2a0a0a", "#1a0606"],
    particleColor: [255, 80, 60],
    particleCount: 140,
    connectionDist: 180,
    connectionAlpha: 0.28,
    particleSpeed: 1.0,
    coreColor: [255, 100, 60],
    coreGlowColor: [255, 40, 20],
    coreSize: 60,
    corePulseSpeed: 2.5,
    corePulseAmount: 28,
    coreRayCount: 36,
    coreRayLength: 400,
    coreIntensity: 1.0,
    tessColor: [255, 120, 180],
    tessRotSpeed: 1.2,
    tessScale: 350,
    tessLineWidth: 3.0,
    tessDistortion: 6,
    tessAlpha: 0.95,
  },
  collapse: {
    bgColors: ["#ffffff", "#ffffff", "#ffffff"],
    particleColor: [255, 255, 255],
    particleCount: 160,
    connectionDist: 200,
    connectionAlpha: 0.3,
    particleSpeed: 2.0,
    coreColor: [255, 255, 255],
    coreGlowColor: [255, 255, 255],
    coreSize: 80,
    corePulseSpeed: 4.0,
    corePulseAmount: 40,
    coreRayCount: 48,
    coreRayLength: 600,
    coreIntensity: 1.0,
    tessColor: [255, 255, 255],
    tessRotSpeed: 3.0,
    tessScale: 400,
    tessLineWidth: 4.0,
    tessDistortion: 12,
    tessAlpha: 1.0,
  },
};

// ── 유틸 ──
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpStr(from: string, to: string, t: number): string {
  // hex color lerp
  const fr = parseInt(from.slice(1, 3), 16), fg = parseInt(from.slice(3, 5), 16), fb = parseInt(from.slice(5, 7), 16);
  const tr = parseInt(to.slice(1, 3), 16), tg = parseInt(to.slice(3, 5), 16), tb = parseInt(to.slice(5, 7), 16);
  const r = Math.round(lerp(fr, tr, t)).toString(16).padStart(2, "0");
  const g = Math.round(lerp(fg, tg, t)).toString(16).padStart(2, "0");
  const b = Math.round(lerp(fb, tb, t)).toString(16).padStart(2, "0");
  return `#${r}${g}${b}`;
}

function lerpConfig(from: CosmicConfig, to: CosmicConfig, t: number): CosmicConfig {
  return {
    bgColors: [lerpStr(from.bgColors[0], to.bgColors[0], t), lerpStr(from.bgColors[1], to.bgColors[1], t), lerpStr(from.bgColors[2], to.bgColors[2], t)],
    particleColor: [lerp(from.particleColor[0], to.particleColor[0], t), lerp(from.particleColor[1], to.particleColor[1], t), lerp(from.particleColor[2], to.particleColor[2], t)],
    particleCount: Math.round(lerp(from.particleCount, to.particleCount, t)),
    connectionDist: lerp(from.connectionDist, to.connectionDist, t),
    connectionAlpha: lerp(from.connectionAlpha, to.connectionAlpha, t),
    particleSpeed: lerp(from.particleSpeed, to.particleSpeed, t),
    coreColor: [lerp(from.coreColor[0], to.coreColor[0], t), lerp(from.coreColor[1], to.coreColor[1], t), lerp(from.coreColor[2], to.coreColor[2], t)],
    coreGlowColor: [lerp(from.coreGlowColor[0], to.coreGlowColor[0], t), lerp(from.coreGlowColor[1], to.coreGlowColor[1], t), lerp(from.coreGlowColor[2], to.coreGlowColor[2], t)],
    coreSize: lerp(from.coreSize, to.coreSize, t),
    corePulseSpeed: lerp(from.corePulseSpeed, to.corePulseSpeed, t),
    corePulseAmount: lerp(from.corePulseAmount, to.corePulseAmount, t),
    coreRayCount: Math.round(lerp(from.coreRayCount, to.coreRayCount, t)),
    coreRayLength: lerp(from.coreRayLength, to.coreRayLength, t),
    coreIntensity: lerp(from.coreIntensity, to.coreIntensity, t),
    tessColor: [lerp(from.tessColor[0], to.tessColor[0], t), lerp(from.tessColor[1], to.tessColor[1], t), lerp(from.tessColor[2], to.tessColor[2], t)],
    tessRotSpeed: lerp(from.tessRotSpeed, to.tessRotSpeed, t),
    tessScale: lerp(from.tessScale, to.tessScale, t),
    tessLineWidth: lerp(from.tessLineWidth, to.tessLineWidth, t),
    tessDistortion: lerp(from.tessDistortion, to.tessDistortion, t),
    tessAlpha: lerp(from.tessAlpha, to.tessAlpha, t),
  };
}

// ── 파티클 ──
interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  size: number;
  brightness: number;
}

function createParticles(count: number, w: number, h: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: 1 + Math.random() * 2.5,
      brightness: 0.3 + Math.random() * 0.7,
    });
  }
  return particles;
}

// ── 테서랙트 지오메트리 ──
const VERTS_4D: [number, number, number, number][] = [];
for (let i = 0; i < 16; i++) {
  VERTS_4D.push([(i & 1) ? 1 : -1, (i & 2) ? 1 : -1, (i & 4) ? 1 : -1, (i & 8) ? 1 : -1]);
}
const EDGES_4D: [number, number][] = [];
for (let i = 0; i < 16; i++) {
  for (let j = i + 1; j < 16; j++) {
    let d = 0;
    for (let k = 0; k < 4; k++) if (VERTS_4D[i][k] !== VERTS_4D[j][k]) d++;
    if (d === 1) EDGES_4D.push([i, j]);
  }
}

function rotate4D(v: [number, number, number, number], a: { xy: number; xz: number; xw: number; yz: number; yw: number; zw: number }): [number, number, number, number] {
  let [x, y, z, w] = v;
  let c = Math.cos(a.xy), s = Math.sin(a.xy); [x, y] = [x*c - y*s, x*s + y*c];
  c = Math.cos(a.xz); s = Math.sin(a.xz); [x, z] = [x*c - z*s, x*s + z*c];
  c = Math.cos(a.xw); s = Math.sin(a.xw); [x, w] = [x*c - w*s, x*s + w*c];
  c = Math.cos(a.yz); s = Math.sin(a.yz); [y, z] = [y*c - z*s, y*s + z*c];
  c = Math.cos(a.yw); s = Math.sin(a.yw); [y, w] = [y*c - w*s, y*s + w*c];
  c = Math.cos(a.zw); s = Math.sin(a.zw); [z, w] = [z*c - w*s, z*s + w*c];
  return [x, y, z, w];
}

function project(v: [number, number, number, number], scale: number): { x: number; y: number; d: number } {
  const wf = 1 / (3 - v[3]), x3 = v[0] * wf, y3 = v[1] * wf, z3 = v[2] * wf;
  const zf = 1 / (4 - z3);
  return { x: x3 * zf * scale, y: y3 * zf * scale, d: (wf + zf) * 0.5 };
}

export default function CosmicBackground({ worldState, collapseProgress }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const targetRef = useRef<CosmicConfig>(CONFIGS[worldState]);
  const currentRef = useRef<CosmicConfig>({ ...CONFIGS[worldState] });
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    targetRef.current = CONFIGS[worldState];
  }, [worldState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let time = 0;
    let w = 0, h = 0;

    function resize() {
      if (!canvas) return;
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      // 파티클이 부족하면 추가
      while (particlesRef.current.length < 160) {
        particlesRef.current.push({
          x: Math.random() * w, y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
          size: 1 + Math.random() * 2.5, brightness: 0.3 + Math.random() * 0.7,
        });
      }
    }
    resize();
    particlesRef.current = createParticles(160, w, h);
    window.addEventListener("resize", resize);

    // 테서랙트 위치 (반응형)
    function getTessCenter(): { x: number; y: number } {
      const isMobile = w < 768;
      return { x: isMobile ? w * 0.7 : w * 0.5, y: isMobile ? h * 0.22 : h * 0.42 };
    }

    function animate() {
      if (!canvas || !ctx) return;
      time += 0.016;

      // 설정 보간
      currentRef.current = lerpConfig(currentRef.current, targetRef.current, 0.01);
      const cfg = currentRef.current;

      // ═══════════════════════════════════
      // 1. 배경 그라데이션
      // ═══════════════════════════════════
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, cfg.bgColors[0]);
      bgGrad.addColorStop(0.5, cfg.bgColors[1]);
      bgGrad.addColorStop(1, cfg.bgColors[2]);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      const tc = getTessCenter();
      const [pr, pg, pb] = cfg.particleColor;
      const [cr, cg, cb] = cfg.coreColor;
      const [gr, gg, gb] = cfg.coreGlowColor;

      // ═══════════════════════════════════
      // 2. 중심 발광 (뒷 레이어)
      // ═══════════════════════════════════
      const pulse = Math.sin(time * cfg.corePulseSpeed) * cfg.corePulseAmount;
      const coreR = cfg.coreSize + pulse;

      // 넓은 글로우
      const outerGlow = ctx.createRadialGradient(tc.x, tc.y, 0, tc.x, tc.y, cfg.coreRayLength);
      outerGlow.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, ${cfg.coreIntensity * 0.35})`);
      outerGlow.addColorStop(0.15, `rgba(${gr}, ${gg}, ${gb}, ${cfg.coreIntensity * 0.15})`);
      outerGlow.addColorStop(0.4, `rgba(${gr}, ${gg}, ${gb}, ${cfg.coreIntensity * 0.04})`);
      outerGlow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = outerGlow;
      ctx.fillRect(0, 0, w, h);

      // 빛줄기 (rays)
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      for (let i = 0; i < cfg.coreRayCount; i++) {
        const angle = (i / cfg.coreRayCount) * Math.PI * 2 + time * 0.1;
        const rayLen = cfg.coreRayLength * (0.4 + 0.6 * Math.sin(time * 0.7 + i * 1.3));
        const rayWidth = 1.5 + Math.sin(time * 1.1 + i * 2.1) * 1;

        const x2 = tc.x + Math.cos(angle) * rayLen;
        const y2 = tc.y + Math.sin(angle) * rayLen;

        const rayGrad = ctx.createLinearGradient(tc.x, tc.y, x2, y2);
        rayGrad.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, ${cfg.coreIntensity * 0.3})`);
        rayGrad.addColorStop(0.3, `rgba(${gr}, ${gg}, ${gb}, ${cfg.coreIntensity * 0.08})`);
        rayGrad.addColorStop(1, "rgba(0,0,0,0)");

        ctx.beginPath();
        ctx.moveTo(tc.x, tc.y);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = rayGrad;
        ctx.lineWidth = rayWidth;
        ctx.stroke();
      }
      ctx.restore();

      // ═══════════════════════════════════
      // 3. 파티클 네트워크
      // ═══════════════════════════════════
      const particles = particlesRef.current;
      const activeCount = Math.min(cfg.particleCount, particles.length);

      // 업데이트
      for (let i = 0; i < activeCount; i++) {
        const p = particles[i];
        p.x += p.vx * cfg.particleSpeed;
        p.y += p.vy * cfg.particleSpeed;

        // 중심과의 관계: 인력 + 궤도 운동
        const dx = tc.x - p.x, dy = tc.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const nx = dx / dist, ny = dy / dist;
        if (dist > 300) {
          // 먼 거리: 약한 인력
          p.vx += nx * 0.0008 * cfg.particleSpeed;
          p.vy += ny * 0.0008 * cfg.particleSpeed;
        } else if (dist < 120) {
          // 테서랙트 영역에서 밀어냄
          p.vx -= nx * 0.005;
          p.vy -= ny * 0.005;
        }
        // 궤도 접선 방향 미세 가속 (뭉침 방지)
        if (dist > 100 && dist < 400) {
          p.vx += -ny * 0.0003 * cfg.particleSpeed;
          p.vy += nx * 0.0003 * cfg.particleSpeed;
        }

        // 감쇠 (약하게)
        p.vx *= 0.9995;
        p.vy *= 0.9995;

        // 경계 래핑
        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        if (p.y > h + 20) p.y = -20;
      }

      // 연결선
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      for (let i = 0; i < activeCount; i++) {
        for (let j = i + 1; j < activeCount; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < cfg.connectionDist) {
            const alpha = cfg.connectionAlpha * (1 - dist / cfg.connectionDist);
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(${pr}, ${pg}, ${pb}, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }
      ctx.restore();

      // 파티클 점
      for (let i = 0; i < activeCount; i++) {
        const p = particles[i];
        const distToCore = Math.sqrt((p.x - tc.x) ** 2 + (p.y - tc.y) ** 2);
        const closeness = Math.max(0, 1 - distToCore / 400);
        const glow = p.brightness + closeness * 0.5;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 + closeness * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${pr}, ${pg}, ${pb}, ${Math.min(1, glow)})`;
        ctx.fill();

        // 밝은 파티클 글로우
        if (closeness > 0.3) {
          const pg2 = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
          pg2.addColorStop(0, `rgba(${pr}, ${pg}, ${pb}, ${closeness * 0.2})`);
          pg2.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = pg2;
          ctx.fill();
        }
      }

      // ═══════════════════════════════════
      // 4. 테서랙트 (중심)
      // ═══════════════════════════════════
      const spd = cfg.tessRotSpeed;
      const angles = {
        xy: time * spd * 1.0,
        xz: time * spd * 0.23,
        xw: time * spd * 1.7,
        yz: time * spd * 0.11,
        yw: time * spd * 0.67,
        zw: time * spd * 0.41,
      };

      const isMobile = w < 768;
      const effScale = isMobile ? cfg.tessScale * 0.75 : cfg.tessScale;

      const proj: { x: number; y: number; d: number }[] = [];
      for (let i = 0; i < 16; i++) {
        let v = rotate4D(VERTS_4D[i], angles);
        if (cfg.tessDistortion > 0) {
          v = [
            v[0] + Math.sin(time * 3 + i * 0.7) * cfg.tessDistortion * 0.02,
            v[1] + Math.cos(time * 2.7 + i * 1.1) * cfg.tessDistortion * 0.02,
            v[2] + Math.sin(time * 3.3 + i * 0.5) * cfg.tessDistortion * 0.02,
            v[3] + Math.cos(time * 2.1 + i * 1.3) * cfg.tessDistortion * 0.02,
          ];
        }
        proj.push(project(v, effScale));
      }

      const [tr, tg, tb] = cfg.tessColor;

      // 테서랙트 글로우 엣지
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.lineCap = "round";
      for (const [i, j] of EDGES_4D) {
        const a = proj[i], b = proj[j];
        const alpha = (0.15 + (a.d + b.d) * 0.3) * cfg.tessAlpha * 0.4;
        ctx.beginPath();
        ctx.moveTo(tc.x + a.x, tc.y + a.y);
        ctx.lineTo(tc.x + b.x, tc.y + b.y);
        ctx.strokeStyle = `rgba(${tr}, ${tg}, ${tb}, ${Math.max(0, alpha)})`;
        ctx.lineWidth = cfg.tessLineWidth * 4;
        ctx.stroke();
      }

      // 테서랙트 메인 엣지
      for (const [i, j] of EDGES_4D) {
        const a = proj[i], b = proj[j];
        const alpha = Math.min(1, (0.3 + (a.d + b.d) * 0.5)) * cfg.tessAlpha;
        ctx.beginPath();
        ctx.moveTo(tc.x + a.x, tc.y + a.y);
        ctx.lineTo(tc.x + b.x, tc.y + b.y);
        ctx.strokeStyle = `rgba(${tr}, ${tg}, ${tb}, ${Math.max(0, alpha)})`;
        ctx.lineWidth = cfg.tessLineWidth * (0.5 + (a.d + b.d) * 0.5);
        ctx.stroke();
      }

      // 테서랙트 꼭짓점
      for (let i = 0; i < 16; i++) {
        const p = proj[i];
        const pa = (0.4 + p.d * 0.6) * cfg.tessAlpha;
        const ps = cfg.tessLineWidth * (0.8 + p.d * 0.8);
        ctx.beginPath();
        ctx.arc(tc.x + p.x, tc.y + p.y, ps, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${Math.min(255, tr + 80)}, ${Math.min(255, tg + 80)}, ${Math.min(255, tb + 80)}, ${Math.min(1, pa)})`;
        ctx.fill();
      }
      ctx.restore();

      // ═══════════════════════════════════
      // 5. 중심 코어 (앞 레이어)
      // ═══════════════════════════════════
      const coreGlow = ctx.createRadialGradient(tc.x, tc.y, 0, tc.x, tc.y, coreR * 3);
      coreGlow.addColorStop(0, `rgba(255, 255, 255, ${cfg.coreIntensity * 0.7})`);
      coreGlow.addColorStop(0.2, `rgba(${cr}, ${cg}, ${cb}, ${cfg.coreIntensity * 0.4})`);
      coreGlow.addColorStop(0.5, `rgba(${gr}, ${gg}, ${gb}, ${cfg.coreIntensity * 0.1})`);
      coreGlow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.beginPath();
      ctx.arc(tc.x, tc.y, coreR * 3, 0, Math.PI * 2);
      ctx.fillStyle = coreGlow;
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
      className="fixed inset-0"
      style={{
        zIndex: -1,
        opacity: collapseProgress > 95 ? 0 : 1,
        transition: "opacity 2s",
      }}
    />
  );
}
