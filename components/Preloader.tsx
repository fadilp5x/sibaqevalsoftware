'use client'

import { useEffect, useState } from 'react'
import { Sparkles, CheckCircle2 } from 'lucide-react'

export default function Preloader() {
  const [visible, setVisible] = useState(false)
  const [fading, setFading] = useState(false)
  const [progress, setProgress] = useState(15)

  useEffect(() => {
    try {
      const seen = sessionStorage.getItem('sst_preloader_seen')
      if (seen) return
    } catch {
      // ignore
    }

    setVisible(true)

    const s1 = setTimeout(() => setProgress(45), 250)
    const s2 = setTimeout(() => setProgress(82), 600)
    const s3 = setTimeout(() => setProgress(100), 950)

    const fadeTimer = setTimeout(() => setFading(true), 1200)
    const closeTimer = setTimeout(() => {
      setVisible(false)
      try {
        sessionStorage.setItem('sst_preloader_seen', 'true')
      } catch {
        // ignore
      }
    }, 1500)

    return () => {
      clearTimeout(s1)
      clearTimeout(s2)
      clearTimeout(s3)
      clearTimeout(fadeTimer)
      clearTimeout(closeTimer)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#1E2538] transition-opacity duration-300 ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ backdropFilter: 'blur(12px)' }}
    >
      <div className="relative flex flex-col items-center px-6 max-w-sm text-center">
        {/* Glow */}
        <div className="absolute -inset-10 bg-[#FF6B4A]/15 rounded-full blur-3xl animate-pulse pointer-events-none" />

        {/* Monogram Badge */}
        <div className="relative mb-5 flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-[#2A334C] to-[#161B29] border-2 border-[#FF6B4A]/40 shadow-2xl">
          <span className="text-3xl font-black text-white tracking-tighter">SST</span>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#FF6B4A] border-2 border-[#1E2538] flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white stroke-[2.5]" />
          </div>
        </div>

        {/* Title */}
        <h1 className="relative text-xl font-black text-white tracking-tight mb-0.5">
          SHIA SIBAQ TRAINING
        </h1>
        <p className="relative text-[11px] font-bold text-[#8B95A5] uppercase tracking-widest mb-6">
          Champion Performance Hub
        </p>

        {/* Progress Bar (Persimmon Coral) */}
        <div className="relative w-56 h-2 bg-white/10 rounded-full overflow-hidden border border-white/10 mb-3 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-[#FF6B4A] via-[#FF8A65] to-[#00A896] rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Status text */}
        <div className="relative flex items-center gap-2 text-[11px] font-mono text-[#8B95A5]">
          {progress < 100 ? (
            <>
              <div className="w-2 h-2 rounded-full bg-[#FF6B4A] animate-ping" />
              <span>Grounding AI Models... {progress}%</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#00A896]" />
              <span className="text-[#00A896] font-bold">Ready</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
