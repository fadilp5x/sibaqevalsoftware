'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Globe, Cpu, Zap, X } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: string[]
  noLiveResults?: boolean
}

interface ChatDrawerProps {
  programCode: string
  programTitle: string
  candidateName: string
  accentColor: string
}

const QUICK_ACTIONS = [
  { label: '🎯 Quiz me on my recent weak topics', message: 'Quiz me on my current weak topics with 3 practice questions.' },
  { label: '📚 Summarize PDFs into 5 key rules', message: 'Summarize the uploaded study material into 5 key exam rules I must remember.' },
  { label: '🌐 Search latest exam questions', message: 'Search for the latest exam questions and important topics for this syllabus.', useLiveSearch: true },
]

const accentBtnMap: Record<string, string> = {
  emerald: 'bg-[#58CC02] border-[#46A302] text-white',
  sky: 'bg-[#1CB0F6] border-[#1899D6] text-white',
  amber: 'bg-[#FFC800] border-[#E5B400] text-slate-800',
  purple: 'bg-[#CE82FF] border-[#b56de6] text-white',
}

export default function ChatDrawer({ programCode, programTitle, candidateName, accentColor }: ChatDrawerProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hi! I'm your AI tutor for **${programTitle}**. Ask me anything about the syllabus, or use the quick actions below. I can also search the web for the latest exam resources!`,
    },
  ])
  const [input, setInput] = useState('')
  const [engine, setEngine] = useState<'nvidia' | 'orca'>('nvidia')
  const [useLiveSearch, setUseLiveSearch] = useState(false)
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const accentBtn = accentBtnMap[accentColor] || accentBtnMap.sky

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
          candidateName,
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
          content: data.reply || 'Sorry, I could not generate a response.',
          sources: data.sources,
          noLiveResults: data.noLiveResults,
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '⚠️ Network error. Please try again.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(true)}
        className={`
          fixed bottom-6 right-6 z-40
          flex items-center gap-2 px-4 py-3 rounded-2xl
          border-2 border-b-4 font-bold text-sm shadow-lg
          active:border-b-2 active:translate-y-[2px] transition-all duration-100
          ${accentBtn}
        `}
      >
        <span>💬</span>
        <span>Ask Program AI + Web</span>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`
          fixed right-0 top-0 h-full w-full sm:w-[420px] bg-white z-50
          border-l-2 border-slate-200 shadow-2xl
          flex flex-col
          transition-transform duration-300
          ${open ? 'translate-x-0' : 'translate-x-full'}
        `}
        style={{ willChange: 'transform' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-lg">💬</span>
            <div>
              <div className="text-sm font-black text-slate-800">Program AI Tutor</div>
              <div className="text-xs text-slate-400">{programTitle}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Engine switcher */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setEngine('nvidia')}
                className={`text-xs px-2 py-1 rounded-md font-bold transition-all ${engine === 'nvidia' ? 'bg-white shadow text-sky-700' : 'text-slate-500'}`}
              >
                <Cpu className="w-3 h-3 inline mr-1" />Nemotron
              </button>
              <button
                onClick={() => setEngine('orca')}
                className={`text-xs px-2 py-1 rounded-md font-bold transition-all ${engine === 'orca' ? 'bg-white shadow text-amber-700' : 'text-slate-500'}`}
              >
                <Zap className="w-3 h-3 inline mr-1" />DeepSeek
              </button>
            </div>
            <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-sky-500 text-white rounded-br-sm'
                    : 'bg-white border-2 border-slate-200 border-b-4 border-b-slate-300 text-slate-800 rounded-bl-sm'
                }`}
              >
                {msg.noLiveResults && (
                  <div className="text-amber-600 text-xs font-semibold mb-2 bg-amber-50 rounded-lg px-2 py-1">
                    ⚠️ No live results found — answering from knowledge base
                  </div>
                )}
                <div className="whitespace-pre-wrap">{msg.content}</div>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-100 space-y-1">
                    {msg.sources.slice(0, 3).map((src, j) => (
                      <a key={j} href={src} target="_blank" rel="noopener noreferrer"
                        className="block text-xs text-sky-600 hover:underline truncate">
                        🔗 {src}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border-2 border-slate-200 border-b-4 border-b-slate-300 rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick actions */}
        <div className="px-4 pb-2">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.label}
                onClick={() => sendMessage(action.message, action.useLiveSearch)}
                disabled={loading}
                className="flex-shrink-0 text-xs font-bold px-3 py-2 rounded-xl bg-slate-100 border-2 border-slate-200 border-b-4 border-b-slate-300 text-slate-700 hover:bg-slate-200 active:border-b-2 active:translate-y-[2px] transition-all duration-100 whitespace-nowrap disabled:opacity-50"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input bar */}
        <div className="px-4 pb-4 pt-2 border-t border-slate-100">
          {/* Web search toggle */}
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setUseLiveSearch(!useLiveSearch)}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border-2 border-b-4 transition-all duration-100 active:border-b-2 active:translate-y-[2px] ${
                useLiveSearch
                  ? 'bg-sky-100 border-sky-300 border-b-sky-500 text-sky-700'
                  : 'bg-slate-100 border-slate-200 border-b-slate-300 text-slate-500'
              }`}
            >
              <Globe className="w-3 h-3" />
              {useLiveSearch ? 'Live Web: ON' : 'Live Web: OFF'}
            </button>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
              placeholder="Ask anything about this program..."
              disabled={loading}
              className="flex-1 border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-400 disabled:opacity-50 transition-colors"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              className={`
                px-3 py-2.5 rounded-xl border-2 border-b-4 font-bold
                active:border-b-2 active:translate-y-[2px] transition-all duration-100
                disabled:opacity-40 disabled:cursor-not-allowed
                ${accentBtn}
              `}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
