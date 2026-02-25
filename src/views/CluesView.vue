<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import PageHeader from '../components/PageHeader.vue'
import { useCluesStore } from '../stores/clues'

const route = useRoute()
const router = useRouter()
const roomId = computed(() => route.params.roomId)
const cluesStore = useCluesStore()

const loading = ref(true)
const error = ref('')

onMounted(async () => {
  const res = await cluesStore.fetchList(roomId.value)
  loading.value = false
  if (!res.ok) error.value = res.message || '加载失败'
})

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }) + ' ' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

function openClue(clue) {
  router.push({ name: 'clue-edit', params: { roomId: roomId.value, clueId: clue.id } })
}

function openNew() {
  router.push({ name: 'clue-new', params: { roomId: roomId.value } })
}

function back() {
  router.push({ name: 'game-room', params: { id: roomId.value } })
}
</script>

<template>
  <div class="flex flex-col h-full">
    <PageHeader title="线索" icon="mdi:lightbulb-on-outline">
      <template #actions>
        <button
          type="button"
          class="p-2 rounded-lg text-accent-muted hover:text-white hover:bg-white/10"
          title="返回"
          @click="back"
        >
          <Icon icon="mdi:arrow-left" class="text-xl" />
        </button>
        <button
          type="button"
          class="p-2 rounded-lg text-accent hover:bg-white/10"
          title="新建线索"
          @click="openNew"
        >
          <Icon icon="mdi:plus" class="text-xl" />
        </button>
      </template>
    </PageHeader>
    <div class="flex-1 overflow-y-auto scroll-thin p-4">
      <div v-if="loading" class="text-accent-muted">加载中…</div>
      <div v-else-if="error" class="text-red-400">{{ error }}</div>
      <div v-else-if="!cluesStore.getList(roomId).length" class="text-accent-muted text-center py-8">
        暂无线索，点击右上角 + 新建
      </div>
      <div v-else class="max-w-2xl mx-auto space-y-3">
        <button
          v-for="c in cluesStore.getList(roomId)"
          :key="c.id"
          type="button"
          class="w-full flex items-start gap-3 p-4 rounded-xl bg-chat-panel border border-chat-border hover:border-accent/30 transition-colors text-left"
          @click="openClue(c)"
        >
          <div class="w-12 h-12 rounded-lg bg-sidebar-active flex items-center justify-center shrink-0">
            <Icon icon="mdi:lightbulb-on" class="text-xl text-accent" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-white truncate mb-1">{{ c.title || '无标题' }}</div>
            <div v-if="c.content" class="text-sm text-accent-muted line-clamp-2 mb-1">{{ c.content }}</div>
            <div v-if="c.images?.length" class="flex items-center gap-1 text-xs text-accent-muted mb-1">
              <Icon icon="mdi:image-outline" class="text-sm" />
              <span>{{ c.images.length }} 张图片</span>
            </div>
            <div class="text-xs text-accent-muted">{{ formatDate(c.created_at) }}</div>
          </div>
          <Icon icon="mdi:chevron-right" class="text-accent-muted shrink-0 mt-1" />
        </button>
      </div>
    </div>
  </div>
</template>
