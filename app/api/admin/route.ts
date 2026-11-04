import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Program, Quiz, StudyMaterial, Attempt } from '@/models'

export const dynamic = 'force-dynamic'

export async function GET() {
  await connectDB()

  try {
    const [programs, quizzes, materials, attempts] = await Promise.all([
      Program.find({}).sort({ code: 1 }).lean(),
      Quiz.find({}).sort({ createdAt: -1 }).lean(),
      StudyMaterial.find({}).sort({ createdAt: -1 }).lean(),
      Attempt.find({}).sort({ submittedAt: -1 }).limit(100).lean(),
    ])

    // Extract all candidates flattened with program info
    const candidates = programs.flatMap((p) =>
      (p.candidates || []).map((c) => ({
        ...c,
        programCode: p.code,
        programTitle: p.title,
        division: p.division,
      }))
    )

    return NextResponse.json({
      candidates,
      programs,
      quizzes,
      materials,
      attempts,
    })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  await connectDB()
  const body = await request.json()

  const { action, payload } = body

  try {
    switch (action) {
      // ── Candidate Actions ──
      case 'deleteCandidate': {
        const { programCode, candidateName } = payload
        if (!programCode || !candidateName) {
          return NextResponse.json({ error: 'programCode and candidateName required' }, { status: 400 })
        }

        // Remove from program
        await Program.findOneAndUpdate(
          { code: programCode.toUpperCase() },
          { $pull: { candidates: { name: candidateName } } }
        )

        // Delete associated attempts
        await Attempt.deleteMany({
          programCode: programCode.toUpperCase(),
          candidateName: { $regex: new RegExp(`^${candidateName.trim()}$`, 'i') },
        })

        return NextResponse.json({ success: true, message: `Candidate ${candidateName} and attempts removed.` })
      }

      case 'editCandidate': {
        const { programCode, originalName, newName, streakDays, regNo } = payload
        const program = await Program.findOne({ code: programCode.toUpperCase() })
        if (!program) return NextResponse.json({ error: 'Program not found' }, { status: 404 })

        const cand = program.candidates.find((c) => c.name.toLowerCase() === originalName.toLowerCase())
        if (!cand) return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })

        if (newName) cand.name = newName.trim()
        if (streakDays !== undefined) cand.streakDays = Number(streakDays)
        if (regNo !== undefined) cand.regNo = regNo.trim()

        program.markModified('candidates')
        await program.save()

        // Update attempts name if changed
        if (newName && newName.trim() !== originalName) {
          await Attempt.updateMany(
            { programCode: programCode.toUpperCase(), candidateName: originalName },
            { $set: { candidateName: newName.trim() } }
          )
        }

        return NextResponse.json({ success: true, candidate: cand })
      }

      // ── Program Actions ──
      case 'deleteProgram': {
        const { code } = payload
        const formattedCode = code.toUpperCase()
        await Promise.all([
          Program.deleteOne({ code: formattedCode }),
          Quiz.deleteMany({ programCode: formattedCode }),
          StudyMaterial.deleteMany({ programCode: formattedCode }),
          Attempt.deleteMany({ programCode: formattedCode }),
        ])
        return NextResponse.json({ success: true, message: `Program ${formattedCode} deleted.` })
      }

      case 'editProgram': {
        const { code, title, conceptNote, division, category, durationMinutes, skill } = payload
        const updated = await Program.findOneAndUpdate(
          { code: code.toUpperCase() },
          {
            $set: {
              ...(title && { title: title.trim() }),
              ...(conceptNote && { conceptNote: conceptNote.trim() }),
              ...(division && { division }),
              ...(category && { category }),
              ...(durationMinutes && { durationMinutes: Number(durationMinutes) }),
              ...(skill && { skill: skill.trim() }),
            },
          },
          { new: true }
        )
        return NextResponse.json({ success: true, program: updated })
      }

      // ── Quiz & Material Actions ──
      case 'deleteQuiz': {
        const { quizId } = payload
        await Promise.all([
          Quiz.findByIdAndDelete(quizId),
          Attempt.deleteMany({ quizId }),
        ])
        return NextResponse.json({ success: true, message: 'Quiz and its attempts deleted.' })
      }

      case 'deleteMaterial': {
        const { materialId } = payload
        await StudyMaterial.findByIdAndDelete(materialId)
        return NextResponse.json({ success: true, message: 'Material deleted.' })
      }

      // ── Attempt Actions ──
      case 'deleteAttempt': {
        const { attemptId } = payload
        const att = await Attempt.findById(attemptId)
        if (!att) return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })

        const { programCode, candidateName } = att
        await Attempt.findByIdAndDelete(attemptId)

        // Recalculate candidate stats
        const remainingAttempts = await Attempt.find({ programCode, candidateName }).lean()
        const program = await Program.findOne({ code: programCode })
        if (program) {
          const candIdx = program.candidates.findIndex(
            (c) => c.name.toLowerCase() === candidateName.toLowerCase()
          )
          if (candIdx !== -1) {
            const avg = remainingAttempts.length
              ? Math.round(remainingAttempts.reduce((s, a) => s + a.percentage, 0) / remainingAttempts.length)
              : 0
            program.candidates[candIdx].overallAccuracy = avg
            program.candidates[candIdx].streakDays = remainingAttempts.length
            program.markModified('candidates')
            await program.save()
          }
        }

        return NextResponse.json({ success: true, message: 'Attempt deleted and candidate stats updated.' })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
