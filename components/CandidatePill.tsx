import AccuracyRing from '@/components/ui/AccuracyRing'
import { ICandidate } from '@/models'

const colorMap: Record<string, string> = {
  emerald: 'bg-green-100 text-green-800 border-green-300',
  sky: 'bg-sky-100 text-sky-800 border-sky-300',
  amber: 'bg-amber-100 text-amber-800 border-amber-300',
  purple: 'bg-purple-100 text-purple-800 border-purple-300',
  rose: 'bg-rose-100 text-rose-800 border-rose-300',
}

interface CandidatePillProps {
  candidate: ICandidate
  accentColor: string
  onClick?: () => void
  selected?: boolean
}

export default function CandidatePill({ candidate, accentColor, onClick, selected }: CandidatePillProps) {
  const colorClass = colorMap[accentColor] || colorMap.sky
  const initials = candidate.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-b-4
        transition-all duration-150 active:border-b-2 active:translate-y-[2px]
        ${selected
          ? `${colorClass} border-b-4 shadow-sm`
          : 'bg-white border-slate-200 border-b-slate-300 hover:border-slate-300'
        }
      `}
    >
      {/* Avatar */}
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
        style={{ backgroundColor: candidate.avatarColor }}
      >
        {initials}
      </div>

      <div className="flex flex-col items-start min-w-0">
        <span className="text-xs font-bold text-slate-800 leading-none">{candidate.name}</span>
        <span className="text-[10px] text-slate-500 leading-none mt-0.5">
          🔥 {candidate.streakDays}d streak
        </span>
      </div>

      <AccuracyRing pct={candidate.overallAccuracy} accentColor={accentColor} size={36} strokeWidth={4} />
    </button>
  )
}
