import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Program, Attempt } from '@/models'

export const dynamic = 'force-dynamic'

const OFFICIAL_CANDIDATES: Record<string, Record<string, unknown>[]> = {
  AX40: [
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
  AN35: [
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
  AX39: [
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
  AS18: [
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
}

const OFFICIAL_NAMES = ['Sahal', 'Ashif KC', 'Muhammed', 'Zidhan', 'Sinan P']

export async function POST(request: Request) {
  await connectDB()

  let mode = 'test-only'
  try {
    const body = await request.json()
    if (body.mode) mode = body.mode
  } catch {
    // default to test-only
  }

  if (mode === 'all') {
    // Delete all attempts and reset candidates to baseline 0
    await Attempt.deleteMany({})
    for (const [code, candidates] of Object.entries(OFFICIAL_CANDIDATES)) {
      await Program.updateOne(
        { code },
        {
          $set: {
            candidates: candidates.map((c) => ({
              ...c,
              streakDays: 0,
              overallAccuracy: 0,
              strengths: [],
              weaknesses: [],
            })),
          },
        }
      )
    }
    return NextResponse.json({
      success: true,
      message: 'Completely wiped all quiz attempts and reset candidate records to 0.',
    })
  }

  // Default mode: "test-only"
  // Remove test candidates (anyone not in the official roster) and their attempts
  const deletedAttempts = await Attempt.deleteMany({
    candidateName: { $nin: OFFICIAL_NAMES },
  })

  // Also remove extra attempts submitted on starter quizzes beyond the original 5 baseline attempts per official candidate
  for (const name of OFFICIAL_NAMES) {
    const userAttempts = await Attempt.find({ candidateName: name }).sort({ submittedAt: 1 })
    if (userAttempts.length > 5) {
      const extraIds = userAttempts.slice(5).map((a) => a._id)
      await Attempt.deleteMany({ _id: { $in: extraIds } })
    }
  }

  // Restore official candidates list for each program
  for (const [code, candidates] of Object.entries(OFFICIAL_CANDIDATES)) {
    await Program.updateOne(
      { code },
      {
        $set: {
          candidates,
        },
      }
    )
  }

  return NextResponse.json({
    success: true,
    deletedTestAttempts: deletedAttempts.deletedCount,
    message: 'Reset complete: removed all test candidates, cleared test attempts, and restored clean official candidate rosters.',
  })
}

export async function GET() {
  return POST(new Request('http://localhost/api/reset', { method: 'POST' }))
}
