<template>
  <div class="flex flex-col h-full bg-base-100">
    <PageHeader title="线索" icon="mdi:lightbulb-on-outline" :show-back="true" back-label="返回房间" @back="back">
      <template #actions>
        <button
          type="button"
          class="btn btn-primary btn-sm rounded-xl"
          @click="openNew"
        >
          <Icon icon="mdi:plus" class="text-lg" />
          <span class="max-sm:hidden">新建线索</span>
        </button>
      </template>
    </PageHeader>

    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <LoadingSpinner message="加载中…" />
    </div>
    
    <div v-else-if="error" class="flex-1 p-4">
      <div class="alert alert-error">
        <Icon icon="mdi:alert-circle-outline" class="text-xl" />
        <span>{{ error }}</span>
      </div>
    </div>
    
    <div v-else class="flex-1 min-h-0 flex flex-col md:flex-row">
      <!-- 线索列表 -->
      <div
        class="w-full md:w-64 lg:w-72 shrink-0 flex flex-col min-h-0 bg-base-200/30 border-r border-base-200"
      >
        <ul class="flex-1 overflow-y-auto scroll-thin p-3 space-y-1 min-h-0">
          <li v-for="c in clueList" :key="c.id" class="group">
            <button
              type="button"
              :class="[
                'w-full flex flex-col items-start px-4 py-3 rounded-2xl text-left transition-all active:scale-95',
                selectedClueId === c.id
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-base-content/70 hover:bg-base-200 hover:text-base-content',
              ]"
              @click="selectClue(c)"
            >
              <div class="w-full flex items-center justify-between mb-1.5">
                <span class="font-bold truncate pr-2 text-sm">{{ c.title || '无标题' }}</span>
              </div>
              <div class="flex items-center gap-3 w-full text-[11px]" :class="selectedClueId === c.id ? 'text-primary/70' : 'text-base-content/40'">
                <span>{{ formatDateTime(c.created_at) }}</span>
                <span v-if="c.images?.length" class="flex items-center gap-1">
                  <Icon icon="mdi:image-outline" /> {{ c.images.length }}
                </span>
              </div>
            </button>
          </li>
          <li v-if="!clueList.length" class="py-10 text-center flex flex-col items-center justify-center text-base-content/40">
            <Icon icon="mdi:magnify-scan" class="text-4xl mb-2 opacity-50" />
            <span class="text-sm">暂无线索记录</span>
            <span class="text-xs mt-1">点击右上角按钮新建</span>
          </li>
        </ul>
      </div>

      <!-- 右侧：当前线索正文（桌面端）；移动端点击线索会跳转到 ClueEditView -->
      <div
        class="flex-1 min-w-0 flex flex-col overflow-hidden min-h-0 bg-base-100 relative hidden md:flex"
      >
        <template v-if="selectedClue">
          <div class="shrink-0 px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="flex-1 min-w-0">
              <h2 class="text-2xl font-bold text-base-content mb-1.5 truncate">{{ selectedClue.title || '无标题' }}</h2>
              <div class="flex items-center gap-4 text-xs font-medium text-base-content/40">
                <span class="flex items-center gap-1.5"><Icon icon="mdi:clock-outline" class="text-sm"/> {{ formatDateTime(selectedClue.created_at) }}</span>
              </div>
            </div>
            <button
              type="button"
              class="btn btn-outline btn-primary btn-sm rounded-xl shrink-0 w-full md:w-auto"
              @click="openEdit(selectedClue)"
            >
              <Icon icon="mdi:pencil-outline" class="text-base" />
              编辑线索
            </button>
          </div>
          
          <div class="flex-1 overflow-y-auto scroll-thin px-8 pb-8 min-h-0">
            <div class="max-w-3xl mx-auto">
              <div v-if="selectedClue.content" class="text-[15px] text-base-content/80 whitespace-pre-wrap break-words leading-relaxed bg-base-200/50 p-6 rounded-3xl">
                {{ selectedClue.content }}
              </div>
              <div v-else class="text-sm text-base-content/40 italic flex items-center gap-2 bg-base-200/50 p-6 rounded-3xl">
                 <Icon icon="mdi:text-box-remove-outline" class="text-lg"/> 暂无文字描述
              </div>
              
              <div v-if="selectedClue.images?.length" class="mt-8">
                <div class="flex items-center gap-2 text-[11px] font-bold text-base-content/40 uppercase tracking-wider mb-3 px-2">
                  <Icon icon="mdi:image-multiple-outline" class="text-sm"/> 
                  附加图片
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  <div
                  v-for="(url, idx) in selectedClue.images"
                  :key="idx"
  class="hover-3d group relative aspect-square rounded-2xl overflow-hidden bg-base-200"
>
  <figure class="max-w-100 rounded-2xl">
    <img :src="url" :alt="`图片 ${idx + 1}`" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
  </figure>
  <div></div><div></div><div></div><div></div>
  <div></div><div></div><div></div><div></div>
</div>

                
                </div>
              </div>
            </div>
          </div>
        </template>
        
        <div v-else class="flex-1 flex flex-col items-center justify-center text-base-content/40 px-4">
          <Icon icon="mdi:file-search-outline" class="text-6xl mb-4 opacity-20" />
          <span class="text-lg font-medium">请从左侧选择线索查看</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import PageHeader from '../components/PageHeader.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import { useCluesStore } from '../stores/clues'
import { formatDateTime } from '../utils/date'

const route = useRoute()
const router = useRouter()
const roomId = computed(() => route.params.roomId)
const cluesStore = useCluesStore()

const loading = ref(true)
const error = ref('')
const selectedClueId = ref(null)
const isMobile = ref(false)

const clueList = computed(() => cluesStore.getList(roomId.value))
const selectedClue = computed(() => {
  const id = selectedClueId.value
  if (!id) return null
  return clueList.value.find((c) => c.id === id) || null
})

onMounted(async () => {
  const res = await cluesStore.fetchList(roomId.value)
  loading.value = false
  if (!res.ok) error.value = res.message || '加载失败'
  const list = cluesStore.getList(roomId.value)
  if (list.length && !selectedClueId.value) selectedClueId.value = list[0].id
  isMobile.value = typeof window !== 'undefined' && window.innerWidth < 768
  const mql = typeof window !== 'undefined' ? window.matchMedia('(max-width: 767px)') : null
  if (mql) {
    const onResize = () => {
      isMobile.value = mql.matches
    }
    mql.addEventListener('change', onResize)
    onUnmounted(() => mql.removeEventListener('change', onResize))
  }
})

function selectClue(clue) {
  if (isMobile.value) {
    router.push({ name: 'clue-edit', params: { roomId: roomId.value, clueId: clue.id } })
    return
  }
  selectedClueId.value = clue.id
}

function openNew() {
  router.push({ name: 'clue-new', params: { roomId: roomId.value } })
}

function openEdit(clue) {
  router.push({ name: 'clue-edit', params: { roomId: roomId.value, clueId: clue.id } })
}

function back() {
  router.push({ name: 'game-room', params: { id: roomId.value } })
}
</script>
