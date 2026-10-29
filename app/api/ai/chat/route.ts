import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Program, StudyMaterial } from '@/models'
import { generateWithNvidia, generateWithOrca } from '@/lib/ai-engine'
import { searchLiveWeb } from '@/lib/firecrawl'

export async function POST(request: NextRequest) {
  await connectDB()

  const body = await request.json()
  const {
    programCode,
    candidateName,
    userMessage,
    engine = 'nvidia',
    useLiveSearch = false,
  } = body

  if (!programCode || !userMessage) {
    return NextResponse.json({ error: 'programCode and userMessage required' }, { status: 400 })
  }

  const program = await Program.findOne({ code: programCode })
  if (!program) {
    return NextResponse.json({ error: 'Program not found' }, { status: 404 })
  }

  const latestMaterial = await StudyMaterial.findOne({ programCode }).sort({ createdAt: -1 })

  const candidate = program.candidates.find(
    (c: { name: string }) => c.name === candidateName
  )
  const weaknesses: string[] = candidate?.weaknesses || []

  let liveContext = ''
  let noLiveResults = false
  const sources: string[] = []

  if (useLiveSearch) {
    liveContext = await searchLiveWeb(userMessage)
    if (!liveContext) {
      noLiveResults = true
    } else {
      // Extract source URLs
      const urlMatches = liveContext.match(/Source: (https?:\/\/[^\n]+)/g) || []
      sources.push(...urlMatches.map((m) => m.replace('### Source: ', '')))
    }
  }

  const systemPrompt = `You are a focused academic tutor for SIBAQ '26 "${program.title}" (${program.skill}).
Program syllabus: ${program.conceptNote}
${latestMaterial?.rawMarkdown ? `Student uploaded notes (excerpt):\n${latestMaterial.rawMarkdown.slice(0, 1500)}\n` : ''}
${weaknesses.length ? `Student's current weak areas: ${weaknesses.join(', ')}` : ''}
${liveContext ? `\nLive web research context:\n${liveContext.slice(0, 2000)}\n` : ''}
Answer ONLY questions relevant to this program. Be concise, exam-focused, and practical. Use bullet points for lists. Keep responses under 300 words unless asked for more detail.`

  let reply = ''
  try {
    if (engine === 'nvidia') {
      reply = await generateWithNvidia(userMessage, systemPrompt)
    } else {
      reply = await generateWithOrca(userMessage, systemPrompt)
    }
  } catch (err) {
    return NextResponse.json({ error: 'AI generation failed: ' + String(err) }, { status: 500 })
  }

  return NextResponse.json({ reply, sources, noLiveResults })
}
