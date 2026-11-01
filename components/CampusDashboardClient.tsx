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
  Volume2,
  VolumeX,
} from 'lucide-react'
import ProgramCard from '@/components/ProgramCard'
import AddProgramModal from '@/components/AddProgramModal'
import AdminModal from '@/components/AdminModal'
import ApiTrackerTab from '@/components/ApiTrackerTab'
import TodayStatsView from '@/components/TodayStatsView'
import Preloader from '@/components/Preloader'
import { IProgram } from '@/models'
import { isMuted, toggleMute, playClickPop } from '@/lib/sounds'

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
  const [soundMuted, setSoundMuted] = useState(false)

  // Initialize sound state
  useEffect(() => {
    setSoundMuted(isMuted())
    const handleMuteEvent = () => setSoundMuted(isMuted())
    window.addEventListener('sst-mute-change', handleMuteEvent)
    return () => window.removeEventListener('sst-mute-change', handleMuteEvent)
  }, [])

  // Sync view with URL query param on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const v = urlParams.get('view')
      if (v === 'stats' || v === 'api' || v === 'programs') {
        setActiveView(v as MainView)
      }
    }
  }, [])

  const handleSoundToggle = () => {
    const next = toggleMute()
    setSoundMuted(next)
    if (!next) {
      playClickPop()
    }
  }

  const setView = (v: MainView) => {
    playClickPop()
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
    playClickPop()
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
    <div className="min-h-screen bg-[#F7F7F7]">
      {/* Duolingo Bouncing Shield Preloader */}
      <Preloader />

      {/* ========================================================= */}
      {/* 1. DESKTOP FIXED LEFT SIDEBAR (lg:flex) — DUOLINGO WHITE  */}
      {/* ========================================================= */}
      <aside className="hidden lg:flex w-64 bg-white text-[#4B4B4B] min-h-screen fixed left-0 top-0 flex-col justify-between p-5 z-40 border-r-2 border-[#E5E5E5] select-none">
        {/* Top Section */}
        <div>
          {/* Brand Block */}
          <div className="flex items-center gap-3.5 mb-8 px-1">
            <div className="w-12 h-12 rounded-2xl bg-[#58CC02] border-2 border-[#58A700] border-b-4 flex items-center justify-center shadow-xs">
              <span className="text-xl font-black text-white tracking-wider leading-none">SST</span>
            </div>
            <div>
              <div className="text-lg font-black text-[#4B4B4B] leading-none tracking-tight">SST</div>
              <div className="text-[11px] font-extrabold text-[#777777] uppercase tracking-wider mt-1">
                SIBAQ Training
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-2" aria-label="Main Navigation">
            {/* 1. Programs */}
            <button
              onClick={() => setView('programs')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all select-none ${
                activeView === 'programs'
                  ? 'bg-[#DDF4FF] text-[#1899D6] border-2 border-[#84D8FF] border-b-4 border-b-[#1899D6]'
                  : 'text-[#777777] hover:bg-[#F7F7F7] hover:text-[#4B4B4B]'
              }`}
            >
              <div className="flex items-center gap-3">
                <LayoutGrid className="w-5 h-5 stroke-[2.5]" />
                <span>Programs</span>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                  activeView === 'programs' ? 'bg-[#1899D6] text-white' : 'bg-[#E5E5E5] text-[#777777]'
                }`}
              >
                {programs.length}
              </span>
            </button>

            {/* 2. Today's Statistics */}
            <button
              onClick={() => setView('stats')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all select-none ${
                activeView === 'stats'
                  ? 'bg-[#DDF4FF] text-[#1899D6] border-2 border-[#84D8FF] border-b-4 border-b-[#1899D6]'
                  : 'text-[#777777] hover:bg-[#F7F7F7] hover:text-[#4B4B4B]'
              }`}
            >
              <div className="flex items-center gap-3">
                <BarChart3 className="w-5 h-5 stroke-[2.5]" />
                <span>Statistics</span>
              </div>
              <span className="text-[9px] px-2 py-0.5 rounded-md font-black tracking-wider uppercase bg-[#58CC02] text-white">
                LIVE
              </span>
            </button>

            {/* 3. API Telemetry */}
            <button
              onClick={() => setView('api')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all select-none ${
                activeView === 'api'
                  ? 'bg-[#DDF4FF] text-[#1899D6] border-2 border-[#84D8FF] border-b-4 border-b-[#1899D6]'
                  : 'text-[#777777] hover:bg-[#F7F7F7] hover:text-[#4B4B4B]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 stroke-[2.5]" />
                <span>API Telemetry</span>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-[#58CC02] animate-pulse" />
            </button>

            {/* 4. Admin Control */}
            <button
              onClick={() => {
                playClickPop()
                setIsAdminOpen(true)
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wider text-[#777777] hover:bg-[#F7F7F7] hover:text-[#4B4B4B] transition-all select-none"
            >
              <ShieldCheck className="w-5 h-5 stroke-[2.5] text-[#CE82FF]" />
              <span>Admin Panel</span>
            </button>
          </nav>
        </div>

        {/* Bottom Sidebar Action Block */}
        <div className="space-y-3 pt-6 border-t-2 border-[#E5E5E5]">
          {/* Sound Mute / Unmute Toggle */}
          <button
            onClick={handleSoundToggle}
            className="w-full py-2.5 px-3 rounded-xl bg-[#F7F7F7] border border-[#E5E5E5] text-xs font-extrabold text-[#777777] hover:text-[#4B4B4B] hover:bg-[#E5E5E5] transition-all flex items-center justify-center gap-2 select-none"
          >
            {soundMuted ? (
              <>
                <VolumeX className="w-4 h-4 text-[#FF4B4B] stroke-[2.5]" />
                <span>Sound: MUTED</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-[#58CC02] stroke-[2.5]" />
                <span>Sound: ACTIVE</span>
              </>
            )}
          </button>

          {/* + Add Program 3D Button */}
          <button
            onClick={() => {
              playClickPop()
              setIsAddModalOpen(true)
            }}
            className="w-full py-3 px-4 rounded-2xl bg-[#58CC02] border-2 border-[#58A700] border-b-4 text-white font-black text-xs uppercase tracking-wider hover:bg-[#58A700] active:border-b-0 active:translate-y-[4px] transition-all duration-75 flex items-center justify-center gap-2 shadow-xs select-none"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Add Program</span>
          </button>

          {/* Share Today's Stats Link */}
          <button
            onClick={handleCopyQuickStats}
            className="w-full py-2.5 px-3 rounded-2xl bg-white border-2 border-[#E5E5E5] text-xs font-extrabold text-[#777777] hover:bg-[#F7F7F7] hover:text-[#4B4B4B] transition-all flex items-center justify-center gap-2 select-none"
          >
            {copiedShare ? (
              <Check className="w-4 h-4 text-[#58CC02] stroke-[2.5]" />
            ) : (
              <Share2 className="w-4 h-4 text-[#777777] stroke-[2.5]" />
            )}
            <span>{copiedShare ? 'Link Copied!' : "Share Stats Link"}</span>
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
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2.5 py-1 rounded-xl text-[10px] font-black tracking-wider uppercase bg-[#1CB0F6] border-b-2 border-[#1899D6] text-white">
                      SST HUB
                    </span>
                    <span className="text-xs font-bold text-[#777777]">SIBAQ &apos;26 Al-Aliyah Campus Hub</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-[#4B4B4B] tracking-tight uppercase">
                    Programs &amp; Candidate Workspaces
                  </h1>
                  <p className="text-xs sm:text-sm font-bold text-[#777777] mt-1">
                    {programs.length} active programs · {allCandidates.length} enrolled candidates ·{' '}
                    <span className="font-black text-[#58CC02]">{avgReadiness}% campus readiness</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={() => {
                      playClickPop()
                      setIsAddModalOpen(true)
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#58CC02] border-2 border-[#58A700] border-b-4 text-white font-black text-xs uppercase tracking-wider hover:bg-[#58A700] active:border-b-0 active:translate-y-[4px] transition-all duration-75 select-none"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>+ Add Program / Preset</span>
                  </button>
                </div>
              </div>

              {/* Division Filter Bar */}
              <div className="overflow-x-auto pb-1 scrollbar-none">
                <div className="flex items-center gap-2 min-w-max bg-white p-2 rounded-2xl border-2 border-[#E5E5E5] border-b-4 shadow-xs">
                  <span className="px-3 py-1.5 text-xs font-black text-[#777777] uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 stroke-[2.5]" /> Division:
                  </span>
                  {divisionTabs.map((tab) => {
                    const count = getDivisionCount(tab.id)
                    const isActive = activeDivision === tab.id

                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          playClickPop()
                          setActiveDivision(tab.id)
                        }}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all select-none ${
                          isActive
                            ? 'bg-[#1CB0F6] border-b-2 border-[#1899D6] text-white shadow-xs'
                            : 'text-[#777777] hover:text-[#4B4B4B] hover:bg-[#F7F7F7]'
                        }`}
                      >
                        <span>{tab.label}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                            isActive
                              ? 'bg-white text-[#1899D6]'
                              : 'bg-[#E5E5E5] text-[#777777]'
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
                <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-[#E5E5E5] p-8">
                  <h3 className="text-base font-black text-[#4B4B4B] mb-1 uppercase">
                    No programs enrolled under {activeDivision}
                  </h3>
                  <p className="text-[#777777] text-xs font-bold mb-4">
                    Quickly add official SIBAQ presets or create a custom training track.
                  </p>
                  <button
                    onClick={() => {
                      playClickPop()
                      setIsAddModalOpen(true)
                    }}
                    className="px-5 py-2.5 bg-[#58CC02] border-b-4 border-[#58A700] text-white rounded-xl text-xs font-black uppercase active:border-b-0 active:translate-y-[4px] transition-all"
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
          <footer className="mt-16 pt-8 border-t-2 border-[#E5E5E5] text-center text-xs font-bold text-[#777777] uppercase tracking-wider">
            SST — SHIA SIBAQ Training App · High Performance AI Assessment Hub
          </footer>
        </div>
      </main>

      {/* ========================================================= */}
      {/* 3. MOBILE FIXED BOTTOM DOCK (lg:hidden) — DUOLINGO WHITE  */}
      {/* ========================================================= */}
      <nav
        aria-label="Mobile Dock Navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white text-[#4B4B4B] border-t-2 border-[#E5E5E5] h-16 px-4 flex items-center justify-around select-none shadow-lg"
      >
        {/* Item 1: Programs */}
        <button
          onClick={() => setView('programs')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
            activeView === 'programs' ? 'text-[#1CB0F6] font-black' : 'text-[#777777] font-bold'
          }`}
        >
          <LayoutGrid className="w-5 h-5 stroke-[2.5]" />
          <span className="text-[10px] uppercase font-black">Programs</span>
        </button>

        {/* Item 2: Stats */}
        <button
          onClick={() => setView('stats')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
            activeView === 'stats' ? 'text-[#1CB0F6] font-black' : 'text-[#777777] font-bold'
          }`}
        >
          <BarChart3 className="w-5 h-5 stroke-[2.5]" />
          <span className="text-[10px] uppercase font-black">Stats</span>
        </button>

        {/* Item 3: Center 3D Floating + Add Button */}
        <button
          onClick={() => {
            playClickPop()
            setIsAddModalOpen(true)
          }}
          className="flex flex-col items-center justify-center -mt-6 w-12 h-12 rounded-2xl bg-[#58CC02] border-2 border-[#58A700] border-b-4 text-white shadow-lg active:border-b-0 active:translate-y-[4px] transition-all"
          title="Add Program"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </button>

        {/* Item 4: Sound Toggle on Mobile */}
        <button
          onClick={handleSoundToggle}
          className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[#777777] font-bold transition-all"
        >
          {soundMuted ? (
            <VolumeX className="w-5 h-5 text-[#FF4B4B] stroke-[2.5]" />
          ) : (
            <Volume2 className="w-5 h-5 text-[#58CC02] stroke-[2.5]" />
          )}
          <span className="text-[10px] uppercase font-black">
            {soundMuted ? 'Muted' : 'Sound'}
          </span>
        </button>

        {/* Item 5: Admin */}
        <button
          onClick={() => {
            playClickPop()
            setIsAdminOpen(true)
          }}
          className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[#777777] font-bold transition-all"
        >
          <ShieldCheck className="w-5 h-5 stroke-[2.5] text-[#CE82FF]" />
          <span className="text-[10px] uppercase font-black">Admin</span>
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
