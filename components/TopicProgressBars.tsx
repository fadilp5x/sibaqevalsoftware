'use client'

import { IAttempt } from '@/models'
import { Target, CheckCircle2 } from 'lucide-react'

interface TopicProgressBarsProps {
  attempts: IAttempt[]
  candidateName?: string
  programSkill?: string
}

export default function TopicProgressBars({
  attempts,
  candidateName,
  programSkill,
}: TopicProgressBarsProps) {
  const filtered = attempts.filter(
    (a) => !candidateName || candidateName === 'All' || a.candidateName === candidateName
  )

  type Stats = { correct: number; total: number }
  const tagMap: Record<string, Stats> = {}

  for (const attempt of filtered) {
    for (const ans of attempt.answers || []) {
      const tag = ans.topicTag || programSkill || 'Core Syllabus'
      if (!tagMap[tag]) tagMap[tag] = { correct: 0, total: 0 }
      tagMap[tag].total++
      if (ans.isCorrect) tagMap[tag].correct++
    }
  }

  const topics = Object.entries(tagMap)
    .map(([tag, stats]) => ({
      tag,
      pct: Math.round((stats.correct / stats.total) * 100),
      total: stats.total,
    }))
    .sort((a, b) => b.pct - a.pct)

  if (topics.length === 0) {
    return (
      <div className="bg-white rounded-3xl border-2 border-slate-200/90 p-6 shadow-sm flex flex-col items-center justify-center text-center py-10 text-slate-400">
        <Target className="w-8 h-8 mx-auto mb-2 text-slate-300" strokeWidth={1.75} />
        <h4 className="text-xs font-bold text-slate-700 mb-1">Topic Mastery Breakdown</h4>
        <p className="text-[11px]">Complete assessments to generate syllabus accuracy metrics.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-3xl border-2 border-slate-200/90 p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-[#5F4BB6]" strokeWidth={1.75} />
          <h4 className="text-sm font-black text-[#1E2538]">Topic Mastery Breakdown</h4>
        </div>
        <span className="text-xs text-slate-400 font-medium">{topics.length} topics mapped</span>
      </div>

      <div className="space-y-3.5">
        {topics.map(({ tag, pct, total }) => {
          const color =
            pct >= 85
              ? { bar: 'bg-[#5F4BB6]', text: 'text-[#5F4BB6]', badge: 'bg-[#5F4BB6]/10 text-[#5F4BB6] border-[#5F4BB6]/30' }
              : pct >= 70
              ? { bar: 'bg-[#00A896]', text: 'text-[#00A896]', badge: 'bg-[#00A896]/10 text-[#00A896] border-[#00A896]/30' }
              : pct >= 50
              ? { bar: 'bg-amber-500', text: 'text-amber-700', badge: 'bg-amber-500/10 text-amber-700 border-amber-500/30' }
              : { bar: 'bg-rose-500', text: 'text-rose-600', badge: 'bg-rose-500/10 text-rose-600 border-rose-500/30' }

          return (
            <div key={tag} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">{tag}</span>
                  {pct < 50 && (
                    <span className="text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-200 px-2 py-0.2 rounded-md">
                      Needs Work
                    </span>
                  )}
                  {pct >= 85 && (
                    <span className="text-[10px] font-black uppercase tracking-wider bg-[#5F4BB6]/10 text-[#5F4BB6] border border-[#5F4BB6]/30 px-2 py-0.2 rounded-md flex items-center gap-0.5">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      Mastered
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-[10px] text-slate-400 font-sans">{total} Qs</span>
                  <span className={`text-xs font-black ${color.text}`}>{pct}%</span>
                </div>
              </div>

              <div className="h-2 bg-[#FAF9F6] border border-slate-200/80 rounded-full overflow-hidden">
                <div
                  className={`h-full ${color.bar} rounded-full transition-all duration-500`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
