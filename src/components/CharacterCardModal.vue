<script setup>
import { ref, computed, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { Dialog, DialogOverlay, DialogPanel } from '@headlessui/vue'
import { useCharactersStore } from '../stores/characters'
import { SHEET_TABS, labelCls, sectionCls, sectionTitleCls } from '../composables/useCharacterForm'
import { CHAR_LABELS, STORY_LABELS, STORY_KEYS } from '../data/characterConstants'
import HpMpSanBar from './character/HpMpSanBar.vue'
import StatusBadges from './character/StatusBadges.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  characterId: { type: String, default: '' },
  isOwn: { type: Boolean, default: true },
})

const emit = defineEmits(['close'])

const {
  getById,
  getDerived,
  normalizeCharacter,
  getCreditDerived,
  skillSuccess,
  skillDisplayName,
  penetrateLabel,
} = useCharactersStore()

const sheet = computed(() => {
  if (!props.open || !props.characterId) return null
  const c = getById(props.characterId)
  return c ? normalizeCharacter(c) : null
})

const derived = computed(() => (sheet.value ? getDerived(sheet.value) : { hpMax: 0, mpMax: 0, sanInitial: 0, move: 9, damageBonus: 0, build: 0 }))

const creditDerived = computed(() =>
  sheet.value?.skills ? getCreditDerived(sheet.value.skills) : { creditRating: '-', cash: '-', spendingLevel: '-', assets: '-' }
)

const skillPoints = computed(() => {
  const s = sheet.value
  if (!s?.skills) return { careerPointsRemain: 0, interestPointsRemain: 0 }
  const careerUsed = s.skills.reduce((sum, sk) => sum + (Number(sk.career) || 0), 0)
  const interestUsed = s.skills.reduce((sum, sk) => sum + (Number(sk.interest) || 0), 0)
  const careerTotal = Number(s.skillRule?.careerPointsTotal) || 0
  const interestTotal = Number(s.skillRule?.interestPointsTotal) || 0
  return {
    careerPointsRemain: Math.max(0, careerTotal - careerUsed),
    interestPointsRemain: Math.max(0, interestTotal - interestUsed),
  }
})

const TOOLTIP_HALF_W = 95
const TOOLTIP_EDGE_PAD = 12

const skillTooltip = ref(null) // { skill, top, left }
function showSkillTooltip(s, event) {
  const el = event?.currentTarget
  if (!el) return
  const rect = el.getBoundingClientRect()
  const centerX = rect.left + rect.width / 2
  const minLeft = TOOLTIP_HALF_W + TOOLTIP_EDGE_PAD
  const maxLeft = window.innerWidth - TOOLTIP_HALF_W - TOOLTIP_EDGE_PAD
  const left = Math.min(Math.max(centerX, minLeft), maxLeft)
  skillTooltip.value = {
    skill: s,
    top: rect.top,
    left,
    width: rect.width,
  }
}
function hideSkillTooltip() {
  skillTooltip.value = null
}

const visibleTabs = computed(() => {
  const all = SHEET_TABS.filter(t => t.id !== 'ability' || props.isOwn)
  return all
})

const currentTabId = ref('basic')

watch(
  () => props.open,
  (open) => {
    if (open)
      currentTabId.value = visibleTabs.value[0]?.id || 'basic'
    else
      hideSkillTooltip()
  }
)
watch(visibleTabs, (tabs) => {
  const inList = tabs.some(t => t.id === currentTabId.value)
  if (!inList && tabs.length)
    currentTabId.value = tabs[0].id
}, { immediate: true })

function setTab(id) {
  currentTabId.value = id
}
</script>

