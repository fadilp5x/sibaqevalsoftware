import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { StudyMaterial } from '@/models'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

export async function POST(request: NextRequest) {
  await connectDB()

  const formData = await request.formData()
  const programCode = formData.get('programCode') as string
  const uploadedBy = (formData.get('uploadedBy') as string) || 'Coordinator'
  const title = (formData.get('title') as string) || 'Uploaded Material'
  const textInput = formData.get('text') as string | null
  const urlInput = formData.get('url') as string | null
  const file = formData.get('file') as File | null

  if (!programCode) {
    return NextResponse.json({ error: 'programCode is required' }, { status: 400 })
  }

  let rawMarkdown = ''

  if (file) {
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File exceeds 10 MB limit' }, { status: 400 })
    }
    if (file.name.endsWith('.txt') || file.name.endsWith('.md') || file.type.includes('text')) {
      const buffer = Buffer.from(await file.arrayBuffer())
      rawMarkdown = buffer.toString('utf-8')
    } else {
      // Dynamic import of pdf-parse (handles both v2 and v1)
      try {
        const buffer = Buffer.from(await file.arrayBuffer())
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pdfModule: any = await import('pdf-parse')
        if (pdfModule.PDFParse) {
          const parser = new pdfModule.PDFParse({ data: buffer })
          const parsed = await parser.getText()
          rawMarkdown = parsed.text || ''
          await parser.destroy()
        } else if (typeof (pdfModule.default || pdfModule) === 'function') {
          const parseFn = pdfModule.default || pdfModule
          const parsed = await parseFn(buffer)
          rawMarkdown = parsed.text || ''
        } else {
          throw new Error('No PDF text parser found')
        }
      } catch (err) {
        console.error('PDF parsing error:', err)
        return NextResponse.json({ error: 'Failed to parse PDF. Please paste text manually.' }, { status: 422 })
      }
    }
  } else if (urlInput) {
    const { scrapePdfUrl } = await import('@/lib/firecrawl')
    rawMarkdown = await scrapePdfUrl(urlInput)
    if (!rawMarkdown) {
      return NextResponse.json({ error: 'Could not extract content from URL.' }, { status: 422 })
    }
  } else if (textInput) {
    rawMarkdown = textInput
  } else {
    return NextResponse.json({ error: 'Provide a file, URL, or text.' }, { status: 400 })
  }

  const material = await StudyMaterial.create({
    programCode,
    title,
    uploadedBy,
    rawMarkdown,
    summaryCues: [],
    flashcards: [],
  })

  return NextResponse.json({
    material,
    extractedText: rawMarkdown,
    wordCount: rawMarkdown.split(/\s+/).filter(Boolean).length,
  }, { status: 201 })
}
