/**
 * F4.4 / §3.4: web feedback for alarm toggles. Local notifications do not
 * exist in the browser, so the meteor bell at least plays a short ding and
 * points the user at the mobile app. Kept dependency-free (Web Audio API)
 * and fully guarded — audio support is optional, never an error path.
 */

let audioContext: AudioContext | null = null;

const getContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  try {
    const Ctor = window.AudioContext
      ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    audioContext = audioContext ?? new Ctor();
    if (audioContext.state === 'suspended') void audioContext.resume();
    return audioContext;
  } catch {
    return null;
  }
};

export const playBellTone = (volume = 0.2): boolean => {
  const context = getContext();
  if (!context) return false;
  try {
    // Two harmonics a fifth apart give a small bell-like ding.
    [880, 1320].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      const start = context.currentTime + index * 0.005;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(index === 0 ? volume : volume * 0.4, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.6);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.65);
    });
    return true;
  } catch {
    return false;
  }
};
