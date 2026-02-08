<script setup>
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
import { Icon } from '@iconify/vue'

defineProps({
  title: { type: String, default: '' },
})
</script>

<template>
  <Disclosure as="section" class="rounded-xl bg-chat-panel border border-chat-border overflow-hidden">
    <DisclosureButton
      class="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-white hover:bg-sidebar-hover/50 transition-colors [&[aria-expanded=true]_svg]:rotate-180"
    >
      <span class="uppercase tracking-wider text-accent-muted">{{ title }}</span>
      <Icon icon="mdi:chevron-down" class="h-5 w-5 text-accent-muted transition-transform" />
    </DisclosureButton>
    <DisclosurePanel class="px-4 pb-4 pt-0 text-sm transition-all">
      <slot />
    </DisclosurePanel>
  </Disclosure>
</template>
