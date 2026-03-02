<template>
  <div class="space-y-6">
    <section :class="sectionCls" data-guide="investigator-info-card">
      <h2 :class="sectionTitleCls">基础信息（Basic Information）</h2>
      <p class="text-xs text-base-content mb-3">填写或选择调查员的姓名、性别、职业等基础信息</p>
      <div class="space-y-3">
        <!-- 姓名：输入 + 随机生成按钮 -->
        <div class="grid grid-cols-[auto,1fr] gap-2 items-center">
          <label class="text-base-content/60 whitespace-nowrap w-16 text-left text-sm">姓名</label>
          <div class="flex rounded-lg border border-base-300 bg-base-100 overflow-hidden focus-within:border-accent focus-within:ring-1 focus-within:ring-accent">
            <input v-model="form.name" type="text" class="flex-1 min-w-0 px-3 py-2 bg-transparent text-base-content placeholder-accent-muted outline-none" placeholder="姓名" />
            <button type="button" class="p-2 text-base-content hover:text-accent hover:bg-accent/10 shrink-0" title="随机生成姓名" @click="openRandomNameModal">
              <Icon icon="mdi:dice-multiple" class="text-lg" />
            </button>
          </div>
        </div>
        <!-- 职业：仅通过按钮选择 -->
        <div class="grid grid-cols-[auto,1fr] gap-2 items-start">
          <label class="text-base-content/60 whitespace-nowrap w-16 text-left text-sm pt-2">职业</label>
          <div>
            <div class="flex rounded-lg border border-base-300 bg-base-100 overflow-hidden"  @click="openOccupationPicker">
              <span class="flex-1 min-w-0 px-3 py-2 text-base-content truncate">{{ form.occupation || '未选择' }}</span>
              <button type="button" class="p-2 text-base-content hover:text-accent hover:bg-accent/10 shrink-0" title="选择职业" >
                <Icon icon="mdi:briefcase-outline" class="text-lg" />
              </button>
            </div>
            <p v-if="form.occupation && occupationMeta" class="mt-1 text-xs text-base-content">建议信誉范围：{{ occupationMeta.creditMin }}–{{ occupationMeta.creditMax }}</p>
          </div>
        </div>
        <!-- 年龄 + 性别 同一行 -->
        <div class="flex gap-2 items-center">
          <label class="text-base-content/60 whitespace-nowrap text-left text-sm">年龄</label>
          <input v-model.number="form.age" type="number" min="15" max="99" :class="inputCls" class="appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" @wheel.prevent="(e) => e.target.blur()" />
          <label class="text-base-content/60 whitespace-nowrap text-left text-sm">性别</label>
          <ListboxSelect v-model="form.gender" :options="genderOptions" placeholder="选择性别" />
        </div>
        <!-- 现居地 + 出生地 同一行 -->
        <div class="flex gap-2 items-center">
          <label class="text-base-content/60 whitespace-nowrap text-left text-sm">现居地</label>
          <input v-model="form.currentResidence" type="text" :class="inputCls" placeholder="现居地" />
          <label class="text-base-content/60 whitespace-nowrap text-left text-sm">出生地</label>
          <input v-model="form.birthplace" type="text" :class="inputCls" placeholder="出生地" />
        </div>
      </div>
    </section>
    <section :class="sectionCls">
      <div class="flex items-start justify-between gap-2 mb-3">
        <h2 :class="sectionTitleCls">核心属性（Characteristics）</h2>
        <button
          type="button"
          class="p-2.5 rounded-xl bg-accent/20 border border-accent/40 text-accent hover:bg-accent/30 shrink-0 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-accent/20"
          :title="(rollHistory?.length ?? 0) >= (ROLL_MAX ?? 5) ? '在已投掷的 5 组结果之间切换' : '投掷骰子随机全部属性'"
          :disabled="rollRolling?.value"
          @click="openRollAllChars"
        >
          <Icon icon="mdi:dice-multiple" class="text-2xl shrink-0" :class="{ 'animate-spin': rollRolling?.value }" />
          <span class="text-sm font-medium">{{ rollRolling?.value ? '投掷中…' : rollButtonLabel }}</span>
        </button>
      </div>
      <!-- 自行填写时显示剩余点数 -->
      <div v-if="form.attributesSource === 'manual'" class="mb-3 px-3 py-2 rounded-lg bg-base-100 border border-base-300 text-sm">
        <span class="text-base-content">剩余点数：</span>
        <span :class="charPointsRemaining < 0 ? 'text-red-400' : 'text-accent'">{{ charPointsRemaining }}</span>
      </div>
      <div class="grid grid-cols-3 gap-3">
        <template v-for="k in CHAR_ATTRS" :key="k">
          <div>
            <label class="block text-xs text-base-content truncate mb-1">{{ CHAR_LABELS[k] }}</label>
            <input
              v-if="!isRolled()"
              v-model.number="form[k]"
              type="number"
              :min="CHAR_MIN"
              :max="CHAR_MAX"
              class="w-full px-2 py-1.5 rounded bg-base-100 border border-base-300 text-base-content text-sm focus:border-accent outline-none"
              @input="clampChar(k)"
            />
            <div v-else class="w-full px-2 py-1.5 rounded bg-base-100 border border-base-300 text-base-content text-sm">{{ form[k] ?? 0 }}</div>
          </div>
        </template>
        <div>
          <label class="block text-xs text-base-content truncate mb-1">{{ CHAR_LABELS.luc }}</label>
          <div v-if="isRolled()" class="w-full px-2 py-1.5 rounded bg-base-100 border border-base-300 text-base-content text-sm">{{ form.luc ?? 0 }}</div>
          <div v-else class="flex items-center gap-2">
            <div class="flex-1 min-w-0 px-2 py-1.5 rounded bg-base-100 border border-base-300 text-base-content text-sm">{{ form.luc ?? 0 }}</div>
            <button type="button" class="p-2 rounded-lg bg-accent/20 border border-accent/40 text-accent hover:bg-accent/30 shrink-0" title="投掷幸运" @click="openRollLuckOnly">
              <Icon icon="mdi:dice-multiple" class="text-lg" />
            </button>
          </div>
        </div>
      </div>
    </section>
    <section :class="sectionCls">
      <HpMpSanBar
        :hp-current="form.hpCurrent"
        :hp-max="syncDerived.hpMax"
        :mp-current="form.mpCurrent"
        :mp-max="syncDerived.mpMax"
        :san-current="form.sanCurrent"
      />
    </section>
    <section v-if="form.seriousWound || form.unconscious || form.dead || form.temporaryInsanity || form.permanentInsanity || form.indefiniteInsanity" :class="sectionCls">
      <h2 :class="sectionTitleCls">人物状态（Character Status）</h2>
      <StatusBadges :sheet="form" variant="edit" />
    </section>

    <!-- 随机生成姓名弹窗 -->
    <Teleport to="body">
      <div v-if="randomNameModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" @click.self="closeRandomNameModal">
        <div class="w-full max-w-md rounded-xl bg-base-200 border border-base-300 shadow-xl" @click.stop>
          <div class="p-4 border-b border-base-300">
            <h3 class="text-sm font-medium text-base-content uppercase tracking-wider">随机生成姓名</h3>
          </div>
          <div class="p-4 space-y-4">
            <div>
              <p class="text-sm text-base-content mb-2 text-center">选择国家/地区</p>
              <div class="flex flex-wrap justify-center gap-3">
                <label v-for="opt in NAME_COUNTRY_OPTIONS" :key="opt.value" class="flex items-center gap-2 cursor-pointer">
                  <input v-model="randomNameCountry" type="radio" :value="opt.value" class="text-accent focus:ring-accent border-base-300 bg-base-100" @change="doGenerateRandomName" />
                  <span class="text-sm text-base-content/60">{{ opt.label }}</span>
                </label>
              </div>
            </div>
            <div>
              <p class="text-sm text-base-content mb-2 text-center">选择性别</p>
              <div class="flex flex-wrap justify-center gap-4">
                <label v-for="opt in NAME_GENDER_OPTIONS" :key="opt.value" class="flex items-center gap-2 cursor-pointer">
                  <input v-model="randomNameGender" type="radio" :value="opt.value" class="text-accent focus:ring-accent border-base-300 bg-base-100" @change="doGenerateRandomName" />
                  <span class="text-sm text-base-content/60">{{ opt.label }}</span>
                </label>
              </div>
            </div>
            <div class="pt-2">
              <p class="text-sm text-base-content mb-2 text-center">生成的姓名</p>
              <div class="px-3 py-3 rounded-lg bg-base-100 border border-base-300 text-center text-base-content/60 font-medium">
                {{ generatedName || '点击重新生成' }}
              </div>
            </div>
            <div class="flex justify-end gap-2 pt-2">
              <button type="button" class="px-4 py-2 text-sm rounded-lg border border-base-300 text-base-content hover:text-base-content hover:bg-base-100" @click="closeRandomNameModal">取消</button>
              <button type="button" class="px-4 py-2 text-sm rounded-lg bg-base-100 border border-base-300 text-accent hover:bg-accent/20" @click="doGenerateRandomName">重新生成</button>
              <button type="button" class="px-4 py-2 text-sm rounded-lg bg-accent text-base-100 font-medium hover:opacity-90 disabled:opacity-50" :disabled="!generatedName?.trim()" @click="confirmRandomName">确认</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 选择职业弹窗（与选择武器弹窗同款：分类筛选 + 列表） -->
    <Dialog :open="occupationPickerOpen" @close="closeOccupationPicker" class="relative z-[10000]">
      <DialogOverlay class="fixed inset-0 bg-black/50" />
      <div class="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel class="w-full max-w-md rounded-xl bg-base-200 border border-base-300 shadow-xl p-4 max-h-[80vh] overflow-hidden flex flex-col focus:outline-none">
          <DialogTitle class="text-sm font-semibold text-base-content uppercase tracking-wider mb-3 shrink-0">选择职业</DialogTitle>
          <div v-if="occupationGroups?.length" class="shrink-0 mb-2 flex flex-wrap gap-1.5">
            <button type="button" class="px-2.5 py-1 rounded-lg text-xs transition-colors" :class="!occupationCategoryFilter ? 'bg-accent/20 border border-accent/40 text-accent' : 'border border-base-300 text-base-content hover:text-base-content'" @click="occupationCategoryFilter = ''">全部</button>
            <button v-for="g in occupationGroups" :key="g.name" type="button" class="px-2.5 py-1 rounded-lg text-xs transition-colors" :class="occupationCategoryFilter === g.name ? 'bg-accent/20 border border-accent/40 text-accent' : 'border border-base-300 text-base-content hover:text-base-content'" @click="occupationCategoryFilter = g.name">{{ g.name }}</button>
          </div>
          <div class="overflow-y-auto flex-1 min-h-0 space-y-1">
            <button v-for="item in filteredOccupationJobs" :key="item.job" type="button" class="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left text-sm text-base-content/60 hover:bg-base-200 hover:text-base-content transition-colors" :class="form.occupation === item.job ? 'bg-accent/10 text-accent' : ''" @click="onSelectOccupation(item.job)">
              <span>{{ item.job }}</span>
              <span class="text-xs text-base-content shrink-0">{{ item.groupName }}</span>
            </button>
          </div>
          <div class="shrink-0 pt-3 border-t border-base-300">
            <button type="button" class="w-full px-3 py-2 rounded-lg text-base-content hover:text-base-content text-sm" @click="closeOccupationPicker">取消</button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'
