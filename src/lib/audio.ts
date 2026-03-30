import { WorldState } from "./types";

// ============================================================
// Procedural Ambient Sound Engine
// Web Audio API 기반 실시간 앰비언트 생성
// ============================================================

interface AudioNodes {
  // 베이스 드론 (저주파)
  drone: OscillatorNode;
  droneGain: GainNode;
  // 하모닉 레이어 (중주파)
  harmonic: OscillatorNode;
  harmonicGain: GainNode;
  // 고주파 텍스처
  texture: OscillatorNode;
  textureGain: GainNode;
  // 서브 베이스 (긴장감)
  sub: OscillatorNode;
  subGain: GainNode;
  // 노이즈 (바람/공간감)
  noiseGain: GainNode;
  noiseSource: AudioBufferSourceNode | null;
  // LFO (드론 변조)
  lfo: OscillatorNode;
  lfoGain: GainNode;
  // 마스터
  masterGain: GainNode;
  // 이펙트
  filter: BiquadFilterNode;
  distortion: WaveShaperNode;
  reverb: ConvolverNode;
}

interface StateConfig {
  droneFreq: number;
  droneVol: number;
  droneType: OscillatorType;
  harmonicFreq: number;
  harmonicVol: number;
  textureFreq: number;
  textureVol: number;
  subFreq: number;
  subVol: number;
  noiseVol: number;
  lfoRate: number;
  lfoDepth: number;
  filterFreq: number;
  filterQ: number;
  distortionAmount: number;
  masterVol: number;
}

const STATE_CONFIGS: Record<WorldState, StateConfig> = {
  calm: {
    droneFreq: 55,        // A1 — 따뜻한 저음
    droneVol: 0.08,
    droneType: "sine",
    harmonicFreq: 110,    // A2
    harmonicVol: 0.03,
    textureFreq: 330,     // E4
    textureVol: 0.01,
    subFreq: 27.5,
    subVol: 0.04,
    noiseVol: 0.008,
    lfoRate: 0.05,        // 매우 느린 맥동
    lfoDepth: 2,
    filterFreq: 800,
    filterQ: 1,
    distortionAmount: 0,
    masterVol: 0.5,
  },
  ripple: {
    droneFreq: 58,
    droneVol: 0.1,
    droneType: "sine",
    harmonicFreq: 116,
    harmonicVol: 0.04,
    textureFreq: 349,     // F4
    textureVol: 0.015,
    subFreq: 29,
    subVol: 0.05,
    noiseVol: 0.012,
    lfoRate: 0.08,
    lfoDepth: 3,
    filterFreq: 900,
    filterQ: 1.5,
    distortionAmount: 0,
    masterVol: 0.55,
  },
  tension: {
    droneFreq: 62,        // 약간 불안한 음정
    droneVol: 0.12,
    droneType: "triangle",
    harmonicFreq: 123,
    harmonicVol: 0.05,
    textureFreq: 370,     // 불협화음 시작
    textureVol: 0.02,
    subFreq: 31,
    subVol: 0.06,
    noiseVol: 0.02,
    lfoRate: 0.15,
    lfoDepth: 5,
    filterFreq: 1200,
    filterQ: 2,
    distortionAmount: 0,
    masterVol: 0.6,
  },
  conflict: {
    droneFreq: 65,
    droneVol: 0.15,
    droneType: "triangle",
    harmonicFreq: 131,
    harmonicVol: 0.07,
    textureFreq: 392,     // 충돌하는 화성
    textureVol: 0.03,
    subFreq: 33,
    subVol: 0.08,
    noiseVol: 0.035,
    lfoRate: 0.3,         // 빠른 맥동
    lfoDepth: 8,
    filterFreq: 1800,
    filterQ: 3,
    distortionAmount: 5,
    masterVol: 0.65,
  },
  critical: {
    droneFreq: 69,        // 매우 불안
    droneVol: 0.18,
    droneType: "sawtooth",
    harmonicFreq: 138,
    harmonicVol: 0.09,
    textureFreq: 415,     // 날카로운 불협화음
    textureVol: 0.04,
    subFreq: 35,
    subVol: 0.1,
    noiseVol: 0.05,
    lfoRate: 0.6,
    lfoDepth: 12,
    filterFreq: 2500,
    filterQ: 5,
    distortionAmount: 15,
    masterVol: 0.7,
  },
  collapse: {
    droneFreq: 73,
    droneVol: 0.22,
    droneType: "sawtooth",
    harmonicFreq: 146,
    harmonicVol: 0.12,
    textureFreq: 440,
    textureVol: 0.06,
    subFreq: 20,          // 극저주파 진동
    subVol: 0.15,
    noiseVol: 0.08,
    lfoRate: 1.2,         // 격렬한 맥동
    lfoDepth: 20,
    filterFreq: 4000,
    filterQ: 8,
    distortionAmount: 40,
    masterVol: 0.75,
  },
};

