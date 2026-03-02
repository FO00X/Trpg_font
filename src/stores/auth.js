import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'
import { useProfileCache } from './profileCache'

const user = ref(null)
const initialized = ref(false)
let initPromise = null

export function useAuthStore() {
  const isLoggedIn = computed(() => !!user.value)
  const profileCache = useProfileCache()

  /** 由路由守卫或初始化时调用：用 Supabase session 同步本地 user */
  async function setSession(session) {
    if (!session?.user) {
      user.value = null
      return
    }
    const u = session.user
    user.value = {
      id: u.id,
      email: u.email,
      username: u.email?.split('@')[0] || u.id,
      role: 'user',
      avatar: null,
    }
    // 优先从缓存取，避免重复请求
    const cached = await profileCache.getProfile(u.id)
    if (cached) {
      if (cached.username) user.value.username = cached.username
      if (cached.role) user.value.role = cached.role
      if (cached.avatar) user.value.avatar = cached.avatar
    } else {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, role, avatar')
        .eq('id', u.id)
        .single()
      if (profile?.username) user.value.username = profile.username
      if (profile?.role) user.value.role = profile.role
      if (profile?.avatar) user.value.avatar = profile.avatar
      profileCache.setProfile(u.id, { username: profile?.username, role: profile?.role, avatar: profile?.avatar })
    }
  }

  /** 应用启动时调用一次，用于恢复 session 并同步 user；可重复调用，仅执行一次 */
  async function init() {
    if (initPromise) return initPromise
    initPromise = (async () => {
      const { data: { session } } = await supabase.auth.getSession()
      await setSession(session)
      initialized.value = true
      supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session)
      })
    })()
    return initPromise
  }

  /** 确保 auth 已初始化，供路由守卫使用 */
  async function ensureInitialized() {
    if (initialized.value) return
    await init()
  }

  /**
   * 登录：使用 Supabase 邮箱+密码
   * @returns {Promise<{ ok: boolean, message?: string }>}
   */
  async function login(email, password) {
    const e = (email || '').trim()
    const p = (password || '').trim()
    if (!e) return { ok: false, message: '请输入邮箱' }
    if (!p) return { ok: false, message: '请输入密码' }
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: e, password: p })
      if (error) {
        if (error.message?.includes('Invalid login')) return { ok: false, message: '邮箱或密码错误' }
        return { ok: false, message: error.message || '登录失败，请稍后重试' }
      }
      await setSession(data.session)
      return { ok: true }
    } catch (err) {
      return { ok: false, message: '无法连接服务器，请稍后重试' }
    }
  }

  /** 注册（可选，用于注册页） */
  async function signUp(email, password, meta = {}) {
    const e = (email || '').trim()
    const p = (password || '').trim()
    if (!e) return { ok: false, message: '请输入邮箱' }
    if (!p) return { ok: false, message: '请输入密码' }
    try {
      const { data, error } = await supabase.auth.signUp({
        email: e,
        password: p,
        options: { data: { username: meta.username || e.split('@')[0] } },
      })
      if (error) return { ok: false, message: error.message || '注册失败' }
      if (data.session) await setSession(data.session)
      return { ok: true, message: data.user && !data.session ? '请到邮箱查收验证邮件' : undefined }
    } catch (err) {
      return { ok: false, message: '无法连接服务器，请稍后重试' }
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    user.value = null
    profileCache.clear()
  }

  /** 更新个人资料中的用户名（昵称），会写入 Supabase profiles，好友搜索时使用此名 */
  async function updateProfileUsername(username) {
    const trimmed = (username || '').trim()
    if (!trimmed || !user.value?.id) return { ok: false, message: '请输入昵称' }
    const { error } = await supabase
      .from('profiles')
      .update({ username: trimmed, updated_at: new Date().toISOString() })
      .eq('id', user.value.id)
    if (error) return { ok: false, message: error.message || '保存失败' }
    user.value.username = trimmed
    profileCache.setProfile(user.value.id, { username: trimmed, avatar: user.value.avatar, role: user.value.role })
    return { ok: true }
  }

  /** 上传头像：上传到 storage avatars 桶并更新 profiles.avatar */
  async function uploadAvatar(file) {
    const uid = user.value?.id
    if (!uid) return { ok: false, message: '请先登录' }
    if (!file?.type?.startsWith('image/')) return { ok: false, message: '请选择图片文件（JPG/PNG/GIF/WebP）' }
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const safeExt = ['jpeg', 'jpg', 'png', 'gif', 'webp'].includes(ext) ? ext : 'jpg'
    const path = `${uid}/avatar.${safeExt}`
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { cacheControl: '3600', upsert: true })
    if (uploadError) return { ok: false, message: uploadError.message || '上传失败' }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', uid)
    if (updateError) return { ok: false, message: updateError.message || '保存失败' }
    user.value.avatar = publicUrl
    profileCache.setProfile(uid, { username: user.value.username, avatar: publicUrl, role: user.value.role })
    return { ok: true }
  }

  return {
    user,
    isLoggedIn,
    initialized,
    init,
    ensureInitialized,
    setSession,
    login,
    signUp,
    logout,
    updateProfileUsername,
    uploadAvatar,
  }
}
