import { connectDB } from '@/lib/mongodb'
import { ApiLog } from '@/models'

// Cached in-memory to prevent repeated network hits
let cachedIeltsDataset: string | null = null
let lastIeltsFetchTime = 0

/**
 * Fetch real Band 9.0 test drills from LuchoBazz/ielts-ai-dataset on GitHub
 * with automatic fallback to high-complexity offline benchmark bank
 */
export async function fetchIeltsAcademicDataset(): Promise<string> {
  const now = Date.now()
  if (cachedIeltsDataset && now - lastIeltsFetchTime < 1000 * 60 * 30) {
    return cachedIeltsDataset
  }

  const startTime = Date.now()
  const candidateUrls = [
    'https://raw.githubusercontent.com/LuchoBazz/ielts-ai-dataset/main/datasets/practice-drills/reading/ielts-reading-academic-band-9.0-test-001.json',
    'https://raw.githubusercontent.com/LuchoBazz/ielts-ai-dataset/main/datasets/synthetic-official-mocks/reading/ielts-reading-academic-001.json',
    'https://raw.githubusercontent.com/LuchoBazz/ielts-ai-dataset/main/practice-drills/reading/ielts-reading-academic-band-9.0-test-001.json',
  ]

  for (const url of candidateUrls) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 4000)
      const res = await fetch(url, { signal: controller.signal })
      clearTimeout(timeoutId)

      if (res.ok) {
        const data = await res.json()
        const latencyMs = Date.now() - startTime

        // Log telemetry
        try {
          await connectDB()
          await ApiLog.create({
            provider: 'github-dataset',
            endpoint: url,
            model: 'LuchoBazz/ielts-ai-dataset (Band 9.0)',
            promptTokens: 0,
            completionTokens: JSON.stringify(data).length / 4,
            totalTokens: JSON.stringify(data).length / 4,
            latencyMs,
            status: 'success',
          })
        } catch {
          // ignore telemetry write errors
        }

        let extracted = `IELTS BAND 9.0 OFFICIAL BENCHMARK DRILL: ${data.title || 'Academic Reading Mastery'}\n`
        if (data.passages && Array.isArray(data.passages)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data.passages.slice(0, 2).forEach((p: any, i: number) => {
            extracted += `\nPassage ${i + 1} (${p.title || 'Academic Text'}):\n${p.content?.slice(0, 600) || p.text?.slice(0, 600)}...\n`
            if (p.questions && Array.isArray(p.questions)) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              p.questions.slice(0, 3).forEach((q: any) => {
                extracted += `- Sample Question: ${q.question || q.text} (Options: ${q.options ? q.options.join(', ') : 'Direct recall'})\n`
              })
            }
          })
        } else if (data.sections && Array.isArray(data.sections)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data.sections.slice(0, 2).forEach((s: any) => {
            extracted += `\nSection (${s.title || 'Drill'}):\n${s.passage?.slice(0, 600) || ''}...\n`
          })
        } else {
          extracted += JSON.stringify(data).slice(0, 1200)
        }

        cachedIeltsDataset = extracted
        lastIeltsFetchTime = now
        return extracted
      }
    } catch {
      // Try next url
    }
  }

  // Fallback to built-in Band 9.0 IELTS + C2 Cambridge + UGC-NET Literary Criticism Benchmark Bank
  const fallbackBenchmark = `IELTS BAND 9.0 & C2 CAMBRIDGE PROFICIENCY BENCHMARK:
1. Lexical Nuances & Collocations: Syntactic inversion, fronting adverbials ("Seldom did the critic realize..."), subjunctive mood in formal rhetoric ("It is imperative that the author adhere..."), split infinitives in descriptive prose.
2. Literary Theory & Stylistics: New Historicism, Formalism (Russian OPOJAZ, defamiliarization/ostranenie), Post-colonial Discourse (Edward Said's Orientalism, Homi Bhabha's mimicry/hybridity), Rhetorical tropes (chiasmus, zeugma, litotes, hypallage).
3. Critical Analysis & Textual Verification: Passages analyzing modern stream-of-consciousness (Virginia Woolf, James Joyce) vs neoclassical heroic couplets (Alexander Pope).
4. Distractor Strategy: Distractors must use plausibly deceptive lexical overlap from the passage while altering semantic modality (e.g. changing "probable" to "inevitable").`

  cachedIeltsDataset = fallbackBenchmark
  lastIeltsFetchTime = now
  return fallbackBenchmark
}

