'use client'

import { useState } from 'react'
import { X, Plus, Trash2, Sparkles, BookOpen, Clock, Zap, Loader2, Check, AlertCircle } from 'lucide-react'
import { DivisionType } from '@/models'

interface PresetProgram {
  id: string
  code: string
  title: string
  division: DivisionType
  category: string
  durationMinutes: number
  skill: string
  accentColor: 'emerald' | 'sky' | 'amber' | 'purple' | 'rose'
  conceptNote: string
  suggestedCandidates?: { name: string; regNo: string }[]
}

const PRESET_PROGRAMS: PresetProgram[] = [
  // ── Aliyah Division ──
  {
    id: 'AX39',
    code: 'AX39',
    title: 'CIVIC QUEST',
    division: 'Aliyah',
    category: 'Category X',
    durationMinutes: 45,
    skill: 'General Awareness',
    accentColor: 'emerald',
    conceptNote:
      'Civic Quest is a quiz programme designed to assess participants\' knowledge of the Indian Constitution, constitutional provisions, and major areas of Indian law. Syllabus covers constitutional laws and common laws, Articles 1 to 130, major constitutional amendments, and judicial cases concerning Fundamental Rights and Personal Law.',
    suggestedCandidates: [{ name: 'Zidhan', regNo: 'AX39-001' }],
  },
  {
    id: 'AX40',
    code: 'AX40',
    title: 'Mr. ENGLISH',
    division: 'Aliyah',
    category: 'Category X',
    durationMinutes: 45,
    skill: 'Linguistics',
    accentColor: 'sky',
    conceptNote:
      "To test the candidate's proficiency across various domains of the English language. Candidate's ability to analyze literary texts and English literature, proficiency in grammar, expertise in translation, creative writing and rhetoric will be considered.",
    suggestedCandidates: [{ name: 'Sahal', regNo: 'AX40-001' }],
  },
  {
    id: 'AN35',
    code: 'AN35',
    title: 'LOGICAL REASONING',
    division: 'Aliyah',
    category: 'Category N',
    durationMinutes: 45,
    skill: 'Reasoning',
    accentColor: 'amber',
    conceptNote:
      "To test the candidate's ability to solve logical reasoning problems that require critical thinking, analytical skills and the application of logical principles. Includes syllogisms, logical sequences, puzzles, deductive reasoning questions and logic-based challenges.",
    suggestedCandidates: [
      { name: 'Ashif KC', regNo: 'AN35-001' },
      { name: 'Muhammed', regNo: 'AN35-002' },
    ],
  },
  {
    id: 'AS4',
    code: 'AS4',
    title: 'NAHAREER',
    division: 'Aliyah',
    category: 'Category S',
    durationMinutes: 120,
    skill: 'Academic',
    accentColor: 'purple',
    conceptNote:
      'Live reality quiz show focusing on Quran, Thafseer, Ulumul Quran, Aqida, Hadith, Fiqh, Usulul Fiqh, Arabic language, and Seera. Designed to test the candidate\'s in-depth classical scholarship, analytical memory, and cross-disciplinary Islamic sciences.',
    suggestedCandidates: [
      { name: 'Candidate 1', regNo: 'AS4-001' },
      { name: 'Candidate 2', regNo: 'AS4-002' },
      { name: 'Candidate 3', regNo: 'AS4-003' },
    ],
  },
  {
    id: 'AS5',
    code: 'AS5',
    title: "QUR'AN TALENT",
    division: 'Aliyah',
    category: 'Category S',
    durationMinutes: 90,
    skill: 'Academic',
    accentColor: 'emerald',
    conceptNote:
      'Advanced Quranic proficiency test covering Tajwid rules, phonetic articulation, detailed Tafsir of Surah al-Kahf with cross-references to Tafsir Ibn Kathir, Tafsir al-Qurtubi, and Safwat al-Tafasir.',
    suggestedCandidates: [{ name: 'Candidate 1', regNo: 'AS5-001' }],
  },
  {
    id: 'AS6',
    code: 'AS6',
    title: 'AL FAQIH',
    division: 'Aliyah',
    category: 'Category S',
    durationMinutes: 90,
    skill: 'Academic',
    accentColor: 'amber',
    conceptNote:
      'Comprehensive Islamic jurisprudence examination focusing on Shafi\'i fiqh, Usul al-fiqh principles, Tarikh al-Tashri\' (history of Islamic legislation), and solution of classical and contemporary masa\'il al-fiqhiyyah.',
    suggestedCandidates: [{ name: 'Candidate 1', regNo: 'AS6-001' }],
  },
  {
    id: 'AS7',
    code: 'AS7',
    title: 'MIKYAL',
    division: 'Aliyah',
    category: 'Category S',
    durationMinutes: 90,
    skill: 'Academic',
    accentColor: 'sky',
    conceptNote:
      'Mathematical reasoning and computational analysis for Zakat valuation, balance sheet screening, zakatable asset breakdowns, and Fara\'id (Islamic inheritance distribution) case studies.',
    suggestedCandidates: [{ name: 'Candidate 1', regNo: 'AS7-001' }],
  },
  {
    id: 'AS18',
    code: 'AS18',
    title: 'BIZ QUIZ',
    division: 'Aliyah',
    category: 'Category S',
    durationMinutes: 90,
    skill: 'General Awareness',
    accentColor: 'purple',
    conceptNote:
      'Tests understanding and analysis of contemporary business practices and Islamic perspectives. Covers conventional business models, Shariah screening standards, Murabahah, Musharakah, Mudarabah, Ijarah, Sukuk, and current developments in the halal economy.',
    suggestedCandidates: [{ name: 'Sinan P', regNo: 'AS18-001' }],
  },
  {
    id: 'AS21',
    code: 'AS21',
    title: 'PROUD MUSLIM',
    division: 'Aliyah',
    category: 'Category S',
    durationMinutes: 45,
    skill: 'Academic',
    accentColor: 'rose',
    conceptNote:
      'Addresses contemporary intellectual, philosophical, and ideological issues: Atheism, New Atheism, Post-Modernism, Liberalism, Secularism, Radical Feminism, Kalam Theology, and Gender discourse in Islam.',
    suggestedCandidates: [{ name: 'Candidate 1', regNo: 'AS21-001' }],
  },
  {
    id: 'AX37',
    code: 'AX37',
    title: 'AL ARABI',
    division: 'Aliyah',
    category: 'Category X',
    durationMinutes: 45,
    skill: 'Linguistics',
    accentColor: 'emerald',
    conceptNote:
      'Arabic linguistic assessment covering Balaghah (Ma\'ani, Bayan, Badi\'), advanced Nahw and Sarf, classical and modern Adab-al-Arabi, Tarjumah (translation), and rhetoric structures.',
    suggestedCandidates: [{ name: 'Candidate 1', regNo: 'AX37-001' }],
  },
  {
    id: 'AX38',
    code: 'AX38',
    title: 'ALLAME URDU',
    division: 'Aliyah',
    category: 'Category X',
    durationMinutes: 45,
    skill: 'Linguistics',
    accentColor: 'amber',
    conceptNote:
      'Urdu language and literary scholarship: Classical Urdu poetry analysis, prose interpretation, grammatical accuracy, translation, and rhetoric.',
    suggestedCandidates: [{ name: 'Candidate 1', regNo: 'AX38-001' }],
  },
  {
    id: 'AX43',
    code: 'AX43',
    title: 'CODE CRAFT',
    division: 'Aliyah',
    category: 'Category X',
    durationMinutes: 60,
    skill: 'Technical',
    accentColor: 'sky',
    conceptNote:
      'JavaScript problem-solving, algorithmic thinking, clean code architecture, data structures, debugging challenges, and modern web application logic.',
    suggestedCandidates: [{ name: 'Candidate 1', regNo: 'AX43-001' }],
  },

  // ── Kulliyyah Senior Division ──
  {
    id: 'KS2',
    code: 'KS2',
    title: 'BP DEBATE',
    division: 'Kulliyyah Senior',
    category: 'Category S',
    durationMinutes: 50,
    skill: 'Presentation',
    accentColor: 'sky',
    conceptNote:
      'British Parliamentary format debate championship. Assesses motion analysis, case construct, logical rebuttals, policy impact analysis, and points of information (POIs).',
    suggestedCandidates: [{ name: 'Speaker 1', regNo: 'KS2-001' }],
  },
  {
    id: 'KS3',
    code: 'KS3',
    title: 'MUNAZARAH',
    division: 'Kulliyyah Senior',
    category: 'Category S',
    durationMinutes: 50,
    skill: 'Presentation',
    accentColor: 'amber',
    conceptNote:
      'Qatar-style classical Arabic debate championship: Adab al-bahth wa al-munazarah, logical argumentation, rhetorical rebuttal, and linguistic eloquence.',
    suggestedCandidates: [{ name: 'Munazir 1', regNo: 'KS3-001' }],
  },
  {
    id: 'KS5',
    code: 'KS5',
    title: "TAHADI AL-SHI'R",
    division: 'Kulliyyah Senior',
    category: 'Category S',
    durationMinutes: 90,
    skill: 'Reasoning',
    accentColor: 'purple',
    conceptNote:
      'Memorization, vocabulary mastery, and textual comprehension of classical poetic masterpieces: Qaseedat al-Withriyyah, Hidayat al-Adhkiya, and Diwan al-Shafi\'i.',
    suggestedCandidates: [{ name: 'Candidate 1', regNo: 'KS5-001' }],
  },
  {
    id: 'K6',
    code: 'K6',
    title: 'BUILDATHON',
    division: 'Kulliyyah Senior',
    category: 'Category O',
    durationMinutes: 240,
    skill: 'Technical',
    accentColor: 'emerald',
    conceptNote:
      'Full-stack system architecture, rapid prototype development, clean API design, database modeling, and live software deployment under timed pressure.',
    suggestedCandidates: [{ name: 'Engineer 1', regNo: 'K6-001' }],
  },
  {
    id: 'K11',
    code: 'K11',
    title: 'HERITAGE DOCUMENTARY',
    division: 'Kulliyyah Senior',
    category: 'Category O',
    durationMinutes: 8,
    skill: 'Academic',
    accentColor: 'rose',
    conceptNote:
      'Islamic architectural, cultural, and historical heritage research: Scriptwriting, historical factual verification, cinematic narrative pacing, and oral history documentation.',
    suggestedCandidates: [{ name: 'Researcher 1', regNo: 'K11-001' }],
  },

  // ── Kulliyyah Junior Division ──
  {
    id: 'KJS2',
    code: 'KJS2',
    title: 'AL MAHARA',
    division: 'Kulliyyah Junior',
    category: 'Category S',
    durationMinutes: 120,
    skill: 'Academic',
    accentColor: 'emerald',
    conceptNote:
      'Secondary-level live reality academic challenge testing foundational Quranic Sciences, Tafsir, Aqida, Hadith terminology, elementary Fiqh, and Arabic grammar.',
    suggestedCandidates: [{ name: 'Candidate 1', regNo: 'KJS2-001' }],
  },
]

