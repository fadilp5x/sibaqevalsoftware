'use client'

import { useEffect, useState } from 'react'
import {
  Sparkles,
  Database,
  BrainCircuit,
  Flame,
  Award,
  CheckCircle2,
  Loader2,
  Clock,
  ShieldCheck,
} from 'lucide-react'

interface CoachGenerationOverlayProps {
  isOpen: boolean
  programCode: string
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme'
  questionCount?: number
  engine?: 'nvidia' | 'orca'
}

const COACH_TIPS = [
  'Coach Rule: High-tier distractors represent real student misconceptions, not obvious wrong answers.',
  'Coach Rule: Every question is cross-referenced with university syllabus benchmarks and previous attempts.',
  'IELTS Band 9: Tests deep semantic inference, syntactic parsing, and contextual nuance.',
  'UPSC / CLAT Mode: Focuses on multi-statement Constitutional and analytical frameworks.',
  'Anti-Duplication: Every generated problem is checked against the candidate\'s past drill ledger.',
]

export default function CoachGenerationOverlay({
  isOpen,
  programCode,
  difficulty,
  questionCount = 10,
  engine = 'nvidia',
}: CoachGenerationOverlayProps) {
  const [activeStep, setActiveStep] = useState(1)
  const [seconds, setSeconds] = useState(0)
  const [tipIndex, setTipIndex] = useState(0)

  useEffect(() => {
    if (!isOpen) {
      setActiveStep(1)
      setSeconds(0)
      return
    }

    // Timer
    const interval = setInterval(() => {
      setSeconds((s) => s + 1)
    }, 1000)

    // Stagger step progression
    const step2Timer = setTimeout(() => setActiveStep(2), 2200)
    const step3Timer = setTimeout(() => setActiveStep(3), 5000)

    // Rotate tips every 3.5s
    const tipInterval = setInterval(() => {
      setTipIndex((idx) => (idx + 1) % COACH_TIPS.length)
    }, 3500)

    return () => {
      clearInterval(interval)
      clearInterval(tipInterval)
      clearTimeout(step2Timer)
      clearTimeout(step3Timer)
    }
  }, [isOpen])

  if (!isOpen) return null

  const getDifficultyColor = () => {
    switch (difficulty) {
      case 'easy':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300'
      case 'hard':
        return 'bg-amber-100 text-amber-800 border-amber-300'
      case 'extreme':
        return 'bg-rose-100 text-rose-800 border-rose-300'
      case 'medium':
      default:
        return 'bg-sky-100 text-sky-800 border-sky-300'
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg bg-white rounded-3xl border-2 border-slate-300 border-b-8 border-b-slate-400 p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Top glow decoration */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-sky-200 rounded-full blur-2xl opacity-60 pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-amber-200 rounded-full blur-2xl opacity-50 pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6 relative">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-sky-500 to-emerald-500 flex items-center justify-center shadow-md border border-white">
              <BrainCircuit className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900">Champion-Coach AI</h3>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-slate-100 font-bold text-slate-600 border border-slate-200">
                  {engine === 'nvidia' ? 'NVIDIA Nemotron' : 'DeepSeek V3'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Synthesizing targeted assessment for <span className="font-bold text-slate-700">{programCode}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <span
              className={`text-[11px] font-black uppercase px-2.5 py-1 rounded-xl border flex items-center gap-1 ${getDifficultyColor()}`}
            >
              {difficulty === 'extreme' && <Flame className="w-3 h-3 text-rose-600 fill-rose-500" />}
              {difficulty.toUpperCase()}
            </span>
            <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
              <Clock className="w-3 h-3" />
              <span>{String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}</span>
            </div>
          </div>
        </div>

        {/* 3-Step Live Progress Steps */}
        <div className="space-y-3 mb-6 relative">
          {/* Step 1 */}
          <div
            className={`p-3.5 rounded-2xl border-2 transition-all duration-300 flex items-start gap-3 ${
              activeStep > 1
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                : activeStep === 1
                ? 'bg-sky-50 border-sky-300 text-sky-950 shadow-sm ring-2 ring-sky-200/50'
                : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
            }`}
          >
            <div className="mt-0.5">
              {activeStep > 1 ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : activeStep === 1 ? (
                <Loader2 className="w-5 h-5 text-sky-600 animate-spin" />
              ) : (
                <Database className="w-5 h-5 text-slate-400" />
              )}
            </div>
            <div className="flex-1">
              <div className="text-xs font-black uppercase tracking-wide">
                Step 1: Benchmark Dataset Grounding
              </div>
              <div className="text-xs font-medium text-slate-600 mt-0.5">
                Connecting to IELTS Band-9, UPSC CSE &amp; CAT/LSAT benchmark banks...
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div
            className={`p-3.5 rounded-2xl border-2 transition-all duration-300 flex items-start gap-3 ${
              activeStep > 2
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                : activeStep === 2
                ? 'bg-sky-50 border-sky-300 text-sky-950 shadow-sm ring-2 ring-sky-200/50'
                : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
            }`}
          >
            <div className="mt-0.5">
              {activeStep > 2 ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : activeStep === 2 ? (
                <Loader2 className="w-5 h-5 text-sky-600 animate-spin" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-slate-400" />
              )}
            </div>
            <div className="flex-1">
              <div className="text-xs font-black uppercase tracking-wide">
                Step 2: Candidate Weakness Analysis
              </div>
              <div className="text-xs font-medium text-slate-600 mt-0.5">
                Cross-checking candidate error history &amp; anti-duplication ledger...
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div
            className={`p-3.5 rounded-2xl border-2 transition-all duration-300 flex items-start gap-3 ${
              activeStep === 3
                ? 'bg-amber-50 border-amber-300 text-amber-950 shadow-sm ring-2 ring-amber-200/50'
                : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
            }`}
          >
            <div className="mt-0.5">
              {activeStep === 3 ? (
                <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
              ) : (
                <Award className="w-5 h-5 text-slate-400" />
              )}
            </div>
            <div className="flex-1">
              <div className="text-xs font-black uppercase tracking-wide">
                Step 3: Neural Generation ({questionCount} Questions)
              </div>
              <div className="text-xs font-medium text-slate-600 mt-0.5">
                NVIDIA Nemotron synthesizing rigorous distractors &amp; coach explanations...
              </div>
            </div>
          </div>
        </div>

        {/* Coach tip ticker */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
          <p className="text-xs text-slate-600 italic transition-all duration-300">
            &ldquo;{COACH_TIPS[tipIndex]}&rdquo;
          </p>
        </div>

        {/* Bottom indicator */}
        <div className="mt-4 text-center">
          <p className="text-[11px] text-slate-400 font-medium">
            Please wait while the AI generates your champion-tier quiz. This usually takes 5-12 seconds.
          </p>
        </div>
      </div>
    </div>
  )
}
