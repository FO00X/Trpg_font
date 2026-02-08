<script setup>
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import PageHeader from '../components/PageHeader.vue'

const router = useRouter()
</script>

<template>
  <div class="flex flex-col h-full">
    <PageHeader title="页面不存在" />
    <div class="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
      <Icon icon="mdi:page-layout-header-footer" class="text-6xl text-accent-muted" />
      <p class="text-[#a6adc8]">您访问的地址不存在</p>
      <button type="button" class="px-4 py-2 rounded-lg bg-accent text-chat-bg font-medium hover:opacity-90" @click="router.push('/')">
        返回首页
      </button>
    </div>
  </div>
</template>
