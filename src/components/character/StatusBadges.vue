<script setup>
import { computed } from 'vue'

const props = defineProps({
  /** 角色 sheet，含 seriousWound, unconscious, dead, temporaryInsanity, permanentInsanity, indefiniteInsanity */
  sheet: { type: Object, default: () => ({}) },
  /** edit: 仅显示为 true 的标签；view: 显示全部（健康/重伤等成对） */
  variant: { type: String, default: 'edit' },
})

const activeCls = 'px-3 py-1.5 rounded-lg border text-sm bg-accent/20 border-accent text-accent'
const inactiveCls = 'px-3 py-1.5 rounded-lg border text-sm bg-base-100 border-base-300 text-base-content'

const hasAnyStatus = computed(() => {
  const s = props.sheet
  return !!(s?.seriousWound || s?.unconscious || s?.dead || s?.temporaryInsanity || s?.permanentInsanity || s?.indefiniteInsanity)
})

function insanityLabel(s) {
  if (s?.temporaryInsanity) return '临时疯狂'
  if (s?.permanentInsanity) return '永久疯狂'
  if (s?.indefiniteInsanity) return '不定期疯狂'
  return '心智正常'
}

function insanityActive(s) {
  return !!(s?.temporaryInsanity || s?.permanentInsanity || s?.indefiniteInsanity)
}
</script>

<template>
  <template v-if="variant === 'edit'">
    <div v-if="hasAnyStatus" class="flex flex-wrap gap-3">
      <span v-if="sheet.seriousWound" :class="activeCls">重伤</span>
      <span v-if="sheet.unconscious" :class="activeCls">昏迷</span>
      <span v-if="sheet.dead" :class="activeCls">死亡</span>
      <span v-if="sheet.temporaryInsanity" :class="activeCls">临时疯狂</span>
      <span v-if="sheet.permanentInsanity" :class="activeCls">永久疯狂</span>
      <span v-if="sheet.indefiniteInsanity" :class="activeCls">不定期疯狂</span>
    </div>
  </template>
  <template v-else>
    <div v-if="hasAnyStatus" class="flex flex-wrap gap-3">
      <span :class="sheet.seriousWound ? activeCls : inactiveCls">{{ sheet.seriousWound ? '重伤' : '健康' }}</span>
      <span :class="sheet.unconscious ? activeCls : inactiveCls">{{ sheet.unconscious ? '昏迷' : '清醒' }}</span>
      <span :class="sheet.dead ? activeCls : inactiveCls">{{ sheet.dead ? '死亡' : '存活' }}</span>
      <span :class="insanityActive(sheet) ? activeCls : inactiveCls">{{ insanityLabel(sheet) }}</span>
    </div>
  </template>
</template>
