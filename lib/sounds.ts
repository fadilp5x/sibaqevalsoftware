// Web Audio API synthesizer — client-only (guard with typeof window check)
// Inspired by Duolingo's sound feedback system

let audioCtx: AudioContext | null = null
let isMuted = false

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
  }
  return audioCtx
}

function playTone(
  freq: number,
  startTime: number,
  duration: number,
  type: OscillatorType = 'sine',
  gain: number = 0.3
): void {
  const ctx = getCtx()
  if (!ctx) return

  const osc = ctx.createOscillator()
  const gainNode = ctx.createGain()

  osc.connect(gainNode)
  gainNode.connect(ctx.destination)

  osc.type = type
  osc.frequency.setValueAtTime(freq, startTime)

  gainNode.gain.setValueAtTime(gain, startTime)
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration)

  osc.start(startTime)
  osc.stop(startTime + duration + 0.05)
}

/** Bright Duolingo-style correct arpeggio: E5 → G#5 → B5 */
export function playCorrectSound(): void {
  if (isMuted) return
  const ctx = getCtx()
  if (!ctx) return

  const now = ctx.currentTime
  playTone(659.25, now, 0.12, 'sine', 0.35)        // E5
  playTone(830.61, now + 0.09, 0.12, 'sine', 0.3)  // G#5
  playTone(987.77, now + 0.18, 0.2, 'sine', 0.25)  // B5
}

/** Soft low buzzer thud: F3 → D3 */
export function playWrongSound(): void {
  if (isMuted) return
  const ctx = getCtx()
  if (!ctx) return

  const now = ctx.currentTime
  playTone(174.61, now, 0.15, 'sawtooth', 0.2)     // F3
  playTone(146.83, now + 0.12, 0.25, 'sawtooth', 0.15) // D3
}

/** Celebratory chord + confetti: C5 + E5 + G5 */
export async function playFinishFanfare(): Promise<void> {
  if (!isMuted) {
    const ctx = getCtx()
    if (ctx) {
      const now = ctx.currentTime
      playTone(523.25, now, 0.5, 'sine', 0.3)        // C5
      playTone(659.25, now, 0.5, 'sine', 0.25)       // E5
      playTone(783.99, now, 0.5, 'sine', 0.2)        // G5
      playTone(1046.5, now + 0.3, 0.4, 'sine', 0.15) // C6 accent
    }
  }

  // Canvas confetti
  if (typeof window !== 'undefined') {
    try {
      const confetti = (await import('canvas-confetti')).default
      confetti({ particleCount: 140, spread: 80, origin: { y: 0.6 }, colors: ['#58CC02', '#1CB0F6', '#FFC800', '#CE82FF'] })
      setTimeout(() => {
        confetti({ particleCount: 60, spread: 50, origin: { x: 0.1, y: 0.5 } })
        confetti({ particleCount: 60, spread: 50, origin: { x: 0.9, y: 0.5 } })
      }, 300)
    } catch {
      // confetti is optional
    }
  }
}

export function toggleMute(): boolean {
  isMuted = !isMuted
  return isMuted
}

export function getMuted(): boolean {
  return isMuted
}

/** React hook for mute control */
export function useSounds() {
  if (typeof window === 'undefined') {
    return {
      muted: false,
      toggleMute: () => false,
      playCorrect: () => {},
      playWrong: () => {},
      playFanfare: () => Promise.resolve(),
    }
  }

  return {
    muted: isMuted,
    toggleMute: () => toggleMute(),
    playCorrect: playCorrectSound,
    playWrong: playWrongSound,
    playFanfare: playFinishFanfare,
  }
}
