import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { ApiLog } from '@/models'

export const dynamic = 'force-dynamic'

export async function GET() {
  await connectDB()

  try {
    const logs = await ApiLog.find({}).sort({ createdAt: -1 }).limit(30).lean()

    const allLogs = await ApiLog.find({}).lean()

    // Aggregations
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const nvidiaLogs = allLogs.filter((l) => l.provider === 'nvidia')
    const orcaLogs = allLogs.filter((l) => l.provider === 'orcarouter')
    const firecrawlLogs = allLogs.filter((l) => l.provider === 'firecrawl')
    const githubLogs = allLogs.filter((l) => l.provider === 'github-dataset')

    const orcaToday = orcaLogs.filter((l) => new Date(l.createdAt) >= todayStart).length
    const firecrawlTotal = firecrawlLogs.length

    const calcStats = (items: typeof allLogs) => {
      const count = items.length
      const totalTokens = items.reduce((acc, i) => acc + (i.totalTokens || 0), 0)
      const avgLatency = count
        ? Math.round(items.reduce((acc, i) => acc + (i.latencyMs || 0), 0) / count)
        : 0
      const errors = items.filter((i) => i.status === 'error').length
      return { count, totalTokens, avgLatency, errors }
    }

    return NextResponse.json({
      summary: {
        nvidia: {
          ...calcStats(nvidiaLogs),
          tier: 'Unlimited Dev Tier (No Hard Quota)',
          model: 'nvidia/nemotron-3.5-bolt-e4b',
        },
        orca: {
          ...calcStats(orcaLogs),
          todayRequests: orcaToday,
          freeLimitDaily: 50,
          model: 'deepseek/deepseek-v4-flash-free',
        },
        firecrawl: {
          ...calcStats(firecrawlLogs),
          creditsUsed: firecrawlTotal,
          freeTierMaxCredits: 500,
        },
        github: {
          ...calcStats(githubLogs),
          dataset: 'LuchoBazz/ielts-ai-dataset (Band 9.0)',
        },
        totalCalls: allLogs.length,
      },
      recentLogs: logs,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch telemetry: ' + (error as Error).message },
      { status: 500 }
    )
  }
}
