'use client'

import { useState } from 'react'
import { IAttempt, IQuiz } from '@/models'
import {
  ChevronDown,
  ChevronUp,
  FileText,
  XCircle,
  CheckCircle2,
  Lightbulb,
} from 'lucide-react'
import { format } from 'date-fns'

interface MissedQuestionsGridProps {
  attempts: IAttempt[]
  quizzes?: IQuiz[]
  candidateName: string
}

export default function MissedQuestionsGrid({
  attempts,
  quizzes = [],
  candidateName,
}: MissedQuestionsGridProps) {
  const [openAttemptId, setOpenAttemptId] = useState<string | null>(null)

  const filtered = attempts
    .filter((a) => !candidateName || candidateName === 'All' || a.candidateName === candidateName)
    .slice()
    .reverse()

  if (filtered.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400">
        <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" strokeWidth={1.75} />
        <p className="text-xs font-semibold">No quiz attempts yet. Complete a quiz to analyze weak points.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h4 className="text-sm font-black text-[#1E2538]">Recent Assessment Breakdown</h4>
        <span className="text-xs text-slate-400 font-medium">{filtered.length} attempts recorded</span>
      </div>

      {filtered.map((attempt) => {
        const quiz = quizzes.find((q) => q._id?.toString() === attempt.quizId?.toString())
        const missedAnswers = (attempt.answers || []).filter((a) => !a.isCorrect)
        const attemptId = attempt._id ? String(attempt._id) : String(Math.random())
        const isOpen = openAttemptId === attemptId

        return (
          <div
            key={attemptId}
            className="border-2 border-slate-200/90 rounded-3xl bg-white overflow-hidden shadow-xs"
          >
            {/* Attempt row header */}
            <button
              onClick={() => setOpenAttemptId(isOpen ? null : attemptId)}
              className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-slate-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`text-sm font-black px-2.5 py-1 rounded-xl border ${
                    attempt.percentage >= 75
                      ? 'bg-[#00A896]/10 text-[#00A896] border-[#00A896]/30'
                      : attempt.percentage >= 50
                      ? 'bg-amber-500/10 text-amber-700 border-amber-500/30'
                      : 'bg-rose-500/10 text-rose-600 border-rose-500/30'
                  }`}
                >
                  {attempt.percentage}%
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-black text-[#1E2538]">
                    {quiz?.title || `Quiz Drill (${attempt.score}/${attempt.totalQuestions})`}
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium">
                    {format(new Date(attempt.submittedAt), 'MMM d, yyyy')} · {attempt.candidateName} · {attempt.score}/{attempt.totalQuestions} correct
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {missedAnswers.length > 0 && (
                  <span className="text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-200 px-2.5 py-0.5 rounded-full">
                    {missedAnswers.length} missed
                  </span>
                )}
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </button>

            {/* Expanded missed questions */}
            {isOpen && missedAnswers.length > 0 && (
              <div className="border-t border-slate-100 p-4 sm:p-5 space-y-3 bg-[#FAF9F6]">
                {missedAnswers.map((ans, idx) => {
                  const question = quiz?.questions ? quiz.questions[ans.questionIndex] : null

                  const isRtl =
                    quiz?.language === 'arabic' ||
                    quiz?.language === 'urdu' ||
                    /[\u0600-\u06FF]/.test(question?.questionText || '')

                  const typeLabel =
                    question?.questionType === 'fill_blank'
                      ? 'Fill in Blank'
                      : question?.questionType === 'statement_verify'
                      ? 'Statement Check'
                      : question?.questionType === 'assertion_reason'
                      ? 'Assertion-Reason'
                      : 'MCQ'

                  return (
                    <div
                      key={ans.questionIndex || idx}
                      className="rounded-2xl border-2 border-rose-200 bg-white p-4 shadow-xs"
                    >
                      <div className="flex flex-wrap items-center gap-1.5 mb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                          {ans.topicTag || question?.topicTag || 'General'}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-wider bg-[#DDF4FF] text-[#1899D6] border border-[#1CB0F6]/30 px-2 py-0.5 rounded-md">
                          {typeLabel}
                        </span>
                        {quiz?.language && (
                          <span className="text-[10px] font-black uppercase tracking-wider bg-[#FFF0D6] text-[#E58700] px-2 py-0.5 rounded-md">
                            {quiz.language}
                          </span>
                        )}
                      </div>
                      <p
                        dir={isRtl ? 'rtl' : 'ltr'}
                        className={`text-sm sm:text-base font-bold text-slate-900 mb-3 ${
                          isRtl ? 'text-right leading-loose' : 'text-left leading-relaxed'
                        }`}
                      >
                        {question?.questionText || `Question #${ans.questionIndex + 1}`}
                      </p>

                      <div className="space-y-2 text-xs">
                        <div
                          dir={isRtl ? 'rtl' : 'ltr'}
                          className={`flex items-start gap-2 text-rose-700 bg-rose-50/70 p-2.5 rounded-xl border border-rose-200/50 ${
                            isRtl ? 'text-right' : 'text-left'
                          }`}
                        >
                          <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" strokeWidth={2} />
                          <div>
                            <span className="font-bold">Your answer: </span>
                            <span>{question?.options ? question.options[ans.selectedOption] : `Option ${ans.selectedOption + 1}`}</span>
                          </div>
                        </div>

                        {question && (
                          <div
                            dir={isRtl ? 'rtl' : 'ltr'}
                            className={`flex items-start gap-2 text-[#00A896] bg-[#00A896]/10 p-2.5 rounded-xl border border-[#00A896]/30 ${
                              isRtl ? 'text-right' : 'text-left'
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4 text-[#00A896] shrink-0 mt-0.5" strokeWidth={2} />
                            <div>
                              <span className="font-bold">Correct answer: </span>
                              <span>{question.options[question.correctOptionIndex]}</span>
                            </div>
                          </div>
                        )}

                        {question?.explanation && (
                          <div
                            dir={isRtl ? 'rtl' : 'ltr'}
                            className={`flex items-start gap-2 mt-2 pt-2 text-slate-600 bg-amber-50/50 p-2.5 rounded-xl border border-amber-200/40 ${
                              isRtl ? 'text-right' : 'text-left'
                            }`}
                          >
                            <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" strokeWidth={2} />
                            <span className="text-[11px] leading-relaxed">{question.explanation}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {isOpen && missedAnswers.length === 0 && (
              <div className="border-t border-slate-100 p-5 text-center text-xs text-[#00A896] font-black flex items-center justify-center gap-2 bg-[#00A896]/5">
                <CheckCircle2 className="w-4 h-4 text-[#00A896]" />
                <span>Perfect score! All questions answered accurately.</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
