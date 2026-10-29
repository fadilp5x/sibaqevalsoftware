export async function searchLiveWeb(query: string): Promise<string> {
  const key = process.env.FIRECRAWL_API_KEY
  if (!key) return ''

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

    if (!res.ok) return ''
    const data = await res.json()

    const snippets: string[] = (data.data || [])
      .map((r: { markdown?: string; url?: string }) =>
        r.markdown ? `### Source: ${r.url || 'unknown'}\n${r.markdown.slice(0, 800)}` : ''
      )
      .filter(Boolean)

    return snippets.join('\n\n---\n\n')
  } catch {
    return ''
  }
}

export async function scrapePdfUrl(url: string): Promise<string> {
  const key = process.env.FIRECRAWL_API_KEY
  if (!key) return ''

  try {
    const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ url, formats: ['markdown'] }),
    })

    if (!res.ok) return ''
    const data = await res.json()
    return data.data?.markdown || ''
  } catch {
    return ''
  }
}
