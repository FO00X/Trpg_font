<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useCharactersStore } from '../stores/characters'
import { useGameRoomsStore } from '../stores/gameRooms'
import PageHeader from '../components/PageHeader.vue'
import { useCharacterCardModal } from '../composables/useCharacterCardModal'

const router = useRouter()
const { characters, remove, fetchList } = useCharactersStore()
const gameRoomsStore = useGameRoomsStore()
const { openCharacterCard } = useCharacterCardModal()
const openMenuId = ref(null)

const reviewDialogOpen = ref(false)
const reviewTargetCharacter = ref(null)
const reviewRooms = ref([])
const reviewLoading = ref(false)
const reviewError = ref('')
const reviewSuccess = ref('')
const reviewSelectedRoomId = ref(null)

// 角色卡在各房间的审核汇总状态：{ [characterId]: 'pending' | 'accepted' | 'rejected' }
const reviewStatusByCharacterId = ref({})

function formatUpdated(isoString) {
  if (!isoString) return ''
  const d = new Date(isoString)
  return d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function createNew() {
  router.push('/characters/new')
}

function viewCharacter(c) {
  openCharacterCard(c.id, true)
}

function editCharacter(c) {
  router.push(`/characters/${c.id}`)
}

function toggleMenu(e, id) {
  e.stopPropagation()
  openMenuId.value = openMenuId.value === id ? null : id
}

function closeMenu() {
  openMenuId.value = null
}

async function deleteCharacter(c) {
  if (isCharacterLocked(c)) {
    alert('该角色卡正在审核中或已通过，不能删除。')
    return
  }
  if (!confirm(`确定要删除角色「${c.name || '未命名'}」吗？此操作不可恢复。`)) return
  const ok = await remove(c.id)
  if (!ok) alert('删除失败，请稍后重试')
  closeMenu()
}

function openSubmitReview(c) {
  reviewTargetCharacter.value = c
  reviewDialogOpen.value = true
  reviewRooms.value = []
  reviewSelectedRoomId.value = null
  reviewError.value = ''
  reviewSuccess.value = ''
  loadReviewRooms(c.id)
}

async function loadReviewRooms(characterId) {
  reviewLoading.value = true
  reviewError.value = ''
  reviewSuccess.value = ''
  const res = await gameRoomsStore.fetchMyJoinedRooms()
  reviewLoading.value = false
  if (!res.ok) {
    reviewError.value = res.message || '加载房间失败，请稍后重试'
    return
  }
  reviewRooms.value = res.rooms || []
}

async function confirmSubmitReview() {
  if (!reviewTargetCharacter.value) return
  if (!reviewSelectedRoomId.value) {
    reviewError.value = '请选择要提交的房间'
    return
  }
  reviewError.value = ''
  reviewSuccess.value = ''
  const res = await gameRoomsStore.submitCharacterForReview(
    reviewSelectedRoomId.value,
    reviewTargetCharacter.value.id,
  )
  if (!res.ok) {
    reviewError.value = res.message || '提交失败，请稍后重试'
    return
  }
  reviewSuccess.value = '已提交审核，请等待 KP 审核通过'
  // 更新本地状态：该角色卡至少为“审核中”
  if (reviewTargetCharacter.value) {
    reviewStatusByCharacterId.value = {
      ...reviewStatusByCharacterId.value,
      [reviewTargetCharacter.value.id]: 'pending',
    }
  }
  reviewDialogOpen.value = false
}

async function loadReviewStatuses() {
  const res = await gameRoomsStore.fetchMyCharacterReviewStatuses()
  if (!res.ok) return
  reviewStatusByCharacterId.value = res.statusMap || {}
}

function characterReviewStatus(c) {
  return reviewStatusByCharacterId.value[c.id] || null
}

function isCharacterLocked(c) {
  const status = characterReviewStatus(c)
  return status === 'pending' || status === 'accepted'
}

function characterStatusLabel(status) {
  if (status === 'pending') return '审核中'
  if (status === 'accepted') return '已通过'
  if (status === 'rejected') return '被拒绝'
  return ''
}

function characterStatusClass(status) {
  if (status === 'pending') return 'bg-amber-500/20 text-amber-300'
  if (status === 'accepted') return 'bg-green-500/20 text-green-300'
  if (status === 'rejected') return 'bg-red-500/20 text-red-300'
  return ''
}

function onCardClick(c) {
  if (openMenuId.value === c.id) {
    closeMenu()
    return
  }
  viewCharacter(c)
}

onMounted(async () => {
  document.addEventListener('click', closeMenu)
  await fetchList()
  await loadReviewStatuses()
})
onUnmounted(() => {
  document.removeEventListener('click', closeMenu)
})
</script>

<template>
  <div class="flex flex-col h-full">
    <PageHeader title="角色卡" icon="mdi:card-account-details">
      <template #actions>
        <button
          type="button"
          class="p-2 rounded-full bg-white/10 text-white/80 hover:text-white hover:bg-white/30 transition-colors"
          @click="createNew"
        >
          <Icon icon="mdi:plus" class="text-xl" />
        </button>
      </template>
    </PageHeader>
    <div class="flex-1 overflow-y-auto scroll-thin p-4">
      <div class="max-w-2xl mx-auto space-y-2">
        <div
          v-for="c in characters"
          :key="c.id"
          class="flex items-center gap-3 p-3 rounded-xl bg-chat-panel border border-chat-border hover:border-accent/30 transition-colors cursor-pointer"
          @click="onCardClick(c)"
        >
          <div class="w-10 h-10 rounded-lg bg-sidebar-active flex items-center justify-center shrink-0">
            <Icon icon="mdi:dice-multiple" class="text-xl text-accent" />
          </div>
          <div class="flex-1 min-w-0 min-h-0">
            <div class="flex items-center gap-2">
              <span
                v-if="characterReviewStatus(c)"
                class="px-2 py-0.5 rounded text-[11px] font-medium"
                :class="characterStatusClass(characterReviewStatus(c))"
              >
                {{ characterStatusLabel(characterReviewStatus(c)) }}
              </span>
              <div class="font-medium text-white truncate">
                {{ c.name || '未命名' }}
              </div>
            </div>
            <div class="text-sm text-accent-muted truncate">
              {{ c.campaign ? `${c.campaign} · ` : '' }}{{ formatUpdated(c.updated_at) }}
            </div>
          </div>
          <div class="relative shrink-0">
            <button
              type="button"
              class="p-1.5 rounded-lg text-accent-muted hover:text-white hover:bg-white/10 transition-colors"
              aria-label="菜单"
              @click="toggleMenu($event, c.id)"
            >
              <Icon icon="mdi:dots-vertical" class="text-xl" />
            </button>
            <div
              v-show="openMenuId === c.id"
              class="absolute right-0 top-full mt-1 py-1 min-w-[120px] rounded-lg bg-chat-panel border border-chat-border shadow-lg z-10"
              @click.stop
            >
              <button
                type="button"
                class="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 flex items-center gap-2"
                @click="viewCharacter(c); closeMenu()"
              >
                <Icon icon="mdi:eye-outline" class="text-lg shrink-0" />
                查看
              </button>
              <button
                type="button"
                class="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="isCharacterLocked(c)"
                @click="editCharacter(c); closeMenu()"
              >
                <Icon icon="mdi:pencil-outline" class="text-lg shrink-0" />
                编辑
              </button>
              <button
                type="button"
                class="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 flex items-center gap-2"
                @click="openSubmitReview(c); closeMenu()"
              >
                <Icon icon="mdi:send-check-outline" class="text-lg shrink-0" />
                提交审核
              </button>
              <button
                type="button"
                class="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-white/10 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                @click="deleteCharacter(c)"
              >
                <Icon icon="mdi:delete-outline" class="text-lg shrink-0" />
                删除
              </button>
            </div>
          </div>
        </div>
        <p v-if="!characters.length" class="text-center text-accent-muted py-8">暂无角色卡，点击上方「创建角色」开始创建。</p>
      </div>
    </div>

    <!-- 提交审核：选择已加入的房间 -->
    <div
      v-if="reviewDialogOpen"
      class="fixed inset-0 z-40 flex items-center justify-center"
    >
      <div
        class="absolute inset-0 bg-black/60"
        @click="reviewDialogOpen = false"
      />
      <div class="relative z-50 w-full max-w-md mx-4 rounded-xl bg-sidebar border border-chat-border shadow-xl">
        <div class="px-4 py-3 border-b border-chat-border flex items-center justify-between">
          <div class="flex flex-col">
            <h2 class="text-sm font-semibold text-white">
              提交角色卡审核
            </h2>
            <p class="text-xs text-accent-muted mt-0.5">
              请选择要提交的房间，交给对应房间的 KP 审核
            </p>
          </div>
          <button
            type="button"
            class="p-1.5 rounded-lg text-accent-muted hover:text-white hover:bg-white/5"
            @click="reviewDialogOpen = false"
          >
            <Icon icon="mdi:close" class="text-lg" />
          </button>
        </div>
        <div class="max-h-[320px] overflow-y-auto scroll-thin px-4 py-3 space-y-2">
          <div
            v-if="reviewLoading"
            class="py-8 text-center text-xs text-accent-muted"
          >
            加载已加入的房间中…
          </div>
          <div
            v-else-if="reviewRooms.length === 0"
            class="py-8 text-center text-xs text-accent-muted"
          >
            暂无已加入的房间，请先加入房间后再提交角色卡审核。
          </div>
          <div
            v-else
            class="space-y-1"
          >
            <button
              v-for="r in reviewRooms"
              :key="r.id"
              type="button"
              class="w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-left text-sm transition-colors"
              :class="reviewSelectedRoomId === r.id ? 'border-accent bg-accent/10 text-white' : 'border-chat-border text-accent-muted hover:border-accent/60 hover:bg-accent/5 hover:text-white'"
              @click="reviewSelectedRoomId = r.id"
            >
              <Icon icon="mdi:dice-multiple" class="text-base shrink-0 text-accent" />
              <div class="flex-1 min-w-0">
                <div class="truncate">{{ r.title || '未命名房间' }}</div>
                <div class="text-[11px] text-accent-muted truncate">
                  {{ r.module || '未设置模组' }}
                </div>
              </div>
            </button>
          </div>
          <p
            v-if="reviewError"
            class="text-xs text-red-400 mt-2"
          >
            {{ reviewError }}
          </p>
          <p
            v-if="reviewSuccess"
            class="text-xs text-green-400 mt-2"
          >
            {{ reviewSuccess }}
          </p>
        </div>
        <div class="px-4 py-3 border-t border-chat-border flex justify-end gap-2">
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg border border-chat-border text-xs text-accent-muted hover:bg-white/5"
            @click="reviewDialogOpen = false"
          >
            取消
          </button>
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg bg-accent text-xs text-white font-medium disabled:opacity-50"
            :disabled="!reviewSelectedRoomId"
            @click="confirmSubmitReview"
          >
            提交审核
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
