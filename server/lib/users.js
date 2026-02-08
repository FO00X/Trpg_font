/**
 * 简单用户校验（无注册，账号来自环境变量 FOXTRPG_USERS）
 * 格式：user1:pass1,user2:pass2
 */
function loadUsersFromEnv() {
  const raw = process.env.FOXTRPG_USERS || 'admin:123456'
  const map = new Map()
  for (const part of raw.split(',')) {
    const [u, p] = part.trim().split(':').map(s => s.trim())
    if (u && p) map.set(u, p)
  }
  return map
}

const users = loadUsersFromEnv()

export function checkUser(username, password) {
  if (!username || !password) return false
  return users.get(username) === password
}
