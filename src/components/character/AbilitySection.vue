
<template>
  <div class="space-y-6">
    <section :class="sectionCls">
      <h2 :class="sectionTitleCls">技能（Skill）</h2>
      <p class="text-xs text-accent-muted mb-2">剩余点数根据总数与技能表已用自动计算。</p>
      <div class="flex flex-wrap gap-4 mb-4">
        <div><label :class="labelCls">职业点数剩余</label><div class="px-3 py-2 rounded-lg bg-chat-bg border border-chat-border text-white">{{ skillPoints.careerPointsRemain }}</div></div>
        <div><label :class="labelCls">兴趣点数剩余</label><div class="px-3 py-2 rounded-lg bg-chat-bg border border-chat-border text-white">{{ skillPoints.interestPointsRemain }}</div></div>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead><tr class="text-left text-accent-muted border-b border-chat-border"><th class="py-2 pr-2">技能</th><th class="py-2 px-1 w-14">职业</th><th class="py-2 px-1 w-14">兴趣</th><th class="py-2 px-1 w-14">成长</th><th class="py-2 px-1 w-14">成功率</th></tr></thead>
          <tbody>
            <tr v-for="(s, idx) in form.skills" :key="s.id" class="border-b border-chat-border/50">
              <td class="py-1 pr-2 min-w-[120px]">
                <template v-if="s.custom"><input v-model="s.name" type="text" :class="inputCls" class="!py-1 !text-sm" placeholder="自定义" /></template>
                <template v-else>
                  <span v-if="!s.typeOption">{{ s.name }}</span>
                  <span v-else class="flex items-center gap-1">{{ s.name.replace(/\d$/, '') }}<select v-model="s.typeValue" :class="inputCls" class="!py-0.5 !text-xs w-20 inline-block"><option value="">-</option><option v-for="opt in (SKILL_TYPE_OPTIONS[s.typeOption] || [])" :key="opt" :value="opt">{{ opt }}</option></select></span>
                </template>
              </td>
              <td class="py-1 px-1"><input v-model.number="s.career" type="number" min="0" class="w-full px-1 py-0.5 rounded bg-chat-bg border border-chat-border text-white text-sm" /></td>
              <td class="py-1 px-1"><input v-model.number="s.interest" type="number" min="0" class="w-full px-1 py-0.5 rounded bg-chat-bg border border-chat-border text-white text-sm" /></td>
              <td class="py-1 px-1"><input v-model.number="s.growth" type="number" min="0" class="w-full px-1 py-0.5 rounded bg-chat-bg border border-chat-border text-white text-sm" /></td>
              <td class="py-1 px-1 font-mono">{{ skillSuccess(s) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
    <section :class="sectionCls">
      <h2 :class="sectionTitleCls">武器（Weapons）</h2>
      <div class="overflow-x-auto">
        <table class="w-full text-sm border-collapse min-w-[800px]">
          <thead class="sticky top-0 bg-chat-bg/95 z-[1]">
            <tr class="text-left text-accent-muted border-b border-chat-border">
              <th class="p-1.5 border border-chat-border w-28">武器名称</th>
              <th class="p-1.5 border border-chat-border w-24">使用技能</th>
              <th class="p-1.5 border border-chat-border w-14">成功率</th>
              <th class="p-1.5 border border-chat-border w-20">伤害</th>
              <th class="p-1.5 border border-chat-border w-14">射程</th>
              <th class="p-1.5 border border-chat-border w-14">贯穿</th>
              <th class="p-1.5 border border-chat-border w-14">次数</th>
              <th class="p-1.5 border border-chat-border w-14">装弹量</th>
              <th class="p-1.5 border border-chat-border w-14">故障</th>
              <th class="p-1.5 border border-chat-border w-10"> </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(w, idx) in form.weapons" :key="idx" class="border-b border-chat-border/50 last:border-none">
              <td class="p-1 border border-chat-border"><div class="px-1 py-1 rounded bg-chat-bg border border-chat-border text-[#a6adc8] text-sm text-center">{{ w.name || '-' }}</div></td>
              <td class="p-1 border border-chat-border"><div class="px-1 py-1 rounded bg-chat-bg border border-chat-border text-[#a6adc8] text-sm text-center">{{ w.skill || '-' }}</div></td>
              <td class="p-1 border border-chat-border"><div class="px-1 py-1 rounded bg-chat-bg border border-chat-border text-[#a6adc8] text-sm text-center">{{ w.success ?? '-' }}</div></td>
              <td class="p-1 border border-chat-border"><div class="px-1 py-1 rounded bg-chat-bg border border-chat-border text-[#a6adc8] text-sm text-center">{{ w.damage || '-' }}</div></td>
              <td class="p-1 border border-chat-border"><div class="px-1 py-1 rounded bg-chat-bg border border-chat-border text-[#a6adc8] text-sm text-center">{{ w.range || '-' }}</div></td>
              <td class="p-1 border border-chat-border text-center"><div class="px-1 py-1 rounded bg-chat-bg border border-chat-border text-[#a6adc8] text-sm text-center">{{ penetrateLabel(w.penetrate) }}</div></td>
              <td class="p-1 border border-chat-border"><div class="px-1 py-1 rounded bg-chat-bg border border-chat-border text-[#a6adc8] text-sm text-center">{{ w.attacks ?? '-' }}</div></td>
              <td class="p-1 border border-chat-border"><div class="px-1 py-1 rounded bg-chat-bg border border-chat-border text-[#a6adc8] text-sm text-center">{{ w.ammo ?? '-' }}</div></td>
              <td class="p-1 border border-chat-border"><div class="px-1 py-1 rounded bg-chat-bg border border-chat-border text-[#a6adc8] text-sm text-center">{{ w.malfunction ?? '-' }}</div></td>
              <td class="p-1 border border-chat-border">
                <button v-if="idx > 0" type="button" class="p-1 rounded text-accent-muted hover:text-red-400 hover:bg-white/5" title="删除" @click="removeWeapon(idx)"><Icon icon="mdi:close" class="text-lg" /></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="mt-3">
        <button type="button" class="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-chat-border text-accent-muted hover:text-accent hover:border-accent/50 text-sm" @click="addWeaponDialogOpen = true">
          <Icon icon="mdi:plus" class="text-lg" />添加
        </button>
      </div>
      <Dialog :open="addWeaponDialogOpen" @close="addWeaponDialogOpen = false" class="relative z-[10000]">
        <DialogOverlay class="fixed inset-0 bg-black/50" />
        <div class="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel class="w-full max-w-md rounded-xl bg-chat-panel border border-chat-border shadow-xl p-4 max-h-[80vh] overflow-hidden flex flex-col focus:outline-none">
            <DialogTitle class="text-sm font-medium text-accent-muted uppercase tracking-wider mb-3 shrink-0">选择武器</DialogTitle>
            <div class="overflow-y-auto flex-1 min-h-0 space-y-1">
              <button v-for="p in PRESET_WEAPONS" :key="p.id" type="button" class="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left text-sm text-[#a6adc8] hover:bg-sidebar-hover hover:text-white transition-colors" @click="addWeaponFromPreset(p)">
                <span>{{ p.name }}</span>
                <span class="text-xs text-accent-muted">{{ p.skill }} · {{ p.damage }}</span>
              </button>
            </div>
            <div class="shrink-0 pt-3 border-t border-chat-border">
              <button type="button" class="w-full px-3 py-2 rounded-lg text-accent-muted hover:text-white text-sm" @click="addWeaponDialogOpen = false">取消</button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </section>
    <section :class="sectionCls">
      <h2 :class="sectionTitleCls">战斗（Combat）</h2>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div><label :class="labelCls">伤害加值（DB）</label><div class="px-3 py-2 rounded-lg bg-chat-bg border border-chat-border text-white">{{ syncDerived.damageBonus >= 0 ? '+' : '' }}{{ syncDerived.damageBonus }}</div></div>
        <div><label :class="labelCls">体格</label><div class="px-3 py-2 rounded-lg bg-chat-bg border border-chat-border text-white">{{ syncDerived.build >= 0 ? '+' : '' }}{{ syncDerived.build }}</div></div>
        <div><label :class="labelCls">护甲</label><input v-model="form.combat.armor" type="text" :class="inputCls" placeholder="护甲" /></div>
        <div><label :class="labelCls">移动力</label><div class="px-3 py-2 rounded-lg bg-chat-bg border border-chat-border text-white">{{ syncDerived.move }}</div></div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { inject } from 'vue'
import { Icon } from '@iconify/vue'
import { Dialog, DialogOverlay, DialogPanel, DialogTitle } from '@headlessui/vue'
import { inputCls, labelCls, sectionCls, sectionTitleCls } from '../../composables/useCharacterForm'

const ctx = inject('characterForm')
const {
  form,
  syncDerived,
  skillPoints,
  skillSuccess,
  addWeaponDialogOpen,
  addWeaponFromPreset,
  removeWeapon,
  penetrateLabel,
  SKILL_TYPE_OPTIONS,
  PRESET_WEAPONS,
} = ctx
</script>

