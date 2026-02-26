<script setup>
import { computed, ref, onMounted } from 'vue'
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOptions, ComboboxOption } from '@headlessui/vue'
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

const iconPickerOpen = ref(false)

const filteredModules = computed(() => {
  const q = (props.modelValue || '').trim().toLowerCase()
  if (!q) return availableModules.value
  return availableModules.value.filter((m) => m.name.toLowerCase().includes(q))
})

const currentIcon = computed(() => {
  if (props.icon) return props.icon
  const mod = availableModules.value.find((m) => m.name === props.modelValue || m.id === props.modelValue)
  return mod?.icon || 'mdi:dots-horizontal'
})

function onModuleChange(value) {
  emit('update:modelValue', value ?? '')
  if (value) {
    const mod = availableModules.value.find((m) => m.name === value || m.id === value)
    if (mod?.icon) {
      emit('update:icon', mod.icon)
    }
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

onMounted(() => {
  if (availableModules.value.length === 0) {
    fetchModules()
  }
})
</script>

<template>
  <div class="space-y-2">
    <div class="flex items-center gap-2">
      <!-- 模组名称输入/选择 -->
      <div class="flex-1">
        <Combobox
          :model-value="modelValue"
          nullable
          @update:model-value="onModuleChange"
        >
          <div class="relative">
            <ComboboxInput
              :display-value="(value) => value ?? ''"
              class="w-full px-3 py-2 rounded-lg bg-chat-bg border border-chat-border text-[#cdd6f4] placeholder:text-accent-muted focus:border-accent/50 outline-none text-sm"
              :placeholder="placeholder"
            />
            <ComboboxButton class="absolute inset-y-0 right-0 flex items-center pr-2">
              <Icon icon="mdi:chevron-down" class="h-5 w-5 text-accent-muted" aria-hidden="true" />
            </ComboboxButton>
            <Transition
              leave-active-class="transition ease-in duration-100"
              leave-from-class="opacity-100"
              leave-to-class="opacity-0"
            >
              <ComboboxOptions
                class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-chat-panel border border-chat-border py-1 shadow-lg focus:outline-none"
              >
                <ComboboxOption
                  v-for="mod in filteredModules"
                  :key="mod.id"
                  v-slot="{ active, selected }"
                  :value="mod.name"
                  as="template"
                >
                  <li
                    :class="[
                      'relative cursor-pointer select-none py-2 pl-3 pr-9 flex items-center gap-2',
                      active ? 'bg-sidebar-hover text-white' : 'text-[#a6adc8]',
                      selected && 'bg-accent/20 text-accent',
                    ]"
                  >
                    <Icon :icon="mod.icon" class="text-lg shrink-0" />
                    <span class="block truncate">{{ mod.name }}</span>
                    <span
                      v-if="selected"
                      class="absolute inset-y-0 right-0 flex items-center pr-3 text-accent"
                    >
                      <Icon icon="mdi:check" class="h-5 w-5" />
                    </span>
                  </li>
                </ComboboxOption>
              </ComboboxOptions>
            </Transition>
          </div>
        </Combobox>
      </div>

      <!-- 图标选择按钮 -->
      <button
        type="button"
        class="w-10 h-10 rounded-lg bg-chat-bg border border-chat-border flex items-center justify-center hover:border-accent/50 transition-colors shrink-0"
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
        <DialogPanel class="mx-auto w-full max-w-md rounded-xl bg-chat-panel border border-chat-border shadow-xl">
          <DialogTitle class="sr-only">选择图标</DialogTitle>
          <div class="p-4">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-white">选择图标</h3>
              <button
                type="button"
                class="p-2 rounded-lg text-accent-muted hover:text-white hover:bg-white/5"
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
                    : 'bg-chat-bg border-chat-border text-accent-muted hover:border-accent/50 hover:text-accent',
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
