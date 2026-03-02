<template>
  <div class="flex flex-col h-full relative">
    <PageHeader :title="pageTitle" :icon="pageIcon">
      <template v-if="activeTab === 'users'" #actions>
        <button type="button" :disabled="usersLoading" class="btn btn-ghost btn-sm" @click="usersLoad">
          <Icon icon="mdi:refresh" class="text-xl" />
        </button>
      </template>
    </PageHeader>

    <div class="flex-1 overflow-auto scroll-thin p-4">
      <p v-if="!isAdmin" class="text-base-content text-center py-8">
        你没有权限查看此页面。
      </p>
      <template v-else>
        <AdminUsersView v-show="activeTab === 'users'" ref="usersViewRef" :standalone="false" />
        <AdminAIView v-show="activeTab === 'ai'" :standalone="false" />
      </template>
    </div>

    <!-- FAB 切换页面 -->
    <div v-if="isAdmin" class="fab fab-flower">
      <div
        tabindex="0"
        role="button"
        class="btn btn-lg btn-circle btn-primary"
        :aria-label="`当前：${activeTab === 'users' ? '用户列表' : 'AI管理'}，点击切换`"
      >
        <Icon :icon="activeTab === 'users' ? 'mdi:account-supervisor' : 'mdi:robot-outline'" class="text-2xl" />
      </div>
      <button
        type="button"
        class="btn btn-lg btn-circle"
        :class="activeTab === 'users' ? 'btn-primary' : 'btn-ghost'"
        title="用户列表"
        aria-label="切换到用户列表"
        @click="switchTab('users')"
      >
        <Icon icon="mdi:account-supervisor" class="text-xl" />
      </button>
      <button
        type="button"
        class="btn btn-lg btn-circle"
        :class="activeTab === 'ai' ? 'btn-primary' : 'btn-ghost'"
        title="AI管理"
        aria-label="切换到AI管理"
        @click="switchTab('ai')"
      >
        <Icon icon="mdi:robot-outline" class="text-xl" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import PageHeader from '../components/PageHeader.vue'
import AdminUsersView from './AdminUsersView.vue'
import AdminAIView from './AdminAIView.vue'
import { Icon } from '@iconify/vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const isAdmin = computed(() => auth.user?.value?.role === 'admin')

const activeTab = ref('users')
const usersViewRef = ref(null)

const pageTitle = computed(() =>
  activeTab.value === 'users' ? '用户列表' : 'AI管理'
)
const pageIcon = computed(() =>
  activeTab.value === 'users' ? 'mdi:account-supervisor' : 'mdi:robot-outline'
)

const usersLoading = computed(() => usersViewRef.value?.loading?.value ?? false)

function switchTab(tab) {
  activeTab.value = tab
  if (tab === 'users') {
    usersViewRef.value?.load?.()
  }
}

function usersLoad() {
  usersViewRef.value?.load?.()
}

onMounted(() => {
  if (isAdmin.value && activeTab.value === 'users') {
    usersViewRef.value?.load?.()
  }
})
</script>
