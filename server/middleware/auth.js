import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET || 'foxtrpg-dev-secret-change-in-production'

export function signToken(payload, expiresIn = '7d') {
  return jwt.sign(payload, SECRET, { expiresIn })
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET)
  } catch {
    return null
  }
}

/** Express 中间件：从 Authorization: Bearer <token> 或 query.token 解析用户 */
export function requireAuth(req, res, next) {
  const raw = req.headers.authorization
  const token = raw && raw.startsWith('Bearer ') ? raw.slice(7) : req.query?.token
  if (!token) {
    return res.status(401).json({ ok: false, message: '未登录或 token 无效' })
  }
  const payload = verifyToken(token)
  if (!payload || !payload.username) {
    return res.status(401).json({ ok: false, message: '登录已过期，请重新登录' })
  }
  req.user = { username: payload.username }
  next()
}
