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
      v-show="open"
      role="dialog"
      aria-modal="true"
      aria-label="主导航"
      class="fixed left-0 top-0 bottom-0 w-60 flex flex-col bg-sidebar border-r border-chat-border overflow-hidden z-50 shadow-xl"
    >
    <!-- Logo / 应用名 -->
    <div class="h-14 flex items-center gap-2 px-4 border-b border-chat-border shrink-0">
      <Icon icon="game-icons:fox-tail" class="text-2xl text-accent shrink-0" />
      <span class="font-semibold text-white truncate">FOXTRPG</span>
      <button
        type="button"
        class="ml-auto p-1.5 rounded-lg text-accent-muted hover:text-white hover:bg-sidebar-hover transition-colors"
        title="收起侧边栏"
        aria-label="收起侧边栏"
        @click="close"
      >
        <Icon icon="mdi:chevron-left" class="text-xl" />
      </button>
    </div>

    <!-- 主导航 -->
    <div class="flex-1 overflow-y-auto scroll-thin py-2">
      <div class="px-2 text-xs font-medium text-accent-muted uppercase tracking-wider mb-1">
        功能
      </div>
      <button
        v-for="item in navItems"
        :key="item.path"
        type="button"
        :class="[
          'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors',
          isActive(item)
            ? 'bg-sidebar-active text-white'
            : 'text-[#a6adc8] hover:bg-sidebar-hover hover:text-white',
        ]"
        @click="navigate(item)"
      >
        <Icon :icon="item.icon" class="text-lg shrink-0" />
        <span class="flex-1 truncate">{{ item.name }}</span>
      </button>

      <!-- 频道（仅在消息页显示） -->
      <template v-if="isChatActive">
        <div class="px-2 text-xs font-medium text-accent-muted uppercase tracking-wider mb-1 mt-4">
          频道
        </div>
        <button
          v-for="ch in channels"
          :key="ch.id"
          type="button"
          :class="[
            'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors',
            currentChannelId === ch.id
              ? 'bg-sidebar-active text-white'
              : 'text-[#a6adc8] hover:bg-sidebar-hover hover:text-white',
          ]"
          @click="setChannel(ch.id)"
        >
          <Icon :icon="ch.icon" class="text-lg shrink-0" />
          <span class="flex-1 truncate">{{ ch.name }}</span>
          <span v-if="ch.unread" class="text-xs bg-accent text-chat-bg rounded-full px-1.5 min-w-[1.25rem] text-center">
            {{ ch.unread }}
          </span>
        </button>

        <!-- 跑团：可收起展开，展示模组；每个模组可展开显示子频道 -->
        <Disclosure v-slot="{ open: runOpen }" as="div" class="mt-1">
          <DisclosureButton
            type="button"
            :class="[
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors',
              'text-[#a6adc8] hover:bg-sidebar-hover hover:text-white',
            ]"
          >
            <Icon icon="mdi:dice-multiple" class="text-lg shrink-0" />
            <span class="flex-1 truncate">跑团</span>
            <Icon
              :icon="runOpen ? 'mdi:chevron-up' : 'mdi:chevron-down'"
              class="text-lg shrink-0 text-accent-muted"
            />
          </DisclosureButton>
          <Transition
            enter-active-class="transition duration-100 ease-out"
            enter-from-class="opacity-0 -translate-y-1"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition duration-75 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 -translate-y-1"
          >
            <DisclosurePanel class="pl-2 pr-2 py-1">
              <!-- 每个模组：可再展开显示子频道 -->
              <Disclosure
                v-for="mod in modules"
                :key="mod.id"
                v-slot="{ open: modOpen }"
                as="div"
                class="mb-0.5"
              >
                <div class="flex items-center gap-1 w-full min-w-0">
                  <DisclosureButton
                    type="button"
                    :class="[
                      'flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors min-w-0',
                      'text-[#a6adc8] hover:bg-sidebar-hover hover:text-white',
                    ]"
                  >
                    <Icon :icon="mod.icon" class="text-base shrink-0" />
                    <span class="flex-1 truncate">{{ mod.name }}</span>
                    <Icon
                      :icon="modOpen ? 'mdi:chevron-up' : 'mdi:chevron-down'"
                      class="text-base shrink-0 text-accent-muted"
                    />
                  </DisclosureButton>
                  <button
                    v-if="isModuleKP(mod.id)"
                    type="button"
                    class="p-1.5 rounded-lg text-accent-muted hover:text-white hover:bg-sidebar-hover shrink-0"
                    title="创建子频道"
                    @click.stop="openCreateSubChannel(mod)"
                  >
                    <Icon icon="mdi:plus" class="text-lg" />
                  </button>
                </div>
                <Transition
                  enter-active-class="transition duration-100 ease-out"
                  enter-from-class="opacity-0 -translate-y-1"
                  enter-to-class="opacity-100 translate-y-0"
                  leave-active-class="transition duration-75 ease-in"
                  leave-from-class="opacity-100 translate-y-0"
                  leave-to-class="opacity-0 -translate-y-1"
                >
                  <DisclosurePanel class="pl-6 pr-1 py-1">
                    <div
                      v-for="sub in visibleSubChannels(mod.id)"
                      :key="sub.id"
                      class="flex items-center gap-1 w-full min-w-0 group"
                    >
                      <button
                        type="button"
                        :class="[
                          'flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg text-left transition-colors min-w-0 text-sm',
                          currentChannelId === sub.id
                            ? 'bg-sidebar-active text-white'
                            : 'text-[#a6adc8] hover:bg-sidebar-hover hover:text-white',
                        ]"
                        @click="setChannel(sub.id)"
                      >
                        <Icon icon="mdi:forum-outline" class="text-sm shrink-0" />
                        <span class="flex-1 truncate">{{ sub.name }}</span>
                      </button>
                      <button
                        v-if="isModuleKP(mod.id)"
                        type="button"
                        class="p-1 rounded-lg text-accent-muted opacity-0 group-hover:opacity-100 hover:text-white hover:bg-sidebar-hover shrink-0"
                        title="设置准入"
                        @click.stop="openSubChannelAccess(sub, mod)"
                      >
                        <Icon icon="mdi:account-cog-outline" class="text-base" />
                      </button>
                    </div>
                  </DisclosurePanel>
                </Transition>
              </Disclosure>
            </DisclosurePanel>
          </Transition>
        </Disclosure>
      </template>
    </div>

    <!-- 用户信息 + 设置 -->
    <div class="border-t border-chat-border px-3 py-2 shrink-0 flex items-center gap-2">
      <div class="w-8 h-8 rounded-full bg-sidebar-active flex items-center justify-center shrink-0">
        <Icon icon="mdi:account" class="text-accent" />
      </div>
      <span class="flex-1 truncate text-sm text-[#a6adc8]">{{ currentUser.name }}</span>
      <Menu as="div" class="relative">
        <MenuButton
          type="button"
          class="p-1.5 rounded-lg text-accent-muted hover:text-white hover:bg-sidebar-hover transition-colors"
          title="设置"
          aria-label="设置"
        >
          <Icon icon="mdi:cog-outline" class="text-lg" />
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
            class="absolute right-0 bottom-full mb-2 w-48 rounded-xl bg-sidebar border border-chat-border shadow-xl py-1 z-[9999] focus:outline-none"
          >
            <MenuItem v-slot="{ active }">
              <button
                type="button"
                :class="[
                  'w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
                  active ? 'bg-sidebar-hover text-white' : 'text-[#a6adc8]',
                ]"
                @click="openNicknameDialog"
              >
                <Icon icon="mdi:account-edit-outline" class="text-lg shrink-0" />
                修改昵称
              </button>
            </MenuItem>
            <MenuItem v-slot="{ active }">
              <button
                type="button"
                :class="[
                  'w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
                  active ? 'bg-sidebar-hover text-white' : 'text-[#a6adc8]',
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

      <!-- 修改昵称弹窗：仅打开时挂载，避免 Portal 在渲染外调用 slot 触发 Vue 警告 -->
      <Dialog v-if="nicknameDialogOpen" :open="true" @close="closeNicknameDialog" class="relative z-[10000]">
        <DialogOverlay class="fixed inset-0 bg-black/50" />
        <div class="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel class="w-full max-w-sm rounded-xl bg-sidebar border border-chat-border shadow-xl p-4 focus:outline-none">
            <DialogTitle class="text-sm font-medium text-accent-muted uppercase tracking-wider mb-3">
              修改昵称
            </DialogTitle>
            <div class="flex gap-2">
              <input
                v-model="nicknameInput"
                type="text"
                class="flex-1 min-w-0 px-3 py-2 rounded-lg bg-chat-bg border border-chat-border text-white placeholder-accent-muted focus:border-accent outline-none"
                placeholder="昵称"
                @keydown.enter="confirmNickname"
              >
              <button
                type="button"
                class="px-4 py-2 rounded-lg bg-accent text-chat-bg font-medium hover:opacity-90 shrink-0"
                @click="confirmNickname"
              >
                确认
              </button>
            </div>
            <div class="mt-3 flex justify-end">
              <button
                type="button"
                class="px-3 py-1.5 rounded-lg text-accent-muted hover:text-white text-sm"
                @click="closeNicknameDialog"
              >
                取消
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      <!-- 创建子频道弹窗（仅 KP）：仅打开时挂载 -->
      <Dialog v-if="createSubChannelDialogOpen" :open="true" @close="closeCreateSubChannelDialog" class="relative z-[10000]">
        <DialogOverlay class="fixed inset-0 bg-black/50" />
        <div class="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel class="w-full max-w-sm rounded-xl bg-sidebar border border-chat-border shadow-xl p-4 focus:outline-none">
            <DialogTitle class="text-sm font-medium text-accent-muted uppercase tracking-wider mb-3">
              {{ createSubChannelModule ? `在「${createSubChannelModule.name}」下创建子频道` : '创建子频道' }}
            </DialogTitle>
            <input
              v-model="createSubChannelName"
              type="text"
              class="w-full px-3 py-2 rounded-lg bg-chat-bg border border-chat-border text-white placeholder-accent-muted focus:border-accent outline-none mb-3"
              placeholder="子频道名称"
              @keydown.enter="confirmCreateSubChannel"
            >
            <div class="flex justify-end gap-2">
              <button
                type="button"
                class="px-3 py-1.5 rounded-lg text-accent-muted hover:text-white text-sm"
                @click="closeCreateSubChannelDialog"
              >
                取消
              </button>
              <button
                type="button"
                class="px-4 py-2 rounded-lg bg-accent text-chat-bg font-medium hover:opacity-90 text-sm"
                @click="confirmCreateSubChannel"
              >
                创建
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      <!-- 子频道用户设置弹窗：仅打开时挂载 -->
      <Dialog v-if="accessDialogOpen" :open="true" @close="closeAccessDialog" class="relative z-[10000]">
        <DialogOverlay class="fixed inset-0 bg-black/50" />
        <div class="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel class="w-full max-w-md rounded-xl bg-sidebar border border-chat-border shadow-xl p-4 max-h-[80vh] overflow-y-auto focus:outline-none">
            <DialogTitle class="text-sm font-medium text-accent-muted uppercase tracking-wider mb-3">
              {{ accessSubChannel ? `「${accessSubChannel.name}」用户设置` : '用户设置' }}
            </DialogTitle>
            <div class="space-y-2 mb-4 max-h-64 overflow-y-auto">
              <div
                v-for="u in otherUsers"
                :key="u.id"
                class="flex items-center gap-3 py-2 border-b border-chat-border/50 last:border-0"
              >
                <span class="flex-1 min-w-0 text-sm text-[#a6adc8] truncate" :title="u.name">{{ u.name }}</span>
                <select
                  :value="getAccessLevel(u.id)"
                  class="shrink-0 px-3 py-1.5 rounded-lg bg-chat-bg border border-chat-border text-white text-sm focus:border-accent outline-none"
                  @change="setAccessLevel(u.id, ($event.target).value)"
                >
                  <option value="none">禁止进入</option>
                  <option value="readonly">仅进入</option>
                  <option value="full">可发言</option>
                </select>
              </div>
              <p v-if="otherUsers.length === 0" class="text-xs text-accent-muted py-2">暂无其他用户</p>
            </div>
            <div class="flex justify-end gap-2">
              <button
                type="button"
                class="px-3 py-1.5 rounded-lg text-accent-muted hover:text-white text-sm"
                @click="closeAccessDialog"
              >
                取消
              </button>
              <button
                type="button"
                class="px-4 py-2 rounded-lg bg-accent text-chat-bg font-medium hover:opacity-90 text-sm"
                @click="saveSubChannelAccess"
              >
                保存
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
    </aside>
  </Transition>
