import Link from 'next/link'
import { IProgram } from '@/models'
import CandidatePill from '@/components/CandidatePill'
import { Clock, Zap, BookOpen } from 'lucide-react'

const accentConfig: Record<string, { badge: string; btn: string; tag: string; dot: string }> = {
  emerald: {
    badge: 'bg-green-100 text-green-700 border-green-200',
    btn: 'bg-[#58CC02] border-[#46A302] text-white hover:bg-[#4db301]',
    tag: 'bg-green-500',
    dot: 'bg-green-400',
  },
  sky: {
    badge: 'bg-sky-100 text-sky-700 border-sky-200',
    btn: 'bg-[#1CB0F6] border-[#1899D6] text-white hover:bg-[#14a3e8]',
    tag: 'bg-sky-500',
    dot: 'bg-sky-400',
  },
  amber: {
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    btn: 'bg-[#FFC800] border-[#E5B400] text-slate-800 hover:bg-[#f0bc00]',
    tag: 'bg-amber-500',
    dot: 'bg-amber-400',
  },
  purple: {
    badge: 'bg-purple-100 text-purple-700 border-purple-200',
    btn: 'bg-[#CE82FF] border-[#b56de6] text-white hover:bg-[#c070f5]',
    tag: 'bg-purple-500',
    dot: 'bg-purple-400',
  },
  rose: {
    badge: 'bg-rose-100 text-rose-700 border-rose-200',
    btn: 'bg-[#FF4B4B] border-[#EA2B2B] text-white hover:bg-[#e63e3e]',
    tag: 'bg-rose-500',
    dot: 'bg-rose-400',
  },
}

interface ProgramCardProps {
  program: IProgram
}

export default function ProgramCard({ program }: ProgramCardProps) {
  const cfg = accentConfig[program.accentColor] || accentConfig.sky
  const avgAccuracy = program.candidates?.length
    ? Math.round(
        program.candidates.reduce(
          (s: number, c: { overallAccuracy: number }) => s + (c.overallAccuracy || 0),
          0
        ) / program.candidates.length
      )
    : 0

  return (
    <div
      className={`
        bg-white rounded-2xl border-2 shadow-sm
        ${program.accentColor === 'emerald' ? 'border-green-300 border-b-4 border-b-green-500' : ''}
        ${program.accentColor === 'sky' ? 'border-sky-300 border-b-4 border-b-sky-500' : ''}
        ${program.accentColor === 'amber' ? 'border-amber-300 border-b-4 border-b-amber-500' : ''}
        ${program.accentColor === 'purple' ? 'border-purple-300 border-b-4 border-b-purple-500' : ''}
        ${program.accentColor === 'rose' ? 'border-rose-300 border-b-4 border-b-rose-500' : ''}
        hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200
        flex flex-col
      `}
    >
      {/* Card header */}
      <div className="p-5 flex-1">
        <div className="flex items-start justify-between mb-3 gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Code badge */}
            <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border ${cfg.badge}`}>
              {program.code}
            </span>
            {/* Division */}
            <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-1 rounded-lg font-bold uppercase tracking-wider text-[10px]">
              {program.division || 'Aliyah'}
            </span>
            {/* Category */}
            <span className="text-xs bg-slate-100 text-slate-600 border border-slate-200 px-2 py-1 rounded-lg font-medium">
              {program.category}
            </span>
          </div>
          {/* Avg accuracy */}
          <div className="flex-shrink-0 text-right">
            <div className="text-lg font-black text-slate-800">{avgAccuracy}%</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wide">avg. score</div>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-black text-slate-900 mb-2 leading-tight">{program.title}</h3>

        {/* Meta pills */}
        <div className="flex items-center gap-3 mb-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {program.durationMinutes} min
          </span>
          <span className="flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" />
            {program.skill}
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            {program.candidates?.length || 0} candidate{(program.candidates?.length || 0) !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Concept note preview */}
        <p className="text-sm text-slate-600 leading-relaxed line-clamp-2 mb-4">
          {program.conceptNote}
        </p>

        {/* Candidates */}
        <div className="flex flex-wrap gap-2">
          {program.candidates?.map((c) => (
            <CandidatePill key={c.id || c.name} candidate={c} accentColor={program.accentColor} />
          ))}
        </div>
      </div>

      {/* Card footer */}
      <div className="px-5 pb-5">
        <div className={`w-full text-sm font-bold ${cfg.dot} h-1 rounded-full mb-3`}>
          <div
            className="h-full rounded-full bg-current"
            style={{ width: `${avgAccuracy}%`, opacity: 0.8 }}
          />
        </div>
        <Link href={`/programs/${program.code}`} className="block">
          <button
            className={`
              w-full py-3 text-sm font-bold rounded-xl border-2 border-b-4
              active:border-b-2 active:translate-y-[2px]
              transition-all duration-100
              ${cfg.btn}
            `}
          >
            Open Program Hub →
          </button>
        </Link>
      </div>
    </div>
  )
}
