<template>
  <div class="flex flex-col h-full min-h-0 bg-base-100 overflow-hidden">
    <PageHeader
      title="模组信息"
      icon="mdi:file-document-multiple-outline"
      :show-back="true"
      @back="back"
    >
      <template v-if="room && isOwner" #actions>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-content text-sm font-medium hover:opacity-90"
            @click="goNewEntry"
          >
            <Icon icon="mdi:plus" class="text-lg" />
            添加
          </button>
          <button
            type="button"
            class="flex items-center gap-2 px-3 py-2 rounded-lg bg-base-200 text-base-content text-sm hover:bg-base-300"
            @click="importOpen = true"
          >
            <Icon icon="mdi:file-import-outline" class="text-lg" />
            导入
          </button>
        </div>
      </template>
    </PageHeader>
    <div
      class="flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-base-200 scroll-thin px-4 pt-4 pb-4 lg:max-w-2xl lg:mx-auto lg:w-full"
    >
      <LoadingSpinner v-if="loading" message="加载中…" />
      <div v-else-if="error" class="alert alert-error">{{ error }}</div>
      <div v-else-if="!room" class="text-base-content/70">房间不存在或无权访问</div>
      <template v-else>
        <ul class="space-y-2">
          <li
            v-for="entry in entries"
            :key="entry.id"
          >
            <button
              type="button"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-base-100 border border-base-200 text-left hover:border-primary/40 hover:bg-primary/5 transition-colors"
              @click="goEditEntry(entry.id)"
            >
              <Icon icon="mdi:file-document-outline" class="text-xl text-primary shrink-0" />
              <span class="flex-1 min-w-0 truncate font-medium text-base-content">{{ entry.title || '未命名' }}</span>
              <Icon icon="mdi:chevron-right" class="text-base-content/40 shrink-0" />
            </button>
          </li>
          <li v-if="!entries.length" class="py-12 text-center text-base-content/50 text-sm">
            暂无词条
            <template v-if="isOwner">，点击右上角「添加词条」或「导入」</template>
          </li>
        </ul>
      </template>
    </div>

    <!-- 导入浮层 -->
    <Teleport to="body">
      <div v-if="importOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" @click.self="importOpen = false">
        <div class="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-xl bg-base-100 border border-base-300 shadow-xl overflow-hidden">
          <div class="flex items-center justify-between shrink-0 p-3 border-b border-base-300">
            <span class="text-sm font-medium text-base-content">导入：粘贴全文，将按【词条标题】自动拆分</span>
            <button
              type="button"
              class="p-2 rounded-lg text-base-content hover:bg-base-content/10"
              @click="importOpen = false"
            >
              <Icon icon="mdi:close" class="text-lg" />
            </button>
          </div>
          <div class="flex-1 min-h-0 flex flex-col p-3 gap-3 overflow-hidden">
            <textarea
              v-model="importText"
              placeholder="将整份模组内容粘贴到此处。以【标题】开头的行会识别为新词条，例如：&#10;【背景信息】&#10;这里是背景正文……&#10;【PC 信息】&#10;这里是 PC 信息……"
              class="flex-1 min-h-[120px] w-full px-3 py-2 rounded-lg bg-base-200 border border-base-300 text-base-content placeholder-base-content/40 text-sm outline-none focus:border-primary resize-none whitespace-pre-wrap"
            />
            <div class="flex justify-end gap-2 shrink-0">
              <button
                type="button"
                class="px-4 py-2 rounded-lg text-base-content hover:bg-base-200 border border-base-300"
                @click="importOpen = false"
              >
                取消
              </button>
              <button
                type="button"
                class="px-4 py-2 rounded-lg bg-primary text-primary-content font-medium hover:opacity-90"
                :disabled="saving"
                @click="applyImport"
              >
                {{ saving ? '导入中…' : '解析并导入' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import PageHeader from '../components/PageHeader.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import { useToast } from '../composables/useToast'
import { useGameRoomsStore } from '../stores/gameRooms'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const roomId = computed(() => route.params.roomId)

const { fetchRoom, updateModuleEntries } = useGameRoomsStore()
const auth = useAuthStore()
const toast = useToast()

const room = ref(null)
const loading = ref(true)
const error = ref('')
const importOpen = ref(false)
const importText = ref('')
const saving = ref(false)

const entries = computed(() => (room.value?.moduleEntries || []).map((e) => ({
  id: e.id || `e-${Date.now()}`,
  title: e.title ?? '',
  content: e.content ?? '',
})))

const isOwner = computed(() => {
  const u = auth.user?.value
  const r = room.value
  return !!(u?.id && r?.ownerId && u.id === r.ownerId)
})

function getRoomRoute() {
  return { name: 'game-room', params: { id: roomId.value } }
}

function back() {
  router.push(getRoomRoute())
}

function goNewEntry() {
  router.push({ name: 'module-entry-new', params: { roomId: roomId.value } })
}

function goEditEntry(entryId) {
  router.push({ name: 'module-entry-edit', params: { roomId: roomId.value, entryId } })
}

/** 按【标题】拆分全文为词条列表 */
function parseImportText(text) {
  const raw = (text || '').trim()
  if (!raw) return []
  const regex = /【[^】]*】/g
  const matches = [...raw.matchAll(regex)]
  if (matches.length === 0) {
    return [{ id: crypto.randomUUID?.() || `e-${Date.now()}`, title: '导入内容', content: raw }]
  }
  const result = []
  for (let i = 0; i < matches.length; i++) {
    const title = matches[i][0]
    const contentStart = matches[i].index + matches[i][0].length
    const contentEnd = i + 1 < matches.length ? matches[i + 1].index : raw.length
    let content = raw.slice(contentStart, contentEnd)
    content = content.replace(/^\s*\n+/, '').trim()
    result.push({
      id: crypto.randomUUID?.() || `e-${Date.now()}-${i}`,
      title,
      content,
    })
  }
  return result
}

async function applyImport() {
  const newEntries = parseImportText(importText.value)
  if (!newEntries.length) {
    toast.error('未解析到词条，请粘贴包含【标题】的文本')
    return
  }
  saving.value = true
  const list = [...entries.value, ...newEntries]
  const res = await updateModuleEntries(roomId.value, list)
  saving.value = false
  if (res?.ok) {
    room.value.moduleEntries = list
    importOpen.value = false
    importText.value = ''
    toast.success(`已追加 ${newEntries.length} 个词条`)
  } else {
    toast.error(res?.message || '导入失败')
  }
}

onMounted(async () => {
  loading.value = true
  room.value = await fetchRoom(roomId.value)
  loading.value = false
  if (!room.value) error.value = '房间不存在或无权访问'
})
</script>
