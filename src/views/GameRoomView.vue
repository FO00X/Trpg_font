<template>
  <div class="flex flex-col h-full">
    <PageHeader
      :title="room?.title || '加载中…'"
      icon="mdi:dice-multiple"
    >
      <template #actions>
        <div class="flex items-center gap-2">
          <!-- 查看房间用户 / 角色列表 -->
          <!-- 玩家：没有角色卡时，显示“暂无角色卡，去创建” -->
          <button
            v-if="room && !isOwner && !characters.length"
            type="button"
            class="flex items-center gap-1 px-3 py-2 rounded-lg bg-base-100-active text-sm text-base-content hover:text-base-content hover:bg-base-200 transition-colors"
            @click="router.push('/characters')"
          >
            <Icon icon="mdi:card-account-details-outline" class="text-lg shrink-0" />
            <span>暂无角色卡，去创建</span>
          </button>

          <!-- 切换角色卡（房主 + 有角色卡的玩家） -->
          <Menu v-else-if="room" as="div" class="relative">
            <MenuButton
              type="button"
              class="flex items-center gap-1 p-2 rounded-lg bg-base-100-active text-base-content hover:bg-base-200 transition-colors text-sm"
            >
              <Icon icon="mdi:card-account-details-outline" class="text-lg shrink-0" />
              <span class="max-w-[160px] truncate">{{ characterMenuLabel }}</span>
              <Icon icon="mdi:chevron-down" class="text-lg shrink-0 opacity-70" />
            </MenuButton>
            <transition
              enter-active-class="transition duration-100 ease-out"
              enter-from-class="opacity-0 scale-95"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition duration-75 ease-in"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
            >
              <MenuItems
                class="absolute right-0 top-full mt-2 w-56 rounded-lg bg-base-100 border border-base-300 shadow-xl py-1 z-50 focus:outline-none max-h-64 overflow-y-auto"
              >
                <MenuItem v-slot="{ active }">
                  <button
                    type="button"
                    :class="[
                      'w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
                      active ? 'bg-base-200 text-base-content' : 'text-base-content/60',
                    ]"
                    @click="selectCharacter(null)"
                  >
                    <Icon icon="mdi:account-off-outline" class="text-lg shrink-0" />
                    不使用角色卡
                  </button>
                </MenuItem>

                <!-- 可选择的角色卡（房主：全部；玩家：仅已审核通过） -->
                <MenuItem
                  v-for="c in selectableCharacters"
                  :key="c.id"
                  v-slot="{ active }"
                >
                  <button
                    type="button"
                    :class="[
                      'w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
                      active ? 'bg-base-200 text-base-content' : 'text-base-content/60',
                      selectedCharacterId === c.id ? 'bg-accent/20 text-accent' : '',
                    ]"
                    @click="selectCharacter(c.id)"
                  >
                    <Icon icon="mdi:card-account-details" class="text-lg shrink-0" />
                    <span class="truncate">{{ c.name || '未命名' }}</span>
                  </button>
                </MenuItem>

                <!-- 玩家已有角色卡但尚未通过 KP 审核时的提示 -->
                <div
                  v-if="!isOwner && characters.length && !selectableCharacters.length"
                  role="alert"
                  class="alert alert-info border-t border-base-300/40 rounded-none gap-2 py-2 text-xs"
                >
                  <Icon icon="mdi:information-outline" class="text-lg shrink-0" />
                  <span class="text-base-content/90">
                    你已有角色卡，请在角色卡详情中交给 KP 审核。
                    审核通过后，可以在此处选择角色卡使用（审核通过后该角色卡将锁定，不能再修改）。
                  </span>
                </div>

                <!-- 去角色卡列表页 -->
                <div class="border-t border-base-300/50 mt-1 pt-1">
                  <MenuItem v-slot="{ active }">
                    <button
                      type="button"
                      :class="[
                        'w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
                        active ? 'bg-base-200 text-base-content' : 'text-base-content hover:text-base-content',
                      ]"
                      @click="router.push('/characters')"
                    >
                      <Icon icon="mdi:plus" class="text-lg shrink-0" />
                      去管理角色卡
                    </button>
                  </MenuItem>
                </div>
              </MenuItems>
            </transition>
          </Menu>
          <button
            v-if="room"
            type="button"
            class="p-2 rounded-lg bg-base-100-active text-base-content hover:bg-base-200 transition-colors"
            title="查看房间用户与角色"
            @click="membersOpen = true"
          >
            <Icon icon="mdi:account-group-outline" class="text-lg" />
          </button>
        </div>
      </template>
    </PageHeader>

    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <LoadingSpinner message="加载中…" />
    </div>
    <div v-else-if="!room" class="flex-1 flex items-center justify-center text-base-content">
      <div class="text-center">
        <p class="mb-2">房间不存在或无权访问</p>
        <button
          type="button"
          class="px-4 py-2 rounded-lg bg-accent/20 text-accent hover:bg-accent/30"
          @click="goBack"
        >
          返回大厅
        </button>
      </div>
    </div>
    <div v-else class="flex-1 flex flex-col overflow-hidden">
      <div class="flex-1 min-h-0">
        <!-- 日志视图 -->
        <RoomLogView
          v-if="activeTab === 'log'"
          :room-id="roomId"
          :is-owner="isOwner"
          class="h-full"
        />

        <!-- 房间信息视图 -->
        <div
          v-else-if="activeTab === 'info'"
          class="h-full overflow-y-auto scroll-thin p-4"
        >
          <div class="max-w-2xl mx-auto space-y-4">
            <div class="rounded-xl bg-base-100 border border-base-200 p-4">
              <div class="flex items-center gap-2 mb-3">
                <span
                  class="px-2 py-0.5 rounded text-xs font-medium"
                  :class="getStatusColor(room.status)"
                >
                  {{ getStatusLabel(room.status) }}
                </span>
                <span class="text-sm text-base-content">{{ room.module }}</span>
              </div>

              <!-- 房间简介（可展开收起） -->
              <div v-if="room.description" class="mb-4">
                <div class="text-xs font-medium text-base-content/50 uppercase tracking-wider mb-1.5">房间简介</div>
                <p
                  class="text-sm text-base-content/60 whitespace-pre-wrap break-words"
                  :class="{ 'line-clamp-3': !infoDescExpanded }"
                >
                  {{ room.description }}
                </p>
                <button
                  type="button"
                  class="text-xs text-primary hover:text-primary/80 mt-1 font-medium"
                  @click="infoDescExpanded = !infoDescExpanded"
                >
                  {{ infoDescExpanded ? '收起' : '展开' }}
                </button>
              </div>

              <!-- 背景故事（可展开收起） -->
              <div class="mb-2">
                <div class="text-xs font-medium text-base-content/50 uppercase tracking-wider mb-1.5">背景故事</div>
                <template v-if="room.backstory">
                  <p
                    class="text-sm text-base-content/60 whitespace-pre-wrap break-words"
                    :class="{ 'line-clamp-3': !infoBackstoryExpanded }"
                  >
                    {{ room.backstory }}
                  </p>
                  <button
                    type="button"
                    class="text-xs text-primary hover:text-primary/80 mt-1 font-medium"
                    @click="infoBackstoryExpanded = !infoBackstoryExpanded"
                  >
                    {{ infoBackstoryExpanded ? '收起' : '展开' }}
                  </button>
                </template>
                <p v-else class="text-sm text-base-content/40">暂无背景故事</p>
              </div>

              <div v-if="room.tags?.length" class="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-base-200">
                <span
                  v-for="tag in room.tags"
                  :key="tag"
                  class="px-2 py-0.5 rounded text-xs bg-base-100-active text-base-content"
                >
                  {{ tag }}
                </span>
              </div>
            </div>

            <!-- 当前使用的角色卡 -->
            <div v-if="selectedCharacterId" class="rounded-xl bg-base-100 border border-base-200 p-4">
              <h3 class="text-sm font-medium text-base-content uppercase tracking-wider mb-2">
                当前角色
              </h3>
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-lg bg-base-100-active flex items-center justify-center shrink-0">
                  <Icon icon="mdi:card-account-details" class="text-xl text-accent" />
                </div>
                <div>
                  <p class="font-medium text-base-content">
                    {{ currentCharacter?.name || '未命名' }}
                  </p>
                  <p class="text-xs text-base-content">
                    {{ currentCharacter?.occupation || '—' }}
                  </p>
                </div>
                <button
                  type="button"
                  class="ml-auto px-3 py-1.5 rounded-lg text-sm text-accent hover:bg-accent/20"
                  @click="showCharacterCard"
                >
                  查看角色卡
                </button>
              </div>
            </div>

            <!-- 功能按钮区域（线索 / 管理） -->
            <div class="space-y-3">
              <!-- 主操作：查看线索（强调） -->
              <button
                type="button"
                class="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-primary text-primary-content font-medium shadow-sm shadow-primary/25 hover:bg-primary/90 active:scale-[0.98] transition-all"
                @click="router.push({ name: 'clues', params: { roomId: roomId } })"
              >
                <Icon icon="mdi:lightbulb-on-outline" class="text-xl shrink-0" />
                <span>查看线索</span>
              </button>

              <!-- 角色卡审核 -->
              <button
                type="button"
                class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-primary/40 bg-primary/5 text-primary font-medium hover:bg-primary/15 hover:border-primary/60 transition-colors active:scale-[0.98]"
                @click="characterReviewOpen = true"
              >
                <Icon icon="mdi:clipboard-list-outline" class="text-lg shrink-0" />
                <span>角色审核</span>
              </button>

              <!-- 仅房主：管理操作区 -->
              <template v-if="isOwner">
                <div class="flex flex-wrap gap-2 pt-1 border-t border-base-200">
                  <button
                    type="button"
                    class="flex items-center gap-2 px-3 py-2 rounded-xl bg-base-200 text-base-content/80 text-sm hover:bg-base-300 hover:text-base-content transition-colors active:scale-[0.98]"
                    @click="router.push({ name: 'room-module', params: { roomId } })"
                  >
                    <Icon icon="mdi:file-document-multiple-outline" class="text-base shrink-0" />
                    <span>模组信息</span>
                  </button>
                  <button
                    type="button"
                    class="flex items-center gap-2 px-3 py-2 rounded-xl bg-base-200 text-base-content/80 text-sm hover:bg-base-300 hover:text-base-content transition-colors active:scale-[0.98]"
                    @click="openEditModal"
                  >
                    <Icon icon="mdi:pencil-outline" class="text-base shrink-0" />
                    <span>修改信息</span>
                  </button>
                  <button
                    type="button"
                    class="flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-red-400/50 text-red-500 text-sm hover:bg-red-500/10 hover:border-red-400 transition-colors active:scale-[0.98]"
                    @click="onDeleteRoom"
                  >
                    <Icon icon="mdi:delete-outline" class="text-base shrink-0" />
                    <span>删除房间</span>
                  </button>
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- 房间聊天视图 -->
        <RoomChat
          v-else-if="activeTab === 'chat'"
          :room-id="roomId"
          class="h-full min-h-0"
        />
      </div>

      <!-- 底部 Tab 栏 -->
      <div class="border-t border-base-300 bg-base-100 flex">
        <button
          type="button"
          class="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-xs transition-colors"
          :class="activeTab === 'info' ? 'text-primary bg-base-200/60' : 'text-base-content hover:text-primary'"
          @click="activeTab = 'info'"
        >
          <Icon icon="mdi:information-outline" class="text-lg" />
          <span>房间信息</span>
        </button>
        <button
          type="button"
          class="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-xs transition-colors"
          :class="activeTab === 'chat' ? 'text-primary bg-base-200/60' : 'text-base-content hover:text-primary'"
          @click="activeTab = 'chat'"
        >
          <Icon icon="mdi:forum-outline" class="text-lg" />
          <span>房间聊天</span>
        </button>
        <button
          type="button"
          class="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-xs transition-colors"
          :class="activeTab === 'log' ? 'text-primary bg-base-200/60' : 'text-base-content hover:text-primary'"
          @click="activeTab = 'log'"
        >
          <Icon icon="mdi:note-text-outline" class="text-lg" />
          <span>房间日志</span>
        </button>
      </div>
    </div>

    <!-- 房间用户 / 角色列表弹窗 -->
    <RoomMembersDialog
      v-model:open="membersOpen"
      :display-members="displayMembers"
      @view-character="(id) => openCharacterCardModal(id, true)"
    />

    <!-- 角色卡审核弹窗：KP 可同意/拒绝，其他人仅查看 -->
    <RoomCharacterReviewDialog
      v-model:open="characterReviewOpen"
      :room-id="roomId"
      :is-owner="isOwner"
    />

    <!-- 修改房间信息弹窗（仅房主） -->
    <Teleport to="body">
      <Dialog :open="editRoomOpen" class="relative z-50" @close="closeEditModal">
        <div class="fixed inset-0 bg-black/60" aria-hidden="true" />
        <div class="fixed inset-0 flex items-center justify-center p-4" @click.self="closeEditModal">
          <DialogPanel class="mx-auto w-full max-w-lg rounded-xl bg-base-100 border border-base-300 shadow-xl">
            <DialogTitle class="sr-only">修改房间</DialogTitle>
            <div class="p-4">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-semibold text-base-content flex items-center gap-2">
                  <Icon icon="mdi:pencil-outline" class="text-xl text-accent" />
                  修改房间信息
                </h2>
                <button
                  type="button"
                  class="p-2 rounded-lg text-base-content hover:text-base-content hover:bg-base-content/10"
                  @click="closeEditModal"
                >
                  <Icon icon="mdi:close" class="text-xl" />
                </button>
              </div>

              <div v-if="editRoomLoading" class="py-6 text-center text-sm text-base-content">
                加载中…
              </div>
              <div v-else>
                <GameRoomForm
                  v-model="editRoomForm"
                  :available-tags="availableTags"
                  :tag-groups="availableTagGroups"
                  :show-module="false"
                  :show-max-players="false"
                />

                <div class="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    class="px-4 py-2 rounded-lg text-base-content hover:text-base-content border border-base-300"
                    @click="closeEditModal"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    class="px-4 py-2 rounded-lg bg-accent text-base-100 hover:opacity-90 font-medium disabled:opacity-50"
                    :disabled="!canSubmitEdit || editRoomSaving"
                    @click="submitEditRoom"
                  >
                    {{ editRoomSaving ? '保存中…' : '保存' }}
                  </button>
                </div>
              </div>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </Teleport>
  </div>

