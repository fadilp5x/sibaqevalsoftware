'use client'

import { useState } from 'react'
import Link from 'next/link'
import { IFlashcard } from '@/models'
import CandidatePill from '@/components/CandidatePill'
import WeeklyLineChart from '@/components/WeeklyLineChart'
import TopicProgressBars from '@/components/TopicProgressBars'
import MissedQuestionsGrid from '@/components/MissedQuestionsGrid'
import FlipFlashcard from '@/components/FlipFlashcard'
import TactileButton from '@/components/ui/TactileButton'
import ChatDrawer from '@/components/ChatDrawer'
import { BarChart2, BookOpen, Award, Plus, Loader2, Upload, Zap, Cpu, Globe } from 'lucide-react'
import { format } from 'date-fns'

type Tab = 'analytics' | 'study' | 'quizzes'

const accentBtnMap: Record<string, 'emerald' | 'sky' | 'amber' | 'purple'> = {
  emerald: 'emerald',
  sky: 'sky',
  amber: 'amber',
  purple: 'purple',
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

export default function ProgramHubClient({ program, quizzes, materials, attempts }: ProgramHubClientProps) {
  const [tab, setTab] = useState<Tab>('analytics')
  const [selectedCandidate, setSelectedCandidate] = useState<string>('All')
  const [generating, setGenerating] = useState(false)
  const [genType, setGenType] = useState<'quiz' | 'flashcards' | 'cues'>('quiz')
  const [genEngine, setGenEngine] = useState<'nvidia' | 'orca'>('nvidia')
  const [genLiveSearch, setGenLiveSearch] = useState(false)
  const [genError, setGenError] = useState('')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [localMaterials, setLocalMaterials] = useState<any[]>(materials)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [localQuizzes, setLocalQuizzes] = useState<any[]>(quizzes)
  const [flashcards, setFlashcards] = useState<IFlashcard[]>(materials[0]?.flashcards || [])
  const [flashcardIdx, setFlashcardIdx] = useState(0)
  const [flashcardDeck, setFlashcardDeck] = useState<IFlashcard[]>(materials[0]?.flashcards || [])
  const [uploading, setUploading] = useState(false)
  const [uploadText, setUploadText] = useState('')

  const accentBtn = accentBtnMap[program.accentColor] || 'sky'

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
          useLiveSearch: genLiveSearch,
          sessionWindow: new Date().getHours() < 12 ? 'Morning' : 'Evening',
          questionCount: 10,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')

      if (data.quiz) {
        setLocalQuizzes((prev) => [data.quiz, ...prev])
        setTab('quizzes')
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

  // Merge enrolled candidates and candidates who have attempts
  const allCandidateProfiles = [...program.candidates]
  attempts.forEach((att) => {
    if (att.candidateName && !allCandidateProfiles.some((c) => c.name.toLowerCase() === att.candidateName.toLowerCase())) {
      const candAttempts = attempts.filter((a) => a.candidateName.toLowerCase() === att.candidateName.toLowerCase())
      const avg = Math.round(candAttempts.reduce((s, a) => s + a.percentage, 0) / (candAttempts.length || 1))
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

  return (
    <div>
      {/* Candidate Switcher */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <button
          onClick={() => setSelectedCandidate('All')}
          className={`px-4 py-2 rounded-xl border-2 border-b-4 text-sm font-bold transition-all duration-100 active:border-b-2 active:translate-y-[2px]
            ${selectedCandidate === 'All'
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
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl mb-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-bold transition-all duration-150 ${
              tab === t.id ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── Analytics Tab ─── */}
      {tab === 'analytics' && (
        <div className="space-y-5">
          <div className="bg-white border-2 border-slate-200 border-b-4 border-b-slate-300 rounded-2xl p-5">
            <h3 className="text-base font-black text-slate-800 mb-4">📈 Weekly Improvement</h3>
            <WeeklyLineChart attempts={attempts} candidateName={selectedCandidate} accentColor={program.accentColor} />
          </div>
          <div className="bg-white border-2 border-slate-200 border-b-4 border-b-slate-300 rounded-2xl p-5">
            <h3 className="text-base font-black text-slate-800 mb-4">🎯 Topic Mastery</h3>
            <TopicProgressBars attempts={attempts} candidateName={selectedCandidate} />
          </div>
          <div className="bg-white border-2 border-slate-200 border-b-4 border-b-slate-300 rounded-2xl p-5">
            <h3 className="text-base font-black text-slate-800 mb-4">📝 Missed Questions Review</h3>
            <MissedQuestionsGrid attempts={attempts} quizzes={localQuizzes} candidateName={selectedCandidate} />
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
            <h3 className="text-base font-black text-slate-800 mb-4">🤖 AI Generate</h3>

            {/* Type selector */}
            <div className="flex gap-2 mb-4">
              {(['quiz', 'flashcards', 'cues'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setGenType(t)}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border-2 border-b-4 transition-all duration-100 active:border-b-2 active:translate-y-[2px] capitalize
                    ${genType === t
                      ? 'bg-slate-800 border-slate-600 border-b-slate-900 text-white'
                      : 'bg-white border-slate-200 border-b-slate-300 text-slate-600 hover:bg-slate-50'
                    }`}
                >
                  {t === 'quiz' ? '📋 Quiz' : t === 'flashcards' ? '🃏 Flashcards' : '📌 Cues'}
                </button>
              ))}
            </div>

            {/* Engine + Live search */}
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                <button onClick={() => setGenEngine('nvidia')} className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md font-bold transition-all ${genEngine === 'nvidia' ? 'bg-white shadow text-sky-700' : 'text-slate-500'}`}>
                  <Cpu className="w-3 h-3" />NVIDIA
                </button>
                <button onClick={() => setGenEngine('orca')} className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md font-bold transition-all ${genEngine === 'orca' ? 'bg-white shadow text-amber-700' : 'text-slate-500'}`}>
                  <Zap className="w-3 h-3" />DeepSeek
                </button>
              </div>
              <button
                onClick={() => setGenLiveSearch(!genLiveSearch)}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border-2 border-b-4 transition-all duration-100 active:border-b-2 active:translate-y-[2px] ${
                  genLiveSearch ? 'bg-sky-100 border-sky-300 border-b-sky-500 text-sky-700' : 'bg-slate-100 border-slate-200 border-b-slate-300 text-slate-500'
                }`}
              >
                <Globe className="w-3 h-3" />
                {genLiveSearch ? '🌐 Live Web: ON' : 'Live Web: OFF'}
              </button>
            </div>

            {genError && <p className="text-red-500 text-xs mb-3 bg-red-50 rounded-lg p-2">{genError}</p>}

            <TactileButton accentColor={accentBtn} onClick={handleGenerate} disabled={generating} fullWidth>
              {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : '✨ Generate with AI'}
            </TactileButton>
          </div>

          {/* Summary cues */}
          {currentMaterial?.summaryCues?.length > 0 && (
            <div className="bg-amber-50 border-2 border-amber-300 border-b-4 border-b-amber-500 rounded-2xl p-5">
              <h3 className="text-base font-black text-slate-800 mb-3">📌 Revision Cues</h3>
              <ul className="space-y-2">
                {currentMaterial.summaryCues.map((cue: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-400 text-white text-xs flex items-center justify-center font-bold">{i + 1}</span>
                    {cue}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Flashcards */}
          {flashcardDeck.length > 0 && (
            <div className="bg-white border-2 border-slate-200 border-b-4 border-b-slate-300 rounded-2xl p-5">
              <h3 className="text-base font-black text-slate-800 mb-4">🃏 Flashcard Stack ({flashcardDeck.length} remaining)</h3>
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
                    onClick={() => { setFlashcardDeck([...flashcards]); setFlashcardIdx(0) }}
                    className="mt-3 text-sm text-sky-600 underline"
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
            <h3 className="text-base font-black text-slate-800">{localQuizzes.length} Quiz{localQuizzes.length !== 1 ? 'zes' : ''}</h3>
            <TactileButton accentColor={accentBtn} size="sm" onClick={() => { setTab('study'); setGenType('quiz') }}>
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
                const quizAttempts = attempts.filter((a) => a.quizId?.toString() === quiz._id?.toString())
                return (
                  <div key={quiz._id?.toString()} className="bg-white border-2 border-slate-200 border-b-4 border-b-slate-300 rounded-2xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-black text-slate-800 truncate">{quiz.title}</h4>
                        <div className="flex flex-wrap gap-2 mt-1.5">
                          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                            {format(new Date(quiz.createdAt), 'MMM d')}
                          </span>
                          <span className="text-xs bg-sky-100 text-sky-600 px-2 py-0.5 rounded-full">
                            {quiz.sessionWindow}
                          </span>
                          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                            {quiz.questions.length} questions
                          </span>
                          <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">
                            {quiz.aiModelUsed}
                          </span>
                          {quizAttempts.length > 0 && (
                            <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
                              {quizAttempts.length} attempt{quizAttempts.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      <Link href={`/programs/${program.code}/quiz/${quiz._id}`}>
                        <TactileButton accentColor={accentBtn} size="sm">
                          Start Quiz →
                        </TactileButton>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Chat Drawer */}
      <ChatDrawer
        programCode={program.code}
        programTitle={program.title}
        candidateName={selectedCandidate !== 'All' ? selectedCandidate : (program.candidates[0]?.name || '')}
        accentColor={program.accentColor}
      />
    </div>
  )
}
