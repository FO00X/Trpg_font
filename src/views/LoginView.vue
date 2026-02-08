<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useAuthStore } from '../stores/auth'
import { APP_TITLE } from '../constants/app'

const router = useRouter()
const route = useRoute()
const { login, user } = useAuthStore()

const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleSubmit() {
  error.value = ''
  loading.value = true
  const result = await login(username.value, password.value)
  loading.value = false
  if (result.ok) {
    const { useChatStore } = await import('../stores/chat')
    useChatStore().updateNickname(user.value?.username ?? username.value.trim())
    const redirect = route.query.redirect || '/chat'
    router.replace(redirect)
  } else {
    error.value = result.message || '登录失败'
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center p-4 bg-chat-bg">
    <div class="w-full max-w-sm">
      <div class="flex items-center justify-center gap-2 mb-8">
        <Icon icon="game-icons:fox-tail" class="text-4xl text-accent" />
        <span class="text-xl font-semibold text-white">{{ APP_TITLE }}</span>
      </div>
      <form
        class="rounded-2xl bg-chat-panel border border-chat-border p-6 shadow-xl"
        @submit.prevent="handleSubmit"
      >
        <h1 class="text-lg font-semibold text-white mb-6 text-center">登录</h1>
        <p v-if="error" class="mb-4 text-sm text-red-400 text-center">{{ error }}</p>
        <div class="space-y-4">
          <div>
            <label class="block text-sm text-accent-muted mb-1.5">账号</label>
            <input
              v-model="username"
              type="text"
              autocomplete="username"
              class="w-full px-3 py-2.5 rounded-lg bg-chat-bg border border-chat-border text-white placeholder-accent-muted focus:border-accent outline-none"
              placeholder="请输入账号"
            />
          </div>
          <div>
            <label class="block text-sm text-accent-muted mb-1.5">密码</label>
            <input
              v-model="password"
              type="password"
              autocomplete="current-password"
              class="w-full px-3 py-2.5 rounded-lg bg-chat-bg border border-chat-border text-white placeholder-accent-muted focus:border-accent outline-none"
              placeholder="请输入密码"
            />
          </div>
        </div>
        <button
          type="submit"
          class="mt-6 w-full py-2.5 rounded-xl bg-accent text-chat-bg font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          :disabled="loading"
        >
          {{ loading ? '登录中…' : '登录' }}
        </button>
      </form>
    </div>
  </div>
</template>
