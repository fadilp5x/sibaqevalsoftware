'use client'

import { useState, useEffect } from 'react'
import {
  LayoutGrid,
  BarChart3,
  Activity,
  ShieldCheck,
  Plus,
  Layers,
  Share2,
  Check,
} from 'lucide-react'
import ProgramCard from '@/components/ProgramCard'
import AddProgramModal from '@/components/AddProgramModal'
import AdminModal from '@/components/AdminModal'
import ApiTrackerTab from '@/components/ApiTrackerTab'
import TodayStatsView from '@/components/TodayStatsView'
import Preloader from '@/components/Preloader'
import { IProgram } from '@/models'

interface CampusDashboardClientProps {
  initialPrograms: IProgram[]
  initialView?: string
}

type MainView = 'programs' | 'stats' | 'api'

type DivisionFilter =
  | 'All'
  | 'Aliyah'
  | 'Kulliyyah Senior'
  | 'Kulliyyah Junior'
  | 'Thanaviyyah'
  | 'Wusta / Ula'

export default function CampusDashboardClient({
  initialPrograms,
  initialView = 'programs',
}: CampusDashboardClientProps) {
  const [programs, setPrograms] = useState<IProgram[]>(initialPrograms)
  const [activeView, setActiveView] = useState<MainView>(
    initialView === 'stats' || initialView === 'api' ? initialView : 'programs'
  )
  const [activeDivision, setActiveDivision] = useState<DivisionFilter>('All')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isAdminOpen, setIsAdminOpen] = useState(false)
  const [copiedShare, setCopiedShare] = useState(false)

  // Sync view with URL query param on mount or popstate
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const v = urlParams.get('view')
      if (v === 'stats' || v === 'api' || v === 'programs') {
        setActiveView(v as MainView)
      }
    }
  }, [])

  const setView = (v: MainView) => {
    setActiveView(v)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      if (v === 'programs') {
        url.searchParams.delete('view')
      } else {
        url.searchParams.set('view', v)
      }
      window.history.pushState({}, '', url.toString())
    }
  }

  // Refresh programs when admin makes updates
  const handleDataRefresh = async () => {
    try {
      const res = await fetch('/api/programs')
      const data = await res.json()
      if (Array.isArray(data)) {
        setPrograms(data)
      }
    } catch (e) {
      console.error('Failed to reload programs:', e)
    }
  }

  const handleCopyQuickStats = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const url = `${origin}/?view=stats`
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(url)
      setCopiedShare(true)
      setTimeout(() => setCopiedShare(false), 2000)
    }
  }

  // Filter programs based on selected division tab
  const filteredPrograms = programs.filter((p) => {
    if (activeDivision === 'All') return true
    if (activeDivision === 'Wusta / Ula') {
      return p.division === 'Wusta' || p.division === 'Ula'
    }
    return p.division === activeDivision
  })

  // Campus stats calculations
  const allCandidates = programs.flatMap((p) => p.candidates || [])
  const avgReadiness = allCandidates.length
    ? Math.round(
        allCandidates.reduce((s, c) => s + (c.overallAccuracy || 0), 0) / allCandidates.length
      )
    : 0

  const getDivisionCount = (filter: DivisionFilter) => {
    if (filter === 'All') return programs.length
    if (filter === 'Wusta / Ula') {
      return programs.filter((p) => p.division === 'Wusta' || p.division === 'Ula').length
    }
    return programs.filter((p) => p.division === filter).length
  }

  const divisionTabs: { id: DivisionFilter; label: string }[] = [
    { id: 'All', label: 'All Divisions' },
    { id: 'Aliyah', label: 'Aliyah' },
    { id: 'Kulliyyah Senior', label: 'Kulliyyah Senior' },
    { id: 'Kulliyyah Junior', label: 'Kulliyyah Junior' },
    { id: 'Thanaviyyah', label: 'Thanaviyyah' },
    { id: 'Wusta / Ula', label: 'Wusta / Ula' },
  ]

  const handleProgramCreated = (newProgram: IProgram) => {
    setPrograms((prev) => [newProgram, ...prev])
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* Branded First-Visit Preloader */}
      <Preloader />

      {/* ========================================================= */}
      {/* 1. DESKTOP FIXED LEFT SIDEBAR (lg:flex)                   */}
      {/* ========================================================= */}
      <aside className="hidden lg:flex w-64 bg-[#1E2538] text-[#FAF9F6] min-h-screen fixed left-0 top-0 flex-col justify-between p-5 z-40 border-r border-[#2A334C]">
        {/* Top Section */}
        <div>
          {/* Brand Block */}
          <div className="flex items-center gap-3.5 mb-8 px-1">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#2A334C] to-[#161B29] border-2 border-[#FF6B4A]/50 flex items-center justify-center shadow-lg">
              <span className="text-lg font-black text-white tracking-tighter">SST</span>
            </div>
            <div>
              <div className="text-base font-black text-white leading-none tracking-tight">SST</div>
              <div className="text-[10px] font-bold text-[#8B95A5] uppercase tracking-wider mt-1">
                SHIA SIBAQ Training
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5" aria-label="Main Navigation">
            {/* 1. Programs */}
            <button
              onClick={() => setView('programs')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-black transition-all ${
                activeView === 'programs'
                  ? 'bg-[#FF6B4A] text-white shadow-md'
                  : 'text-[#8B95A5] hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <LayoutGrid className="w-4 h-4 stroke-[1.75]" />
                <span>Programs</span>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  activeView === 'programs' ? 'bg-black/20 text-white' : 'bg-white/10 text-slate-300'
                }`}
              >
                {programs.length}
              </span>
            </button>

            {/* 2. Today's Statistics */}
            <button
              onClick={() => setView('stats')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-black transition-all ${
                activeView === 'stats'
                  ? 'bg-[#FF6B4A] text-white shadow-md'
                  : 'text-[#8B95A5] hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <BarChart3 className="w-4 h-4 stroke-[1.75]" />
                <span>Today&apos;s Statistics</span>
              </div>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded font-black tracking-wider uppercase ${
                  activeView === 'stats' ? 'bg-white text-[#FF6B4A]' : 'bg-[#00A896] text-white'
                }`}
              >
                LIVE
              </span>
            </button>

            {/* 3. API Telemetry */}
            <button
              onClick={() => setView('api')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-black transition-all ${
                activeView === 'api'
                  ? 'bg-[#FF6B4A] text-white shadow-md'
                  : 'text-[#8B95A5] hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4 stroke-[1.75]" />
                <span>API Telemetry</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-[#00A896] animate-pulse" />
            </button>

            {/* 4. Admin Control */}
            <button
              onClick={() => setIsAdminOpen(true)}
              className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-black text-[#8B95A5] hover:text-white hover:bg-white/5 transition-all"
            >
              <ShieldCheck className="w-4 h-4 stroke-[1.75] text-[#5F4BB6]" />
              <span>Admin Control</span>
            </button>
          </nav>
        </div>

        {/* Bottom Sidebar Action Block */}
        <div className="space-y-2.5 pt-6 border-t border-[#2A334C]">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full py-3 px-4 rounded-2xl bg-[#FF6B4A] border-2 border-[#E85635] border-b-4 border-b-[#C94224] text-white font-black text-xs hover:bg-[#E85635] active:border-b-2 active:translate-y-[2px] transition-all flex items-center justify-center gap-2 shadow-md"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Add Program</span>
          </button>

          <button
            onClick={handleCopyQuickStats}
            className="w-full py-2.5 px-3 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2"
          >
            {copiedShare ? (
              <Check className="w-3.5 h-3.5 text-[#00A896]" />
            ) : (
              <Share2 className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>{copiedShare ? 'Link Copied!' : "Share Today's Stats"}</span>
          </button>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 2. MAIN CONTENT AREA (lg:pl-64)                          */}
      {/* ========================================================= */}
      <main className="min-h-screen pb-24 lg:pb-10 lg:pl-64">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
          {/* VIEW: Today's Statistics */}
          {activeView === 'stats' && <TodayStatsView programs={programs} />}

          {/* VIEW: API Telemetry */}
          {activeView === 'api' && (
            <div className="animate-in fade-in duration-300">
              <ApiTrackerTab onTriggerAdmin={() => setIsAdminOpen(true)} />
            </div>
          )}

          {/* VIEW: Main Programs Grid */}
          {activeView === 'programs' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Header Hero */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black tracking-widest uppercase bg-[#1E2538] text-white">
                      SST HUB
                    </span>
                    <span className="text-xs text-slate-400 font-medium">Campus Division Hub</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-[#1E2538] tracking-tight">
                    Programs &amp; Candidate Workspaces
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    {programs.length} active programs · {allCandidates.length} enrolled candidates ·{' '}
                    <span className="font-bold text-[#00A896]">{avgReadiness}% campus readiness</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#1E2538] text-white font-black text-xs hover:bg-[#2A334C] active:translate-y-[2px] transition-all shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#FF6B4A] stroke-[3]" />
                    <span>+ Add Program / Preset</span>
                  </button>
                </div>
              </div>

              {/* Division Filter Bar */}
              <div className="overflow-x-auto pb-1 scrollbar-none">
                <div className="flex items-center gap-2 min-w-max bg-white p-1.5 rounded-2xl border-2 border-slate-200/80 shadow-sm">
                  <span className="px-3 py-1.5 text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" /> Division:
                  </span>
                  {divisionTabs.map((tab) => {
                    const count = getDivisionCount(tab.id)
                    const isActive = activeDivision === tab.id

                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveDivision(tab.id)}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
                          isActive
                            ? 'bg-[#1E2538] text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <span>{tab.label}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                            isActive
                              ? 'bg-[#FF6B4A] text-white'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Programs Grid */}
              {filteredPrograms.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200 p-8">
                  <h3 className="text-base font-black text-slate-800 mb-1">
                    No programs enrolled under {activeDivision}
                  </h3>
                  <p className="text-slate-400 text-xs mb-4">
                    Quickly add official SIBAQ presets or create a custom training track.
                  </p>
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="px-4 py-2 bg-[#FF6B4A] text-white rounded-xl text-xs font-black active:translate-y-[2px] transition-all"
                  >
                    + Add Program to {activeDivision}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {filteredPrograms.map((program) => (
                    <ProgramCard key={program.code} program={program} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Minimal SST Footer */}
          <footer className="mt-16 pt-8 border-t border-slate-200/80 text-center text-xs text-slate-400">
            SST — SHIA SIBAQ Training App · High Performance AI Assessment Engine
          </footer>
        </div>
      </main>

      {/* ========================================================= */}
      {/* 3. MOBILE FIXED BOTTOM GLASS DOCK (lg:hidden)             */}
      {/* ========================================================= */}
      <nav
        aria-label="Mobile Dock Navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#1E2538]/95 backdrop-blur-md text-[#FAF9F6] border-t border-white/10 h-16 px-4 flex items-center justify-around shadow-2xl"
      >
        {/* Item 1: Programs */}
        <button
          onClick={() => setView('programs')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
            activeView === 'programs' ? 'text-[#FF6B4A] font-black' : 'text-[#8B95A5] font-bold'
          }`}
        >
          <LayoutGrid className="w-5 h-5 stroke-[1.75]" />
          <span className="text-[10px]">Programs</span>
        </button>

        {/* Item 2: Stats */}
        <button
          onClick={() => setView('stats')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
            activeView === 'stats' ? 'text-[#FF6B4A] font-black' : 'text-[#8B95A5] font-bold'
          }`}
        >
          <BarChart3 className="w-5 h-5 stroke-[1.75]" />
          <span className="text-[10px]">Stats</span>
        </button>

        {/* Item 3: Center Floating + Add Button */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex flex-col items-center justify-center -mt-6 w-12 h-12 rounded-2xl bg-[#FF6B4A] border-2 border-[#E85635] border-b-4 border-b-[#C94224] text-white shadow-xl active:translate-y-[2px] transition-all"
          title="Add Program"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </button>

        {/* Item 4: API Telemetry */}
        <button
          onClick={() => setView('api')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
            activeView === 'api' ? 'text-[#FF6B4A] font-black' : 'text-[#8B95A5] font-bold'
          }`}
        >
          <Activity className="w-5 h-5 stroke-[1.75]" />
          <span className="text-[10px]">API</span>
        </button>

        {/* Item 5: Admin */}
        <button
          onClick={() => setIsAdminOpen(true)}
          className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[#8B95A5] hover:text-white font-bold transition-all"
        >
          <ShieldCheck className="w-5 h-5 stroke-[1.75] text-[#5F4BB6]" />
          <span className="text-[10px]">Admin</span>
        </button>
      </nav>

      {/* Add Program Modal */}
      <AddProgramModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onProgramCreated={handleProgramCreated}
      />

      {/* Admin Management Modal */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        onDataChanged={handleDataRefresh}
      />
    </div>
  )
}
