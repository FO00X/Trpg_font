<template>
  <div class="flex flex-col h-full">
    <!-- 频道头部 -->
    <header class="h-14 shrink-0 flex items-center gap-2 px-4 border-b border-chat-border bg-chat-panel">
      <button
        type="button"
        class="p-2 -ml-2 rounded-lg text-accent-muted hover:text-white hover:bg-white/5 transition-colors"
        :title="sidebarOpen ? '收起侧边栏' : '展开侧边栏'"
        :aria-label="sidebarOpen ? '收起侧边栏' : '展开侧边栏'"
        @click="$emit('toggle-sidebar')"
      >
        <Icon :icon="sidebarOpen ? 'mdi:backburger' : 'mdi:menu'" class="text-xl" />
      </button>
      <Icon :icon="currentChannel?.icon || 'mdi:hash'" class="text-xl text-accent shrink-0" />
      <h1 class="font-semibold text-white truncate min-w-0 flex-1">{{ currentChannel?.name || '频道' }}</h1>

      <!-- 跑团频道：右上角人员按钮，点击下拉展示成员列表 -->
      <div v-if="isSubChannel" class="ml-auto flex items-center">
        <Menu as="div" class="relative">
          <MenuButton
            type="button"
            class="p-2 rounded-lg text-accent-muted hover:text-white hover:bg-white/5 transition-colors"
            title="当前玩家与角色"
            aria-label="当前玩家与角色"
          >
            <Icon icon="mdi:account-group" class="text-xl" />
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
              class="absolute right-0 top-full mt-2 w-52 max-h-72 overflow-y-auto rounded-lg bg-sidebar border border-chat-border shadow-xl py-0.5 z-[100] focus:outline-none scroll-thin"
            >
              <div
                v-for="m in currentChannelMembers"
                :key="m.userId"
                class="border-b border-chat-border/50 last:border-0"
              >
                <div class="flex items-center gap-2 px-2.5 py-2 text-left min-w-0">
                  <div class="w-7 h-7 rounded-full bg-sidebar-active flex items-center justify-center shrink-0 text-xs font-medium text-accent overflow-hidden">
                    <img v-if="getMemberAvatar(m)" :src="getMemberAvatar(m)" alt="" class="w-full h-full object-cover" />
                    <span v-else class="leading-none">{{ getMemberAvatarLetter(m) }}</span>
                  </div>
                  <div class="min-w-0 flex-1 flex flex-col">
                    <span class="text-white text-xs font-medium truncate">{{ getMemberDisplayName(m) }}</span>
                    <span v-if="showMemberSubtitle(m)" class="text-accent-muted text-[11px] truncate">{{ m.userName }}</span>
                  </div>
                  <!-- KP 不显示切换角色卡，固定为 KP 身份 -->
                  <button
                    v-if="isCurrentUser(m) && !isCurrentChannelKP"
                    type="button"
                    class="shrink-0 p-1.5 rounded text-accent-muted hover:text-accent hover:bg-white/5"
                    title="切换角色卡"
                    @click.stop="toggleCharacterPicker(m.userId)"
                  >
                    <Icon icon="mdi:card-account-details-outline" class="text-base" />
                  </button>
                </div>
                <!-- 当前用户（且非 KP）：展开的角色卡列表；KP 不切换角色卡 -->
                <div v-if="isCurrentUser(m) && !isCurrentChannelKP && characterPickerUserId === m.userId" class="pb-2 px-2.5">
                  <div class="pl-9 pr-1 space-y-0.5">
                    <button
                      v-for="c in myCharacters"
                      :key="c.id"
                      type="button"
                      :class="[
                        'w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs',
                        m.characterId === c.id ? 'bg-accent/20 text-accent' : 'text-accent-muted hover:bg-white/5 hover:text-white',
                      ]"
                      @click.stop="selectCharacter(m.userId, c.id)"
                    >
                      <span class="truncate">{{ c.name || '未命名' }}</span>
                    </button>
                    <button
                      type="button"
                      class="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs text-accent-muted hover:bg-white/5 hover:text-white"
                      @click.stop="selectCharacter(m.userId, null)"
                    >
                      不选角色
                    </button>
                  </div>
                </div>
              </div>
              <p v-if="!currentChannelMembers.length" class="px-2.5 py-3 text-accent-muted text-xs">暂无成员</p>
            </MenuItems>
          </transition>
        </Menu>
      </div>
    </header>

    <!-- 消息列表 -->
    <MessageList class="flex-1 overflow-y-auto min-h-0" />

    <!-- 输入区 -->
    <MessageInput class="shrink-0" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'
import { Menu, MenuButton, MenuItems } from '@headlessui/vue'
import { useChatStore } from '../stores/chat'
import { useCharactersStore } from '../stores/characters'
import MessageList from './MessageList.vue'
import MessageInput from './MessageInput.vue'

defineProps({
  sidebarOpen: { type: [Boolean, Object], default: true },
})
defineEmits(['toggle-sidebar'])

const { currentChannel, currentChannelId, fetchMessages, isSubChannel, currentChannelMembers, currentUser, setMyCharacterInChannel, isCurrentChannelKP } = useChatStore()

// 轮询拉取新消息（Realtime 未生效时仍能收到他人消息，如大厅）
let pollTimer = null
onMounted(() => {
  pollTimer = setInterval(() => {
    const id = currentChannelId.value
    if (id) fetchMessages(id, { limit: 50 })
  }, 8000)
})
onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})
const { characters: myCharacters, getById: getCharacterById } = useCharactersStore()

const characterPickerUserId = ref(null)

function isCurrentUser(m) {
  return m.userId === currentUser.value?.id
}

function toggleCharacterPicker(userId) {
  characterPickerUserId.value = characterPickerUserId.value === userId ? null : userId
}

function selectCharacter(userId, characterId) {
  if (userId === currentUser.value?.id) {
    setMyCharacterInChannel(characterId)
    characterPickerUserId.value = null
  }
}

function getMemberDisplayName(m) {
  if (isCurrentUser(m) && isCurrentChannelKP) return 'KP'
  if (m.characterId) {
    const c = getCharacterById(m.characterId)
    return c?.name || '未命名'
  }
  return m.userName || '未知'
}

function showMemberSubtitle(m) {
  if (isCurrentUser(m) && isCurrentChannelKP) return true
  return !!m.characterId
}

function getMemberAvatar(m) {
  if (isCurrentUser(m) && isCurrentChannelKP) return null
  if (m.characterId) {
    const c = getCharacterById(m.characterId)
    return c?.avatar || c?.portrait || null
  }
  return null
}

function getMemberAvatarLetter(m) {
  const name = getMemberDisplayName(m)
  return (name || '?').slice(0, 1)
}
</script>