import { Icon } from '@iconify/vue'
import { Dialog, DialogOverlay, DialogPanel, DialogTitle } from '@headlessui/vue'
import { labelCls, inputCls, sectionCls, sectionTitleCls, genderOptions } from '../../composables/useCharacterForm'
import { CHAR_LABELS } from '../../data/characterConstants'
import { getOccupationMeta } from '../../data/occupationMeta'
import { NAME_COUNTRY_OPTIONS, NAME_GENDER_OPTIONS } from '../../utils/randomName'
import ListboxSelect from '../ui/ListboxSelect.vue'
import HpMpSanBar from './HpMpSanBar.vue'
import StatusBadges from './StatusBadges.vue'

const {
  form,
  syncDerived,
  id: characterId,
  isNew,
  openRollAllChars,
  openRollLuckOnly,
  rollHistory,
  rollIndex,
  rollRolling,
  ROLL_MAX,
  charPointsRemaining,
  CHAR_ATTRS,
  CHAR_MIN,
  CHAR_MAX,
  CHAR_POINTS_TOTAL,
  openRandomNameModal,
  randomNameModalOpen,
  randomNameCountry,
  randomNameGender,
  generatedName,
  doGenerateRandomName,
  confirmRandomName,
  closeRandomNameModal,
  occupationPickerOpen,
  openOccupationPicker,
  closeOccupationPicker,
  selectOccupation,
  occupationGroups,
} = inject('characterForm')

