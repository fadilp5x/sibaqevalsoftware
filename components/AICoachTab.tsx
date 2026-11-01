'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Globe, Cpu, Bot, User, RefreshCw, Zap } from 'lucide-react'
import { playClickPop } from '@/lib/sounds'

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
    playClickPop()

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
      if (!res.ok) throw new Error(data.error || 'Failed to get coach response')

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply || data.response || 'No response received.',
          sources: data.sources,
          noLiveResults: data.noLiveResults,
        },
      ])
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Coach error: ${(e as Error).message}. Please try again.`,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-[#E5E5E5] border-b-4 shadow-xs overflow-hidden flex flex-col h-[650px] select-none">
      {/* Top Coach Header Bar */}
      <div className="p-4 sm:p-5 border-b-2 border-[#E5E5E5] flex flex-wrap items-center justify-between gap-3 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#CE82FF] border-b-2 border-[#A568CC] flex items-center justify-center text-white shadow-xs">
            <Bot className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-sm text-[#4B4B4B] uppercase tracking-wide">
                AI Coach: {programCode}
              </h3>
              <span className="w-2 h-2 rounded-full bg-[#58CC02] animate-pulse" />
            </div>
            <p className="text-[11px] font-bold text-[#777777] uppercase tracking-wider">
              Candidate: {candidateName}
            </p>
          </div>
        </div>

        {/* Engine & Live Search Switcher */}
        <div className="flex items-center gap-2">
          {/* Engine button */}
          <div className="flex items-center bg-[#F7F7F7] border-2 border-[#E5E5E5] rounded-xl p-1 text-xs font-black uppercase">
            <button
              onClick={() => {
                playClickPop()
                setEngine('nvidia')
              }}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-all ${
                engine === 'nvidia'
                  ? 'bg-[#1CB0F6] text-white shadow-xs'
                  : 'text-[#777777] hover:text-[#4B4B4B]'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Nemotron</span>
            </button>
            <button
              onClick={() => {
                playClickPop()
                setEngine('orca')
              }}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-all ${
                engine === 'orca'
                  ? 'bg-[#1CB0F6] text-white shadow-xs'
                  : 'text-[#777777] hover:text-[#4B4B4B]'
              }`}
            >
              <Zap className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>DeepSeek</span>
            </button>
          </div>

          {/* Live Search Toggle */}
          <button
            onClick={() => {
              playClickPop()
              setUseLiveSearch(!useLiveSearch)
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-b-4 text-xs font-black uppercase transition-all duration-75 active:border-b-0 active:translate-y-[4px] ${
              useLiveSearch
                ? 'bg-[#58CC02] border-[#58A700] text-white'
                : 'bg-white border-[#E5E5E5] border-b-[#DCDCDC] text-[#777777] hover:bg-[#F7F7F7]'
            }`}
            title="Toggle Firecrawl Live Web Search"
          >
            <Globe className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Search</span>
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#F7F7F7]">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-3 ${
              m.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border border-black/10 ${
                m.role === 'user'
                  ? 'bg-[#1CB0F6] text-white'
                  : 'bg-[#CE82FF] text-white'
              }`}
            >
              {m.role === 'user' ? (
                <User className="w-4 h-4 stroke-[2.5]" />
              ) : (
                <Bot className="w-4 h-4 stroke-[2.5]" />
              )}
            </div>

            <div
              className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed border-2 ${
                m.role === 'user'
                  ? 'bg-white border-[#1CB0F6] border-b-4 text-[#4B4B4B] font-bold'
                  : 'bg-white border-[#E5E5E5] border-b-4 text-[#4B4B4B]'
              }`}
            >
              <div className="whitespace-pre-wrap font-bold">{m.content}</div>

              {/* Citations / Sources */}
              {m.sources && m.sources.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-[#E5E5E5]">
                  <div className="text-[10px] font-black uppercase tracking-wider text-[#777777] mb-1 flex items-center gap-1">
                    <Globe className="w-3 h-3 text-[#58CC02] stroke-[2.5]" /> Sources Cited:
                  </div>
                  <div className="space-y-1">
                    {m.sources.map((src, sIdx) => (
                      <a
                        key={sIdx}
                        href={src}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-[11px] text-[#1CB0F6] hover:underline truncate font-mono font-bold"
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
            <div className="w-8 h-8 rounded-xl bg-[#CE82FF] text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div className="bg-white border-2 border-[#E5E5E5] border-b-4 rounded-2xl p-3 flex items-center gap-2 text-xs font-bold text-[#777777]">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#CE82FF] stroke-[2.5]" />
              <span>Coach is formulating analysis...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick Prompt Pills */}
      <div className="px-4 py-2 border-t-2 border-[#E5E5E5] bg-white overflow-x-auto scrollbar-none flex items-center gap-2">
        <span className="text-[10px] font-black uppercase text-[#777777] shrink-0">
          Drill Prompts:
        </span>
        {QUICK_ACTIONS.map((action, i) => (
          <button
            key={i}
            onClick={() => sendMessage(action.message, action.useLiveSearch)}
            disabled={loading}
            className="shrink-0 px-3 py-1 rounded-xl bg-[#F7F7F7] border border-[#E5E5E5] text-[#4B4B4B] hover:bg-[#DDF4FF] hover:border-[#1CB0F6] hover:text-[#1899D6] text-[11px] font-black uppercase transition-all disabled:opacity-50"
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* Input bar */}
      <div className="p-4 border-t-2 border-[#E5E5E5] bg-white">
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
            className="flex-1 px-4 py-3 rounded-xl bg-[#F7F7F7] border-2 border-[#E5E5E5] text-xs font-bold text-[#4B4B4B] focus:outline-none focus:border-[#1CB0F6] focus:bg-white transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-3 rounded-xl bg-[#58CC02] border-b-4 border-[#58A700] text-white hover:bg-[#58A700] active:border-b-0 active:translate-y-[4px] transition-all duration-75 disabled:opacity-50 select-none shadow-xs"
            title="Send Message"
          >
            <Send className="w-4 h-4 stroke-[2.5]" />
          </button>
        </form>
      </div>
    </div>
  )
}