</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { Menu, MenuButton, MenuItems, MenuItem, Dialog, DialogPanel, DialogTitle } from '@headlessui/vue'
import PageHeader from '../components/PageHeader.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import RoomLogView from '../components/RoomLogView.vue'
import RoomChat from '../components/RoomChat.vue'
import RoomMembersDialog from '../components/RoomMembersDialog.vue'
import RoomCharacterReviewDialog from '../components/RoomCharacterReviewDialog.vue'
import { useToast } from '../composables/useToast'
import { useConfirmDialog } from '../composables/useConfirmDialog'
import { APP_TITLE } from '../constants/app'
import { useGameRoomsStore } from '../stores/gameRooms'
import { useProfileCache } from '../stores/profileCache'
import { useCharactersStore } from '../stores/characters'
import { useAuthStore } from '../stores/auth'
import { useCharacterCardModal } from '../composables/useCharacterCardModal'
import GameRoomForm from '../components/GameRoomForm.vue'

const route = useRoute()
const router = useRouter()
const roomId = computed(() => route.params.id)
const auth = useAuthStore()

const {
  fetchRoom,
  setRoomCharacter,
  getRoomCharacter,
  deleteRoom,
  fetchMyApprovedCharacters,
  updateRoom,
  availableTags,
  fetchTags,
} = useGameRoomsStore()
const { characters, fetchList, getById } = useCharactersStore()
const { openCharacterCard: openCharacterCardModal } = useCharacterCardModal()
const profileCache = useProfileCache()

