/**
 * Supabase 客户端（后端）
 * 使用环境变量 VITE_SUPABASE_URL、VITE_SUPABASE_ANON_KEY
 */
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  console.warn('[Supabase] 未配置 VITE_SUPABASE_URL 或 VITE_SUPABASE_ANON_KEY，部分功能将不可用')
}

export const supabase = createClient(url || '', anonKey || '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
