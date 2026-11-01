'use client'

import { useEffect, useState } from 'react'
import { GraduationCap, Sparkles, CheckCircle2 } from 'lucide-react'

export default function Preloader() {
  const [visible, setVisible] = useState(false)
  const [fading, setFading] = useState(false)
  const [progress, setProgress] = useState(15)

  useEffect(() => {
    // Check if user already saw the preloader in this session
    try {
      const seen = sessionStorage.getItem('sibaq_preloader_seen')
      if (seen) {
        return
      }
    } catch {
      // In case sessionStorage is blocked or unavailable
    }

    setVisible(true)

    const step1 = setTimeout(() => setProgress(45), 250)
    const step2 = setTimeout(() => setProgress(80), 600)
    const step3 = setTimeout(() => setProgress(100), 950)

    const fadeTimer = setTimeout(() => {
      setFading(true)
    }, 1200)

    const closeTimer = setTimeout(() => {
      setVisible(false)
      try {
        sessionStorage.setItem('sibaq_preloader_seen', 'true')
      } catch {
        // ignore
      }
    }, 1500)

    return () => {
      clearTimeout(step1)
      clearTimeout(step2)
      clearTimeout(step3)
      clearTimeout(fadeTimer)
      clearTimeout(closeTimer)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900 transition-opacity duration-300 ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ backdropFilter: 'blur(12px)' }}
    >
      <div className="relative flex flex-col items-center px-6 max-w-sm text-center">
        {/* Glow halo */}
        <div className="absolute -inset-8 bg-sky-500/20 rounded-full blur-2xl animate-pulse" />

        {/* Emblem */}
        <div className="relative mb-5 flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-sky-400 via-sky-600 to-indigo-700 shadow-2xl border-2 border-white/20">
          <GraduationCap className="w-10 h-10 text-white drop-shadow-md animate-bounce" />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
        </div>

        {/* Title */}
        <h1 className="relative text-2xl font-black text-white tracking-tight mb-1">
          SIBAQ &apos;26 HUB
        </h1>
        <p className="relative text-xs font-semibold text-sky-300/90 tracking-wide uppercase mb-6">
          Aliyah &amp; Kulliyyah Assessment Engine
        </p>

        {/* Progress Bar */}
        <div className="relative w-56 h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/80 mb-3 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-sky-400 via-emerald-400 to-indigo-400 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Subtitle / status */}
        <div className="relative flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
          {progress < 100 ? (
            <>
              <div className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
              <span>Grounding AI Olympiad Models... {progress}%</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-bold">Ready</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