const room = ref(null)
const loading = ref(true)
const activeTab = ref('info') // 'info' | 'chat' | 'log'
const infoDescExpanded = ref(false)
const infoBackstoryExpanded = ref(false)
const membersOpen = ref(false)
const ownerName = ref('')

const toast = useToast()
const { confirm } = useConfirmDialog()

const isOwner = computed(() => {
  const u = auth.user?.value
  const r = room.value
  return u?.id && r?.ownerId && u.id === r.ownerId
})

// 编辑房间弹窗状态
const editRoomOpen = ref(false)
const editRoomLoading = ref(false)
const editRoomSaving = ref(false)
const editRoomForm = ref({
  name: '',
  description: '',
  backstory: '',
  module: '',
  icon: '',
  maxPlayers: 6,
  tags: [],
})

const canSubmitEdit = computed(() => {
  const v = editRoomForm.value || {}
  const nameOk = typeof v.name === 'string' && v.name.trim().length > 0
  return nameOk
})

const approvedCharacterIds = ref([])

const selectedCharacterId = computed(() => getRoomCharacter(roomId.value))

const currentCharacter = computed(() => {
  const id = selectedCharacterId.value
  return id ? getById(id) : null
})

const currentCharacterName = computed(() => {
  const c = currentCharacter.value
  return c?.name || ''
})

