<template>
  <div
    ref="listEl"
    class="flex-1 overflow-y-auto scroll-thin px-4 py-3 space-y-2"
    @scroll.passive="onScroll"
    @touchstart.passive="onTouchStart"
    @touchmove.passive="onTouchMove"
    @touchend="onTouchEnd"
  >
    <!-- 顶部下拉加载历史（显示在聊天内容最顶端） -->
    <div
      class="sticky top-0 left-0 right-0 pointer-events-none -mx-4 z-10"
      :style="{ height: topIndicatorHeight + 'px', opacity: topIndicatorOpacity }"
      aria-hidden="true"
    >
      <div class="h-full flex items-start justify-center pt-2">
        <div
          class="px-3 py-2 rounded-2xl border border-base-300/60 bg-base-100/70 backdrop-blur shadow-sm"
          :class="topIsReady || isRefreshingHistory ? 'text-primary' : 'text-base-content/60'"
        >
          <div class="flex items-center gap-2 text-[11px] font-medium">
            <Icon
              v-if="isRefreshingHistory"
              icon="mdi:loading"
              class="text-sm animate-spin"
            />
            <Icon
              v-else
              icon="mdi:arrow-down"
              class="text-sm transition-transform duration-150"
              :style="{ transform: `rotate(${topIsReady ? 180 : Math.floor(topProgress * 180)}deg)` }"
            />
            <span>
              {{
                !props.hasMore
                  ? '没有更多消息'
                  : isRefreshingHistory
                    ? '加载历史…'
                    : (topIsReady ? '松手加载' : '下拉加载历史')
              }}
            </span>
            <span v-if="!isRefreshingHistory && props.hasMore" class="opacity-60 tabular-nums">
              {{ Math.min(100, Math.floor(topProgress * 100)) }}%
            </span>
          </div>
        </div>
      </div>
    </div>

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
          class="w-8 h-8 rounded-full bg-base-100 flex items-center justify-center shrink-0 overflow-hidden active:scale-95 transition-transform"
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
         <div class="flex items-end">
          <button
              v-if="m.isSelf"
              type="button"
              class="ml-1 p-1 rounded text-base-content/40 hover:text-error hover:bg-error/10 text-[10px] transition-colors"
              title="撤回消息"
              aria-label="撤回消息"
              @click="onRecall(m)"
            >
              <Icon icon="mdi:undo" class="text-sm" />
            </button>
          <!-- 文本消息 / 图片消息 -->
          <div
            v-if="m.type === MESSAGE_TYPES.IMAGE"
            :class="[
              'p-1 bg-base-100 shadow-sm border',
              m.isSelf ? 'rounded-3xl rounded-br-sm border-primary/40' : 'rounded-3xl rounded-bl-sm border-base-200',
            ]"
          >
            <button
              type="button"
              class="block w-full text-left focus:outline-none focus:ring-0"
              @click="previewImageUrl = m.content"
            >
              <img
                :src="m.content"
                alt="图片消息"
                class="max-w-[220px] max-h-[260px] object-contain rounded-2xl cursor-pointer"
              />
            </button>
          </div>
          <div
            v-else
            :class="[
              'px-3 py-2 text-sm wrap-break-word whitespace-pre-wrap shadow-sm leading-relaxed',
              m.speakerRole === 'kp'
                ? 'rounded-2xl bg-base-200 text-base-content/80 border-l-4 border-primary rounded-tl-sm'
                : m.isSelf
                  ? 'rounded-3xl rounded-br-sm bg-primary/10 text-base-content shadow-primary/20'
                  : 'rounded-3xl rounded-bl-sm bg-base-100 border border-base-200',
            ]"
          >
            <template v-for="(p, idx) in getRenderableParts(m)" :key="idx">
              <span v-if="p.type === 'ooc'" class="italic">({{ p.text }})</span>
              <span v-else>{{ p.text }}</span>
            </template>
          </div>
          </div>
        </div>
      </div>
    </template>

    <div v-if="!messages.length && !loading" class="text-center text-xs text-base-content py-6">
      暂无消息，开始在房间里说点什么吧～
    </div>

    <!-- 底部上拉：回到底部 / 检查新消息 -->
    <div
      class="sticky bottom-0 left-0 right-0 pointer-events-none -mx-4"
      :style="{ height: bottomIndicatorHeight + 'px', opacity: bottomIndicatorOpacity }"
      aria-hidden="true"
    >
      <div class="h-full flex items-end justify-center pb-2">
        <div
          class="px-3 py-2 rounded-2xl border border-base-300/60 bg-base-100/70 backdrop-blur shadow-sm"
          :class="bottomIsReady || isRefreshingLatest ? 'text-primary' : 'text-base-content/60'"
        >
          <div class="flex items-center gap-2 text-[11px] font-medium">
            <Icon
              v-if="isRefreshingLatest"
              icon="mdi:loading"
              class="text-sm animate-spin"
            />
            <Icon
              v-else
              icon="mdi:arrow-up"
              class="text-sm transition-transform duration-150"
              :style="{ transform: `rotate(${bottomIsReady ? 180 : Math.floor(bottomProgress * 180)}deg)` }"
            />
            <span>
              {{ isRefreshingLatest ? '检查新消息…' : (bottomIsReady ? '松手回到底部' : '上拉回到底部') }}
            </span>
            <span v-if="!isRefreshingLatest" class="opacity-60 tabular-nums">
              {{ Math.min(100, Math.floor(bottomProgress * 100)) }}%
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 图片预览弹层 -->
    <Teleport to="body">
      <div
        v-if="previewImageUrl"
        class="fixed inset-0 z-[10001] flex items-center justify-center bg-black/70 p-4"
        @click.self="previewImageUrl = null"
      >
        <button
          type="button"
          class="absolute top-4 right-4 p-2 rounded-lg bg-white/20 text-white hover:bg-white/30"
          aria-label="关闭"
          @click="previewImageUrl = null"
        >
          <Icon icon="mdi:close" class="text-2xl" />
        </button>
        <img
          :src="previewImageUrl"
          alt="预览"
          class="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
          @click.stop
        />
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, computed } from 'vue'
import { Icon } from '@iconify/vue'
import LoadingSpinner from './LoadingSpinner.vue'
import { formatTime } from '../utils/date'
import { MESSAGE_TYPES } from '../constants/enums'
import { parseRpText, toRenderableRpTokens } from '../utils/rpText'
import { useCharactersStore } from '../stores/characters'

