<template>
  <div class="flex items-center justify-center min-h-screen bg-base-200 text-base-content relative px-4">
    <div class="absolute top-4 right-4 z-10">
      <ThemeSelector align="right" />
    </div>
    <div class="w-full max-w-sm bg-base-100 rounded-3xl shadow-xl p-8 relative overflow-hidden">
      <!-- 装饰背景 -->
      <div class="absolute top-0 left-0 right-0 h-32 bg-primary/10 blur-3xl -z-10 rounded-full mix-blend-multiply transform -translate-y-1/2"></div>
      
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold text-base-content tracking-tight">登录 TRPG</h1>
        <p class="text-sm text-base-content/60 mt-2">欢迎回来，探索未知的世界</p>
      </div>
      
      <form @submit.prevent="onSubmit" class="space-y-4 relative z-0">
        <div class="space-y-1">
          <label class="text-sm font-medium text-base-content/80 ml-1">邮箱</label>
          <input
            v-model="email"
            type="email"
            class="w-full px-4 py-3 bg-base-200/50 border-none rounded-xl focus:ring-2 focus:ring-primary/50 focus:bg-base-200 transition-all outline-none"
            placeholder="请输入您的邮箱"
            autocomplete="email"
          />
        </div>
        <div class="space-y-1">
          <label class="text-sm font-medium text-base-content/80 ml-1">密码</label>
          <input
            v-model="password"
            type="password"
            class="w-full px-4 py-3 bg-base-200/50 border-none rounded-xl focus:ring-2 focus:ring-primary/50 focus:bg-base-200 transition-all outline-none"
            placeholder="请输入密码"
            autocomplete="current-password"
          />
        </div>
        
        <div v-if="error" class="px-3 py-2 rounded-lg bg-error/10 text-error text-sm mt-2 text-center animate-pulse">
          {{ error }}
        </div>
        
        <button 
          type="submit" 
          class="w-full py-3.5 bg-primary text-primary-content rounded-xl font-medium mt-6 hover:bg-primary/90 active:scale-95 transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2" 
          :disabled="loading"
        >
          <span v-if="loading" class="loading loading-spinner loading-sm"></span>
          {{ loading ? '登录中...' : '立即登录' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import ThemeSelector from '../components/ThemeSelector.vue'

const router = useRouter()
const route = useRoute()
const { login } = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function onSubmit() {
  if (loading.value) return
  error.value = ''
  loading.value = true
  const res = await login(email.value, password.value)
  loading.value = false
  if (!res.ok) {
    error.value = res.message || '登录失败，请重试'
    return
  }
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/game-rooms'
  router.push(redirect)
}
</script>

<style scoped>
</style>
