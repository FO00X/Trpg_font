<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import PageHeader from '../components/PageHeader.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
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
    <PageHeader title="线索" icon="mdi:lightbulb-on-outline" :show-back="true" back-label="返回房间" @back="back">
      <template #actions>
        <button type="button" class="btn btn-ghost btn-square btn-sm" title="新建线索" @click="openNew">
          <Icon icon="mdi:plus" class="text-xl" />
        </button>
      </template>
    </PageHeader>
    <div class="flex-1 overflow-y-auto scroll-thin p-4">
      <LoadingSpinner v-if="loading" message="加载中…" />
      <div v-else-if="error" class="alert alert-error">{{ error }}</div>
      <div v-else-if="!cluesStore.getList(roomId).length" class="text-base-content/60 text-center py-8">
        暂无线索，点击右上角 + 新建
      </div>
      <div v-else class="max-w-2xl mx-auto space-y-3">
        <button
          v-for="c in cluesStore.getList(roomId)"
          :key="c.id"
          type="button"
          class="card card-bordered bg-base-200 hover:border-primary/40 transition-colors text-left w-full"
          @click="openClue(c)"
        >
          <div class="card-body flex-row items-start gap-3 p-4">
            <div class="w-12 h-12 rounded-lg bg-base-300 flex items-center justify-center shrink-0">
              <Icon icon="mdi:lightbulb-on" class="text-xl text-primary" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-base-content truncate mb-1">{{ c.title || '无标题' }}</div>
              <div v-if="c.content" class="text-sm text-base-content/60 line-clamp-2 mb-1">{{ c.content }}</div>
              <div v-if="c.images?.length" class="flex items-center gap-1 text-xs text-base-content/50 mb-1">
                <Icon icon="mdi:image-outline" class="text-sm" />
                <span>{{ c.images.length }} 张图片</span>
              </div>
              <div class="text-xs text-base-content/50">{{ formatDate(c.created_at) }}</div>
            </div>
            <Icon icon="mdi:chevron-right" class="text-base-content/50 shrink-0 mt-1" />
          </div>
        </button>
      </div>
    </div>
  </div>
</template>
