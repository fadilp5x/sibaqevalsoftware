'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { IFlashcard } from '@/models'
import CandidatePill from '@/components/CandidatePill'
import WeeklyLineChart from '@/components/WeeklyLineChart'
import TopicProgressBars from '@/components/TopicProgressBars'
import MissedQuestionsGrid from '@/components/MissedQuestionsGrid'
import FlipFlashcard from '@/components/FlipFlashcard'
import ShareQuizModal from '@/components/ShareQuizModal'
import CoachGenerationOverlay from '@/components/CoachGenerationOverlay'
import AdminModal from '@/components/AdminModal'
import AICoachTab from '@/components/AICoachTab'
import {
  BarChart2,
  BookOpen,
  Award,
  Loader2,
  Zap,
  Cpu,
  Globe,
  Share2,
  Check,
  RefreshCw,
  UserPlus,
  X,
  Sun,
  Moon,
  Shield,
  Flame,
  Bot,
  Play,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react'
import { format } from 'date-fns'

type Tab = 'performance' | 'quizzes' | 'study' | 'coach'

interface ProgramHubClientProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  program: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  quizzes: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  materials: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  attempts: any[]
  initialCandidate?: string
}

export default function ProgramHubClient({
  program,
  quizzes,
  materials,
  attempts,
  initialCandidate,
}: ProgramHubClientProps) {
  // Candidate data & individual-first selection
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [localCandidates, setLocalCandidates] = useState<any[]>(program.candidates || [])
  const [selectedCandidate, setSelectedCandidate] = useState<string>(() => {
    if (initialCandidate && localCandidates.some((c) => c.name.toLowerCase() === initialCandidate.toLowerCase())) {
      return initialCandidate
    }
    return localCandidates[0]?.name || 'Candidate 1'
  })

  const [tab, setTab] = useState<Tab>('performance')
  const [generating, setGenerating] = useState(false)
  const [isRevengeGen, setIsRevengeGen] = useState(false)
  const [genEngine, setGenEngine] = useState<'nvidia' | 'orca'>('nvidia')
  const [genDifficulty, setGenDifficulty] = useState<'easy' | 'medium' | 'hard' | 'extreme'>('medium')
  const [genQuestionCount, setGenQuestionCount] = useState<number>(10)
  const [genSessionWindow, setGenSessionWindow] = useState<'Morning' | 'Evening'>(
    new Date().getHours() < 12 ? 'Morning' : 'Evening'
  )
  const [genLiveSearch, setGenLiveSearch] = useState(false)
  const [genError, setGenError] = useState('')

  // Modals
  const [isSyllabusOpen, setIsSyllabusOpen] = useState(false)
  const [isAddCandidateOpen, setIsAddCandidateOpen] = useState(false)
  const [isAdminOpen, setIsAdminOpen] = useState(false)
  const [newCandidateName, setNewCandidateName] = useState('')
  const [newCandidateRegNo, setNewCandidateRegNo] = useState('')
  const [addingCandidate, setAddingCandidate] = useState(false)
  const [addCandidateError, setAddCandidateError] = useState('')

  // Dynamic lists
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [localMaterials, setLocalMaterials] = useState<any[]>(materials)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [localQuizzes, setLocalQuizzes] = useState<any[]>(quizzes)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [localAttempts, setLocalAttempts] = useState<any[]>(attempts)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Share Modal
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [sharedQuiz, setSharedQuiz] = useState<any | null>(null)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [copiedQuizId, setCopiedQuizId] = useState<string | null>(null)

  // Study Hub
  const [flashcardIdx, setFlashcardIdx] = useState(0)
  const [flashcardDeck] = useState<IFlashcard[]>(materials[0]?.flashcards || [])
  const [uploading, setUploading] = useState(false)
  const [uploadText, setUploadText] = useState('')

  // Sync latest submissions from server
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const res = await fetch(`/api/programs/${program.code}`)
      const data = await res.json()
      if (data.attempts) setLocalAttempts(data.attempts)
      if (data.quizzes) setLocalQuizzes(data.quizzes)
      if (data.program?.candidates) setLocalCandidates(data.program.candidates)
    } catch (e) {
      console.error('Failed to sync program data:', e)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Periodic poll
  useEffect(() => {
    const timer = setInterval(() => {
      handleRefresh()
    }, 20000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [program.code])

  const handleCopyQuizLink = (quizId: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const shareUrl = `${origin}/quiz/${quizId}`
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(shareUrl)
      setCopiedQuizId(quizId)
      setTimeout(() => setCopiedQuizId(null), 2500)
    }
  }

  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCandidateName.trim()) return
    setAddingCandidate(true)
    setAddCandidateError('')

    try {
      const res = await fetch(`/api/programs/${program.code}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate: {
            name: newCandidateName.trim(),
            regNo: newCandidateRegNo.trim() || `${program.code}-${String(localCandidates.length + 1).padStart(3, '0')}`,
          },
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add candidate')

      if (data.candidate) {
        setLocalCandidates((prev) => [...prev, data.candidate])
        setSelectedCandidate(data.candidate.name)
        setNewCandidateName('')
        setNewCandidateRegNo('')
        setIsAddCandidateOpen(false)
      }
    } catch (err) {
      setAddCandidateError((err as Error).message)
    } finally {
      setAddingCandidate(false)
    }
  }

  // 1-Tap Revenge Quiz (Mistake Crusher)
  const handleLaunchRevengeQuiz = async () => {
    setGenerating(true)
    setIsRevengeGen(true)
    setGenError('')
    try {
      const res = await fetch('/api/ai/revenge-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programCode: program.code,
          candidateName: selectedCandidate,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Revenge Quiz generation failed')

      if (data.quiz) {
        setLocalQuizzes((prev) => [data.quiz, ...prev])
        setSharedQuiz(data.quiz)
        setIsShareModalOpen(true)
      }
    } catch (e) {
      setGenError((e as Error).message)
    } finally {
      setGenerating(false)
      setIsRevengeGen(false)
    }
  }

  // Standard Quiz Generation
  const handleGenerate = async () => {
    setGenerating(true)
    setGenError('')
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programCode: program.code,
          type: 'quiz',
          engine: genEngine,
          difficulty: genDifficulty,
          questionCount: genQuestionCount,
          sessionWindow: genSessionWindow,
          useLiveSearch: genLiveSearch,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')

      if (data.quiz) {
        setLocalQuizzes((prev) => [data.quiz, ...prev])
        setTab('quizzes')
        setSharedQuiz(data.quiz)
        setIsShareModalOpen(true)
      }
    } catch (e) {
      setGenError(String(e))
    } finally {
      setGenerating(false)
    }
  }

  const handleUpload = async () => {
    if (!uploadText.trim()) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('programCode', program.code)
      fd.append('text', uploadText)
      fd.append('title', 'Pasted Notes')
      fd.append('uploadedBy', selectedCandidate || 'Coordinator')
      const res = await fetch('/api/materials/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.material) {
        setLocalMaterials((prev) => [data.material, ...prev])
        setUploadText('')
      }
    } finally {
      setUploading(false)
    }
  }

  // Current active candidate profile
  const currentCandidate =
    localCandidates.find((c) => c.name.toLowerCase() === selectedCandidate.toLowerCase()) ||
    localCandidates[0] || {
      name: selectedCandidate,
      regNo: `${program.code}-001`,
      overallAccuracy: 0,
      streakDays: 0,
      strengths: [],
      weaknesses: [],
    }

  // Candidate attempts
  const candidateAttempts = localAttempts.filter(
    (a) => a.candidateName?.toLowerCase() === selectedCandidate.toLowerCase()
  )

  const candidateAccuracy = currentCandidate.overallAccuracy || 0

  const getStatusBadge = (acc: number) => {
    if (acc >= 90) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-[#5F4BB6]/15 text-[#5F4BB6] border border-[#5F4BB6]/30">
          <Award className="w-3.5 h-3.5" />
          EXCELLENT
        </span>
      )
    }
    if (acc >= 75) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-[#00A896]/15 text-[#00A896] border border-[#00A896]/30">
          <TrendingUp className="w-3.5 h-3.5" />
          GOOD
        </span>
      )
    }
    if (acc >= 50) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-amber-500/15 text-amber-700 border border-amber-500/30">
          <AlertTriangle className="w-3.5 h-3.5" />
          WARNING
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-rose-500/15 text-rose-600 border border-rose-500/30">
        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
        DANGER
      </span>
    )
  }

  const workspaceTabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'performance', label: 'Performance', icon: <BarChart2 className="w-4 h-4" /> },
    { id: 'quizzes', label: 'Quizzes', icon: <Award className="w-4 h-4" /> },
    { id: 'study', label: 'Study Hub', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'coach', label: 'AI Coach', icon: <Bot className="w-4 h-4 text-[#5F4BB6]" /> },
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ========================================================= */}
      {/* 1. TOP ROSTER & ACTIONS BAR                               */}
      {/* ========================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Candidate Pills Switcher (Individual-First) */}
        <div className="flex flex-wrap items-center gap-2">
          {localCandidates.map((c) => (
            <CandidatePill
              key={c.id || c.name}
              candidate={c}
              selected={selectedCandidate.toLowerCase() === c.name.toLowerCase()}
              onClick={() => setSelectedCandidate(c.name)}
            />
          ))}

          {/* + Add Candidate */}
          <button
            onClick={() => setIsAddCandidateOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 hover:bg-slate-50 active:translate-y-[1px] transition-all"
            title="Enroll another candidate to this program"
          >
            <UserPlus className="w-3.5 h-3.5 text-[#FF6B4A]" />
            <span>+ Add Candidate</span>
          </button>
        </div>

        {/* Right utility actions: Syllabus & Concept Note + Admin + Refresh */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Syllabus & Concept Note Modal Trigger */}
          <button
            onClick={() => setIsSyllabusOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 hover:bg-slate-50 active:translate-y-[1px] transition-all shadow-xs"
            title="View Official SIBAQ '26 Syllabus & Concept Note"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#5F4BB6]" />
            <span>Syllabus &amp; Concept Note</span>
          </button>

          {/* Admin Control */}
          <button
            onClick={() => setIsAdminOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 hover:bg-slate-200 active:translate-y-[1px] transition-all"
            title="Admin Control Center (adminshia / 1234)"
          >
            <Shield className="w-3.5 h-3.5 text-[#5F4BB6]" />
            <span className="hidden sm:inline">Admin</span>
          </button>

          {/* Live Sync */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 hover:bg-slate-50 active:translate-y-[1px] transition-all disabled:opacity-50"
            title="Sync latest submissions"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#00A896] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isRefreshing ? 'Syncing...' : 'Sync'}</span>
          </button>
        </div>
      </div>

      {/* Inline Candidate Enrollment Form */}
      {isAddCandidateOpen && (
        <div className="p-4 bg-white rounded-3xl border-2 border-[#FF6B4A]/40 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-black text-[#1E2538] flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-[#FF6B4A]" /> Enroll Student to {program.code}
            </h4>
            <button
              onClick={() => setIsAddCandidateOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {addCandidateError && (
            <p className="text-xs text-rose-600 mb-2 font-bold">{addCandidateError}</p>
          )}

          <form onSubmit={handleAddCandidate} className="flex flex-wrap sm:flex-nowrap gap-2">
            <input
              type="text"
              value={newCandidateName}
              onChange={(e) => setNewCandidateName(e.target.value)}
              placeholder="Candidate full name (e.g., Ashif KC)"
              className="flex-1 px-3.5 py-2 text-xs bg-[#FAF9F6] border border-slate-200 rounded-xl focus:outline-none focus:border-[#FF6B4A]"
            />
            <input
              type="text"
              value={newCandidateRegNo}
              onChange={(e) => setNewCandidateRegNo(e.target.value)}
              placeholder="Reg No (optional)"
              className="w-full sm:w-36 px-3.5 py-2 text-xs bg-[#FAF9F6] border border-slate-200 rounded-xl focus:outline-none focus:border-[#FF6B4A]"
            />
            <button
              type="submit"
              disabled={addingCandidate || !newCandidateName.trim()}
              className="px-4 py-2 bg-[#FF6B4A] text-white rounded-xl text-xs font-black hover:bg-[#E85635] active:translate-y-[1px] disabled:opacity-50"
            >
              {addingCandidate ? 'Adding...' : 'Save Student'}
            </button>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. 4 CLEAN WORKSPACE TABS                                  */}
      {/* ========================================================= */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3">
        {workspaceTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black transition-all ${
              tab === t.id
                ? 'bg-[#1E2538] text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ========================================================= */}
      {/* TAB 1: PERFORMANCE (Individual Candidate Focus)           */}
      {/* ========================================================= */}
      {tab === 'performance' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Candidate Status & 4-Tier Banner */}
          <div className="bg-white rounded-3xl border-2 border-slate-200/90 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-md"
                style={{ backgroundColor: currentCandidate.avatarColor || '#1E2538' }}
              >
                {currentCandidate.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-black text-[#1E2538]">{currentCandidate.name}</h2>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    {currentCandidate.regNo}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {getStatusBadge(candidateAccuracy)}
                  <span className="inline-flex items-center gap-1 font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full text-[11px]">
                    <Flame className="w-3 h-3 text-[#FF6B4A]" />
                    {currentCandidate.streakDays || 0} Day Streak
                  </span>
                  <span className="text-slate-400 font-medium text-[11px]">
                    {candidateAttempts.length} Completed Drill{candidateAttempts.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-2xl font-black text-[#1E2538]">{candidateAccuracy}%</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Readiness Accuracy
                </div>
              </div>
            </div>
          </div>

          {/* 1-TAP REVENGE QUIZ (MISTAKE CRUSHER) CARD */}
          <div className="bg-gradient-to-br from-[#FF6B4A] to-[#E85635] text-white rounded-3xl p-6 sm:p-7 shadow-lg border-2 border-[#C94224] relative overflow-hidden">
            <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/20 text-white font-black text-[10px] uppercase tracking-widest mb-2.5">
                  <Flame className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  MISTAKE CRUSHER
                </div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight mb-1">
                  1-Tap Revenge Quiz
                </h3>
                <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-medium">
                  Generates a rapid 10-question remedial drill targeting only the exact questions and weak topics{' '}
                  <span className="font-bold underline decoration-amber-300">{currentCandidate.name}</span>{' '}
                  missed in recent assessments.
                </p>
              </div>

              <button
                onClick={handleLaunchRevengeQuiz}
                disabled={generating}
                className="shrink-0 flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#1E2538] text-white font-black text-xs sm:text-sm hover:bg-[#161B29] active:translate-y-[2px] transition-all shadow-md disabled:opacity-50"
              >
                {generating && isRevengeGen ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#FF6B4A]" />
                    <span>Synthesizing Revenge Drill...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span>Launch 10-Q Revenge Drill</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Charts & Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WeeklyLineChart attempts={candidateAttempts} />
            <TopicProgressBars attempts={candidateAttempts} programSkill={program.skill} />
          </div>

          {/* Missed Questions Grid */}
          <MissedQuestionsGrid
            attempts={candidateAttempts}
            candidateName={currentCandidate.name}
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: QUIZZES (Difficulty System & Active Quizzes)        */}
      {/* ========================================================= */}
      {tab === 'quizzes' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Generation Control Panel */}
          <div className="bg-white rounded-3xl border-2 border-slate-200/90 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-black text-base text-[#1E2538]">
                  AI Assessment Generator
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Synthesize Olympiad-grade questions for {program.code} candidates.
                </p>
              </div>
              <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-bold">
                {genEngine === 'nvidia' ? 'NVIDIA Nemotron' : 'DeepSeek V3'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
              {/* Difficulty */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Difficulty Tier
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['easy', 'medium', 'hard', 'extreme'] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setGenDifficulty(d)}
                      className={`py-2 px-2.5 rounded-xl text-xs font-black capitalize transition-all ${
                        genDifficulty === d
                          ? d === 'extreme'
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'bg-[#1E2538] text-white shadow-sm'
                          : 'bg-[#FAF9F6] border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Count */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Question Count
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[10, 25, 50].map((count) => (
                    <button
                      key={count}
                      onClick={() => setGenQuestionCount(count)}
                      className={`py-2 px-2 rounded-xl text-xs font-black transition-all ${
                        genQuestionCount === count
                          ? 'bg-[#1E2538] text-white shadow-sm'
                          : 'bg-[#FAF9F6] border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {count}Q
                    </button>
                  ))}
                </div>
              </div>

              {/* Session Window */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Session
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['Morning', 'Evening'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setGenSessionWindow(s)}
                      className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-black transition-all ${
                        genSessionWindow === s
                          ? 'bg-[#1E2538] text-white shadow-sm'
                          : 'bg-[#FAF9F6] border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {s === 'Morning' ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-indigo-400" />}
                      <span>{s}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Engine */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Engine &amp; Web Grounding
                </label>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setGenEngine(genEngine === 'nvidia' ? 'orca' : 'nvidia')}
                    className="flex-1 py-2 px-2.5 rounded-xl text-xs font-black bg-[#FAF9F6] border border-slate-200 text-slate-700 hover:bg-slate-100 transition-all flex items-center justify-center gap-1"
                  >
                    <Cpu className="w-3.5 h-3.5 text-[#5F4BB6]" />
                    <span>{genEngine === 'nvidia' ? 'NVIDIA' : 'Orca'}</span>
                  </button>
                  <button
                    onClick={() => setGenLiveSearch(!genLiveSearch)}
                    className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 ${
                      genLiveSearch
                        ? 'bg-[#00A896] text-white shadow-sm'
                        : 'bg-[#FAF9F6] border border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                    title="Toggle Live Web Grounding via Firecrawl"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Search</span>
                  </button>
                </div>
              </div>
            </div>

            {genError && (
              <p className="text-xs text-rose-600 mb-3 font-bold">{genError}</p>
            )}

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full py-3 rounded-2xl bg-[#FF6B4A] hover:bg-[#E85635] text-white font-black text-xs sm:text-sm active:translate-y-[2px] transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
            >
              {generating && !isRevengeGen ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing {genQuestionCount} Questions...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Generate {genQuestionCount}Q {genDifficulty.toUpperCase()} Quiz</span>
                </>
              )}
            </button>
          </div>

          {/* Active Quizzes List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm text-[#1E2538]">
                Active Quizzes &amp; Drills ({localQuizzes.length})
              </h3>
              <span className="text-xs text-slate-400 font-medium">
                Tap to launch or copy sharable student link
              </span>
            </div>

            {localQuizzes.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400 text-xs">
                No quizzes generated yet. Click &ldquo;Generate Quiz&rdquo; above.
              </div>
            ) : (
              localQuizzes.map((quiz) => {
                const quizId = quiz._id?.toString() || ''
                const isCopied = copiedQuizId === quizId
                const quizAttempts = localAttempts.filter((a) => a.quizId?.toString() === quizId)

                return (
                  <div
                    key={quizId}
                    className="p-5 bg-white rounded-3xl border-2 border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="font-mono text-xs font-black text-[#1E2538]">
                          {quiz.programCode}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600">
                          {quiz.difficulty || 'medium'}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          {quiz.questions?.length || quiz.questionCount || 10} Questions · {quiz.sessionWindow || 'Morning'}
                        </span>
                      </div>
                      <h4 className="font-black text-base text-[#1E2538]">{quiz.title}</h4>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 font-medium">
                        <span>Created {format(new Date(quiz.createdAt || Date.now()), 'dd MMM, hh:mm a')}</span>
                        {quizAttempts.length > 0 && (
                          <span className="text-[#00A896] font-bold">
                            · {quizAttempts.length} attempt{quizAttempts.length !== 1 ? 's' : ''} logged
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyQuizLink(quizId)}
                        className="px-3.5 py-2.5 rounded-2xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 active:translate-y-[1px] transition-all flex items-center gap-1.5"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-[#00A896]" /> : <Share2 className="w-3.5 h-3.5" />}
                        <span>{isCopied ? 'Link Copied!' : 'Share Link'}</span>
                      </button>

                      <Link
                        href={`/programs/${program.code}/quiz/${quizId}?candidate=${encodeURIComponent(selectedCandidate)}`}
                      >
                        <button className="px-4 py-2.5 rounded-2xl bg-[#FF6B4A] hover:bg-[#E85635] text-white font-black text-xs active:translate-y-[1px] transition-all flex items-center gap-1.5 shadow-sm">
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Start Quiz</span>
                        </button>
                      </Link>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: STUDY HUB (Flashcards, Notes, Cues)                */}
      {/* ========================================================= */}
      {tab === 'study' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Flashcards Deck */}
          {flashcardDeck.length > 0 ? (
            <div className="bg-white rounded-3xl border-2 border-slate-200/90 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-base text-[#1E2538]">
                  Revision Flashcards ({flashcardIdx + 1} / {flashcardDeck.length})
                </h3>
              </div>
              <div className="max-w-md mx-auto my-4">
                <FlipFlashcard card={flashcardDeck[flashcardIdx]} />
              </div>
              <div className="flex justify-center gap-3">
                <button
                  disabled={flashcardIdx === 0}
                  onClick={() => setFlashcardIdx((i) => i - 1)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={flashcardIdx >= flashcardDeck.length - 1}
                  onClick={() => setFlashcardIdx((i) => i + 1)}
                  className="px-4 py-2 rounded-xl bg-[#1E2538] text-white text-xs font-bold disabled:opacity-40"
                >
                  Next Card
                </button>
              </div>
            </div>
          ) : null}

          {/* Upload Notes */}
          <div className="bg-white rounded-3xl border-2 border-slate-200/90 p-6 shadow-sm">
            <h3 className="font-black text-base text-[#1E2538] mb-1">Upload Study Material</h3>
            <p className="text-xs text-slate-500 mb-4">
              Paste reference text or syllabus extracts. The AI will extract flashcards and high-yield cues.
            </p>
            <textarea
              rows={4}
              value={uploadText}
              onChange={(e) => setUploadText(e.target.value)}
              placeholder="Paste notes, rulings, articles, or case laws..."
              className="w-full p-4 rounded-2xl bg-[#FAF9F6] border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#00A896] mb-3"
            />
            <div className="flex items-center gap-3">
              <button
                onClick={handleUpload}
                disabled={uploading || !uploadText.trim()}
                className="px-5 py-2.5 rounded-2xl bg-[#00A896] text-white font-black text-xs hover:bg-[#008E7E] disabled:opacity-50"
              >
                {uploading ? 'Processing Notes...' : 'Upload Notes'}
              </button>
              {localMaterials.length > 0 && (
                <span className="text-xs text-slate-400 font-medium">
                  {localMaterials.length} materials in library
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: EMBEDDED AI COACH (ZERO FLOATING OVERLAPS)          */}
      {/* ========================================================= */}
      {tab === 'coach' && (
        <AICoachTab
          programCode={program.code}
          programTitle={program.title}
          candidateName={selectedCandidate}
        />
      )}

      {/* ========================================================= */}
      {/* MODALS                                                    */}
      {/* ========================================================= */}

      {/* 1. Official Syllabus & Concept Note Modal */}
      {isSyllabusOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-md animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-2xl bg-white rounded-3xl border-2 border-slate-300 border-b-8 border-b-slate-400 p-6 sm:p-8 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#1E2538] text-white flex items-center justify-center shadow-md">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-[#1E2538] leading-none">
                    {program.title} ({program.code})
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Official SIBAQ &apos;26 Syllabus &amp; Concept Note
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSyllabusOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-5 space-y-4 text-xs leading-relaxed text-slate-700">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-3 rounded-2xl bg-[#FAF9F6] border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Division</span>
                  <div className="font-black text-slate-800 text-sm mt-0.5">{program.division || 'Aliyah'}</div>
                </div>
                <div className="p-3 rounded-2xl bg-[#FAF9F6] border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Category</span>
                  <div className="font-black text-slate-800 text-sm mt-0.5">{program.category}</div>
                </div>
                <div className="p-3 rounded-2xl bg-[#FAF9F6] border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Duration</span>
                  <div className="font-black text-slate-800 text-sm mt-0.5">{program.durationMinutes} min</div>
                </div>
                <div className="p-3 rounded-2xl bg-[#FAF9F6] border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Core Skill</span>
                  <div className="font-black text-slate-800 text-sm mt-0.5">{program.skill}</div>
                </div>
              </div>

              <div>
                <h4 className="font-black text-sm text-[#1E2538] mb-2 uppercase tracking-wider text-[11px]">
                  Concept Note &amp; Guidelines
                </h4>
                <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-slate-200 text-slate-800 font-medium whitespace-pre-wrap">
                  {program.conceptNote}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 text-right">
              <button
                onClick={() => setIsSyllabusOpen(false)}
                className="px-5 py-2.5 rounded-2xl bg-[#1E2538] text-white font-black text-xs hover:bg-[#2A334C]"
              >
                Close Syllabus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Coach Generation Overlay */}
      <CoachGenerationOverlay
        isOpen={generating}
        programCode={program.code}
        difficulty={isRevengeGen ? 'hard' : genDifficulty}
        questionCount={isRevengeGen ? 10 : genQuestionCount}
        engine={genEngine}
      />

      {/* 3. Share Quiz Modal */}
      <ShareQuizModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        quiz={sharedQuiz}
      />

      {/* 4. Admin Management Modal */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        onDataChanged={handleRefresh}
      />
    </div>
  )
}
