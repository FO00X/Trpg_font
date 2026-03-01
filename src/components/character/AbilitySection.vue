
<template>
  <div class="space-y-6">
    <section :class="sectionCls">
      <h2 :class="sectionTitleCls">技能（Skill）</h2>
      <p class="text-xs text-base-content mb-3">本职点数由所选职业公式计算，兴趣点数由智力×2 计算。选择职业并填写核心属性后会自动更新；自定义职业可在下方手动填写总额。</p>
      <!-- 技能分类 Tab -->
      <nav class="flex flex-wrap gap-1 border-b border-base-300 pb-2 mb-3">
        <button
          v-for="({ group }) in skillsByGroup"
          :key="group"
          type="button"
          :class="[
            'px-3 py-1.5 rounded-t-lg text-sm font-medium transition-colors',
            currentSkillGroupTab === group
              ? 'bg-base-100 border border-base-300 border-b-0 -mb-px text-accent'
              : 'text-base-content hover:text-base-content border border-transparent',
          ]"
          @click="currentSkillGroupTab = group"
        >
          {{ group }}
        </button>
      </nav>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead><tr class="text-left text-base-content border-b border-base-300"><th class="py-2 pr-2">技能</th><th class="py-2 px-1 w-14">职业</th><th class="py-2 px-1 w-14">兴趣</th><th class="py-2 px-1 w-14">成长</th><th class="py-2 px-1 w-14">成功率</th></tr></thead>
          <tbody>
            <tr v-for="s in currentGroupSkills" :key="s.id" class="border-b border-base-300/50">
              <td class="py-1 pr-2 min-w-[120px]">
                <template v-if="s.custom"><input v-model="s.name" type="text" :class="inputCls" class="!py-1 !text-sm" placeholder="自定义" /></template>
                <template v-else>
                  <span v-if="!s.typeOption">
                    <button v-if="getSkillIntro(s)" type="button" class="text-left text-accent hover:text-accent/80 cursor-pointer" :title="skillDisplayName(s)" @click="showSkillIntro(s, $event)"><span v-if="isCareerSkill(s)" class="text-accent mr-0.5">*</span>{{ s.name }}</button>
                    <span v-else><span v-if="isCareerSkill(s)" class="text-accent mr-0.5">*</span>{{ s.name }}</span>
                  </span>
                  <span v-else class="flex items-center gap-1">
                    <button v-if="getSkillIntro(s)" type="button" class="text-left text-accent hover:text-accent/80 underline decoration-dotted cursor-pointer shrink-0" :title="skillDisplayName(s)" @click="showSkillIntro(s, $event)"><span v-if="isCareerSkill(s)" class="text-accent mr-0.5">*</span>{{ s.name.replace(/\d$/, '') }}</button>
                    <span v-else><span v-if="isCareerSkill(s)" class="text-accent mr-0.5">*</span>{{ s.name.replace(/\d$/, '') }}</span>
                    <select v-model="s.typeValue" :class="inputCls" class="!py-0.5 !text-xs w-20 inline-block"><option value="">-</option><option v-for="opt in (SKILL_TYPE_OPTIONS[s.typeOption] || [])" :key="opt" :value="opt">{{ opt }}</option></select>
                  </span>
                </template>
              </td>
              <td class="py-1 px-1"><input v-model.number="s.career" type="number" min="0" class="w-full px-1 py-0.5 rounded bg-base-100 border border-base-300 text-base-content text-sm" /></td>
              <td class="py-1 px-1"><input v-model.number="s.interest" type="number" min="0" class="w-full px-1 py-0.5 rounded bg-base-100 border border-base-300 text-base-content text-sm" /></td>
              <td class="py-1 px-1"><input v-model.number="s.growth" type="number" min="0" class="w-full px-1 py-0.5 rounded bg-base-100 border border-base-300 text-base-content text-sm" /></td>
              <td class="py-1 px-1 font-mono">{{ skillSuccess(s) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="flex flex-wrap items-center justify-between gap-3 mt-2">
        <p class="text-xs text-base-content">* 表示当前职业本职技能</p>
        <template v-if="form.occupation">
          <div class="flex items-center gap-4 text-xs">
            <span class="text-base-content">本职剩余 <span :class="skillPoints.careerPointsRemain > 0 ? 'font-semibold text-accent' : 'text-base-content'">{{ skillPoints.careerPointsRemain }}</span></span>
            <span class="text-base-content">兴趣剩余 <span :class="skillPoints.interestPointsRemain > 0 ? 'font-semibold text-accent' : 'text-base-content'">{{ skillPoints.interestPointsRemain }}</span></span>
          </div>
        </template>
        <template v-else>
          <div class="flex items-center gap-4 text-xs">
            <label class="flex items-center gap-1.5 text-base-content">本职点数总额 <input v-model.number="form.skillRule.careerPointsTotal" type="number" min="0" class="w-16 px-2 py-1 rounded bg-base-100 border border-base-300 text-base-content text-center" /></label>
            <label class="flex items-center gap-1.5 text-base-content">兴趣点数总额 <input v-model.number="form.skillRule.interestPointsTotal" type="number" min="0" class="w-16 px-2 py-1 rounded bg-base-100 border border-base-300 text-base-content text-center" /></label>
          </div>
        </template>
      </div>
    </section>
    <section :class="sectionCls">
      <div class="flex items-start justify-between gap-2 mb-3">
      <h2 :class="sectionTitleCls">武器（Weapons）</h2>
        <button type="button" class="p-2 rounded-lg bg-accent/20 border border-accent/40 text-accent hover:bg-accent/30 shrink-0" @click="addWeaponDialogOpen = true">
          <Icon icon="mdi:plus" class="text-md" />
        </button>
    </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm border-collapse min-w-[800px]">
          <thead class="sticky top-0 bg-base-100/95 z-[1]">
            <tr class="text-left text-base-content border-b border-base-300">
              <th class="p-1.5 border border-base-300 w-28">武器名称</th>
              <th class="p-1.5 border border-base-300 w-24">使用技能</th>
              <th class="p-1.5 border border-base-300 w-14">成功率</th>
              <th class="p-1.5 border border-base-300 w-20">伤害</th>
              <th class="p-1.5 border border-base-300 w-14">射程</th>
              <th class="p-1.5 border border-base-300 w-14">贯穿</th>
              <th class="p-1.5 border border-base-300 w-14">次数</th>
              <th class="p-1.5 border border-base-300 w-14">装弹量</th>
              <th class="p-1.5 border border-base-300 w-14">故障</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(w, idx) in form.weapons" :key="idx" class="border-b border-base-300/50 last:border-none">
              <td class="p-1 border border-base-300"><div class=" text-base-content/60 text-sm text-center flex items-center justify-between">
                <span>{{ w.name || '-' }}</span>
                <button v-if="idx > 0" type="button" class="p-1 rounded text-error hover:text-red-400 hover:bg-base-content/10" title="删除" @click="removeWeapon(idx)"><Icon icon="mdi:close" class="text-lg" /></button>
                </div></td>
              <td class="p-1 border border-base-300"><div class=" text-base-content/60 text-sm text-center">{{ w.skill || '-' }}</div></td>
              <td class="p-1 border border-base-300"><div class=" text-base-content/60 text-sm text-center">{{ w.success ?? '-' }}</div></td>
              <td class="p-1 border border-base-300"><div class=" text-base-content/60 text-sm text-center">{{ w.damage || '-' }}</div></td>
              <td class="p-1 border border-base-300"><div class=" text-base-content/60 text-sm text-center">{{ w.range || '-' }}</div></td>
              <td class="p-1 border border-base-300 text-center"><div class=" text-base-content/60 text-sm text-center">{{ penetrateLabel(w.penetrate) }}</div></td>
              <td class="p-1 border border-base-300"><div class=" text-base-content/60 text-sm text-center">{{ w.attacks ?? '-' }}</div></td>
              <td class="p-1 border border-base-300"><div class=" text-base-content/60 text-sm text-center">{{ w.ammo ?? '-' }}</div></td>
              <td class="p-1 border border-base-300"><div class=" text-base-content/60 text-sm text-center">{{ w.malfunction ?? '-' }}</div></td>
            </tr>
          </tbody>
        </table>
      </div>

      <Dialog :open="addWeaponDialogOpen" @close="addWeaponDialogOpen = false" class="relative z-[10000]">
        <DialogOverlay class="fixed inset-0 bg-black/50" />
        <div class="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel class="w-full max-w-md rounded-xl bg-base-200 border border-base-300 shadow-xl p-4 max-h-[80vh] overflow-hidden flex flex-col focus:outline-none">
            <DialogTitle class="text-sm font-semibold text-base-content uppercase tracking-wider mb-3 shrink-0">选择武器</DialogTitle>
            <div v-if="WEAPON_CATEGORIES?.length" class="shrink-0 mb-2 flex flex-wrap gap-1.5">
              <button type="button" class="px-2.5 py-1 rounded-lg text-xs transition-colors" :class="!weaponCategoryFilter ? 'bg-accent/20 border border-accent/40 text-accent' : 'border border-base-300 text-base-content hover:text-base-content'" @click="weaponCategoryFilter = ''">全部</button>
              <button v-for="cat in WEAPON_CATEGORIES" :key="cat.id" type="button" class="px-2.5 py-1 rounded-lg text-xs transition-colors" :class="weaponCategoryFilter === cat.id ? 'bg-accent/20 border border-accent/40 text-accent' : 'border border-base-300 text-base-content hover:text-base-content'" @click="weaponCategoryFilter = cat.id">{{ cat.label }}</button>
            </div>
            <div class="overflow-y-auto flex-1 min-h-0 space-y-1">
              <button v-for="p in filteredPresetWeapons" :key="p.id" type="button" class="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left text-sm text-base-content/60 hover:bg-base-200 hover:text-base-content transition-colors" @click="addWeaponFromPreset(p)">
                <span>{{ p.name }}</span>
                <span class="text-xs text-base-content">{{ p.skill }} · {{ p.damage }}</span>
              </button>
            </div>
            <div class="shrink-0 pt-3 border-t border-base-300">
              <button type="button" class="w-full px-3 py-2 rounded-lg text-base-content hover:text-base-content text-sm" @click="addWeaponDialogOpen = false">取消</button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </section>
    <section :class="sectionCls">
      <h2 :class="sectionTitleCls">战斗（Combat）</h2>
      <div class="grid grid-cols-2 gap-4">
        <div><label :class="labelCls">伤害加值（DB）</label><div class="px-3 py-2 rounded-lg text-base-content">{{ syncDerived.damageBonus >= 0 ? '+' : '' }}{{ syncDerived.damageBonus }}</div></div>
        <div><label :class="labelCls">体格</label><div class="px-3 py-2 rounded-lg text-base-content">{{ syncDerived.build >= 0 ? '+' : '' }}{{ syncDerived.build }}</div></div>
        <div><label :class="labelCls">护甲</label><input v-model="form.combat.armor" type="text" :class="inputCls" placeholder="护甲" /></div>
        <div><label :class="labelCls">移动力</label><div class="px-3 py-2 rounded-lg text-base-content">{{ syncDerived.move }}</div></div>
      </div>
    </section>

    <!-- 技能描述气泡：点击技能名后显示 -->
    <Teleport to="body">
      <template v-if="skillIntroBubble">
        <div class="fixed inset-0 z-[60]" aria-hidden="true" @click="hideSkillIntro" />
        <div
          class="bg-base-100 fixed z-[61] max-w-[320px] rounded-lg border border-base-300 shadow-xl p-3 text-sm"
          :style="{ left: `${skillIntroBubble.left}px`, top: `${skillIntroBubble.top}px`, transform: 'translate(-50%, -100%) translateY(-8px)' }"
          @click.stop
        >
          <div class="font-medium border-b pb-2 text-base-content border-white/20">{{ skillIntroBubble.displayName }}</div>
          <div class="text-base-content text-xs leading-relaxed max-h-[40vh] overflow-y-auto">{{ skillIntroBubble.intro }}</div>
        </div>
      </template>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, inject, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { Dialog, DialogOverlay, DialogPanel, DialogTitle } from '@headlessui/vue'
import { inputCls, labelCls, sectionCls, sectionTitleCls } from '../../composables/useCharacterForm'
import { getSkillIntro } from '../../data/skillIntros'

const ctx = inject('characterForm')
const {
  form,
  syncDerived,
  skillPoints,
  skillSuccess,
  skillDisplayName,
  skillsByGroup,
  isCareerSkill,
  addWeaponDialogOpen,
  addWeaponFromPreset,
  removeWeapon,
  penetrateLabel,
  SKILL_TYPE_OPTIONS,
  PRESET_WEAPONS,
  WEAPON_CATEGORIES,
} = ctx

const currentSkillGroupTab = ref('')
const currentGroupSkills = computed(() => {
  const list = skillsByGroup.value || []
  const current = currentSkillGroupTab.value
  const found = list.find((g) => g.group === current)
  return found ? found.skills : (list[0]?.skills || [])
})
watch(
  skillsByGroup,
  (list) => {
    if (list.length && !list.some((g) => g.group === currentSkillGroupTab.value))
      currentSkillGroupTab.value = list[0].group
    else if (list.length && !currentSkillGroupTab.value)
      currentSkillGroupTab.value = list[0].group
  },
  { immediate: true }
)

const weaponCategoryFilter = ref('')
const filteredPresetWeapons = computed(() => {
  const list = PRESET_WEAPONS || []
  if (!weaponCategoryFilter.value) return list
  return list.filter((p) => (p.categoryId || 'qt') === weaponCategoryFilter.value)
})

const TOOLTIP_EDGE_PAD = 16
const skillIntroBubble = ref(null)

function showSkillIntro(s, event) {
  const el = event?.currentTarget
  if (!el) return
  const intro = getSkillIntro(s)
  if (!intro) return
  const rect = el.getBoundingClientRect()
  const centerX = rect.left + rect.width / 2
  const halfW = 160
  const minLeft = halfW + TOOLTIP_EDGE_PAD
  const maxLeft = window.innerWidth - halfW - TOOLTIP_EDGE_PAD
  const left = Math.min(Math.max(centerX, minLeft), maxLeft)
  skillIntroBubble.value = {
    displayName: skillDisplayName(s),
    intro,
    left,
    top: rect.top,
  }
}

function hideSkillIntro() {
  skillIntroBubble.value = null
}
</script>

<style scoped>
</style>