function makeDistortionCurve(amount: number): Float32Array<ArrayBuffer> {
  const samples = 44100;
  const curve = new Float32Array(samples) as Float32Array<ArrayBuffer>;
  if (amount === 0) {
    for (let i = 0; i < samples; i++) {
      curve[i] = (i * 2) / samples - 1;
    }
  } else {
    const deg = Math.PI / 180;
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] =
        ((3 + amount) * x * 20 * deg) /
        (Math.PI + amount * Math.abs(x));
    }
  }
  return curve;
}

function createReverbImpulse(ctx: AudioContext): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * 3; // 3초 리버브
  const impulse = ctx.createBuffer(2, length, sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.5);
    }
  }
  return impulse;
}

function createNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const bufferSize = ctx.sampleRate * 4;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  // 브라운 노이즈 (부드러운 바람 소리)
  let lastOut = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    data[i] = (lastOut + 0.02 * white) / 1.02;
    lastOut = data[i];
    data[i] *= 3.5;
  }
  return buffer;
}

export class AmbientEngine {
  private ctx: AudioContext | null = null;
  private nodes: AudioNodes | null = null;
  private currentState: WorldState = "calm";
  private isPlaying = false;
  private transitionTimer: ReturnType<typeof setInterval> | null = null;

  async start(): Promise<void> {
    if (this.isPlaying) return;

    this.ctx = new AudioContext();
    const ctx = this.ctx;

    // 브라우저 정책: suspended 상태면 resume
    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    // 마스터 게인
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0;
    masterGain.connect(ctx.destination);

    // 리버브
    const reverb = ctx.createConvolver();
    reverb.buffer = createReverbImpulse(ctx);

    // 드라이/웻 믹스
    const reverbGain = ctx.createGain();
    reverbGain.gain.value = 0.3;
    reverb.connect(reverbGain);
    reverbGain.connect(masterGain);

    const dryGain = ctx.createGain();
    dryGain.gain.value = 0.7;
    dryGain.connect(masterGain);

    // 필터
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 800;
    filter.Q.value = 1;
    filter.connect(dryGain);
    filter.connect(reverb);

    // 디스토션
    const distortion = ctx.createWaveShaper();
    distortion.curve = makeDistortionCurve(0);
    distortion.oversample = "4x";
    distortion.connect(filter);

    // 드론
    const drone = ctx.createOscillator();
    const droneGain = ctx.createGain();
    drone.type = "sine";
    drone.frequency.value = 55;
    droneGain.gain.value = 0;
    drone.connect(droneGain);
    droneGain.connect(distortion);

    // LFO → 드론 주파수 변조
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = "sine";
    lfo.frequency.value = 0.05;
    lfoGain.gain.value = 2;
    lfo.connect(lfoGain);
    lfoGain.connect(drone.frequency);

    // 하모닉
    const harmonic = ctx.createOscillator();
    const harmonicGain = ctx.createGain();
    harmonic.type = "sine";
    harmonic.frequency.value = 110;
    harmonicGain.gain.value = 0;
    harmonic.connect(harmonicGain);
    harmonicGain.connect(distortion);

    // 텍스처
    const texture = ctx.createOscillator();
    const textureGain = ctx.createGain();
    texture.type = "sine";
    texture.frequency.value = 330;
    textureGain.gain.value = 0;
    texture.connect(textureGain);
    textureGain.connect(distortion);

    // 서브 베이스
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = "sine";
    sub.frequency.value = 27.5;
    subGain.gain.value = 0;
    sub.connect(subGain);
    subGain.connect(distortion);

    // 노이즈
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0;
    noiseGain.connect(filter);

    const noiseBuffer = createNoiseBuffer(ctx);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;
    noiseSource.connect(noiseGain);

    // 시작
    drone.start();
    lfo.start();
    harmonic.start();
    texture.start();
    sub.start();
    noiseSource.start();

    this.nodes = {
      drone, droneGain,
      harmonic, harmonicGain,
      texture, textureGain,
      sub, subGain,
      noiseGain, noiseSource,
      lfo, lfoGain,
      masterGain,
      filter, distortion, reverb,
    };

    // 페이드인 (0.5초 후 시작, 1.5초에 걸쳐 — 더 빠르게 들리도록)
    masterGain.gain.setValueAtTime(0, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(
      STATE_CONFIGS.calm.masterVol,
      ctx.currentTime + 1.5
    );

    this.isPlaying = true;
    this.applyState("calm");
  }

  stop(): void {
    if (!this.isPlaying || !this.ctx || !this.nodes) return;

    if (this.transitionTimer) {
      clearInterval(this.transitionTimer);
      this.transitionTimer = null;
    }

    // 페이드아웃
    const now = this.ctx.currentTime;
    this.nodes.masterGain.gain.setTargetAtTime(0, now, 1);

    // 2초 후 정리
    setTimeout(() => {
      try {
        this.nodes?.drone.stop();
        this.nodes?.lfo.stop();
        this.nodes?.harmonic.stop();
        this.nodes?.texture.stop();
        this.nodes?.sub.stop();
        this.nodes?.noiseSource?.stop();
        this.ctx?.close();
      } catch {
        // 이미 정지된 경우 무시
      }
      this.nodes = null;
      this.ctx = null;
      this.isPlaying = false;
    }, 2000);
  }

  transition(newState: WorldState): void {
    if (!this.isPlaying || newState === this.currentState) return;
    this.currentState = newState;
    this.applyState(newState);
  }

  private applyState(state: WorldState): void {
    if (!this.ctx || !this.nodes) return;

    const config = STATE_CONFIGS[state];
    const now = this.ctx.currentTime;
    const ramp = 3; // 3초에 걸쳐 전환

    const n = this.nodes;

    // 드론
    n.drone.frequency.setTargetAtTime(config.droneFreq, now, ramp);
    n.droneGain.gain.setTargetAtTime(config.droneVol, now, ramp);
    if (n.drone.type !== config.droneType) {
      n.drone.type = config.droneType;
    }

    // 하모닉
    n.harmonic.frequency.setTargetAtTime(config.harmonicFreq, now, ramp);
    n.harmonicGain.gain.setTargetAtTime(config.harmonicVol, now, ramp);

    // 텍스처
    n.texture.frequency.setTargetAtTime(config.textureFreq, now, ramp);
    n.textureGain.gain.setTargetAtTime(config.textureVol, now, ramp);

    // 서브
    n.sub.frequency.setTargetAtTime(config.subFreq, now, ramp);
    n.subGain.gain.setTargetAtTime(config.subVol, now, ramp);

    // 노이즈
    n.noiseGain.gain.setTargetAtTime(config.noiseVol, now, ramp);

    // LFO
    n.lfo.frequency.setTargetAtTime(config.lfoRate, now, ramp);
    n.lfoGain.gain.setTargetAtTime(config.lfoDepth, now, ramp);

    // 필터
    n.filter.frequency.setTargetAtTime(config.filterFreq, now, ramp);
    n.filter.Q.setTargetAtTime(config.filterQ, now, ramp);

    // 디스토션
    n.distortion.curve = makeDistortionCurve(config.distortionAmount);

    // 마스터
    n.masterGain.gain.setTargetAtTime(config.masterVol, now, ramp);
  }
}
