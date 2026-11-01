'use client'

import AccuracyRing from '@/components/ui/AccuracyRing'
import { ICandidate } from '@/models'
import { Flame } from 'lucide-react'
import { playClickPop } from '@/lib/sounds'

interface CandidatePillProps {
  candidate: ICandidate
  accentColor?: string
  onClick?: () => void
  selected?: boolean
}

export default function CandidatePill({
  candidate,
  accentColor = 'sky',
  onClick,
  selected,
}: CandidatePillProps) {
  const initials = candidate.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const accuracy = candidate.overallAccuracy || 0

  return (
    <button
      onClick={() => {
        playClickPop()
        onClick?.()
      }}
      className={`
        flex items-center gap-2.5 px-3.5 py-2 rounded-2xl border-2
        transition-all duration-75 select-none
        border-b-4 active:border-b-0 active:translate-y-[4px]
        ${
          selected
            ? 'bg-[#DDF4FF] text-[#1899D6] border-[#1CB0F6] border-b-[#1899D6]'
            : 'bg-white text-[#4B4B4B] border-[#E5E5E5] border-b-[#DCDCDC] hover:bg-[#F7F7F7]'
        }
      `}
    >
      {/* Avatar */}
      <div
        className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0 border border-black/10"
        style={{ backgroundColor: candidate.avatarColor || '#1CB0F6' }}
      >
        {initials}
      </div>

      <div className="flex flex-col items-start min-w-0">
        <span
          className={`text-xs font-black leading-none uppercase ${
            selected ? 'text-[#1899D6]' : 'text-[#4B4B4B]'
          }`}
        >
          {candidate.name}
        </span>
        <span className="flex items-center gap-1 text-[10px] font-black leading-none mt-1 text-[#FF9600]">
          <Flame className="w-2.5 h-2.5 text-[#FF9600] fill-[#FF9600] stroke-[2]" />
          <span>{candidate.streakDays || 0}d streak</span>
        </span>
      </div>

      <AccuracyRing
        pct={accuracy}
        accentColor={selected ? 'sky' : accentColor}
        size={34}
        strokeWidth={3.5}
      />
    </button>
  )
}
