'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Volume2, VolumeX, Clock, Flame } from 'lucide-react'
import TactileButton from '@/components/ui/TactileButton'
import AccuracyRing from '@/components/ui/AccuracyRing'

interface Question {
  questionStem: string
  questionText: string
  options: string[]
  correctOptionIndex: number
  topicTag: string
  explanation: string
}

interface Quiz {
  _id: string
  title: string
  durationMinutes: number
  difficulty?: 'easy' | 'medium' | 'hard' | 'extreme'
  questions: Question[]
  programCode: string
}

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

interface Candidate {
  id: string
  name: string
  avatarColor: string
  streakDays: number
  overallAccuracy: number
  regNo?: string
}

type Phase = 'select-candidate' | 'in-progress' | 'completed'

export default function QuizEnginePage() {
  const params = useParams()
  const code = params.code as string
  const quizId = params.quizId as string

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [accentColor, setAccentColor] = useState('sky')
  const [phase, setPhase] = useState<Phase>('select-candidate')
  const [selectedCandidate, setSelectedCandidate] = useState('')
  const [currentQ, setCurrentQ] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [checked, setChecked] = useState(false)
  const [answers, setAnswers] = useState<{ questionIndex: number; selectedOption: number; isCorrect: boolean; topicTag: string }[]>([])
  const [streak, setStreak] = useState(0)
  const [timer, setTimer] = useState(0)
  const [muted, setMuted] = useState(false)
  const [startTime] = useState(Date.now())
  const [result, setResult] = useState<{ percentage: number; score: number; total: number } | null>(null)

  // Sound functions (lazy to avoid SSR)
  const playCorrect = useCallback(() => {
    if (muted) return
    import('@/lib/sounds').then(({ playCorrectSound }) => playCorrectSound())
  }, [muted])

  const playWrong = useCallback(() => {
    if (muted) return
    import('@/lib/sounds').then(({ playWrongSound }) => playWrongSound())
  }, [muted])

  const playFanfare = useCallback(() => {
    import('@/lib/sounds').then(({ playFinishFanfare }) => playFinishFanfare())
  }, [])

  // Load quiz data
  useEffect(() => {
    fetch(`/api/programs/${code}`)
      .then((r) => r.json())
      .then((data) => {
        const q = data.quizzes?.find((qz: Quiz) => qz._id === quizId)
        if (q) {
          setQuiz(q)
          setTimer(q.durationMinutes * 60)
        }
        setCandidates(data.program?.candidates || [])
        setAccentColor(data.program?.accentColor || 'sky')
      })
  }, [code, quizId])

  // Timer tick
  useEffect(() => {
    if (phase !== 'in-progress') return
    const key = `timer-${quizId}-${selectedCandidate}`
    const saved = localStorage.getItem(key)
    if (saved) setTimer(parseInt(saved))

    const interval = setInterval(() => {
      setTimer((t) => {
        const next = t - 1
        localStorage.setItem(key, String(next))
        if (next <= 0) {
          clearInterval(interval)
          handleSubmit()
        }
        return next
      })
    }, 1000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, selectedCandidate])

  // Keyboard shortcuts
  useEffect(() => {
    if (phase !== 'in-progress' || checked) return
    const handler = (e: KeyboardEvent) => {
      const map: Record<string, number> = { '1': 0, '2': 1, '3': 2, '4': 3, 'a': 0, 'b': 1, 'c': 2, 'd': 3 }
      if (e.key in map) setSelectedOption(map[e.key])
      if (e.key === 'Enter' && selectedOption !== null) handleCheck()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, checked, selectedOption])

  const handleCheck = () => {
    if (selectedOption === null || !quiz) return
    const question = quiz.questions[currentQ]
    const isCorrect = selectedOption === question.correctOptionIndex

    if (isCorrect) {
      setStreak((s) => s + 1)
      playCorrect()
    } else {
      setStreak(0)
      playWrong()
    }

    setAnswers((prev) => [...prev, {
      questionIndex: currentQ,
      selectedOption,
      isCorrect,
      topicTag: question.topicTag,
    }])
    setChecked(true)
  }

  const handleContinue = () => {
    if (!quiz) return
    if (currentQ + 1 >= quiz.questions.length) {
      handleSubmit()
    } else {
      setCurrentQ((q) => q + 1)
      setSelectedOption(null)
      setChecked(false)
    }
  }

  const handleSubmit = async () => {
    if (!quiz) return
    playFanfare()
    const timeTaken = Math.round((Date.now() - startTime) / 1000)
    localStorage.removeItem(`timer-${quizId}-${selectedCandidate}`)

    const res = await fetch('/api/quiz/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quizId,
        programCode: code,
        candidateName: selectedCandidate,
        answers,
        timeTakenSeconds: timeTaken,
      }),
    })
    const data = await res.json()
    setResult({ percentage: data.percentage, score: data.attempt?.score, total: data.attempt?.totalQuestions })
    setPhase('completed')
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  const optionLabels = ['A', 'B', 'C', 'D']
  const question = quiz?.questions[currentQ]
  const progress = quiz ? ((answers.length) / quiz.questions.length) * 100 : 0
  const isCorrect = checked && selectedOption !== null && question && selectedOption === question.correctOptionIndex

  const [nameInput, setNameInput] = useState('')
  const [recentUsers, setRecentUsers] = useState<string[]>([])

  // Load recent users from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('sibaq_saved_users') || '[]')
      if (Array.isArray(saved) && saved.length > 0) {
        setRecentUsers(saved)
        setNameInput((prev) => (prev ? prev : saved[0]))
      }
    } catch {
      // ignore
    }
  }, [])

  const handleStartWithUser = (nameToUse: string) => {
    const cleanName = nameToUse.trim()
    if (!cleanName) return

    try {
      const updated = [cleanName, ...recentUsers.filter((u) => u.toLowerCase() !== cleanName.toLowerCase())].slice(0, 8)
      localStorage.setItem('sibaq_saved_users', JSON.stringify(updated))
      setRecentUsers(updated)
    } catch {
      // ignore
    }

    setSelectedCandidate(cleanName)
    setPhase('in-progress')
  }

  // ── Phase: Select Candidate ──
  if (phase === 'select-candidate') {
    const allSuggestions = Array.from(
      new Set([...recentUsers, ...candidates.map((c) => c.name)])
    ).filter(Boolean)

    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6" style={{ background: '#F7F7F5' }}>
        <div className="w-full max-w-lg">
          <Link href={`/programs/${code}`} className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm font-semibold mb-5 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Program Hub
          </Link>

          {/* Quiz Header Card */}
          <div className="bg-white rounded-2xl border-2 border-slate-200 border-b-4 border-b-slate-300 p-5 mb-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs font-mono font-bold bg-sky-100 text-sky-700 border border-sky-200 px-2.5 py-0.5 rounded-lg">
                {code}
              </span>
              <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${getDifficultyBadge(quiz?.difficulty)}`}>
                {quiz?.difficulty || 'medium'}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                SIBAQ &apos;26 Assessment
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 mb-1">{quiz?.title || 'Loading Quiz...'}</h1>
            <p className="text-slate-500 text-xs">
              ⏱ {quiz?.durationMinutes || 45} Minutes · 📝 {quiz?.questions.length || 0} Questions · 🎯 Instant Duolingo-style Feedback
            </p>
          </div>

          {/* Name Entry Card */}
          <div className="bg-white rounded-2xl border-2 border-sky-300 border-b-4 border-b-sky-500 p-5 mb-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">👤</span>
              <h2 className="text-base font-black text-slate-800">Enter Your Name</h2>
            </div>
            <p className="text-slate-500 text-xs mb-3">
              We save your profile to track your marks, streaks, and weakness analytics for this syllabus.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleStartWithUser(nameInput)
              }}
              className="space-y-3"
            >
              <div className="relative">
                <input
                  type="text"
                  list="candidate-suggestions"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="e.g. Sahal, Fadil, Ashif KC..."
                  className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-4 py-3 text-base font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white transition-all shadow-inner"
                  autoFocus
                />
                <datalist id="candidate-suggestions">
                  {allSuggestions.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>

              {/* Quick suggestions pills */}
              {allSuggestions.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                    Suggested Profiles (click to select):
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {allSuggestions.map((name) => {
                      const isSelected = nameInput.trim().toLowerCase() === name.toLowerCase()
                      return (
                        <button
                          key={name}
                          type="button"
                          onClick={() => setNameInput(name)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl border-2 border-b-4 transition-all duration-100 active:border-b-2 active:translate-y-[2px] ${
                            isSelected
                              ? 'bg-sky-500 border-sky-600 border-b-sky-700 text-white shadow-sm'
                              : 'bg-slate-100 border-slate-200 border-b-slate-300 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          👤 {name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <TactileButton
                type="submit"
                accentColor="emerald"
                size="lg"
                fullWidth
                disabled={!nameInput.trim()}
              >
                Start Quiz as &ldquo;{nameInput.trim() || 'Student'}&rdquo; →
              </TactileButton>
            </form>
          </div>

          {/* Enrolled Candidates List (Alternative Quick Start) */}
          {candidates.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 px-1">
                Or Select Enrolled Candidate:
              </p>
              <div className="space-y-2">
                {candidates.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleStartWithUser(c.name)}
                    className="w-full flex items-center gap-3 p-3.5 bg-white border-2 border-slate-200 border-b-4 border-b-slate-300 rounded-2xl hover:border-sky-300 hover:border-b-sky-400 text-left transition-all duration-150 active:border-b-2 active:translate-y-[2px]"
                  >
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-sm" style={{ backgroundColor: c.avatarColor }}>
                      {c.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-800 text-sm truncate">{c.name}</div>
                      <div className="text-xs text-slate-400">🔥 {c.streakDays}d streak · {c.regNo || 'Enrolled'}</div>
                    </div>
                    <AccuracyRing pct={c.overallAccuracy} accentColor={accentColor} size={40} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    )
  }

  // ── Phase: Completed ──
  if (phase === 'completed' && result) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: '#F7F7F5' }}>
        <div className="w-full max-w-md text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Quiz Complete!</h1>
          <p className="text-slate-500 mb-8">{selectedCandidate} · {quiz?.title}</p>

          <div className="bg-white border-2 border-slate-200 border-b-4 border-b-slate-300 rounded-2xl p-8 mb-6">
            <AccuracyRing pct={result.percentage} accentColor={accentColor} size={96} strokeWidth={8} />
            <div className="mt-4 text-slate-600 font-semibold">
              {result.score} out of {result.total} correct
            </div>
            <div className={`mt-2 text-sm font-bold ${result.percentage >= 70 ? 'text-green-600' : 'text-amber-600'}`}>
              {result.percentage >= 80 ? '🌟 Excellent!' : result.percentage >= 70 ? '👍 Good Work!' : '📚 Keep Practicing!'}
            </div>
          </div>

          <Link href={`/programs/${code}`}>
            <TactileButton accentColor={accentColor as 'emerald' | 'sky' | 'amber' | 'purple' | 'coral' | 'slate'} fullWidth size="lg">
              ← Back to Program Hub
            </TactileButton>
          </Link>
        </div>
      </main>
    )
  }

  // ── Phase: In Progress ──
  if (!quiz || !question) {
    return <div className="min-h-screen flex items-center justify-center">Loading quiz...</div>
  }

  return (
    <main className="min-h-screen flex flex-col" style={{ background: '#F7F7F5' }}>
      {/* Sticky top bar */}
      <div className="sticky top-0 z-30 bg-white border-b-2 border-slate-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3">
          {/* Progress bar */}
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-[#58CC02] rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Link href={`/programs/${code}`} className="text-slate-400 hover:text-slate-600">
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${getDifficultyBadge(quiz?.difficulty)}`}>
                {quiz?.difficulty || 'medium'}
              </span>
              {streak > 1 && (
                <span className="flex items-center gap-1 text-xs font-black text-amber-600">
                  <Flame className="w-3.5 h-3.5" /> {streak} in a row!
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className={`flex items-center gap-1 text-sm font-bold font-mono ${timer < 60 ? 'text-red-500' : 'text-slate-600'}`}>
                <Clock className="w-3.5 h-3.5" /> {formatTime(timer)}
              </span>
              <button onClick={() => setMuted(!muted)} className="text-slate-400 hover:text-slate-600">
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <span className="text-xs text-slate-400 font-bold">{currentQ + 1}/{quiz.questions.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Question area */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        {/* Topic badge */}
        <div className="mb-4">
          <span className="text-xs font-bold bg-sky-100 text-sky-700 px-3 py-1.5 rounded-full border border-sky-200">
            {question.topicTag}
          </span>
        </div>

        {/* Question text */}
        <div className="bg-white border-2 border-slate-200 border-b-4 border-b-slate-300 rounded-2xl p-6 mb-5 shadow-sm">
          <p className="text-lg font-bold text-slate-800 leading-relaxed">{question.questionText}</p>
        </div>

        {/* Options */}
        <div className="space-y-3 mb-5">
          {question.options.map((opt, idx) => {
            let btnClass = 'bg-white border-slate-200 border-b-slate-300 text-slate-700 hover:border-slate-300'

            if (checked) {
              if (idx === question.correctOptionIndex) {
                btnClass = 'bg-green-50 border-[#58CC02] border-b-[#46A302] text-green-800'
              } else if (idx === selectedOption && !isCorrect) {
                btnClass = 'bg-red-50 border-[#FF4B4B] border-b-[#EA2B2B] text-red-800'
              } else {
                btnClass = 'bg-white border-slate-100 border-b-slate-200 text-slate-400'
              }
            } else if (selectedOption === idx) {
              btnClass = 'bg-sky-50 border-sky-400 border-b-sky-500 text-sky-800'
            }

            return (
              <button
                key={idx}
                onClick={() => !checked && setSelectedOption(idx)}
                disabled={checked}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-b-4 text-left transition-all duration-100 active:border-b-2 active:translate-y-[2px] disabled:cursor-default ${btnClass}`}
              >
                <span className="w-7 h-7 flex-shrink-0 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-black text-slate-600">
                  {optionLabels[idx]}
                </span>
                <span className="text-sm font-semibold leading-snug">{opt}</span>
              </button>
            )
          })}
        </div>

        {/* CHECK / CONTINUE button */}
        {!checked ? (
          <TactileButton
            accentColor="emerald"
            fullWidth
            size="lg"
            onClick={handleCheck}
            disabled={selectedOption === null}
          >
            CHECK
          </TactileButton>
        ) : (
          <div className={`rounded-2xl border-2 border-b-4 p-4 mb-4 ${isCorrect ? 'bg-green-50 border-[#58CC02] border-b-[#46A302]' : 'bg-red-50 border-[#FF4B4B] border-b-[#EA2B2B]'}`}>
            <div className={`font-black text-base mb-1 ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
              {isCorrect ? '🎉 AMAZING!' : '❌ INCORRECT'}
            </div>
            <p className="text-sm text-slate-700 leading-relaxed mb-3">{question.explanation}</p>
            <TactileButton
              accentColor={isCorrect ? 'emerald' : 'coral'}
              fullWidth
              onClick={handleContinue}
            >
              CONTINUE →
            </TactileButton>
          </div>
        )}
      </div>
    </main>
  )
}
