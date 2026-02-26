<template>
  <div class="flex flex-col h-full">
    <!-- 私聊时：只显示聊天区域 + 返回 -->
    <template v-if="dmChannelId">
      <header class="h-14 shrink-0 flex items-center gap-2 px-4 border-b border-chat-border bg-chat-panel">
        <button
          type="button"
          class="p-2 -ml-2 rounded-lg text-accent-muted hover:text-white hover:bg-white/5 transition-colors"
          title="返回好友列表"
          @click="closeDm"
        >
          <Icon icon="mdi:arrow-left" class="text-xl" />
        </button>
        <div class="w-9 h-9 rounded-full bg-sidebar-active flex items-center justify-center overflow-hidden shrink-0">
          <img v-if="currentChannel?.avatar" :src="currentChannel.avatar" alt="" class="w-full h-full object-cover" />
          <Icon v-else icon="mdi:account" class="text-xl text-accent" />
        </div>
        <h1 class="font-semibold text-white truncate flex-1">{{ currentChannel?.name || '私聊' }}</h1>
      </header>
      <div class="flex-1 min-h-0 flex flex-col">
        <MessageList class="flex-1 overflow-y-auto min-h-0" />
        <MessageInput class="shrink-0" />
      </div>
    </template>

    <!-- 好友列表 -->
    <template v-else>
      <PageHeader title="好友" icon="mdi:account-group">
        <template #actions>
          <button
            type="button"
            class="p-2 rounded-full bg-white/10 text-white/80 hover:text-white hover:bg-white/30 transition-colors"
            title="添加好友"
            @click="showAddFriend = true"
          >
            <Icon icon="mdi:account-plus" class="text-xl" />
          </button>
        </template>
      </PageHeader>

      <div class="flex-1 overflow-y-auto scroll-thin p-4 space-y-6">
      <!-- 添加好友弹窗 -->
      <div
        v-if="showAddFriend"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        @click.self="showAddFriend = false"
      >
        <div class="w-full max-w-sm rounded-xl bg-chat-panel border border-chat-border p-4 shadow-xl">
          <h3 class="text-lg font-semibold text-white mb-3">添加好友</h3>
          <p class="text-sm text-accent-muted mb-2">输入对方的用户名（与个人资料中的昵称一致）</p>
          <div class="flex gap-2 mb-3">
            <input
              v-model="addFriendInput"
              type="text"
              placeholder="用户名"
              class="flex-1 px-3 py-2 rounded-lg bg-chat-bg border border-chat-border text-white placeholder-accent-muted focus:border-accent outline-none text-sm"
              @keydown.enter="onSendRequest"
            />
            <button
              type="button"
              class="px-4 py-2 rounded-lg bg-accent text-chat-bg font-medium hover:opacity-90 disabled:opacity-50 text-sm"
              :disabled="!addFriendInput.trim() || addFriendLoading"
              @click="onSendRequest"
            >
              {{ addFriendLoading ? '发送中…' : '发送' }}
            </button>
          </div>
          <p v-if="addFriendError" class="text-sm text-red-400 mb-2">{{ addFriendError }}</p>
          <p v-if="addFriendSuccess" class="text-sm text-green-400 mb-2">已发送好友请求</p>
          <button
            type="button"
            class="w-full py-2 rounded-lg border border-chat-border text-accent-muted hover:text-white text-sm"
            @click="showAddFriend = false; addFriendError = ''; addFriendSuccess = false"
          >
            关闭
          </button>
        </div>
      </div>

      <!-- 收到的请求 -->
      <section v-if="pendingReceived.length > 0" class="space-y-2">
        <h2 class="text-sm font-medium text-accent-muted uppercase tracking-wider">收到的请求</h2>
        <div
          v-for="req in pendingReceived"
          :key="req.id"
          class="flex items-center gap-3 p-3 rounded-xl bg-chat-panel border border-chat-border"
        >
          <div class="w-10 h-10 rounded-full bg-sidebar-active flex items-center justify-center shrink-0 overflow-hidden">
            <img v-if="req.from_avatar" :src="req.from_avatar" alt="" class="w-full h-full object-cover" />
            <Icon v-else icon="mdi:account" class="text-xl text-accent" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-white truncate">{{ req.from_name }}</div>
            <div class="text-xs text-accent-muted">请求添加你为好友</div>
          </div>
          <div class="flex gap-2 shrink-0">
            <button
              type="button"
              class="px-3 py-1.5 rounded-lg bg-accent/20 text-accent hover:bg-accent/30 text-sm font-medium"
              @click="onAcceptRequest(req.id)"
            >
              同意
            </button>
            <button
              type="button"
              class="px-3 py-1.5 rounded-lg border border-chat-border text-accent-muted hover:text-white text-sm"
              @click="onRejectRequest(req.id)"
            >
              拒绝
            </button>
          </div>
        </div>
      </section>

      <!-- 已发送的请求 -->
      <section v-if="pendingSent.length > 0" class="space-y-2">
        <h2 class="text-sm font-medium text-accent-muted uppercase tracking-wider">已发送</h2>
        <div
          v-for="req in pendingSent"
          :key="req.id"
          class="flex items-center gap-3 p-3 rounded-xl bg-chat-panel border border-chat-border"
        >
          <div class="w-10 h-10 rounded-full bg-sidebar-active flex items-center justify-center shrink-0 overflow-hidden">
            <img v-if="req.to_avatar" :src="req.to_avatar" alt="" class="w-full h-full object-cover" />
            <Icon v-else icon="mdi:account-clock" class="text-xl text-accent-muted" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-white truncate">{{ req.to_name }}</div>
            <div class="text-xs text-accent-muted">等待对方同意</div>
          </div>
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg border border-chat-border text-accent-muted hover:text-white text-sm shrink-0"
            @click="onCancelSentRequest(req.id)"
          >
            撤回
          </button>
        </div>
      </section>

      <!-- 好友列表 -->
      <section class="space-y-2">
        <h2 class="text-sm font-medium text-accent-muted uppercase tracking-wider">我的好友</h2>
        <div
          v-for="f in friends"
          :key="f.id"
          class="flex items-center gap-3 p-3 rounded-xl bg-chat-panel border border-chat-border hover:border-accent/30 transition-colors cursor-pointer group"
          @click="startDirectMessage(f)"
        >
          <div class="w-10 h-10 rounded-full bg-sidebar-active flex items-center justify-center shrink-0 overflow-hidden">
            <img v-if="f.avatar" :src="f.avatar" alt="" class="w-full h-full object-cover" />
            <Icon v-else icon="mdi:account" class="text-xl text-accent" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-white truncate">{{ f.name }}</div>
            <div class="text-sm text-accent-muted truncate">{{ f.lastMsg || '点击发起私聊' }}</div>
          </div>
          <button
            type="button"
            class="p-1.5 rounded-lg text-accent-muted hover:text-white hover:bg-white/10 opacity-70 group-hover:opacity-100 transition-opacity"
            title="发消息"
            @click.stop="startDirectMessage(f)"
          >
            <Icon icon="mdi:message-text" class="text-lg" />
          </button>
          <button
            type="button"
            class="p-1.5 rounded-lg text-accent-muted hover:text-red-400 hover:bg-white/10 opacity-70 group-hover:opacity-100 transition-opacity"
            title="删除好友"
            @click.stop="onRemoveFriend(f)"
          >
            <Icon icon="mdi:account-minus" class="text-lg" />
          </button>
        </div>
        <p v-if="!friends.length && !pendingReceived.length && !pendingSent.length" class="text-center text-accent-muted py-8">
          暂无好友，点击右上角「+」添加好友或等待他人通过你的请求。
        </p>
      </section>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'
