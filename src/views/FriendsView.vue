<template>
  <div class="flex flex-col h-full">
    <!-- 私聊时：只显示聊天区域 + 返回 -->
    <template v-if="dmChannelId">
      <header class="navbar h-14 shrink-0 px-4 border-b border-base-300 bg-base-100 rounded-none">
        <button type="button" class="btn btn-ghost btn-square btn-sm" title="返回好友列表" @click="closeDm">
          <Icon icon="mdi:arrow-left" class="text-xl" />
        </button>
        <div class="avatar placeholder shrink-0">
          <div class="w-9 rounded-full bg-base-100 text-primary flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
            <img v-if="currentChannel?.avatar" :src="currentChannel.avatar" alt="" class="w-full h-full object-cover" />
            <Icon v-else icon="mdi:account" class="text-xl" />
          </div>
        </div>
        <h1 class="font-semibold text-base-content truncate flex-1 ml-2">{{ currentChannel?.name || '私聊' }}</h1>
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
          <button type="button" class="btn btn-primary btn-circle btn-sm" title="添加好友" @click="showAddFriend = true">
            <Icon icon="mdi:account-plus" class="text-xl" />
          </button>
        </template>
      </PageHeader>

      <div class="flex-1 overflow-y-auto scroll-thin p-4 space-y-6">
      <!-- 添加好友弹窗 -->
      <dialog :open="showAddFriend" class="modal" @click="showAddFriend = false">
        <div class="modal-box max-w-sm" @click.stop>
          <h3 class="font-semibold text-lg text-base-content mb-3">添加好友</h3>
          <p class="text-sm text-base-content/60 mb-2">输入对方的用户名（与个人资料中的昵称一致）</p>
          <div class="flex gap-2 mb-3 items-center">
            <input v-model="addFriendInput" type="text" placeholder="用户名" class="input input-bordered flex-1 text-sm" @keydown.enter="onSendRequest" />
            <button type="button" class="btn btn-primary" :disabled="!addFriendInput.trim() || addFriendLoading" @click="onSendRequest">
              {{ addFriendLoading ? '发送中…' : '发送' }}
            </button>
          </div>
          <div v-if="addFriendError" class="alert alert-error text-sm mb-2">{{ addFriendError }}</div>
          <div v-if="addFriendSuccess" class="alert alert-success text-sm mb-2">已发送好友请求</div>
          <button type="button" class="btn btn-ghost btn-sm w-full" @click="showAddFriend = false; addFriendError = ''; addFriendSuccess = false">关闭</button>
        </div>
        <form method="dialog" class="modal-backdrop"><button type="button" @click="showAddFriend = false">Close</button></form>
      </dialog>

      <section v-if="pendingReceived.length > 0" class="space-y-2">
        <h2 class="text-sm font-medium text-base-content/60 uppercase tracking-wider">收到的请求</h2>
        <div v-for="req in pendingReceived" :key="req.id" class="card card-bordered bg-base-200">
          <div class="card-body flex-row items-center gap-3 p-3">
            <div class="avatar placeholder shrink-0">
              <div class="w-10 rounded-full bg-base-100 text-primary flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                <img v-if="req.from_avatar" :src="req.from_avatar" alt="" class="w-full h-full object-cover" />
                <Icon v-else icon="mdi:account" class="text-xl" />
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-base-content truncate">{{ req.from_name }}</div>
              <div class="text-xs text-base-content/60">请求添加你为好友</div>
            </div>
            <div class="flex gap-2 shrink-0">
              <button type="button" class="btn btn-primary btn-sm" @click="onAcceptRequest(req.id)">同意</button>
              <button type="button" class="btn btn-ghost btn-sm" @click="onRejectRequest(req.id)">拒绝</button>
            </div>
          </div>
        </div>
      </section>

      <section v-if="pendingSent.length > 0" class="space-y-2">
        <h2 class="text-sm font-medium text-base-content/60 uppercase tracking-wider">已发送</h2>
        <div v-for="req in pendingSent" :key="req.id" class="card card-bordered bg-base-200">
          <div class="card-body flex-row items-center gap-3 p-3">
            <div class="avatar placeholder shrink-0">
              <div class="w-10 rounded-full bg-base-100 text-primary flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                <img v-if="req.to_avatar" :src="req.to_avatar" alt="" class="w-full h-full object-cover" />
                <Icon v-else icon="mdi:account-clock" class="text-xl text-base-content/50" />
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-base-content truncate">{{ req.to_name }}</div>
              <div class="text-xs text-base-content/60">等待对方同意</div>
            </div>
            <button type="button" class="btn btn-ghost btn-sm shrink-0" @click="onCancelSentRequest(req.id)">撤回</button>
          </div>
        </div>
      </section>

      <section class="space-y-2">
        <h2 class="text-sm font-medium text-base-content/60 uppercase tracking-wider">我的好友</h2>
        <div
          v-for="f in friends"
          :key="f.id"
          class="card card-bordered bg-base-200 hover:border-primary/40 transition-colors cursor-pointer group"
          @click="startDirectMessage(f)"
        >
          <div class="card-body flex-row items-center gap-3 p-3">
          <div class="avatar placeholder shrink-0">
            <div class="w-10 rounded-full bg-base-100 text-primary flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
              <img v-if="f.avatar" :src="f.avatar" alt="" class="w-full h-full object-cover" />
              <Icon v-else icon="mdi:account" class="text-xl" />
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-base-content truncate">{{ f.name }}</div>
            <div class="text-sm text-base-content/60 truncate">{{ f.lastMsg || '点击发起私聊' }}</div>
          </div>
          <button type="button" class="btn btn-ghost btn-square btn-sm opacity-70 group-hover:opacity-100" title="发消息" @click.stop="startDirectMessage(f)">
            <Icon icon="mdi:message-text" class="text-lg" />
          </button>
          <button type="button" class="btn btn-ghost btn-square btn-sm text-error opacity-70 group-hover:opacity-100" title="删除好友" @click.stop="onRemoveFriend(f)">
            <Icon icon="mdi:account-minus" class="text-lg" />
          </button>
          </div>
        </div>
        <p v-if="!friends.length && !pendingReceived.length && !pendingSent.length" class="text-center text-base-content/60 py-8">
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
import { useToast } from '../composables/useToast'
import { useConfirmDialog } from '../composables/useConfirmDialog'
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
const toast = useToast()
const { confirm } = useConfirmDialog()

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
  if (!res.ok) toast.error(res.message || '操作失败')
}

async function onRejectRequest(requestId) {
  await rejectRequest(requestId)
}

async function onCancelSentRequest(requestId) {
  await cancelSentRequest(requestId)
}

async function onRemoveFriend(friend) {
  const confirmed = await confirm({ title: '确认删除', message: `确定要删除好友「${friend.name}」吗？` })
  if (!confirmed) return
  const res = await removeFriend(friend.id)
  if (!res.ok) toast.error(res.message || '操作失败')
}
</script>
