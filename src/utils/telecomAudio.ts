// Web Audio API Telecom Sound Synthesizer (Ringback tone, DTMF dual tones, Disconnect tone)

let audioCtx: AudioContext | null = null;
let ringInterval: any = null;
let activeOscillators: OscillatorNode[] = [];

function getAudioContext(): AudioContext | null {
  try {
    if (typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!audioCtx || audioCtx.state === 'closed') {
      audioCtx = new AudioCtx();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Standard telephone ringback tone: 440Hz + 480Hz dual sine tones
 * Rhythms: 1.6s ring, 2.0s silence
 */
export function startRingbackTone() {
  stopRingbackTone();
  const ctx = getAudioContext();
  if (!ctx) return;

  const playSingleRing = () => {
    try {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(440, now);
      osc2.frequency.setValueAtTime(480, now);

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.08, now + 0.05);
      gainNode.gain.setValueAtTime(0.08, now + 1.55);
      gainNode.gain.linearRampToValueAtTime(0, now + 1.6);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.65);
      osc2.stop(now + 1.65);

      activeOscillators.push(osc1, osc2);
    } catch {
      // Audio autoplay policy fallback
    }
  };

  playSingleRing();
  ringInterval = setInterval(playSingleRing, 3600);
}

export function stopRingbackTone() {
  if (ringInterval) {
    clearInterval(ringInterval);
    ringInterval = null;
  }
  activeOscillators.forEach((osc) => {
    try {
      osc.stop();
      osc.disconnect();
    } catch {
      // already stopped
    }
  });
  activeOscillators = [];
}

/**
 * DTMF standard keypad dual frequency pairs
 */
const DTMF_FREQS: Record<string, [number, number]> = {
  '1': [697, 1209],
  '2': [697, 1336],
  '3': [697, 1477],
  '4': [770, 1209],
  '5': [770, 1336],
  '6': [770, 1477],
  '7': [852, 1209],
  '8': [852, 1336],
  '9': [852, 1477],
  '*': [941, 1209],
  '0': [941, 1336],
  '#': [941, 1477]
};

export function playDtmfTone(digit: string) {
  const ctx = getAudioContext();
  if (!ctx) return;
  const freqs = DTMF_FREQS[digit];
  if (!freqs) return;

  try {
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(freqs[0], now);
    osc2.frequency.setValueAtTime(freqs[1], now);

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.12, now + 0.02);
    gainNode.gain.setValueAtTime(0.12, now + 0.16);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.18);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.2);
    osc2.stop(now + 0.2);
  } catch {
    // audio policy
  }
}

export function playCallEndedTone() {
  stopRingbackTone();
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(425, now);

    gainNode.gain.setValueAtTime(0.1, now);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.35);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  } catch {
    // ignore
  }
}
