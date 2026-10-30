import { connectDB } from '@/lib/mongodb'
import { Quiz } from '@/models'
import { notFound, redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface Props {
  params: {
    quizId: string
  }
}

export default async function PublicQuizRedirect({ params }: Props) {
  await connectDB()

  const quiz = await Quiz.findById(params.quizId).lean()
  if (!quiz) {
    notFound()
  }

  // Redirect to the full gamified quiz page for that specific program
  redirect(`/programs/${quiz.programCode}/quiz/${params.quizId}`)
}
