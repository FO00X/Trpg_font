<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { supabase } from '../lib/supabase'

const props = defineProps({
  roomId: { type: String, required: true },
})

const messages = ref([])
const loading = ref(true)
const error = ref('')

const channelId = computed(() => `room:${props.roomId}`)

async function fetchLogs() {
  loading.value = true
  error.value = ''
  try {
    const { data, error: err } = await supabase
      .from('messages')
      .select('id, user_id, user_name, content, type, speaker_role, speaker_npc_id, speaker_npc_name, created_at')
      .eq('channel_id', channelId.value)
      .order('created_at', { ascending: true })
    if (err) throw err
    messages.value = (data || []).map((m) => ({
      id: m.id,
      userId: m.user_id || 'system',
      userName: m.user_name || '未知',
      content: m.content,
      time: m.created_at ? new Date(m.created_at).getTime() : Date.now(),
      type: m.type || 'text',
      speakerRole: m.speaker_role,
      speakerNpcId: m.speaker_npc_id,
      speakerNpcName: m.speaker_npc_name,
    }))
  } catch (e) {
    error.value = e.message || '加载失败'
  } finally {
    loading.value = false
  }
}

function formatDateTime(timestamp) {
  const d = new Date(timestamp)
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function formatDate(timestamp) {
  const d = new Date(timestamp)
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function formatTime(timestamp) {
  const d = new Date(timestamp)
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

const groupedMessages = computed(() => {
  const groups = []
  let currentDate = null
  let currentGroup = null

  for (const msg of messages.value) {
    const msgDate = formatDate(msg.time)
    if (msgDate !== currentDate) {
      if (currentGroup) groups.push(currentGroup)
      currentDate = msgDate
      currentGroup = { date: currentDate, messages: [] }
    }
    currentGroup.messages.push(msg)
  }
  if (currentGroup) groups.push(currentGroup)

  return groups
})

function getSpeakerName(msg) {
  if (msg.type === 'system') return '系统'
  if (msg.speakerRole === 'kp') return 'KP'
  if (msg.speakerRole === 'npc' && msg.speakerNpcName) return msg.speakerNpcName
  return msg.userName || '未知'
}

function getSpeakerBadge(msg) {
  if (msg.type === 'system') return { text: '系统', class: 'bg-accent-muted/20 text-accent-muted' }
  if (msg.speakerRole === 'kp') return { text: 'KP', class: 'bg-blue-500/20 text-blue-400' }
  if (msg.speakerRole === 'npc') return { text: 'NPC', class: 'bg-purple-500/20 text-purple-400' }
  return { text: '玩家', class: 'bg-green-500/20 text-green-400' }
}

onMounted(() => {
  fetchLogs()
})

watch(() => props.roomId, () => {
  fetchLogs()
})
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto scroll-thin p-4">
      <div v-if="loading" class="flex items-center justify-center py-12 text-accent-muted">
        <Icon icon="mdi:loading" class="text-2xl animate-spin mr-2" />
        <span>加载日志中…</span>
      </div>
      <div v-else-if="error" class="text-center py-12 text-red-400">
        {{ error }}
      </div>
      <div v-else-if="!messages.length" class="text-center py-12 text-accent-muted">
        <Icon icon="mdi:note-text-outline" class="text-4xl mb-2 opacity-50" />
        <p>暂无日志记录</p>
      </div>
      <div v-else class="max-w-4xl mx-auto space-y-6">
        <div
          v-for="group in groupedMessages"
          :key="group.date"
          class="space-y-3"
        >
          <!-- 日期分隔 -->
          <div class="flex items-center gap-3 py-2">
            <div class="flex-1 h-px bg-chat-border"></div>
            <span class="text-xs font-medium text-accent-muted px-3">{{ group.date }}</span>
            <div class="flex-1 h-px bg-chat-border"></div>
          </div>

          <!-- 该日期的消息列表 -->
          <div class="space-y-2">
            <div
              v-for="msg in group.messages"
              :key="msg.id"
              class="flex gap-3 group"
            >
              <!-- 时间轴 -->
              <div class="flex flex-col items-center shrink-0 pt-1">
                <div class="w-2 h-2 rounded-full bg-accent/40 group-hover:bg-accent transition-colors"></div>
                <div class="w-px flex-1 bg-chat-border mt-1"></div>
              </div>

              <!-- 消息内容 -->
              <div class="flex-1 min-w-0 pb-2">
                <div class="flex items-baseline gap-2 mb-1">
                  <span
                    class="px-2 py-0.5 rounded text-xs font-medium"
                    :class="getSpeakerBadge(msg).class"
                  >
                    {{ getSpeakerBadge(msg).text }}
                  </span>
                  <span class="font-medium text-white">{{ getSpeakerName(msg) }}</span>
                  <span class="text-xs text-accent-muted">{{ formatTime(msg.time) }}</span>
                </div>
                <div
                  :class="[
                    'px-3 py-2 rounded-lg text-sm break-words whitespace-pre-wrap',
                    msg.type === 'system'
                      ? 'bg-chat-panel/50 text-accent-muted italic'
                      : 'bg-chat-panel border border-chat-border text-[#a6adc8]',
                  ]"
                >
                  {{ msg.content }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
