'use client'

import { useEffect, useState, useRef } from 'react'
import {
  Zap,
  CheckCircle2,
  Clock,
  Layers,
  Database,
  BrainCircuit,
  ShieldCheck,
  AlertCircle,
  X,
  RefreshCw,
} from 'lucide-react'
import { IProgram } from '@/models'
import { playStepTick, playCorrectSound, playWrongSound, playClickPop } from '@/lib/sounds'

interface QuizGenerationModalProps {
  isOpen: boolean
  onClose: () => void
  program: IProgram
  candidateName: string
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme'
  questionCount: number
  engine: 'nemotron' | 'deepseek'
  sessionWindow?: 'Morning' | 'Evening'
  useLiveSearch?: boolean
  isRevenge?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onQuizGenerated: (quiz: any) => void
}

export default function QuizGenerationModal({
  isOpen,
  onClose,
  program,
  candidateName,
  difficulty,
  questionCount,
  engine,
  sessionWindow = 'Morning',
  useLiveSearch = false,
  isRevenge = false,
  onQuizGenerated,
}: QuizGenerationModalProps) {
  const [currentStage, setCurrentStage] = useState<number>(1)
  const [progress, setProgress] = useState<number>(10)
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0)
  const [errorMsg, setErrorMsg] = useState<string>('')
  const [isCompleted, setIsCompleted] = useState<boolean>(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const generatedQuizRef = useRef<any>(null)
  const apiFinishedRef = useRef<boolean>(false)
  const isStartedRef = useRef<boolean>(false)

  // Identify Dataset
  const getDatasetBadge = () => {
    const code = program.code?.toUpperCase()
    if (code === 'AX40') return 'LuchoBazz/ielts-ai-dataset (Band 9.0)'
    if (code === 'AX39') return 'UPSC CSE Prelims / CLAT PG Law Bank'
    if (code === 'AN35') return 'CAT / GMAT Deductive Matrix Bank'
    return "SIBAQ '26 Canonical Academic Corpus"
  }

  // Active candidate weak topics
  const candidateObj = program.candidates?.find(
    (c) => c.name.toLowerCase() === candidateName.toLowerCase()
  ) || program.candidates?.[0]
  const weakTopics = candidateObj?.weaknesses?.length
    ? candidateObj.weaknesses.slice(0, 3).join(', ')
    : 'Comprehensive High-Yield Focus'

  const antiDupCount = program.askedQuestionRegistry?.length || 0

  // Start generation & timer
  useEffect(() => {
    if (!isOpen) {
      setCurrentStage(1)
      setProgress(10)
      setElapsedSeconds(0)
      setErrorMsg('')
      setIsCompleted(false)
      generatedQuizRef.current = null
      apiFinishedRef.current = false
      isStartedRef.current = false
      return
    }

    if (isStartedRef.current) return
    isStartedRef.current = true

    // Timer
    const timerInterval = setInterval(() => {
      setElapsedSeconds((s) => s + 1)
    }, 1000)

    // Trigger API call
    const startGeneration = async () => {
      try {
        let res: Response
        if (isRevenge) {
          res = await fetch('/api/ai/revenge-quiz', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              programCode: program.code,
              candidateName,
            }),
          })
        } else {
          res = await fetch('/api/ai/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              programCode: program.code,
              type: 'quiz',
              engine,
              difficulty,
              questionCount,
              sessionWindow,
              useLiveSearch,
            }),
          })
        }

        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || 'Generation failed')
        }

        generatedQuizRef.current = data.quiz
        apiFinishedRef.current = true
      } catch (err) {
        setErrorMsg((err as Error).message || 'Generation error')
        playWrongSound()
      }
    }

    startGeneration()

    // Stage progression choreography
    const s1 = setTimeout(() => {
      setCurrentStage(2)
      setProgress(35)
      playStepTick()
    }, 1200)

    const s2 = setTimeout(() => {
      setCurrentStage(3)
      setProgress(58)
      playStepTick()
    }, 2800)

    const s3 = setTimeout(() => {
      setCurrentStage(4)
      setProgress(80)
      playStepTick()
    }, 4500)

    // Check periodically for API completion
    const checkInterval = setInterval(() => {
      if (apiFinishedRef.current && generatedQuizRef.current) {
        clearInterval(checkInterval)
        setCurrentStage(5)
        setProgress(100)
        setIsCompleted(true)
        playCorrectSound()

        setTimeout(() => {
          onQuizGenerated(generatedQuizRef.current)
          onClose()
        }, 1200)
      }
    }, 500)

    return () => {
      clearInterval(timerInterval)
      clearInterval(checkInterval)
      clearTimeout(s1)
      clearTimeout(s2)
      clearTimeout(s3)
    }
  }, [
    isOpen,
    program.code,
    candidateName,
    difficulty,
    questionCount,
    engine,
    sessionWindow,
    useLiveSearch,
    isRevenge,
    onClose,
    onQuizGenerated,
  ])

  if (!isOpen) return null

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}s`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#4B4B4B]/60 backdrop-blur-xs select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-white border-2 border-[#E5E5E5] border-b-[6px] shadow-2xl overflow-hidden p-6 sm:p-7">
        {/* Close button (only available if error or user wants to abort) */}
        <button
          onClick={() => {
            playClickPop()
            onClose()
          }}
          className="absolute top-5 right-5 w-8 h-8 rounded-xl bg-[#F7F7F7] border border-[#E5E5E5] flex items-center justify-center text-[#777777] hover:bg-[#E5E5E5] transition-colors"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 border-b-4 ${
              isRevenge
                ? 'bg-[#FF9600] border-[#E58700] text-white'
                : 'bg-[#1CB0F6] border-[#1899D6] text-white'
            }`}
          >
            <Zap className="w-6 h-6 stroke-[2.5] animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-[#1CB0F6]">
                {isRevenge ? '1-Tap Mistake Crusher' : 'Live Synthesis Engine'}
              </span>
              <div className="flex items-center gap-1 text-[11px] font-mono font-bold bg-[#F7F7F7] px-2 py-0.5 rounded-md text-[#777777] border border-[#E5E5E5]">
                <Clock className="w-3 h-3 stroke-[2.5]" />
                <span>{formatTimer(elapsedSeconds)}</span>
              </div>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-[#4B4B4B] uppercase tracking-tight">
              {isRevenge
                ? `Forging Remedial Drill: ${candidateName}`
                : `Synthesizing ${program.code} Assessment`}
            </h2>
          </div>
        </div>

        {/* Chunky Duolingo Progress Bar */}
        <div className="relative w-full h-5 bg-[#E5E5E5] rounded-full p-1 border-2 border-[#E5E5E5] mb-6">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden ${
              isCompleted
                ? 'bg-[#58CC02]'
                : isRevenge
                ? 'bg-[#FF9600]'
                : 'bg-[#1CB0F6]'
            }`}
            style={{ width: `${progress}%` }}
          >
            <div className="bg-white/35 h-1.5 rounded-full mx-1.5 mt-0.5" />
          </div>
        </div>

        {/* 5-Stage Documented Pipeline */}
        <div className="space-y-3 mb-6">
          {/* Stage 1 */}
          <div
            className={`p-3 rounded-2xl border-2 transition-all ${
              currentStage >= 1
                ? 'bg-[#F7F7F7] border-[#E5E5E5]'
                : 'opacity-40 border-transparent'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#1CB0F6] stroke-[2.5]" />
                <span className="text-xs font-black uppercase text-[#4B4B4B]">
                  Stage 1: Syllabus & Scope Isolation
                </span>
              </div>
              {currentStage > 1 ? (
                <CheckCircle2 className="w-4 h-4 text-[#58CC02] stroke-[2.5]" />
              ) : (
                <span className="text-[10px] font-black text-[#1CB0F6] uppercase">Active</span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-[#777777] mt-1">
              <span className="bg-white border border-[#E5E5E5] px-2 py-0.5 rounded-md text-[#4B4B4B]">
                {program.code} ({program.title})
              </span>
              <span className="bg-white border border-[#E5E5E5] px-2 py-0.5 rounded-md text-[#4B4B4B]">
                {program.division}
              </span>
              <span className="bg-[#DDF4FF] border border-[#1CB0F6] text-[#1899D6] px-2 py-0.5 rounded-md uppercase">
                Tier: {difficulty}
              </span>
            </div>
          </div>

          {/* Stage 2 */}
          <div
            className={`p-3 rounded-2xl border-2 transition-all ${
              currentStage >= 2
                ? 'bg-[#F7F7F7] border-[#E5E5E5]'
                : 'opacity-40 border-transparent'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#FF9600] stroke-[2.5]" />
                <span className="text-xs font-black uppercase text-[#4B4B4B]">
                  Stage 2: Benchmark Dataset Injection
                </span>
              </div>
              {currentStage > 2 ? (
                <CheckCircle2 className="w-4 h-4 text-[#58CC02] stroke-[2.5]" />
              ) : currentStage === 2 ? (
                <span className="text-[10px] font-black text-[#FF9600] uppercase">Fetching</span>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-[#777777] mt-1">
              <span className="bg-white border border-[#E5E5E5] px-2 py-0.5 rounded-md text-[#FF9600]">
                {getDatasetBadge()}
              </span>
              {useLiveSearch && (
                <span className="bg-[#D7FFB8] border border-[#58CC02] text-[#58A700] px-2 py-0.5 rounded-md">
                  Firecrawl Live Web: ACTIVE
                </span>
              )}
            </div>
          </div>

          {/* Stage 3 */}
          <div
            className={`p-3 rounded-2xl border-2 transition-all ${
              currentStage >= 3
                ? 'bg-[#F7F7F7] border-[#E5E5E5]'
                : 'opacity-40 border-transparent'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#58CC02] stroke-[2.5]" />
                <span className="text-xs font-black uppercase text-[#4B4B4B]">
                  Stage 3: Weakness Filter & Anti-Duplication
                </span>
              </div>
              {currentStage > 3 ? (
                <CheckCircle2 className="w-4 h-4 text-[#58CC02] stroke-[2.5]" />
              ) : currentStage === 3 ? (
                <span className="text-[10px] font-black text-[#58CC02] uppercase">Scanning</span>
              ) : null}
            </div>
            <div className="text-[11px] font-bold text-[#777777] mt-1 space-y-0.5">
              <div>
                Targeting: <span className="text-[#4B4B4B]">{weakTopics}</span>
              </div>
              <div className="text-[10px] text-[#777777]">
                Anti-duplicate filter: {antiDupCount} past stems shielded from repeat
              </div>
            </div>
          </div>

          {/* Stage 4 */}
          <div
            className={`p-3 rounded-2xl border-2 transition-all ${
              currentStage >= 4
                ? 'bg-[#F7F7F7] border-[#E5E5E5]'
                : 'opacity-40 border-transparent'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-[#CE82FF] stroke-[2.5]" />
                <span className="text-xs font-black uppercase text-[#4B4B4B]">
                  Stage 4: AI Coach Question Synthesis
                </span>
              </div>
              {currentStage > 4 ? (
                <CheckCircle2 className="w-4 h-4 text-[#58CC02] stroke-[2.5]" />
              ) : currentStage === 4 ? (
                <span className="text-[10px] font-black text-[#CE82FF] uppercase animate-pulse">
                  Synthesizing
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-2 text-[11px] font-bold text-[#777777] mt-1">
              <span className="bg-[#F3E5FF] border border-[#CE82FF] text-[#A568CC] px-2 py-0.5 rounded-md uppercase">
                {engine === 'nemotron' ? 'NVIDIA Nemotron 70B' : 'DeepSeek V4 Flash'}
              </span>
              <span>{isRevenge ? '10 Targeted Remedial MCQs' : `${questionCount} Olympiad MCQs`}</span>
            </div>
          </div>

          {/* Stage 5 */}
          <div
            className={`p-3 rounded-2xl border-2 transition-all ${
              currentStage >= 5
                ? 'bg-[#D7FFB8] border-[#58CC02]'
                : 'opacity-40 border-transparent'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#58CC02] stroke-[2.5]" />
                <span className="text-xs font-black uppercase text-[#58A700]">
                  Stage 5: Schema Validation & Timer Lock
                </span>
              </div>
              {isCompleted ? (
                <span className="text-[11px] font-black text-[#58CC02] uppercase tracking-wider animate-bounce">
                  QUIZ READY!
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Error Handling */}
        {errorMsg && (
          <div className="mb-4 p-4 rounded-2xl bg-[#FFDFE0] border-2 border-[#FF4B4B] text-[#EA2B2B]">
            <div className="flex items-center gap-2 font-black text-xs uppercase mb-1">
              <AlertCircle className="w-4 h-4 stroke-[2.5]" />
              <span>Generation Failed</span>
            </div>
            <p className="text-xs font-bold">{errorMsg}</p>
            <button
              onClick={() => {
                playClickPop()
                setErrorMsg('')
                setCurrentStage(1)
                setProgress(10)
                isStartedRef.current = false
              }}
              className="mt-3 px-4 py-2 rounded-xl bg-[#FF4B4B] border-b-4 border-[#EA2B2B] active:border-b-0 active:translate-y-[4px] text-white text-xs font-black uppercase flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Retry Generation</span>
            </button>
          </div>
        )}

        {/* Footer info */}
        <div className="text-center text-[11px] font-extrabold text-[#777777] uppercase tracking-wider">
          {isCompleted
            ? 'Transitioning to Assessment Window...'
            : 'Coaching candidate to national excellence'}
        </div>
      </div>
    </div>
  )
}
