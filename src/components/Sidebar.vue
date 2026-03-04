<template>
  <!-- 遮罩层：点击关闭 -->
  <Transition name="backdrop">
    <div
      v-show="open"
      class="fixed inset-0 bg-black/50 z-40"
      aria-hidden="true"
      @click="close"
    />
  </Transition>
  <!-- 侧边栏：左侧抽屉，滑入滑出 -->
  <Transition name="drawer">
    <aside
      ref="sidebarEl"
      v-show="open"
      role="dialog"
      aria-modal="true"
      aria-label="主导航"
      class="fixed left-0 top-0 bottom-0 w-64 flex flex-col bg-base-100 overflow-hidden z-50 shadow-2xl rounded-r-3xl border-r border-base-200"
    >
    <!-- Logo / 应用名 -->
    <div class="h-16 flex items-center gap-3 px-6 shrink-0 mt-2">
      <div class="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
        <Icon icon="game-icons:fox-tail" class="text-xl" />
      </div>
      <span class="font-bold text-lg tracking-tight text-base-content flex-1">FOXTRPG</span>
      <ThemeSelector align="left" />
    </div>

    <!-- 主导航 -->
    <div class="flex-1 overflow-y-auto scroll-thin py-4 px-3 space-y-6">
      <!-- 功能模块 -->
      <div>
        <div class="px-3 text-[11px] font-bold text-base-content/40 uppercase tracking-wider mb-2">
          功能
        </div>
        <div class="space-y-1">
          <button
            v-for="item in navItems"
            :key="item.path"
            type="button"
            :class="[
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left transition-all active:scale-95',
              isActive(item)
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-base-content/70 hover:bg-base-200 hover:text-base-content',
            ]"
            @click="navigate(item)"
          >
            <Icon :icon="item.icon" class="text-xl shrink-0" />
            <span class="flex-1 truncate text-sm">{{ item.name }}</span>
            <span
              v-if="item.path === '/notifications' && notificationUnreadCount > 0"
              class="shrink-0 min-w-[1.25rem] h-5 px-1.5 rounded-full bg-primary text-primary-content text-[10px] font-bold flex items-center justify-center shadow-sm shadow-primary/30"
            >
              {{ notificationUnreadCount > 99 ? '99+' : notificationUnreadCount }}
            </span>
          </button>
        </div>
      </div>

      <!-- 频道模块 -->
      <div>
        <div class="px-3 text-[11px] font-bold text-base-content/40 uppercase tracking-wider mb-2">
          频道
        </div>
        <div class="space-y-1">
          <button
            v-for="ch in channels"
            :key="ch.id"
            type="button"
            :class="[
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left transition-all active:scale-95',
              currentPath === '/game-rooms' && currentChannelId === ch.id
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-base-content/70 hover:bg-base-200 hover:text-base-content',
            ]"
            @click="router.push('/game-rooms'); close()"
          >
            <Icon :icon="ch.icon" class="text-xl shrink-0" />
            <span class="flex-1 truncate text-sm">大厅</span>
          </button>
          
          <!-- 跑团：可收起展开 -->
          <Disclosure v-slot="{ open: runOpen }" as="div" class="mt-1">
            <DisclosureButton
              type="button"
              class="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left transition-all active:scale-95 text-base-content/70 hover:bg-base-200 hover:text-base-content"
            >
              <Icon icon="mdi:dice-multiple" class="text-xl shrink-0" />
              <span class="flex-1 truncate text-sm">跑团</span>
              <Icon
                :icon="runOpen ? 'mdi:chevron-up' : 'mdi:chevron-down'"
                class="text-lg shrink-0 text-base-content/40"
              />
            </DisclosureButton>
            <Transition
              enter-active-class="transition duration-200 ease-out"
              enter-from-class="opacity-0 -translate-y-2"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition duration-150 ease-in"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 -translate-y-2"
            >
              <DisclosurePanel class="pl-3 pr-1 py-1 space-y-2 mt-1">
                <!-- 我的房间 -->
                <div v-if="myGameRooms.length">
                  <div class="px-3 py-1 text-[10px] font-bold text-base-content/40 uppercase tracking-wider">
                    我的房间
                  </div>
                  <div class="space-y-0.5 mt-1">
                    <button
                      v-for="room in myGameRooms"
                      :key="room.id"
                      type="button"
                      class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all active:scale-95 text-xs text-base-content/70 hover:bg-base-200 hover:text-base-content"
                      @click="router.push({ name: 'game-room', params: { id: room.id } }); close()"
                    >
                      <div class="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0"></div>
                      <span class="flex-1 truncate">{{ room.title }}</span>
                    </button>
                  </div>
                </div>
                
                <!-- 模组子频道 -->
                <Disclosure
                  v-for="mod in modules"
                  :key="mod.id"
                  v-slot="{ open: modOpen }"
                  as="div"
                >
                  <div class="flex items-center gap-1 w-full min-w-0">
                    <DisclosureButton
                      type="button"
                      class="flex-1 flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all active:scale-95 min-w-0 text-xs text-base-content/70 hover:bg-base-200 hover:text-base-content"
                    >
                      <Icon :icon="mod.icon" class="text-sm shrink-0" />
                      <span class="flex-1 truncate font-medium">{{ mod.name }}</span>
                      <Icon
                        :icon="modOpen ? 'mdi:chevron-up' : 'mdi:chevron-down'"
                        class="text-sm shrink-0 text-base-content/40"
                      />
                    </DisclosureButton>
                    <button
                      v-if="isModuleKP(mod.id)"
                      type="button"
                      class="p-1.5 rounded-lg text-base-content/40 hover:text-primary hover:bg-primary/10 shrink-0 active:scale-95 transition-all"
                      title="创建子频道"
                      @click.stop="openCreateSubChannel(mod)"
                    >
                      <Icon icon="mdi:plus" class="text-sm" />
                    </button>
                  </div>
                  <Transition
                    enter-active-class="transition duration-150 ease-out"
                    enter-from-class="opacity-0 -translate-y-1"
                    enter-to-class="opacity-100 translate-y-0"
                    leave-active-class="transition duration-100 ease-in"
                    leave-from-class="opacity-100 translate-y-0"
                    leave-to-class="opacity-0 -translate-y-1"
                  >
                    <DisclosurePanel class="pl-7 pr-1 py-1 space-y-0.5">
                      <div
                        v-for="sub in visibleSubChannels(mod.id)"
                        :key="sub.id"
                        class="flex items-center gap-1 w-full min-w-0 group"
                      >
                        <button
                          type="button"
                          :class="[
                            'flex-1 flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all active:scale-95 min-w-0 text-xs',
                            currentPath === '/game-rooms' && currentChannelId === sub.id
                              ? 'bg-primary/10 text-primary font-medium'
                              : 'text-base-content/60 hover:bg-base-200 hover:text-base-content/90',
                          ]"
                          @click="selectChannel(sub.id)"
                        >
                          <span class="text-base-content/30">#</span>
                          <span class="flex-1 truncate">{{ sub.name }}</span>
                        </button>
                        <button
                          v-if="isModuleKP(mod.id)"
                          type="button"
                          class="p-1 rounded-md text-base-content/30 opacity-0 group-hover:opacity-100 hover:text-primary hover:bg-primary/10 shrink-0 active:scale-95 transition-all"
                          title="设置准入"
                          @click.stop="openSubChannelAccess(sub, mod)"
                        >
                          <Icon icon="mdi:cog" class="text-xs" />
                        </button>
                      </div>
                    </DisclosurePanel>
                  </Transition>
                </Disclosure>
              </DisclosurePanel>
            </Transition>
          </Disclosure>

          <!-- 管理后台：仅管理员可见，可收起展开，位于跑团下方 -->
          <Disclosure v-if="isAdminUser" v-slot="{ open: adminOpen }" as="div" class="mt-3">
            <DisclosureButton
              type="button"
              class="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left transition-all active:scale-95 text-base-content/70 hover:bg-base-200 hover:text-base-content"
            >
              <Icon icon="mdi:cog-outline" class="text-xl shrink-0" />
              <span class="flex-1 truncate text-sm">管理后台</span>
              <Icon
                :icon="adminOpen ? 'mdi:chevron-up' : 'mdi:chevron-down'"
                class="text-lg shrink-0 text-base-content/40"
              />
            </DisclosureButton>
            <Transition
              enter-active-class="transition duration-150 ease-out"
              enter-from-class="opacity-0 -translate-y-1"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition duration-100 ease-in"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 -translate-y-1"
            >
              <DisclosurePanel class="pl-3 pr-1 py-1 space-y-1 mt-1">
                <button
                  type="button"
                  :class="[
                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all active:scale-95 text-xs',
                    currentPath.startsWith('/admin/users')
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-base-content/70 hover:bg-base-200 hover:text-base-content',
                  ]"
                  @click="router.push('/admin/users'); close()"
                >
                  <Icon icon="mdi:account-supervisor" class="text-base shrink-0" />
                  <span class="flex-1 truncate">人员信息</span>
                </button>
                <button
                  type="button"
                  :class="[
                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all active:scale-95 text-xs',
                    currentPath.startsWith('/admin/ai')
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-base-content/70 hover:bg-base-200 hover:text-base-content',
                  ]"
                  @click="router.push('/admin/ai'); close()"
                >
                  <Icon icon="mdi:robot-outline" class="text-base shrink-0" />
                  <span class="flex-1 truncate">AI 配置</span>
                </button>
                <button
                  type="button"
                  :class="[
                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all active:scale-95 text-xs',
                    currentPath.startsWith('/admin/dice')
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-base-content/70 hover:bg-base-200 hover:text-base-content',
                  ]"
                  @click="router.push('/admin/dice'); close()"
                >
                  <Icon icon="mdi:dice-multiple-outline" class="text-base shrink-0" />
                  <span class="flex-1 truncate">骰子设置</span>
                </button>
                <button
                  type="button"
                  :class="[
                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all active:scale-95 text-xs',
                    currentPath.startsWith('/admin/achievements')
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-base-content/70 hover:bg-base-200 hover:text-base-content',
                  ]"
                  @click="router.push('/admin/achievements'); close()"
                >
                  <Icon icon="mdi:trophy-outline" class="text-base shrink-0" />
                  <span class="flex-1 truncate">成就管理</span>
                </button>
              </DisclosurePanel>
            </Transition>
          </Disclosure>
        </div>
      </div>
      
    </div>

    <!-- 用户信息 + 设置 (底部卡片) -->
    <div class="p-3 shrink-0 mb-2">
      <div v-if="avatarMessage" class="mb-2 px-3 py-2 rounded-xl text-xs font-medium text-center shadow-sm" :class="avatarMessage.startsWith('✓') ? 'text-success bg-success/10' : 'text-error bg-error/10'">
        {{ avatarMessage }}
      </div>
      <div class="bg-base-200 rounded-2xl p-2.5 flex items-center gap-3 shadow-sm border border-base-300">
        <input
          ref="avatarInputRef"
          type="file"
          accept="image/*"
          class="sr-only"
          aria-hidden="true"
          @change="onAvatarFileChange"
        />
        <div class="w-10 h-10 rounded-full bg-base-100 flex items-center justify-center shrink-0 overflow-hidden border border-base-300 shadow-sm relative group cursor-pointer" @click="triggerAvatarInput">
          <img v-if="authUser?.avatar" :src="authUser.avatar" alt="" class="w-full h-full object-cover" />
          <Icon v-else icon="mdi:account" class="text-xl text-base-content/40" />
          <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Icon icon="mdi:camera" class="text-white text-sm" />
          </div>
        </div>
        <div class="flex-1 min-w-0 flex flex-col justify-center">
          <span class="truncate text-sm font-bold text-base-content leading-tight">{{ displayName }}</span>
          <span class="truncate text-[10px] text-base-content/50 mt-0.5">在线</span>
        </div>
        <Menu as="div" class="relative">
          <MenuButton
            type="button"
            class="w-8 h-8 flex items-center justify-center rounded-xl text-base-content/50 hover:text-base-content hover:bg-base-300 transition-all active:scale-95"
            title="设置"
            aria-label="设置"
          >
            <Icon icon="mdi:dots-vertical" class="text-xl" />
          </MenuButton>
          <transition
            enter-active-class="transition duration-150 ease-out"
            enter-from-class="opacity-0 translate-y-2 scale-95"
            enter-to-class="opacity-100 translate-y-0 scale-100"
            leave-active-class="transition duration-100 ease-in"
            leave-from-class="opacity-100 translate-y-0 scale-100"
            leave-to-class="opacity-0 translate-y-2 scale-95"
          >
            <MenuItems
              class="absolute right-0 bottom-[calc(100%+8px)] w-48 rounded-2xl bg-base-100 border border-base-200 shadow-xl p-2 z-[9999] focus:outline-none space-y-1"
            >
              <MenuItem v-slot="{ active }">
                <button
                  type="button"
                  :class="[
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition-all active:scale-95',
                    active ? 'bg-base-200 text-base-content font-medium' : 'text-base-content/70',
                  ]"
                  @click="openNicknameDialog"
                >
                  <Icon icon="mdi:account-edit" class="text-lg shrink-0 text-base-content/50" />
                  修改名称
                </button>
              </MenuItem>
              <div class="h-px bg-base-200 my-1 mx-2"></div>
              <MenuItem v-slot="{ active }">
                <button
                  type="button"
                  :class="[
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition-all active:scale-95',
                    active ? 'bg-error/10 text-error font-medium' : 'text-error/80',
                  ]"
                  @click.prevent="handleLogout"
                >
                  <Icon icon="mdi:logout" class="text-lg shrink-0" />
                  退出登录
                </button>
              </MenuItem>
            </MenuItems>
          </transition>
        </Menu>
      </div>
    </div>

      <!-- 修改昵称弹窗 -->
      <BottomSheet v-model:open="nicknameDialogOpen" title="用户名 / 昵称">
        <p class="text-xs text-base-content/60 mb-4">好友通过此用户名搜索并添加你，聊天中也会显示此名。</p>
        <div class="flex gap-2 mb-2">
          <input
            v-model="nicknameInput"
            type="text"
            class="input input-bordered flex-1 text-sm focus:outline-none"
            placeholder="输入用户名"
            @keydown.enter="confirmNickname"
          >
          <button
            type="button"
            class="btn btn-primary"
            @click="confirmNickname"
          >
            确认
          </button>
        </div>
        <p v-if="nicknameMessage" :class="nicknameMessage.startsWith('✓') ? 'text-sm text-success' : 'text-sm text-error'">
          {{ nicknameMessage }}
        </p>
      </BottomSheet>

      <!-- 创建子频道弹窗（仅 KP）：仅打开时挂载 -->
      <BottomSheet v-model:open="createSubChannelDialogOpen" :title="createSubChannelModule ? `在「${createSubChannelModule.name}」下创建子频道` : '创建子频道'">
        <input
          v-model="createSubChannelName"
          type="text"
          class="input input-bordered w-full mb-4 focus:outline-none"
          placeholder="子频道名称"
          @keydown.enter="confirmCreateSubChannel"
        >
        <div class="flex justify-end gap-2">
          <button
            type="button"
            class="btn btn-ghost flex-1"
            @click="closeCreateSubChannelDialog"
          >
            取消
          </button>
          <button
            type="button"
            class="btn btn-primary flex-1"
            @click="confirmCreateSubChannel"
          >
            创建
          </button>
        </div>
      </BottomSheet>

      <!-- 子频道用户设置弹窗：仅打开时挂载 -->
      <BottomSheet v-model:open="accessDialogOpen" :title="accessSubChannel ? `「${accessSubChannel.name}」用户设置` : '用户设置'">
        <div class="space-y-2 mb-4">
          <div
            v-for="u in otherUsers"
            :key="u.id"
            class="flex items-center gap-3 py-2 border-b border-base-300 last:border-0"
          >
            <span class="flex-1 min-w-0 text-sm text-base-content truncate" :title="u.name">{{ u.name }}</span>
            <select
              :value="getAccessLevel(u.id)"
              class="select select-bordered select-sm shrink-0 outline-none"
              @change="setAccessLevel(u.id, ($event.target).value)"
            >
              <option value="none">禁止进入</option>
              <option value="readonly">仅进入</option>
              <option value="full">可发言</option>
            </select>
          </div>
          <p v-if="otherUsers.length === 0" class="text-xs text-base-content/60 py-2">暂无其他用户</p>
        </div>
        <div class="flex justify-end gap-2">
          <button
            type="button"
            class="btn btn-ghost flex-1"
            @click="closeAccessDialog"
          >
            取消
          </button>
          <button
            type="button"
            class="btn btn-primary flex-1"
            @click="saveSubChannelAccess"
          >
            保存
          </button>
        </div>
      </BottomSheet>
    </aside>
  </Transition>
