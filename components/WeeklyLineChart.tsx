'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { IAttempt } from '@/models'
import { format } from 'date-fns'

interface WeeklyLineChartProps {
  attempts: IAttempt[]
  candidateName: string
  accentColor?: string
}

const colorMap: Record<string, string> = {
  emerald: '#58CC02',
  sky: '#1CB0F6',
  amber: '#FFC800',
  purple: '#CE82FF',
}

export default function WeeklyLineChart({ attempts, candidateName, accentColor = 'sky' }: WeeklyLineChartProps) {
  const filtered = attempts
    .filter((a) => candidateName === 'All' || a.candidateName === candidateName)
    .slice(-10)

  const data = filtered.map((a, i) => ({
    name: format(new Date(a.submittedAt), 'MMM d'),
    score: a.percentage,
    session: a.candidateName,
    index: i + 1,
  }))

  const avg = data.length ? Math.round(data.reduce((s, d) => s + d.score, 0) / data.length) : 0
  const color = colorMap[accentColor] || '#1CB0F6'

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-slate-400">
        <div className="text-3xl mb-2">📈</div>
        <p className="text-sm">No quiz attempts yet. Start a quiz to see your progress!</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <div>
          <div className="text-2xl font-black" style={{ color }}>{avg}%</div>
          <div className="text-xs text-slate-400 uppercase tracking-wide">Average Score</div>
        </div>
        <div className="text-slate-300">|</div>
        <div>
          <div className="text-2xl font-black text-slate-700">{data.length}</div>
          <div className="text-xs text-slate-400 uppercase tracking-wide">Quizzes Taken</div>
        </div>
        <div className="text-slate-300">|</div>
        <div>
          <div className="text-2xl font-black text-slate-700">{data[data.length - 1]?.score || 0}%</div>
          <div className="text-xs text-slate-400 uppercase tracking-wide">Latest Score</div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="%" />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: '2px solid #e2e8f0', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any) => [`${value}%`, 'Score']}
          />
          <ReferenceLine y={70} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: 'Benchmark 70%', position: 'insideTopRight', fontSize: 10, fill: '#94a3b8' }} />
          <ReferenceLine y={avg} stroke={color} strokeDasharray="4 4" strokeOpacity={0.5} />
          <Line
            type="monotone"
            dataKey="score"
            stroke={color}
            strokeWidth={3}
            dot={{ r: 5, fill: color, strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
