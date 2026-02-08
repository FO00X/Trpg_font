<script setup>
defineProps({
  hpCurrent: { type: Number, default: 0 },
  hpMax: { type: Number, default: 0 },
  mpCurrent: { type: Number, default: 0 },
  mpMax: { type: Number, default: 0 },
  sanCurrent: { type: Number, default: 0 },
})
</script>

<template>
  <div class="flex items-center gap-5 flex-nowrap">
    <span class="text-sm"><span class="text-accent-muted">HP</span> <span class="text-white tabular-nums ml-0.5">{{ hpCurrent }}/{{ hpMax }}</span></span>
    <span class="text-accent-muted/40">·</span>
    <span class="text-sm"><span class="text-accent-muted">MP</span> <span class="text-white tabular-nums ml-0.5">{{ mpCurrent }}/{{ mpMax }}</span></span>
    <span class="text-accent-muted/40">·</span>
    <span class="text-sm"><span class="text-accent-muted">SAN</span> <span class="text-white tabular-nums ml-0.5">{{ sanCurrent }}/99</span></span>
  </div>
</template>