</template>

<script setup>
import { computed, watch, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { Menu, MenuButton, MenuItems, MenuItem, Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
import BottomSheet from './BottomSheet.vue'
import { useChatStore } from '../stores/chat'
import { useAuthStore } from '../stores/auth'
import { useGameRoomsStore } from '../stores/gameRooms'
import { useNotificationsStore } from '../stores/notifications'
import { useFriendsStore } from '../stores/friends'
import ThemeSelector from './ThemeSelector.vue'
import { useSwipe } from '@vueuse/core'

const props = defineProps({
  open: { type: Boolean, default: true },
})
const emit = defineEmits(['update:open'])

const sidebarEl = ref(null)
const { isSwiping, direction, lengthX } = useSwipe(sidebarEl)

watch(isSwiping, (swiping) => {
  if (!swiping && props.open) {
    if (direction.value === 'left' && lengthX.value > 30) {
      emit('update:open', false)
    }
  }
})

// 打开时：按 Esc 关闭、锁定背景滚动
function onEscape(e) {
  if (e.key === 'Escape') emit('update:open', false)
}

const router = useRouter()
const route = router.currentRoute
const dmChannelQuery = computed(() => route.value?.query?.dm ?? '')
const {
  channels,
  modules,
  directChannels,
  currentChannelId,
  setChannel,
  currentUser,
  onlineUsers,
  updateNickname,
  logout,
  isModuleKP,
  visibleSubChannels,
  createSubChannel,
  updateSubChannelAccess,
} = useChatStore()
const { rooms: gameRooms, fetchRooms } = useGameRoomsStore()
const authStore = useAuthStore()
const { unreadCount: notificationUnreadCount, fetchUnreadCount: fetchNotificationUnread } = useNotificationsStore()
const { friends } = useFriendsStore()

function getDirectChannelAvatar(dm) {
  if (dm.avatar) return dm.avatar
  const friend = friends.value.find((f) => f.id === dm.peerId)
  return friend?.avatar || null
}

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onEscape)
    fetchRooms()
    fetchNotificationUnread()
  } else {
    document.body.style.overflow = ''
    document.removeEventListener('keydown', onEscape)
  }
}, { immediate: true })
onUnmounted(() => {
  document.body.style.overflow = ''
  document.removeEventListener('keydown', onEscape)
})

