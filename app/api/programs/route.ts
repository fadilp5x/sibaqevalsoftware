import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Program } from '@/models'

export async function GET() {
  await connectDB()
  const programs = await Program.find({}).lean()
  return NextResponse.json(programs)
}

export async function POST(request: Request) {
  await connectDB()
  try {
    const body = await request.json()
    const {
      code,
      title,
      division = 'Aliyah',
      category,
      durationMinutes = 45,
      skill,
      accentColor = 'sky',
      conceptNote,
      candidates = [],
    } = body

    if (!code || !title || !category || !skill || !conceptNote) {
      return NextResponse.json(
        { error: 'Missing required fields: code, title, category, skill, conceptNote' },
        { status: 400 }
      )
    }

    const formattedCode = code.trim().toUpperCase()

    const existing = await Program.findOne({ code: formattedCode })
    if (existing) {
      return NextResponse.json(
        { error: `Program with code ${formattedCode} already exists` },
        { status: 400 }
      )
    }

    const palette = ['#1CB0F6', '#58CC02', '#FFC800', '#CE82FF', '#FF4B4B']
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedCandidates = (candidates || []).map((c: any, index: number) => ({
      id:
        c.name?.toLowerCase().trim().replace(/[^a-z0-9]/g, '-') ||
        `cand-${Date.now()}-${index + 1}`,
      name: c.name?.trim() || `Candidate ${index + 1}`,
      regNo: c.regNo?.trim() || `${formattedCode}-${String(index + 1).padStart(3, '0')}`,
      avatarColor: palette[index % palette.length],
      streakDays: 1,
      overallAccuracy: 0,
      strengths: [],
      weaknesses: [],
    }))

    const program = await Program.create({
      code: formattedCode,
      title: title.trim(),
      division,
      category: category.trim(),
      durationMinutes: Number(durationMinutes) || 45,
      skill: skill.trim(),
      accentColor,
      conceptNote: conceptNote.trim(),
      candidates: formattedCandidates,
      askedQuestionRegistry: [],
    })

    return NextResponse.json({ success: true, program }, { status: 201 })
  } catch (error) {
    console.error('Failed to create program:', error)
    return NextResponse.json(
      { error: 'Failed to create program: ' + (error as Error).message },
      { status: 500 }
    )
  }
}
