import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Program, Quiz, StudyMaterial, Attempt } from '@/models'

export async function GET(request: Request, { params }: { params: { code: string } }) {
  await connectDB()
  const { code } = params

  const [program, quizzes, materials, attempts] = await Promise.all([
    Program.findOne({ code: code.toUpperCase() }).lean(),
    Quiz.find({ programCode: code.toUpperCase() }).sort({ createdAt: -1 }).lean(),
    StudyMaterial.find({ programCode: code.toUpperCase() }).sort({ createdAt: -1 }).lean(),
    Attempt.find({ programCode: code.toUpperCase() }).sort({ submittedAt: 1 }).lean(),
  ])

  if (!program) {
    return NextResponse.json({ error: 'Program not found' }, { status: 404 })
  }

  return NextResponse.json({ program, quizzes, materials, attempts })
}

export async function PATCH(request: Request, { params }: { params: { code: string } }) {
  await connectDB()
  const { code } = params
  const body = await request.json()
  const { candidate } = body

  if (!candidate || !candidate.name?.trim()) {
    return NextResponse.json({ error: 'Candidate name is required' }, { status: 400 })
  }

  const program = await Program.findOne({ code: code.toUpperCase() })
  if (!program) {
    return NextResponse.json({ error: 'Program not found' }, { status: 404 })
  }

  const palette = ['#1CB0F6', '#58CC02', '#FFC800', '#CE82FF', '#FF4B4B']
  const index = program.candidates.length
  const cleanName = candidate.name.trim()

  // Prevent duplicate candidate in roster
  const existing = program.candidates.find(
    (c) => c.name.toLowerCase() === cleanName.toLowerCase()
  )
  if (existing) {
    return NextResponse.json({ success: true, candidate: existing, program })
  }

  const newCand = {
    id: cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-') || `cand-${Date.now()}`,
    name: cleanName,
    regNo: candidate.regNo?.trim() || `${program.code}-${String(index + 1).padStart(3, '0')}`,
    avatarColor: palette[index % palette.length],
    streakDays: 1,
    overallAccuracy: 0,
    strengths: [],
    weaknesses: [],
  }

  program.candidates.push(newCand)
  await program.save()

  return NextResponse.json({ success: true, candidate: newCand, program })
}