const authUser = computed(() => authStore.user?.value ?? null)

const displayName = computed(() => {
  const u = authUser.value
  if (u?.username) return u.username
  if (u?.email) return u.email.split('@')[0]
  return currentUser.value?.name ?? '我'
})

const myGameRooms = computed(() => {
  const uid = authStore.user?.value?.id
  if (!uid) return []
  return gameRooms.value.filter(
    (r) => r.ownerId === uid || r.myApplicationStatus === 'accepted'
  )
})

const dmOpen = ref(true)

const avatarInputRef = ref(null)
const avatarMessage = ref('')

function triggerAvatarInput() {
  avatarInputRef.value?.click()
}

async function onAvatarFileChange(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  avatarMessage.value = ''
  const res = await authStore.uploadAvatar(file)
  if (res.ok) {
    avatarMessage.value = '✓ 头像已更新'
    setTimeout(() => { avatarMessage.value = '' }, 2000)
  } else {
    avatarMessage.value = res.message || '上传失败'
  }
}

const nicknameDialogOpen = ref(false)
const nicknameInput = ref('')
const nicknameMessage = ref('')
watch(() => currentUser.value?.name, (name) => {
  nicknameInput.value = name ?? ''
}, { immediate: true })

function openNicknameDialog() {
  nicknameInput.value = currentUser.value?.name ?? ''
  nicknameMessage.value = ''
  nicknameDialogOpen.value = true
}

