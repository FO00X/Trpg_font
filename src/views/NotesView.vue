<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import PageHeader from '../components/PageHeader.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import { useNotesStore } from '../stores/notes'
import { formatDateTime } from '../utils/date'

const router = useRouter()
const notesStore = useNotesStore()
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  const res = await notesStore.fetchList()
  loading.value = false
  if (!res.ok) error.value = res.message || '加载失败'
})

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
        <button type="button" class="btn btn-ghost btn-square btn-sm" title="新建笔记" @click="openNew">
          <Icon icon="mdi:plus" class="text-xl" />
        </button>
      </template>
    </PageHeader>
    <div class="flex-1 overflow-y-auto scroll-thin p-4">
      <LoadingSpinner v-if="loading" message="加载中…" />
      <div v-else-if="error" class="alert alert-error">{{ error }}</div>
      <div v-else-if="!notesStore.list.value.length" class="text-base-content/60 text-center py-8">
        暂无笔记，点击右上角 + 新建
      </div>
      <div v-else class="space-y-2">
        <button
          v-for="n in notesStore.list.value"
          :key="n.id"
          type="button"
          class="card card-bordered bg-base-200 hover:border-primary/40 transition-colors text-left w-full"
          @click="openNote(n)"
        >
          <div class="w-full flex gap-4 p-4 rounded-2xl text-left transition-all active:scale-[0.99] bg-base-100 shadow-sm opacity-70 cursor-default">
            <div class="w-10 h-10 rounded-lg bg-base-300 flex items-center justify-center shrink-0">
              <Icon icon="mdi:note-text" class="text-xl text-primary" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-base-content truncate">{{ n.title || '无标题' }}</div>
              <div class="text-sm text-base-content/60 line-clamp-2">{{ n.content || '无内容' }}</div>
              <div class="text-xs text-base-content/50 mt-1">{{ formatDateTime(n.updated_at) }}</div>
            </div>
            <Icon icon="mdi:chevron-right" class="text-base-content/50 shrink-0 mt-1" />
          </div>
        </button>
      </div>
    </div>
  </div>
</template>
