'use client'

import Link from 'next/link'
import { IProgram } from '@/models'
import { Flame, ChevronRight, Award, TrendingUp, AlertTriangle, AlertOctagon, User } from 'lucide-react'
import { playClickPop } from '@/lib/sounds'

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

  // 4-Tier Corner Status Badge calculation with exact Duolingo brand colors
  const getCornerBadge = () => {
    if (avgAccuracy >= 90) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-[10px] font-black tracking-wider uppercase bg-[#CE82FF] border-b-2 border-[#A568CC] text-white shadow-xs">
          <Award className="w-3.5 h-3.5 stroke-[2.5]" />
          EXCELLENT
        </span>
      )
    }
    if (avgAccuracy >= 75) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-[10px] font-black tracking-wider uppercase bg-[#58CC02] border-b-2 border-[#58A700] text-white shadow-xs">
          <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />
          GOOD
        </span>
      )
    }
    if (avgAccuracy >= 50) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-[10px] font-black tracking-wider uppercase bg-[#FFC800] border-b-2 border-[#E5B400] text-[#4B4B4B] shadow-xs">
          <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5]" />
          WARNING
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-[10px] font-black tracking-wider uppercase bg-[#FF4B4B] border-b-2 border-[#EA2B2B] text-white shadow-xs animate-pulse">
        <AlertOctagon className="w-3.5 h-3.5 stroke-[2.5]" />
        DANGER
      </span>
    )
  }

  // Student Mini Status Dot
  const getCandidateDot = (acc: number) => {
    if (acc >= 90) return 'bg-[#CE82FF]'
    if (acc >= 75) return 'bg-[#58CC02]'
    if (acc >= 50) return 'bg-[#FFC800]'
    return 'bg-[#FF4B4B]'
  }

  // Dynamic Coach Micro-Message
  const getCoachMessage = () => {
    if (avgAccuracy >= 90) return 'Championship Pace: Candidate mastery is exceptional.'
    if (avgAccuracy >= 80) return 'Strong Momentum: Consistent daily practice yield.'
    if (avgAccuracy >= 60) return 'Targeted Practice Recommended: Review weak topics.'
    if (candidates.length === 0) return 'Awaiting initial candidate enrollment.'
    return 'Action Needed: Launch a 1-Tap Revenge Drill to crush errors.'
  }

  return (
    <div
      className={`
        bg-white rounded-2xl border-2 border-b-4 transition-transform duration-75 flex flex-col justify-between overflow-hidden
        ${
          isHot
            ? 'border-[#FF9600] border-b-[#E58700] shadow-xs'
            : 'border-[#E5E5E5] border-b-[#DCDCDC] hover:-translate-y-0.5'
        }
      `}
    >
      <div className="p-5 sm:p-6">
        {/* Top Row: Program Code Pill (Macaw Blue) + Division + Corner Status Pill */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black px-3 py-1 rounded-xl bg-[#1CB0F6] border-b-2 border-[#1899D6] text-white uppercase tracking-wider">
              {program.code}
            </span>
            <span className="text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-xl bg-[#F7F7F7] text-[#777777] border border-[#E5E5E5]">
              {program.division || 'Aliyah'}
            </span>
            {isHot && (
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-[#FF9600] bg-[#FFF0D6] border border-[#FF9600] px-2 py-0.5 rounded-lg animate-pulse">
                <Flame className="w-3.5 h-3.5 text-[#FF9600] fill-[#FF9600] stroke-[2]" />
                HOT
              </span>
            )}
          </div>
          <div>{getCornerBadge()}</div>
        </div>

        {/* Program Title */}
        <h3 className="text-xl font-black text-[#4B4B4B] tracking-tight mb-4 leading-snug">
          {program.title}
        </h3>

        {/* Candidate Mini-Rows */}
        <div className="space-y-2 mb-4">
          {candidates.length === 0 ? (
            <div className="text-xs font-bold text-[#777777] py-2">
              No candidates enrolled yet.
            </div>
          ) : (
            candidates.slice(0, 3).map((c) => (
              <Link
                key={c.id || c.name}
                href={`/programs/${program.code}?candidate=${encodeURIComponent(c.name)}`}
                onClick={() => playClickPop()}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#F7F7F7] border border-[#E5E5E5] hover:bg-[#DDF4FF] hover:border-[#1CB0F6] transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-white border border-[#E5E5E5] flex items-center justify-center text-[#777777]">
                    <User className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${getCandidateDot(
                      c.overallAccuracy || 0
                    )}`}
                  />
                  <span className="text-xs font-black text-[#4B4B4B] group-hover:text-[#1899D6] transition-colors">
                    {c.name}
                  </span>
                  {c.streakDays && c.streakDays > 0 ? (
                    <span className="flex items-center gap-0.5 text-[11px] font-black text-[#FF9600]">
                      <Flame className="w-3.5 h-3.5 text-[#FF9600] fill-[#FF9600] stroke-[2]" />
                      {c.streakDays}d
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-[#4B4B4B]">
                    {c.overallAccuracy || 0}%
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#777777] group-hover:text-[#1899D6] transition-colors stroke-[2.5]" />
                </div>
              </Link>
            ))
          )}
          {candidates.length > 3 && (
            <div className="text-[11px] font-black text-[#777777] text-center pt-1 uppercase">
              + {candidates.length - 3} more candidate{candidates.length - 3 > 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* Card Footer: Micro-Coach Message + 3D CTA Button */}
      <div className="px-5 pb-5 pt-0">
        <div className="mb-3 text-[11px] font-bold text-[#777777] flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F7F7F7] border border-[#E5E5E5]">
          <span className="w-2 h-2 rounded-full bg-[#58CC02]" />
          <span className="truncate">{getCoachMessage()}</span>
        </div>

        <Link href={`/programs/${program.code}`} className="block" onClick={() => playClickPop()}>
          <button
            className={`
              w-full py-3 px-4 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all duration-75 flex items-center justify-center gap-2 select-none
              border-b-4 active:border-b-0 active:translate-y-[4px]
              ${
                isHot
                  ? 'bg-[#FF9600] text-white border-[#E58700] hover:bg-[#E58700]'
                  : 'bg-[#58CC02] text-white border-[#58A700] hover:bg-[#58A700]'
              }
            `}
          >
            <span>Train Candidates</span>
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </Link>
      </div>
    </div>
  )
}
