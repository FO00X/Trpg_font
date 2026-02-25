<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import PageHeader from '../components/PageHeader.vue'
import { useNotesStore } from '../stores/notes'

const router = useRouter()
const notesStore = useNotesStore()
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  const res = await notesStore.fetchList()
  loading.value = false
  if (!res.ok) error.value = res.message || '加载失败'
})

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }) + ' ' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

function openNote(note) {
  router.push({ name: 'note-edit', params: { id: note.id } })
}

function openNew() {
  router.push({ name: 'note-new' })
}
</script>

<template>
  <div class="flex flex-col h-full">
    <PageHeader title="笔记" icon="mdi:note-text-outline">
      <template #actions>
        <button
          type="button"
          class="p-2 rounded-lg text-accent hover:bg-white/10"
          title="新建笔记"
          @click="openNew"
        >
          <Icon icon="mdi:plus" class="text-xl" />
        </button>
      </template>
    </PageHeader>
    <div class="flex-1 overflow-y-auto scroll-thin p-4">
      <div v-if="loading" class="text-accent-muted">加载中…</div>
      <div v-else-if="error" class="text-red-400">{{ error }}</div>
      <div v-else-if="!notesStore.list.value.length" class="text-accent-muted text-center py-8">
        暂无笔记，点击右上角 + 新建
      </div>
      <div v-else class="space-y-2">
        <button
          v-for="n in notesStore.list.value"
          :key="n.id"
          type="button"
          class="w-full flex items-start gap-3 p-3 rounded-xl bg-chat-panel border border-chat-border hover:border-accent/30 transition-colors text-left"
          @click="openNote(n)"
        >
          <div class="w-10 h-10 rounded-lg bg-sidebar-active flex items-center justify-center shrink-0">
            <Icon icon="mdi:note-text" class="text-xl text-accent" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-white truncate">{{ n.title || '无标题' }}</div>
            <div class="text-sm text-accent-muted line-clamp-2">{{ n.content || '无内容' }}</div>
            <div class="text-xs text-accent-muted mt-1">{{ formatDate(n.updated_at) }}</div>
          </div>
          <Icon icon="mdi:chevron-right" class="text-accent-muted shrink-0 mt-1" />
        </button>
      </div>
    </div>
  </div>
</template>
