<template>
  <div
    ref="listEl"
    class="flex-1 overflow-y-auto scroll-thin px-4 py-3 space-y-2"
    @scroll.passive="onScroll"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
  >
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
        <button
          type="button"
          class="w-8 h-8 rounded-full bg-base-100-active flex items-center justify-center shrink-0 overflow-hidden active:scale-95 transition-transform"
          :title="canOpenCharacterCard(m) ? '查看角色卡' : ''"
          :aria-label="canOpenCharacterCard(m) ? '查看角色卡' : '头像'"
          @click="onAvatarClick(m)"
        >
          <img
            v-if="getAvatar(m)"
            :src="getAvatar(m)"
            alt=""
            class="w-full h-full object-cover"
          />
          <span v-else class="text-accent text-xs font-medium">
            {{ m.userName.slice(0, 1).toUpperCase() }}
          </span>
        </button>
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
              <!-- 场外：仅内容斜体显示，括号样式保持普通文本 -->
              <span v-if="p.type === 'ooc'" class="italic">({{ p.text }})</span>
              <!-- 其余文本（包括含引号的对白）按原样展示 -->
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

    <!-- 底部上拉刷新 -->
    <div
      class="sticky bottom-0 left-0 right-0 pointer-events-none -mx-4"
      :style="{ height: indicatorHeight + 'px', opacity: indicatorOpacity }"
      aria-hidden="true"
    >
      <div class="h-full flex items-end justify-center pb-2">
        <div
          class="px-3 py-2 rounded-2xl border border-base-300/60 bg-base-100/70 backdrop-blur shadow-sm"
          :class="isReady ? 'text-primary' : 'text-base-content/60'"
        >
          <div class="flex items-center gap-2 text-[11px] font-medium">
            <Icon
              v-if="isRefreshing"
              icon="mdi:loading"
              class="text-sm animate-spin"
            />
            <Icon
              v-else
              icon="mdi:arrow-up"
              class="text-sm transition-transform duration-150"
              :style="{ transform: `rotate(${isReady ? 180 : Math.floor(progress * 180)}deg)` }"
            />
            <span>
              {{ isRefreshing ? '刷新中…' : (isReady ? '松手刷新' : '上拉刷新') }}
            </span>
            <span v-if="!isRefreshing" class="opacity-60 tabular-nums">
              {{ Math.min(100, Math.floor(progress * 100)) }}%
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, computed } from 'vue'
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
  selfCharacterAvatar: {
    type: String,
    default: '',
  },
})

const listEl = ref(null)
const pullingUp = ref(false)
const pullDistance = ref(0)
const touchStartY = ref(0)
const atBottom = ref(false)
const PULL_THRESHOLD = 46
const MAX_PULL = 96
const refreshTriggered = ref(false)

const emit = defineEmits(['refresh', 'avatar-click'])

const progress = computed(() => Math.max(0, Math.min(1, pullDistance.value / PULL_THRESHOLD)))
const isReady = computed(() => pullDistance.value >= PULL_THRESHOLD)
const isRefreshing = computed(() => refreshTriggered.value && props.loading)
const indicatorHeight = computed(() => {
  if (isRefreshing.value) return 46
  if (!pullingUp.value) return 0
  // 弹性：前半段线性，后半段逐渐变慢
  const d = pullDistance.value
  const eased = d <= PULL_THRESHOLD ? d : (PULL_THRESHOLD + (d - PULL_THRESHOLD) * 0.35)
  return Math.max(0, Math.min(60, Math.floor(eased)))
})
const indicatorOpacity = computed(() => {
  if (isRefreshing.value) return 1
  if (!pullingUp.value) return 0
  return Math.max(0.15, Math.min(1, progress.value * 1.15))
})

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

function getAvatar(msg) {
  // 自己的发言：若当前房间已选择角色卡且有头像，则优先用角色头像
  if (msg.isSelf && props.selfCharacterAvatar) {
    return props.selfCharacterAvatar
  }
  return msg.userAvatar || null
}

function canOpenCharacterCard(msg) {
  // 仅对普通用户消息开放；系统/骰娘消息在模板层已过滤
  return !!(msg && msg.userId && msg.userId !== 'system')
}

function onAvatarClick(msg) {
  if (!canOpenCharacterCard(msg)) return
  emit('avatar-click', {
    userId: msg.userId,
    isSelf: !!msg.isSelf,
    speakerRole: msg.speakerRole || null,
    speakerNpcId: msg.speakerNpcId || null,
  })
}

function onScroll() {
  const el = listEl.value
  if (!el) return
  const { scrollTop, scrollHeight, clientHeight } = el
  atBottom.value = scrollTop + clientHeight >= scrollHeight - 2
}

function onTouchStart(e) {
  if (!listEl.value) return
  touchStartY.value = e.touches[0].clientY
  pullDistance.value = 0
  pullingUp.value = false
}

function onTouchMove(e) {
  const el = listEl.value
  if (!el) return
  if (!atBottom.value) return
  if (props.loading) return
  const currentY = e.touches[0].clientY
  const deltaY = currentY - touchStartY.value
  // 在底部时，手指向上滑动（deltaY < 0）视为“上拉刷新”手势
  if (deltaY < 0) {
    pullingUp.value = true
    pullDistance.value = Math.min(-deltaY, MAX_PULL)
  }
}

function onTouchEnd() {
  if (pullingUp.value && isReady.value && !props.loading) {
    refreshTriggered.value = true
    // 触发后先保持一个固定高度，等 loading 结束再收起
    pullDistance.value = PULL_THRESHOLD
    emit('refresh')
  } else {
    pullingUp.value = false
    pullDistance.value = 0
  }
}

watch(
  () => props.loading,
  (val) => {
    // 刷新结束后自然收起提示
    if (!val && refreshTriggered.value) {
      refreshTriggered.value = false
      pullingUp.value = false
      // 轻微延迟让“刷新中…”有一个收尾
      setTimeout(() => {
        pullDistance.value = 0
      }, 120)
    }
  }
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

