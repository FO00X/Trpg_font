<template>
  <div class="p-3 sm:p-4 border-t border-base-300  shrink-0 min-w-0">
    <p v-if="isCurrentChannelReadOnly()" class="text-xs text-base-content mb-2">
      当前子频道仅可查看，不可发言。
    </p>
    <div class="flex items-end gap-2 min-w-0">
      <!-- KP 发言角色切换（仅当前频道为子频道且当前用户为该模组 KP 时显示） -->
      <div v-if="isCurrentChannelKP && !isCurrentChannelReadOnly()" class="shrink-0 flex flex-col gap-1 min-w-0">
        <span class="text-[11px] text-base-content px-1 truncate">发言身份</span>
        <Menu as="div" class="relative min-w-0">
          <MenuButton
            type="button"
            class="h-10 w-[3.5rem] sm:w-auto sm:min-w-[4rem] sm:max-w-[6rem] px-2 sm:px-2.5 pr-7 sm:pr-8 rounded-lg bg-base-100 border border-base-300 text-sm text-base-content focus:border-accent/50 outline-none cursor-pointer text-left truncate"
            :title="speakerRoleFullLabel"
          >
            <span class="truncate block">{{ speakerRoleDisplayLabel }}</span>
            <Icon icon="mdi:chevron-down" class="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content pointer-events-none shrink-0" />
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
              class="absolute left-0 bottom-full mb-1 w-40 max-h-48 overflow-y-auto rounded-lg bg-base-100 border border-base-300 shadow-xl py-0.5 z-[100] focus:outline-none scroll-thin"
            >
              <button
                type="button"
                :class="['w-full px-2.5 py-2 text-left text-sm', speakerRole === 'kp' ? 'bg-accent/20 text-accent' : 'text-base-content hover:bg-base-content/10']"
                @click="speakerRole = 'kp'"
              >
                KP
              </button>
              <button
                v-for="npc in currentModuleNPCs"
                :key="npc.id"
                type="button"
                :class="['w-full px-2.5 py-2 text-left text-sm truncate', speakerRole === npc.id ? 'bg-accent/20 text-accent' : 'text-base-content hover:bg-base-content/10']"
                :title="npc.name || '未命名'"
                @click="speakerRole = npc.id"
              >
                {{ npc.name || '未命名' }}
              </button>
            </MenuItems>
          </transition>
        </Menu>
      </div>
      <div
        class="flex-1 flex gap-1 min-w-0 rounded-xl bg-base-100 border border-base-300 focus-within:border-accent/50 transition-colors"
        :class="[
          { 'opacity-60': isCurrentChannelReadOnly() },
          isSingleLine ? 'items-center' : 'items-end',
        ]"
      >
        <textarea
          ref="textareaEl"
          v-model="input"
          :placeholder="isCurrentChannelReadOnly() ? '无发言权限' : '输入消息... (Enter 发送)'"
          rows="1"
          :disabled="isCurrentChannelReadOnly()"
          :class="[
            'message-input-textarea flex-1 min-w-0 min-h-[40px] py-2.5 px-3 bg-transparent resize-none outline-none text-base-content placeholder:text-base-content text-sm disabled:cursor-not-allowed overflow-y-auto transition-[max-height] duration-200',
            inputExpanded ? 'max-h-[70vh]' : 'max-h-24',
          ]"
          @keydown="onKeydown"
          @input="fitTextareaHeight"
        />
        <button
          type="button"
          class="p-2 text-base-content hover:text-accent hover:bg-base-content/10 rounded-lg transition-colors shrink-0"
          :class="isSingleLine ? '' : 'pb-1'"
          :title="inputExpanded ? '收起输入框' : '展开输入框'"
          :disabled="isCurrentChannelReadOnly()"
          @click="inputExpanded = !inputExpanded"
        >
          <Icon :icon="inputExpanded ? 'mdi:arrow-collapse' : 'mdi:arrow-expand'" class="text-xl" />
        </button>
      </div>
      <button
        type="button"
        class="p-2 sm:p-2.5 rounded-xl bg-primary text-primary-content hover:opacity-90 transition-opacity shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
        title="发送"
        :disabled="isCurrentChannelReadOnly()"
        @click="submit"
      >
        <Icon icon="mdi:send" class="text-xl" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { Icon } from '@iconify/vue'
import { Menu, MenuButton, MenuItems } from '@headlessui/vue'
import { useChatStore } from '../stores/chat'

const input = ref('')
const textareaEl = ref(null)
const inputExpanded = ref(false)
const isSingleLine = ref(true)
const {
  sendMessage,
  isCurrentChannelReadOnly,
  isCurrentChannelKP,
  speakerRoleInChannel,
  setSpeakerRole,
  currentModuleNPCs,
} = useChatStore()

const speakerRole = computed({
  get: () => speakerRoleInChannel.value,
  set: setSpeakerRole,
})

const maxNpcNameLength = 2
function truncateNpcDisplayName(name) {
  const n = (name || '未命名').trim()
  if (n.length <= maxNpcNameLength) return n
  return n.slice(0, 1) + '…'
}

const speakerRoleDisplayLabel = computed(() => {
  if (speakerRoleInChannel.value === 'kp') return 'KP'
  const npc = currentModuleNPCs.value.find((n) => n.id === speakerRoleInChannel.value)
  return truncateNpcDisplayName(npc?.name)
})

const speakerRoleFullLabel = computed(() => {
  if (speakerRoleInChannel.value === 'kp') return 'KP'
  const npc = currentModuleNPCs.value.find((n) => n.id === speakerRoleInChannel.value)
  return npc?.name || '未命名'
})

const MAX_HEIGHT_COLLAPSED_PX = 60

const SINGLE_LINE_SCROLL_HEIGHT = 52

function fitTextareaHeight() {
  const el = textareaEl.value
  if (!el) return
  el.style.height = 'auto'
  const scrollH = el.scrollHeight
  isSingleLine.value = scrollH <= SINGLE_LINE_SCROLL_HEIGHT
  const maxPx = inputExpanded.value ? null : MAX_HEIGHT_COLLAPSED_PX
  const capped = maxPx == null ? scrollH : Math.min(scrollH, maxPx)
  el.style.height = `${Math.max(40, capped)}px`
}

watch(input, () => nextTick(fitTextareaHeight))
watch(inputExpanded, () => nextTick(fitTextareaHeight))

function submit() {
  if (isCurrentChannelReadOnly()) return
  const text = input.value.trim()
  if (!text) return
  sendMessage(text)
  input.value = ''
  nextTick(fitTextareaHeight)
}

function onKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    submit()
  }
}
</script>

<style scoped>
.message-input-textarea {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.message-input-textarea::-webkit-scrollbar {
  display: none;
}
</style>