/**
 * Curated UPSC CSE Prelims & CLAT PG Constitutional Law benchmark bank
 */
export function getCivicQuestUpscBenchmark(): string {
  return `UPSC CSE PRELIMS & CLAT PG BENCHMARK STANDARDS (CIVIC QUEST):
1. Constitutional Articles 1–130 Depth:
   - Art. 13 (Judicial Review & Doctrine of Eclipse / Severability)
   - Art. 14, 19, 21 (The Golden Triangle & Manifest Arbitrariness Doctrine)
   - Art. 32 vs 226 (Locus Standi in Public Interest Litigation, territorial writ jurisdiction, Habeas Corpus, Mandamus against private entities performing public duty, Quo Warranto conditions)
   - Art. 102 & 191 (Disqualification on Office of Profit, Election Commission advisory opinion vs Speaker's 10th Schedule powers)
   - Art. 110 (Money Bill definition: exclusive presence of taxation matters vs incidental provisions, Speaker's certification scope under judicial review)
2. Landmark Constitutional Bench Precedents:
   - Kesavananda Bharati (1973): Basic Structure limitations on Art. 368.
   - S.R. Bommai (1994): Judicial review of Art. 356 Presidential Rule, secularism as basic structure.
   - K.S. Puttaswamy (2017): 9-Judge bench ruling on informational privacy and proportional state intrusion test.
   - Shayara Bano (2017): Test of Manifest Arbitrariness under Article 14 for personal laws.
   - Minerva Mills (1980): Harmonious balance between Fundamental Rights (Part III) and Directive Principles (Part IV).
3. Question Formatting Requirement:
   - Use Multi-Statement format: "Consider the following statements regarding Article [X]: 1. ... 2. ... Which of the statements given above is/are correct?"
   - Include plausible legal traps that test statutory exceptions, constitutional amendments (42nd, 44th, 86th, 99th, 103rd, 105th), and judicial exceptions.`
}

/**
 * CAT / GMAT / LSAT analytical reasoning template bank
 */
export function getLogicalReasoningCatBenchmark(): string {
  return `CAT, GMAT & LSAT HIGH-DIFFICULTY BENCHMARK (LOGICAL REASONING):
1. Syllogisms with Possibility & Negative Premises:
   - 3 to 4 statements involving "Only a few A are B", "No B is C", "All C being A is a possibility".
   - Reverse syllogisms (determine which set of statements makes conclusion X definitely true).
2. Multi-Attribute Grid & Linear/Circular Arrangements:
   - Circular tables with facing inward and outward alternating positions, paired with 2 other attributes (e.g., profession + assigned vehicle).
   - Linear sequential scheduling with conditional if-then constraints ("P presents exactly two slots before Q, but neither is on Tuesday").
3. Critical Reasoning & Flaw Identification:
   - Identify implicit unwarranted assumptions, correlation vs causation fallacies, strawman distortions, and post hoc traps.
   - "Which of the following, if true, most seriously weakens the argument?"
4. Quantitative Logic & Deductive Traps:
   - Cryptarithmetic puzzles (SEND + MORE = MONEY logic) and truth-teller / liar / alternator paradoxes.`
}

/**
 * Universal benchmark injector for SIBAQ '26 programs
 */
export async function getBenchmarkGrounding(programCode: string): Promise<string> {
  const code = programCode.toUpperCase()
  if (code === 'AX40') {
    return await fetchIeltsAcademicDataset()
  }
  if (code === 'AX39') {
    return getCivicQuestUpscBenchmark()
  }
  if (code === 'AN35') {
    return getLogicalReasoningCatBenchmark()
  }

  // Universal Olympiad standard for other programs (e.g. Nahareer, Mikyal, Biz Quiz, Proud Muslim)
  return `INTERNATIONAL CHAMPIONSHIP BENCHMARK:
- Focus on authentic, deep domain inquiries.
- Avoid trivial superficial questions. Test multi-layered reasoning, historical jurisprudence, Shariah screening calculations, economic mechanisms, and philosophical critique.`
}
