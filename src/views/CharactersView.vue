<template>
  <div class="flex flex-col h-full">
    <PageHeader title="角色卡" icon="mdi:card-account-details">
      <template #actions>
        <button type="button" class="btn btn-primary btn-circle btn-sm" @click="createNew">
          <Icon icon="mdi:plus" class="text-xl" />
        </button>
      </template>
    </PageHeader>
    <input
      ref="portraitInputRef"
      type="file"
      accept="image/jpeg,image/png,image/gif,image/webp"
      class="hidden"
      @change="onPortraitFileChange"
    />
    <div class="flex-1 overflow-y-auto scroll-thin px-4 py-2">
      <div class="max-w-2xl mx-auto space-y-3 pb-4">
        <div
          v-for="c in characters"
          :key="c.id"
          class="bg-base-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow cursor-pointer active:scale-95 touch-target p-4 flex items-center gap-4"
          @click="onCardClick(c)"
        >
          <div class="w-14 h-14 rounded-2xl bg-base-200 flex items-center justify-center overflow-hidden shrink-0">
            <img v-if="c.portrait" :src="c.portrait" alt="" class="w-full h-full object-cover" />
            <Icon v-else icon="mdi:account" class="text-3xl text-base-content/40" />
          </div>
          
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <h3 class="font-bold text-base-content truncate text-base">{{ c.name || '未命名' }}</h3>
              <span
                v-if="characterReviewStatus(c)"
                class="px-2 py-0.5 rounded-md text-[10px] font-medium shrink-0"
                :class="{
                  'bg-warning/10 text-warning': characterReviewStatus(c) === ROOM_CHARACTER_STATUS.PENDING,
                  'bg-success/10 text-success': characterReviewStatus(c) === ROOM_CHARACTER_STATUS.ACCEPTED,
                  'bg-error/10 text-error': characterReviewStatus(c) === ROOM_CHARACTER_STATUS.REJECTED,
                }"
              >
                {{ characterStatusLabel(characterReviewStatus(c)) }}
              </span>
            </div>
            <div class="text-sm text-base-content/50 truncate flex items-center gap-2">
              <span v-if="c.campaign" class="max-w-[120px] truncate">{{ c.campaign }}</span>
              <span v-if="c.campaign" class="text-base-content/30">•</span>
              <span>{{ formatUpdated(c.updated_at) }}</span>
            </div>
          </div>
          
          <div
            class="dropdown dropdown-end shrink-0"
            :class="{ 'dropdown-open': openMenuId === c.id }"
            @click.stop
          >
            <div
            tabindex="0"
              type="button"
              class="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-base-200 active:scale-95 transition-all text-base-content/60"
              aria-label="菜单"
              @click="toggleMenu($event, c.id)"
            >
              <Icon icon="mdi:dots-vertical" class="text-xl pointer-events-none" />
            </div>
            <ul
              tabindex="-1"
              class="dropdown-content menu menu-sm p-2 mt-2 w-36 bg-base-100 rounded-2xl shadow-xl z-20 space-y-1"
            >
              <li><button type="button" class="py-2 rounded-xl active:scale-95 transition-all" :disabled="isCharacterLocked(c)" @click.stop="editCharacter(c); closeMenu()"><Icon icon="mdi:pencil-outline" class="text-lg text-base-content/70" />编辑</button></li>
              <li><button type="button" class="py-2 rounded-xl active:scale-95 transition-all" :disabled="portraitUploading" @click.stop="openPortraitUpload(c)"><Icon :icon="portraitUploading ? 'mdi:loading' : 'mdi:image-edit-outline'" class="text-lg text-base-content/70" :class="{ 'animate-spin': portraitUploading }" />头像</button></li>
              <li><button type="button" class="py-2 rounded-xl active:scale-95 transition-all" @click.stop="openSubmitReview(c); closeMenu()"><Icon icon="mdi:send-check-outline" class="text-lg text-primary" />提交</button></li>
              <div class="divider my-0"></div>
              <li><button type="button" class="py-2 rounded-xl text-error active:scale-95 transition-all" @click.stop="deleteCharacter(c)"><Icon icon="mdi:delete-outline" class="text-lg" />删除</button></li>
            </ul>
          </div>
        </div>
        <div v-if="!characters.length" class="flex flex-col items-center justify-center py-20 text-base-content/40">
          <Icon icon="mdi:card-account-details-outline" class="text-6xl mb-4 opacity-50" />
          <p>暂无角色卡</p>
          <p class="text-sm mt-1">点击右上角「+」开始创建</p>
        </div>
      </div>
    </div>

    <!-- 提交审核：选择已加入的房间 -->
    <dialog :open="reviewDialogOpen" class="modal" @click="reviewDialogOpen = false">
      <div class="modal-box max-w-md" @click.stop>
        <div class="flex items-start justify-between gap-2">
          <div>
            <h2 class="font-semibold text-base-content">提交角色卡审核</h2>
            <p class="text-xs text-base-content/60 mt-0.5">请选择要提交的房间，交给对应房间的 KP 审核</p>
          </div>
          <button type="button" class="btn btn-ghost btn-square btn-sm" @click="reviewDialogOpen = false">
            <Icon icon="mdi:close" class="text-lg" />
          </button>
        </div>
        <div class="max-h-[320px] overflow-y-auto scroll-thin py-3 space-y-2">
          <div v-if="reviewLoading" class="py-8 text-center text-sm text-base-content/50">加载已加入的房间中…</div>
          <div v-else-if="reviewRooms.length === 0" class="py-8 text-center text-sm text-base-content/50">暂无已加入的房间，请先加入房间后再提交角色卡审核。</div>
          <div v-else class="space-y-1">
            <button
              v-for="r in reviewRooms"
              :key="r.id"
              type="button"
              class="w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-left text-sm transition-colors"
              :class="reviewSelectedRoomId === r.id ? 'btn btn-primary btn-outline' : 'border-base-300 bg-base-200 hover:border-primary/50'"
              @click="reviewSelectedRoomId = r.id"
            >
              <Icon icon="mdi:dice-multiple" class="text-base shrink-0 text-primary" />
              <div class="flex-1 min-w-0">
                <div class="truncate text-base-content">{{ r.title || '未命名房间' }}</div>
                <div class="text-[11px] text-base-content/50 truncate">{{ r.module || '未设置模组' }}</div>
              </div>
            </button>
          </div>
          <div v-if="reviewError" class="alert alert-error text-xs mt-2">{{ reviewError }}</div>
          <div v-if="reviewSuccess" class="alert alert-success text-xs mt-2">{{ reviewSuccess }}</div>
        </div>
        <div class="modal-action">
          <button type="button" class="btn btn-ghost btn-sm" @click="reviewDialogOpen = false">取消</button>
          <button type="button" class="btn btn-primary btn-sm" :disabled="!reviewSelectedRoomId" @click="confirmSubmitReview">提交审核</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button type="button" @click="reviewDialogOpen = false">close</button></form>
    </dialog>
  </div>