// 顶部“角色卡”按钮上的文案（区分房主 / 玩家、是否有卡、是否审核）
const characterMenuLabel = computed(() => {
  const name = currentCharacterName.value
  if (name) return name
  if (isOwner.value) return 'KP'
  if (!characters.value.length) return '暂无角色卡'
  if (!selectableCharacters.value.length) return '等待审核'
  return '角色卡'
})

const selectableCharacters = computed(() => {
  // 房主：可以自由选择任意角色卡作为 NPC
  if (isOwner.value) return characters.value
  // 其他玩家：只能选择被房主审核通过的角色卡
  if (!approvedCharacterIds.value.length) return []
  return characters.value.filter((c) => approvedCharacterIds.value.includes(c.id))
})

// 房间内角色卡审核弹窗开关
const characterReviewOpen = ref(false)

function selectCharacter(characterId) {
  setRoomCharacter(roomId.value, characterId)
}

function showCharacterCard() {
  if (!selectedCharacterId.value) return
  openCharacterCardModal(selectedCharacterId.value, true)
}

function getStatusLabel(status) {
  const map = { recruiting: '招募中', full: '已满员', started: '进行中' }
  return map[status] || status
}

function getStatusColor(status) {
  const map = {
    recruiting: 'bg-green-500/20 text-green-400',
    full: 'bg-accent-muted/20 text-base-content',
    started: 'bg-blue-500/20 text-blue-400',
  }
  return map[status] || ''
}

