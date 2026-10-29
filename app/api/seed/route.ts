import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Program, StudyMaterial, Quiz, Attempt } from '@/models'

const PROGRAMS = [
  {
    code: 'AX40',
    title: 'Mr. ENGLISH',
    category: 'Category X',
    durationMinutes: 45,
    skill: 'Linguistics',
    accentColor: 'sky' as const,
    conceptNote:
      "To test the candidate's proficiency across various domains of the English language. Candidate's ability to analyze literary texts and English literature, proficiency in grammar, expertise in translation, creative writing and rhetoric will be considered.",
    candidates: [
      {
        id: 'sahal',
        name: 'Sahal',
        regNo: 'AX40-001',
        avatarColor: '#1CB0F6',
        streakDays: 3,
        overallAccuracy: 72,
        strengths: [],
        weaknesses: [],
      },
    ],
  },
  {
    code: 'AN35',
    title: 'LOGICAL REASONING',
    category: 'Category N',
    durationMinutes: 45,
    skill: 'Reasoning',
    accentColor: 'amber' as const,
    conceptNote:
      "To test the candidate's ability to solve logical reasoning problems that require critical thinking, analytical skills and the application of logical principles. Includes syllogisms, logical sequences, puzzles, deductive reasoning questions and logic-based challenges.",
    candidates: [
      {
        id: 'ashif-kc',
        name: 'Ashif KC',
        regNo: 'AN35-001',
        avatarColor: '#FFC800',
        streakDays: 5,
        overallAccuracy: 68,
        strengths: [],
        weaknesses: [],
      },
      {
        id: 'muhammed',
        name: 'Muhammed',
        regNo: 'AN35-002',
        avatarColor: '#FF4B4B',
        streakDays: 2,
        overallAccuracy: 74,
        strengths: [],
        weaknesses: [],
      },
    ],
  },
  {
    code: 'AX39',
    title: 'CIVIC QUEST',
    category: 'Category X',
    durationMinutes: 45,
    skill: 'General Awareness',
    accentColor: 'emerald' as const,
    conceptNote:
      'Civic Quest is a quiz programme designed to assess participants\' knowledge of the Indian Constitution, constitutional provisions, and major areas of Indian law. Syllabus covers constitutional laws and common laws, Articles 1 to 130, major constitutional amendments, and judicial cases concerning Fundamental Rights and Personal Law.',
    candidates: [
      {
        id: 'zidhan',
        name: 'Zidhan',
        regNo: 'AX39-001',
        avatarColor: '#58CC02',
        streakDays: 7,
        overallAccuracy: 79,
        strengths: [],
        weaknesses: [],
      },
    ],
  },
  {
    code: 'AS18',
    title: 'BIZ QUIZ',
    category: 'Category S',
    durationMinutes: 90,
    skill: 'General Awareness',
    accentColor: 'purple' as const,
    conceptNote:
      'Tests understanding and analysis of contemporary business practices and Islamic perspectives. Covers conventional business models, Shariah screening standards, Murabahah, Musharakah, Mudarabah, Ijarah, Sukuk, and current developments in the halal economy.',
    candidates: [
      {
        id: 'sinan-p',
        name: 'Sinan P',
        regNo: 'AS18-001',
        avatarColor: '#CE82FF',
        streakDays: 4,
        overallAccuracy: 65,
        strengths: [],
        weaknesses: [],
      },
    ],
  },
]

