'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Globe, Cpu, Bot, User, Sparkles, RefreshCw } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: string[]
  noLiveResults?: boolean
}

interface AICoachTabProps {
  programCode: string
  programTitle: string
  candidateName: string
}

const QUICK_ACTIONS = [
  {
    label: 'Quiz on Weak Topics',
    message: 'Quiz me on my current weak topics with 3 rigorous practice questions.',
  },
  {
    label: 'Summarize Key Rules',
    message: 'Summarize the core syllabus principles into 5 high-yield exam rules.',
  },
  {
    label: 'Search Latest Benchmarks',
    message: 'Search for recent championship exam questions and important developments for this syllabus.',
    useLiveSearch: true,
  },
]

export default function AICoachTab({
  programCode,
  programTitle,
  candidateName,
}: AICoachTabProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hello ${candidateName || 'Candidate'}. I am your dedicated AI Coach for **${programTitle}** (${programCode}).\n\nAsk me any concept, request deep drill breakdowns, or toggle Live Web Search for up-to-date Olympiad references.`,
    },
  ])
  const [input, setInput] = useState('')
  const [engine, setEngine] = useState<'nvidia' | 'orca'>('nvidia')
  const [useLiveSearch, setUseLiveSearch] = useState(false)
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (msg: string, liveSearch?: boolean) => {
    if (!msg.trim() || loading) return

    const userMsg: Message = { role: 'user', content: msg }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programCode,
          candidateName: candidateName || 'Candidate',
          userMessage: msg,
          engine,
          useLiveSearch: liveSearch ?? useLiveSearch,
        }),
      })

      const data = await res.json()
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply || 'No response generated.',
          sources: data.sources,
          noLiveResults: data.noLiveResults,
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Network connection issue. Please check your connection and retry.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-3xl border-2 border-slate-200/90 shadow-sm flex flex-col h-[650px] overflow-hidden">
      {/* Header bar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-[#FAF9F6]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#5F4BB6] text-white flex items-center justify-center shadow-md">
            <Bot className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-sm text-[#1E2538]">SST AI Coach</h3>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-[#5F4BB6]/10 text-[#5F4BB6] font-bold">
                {programCode}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Individual sparring coach for{' '}
              <span className="font-bold text-slate-800">{candidateName || 'Candidate'}</span>
            </p>
          </div>
        </div>

        {/* Engine & Live Search Switcher */}
        <div className="flex items-center gap-2">
          {/* Engine button */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-xs text-xs font-bold">
            <button
              onClick={() => setEngine('nvidia')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                engine === 'nvidia'
                  ? 'bg-[#1E2538] text-white'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>NVIDIA Nemotron</span>
            </button>
            <button
              onClick={() => setEngine('orca')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                engine === 'orca'
                  ? 'bg-[#1E2538] text-white'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>DeepSeek</span>
            </button>
          </div>

          {/* Live Search Toggle */}
          <button
            onClick={() => setUseLiveSearch(!useLiveSearch)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
              useLiveSearch
                ? 'bg-[#00A896]/15 border-[#00A896]/40 text-[#00A896]'
                : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800'
            }`}
            title="Toggle Firecrawl Live Web Search"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Live Search</span>
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-3 ${
              m.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                m.role === 'user'
                  ? 'bg-[#FF6B4A] text-white'
                  : 'bg-[#5F4BB6] text-white'
              }`}
            >
              {m.role === 'user' ? (
                <User className="w-4 h-4" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </div>

            <div
              className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'bg-[#1E2538] text-white font-medium'
                  : 'bg-[#FAF9F6] border border-slate-200 text-slate-800'
              }`}
            >
              <div className="whitespace-pre-wrap">{m.content}</div>

              {/* Citations / Sources */}
              {m.sources && m.sources.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-200/60">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                    <Globe className="w-3 h-3 text-[#00A896]" /> Sources Cited:
                  </div>
                  <div className="space-y-1">
                    {m.sources.map((src, sIdx) => (
                      <a
                        key={sIdx}
                        href={src}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-[11px] text-[#00A896] hover:underline truncate"
                      >
                        {src}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#5F4BB6] text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-[#FAF9F6] border border-slate-200 rounded-2xl p-3 flex items-center gap-2 text-xs text-slate-500">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#5F4BB6]" />
              <span>Coach is formulating analysis...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick Prompt Pills */}
      <div className="px-4 py-2 border-t border-slate-100 bg-[#FAF9F6] overflow-x-auto scrollbar-none flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase text-slate-400 shrink-0">
          Drill Prompts:
        </span>
        {QUICK_ACTIONS.map((action, i) => (
          <button
            key={i}
            onClick={() => sendMessage(action.message, action.useLiveSearch)}
            disabled={loading}
            className="shrink-0 px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-[#1E2538] hover:border-slate-300 text-[11px] font-semibold transition-all disabled:opacity-50"
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* Input bar */}
      <div className="p-4 border-t border-slate-200 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            sendMessage(input)
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask Coach regarding ${programCode} syllabus...`}
            className="flex-1 px-4 py-2.5 rounded-2xl bg-[#FAF9F6] border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#5F4BB6] focus:ring-1 focus:ring-[#5F4BB6]"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2.5 rounded-2xl bg-[#5F4BB6] text-white hover:bg-[#4E3CA3] active:translate-y-[1px] transition-all disabled:opacity-50"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  )
}
