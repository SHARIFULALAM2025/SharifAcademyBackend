import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

// ✅ ধাপ ১: সব টেবিলের interface এখানে define করুন
interface QuestionsTable {
  id: number
  title: string
  likes: number
  dislikes: number
  views: number
}

interface QuestionReactionsTable {
  id?: number
  user_id: string
  question_id: number
  reaction: 'like' | 'dislike' | 'favourite'
}

interface ExamSubmissionsTable {
  id?: string // ✅ optional — DB auto-generate করবে
  user_id: string
  exam_id: number
  answers: string
  score: number | null
  total_correct: number | null
  total_wrong: number | null
  time_taken: number | null
  is_auto_submitted: boolean
  submitted_at?: Date // ✅ optional — DB DEFAULT NOW() ব্যবহার করবে
}

// ✅ ধাপ ৩: একটি Database interface এ সব একত্রিত করুন
interface Database {
  questions: QuestionsTable
  question_reactions: QuestionReactionsTable
  exam_submissions: ExamSubmissionsTable // ✅ নতুন টেবিল
}

// ✅ ধাপ ৪: Kysely<any> → Kysely<Database> তে পরিবর্তন করুন
export const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: new Pool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: { rejectUnauthorized: false },
    }),
  }),
})
