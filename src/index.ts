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
    origin: 'http://localhost:3000',
    credentials: true,
  })
)

app.all('/api/auth/{*any}', toNodeHandler(auth))

app.use(express.json())

// Database connection test
app.get('/test-db', async (req, res) => {
  try {
    const result = await db
      .selectFrom('user' as any)
      .selectAll()
      .limit(1)
      .execute()
    res.json({ success: true, message: 'Database connected!' })
  } catch (error) {
    res.json({ success: false, error: String(error) })
  }
})

app.get('/', (req, res) => {
  res.send('Backend running!')
})

app.listen(5000, () => {
  console.log('Server running on http://localhost:5000')
})