const rollButtonLabel = computed(() => {
  const n = rollHistory?.value?.length ?? 0
  if (n === 0) return '投掷'
  const idx = (rollIndex?.value ?? 0) + 1
  return `(${idx}/${ROLL_MAX ?? 5})`
})

const occupationMeta = computed(() => getOccupationMeta(form.value?.occupation))
const occupationCategoryFilter = ref('')
const filteredOccupationJobs = computed(() => {
  const groups = occupationGroups || []
  if (!occupationCategoryFilter.value) {
    return groups.flatMap((g) => (g.jobs || []).map((job) => ({ job, groupName: g.name })))
  }
  const group = groups.find((g) => g.name === occupationCategoryFilter.value)
  return group ? (group.jobs || []).map((job) => ({ job, groupName: group.name })) : []
})

function onSelectOccupation(job) {
  selectOccupation(job)
  closeOccupationPicker()
}

const isRolled = () => form.value?.attributesSource === 'rolled'
function clampChar(key) {
  const v = Number(form.value[key])
  if (Number.isNaN(v) || v === '' || v === null || v === undefined) form.value[key] = CHAR_MIN
  else if (v > CHAR_MAX) form.value[key] = CHAR_MAX
  else if (v < CHAR_MIN) form.value[key] = CHAR_MIN
}
</script>

