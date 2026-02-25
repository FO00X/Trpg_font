<template>
  <div class="flex flex-col h-full">
    <PageHeader
      :title="room?.title || '加载中…'"
      icon="mdi:dice-multiple"
    >
      <template #actions>
        <!-- 日志视图返回按钮 -->
        <button
          v-if="room && activeTab === 'log'"
          type="button"
          class="flex items-center gap-2 px-3 py-2 rounded-lg bg-sidebar-active text-white hover:bg-sidebar-hover transition-colors text-sm"
          @click="activeTab = 'info'"
        >
          <Icon icon="mdi:arrow-left" class="text-lg shrink-0" />
          <span>返回</span>
        </button>
        <!-- 切换角色卡 -->
        <Menu v-if="activeTab === 'info'" as="div" class="relative">
          <MenuButton
            type="button"
            class="flex items-center gap-2 px-3 py-2 rounded-lg bg-sidebar-active text-white hover:bg-sidebar-hover transition-colors text-sm"
          >
            <Icon icon="mdi:card-account-details-outline" class="text-lg shrink-0" />
            <span class="max-w-[120px] truncate">{{ currentCharacterName }}</span>
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
              class="absolute right-0 top-full mt-2 w-56 rounded-lg bg-sidebar border border-chat-border shadow-xl py-1 z-50 focus:outline-none max-h-64 overflow-y-auto"
            >
              <MenuItem v-slot="{ active }">
                <button
                  type="button"
                  :class="[
                    'w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
                    active ? 'bg-sidebar-hover text-white' : 'text-[#a6adc8]',
                  ]"
                  @click="selectCharacter(null)"
                >
                  <Icon icon="mdi:account-off-outline" class="text-lg shrink-0" />
                  不使用角色卡
                </button>
              </MenuItem>
              <MenuItem
                v-for="c in characters"
                :key="c.id"
                v-slot="{ active }"
              >
                <button
                  type="button"
                  :class="[
                    'w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
                    active ? 'bg-sidebar-hover text-white' : 'text-[#a6adc8]',
                    selectedCharacterId === c.id ? 'bg-accent/20 text-accent' : '',
                  ]"
                  @click="selectCharacter(c.id)"
                >
                  <Icon icon="mdi:card-account-details" class="text-lg shrink-0" />
                  <span class="truncate">{{ c.name || '未命名' }}</span>
                </button>
              </MenuItem>
              <div v-if="!characters.length" class="px-3 py-2 text-sm text-accent-muted">
                暂无角色卡，请先创建
              </div>
              <div class="border-t border-chat-border/50 mt-1 pt-1">
                <MenuItem v-slot="{ active }">
                  <button
                    type="button"
                    :class="[
                      'w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
                      active ? 'bg-sidebar-hover text-white' : 'text-accent-muted hover:text-white',
                    ]"
                    @click="router.push('/characters')"
                  >
                    <Icon icon="mdi:plus" class="text-lg shrink-0" />
                    去创建角色卡
                  </button>
                </MenuItem>
              </div>
            </MenuItems>
          </transition>
        </Menu>
      </template>
    </PageHeader>

    <div v-if="loading" class="flex-1 flex items-center justify-center text-accent-muted">
      <span>加载中…</span>
    </div>
    <div v-else-if="!room" class="flex-1 flex items-center justify-center text-accent-muted">
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
      <!-- 日志视图 -->
      <RoomLogView v-if="activeTab === 'log'" :room-id="roomId" class="flex-1" />
      
      <!-- 房间信息视图 -->
      <div v-else class="flex-1 overflow-y-auto scroll-thin p-4">
        <div class="max-w-2xl mx-auto space-y-4">
        <div class="rounded-xl bg-chat-panel border border-chat-border p-4">
          <div class="flex items-center gap-2 mb-2">
            <span
              class="px-2 py-0.5 rounded text-xs font-medium"
              :class="getStatusColor(room.status)"
            >
              {{ getStatusLabel(room.status) }}
            </span>
            <span class="text-sm text-accent-muted">{{ room.module }}</span>
          </div>
          <p v-if="room.description" class="text-sm text-[#a6adc8] whitespace-pre-wrap">{{ room.description }}</p>
          <div v-if="room.tags?.length" class="flex flex-wrap gap-1.5 mt-2">
            <span
              v-for="tag in room.tags"
              :key="tag"
              class="px-2 py-0.5 rounded text-xs bg-sidebar-active text-accent-muted"
            >
              {{ tag }}
            </span>
          </div>
        </div>

        <!-- 当前使用的角色卡 -->
        <div v-if="selectedCharacterId" class="rounded-xl bg-chat-panel border border-chat-border p-4">
          <h3 class="text-sm font-medium text-accent-muted uppercase tracking-wider mb-2">当前角色</h3>
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-lg bg-sidebar-active flex items-center justify-center shrink-0">
              <Icon icon="mdi:card-account-details" class="text-xl text-accent" />
            </div>
            <div>
              <p class="font-medium text-white">{{ currentCharacter?.name || '未命名' }}</p>
              <p class="text-xs text-accent-muted">{{ currentCharacter?.occupation || '—' }}</p>
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

        <!-- 房间内容区（预留：聊天、掷骰等） -->
        <div class="rounded-xl bg-chat-panel border border-chat-border p-4">
          <h3 class="text-sm font-medium text-accent-muted uppercase tracking-wider mb-2">房间动态</h3>
          <p class="text-sm text-accent-muted">房间内讨论、掷骰等功能将在此展示。</p>
        </div>

        <!-- 功能按钮区域 -->
        <div class="flex flex-wrap gap-3">
          <button
            type="button"
            class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-chat-panel border border-chat-border text-white hover:border-accent/50 hover:bg-accent/10 transition-colors"
            @click="activeTab = 'log'"
          >
            <Icon icon="mdi:note-text-outline" class="text-lg shrink-0" />
            <span>查看日志</span>
          </button>
          <button
            type="button"
            class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-chat-panel border border-chat-border text-white hover:border-accent/50 hover:bg-accent/10 transition-colors"
            @click="router.push({ name: 'clues', params: { roomId: roomId } })"
          >
            <Icon icon="mdi:lightbulb-on-outline" class="text-lg shrink-0" />
            <span>查看线索</span>
          </button>
          <!-- 仅房主可见：模组信息 -->
          <button
            v-if="isOwner"
            type="button"
            class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-chat-panel border border-chat-border text-white hover:border-accent/50 hover:bg-accent/10 transition-colors"
            @click="moduleInfoOpen = true"
          >
            <Icon icon="mdi:file-document-multiple-outline" class="text-lg shrink-0" />
            <span>模组信息</span>
          </button>
        </div>
        </div>
      </div>
    </div>

    <!-- 模组信息弹窗（仅房主会打开） -->
    <Teleport to="body">
      <Dialog :open="moduleInfoOpen" class="relative z-50" @close="moduleInfoOpen = false">
        <div class="fixed inset-0 bg-black/60" aria-hidden="true" />
        <div class="fixed inset-0 flex items-center justify-center p-4" @click.self="moduleInfoOpen = false">
          <DialogPanel class="mx-auto w-full max-w-lg rounded-xl bg-sidebar border border-chat-border shadow-xl">
            <DialogTitle class="sr-only">模组信息</DialogTitle>
            <div class="p-4">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-semibold text-white flex items-center gap-2">
                  <Icon icon="mdi:file-document-multiple-outline" class="text-xl text-accent" />
                  模组信息
                </h2>
                <button
                  type="button"
                  class="p-2 rounded-lg text-accent-muted hover:text-white hover:bg-white/5"
                  @click="moduleInfoOpen = false"
                >
                  <Icon icon="mdi:close" class="text-xl" />
                </button>
              </div>
              <p class="text-sm text-accent-muted mb-4">管理模组文件（文档、图片等），仅房主可见。</p>

              <!-- 文件列表 -->
              <ul class="space-y-2 mb-4 max-h-48 overflow-y-auto scroll-thin">
                <li
                  v-for="f in (room?.moduleFiles || [])"
                  :key="f.id"
                  class="flex items-center gap-3 p-2 rounded-lg bg-chat-bg border border-chat-border"
                >
                  <Icon :icon="iconForFileType(f.type)" class="text-lg text-accent shrink-0" />
                  <a
                    :href="f.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex-1 min-w-0 text-sm text-white truncate hover:text-accent"
                  >
                    {{ f.name || '未命名' }}
                  </a>
                  <button
                    type="button"
                    class="p-1.5 rounded text-accent-muted hover:text-red-400 hover:bg-red-500/10"
                    title="删除"
                    @click="removeModuleFile(f.id)"
                  >
                    <Icon icon="mdi:delete-outline" class="text-lg" />
                  </button>
                </li>
                <li v-if="!(room?.moduleFiles?.length)" class="py-4 text-center text-sm text-accent-muted">
                  暂无文件，可下方添加链接
                </li>
              </ul>

              <!-- 添加文件（链接） -->
              <form class="space-y-2" @submit.prevent="addModuleFile">
                <input
                  v-model="newFile.name"
                  type="text"
                  placeholder="名称（如：规则说明.docx）"
                  class="w-full px-3 py-2 rounded-lg bg-chat-bg border border-chat-border text-white placeholder-accent-muted text-sm outline-none focus:border-accent"
                />
                <input
                  v-model="newFile.url"
                  type="url"
                  placeholder="文件链接（http(s) 或上传后得到的地址）"
                  class="w-full px-3 py-2 rounded-lg bg-chat-bg border border-chat-border text-white placeholder-accent-muted text-sm outline-none focus:border-accent"
                />
                <div class="flex gap-2">
                  <select
                    v-model="newFile.type"
                    class="px-3 py-2 rounded-lg bg-chat-bg border border-chat-border text-white text-sm outline-none focus:border-accent"
                  >
                    <option value="docx">Word 文档</option>
                    <option value="pdf">PDF</option>
                    <option value="image">图片</option>
                    <option value="other">其他</option>
                  </select>
                  <button
                    type="submit"
                    class="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:opacity-90"
                  >
                    添加
                  </button>
                </div>
                <p v-if="moduleFileMessage" class="text-sm" :class="moduleFileError ? 'text-red-400' : 'text-green-400'">
                  {{ moduleFileMessage }}
                </p>
              </form>
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
import { Menu, MenuButton, MenuItems, MenuItem, Dialog, DialogOverlay, DialogPanel, DialogTitle } from '@headlessui/vue'
import PageHeader from '../components/PageHeader.vue'
import RoomLogView from '../components/RoomLogView.vue'
import { APP_TITLE } from '../constants/app'
import { useGameRoomsStore } from '../stores/gameRooms'
import { useCharactersStore } from '../stores/characters'
import { useAuthStore } from '../stores/auth'
import { useCharacterCardModal } from '../composables/useCharacterCardModal'

