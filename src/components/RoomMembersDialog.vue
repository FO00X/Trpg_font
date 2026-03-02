<template>
  <Teleport to="body">
    <Dialog :open="open" class="relative z-50" @close="handleClose">
      <div class="fixed inset-0 bg-black/60" aria-hidden="true" />
      <div class="fixed inset-0 flex items-center justify-center p-4" @click.self="handleClose">
        <DialogPanel class="mx-auto w-full max-w-md rounded-xl bg-base-100 border border-base-300 shadow-xl">
          <DialogTitle class="sr-only">房间用户与角色</DialogTitle>
          <div class="p-4">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-base-content flex items-center gap-2">
                <Icon icon="mdi:account-group-outline" class="text-xl text-accent" />
                房间用户与角色
              </h2>
              <button
                type="button"
                class="p-2 rounded-lg text-base-content hover:text-base-content hover:bg-base-content/10"
                @click="handleClose"
              >
                <Icon icon="mdi:close" class="text-xl" />
              </button>
            </div>

            <div v-if="!displayMembers.length" class="py-6 text-center text-sm text-base-content">
              暂无角色信息
            </div>
            <ul v-else class="space-y-2 max-h-64 overflow-y-auto scroll-thin">
              <li
                v-for="m in displayMembers"
                :key="`${m.kind}-${m.display}-${m.user}`"
              >
                <button
                  v-if="m.kind !== 'kp' && m.characterId"
                  type="button"
                  class="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-base-200 border border-base-300 hover:border-accent/60 hover:bg-accent/10 text-left"
                  @click="handleViewCharacter(m.characterId)"
                >
                  <span class="px-2 py-0.5 rounded text-[11px] font-medium bg-green-500/20 text-green-400">
                    {{ m.label }}
                  </span>
                  <span class="flex-1 min-w-0 text-sm text-base-content truncate">
                    {{ m.display }}
                  </span>
                  <span class="text-xs text-base-content shrink-0">
                    {{ m.user }}
                  </span>
                  <Icon icon="mdi:chevron-right" class="text-base text-base-content" />
                </button>
                <div
                  v-else
                  class="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-base-200 border border-base-300"
                >
                  <span class="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-500/20 text-blue-400">
                    KP
                  </span>
                  <span class="flex-1 min-w-0 text-sm text-base-content truncate">
                    {{ m.user || '房主' }}
                  </span>
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
import { Icon } from '@iconify/vue'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/vue'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  displayMembers: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:open', 'view-character'])

function handleClose() {
  emit('update:open', false)
}

function handleViewCharacter(id) {
  if (!id) return
  emit('view-character', id)
}
</script>

