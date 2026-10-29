import mongoose, { Schema, Model, Document, Types } from 'mongoose'

/* ─────────────── Candidate sub-document ─────────────── */
export interface ICandidate {
  id: string
  name: string
  regNo: string
  avatarColor: string
  streakDays: number
  overallAccuracy: number
  strengths: string[]
  weaknesses: string[]
}

const candidateSchema = new Schema<ICandidate>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    regNo: { type: String, default: '' },
    avatarColor: { type: String, default: '#1CB0F6' },
    streakDays: { type: Number, default: 0 },
    overallAccuracy: { type: Number, default: 0 },
    strengths: [String],
    weaknesses: [String],
  },
  { _id: false }
)

/* ─────────────── Program ─────────────── */
export interface IProgram extends Document {
  code: string
  title: string
  category: string
  durationMinutes: number
  skill: string
  accentColor: 'emerald' | 'sky' | 'amber' | 'purple'
  conceptNote: string
  candidates: ICandidate[]
  askedQuestionRegistry: string[]
}

const programSchema = new Schema<IProgram>({
  code: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  category: { type: String, required: true },
  durationMinutes: { type: Number, required: true },
  skill: { type: String, required: true },
  accentColor: { type: String, enum: ['emerald', 'sky', 'amber', 'purple'], required: true },
  conceptNote: { type: String, required: true },
  candidates: [candidateSchema],
  askedQuestionRegistry: [String],
})

/* ─────────────── StudyMaterial ─────────────── */
export interface IFlashcard {
  front: string
  back: string
  tag: string
}

export interface IStudyMaterial extends Document {
  programCode: string
  title: string
  uploadedBy: string
  rawMarkdown: string
  summaryCues: string[]
  flashcards: IFlashcard[]
  createdAt: Date
}

const studyMaterialSchema = new Schema<IStudyMaterial>({
  programCode: { type: String, required: true },
  title: { type: String, required: true },
  uploadedBy: { type: String, default: 'System' },
  rawMarkdown: { type: String, default: '' },
  summaryCues: [String],
  flashcards: [
    {
      front: String,
      back: String,
      tag: String,
      _id: false,
    },
  ],
  createdAt: { type: Date, default: Date.now },
})

/* ─────────────── Quiz ─────────────── */
export interface IQuestion {
  questionStem: string
  questionText: string
  options: string[]
  correctOptionIndex: number
  topicTag: string
  explanation: string
}

export interface IQuiz extends Document {
  programCode: string
  title: string
  sessionWindow: 'Morning' | 'Evening'
  durationMinutes: number
  aiModelUsed: string
  questions: IQuestion[]
  createdAt: Date
}

const quizSchema = new Schema<IQuiz>({
  programCode: { type: String, required: true },
  title: { type: String, required: true },
  sessionWindow: { type: String, enum: ['Morning', 'Evening'], default: 'Morning' },
  durationMinutes: { type: Number, default: 60 },
  aiModelUsed: { type: String, default: 'System' },
  questions: [
    {
      questionStem: String,
      questionText: String,
      options: [String],
      correctOptionIndex: Number,
      topicTag: String,
      explanation: String,
    },
  ],
  createdAt: { type: Date, default: Date.now },
})

/* ─────────────── Attempt ─────────────── */
export interface IAnswer {
  questionIndex: number
  selectedOption: number
  isCorrect: boolean
  topicTag: string
}

export interface IAttempt extends Document {
  quizId: Types.ObjectId
  programCode: string
  candidateName: string
  answers: IAnswer[]
  score: number
  totalQuestions: number
  percentage: number
  timeTakenSeconds: number
  submittedAt: Date
}

const attemptSchema = new Schema<IAttempt>({
  quizId: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true },
  programCode: { type: String, required: true },
  candidateName: { type: String, required: true },
  answers: [
    {
      questionIndex: Number,
      selectedOption: Number,
      isCorrect: Boolean,
      topicTag: String,
      _id: false,
    },
  ],
  score: { type: Number, default: 0 },
  totalQuestions: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  timeTakenSeconds: { type: Number, default: 0 },
  submittedAt: { type: Date, default: Date.now },
})

/* ─────────────── Model exports ─────────────── */
export const Program = (mongoose.models.Program ||
  mongoose.model<IProgram>('Program', programSchema)) as Model<IProgram>

export const StudyMaterial = (mongoose.models.StudyMaterial ||
  mongoose.model<IStudyMaterial>('StudyMaterial', studyMaterialSchema)) as Model<IStudyMaterial>

export const Quiz = (mongoose.models.Quiz ||
  mongoose.model<IQuiz>('Quiz', quizSchema)) as Model<IQuiz>

export const Attempt = (mongoose.models.Attempt ||
  mongoose.model<IAttempt>('Attempt', attemptSchema)) as Model<IAttempt>
