<script setup>
import { computed } from 'vue'
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOptions, ComboboxOption } from '@headlessui/vue'
import { Icon } from '@iconify/vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  options: { type: Array, required: true },
  placeholder: { type: String, default: '输入或选择...' },
  label: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])

const optionsList = computed(() =>
  props.options.map((o) => (typeof o === 'string' ? o : o.value ?? o.label ?? ''))
)

const filteredOptions = computed(() => {
  const q = (props.modelValue || '').trim().toLowerCase()
  if (!q) return optionsList.value
  return optionsList.value.filter((opt) => opt.toLowerCase().includes(q))
})

function onInputChange(e) {
  emit('update:modelValue', e.target.value)
}

function displayValue(item) {
  return item ?? props.modelValue ?? ''
}
</script>

<template>
  <div class="relative">
    <label v-if="label" class="block text-sm text-[#a6adc8] mb-1">{{ label }}</label>
    <Combobox
      :model-value="modelValue"
      nullable
      @update:model-value="emit('update:modelValue', $event ?? '')"
    >
      <div class="relative">
        <ComboboxInput
          :display-value="displayValue"
          class="w-full rounded-lg bg-chat-bg border border-chat-border py-2 pl-3 pr-10 text-left text-white placeholder-accent-muted focus:border-accent outline-none"
          :placeholder="placeholder"
          @change="onInputChange"
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
              v-for="opt in filteredOptions"
              :key="opt"
              v-slot="{ active, selected }"
              :value="opt"
              as="template"
            >
              <li
                :class="[
                  'relative cursor-pointer select-none py-2 pl-3 pr-9',
                  active ? 'bg-sidebar-hover text-white' : 'text-[#a6adc8]',
                  selected && 'bg-accent/20 text-accent',
                ]"
              >
                <span class="block truncate">{{ opt }}</span>
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
</template>
