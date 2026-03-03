<template>
  <div ref="listEl" class="flex-1 overflow-y-auto scroll-thin px-4 py-3 space-y-2">
    <template v-for="m in messages" :key="m.id">
      <!-- 系统通知：掷骰、暗骰、技能检定等，不作为说话人展示 -->
      <div
        v-if="[MESSAGE_TYPES.SYSTEM, MESSAGE_TYPES.HIDDEN_ROLL, MESSAGE_TYPES.HIDDEN_SKILL, MESSAGE_TYPES.CHECK_REQUEST].includes(m.type)"
        class="flex justify-center my-1 text-[11px] text-base-content"
      >
        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-base-200/50 border border-accent-muted/30">
          <Icon icon="mdi:information-outline" class="text-sm" />
          <span>{{ getMessageContent(m) }}</span>
        </div>
      </div>

      <!-- 普通聊天消息（小说式：角色说话 / KP 环境描写） -->
      <div
        v-else
        :class="[
          'flex gap-2 text-sm',
          m.isSelf ? 'flex-row-reverse' : 'flex-row',
        ]"
      >
        <div class="w-8 h-8 rounded-full bg-base-100-active flex items-center justify-center shrink-0 overflow-hidden">
          <img v-if="m.userAvatar" :src="m.userAvatar" alt="" class="w-full h-full object-cover" />
          <span v-else class="text-accent text-xs font-medium">{{ m.userName.slice(0, 1).toUpperCase() }}</span>
        </div>
        <div :class="['max-w-[75%] flex flex-col', m.isSelf ? 'items-end' : 'items-start']">
          <div class="flex items-baseline gap-2 mb-1">
            <span
              class="px-2 py-0.5 rounded-md text-[10px] font-bold"
              :class="getSpeakerBadge(m).class"
            >
              {{ getSpeakerBadge(m).text }}
            </span>
            <span class="text-xs font-bold text-base-content">{{ getSpeakerName(m) }}</span>
            <span class="text-[10px] text-base-content/40">{{ formatTime(m.time) }}</span>
          </div>
          <!-- KP：环境描写/叙事风格；PL：角色对话（他人消息加「」） -->
          <div
            :class="[
              'px-3 py-2 text-sm wrap-break-word whitespace-pre-wrap shadow-sm leading-relaxed',
              m.speakerRole === 'kp'
                ? 'rounded-2xl bg-base-200 text-base-content/80 border-l-4 border-primary rounded-tl-sm'
                : m.isSelf
                  ? 'rounded-3xl rounded-br-sm bg-primary text-primary-content shadow-primary/20'
                  : 'rounded-3xl rounded-bl-sm bg-base-100 border border-base-200',
            ]"
          >
            <template v-for="(p, idx) in getRenderableParts(m)" :key="idx">
              <span v-if="p.type === 'ooc'" class="inline-block px-1.5 py-0.5 mx-0.5 rounded-md bg-base-content/10 text-base-content/75 text-[0.9em] italic">（{{ p.text }}）</span>
              <span v-else-if="p.type === 'dialogue'" class="inline-block pl-2 ml-1 border-l-2 border-primary/40">「{{ p.text }}」</span>
              <span v-else>{{ p.text }}</span>
            </template>
          </div>
        </div>
      </div>
    </template>

    <div v-if="!messages.length && !loading" class="text-center text-xs text-base-content py-6">
      暂无消息，开始在房间里说点什么吧～
    </div>
    <LoadingSpinner v-if="loading" :block="false" size="sm" message="加载中…" className="justify-center py-4" />
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { Icon } from '@iconify/vue'
import LoadingSpinner from './LoadingSpinner.vue'
import { formatTime } from '../utils/date'
import { MESSAGE_TYPES } from '../constants/enums'
import { parseRpText, toRenderableRpTokens } from '../utils/rpText'

const props = defineProps({
  messages: {
    type: Array,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  isOwner: {
    type: Boolean,
    default: false,
  },
})

const listEl = ref(null)

function scrollToBottom() {
  nextTick(() => {
    if (!listEl.value) return
    listEl.value.scrollTop = listEl.value.scrollHeight
  })
}

watch(
  () => props.messages.length,
  () => {
    scrollToBottom()
  },
  { immediate: true }
)

function getMessageContent(msg) {
  if ((msg.type === MESSAGE_TYPES.HIDDEN_ROLL || msg.type === MESSAGE_TYPES.HIDDEN_SKILL) && !props.isOwner) {
    return '？？'
  }
  if (msg.type === MESSAGE_TYPES.CHECK_REQUEST) {
    try {
      const data = JSON.parse(msg.content || '{}')
      const who = data.targetCharacterName || '某位玩家'
      if (data.kind === 'skill') {
        const mod = data.modifier ? (data.modifier > 0 ? `+${data.modifier}` : `${data.modifier}`) : ''
        const extra = mod ? `（${mod}）` : ''
        return `【技能检定】${who} 进行「${data.skillName || '未知技能'}」检定${extra}`
      }
      if (data.kind === 'sanity') {
        const succ = data.sanSuccessExpr || '0'
        const fail = data.sanFailExpr || '1'
        return `【理智检定】${who} 进行理智检定（成功失去 ${succ}，失败失去 ${fail}）`
      }
      if (data.kind === 'madness') {
        return `【疯狂症状】 ${who} 抽取疯狂症状`
      }
    } catch {
      // ignore
    }
  }
  return msg.content
}

function getRenderableParts(msg) {
  const raw = getMessageContent(msg)
  const base = parseRpText(raw)
  const isSpeakerDialogue = msg?.speakerRole !== 'kp'
  return toRenderableRpTokens(base, { defaultDialogue: isSpeakerDialogue })
}

function getSpeakerName(msg) {
  if ([MESSAGE_TYPES.SYSTEM, MESSAGE_TYPES.HIDDEN_ROLL, MESSAGE_TYPES.HIDDEN_SKILL, MESSAGE_TYPES.CHECK_REQUEST].includes(msg.type))
    return '骰娘'
  if (msg.speakerRole === 'kp') return 'KP'
  if (msg.speakerRole === 'npc' && msg.speakerNpcName) return msg.speakerNpcName
  return msg.userName || '未知'
}

function getSpeakerBadge(msg) {
  if ([MESSAGE_TYPES.SYSTEM, MESSAGE_TYPES.HIDDEN_ROLL, MESSAGE_TYPES.HIDDEN_SKILL, MESSAGE_TYPES.CHECK_REQUEST].includes(msg.type))
    return { text: '骰娘', class: 'bg-accent-muted/20 text-base-content' }
  if (msg.speakerRole === 'kp') return { text: 'KP', class: 'bg-blue-500/20 text-blue-400' }
  if (msg.speakerRole === 'npc') return { text: 'NPC', class: 'bg-purple-500/20 text-purple-400' }
  return { text: 'PL', class: 'bg-green-500/20 text-green-400' }
}
</script>

