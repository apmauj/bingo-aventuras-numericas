// ============================================================
// Sound Effects — Web Audio API (no external files needed)
// Synthesized sounds for game events, great for children!
// ============================================================

'use client';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (!audioCtx) {
    try {
      audioCtx = new (window as any).AudioContext() || new (window as any).webkitAudioContext();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch {
    // Silently fail — sound is non-essential
  }
}

function playChime(notes: number[], noteDuration: number = 0.15, type: OscillatorType = 'sine', volume: number = 0.25) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    notes.forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(freq, ctx.currentTime + i * noteDuration);

      const startTime = ctx.currentTime + i * noteDuration;
      gainNode.gain.setValueAtTime(volume, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + noteDuration * 2);

      oscillator.start(startTime);
      oscillator.stop(startTime + noteDuration * 2);
    });
  } catch {
    // Silently fail
  }
}

/**
 * Sound when a new number is called — quick ascending ding
 */
export function playNumberCalled() {
  playChime([523, 659], 0.12, 'sine', 0.2); // C5 → E5 quick ding
}

/**
 * Sound when student correctly marks a number — happy chime
 */
export function playCorrect() {
  playChime([523, 659, 784], 0.15, 'sine', 0.25); // C5 → E5 → G5 major chord
}

/**
 * Sound when student incorrectly marks a number — gentle low tone
 */
export function playIncorrect() {
  playTone(220, 0.3, 'triangle', 0.15); // Low A — gentle, not harsh
}

/**
 * Sound when a line is completed — triumphant ascending arpeggio
 */
export function playLineCompleted() {
  playChime([523, 659, 784, 1047], 0.12, 'sine', 0.3); // C5 → E5 → G5 → C6
}

/**
 * Sound when BINGO is achieved — fanfare!
 */
export function playBingo() {
  playChime([523, 659, 784, 1047, 1319, 1568], 0.1, 'sine', 0.35); // Full major arpeggio up
  // Followed by a quick repeat
  setTimeout(() => {
    playChime([1047, 1319, 1568], 0.12, 'triangle', 0.3);
  }, 700);
}

/**
 * Sound when joining a room — friendly welcome
 */
export function playJoined() {
  playChime([440, 554], 0.15, 'sine', 0.15); // A4 → C#5
}

/**
 * Resume audio context (needed after user gesture on mobile)
 */
export function resumeAudio() {
  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
  } catch {
    // Silently fail
  }
}

// ========== TTS (Text-to-Speech) ==========

let ttsEnabled = true;

/**
 * Enable or disable TTS. Can be toggled by the user.
 */
export function setTtsEnabled(enabled: boolean) {
  ttsEnabled = enabled;
}

/**
 * Check if TTS is currently enabled.
 */
export function isTtsEnabled(): boolean {
  return ttsEnabled;
}

/**
 * Speak a number aloud using the Web Speech API.
 * Uses a Spanish voice at a slow rate and higher pitch,
 * making it friendly and understandable for children aged 6-8.
 *
 * @param number - The number to pronounce
 */
export function speakNumber(number: number | string) {
  if (!ttsEnabled) return;
  if (typeof window === 'undefined') return;
  if (!('speechSynthesis' in window)) return;

  try {
    const utterance = new SpeechSynthesisUtterance(String(number));
    utterance.lang = 'es-ES';
    utterance.rate = 0.8;   // Slower for kids
    utterance.pitch = 1.2;  // Higher, friendly voice
    utterance.volume = 1;

    // Try to find a Spanish voice
    const voices = speechSynthesis.getVoices();
    const spanishVoice = voices.find(v => v.lang.startsWith('es'));
    if (spanishVoice) utterance.voice = spanishVoice;

    speechSynthesis.cancel(); // Cancel any ongoing speech
    speechSynthesis.speak(utterance);
  } catch {
    // Silently fail — TTS is non-essential
  }
}
