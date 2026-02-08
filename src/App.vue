<script setup>
import { ref, provide, watch, computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import Sidebar from './components/Sidebar.vue'
import CharacterCardModal from './components/CharacterCardModal.vue'
import { useChatStore } from './stores/chat'
import { useCharacterCardModal } from './composables/useCharacterCardModal'

const route = useRoute()
const sidebarOpen = ref(false)
const { initSocket } = useChatStore()
const { open, characterId, isOwn, closeCharacterCard } = useCharacterCardModal()

const isLoginPage = computed(() => route.name === 'login')

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

provide('sidebarOpen', sidebarOpen)
provide('toggleSidebar', toggleSidebar)

watch(isLoginPage, (isLogin) => {
  if (!isLogin) initSocket()
}, { immediate: true })
</script>

<template>
  <div class="h-screen overflow-hidden bg-chat-bg">
    <main class="h-full w-full flex flex-col overflow-hidden">
      <RouterView />
    </main>
    <Sidebar v-if="!isLoginPage" v-model:open="sidebarOpen" />
    <CharacterCardModal
      :open="open"
      :character-id="characterId"
      :is-own="isOwn"
      @close="closeCharacterCard"
    />
  </div>
</template>
