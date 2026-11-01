import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Program, Quiz, Attempt, IQuestion } from '@/models'
import { generateQuiz } from '@/lib/ai-engine'

export async function POST(request: Request) {
  await connectDB()
  try {
    const body = await request.json()
    const { programCode, candidateName } = body

    if (!programCode || !candidateName) {
      return NextResponse.json(
        { error: 'Missing programCode or candidateName' },
        { status: 400 }
      )
    }

    const formattedCode = programCode.toUpperCase()
    const program = await Program.findOne({ code: formattedCode })
    if (!program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    const candidate = program.candidates.find(
      (c) => c.name.toLowerCase() === candidateName.toLowerCase()
    )

    // Look for recent attempts for this candidate
    const attempts = await Attempt.find({
      programCode: formattedCode,
      candidateName: { $regex: new RegExp(`^${candidateName}$`, 'i') },
    })
      .sort({ submittedAt: -1 })
      .limit(5)
      .lean()

    const quizIds = attempts.map((a) => a.quizId)
    const quizzes = await Quiz.find({ _id: { $in: quizIds } }).lean()
    const quizMap = new Map(quizzes.map((q) => [q._id.toString(), q]))

    const missedQuestionsList: {
      questionText: string
      chosenOption: string
      correctOption: string
      topicTag: string
      explanation: string
    }[] = []

    for (const attempt of attempts) {
      const parentQuiz = quizMap.get(attempt.quizId.toString())
      if (!parentQuiz || !parentQuiz.questions) continue

      for (const ans of attempt.answers || []) {
        if (!ans.isCorrect && parentQuiz.questions[ans.questionIndex]) {
          const q = parentQuiz.questions[ans.questionIndex]
          missedQuestionsList.push({
            questionText: q.questionText,
            chosenOption: q.options[ans.selectedOption] || 'Unknown',
            correctOption: q.options[q.correctOptionIndex] || 'Unknown',
            topicTag: q.topicTag || ans.topicTag || 'General',
            explanation: q.explanation || '',
          })
        }
      }
    }

    // Weak topics
    const weakTopics = [
      ...(candidate?.weaknesses || []),
      ...missedQuestionsList.map((m) => m.topicTag),
    ].filter(Boolean)
    const uniqueWeakTopics = Array.from(new Set(weakTopics))

    // Build specific remedial context
    let revengeContext = `REVENGE REMEDIAL TARGETS FOR CANDIDATE ${candidateName}:\n`
    if (missedQuestionsList.length > 0) {
      revengeContext += `Recent missed questions and mistakes:\n`
      missedQuestionsList.slice(0, 8).forEach((m, i) => {
        revengeContext += `${i + 1}. Topic: ${m.topicTag}\n   Question: ${m.questionText}\n   Candidate chose: ${m.chosenOption} (INCORRECT)\n   Correct Answer: ${m.correctOption}\n   Explanation: ${m.explanation}\n\n`
      })
    } else {
      revengeContext += `Candidate has no logged errors yet. Generate high-intensity diagnostic challenges on these core topics: ${uniqueWeakTopics.join(', ') || program.skill}.\n`
    }

    const quizResult = await generateQuiz({
      programCode: formattedCode,
      conceptNote: `${program.conceptNote}\n\n${revengeContext}`,
      division: program.division || 'Aliyah',
      difficulty: 'hard',
      weaknesses: uniqueWeakTopics,
      askedRegistry: program.askedQuestionRegistry || [],
      questionCount: 10,
      engine: 'nvidia',
      liveContext: revengeContext,
    })

    const newQuiz = await Quiz.create({
      programCode: formattedCode,
      title: `Revenge Drill — ${candidateName}`,
      sessionWindow: new Date().getHours() < 12 ? 'Morning' : 'Evening',
      durationMinutes: 15,
      difficulty: 'hard',
      questionCount: quizResult.questions.length || 10,
      aiModelUsed: 'NVIDIA Nemotron (Revenge Engine)',
      questions: quizResult.questions as IQuestion[],
      createdAt: new Date(),
    })

    return NextResponse.json({
      success: true,
      quiz: newQuiz,
      missedCount: missedQuestionsList.length,
      weakTopics: uniqueWeakTopics,
    })
  } catch (error) {
    console.error('Revenge quiz generation error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to generate revenge quiz' },
      { status: 500 }
    )
  }
}
