<script setup>
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import PageHeader from '../components/PageHeader.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import { useAchievementsStore } from '../stores/achievements'

const achievementsStore = useAchievementsStore()

const loading = ref(true)

onMounted(async () => {
  await achievementsStore.ensureInitialized()
  await achievementsStore.refreshUserAchievements()
  loading.value = false
})

const groupedAchievements = computed(() => {
  const groups = {}
  const list = achievementsStore.allAchievements.value || []
  for (const a of list) {
    const cat = a.category || '其他'
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(a)
  }
  return Object.entries(groups).map(([category, items]) => ({
    category,
    items: items.sort((x, y) => {
      if (x.unlocked && !y.unlocked) return -1
      if (!x.unlocked && y.unlocked) return 1
      return x.title.localeCompare(y.title, 'zh-CN')
    }),
  }))
})

const unlockedCount = computed(() => achievementsStore.unlockedCount.value)
const totalCount = computed(() => achievementsStore.totalCount.value)
</script>

<template>
  <div class="flex flex-col h-full">
    <PageHeader title="成就" icon="mdi:trophy-outline">
      <template #actions>
        <div class="px-3 py-1 rounded-full bg-base-200 text-xs text-base-content/70">
          已解锁
          <span class="font-semibold text-primary">{{ unlockedCount }}</span>
          /
          <span>{{ totalCount }}</span>
        </div>
      </template>
    </PageHeader>

    <div class="flex-1 overflow-y-auto scroll-thin p-4">
      <LoadingSpinner v-if="loading" message="加载中…" />

      <div v-else-if="!totalCount" class="text-center text-base-content/60 py-10 text-sm">
        暂无成就配置。
      </div>

      <div v-else class="space-y-6 max-w-3xl mx-auto">
        <div
          v-for="group in groupedAchievements"
          :key="group.category"
          class="space-y-2"
        >
          <div class="flex items-center gap-2">
            <h2 class="text-xs font-bold uppercase tracking-wider text-base-content/50">
              {{ group.category }}
            </h2>
            <div class="h-px flex-1 bg-base-300/60" />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              v-for="a in group.items"
              :key="a.id"
              class="rounded-2xl border bg-base-100 p-3 flex gap-3 items-start transition-all"
              :class="a.unlocked ? 'border-primary/40 shadow-sm shadow-primary/10' : 'border-base-300/80 opacity-70'"
            >
              <div
                class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                :class="a.unlocked ? 'bg-primary/10 text-primary' : 'bg-base-200 text-base-content/40'"
              >
                <Icon :icon="a.icon || 'mdi:trophy-outline'" class="text-xl" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <div
                    class="text-sm font-semibold truncate"
                    :class="a.unlocked ? 'text-base-content' : 'text-base-content/70'"
                  >
                    {{ a.title }}
                  </div>
                  <span
                    v-if="a.unlocked"
                    class="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-success/10 text-success shrink-0"
                  >
                    已解锁
                  </span>
                  <span
                    v-else
                    class="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-base-200 text-base-content/60 shrink-0"
                  >
                    未解锁
                  </span>
                </div>
                <p class="text-xs text-base-content/60 mt-1 line-clamp-2">
                  {{ a.description }}
                </p>
                <p
                  v-if="a.unlockedAt"
                  class="text-[11px] text-base-content/40 mt-1"
                >
                  解锁时间：{{ new Date(a.unlockedAt).toLocaleString() }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