</template>

<script setup>
import { computed, watch, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { Menu, MenuButton, MenuItems, MenuItem, Dialog, DialogOverlay, DialogPanel, DialogTitle, Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
import { useChatStore } from '../stores/chat'
import { useAuthStore } from '../stores/auth'

const props = defineProps({
  open: { type: Boolean, default: true },
})
const emit = defineEmits(['update:open'])

// 打开时：按 Esc 关闭、锁定背景滚动
function onEscape(e) {
  if (e.key === 'Escape') emit('update:open', false)
}
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onEscape)
  } else {
    document.body.style.overflow = ''
    document.removeEventListener('keydown', onEscape)
  }
}, { immediate: true })
onUnmounted(() => {
  document.body.style.overflow = ''
  document.removeEventListener('keydown', onEscape)
})

const router = useRouter()
const {
  channels,
  modules,
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

const nicknameDialogOpen = ref(false)
const nicknameInput = ref('')
watch(() => currentUser.value?.name, (name) => {
  nicknameInput.value = name ?? ''
}, { immediate: true })

function openNicknameDialog() {
  nicknameInput.value = currentUser.value?.name ?? ''
  nicknameDialogOpen.value = true
}

function confirmNickname() {
  updateNickname(nicknameInput.value)
  nicknameDialogOpen.value = false
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

const navItems = [
  { path: '/chat', name: '消息', icon: 'mdi:forum-outline' },
  { path: '/friends', name: '好友', icon: 'mdi:account-group-outline' },
  { path: '/characters', name: '角色卡', icon: 'mdi:card-account-details-outline' },
  { path: '/notifications', name: '系统通知', icon: 'mdi:bell-outline' },
  { path: '/notes', name: '笔记', icon: 'mdi:note-text-outline' },
]

const currentPath = computed(() => router.currentRoute.value.path)
const isChatActive = computed(() => currentPath.value === '/chat')
function isActive(item) {
  if (item.path === '/chat') return currentPath.value === '/chat'
  return currentPath.value.startsWith(item.path)
}

function navigate(item) {
  router.push(item.path)
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