async function confirmNickname() {
  nicknameMessage.value = ''
  const res = await updateNickname(nicknameInput.value)
  if (res?.ok) {
    nicknameMessage.value = '✓ 用户名已更新'
    setTimeout(() => {
      nicknameDialogOpen.value = false
      nicknameMessage.value = ''
    }, 1000)
  } else if (res?.message) {
    nicknameMessage.value = res.message
  }
}

function closeNicknameDialog() {
  nicknameDialogOpen.value = false
}

function handleLogout() {
  const auth = useAuthStore()
  auth.logout()
  logout()
  emit('update:open', false)
  router.replace({ path: '/', query: {} })
}

const isAdminUser = computed(() => authStore.user?.value?.role === 'admin')

const navItems = computed(() => {
  const items = [
    { path: '/friends', name: '好友', icon: 'mdi:account-group-outline' },
    { path: '/characters', name: '角色卡', icon: 'mdi:card-account-details-outline' },
    { path: '/notes', name: '笔记', icon: 'mdi:note-text-outline' },
    { path: '/achievements', name: '成就', icon: 'mdi:trophy-outline' },
    { path: '/notifications', name: '消息', icon: 'mdi:bell-outline' },
  ]
  return items
})

const currentPath = computed(() => router.currentRoute.value.path)
function isActive(item) {
  return currentPath.value.startsWith(item.path)
}

