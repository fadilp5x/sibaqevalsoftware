import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Program, Quiz, StudyMaterial } from '@/models'
import { generateQuiz, generateFlashcards, generateSummaryCues } from '@/lib/ai-engine'
import { searchLiveWeb } from '@/lib/firecrawl'

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()
    const {
      programCode,
      type = 'quiz',
      engine = 'nvidia',
      useLiveSearch = false,
      sessionWindow = 'Morning',
      difficulty = 'medium',
      questionCount = 10,
      title,
      language = 'english',
      sourceMode = 'syllabus_and_benchmarks',
      questionFormats = ['mcq'],
      customSourceText = '',
      saveToMaterials = false,
      customMaterialTitle = '',
    } = body

    if (!programCode) {
      return NextResponse.json({ error: 'programCode required' }, { status: 400 })
    }

    const program = await Program.findOne({ code: programCode })
    if (!program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    // Union all candidate weaknesses for this program
    const weaknesses = Array.from(
      new Set(program.candidates.flatMap((c: { weaknesses: string[] }) => c.weaknesses))
    ) as string[]

    let liveContext = ''
    if (useLiveSearch) {
      liveContext = await searchLiveWeb(`${program.title} ${program.skill} exam questions`)
    }

    const mappedEngine = engine === 'orca' ? 'orca' : 'nvidia'

    if (type === 'quiz') {
      const safeCount = Math.min(Math.max(Number(questionCount) || 10, 5), 50)
      const result = await generateQuiz({
        programCode,
        conceptNote: program.conceptNote,
        division: program.division || 'Aliyah',
        difficulty: (['easy', 'medium', 'hard', 'extreme'].includes(difficulty) ? difficulty : 'medium') as 'easy' | 'medium' | 'hard' | 'extreme',
        weaknesses,
        askedRegistry: program.askedQuestionRegistry || [],
        questionCount: safeCount,
        engine: mappedEngine,
        liveContext,
        language,
        sourceMode,
        questionFormats,
        customSourceText,
      })

      // If user asked to save material to Study Hub
      if (saveToMaterials && customSourceText.trim()) {
        try {
          await StudyMaterial.create({
            programCode,
            title: customMaterialTitle || `${program.code} Custom Material (${new Date().toLocaleDateString()})`,
            uploadedBy: 'Quiz Generator',
            rawMarkdown: customSourceText.trim(),
            summaryCues: [],
            flashcards: [],
          })
        } catch (e) {
          console.warn('Failed to save custom source to study materials:', e)
        }
      }

      const difficultyUpper = difficulty.toUpperCase()
      const quiz = await Quiz.create({
        programCode,
        title: title || `${program.title} — ${difficultyUpper} AI Quiz (${sessionWindow})`,
        sessionWindow,
        durationMinutes: program.durationMinutes,
        difficulty,
        questionCount: result.questions.length,
        aiModelUsed: mappedEngine === 'nvidia' ? 'NVIDIA Nemotron Super' : 'OrcaRouter DeepSeek V4 Flash',
        language,
        sourceMode,
        questionFormats,
        questions: result.questions,
      })

      // Anti-duplication: push new stems to registry BEFORE returning
      await Program.findByIdAndUpdate(program._id, {
        $push: { askedQuestionRegistry: { $each: result.questions.map((q) => q.questionStem) } },
      })

      return NextResponse.json({ quiz })
    }

    if (type === 'flashcards' || type === 'cues') {
      const latestMaterial = await StudyMaterial.findOne({ programCode }).sort({ createdAt: -1 })
      if (!latestMaterial) {
        return NextResponse.json({ error: 'No study material found. Upload a PDF first.' }, { status: 404 })
      }

      if (type === 'flashcards') {
        const flashcards = await generateFlashcards(latestMaterial.rawMarkdown, mappedEngine, 12)
        latestMaterial.flashcards = flashcards
        await latestMaterial.save()
        return NextResponse.json({ flashcards })
      }

      if (type === 'cues') {
        const summaryCues = await generateSummaryCues(latestMaterial.rawMarkdown, mappedEngine)
        latestMaterial.summaryCues = summaryCues
        await latestMaterial.save()
        return NextResponse.json({ summaryCues })
      }
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (err) {
    console.error('Quiz generation route error:', err)
    return NextResponse.json(
      { error: (err as Error).message || 'Generation failed on server' },
      { status: 500 }
    )
  }
}
