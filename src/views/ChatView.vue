<script setup>
import { inject } from 'vue'
import ChatArea from '../components/ChatArea.vue'

const sidebarOpen = inject('sidebarOpen')
const toggleSidebar = inject('toggleSidebar')
</script>

<template>
  <ChatArea
    class="flex-1 flex flex-col min-h-0"
    :sidebar-open="sidebarOpen"
    @toggle-sidebar="toggleSidebar"
  />
</template>
