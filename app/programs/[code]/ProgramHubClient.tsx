'use client'

import { useState, useEffect } from 'react'
import {
  BarChart2,
  BookOpen,
  Award,
  Zap,
  Play,
  Share2,
  Check,
  RefreshCw,
  Sun,
  Moon,
  Cpu,
  Globe,
  UserPlus,
  Flame,
  X,
  Shield,
  TrendingUp,
  AlertTriangle,
  AlertOctagon,
  Bot,
  FileText,
  UploadCloud,
  Languages,
  CheckCircle2,
} from 'lucide-react'
import { IProgram, IQuiz, IStudyMaterial, IAttempt, ICandidate, IFlashcard } from '@/models'
import CandidatePill from '@/components/CandidatePill'
import WeeklyLineChart from '@/components/WeeklyLineChart'
import TopicProgressBars from '@/components/TopicProgressBars'
import MissedQuestionsGrid from '@/components/MissedQuestionsGrid'
import FlipFlashcard from '@/components/FlipFlashcard'
import ShareQuizModal from '@/components/ShareQuizModal'
import AdminModal from '@/components/AdminModal'
import AICoachTab from '@/components/AICoachTab'
import QuizGenerationModal from '@/components/QuizGenerationModal'
import { format } from 'date-fns'
import Link from 'next/link'
import { playClickPop } from '@/lib/sounds'

interface ProgramHubClientProps {
  program: IProgram
  quizzes: IQuiz[]
  materials: IStudyMaterial[]
  attempts: IAttempt[]
  initialCandidate?: string
}

type Tab = 'performance' | 'quizzes' | 'study' | 'coach'

function getAutoLanguage(code: string): 'english' | 'arabic' | 'urdu' | 'malayalam' {
  const c = (code || '').toUpperCase().trim()
  const arabicCodes = ['AX37', 'AN22', 'AN23', 'AS4', 'AS6', 'AS5', 'AS7', 'AX36']
  const urduCodes = ['AX38', 'AS9', 'AN25', 'AN26']
  const malayalamCodes = ['AS8', 'AN24', 'AN29', 'AN34', 'AX35']
  if (arabicCodes.some((x) => c.includes(x))) return 'arabic'
  if (urduCodes.some((x) => c.includes(x))) return 'urdu'
  if (malayalamCodes.some((x) => c.includes(x))) return 'malayalam'
  return 'english'
}

