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
    <main className="min-h-screen bg-[#F7F7F7]">
      {/* Duolingo Crisp Header */}
      <div className="bg-white text-[#4B4B4B] border-b-2 border-[#E5E5E5]">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-5">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F7F7F7] border border-[#E5E5E5] text-[#777777] hover:text-[#4B4B4B] hover:bg-[#E5E5E5] text-xs font-black uppercase tracking-wider mb-3 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Back to Programs Hub</span>
          </Link>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-black px-3 py-1 rounded-xl bg-[#1CB0F6] border-b-2 border-[#1899D6] text-white uppercase tracking-wider">
                  {program.code}
                </span>
                <span className="text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-xl bg-[#F7F7F7] text-[#777777] border border-[#E5E5E5]">
                  {program.division || 'Aliyah'}
                </span>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-[#F7F7F7] text-[#777777]">
                  {program.category}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#4B4B4B] tracking-tight uppercase">
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
