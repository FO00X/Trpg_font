<script setup>
import { ref, provide, watch, computed } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import Sidebar from './components/Sidebar.vue'
import CharacterCardModal from './components/CharacterCardModal.vue'
import { useChatStore } from './stores/chat'
import { useCharacterCardModal } from './composables/useCharacterCardModal'
import { useSwipe } from '@vueuse/core'

const route = useRoute()
const router = useRouter()
const sidebarOpen = ref(false)
const transitionName = ref('fade')
const { initSocket } = useChatStore()
const { open, characterId, isOwn, closeCharacterCard } = useCharacterCardModal()

// 边缘右滑打开侧边栏
const edgeZone = ref(null)
const { isSwiping: isEdgeSwiping, direction: edgeDirection, lengthX: edgeLengthX } = useSwipe(edgeZone)

watch(isEdgeSwiping, (swiping) => {
  if (!swiping && !isLoginPage.value && !sidebarOpen.value) {
    if (edgeDirection.value === 'right' && edgeLengthX.value < -30) {
      sidebarOpen.value = true
    }
  }
})

router.afterEach((to, from) => {
  const toDepth = to.path.split('/').filter(Boolean).length
  const fromDepth = from.path.split('/').filter(Boolean).length
  if (toDepth === fromDepth) {
    transitionName.value = 'fade'
  } else {
    transitionName.value = toDepth < fromDepth ? 'slide-right' : 'slide-left'
  }
})

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
  <div class="h-screen overflow-hidden">
    <main class="h-full w-full flex flex-col overflow-hidden relative bg-base-200">
      <RouterView v-slot="{ Component }">
        <Transition :name="transitionName">
          <div :key="route.path" class="absolute inset-0 flex flex-col">
            <component :is="Component" />
          </div>
        </Transition>
      </RouterView>
    </main>
    
    <div
      v-if="!isLoginPage && !sidebarOpen"
      ref="edgeZone"
      class="fixed left-0 top-0 bottom-0 w-6 z-30"
    ></div>

    <Sidebar v-if="!isLoginPage" v-model:open="sidebarOpen" />
    <CharacterCardModal
      :open="open"
      :character-id="characterId"
      :is-own="isOwn"
      @close="closeCharacterCard"
    />
  </div>
</template>
