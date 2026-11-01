'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  X,
  Volume2,
  VolumeX,
  Clock,
  Flame,
  User,
  CheckCircle2,
  XCircle,
  Award,
  ChevronRight,
} from 'lucide-react'
import AccuracyRing from '@/components/ui/AccuracyRing'
import {
  playSelectOption,
  playCorrectSound,
  playWrongSound,
  playVictoryFanfare,
  playClickPop,
  isMuted,
  toggleMute,
} from '@/lib/sounds'

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
  const code = (params.code as string)?.toUpperCase()
  const quizId = params.quizId as string

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [phase, setPhase] = useState<Phase>('select-candidate')
  const [selectedCandidate, setSelectedCandidate] = useState('')
  const [currentQ, setCurrentQ] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [checked, setChecked] = useState(false)
  const [answers, setAnswers] = useState<
    { questionIndex: number; selectedOption: number; isCorrect: boolean; topicTag: string }[]
  >([])
  const [streak, setStreak] = useState(0)
  const [timer, setTimer] = useState(3600)
  const [soundMuted, setSoundMuted] = useState(false)
  const [startTime] = useState(Date.now())
  const [result, setResult] = useState<{ percentage: number; score: number; total: number } | null>(
    null
  )

  const [nameInput, setNameInput] = useState('')
  const [recentUsers, setRecentUsers] = useState<string[]>([])

  // Initialize sound mute state
  useEffect(() => {
    setSoundMuted(isMuted())
    const handleMute = () => setSoundMuted(isMuted())
    window.addEventListener('sst-mute-change', handleMute)
    return () => window.removeEventListener('sst-mute-change', handleMute)
  }, [])

  const handleSoundToggle = () => {
    const next = toggleMute()
    setSoundMuted(next)
    if (!next) {
      playClickPop()
    }
  }

  // Load quiz data
  useEffect(() => {
    fetch(`/api/programs/${code}`)
      .then((r) => r.json())
      .then((data) => {
        const q = data.quizzes?.find((qz: Quiz) => qz._id === quizId)
        if (q) {
          setQuiz(q)
          setTimer((q.durationMinutes || 60) * 60)
        }
        setCandidates(data.program?.candidates || [])
      })
      .catch((e) => console.error('Failed to load quiz:', e))
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
      const map: Record<string, number> = {
        '1': 0,
        '2': 1,
        '3': 2,
        '4': 3,
        a: 0,
        b: 1,
        c: 2,
        d: 3,
        A: 0,
        B: 1,
        C: 2,
        D: 3,
      }
      if (e.key in map) {
        playSelectOption()
        setSelectedOption(map[e.key])
      }
      if (e.key === 'Enter' && selectedOption !== null) {
        handleCheck()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, checked, selectedOption])

  // Load recent users
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
    playClickPop()

    try {
      const updated = [
        cleanName,
        ...recentUsers.filter((u) => u.toLowerCase() !== cleanName.toLowerCase()),
      ].slice(0, 8)
      localStorage.setItem('sibaq_saved_users', JSON.stringify(updated))
      setRecentUsers(updated)
    } catch {
      // ignore
    }

    setSelectedCandidate(cleanName)
    setPhase('in-progress')
  }

  const handleSelectOptionClick = (idx: number) => {
    if (checked) return
    playSelectOption()
    setSelectedOption(idx)
  }

  const handleCheck = () => {
    if (selectedOption === null || !quiz) return
    const question = quiz.questions[currentQ]
    const isAnsCorrect = selectedOption === question.correctOptionIndex

    if (isAnsCorrect) {
      setStreak((s) => s + 1)
      playCorrectSound()
    } else {
      setStreak(0)
      playWrongSound()
    }

    setAnswers((prev) => [
      ...prev,
      {
        questionIndex: currentQ,
        selectedOption,
        isCorrect: isAnsCorrect,
        topicTag: question.topicTag,
      },
    ])
    setChecked(true)
  }

  const handleContinue = () => {
    playClickPop()
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
    playVictoryFanfare()
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
    setResult({
      percentage: data.percentage,
      score: data.attempt?.score,
      total: data.attempt?.totalQuestions,
    })
    setPhase('completed')
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  const optionLabels = ['A', 'B', 'C', 'D']
  const question = quiz?.questions[currentQ]
  const progressPct = quiz && quiz.questions.length ? (answers.length / quiz.questions.length) * 100 : 0
  const isAnsCorrect =
    checked && selectedOption !== null && question && selectedOption === question.correctOptionIndex

  // ── PHASE 1: SELECT CANDIDATE ──
  if (phase === 'select-candidate') {
    const allSuggestions = Array.from(
      new Set([...recentUsers, ...candidates.map((c) => c.name)])
    ).filter(Boolean)

    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-[#F7F7F7] select-none">
        <div className="w-full max-w-lg">
          <Link
            href={`/programs/${code}`}
            onClick={() => playClickPop()}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#E5E5E5] text-[#777777] hover:text-[#4B4B4B] text-xs font-black uppercase tracking-wider mb-5 transition-colors"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
            <span>Cancel &amp; Return to Hub</span>
          </Link>

          {/* Quiz Header Card */}
          <div className="bg-white rounded-2xl border-2 border-[#E5E5E5] border-b-4 p-5 mb-5 shadow-xs">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs font-black px-3 py-1 rounded-xl bg-[#1CB0F6] border-b-2 border-[#1899D6] text-white uppercase tracking-wider">
                {code}
              </span>
              <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-xl bg-[#F7F7F7] border border-[#E5E5E5] text-[#4B4B4B]">
                {quiz?.difficulty || 'medium'}
              </span>
              <span className="text-xs font-extrabold text-[#777777] uppercase tracking-wider">
                SIBAQ &apos;26 Aliyah Assessment
              </span>
            </div>
            <h1 className="text-2xl font-black text-[#4B4B4B] uppercase tracking-tight mb-1">
              {quiz?.title || 'Loading Quiz...'}
            </h1>
            <p className="text-[#777777] text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <span>{quiz?.durationMinutes || 60} Minutes</span>
              <span>·</span>
              <span>{quiz?.questions.length || 0} Questions</span>
              <span>·</span>
              <span>Duolingo Physics &amp; Web Audio</span>
            </p>
          </div>

          {/* Name Entry Card */}
          <div className="bg-white rounded-2xl border-2 border-[#1CB0F6] border-b-4 p-5 mb-5 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-5 h-5 text-[#1CB0F6] stroke-[2.5]" />
              <h2 className="text-base font-black text-[#4B4B4B] uppercase tracking-wider">
                Select Candidate Profile
              </h2>
            </div>
            <p className="text-[#777777] text-xs font-bold mb-4">
              Your results will be logged to your candidate score card, streak, and mistake cache.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleStartWithUser(nameInput)
              }}
              className="space-y-3"
            >
              <input
                type="text"
                list="candidate-suggestions"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Candidate name (e.g. Sahal, Fadil, Ashif KC)..."
                className="w-full bg-[#F7F7F7] border-2 border-[#E5E5E5] rounded-xl px-4 py-3 text-sm font-bold text-[#4B4B4B] placeholder-[#777777] focus:outline-none focus:border-[#1CB0F6] focus:bg-white transition-all"
                autoFocus
              />
              <datalist id="candidate-suggestions">
                {allSuggestions.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>

              {/* Quick suggestions pills */}
              {allSuggestions.length > 0 && (
                <div>
                  <div className="text-[11px] font-black text-[#777777] uppercase tracking-wide mb-1.5">
                    Quick Select:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {allSuggestions.map((name) => {
                      const isSelected = nameInput.trim().toLowerCase() === name.toLowerCase()
                      return (
                        <button
                          key={name}
                          type="button"
                          onClick={() => {
                            playClickPop()
                            setNameInput(name)
                          }}
                          className={`text-xs font-black uppercase px-3 py-1.5 rounded-xl border-2 border-b-4 transition-all duration-75 active:border-b-0 active:translate-y-[4px] flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-[#1CB0F6] border-[#1899D6] text-white shadow-xs'
                              : 'bg-white border-[#E5E5E5] border-b-[#DCDCDC] text-[#4B4B4B] hover:bg-[#F7F7F7]'
                          }`}
                        >
                          <User className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>{name}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={!nameInput.trim()}
                className="w-full py-3.5 rounded-2xl bg-[#58CC02] border-2 border-[#58A700] border-b-4 text-white font-black text-xs sm:text-sm uppercase tracking-wider hover:bg-[#58A700] active:border-b-0 active:translate-y-[4px] transition-all duration-75 shadow-xs disabled:opacity-40 select-none"
              >
                Start Quiz as &ldquo;{nameInput.trim() || 'Student'}&rdquo; →
              </button>
            </form>
          </div>

          {/* Enrolled Candidates List */}
          {candidates.length > 0 && (
            <div>
              <p className="text-xs font-black text-[#777777] uppercase tracking-wide mb-2 px-1">
                Enrolled Candidates:
              </p>
              <div className="space-y-2">
                {candidates.map((c) => (
                  <button
                    key={c.id || c.name}
                    onClick={() => handleStartWithUser(c.name)}
                    className="w-full flex items-center gap-3 p-3.5 bg-white border-2 border-[#E5E5E5] border-b-4 rounded-2xl hover:border-[#1CB0F6] text-left transition-all duration-75 active:border-b-0 active:translate-y-[4px]"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-xs border border-black/10"
                      style={{ backgroundColor: c.avatarColor || '#1CB0F6' }}
                    >
                      {c.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-[#4B4B4B] text-sm truncate uppercase">{c.name}</div>
                      <div className="text-xs text-[#777777] font-bold flex items-center gap-1 mt-0.5">
                        <Flame className="w-3.5 h-3.5 text-[#FF9600] fill-[#FF9600] stroke-[2]" />
                        <span>{c.streakDays || 0}d streak · {c.regNo || 'Enrolled'}</span>
                      </div>
                    </div>
                    <AccuracyRing pct={c.overallAccuracy || 0} accentColor="sky" size={38} strokeWidth={3.5} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    )
  }

  // ── PHASE 2: COMPLETED ──
  if (phase === 'completed' && result) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#F7F7F7] select-none">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 rounded-3xl bg-[#58CC02] border-2 border-[#58A700] border-b-4 text-white flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Award className="w-10 h-10 stroke-[2.5]" />
          </div>
          <h1 className="text-3xl font-black text-[#4B4B4B] uppercase tracking-tight mb-1">
            Quiz Complete!
          </h1>
          <p className="text-xs font-extrabold text-[#777777] uppercase tracking-wider mb-6">
            {selectedCandidate} · {quiz?.title}
          </p>

          <div className="bg-white border-2 border-[#E5E5E5] border-b-[6px] rounded-2xl p-8 mb-6 shadow-xs">
            <div className="flex justify-center mb-4">
              <AccuracyRing pct={result.percentage} accentColor="sky" size={100} strokeWidth={8} />
            </div>
            <div className="text-2xl font-black text-[#4B4B4B]">
              {result.score} / {result.total} Correct
            </div>
            <div
              className={`mt-2 text-sm font-black uppercase tracking-wider ${
                result.percentage >= 75 ? 'text-[#58CC02]' : 'text-[#FF9600]'
              }`}
            >
              {result.percentage >= 90
                ? 'Excellent Olympiad Mastery!'
                : result.percentage >= 75
                ? 'Good Work! Championship Pace.'
                : 'Keep Practicing! Review Errors.'}
            </div>
          </div>

          <Link href={`/programs/${code}`} onClick={() => playClickPop()}>
            <button className="w-full py-4 rounded-2xl bg-[#58CC02] border-2 border-[#58A700] border-b-4 text-white font-black text-sm uppercase tracking-wider hover:bg-[#58A700] active:border-b-0 active:translate-y-[4px] transition-all duration-75 shadow-xs select-none">
              ← Return to Program Hub
            </button>
          </Link>
        </div>
      </main>
    )
  }

  // ── PHASE 3: IN PROGRESS (Duolingo Quiz UI) ──
  if (!quiz || !question) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7F7] text-xs font-black uppercase tracking-wider text-[#777777]">
        Loading Quiz...
      </div>
    )
  }

  return (
    <main className="min-h-screen flex flex-col bg-[#F7F7F7] select-none pb-36">
      {/* Duolingo Sticky Top Bar */}
      <div className="sticky top-0 z-30 bg-white border-b-2 border-[#E5E5E5] shadow-xs">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Close (X) button */}
            <Link
              href={`/programs/${code}`}
              onClick={() => playClickPop()}
              className="w-9 h-9 rounded-xl bg-white border-2 border-[#E5E5E5] border-b-4 flex items-center justify-center text-[#777777] hover:bg-[#F7F7F7] hover:text-[#4B4B4B] transition-colors shrink-0"
              title="Exit Quiz"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </Link>

            {/* Chunky Duolingo Progress Bar with top highlight reflection */}
            <div className="flex-1 h-5 bg-[#E5E5E5] rounded-full p-1 border-2 border-[#E5E5E5]">
              <div
                className="h-full bg-[#58CC02] rounded-full transition-all duration-300 relative overflow-hidden"
                style={{ width: `${progressPct}%` }}
              >
                <div className="bg-white/35 h-1.5 rounded-full mx-1.5 mt-0.5" />
              </div>
            </div>

            {/* Streak Counter (Fox Orange) */}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#FFF0D6] border border-[#FF9600] text-[#FF9600] text-xs font-black">
              <Flame className="w-4 h-4 fill-[#FF9600] stroke-[2]" />
              <span>{streak}</span>
            </div>

            {/* 60-Min Timer Pill (Macaw Blue) */}
            <div
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border text-xs font-mono font-black ${
                timer < 180
                  ? 'bg-[#FFDFE0] border-[#FF4B4B] text-[#FF4B4B] animate-pulse'
                  : 'bg-[#DDF4FF] border-[#1CB0F6] text-[#1899D6]'
              }`}
            >
              <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{formatTime(timer)}</span>
            </div>

            {/* Sound Mute/Unmute */}
            <button
              onClick={handleSoundToggle}
              className="w-9 h-9 rounded-xl bg-white border-2 border-[#E5E5E5] border-b-4 flex items-center justify-center text-[#777777] hover:bg-[#F7F7F7] hover:text-[#4B4B4B] transition-colors shrink-0"
              title={soundMuted ? 'Unmute' : 'Mute'}
            >
              {soundMuted ? (
                <VolumeX className="w-4 h-4 text-[#FF4B4B] stroke-[2.5]" />
              ) : (
                <Volume2 className="w-4 h-4 text-[#58CC02] stroke-[2.5]" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Question Area */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        {/* Topic Tag & Counter */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <span className="text-xs font-black uppercase px-3 py-1 rounded-xl bg-[#DDF4FF] border border-[#1CB0F6] text-[#1899D6]">
            {question.topicTag}
          </span>
          <span className="text-xs font-black uppercase text-[#777777]">
            Question {currentQ + 1} of {quiz.questions.length}
          </span>
        </div>

        {/* Question Stem & Text */}
        <div className="bg-white border-2 border-[#E5E5E5] border-b-4 rounded-2xl p-6 mb-5 shadow-xs">
          {question.questionStem && (
            <p className="text-xs font-black uppercase text-[#777777] mb-2 tracking-wider">
              {question.questionStem}
            </p>
          )}
          <p className="text-lg sm:text-xl font-black text-[#4B4B4B] leading-relaxed">
            {question.questionText}
          </p>
        </div>

        {/* 3D Option Buttons */}
        <div className="space-y-3 mb-6">
          {question.options.map((opt, idx) => {
            let optionStyle =
              'bg-white border-[#E5E5E5] border-b-[#DCDCDC] text-[#4B4B4B] hover:bg-[#F7F7F7]'

            if (checked) {
              if (idx === question.correctOptionIndex) {
                optionStyle = 'bg-[#D7FFB8] border-[#58CC02] border-b-[#58A700] text-[#58A700]'
              } else if (idx === selectedOption && !isAnsCorrect) {
                optionStyle = 'bg-[#FFDFE0] border-[#FF4B4B] border-b-[#EA2B2B] text-[#EA2B2B]'
              } else {
                optionStyle = 'bg-white border-[#E5E5E5] border-b-[#DCDCDC] text-[#777777] opacity-50'
              }
            } else if (selectedOption === idx) {
              optionStyle =
                'bg-[#DDF4FF] border-[#1CB0F6] border-b-[#1899D6] text-[#1899D6]'
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelectOptionClick(idx)}
                disabled={checked}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-b-4 text-left transition-all duration-75 active:border-b-0 active:translate-y-[4px] disabled:cursor-default select-none ${optionStyle}`}
              >
                <span
                  className={`w-8 h-8 shrink-0 rounded-xl flex items-center justify-center text-xs font-black uppercase border ${
                    selectedOption === idx && !checked
                      ? 'bg-[#1CB0F6] border-[#1899D6] text-white'
                      : 'bg-[#F7F7F7] border-[#E5E5E5] text-[#777777]'
                  }`}
                >
                  {optionLabels[idx]}
                </span>
                <span className="text-sm font-black leading-snug">{opt}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Duolingo Full-Width Slide-Up Bottom Check Sheet */}
      <div
        className={`fixed bottom-0 inset-x-0 z-40 p-4 sm:p-5 transition-all duration-200 border-t-2 select-none ${
          !checked
            ? 'bg-white border-[#E5E5E5]'
            : isAnsCorrect
            ? 'bg-[#D7FFB8] border-[#58CC02]'
            : 'bg-[#FFDFE0] border-[#FF4B4B]'
        }`}
      >
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {!checked ? (
            <div className="flex-1 text-xs font-black uppercase text-[#777777]">
              Select an option and click CHECK (or press 1-4 / A-D)
            </div>
          ) : (
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {isAnsCorrect ? (
                  <>
                    <CheckCircle2 className="w-6 h-6 text-[#58CC02] stroke-[2.5]" />
                    <span className="text-lg font-black text-[#58A700] uppercase tracking-wide">
                      AMAZING!
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-6 h-6 text-[#FF4B4B] stroke-[2.5]" />
                    <span className="text-lg font-black text-[#EA2B2B] uppercase tracking-wide">
                      CORRECT ANSWER:
                    </span>
                  </>
                )}
              </div>
              {!isAnsCorrect && (
                <div className="text-xs font-black text-[#EA2B2B] mb-1">
                  {question.options[question.correctOptionIndex]}
                </div>
              )}
              {question.explanation && (
                <p className="text-xs font-bold text-[#4B4B4B] leading-relaxed">
                  {question.explanation}
                </p>
              )}
            </div>
          )}

          {!checked ? (
            <button
              onClick={handleCheck}
              disabled={selectedOption === null}
              className={`px-8 py-3.5 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all duration-75 border-b-4 active:border-b-0 active:translate-y-[4px] ${
                selectedOption === null
                  ? 'bg-[#E5E5E5] border-[#DCDCDC] text-[#777777] cursor-not-allowed'
                  : 'bg-[#58CC02] border-[#58A700] text-white hover:bg-[#58A700]'
              }`}
            >
              CHECK
            </button>
          ) : (
            <button
              onClick={handleContinue}
              className={`px-8 py-3.5 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all duration-75 border-b-4 active:border-b-0 active:translate-y-[4px] text-white flex items-center justify-center gap-2 ${
                isAnsCorrect
                  ? 'bg-[#58CC02] border-[#58A700] hover:bg-[#58A700]'
                  : 'bg-[#FF4B4B] border-[#EA2B2B] hover:bg-[#EA2B2B]'
              }`}
            >
              <span>CONTINUE</span>
              <ChevronRight className="w-4 h-4 stroke-[3]" />
            </button>
          )}
        </div>
      </div>
    </main>
  )
}