export default function ProgramHubClient({
  program,
  quizzes,
  materials,
  attempts,
  initialCandidate,
}: ProgramHubClientProps) {
  // Navigation
  const [tab, setTab] = useState<Tab>('performance')

  // Roster
  const [localCandidates, setLocalCandidates] = useState<ICandidate[]>(
    program.candidates || []
  )
  const [selectedCandidate, setSelectedCandidate] = useState<string>(
    initialCandidate || (program.candidates && program.candidates[0]?.name) || 'Candidate'
  )

  // Generator Options
  const [genDifficulty, setGenDifficulty] = useState<'easy' | 'medium' | 'hard' | 'extreme'>('medium')
  const [genQuestionCount, setGenQuestionCount] = useState<number>(20)
  const [genSessionWindow, setGenSessionWindow] = useState<'Morning' | 'Evening'>('Morning')
  const [genEngine, setGenEngine] = useState<'nemotron' | 'deepseek'>('nemotron')
  const [genLiveSearch, setGenLiveSearch] = useState<boolean>(false)

  // Multi-Language, Multi-Format & Strict Custom Source States
  const [genLanguage, setGenLanguage] = useState<'english' | 'arabic' | 'urdu' | 'malayalam'>(() =>
    getAutoLanguage(program.code)
  )
  const [genFormats, setGenFormats] = useState<
    ('mcq' | 'fill_blank' | 'statement_verify' | 'assertion_reason')[]
  >(['mcq'])
  const [genSourceMode, setGenSourceMode] = useState<
    'syllabus_and_benchmarks' | 'strict_custom_source'
  >('syllabus_and_benchmarks')
  const [customSourceText, setCustomSourceText] = useState('')
  const [customFileName, setCustomFileName] = useState('')
  const [customWordCount, setCustomWordCount] = useState(0)
  const [saveToMaterials, setSaveToMaterials] = useState(true)
  const [customMaterialTitle, setCustomMaterialTitle] = useState('')
  const [isUploadingPdf, setIsUploadingPdf] = useState(false)
  const [pdfUploadError, setPdfUploadError] = useState('')

  // Quiz Generation Modal Pipeline
  const [isGenModalOpen, setIsGenModalOpen] = useState(false)
  const [isRevengeLaunch, setIsRevengeLaunch] = useState(false)

  // Syllabus Modal
  const [isSyllabusOpen, setIsSyllabusOpen] = useState(false)

  // Modals & Enrollment
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
    playClickPop()
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
    playClickPop()
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

  // Format toggles
  const toggleFormat = (fmt: 'mcq' | 'fill_blank' | 'statement_verify' | 'assertion_reason') => {
    playClickPop()
    setGenFormats((prev) => {
      if (prev.includes(fmt)) {
        if (prev.length === 1) return prev
        return prev.filter((f) => f !== fmt)
      }
      return [...prev, fmt]
    })
  }

  const selectAllFormats = () => {
    playClickPop()
    setGenFormats(['mcq', 'fill_blank', 'statement_verify', 'assertion_reason'])
  }

  // Upload custom document directly in generator
  const handleSourceFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    playClickPop()
    setIsUploadingPdf(true)
    setPdfUploadError('')
    try {
      const fd = new FormData()
      fd.append('programCode', program.code)
      fd.append('file', file)
      fd.append('title', file.name.replace(/\.[^/.]+$/, ''))
      fd.append('uploadedBy', selectedCandidate || 'Coordinator')

      const res = await fetch('/api/materials/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to parse file')

      const extracted = data.extractedText || ''
      setCustomSourceText(extracted)
      setCustomFileName(file.name)
      setCustomWordCount(data.wordCount || extracted.split(/\s+/).filter(Boolean).length)
      setCustomMaterialTitle(file.name.replace(/\.[^/.]+$/, ''))
      if (data.material) {
        setLocalMaterials((prev) => [data.material, ...prev])
      }
    } catch (err) {
      setPdfUploadError((err as Error).message || 'Failed to upload document')
    } finally {
      setIsUploadingPdf(false)
      e.target.value = ''
    }
  }

  // Launch Live Generation Modal
  const handleOpenStandardGenerator = () => {
    playClickPop()
    setIsRevengeLaunch(false)
    setIsGenModalOpen(true)
  }

  const handleOpenRevengeGenerator = () => {
    playClickPop()
    setIsRevengeLaunch(true)
    setIsGenModalOpen(true)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleQuizGenerated = (newQuiz: any) => {
    if (newQuiz) {
      setLocalQuizzes((prev) => [newQuiz, ...prev])
      setTab('quizzes')
      setSharedQuiz(newQuiz)
      setIsShareModalOpen(true)
    }
  }

  const handleUpload = async () => {
    if (!uploadText.trim()) return
    playClickPop()
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

  const candidateAttempts = localAttempts.filter(
    (a) => a.candidateName?.toLowerCase() === selectedCandidate.toLowerCase()
  )

  const candidateAccuracy = currentCandidate.overallAccuracy || 0

  const getStatusBadge = (acc: number) => {
    if (acc >= 90) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-black bg-[#CE82FF] border-b-2 border-[#A568CC] text-white">
          <Award className="w-3.5 h-3.5 stroke-[2.5]" />
          EXCELLENT
        </span>
      )
    }
    if (acc >= 75) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-black bg-[#58CC02] border-b-2 border-[#58A700] text-white">
          <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />
          GOOD
        </span>
      )
    }
    if (acc >= 50) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-black bg-[#FFC800] border-b-2 border-[#E5B400] text-[#4B4B4B]">
          <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5]" />
          WARNING
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-black bg-[#FF4B4B] border-b-2 border-[#EA2B2B] text-white animate-pulse">
        <AlertOctagon className="w-3.5 h-3.5 stroke-[2.5]" />
        DANGER
      </span>
    )
  }

  const workspaceTabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'performance', label: 'Performance', icon: <BarChart2 className="w-4 h-4 stroke-[2.5]" /> },
    { id: 'quizzes', label: 'Quizzes', icon: <Award className="w-4 h-4 stroke-[2.5]" /> },
    { id: 'study', label: 'Study Hub', icon: <BookOpen className="w-4 h-4 stroke-[2.5]" /> },
    { id: 'coach', label: 'AI Coach', icon: <Bot className="w-4 h-4 text-[#CE82FF] stroke-[2.5]" /> },
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-300 select-none">
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
            onClick={() => {
              playClickPop()
              setIsAddCandidateOpen(true)
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border-2 border-[#E5E5E5] border-b-4 rounded-2xl text-xs font-black uppercase text-[#4B4B4B] hover:bg-[#F7F7F7] active:border-b-0 active:translate-y-[4px] transition-all"
            title="Enroll another candidate to this program"
          >
            <UserPlus className="w-4 h-4 text-[#58CC02] stroke-[2.5]" />
            <span>+ Add Candidate</span>
          </button>
        </div>

        {/* Right utility actions: Syllabus & Concept Note + Admin + Refresh */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Syllabus & Concept Note Modal Trigger */}
          <button
            onClick={() => {
              playClickPop()
              setIsSyllabusOpen(true)
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border-2 border-[#E5E5E5] border-b-4 rounded-2xl text-xs font-black uppercase text-[#4B4B4B] hover:bg-[#F7F7F7] active:border-b-0 active:translate-y-[4px] transition-all shadow-xs"
            title="View Official SIBAQ '26 Syllabus & Concept Note"
          >
            <BookOpen className="w-4 h-4 text-[#1CB0F6] stroke-[2.5]" />
            <span>Syllabus &amp; Concept Note</span>
          </button>

          {/* Admin Control */}
          <button
            onClick={() => {
              playClickPop()
              setIsAdminOpen(true)
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border-2 border-[#E5E5E5] border-b-4 rounded-2xl text-xs font-black uppercase text-[#4B4B4B] hover:bg-[#F7F7F7] active:border-b-0 active:translate-y-[4px] transition-all"
            title="Admin Control Center (adminshia / 1234)"
          >
            <Shield className="w-4 h-4 text-[#CE82FF] stroke-[2.5]" />
            <span className="hidden sm:inline">Admin</span>
          </button>

          {/* Live Sync */}
          <button
            onClick={() => {
              playClickPop()
              handleRefresh()
            }}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border-2 border-[#E5E5E5] border-b-4 rounded-2xl text-xs font-black uppercase text-[#4B4B4B] hover:bg-[#F7F7F7] active:border-b-0 active:translate-y-[4px] transition-all disabled:opacity-50"
            title="Sync latest submissions"
          >
            <RefreshCw className={`w-4 h-4 text-[#58CC02] stroke-[2.5] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isRefreshing ? 'Syncing...' : 'Sync'}</span>
          </button>
        </div>
      </div>

      {/* Inline Candidate Enrollment Form */}
      {isAddCandidateOpen && (
        <div className="p-5 bg-white rounded-3xl border-2 border-[#58CC02] border-b-[6px] shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-black text-[#4B4B4B] uppercase tracking-wider flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-[#58CC02] stroke-[2.5]" /> Enroll Student to {program.code}
            </h4>
            <button
              onClick={() => {
                playClickPop()
                setIsAddCandidateOpen(false)
              }}
              className="text-[#777777] hover:text-[#4B4B4B] p-1"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          {addCandidateError && (
            <p className="text-xs text-[#FF4B4B] mb-2 font-black uppercase">{addCandidateError}</p>
          )}

          <form onSubmit={handleAddCandidate} className="flex flex-wrap sm:flex-nowrap gap-2">
            <input
              type="text"
              value={newCandidateName}
              onChange={(e) => setNewCandidateName(e.target.value)}
              placeholder="Candidate full name (e.g., Ashif KC)"
              className="flex-1 px-4 py-2.5 text-xs bg-[#F7F7F7] border-2 border-[#E5E5E5] rounded-xl font-bold text-[#4B4B4B] focus:outline-none focus:border-[#58CC02]"
            />
            <input
              type="text"
              value={newCandidateRegNo}
              onChange={(e) => setNewCandidateRegNo(e.target.value)}
              placeholder="Reg No (optional)"
              className="w-full sm:w-36 px-4 py-2.5 text-xs bg-[#F7F7F7] border-2 border-[#E5E5E5] rounded-xl font-bold text-[#4B4B4B] focus:outline-none focus:border-[#58CC02]"
            />
            <button
              type="submit"
              disabled={addingCandidate || !newCandidateName.trim()}
              className="px-5 py-2.5 bg-[#58CC02] border-b-4 border-[#58A700] text-white rounded-xl text-xs font-black uppercase active:border-b-0 active:translate-y-[4px] disabled:opacity-50 transition-all"
            >
              {addingCandidate ? 'Adding...' : 'Save Student'}
            </button>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. 4 CLEAN WORKSPACE TABS                                  */}
      {/* ========================================================= */}
      <div className="flex items-center gap-2 border-b-2 border-[#E5E5E5] pb-3">
        {workspaceTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              playClickPop()
              setTab(t.id)
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all select-none border-b-4 active:border-b-0 active:translate-y-[4px] ${
              tab === t.id
                ? 'bg-[#DDF4FF] text-[#1899D6] border-2 border-[#1CB0F6] border-b-[#1899D6]'
                : 'bg-white text-[#777777] border-2 border-[#E5E5E5] border-b-[#DCDCDC] hover:bg-[#F7F7F7]'
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
          <div className="bg-white rounded-2xl border-2 border-[#E5E5E5] border-b-4 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-xs border border-black/10"
                style={{ backgroundColor: currentCandidate.avatarColor || '#1CB0F6' }}
              >
                {currentCandidate.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-black text-[#4B4B4B] uppercase tracking-tight">{currentCandidate.name}</h2>
                  <span className="text-xs font-mono font-bold text-[#777777]">
                    {currentCandidate.regNo}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {getStatusBadge(candidateAccuracy)}
                  <span className="inline-flex items-center gap-1 font-black text-[#FF9600] bg-[#FFF0D6] border border-[#FF9600] px-3 py-1 rounded-xl text-[11px] uppercase">
                    <Flame className="w-3.5 h-3.5 text-[#FF9600] fill-[#FF9600] stroke-[2]" />
                    {currentCandidate.streakDays || 0} Day Streak
                  </span>
                  <span className="text-[#777777] font-bold text-[11px] uppercase">
                    {candidateAttempts.length} Completed Drill{candidateAttempts.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-3xl font-black text-[#4B4B4B]">{candidateAccuracy}%</div>
                <div className="text-[10px] font-black text-[#777777] uppercase tracking-wider">
                  Readiness Score
                </div>
              </div>
            </div>
          </div>

          {/* 1-TAP REVENGE QUIZ (MISTAKE CRUSHER) CARD — DUOLINGO FOX ORANGE */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 border-2 border-[#FF9600] border-b-[6px] shadow-xs relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#FFF0D6] border border-[#FF9600] text-[#E58700] font-black text-[10px] uppercase tracking-widest mb-2.5">
                  <Flame className="w-3.5 h-3.5 text-[#FF9600] fill-[#FF9600] stroke-[2]" />
                  MISTAKE CRUSHER
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-[#4B4B4B] uppercase tracking-tight mb-1">
                  1-Tap Revenge Drill
                </h3>
                <p className="text-xs sm:text-sm text-[#777777] leading-relaxed font-bold">
                  Synthesizes a 10-question remedial drill targeting only the exact questions and weak topics{' '}
                  <span className="font-black text-[#FF9600] underline decoration-[#FF9600]">{currentCandidate.name}</span>{' '}
                  missed in recent assessments.
                </p>
              </div>

              <button
                onClick={handleOpenRevengeGenerator}
                className="shrink-0 flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#FF9600] border-b-4 border-[#E58700] active:border-b-0 active:translate-y-[4px] text-white font-black text-xs sm:text-sm uppercase tracking-wider transition-all duration-75 shadow-xs select-none"
              >
                <Zap className="w-4 h-4 text-white stroke-[2.5]" />
                <span>Launch 10-Q Revenge Drill</span>
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
          <div className="bg-white rounded-2xl border-2 border-[#E5E5E5] border-b-4 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-black text-base text-[#4B4B4B] uppercase tracking-wide">
                  AI Assessment Generator
                </h3>
                <p className="text-xs font-bold text-[#777777] mt-0.5">
                  Synthesize Olympiad-grade questions for {program.code} candidates.
                </p>
              </div>
              <span className="text-[10px] font-mono uppercase px-3 py-1 rounded-xl bg-[#F7F7F7] border border-[#E5E5E5] text-[#4B4B4B] font-black">
                {genEngine === 'nemotron' ? 'NVIDIA Nemotron 70B' : 'DeepSeek V4 Flash'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
              {/* Difficulty */}
              <div>
                <label className="block text-[11px] font-black text-[#777777] uppercase tracking-wider mb-1.5">
                  Difficulty Tier
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['easy', 'medium', 'hard', 'extreme'] as const).map((d) => {
                    const isSel = genDifficulty === d
                    let activeClass = 'bg-[#1CB0F6] border-[#1899D6] text-white'
                    if (d === 'easy') activeClass = 'bg-[#58CC02] border-[#58A700] text-white'
                    if (d === 'hard') activeClass = 'bg-[#FF9600] border-[#E58700] text-white'
                    if (d === 'extreme') activeClass = 'bg-[#FF4B4B] border-[#EA2B2B] text-white'

                    return (
                      <button
                        key={d}
                        onClick={() => {
                          playClickPop()
                          setGenDifficulty(d)
                        }}
                        className={`py-2 px-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-75 border-b-4 active:border-b-0 active:translate-y-[4px] ${
                          isSel
                            ? activeClass
                            : 'bg-white border-2 border-[#E5E5E5] border-b-[#DCDCDC] text-[#777777] hover:bg-[#F7F7F7]'
                        }`}
                      >
                        {d}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Question Count */}
              <div>
                <label className="block text-[11px] font-black text-[#777777] uppercase tracking-wider mb-1.5">
                  Question Count
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[10, 25, 50].map((count) => {
                    const isSel = genQuestionCount === count
                    return (
                      <button
                        key={count}
                        onClick={() => {
                          playClickPop()
                          setGenQuestionCount(count)
                        }}
                        className={`py-2 px-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-75 border-b-4 active:border-b-0 active:translate-y-[4px] ${
                          isSel
                            ? 'bg-[#1CB0F6] border-[#1899D6] text-white'
                            : 'bg-white border-2 border-[#E5E5E5] border-b-[#DCDCDC] text-[#777777] hover:bg-[#F7F7F7]'
                        }`}
                      >
                        {count}Q
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Session Window */}
              <div>
                <label className="block text-[11px] font-black text-[#777777] uppercase tracking-wider mb-1.5">
                  Session
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['Morning', 'Evening'] as const).map((s) => {
                    const isSel = genSessionWindow === s
                    return (
                      <button
                        key={s}
                        onClick={() => {
                          playClickPop()
                          setGenSessionWindow(s)
                        }}
                        className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-75 border-b-4 active:border-b-0 active:translate-y-[4px] ${
                          isSel
                            ? 'bg-[#1CB0F6] border-[#1899D6] text-white'
                            : 'bg-white border-2 border-[#E5E5E5] border-b-[#DCDCDC] text-[#777777] hover:bg-[#F7F7F7]'
                        }`}
                      >
                        {s === 'Morning' ? (
                          <Sun className="w-3.5 h-3.5 text-[#FFC800] stroke-[2.5]" />
                        ) : (
                          <Moon className="w-3.5 h-3.5 text-[#CE82FF] stroke-[2.5]" />
                        )}
                        <span>{s}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* AI Engine & Grounding */}
              <div>
                <label className="block text-[11px] font-black text-[#777777] uppercase tracking-wider mb-1.5">
                  Engine &amp; Web Grounding
                </label>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => {
                      playClickPop()
                      setGenEngine(genEngine === 'nemotron' ? 'deepseek' : 'nemotron')
                    }}
                    className="flex-1 py-2 px-2.5 rounded-xl text-xs font-black uppercase bg-white border-2 border-[#E5E5E5] border-b-4 border-b-[#DCDCDC] text-[#4B4B4B] hover:bg-[#F7F7F7] active:border-b-0 active:translate-y-[4px] transition-all flex items-center justify-center gap-1"
                  >
                    <Cpu className="w-3.5 h-3.5 text-[#CE82FF] stroke-[2.5]" />
                    <span>{genEngine === 'nemotron' ? 'Nemotron' : 'DeepSeek'}</span>
                  </button>
                  <button
                    onClick={() => {
                      playClickPop()
                      setGenLiveSearch(!genLiveSearch)
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-black uppercase transition-all duration-75 border-b-4 active:border-b-0 active:translate-y-[4px] flex items-center justify-center gap-1 ${
                      genLiveSearch
                        ? 'bg-[#58CC02] border-[#58A700] text-white'
                        : 'bg-white border-2 border-[#E5E5E5] border-b-[#DCDCDC] text-[#777777] hover:bg-[#F7F7F7]'
                    }`}
                    title="Toggle Live Web Grounding via Firecrawl"
                  >
                    <Globe className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Search</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Section A: Quiz Language & Native Script */}
            <div className="mb-5 pt-4 border-t-2 border-[#E5E5E5]">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-black text-[#777777] uppercase tracking-wider flex items-center gap-1.5">
                  <Languages className="w-3.5 h-3.5 text-[#1CB0F6] stroke-[2.5]" />
                  <span>Quiz Language &amp; Native Script</span>
                </label>
                <span className="text-[10px] font-bold text-[#777777] uppercase">
                  Auto-tailored for {program.code}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'english', label: 'English', sub: 'EN · Standard' },
                  { id: 'arabic', label: 'العربية', sub: 'AR · Classical' },
                  { id: 'urdu', label: 'اردو', sub: 'UR · Academic' },
                  { id: 'malayalam', label: 'മലയാളം', sub: 'ML · Standard' },
                ].map((l) => {
                  const isSel = genLanguage === l.id
                  const isAuto = getAutoLanguage(program.code) === l.id
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => {
                        playClickPop()
                        setGenLanguage(l.id as 'english' | 'arabic' | 'urdu' | 'malayalam')
                      }}
                      className={`py-2.5 px-3 rounded-2xl text-left transition-all duration-75 border-b-4 active:border-b-0 active:translate-y-[4px] relative select-none ${
                        isSel
                          ? 'bg-[#1CB0F6] border-2 border-[#1899D6] border-b-[#1479A7] text-white shadow-xs'
                          : 'bg-white border-2 border-[#E5E5E5] border-b-[#DCDCDC] text-[#4B4B4B] hover:bg-[#F7F7F7]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-tight">{l.label}</span>
                        {isAuto && (
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                              isSel ? 'bg-white/25 text-white' : 'bg-[#D7FFB8] text-[#58A700]'
                            }`}
                          >
                            Auto
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] font-bold block mt-0.5 ${isSel ? 'text-white/80' : 'text-[#777777]'}`}>
                        {l.sub}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Section B: Question Formats */}
            <div className="mb-5 pt-4 border-t-2 border-[#E5E5E5]">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-black text-[#777777] uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#CE82FF] stroke-[2.5]" />
                  <span>Question Formats &amp; Drill Styles</span>
                </label>
                <button
                  type="button"
                  onClick={selectAllFormats}
                  className="text-[10px] font-black text-[#1CB0F6] uppercase hover:underline"
                >
                  Select All (Mixed Mode)
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'mcq', label: 'Standard MCQ', desc: '4 Options, 1 Correct' },
                  { id: 'fill_blank', label: 'Fill in Blank', desc: 'Missing word in stem' },
                  { id: 'statement_verify', label: 'Statement Check', desc: 'Multi-statement logic' },
                  { id: 'assertion_reason', label: 'Assertion & Reason', desc: 'UPSC/Olympiad pairs' },
                ].map((f) => {
                  const isSel = genFormats.includes(f.id as 'mcq' | 'fill_blank' | 'statement_verify' | 'assertion_reason')
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => toggleFormat(f.id as 'mcq' | 'fill_blank' | 'statement_verify' | 'assertion_reason')}
                      className={`py-2.5 px-3 rounded-2xl text-left transition-all duration-75 border-b-4 active:border-b-0 active:translate-y-[4px] select-none ${
                        isSel
                          ? 'bg-[#58CC02] border-2 border-[#58A700] border-b-[#468500] text-white shadow-xs'
                          : 'bg-white border-2 border-[#E5E5E5] border-b-[#DCDCDC] text-[#777777] hover:bg-[#F7F7F7]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-tight">{f.label}</span>
                        {isSel && <Check className="w-3.5 h-3.5 stroke-[3] text-white shrink-0" />}
                      </div>
                      <span className={`text-[10px] font-bold block mt-0.5 truncate ${isSel ? 'text-white/85' : 'text-[#777777]'}`}>
                        {f.desc}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Section C: Knowledge Source Mode */}
            <div className="mb-5 pt-4 border-t-2 border-[#E5E5E5]">
              <label className="block text-[11px] font-black text-[#777777] uppercase tracking-wider mb-2">
                Knowledge Grounding Source
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => {
                    playClickPop()
                    setGenSourceMode('syllabus_and_benchmarks')
                  }}
                  className={`p-3 rounded-2xl text-left border-2 border-b-4 transition-all duration-75 active:border-b-0 active:translate-y-[4px] select-none ${
                    genSourceMode === 'syllabus_and_benchmarks'
                      ? 'bg-[#DDF4FF] border-[#1CB0F6] border-b-[#1899D6] text-[#1899D6]'
                      : 'bg-white border-[#E5E5E5] border-b-[#DCDCDC] text-[#777777] hover:bg-[#F7F7F7]'
                  }`}
                >
                  <div className="text-xs font-black uppercase">Official Syllabus + Global Benchmarks</div>
                  <p className="text-[11px] font-bold mt-0.5 opacity-80">
                    SIBAQ &apos;26 Concept Note, UPSC/IELTS benchmark drills, and real-time domain grounding.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playClickPop()
                    setGenSourceMode('strict_custom_source')
                  }}
                  className={`p-3 rounded-2xl text-left border-2 border-b-4 transition-all duration-75 active:border-b-0 active:translate-y-[4px] select-none ${
                    genSourceMode === 'strict_custom_source'
                      ? 'bg-[#FFF5D6] border-[#FFC800] border-b-[#E5B400] text-[#7A5B00]'
                      : 'bg-white border-[#E5E5E5] border-b-[#DCDCDC] text-[#777777] hover:bg-[#F7F7F7]'
                  }`}
                >
                  <div className="text-xs font-black uppercase flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#FF9600] stroke-[2.5]" />
                    <span>Strict Custom Material Only</span>
                  </div>
                  <p className="text-[11px] font-bold mt-0.5 opacity-80">
                    100% extracted solely from your uploaded PDF, text document, or pasted notes. Zero external hallucinations.
                  </p>
                </button>
              </div>

              {/* Strict Custom Source Input Panel */}
              {genSourceMode === 'strict_custom_source' && (
                <div className="p-4 bg-[#F7F7F7] border-2 border-[#E5E5E5] rounded-2xl space-y-3 animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="text-xs font-black text-[#4B4B4B] uppercase tracking-wide flex items-center gap-1.5">
                      <UploadCloud className="w-4 h-4 text-[#1CB0F6] stroke-[2.5]" />
                      <span>Upload PDF / Text Document</span>
                    </div>
                    <label className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white border-2 border-[#E5E5E5] border-b-4 rounded-xl text-xs font-black uppercase text-[#4B4B4B] hover:bg-[#F0F0F0] active:border-b-0 active:translate-y-[4px] cursor-pointer transition-all">
                      <UploadCloud className="w-3.5 h-3.5 text-[#58CC02] stroke-[2.5]" />
                      <span>{isUploadingPdf ? 'Parsing File...' : 'Choose PDF / TXT'}</span>
                      <input
                        type="file"
                        accept=".pdf,.txt,.docx,.md"
                        onChange={handleSourceFileUpload}
                        disabled={isUploadingPdf}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {pdfUploadError && (
                    <p className="text-xs text-[#FF4B4B] font-black uppercase">{pdfUploadError}</p>
                  )}

                  {customFileName && (
                    <div className="flex items-center justify-between px-3 py-2 bg-white rounded-xl border border-[#58CC02] text-xs font-bold text-[#4B4B4B]">
                      <div className="flex items-center gap-2 truncate">
                        <CheckCircle2 className="w-4 h-4 text-[#58CC02] stroke-[2.5] shrink-0" />
                        <span className="truncate">{customFileName}</span>
                        <span className="text-[#58CC02] font-black shrink-0">
                          ({customWordCount} words parsed)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          playClickPop()
                          setCustomSourceText('')
                          setCustomFileName('')
                          setCustomWordCount(0)
                        }}
                        className="text-[#777777] hover:text-[#FF4B4B] p-1 font-black"
                      >
                        <X className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-black text-[#777777] uppercase">
                        Or Paste Custom Notes Directly:
                      </span>
                      {customSourceText && (
                        <span className="text-[10px] font-mono text-[#777777]">
                          {customSourceText.split(/\s+/).filter(Boolean).length} words · {customSourceText.length} chars
                        </span>
                      )}
                    </div>
                    <textarea
                      rows={4}
                      value={customSourceText}
                      onChange={(e) => {
                        setCustomSourceText(e.target.value)
                        setCustomWordCount(e.target.value.split(/\s+/).filter(Boolean).length)
                      }}
                      placeholder="Paste lecture text, book chapters, or specialized notes here. The AI will strictly ask questions only from this exact source material..."
                      className="w-full p-3 bg-white border-2 border-[#E5E5E5] rounded-xl text-xs font-bold text-[#4B4B4B] placeholder-[#777777] focus:outline-none focus:border-[#1CB0F6]"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 text-xs font-black text-[#4B4B4B] uppercase cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={saveToMaterials}
                        onChange={(e) => setSaveToMaterials(e.target.checked)}
                        className="w-4 h-4 rounded text-[#58CC02] focus:ring-0 cursor-pointer"
                      />
                      <span>Save parsed text to Program Study Hub</span>
                    </label>
                    {customSourceText && (
                      <button
                        type="button"
                        onClick={() => {
                          playClickPop()
                          setCustomSourceText('')
                          setCustomFileName('')
                          setCustomWordCount(0)
                        }}
                        className="text-[11px] font-black text-[#FF4B4B] uppercase hover:underline"
                      >
                        Clear Text
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Launch Modal Button */}
            <button
              onClick={handleOpenStandardGenerator}
              disabled={genSourceMode === 'strict_custom_source' && !customSourceText.trim()}
              className="w-full py-3.5 rounded-2xl bg-[#58CC02] border-2 border-[#58A700] border-b-4 text-white font-black text-xs sm:text-sm uppercase tracking-wider hover:bg-[#58A700] active:border-b-0 active:translate-y-[4px] transition-all duration-75 flex items-center justify-center gap-2 shadow-xs select-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap className="w-4 h-4 text-white stroke-[2.5]" />
              <span>
                Launch Live Generation Pipeline ({genQuestionCount}Q · {genDifficulty.toUpperCase()} · {genLanguage.toUpperCase()})
              </span>
            </button>
          </div>

          {/* Active Quizzes List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm text-[#4B4B4B] uppercase tracking-wider">
                Active Quizzes &amp; Drills ({localQuizzes.length})
              </h3>
              <span className="text-xs text-[#777777] font-bold uppercase">
                Tap to launch or copy sharable link
              </span>
            </div>

            {localQuizzes.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border-2 border-dashed border-[#E5E5E5] text-[#777777] text-xs font-bold uppercase">
                No quizzes generated yet. Click &ldquo;Launch Live Generation Pipeline&rdquo; above.
              </div>
            ) : (
              localQuizzes.map((quiz) => {
                const quizId = quiz._id?.toString() || ''
                const isCopied = copiedQuizId === quizId
                const quizAttempts = localAttempts.filter((a) => a.quizId?.toString() === quizId)

                return (
                  <div
                    key={quizId}
                    className="p-5 bg-white rounded-2xl border-2 border-[#E5E5E5] border-b-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="text-xs font-black text-[#1CB0F6] uppercase">
                          {quiz.programCode}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-[#F7F7F7] border border-[#E5E5E5] text-[#4B4B4B]">
                          {quiz.difficulty || 'medium'}
                        </span>
                        {/* Language Badge */}
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                            quiz.language === 'arabic'
                              ? 'bg-[#D7FFB8] text-[#58A700] border-[#58CC02]'
                              : quiz.language === 'urdu'
                              ? 'bg-[#F2E7FE] text-[#7F22FE] border-[#CE82FF]'
                              : quiz.language === 'malayalam'
                              ? 'bg-[#FFF5D6] text-[#D9A300] border-[#FFC800]'
                              : 'bg-[#DDF4FF] text-[#1899D6] border-[#1CB0F6]'
                          }`}
                        >
                          {quiz.language ? quiz.language.toUpperCase() : 'EN'}
                        </span>
                        {/* Strict Source Mode Badge */}
                        {quiz.sourceMode === 'strict_custom_source' && (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-[#FFF5D6] text-[#7A5B00] border border-[#FFC800] flex items-center gap-1">
                            <FileText className="w-3 h-3 stroke-[2.5]" />
                            <span>Strict Source</span>
                          </span>
                        )}
                        {/* Question Types Badges */}
                        {quiz.questionFormats && quiz.questionFormats.length > 0 && (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-[#F7F7F7] border border-[#E5E5E5] text-[#777777]">
                            {quiz.questionFormats
                              .map((f: string) => {
                                if (f === 'fill_blank') return 'Blank'
                                if (f === 'statement_verify') return 'Stmt'
                                if (f === 'assertion_reason') return 'Assert'
                                return 'MCQ'
                              })
                              .join('+')}
                          </span>
                        )}
                        <span className="text-xs text-[#777777] font-bold">
                          {quiz.questions?.length || quiz.questionCount || 10} Questions · {quiz.sessionWindow || 'Morning'}
                        </span>
                      </div>
                      <h4 className="font-black text-base text-[#4B4B4B] uppercase tracking-tight">{quiz.title}</h4>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-[#777777] font-bold">
                        <span>Created {format(new Date(quiz.createdAt || Date.now()), 'dd MMM, hh:mm a')}</span>
                        {quizAttempts.length > 0 && (
                          <span className="text-[#58CC02] font-black">
                            · {quizAttempts.length} attempt{quizAttempts.length !== 1 ? 's' : ''} logged
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyQuizLink(quizId)}
                        className="px-3.5 py-2.5 rounded-xl bg-white border-2 border-[#E5E5E5] border-b-4 text-[#4B4B4B] font-black text-xs uppercase tracking-wider hover:bg-[#F7F7F7] active:border-b-0 active:translate-y-[4px] transition-all flex items-center gap-1.5 select-none"
                      >
                        {isCopied ? <Check className="w-4 h-4 text-[#58CC02] stroke-[2.5]" /> : <Share2 className="w-4 h-4 text-[#777777] stroke-[2.5]" />}
                        <span>{isCopied ? 'Link Copied!' : 'Share Link'}</span>
                      </button>

                      <Link
                        href={`/programs/${program.code}/quiz/${quizId}?candidate=${encodeURIComponent(selectedCandidate)}`}
                        onClick={() => playClickPop()}
                      >
                        <button className="px-4 py-2.5 rounded-xl bg-[#58CC02] border-b-4 border-[#58A700] hover:bg-[#58A700] text-white font-black text-xs uppercase tracking-wider active:border-b-0 active:translate-y-[4px] transition-all flex items-center gap-1.5 shadow-xs select-none">
                          <Play className="w-3.5 h-3.5 fill-current stroke-[2.5]" />
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
            <div className="bg-white rounded-2xl border-2 border-[#E5E5E5] border-b-4 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-base text-[#4B4B4B] uppercase tracking-wide">
                  Revision Flashcards ({flashcardIdx + 1} / {flashcardDeck.length})
                </h3>
              </div>
              <div className="max-w-md mx-auto my-4">
                <FlipFlashcard card={flashcardDeck[flashcardIdx]} />
              </div>
              <div className="flex justify-center gap-3">
                <button
                  disabled={flashcardIdx === 0}
                  onClick={() => {
                    playClickPop()
                    setFlashcardIdx((i) => i - 1)
                  }}
                  className="px-4 py-2 rounded-xl bg-white border-2 border-[#E5E5E5] border-b-4 text-[#4B4B4B] text-xs font-black uppercase active:border-b-0 active:translate-y-[4px] disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={flashcardIdx >= flashcardDeck.length - 1}
                  onClick={() => {
                    playClickPop()
                    setFlashcardIdx((i) => i + 1)
                  }}
                  className="px-4 py-2 rounded-xl bg-[#1CB0F6] border-b-4 border-[#1899D6] text-white text-xs font-black uppercase active:border-b-0 active:translate-y-[4px] disabled:opacity-40"
                >
                  Next Card
                </button>
              </div>
            </div>
          ) : null}

          {/* Upload Notes */}
          <div className="bg-white rounded-2xl border-2 border-[#E5E5E5] border-b-4 p-6 shadow-xs">
            <h3 className="font-black text-base text-[#4B4B4B] uppercase tracking-wide mb-1">Upload Study Material</h3>
            <p className="text-xs font-bold text-[#777777] mb-4">
              Paste reference text or syllabus extracts. The AI will extract flashcards and high-yield cues.
            </p>
            <textarea
              rows={4}
              value={uploadText}
              onChange={(e) => setUploadText(e.target.value)}
              placeholder="Paste notes, rulings, articles, or case laws..."
              className="w-full p-4 rounded-xl bg-[#F7F7F7] border-2 border-[#E5E5E5] text-xs font-bold text-[#4B4B4B] focus:outline-none focus:border-[#58CC02] mb-3"
            />
            <div className="flex items-center gap-3">
              <button
                onClick={handleUpload}
                disabled={uploading || !uploadText.trim()}
                className="px-5 py-2.5 rounded-xl bg-[#58CC02] border-b-4 border-[#58A700] text-white font-black text-xs uppercase active:border-b-0 active:translate-y-[4px] disabled:opacity-50 transition-all"
              >
                {uploading ? 'Processing Notes...' : 'Upload Notes'}
              </button>
              {localMaterials.length > 0 && (
                <span className="text-xs text-[#777777] font-bold">
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#4B4B4B]/60 backdrop-blur-xs animate-in fade-in select-none"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-2xl bg-white rounded-3xl border-2 border-[#E5E5E5] border-b-[6px] p-6 sm:p-8 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b-2 border-[#E5E5E5]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#1CB0F6] text-white flex items-center justify-center shadow-xs">
                  <BookOpen className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-[#4B4B4B] uppercase leading-none">
                    {program.title} ({program.code})
                  </h3>
                  <p className="text-xs text-[#777777] font-bold uppercase mt-1">
                    Official SIBAQ &apos;26 Syllabus &amp; Concept Note
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  playClickPop()
                  setIsSyllabusOpen(false)
                }}
                className="p-2 rounded-xl text-[#777777] hover:text-[#4B4B4B] hover:bg-[#F7F7F7]"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-5 space-y-4 text-xs leading-relaxed text-[#4B4B4B]">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-3 rounded-2xl bg-[#F7F7F7] border border-[#E5E5E5]">
                  <span className="text-[10px] font-black text-[#777777] uppercase">Division</span>
                  <div className="font-black text-[#4B4B4B] text-sm mt-0.5 uppercase">{program.division || 'Aliyah'}</div>
                </div>
                <div className="p-3 rounded-2xl bg-[#F7F7F7] border border-[#E5E5E5]">
                  <span className="text-[10px] font-black text-[#777777] uppercase">Category</span>
                  <div className="font-black text-[#4B4B4B] text-sm mt-0.5 uppercase">{program.category}</div>
                </div>
                <div className="p-3 rounded-2xl bg-[#F7F7F7] border border-[#E5E5E5]">
                  <span className="text-[10px] font-black text-[#777777] uppercase">Duration</span>
                  <div className="font-black text-[#4B4B4B] text-sm mt-0.5 uppercase">{program.durationMinutes} min</div>
                </div>
                <div className="p-3 rounded-2xl bg-[#F7F7F7] border border-[#E5E5E5]">
                  <span className="text-[10px] font-black text-[#777777] uppercase">Core Skill</span>
                  <div className="font-black text-[#4B4B4B] text-sm mt-0.5 uppercase">{program.skill}</div>
                </div>
              </div>

              <div>
                <h4 className="font-black text-sm text-[#4B4B4B] mb-2 uppercase tracking-wider text-[11px]">
                  Concept Note &amp; Guidelines
                </h4>
                <div className="p-4 rounded-2xl bg-[#F7F7F7] border border-[#E5E5E5] text-[#4B4B4B] font-bold whitespace-pre-wrap leading-relaxed">
                  {program.conceptNote}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t-2 border-[#E5E5E5] text-right">
              <button
                onClick={() => {
                  playClickPop()
                  setIsSyllabusOpen(false)
                }}
                className="px-5 py-2.5 rounded-xl bg-[#58CC02] border-b-4 border-[#58A700] text-white font-black text-xs uppercase active:border-b-0 active:translate-y-[4px]"
              >
                Close Syllabus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Live Step-by-Step Documented Quiz Generation Pipeline Modal */}
      <QuizGenerationModal
        isOpen={isGenModalOpen}
        onClose={() => setIsGenModalOpen(false)}
        program={program}
        candidateName={selectedCandidate}
        difficulty={isRevengeLaunch ? 'hard' : genDifficulty}
        questionCount={isRevengeLaunch ? 10 : genQuestionCount}
        engine={genEngine}
        sessionWindow={genSessionWindow}
        useLiveSearch={genLiveSearch}
        isRevenge={isRevengeLaunch}
        language={genLanguage}
        sourceMode={genSourceMode}
        questionFormats={genFormats}
        customSourceText={customSourceText}
        saveToMaterials={saveToMaterials}
        customMaterialTitle={customMaterialTitle}
        onQuizGenerated={handleQuizGenerated}
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
