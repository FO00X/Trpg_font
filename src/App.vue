<script setup>
import { ref, provide, onMounted } from 'vue'
import { RouterView } from 'vue-router'
import Sidebar from './components/Sidebar.vue'
import { useChatStore } from './stores/chat'

const sidebarOpen = ref(false)
const { initSocket } = useChatStore()

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

provide('sidebarOpen', sidebarOpen)
provide('toggleSidebar', toggleSidebar)

onMounted(() => {
  initSocket()
})
</script>

<template>
  <div class="h-screen overflow-hidden bg-chat-bg">
    <main class="h-full w-full flex flex-col overflow-hidden">
      <RouterView />
    </main>
    <Sidebar v-model:open="sidebarOpen" />
  </div>
</template>
