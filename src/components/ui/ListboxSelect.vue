<script setup>
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/vue'
import { Icon } from '@iconify/vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  options: { type: Array, required: true },
  placeholder: { type: String, default: '请选择' },
  label: { type: String, default: '' },
  optionLabel: { type: String, default: 'label' },
  optionValue: { type: String, default: 'value' },
})
const emit = defineEmits(['update:modelValue'])

const selectedOption = () => props.options.find(o => o[props.optionValue] === props.modelValue)
const displayText = () => selectedOption()?.[props.optionLabel] ?? props.placeholder
</script>

<template>
  <div class="relative">
    <label v-if="label" class="block text-sm text-[#a6adc8] mb-1">{{ label }}</label>
    <Listbox :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
      <div class="relative">
        <ListboxButton
          class="relative w-full cursor-pointer rounded-lg bg-chat-bg border border-chat-border py-2 pl-3 pr-10 text-left text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <span class="block truncate">{{ displayText() }}</span>
          <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <Icon icon="mdi:chevron-down" class="h-5 w-5 text-accent-muted" aria-hidden="true" />
          </span>
        </ListboxButton>
        <Transition
          leave-active-class="transition ease-in duration-100"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <ListboxOptions
            class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-chat-panel border border-chat-border py-1 shadow-lg focus:outline-none"
          >
            <ListboxOption
              v-for="opt in options"
              :key="opt[optionValue]"
              v-slot="{ active, selected }"
              :value="opt[optionValue]"
              as="template"
            >
              <li
                :class="[
                  'relative cursor-pointer select-none py-2 pl-3 pr-9',
                  active ? 'bg-sidebar-hover text-white' : 'text-[#a6adc8]',
                  selected && 'bg-accent/20 text-accent',
                ]"
              >
                <span class="block truncate">{{ opt[optionLabel] }}</span>
                <span
                  v-if="selected"
                  class="absolute inset-y-0 right-0 flex items-center pr-3 text-accent"
                >
                  <Icon icon="mdi:check" class="h-5 w-5" />
                </span>
              </li>
            </ListboxOption>
          </ListboxOptions>
        </Transition>
      </div>
    </Listbox>
  </div>
</template>
