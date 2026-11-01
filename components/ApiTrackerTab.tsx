'use client'

import { useState, useEffect } from 'react'
import {
  Cpu,
  Zap,
  Globe,
  Database,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Activity,
  Sparkles,
} from 'lucide-react'
import { format } from 'date-fns'

interface ApiTrackerTabProps {
  onTriggerAdmin?: () => void
}

export default function ApiTrackerTab({ onTriggerAdmin }: ApiTrackerTabProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [telemetry, setTelemetry] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefreshed, setLastRefreshed] = useState<string>('Just now')

  const fetchTelemetry = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/telemetry')
      const data = await res.json()
      if (res.ok) {
        setTelemetry(data)
        setLastRefreshed(format(new Date(), 'hh:mm:ss a'))
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTelemetry()
  }, [])

  const summary = telemetry?.summary
  const recentLogs = telemetry?.recentLogs || []

  // Progress for OrcaRouter (out of 50 requests/day)
  const orcaUsed = summary?.orca?.todayRequests || 0
  const orcaMax = summary?.orca?.freeLimitDaily || 50
  const orcaPct = Math.min(Math.round((orcaUsed / orcaMax) * 100), 100)

  // Progress for Firecrawl (out of 500 free credits)
  const firecrawlUsed = summary?.firecrawl?.creditsUsed || 0
  const firecrawlMax = summary?.firecrawl?.freeTierMaxCredits || 500
  const firecrawlPct = Math.min(Math.round((firecrawlUsed / firecrawlMax) * 100), 100)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border-2 border-slate-200 border-b-4 border-b-slate-300 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-sky-600" />
            <h2 className="text-xl font-black text-slate-900">Live API Usage &amp; Rate-Limit Tracker</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time telemetry monitoring for NVIDIA Developer NIM, OrcaRouter DeepSeek, Firecrawl, and GitHub datasets.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[11px] text-slate-400 font-medium">Synced: {lastRefreshed}</span>
          {onTriggerAdmin && (
            <button
              onClick={onTriggerAdmin}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border-2 border-indigo-200 border-b-4 border-b-indigo-400 rounded-xl text-xs font-bold text-indigo-700 hover:bg-indigo-100 active:border-b-2 active:translate-y-[2px] transition-all"
            >
              <span>Admin Panel</span>
            </button>
          )}
          <button
            onClick={fetchTelemetry}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border-2 border-slate-200 border-b-4 border-b-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 active:border-b-2 active:translate-y-[2px] transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-sky-600 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 4 Provider Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: NVIDIA Developer NIM */}
        <div className="bg-white rounded-2xl border-2 border-emerald-300 border-b-4 border-b-emerald-500 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black">
                <Cpu className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
                UNLIMITED DEV TIER
              </span>
            </div>
            <h3 className="font-black text-sm text-slate-900 mb-0.5">NVIDIA Nemotron Super</h3>
            <p className="text-[10px] text-slate-400 font-mono mb-3">integrate.api.nvidia.com</p>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Total Calls:</span>
                <span className="font-bold text-slate-900">{summary?.nvidia?.count || 0}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tokens Processed:</span>
                <span className="font-bold text-slate-900">
                  {summary?.nvidia?.totalTokens?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Avg Latency:</span>
                <span className="font-bold text-emerald-600">
                  {summary?.nvidia?.avgLatency || 0} ms
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-emerald-700 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> High-speed serverless inference
          </div>
        </div>

        {/* Card 2: OrcaRouter (DeepSeek V4 Flash) */}
        <div className="bg-white rounded-2xl border-2 border-amber-300 border-b-4 border-b-amber-500 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-900 flex items-center justify-center font-black">
                <Zap className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                FREE DEEPSEEK TIER
              </span>
            </div>
            <h3 className="font-black text-sm text-slate-900 mb-0.5">OrcaRouter DeepSeek</h3>
            <p className="text-[10px] text-slate-400 font-mono mb-3">api.orcarouter.ai</p>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Today&apos;s Requests:</span>
                <span className="font-bold text-slate-900">
                  {orcaUsed} / {orcaMax}
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all"
                  style={{ width: `${orcaPct}%` }}
                />
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Total Calls:</span>
                <span className="font-bold text-slate-900">{summary?.orca?.count || 0}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Avg Latency:</span>
                <span className="font-bold text-amber-600">
                  {summary?.orca?.avgLatency || 0} ms
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-500 font-medium">
            Auto-fallback to Nemotron on 429
          </div>
        </div>

        {/* Card 3: Firecrawl Web & PDF */}
        <div className="bg-white rounded-2xl border-2 border-purple-300 border-b-4 border-b-purple-500 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500 text-white flex items-center justify-center font-black">
                <Globe className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-full">
                LIVE SEARCH &amp; SCRAPE
              </span>
            </div>
            <h3 className="font-black text-sm text-slate-900 mb-0.5">Firecrawl Engine</h3>
            <p className="text-[10px] text-slate-400 font-mono mb-3">api.firecrawl.dev</p>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Credits Used:</span>
                <span className="font-bold text-slate-900">
                  {firecrawlUsed} / {firecrawlMax}
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all"
                  style={{ width: `${firecrawlPct}%` }}
                />
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Total Scrapes:</span>
                <span className="font-bold text-slate-900">{summary?.firecrawl?.count || 0}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Avg Latency:</span>
                <span className="font-bold text-purple-600">
                  {summary?.firecrawl?.avgLatency || 0} ms
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-purple-700 font-bold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Constitutional case laws search
          </div>
        </div>

        {/* Card 4: GitHub Benchmark Grounding */}
        <div className="bg-white rounded-2xl border-2 border-sky-300 border-b-4 border-b-sky-500 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center font-black">
                <Database className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-wider bg-sky-100 text-sky-800 border border-sky-200 px-2 py-0.5 rounded-full">
                IELTS BAND 9 + UPSC
              </span>
            </div>
            <h3 className="font-black text-sm text-slate-900 mb-0.5">Benchmark Datasets</h3>
            <p className="text-[10px] text-slate-400 font-mono mb-3">LuchoBazz/ielts-ai-dataset</p>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>GitHub Invocations:</span>
                <span className="font-bold text-slate-900">{summary?.github?.count || 0}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Grounding Tokens:</span>
                <span className="font-bold text-slate-900">
                  {summary?.github?.totalTokens?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Dataset Fallback:</span>
                <span className="font-bold text-sky-600">Active &amp; Cached</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-sky-700 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Ruthless Head-Coach Grounding
          </div>
        </div>
      </div>

      {/* Live API Invocations Ledger */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 border-b-4 border-b-slate-300 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500"></span>
            </span>
            <h3 className="text-base font-black text-slate-800">Live API Call Ledger (Last 30 Calls)</h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Total System Calls: <strong className="text-slate-700">{summary?.totalCalls || 0}</strong>
          </span>
        </div>

        {recentLogs.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            No API calls recorded yet. Generate a quiz or run a live search to see incoming telemetry in real-time!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Provider</th>
                  <th className="py-2.5 px-3">Model / Endpoint</th>
                  <th className="py-2.5 px-3 text-right">Tokens</th>
                  <th className="py-2.5 px-3 text-right">Latency</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {recentLogs.map((log: any, idx: number) => {
                  const isSuccess = log.status === 'success'

                  let badgeColor = 'bg-slate-100 text-slate-700'
                  if (log.provider === 'nvidia') badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  if (log.provider === 'orcarouter') badgeColor = 'bg-amber-100 text-amber-800 border-amber-200'
                  if (log.provider === 'firecrawl') badgeColor = 'bg-purple-100 text-purple-800 border-purple-200'
                  if (log.provider === 'github-dataset') badgeColor = 'bg-sky-100 text-sky-800 border-sky-200'

                  return (
                    <tr key={log._id || idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                        {format(new Date(log.createdAt), 'hh:mm:ss a')}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${badgeColor}`}>
                          {log.provider}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700 max-w-xs truncate">
                        {log.model || log.endpoint}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                        {log.totalTokens?.toLocaleString() || 0}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                        {log.latencyMs} ms
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${
                            isSuccess
                              ? 'bg-green-100 text-green-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {isSuccess ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          {isSuccess ? 'OK' : 'ERR'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
