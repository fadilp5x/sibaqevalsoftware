import { connectDB } from '@/lib/mongodb'
import { Program } from '@/models'
import { runSeed } from '@/app/api/seed/route'
import ProgramCard from '@/components/ProgramCard'
import { GraduationCap, Flame, Trophy, Plus } from 'lucide-react'

export const dynamic = 'force-dynamic'

async function getData() {
  await connectDB()

  // Auto-seed if DB is empty
  const count = await Program.countDocuments()
  if (count === 0) {
    await runSeed()
  }

  const programs = await Program.find({}).lean()
  return programs
}

export default async function CampusDashboard() {
  const programs = await getData()

  // Campus stats
  const allCandidates = programs.flatMap((p) => p.candidates)
  const avgReadiness = allCandidates.length
    ? Math.round(allCandidates.reduce((s, c) => s + c.overallAccuracy, 0) / allCandidates.length)
    : 0
  const totalStreakDays = allCandidates.reduce((s, c) => s + c.streakDays, 0)

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
              <h1 className="text-lg font-black text-slate-900 leading-none">SIBAQ &#39;26 Aliyah</h1>
              <p className="text-xs text-slate-500 font-medium">Kulliyyah Assessment Hub</p>
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
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-100 border-2 border-sky-300 border-b-4 border-b-sky-500 text-sky-700 font-bold text-sm hover:bg-sky-200 active:translate-y-[2px] active:border-b-2 transition-all duration-100">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Program</span>
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero text */}
        <div className="mb-8">
          <h2 className="text-3xl font-black text-slate-900 mb-2">
            Programs Dashboard
          </h2>
          <p className="text-slate-500 text-base">
            {programs.length} active programs · {allCandidates.length} candidates enrolled ·{' '}
            <span className="text-green-600 font-semibold">{avgReadiness}% average readiness</span>
          </p>
        </div>

        {/* Program grid */}
        {programs.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">No programs yet</h3>
            <p className="text-slate-500">
              Visit <code className="bg-slate-100 px-2 py-1 rounded">/api/seed</code> to seed starter data
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {programs.map((program: any) => (
              <ProgramCard key={program.code} program={program} />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-slate-200 text-center text-xs text-slate-400">
          SIBAQ &apos;26 Aliyah Kulliyyah Assessment Hub · Powered by NVIDIA Nemotron &amp; Firecrawl
        </div>
      </div>
    </main>
  )
}
