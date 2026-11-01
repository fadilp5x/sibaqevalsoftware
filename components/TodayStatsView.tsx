'use client'

import { useState } from 'react'
import {
  BarChart3,
  Share2,
  Copy,
  Check,
  Award,
  AlertTriangle,
  AlertOctagon,
  Flame,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react'
import Link from 'next/link'
import { IProgram } from '@/models'
import { playClickPop } from '@/lib/sounds'

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
    playClickPop()
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const url = `${origin}/?view=stats`
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(url)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2200)
    }
  }

  const handleCopyWhatsAppReport = () => {
    playClickPop()
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
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl text-[10px] font-black uppercase bg-[#CE82FF] border-b-2 border-[#A568CC] text-white">
          <Award className="w-3 h-3 stroke-[2.5]" />
          EXCELLENT
        </span>
      )
    }
    if (acc >= 75) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl text-[10px] font-black uppercase bg-[#58CC02] border-b-2 border-[#58A700] text-white">
          <TrendingUp className="w-3 h-3 stroke-[2.5]" />
          GOOD
        </span>
      )
    }
    if (acc >= 50) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl text-[10px] font-black uppercase bg-[#FFC800] border-b-2 border-[#E5B400] text-[#4B4B4B]">
          <AlertTriangle className="w-3 h-3 stroke-[2.5]" />
          WARNING
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl text-[10px] font-black uppercase bg-[#FF4B4B] border-b-2 border-[#EA2B2B] text-white animate-pulse">
        <AlertOctagon className="w-3 h-3 stroke-[2.5]" />
        DANGER
      </span>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 select-none">
      {/* Top Header & Share Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border-2 border-[#E5E5E5] border-b-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-xl text-[10px] font-black tracking-widest uppercase bg-[#1CB0F6] border-b-2 border-[#1899D6] text-white">
              LIVE REPORT
            </span>
            <span className="text-xs font-bold text-[#777777]">Campus Readiness Intelligence</span>
          </div>
          <h2 className="text-2xl font-black text-[#4B4B4B] tracking-tight uppercase">
            Today&apos;s Campus Statistics
          </h2>
          <p className="text-xs font-bold text-[#777777] mt-0.5">
            Real-time candidate accuracy, tier distributions, and automated WhatsApp summary.
          </p>
        </div>

        {/* 1-Click Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleCopyWhatsAppReport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#58CC02] border-b-4 border-[#58A700] hover:bg-[#58A700] text-white font-black text-xs uppercase tracking-wider active:border-b-0 active:translate-y-[4px] transition-all duration-75 shadow-xs select-none"
          >
            {copiedReport ? <Check className="w-4 h-4 stroke-[3]" /> : <Share2 className="w-4 h-4 stroke-[2.5]" />}
            <span>{copiedReport ? 'Report Copied!' : 'Copy WhatsApp Daily Report'}</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white text-[#4B4B4B] font-black text-xs uppercase tracking-wider border-2 border-[#E5E5E5] border-b-4 hover:bg-[#F7F7F7] active:border-b-0 active:translate-y-[4px] transition-all duration-75 select-none"
          >
            {copiedLink ? <Check className="w-4 h-4 text-[#58CC02] stroke-[3]" /> : <Copy className="w-4 h-4 text-[#777777] stroke-[2.5]" />}
            <span>{copiedLink ? 'Link Copied!' : 'Copy Live Link'}</span>
          </button>
        </div>
      </div>

      {/* 4-Tier KPI Breakdown Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        {/* KPI 1: Overall Average */}
        <div className="col-span-2 md:col-span-1 bg-white text-[#4B4B4B] p-5 rounded-2xl border-2 border-[#1CB0F6] border-b-4 shadow-xs flex flex-col justify-between">
          <div className="text-[11px] font-black uppercase tracking-wider text-[#1899D6]">
            Overall Readiness
          </div>
          <div className="my-2">
            <div className="text-3xl font-black text-[#4B4B4B]">{avgReadiness}%</div>
            <div className="text-[11px] text-[#58CC02] font-black mt-0.5 uppercase">
              {totalCandidates} Candidates Active
            </div>
          </div>
          <div className="w-full bg-[#E5E5E5] h-2.5 rounded-full p-0.5 overflow-hidden">
            <div
              className="bg-[#58CC02] h-full rounded-full transition-all duration-500"
              style={{ width: `${avgReadiness}%` }}
            />
          </div>
        </div>

        {/* Tier: Excellent */}
        <div className="bg-white p-5 rounded-2xl border-2 border-[#CE82FF] border-b-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-[#CE82FF] tracking-wider">
              Excellent
            </span>
            <Award className="w-4 h-4 text-[#CE82FF] stroke-[2.5]" />
          </div>
          <div className="my-1.5">
            <div className="text-2xl font-black text-[#4B4B4B]">{excellentList.length}</div>
            <div className="text-[10px] text-[#777777] font-black uppercase">Score &ge; 90%</div>
          </div>
          <div className="text-[10px] text-[#CE82FF] font-black uppercase">
            {totalCandidates ? Math.round((excellentList.length / totalCandidates) * 100) : 0}% of campus
          </div>
        </div>

        {/* Tier: Good */}
        <div className="bg-white p-5 rounded-2xl border-2 border-[#58CC02] border-b-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-[#58CC02] tracking-wider">
              Good
            </span>
            <TrendingUp className="w-4 h-4 text-[#58CC02] stroke-[2.5]" />
          </div>
          <div className="my-1.5">
            <div className="text-2xl font-black text-[#4B4B4B]">{goodList.length}</div>
            <div className="text-[10px] text-[#777777] font-black uppercase">75% - 89%</div>
          </div>
          <div className="text-[10px] text-[#58CC02] font-black uppercase">
            {totalCandidates ? Math.round((goodList.length / totalCandidates) * 100) : 0}% of campus
          </div>
        </div>

        {/* Tier: Warning */}
        <div className="bg-white p-5 rounded-2xl border-2 border-[#FFC800] border-b-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-[#E5B400] tracking-wider">
              Warning
            </span>
            <AlertTriangle className="w-4 h-4 text-[#FFC800] stroke-[2.5]" />
          </div>
          <div className="my-1.5">
            <div className="text-2xl font-black text-[#4B4B4B]">{warningList.length}</div>
            <div className="text-[10px] text-[#777777] font-black uppercase">50% - 74%</div>
          </div>
          <div className="text-[10px] text-[#E5B400] font-black uppercase">
            {totalCandidates ? Math.round((warningList.length / totalCandidates) * 100) : 0}% of campus
          </div>
        </div>

        {/* Tier: Danger */}
        <div className="bg-white p-5 rounded-2xl border-2 border-[#FF4B4B] border-b-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-[#FF4B4B] tracking-wider">
              Danger
            </span>
            <Flame className="w-4 h-4 text-[#FF4B4B] fill-[#FF4B4B] stroke-[2]" />
          </div>
          <div className="my-1.5">
            <div className="text-2xl font-black text-[#4B4B4B]">{dangerList.length}</div>
            <div className="text-[10px] text-[#777777] font-black uppercase">Score &lt; 50%</div>
          </div>
          <div className="text-[10px] text-[#FF4B4B] font-black uppercase">
            {totalCandidates ? Math.round((dangerList.length / totalCandidates) * 100) : 0}% of campus
          </div>
        </div>
      </div>

      {/* Candidate Standings Table */}
      <div className="bg-white rounded-2xl border-2 border-[#E5E5E5] border-b-4 shadow-xs overflow-hidden">
        <div className="p-5 border-b-2 border-[#E5E5E5] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#4B4B4B] stroke-[2.5]" />
            <h3 className="font-black text-sm text-[#4B4B4B] uppercase tracking-wider">
              Candidate Roster Standings
            </h3>
          </div>
          <span className="text-xs text-[#777777] font-mono font-bold uppercase">
            Sorted by Overall Accuracy
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F7F7] border-b-2 border-[#E5E5E5] text-[#777777] font-black uppercase text-[10px] tracking-wider">
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
            <tbody className="divide-y divide-[#E5E5E5]">
              {sortedCandidates.map((c, idx) => (
                <tr key={`${c.programCode}-${c.id || c.name}`} className="hover:bg-[#F7F7F7] transition-colors">
                  <td className="py-3.5 px-4 font-mono font-black text-[#777777]">
                    #{idx + 1}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-black text-[#4B4B4B] uppercase">{c.name}</div>
                    <div className="text-[10px] text-[#777777] font-mono font-bold">{c.regNo}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-mono font-black text-xs px-2.5 py-0.5 rounded-lg bg-[#DDF4FF] border border-[#1CB0F6] text-[#1899D6]">
                      {c.programCode}
                    </span>
                    <span className="ml-1.5 text-[#777777] font-bold hidden sm:inline">
                      {c.programTitle}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 font-black text-[#FF9600]">
                      <Flame className="w-3.5 h-3.5 text-[#FF9600] fill-[#FF9600] stroke-[2]" />
                      {c.streakDays || 0}d
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-[#4B4B4B]">
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
                      onClick={() => playClickPop()}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border-2 border-[#E5E5E5] border-b-4 text-[#4B4B4B] font-black uppercase text-[11px] hover:bg-[#F7F7F7] active:border-b-0 active:translate-y-[4px] transition-all"
                    >
                      <span>Drill Hub</span>
                      <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
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