<template>
  <Dialog :open="open" class="relative z-50" @close="emit('close')">
    <DialogOverlay class="fixed inset-0 bg-black/60" />
    <div class="fixed inset-0 flex items-center justify-center p-4">
      <DialogPanel class="relative w-full max-w-2xl max-h-[90vh] rounded-xl bg-chat-panel border border-chat-border shadow-xl overflow-hidden flex flex-col focus:outline-none">
        <button type="button" class="absolute top-1 right-2 z-10 p-2 rounded-lg text-accent-muted hover:text-white hover:bg-white/10" aria-label="关闭" @click="emit('close')">
          <Icon icon="mdi:close" class="text-xl" />
        </button>

        <template v-if="sheet">
          <!-- 头部：正方形头像 + 姓名等基础信息 -->
          <div class="shrink-0 px-4 pr-12 pt-6 pb-4 border-b border-chat-border">
            <div class="flex gap-4">
              <div class="w-20 h-20 rounded-lg bg-sidebar-active flex items-center justify-center shrink-0 text-2xl font-bold text-accent">
                {{ (sheet.name || '未命名').slice(0, 1) }}
              </div>
              <div class="flex-1 min-w-0 space-y-1">
                <div class="font-semibold text-lg text-white">{{ sheet.name || '未命名' }}</div>
                <div class="text-sm text-accent-muted">职业 {{ sheet.occupation || '-' }} · 年龄 {{ sheet.age ?? '-' }} · {{ sheet.gender || '-' }}</div>
                <div class="text-sm text-accent-muted">现居地 {{ sheet.currentResidence || '-' }}</div>
                <div class="text-sm text-accent-muted">出生地 {{ sheet.birthplace || '-' }}</div>
              </div>
            </div>
            <!-- 生命 / 魔法 / 理智 -->
            <div class="mt-4">
              <HpMpSanBar
                :hp-current="sheet.hpCurrent"
                :hp-max="derived.hpMax"
                :mp-current="sheet.mpCurrent"
                :mp-max="derived.mpMax"
                :san-current="sheet.sanCurrent"
              />
            </div>
            <!-- 人物状态标签（仅当至少有一项为 true 时展示） -->
            <div v-if="sheet.seriousWound || sheet.unconscious || sheet.dead || sheet.temporaryInsanity || sheet.permanentInsanity || sheet.indefiniteInsanity" class="mt-3">
              <StatusBadges :sheet="sheet" variant="view" />
            </div>
          </div>

          <!-- Tab 导航 -->
          <nav class="shrink-0 flex border-b border-chat-border overflow-x-auto">
            <button
              v-for="t in visibleTabs"
              :key="t.id"
              type="button"
              class="flex items-center gap-2 px-4 py-3 text-sm whitespace-nowrap border-b-2 transition-colors"
              :class="currentTabId === t.id ? 'border-accent text-accent' : 'border-transparent text-accent-muted hover:text-white'"
              @click="setTab(t.id)"
            >
              <Icon :icon="t.icon" class="text-lg shrink-0" />
            </button>
          </nav>

          <!-- Tab 内容 -->
          <div class="flex-1 overflow-y-auto scroll-thin min-h-0">
            <!-- 基础信息 -->
            <div v-show="currentTabId === 'basic'" class="space-y-6">
              <section :class="sectionCls">
                <div class="grid grid-cols-3 gap-3">
                  <template v-for="k in ['str','dex','siz','app','con','int','pow','edu','luc']" :key="k">
                    <div>
                      <label class="block text-xs text-accent-muted truncate mb-1">{{ CHAR_LABELS[k] }}</label>
                      <div class="w-full px-2 py-1.5 rounded bg-chat-bg border border-chat-border text-white text-sm">{{ sheet[k] ?? 0 }}</div>
                    </div>
                  </template>
                </div>
              </section>
            </div>

            <!-- 能力体系（仅自己可见） -->
            <div v-show="currentTabId === 'ability' && isOwn" class="space-y-6">
              <section :class="sectionCls" class="relative">
                <div class="grid grid-cols-3 gap-x-6 gap-y-3 text-sm">
                  <div
                    v-for="s in (sheet?.skills || [])"
                    :key="s.id"
                    class="flex items-center justify-between gap-2 py-1.5 px-2 rounded-lg bg-chat-bg/60 border border-chat-border/50 cursor-pointer hover:border-accent/40 transition-colors"
                    @click="showSkillTooltip(s, $event)"
                  >
                    <span class="text-accent-muted truncate min-w-0">{{ skillDisplayName(s) }}</span>
                    <span class="text-white font-mono tabular-nums shrink-0">{{ skillSuccess(s) }}</span>
                  </div>
                </div>
                <!-- 技能详情气泡：点击技能后显示在上方 -->
                <Teleport to="body">
                  <template v-if="skillTooltip">
                    <div class="fixed inset-0 z-[60]" aria-hidden="true" @click="hideSkillTooltip" />
                    <div
                      class="fixed z-[61] min-w-[180px] rounded-lg border border-chat-border bg-chat-panel shadow-xl p-3 text-sm"
                      :style="{ left: `${skillTooltip.left}px`, top: `${skillTooltip.top}px`, transform: 'translate(-50%, -100%) translateY(-8px)' }"
                      @click.stop
                    >
                      <div class="font-medium text-white mb-2 border-b border-chat-border pb-2">{{ skillDisplayName(skillTooltip.skill) }}</div>
                      <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-accent-muted">
                        <span>基础</span><span class="text-white font-mono tabular-nums text-right">{{ skillTooltip.skill?.base ?? 0 }}</span>
                        <span>本职</span><span class="text-white font-mono tabular-nums text-right">{{ skillTooltip.skill?.career ?? 0 }}</span>
                        <span>兴趣</span><span class="text-white font-mono tabular-nums text-right">{{ skillTooltip.skill?.interest ?? 0 }}</span>
                        <span>成长</span><span class="text-white font-mono tabular-nums text-right">{{ skillTooltip.skill?.growth ?? 0 }}</span>
                      </div>
                      <div class="mt-2 pt-2 border-t border-chat-border flex justify-between items-center">
                        <span class="text-accent-muted">成功率</span>
                        <span class="text-accent font-mono tabular-nums">{{ skillSuccess(skillTooltip.skill) }}</span>
                      </div>
                    </div>
                  </template>
                </Teleport>
              </section>
              <section :class="sectionCls">
                <div class="overflow-x-auto">
                  <table class="w-full text-sm border-collapse min-w-[600px]">
                    <thead class="bg-chat-bg/95"><tr class="text-left text-accent-muted border-b border-chat-border"><th class="p-1.5 w-28">武器名称</th><th class="p-1.5 w-24">使用技能</th><th class="p-1.5 w-14">成功率</th><th class="p-1.5 w-20">伤害</th><th class="p-1.5 w-14">射程</th><th class="p-1.5 w-14">贯穿</th><th class="p-1.5 w-14">次数</th><th class="p-1.5 w-14">装弹量</th><th class="p-1.5 w-14">故障</th></tr></thead>
                    <tbody>
                      <tr v-for="(w, idx) in (sheet?.weapons || [])" :key="idx" class="border-b border-chat-border/50">
                        <td class="p-1.5">{{ w.name || '-' }}</td>
                        <td class="p-1.5">{{ w.skill || '-' }}</td>
                        <td class="p-1.5">{{ w.success ?? '-' }}</td>
                        <td class="p-1.5">{{ w.damage || '-' }}</td>
                        <td class="p-1.5">{{ w.range || '-' }}</td>
                        <td class="p-1.5">{{ penetrateLabel(w.penetrate) }}</td>
                        <td class="p-1.5">{{ w.attacks ?? '-' }}</td>
                        <td class="p-1.5">{{ w.ammo ?? '-' }}</td>
                        <td class="p-1.5">{{ w.malfunction ?? '-' }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
              <section :class="sectionCls">
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div><label :class="labelCls">伤害加值（DB）</label><div class="px-3 py-2 rounded-lg bg-chat-bg border border-chat-border text-white">{{ derived.damageBonus >= 0 ? '+' : '' }}{{ derived.damageBonus }}</div></div>
                  <div><label :class="labelCls">体格</label><div class="px-3 py-2 rounded-lg bg-chat-bg border border-chat-border text-white">{{ derived.build >= 0 ? '+' : '' }}{{ derived.build }}</div></div>
                  <div><label :class="labelCls">护甲</label><div class="px-3 py-2 rounded-lg bg-chat-bg border border-chat-border text-white">{{ sheet.combat?.armor || '-' }}</div></div>
                  <div><label :class="labelCls">移动力</label><div class="px-3 py-2 rounded-lg bg-chat-bg border border-chat-border text-white">{{ derived.move }}</div></div>
                </div>
              </section>
            </div>

            <!-- 资产背景 -->
            <div v-show="currentTabId === 'assets'" class="space-y-6">
              <section :class="sectionCls">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label :class="labelCls">信用评级</label><span class="text-white">{{ creditDerived.creditRating }}</span></div>
                  <div><label :class="labelCls">现金</label><span class="text-white">{{ creditDerived.cash }}</span></div>
                  <div><label :class="labelCls">消费水平</label><span class="text-white">{{ creditDerived.spendingLevel }}</span></div>
                  <div><label :class="labelCls">资产</label><span class="text-white">{{ creditDerived.assets }}</span></div>
                  <div class="sm:col-span-2"><label :class="labelCls">随身携带物品/装备</label><div class="px-3 py-2 rounded-lg bg-chat-bg border border-chat-border text-white text-sm whitespace-pre-wrap">{{ sheet.possessions?.other || '-' }}</div></div>
                </div>
              </section>
              <section :class="sectionCls">
                <div class="space-y-3">
                  <div v-for="key in STORY_KEYS" :key="key">
                    <label :class="labelCls">{{ STORY_LABELS[key] }}</label>
                    <div class="px-3 py-2 rounded-lg bg-chat-bg border border-chat-border text-white text-sm whitespace-pre-wrap">{{ sheet.story?.[key] || '-' }}</div>
                  </div>
                </div>
              </section>
            </div>

            <!-- 剧情社交 -->
            <div v-show="currentTabId === 'social'" class="space-y-6">
              <section :class="sectionCls">
                <h2 :class="sectionTitleCls">克苏鲁神话（Cthulhu Mythos）</h2>
                <div class="space-y-4">
                  <div><label :class="labelCls">魔法物品与典籍</label><div class="px-3 py-2 rounded-lg bg-chat-bg border border-chat-border text-white text-sm whitespace-pre-wrap">{{ sheet.mythos?.magicItems || '-' }}</div></div>
                  <div><label :class="labelCls">法术</label><div class="px-3 py-2 rounded-lg bg-chat-bg border border-chat-border text-white text-sm whitespace-pre-wrap">{{ sheet.mythos?.spells || '-' }}</div></div>
                  <div><label :class="labelCls">第三类接触（经历/能力描述）</label><div class="px-3 py-2 rounded-lg bg-chat-bg border border-chat-border text-white text-sm whitespace-pre-wrap">{{ sheet.mythos?.thirdContact || '-' }}</div></div>
                </div>
              </section>
              <section :class="sectionCls">
                <h2 :class="sectionTitleCls">人际关系（Companions）</h2>
                <div class="space-y-2">
                  <div v-for="(comp, idx) in (sheet.companions || [])" :key="idx" class="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center text-sm">
                    <span class="text-white">{{ comp.name || '-' }}</span>
                    <span class="text-accent-muted">{{ comp.relation || '-' }}</span>
                    <span class="text-accent-muted">{{ comp.player || '-' }}</span>
                  </div>
                  <p v-if="!(sheet.companions?.length)" class="text-sm text-accent-muted py-2">暂无</p>
                </div>
              </section>
              <section :class="sectionCls">
                <h2 :class="sectionTitleCls">经历过的模组（Experienced Scenarios）</h2>
                <div class="space-y-2">
                  <div v-for="(sc, idx) in (sheet.scenarios || [])" :key="idx" class="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center text-sm">
                    <span class="text-white">{{ sc.name || '-' }}</span>
                    <span class="text-accent-muted sm:col-span-2">{{ sc.experience || '-' }}</span>
                  </div>
                  <p v-if="!(sheet.scenarios?.length)" class="text-sm text-accent-muted py-2">暂无</p>
                </div>
              </section>
            </div>
          </div>
        </template>
        <template v-else>
          <div class="p-8 text-center text-accent-muted">未找到角色数据</div>
        </template>
      </DialogPanel>
    </div>
  </Dialog>
</template>
