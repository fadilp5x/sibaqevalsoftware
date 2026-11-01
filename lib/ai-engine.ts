import OpenAI from 'openai'
import { connectDB } from '@/lib/mongodb'
import { ApiLog } from '@/models'
import { getBenchmarkGrounding } from '@/lib/benchmark-datasets'

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

async function logTelemetry(
  provider: 'nvidia' | 'orcarouter',
  endpoint: string,
  model: string,
  prompt: string,
  completion: string,
  latencyMs: number,
  status: 'success' | 'error',
  errorMsg: string = ''
) {
  try {
    await connectDB()
    const promptTokens = Math.round((prompt.length || 0) / 4)
    const completionTokens = Math.round((completion.length || 0) / 4)
    await ApiLog.create({
      provider,
      endpoint,
      model,
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      latencyMs,
      status,
      error: errorMsg,
    })
  } catch {
    // Non-blocking telemetry
  }
}

export async function generateWithNvidia(
  prompt: string,
  systemPrompt: string,
  model: string = NVIDIA_MODEL
): Promise<string> {
  const start = Date.now()
  try {
    const res = await nvidiaClient.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 4096,
    })
    const output = res.choices[0]?.message?.content || ''
    const latency = Date.now() - start
    await logTelemetry('nvidia', 'chat.completions.create', model, systemPrompt + prompt, output, latency, 'success')
    return output
  } catch (err) {
    const latency = Date.now() - start
    await logTelemetry('nvidia', 'chat.completions.create', model, systemPrompt + prompt, '', latency, 'error', (err as Error).message)
    throw err
  }
}

export async function generateWithOrca(
  prompt: string,
  systemPrompt: string
): Promise<string> {
  const start = Date.now()
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
    const output = res.choices[0]?.message?.content || ''
    const latency = Date.now() - start
    await logTelemetry('orcarouter', 'chat.completions.create', ORCA_MODEL, systemPrompt + prompt, output, latency, 'success')
    return output
  } catch (err) {
    const latency = Date.now() - start
    await logTelemetry('orcarouter', 'chat.completions.create', ORCA_MODEL, systemPrompt + prompt, '', latency, 'error', (err as Error).message)
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
    programCode,
    conceptNote,
    division = 'Aliyah',
    difficulty = 'medium',
    weaknesses,
    askedRegistry,
    questionCount,
    engine,
    liveContext,
  } = params

  // Fetch benchmark datasets (e.g. real IELTS Band 9 drills from GitHub, UPSC, CAT)
  let benchmarkData = ''
  try {
    benchmarkData = await getBenchmarkGrounding(programCode)
  } catch {
    // fallback gracefully
  }

  const difficultyGuidelines: Record<string, string> = {
    easy: 'EASY (FOUNDATION): Generate foundational recall MCQs testing direct definitions, article numbers, primary facts, core terminology, and fundamental rules. Questions must be direct and unambiguous.',
    medium: `MEDIUM (SIBAQ STANDARD): Generate standard inter-college competition level MCQs testing conceptual clarity and application of the syllabus. Calibrate vocabulary and question depth specifically for the ${division} student division.`,
    hard: 'HARD (ANALYTICAL): Generate tough analytical MCQs. Include multi-statement verification questions (e.g., "Consider the following statements... Which of the statements given above is/are correct?"), practical scenario applications, and very close, plausible distractors.',
    extreme: 'EXTREME (OLYMPIAD / FINALS): Generate championship-finals / UPSC Olympiad-grade questions. Use complex Assertion-Reasoning formats ("Assertion [A] and Reason [R]"), subtle constitutional/literary/theological exceptions, multi-layered analytical traps, and deep synthesis.',
  }

  const difficultyInstruction = difficultyGuidelines[difficulty] || difficultyGuidelines.medium

  const systemPrompt = `You are a ruthless International Olympiad, UPSC CSE, and IELTS Band-9.0 Head Coach training university degree students to become national champions in SIBAQ '26.

CRITICAL GROUNDING DIRECTIVE:
NEVER ask meta-questions about the SIBAQ Concept Note rules, duration, competition guidelines, or syllabus description itself! The Concept Note merely defines the subject territory.
Your questions must test actual subject matter mastery, deep textual analysis, statutory applications, or complex mathematical/analytical logic. NEVER ask questions about what the competition tests or what the concept note says.

Student Division: ${division}
Program Domain / Concept Reference: ${conceptNote}

BENCHMARK COACHING STANDARDS:
${benchmarkData}

DIFFICULTY LEVEL: ${difficulty.toUpperCase()}
${difficultyInstruction}

TARGET WEAKNESSES: 60% of questions MUST target these candidate weak topics: ${weaknesses.length ? weaknesses.join(', ') : 'core syllabus topics'}.
STRICT ANTI-DUPLICATION: Do NOT repeat or paraphrase any of these previously asked question stems: ${askedRegistry.slice(-100).join(' | ') || 'none yet'}.
${liveContext ? `Live web context:\n${liveContext}\n` : ''}

Return ONLY a valid JSON array of ${questionCount} question objects, each with keys:
- questionStem (short 5-10 word key identifying the concept)
- questionText (the complete challenging question)
- options (array of exactly 4 strings; distractors must be plausible and sophisticated)
- correctOptionIndex (0-3)
- topicTag (short topic label)
- explanation (comprehensive coach explanation of the correct logic and why the distractors fail)`

  const prompt = `Generate exactly ${questionCount} ${difficulty.toUpperCase()} difficulty champion-level quiz questions as a JSON array. No markdown fences, no preamble — raw JSON only.`

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
