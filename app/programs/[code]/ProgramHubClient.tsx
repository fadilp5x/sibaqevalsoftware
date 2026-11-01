'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { IFlashcard } from '@/models'
import CandidatePill from '@/components/CandidatePill'
import WeeklyLineChart from '@/components/WeeklyLineChart'
import TopicProgressBars from '@/components/TopicProgressBars'
import MissedQuestionsGrid from '@/components/MissedQuestionsGrid'
import FlipFlashcard from '@/components/FlipFlashcard'
import TactileButton from '@/components/ui/TactileButton'
import ChatDrawer from '@/components/ChatDrawer'
import ShareQuizModal from '@/components/ShareQuizModal'
import {
  BarChart2,
  BookOpen,
  Award,
  Plus,
  Loader2,
  Upload,
  Zap,
  Cpu,
  Globe,
  Share2,
  Check,
  RefreshCw,
  CheckCircle2,
  UserPlus,
  X,
  Target,
  Sun,
  Moon,
} from 'lucide-react'
import { format } from 'date-fns'

type Tab = 'analytics' | 'study' | 'quizzes'

const accentBtnMap: Record<string, 'emerald' | 'sky' | 'amber' | 'coral' | 'purple'> = {
  emerald: 'emerald',
  sky: 'sky',
  amber: 'amber',
  purple: 'purple',
  rose: 'coral',
}

interface ProgramHubClientProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  program: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  quizzes: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  materials: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  attempts: any[]
}

