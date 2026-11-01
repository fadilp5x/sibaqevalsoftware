'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { IAttempt } from '@/models'
import { format } from 'date-fns'
import { TrendingUp } from 'lucide-react'

interface WeeklyLineChartProps {
  attempts: IAttempt[]
  candidateName?: string
  accentColor?: string
}

export default function WeeklyLineChart({
  attempts,
  candidateName,
  accentColor = '#00A896',
}: WeeklyLineChartProps) {
  const filtered = attempts
    .filter((a) => !candidateName || candidateName === 'All' || a.candidateName === candidateName)
    .slice(-10)

  const data = filtered.map((a, i) => ({
    name: format(new Date(a.submittedAt), 'MMM d'),
    score: a.percentage,
    session: a.candidateName,
    index: i + 1,
  }))

  const avg = data.length ? Math.round(data.reduce((s, d) => s + d.score, 0) / data.length) : 0

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-3xl border-2 border-slate-200/90 p-6 shadow-sm flex flex-col items-center justify-center text-center py-10 text-slate-400">
        <TrendingUp className="w-8 h-8 mx-auto mb-2 text-slate-300" strokeWidth={1.75} />
        <h4 className="text-xs font-bold text-slate-700 mb-1">Weekly Improvement Trend</h4>
        <p className="text-[11px]">No quiz attempts yet. Complete a drill to plot progress curves.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-3xl border-2 border-slate-200/90 p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#00A896]" strokeWidth={1.75} />
          <h4 className="text-sm font-black text-[#1E2538]">Improvement Curve</h4>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div>
            <span className="font-black text-sm text-[#00A896]">{avg}%</span>
            <span className="text-[10px] text-slate-400 font-bold ml-1 uppercase">Avg</span>
          </div>
          <span className="text-slate-300">·</span>
          <div>
            <span className="font-black text-sm text-slate-800">{data[data.length - 1]?.score || 0}%</span>
            <span className="text-[10px] text-slate-400 font-bold ml-1 uppercase">Latest</span>
          </div>
        </div>
      </div>

      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#94a3b8"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[0, 100]}
              stroke="#94a3b8"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-[#1E2538] text-white p-2 rounded-xl text-xs shadow-lg">
                      <div className="font-black">{payload[0].value}% Accuracy</div>
                      <div className="text-[10px] text-slate-400">{payload[0].payload.name}</div>
                    </div>
                  )
                }
                return null
              }}
            />
            <ReferenceLine y={75} stroke="#00A896" strokeDasharray="3 3" opacity={0.5} />
            <Line
              type="monotone"
              dataKey="score"
              stroke={accentColor}
              strokeWidth={3}
              dot={{ fill: accentColor, r: 4, strokeWidth: 2, stroke: '#ffffff' }}
              activeDot={{ r: 6, fill: '#FF6B4A' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
