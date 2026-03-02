<script setup>
import { ref, provide, watch, computed, onMounted } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import Sidebar from './components/Sidebar.vue'
import CharacterCardModal from './components/CharacterCardModal.vue'
import Toast from './components/Toast.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
import { useChatStore } from './stores/chat'
import { useCharacterCardModal } from './composables/useCharacterCardModal'
import { useSwipe } from '@vueuse/core'
import { registerToastRef } from './composables/useToast'
import { useConfirmDialog } from './composables/useConfirmDialog'
import { useDice3D } from './composables/useDice3D'

const route = useRoute()
const globalToastRef = ref(null)
const { state: confirmState, onConfirm, onCancel } = useConfirmDialog()
const { initDiceBox } = useDice3D()

onMounted(() => {
  if (globalToastRef.value) registerToastRef(globalToastRef.value)
  initDiceBox('#dice-box-container')
})
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
          <div :key="route.path" class="absolute inset-0 flex flex-col min-h-0 overflow-hidden">
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
    <Toast v-if="!isLoginPage" ref="globalToastRef" />
    <ConfirmDialog
      v-if="!isLoginPage"
      v-model:visible="confirmState.visible"
      :title="confirmState.title"
      :message="confirmState.message"
      :confirm-text="confirmState.confirmText"
      :cancel-text="confirmState.cancelText"
      @confirm="onConfirm"
      @cancel="onCancel"
    />
    
    <!-- 3D 骰子全局容器，浮在最上层但忽略点击事件 -->
    <div id="dice-box-container" class="fixed inset-0 pointer-events-none z-[9999] opacity-90 transition-opacity duration-300"></div>
  </div>
</template>

<style>
/* 防止 3D 引擎生成的 canvas 阻塞底层交互，或者背景遮挡 */
#dice-box-container canvas {
  pointer-events: none !important;
  width: 100% !important;
  height: 100% !important;
  background: transparent !important;
  /* 添加简单的阴影滤镜，使骰子更能融入背景 */
  filter: drop-shadow(0 10px 8px rgb(0 0 0 / 0.15)) drop-shadow(0 4px 3px rgb(0 0 0 / 0.1));
}
</style>