const route = useRoute()
const router = useRouter()
const roomId = computed(() => route.params.id)
const auth = useAuthStore()

const { fetchRoom, setRoomCharacter, getRoomCharacter, updateModuleFiles } = useGameRoomsStore()
const { characters, fetchList, getById } = useCharactersStore()
const { openCharacterCard: openCharacterCardModal } = useCharacterCardModal()

const room = ref(null)
const loading = ref(true)
const activeTab = ref('info') // 'info' | 'log'
const moduleInfoOpen = ref(false)
const newFile = ref({ name: '', url: '', type: 'docx' })
const moduleFileMessage = ref('')
const moduleFileError = ref(false)

const isOwner = computed(() => {
  const u = auth.user?.value
  const r = room.value
  return u?.id && r?.ownerId && u.id === r.ownerId
})

const selectedCharacterId = computed(() => getRoomCharacter(roomId.value))

const currentCharacter = computed(() => {
  const id = selectedCharacterId.value
  return id ? getById(id) : null
})

const currentCharacterName = computed(() => {
  const c = currentCharacter.value
  return c?.name || '切换角色卡'
})

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
    full: 'bg-accent-muted/20 text-accent-muted',
    started: 'bg-blue-500/20 text-blue-400',
  }
  return map[status] || ''
}

