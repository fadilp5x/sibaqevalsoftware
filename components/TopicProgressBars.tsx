'use client'

import { IAttempt } from '@/models'

interface TopicProgressBarsProps {
  attempts: IAttempt[]
  candidateName: string
}

export default function TopicProgressBars({ attempts, candidateName }: TopicProgressBarsProps) {
  const filtered = attempts.filter(
    (a) => candidateName === 'All' || a.candidateName === candidateName
  )

  type Stats = { correct: number; total: number }
  const tagMap: Record<string, Stats> = {}

  for (const attempt of filtered) {
    for (const ans of attempt.answers) {
      if (!tagMap[ans.topicTag]) tagMap[ans.topicTag] = { correct: 0, total: 0 }
      tagMap[ans.topicTag].total++
      if (ans.isCorrect) tagMap[ans.topicTag].correct++
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
      <div className="text-center py-8 text-slate-400">
        <div className="text-3xl mb-2">🎯</div>
        <p className="text-sm">Complete a quiz to see topic mastery breakdown.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {topics.map(({ tag, pct, total }) => {
        const color =
          pct >= 80
            ? { bar: 'bg-[#58CC02]', text: 'text-green-700', badge: 'bg-green-100 text-green-700' }
            : pct >= 65
            ? { bar: 'bg-[#FFC800]', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' }
            : { bar: 'bg-[#FF4B4B]', text: 'text-red-700', badge: 'bg-red-100 text-red-700' }

        return (
          <div key={tag}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-700">{tag}</span>
                {pct < 65 && (
                  <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                    Needs Work
                  </span>
                )}
                {pct >= 80 && (
                  <span className="text-[10px] font-bold bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
                    Mastered ✓
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400">{total} attempts</span>
                <span className={`text-sm font-black ${color.text}`}>{pct}%</span>
              </div>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${color.bar} rounded-full transition-all duration-700`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
