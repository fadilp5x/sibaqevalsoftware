import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Program, Quiz, StudyMaterial, Attempt } from '@/models'

export async function GET(request: Request, { params }: { params: { code: string } }) {
  await connectDB()
  const { code } = params

  const [program, quizzes, materials, attempts] = await Promise.all([
    Program.findOne({ code }).lean(),
    Quiz.find({ programCode: code }).sort({ createdAt: -1 }).lean(),
    StudyMaterial.find({ programCode: code }).sort({ createdAt: -1 }).lean(),
    Attempt.find({ programCode: code }).sort({ submittedAt: 1 }).lean(),
  ])

  if (!program) {
    return NextResponse.json({ error: 'Program not found' }, { status: 404 })
  }

  return NextResponse.json({ program, quizzes, materials, attempts })
}
