'use client'

import { useState } from 'react'
import { IFlashcard } from '@/models'
import TactileButton from '@/components/ui/TactileButton'

interface FlipFlashcardProps {
  card: IFlashcard
  onGotIt: () => void
  onReviewAgain: () => void
  cardNumber: number
  total: number
}

export default function FlipFlashcard({ card, onGotIt, onReviewAgain, cardNumber, total }: FlipFlashcardProps) {
  const [flipped, setFlipped] = useState(false)

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
        <span>Card {cardNumber} of {total}</span>
        <span className="bg-slate-100 px-2 py-1 rounded-lg font-medium">{card.tag}</span>
      </div>

      {/* 3D flip card */}
      <div
        className="relative cursor-pointer"
        style={{ perspective: '1000px' }}
        onClick={() => setFlipped(!flipped)}
      >
        <div
          style={{
            transformStyle: 'preserve-3d',
            transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            minHeight: '200px',
            position: 'relative',
          }}
        >
          {/* Front */}
          <div
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
            className="absolute inset-0 bg-white rounded-2xl border-2 border-sky-300 border-b-4 border-b-sky-500 p-6 flex flex-col items-center justify-center text-center shadow-sm"
          >
            <div className="text-3xl mb-3">🃏</div>
            <p className="text-slate-700 font-semibold text-lg leading-snug">{card.front}</p>
            <p className="text-xs text-slate-400 mt-4">Tap to reveal answer</p>
          </div>

          {/* Back */}
          <div
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
            className="absolute inset-0 bg-sky-50 rounded-2xl border-2 border-sky-400 border-b-4 border-b-sky-600 p-6 flex flex-col items-center justify-center text-center shadow-sm"
          >
            <div className="text-3xl mb-3">💡</div>
            <p className="text-slate-800 font-bold text-lg leading-snug">{card.back}</p>
          </div>
        </div>
      </div>

      {/* Action buttons — only shown after flip */}
      <div className={`flex gap-3 mt-4 transition-opacity duration-300 ${flipped ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <TactileButton accentColor="coral" fullWidth onClick={onReviewAgain}>
          ↩ Review Again
        </TactileButton>
        <TactileButton accentColor="emerald" fullWidth onClick={() => { setFlipped(false); onGotIt() }}>
          Got It ✓
        </TactileButton>
      </div>
    </div>
  )
}
