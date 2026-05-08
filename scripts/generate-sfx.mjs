/**
 * 生成游戏音效 WAV 文件
 * 用法: node scripts/generate-sfx.mjs
 */
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const SAMPLE_RATE = 44100;
const OUT_DIR = 'public/audio/sfx';

mkdirSync(OUT_DIR, { recursive: true });

// ===== WAV 编码 =====

function encodeWav(samples, sampleRate = SAMPLE_RATE) {
  const numSamples = samples.length;
  const buffer = Buffer.alloc(44 + numSamples * 2);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);        // chunk size
  buffer.writeUInt16LE(1, 20);         // PCM
  buffer.writeUInt16LE(1, 22);         // mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28); // byte rate
  buffer.writeUInt16LE(2, 32);         // block align
  buffer.writeUInt16LE(16, 34);        // bits per sample
  buffer.write('data', 36);
  buffer.writeUInt32LE(numSamples * 2, 40);

  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }
  return buffer;
}

// ===== 基础波形 =====

function sine(freq, t) {
  return Math.sin(2 * Math.PI * freq * t);
}

function noise() {
  return Math.random() * 2 - 1;
}

function envelope(t, attack, decay, sustain, release, duration) {
  if (t < attack) return t / attack;
  if (t < attack + decay) return 1 - (1 - sustain) * (t - attack) / decay;
  if (t < duration - release) return sustain;
  if (t < duration) return sustain * (duration - t) / release;
  return 0;
}

function simpleEnv(t, duration, attack = 0.01, release = 0.05) {
  return envelope(t, attack, Math.min(0.05, duration * 0.1), 0.8, release, duration);
}

function lowpass(samples, cutoff) {
  const rc = 1.0 / (cutoff * 2 * Math.PI);
  const dt = 1.0 / SAMPLE_RATE;
  const alpha = dt / (rc + dt);
  const out = new Float64Array(samples.length);
  out[0] = samples[0];
  for (let i = 1; i < samples.length; i++) {
    out[i] = out[i - 1] + alpha * (samples[i] - out[i - 1]);
  }
  return out;
}

function generate(duration, fn) {
  const n = Math.floor(duration * SAMPLE_RATE);
  const samples = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    samples[i] = fn(t, i);
  }
  return samples;
}

function mix(...arrays) {
  const len = Math.max(...arrays.map(a => a.length));
  const out = new Float64Array(len);
  for (const arr of arrays) {
    for (let i = 0; i < arr.length; i++) out[i] += arr[i];
  }
  return out;
}

function gain(samples, vol) {
  return samples.map(s => s * vol);
}

function concat(...arrays) {
  const len = arrays.reduce((s, a) => s + a.length, 0);
  const out = new Float64Array(len);
  let offset = 0;
  for (const arr of arrays) {
    out.set(arr, offset);
    offset += arr.length;
  }
  return out;
}

function reverb(samples, delay = 0.08, decay = 0.3) {
  const delaySamples = Math.floor(delay * SAMPLE_RATE);
  const out = new Float64Array(samples.length + delaySamples * 3);
  for (let i = 0; i < samples.length; i++) out[i] = samples[i];
  for (let j = 1; j <= 3; j++) {
    const d = delaySamples * j;
    const g = Math.pow(decay, j);
    for (let i = 0; i < samples.length; i++) {
      out[i + d] += samples[i] * g;
    }
  }
  return out;
}

// ===== 音效生成 =====

function pageTurn() {
  // 纸张翻动：filtered noise burst
  const dur = 0.6;
  const raw = generate(dur, (t) => {
    const env = simpleEnv(t, dur, 0.02, 0.3);
    const cutoffSweep = 2000 + 4000 * Math.exp(-t * 8);
    // 用振幅调制模拟沙沙声
    const mod = 0.5 + 0.5 * sine(12, t);
    return noise() * env * mod * 0.5;
  });
  return lowpass(raw, 3000);
}

function bookSelect() {
  // 轻柔的木质敲击
  const dur = 0.3;
  return generate(dur, (t) => {
    const env = envelope(t, 0.002, 0.04, 0.2, 0.15, dur);
    return (sine(800, t) * 0.4 + sine(1200, t) * 0.2 + noise() * 0.1) * env * 0.5;
  });
}

function bookUse() {
  // 书页展开 - swoosh + chime
  const dur = 0.8;
  const swoosh = generate(dur, (t) => {
    const env = envelope(t, 0.05, 0.2, 0.3, 0.4, dur);
    return noise() * env * 0.3;
  });
  const filtered = lowpass(swoosh, 1500);
  const chime = generate(dur, (t) => {
    const env = envelope(t, 0.01, 0.1, 0.3, 0.3, dur);
    return (sine(523, t) * 0.3 + sine(659, t) * 0.2 + sine(784, t) * 0.1) * env * 0.4;
  });
  return mix(filtered, chime);
}

function moveNode() {
  // 脚步 + 空间回响
  const dur = 1.0;
  const step1 = generate(dur, (t) => {
    const env = envelope(t, 0.005, 0.05, 0, 0, 0.08);
    return (sine(80, t) + noise() * 0.5) * env * 0.6;
  });
  const step2 = generate(dur, (t) => {
    const t2 = t - 0.25;
    if (t2 < 0) return 0;
    const env = envelope(t2, 0.005, 0.05, 0, 0, 0.08);
    return (sine(70, t2) + noise() * 0.5) * env * 0.5;
  });
  const ambience = generate(dur, (t) => {
    const env = envelope(t, 0.1, 0.3, 0.15, 0.4, dur);
    return noise() * env * 0.05;
  });
  const raw = mix(step1, step2, lowpass(ambience, 400));
  return reverb(raw, 0.1, 0.4);
}