</template>
<script setup>
import { ref, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useCharactersStore } from '../stores/characters'
import { useGameRoomsStore } from '../stores/gameRooms'
import PageHeader from '../components/PageHeader.vue'
import { useToast } from '../composables/useToast'
import { useConfirmDialog } from '../composables/useConfirmDialog'
import { formatShortDateTime } from '../utils/date'
import { ROOM_CHARACTER_STATUS, ROOM_CHARACTER_STATUS_LABELS } from '../constants/enums'
import { useCharacterCardModal } from '../composables/useCharacterCardModal'

const router = useRouter()
const { characters, remove, fetchList, getById, update, uploadCharacterPortrait } = useCharactersStore()
const gameRoomsStore = useGameRoomsStore()
const { openCharacterCard } = useCharacterCardModal()
const toast = useToast()
const { confirm } = useConfirmDialog()
const openMenuId = ref(null)
const portraitInputRef = ref(null)
const portraitUploadTargetId = ref(null)
const portraitUploading = ref(false)

const reviewDialogOpen = ref(false)
const reviewTargetCharacter = ref(null)
const reviewRooms = ref([])
const reviewLoading = ref(false)
const reviewError = ref('')
const reviewSuccess = ref('')
const reviewSelectedRoomId = ref(null)

const reviewStatusByCharacterId = ref({})

function formatUpdated(isoString) {
  return formatShortDateTime(isoString)
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

function openPortraitUpload(c) {
  portraitUploadTargetId.value = c.id
  closeMenu()
  nextTick(() => {
    portraitInputRef.value?.click()
  })
}

async function onPortraitFileChange(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  const id = portraitUploadTargetId.value
  portraitUploadTargetId.value = null
  if (!file || !id) return
  portraitUploading.value = true
  try {
    const res = await uploadCharacterPortrait(id, file)
    if (res.ok) {
      const c = getById(id)
      if (c) {
        const draft = { ...c }
        delete draft.id
        delete draft.updated_at
        draft.portrait = res.url
        const ok = await update(id, draft)
        if (!ok) toast.error('头像已上传，但保存到角色卡失败，请到编辑页保存一次')
      }
    } else {
      toast.error(res.message || '上传失败')
    }
  } finally {
    portraitUploading.value = false
  }
}

async function deleteCharacter(c) {
  if (isCharacterLocked(c)) {
    toast.error('该角色卡正在审核中或已通过，不能删除。')
    return
  }
  const confirmed = await confirm({ title: '确认删除', message: `确定要删除角色「${c.name || '未命名'}」吗？此操作不可恢复。` })
  if (!confirmed) return
  const ok = await remove(c.id)
  if (!ok) toast.error('删除失败，请稍后重试')
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
      [reviewTargetCharacter.value.id]: ROOM_CHARACTER_STATUS.PENDING,
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
  return status === ROOM_CHARACTER_STATUS.PENDING || status === ROOM_CHARACTER_STATUS.ACCEPTED
}

function characterStatusLabel(status) {
  return ROOM_CHARACTER_STATUS_LABELS[status] || status || ''
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