const props = defineProps({
  messages: {
    type: Array,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  hasMore: {
    type: Boolean,
    default: true,
  },
  loadingMoreHistory: {
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

const charactersStore = useCharactersStore()
const listEl = ref(null)
const previewImageUrl = ref(null)
const pullingDown = ref(false)
const pullingUp = ref(false)
const pullDistance = ref(0)
const pullUpDistance = ref(0)
const touchStartY = ref(0)
const atTop = ref(false)
const atBottom = ref(false)
const pendingPrependAdjust = ref(false)
const prevScrollHeight = ref(0)
const PULL_THRESHOLD = 46
const MAX_PULL = 96
const historyTriggered = ref(false)
const latestTriggered = ref(false)

const emit = defineEmits(['load-more', 'refresh-latest', 'avatar-click', 'recall'])

const topProgress = computed(() => Math.max(0, Math.min(1, pullDistance.value / PULL_THRESHOLD)))
const topIsReady = computed(() => pullDistance.value >= PULL_THRESHOLD)
const bottomProgress = computed(() => Math.max(0, Math.min(1, pullUpDistance.value / PULL_THRESHOLD)))
const bottomIsReady = computed(() => pullUpDistance.value >= PULL_THRESHOLD)

const isRefreshingHistory = computed(() => historyTriggered.value && (props.loading || props.loadingMoreHistory))
const isRefreshingLatest = computed(() => latestTriggered.value && props.loading)

const topIndicatorHeight = computed(() => {
  // 加载历史时固定高度，保证“加载中”提示始终可见
  if (isRefreshingHistory.value) return 56
  if (!pullingDown.value) return 0
  // 弹性：前半段线性，后半段逐渐变慢
  const d = pullDistance.value
  const eased = d <= PULL_THRESHOLD ? d : (PULL_THRESHOLD + (d - PULL_THRESHOLD) * 0.35)
  return Math.max(0, Math.min(60, Math.floor(eased)))
})
const topIndicatorOpacity = computed(() => {
  // 加载历史中时始终完全显示，便于看到“加载中”和滑动条
  if (isRefreshingHistory.value) return 1
  if (!pullingDown.value) return 0
  return Math.max(0.15, Math.min(1, topProgress.value * 1.15))
})

const bottomIndicatorHeight = computed(() => {
  if (isRefreshingLatest.value) return 46
  if (!pullingUp.value) return 0
  const d = pullUpDistance.value
  const eased = d <= PULL_THRESHOLD ? d : (PULL_THRESHOLD + (d - PULL_THRESHOLD) * 0.35)
  return Math.max(0, Math.min(60, Math.floor(eased)))
})
const bottomIndicatorOpacity = computed(() => {
  if (isRefreshingLatest.value) return 1
  if (!pullingUp.value) return 0
  return Math.max(0.15, Math.min(1, bottomProgress.value * 1.15))
})

function scrollToBottom() {
  nextTick(() => {
    if (!listEl.value) return
    listEl.value.scrollTop = listEl.value.scrollHeight
  })
}

const lastMessageId = ref(null)
// 监听「最后一条消息的 id」，这样父组件 push 新消息（引用不变）时也会触发，能正确滚到底部
const lastMessageIdFromList = computed(() => {
  const arr = Array.isArray(props.messages) ? props.messages : []
  if (!arr.length) return null
  return arr[arr.length - 1].id
})
watch(
  lastMessageIdFromList,
  (newId) => {
    if (newId == null) return
    // 首次有数据：滚到底部
    if (!lastMessageId.value) {
      lastMessageId.value = newId
      scrollToBottom()
      return
    }
    // 新消息追加：仅在用户当前位于底部时自动滚动
    if (newId !== lastMessageId.value) {
      lastMessageId.value = newId
      if (atBottom.value) scrollToBottom()
    }
  },
  { immediate: true }
)

function getAvatar(msg) {
  if (msg.speakerPortrait) return msg.speakerPortrait
  // PL/NPC：跑团中途上传的角色卡头像用 store 中的最新数据补全，保证正确显示
  if ((msg.speakerRole === 'pl' || msg.speakerRole === 'npc') && msg.speakerId) {
    const raw = charactersStore.getById(msg.speakerId)
    const sheet = raw ? charactersStore.normalizeCharacter(raw) : null
    if (sheet?.portrait) return sheet.portrait
  }
  if (msg.speakerRole === 'pl' || msg.speakerRole === 'npc') return null
  return msg.userAvatar || null
}

function canOpenCharacterCard(msg) {
  return !!(msg && msg.userId && msg.userId !== 'system')
}

function onAvatarClick(msg) {
  if (!canOpenCharacterCard(msg)) return
  emit('avatar-click', {
    userId: msg.userId,
    isSelf: !!msg.isSelf,
    speakerRole: msg.speakerRole || null,
    speakerId: msg.speakerId || null,
  })
}

function onRecall(msg) {
  if (!msg?.id || !msg.isSelf) return
  emit('recall', msg.id)
}

function onScroll() {
  const el = listEl.value
  if (!el) return
  const { scrollTop, scrollHeight, clientHeight } = el
  atTop.value = scrollTop <= 2
  atBottom.value = scrollTop + clientHeight >= scrollHeight - 2
}

function onTouchStart(e) {
  if (!listEl.value) return
  touchStartY.value = e.touches[0].clientY
  pullDistance.value = 0
  pullUpDistance.value = 0
  pullingDown.value = false
  pullingUp.value = false
}

function onTouchMove(e) {
  const el = listEl.value
  if (!el) return
  if (props.loading) return
  const currentY = e.touches[0].clientY
  const deltaY = currentY - touchStartY.value
  // 顶部：下拉加载历史
  if (atTop.value && deltaY > 0) {
    pullingDown.value = true
    pullDistance.value = Math.min(deltaY, MAX_PULL)
  }
  // 底部：上拉回到底部/检查新消息
  if (atBottom.value && deltaY < 0) {
    pullingUp.value = true
    pullUpDistance.value = Math.min(-deltaY, MAX_PULL)
  }
}

function onTouchEnd() {
  // 顶部：加载历史
  if (pullingDown.value && topIsReady.value && !props.loading && props.hasMore) {
    historyTriggered.value = true
    // 触发后先保持一个固定高度，等 loading 结束再收起
    pullDistance.value = PULL_THRESHOLD
    // 记录高度，加载历史 prepend 后做滚动补偿，避免视窗跳动
    if (listEl.value) {
      prevScrollHeight.value = listEl.value.scrollHeight || 0
      pendingPrependAdjust.value = true
    }
    emit('load-more')
  } else if (pullingUp.value && bottomIsReady.value && !props.loading) {
    // 底部：回到底部并检查新消息（防断线漏消息）
    latestTriggered.value = true
    pullUpDistance.value = PULL_THRESHOLD
    scrollToBottom()
    emit('refresh-latest')
  } else {
    pullingDown.value = false
    pullingUp.value = false
    pullDistance.value = 0
    pullUpDistance.value = 0
  }
}

watch(
  () => props.messages.length,
  async () => {
    if (!pendingPrependAdjust.value) return
    const el = listEl.value
    if (!el) return
    await nextTick()
    const nextHeight = el.scrollHeight || 0
    const delta = nextHeight - (prevScrollHeight.value || 0)
    if (delta > 0) {
      el.scrollTop = (el.scrollTop || 0) + delta
    }
    pendingPrependAdjust.value = false
  }
)

watch(
  () => props.loading,
  (val) => {
    // 刷新结束后自然收起提示
    if (!val && (historyTriggered.value || latestTriggered.value)) {
      historyTriggered.value = false
      latestTriggered.value = false
      pullingDown.value = false
      pullingUp.value = false
      pendingPrependAdjust.value = false
      // 轻微延迟让“刷新中…”有一个收尾
      setTimeout(() => {
        pullDistance.value = 0
        pullUpDistance.value = 0
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
  // 其余情况优先展示 speaker_name（角色名），没有则退回 user_name（账号名）
  if (msg.speakerName) return msg.speakerName
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

<style scoped>
/* 顶部加载历史时的滑动条：从左滑到右，循环，形成“正在加载”的滑动感 */
.pull-loading-bar {
  width: 40%;
  min-width: 80px;
  animation: pull-loading-slide 1.2s ease-in-out infinite;
}
@keyframes pull-loading-slide {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(350%);
  }
}
</style>

