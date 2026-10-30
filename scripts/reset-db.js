const mongoose = require('mongoose')

const uri =
  'mongodb+srv://fadilmuhammed526_db_user:MrERzXYEAbPMF3LD@cluster0.xefsnfp.mongodb.net/fedex?retryWrites=true&w=majority'

const OFFICIAL_CANDIDATES = {
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

async function reset() {
  console.log('Connecting to MongoDB Atlas...')
  await mongoose.connect(uri)
  const db = mongoose.connection.db

  // 1. Delete test attempts (anything not by official students)
  const delRes = await db.collection('attempts').deleteMany({
    candidateName: { $nin: OFFICIAL_NAMES },
  })
  console.log(`Deleted ${delRes.deletedCount} test attempt(s).`)

  // 2. Restore official candidates in each program
  for (const [code, candidates] of Object.entries(OFFICIAL_CANDIDATES)) {
    await db.collection('programs').updateOne(
      { code },
      { $set: { candidates } }
    )
    console.log(`Reset candidates roster for: ${code}`)
  }

  // 3. Verify clean state
  const remainingAttempts = await db.collection('attempts').find({}).toArray()
  console.log(`\nRemaining official baseline attempts: ${remainingAttempts.length}`)
  const programs = await db.collection('programs').find({}).toArray()
  console.log('\nOfficial Rosters:')
  programs.forEach((p) => {
    console.log(`  ${p.code} (${p.title}): ${p.candidates.map((c) => `${c.name} [${c.overallAccuracy}%]`).join(', ')}`)
  })

  await mongoose.disconnect()
  console.log('\nDatabase reset successfully completed!')
}

reset().catch(console.error)
