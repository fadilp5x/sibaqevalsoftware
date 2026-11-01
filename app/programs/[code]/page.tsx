import { connectDB } from '@/lib/mongodb'
import { Program, Quiz, StudyMaterial, Attempt } from '@/models'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import ProgramHubClient from './ProgramHubClient'

export const dynamic = 'force-dynamic'

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

export default async function ProgramHubPage({
  params,
  searchParams,
}: {
  params: { code: string }
  searchParams?: { candidate?: string }
}) {
  const { program, quizzes, materials, attempts } = await getData(params.code)

  if (!program) notFound()

  return (
    <main className="min-h-screen bg-[#FAF9F6]">
      {/* Sleek SST Header */}
      <div className="bg-[#1E2538] text-white border-b border-[#2A334C]">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-5">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[#8B95A5] hover:text-white text-xs font-bold mb-3 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to SST Programs Hub</span>
          </Link>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded-lg bg-[#2A334C] text-white border border-white/10">
                  {program.code}
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg bg-white/10 text-slate-300">
                  {program.division || 'Aliyah'}
                </span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-white/5 text-slate-400">
                  {program.category}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {program.title}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Workspace Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6">
        <ProgramHubClient
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          program={JSON.parse(JSON.stringify(program)) as any}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          quizzes={JSON.parse(JSON.stringify(quizzes)) as any}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          materials={JSON.parse(JSON.stringify(materials)) as any}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          attempts={JSON.parse(JSON.stringify(attempts)) as any}
          initialCandidate={searchParams?.candidate}
        />
      </div>
    </main>
  )
}
