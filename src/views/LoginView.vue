<template>
  <div class="flex items-center justify-center min-h-screen bg-chat-bg text-white">
    <div class="w-full max-w-sm p-6 rounded-2xl bg-chat-panel border border-chat-border shadow-lg space-y-4">
      <h1 class="text-xl font-semibold text-center mb-2">登录 TRPG</h1>
      <form @submit.prevent="onSubmit" class="space-y-3">
        <div>
          <label class="block mb-1 text-sm text-accent-muted">账号</label>
          <input
            v-model="username"
            type="text"
            class="w-full px-3 py-2 rounded-lg bg-chat-bg border border-chat-border focus:outline-none focus:ring-2 focus:ring-accent"
            autocomplete="username"
          />
        </div>
        <div>
          <label class="block mb-1 text-sm text-accent-muted">密码</label>
          <input
            v-model="password"
            type="password"
            class="w-full px-3 py-2 rounded-lg bg-chat-bg border border-chat-border focus:outline-none focus:ring-2 focus:ring-accent"
            autocomplete="current-password"
          />
        </div>
        <p v-if="error" class="text-sm text-red-400">{{ error }}</p>
        <button
          type="submit"
          class="w-full py-2 rounded-lg bg-accent text-chat-bg font-medium hover:opacity-90 disabled:opacity-60"
          :disabled="loading"
        >
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const route = useRoute()
const { login } = useAuthStore()

const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function onSubmit() {
  if (loading.value) return
  error.value = ''
  loading.value = true
  const res = await login(username.value, password.value)
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

