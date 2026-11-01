'use client'

import { useEffect, useState } from 'react'
import { Shield } from 'lucide-react'
import { playStartupChime } from '@/lib/sounds'

const TIPS = [
  'SYNCING CAMPUS ROSTER...',
  'LOADING BENCHMARK DATASETS...',
  'READY TO TRAIN CHAMPIONS!',
]

export default function Preloader() {
  const [visible, setVisible] = useState(false)
  const [fading, setFading] = useState(false)
  const [progress, setProgress] = useState(15)
  const [tipIndex, setTipIndex] = useState(0)

  useEffect(() => {
    try {
      const seen = sessionStorage.getItem('sst_preloader_seen')
      if (seen) return
    } catch {
      // ignore
    }

    setVisible(true)

    const t1 = setTimeout(() => {
      setProgress(48)
      setTipIndex(1)
    }, 450)

    const t2 = setTimeout(() => {
      setProgress(88)
      setTipIndex(2)
    }, 950)

    const t3 = setTimeout(() => {
      setProgress(100)
      playStartupChime()
    }, 1400)

    const fadeTimer = setTimeout(() => setFading(true), 1700)
    const closeTimer = setTimeout(() => {
      setVisible(false)
      try {
        sessionStorage.setItem('sst_preloader_seen', 'true')
      } catch {
        // ignore
      }
    }, 2000)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(fadeTimer)
      clearTimeout(closeTimer)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-white transition-opacity duration-300 select-none ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <style jsx>{`
        @keyframes duoSquashBounce {
          0%, 100% {
            transform: translateY(0) scale(1, 1);
          }
          30% {
            transform: translateY(-18px) scale(0.95, 1.06);
          }
          50% {
            transform: translateY(0) scale(1.08, 0.92);
          }
          70% {
            transform: translateY(-7px) scale(0.98, 1.02);
          }
          85% {
            transform: translateY(0) scale(1.02, 0.98);
          }
        }
        .duo-bounce {
          animation: duoSquashBounce 1.4s ease-in-out infinite;
        }
      `}</style>

      <div className="flex flex-col items-center px-6 max-w-sm text-center">
        {/* Tactile 3D Feather Green Bouncing Emblem */}
        <div className="duo-bounce mb-7">
          <div className="relative w-24 h-24 rounded-3xl bg-[#58CC02] border-2 border-[#58A700] border-b-[8px] flex flex-col items-center justify-center shadow-sm">
            <Shield className="w-9 h-9 text-white stroke-[2.5] mb-0.5" />
            <span className="text-xl font-black text-white tracking-wider leading-none">
              SST
            </span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-black text-[#4B4B4B] tracking-wide mb-1 uppercase">
          SHIA SIBAQ TRAINING
        </h1>
        <p className="text-xs font-extrabold text-[#777777] uppercase tracking-widest mb-6">
          AL-ALIYAH ASSESSMENT HUB
        </p>

        {/* Chunky 3D Duolingo Progress Track */}
        <div className="relative w-64 h-5 bg-[#E5E5E5] rounded-full p-1 border-2 border-[#E5E5E5] mb-4">
          <div
            className="h-full bg-[#58CC02] rounded-full transition-all duration-300 ease-out relative overflow-hidden"
            style={{ width: `${progress}%` }}
          >
            {/* Duolingo signature white top highlight reflection */}
            <div className="bg-white/35 h-1.5 rounded-full mx-1.5 mt-0.5" />
          </div>
        </div>

        {/* Snappy tip text */}
        <div className="text-xs font-black text-[#777777] uppercase tracking-wider h-5">
          {TIPS[tipIndex]}
        </div>
      </div>
    </div>
  )
}