const STARTER_QUESTIONS: Record<string, { stem: string; text: string; options: string[]; correct: number; tag: string; explanation: string }[]> = {
  AX40: [
    { stem: 'Literary device in metaphor', text: 'Which literary device directly compares two unlike things without using "like" or "as"?', options: ['Simile', 'Metaphor', 'Personification', 'Alliteration'], correct: 1, tag: 'Literary Devices', explanation: 'A metaphor directly states one thing IS another, unlike a simile which uses "like" or "as".' },
    { stem: 'Grammar: subject-verb agreement', text: 'Which sentence demonstrates correct subject-verb agreement?', options: ['The group of students are studying.', 'The group of students is studying.', 'The groups of student is studying.', 'The group of students were studying.'], correct: 1, tag: 'Grammar', explanation: 'Collective nouns like "group" take singular verbs. "The group is studying" is correct.' },
    { stem: 'Rhetoric: ethos definition', text: 'In rhetoric, "ethos" refers to an appeal based on:', options: ['Emotion', 'Logic', 'Character/Credibility', 'Evidence'], correct: 2, tag: 'Rhetoric', explanation: 'Ethos is the appeal to credibility or character of the speaker, establishing trust with the audience.' },
    { stem: 'Translation: fidelity meaning', text: 'In translation studies, "fidelity" refers to:', options: ['Speed of translation', 'Faithfulness to the source text', 'Use of idioms', 'Literary style'], correct: 1, tag: 'Translation', explanation: 'Fidelity in translation means accurately conveying the meaning, tone, and intent of the original text.' },
    { stem: 'Creative writing: show vs tell', text: 'Which technique is generally preferred in creative writing?', options: ['Telling the reader directly', 'Showing through action/dialogue', 'Using passive voice', 'Abstract description'], correct: 1, tag: 'Creative Writing', explanation: '"Show, don\'t tell" creates immersive experiences by using specific details, action, and dialogue instead of direct statements.' },
  ],
  AN35: [
    { stem: 'Syllogism: valid conclusion', text: 'All birds can fly. Penguin is a bird. Therefore...', options: ['Penguin cannot fly.', 'Penguin can fly.', 'Some birds cannot fly.', 'No conclusion possible.'], correct: 1, tag: 'Syllogisms', explanation: 'In a syllogism, if the premises are accepted as true, the conclusion follows logically. Here the conclusion is that Penguin can fly.' },
    { stem: 'Logical sequence: next number', text: 'What comes next? 2, 6, 12, 20, 30, ?', options: ['36', '42', '40', '44'], correct: 1, tag: 'Number Sequences', explanation: 'The differences are 4, 6, 8, 10, 12. So the next number is 30 + 12 = 42.' },
    { stem: 'Deductive reasoning test', text: 'If no A is B, and all C is B, what can we conclude?', options: ['All A is C.', 'No C is A.', 'Some A is C.', 'All B is C.'], correct: 1, tag: 'Deductive Reasoning', explanation: 'If no A is B, and all C is B, then no C can be A (because any C would be B, which A cannot be).' },
    { stem: 'Puzzle: seating arrangement', text: '5 people sit in a row. A is to the right of B. C is to the left of D. B is in the middle. Who sits at the rightmost end?', options: ['A', 'D', 'C', 'E'], correct: 0, tag: 'Puzzles', explanation: 'B is in position 3 (middle). A is to the right of B, so A is in position 4 or 5. D is to the right of C. A is at the rightmost position.' },
    { stem: 'Critical thinking: assumption', text: 'Statement: "All successful people wake up early." This assumes:', options: ['Waking up early guarantees success.', 'Success is defined by waking hours.', 'The observed successful people all wake early.', 'Time management determines success.'], correct: 0, tag: 'Critical Thinking', explanation: 'The statement implies a causal relationship — that waking up early leads to success, which is the underlying assumption.' },
  ],
  AX39: [
    { stem: 'Article 21: right to life', text: 'Which Fundamental Right does Article 21 of the Indian Constitution guarantee?', options: ['Right to Equality', 'Right to Life and Personal Liberty', 'Right to Freedom of Religion', 'Right against Exploitation'], correct: 1, tag: 'Fundamental Rights', explanation: 'Article 21 guarantees the Protection of Life and Personal Liberty — no person shall be deprived of their life or liberty except according to procedure established by law.' },
    { stem: 'First constitutional amendment', text: 'The First Amendment to the Indian Constitution (1951) primarily dealt with:', options: ['Fundamental Duties', 'Restrictions on Fundamental Rights', 'Directive Principles', 'Emergency provisions'], correct: 1, tag: 'Constitutional Amendments', explanation: 'The First Amendment added the Ninth Schedule and clarified that the state can impose reasonable restrictions on Fundamental Rights such as free speech.' },
    { stem: 'Article 32: constitutional remedy', text: 'Which article gives citizens the right to directly approach the Supreme Court for enforcement of Fundamental Rights?', options: ['Article 226', 'Article 32', 'Article 21', 'Article 14'], correct: 1, tag: 'Writs and Remedies', explanation: 'Article 32 — "Right to Constitutional Remedies" — allows citizens to move the Supreme Court to enforce Fundamental Rights. Dr. Ambedkar called it the "heart and soul" of the Constitution.' },
    { stem: 'Habeas Corpus writ meaning', text: 'The writ of "Habeas Corpus" is issued to:', options: ['Forbid a lower court from proceeding', 'Produce a detained person before the court', 'Transfer a case to another court', 'Command a public officer to perform duty'], correct: 1, tag: 'Writs', explanation: 'Habeas Corpus means "produce the body." It directs detaining authorities to bring the detained person before the court to examine the legality of detention.' },
    { stem: 'Article 1: name of union', text: 'According to Article 1 of the Indian Constitution, India is a:', options: ['Federal Republic', 'Union of States', 'Democratic Republic', 'Confederation'], correct: 1, tag: 'Articles 1-50', explanation: 'Article 1 declares India shall be a "Union of States" — emphasizing the indestructible nature of the union, unlike a federation.' },
  ],
  AS18: [
    { stem: 'Murabahah definition', text: 'In Islamic finance, Murabahah is best described as:', options: ['A profit-sharing arrangement', 'A cost-plus financing sale', 'A leasing contract', 'An equity partnership'], correct: 1, tag: 'Islamic Finance Instruments', explanation: 'Murabahah is a cost-plus sale where the seller discloses the cost and adds an agreed profit margin. It is widely used in Islamic banks for asset financing.' },
    { stem: 'Riba prohibition basis', text: 'The prohibition of Riba (interest) in Islam is primarily based on:', options: ['Hadith only', 'Quranic verses only', 'Both Quran and Sunnah', 'Ijma (consensus) only'], correct: 2, tag: 'Shariah Principles', explanation: 'Riba is prohibited by multiple Quranic verses (e.g., 2:275-279) and numerous Hadiths of the Prophet, making it a well-established prohibition.' },
    { stem: 'Sukuk vs conventional bonds', text: 'The key difference between Sukuk and conventional bonds is:', options: ['Sukuk have higher returns.', 'Sukuk represent ownership in assets.', 'Sukuk are government-issued only.', 'Sukuk are short-term only.'], correct: 1, tag: 'Sukuk', explanation: 'Sukuk represent proportionate ownership in underlying assets or projects, while conventional bonds represent debt. Sukuk holders share in the asset\'s returns and risks.' },
    { stem: 'Musharakah meaning', text: 'Musharakah in Islamic banking refers to:', options: ['A loan with fixed interest', 'A joint venture partnership', 'A leasing arrangement', 'A forward sale contract'], correct: 1, tag: 'Musharakah', explanation: 'Musharakah means "partnership" — all partners contribute capital and share profits and losses in agreed ratios. It is one of the most equity-based Islamic finance modes.' },
    { stem: 'Shariah screening criteria', text: 'Which of the following industries would FAIL Shariah screening for Islamic investment?', options: ['Healthcare', 'Technology', 'Alcohol production', 'Real estate'], correct: 2, tag: 'Shariah Screening', explanation: 'Shariah screening excludes companies with primary business in alcohol, pork, weapons, gambling, or conventional banking/insurance due to clear Islamic prohibitions.' },
  ],
}

