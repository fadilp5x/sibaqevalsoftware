import OpenAI from 'openai'

/* ─── NVIDIA NIM Client ─── */
const nvidiaClient = new OpenAI({
  baseURL: 'https://integrate.api.nvidia.com/v1',
  apiKey: process.env.NVIDIA_API_KEY || '',
})

/* ─── OrcaRouter Client ─── */
const orcaClient = new OpenAI({
  baseURL: 'https://api.orcarouter.ai/v1',
  apiKey: process.env.ORCAROUTER_API_KEY || '',
})

const NVIDIA_MODEL = 'nvidia/nemotron-3.5-bolt-e4b'
const ORCA_MODEL = 'deepseek/deepseek-v4-flash-free'

export async function generateWithNvidia(
  prompt: string,
  systemPrompt: string,
  model: string = NVIDIA_MODEL
): Promise<string> {
  const res = await nvidiaClient.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 4096,
  })
  return res.choices[0]?.message?.content || ''
}

export async function generateWithOrca(
  prompt: string,
  systemPrompt: string
): Promise<string> {
  try {
    const res = await orcaClient.chat.completions.create({
      model: ORCA_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 4096,
    })
    return res.choices[0]?.message?.content || ''
  } catch (err) {
    console.warn('OrcaRouter failed, falling back to NVIDIA NIM Nemotron:', err)
    return generateWithNvidia(prompt, systemPrompt)
  }
}

export interface GenerateQuizParams {
  programCode: string
  conceptNote: string
  division?: string
  difficulty?: 'easy' | 'medium' | 'hard' | 'extreme'
  weaknesses: string[]
  askedRegistry: string[]
  questionCount: number
  engine: 'nvidia' | 'orca'
  liveContext?: string
}

export interface QuizQuestion {
  questionStem: string
  questionText: string
  options: string[]
  correctOptionIndex: number
  topicTag: string
  explanation: string
}

export interface QuizGenerationResult {
  questions: QuizQuestion[]
  rawText: string
}

export async function generateQuiz(params: GenerateQuizParams): Promise<QuizGenerationResult> {
  const {
    conceptNote,
    division = 'Aliyah',
    difficulty = 'medium',
    weaknesses,
    askedRegistry,
    questionCount,
    engine,
    liveContext,
  } = params

  const difficultyGuidelines: Record<string, string> = {
    easy: 'EASY (FOUNDATION): Generate foundational recall MCQs testing direct definitions, article numbers, primary facts, core terminology, and fundamental rules. Questions must be direct and unambiguous.',
    medium: `MEDIUM (SIBAQ STANDARD): Generate standard inter-college competition level MCQs testing conceptual clarity and application of the syllabus. Calibrate vocabulary and question depth specifically for the ${division} student division.`,
    hard: 'HARD (ANALYTICAL): Generate tough analytical MCQs. Include multi-statement verification questions (e.g., "Consider the following statements... Which of the statements given above is/are correct?"), practical scenario applications, and very close, plausible distractors.',
    extreme: 'EXTREME (OLYMPIAD / FINALS): Generate championship-finals / UPSC Olympiad-grade questions. Use complex Assertion-Reasoning formats ("Assertion [A] and Reason [R]"), subtle constitutional/literary/theological exceptions, multi-layered analytical traps, and deep synthesis.',
  }

  const difficultyInstruction = difficultyGuidelines[difficulty] || difficultyGuidelines.medium

  const systemPrompt = `You are an expert quiz generator for SIBAQ '26 competitive academic programs.
Student Division: ${division}
Program concept: ${conceptNote}

DIFFICULTY LEVEL: ${difficulty.toUpperCase()}
${difficultyInstruction}

TARGET WEAKNESSES: 60% of questions MUST target these candidate weak topics: ${weaknesses.length ? weaknesses.join(', ') : 'general syllabus topics'}.
STRICT ANTI-DUPLICATION: Do NOT repeat or paraphrase any of these previously asked question stems: ${askedRegistry.slice(-100).join(' | ') || 'none yet'}.
${liveContext ? `Live web context:\n${liveContext}\n` : ''}
Return ONLY a valid JSON array of ${questionCount} question objects, each with keys:
- questionStem (short 5-10 word key)
- questionText (full question)
- options (array of exactly 4 strings)
- correctOptionIndex (0-3)
- topicTag (short topic label)
- explanation (2-3 sentences explaining the answer and why other options are incorrect)`

  const prompt = `Generate exactly ${questionCount} ${difficulty.toUpperCase()} difficulty quiz questions as a JSON array. No markdown fences, no preamble — raw JSON only.`

  let rawText = ''
  try {
    if (engine === 'nvidia') {
      rawText = await generateWithNvidia(prompt, systemPrompt)
    } else {
      rawText = await generateWithOrca(prompt, systemPrompt)
    }

    // Strip markdown fences if model wraps output
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const questions: QuizQuestion[] = JSON.parse(cleaned)
    return { questions, rawText }
  } catch {
    // Fallback: try to extract JSON array from the response
    const match = rawText.match(/\[[\s\S]*\]/)
    if (match) {
      try {
        const questions: QuizQuestion[] = JSON.parse(match[0])
        return { questions, rawText }
      } catch {
        throw new Error('AI returned malformed JSON. Raw: ' + rawText.slice(0, 300))
      }
    }
    throw new Error('AI returned malformed JSON. Raw: ' + rawText.slice(0, 300))
  }
}

export async function generateFlashcards(
  rawMarkdown: string,
  engine: 'nvidia' | 'orca',
  count: number = 10
): Promise<{ front: string; back: string; tag: string }[]> {
  const systemPrompt = `You are a study material specialist creating flashcards from notes. Return ONLY a valid JSON array of ${count} flashcard objects with keys: front (question/term), back (answer/definition), tag (topic label). No markdown, raw JSON only.`
  const prompt = `Create ${count} flashcards from this study material:\n\n${rawMarkdown.slice(0, 3000)}`

  let rawText = ''
  if (engine === 'nvidia') {
    rawText = await generateWithNvidia(prompt, systemPrompt)
  } else {
    rawText = await generateWithOrca(prompt, systemPrompt)
  }

  const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const match = cleaned.match(/\[[\s\S]*\]/)
  if (match) return JSON.parse(match[0])
  return JSON.parse(cleaned)
}

export async function generateSummaryCues(
  rawMarkdown: string,
  engine: 'nvidia' | 'orca'
): Promise<string[]> {
  const systemPrompt = `You are an academic coach. Extract exactly 8 key exam-focused revision points from the study material. Return ONLY a valid JSON array of strings. No markdown, raw JSON only.`
  const prompt = `Extract 8 key revision points from:\n\n${rawMarkdown.slice(0, 3000)}`

  let rawText = ''
  if (engine === 'nvidia') {
    rawText = await generateWithNvidia(prompt, systemPrompt)
  } else {
    rawText = await generateWithOrca(prompt, systemPrompt)
  }

  const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const match = cleaned.match(/\[[\s\S]*\]/)
  if (match) return JSON.parse(match[0])
  return JSON.parse(cleaned)
}
