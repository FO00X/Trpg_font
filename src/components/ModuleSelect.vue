<template>
  <div ref="rootRef" class="space-y-2">
    <div class="flex items-center gap-2">
      <!-- 模组名称输入/选择 -->
      <div class="flex-1 relative">
        <input
          v-model="inputValue"
          type="text"
          class="w-full px-3 py-2 rounded-lg bg-base-100 border border-base-300 text-base-content placeholder:text-base-content focus:border-accent/50 outline-none text-sm pr-10"
          :placeholder="placeholder"
          @input="onInput"
          @focus="showDropdown = true"
          @blur="handleBlur"
        />
        <button
          type="button"
          class="absolute inset-y-0 right-0 flex items-center pr-2 text-base-content hover:text-base-content"
          @mousedown.prevent="showDropdown = !showDropdown"
        >
          <Icon icon="mdi:chevron-down" class="h-5 w-5" />
        </button>
        <Transition
          enter-active-class="transition ease-out duration-100"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition ease-in duration-100"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="showDropdown && filteredModules.length > 0"
            class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-base-200 border border-base-300 py-1 shadow-lg"
          >
            <button
              v-for="mod in filteredModules"
              :key="mod.id"
              type="button"
              :class="[
                'w-full relative cursor-pointer select-none py-2 pl-3 pr-9 flex items-center gap-2 text-left',
                modelValue === mod.name ? 'bg-accent/20 text-accent' : 'text-[#a6adc8] hover:bg-base-200 hover:text-base-content',
              ]"
              @mousedown.prevent
              @click="selectModule(mod.name, mod.icon)"
            >
              <Icon :icon="mod.icon" class="text-lg shrink-0" />
              <span class="block truncate flex-1">{{ mod.name }}</span>
              <span
                v-if="modelValue === mod.name"
                class="absolute inset-y-0 right-0 flex items-center pr-3 text-accent"
              >
                <Icon icon="mdi:check" class="h-5 w-5" />
              </span>
            </button>
          </div>
        </Transition>
      </div>

      <!-- 图标选择按钮 -->
      <button
        type="button"
        class="w-10 h-10 rounded-lg bg-base-100 border border-base-300 flex items-center justify-center hover:border-accent/50 transition-colors shrink-0"
        title="选择图标"
        @click="iconPickerOpen = true"
      >
        <Icon :icon="currentIcon" class="text-xl text-accent" />
      </button>
    </div>

    <!-- 图标选择器弹窗 -->
    <Dialog :open="iconPickerOpen" @close="iconPickerOpen = false" class="relative z-50">
      <div class="fixed inset-0 bg-black/60" aria-hidden="true" />
      <div class="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel class="mx-auto w-full max-w-md rounded-xl bg-base-200 border border-base-300 shadow-xl">
          <DialogTitle class="sr-only">选择图标</DialogTitle>
          <div class="p-4">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-base-content">选择图标</h3>
              <button
                type="button"
                class="p-2 rounded-lg text-base-content hover:text-base-content hover:bg-base-content/10"
                @click="iconPickerOpen = false"
              >
                <Icon icon="mdi:close" class="text-xl" />
              </button>
            </div>
            <div class="grid grid-cols-6 gap-1 max-h-64 overflow-y-auto scroll-thin">
              <button
                v-for="icon in commonIcons"
                :key="icon"
                type="button"
                :class="[
                  'p-2 rounded-lg border transition-colors',
                  currentIcon === icon
                    ? 'bg-accent/20 border-accent text-accent'
                    : 'bg-base-100 border-base-300 text-base-content hover:border-accent/50 hover:text-accent',
                ]"
                :title="icon"
                @click="selectIcon(icon)"
              >
                <Icon :icon="icon" class="text-xl" />
              </button>
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  </div>
</template>
<script setup>
import { computed, ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { Icon } from '@iconify/vue'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/vue'
import { useGameRoomsStore } from '../stores/gameRooms'

const props = defineProps({
  modelValue: { type: String, default: '' },
  icon: { type: String, default: '' },
  placeholder: { type: String, default: '选择或输入模组名称...' },
})

const emit = defineEmits(['update:modelValue', 'update:icon'])

const { availableModules, fetchModules } = useGameRoomsStore()

const rootRef = ref(null)
const iconPickerOpen = ref(false)
const showDropdown = ref(false)
const inputValue = ref('')

const filteredModules = computed(() => {
  const q = (inputValue.value || '').trim().toLowerCase()
  if (!q) return availableModules.value
  return availableModules.value.filter((m) => m.name.toLowerCase().includes(q))
})

const currentIcon = computed(() => {
  if (props.icon) return props.icon
  const mod = availableModules.value.find((m) => m.name === props.modelValue || m.id === props.modelValue)
  return mod?.icon || 'mdi:dots-horizontal'
})

function onInput(event) {
  const value = event.target.value
  inputValue.value = value
  showDropdown.value = true
  // 直接更新 modelValue，允许自定义输入，不自动匹配
  emit('update:modelValue', value)
}

function selectModule(name, icon) {
  inputValue.value = name
  emit('update:modelValue', name)
  if (icon) {
    emit('update:icon', icon)
  }
  showDropdown.value = false
}

function handleBlur() {
  nextTick(() => {
    setTimeout(() => {
      showDropdown.value = false
    }, 200)
  })
}

function onDocumentMousedown(e) {
  if (rootRef.value && !rootRef.value.contains(e.target)) {
    showDropdown.value = false
  }
}

function selectIcon(icon) {
  emit('update:icon', icon)
  iconPickerOpen.value = false
}

const commonIcons = [
  'mdi:dice-multiple',
  'mdi:book-open-variant',
  'mdi:ghost',
  'mdi:skull',
  'mdi:sword',
  'mdi:shield',
  'mdi:magic-staff',
  'mdi:castle',
  'mdi:forest',
  'mdi:city',
  'mdi:ship',
  'mdi:airplane',
  'mdi:car',
  'mdi:key',
  'mdi:treasure-chest',
  'mdi:map',
  'mdi:compass',
  'mdi:jack-o-lantern',
  'mdi:candle',
  'mdi:eye',
  'mdi:hand',
  'mdi:footprints',
  'mdi:lock',
  'mdi:unlocked-variant-outline',
  'mdi:door',
  'mdi:window',
  'mdi:fire',
  'mdi:water',
  'mdi:star',
  'mdi:moon-and-stars',
  'mdi:white-balance-sunny',
  'mdi:cloud',
  'mdi:flower',
  'mdi:tree',
  'mdi:bug',
  'mdi:cat',
  'mdi:dog',
  'mdi:bird',
  'mdi:fish',
  'mdi:snake',
  'mdi:spider',
  'mdi:bat',
  'mdi:elephant',
  'mdi:horse',
  'mdi:rabbit',
]

watch(() => props.modelValue, (newValue) => {
  if (newValue !== inputValue.value) {
    inputValue.value = newValue ?? ''
  }
}, { immediate: true })

onMounted(() => {
  if (availableModules.value.length === 0) {
    fetchModules()
  }
  document.addEventListener('mousedown', onDocumentMousedown)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', onDocumentMousedown)
})
</script>


