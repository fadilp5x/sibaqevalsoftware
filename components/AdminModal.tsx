'use client'

import { useState, useEffect } from 'react'
import {
  Shield,
  X,
  Trash2,
  Edit2,
  Check,
  Search,
  Users,
  Layers,
  Award,
  BookOpen,
  RotateCcw,
  Loader2,
  Flame,
} from 'lucide-react'

interface AdminModalProps {
  isOpen: boolean
  onClose: () => void
  onDataChanged?: () => void
}

type AdminTab = 'candidates' | 'programs' | 'quizzes' | 'attempts'

export default function AdminModal({ isOpen, onClose, onDataChanged }: AdminModalProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('candidates')
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [candidates, setCandidates] = useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [programs, setPrograms] = useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [quizzes, setQuizzes] = useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [materials, setMaterials] = useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [attempts, setAttempts] = useState<any[]>([])

  // Edit States
  const [editingCandidate, setEditingCandidate] = useState<{
    programCode: string
    originalName: string
    newName: string
    streakDays: number
    regNo: string
  } | null>(null)

  const [editingProgram, setEditingProgram] = useState<{
    code: string
    title: string
    conceptNote: string
    division: string
    category: string
  } | null>(null)

  const [actionMessage, setActionMessage] = useState('')

  // Fetch overview data directly when modal is opened
  const fetchOverview = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin')
      const data = await res.json()
      if (res.ok) {
        setCandidates(data.candidates || [])
        setPrograms(data.programs || [])
        setQuizzes(data.quizzes || [])
        setMaterials(data.materials || [])
        setAttempts(data.attempts || [])
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchOverview()
    }
  }, [isOpen])

  if (!isOpen) return null

  // ── Admin Actions ──
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const executeAdminAction = async (action: string, payload: any) => {
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          payload,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Action failed')

      setActionMessage(data.message || 'Updated successfully!')
      setTimeout(() => setActionMessage(''), 3000)
      await fetchOverview()
      if (onDataChanged) onDataChanged()
    } catch (err) {
      alert((err as Error).message)
    }
  }

  const handleDeleteCandidate = (programCode: string, candidateName: string) => {
    if (
      window.confirm(
        `Are you sure you want to permanently delete candidate "${candidateName}" and all their past quiz attempts?`
      )
    ) {
      executeAdminAction('deleteCandidate', { programCode, candidateName })
    }
  }

  const handleSaveEditCandidate = () => {
    if (!editingCandidate) return
    executeAdminAction('editCandidate', editingCandidate)
    setEditingCandidate(null)
  }

  const handleDeleteProgram = (code: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete program "${code}"? This will delete all its quizzes, study notes, and attempts.`
      )
    ) {
      executeAdminAction('deleteProgram', { code })
    }
  }

  const handleSaveEditProgram = () => {
    if (!editingProgram) return
    executeAdminAction('editProgram', editingProgram)
    setEditingProgram(null)
  }

  const handleDeleteQuiz = (quizId: string) => {
    if (window.confirm('Delete this quiz and all student attempts recorded for it?')) {
      executeAdminAction('deleteQuiz', { quizId })
    }
  }

  const handleDeleteMaterial = (materialId: string) => {
    if (window.confirm('Delete this study material?')) {
      executeAdminAction('deleteMaterial', { materialId })
    }
  }

  const handleDeleteAttempt = (attemptId: string) => {
    if (window.confirm('Delete this attempt record and recalculate student accuracy?')) {
      executeAdminAction('deleteAttempt', { attemptId })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl border-2 border-slate-200 border-b-4 border-b-slate-400 shadow-2xl max-w-4xl w-full my-6 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-sm">
              <Shield className="w-5 h-5 font-black" />
            </div>
            <div>
              <h2 className="text-lg font-black leading-tight">Admin Control Center</h2>
              <p className="text-xs text-slate-400">Manage candidates, clean mistakes &amp; calibrate records</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action message banner */}
        {actionMessage && (
          <div className="bg-green-50 border-b border-green-200 px-6 py-2.5 text-xs font-black text-green-700 flex items-center gap-2 animate-fade-in">
            <Check className="w-4 h-4 text-green-600" /> {actionMessage}
          </div>
        )}

        {/* ── Control Center Dashboard ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-6 pt-4 border-b border-slate-200 bg-slate-50">
              <div className="flex gap-2">
                {[
                  { id: 'candidates', label: `Candidates (${candidates.length})`, icon: <Users className="w-3.5 h-3.5" /> },
                  { id: 'programs', label: `Programs (${programs.length})`, icon: <Layers className="w-3.5 h-3.5" /> },
                  { id: 'quizzes', label: `Quizzes & Notes (${quizzes.length + materials.length})`, icon: <Award className="w-3.5 h-3.5" /> },
                  { id: 'attempts', label: `Attempts (${attempts.length})`, icon: <RotateCcw className="w-3.5 h-3.5" /> },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as AdminTab)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-black rounded-t-xl border-t-2 border-x-2 transition-all ${
                      activeTab === t.id
                        ? 'bg-white border-slate-300 text-slate-900 shadow-sm'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {t.icon}
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>

              {/* Search bar */}
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter records..."
                  className="bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-rose-500 w-48 sm:w-60"
                />
              </div>
            </div>

            {/* Scrollable Tab Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {loading && (
                <div className="text-center py-10 text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" /> Loading records...
                </div>
              )}

              {/* ── Tab 1: Candidates ── */}
              {activeTab === 'candidates' && (
                <div className="space-y-3">
                  {/* Inline candidate editor modal if active */}
                  {editingCandidate && (
                    <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl mb-4">
                      <h4 className="text-xs font-black text-amber-900 mb-2 flex items-center gap-1.5">
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit Candidate: {editingCandidate.originalName} ({editingCandidate.programCode})</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Name</label>
                          <input
                            type="text"
                            value={editingCandidate.newName}
                            onChange={(e) =>
                              setEditingCandidate({ ...editingCandidate, newName: e.target.value })
                            }
                            className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Reg No</label>
                          <input
                            type="text"
                            value={editingCandidate.regNo}
                            onChange={(e) =>
                              setEditingCandidate({ ...editingCandidate, regNo: e.target.value })
                            }
                            className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Streak Days</label>
                          <input
                            type="number"
                            value={editingCandidate.streakDays}
                            onChange={(e) =>
                              setEditingCandidate({
                                ...editingCandidate,
                                streakDays: Number(e.target.value),
                              })
                            }
                            className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setEditingCandidate(null)}
                          className="px-3 py-1 rounded-lg border border-slate-300 text-xs text-slate-600"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveEditCandidate}
                          className="px-3 py-1 bg-amber-500 text-slate-900 font-bold rounded-lg text-xs"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  )}

                  {candidates
                    .filter(
                      (c) =>
                        c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        c.programCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        c.regNo?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((c, i) => (
                      <div
                        key={c.id || i}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-slate-100 gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: c.avatarColor || '#1CB0F6' }}
                          >
                            {c.name?.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-sm text-slate-900">{c.name}</span>
                              <span className="text-[10px] bg-sky-100 text-sky-700 font-bold px-2 py-0.5 rounded-full border border-sky-200">
                                {c.programCode}
                              </span>
                              <span className="text-[10px] bg-slate-200 text-slate-600 font-mono px-1.5 py-0.5 rounded">
                                {c.regNo}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                              <span>{c.programTitle}</span>
                              <span>·</span>
                              <span className="inline-flex items-center gap-0.5">
                                <Flame className="w-3 h-3 text-[#FF6B4A]" />
                                {c.streakDays}d streak
                              </span>
                              <span>·</span>
                              <span>{c.overallAccuracy}% accuracy</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <button
                            onClick={() =>
                              setEditingCandidate({
                                programCode: c.programCode,
                                originalName: c.name,
                                newName: c.name,
                                streakDays: c.streakDays || 1,
                                regNo: c.regNo || '',
                              })
                            }
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
                          >
                            <Edit2 className="w-3 h-3" /> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCandidate(c.programCode, c.name)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 border border-rose-300 text-rose-700 rounded-xl text-xs font-bold hover:bg-rose-100"
                          >
                            <Trash2 className="w-3 h-3" /> Remove
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* ── Tab 2: Programs ── */}
              {activeTab === 'programs' && (
                <div className="space-y-3">
                  {/* Inline program editor */}
                  {editingProgram && (
                    <div className="p-4 bg-sky-50 border-2 border-sky-300 rounded-2xl mb-4 space-y-3">
                      <h4 className="text-xs font-black text-sky-900 flex items-center gap-1.5">
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit Program: {editingProgram.code}</span>
                      </h4>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Title</label>
                        <input
                          type="text"
                          value={editingProgram.title}
                          onChange={(e) =>
                            setEditingProgram({ ...editingProgram, title: e.target.value })
                          }
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Concept Note / Syllabus</label>
                        <textarea
                          rows={3}
                          value={editingProgram.conceptNote}
                          onChange={(e) =>
                            setEditingProgram({ ...editingProgram, conceptNote: e.target.value })
                          }
                          className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs"
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setEditingProgram(null)}
                          className="px-3 py-1 rounded-lg border border-slate-300 text-xs text-slate-600"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveEditProgram}
                          className="px-3 py-1 bg-sky-500 text-white font-bold rounded-lg text-xs"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  )}

                  {programs
                    .filter(
                      (p) =>
                        p.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.title?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((p) => (
                      <div
                        key={p.code}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-slate-100 gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono font-bold text-xs bg-slate-200 px-2 py-0.5 rounded">
                              {p.code}
                            </span>
                            <span className="font-black text-sm text-slate-900">{p.title}</span>
                            <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded">
                              {p.division}
                            </span>
                            <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded">
                              {p.category}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-1">{p.conceptNote}</p>
                          <div className="text-[11px] text-slate-400 mt-1">
                            {p.candidates?.length || 0} candidates enrolled · {p.durationMinutes}m · {p.skill}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                          <button
                            onClick={() =>
                              setEditingProgram({
                                code: p.code,
                                title: p.title,
                                conceptNote: p.conceptNote,
                                division: p.division,
                                category: p.category,
                              })
                            }
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
                          >
                            <Edit2 className="w-3 h-3" /> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProgram(p.code)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 border border-rose-300 text-rose-700 rounded-xl text-xs font-bold hover:bg-rose-100"
                          >
                            <Trash2 className="w-3 h-3" /> Delete Program
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* ── Tab 3: Quizzes & Materials ── */}
              {activeTab === 'quizzes' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide mb-2 flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-purple-600" /> Active AI Quizzes ({quizzes.length})
                    </h3>
                    <div className="space-y-2">
                      {quizzes.map((q) => (
                        <div
                          key={q._id}
                          className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] font-bold bg-slate-200 px-1.5 py-0.5 rounded">
                                {q.programCode}
                              </span>
                              <span className="font-bold text-xs text-slate-800">{q.title}</span>
                              <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-700">
                                {q.difficulty || 'medium'}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {q.questions?.length || 0} questions · {q.sessionWindow} · {q.aiModelUsed}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteQuiz(q._id)}
                            className="px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-600 rounded-lg text-xs font-bold hover:bg-rose-100 flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide mb-2 flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-sky-600" /> Uploaded Study Materials ({materials.length})
                    </h3>
                    <div className="space-y-2">
                      {materials.map((m) => (
                        <div
                          key={m._id}
                          className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] font-bold bg-slate-200 px-1.5 py-0.5 rounded">
                                {m.programCode}
                              </span>
                              <span className="font-bold text-xs text-slate-800">{m.title}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Uploaded by {m.uploadedBy} · {m.summaryCues?.length || 0} cues
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteMaterial(m._id)}
                            className="px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-600 rounded-lg text-xs font-bold hover:bg-rose-100 flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Tab 4: Attempts ── */}
              {activeTab === 'attempts' && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 mb-2">
                    Accidentally submitted an attempt that skewed your student&apos;s accuracy? Delete it here to immediately recalculate their baseline.
                  </p>
                  {attempts.map((att) => (
                    <div
                      key={att._id}
                      className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-center w-12">
                          <span
                            className={`text-xs font-black px-1.5 py-0.5 rounded ${
                              att.percentage >= 70 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {att.percentage}%
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-xs text-slate-800">{att.candidateName}</span>
                            <span className="font-mono text-[10px] bg-slate-200 px-1.5 py-0.2 rounded text-slate-600">
                              {att.programCode}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {att.score}/{att.totalQuestions} pts · {new Date(att.submittedAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteAttempt(att._id)}
                        className="px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-600 rounded-lg text-xs font-bold hover:bg-rose-100 flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
      </div>
    </div>
  )
}
