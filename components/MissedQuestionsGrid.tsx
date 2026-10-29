'use client'

import { useState } from 'react'
import { IAttempt, IQuiz } from '@/models'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { format } from 'date-fns'

interface MissedQuestionsGridProps {
  attempts: IAttempt[]
  quizzes: IQuiz[]
  candidateName: string
}

export default function MissedQuestionsGrid({ attempts, quizzes, candidateName }: MissedQuestionsGridProps) {
  const [openAttemptId, setOpenAttemptId] = useState<string | null>(null)

  const filtered = attempts
    .filter((a) => candidateName === 'All' || a.candidateName === candidateName)
    .slice()
    .reverse()

  if (filtered.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <div className="text-3xl mb-2">📝</div>
        <p className="text-sm">No quiz attempts yet. Take a quiz to review missed questions.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {filtered.map((attempt) => {
        const quiz = quizzes.find((q) => q._id?.toString() === attempt.quizId?.toString())
        const missedAnswers = attempt.answers.filter((a) => !a.isCorrect)
        const attemptId = attempt._id?.toString() || Math.random().toString()
        const isOpen = openAttemptId === attemptId

        return (
          <div key={attemptId} className="border-2 border-slate-200 border-b-4 border-b-slate-300 rounded-2xl overflow-hidden">
            {/* Attempt row header */}
            <button
              onClick={() => setOpenAttemptId(isOpen ? null : attemptId)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`text-sm font-black px-2.5 py-1 rounded-lg ${
                    attempt.percentage >= 70
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-600'
                  }`}
                >
                  {attempt.percentage}%
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800">
                    {quiz?.title || 'Quiz'}
                  </div>
                  <div className="text-xs text-slate-400">
                    {format(new Date(attempt.submittedAt), 'MMM d, yyyy')} · {attempt.candidateName} · {attempt.score}/{attempt.totalQuestions} correct
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {missedAnswers.length > 0 && (
                  <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                    {missedAnswers.length} missed
                  </span>
                )}
                {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </div>
            </button>

            {/* Expanded missed questions */}
            {isOpen && missedAnswers.length > 0 && (
              <div className="border-t border-slate-100 p-4 space-y-3">
                {missedAnswers.map((ans) => {
                  const question = quiz?.questions[ans.questionIndex]
                  if (!question) return null

                  return (
                    <div
                      key={ans.questionIndex}
                      className="rounded-xl border-2 border-[#FF4B4B] border-b-4 border-b-[#EA2B2B] p-4"
                      style={{ background: '#FFF0F0' }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                          {question.topicTag}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-800 mb-3">{question.questionText}</p>

                      <div className="space-y-1.5 text-sm">
                        <div className="flex items-start gap-2">
                          <span className="text-red-500 font-bold flex-shrink-0">❌</span>
                          <span className="text-red-700">
                            You selected: <span className="font-semibold">{question.options[ans.selectedOption]}</span>
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-green-600 font-bold flex-shrink-0">✅</span>
                          <span className="text-green-700">
                            Correct: <span className="font-semibold">{question.options[question.correctOptionIndex]}</span>
                          </span>
                        </div>
                        <div className="flex items-start gap-2 mt-2 pt-2 border-t border-red-100">
                          <span className="text-amber-500 flex-shrink-0">💡</span>
                          <span className="text-slate-600 text-xs leading-relaxed">{question.explanation}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {isOpen && missedAnswers.length === 0 && (
              <div className="border-t border-slate-100 p-4 text-center text-sm text-green-600 font-semibold">
                🎉 Perfect score! All questions answered correctly.
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
