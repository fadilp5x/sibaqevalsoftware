'use client'

import { useState } from 'react'
import {
  GraduationCap,
  Flame,
  Trophy,
  Plus,
  Layers,
  Shield,
  Activity,
  LayoutGrid,
} from 'lucide-react'
import ProgramCard from '@/components/ProgramCard'
import AddProgramModal from '@/components/AddProgramModal'
import AdminModal from '@/components/AdminModal'
import ApiTrackerTab from '@/components/ApiTrackerTab'
import Preloader from '@/components/Preloader'
import { IProgram } from '@/models'

interface CampusDashboardClientProps {
  initialPrograms: IProgram[]
}

type MainTab = 'programs' | 'telemetry'

type DivisionFilter =
  | 'All'
  | 'Aliyah'
  | 'Kulliyyah Senior'
  | 'Kulliyyah Junior'
  | 'Thanaviyyah'
  | 'Wusta / Ula'

export default function CampusDashboardClient({ initialPrograms }: CampusDashboardClientProps) {
  const [programs, setPrograms] = useState<IProgram[]>(initialPrograms)
  const [mainTab, setMainTab] = useState<MainTab>('programs')
  const [activeDivision, setActiveDivision] = useState<DivisionFilter>('All')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isAdminOpen, setIsAdminOpen] = useState(false)

  // Refresh programs from server when admin makes changes
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

  // Filter programs based on selected division tab
  const filteredPrograms = programs.filter((p) => {
    if (activeDivision === 'All') return true
    if (activeDivision === 'Wusta / Ula') {
      return p.division === 'Wusta' || p.division === 'Ula'
    }
    return p.division === activeDivision
  })

  // Campus stats
  const allCandidates = programs.flatMap((p) => p.candidates || [])
  const avgReadiness = allCandidates.length
    ? Math.round(
        allCandidates.reduce((s, c) => s + (c.overallAccuracy || 0), 0) / allCandidates.length
      )
    : 0
  const totalStreakDays = allCandidates.reduce((s, c) => s + (c.streakDays || 0), 0)

  // Division counts
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
    <main className="min-h-screen pb-24 md:pb-12" style={{ background: '#F7F7F5' }}>
      {/* Branded First-Visit Preloader */}
      <Preloader />

      {/* Top Header */}
      <header className="bg-white border-b-2 border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500 to-sky-700 flex items-center justify-center shadow">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900 leading-none">SIBAQ &apos;26 Hub</h1>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                  Campus 2.0
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Aliyah &amp; Kulliyyah Assessment Hub</p>
            </div>
          </div>

          {/* Stats Badges */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-1.5">
              <Trophy className="w-4 h-4 text-green-600" />
              <div>
                <div className="text-xs font-black text-green-700">{avgReadiness}%</div>
                <div className="text-[9px] text-green-600 uppercase tracking-wide">Campus Ready</div>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5">
              <Flame className="w-4 h-4 text-amber-600" />
              <div>
                <div className="text-xs font-black text-amber-700">{totalStreakDays}</div>
                <div className="text-[9px] text-amber-600 uppercase tracking-wide">Streak Days</div>
              </div>
            </div>
          </div>

          {/* Action buttons (Desktop) */}
          <div className="flex items-center gap-2.5">
            {/* Admin control button */}
            <button
              onClick={() => setIsAdminOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 border-2 border-slate-300 border-b-4 border-b-slate-400 text-slate-700 hover:bg-slate-200 active:translate-y-[2px] active:border-b-2 text-xs font-bold transition-all shadow-sm"
              title="Admin Control Center (adminshia / 1234)"
            >
              <Shield className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline">Admin</span>
            </button>

            {/* Add program button */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-sky-500 border-2 border-sky-600 border-b-4 border-b-sky-700 text-white font-black text-xs sm:text-sm hover:bg-sky-600 active:translate-y-[2px] active:border-b-2 transition-all duration-100 shadow-sm"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Add Program</span>
            </button>
          </div>
        </div>

        {/* Primary View Switcher: Programs vs API Tracker */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-1 pb-2 flex items-center gap-2 border-t border-slate-100">
          <button
            onClick={() => setMainTab('programs')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all border-2 border-b-4 active:border-b-2 active:translate-y-[1px] ${
              mainTab === 'programs'
                ? 'bg-sky-500 border-sky-600 border-b-sky-700 text-white shadow-sm'
                : 'bg-white border-slate-200 border-b-slate-300 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>🏆 Programs Roster</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                mainTab === 'programs' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {programs.length}
            </span>
          </button>

          <button
            onClick={() => setMainTab('telemetry')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all border-2 border-b-4 active:border-b-2 active:translate-y-[1px] ${
              mainTab === 'telemetry'
                ? 'bg-indigo-600 border-indigo-700 border-b-indigo-900 text-white shadow-sm'
                : 'bg-white border-slate-200 border-b-slate-300 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>⚡ API Usage &amp; Limits</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-md font-bold bg-amber-400 text-amber-950 uppercase tracking-wider">
              Live
            </span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {mainTab === 'telemetry' ? (
          <ApiTrackerTab onTriggerAdmin={() => setIsAdminOpen(true)} />
        ) : (
          <>
            {/* Hero banner */}
            <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">
                  Campus Programs &amp; Candidate Roster
                </h2>
                <p className="text-slate-500 text-xs sm:text-sm">
                  {programs.length} active programs · {allCandidates.length} enrolled candidates ·{' '}
                  <span className="text-green-600 font-bold">{avgReadiness}% average campus readiness</span>
                </p>
              </div>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="self-start md:self-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-slate-200 border-b-4 border-b-slate-300 text-slate-700 hover:bg-slate-50 active:translate-y-[2px] active:border-b-2 text-xs font-bold transition-all"
              >
                <Plus className="w-3.5 h-3.5 text-sky-600" /> + Add Program / Preset
              </button>
            </div>

            {/* Tactile Division Filter Bar */}
            <div className="mb-6 overflow-x-auto pb-2 scrollbar-none">
              <div className="flex items-center gap-2 min-w-max bg-white/70 backdrop-blur-sm p-1.5 rounded-2xl border-2 border-slate-200">
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
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border-2 border-b-4 text-xs font-black transition-all active:border-b-2 active:translate-y-[2px] ${
                        isActive
                          ? 'bg-slate-800 border-slate-600 border-b-slate-900 text-white shadow-sm'
                          : 'bg-white border-slate-200 border-b-slate-300 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                          isActive ? 'bg-slate-700 text-sky-300' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Program grid */}
            {filteredPrograms.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-slate-200 p-8">
                <div className="text-5xl mb-3">📚</div>
                <h3 className="text-lg font-black text-slate-800 mb-1">
                  No programs in {activeDivision} division
                </h3>
                <p className="text-slate-500 text-xs mb-4">
                  Add programs using the official SIBAQ &apos;26 syllabus presets or create a custom one.
                </p>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2 bg-sky-500 border-2 border-sky-600 border-b-4 border-b-sky-700 text-white rounded-xl text-xs font-black active:translate-y-[2px] active:border-b-2 transition-all"
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
          </>
        )}

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-slate-200 text-center text-xs text-slate-400">
          SIBAQ &apos;26 Aliyah &amp; Kulliyyah Assessment Hub · Powered by NVIDIA Nemotron AI &amp; Firecrawl
        </div>
      </div>

      {/* Mobile-First Sticky Bottom Navigation Bar (md:hidden) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t-2 border-slate-200 px-4 py-2 flex items-center justify-around shadow-2xl"
      >
        <button
          onClick={() => setMainTab('programs')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            mainTab === 'programs' ? 'text-sky-600 font-black' : 'text-slate-500 font-bold'
          }`}
        >
          <LayoutGrid className="w-5 h-5" />
          <span className="text-[10px]">Programs</span>
        </button>

        <button
          onClick={() => setMainTab('telemetry')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            mainTab === 'telemetry' ? 'text-indigo-600 font-black' : 'text-slate-500 font-bold'
          }`}
        >
          <Activity className="w-5 h-5" />
          <span className="text-[10px]">API Limits</span>
        </button>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex flex-col items-center justify-center -mt-5 w-12 h-12 rounded-2xl bg-sky-500 border-2 border-sky-600 border-b-4 border-b-sky-700 text-white shadow-lg active:translate-y-[2px]"
          title="Add Program"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </button>

        <button
          onClick={() => setIsAdminOpen(true)}
          className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-slate-500 hover:text-slate-800 font-bold transition-all"
        >
          <Shield className="w-5 h-5 text-indigo-500" />
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
    </main>
  )
}
