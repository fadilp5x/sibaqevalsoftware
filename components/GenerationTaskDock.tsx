'use client'

import { useState, useEffect } from 'react'
import {
  Zap,
  Maximize2,
  CheckCircle2,
  X,
  Play,
  Clock,
} from 'lucide-react'
import { playClickPop } from '@/lib/sounds'
import Link from 'next/link'

export interface GenerationTaskState {
  isActive: boolean
  isCompleted: boolean
  programCode: string
  candidateName: string
  difficulty: string
  questionCount: number
  language: string
  stage: number
  stageText: string
  progress: number
  elapsedSeconds: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  generatedQuiz?: any
  error?: string
}

interface GenerationTaskDockProps {
  task: GenerationTaskState
  onExpandModal: () => void
  onDismiss: () => void
}

export default function GenerationTaskDock({
  task,
  onExpandModal,
  onDismiss,
}: GenerationTaskDockProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (task.isActive || task.isCompleted) {
      setVisible(true)
    }
  }, [task.isActive, task.isCompleted])

  if (!visible || (!task.isActive && !task.isCompleted)) {
    return null
  }

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}s`
  }

  const isDone = task.isCompleted && task.generatedQuiz

  return (
    <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-lg w-[calc(100%-2rem)] animate-in slide-in-from-bottom duration-300 select-none">
      <div
        className={`rounded-2xl border-2 border-b-[5px] p-3.5 sm:p-4 shadow-xl transition-all duration-200 ${
          isDone
            ? 'bg-[#D7FFB8] border-[#58CC02] border-b-[#468500]'
            : task.error
            ? 'bg-[#FFDFE0] border-[#FF4B4B] border-b-[#EA2B2B]'
            : 'bg-white border-[#1CB0F6] border-b-[#1899D6]'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          {/* Left Icon & Information */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border-b-2 ${
                isDone
                  ? 'bg-[#58CC02] text-white border-[#468500]'
                  : task.error
                  ? 'bg-[#FF4B4B] text-white border-[#EA2B2B]'
                  : 'bg-[#DDF4FF] text-[#1CB0F6] border-[#1899D6] animate-pulse'
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
              ) : task.error ? (
                <X className="w-5 h-5 stroke-[2.5]" />
              ) : (
                <Zap className="w-5 h-5 stroke-[2.5] fill-current" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-black/5 text-[#4B4B4B]">
                  {task.programCode} · {task.language.toUpperCase()}
                </span>
                <span className="text-xs font-black uppercase text-[#4B4B4B] truncate">
                  {task.candidateName}
                </span>
                <span className="text-[11px] font-mono font-bold text-[#777777] flex items-center gap-1 shrink-0 ml-auto">
                  <Clock className="w-3 h-3 stroke-[2]" />
                  {formatTimer(task.elapsedSeconds)}
                </span>
              </div>

              <p className="text-xs font-black text-[#4B4B4B] truncate mt-0.5">
                {isDone
                  ? `Quiz Ready! (${task.questionCount} Questions)`
                  : task.error
                  ? `Failed: ${task.error}`
                  : task.stageText || 'Generating assessment pipeline...'}
              </p>

              {/* Mini progress bar if active */}
              {!isDone && !task.error && (
                <div className="w-full bg-[#E5E5E5] h-1.5 rounded-full overflow-hidden mt-1.5">
                  <div
                    className="bg-[#1CB0F6] h-full rounded-full transition-all duration-300"
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {isDone ? (
              <Link
                href={`/programs/${task.programCode}/quiz/${task.generatedQuiz?._id}?candidate=${encodeURIComponent(task.candidateName)}`}
                onClick={() => playClickPop()}
              >
                <button className="px-3.5 py-2 rounded-xl bg-[#58CC02] border-b-4 border-[#468500] hover:bg-[#468500] text-white font-black text-xs uppercase tracking-wider active:border-b-0 active:translate-y-[2px] transition-all flex items-center gap-1.5 shadow-xs">
                  <Play className="w-3.5 h-3.5 fill-current stroke-[2.5]" />
                  <span>Start</span>
                </button>
              </Link>
            ) : (
              <button
                onClick={() => {
                  playClickPop()
                  onExpandModal()
                }}
                className="px-3 py-2 rounded-xl bg-white border-2 border-[#E5E5E5] border-b-4 text-[#4B4B4B] font-black text-xs uppercase tracking-wider hover:bg-[#F7F7F7] active:border-b-0 active:translate-y-[2px] transition-all flex items-center gap-1"
                title="Expand Generation Pipeline"
              >
                <Maximize2 className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden sm:inline">Details</span>
              </button>
            )}

            <button
              onClick={() => {
                playClickPop()
                setVisible(false)
                onDismiss()
              }}
              className="p-1.5 text-[#777777] hover:text-[#4B4B4B] rounded-lg transition-colors"
              title="Dismiss"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