function success() {
  // 上行琶音 - 温暖铃声
  const dur = 0.8;
  const freqs = [523, 659, 784]; // C5 E5 G5
  return generate(dur, (t) => {
    let val = 0;
    freqs.forEach((f, i) => {
      const offset = i * 0.08;
      if (t < offset) return;
      const lt = t - offset;
      const env = envelope(lt, 0.005, 0.1, 0.3, 0.3, dur - offset);
      val += sine(f, lt) * env * 0.25;
      val += sine(f * 2, lt) * env * 0.08; // overtone
    });
    return val;
  });
}

function superMatch() {
  // 魔法共鸣 - 从低到高的光芒涌动
  const dur = 2.0;
  const shimmer = generate(dur, (t) => {
    const sweep = 200 + 800 * (t / dur);
    const env = envelope(t, 0.1, 0.3, 0.7, 0.8, dur);
    const vibrato = 1 + 0.003 * sine(5, t);
    let val = 0;
    val += sine(sweep * vibrato, t) * 0.3;
    val += sine(sweep * 1.5 * vibrato, t) * 0.2;
    val += sine(sweep * 2 * vibrato, t) * 0.15;
    val += sine(sweep * 3, t) * 0.08;
    return val * env;
  });
  const sparkle = generate(dur, (t) => {
    if (t < 0.3) return 0;
    const env = envelope(t - 0.3, 0.05, 0.2, 0.4, 0.8, dur - 0.3);
    const f = 1200 + 400 * sine(3, t);
    return sine(f, t) * env * 0.15;
  });
  const raw = mix(shimmer, sparkle);
  return reverb(raw, 0.12, 0.35);
}

function fail() {
  // 沉闷下行音
  const dur = 0.6;
  return generate(dur, (t) => {
    const env = envelope(t, 0.01, 0.15, 0.3, 0.3, dur);
    const freq = 300 - 100 * (t / dur);
    return (sine(freq, t) * 0.4 + sine(freq * 0.5, t) * 0.3) * env * 0.5;
  });
}

function hpLoss() {
  // 蜡烛熄灭 - 呼气 + 低频共鸣
  const dur = 1.2;
  const breath = generate(dur, (t) => {
    const env = envelope(t, 0.05, 0.3, 0.2, 0.5, dur);
    return noise() * env * 0.3;
  });
  const filtered = lowpass(breath, 800);
  const rumble = generate(dur, (t) => {
    const env = envelope(t, 0.1, 0.3, 0.4, 0.5, dur);
    return (sine(60, t) + sine(90, t) * 0.5) * env * 0.4;
  });
  const descend = generate(dur, (t) => {
    const env = envelope(t, 0.02, 0.2, 0.2, 0.4, dur);
    const freq = 400 * Math.exp(-t * 2);
    return sine(freq, t) * env * 0.2;
  });
  return mix(filtered, rumble, descend);
}

function gainBook() {
  // 光芒 + 书页 - 收获感
  const dur = 1.0;
  const chime = generate(dur, (t) => {
    const env = envelope(t, 0.01, 0.1, 0.4, 0.4, dur);
    return (sine(659, t) * 0.3 + sine(784, t) * 0.25 + sine(988, t) * 0.15) * env;
  });
  const sweep = generate(dur, (t) => {
    const env = envelope(t, 0.05, 0.15, 0.2, 0.4, dur);
    return noise() * env * 0.1;
  });
  const raw = mix(chime, lowpass(sweep, 2000));
  return reverb(raw, 0.08, 0.25);
}

function uiClick() {
  // 极简点击
  const dur = 0.1;
  return generate(dur, (t) => {
    const env = envelope(t, 0.001, 0.02, 0.1, 0.05, dur);
    return sine(1000, t) * env * 0.4;
  });
}

// ===== 写入文件 =====

const effects = {
  page_turn: pageTurn(),
  book_select: bookSelect(),
  book_use: bookUse(),
  move_node: moveNode(),
  success: success(),
  super_match: superMatch(),
  fail: fail(),
  hp_loss: hpLoss(),
  gain_book: gainBook(),
  ui_click: uiClick(),
};

for (const [name, samples] of Object.entries(effects)) {
  // 归一化
  let peak = 0;
  for (let i = 0; i < samples.length; i++) {
    peak = Math.max(peak, Math.abs(samples[i]));
  }
  if (peak > 0) {
    const scale = 0.85 / peak;
    for (let i = 0; i < samples.length; i++) samples[i] *= scale;
  }

  const outPath = join(OUT_DIR, `${name}.wav`);
  writeFileSync(outPath, encodeWav(samples));
  const kb = (encodeWav(samples).length / 1024).toFixed(1);
  console.log(`  ${name}.wav  (${(samples.length / SAMPLE_RATE).toFixed(2)}s, ${kb} KB)`);
}

console.log(`\n✅ ${Object.keys(effects).length} sound effects generated in ${OUT_DIR}/`);
