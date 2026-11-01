'use client'

import { useState } from 'react'
import { IFlashcard } from '@/models'
import { BookOpen, Lightbulb, RotateCcw, CheckCircle2 } from 'lucide-react'

interface FlipFlashcardProps {
  card: IFlashcard
  onGotIt?: () => void
  onReviewAgain?: () => void
  cardNumber?: number
  total?: number
}

export default function FlipFlashcard({
  card,
  onGotIt,
  onReviewAgain,
  cardNumber = 1,
  total = 1,
}: FlipFlashcardProps) {
  const [flipped, setFlipped] = useState(false)

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-3 text-xs text-slate-400 font-bold">
        <span>Card {cardNumber} of {total}</span>
        <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-xl text-[10px] uppercase tracking-wider font-mono">
          {card.tag}
        </span>
      </div>

      {/* 3D flip card */}
      <div
        className="relative cursor-pointer select-none"
        style={{ perspective: '1000px' }}
        onClick={() => setFlipped(!flipped)}
      >
        <div
          style={{
            transformStyle: 'preserve-3d',
            transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            minHeight: '220px',
            position: 'relative',
          }}
        >
          {/* Front */}
          <div
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
            className="absolute inset-0 bg-white rounded-3xl border-2 border-slate-200 border-b-6 border-b-slate-300 p-6 flex flex-col items-center justify-center text-center shadow-sm"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#FAF9F6] border border-slate-200 flex items-center justify-center mb-3">
              <BookOpen className="w-6 h-6 text-[#5F4BB6]" strokeWidth={1.75} />
            </div>
            <p className="text-slate-800 font-black text-base sm:text-lg leading-snug">
              {card.front}
            </p>
            <p className="text-[11px] text-slate-400 font-medium mt-4">
              Tap anywhere to reveal answer
            </p>
          </div>

          {/* Back */}
          <div
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
            className="absolute inset-0 bg-[#00A896]/10 rounded-3xl border-2 border-[#00A896]/40 border-b-6 border-b-[#00A896] p-6 flex flex-col items-center justify-center text-center shadow-sm"
          >
            <div className="w-12 h-12 rounded-2xl bg-white border border-[#00A896]/30 flex items-center justify-center mb-3">
              <Lightbulb className="w-6 h-6 text-[#00A896]" strokeWidth={1.75} />
            </div>
            <p className="text-[#1E2538] font-black text-base sm:text-lg leading-snug">
              {card.back}
            </p>
          </div>
        </div>
      </div>

      {/* Action buttons — only shown after flip */}
      <div
        className={`flex gap-3 mt-4 transition-opacity duration-300 ${
          flipped ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <button
          onClick={onReviewAgain}
          className="flex-1 py-3 rounded-2xl bg-white border-2 border-slate-200 border-b-4 border-b-slate-300 text-slate-700 font-black text-xs hover:bg-slate-50 active:translate-y-[1px] transition-all flex items-center justify-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Review Again</span>
        </button>

        <button
          onClick={() => {
            setFlipped(false)
            onGotIt?.()
          }}
          className="flex-1 py-3 rounded-2xl bg-[#00A896] hover:bg-[#008E7E] text-white font-black text-xs border-2 border-[#008E7E] border-b-4 border-b-[#007063] active:translate-y-[1px] transition-all flex items-center justify-center gap-1.5 shadow-sm"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Got It</span>
        </button>
      </div>
    </div>
  )
}