function navigate(item) {
  router.push(item.path)
  close()
}

function selectChannel(channelId) {
  setChannel(channelId)
  router.push('/game-rooms')
  close()
}

function selectDirectMessage(dm) {
  if (!dm?.id) return
  setChannel(dm.id)
  router.push({ path: '/friends', query: { dm: dm.id } })
  close()
}

function close() {
  emit('update:open', false)
}

// ---------- 子频道：创建 ----------
const createSubChannelDialogOpen = ref(false)
const createSubChannelModule = ref(null)
const createSubChannelName = ref('')

function openCreateSubChannel(mod) {
  createSubChannelModule.value = mod
  createSubChannelName.value = ''
  createSubChannelDialogOpen.value = true
}

function confirmCreateSubChannel() {
  const mod = createSubChannelModule.value
  if (!mod) return
  const name = createSubChannelName.value?.trim() || '未命名'
  createSubChannel(mod.id, name)
  createSubChannelDialogOpen.value = false
  createSubChannelModule.value = null
}

function closeCreateSubChannelDialog() {
  createSubChannelDialogOpen.value = false
}

const accessDialogOpen = ref(false)
const accessSubChannel = ref(null)
const accessModule = ref(null)
const accessUserLevels = ref({})

const otherUsers = computed(() =>
  onlineUsers.value.filter((u) => u.id !== currentUser.value.id)
)

