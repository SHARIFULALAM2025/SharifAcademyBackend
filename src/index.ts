// server.ts

import express from 'express'
import cors from 'cors'
import { toNodeHandler } from 'better-auth/node'
import { auth } from './auth'
import dotenv from 'dotenv'
import { db } from './db'
import answerKey from './data/answer-key.json' // ✅ শুধু answer-key
dotenv.config()

const app = express()

app.use(
  cors({
    origin: [
      'http://localhost:3000', // ✅ Development
      'http://localhost:3001', // ✅ Alt port
      'https://sharif-academy.vercel.app', // ✅ Production
      process.env.Frontend_AUTH_URL || '', // ✅ .env থেকে
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'user-id'],
  })
)
app.use(express.json())
app.all('/api/auth/{*any}', toNodeHandler(auth))

app.get('/test-db', async (req, res) => {
  try {
    await db.selectFrom('questions').selectAll().limit(1).execute()
    await db.selectFrom('question_reactions').selectAll().limit(1).execute()
    res.json({ success: true, message: 'DB connected, tables ok!' })
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) })
  }
})

// ✅ 👍 Like Route
app.post('/api/questions/:id/like', async (req, res) => {
  try {
    const questionId = Number(req.params.id)
    const userId = (req.headers['user-id'] as string) ?? 'anonymous'

    // আগে reaction আছে কিনা চেক করুন
    const existing = await db
      .selectFrom('question_reactions')
      .selectAll()
      .where('user_id', '=', userId)
      .where('question_id', '=', questionId)
      .where('reaction', '=', 'like')
      .executeTakeFirst()

    if (existing) {
      // Unlike - reaction সরিয়ে দাও
      await db
        .deleteFrom('question_reactions')
        .where('user_id', '=', userId)
        .where('question_id', '=', questionId)
        .where('reaction', '=', 'like')
        .execute()

      await db
        .updateTable('questions')
        .set((eb: any) => ({ likes: eb('likes', '-', 1) }))
        .where('id', '=', questionId)
        .execute()

      res.json({ success: true, action: 'unliked' })
    } else {
      // Dislike থাকলে সরাও
      await db
        .deleteFrom('question_reactions')
        .where('user_id', '=', userId)
        .where('question_id', '=', questionId)
        .where('reaction', '=', 'dislike')
        .execute()

      // Like যোগ করো
      await db
        .insertInto('question_reactions')
        .values({ user_id: userId, question_id: questionId, reaction: 'like' })
        .execute()

      await db
        .updateTable('questions')
        .set((eb: any) => ({ likes: eb('likes', '+', 1) }))
        .where('id', '=', questionId)
        .execute()

      res.json({ success: true, action: 'liked' })
    }
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) })
  }
})

// ✅ 👎 Dislike Route
app.post('/api/questions/:id/dislike', async (req, res) => {
  try {
    const questionId = Number(req.params.id)
    const userId = (req.headers['user-id'] as string) ?? 'anonymous'

    const existing = await db
      .selectFrom('question_reactions')
      .selectAll()
      .where('user_id', '=', userId)
      .where('question_id', '=', questionId)
      .where('reaction', '=', 'dislike')
      .executeTakeFirst()

    if (existing) {
      await db
        .deleteFrom('question_reactions')
        .where('user_id', '=', userId)
        .where('question_id', '=', questionId)
        .where('reaction', '=', 'dislike')
        .execute()

      await db
        .updateTable('questions')
        .set((eb: any) => ({ dislikes: eb('dislikes', '-', 1) }))
        .where('id', '=', questionId)
        .execute()

      res.json({ success: true, action: 'undisliked' })
    } else {
      // Like থাকলে সরাও
      await db
        .deleteFrom('question_reactions')
        .where('user_id', '=', userId)
        .where('question_id', '=', questionId)
        .where('reaction', '=', 'like')
        .execute()

      await db
        .insertInto('question_reactions')
        .values({
          user_id: userId,
          question_id: questionId,
          reaction: 'dislike',
        })
        .execute()

      await db
        .updateTable('questions')
        .set((eb: any) => ({ dislikes: eb('dislikes', '+', 1) }))
        .where('id', '=', questionId)
        .execute()

      res.json({ success: true, action: 'disliked' })
    }
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) })
  }
})

// ✅ ❤️ Favourite Route
app.post('/api/questions/:id/favourite', async (req, res) => {
  try {
    const questionId = Number(req.params.id)
    const userId = (req.headers['user-id'] as string) ?? 'anonymous'

    const existing = await db
      .selectFrom('question_reactions')
      .selectAll()
      .where('user_id', '=', userId)
      .where('question_id', '=', questionId)
      .where('reaction', '=', 'favourite')
      .executeTakeFirst()

    if (existing) {
      await db
        .deleteFrom('question_reactions')
        .where('user_id', '=', userId)
        .where('question_id', '=', questionId)
        .where('reaction', '=', 'favourite')
        .execute()

      res.json({ success: true, action: 'unfavourited' })
    } else {
      await db
        .insertInto('question_reactions')
        .values({
          user_id: userId,
          question_id: questionId,
          reaction: 'favourite',
        })
        .execute()

      res.json({ success: true, action: 'favourited' })
    }
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) })
  }
})

// ✅ 👁️ View Count Route
app.post('/api/questions/:id/view', async (req, res) => {
  try {
    const questionId = Number(req.params.id)

    await db
      .updateTable('questions')
      .set((eb: any) => ({ views: eb('views', '+', 1) }))
      .where('id', '=', questionId)
      .execute()

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) })
  }
})






app.post('/api/exams/submit', async (req, res) => {
  try {
    const userId = (req.headers['user-id'] as string) ?? 'anonymous'
    const { examId, submittedAnswers, timeTaken, autoSubmitted } = req.body

    // ✅ শুধু answer-key থেকে সঠিক উত্তর নিন
    const examAnswers = (answerKey as any)[String(examId)]

    if (!examAnswers) {
      return res.status(404).json({ error: 'Answer key not found' })
    }

    let totalCorrect = 0
    let totalWrong = 0

    // ✅ frontend থেকে আসা প্রতিটা উত্তর মিলিয়ে দেখুন
    Object.entries(submittedAnswers).forEach(([questionId, userAnswer]) => {
      const correctAnswer = examAnswers[questionId]
      if (!correctAnswer) return
      if (userAnswer === correctAnswer) totalCorrect++
      else totalWrong++
    })

    const score = totalCorrect - totalWrong * 0.25
    console.log('📊 Score:', { totalCorrect, totalWrong, score })

    const result = await db
      .insertInto('exam_submissions')
      .values({
        user_id: userId,
        exam_id: Number(examId),
        answers: JSON.stringify(submittedAnswers),
        score,
        total_correct: totalCorrect,
        total_wrong: totalWrong,
        time_taken: timeTaken,
        is_auto_submitted: autoSubmitted ?? false,
      })
      .returning('id')
      .executeTakeFirstOrThrow()

    res.json({ success: true, resultId: result.id, score })
  } catch (error) {
    console.error('❌ Full error:', error)
    res.status(500).json({ success: false, error: String(error) })
  }
})

app.listen(5000, () => {
  console.log('Server running on http://localhost:5000')
})
