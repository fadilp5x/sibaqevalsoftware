import { connectDB } from '@/lib/mongodb'
import { Program, Quiz, StudyMaterial, Attempt } from '@/models'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import ProgramHubClient from './ProgramHubClient'

export const dynamic = 'force-dynamic'

const accentConfig: Record<string, { header: string; badge: string }> = {
  emerald: { header: 'from-green-500 to-green-700', badge: 'bg-green-100 text-green-700 border-green-200' },
  sky: { header: 'from-sky-500 to-sky-700', badge: 'bg-sky-100 text-sky-700 border-sky-200' },
  amber: { header: 'from-amber-400 to-amber-600', badge: 'bg-amber-100 text-amber-700 border-amber-200' },
  purple: { header: 'from-purple-500 to-purple-700', badge: 'bg-purple-100 text-purple-700 border-purple-200' },
  rose: { header: 'from-rose-500 to-rose-700', badge: 'bg-rose-100 text-rose-700 border-rose-200' },
}

async function getData(code: string) {
  await connectDB()
  const formattedCode = code.toUpperCase()
  const [program, quizzes, materials, attempts] = await Promise.all([
    Program.findOne({ code: formattedCode }).lean(),
    Quiz.find({ programCode: formattedCode }).sort({ createdAt: -1 }).lean(),
    StudyMaterial.find({ programCode: formattedCode }).sort({ createdAt: -1 }).lean(),
    Attempt.find({ programCode: formattedCode }).sort({ submittedAt: 1 }).lean(),
  ])
  return { program, quizzes, materials, attempts }
}

export default async function ProgramHubPage({ params }: { params: { code: string } }) {
  const { program, quizzes, materials, attempts } = await getData(params.code)

  if (!program) notFound()

  const cfg = accentConfig[program.accentColor] || accentConfig.sky

  return (
    <main className="min-h-screen" style={{ background: '#F7F7F5' }}>
      {/* Program header */}
      <div className={`bg-gradient-to-br ${cfg.header} text-white`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <Link href="/" className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-semibold mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Campus
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg border bg-white/20 border-white/30 text-white">
                  {program.code}
                </span>
                <span className="text-xs bg-white/20 border border-white/30 px-2 py-1 rounded-lg font-bold uppercase tracking-wider text-[11px]">
                  {program.division || 'Aliyah'}
                </span>
                <span className="text-xs bg-white/20 border border-white/30 px-2 py-1 rounded-lg font-medium">
                  {program.category}
                </span>
                <span className="text-xs bg-white/20 border border-white/30 px-2 py-1 rounded-lg font-medium">
                  {program.durationMinutes} min
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black leading-tight">{program.title}</h1>
              <p className="text-white/80 text-sm mt-1">{program.skill}</p>
            </div>
          </div>

          {/* Concept note */}
          <div className="mt-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4">
            <p className="text-sm text-white/90 leading-relaxed">{program.conceptNote}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <ProgramHubClient
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          program={JSON.parse(JSON.stringify(program)) as any}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          quizzes={JSON.parse(JSON.stringify(quizzes)) as any}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          materials={JSON.parse(JSON.stringify(materials)) as any}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          attempts={JSON.parse(JSON.stringify(attempts)) as any}
        />
      </div>
    </main>
  )
}
