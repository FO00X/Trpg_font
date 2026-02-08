import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = Number(process.env.PORT) || 3000
const isProd = process.env.NODE_ENV === 'production'

app.use(cors({ origin: true, credentials: true }))
app.use(express.json())

app.use('/api/auth', authRoutes)

if (isProd) {
  const distPath = path.join(__dirname, '..', 'dist')
  app.use(express.static(distPath))
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'))
    } else {
      res.status(404).json({ ok: false, message: '接口不存在' })
    }
  })
}

app.listen(PORT, () => {
  console.log(`[FOXTrpg] 后端已启动 http://localhost:${PORT}`)
  if (!isProd) console.log('  开发时请同时运行前端: npm run dev:client')
})
