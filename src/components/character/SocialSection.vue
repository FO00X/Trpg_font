<script setup>
import { inject, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { Dialog, DialogOverlay, DialogPanel, DialogTitle } from '@headlessui/vue'
import { inputCls, labelCls, sectionCls, sectionTitleCls } from '../../composables/useCharacterForm'
import { useChatStore } from '../../stores/chat'
import ComboboxSelect from '../ui/ComboboxSelect.vue'

const ctx = inject('characterForm')
const {
  form,
  companionDialogOpen,
  companionDraft,
  openCompanionDialog,
  confirmCompanion,
  removeCompanion,
  scenarioDialogOpen,
  scenarioDraft,
  openScenarioDialog,
  confirmScenario,
  removeScenario,
} = ctx

const { currentUser, onlineUsers } = useChatStore()
const playerOptions = computed(() => {
  const names = [currentUser.value?.name].filter(Boolean)
  onlineUsers.value.forEach((u) => { if (u.name && !names.includes(u.name)) names.push(u.name) })
  return names
})

const RELATION_OPTIONS = [
  '家人', '朋友', '同事', '恋人', '熟人', '导师', '学生', '邻居', '雇主', '下属', '搭档', '仇敌', '陌生人', '其他',
]

function companionDisplayText(comp) {
  const name = comp.name?.trim() || '—'
  const player = comp.player?.trim() || '—'
  const relation = comp.relation?.trim() || '—'
  return `${name}（${player}）：${relation}`
}
</script>

<template>
  <div class="space-y-6">
    <section :class="sectionCls">
      <h2 :class="sectionTitleCls">人际关系（Companions）</h2>
      <p class="text-xs text-base-content mb-3">弹窗添加后仅可查看或删除，需修改请删除后重新添加。</p>
      <div class="space-y-2">
        <div
          v-for="(comp, idx) in form.companions"
          :key="idx"
          class="flex items-center gap-2 rounded-lg border border-base-300 bg-base-100/50 px-3 py-2"
        >
          <span class="flex-1 min-w-0 py-1.5 text-base-content truncate" :title="companionDisplayText(comp)">{{ companionDisplayText(comp) }}</span>
          <button type="button" class="p-2 rounded-lg text-base-content hover:text-red-400 hover:bg-base-content/10 shrink-0" title="删除" @click="removeCompanion(idx)">
            <Icon icon="mdi:close" class="text-lg" />
          </button>
        </div>
        <p v-if="!form.companions.length" class="text-sm text-base-content py-3">暂无，点击下方按钮添加。</p>
        <button type="button" class="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-base-300 text-base-content hover:text-accent hover:border-accent/50 text-sm" @click="openCompanionDialog()">
          <Icon icon="mdi:plus" class="text-lg" />添加
        </button>
      </div>
      <Dialog :open="companionDialogOpen" @close="companionDialogOpen = false" class="relative z-[10000]">
        <DialogOverlay class="fixed inset-0 bg-black/50" />
        <div class="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel class="w-full max-w-md rounded-xl bg-base-200 border border-base-300 shadow-xl p-4 focus:outline-none">
            <DialogTitle class="text-sm font-semibold text-base-content uppercase tracking-wider mb-3">添加人际关系</DialogTitle>
            <div class="space-y-3">
              <div>
                <label :class="labelCls">角色名字</label>
                <input v-model="companionDraft.name" type="text" :class="inputCls" placeholder="角色名字" />
              </div>
              <div>
                <label :class="labelCls">所属玩家</label>
                <ComboboxSelect v-model="companionDraft.player" :options="playerOptions" placeholder="选择或输入玩家" />
              </div>
              <div>
                <label :class="labelCls">关系</label>
                <ComboboxSelect v-model="companionDraft.relation" :options="RELATION_OPTIONS" placeholder="选择或输入关系" />
              </div>
            </div>
            <div class="flex gap-2 mt-4">
              <button type="button" class="flex-1 py-2 rounded-lg bg-accent text-base-100 font-medium hover:opacity-90" @click="confirmCompanion()">确认</button>
              <button type="button" class="flex-1 py-2 rounded-lg border border-base-300 text-base-content hover:text-base-content" @click="companionDialogOpen = false">取消</button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </section>
    <section :class="sectionCls">
      <h2 :class="sectionTitleCls">经历过的模组（Experienced Scenarios）</h2>
      <p class="text-xs text-base-content mb-3">点击「添加」在弹窗中填写后加入列表；可删除已有项。</p>
      <div class="space-y-2">
        <div v-for="(sc, idx) in form.scenarios" :key="idx" class="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
          <input v-model="sc.name" type="text" :class="inputCls" class="!py-1.5 sm:col-span-1" placeholder="模组名称" />
          <div class="flex items-center gap-2 sm:col-span-2">
            <input v-model="sc.experience" type="text" :class="inputCls" class="!py-1.5 flex-1" placeholder="游玩经历（剧情/体验）" />
            <button type="button" class="p-1.5 rounded text-base-content hover:text-red-400 hover:bg-base-content/10 shrink-0" title="删除" @click="removeScenario(idx)"><Icon icon="mdi:close" class="text-lg" /></button>
          </div>
        </div>
        <p v-if="!form.scenarios.length" class="text-sm text-base-content py-2">暂无，点击下方按钮添加。</p>
        <button type="button" class="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-base-300 text-base-content hover:text-accent hover:border-accent/50 text-sm" @click="openScenarioDialog()"><Icon icon="mdi:plus" class="text-lg" />添加</button>
      </div>
      <Dialog :open="scenarioDialogOpen" @close="scenarioDialogOpen = false" class="relative z-[10000]">
        <DialogOverlay class="fixed inset-0 bg-black/50" />
        <div class="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel class="w-full max-w-md rounded-xl bg-base-200 border border-base-300 shadow-xl p-4 focus:outline-none">
            <DialogTitle class="text-sm font-semibold text-base-content uppercase tracking-wider mb-3">添加经历模组</DialogTitle>
            <div class="space-y-3">
              <input v-model="scenarioDraft.name" type="text" :class="inputCls" placeholder="模组名称" />
              <input v-model="scenarioDraft.experience" type="text" :class="inputCls" placeholder="游玩经历（剧情/体验）" />
            </div>
            <div class="flex gap-2 mt-4">
              <button type="button" :class="inputCls" class="flex-1 py-2" @click="confirmScenario()">确认</button>
              <button type="button" :class="inputCls" class="flex-1 py-2" @click="scenarioDialogOpen = false">取消</button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </section>
    <section :class="sectionCls">
      <h2 :class="sectionTitleCls">克苏鲁神话（Cthulhu Mythos）</h2>
      <div class="space-y-4">
        <div><label :class="labelCls">魔法物品与典籍</label><textarea v-model="form.mythos.magicItems" rows="2" :class="inputCls" /></div>
        <div><label :class="labelCls">法术</label><textarea v-model="form.mythos.spells" rows="2" :class="inputCls" /></div>
        <div><label :class="labelCls">第三类接触（经历/能力描述）</label><textarea v-model="form.mythos.thirdContact" rows="2" :class="inputCls" /></div>
      </div>
    </section>
  </div>
</template>
