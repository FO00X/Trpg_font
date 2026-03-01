<template>
  <div class="max-w-lg mx-auto space-y-4">
    <div class="form-control">
      <label class="label"><span class="label-text">房间名称 *</span></label>
      <input v-model="localForm.name" type="text" placeholder="例如：亡蝶葬仪 - 调查组" class="input input-bordered w-full text-sm" />
    </div>
    <div v-if="showModule" class="form-control">
      <label class="label"><span class="label-text">模组名称 *</span></label>
      <slot name="module" :form="localForm">
        <input v-model="localForm.module" type="text" placeholder="例如：亡蝶葬仪 / 自编模组" class="input input-bordered w-full text-sm" />
      </slot>
    </div>
    <div class="form-control">
      <label class="label"><span class="label-text">房间描述</span></label>
      <textarea v-model="localForm.description" rows="4" placeholder="介绍一下你的房间..." class="textarea textarea-bordered w-full text-sm resize-none" />
    </div>
    <div v-if="showMaxPlayers" class="form-control">
      <label class="label"><span class="label-text">最大人数</span></label>
      <input v-model.number="localForm.maxPlayers" type="number" min="2" max="10" class="input input-bordered w-full text-sm" />
    </div>
    <div class="form-control">
      <label class="label"><span class="label-text">标签（可选）</span></label>
      <div v-if="tagGroups && tagGroups.length" class="space-y-3">
        <div v-for="group in tagGroups" :key="group.category" class="space-y-1.5">
          <div class="text-xs text-base-content/60">{{ group.category }}</div>
          <select class="select select-bordered w-full text-sm" :value="currentTagForGroup(group)" @change="onSelectTagForGroup(group, $event.target.value)">
            <option value="">不选择</option>
            <option v-for="tag in group.tags" :key="tag" :value="tag">{{ tag }}</option>
          </select>
        </div>
      </div>
      <div v-else class="flex flex-wrap gap-2">
        <button
          v-for="tag in availableTags"
          :key="tag"
          type="button"
          :class="['btn btn-sm', (localForm.tags || []).includes(tag) ? 'btn-primary' : 'btn-ghost']"
          @click="toggleTag(tag)"
        >
          {{ tag }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'

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
    nextTick(() => {
      updatingFromProps = false
    })
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

