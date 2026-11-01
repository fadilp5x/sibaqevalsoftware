import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Quiz, Attempt, Program } from '@/models'

export async function POST(request: NextRequest) {
  await connectDB()

  const body = await request.json()
  const {
    quizId,
    programCode,
    candidateName,
    answers,
    timeTakenSeconds,
  } = body

  if (!quizId || !programCode || !candidateName || !answers) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const quiz = await Quiz.findById(quizId)
  if (!quiz) {
    return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
  }

  const score = answers.filter((a: { isCorrect: boolean }) => a.isCorrect).length
  const totalQuestions = quiz.questions.length
  const percentage = Math.round((score / totalQuestions) * 100)

  const attempt = await Attempt.create({
    quizId,
    programCode,
    candidateName,
    difficulty: quiz.difficulty || 'medium',
    answers,
    score,
    totalQuestions,
    percentage,
    timeTakenSeconds: timeTakenSeconds || 0,
    submittedAt: new Date(),
  })

  // Recalculate per-topic accuracy for this candidate across ALL past attempts
  const allAttempts = await Attempt.find({ programCode, candidateName }).lean()

  type TagStats = { correct: number; total: number }
  const tagMap: Record<string, TagStats> = {}

  for (const att of allAttempts) {
    for (const ans of att.answers) {
      if (!tagMap[ans.topicTag]) tagMap[ans.topicTag] = { correct: 0, total: 0 }
      tagMap[ans.topicTag].total++
      if (ans.isCorrect) tagMap[ans.topicTag].correct++
    }
  }

  const strengths: string[] = []
  const weaknesses: string[] = []

  for (const [tag, stats] of Object.entries(tagMap)) {
    const pct = (stats.correct / stats.total) * 100
    if (pct >= 80) strengths.push(tag)
    else if (pct < 65) weaknesses.push(tag)
  }

  // Update or auto-register the candidate in the program
  const program = await Program.findOne({ code: programCode })
  if (program) {
    let candIdx = program.candidates.findIndex(
      (c: { name: string }) => c.name.trim().toLowerCase() === candidateName.trim().toLowerCase()
    )

    const colors = ['#1CB0F6', '#58CC02', '#FFC800', '#CE82FF', '#FF4B4B']

    if (candIdx === -1) {
      const cleanId = candidateName.trim().toLowerCase().replace(/[^a-z0-9]/g, '-') || `user-${Date.now()}`
      program.candidates.push({
        id: cleanId,
        name: candidateName.trim(),
        regNo: `${programCode}-${Math.floor(100 + Math.random() * 900)}`,
        avatarColor: colors[program.candidates.length % colors.length],
        streakDays: 1,
        overallAccuracy: percentage,
        strengths: Array.from(new Set(strengths)),
        weaknesses: Array.from(new Set(weaknesses)),
      })
      candIdx = program.candidates.length - 1
    }

    program.candidates[candIdx].strengths = Array.from(new Set(strengths))
    program.candidates[candIdx].weaknesses = Array.from(new Set(weaknesses))

    const candAttempts = await Attempt.find({
      programCode,
      candidateName: { $regex: new RegExp(`^${candidateName.trim()}$`, 'i') },
    }).lean()

    const totalPct = candAttempts.reduce((sum, a) => sum + a.percentage, 0)
    program.candidates[candIdx].overallAccuracy = Math.round(totalPct / (candAttempts.length || 1))

    if (candAttempts.length > 1) {
      const lastAttempt = candAttempts[candAttempts.length - 2]
      const daysDiff = Math.floor(
        (Date.now() - new Date(lastAttempt.submittedAt).getTime()) / 86_400_000
      )
      if (daysDiff <= 1) {
        program.candidates[candIdx].streakDays += 1
      } else {
        program.candidates[candIdx].streakDays = 1
      }
    } else {
      program.candidates[candIdx].streakDays = 1
    }

    program.markModified('candidates')
    await program.save()
  }

  return NextResponse.json({ attempt, strengths, weaknesses, percentage })
}