export async function runSeed(): Promise<{ seeded: boolean; message: string }> {
  await connectDB()

  let totalAttempts = 0
  let seededPrograms = 0

  for (const prog of PROGRAMS) {
    let program = await Program.findOne({ code: prog.code })
    if (!program) {
      program = await Program.create({
        ...prog,
        askedQuestionRegistry: [],
      })
      seededPrograms++
    }

    // Starter study material
    const existingMat = await StudyMaterial.findOne({ programCode: prog.code })
    if (!existingMat) {
      await StudyMaterial.create({
        programCode: prog.code,
        title: 'Starter Revision Notes',
        uploadedBy: 'System',
        rawMarkdown: `# ${prog.title} — Quick Revision\n\n**Concept:** ${prog.conceptNote}\n\n**Key Focus Areas:**\n- Understand the core syllabus structure\n- Practice with past questions regularly\n- Identify and target weak areas using the analytics dashboard`,
        summaryCues: [
          `Core concept: ${prog.conceptNote.slice(0, 80)}...`,
          'Practice daily for streak maintenance',
          'Review missed questions after each quiz',
        ],
        flashcards: [],
      })
    }

    // Starter quiz with 5 questions
    const questions = STARTER_QUESTIONS[prog.code] || []
    let quiz = await Quiz.findOne({ programCode: prog.code })
    if (!quiz) {
      quiz = await Quiz.create({
        programCode: prog.code,
        title: `${prog.title} — Starter Assessment`,
        sessionWindow: 'Morning',
        durationMinutes: prog.durationMinutes,
        aiModelUsed: 'System',
        questions: questions.map((q) => ({
          questionStem: q.stem,
          questionText: q.text,
          options: q.options,
          correctOptionIndex: q.correct,
          topicTag: q.tag,
          explanation: q.explanation,
        })),
      })

      // Update askedQuestionRegistry
      await Program.findByIdAndUpdate(program._id, {
        $addToSet: { askedQuestionRegistry: { $each: questions.map((q) => q.stem) } },
      })
    }

    // 5 days of historical attempts per candidate (upward trend)
    const trendScores = [55, 62, 68, 74, 78]
    for (const candidate of prog.candidates) {
      const existingAttCount = await Attempt.countDocuments({
        programCode: prog.code,
        candidateName: candidate.name,
      })
      if (existingAttCount === 0 && quiz) {
        for (let i = 0; i < 5; i++) {
          const pct = trendScores[i]
          const correctCount = Math.round((questions.length * pct) / 100)
          const answers = questions.map((q, idx) => ({
            questionIndex: idx,
            selectedOption: idx < correctCount ? q.correct : (q.correct + 1) % 4,
            isCorrect: idx < correctCount,
            topicTag: q.tag,
          }))

          await Attempt.create({
            quizId: quiz._id,
            programCode: prog.code,
            candidateName: candidate.name,
            answers,
            score: correctCount,
            totalQuestions: questions.length,
            percentage: pct,
            timeTakenSeconds: Math.round(prog.durationMinutes * 60 * 0.8),
            submittedAt: new Date(Date.now() - (4 - i) * 86_400_000),
          })
          totalAttempts++
        }
      }
    }
  }

  return {
    seeded: true,
    message: `Seeded ${seededPrograms} new programs, ${totalAttempts} historical attempts`,
  }
}

export async function GET() {
  const result = await runSeed()
  return NextResponse.json(result)
}

export async function POST() {
  const result = await runSeed()
  return NextResponse.json(result)
}
