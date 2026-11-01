import Link from 'next/link'
import { IProgram } from '@/models'
import { Flame, ChevronRight, Sparkles, Award, TrendingUp, AlertTriangle } from 'lucide-react'

interface ProgramCardProps {
  program: IProgram
}

export default function ProgramCard({ program }: ProgramCardProps) {
  const candidates = program.candidates || []
  const avgAccuracy = candidates.length
    ? Math.round(
        candidates.reduce((s: number, c) => s + (c.overallAccuracy || 0), 0) / candidates.length
      )
    : 0

  const maxStreak = candidates.length
    ? Math.max(...candidates.map((c) => c.streakDays || 0))
    : 0

  // Hot card condition: avg accuracy >= 85% or max streak >= 5
  const isHot = avgAccuracy >= 85 || maxStreak >= 5

  // 4-Tier Corner Status Badge calculation
  const getCornerBadge = () => {
    if (avgAccuracy >= 90) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-[#5F4BB6]/10 text-[#5F4BB6] border border-[#5F4BB6]/30">
          <Award className="w-3 h-3" />
          EXCELLENT
        </span>
      )
    }
    if (avgAccuracy >= 75) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-[#00A896]/10 text-[#00A896] border border-[#00A896]/30">
          <TrendingUp className="w-3 h-3" />
          GOOD
        </span>
      )
    }
    if (avgAccuracy >= 50) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-amber-500/10 text-amber-700 border border-amber-500/30">
          <AlertTriangle className="w-3 h-3" />
          WARNING
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-rose-500/10 text-rose-600 border border-rose-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
        DANGER
      </span>
    )
  }

  // Student Mini Status Dot
  const getCandidateDot = (acc: number) => {
    if (acc >= 90) return 'bg-[#5F4BB6]'
    if (acc >= 75) return 'bg-[#00A896]'
    if (acc >= 50) return 'bg-amber-500'
    return 'bg-rose-500'
  }

  // Dynamic Coach Micro-Message
  const getCoachMessage = () => {
    if (avgAccuracy >= 90) return 'Championship Pace: Candidate mastery is exceptional.'
    if (avgAccuracy >= 80) return 'Strong Momentum: Consistent practice yield.'
    if (avgAccuracy >= 60) return 'Targeted Practice Recommended: Review weak topics.'
    if (candidates.length === 0) return 'Awaiting initial candidate enrollment.'
    return 'Action Needed: Launch a 1-Tap Revenge Quiz to crush errors.'
  }

  return (
    <div
      className={`
        bg-white rounded-3xl border-2 transition-all duration-200 flex flex-col justify-between overflow-hidden
        ${
          isHot
            ? 'border-[#FF6B4A]/50 shadow-[0_4px_24px_rgba(255,107,74,0.12)] ring-1 ring-[#FF6B4A]/30'
            : 'border-slate-200/90 shadow-sm hover:shadow-md hover:border-slate-300'
        }
      `}
    >
      <div className="p-5 sm:p-6">
        {/* Top Row: Code Pill + Division & Corner Monitoring Badge */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-black px-2.5 py-1 rounded-xl bg-[#1E2538] text-white border border-[#2A334C]">
              {program.code}
            </span>
            <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
              {program.division || 'Aliyah'}
            </span>
            {isHot && (
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-[#FF6B4A] bg-[#FF6B4A]/10 border border-[#FF6B4A]/30 px-2 py-0.5 rounded-full animate-pulse">
                <Flame className="w-3 h-3 text-[#FF6B4A] fill-[#FF6B4A]" />
                HOT
              </span>
            )}
          </div>
          <div>{getCornerBadge()}</div>
        </div>

        {/* Program Title */}
        <h3 className="text-xl font-black text-[#1E2538] tracking-tight mb-4 leading-snug">
          {program.title}
        </h3>

        {/* Compact Candidate Micro-Rows */}
        <div className="space-y-2 mb-4">
          {candidates.length === 0 ? (
            <div className="text-xs text-slate-400 italic py-2">
              No candidates enrolled yet.
            </div>
          ) : (
            candidates.slice(0, 3).map((c) => (
              <Link
                key={c.id || c.name}
                href={`/programs/${program.code}?candidate=${encodeURIComponent(c.name)}`}
                className="flex items-center justify-between p-2.5 rounded-2xl bg-[#FAF9F6] border border-slate-200/80 hover:bg-slate-100/80 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${getCandidateDot(
                      c.overallAccuracy || 0
                    )}`}
                  />
                  <span className="text-xs font-black text-[#1E2538] group-hover:text-[#FF6B4A] transition-colors">
                    {c.name}
                  </span>
                  {c.streakDays && c.streakDays > 0 ? (
                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-slate-500">
                      <Flame className="w-3 h-3 text-[#FF6B4A]" />
                      {c.streakDays}d
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-800">
                    {c.overallAccuracy || 0}%
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#FF6B4A] transition-colors" />
                </div>
              </Link>
            ))
          )}
          {candidates.length > 3 && (
            <div className="text-[11px] font-bold text-slate-400 text-center pt-1">
              + {candidates.length - 3} more candidate{candidates.length - 3 > 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* Card Footer: Micro-Coach Message + Open Hub CTA */}
      <div className="px-5 pb-5 pt-0">
        <div className="mb-3 text-[11px] font-semibold text-slate-500 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/60">
          <Sparkles className="w-3.5 h-3.5 text-[#00A896] shrink-0" />
          <span className="truncate">{getCoachMessage()}</span>
        </div>

        <Link href={`/programs/${program.code}`} className="block">
          <button
            className={`
              w-full py-2.5 px-4 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2
              ${
                isHot
                  ? 'bg-[#FF6B4A] text-white border-2 border-[#E85635] border-b-4 border-b-[#C94224] hover:bg-[#E85635] active:border-b-2 active:translate-y-[2px] shadow-sm'
                  : 'bg-[#1E2538] text-white border-2 border-[#161B29] border-b-4 border-b-[#0D101A] hover:bg-[#2A334C] active:border-b-2 active:translate-y-[2px]'
              }
            `}
          >
            <span>Open Candidate Workspace</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </Link>
      </div>
    </div>
  )
}
