<script setup>
import { ref, computed, inject } from 'vue'
import { Icon } from '@iconify/vue'
import { Dialog, DialogOverlay, DialogPanel, DialogTitle } from '@headlessui/vue'
import { labelCls, inputCls, sectionCls, sectionTitleCls, genderOptions } from '../../composables/useCharacterForm'
import { CHAR_LABELS } from '../../data/characterConstants'
import { NAME_COUNTRY_OPTIONS, NAME_GENDER_OPTIONS } from '../../utils/randomName'
import ListboxSelect from '../ui/ListboxSelect.vue'
import HpMpSanBar from './HpMpSanBar.vue'
import StatusBadges from './StatusBadges.vue'

const {
  form,
  syncDerived,
  openRollAllChars,
  openRollLuckOnly,
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

const isRolled = () => form.attributesSource === 'rolled'
function clampChar(key) {
  const v = Number(form[key])
  if (Number.isNaN(v) || v === '' || v === null || v === undefined) form[key] = CHAR_MIN
  else if (v > CHAR_MAX) form[key] = CHAR_MAX
  else if (v < CHAR_MIN) form[key] = CHAR_MIN
}
</script>

<template>
  <div class="space-y-6">
    <section :class="sectionCls" data-guide="investigator-info-card">
      <h2 :class="sectionTitleCls">基础信息（Basic Information）</h2>
      <p class="text-xs text-accent-muted mb-3">填写或选择调查员的姓名、性别、职业等基础信息。*年龄会对移动造成一定影响。</p>
      <div class="space-y-3">
        <!-- 姓名：输入 + 随机生成按钮 -->
        <div class="grid grid-cols-[auto,1fr] gap-2 items-center">
          <label class="text-[#a6adc8] whitespace-nowrap w-16 text-left text-sm">姓名</label>
          <div class="flex rounded-lg border border-chat-border bg-chat-bg overflow-hidden focus-within:border-accent focus-within:ring-1 focus-within:ring-accent">
            <input v-model="form.name" type="text" class="flex-1 min-w-0 px-3 py-2 bg-transparent text-white placeholder-accent-muted outline-none" placeholder="姓名" />
            <button type="button" class="p-2 text-accent-muted hover:text-accent hover:bg-accent/10 shrink-0" title="随机生成姓名" @click="openRandomNameModal">
              <Icon icon="mdi:dice-multiple" class="text-lg" />
            </button>
          </div>
        </div>
        <!-- 职业：仅通过按钮选择 -->
        <div class="grid grid-cols-[auto,1fr] gap-2 items-center">
          <label class="text-[#a6adc8] whitespace-nowrap w-16 text-left text-sm">职业</label>
          <div class="flex rounded-lg border border-chat-border bg-chat-bg overflow-hidden">
            <span class="flex-1 min-w-0 px-3 py-2 text-white truncate">{{ form.occupation || '未选择' }}</span>
            <button type="button" class="p-2 text-accent-muted hover:text-accent hover:bg-accent/10 shrink-0" title="选择职业" @click="openOccupationPicker">
              <Icon icon="mdi:briefcase-outline" class="text-lg" />
            </button>
          </div>
        </div>
        <!-- 年龄 + 性别 同一行 -->
        <div class="flex gap-2 items-center">
          <label class="text-[#a6adc8] whitespace-nowrap pr-9 text-left text-sm">年龄</label>
          <input v-model.number="form.age" type="number" min="15" max="99" :class="inputCls" class="appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" @wheel.prevent="(e) => e.target.blur()" />
          <label class="text-[#a6adc8] whitespace-nowrap w-16 text-left text-sm">性别</label>
          <ListboxSelect v-model="form.gender" :options="genderOptions" placeholder="选择性别" />
        </div>
        <!-- 现居地 -->
        <div class="grid grid-cols-[auto,1fr] gap-2 items-center">
          <label :class="labelCls" class="w-16 text-left">现居地</label>
          <input v-model="form.currentResidence" type="text" :class="inputCls" placeholder="现居地" />
        </div>
        <!-- 出生地 -->
        <div class="grid grid-cols-[auto,1fr] gap-2 items-center">
          <label :class="labelCls" class="w-16 text-left">出生地</label>
          <input v-model="form.birthplace" type="text" :class="inputCls" placeholder="出生地" />
        </div>
      </div>
    </section>
    <section :class="sectionCls">
      <div class="flex items-start justify-between gap-2 mb-3">
        <h2 :class="sectionTitleCls">核心属性（Characteristics）</h2>
        <button
          v-if="!isRolled()"
          type="button"
          class="p-2.5 rounded-xl bg-accent/20 border border-accent/40 text-accent hover:bg-accent/30 shrink-0"
          title="投掷骰子随机全部属性（不可修改）"
          @click="openRollAllChars"
        >
          <Icon icon="mdi:dice-multiple" class="text-2xl" />
        </button>
        <span v-else class="text-xs text-accent-muted shrink-0 self-center">已投掷</span>
      </div>
      <!-- 自行填写时显示剩余点数 -->
      <div v-if="form.attributesSource === 'manual'" class="mb-3 px-3 py-2 rounded-lg bg-chat-bg border border-chat-border text-sm">
        <span class="text-accent-muted">剩余点数：</span>
        <span :class="charPointsRemaining < 0 ? 'text-red-400' : 'text-accent'">{{ charPointsRemaining }}</span>
      </div>
      <div class="grid grid-cols-3 gap-3">
        <template v-for="k in CHAR_ATTRS" :key="k">
          <div>
            <label class="block text-xs text-accent-muted truncate mb-1">{{ CHAR_LABELS[k] }}</label>
            <input
              v-if="!isRolled()"
              v-model.number="form[k]"
              type="number"
              :min="CHAR_MIN"
              :max="CHAR_MAX"
              class="w-full px-2 py-1.5 rounded bg-chat-bg border border-chat-border text-white text-sm focus:border-accent outline-none"
              @input="clampChar(k)"
            />
            <div v-else class="w-full px-2 py-1.5 rounded bg-chat-bg border border-chat-border text-white text-sm">{{ form[k] ?? 0 }}</div>
          </div>
        </template>
        <div>
          <label class="block text-xs text-accent-muted truncate mb-1">{{ CHAR_LABELS.luc }}</label>
          <div v-if="isRolled()" class="w-full px-2 py-1.5 rounded bg-chat-bg border border-chat-border text-white text-sm">{{ form.luc ?? 0 }}</div>
          <div v-else class="flex items-center gap-2">
            <div class="flex-1 min-w-0 px-2 py-1.5 rounded bg-chat-bg border border-chat-border text-white text-sm">{{ form.luc ?? 0 }}</div>
            <button type="button" class="p-2 rounded-lg bg-accent/20 border border-accent/40 text-accent hover:bg-accent/30 shrink-0" title="投掷幸运（3 次选 1）" @click="openRollLuckOnly">
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
        <div class="w-full max-w-md rounded-xl bg-chat-panel border border-chat-border shadow-xl" @click.stop>
          <div class="p-4 border-b border-chat-border">
            <h3 class="text-sm font-medium text-accent-muted uppercase tracking-wider">随机生成姓名</h3>
          </div>
          <div class="p-4 space-y-4">
            <div>
              <p class="text-sm text-accent-muted mb-2 text-center">选择国家/地区</p>
              <div class="flex flex-wrap justify-center gap-3">
                <label v-for="opt in NAME_COUNTRY_OPTIONS" :key="opt.value" class="flex items-center gap-2 cursor-pointer">
                  <input v-model="randomNameCountry" type="radio" :value="opt.value" class="text-accent focus:ring-accent border-chat-border bg-chat-bg" @change="doGenerateRandomName" />
                  <span class="text-sm text-[#a6adc8]">{{ opt.label }}</span>
                </label>
              </div>
            </div>
            <div>
              <p class="text-sm text-accent-muted mb-2 text-center">选择性别</p>
              <div class="flex flex-wrap justify-center gap-4">
                <label v-for="opt in NAME_GENDER_OPTIONS" :key="opt.value" class="flex items-center gap-2 cursor-pointer">
                  <input v-model="randomNameGender" type="radio" :value="opt.value" class="text-accent focus:ring-accent border-chat-border bg-chat-bg" @change="doGenerateRandomName" />
                  <span class="text-sm text-[#a6adc8]">{{ opt.label }}</span>
                </label>
              </div>
            </div>
            <div class="pt-2">
              <p class="text-sm text-accent-muted mb-2 text-center">生成的姓名</p>
              <div class="px-3 py-3 rounded-lg bg-chat-bg border border-chat-border text-center text-[#a6adc8] font-medium">
                {{ generatedName || '点击重新生成' }}
              </div>
            </div>
            <div class="flex justify-end gap-2 pt-2">
              <button type="button" class="px-4 py-2 text-sm rounded-lg border border-chat-border text-accent-muted hover:text-white hover:bg-chat-bg" @click="closeRandomNameModal">取消</button>
              <button type="button" class="px-4 py-2 text-sm rounded-lg bg-chat-bg border border-chat-border text-accent hover:bg-accent/20" @click="doGenerateRandomName">重新生成</button>
              <button type="button" class="px-4 py-2 text-sm rounded-lg bg-accent text-chat-bg font-medium hover:opacity-90 disabled:opacity-50" :disabled="!generatedName?.trim()" @click="confirmRandomName">确认</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 选择职业弹窗（与选择武器弹窗同款：分类筛选 + 列表） -->
    <Dialog :open="occupationPickerOpen" @close="closeOccupationPicker" class="relative z-[10000]">
      <DialogOverlay class="fixed inset-0 bg-black/50" />
      <div class="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel class="w-full max-w-md rounded-xl bg-chat-panel border border-chat-border shadow-xl p-4 max-h-[80vh] overflow-hidden flex flex-col focus:outline-none">
          <DialogTitle class="text-sm font-medium text-accent-muted uppercase tracking-wider mb-3 shrink-0">选择职业</DialogTitle>
          <div v-if="occupationGroups?.length" class="shrink-0 mb-2 flex flex-wrap gap-1.5">
            <button type="button" class="px-2.5 py-1 rounded-lg text-xs transition-colors" :class="!occupationCategoryFilter ? 'bg-accent/20 border border-accent/40 text-accent' : 'border border-chat-border text-accent-muted hover:text-white'" @click="occupationCategoryFilter = ''">全部</button>
            <button v-for="g in occupationGroups" :key="g.name" type="button" class="px-2.5 py-1 rounded-lg text-xs transition-colors" :class="occupationCategoryFilter === g.name ? 'bg-accent/20 border border-accent/40 text-accent' : 'border border-chat-border text-accent-muted hover:text-white'" @click="occupationCategoryFilter = g.name">{{ g.name }}</button>
          </div>
          <div class="overflow-y-auto flex-1 min-h-0 space-y-1">
            <button v-for="item in filteredOccupationJobs" :key="item.job" type="button" class="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left text-sm text-[#a6adc8] hover:bg-sidebar-hover hover:text-white transition-colors" :class="form.occupation === item.job ? 'bg-accent/10 text-accent' : ''" @click="onSelectOccupation(item.job)">
              <span>{{ item.job }}</span>
              <span class="text-xs text-accent-muted shrink-0">{{ item.groupName }}</span>
            </button>
          </div>
          <div class="shrink-0 pt-3 border-t border-chat-border">
            <button type="button" class="w-full px-3 py-2 rounded-lg text-accent-muted hover:text-white text-sm" @click="closeOccupationPicker">取消</button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  </div>
</template>
