// Web Audio API synthesizer — pure Web Audio, zero external MP3s
// Designed with authentic Duolingo sonic feedback

let audioCtx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    if (!audioCtx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass()
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {})
    }
    return audioCtx
  } catch {
    return null
  }
}

if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {})
    }
    window.removeEventListener('pointerdown', unlockAudio)
    window.removeEventListener('keydown', unlockAudio)
    window.removeEventListener('touchstart', unlockAudio)
  }
  window.addEventListener('pointerdown', unlockAudio, { passive: true })
  window.addEventListener('keydown', unlockAudio, { passive: true })
  window.addEventListener('touchstart', unlockAudio, { passive: true })
}

export function isMuted(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem('sst_muted') === 'true'
  } catch {
    return false
  }
}

export function toggleMute(): boolean {
  if (typeof window === 'undefined') return false
  const current = isMuted()
  const next = !current
  try {
    localStorage.setItem('sst_muted', String(next))
    window.dispatchEvent(new Event('sst-mute-change'))
  } catch {
    // ignore
  }
  return next
}

export function getMuted(): boolean {
  return isMuted()
}

/** Short, tactile 40ms woody pop (320Hz -> 180Hz) on 3D buttons, tabs, pills */
export function playClickPop(): void {
  if (isMuted()) return
  const ctx = getCtx()
  if (!ctx) return

  const now = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = 'triangle'
  osc.frequency.setValueAtTime(320, now)
  osc.frequency.exponentialRampToValueAtTime(180, now + 0.04)

  gain.gain.setValueAtTime(0.25, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04)

  osc.connect(gain)
  gain.connect(ctx.destination)

  osc.start(now)
  osc.stop(now + 0.05)
}

/** Crisp upward blip (440Hz -> 587Hz) when selecting MCQ option */
export function playSelectOption(): void {
  if (isMuted()) return
  const ctx = getCtx()
  if (!ctx) return

  const now = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = 'sine'
  osc.frequency.setValueAtTime(440, now)
  osc.frequency.exponentialRampToValueAtTime(587.33, now + 0.06)

  gain.gain.setValueAtTime(0.3, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07)

  osc.connect(gain)
  gain.connect(ctx.destination)

  osc.start(now)
  osc.stop(now + 0.08)
}

/** Soft marimba-like tick (660Hz) when a generation pipeline stage finishes */
export function playStepTick(): void {
  if (isMuted()) return
  const ctx = getCtx()
  if (!ctx) return

  const now = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = 'triangle'
  osc.frequency.setValueAtTime(659.25, now)
  gain.gain.setValueAtTime(0.3, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)

  osc.connect(gain)
  gain.connect(ctx.destination)

  osc.start(now)
  osc.stop(now + 0.09)
}

/** Iconic Duolingo two-tone major chime: E5 -> B5 */
export function playCorrectSound(): void {
  if (isMuted()) return
  const ctx = getCtx()
  if (!ctx) return

  const now = ctx.currentTime

  // First chime: E5 (659.25Hz)
  const osc1 = ctx.createOscillator()
  const gain1 = ctx.createGain()
  osc1.type = 'triangle'
  osc1.frequency.setValueAtTime(659.25, now)
  gain1.gain.setValueAtTime(0.35, now)
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18)
  osc1.connect(gain1)
  gain1.connect(ctx.destination)
  osc1.start(now)
  osc1.stop(now + 0.19)

  // Second chime: B5 (987.77Hz)
  const osc2 = ctx.createOscillator()
  const gain2 = ctx.createGain()
  osc2.type = 'triangle'
  osc2.frequency.setValueAtTime(987.77, now + 0.1)
  gain2.gain.setValueAtTime(0.4, now + 0.1)
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35)
  osc2.connect(gain2)
  gain2.connect(ctx.destination)
  osc2.start(now + 0.1)
  osc2.stop(now + 0.36)
}

/** Iconic Duolingo low double-thud: F3 -> C#3 */
export function playWrongSound(): void {
  if (isMuted()) return
  const ctx = getCtx()
  if (!ctx) return

  const now = ctx.currentTime

  // Thud 1: F3 (174.61Hz)
  const osc1 = ctx.createOscillator()
  const gain1 = ctx.createGain()
  osc1.type = 'sawtooth'
  osc1.frequency.setValueAtTime(174.61, now)
  gain1.gain.setValueAtTime(0.25, now)
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15)
  osc1.connect(gain1)
  gain1.connect(ctx.destination)
  osc1.start(now)
  osc1.stop(now + 0.16)

  // Thud 2: C#3 (138.59Hz)
  const osc2 = ctx.createOscillator()
  const gain2 = ctx.createGain()
  osc2.type = 'sawtooth'
  osc2.frequency.setValueAtTime(138.59, now + 0.12)
  gain2.gain.setValueAtTime(0.28, now + 0.12)
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.32)
  osc2.connect(gain2)
  gain2.connect(ctx.destination)
  osc2.start(now + 0.12)
  osc2.stop(now + 0.33)
}

/** 4-note ascending celebratory arpeggio (C5 -> E5 -> G5 -> C6) + confetti */
export async function playVictoryFanfare(): Promise<void> {
  if (!isMuted()) {
    const ctx = getCtx()
    if (ctx) {
      const now = ctx.currentTime
      const notes = [
        { freq: 523.25, time: 0, dur: 0.18 }, // C5
        { freq: 659.25, time: 0.12, dur: 0.18 }, // E5
        { freq: 783.99, time: 0.24, dur: 0.22 }, // G5
        { freq: 1046.5, time: 0.36, dur: 0.6 }, // C6
      ]

      notes.forEach(({ freq, time, dur }) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(freq, now + time)
        gain.gain.setValueAtTime(0.35, now + time)
        gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + time)
        osc.stop(now + time + dur + 0.05)
      })
    }
  }

  // Trigger canvas-confetti with Duolingo colors
  if (typeof window !== 'undefined') {
    try {
      const confetti = (await import('canvas-confetti')).default
      confetti({
        particleCount: 120,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#58CC02', '#1CB0F6', '#FFC800', '#FF9600', '#CE82FF'],
      })
      setTimeout(() => {
        confetti({
          particleCount: 60,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#58CC02', '#1CB0F6', '#FFC800', '#FF9600'],
        })
        confetti({
          particleCount: 60,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#58CC02', '#1CB0F6', '#FFC800', '#FF9600'],
        })
      }, 250)
    } catch {
      // confetti is optional enhancement
    }
  }
}

/** Preloader completion pop/chime */
export function playStartupChime(): void {
  if (isMuted()) return
  const ctx = getCtx()
  if (!ctx) return

  const now = ctx.currentTime
  const osc1 = ctx.createOscillator()
  const gain1 = ctx.createGain()
  osc1.type = 'sine'
  osc1.frequency.setValueAtTime(523.25, now)
  gain1.gain.setValueAtTime(0.2, now)
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12)
  osc1.connect(gain1)
  gain1.connect(ctx.destination)
  osc1.start(now)
  osc1.stop(now + 0.13)

  const osc2 = ctx.createOscillator()
  const gain2 = ctx.createGain()
  osc2.type = 'sine'
  osc2.frequency.setValueAtTime(783.99, now + 0.08)
  gain2.gain.setValueAtTime(0.3, now + 0.08)
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
  osc2.connect(gain2)
  gain2.connect(ctx.destination)
  osc2.start(now + 0.08)
  osc2.stop(now + 0.31)
}

/** Alias for backward compatibility */
export const playFinishFanfare = playVictoryFanfare
