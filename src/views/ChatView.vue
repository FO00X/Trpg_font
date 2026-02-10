<template>
  <div class="h-full min-h-0">
    <ChatArea :sidebar-open="sidebarOpen" @toggle-sidebar="toggleSidebar" />
  </div>
</template>

<script setup>
import { inject } from 'vue'
import ChatArea from '../components/ChatArea.vue'

const sidebarOpen = inject('sidebarOpen')
const toggleSidebar = inject('toggleSidebar')
</script>

<style scoped>
</style>

