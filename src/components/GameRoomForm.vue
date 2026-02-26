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
    <div>
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
    <div>
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
      <div class="flex flex-wrap gap-2">
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

watch(
  () => props.modelValue,
  (val) => {
    localForm.value = {
      ...createDefaultForm(),
      ...(val || {}),
      tags: Array.isArray(val?.tags) ? [...val.tags] : [],
    }
  },
  { immediate: true, deep: true }
)

watch(
  localForm,
  (val) => {
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
</script>

