'use client'

import { useState } from 'react'
import {
  BarChart3,
  Share2,
  Copy,
  Check,
  Award,
  AlertTriangle,
  Flame,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react'
import Link from 'next/link'
import { IProgram } from '@/models'

interface TodayStatsViewProps {
  programs: IProgram[]
  onOpenRevenge?: (programCode: string, candidateName: string) => void
}

export default function TodayStatsView({ programs }: TodayStatsViewProps) {
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedReport, setCopiedReport] = useState(false)

  // Extract all candidates with program metadata
  const allCandidates = programs.flatMap((p) =>
    (p.candidates || []).map((c) => ({
      ...c,
      programCode: p.code,
      programTitle: p.title,
      division: p.division,
    }))
  )

  const totalCandidates = allCandidates.length
  const avgReadiness = totalCandidates
    ? Math.round(
        allCandidates.reduce((acc, c) => acc + (c.overallAccuracy || 0), 0) / totalCandidates
      )
    : 0

  const excellentList = allCandidates.filter((c) => (c.overallAccuracy || 0) >= 90)
  const goodList = allCandidates.filter(
    (c) => (c.overallAccuracy || 0) >= 75 && (c.overallAccuracy || 0) < 90
  )
  const warningList = allCandidates.filter(
    (c) => (c.overallAccuracy || 0) >= 50 && (c.overallAccuracy || 0) < 75
  )
  const dangerList = allCandidates.filter((c) => (c.overallAccuracy || 0) < 50)

  // Sorted list: descending score
  const sortedCandidates = [...allCandidates].sort(
    (a, b) => (b.overallAccuracy || 0) - (a.overallAccuracy || 0)
  )

  const handleCopyLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const url = `${origin}/?view=stats`
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(url)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2200)
    }
  }

  const handleCopyWhatsAppReport = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const liveUrl = `${origin}/?view=stats`
    const dateStr = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

    const text = `*SHIA SIBAQ TRAINING (SST) — DAILY READINESS REPORT*
Date: ${dateStr}
Campus Overall Readiness: ${avgReadiness}%
Enrolled Candidates: ${totalCandidates} across ${programs.length} Programs

*TIER BREAKDOWN:*
• EXCELLENT (90%+): ${excellentList.length} students
• GOOD (75-89%): ${goodList.length} students
• WARNING (50-74%): ${warningList.length} students
• ATTENTION NEEDED (<50%): ${dangerList.length} students

*INDIVIDUAL CANDIDATE STANDINGS:*
${sortedCandidates
  .map(
    (c, i) =>
      `${i + 1}. ${c.name} [${c.programCode}] — ${c.overallAccuracy || 0}% (${c.streakDays || 0}d streak)`
  )
  .join('\n')}

View Live Interactive Dashboard & Launch Revenge Quizzes:
${liveUrl}`

    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text)
      setCopiedReport(true)
      setTimeout(() => setCopiedReport(false), 2200)
    }
  }

  const getStatusBadge = (acc: number) => {
    if (acc >= 90) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-[#5F4BB6]/15 text-[#5F4BB6] border border-[#5F4BB6]/30">
          <Award className="w-3 h-3" />
          EXCELLENT
        </span>
      )
    }
    if (acc >= 75) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-[#00A896]/15 text-[#00A896] border border-[#00A896]/30">
          <TrendingUp className="w-3 h-3" />
          GOOD
        </span>
      )
    }
    if (acc >= 50) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-500/15 text-amber-700 border border-amber-500/30">
          <AlertTriangle className="w-3 h-3" />
          WARNING
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-500/15 text-rose-600 border border-rose-500/30">
        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
        DANGER
      </span>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header & Share Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border-2 border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black tracking-widest uppercase bg-[#1E2538] text-white">
              LIVE REPORT
            </span>
            <span className="text-xs text-slate-400 font-medium">Campus Readiness Intelligence</span>
          </div>
          <h2 className="text-2xl font-black text-[#1E2538] tracking-tight">
            Today&apos;s Campus Statistics
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time candidate accuracy, tier distributions, and automated WhatsApp summary.
          </p>
        </div>

        {/* 1-Click Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleCopyWhatsAppReport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#00A896] text-white font-black text-xs border-2 border-[#008E7E] border-b-4 border-b-[#007063] hover:bg-[#008E7E] active:border-b-2 active:translate-y-[2px] transition-all shadow-sm"
          >
            {copiedReport ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            <span>{copiedReport ? 'Report Copied!' : 'Copy WhatsApp Daily Report'}</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-white text-[#1E2538] font-bold text-xs border-2 border-slate-200 border-b-4 border-b-slate-300 hover:bg-slate-50 active:border-b-2 active:translate-y-[2px] transition-all"
          >
            {copiedLink ? <Check className="w-4 h-4 text-[#00A896]" /> : <Copy className="w-4 h-4 text-slate-600" />}
            <span>{copiedLink ? 'Link Copied!' : 'Copy Live Link'}</span>
          </button>
        </div>
      </div>

      {/* 4-Tier KPI Breakdown Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        {/* KPI 1: Overall Average */}
        <div className="col-span-2 md:col-span-1 bg-[#1E2538] text-white p-5 rounded-3xl border-2 border-[#2A334C] shadow-sm flex flex-col justify-between">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
            Overall Readiness
          </div>
          <div className="my-2">
            <div className="text-3xl font-black">{avgReadiness}%</div>
            <div className="text-[11px] text-[#00A896] font-semibold mt-0.5">
              {totalCandidates} Candidates Active
            </div>
          </div>
          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#00A896] h-full rounded-full transition-all duration-500"
              style={{ width: `${avgReadiness}%` }}
            />
          </div>
        </div>

        {/* Tier: Excellent */}
        <div className="bg-white p-5 rounded-3xl border-2 border-[#5F4BB6]/30 border-b-4 border-b-[#5F4BB6] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-[#5F4BB6] tracking-wider">
              Excellent
            </span>
            <Award className="w-4 h-4 text-[#5F4BB6]" />
          </div>
          <div className="my-1.5">
            <div className="text-2xl font-black text-[#1E2538]">{excellentList.length}</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase">Score &ge; 90%</div>
          </div>
          <div className="text-[10px] text-[#5F4BB6] font-bold">
            {totalCandidates ? Math.round((excellentList.length / totalCandidates) * 100) : 0}% of campus
          </div>
        </div>

        {/* Tier: Good */}
        <div className="bg-white p-5 rounded-3xl border-2 border-[#00A896]/30 border-b-4 border-b-[#00A896] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-[#00A896] tracking-wider">
              Good
            </span>
            <TrendingUp className="w-4 h-4 text-[#00A896]" />
          </div>
          <div className="my-1.5">
            <div className="text-2xl font-black text-[#1E2538]">{goodList.length}</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase">75% - 89%</div>
          </div>
          <div className="text-[10px] text-[#00A896] font-bold">
            {totalCandidates ? Math.round((goodList.length / totalCandidates) * 100) : 0}% of campus
          </div>
        </div>

        {/* Tier: Warning */}
        <div className="bg-white p-5 rounded-3xl border-2 border-amber-300 border-b-4 border-b-amber-500 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-amber-700 tracking-wider">
              Warning
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="my-1.5">
            <div className="text-2xl font-black text-[#1E2538]">{warningList.length}</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase">50% - 74%</div>
          </div>
          <div className="text-[10px] text-amber-700 font-bold">
            {totalCandidates ? Math.round((warningList.length / totalCandidates) * 100) : 0}% of campus
          </div>
        </div>

        {/* Tier: Danger */}
        <div className="bg-white p-5 rounded-3xl border-2 border-rose-300 border-b-4 border-b-rose-500 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-rose-600 tracking-wider">
              Danger
            </span>
            <Flame className="w-4 h-4 text-rose-600" />
          </div>
          <div className="my-1.5">
            <div className="text-2xl font-black text-[#1E2538]">{dangerList.length}</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase">Score &lt; 50%</div>
          </div>
          <div className="text-[10px] text-rose-600 font-bold">
            {totalCandidates ? Math.round((dangerList.length / totalCandidates) * 100) : 0}% of campus
          </div>
        </div>
      </div>

      {/* Candidate Standings Table */}
      <div className="bg-white rounded-3xl border-2 border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#1E2538]" />
            <h3 className="font-black text-sm text-[#1E2538]">Candidate Roster Standings</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Sorted by Overall Accuracy
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF9F6] border-b border-slate-200 text-slate-500 font-black uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Candidate</th>
                <th className="py-3 px-4">Program</th>
                <th className="py-3 px-4">Streak</th>
                <th className="py-3 px-4">Accuracy</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedCandidates.map((c, idx) => (
                <tr key={`${c.programCode}-${c.id || c.name}`} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-400">
                    #{idx + 1}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-black text-[#1E2538]">{c.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{c.regNo}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-mono font-black text-xs px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                      {c.programCode}
                    </span>
                    <span className="ml-1.5 text-slate-500 font-medium hidden sm:inline">
                      {c.programTitle}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 font-bold text-slate-700">
                      <Flame className="w-3.5 h-3.5 text-[#FF6B4A]" />
                      {c.streakDays || 0}d
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-[#1E2538]">
                        {c.overallAccuracy || 0}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    {getStatusBadge(c.overallAccuracy || 0)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      href={`/programs/${c.programCode}?candidate=${encodeURIComponent(c.name)}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 font-bold hover:bg-[#FF6B4A] hover:text-white transition-all text-[11px]"
                    >
                      <span>Drill Hub</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
