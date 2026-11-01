import AccuracyRing from '@/components/ui/AccuracyRing'
import { ICandidate } from '@/models'
import { Flame } from 'lucide-react'

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
      onClick={onClick}
      className={`
        flex items-center gap-2.5 px-3.5 py-2 rounded-2xl border-2
        transition-all duration-150 active:translate-y-[1px]
        ${
          selected
            ? 'bg-[#1E2538] text-white border-[#1E2538] shadow-md ring-2 ring-[#FF6B4A]/30'
            : 'bg-white text-slate-700 border-slate-200/90 hover:border-slate-300 hover:bg-slate-50'
        }
      `}
    >
      {/* Avatar */}
      <div
        className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0 shadow-xs"
        style={{ backgroundColor: candidate.avatarColor || '#1E2538' }}
      >
        {initials}
      </div>

      <div className="flex flex-col items-start min-w-0">
        <span
          className={`text-xs font-black leading-none ${
            selected ? 'text-white' : 'text-slate-900'
          }`}
        >
          {candidate.name}
        </span>
        <span
          className={`flex items-center gap-1 text-[10px] font-bold leading-none mt-1 ${
            selected ? 'text-slate-300' : 'text-slate-500'
          }`}
        >
          <Flame className="w-2.5 h-2.5 text-[#FF6B4A]" strokeWidth={2} />
          <span>{candidate.streakDays || 0}d streak</span>
        </span>
      </div>

      <AccuracyRing
        pct={accuracy}
        accentColor={selected ? 'coral' : accentColor}
        size={34}
        strokeWidth={3.5}
      />
    </button>
  )
}