import PageHeader from '../components/PageHeader.vue'
import MessageList from '../components/MessageList.vue'
import MessageInput from '../components/MessageInput.vue'
import { useChatStore } from '../stores/chat'
import { useFriendsStore } from '../stores/friends'

const router = useRouter()
const route = useRoute()
const { openDirectMessage, setChannel, currentChannel, ensureDmChannelPeerInfo } = useChatStore()
const {
  friends,
  pendingReceived,
  pendingSent,
  fetchFriends,
  fetchPendingReceived,
  fetchPendingSent,
  findUserByUsernameOrEmail,
  sendFriendRequest,
  acceptRequest,
  rejectRequest,
  removeFriend,
  cancelSentRequest,
} = useFriendsStore()

const showAddFriend = ref(false)
const addFriendInput = ref('')
const addFriendLoading = ref(false)
const addFriendError = ref('')
const addFriendSuccess = ref(false)

async function loadAll() {
  await Promise.all([fetchFriends(), fetchPendingReceived(), fetchPendingSent()])
}

const dmChannelId = computed(() => (route.query.dm && typeof route.query.dm === 'string' ? route.query.dm : ''))

watch(
  dmChannelId,
  (id) => {
    if (id) {
      setChannel(id)
      ensureDmChannelPeerInfo(id)
    }
  },
  { immediate: true }
)

onMounted(() => {
  loadAll()
})

function closeDm() {
  router.replace({ path: '/friends', query: {} })
}

function startDirectMessage(friend) {
  const channelId = openDirectMessage({ id: friend.id, name: friend.name })
  if (channelId) router.push({ path: '/friends', query: { dm: channelId } })
}

async function onSendRequest() {
  const input = addFriendInput.value.trim()
  if (!input) return
  addFriendError.value = ''
  addFriendSuccess.value = false
  addFriendLoading.value = true
  const findRes = await findUserByUsernameOrEmail(input)
  if (!findRes.ok) {
    addFriendError.value = findRes.message || '查找失败'
    addFriendLoading.value = false
    return
  }
  const sendRes = await sendFriendRequest(findRes.user.id)
  addFriendLoading.value = false
  if (sendRes.ok) {
    addFriendSuccess.value = true
    addFriendInput.value = ''
  } else {
    addFriendError.value = sendRes.message || '发送失败'
  }
}

async function onAcceptRequest(requestId) {
  const res = await acceptRequest(requestId)
  if (!res.ok) alert(res.message || '操作失败')
}

async function onRejectRequest(requestId) {
  await rejectRequest(requestId)
}

async function onCancelSentRequest(requestId) {
  await cancelSentRequest(requestId)
}

async function onRemoveFriend(friend) {
  if (!confirm(`确定要删除好友「${friend.name}」吗？`)) return
  const res = await removeFriend(friend.id)
  if (!res.ok) alert(res.message || '操作失败')
}
</script>