interface AddProgramModalProps {
  isOpen: boolean
  onClose: () => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onProgramCreated: (program: any) => void
}

export default function AddProgramModal({ isOpen, onClose, onProgramCreated }: AddProgramModalProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>('custom')
  const [division, setDivision] = useState<DivisionType>('Aliyah')
  const [code, setCode] = useState('')
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Category X')
  const [durationMinutes, setDurationMinutes] = useState(45)
  const [skill, setSkill] = useState('Academic')
  const [accentColor, setAccentColor] = useState<'emerald' | 'sky' | 'amber' | 'purple' | 'rose'>('sky')
  const [conceptNote, setConceptNote] = useState('')
  const [candidates, setCandidates] = useState<{ name: string; regNo: string }[]>([
    { name: '', regNo: '' },
  ])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSelectPreset = (presetId: string) => {
    setSelectedPreset(presetId)
    if (presetId === 'custom') {
      setCode('')
      setTitle('')
      setConceptNote('')
      setCandidates([{ name: '', regNo: '' }])
      return
    }

    const p = PRESET_PROGRAMS.find((item) => item.id === presetId)
    if (p) {
      setCode(p.code)
      setTitle(p.title)
      setDivision(p.division)
      setCategory(p.category)
      setDurationMinutes(p.durationMinutes)
      setSkill(p.skill)
      setAccentColor(p.accentColor)
      setConceptNote(p.conceptNote)
      if (p.suggestedCandidates && p.suggestedCandidates.length > 0) {
        setCandidates(p.suggestedCandidates.map((c) => ({ ...c })))
      } else {
        setCandidates([{ name: '', regNo: '' }])
      }
    }
  }

  const handleAddCandidateRow = () => {
    setCandidates((prev) => [
      ...prev,
      { name: '', regNo: `${code ? code.toUpperCase() : 'PRG'}-${String(prev.length + 1).padStart(3, '0')}` },
    ])
  }

  const handleRemoveCandidateRow = (index: number) => {
    if (candidates.length <= 1) return
    setCandidates((prev) => prev.filter((_, i) => i !== index))
  }

  const handleCandidateChange = (index: number, field: 'name' | 'regNo', val: string) => {
    setCandidates((prev) => {
      const copy = [...prev]
      copy[index][field] = val
      return copy
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!code.trim() || !title.trim() || !conceptNote.trim()) {
      setError('Please fill in all required fields (Code, Title, Concept Note).')
      return
    }

    const filteredCandidates = candidates.filter((c) => c.name.trim().length > 0)
    if (filteredCandidates.length === 0) {
      setError('Please add at least 1 candidate for this program.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim(),
          title: title.trim(),
          division,
          category,
          durationMinutes: Number(durationMinutes) || 45,
          skill,
          accentColor,
          conceptNote: conceptNote.trim(),
          candidates: filteredCandidates,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create program')
      }

      onProgramCreated(data.program)
      onClose()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl border-2 border-slate-200 border-b-4 border-b-slate-400 shadow-2xl max-w-2xl w-full my-6 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-sky-50 to-indigo-50 border-b-2 border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-sm">
              <Plus className="w-5 h-5 font-black stroke-[3]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 leading-tight">Add New Program &amp; Candidates</h2>
              <p className="text-xs text-slate-500">Official SIBAQ &apos;26 Syllabus Preset or Custom Program</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="bg-rose-50 border border-rose-300 text-rose-700 text-xs font-bold rounded-xl p-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick-Fill Preset Selector */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-black text-slate-700 uppercase tracking-wide mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Quick-Fill from SIBAQ &apos;26 Concept Note Presets
            </label>
            <select
              value={selectedPreset}
              onChange={(e) => handleSelectPreset(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white transition-all shadow-inner"
            >
              <option value="custom">+ Custom Program (Blank Form)</option>
              <optgroup label="── Aliyah Division Presets ──">
                {PRESET_PROGRAMS.filter((p) => p.division === 'Aliyah').map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {p.title} ({p.category} · {p.durationMinutes}m · {p.skill})
                  </option>
                ))}
              </optgroup>
              <optgroup label="── Kulliyyah Senior Presets ──">
                {PRESET_PROGRAMS.filter((p) => p.division === 'Kulliyyah Senior').map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {p.title} ({p.category} · {p.durationMinutes}m · {p.skill})
                  </option>
                ))}
              </optgroup>
              <optgroup label="── Kulliyyah Junior Presets ──">
                {PRESET_PROGRAMS.filter((p) => p.division === 'Kulliyyah Junior').map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {p.title} ({p.category} · {p.durationMinutes}m · {p.skill})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Basic Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1">
                Division *
              </label>
              <select
                value={division}
                onChange={(e) => setDivision(e.target.value as DivisionType)}
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white"
              >
                <option value="Aliyah">Aliyah</option>
                <option value="Kulliyyah Senior">Kulliyyah Senior</option>
                <option value="Kulliyyah Junior">Kulliyyah Junior</option>
                <option value="Thanaviyyah">Thanaviyyah</option>
                <option value="Wusta">Wusta</option>
                <option value="Ula">Ula</option>
                <option value="General">General</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white"
              >
                <option value="Category X">Category X (DHIU Pre-Stage)</option>
                <option value="Category N">Category N (Non-Stage)</option>
                <option value="Category S">Category S (Stage)</option>
                <option value="Category O">Category O (Offstage)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1">
                Program Code * (e.g. AS6, KS2)
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="AS6"
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-800 uppercase focus:outline-none focus:border-sky-500 focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1">
                Program Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. AL FAQIH"
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1">
                <Clock className="w-3 h-3 inline mr-1" /> Duration (Minutes)
              </label>
              <input
                type="number"
                min={5}
                max={300}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1">
                <Zap className="w-3 h-3 inline mr-1" /> Skill Domain
              </label>
              <input
                type="text"
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
                placeholder="Academic / Linguistics / Reasoning / etc."
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Card Accent Theme Color */}
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1.5">
              Card Tactile Color Theme
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'emerald', label: 'Emerald', bg: 'bg-[#58CC02]', border: 'border-[#46A302]' },
                { id: 'sky', label: 'Electric Sky', bg: 'bg-[#1CB0F6]', border: 'border-[#1899D6]' },
                { id: 'amber', label: 'Amber Gold', bg: 'bg-[#FFC800]', border: 'border-[#E5B400]' },
                { id: 'purple', label: 'Royal Purple', bg: 'bg-[#CE82FF]', border: 'border-[#b56de6]' },
                { id: 'rose', label: 'Coral Rose', bg: 'bg-[#FF4B4B]', border: 'border-[#EA2B2B]' },
              ].map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setAccentColor(c.id as typeof accentColor)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-b-4 text-xs font-bold transition-all active:border-b-2 active:translate-y-[2px] ${
                    accentColor === c.id
                      ? `${c.bg} ${c.border} text-white shadow-sm`
                      : 'bg-white border-slate-200 border-b-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className={`w-3 h-3 rounded-full ${c.bg} border border-white`} />
                  {c.label}
                  {accentColor === c.id && <Check className="w-3 h-3 ml-0.5" />}
                </button>
              ))}
            </div>
          </div>

          {/* Official Concept Note / Syllabus */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-black text-slate-700 uppercase tracking-wide mb-1">
              <BookOpen className="w-3.5 h-3.5 text-sky-600" />
              Official Concept Note / Syllabus Text *
            </label>
            <textarea
              value={conceptNote}
              onChange={(e) => setConceptNote(e.target.value)}
              placeholder="Paste the official SIBAQ '26 concept note and syllabus guidelines here. The AI will isolate and use this exact syllabus to generate questions."
              rows={3}
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-sm text-slate-800 leading-relaxed focus:outline-none focus:border-sky-500 focus:bg-white resize-none"
              required
            />
          </div>

          {/* Dynamic Candidate Roster */}
          <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                  Enrolled Candidates ({candidates.length})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Student profiles who will be assessed on this program.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddCandidateRow}
                className="flex items-center gap-1 px-3 py-1.5 bg-white border-2 border-sky-300 border-b-4 border-b-sky-500 rounded-xl text-xs font-bold text-sky-700 hover:bg-sky-50 active:border-b-2 active:translate-y-[2px] transition-all"
              >
                <Plus className="w-3 h-3" /> Add Candidate
              </button>
            </div>

            <div className="space-y-2">
              {candidates.map((cand, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </div>
                  <input
                    type="text"
                    value={cand.name}
                    onChange={(e) => handleCandidateChange(idx, 'name', e.target.value)}
                    placeholder="Candidate Name (e.g. Sahal)"
                    className="flex-1 bg-white border-2 border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-sky-500"
                    required
                  />
                  <input
                    type="text"
                    value={cand.regNo}
                    onChange={(e) => handleCandidateChange(idx, 'regNo', e.target.value)}
                    placeholder="Reg No (e.g. AX40-001)"
                    className="w-28 sm:w-36 bg-white border-2 border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono font-medium text-slate-600 focus:outline-none focus:border-sky-500"
                  />
                  {candidates.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCandidateRow(idx)}
                      className="w-8 h-8 rounded-xl bg-white border border-rose-200 text-rose-500 hover:bg-rose-50 flex items-center justify-center transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border-2 border-slate-200 border-b-4 border-b-slate-300 text-slate-600 font-bold text-sm hover:bg-slate-100 active:border-b-2 active:translate-y-[2px] transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#58CC02] border-2 border-[#46A302] border-b-4 border-b-[#3c8c01] text-white font-black text-sm hover:bg-[#4db301] active:border-b-2 active:translate-y-[2px] transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving Program...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 font-black" /> Create Program Hub
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
