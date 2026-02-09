<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useCharactersStore } from '../stores/characters'
import PageHeader from '../components/PageHeader.vue'
import { useCharacterCardModal } from '../composables/useCharacterCardModal'

const router = useRouter()
const { characters, remove } = useCharactersStore()
const { openCharacterCard } = useCharacterCardModal()
const openMenuId = ref(null)

function createNew() {
  router.push('/characters/new')
}

function viewCharacter(c) {
  openCharacterCard(c.id, true)
}

function editCharacter(c) {
  router.push(`/characters/${c.id}`)
}

function toggleMenu(e, id) {
  e.stopPropagation()
  openMenuId.value = openMenuId.value === id ? null : id
}

function closeMenu() {
  openMenuId.value = null
}

function deleteCharacter(c) {
  if (!confirm(`确定要删除角色「${c.name || '未命名'}」吗？此操作不可恢复。`)) return
  remove(c.id)
  closeMenu()
}

function onCardClick(c) {
  if (openMenuId.value === c.id) {
    closeMenu()
    return
  }
  viewCharacter(c)
}

onMounted(() => {
  document.addEventListener('click', closeMenu)
})
onUnmounted(() => {
  document.removeEventListener('click', closeMenu)
})
</script>

<template>
  <div class="flex flex-col h-full">
    <PageHeader title="角色卡" icon="mdi:card-account-details">
      <template #actions>
        <button
          type="button"
          class="p-2 rounded-full bg-white/10 text-white/80 hover:text-white hover:bg-white/30 transition-colors"
          @click="createNew"
        >
          <Icon icon="mdi:plus" class="text-xl" />
        </button>
      </template>
    </PageHeader>
    <div class="flex-1 overflow-y-auto scroll-thin p-4">
      <div class="max-w-2xl mx-auto space-y-2">
        <div
          v-for="c in characters"
          :key="c.id"
          class="flex items-center gap-3 p-3 rounded-xl bg-chat-panel border border-chat-border hover:border-accent/30 transition-colors cursor-pointer"
          @click="onCardClick(c)"
        >
          <div class="w-10 h-10 rounded-lg bg-sidebar-active flex items-center justify-center shrink-0">
            <Icon icon="mdi:dice-multiple" class="text-xl text-accent" />
          </div>
          <div class="flex-1 min-w-0 min-h-0">
            <div class="font-medium text-white truncate">{{ c.name || '未命名' }}</div>
            <div class="text-sm text-accent-muted truncate">
              {{ c.campaign ? `${c.campaign} · ` : '' }}{{ c.updated }}
            </div>
          </div>
          <div class="relative shrink-0">
            <button
              type="button"
              class="p-1.5 rounded-lg text-accent-muted hover:text-white hover:bg-white/10 transition-colors"
              aria-label="菜单"
              @click="toggleMenu($event, c.id)"
            >
              <Icon icon="mdi:dots-vertical" class="text-xl" />
            </button>
            <div
              v-show="openMenuId === c.id"
              class="absolute right-0 top-full mt-1 py-1 min-w-[120px] rounded-lg bg-chat-panel border border-chat-border shadow-lg z-10"
              @click.stop
            >
              <button
                type="button"
                class="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 flex items-center gap-2"
                @click="viewCharacter(c); closeMenu()"
              >
                <Icon icon="mdi:eye-outline" class="text-lg shrink-0" />
                查看
              </button>
              <button
                type="button"
                class="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 flex items-center gap-2"
                @click="editCharacter(c); closeMenu()"
              >
                <Icon icon="mdi:pencil-outline" class="text-lg shrink-0" />
                编辑
              </button>
              <button
                type="button"
                class="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-white/10 flex items-center gap-2"
                @click="deleteCharacter(c)"
              >
                <Icon icon="mdi:delete-outline" class="text-lg shrink-0" />
                删除
              </button>
            </div>
          </div>
        </div>
        <p v-if="!characters.length" class="text-center text-accent-muted py-8">暂无角色卡，点击上方「创建角色」开始创建。</p>
      </div>
    </div>

  </div>
</template>
