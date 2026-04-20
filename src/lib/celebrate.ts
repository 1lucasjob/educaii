import confetti from "canvas-confetti";

/** Standard confetti for normal achievements / wins */
export const fireConfetti = () => {
  const defaults = { startVelocity: 35, spread: 360, ticks: 70, zIndex: 9999, scalar: 1.1 };
  const colors = ["hsl(var(--primary))", "#fbbf24", "#34d399", "#60a5fa", "#f472b6"];
  confetti({ ...defaults, particleCount: 80, origin: { x: 0.2, y: 0.6 }, colors });
  confetti({ ...defaults, particleCount: 80, origin: { x: 0.8, y: 0.6 }, colors });
  setTimeout(() => {
    confetti({ ...defaults, particleCount: 120, origin: { x: 0.5, y: 0.5 }, colors });
  }, 200);
};

/** Epic confetti for SECRET achievements: golden, multi-stage, with stars */
export const fireEpicConfetti = () => {
  const gold = ["#FFD700", "#FFC300", "#FFAA00", "#FFEC8B", "#FFFACD", "#FFFFFF"];

  // Stage 1: massive golden burst from center
  confetti({
    particleCount: 200,
    spread: 100,
    startVelocity: 55,
    ticks: 200,
    zIndex: 9999,
    scalar: 1.4,
    origin: { x: 0.5, y: 0.55 },
    colors: gold,
    shapes: ["circle", "square"],
  });

  // Stage 2: side cannons of stars
  setTimeout(() => {
    confetti({
      particleCount: 120,
      angle: 60,
      spread: 70,
      startVelocity: 70,
      ticks: 220,
      zIndex: 9999,
      scalar: 1.2,
      origin: { x: 0, y: 0.7 },
      colors: gold,
      shapes: ["star"],
    });
    confetti({
      particleCount: 120,
      angle: 120,
      spread: 70,
      startVelocity: 70,
      ticks: 220,
      zIndex: 9999,
      scalar: 1.2,
      origin: { x: 1, y: 0.7 },
      colors: gold,
      shapes: ["star"],
    });
  }, 250);

  // Stage 3: gentle golden rain from the top
  let frame = 0;
  const rain = setInterval(() => {
    frame++;
    confetti({
      particleCount: 8,
      spread: 180,
      startVelocity: 25,
      ticks: 260,
      gravity: 0.6,
      zIndex: 9999,
      scalar: 1.1,
      origin: { x: Math.random(), y: -0.05 },
      colors: gold,
      shapes: ["star", "circle"],
    });
    if (frame > 14) clearInterval(rain);
  }, 120);

  // Final flourish
  setTimeout(() => {
    confetti({
      particleCount: 250,
      spread: 360,
      startVelocity: 45,
      ticks: 300,
      zIndex: 9999,
      scalar: 1.5,
      origin: { x: 0.5, y: 0.5 },
      colors: gold,
      shapes: ["star"],
    });
  }, 1800);
};

// ===================== AUDIO =====================

let audioCtx: AudioContext | null = null;
const getCtx = (): AudioContext | null => {
  if (typeof window === "undefined") return null;
  if (audioCtx && audioCtx.state !== "closed") return audioCtx;
  const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  audioCtx = new Ctor();
  return audioCtx;
};

const playNote = (
  ctx: AudioContext,
  freq: number,
  start: number,
  duration: number,
  type: OscillatorType = "triangle",
  gainPeak = 0.18,
) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
  gain.gain.setValueAtTime(0.0001, ctx.currentTime + start);
  gain.gain.exponentialRampToValueAtTime(gainPeak, ctx.currentTime + start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(ctx.currentTime + start);
  osc.stop(ctx.currentTime + start + duration + 0.05);
};

/** Short sparkle for normal achievements */
export const playAchievementSound = () => {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  // C E G arpeggio
  const notes = [523.25, 659.25, 783.99];
  notes.forEach((f, i) => playNote(ctx, f, i * 0.08, 0.25, "triangle", 0.15));
};

/** Epic fanfare for SECRET achievements — heroic chord progression + sparkles */
export const playSecretAchievementSound = () => {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});

  // Heroic ascending arpeggio (C major → G → C5 high)
  // C4, E4, G4, C5, E5, G5, C6
  const arp = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.5];
  arp.forEach((f, i) => playNote(ctx, f, i * 0.07, 0.32, "triangle", 0.18));

  // Sustained chord (C major) underneath
  const chord = [261.63, 329.63, 392.0];
  chord.forEach((f) => playNote(ctx, f, 0.55, 1.4, "sine", 0.12));

  // High shimmering bell on top after the arpeggio
  setTimeout(() => {
    const sparkles = [1568.0, 1760.0, 2093.0, 1760.0, 2349.32];
    sparkles.forEach((f, i) => playNote(ctx, f, i * 0.09, 0.22, "sine", 0.09));
  }, 700);

  // Final triumphant punch
  setTimeout(() => {
    playNote(ctx, 523.25, 0, 0.6, "triangle", 0.22);
    playNote(ctx, 659.25, 0, 0.6, "triangle", 0.18);
    playNote(ctx, 783.99, 0, 0.6, "triangle", 0.16);
    playNote(ctx, 1046.5, 0, 0.8, "sine", 0.12);
  }, 1500);
};
