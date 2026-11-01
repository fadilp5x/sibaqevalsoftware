'use client'

import { useState } from 'react'
import { GraduationCap, Flame, Trophy, Plus, Layers } from 'lucide-react'
import ProgramCard from '@/components/ProgramCard'
import AddProgramModal from '@/components/AddProgramModal'
import { IProgram } from '@/models'

interface CampusDashboardClientProps {
  initialPrograms: IProgram[]
}

type DivisionFilter =
  | 'All'
  | 'Aliyah'
  | 'Kulliyyah Senior'
  | 'Kulliyyah Junior'
  | 'Thanaviyyah'
  | 'Wusta / Ula'

export default function CampusDashboardClient({ initialPrograms }: CampusDashboardClientProps) {
  const [programs, setPrograms] = useState<IProgram[]>(initialPrograms)
  const [activeDivision, setActiveDivision] = useState<DivisionFilter>('All')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

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
    <main className="min-h-screen" style={{ background: '#F7F7F5' }}>
      {/* Top Header */}
      <header className="bg-white border-b-2 border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500 to-sky-700 flex items-center justify-center shadow">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 leading-none">SIBAQ &apos;26 Hub</h1>
              <p className="text-xs text-slate-500 font-medium">All-Division Campus Assessment Hub</p>
            </div>
          </div>

          {/* Stats */}
          <div className="hidden sm:flex items-center gap-4">
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
              <Trophy className="w-4 h-4 text-green-600" />
              <div>
                <div className="text-sm font-black text-green-700">{avgReadiness}%</div>
                <div className="text-[10px] text-green-600 uppercase tracking-wide">Campus Ready</div>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              <Flame className="w-4 h-4 text-amber-600" />
              <div>
                <div className="text-sm font-black text-amber-700">{totalStreakDays}</div>
                <div className="text-[10px] text-amber-600 uppercase tracking-wide">Streak Days</div>
              </div>
            </div>
          </div>

          {/* Add program button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 border-2 border-sky-600 border-b-4 border-b-sky-700 text-white font-black text-sm hover:bg-sky-600 active:translate-y-[2px] active:border-b-2 transition-all duration-100 shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span className="hidden sm:inline">Add Program</span>
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero banner */}
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-900 mb-1.5">
              Programs &amp; Candidates Dashboard
            </h2>
            <p className="text-slate-500 text-sm">
              {programs.length} active programs across campus divisions · {allCandidates.length} candidates enrolled ·{' '}
              <span className="text-green-600 font-bold">{avgReadiness}% average readiness</span>
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
        <div className="mb-8 overflow-x-auto pb-2 scrollbar-none">
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
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200 p-8">
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

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-slate-200 text-center text-xs text-slate-400">
          SIBAQ &apos;26 Aliyah &amp; Kulliyyah Assessment Hub · Powered by NVIDIA Nemotron AI &amp; Firecrawl
        </div>
      </div>

      {/* Add Program Modal */}
      <AddProgramModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onProgramCreated={handleProgramCreated}
      />
    </main>
  )
}
