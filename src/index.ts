// server.ts

import express from 'express'
import cors from 'cors'
import { toNodeHandler } from 'better-auth/node'
import { auth } from './auth'
import dotenv from 'dotenv'
import { db } from './db'

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

app.all('/api/auth/{*any}', toNodeHandler(auth))
app.use(express.json())

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

app.listen(5000, () => {
  console.log('Server running on http://localhost:5000')
})
