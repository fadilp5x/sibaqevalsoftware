import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Program } from '@/models'

export async function GET() {
  await connectDB()
  const programs = await Program.find({}).lean()
  return NextResponse.json(programs)
}

export async function POST(request: Request) {
  await connectDB()
  const body = await request.json()
  const program = await Program.create(body)
  return NextResponse.json(program, { status: 201 })
}
