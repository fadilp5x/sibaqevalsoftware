'use client'

import { useState } from 'react'
import { Copy, Check, Share2, ExternalLink, X } from 'lucide-react'
import TactileButton from '@/components/ui/TactileButton'

interface ShareQuizModalProps {
  isOpen: boolean
  onClose: () => void
  quiz: {
    _id: string
    title: string
    questions?: unknown[]
    durationMinutes?: number
    sessionWindow?: string
    programCode?: string
  } | null
}

export default function ShareQuizModal({ isOpen, onClose, quiz }: ShareQuizModalProps) {
  const [copied, setCopied] = useState(false)

  if (!isOpen || !quiz) return null

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const shareUrl = `${origin}/quiz/${quiz._id}`

  const handleCopy = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `🎯 Take the SIBAQ '26 Assessment Quiz: "${quiz.title}"\n\nClick the link below to enter your name and start:\n${shareUrl}`
    )
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl border-2 border-sky-300 border-b-8 border-b-sky-500 max-w-md w-full p-6 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-5">
          <div className="w-14 h-14 bg-sky-100 border-2 border-sky-300 text-sky-600 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3 shadow-inner">
            🚀
          </div>
          <h3 className="text-xl font-black text-slate-900 leading-tight">Quiz Ready to Share!</h3>
          <p className="text-xs text-slate-500 mt-1">
            Anyone with this link can attend. Their name &amp; marks will automatically stream to your dashboard.
          </p>
        </div>

        {/* Quiz Details Card */}
        <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 mb-4">
          <div className="text-sm font-bold text-slate-800 line-clamp-1">{quiz.title}</div>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
            <span className="bg-sky-100 text-sky-700 font-bold px-2 py-0.5 rounded-md">
              {quiz.sessionWindow || 'Live'}
            </span>
            <span>·</span>
            <span>{quiz.questions?.length || 10} Questions</span>
            <span>·</span>
            <span>{quiz.durationMinutes || 45} Mins</span>
          </div>
        </div>

        {/* Shareable Link Input */}
        <div className="mb-5">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
            Public Shareable Link
          </label>
          <div className="flex items-center gap-2 bg-slate-100 border-2 border-slate-300 rounded-xl p-1.5 focus-within:border-sky-500 focus-within:bg-white transition-all">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="bg-transparent text-xs font-mono font-bold text-slate-800 px-2 flex-1 focus:outline-none select-all"
            />
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border-2 border-b-4 transition-all duration-100 active:border-b-2 active:translate-y-[2px] ${
                copied
                  ? 'bg-green-500 border-green-600 border-b-green-700 text-white'
                  : 'bg-white border-slate-200 border-b-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2.5">
          <TactileButton
            accentColor="emerald"
            fullWidth
            onClick={handleWhatsApp}
            className="text-sm py-3"
          >
            <Share2 className="w-4 h-4" />
            Share to WhatsApp
          </TactileButton>

          <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="block">
            <TactileButton
              accentColor="sky"
              fullWidth
              className="text-sm py-2.5"
            >
              <ExternalLink className="w-4 h-4" />
              Preview Quiz as Candidate
            </TactileButton>
          </a>

          <button
            onClick={onClose}
            className="w-full text-center text-xs font-bold text-slate-400 hover:text-slate-600 py-1.5 transition-colors"
          >
            Close &amp; Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