function goBack() {
  router.push({ name: 'game-rooms' })
}

function iconForFileType(type) {
  const map = { docx: 'mdi:file-document-outline', pdf: 'mdi:file-pdf-box', image: 'mdi:image-outline', other: 'mdi:file-outline' }
  return map[type] || 'mdi:file-outline'
}

async function addModuleFile() {
  const name = newFile.value.name?.trim()
  const url = newFile.value.url?.trim()
  if (!name || !url) {
    moduleFileMessage.value = '请填写名称和链接'
    moduleFileError.value = true
    return
  }
  const list = [...(room.value?.moduleFiles || [])]
  const id = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
  list.push({ id, name, url, type: newFile.value.type })
  const res = await updateModuleFiles(roomId.value, list)
  moduleFileError.value = !res.ok
  moduleFileMessage.value = res.ok ? '已添加' : (res.message || '添加失败')
  if (res.ok) {
    room.value.moduleFiles = list
    newFile.value = { name: '', url: '', type: 'docx' }
    setTimeout(() => { moduleFileMessage.value = '' }, 2000)
  }
}

async function removeModuleFile(fileId) {
  const list = (room.value?.moduleFiles || []).filter((f) => f.id !== fileId)
  const res = await updateModuleFiles(roomId.value, list)
  if (res.ok) room.value.moduleFiles = list
  else {
    moduleFileMessage.value = res.message || '删除失败'
    moduleFileError.value = true
  }
}

async function load() {
  if (!roomId.value) return
  loading.value = true
  room.value = await fetchRoom(roomId.value)
  loading.value = false
  if (room.value) document.title = `${room.value.title} - 跑团 - ${APP_TITLE}`
}

onMounted(() => {
  fetchList()
  load()
})

watch(roomId, () => load())
</script>