const displayMembers = computed(() => {
  const list = []
  const r = room.value
  const me = auth.user?.value

  if (r) {
    list.push({
      kind: 'kp',
      label: 'KP',
      display: ownerName.value || '房主',
      user: ownerName.value || '房主',
      characterId: null,
    })
  }

  const c = currentCharacter.value
  if (c && me) {
    const userDisplay = me.username || me.email?.split?.('@')[0] || '我'
    list.push({
      kind: 'pc',
      label: c.name || '未命名',
      display: c.name || '未命名',
      user: userDisplay,
      characterId: c.id,
    })
  }

  return list
})

function goBack() {
  router.push({ name: 'game-rooms' })
}

function openEditModal() {
  if (!room.value || !isOwner.value) return
  editRoomOpen.value = true
  editRoomLoading.value = true
  editRoomForm.value = {
    name: room.value.title || '',
    description: room.value.description || '',
    backstory: room.value.backstory || '',
    module: room.value.module || '',
    icon: '',
    maxPlayers: room.value.maxPlayers ?? 6,
    tags: [...(room.value.tags || [])],
  }
  editRoomLoading.value = false
}

function closeEditModal() {
  if (editRoomSaving.value) return
  editRoomOpen.value = false
}

async function submitEditRoom() {
  if (!room.value || !isOwner.value) return
  const v = editRoomForm.value || {}
  const name = (v.name || '').trim()
  if (!name) return
  const payload = {
    title: name,
    description: (v.description || '').trim(),
    backstory: (v.backstory || '').trim(),
    tags: Array.isArray(v.tags) ? [...v.tags] : [],
  }

  editRoomSaving.value = true
  const res = await updateRoom(roomId.value, payload)
  editRoomSaving.value = false
  if (res?.ok) {
    // 更新当前 room 展示
    if (res.data) {
      room.value = { ...room.value, ...res.data }
    } else {
      await load()
    }
    editRoomOpen.value = false
  } else {
    toast.error(res?.message || '保存失败')
  }
}

async function onDeleteRoom() {
  if (!room.value) return
  const confirmed = await confirm({ title: '确认删除', message: `确定要删除房间「${room.value.title}」吗？此操作不可恢复。` })
  if (!confirmed) return
  const res = await deleteRoom(roomId.value)
  if (res?.ok) router.push({ name: 'game-rooms' })
  else toast.error(res?.message || '删除失败')
}

async function load() {
  if (!roomId.value) return
  loading.value = true
  room.value = await fetchRoom(roomId.value)
  loading.value = false
  if (room.value) {
    document.title = `${room.value.title} - 跑团 - ${APP_TITLE}`
    if (room.value.ownerId) {
      const profile = await profileCache.getProfile(room.value.ownerId)
      ownerName.value = profile?.username ?? ''
    }
  }
}

onMounted(async () => {
  fetchList()
  await load()
  // 非房主加载自己在本房间已被审核通过的角色卡
  if (!isOwner.value && roomId.value) {
    approvedCharacterIds.value = await fetchMyApprovedCharacters(roomId.value)
  }
})

watch(roomId, async () => {
  await load()
  if (!isOwner.value && roomId.value) {
    approvedCharacterIds.value = await fetchMyApprovedCharacters(roomId.value)
  } else {
    approvedCharacterIds.value = []
  }
})
</script>