function openSubChannelAccess(sub, mod) {
  accessSubChannel.value = sub
  accessModule.value = mod
  const ua = sub.userAccess || {}
  const next = {}
  for (const u of otherUsers.value) {
    next[u.id] = ua[u.id] === 'none' || ua[u.id] === 'readonly' || ua[u.id] === 'full' ? ua[u.id] : 'full'
  }
  accessUserLevels.value = next
  accessDialogOpen.value = true
}

function getAccessLevel(uid) {
  return accessUserLevels.value[uid] ?? 'full'
}

function setAccessLevel(uid, level) {
  accessUserLevels.value = { ...accessUserLevels.value, [uid]: level }
}

function saveSubChannelAccess() {
  if (!accessSubChannel.value) return
  updateSubChannelAccess(accessSubChannel.value.id, { userAccess: { ...accessUserLevels.value } })
  accessDialogOpen.value = false
  accessSubChannel.value = null
  accessModule.value = null
}

function closeAccessDialog() {
  accessDialogOpen.value = false
}
</script>

<style scoped>
.backdrop-enter-active,
.backdrop-leave-active {
  transition: opacity 0.2s ease;
}
.backdrop-enter-from,
.backdrop-leave-to {
  opacity: 0;
}

.drawer-enter-active,
.drawer-leave-active {
  transition: transform 0.2s ease;
}
.drawer-enter-from,
.drawer-leave-to {
  transform: translateX(-100%);
}
</style>
