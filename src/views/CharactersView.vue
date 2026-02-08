<script setup>
import { inject } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useCharactersStore } from '../stores/characters'

const sidebarOpen = inject('sidebarOpen')
const toggleSidebar = inject('toggleSidebar')
const router = useRouter()
const { characters } = useCharactersStore()

function createNew() {
  router.push('/characters/new')
}

function openCharacter(c) {
  router.push(`/characters/${c.id}`)
}
</script>

<template>
  <div class="flex flex-col h-full">
    <header class="h-14 shrink-0 flex items-center gap-2 px-4 border-b border-chat-border bg-chat-panel">
      <button
        type="button"
        class="p-2 -ml-2 rounded-lg text-accent-muted hover:text-white hover:bg-white/5 transition-colors"
        :title="sidebarOpen ? '收起侧边栏' : '展开侧边栏'"
        @click="toggleSidebar"
      >
        <Icon :icon="sidebarOpen ? 'mdi:backburger' : 'mdi:menu'" class="text-xl" />
      </button>
      <Icon icon="mdi:card-account-details" class="text-xl text-accent" />
      <h1 class="font-semibold text-white">角色卡</h1>
      <button
        type="button"
        class="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-chat-bg font-medium hover:opacity-90"
        @click="createNew"
      >
        <Icon icon="mdi:plus" class="text-lg" />
        创建角色
      </button>
    </header>
    <div class="flex-1 overflow-y-auto scroll-thin p-4">
      <div class="max-w-2xl mx-auto space-y-2">
        <div
          v-for="c in characters"
          :key="c.id"
          class="flex items-center gap-3 p-3 rounded-xl bg-chat-panel border border-chat-border hover:border-accent/30 transition-colors cursor-pointer"
          @click="openCharacter(c)"
        >
          <div class="w-10 h-10 rounded-lg bg-sidebar-active flex items-center justify-center shrink-0">
            <Icon icon="mdi:dice-multiple" class="text-xl text-accent" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-white truncate">{{ c.name || '未命名' }}</div>
            <div class="text-sm text-accent-muted truncate">
              {{ c.campaign ? `${c.campaign} · ` : '' }}{{ c.updated }}
            </div>
          </div>
          <Icon icon="mdi:chevron-right" class="text-accent-muted shrink-0" />
        </div>
        <p v-if="!characters.length" class="text-center text-accent-muted py-8">暂无角色卡，点击上方「创建角色」开始创建。</p>
      </div>
    </div>
  </div>
</template>
