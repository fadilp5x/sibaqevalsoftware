import { connectDB } from '@/lib/mongodb'
import { Program } from '@/models'
import { runSeed } from '@/app/api/seed/route'
import CampusDashboardClient from '@/components/CampusDashboardClient'

export const dynamic = 'force-dynamic'

async function getData() {
  await connectDB()

  // Auto-seed if DB is empty
  const count = await Program.countDocuments()
  if (count === 0) {
    await runSeed()
  }

  const programs = await Program.find({}).sort({ code: 1 }).lean()
  return JSON.parse(JSON.stringify(programs))
}

export default async function CampusDashboard() {
  const programs = await getData()
  return <CampusDashboardClient initialPrograms={programs} />
}
