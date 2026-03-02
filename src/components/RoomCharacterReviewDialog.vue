<template>
  <Teleport to="body">
    <Dialog :open="open" class="relative z-50" @close="handleClose">
      <div class="fixed inset-0 bg-black/60" aria-hidden="true" />
      <div class="fixed inset-0 flex items-center justify-center p-4" @click.self="handleClose">
        <DialogPanel class="mx-auto w-full max-w-md rounded-xl bg-base-100 border border-base-300 shadow-xl">
          <DialogTitle class="sr-only">角色卡审核</DialogTitle>
          <div class="p-4">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-base-content flex items-center gap-2">
                <Icon icon="mdi:clipboard-list-outline" class="text-xl text-accent" />
                角色审核
              </h2>
              <button
                type="button"
                class="p-2 rounded-lg text-base-content hover:text-base-content hover:bg-base-content/10"
                @click="handleClose"
              >
                <Icon icon="mdi:close" class="text-xl" />
              </button>
            </div>

            <div v-if="loading" class="py-6 text-center text-sm text-base-content">
              加载角色卡审核列表中…
            </div>
            <div v-else-if="errorMessage" class="py-6 text-center text-sm text-red-400">
              {{ errorMessage }}
            </div>
            <div v-else-if="!applications.length" class="py-6 text-center text-sm text-base-content">
              暂无角色卡审核记录。
            </div>
            <ul v-else class="space-y-2 max-h-72 overflow-y-auto scroll-thin">
              <li
                v-for="item in applications"
                :key="item.id"
                class="px-3 py-2 rounded-lg bg-base-200 border border-base-300 flex flex-col items-start gap-3"
              >
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span
                      class="px-2 py-0.5 rounded text-[11px] font-medium"
                      :class="statusClass(item.status)"
                    >
                      {{ statusLabel(item.status) }}
                    </span>
                    <span class="text-sm text-base-content truncate">
                      {{ getCharacterName(item.characterId) }}
                    </span>
                  </div>
                  <div class="text-[11px] text-base-content mt-0.5">
                    提交时间：{{ formatDateTime(item.createdAt) }}
                  </div>
                </div>
                <div class="flex gap-2 ml-1">
                  <button
                    type="button"
                    class="px-2 py-1 rounded-lg text-xs text-accent hover:bg-accent/20"
                    @click="onViewCharacter(item.characterId)"
                  >
                    查看
                  </button>
                  <button
                    type="button"
                    class="px-2 py-0.5 rounded text-[11px] text-green-300 border border-green-500/40 hover:bg-green-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                    :disabled="!isOwner || item.status === ROOM_CHARACTER_STATUS.ACCEPTED"
                    @click="onApprove(item)"
                  >
                    同意
                  </button>
                  <button
                    type="button"
                    class="px-2 py-0.5 rounded text-[11px] text-red-300 border border-red-500/40 hover:bg-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                    :disabled="!isOwner || item.status === ROOM_CHARACTER_STATUS.REJECTED"
                    @click="onReject(item)"
                  >
                    拒绝
                  </button>
                </div>
              </li>
            </ul>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/vue'
import { useGameRoomsStore } from '../stores/gameRooms'
import { useCharactersStore } from '../stores/characters'
import { useCharacterCardModal } from '../composables/useCharacterCardModal'
import { formatDateTime } from '../utils/date'
import { ROOM_CHARACTER_STATUS, ROOM_CHARACTER_STATUS_LABELS } from '../constants/enums'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  roomId: {
    type: [String, Number],
    required: true,
  },
  isOwner: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:open'])

const loading = ref(false)
const errorMessage = ref('')
const applications = ref([])

const gameRooms = useGameRoomsStore()
const { fetchRoomCharacterApplications, updateRoomCharacterStatus } = gameRooms
const { getById } = useCharactersStore()
const { openCharacterCard } = useCharacterCardModal()

async function load() {
  if (!props.roomId) return
  loading.value = true
  errorMessage.value = ''
  const res = await fetchRoomCharacterApplications(props.roomId)
  loading.value = false
  if (!res.ok) {
    errorMessage.value = res.message || '加载角色卡审核列表失败'
    applications.value = []
    return
  }
  applications.value = res.list || []
}

function handleClose() {
  emit('update:open', false)
}

function statusLabel(status) {
  return ROOM_CHARACTER_STATUS_LABELS[status] || status || ''
}

function statusClass(status) {
  if (status === ROOM_CHARACTER_STATUS.PENDING) return 'bg-amber-500/20 text-amber-300'
  if (status === ROOM_CHARACTER_STATUS.ACCEPTED) return 'bg-green-500/20 text-green-300'
  if (status === ROOM_CHARACTER_STATUS.REJECTED) return 'bg-red-500/20 text-red-300'
  return 'bg-accent-muted/20 text-base-content'
}

function getCharacterName(characterId) {
  if (!characterId) return ''
  const character = getById(characterId)
  return character?.name || ''
}

function onViewCharacter(id) {
  if (!id) return
  openCharacterCard(id, true)
}

async function onApprove(item) {
  if (!props.isOwner) return
  const res = await updateRoomCharacterStatus(item.id, ROOM_CHARACTER_STATUS.ACCEPTED)
  if (!res.ok) {
    errorMessage.value = res.message || '操作失败'
    return
  }
  item.status = ROOM_CHARACTER_STATUS.ACCEPTED
}

async function onReject(item) {
  if (!props.isOwner) return
  const res = await updateRoomCharacterStatus(item.id, ROOM_CHARACTER_STATUS.REJECTED)
  if (!res.ok) {
    errorMessage.value = res.message || '操作失败'
    return
  }
  item.status = ROOM_CHARACTER_STATUS.REJECTED
}

watch(
  () => props.open,
  (val) => {
    if (val) {
      load()
    }
  }
)
</script>

