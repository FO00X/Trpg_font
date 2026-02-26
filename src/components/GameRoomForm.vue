<template>
  <div class="max-w-lg mx-auto space-y-4">
    <!-- 房间名称 -->
    <div>
      <label class="block text-sm font-medium text-white mb-1.5">房间名称 *</label>
      <input
        v-model="localForm.name"
        type="text"
        placeholder="例如：亡蝶葬仪 - 调查组"
        class="w-full px-3 py-2 rounded-lg bg-chat-bg border border-chat-border text-[#cdd6f4] placeholder:text-accent-muted focus:border-accent/50 outline-none text-sm"
      />
    </div>

    <!-- 模组名称（插槽可自定义） -->
    <div v-if="showModule">
      <label class="block text-sm font-medium text-white mb-1.5">模组名称 *</label>
      <slot name="module" :form="localForm">
        <input
          v-model="localForm.module"
          type="text"
          placeholder="例如：亡蝶葬仪 / 自编模组"
          class="w-full px-3 py-2 rounded-lg bg-chat-bg border border-chat-border text-[#cdd6f4] placeholder:text-accent-muted focus:border-accent/50 outline-none text-sm"
        />
      </slot>
    </div>

    <!-- 房间描述 -->
    <div>
      <label class="block text-sm font-medium text-white mb-1.5">房间描述</label>
      <textarea
        v-model="localForm.description"
        rows="4"
        placeholder="介绍一下你的房间..."
        class="w-full px-3 py-2 rounded-lg bg-chat-bg border border-chat-border text-[#cdd6f4] placeholder:text-accent-muted focus:border-accent/50 outline-none text-sm resize-none"
      />
    </div>

    <!-- 最大人数 -->
    <div v-if="showMaxPlayers">
      <label class="block text-sm font-medium text-white mb-1.5">最大人数</label>
      <input
        v-model.number="localForm.maxPlayers"
        type="number"
        min="2"
        max="10"
        class="w-full px-3 py-2 rounded-lg bg-chat-bg border border-chat-border text-[#cdd6f4] focus:border-accent/50 outline-none text-sm"
      />
    </div>

    <!-- 标签 -->
    <div>
      <label class="block text-sm font-medium text-white mb-1.5">标签（可选）</label>

      <!-- 新版：按分组的下拉选择 -->
      <div v-if="tagGroups && tagGroups.length" class="space-y-3">
        <div
          v-for="group in tagGroups"
          :key="group.category"
          class="space-y-1.5"
        >
          <div class="text-xs text-accent-muted">{{ group.category }}</div>
          <select
            class="w-full px-3 py-2 rounded-lg bg-chat-bg border border-chat-border text-[#cdd6f4] text-sm outline-none focus:border-accent/50"
            :value="currentTagForGroup(group)"
            @change="onSelectTagForGroup(group, $event.target.value)"
          >
            <option value="">不选择</option>
            <option
              v-for="tag in group.tags"
              :key="tag"
              :value="tag"
            >
              {{ tag }}
            </option>
          </select>
        </div>
      </div>

      <!-- 旧版：平铺按钮（用于兼容无分组场景） -->
      <div v-else class="flex flex-wrap gap-2">
        <button
          v-for="tag in availableTags"
          :key="tag"
          type="button"
          :class="[
            'px-3 py-1.5 rounded-lg text-sm transition-colors',
            (localForm.tags || []).includes(tag)
              ? 'bg-accent text-chat-bg'
              : 'bg-chat-bg border border-chat-border text-accent-muted hover:border-accent/30',
          ]"
          @click="toggleTag(tag)"
        >
          {{ tag }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  availableTags: {
    type: Array,
    default: () => [],
  },
  tagGroups: {
    type: Array,
    default: () => [],
  },
  showModule: {
    type: Boolean,
    default: true,
  },
  showMaxPlayers: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['update:modelValue'])

function createDefaultForm() {
  return {
    name: '',
    description: '',
    module: '',
    icon: '',
    maxPlayers: 6,
    tags: [],
  }
}

const localForm = ref(createDefaultForm())
let updatingFromProps = false

watch(
  () => props.modelValue,
  (val) => {
    updatingFromProps = true
    localForm.value = {
      ...createDefaultForm(),
      ...(val || {}),
      tags: Array.isArray(val?.tags) ? [...val.tags] : [],
    }
    updatingFromProps = false
  },
  { immediate: true, deep: true }
)

watch(
  localForm,
  (val) => {
    if (updatingFromProps) return
    emit('update:modelValue', {
      ...val,
      tags: Array.isArray(val.tags) ? [...val.tags] : [],
    })
  },
  { deep: true }
)

function toggleTag(tag) {
  const current = new Set(localForm.value.tags || [])
  if (current.has(tag)) {
    current.delete(tag)
  } else {
    current.add(tag)
  }
  localForm.value = {
    ...localForm.value,
    tags: [...current],
  }
}

function currentTagForGroup(group) {
  const tags = localForm.value.tags || []
  const found = (group.tags || []).find((t) => tags.includes(t))
  return found || ''
}

function onSelectTagForGroup(group, value) {
  const current = new Set(localForm.value.tags || [])
  for (const t of group.tags || []) {
    current.delete(t)
  }
  if (value) {
    current.add(value)
  }
  localForm.value = {
    ...localForm.value,
    tags: [...current],
  }
}
</script>

