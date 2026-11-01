import { connectDB } from '@/lib/mongodb'
import { ApiLog } from '@/models'

export async function searchLiveWeb(query: string): Promise<string> {
  const key = process.env.FIRECRAWL_API_KEY
  if (!key) return ''
  const start = Date.now()

  try {
    const res = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        query,
        limit: 4,
        scrapeOptions: { formats: ['markdown'] },
      }),
    })

    const latencyMs = Date.now() - start
    if (!res.ok) {
      await logFirecrawlTelemetry('https://api.firecrawl.dev/v1/search', query.length / 4, 0, latencyMs, 'error', `HTTP ${res.status}`)
      return ''
    }

    const data = await res.json()
    const snippets: string[] = (data.data || [])
      .map((r: { markdown?: string; url?: string }) =>
        r.markdown ? `### Source: ${r.url || 'unknown'}\n${r.markdown.slice(0, 800)}` : ''
      )
      .filter(Boolean)

    const result = snippets.join('\n\n---\n\n')
    await logFirecrawlTelemetry('https://api.firecrawl.dev/v1/search', query.length / 4, result.length / 4, latencyMs, 'success')
    return result
  } catch (err) {
    const latencyMs = Date.now() - start
    await logFirecrawlTelemetry('https://api.firecrawl.dev/v1/search', query.length / 4, 0, latencyMs, 'error', (err as Error).message)
    return ''
  }
}

export async function scrapePdfUrl(url: string): Promise<string> {
  const key = process.env.FIRECRAWL_API_KEY
  if (!key) return ''
  const start = Date.now()

  try {
    const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ url, formats: ['markdown'] }),
    })

    const latencyMs = Date.now() - start
    if (!res.ok) {
      await logFirecrawlTelemetry('https://api.firecrawl.dev/v1/scrape', url.length / 4, 0, latencyMs, 'error', `HTTP ${res.status}`)
      return ''
    }

    const data = await res.json()
    const md = data.data?.markdown || ''
    await logFirecrawlTelemetry('https://api.firecrawl.dev/v1/scrape', url.length / 4, md.length / 4, latencyMs, 'success')
    return md
  } catch (err) {
    const latencyMs = Date.now() - start
    await logFirecrawlTelemetry('https://api.firecrawl.dev/v1/scrape', url.length / 4, 0, latencyMs, 'error', (err as Error).message)
    return ''
  }
}

async function logFirecrawlTelemetry(
  endpoint: string,
  promptTokens: number,
  completionTokens: number,
  latencyMs: number,
  status: 'success' | 'error',
  errorMsg: string = ''
) {
  try {
    await connectDB()
    await ApiLog.create({
      provider: 'firecrawl',
      endpoint,
      model: 'firecrawl-v1',
      promptTokens: Math.round(promptTokens),
      completionTokens: Math.round(completionTokens),
      totalTokens: Math.round(promptTokens + completionTokens),
      latencyMs,
      status,
      error: errorMsg,
    })
  } catch {
    // Non-blocking telemetry
  }
}