export default function ProgramHubClient({
  program,
  quizzes,
  materials,
  attempts,
}: ProgramHubClientProps) {
  const [tab, setTab] = useState<Tab>('analytics')
  const [selectedCandidate, setSelectedCandidate] = useState<string>('All')
  const [generating, setGenerating] = useState(false)
  const [genType, setGenType] = useState<'quiz' | 'flashcards' | 'cues'>('quiz')
  const [genEngine, setGenEngine] = useState<'nvidia' | 'orca'>('nvidia')
  const [genDifficulty, setGenDifficulty] = useState<'easy' | 'medium' | 'hard' | 'extreme'>('medium')
  const [genQuestionCount, setGenQuestionCount] = useState<number>(10)
  const [genSessionWindow, setGenSessionWindow] = useState<'Morning' | 'Evening'>(
    new Date().getHours() < 12 ? 'Morning' : 'Evening'
  )
  const [genLiveSearch, setGenLiveSearch] = useState(false)
  const [genError, setGenError] = useState('')

  // Candidate enrollment modal inside program hub
  const [isAddCandidateOpen, setIsAddCandidateOpen] = useState(false)
  const [newCandidateName, setNewCandidateName] = useState('')
  const [newCandidateRegNo, setNewCandidateRegNo] = useState('')
  const [addingCandidate, setAddingCandidate] = useState(false)
  const [addCandidateError, setAddCandidateError] = useState('')

  // Stateful dynamic data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [localMaterials, setLocalMaterials] = useState<any[]>(materials)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [localQuizzes, setLocalQuizzes] = useState<any[]>(quizzes)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [localAttempts, setLocalAttempts] = useState<any[]>(attempts)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [localCandidates, setLocalCandidates] = useState<any[]>(program.candidates || [])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState<string>('Just now')

  // Share modal state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [sharedQuiz, setSharedQuiz] = useState<any | null>(null)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [copiedQuizId, setCopiedQuizId] = useState<string | null>(null)

  const [flashcards, setFlashcards] = useState<IFlashcard[]>(materials[0]?.flashcards || [])
  const [flashcardIdx, setFlashcardIdx] = useState(0)
  const [flashcardDeck, setFlashcardDeck] = useState<IFlashcard[]>(materials[0]?.flashcards || [])
  const [uploading, setUploading] = useState(false)
  const [uploadText, setUploadText] = useState('')

  const accentBtn = accentBtnMap[program.accentColor] || 'sky'

  // Refresh data function to sync new candidate submissions from MongoDB
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const res = await fetch(`/api/programs/${program.code}`)
      const data = await res.json()
      if (data.attempts) setLocalAttempts(data.attempts)
      if (data.quizzes) setLocalQuizzes(data.quizzes)
      if (data.program?.candidates) setLocalCandidates(data.program.candidates)
      setLastRefreshed(format(new Date(), 'hh:mm:ss a'))
    } catch (e) {
      console.error('Failed to sync program data:', e)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Periodic poll every 20 seconds so external user submissions reach the coordinator automatically
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

  const handleGenerate = async () => {
    setGenerating(true)
    setGenError('')
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programCode: program.code,
          type: genType,
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
        // Automatically open the share modal with the public share link!
        setSharedQuiz(data.quiz)
        setIsShareModalOpen(true)
      }
      if (data.flashcards) {
        setFlashcards(data.flashcards)
        setFlashcardDeck([...data.flashcards])
        setFlashcardIdx(0)
      }
      if (data.summaryCues && localMaterials.length > 0) {
        setLocalMaterials((prev) => {
          const updated = [...prev]
          updated[0] = { ...updated[0], summaryCues: data.summaryCues }
          return updated
        })
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
      fd.append('uploadedBy', selectedCandidate !== 'All' ? selectedCandidate : 'Coordinator')
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

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'analytics', label: 'Analytics', icon: <BarChart2 className="w-4 h-4" /> },
    { id: 'study', label: 'Study Hub', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'quizzes', label: 'Quizzes', icon: <Award className="w-4 h-4" /> },
  ]

  const currentMaterial = localMaterials[0]

  // Merge enrolled candidates and candidate profiles from attempts
  const allCandidateProfiles = [...localCandidates]
  localAttempts.forEach((att) => {
    if (
      att.candidateName &&
      !allCandidateProfiles.some((c) => c.name.toLowerCase() === att.candidateName.toLowerCase())
    ) {
      const candAttempts = localAttempts.filter(
        (a) => a.candidateName.toLowerCase() === att.candidateName.toLowerCase()
      )
      const avg = Math.round(
        candAttempts.reduce((s, a) => s + a.percentage, 0) / (candAttempts.length || 1)
      )
      allCandidateProfiles.push({
        id: att.candidateName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        name: att.candidateName,
        regNo: `${program.code}-STU`,
        avatarColor: '#1CB0F6',
        streakDays: candAttempts.length,
        overallAccuracy: avg,
        strengths: [],
        weaknesses: [],
      })
    }
  })

  // Recent attempts sorted newest first for live submissions stream
  const recentSubmissions = [...localAttempts].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  )

  const getDifficultyBadge = (diff?: string) => {
    switch (diff) {
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
    <div>
      {/* Candidate Switcher Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedCandidate('All')}
            className={`px-4 py-2 rounded-xl border-2 border-b-4 text-sm font-bold transition-all duration-100 active:border-b-2 active:translate-y-[2px]
              ${
                selectedCandidate === 'All'
                  ? 'bg-slate-800 border-slate-600 border-b-slate-900 text-white'
                  : 'bg-white border-slate-200 border-b-slate-300 text-slate-600 hover:border-slate-300'
              }`}
          >
            All Candidates
          </button>
          {allCandidateProfiles.map((c) => (
            <CandidatePill
              key={c.id || c.name}
              candidate={c}
              accentColor={program.accentColor}
              selected={selectedCandidate === c.name}
              onClick={() => setSelectedCandidate(c.name)}
            />
          ))}

          {/* + Add Candidate mini-button */}
          <button
            onClick={() => setIsAddCandidateOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-sky-50 border-2 border-sky-300 border-b-4 border-b-sky-500 rounded-xl text-xs font-bold text-sky-700 hover:bg-sky-100 active:border-b-2 active:translate-y-[2px] transition-all"
            title="Add a candidate to this program roster"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Add Candidate</span>
          </button>
        </div>

        {/* Live Refresh Trigger */}
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border-2 border-slate-200 border-b-4 border-b-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 active:border-b-2 active:translate-y-[2px] transition-all disabled:opacity-50"
          title="Sync latest quiz results from candidates"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-sky-600 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Syncing...' : 'Sync Submissions'}</span>
        </button>
      </div>

      {/* Inline Candidate Enrollment Modal */}
      {isAddCandidateOpen && (
        <div className="mb-6 p-4 bg-sky-50 border-2 border-sky-300 border-b-4 border-b-sky-500 rounded-2xl animate-fade-in shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-black text-sky-900 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-sky-600" /> Enroll New Student to {program.code}
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
              placeholder="Candidate Name (e.g. Ameen)"
              className="flex-1 bg-white border-2 border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-sky-500"
              required
              autoFocus
            />
            <input
              type="text"
              value={newCandidateRegNo}
              onChange={(e) => setNewCandidateRegNo(e.target.value)}
              placeholder={`Reg No (e.g. ${program.code}-003)`}
              className="w-full sm:w-40 bg-white border-2 border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-medium text-slate-700 focus:outline-none focus:border-sky-500"
            />
            <button
              type="submit"
              disabled={addingCandidate || !newCandidateName.trim()}
              className="px-4 py-2 bg-[#58CC02] border-2 border-[#46A302] border-b-4 border-b-[#3c8c01] text-white text-xs font-black rounded-xl active:translate-y-[2px] active:border-b-2 transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {addingCandidate ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 stroke-[3]" />}
              <span>Save &amp; Select</span>
            </button>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b-2 border-slate-200 mb-6 pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`
              flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl border-2 border-b-4
              transition-all duration-100 active:border-b-2 active:translate-y-[2px]
              ${
                tab === t.id
                  ? 'bg-slate-800 border-slate-600 border-b-slate-900 text-white'
                  : 'bg-white border-slate-200 border-b-slate-300 text-slate-600 hover:bg-slate-50'
              }
            `}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── Analytics Tab ─── */}
      {tab === 'analytics' && (
        <div className="space-y-6">
          {/* Live Candidate Submissions Stream */}
          <div className="bg-white border-2 border-slate-200 border-b-4 border-b-slate-300 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <h3 className="text-base font-black text-slate-800">Live Candidate Submissions</h3>
                <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">
                  {recentSubmissions.length} Total
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">Last synced: {lastRefreshed}</span>
            </div>

            {recentSubmissions.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                No quiz attempts submitted yet. Share a quiz link with students to see submissions stream in live!
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {recentSubmissions.slice(0, 10).map((att, i) => (
                  <div
                    key={att._id || i}
                    className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-sky-500 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                        {att.candidateName?.slice(0, 2).toUpperCase() || 'ST'}
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-800">{att.candidateName}</div>
                        <div className="text-[10px] text-slate-400">
                          {format(new Date(att.submittedAt), 'MMM d, h:mm a')} · {att.timeTakenSeconds ? `${Math.round(att.timeTakenSeconds / 60)}m` : 'Timed'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className={`text-xs font-black px-2 py-0.5 rounded-lg ${att.percentage >= 70 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {att.percentage}%
                        </span>
                        <div className="text-[10px] text-slate-400">{att.score}/{att.totalQuestions} pts</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Weekly progress chart */}
          <div className="bg-white border-2 border-slate-200 border-b-4 border-b-slate-300 rounded-2xl p-5">
            <h3 className="text-base font-black text-slate-800 mb-1">Weekly Improvement Trend</h3>
            <p className="text-xs text-slate-500 mb-4">Historical score progression for {selectedCandidate}</p>
            <WeeklyLineChart attempts={localAttempts} candidateName={selectedCandidate} />
          </div>

          {/* Topic mastery */}
          <div className="bg-white border-2 border-slate-200 border-b-4 border-b-slate-300 rounded-2xl p-5">
            <h3 className="text-base font-black text-slate-800 mb-4">Topic Mastery Breakdown</h3>
            <TopicProgressBars attempts={localAttempts} candidateName={selectedCandidate} />
          </div>

          {/* Missed questions */}
          <div className="bg-white border-2 border-slate-200 border-b-4 border-b-slate-300 rounded-2xl p-5">
            <h3 className="text-base font-black text-slate-800 mb-1">Weakness Analysis &amp; Missed Questions</h3>
            <p className="text-xs text-slate-500 mb-4">AI targets these exact weak areas in upcoming quizzes</p>
            <MissedQuestionsGrid attempts={localAttempts} quizzes={localQuizzes} candidateName={selectedCandidate} />
          </div>
        </div>
      )}

      {/* ─── Study Hub Tab ─── */}
      {tab === 'study' && (
        <div className="space-y-5">
          {/* Upload notes */}
          <div className="bg-white border-2 border-slate-200 border-b-4 border-b-slate-300 rounded-2xl p-5">
            <h3 className="text-base font-black text-slate-800 mb-4">📤 Upload Study Material</h3>
            <textarea
              value={uploadText}
              onChange={(e) => setUploadText(e.target.value)}
              placeholder="Paste your notes, syllabus text, or key points here..."
              className="w-full border-2 border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-sky-400 transition-colors min-h-[100px] resize-none"
            />
            <div className="flex gap-2 mt-3">
              <TactileButton accentColor={accentBtn} onClick={handleUpload} disabled={uploading || !uploadText.trim()} size="sm">
                {uploading ? <><Loader2 className="w-3 h-3 animate-spin" /> Uploading...</> : <><Upload className="w-3 h-3" /> Upload Notes</>}
              </TactileButton>
            </div>
          </div>

          {/* AI Generation controls */}
          <div className="bg-white border-2 border-slate-200 border-b-4 border-b-slate-300 rounded-2xl p-5">
            <h3 className="text-base font-black text-slate-800 mb-4">🤖 AI Assessment &amp; Content Generator</h3>

            {/* Type selector */}
            <div className="flex gap-2 mb-4">
              {(['quiz', 'flashcards', 'cues'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setGenType(t)}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border-2 border-b-4 transition-all duration-100 active:border-b-2 active:translate-y-[2px] capitalize
                    ${
                      genType === t
                        ? 'bg-slate-800 border-slate-600 border-b-slate-900 text-white'
                        : 'bg-white border-slate-200 border-b-slate-300 text-slate-600 hover:bg-slate-50'
                    }`}
                >
                  {t === 'quiz' ? '📋 Adaptive Quiz' : t === 'flashcards' ? '🃏 Flashcards' : '📌 Revision Cues'}
                </button>
              ))}
            </div>

            {/* Quiz-specific calibration: 4-Tier Difficulty & Question Count */}
            {genType === 'quiz' && (
              <div className="space-y-4 mb-4 bg-slate-50 border-2 border-slate-200 rounded-2xl p-4">
                {/* 4-Tier Difficulty Selector */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-black text-slate-700 uppercase tracking-wide mb-2">
                    <Target className="w-3.5 h-3.5 text-indigo-600" />
                    Quiz Difficulty Tier:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'easy', label: '🟢 Easy', sub: 'Foundation' },
                      { id: 'medium', label: '🔵 Medium', sub: 'SIBAQ Standard' },
                      { id: 'hard', label: '🟠 Hard', sub: 'Analytical' },
                      { id: 'extreme', label: '🔴 Extreme', sub: 'Olympiad/Finals' },
                    ].map((d) => (
                      <button
                        type="button"
                        key={d.id}
                        onClick={() => setGenDifficulty(d.id as typeof genDifficulty)}
                        className={`p-2.5 rounded-xl border-2 border-b-4 text-left transition-all active:border-b-2 active:translate-y-[2px] ${
                          genDifficulty === d.id
                            ? d.id === 'easy'
                              ? 'bg-emerald-500 border-emerald-600 border-b-emerald-700 text-white shadow-sm'
                              : d.id === 'medium'
                              ? 'bg-sky-500 border-sky-600 border-b-sky-700 text-white shadow-sm'
                              : d.id === 'hard'
                              ? 'bg-amber-500 border-amber-600 border-b-amber-700 text-slate-900 shadow-sm'
                              : 'bg-rose-500 border-rose-600 border-b-rose-700 text-white shadow-sm'
                            : 'bg-white border-slate-200 border-b-slate-300 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="text-xs font-black leading-tight">{d.label}</div>
                        <div className={`text-[10px] mt-0.5 ${genDifficulty === d.id ? 'opacity-90' : 'text-slate-400'}`}>
                          {d.sub}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Question Count & Session Window */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1.5">
                      Question Count
                    </label>
                    <div className="flex gap-2">
                      {[10, 25, 50].map((count) => (
                        <button
                          type="button"
                          key={count}
                          onClick={() => setGenQuestionCount(count)}
                          className={`flex-1 py-1.5 rounded-xl border-2 border-b-4 text-xs font-black transition-all active:border-b-2 active:translate-y-[2px] ${
                            genQuestionCount === count
                              ? 'bg-slate-800 border-slate-600 border-b-slate-900 text-white'
                              : 'bg-white border-slate-200 border-b-slate-300 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {count} Qs
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1.5">
                      Session Window
                    </label>
                    <div className="flex gap-2">
                      {(['Morning', 'Evening'] as const).map((win) => (
                        <button
                          type="button"
                          key={win}
                          onClick={() => setGenSessionWindow(win)}
                          className={`flex-1 py-1.5 rounded-xl border-2 border-b-4 text-xs font-black transition-all active:border-b-2 active:translate-y-[2px] flex items-center justify-center gap-1.5 ${
                            genSessionWindow === win
                              ? 'bg-sky-500 border-sky-600 border-b-sky-700 text-white'
                              : 'bg-white border-slate-200 border-b-slate-300 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {win === 'Morning' ? <Sun className="w-3 h-3 text-amber-300" /> : <Moon className="w-3 h-3 text-indigo-300" />}
                          {win}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Engine + Live search */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                <button
                  onClick={() => setGenEngine('nvidia')}
                  className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md font-bold transition-all ${
                    genEngine === 'nvidia' ? 'bg-white shadow text-sky-700' : 'text-slate-500'
                  }`}
                >
                  <Cpu className="w-3 h-3" />
                  Nemotron
                </button>
                <button
                  onClick={() => setGenEngine('orca')}
                  className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md font-bold transition-all ${
                    genEngine === 'orca' ? 'bg-white shadow text-amber-700' : 'text-slate-500'
                  }`}
                >
                  <Zap className="w-3 h-3" />
                  DeepSeek
                </button>
              </div>

              <button
                onClick={() => setGenLiveSearch(!genLiveSearch)}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border-2 border-b-4 transition-all duration-100 active:border-b-2 active:translate-y-[2px] ${
                  genLiveSearch
                    ? 'bg-sky-100 border-sky-300 border-b-sky-500 text-sky-700'
                    : 'bg-slate-100 border-slate-200 border-b-slate-300 text-slate-500'
                }`}
              >
                <Globe className="w-3 h-3" />
                {genLiveSearch ? '🌐 Live Web: ON' : 'Live Web: OFF'}
              </button>
            </div>

            {genError && (
              <p className="text-red-500 text-xs mb-3 bg-red-50 rounded-lg p-2 font-bold">
                ⚠️ {genError}
              </p>
            )}

            <TactileButton accentColor={accentBtn} onClick={handleGenerate} disabled={generating} fullWidth>
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Generating {genDifficulty.toUpperCase()} Quiz &amp; Link...
                </>
              ) : (
                `✨ Generate ${genType === 'quiz' ? `${genDifficulty.toUpperCase()} Quiz` : 'Study Material'}`
              )}
            </TactileButton>
          </div>

          {/* Summary cues */}
          {currentMaterial?.summaryCues?.length > 0 && (
            <div className="bg-amber-50 border-2 border-amber-300 border-b-4 border-b-amber-500 rounded-2xl p-5">
              <h3 className="text-base font-black text-slate-800 mb-3">📌 Revision Cues</h3>
              <ul className="space-y-2">
                {currentMaterial.summaryCues.map((cue: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-400 text-white text-xs flex items-center justify-center font-bold">
                      {i + 1}
                    </span>
                    {cue}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Flashcards */}
          {flashcardDeck.length > 0 && (
            <div className="bg-white border-2 border-slate-200 border-b-4 border-b-slate-300 rounded-2xl p-5">
              <h3 className="text-base font-black text-slate-800 mb-4">
                🃏 Flashcard Stack ({flashcardDeck.length} remaining)
              </h3>
              {flashcardIdx < flashcardDeck.length ? (
                <FlipFlashcard
                  card={flashcardDeck[flashcardIdx]}
                  cardNumber={flashcardIdx + 1}
                  total={flashcardDeck.length}
                  onGotIt={() => setFlashcardIdx((i) => i + 1)}
                  onReviewAgain={() => {
                    const deck = [...flashcardDeck]
                    const card = deck.splice(flashcardIdx, 1)[0]
                    deck.push(card)
                    setFlashcardDeck(deck)
                  }}
                />
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">🎉</div>
                  <p className="font-bold text-slate-700">All cards reviewed!</p>
                  <button
                    onClick={() => {
                      setFlashcardDeck([...flashcards])
                      setFlashcardIdx(0)
                    }}
                    className="mt-3 text-sm text-sky-600 underline font-bold"
                  >
                    Start over
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── Quizzes Tab ─── */}
      {tab === 'quizzes' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-800">
              {localQuizzes.length} Quiz{localQuizzes.length !== 1 ? 'zes' : ''}
            </h3>
            <TactileButton
              accentColor={accentBtn}
              size="sm"
              onClick={() => {
                setTab('study')
                setGenType('quiz')
              }}
            >
              <Plus className="w-3 h-3" /> Generate Quiz
            </TactileButton>
          </div>

          {localQuizzes.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-sm">No quizzes yet. Generate one from the Study Hub tab!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {localQuizzes.map((quiz) => {
                const quizAttempts = localAttempts.filter(
                  (a) => a.quizId?.toString() === quiz._id?.toString()
                )
                const isCopied = copiedQuizId === quiz._id?.toString()

                return (
                  <div
                    key={quiz._id?.toString()}
                    className="bg-white border-2 border-slate-200 border-b-4 border-b-slate-300 rounded-2xl p-4 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${getDifficultyBadge(
                              quiz.difficulty
                            )}`}
                          >
                            {quiz.difficulty || 'medium'}
                          </span>
                          <h4 className="text-sm font-black text-slate-800 truncate">{quiz.title}</h4>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-1.5">
                          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                            {format(new Date(quiz.createdAt), 'MMM d')}
                          </span>
                          <span className="text-xs bg-sky-100 text-sky-600 px-2 py-0.5 rounded-full font-medium">
                            {quiz.sessionWindow}
                          </span>
                          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                            {quiz.questions?.length || quiz.questionCount || 0} questions
                          </span>
                          <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-medium">
                            {quiz.aiModelUsed}
                          </span>
                          {quizAttempts.length > 0 && (
                            <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              {quizAttempts.length} attempt{quizAttempts.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        {/* Share link button */}
                        <button
                          onClick={() => handleCopyQuizLink(quiz._id?.toString())}
                          className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border-2 border-b-4 transition-all duration-100 active:border-b-2 active:translate-y-[2px] ${
                            isCopied
                              ? 'bg-green-500 border-green-600 border-b-green-700 text-white shadow-sm'
                              : 'bg-slate-50 border-slate-200 border-b-slate-300 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5 text-sky-600" />}
                          <span>{isCopied ? 'Link Copied! ✓' : 'Share Link'}</span>
                        </button>

                        <Link href={`/programs/${program.code}/quiz/${quiz._id}`} className="flex-1 sm:flex-none">
                          <TactileButton accentColor={accentBtn} size="sm" fullWidth>
                            Start Quiz →
                          </TactileButton>
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Share Quiz Modal */}
      <ShareQuizModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        quiz={sharedQuiz}
      />

      {/* Chat Drawer */}
      <ChatDrawer
        programCode={program.code}
        programTitle={program.title}
        candidateName={selectedCandidate !== 'All' ? selectedCandidate : program.candidates[0]?.name || ''}
        accentColor={program.accentColor}
      />
    </div>
  )
}
