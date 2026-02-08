import { Router } from 'express'
import { checkUser } from '../lib/users.js'
import { signToken, requireAuth } from '../middleware/auth.js'

const router = Router()

/**
 * POST /api/auth/login
 * Body: { username, password }
 * 返回: { ok, message?, token?, user? }
 */
router.post('/login', (req, res) => {
  const { username, password } = req.body || {}
  if (!username || !password) {
    return res.status(400).json({ ok: false, message: '请输入账号和密码' })
  }
  if (!checkUser(username, password)) {
    return res.status(401).json({ ok: false, message: '账号或密码错误' })
  }
  const user = { username: String(username).trim() }
  const token = signToken({ username: user.username })
  res.json({ ok: true, token, user })
})

/**
 * GET /api/auth/me
 * Header: Authorization: Bearer <token>
 * 返回当前用户信息，用于刷新/校验登录状态
 */
router.get('/me', requireAuth, (req, res) => {
  res.json({ ok: true, user: req.user })
})

export default router
