<script setup>
import { inject } from 'vue'
import { Icon } from '@iconify/vue'
import { Dialog, DialogOverlay, DialogPanel, DialogTitle } from '@headlessui/vue'
import { inputCls, labelCls, sectionCls, sectionTitleCls } from '../../composables/useCharacterForm'

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
</script>

<template>
  <div class="space-y-6">
    <section :class="sectionCls">
      <h2 :class="sectionTitleCls">克苏鲁神话（Cthulhu Mythos）</h2>
      <div class="space-y-4">
        <div><label :class="labelCls">魔法物品与典籍</label><textarea v-model="form.mythos.magicItems" rows="2" :class="inputCls" /></div>
        <div><label :class="labelCls">法术</label><textarea v-model="form.mythos.spells" rows="2" :class="inputCls" /></div>
        <div><label :class="labelCls">第三类接触（经历/能力描述）</label><textarea v-model="form.mythos.thirdContact" rows="2" :class="inputCls" /></div>
      </div>
    </section>
    <section :class="sectionCls">
      <h2 :class="sectionTitleCls">人际关系（Companions）</h2>
      <p class="text-xs text-accent-muted mb-3">点击「添加」在弹窗中填写后加入列表；可删除已有项。</p>
      <div class="space-y-2">
        <div v-for="(comp, idx) in form.companions" :key="idx" class="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
          <input v-model="comp.name" type="text" :class="inputCls" class="!py-1.5" placeholder="角色名称" />
          <input v-model="comp.relation" type="text" :class="inputCls" class="!py-1.5" placeholder="关系" />
          <div class="flex items-center gap-2">
            <input v-model="comp.player" type="text" :class="inputCls" class="!py-1.5 flex-1" placeholder="所属玩家" />
            <button type="button" class="p-1.5 rounded text-accent-muted hover:text-red-400 hover:bg-white/5" title="删除" @click="removeCompanion(idx)"><Icon icon="mdi:close" class="text-lg" /></button>
          </div>
        </div>
        <p v-if="!form.companions.length" class="text-sm text-accent-muted py-2">暂无，点击下方按钮添加。</p>
        <button type="button" class="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-chat-border text-accent-muted hover:text-accent hover:border-accent/50 text-sm" @click="openCompanionDialog()"><Icon icon="mdi:plus" class="text-lg" />添加</button>
      </div>
      <Dialog :open="companionDialogOpen" @close="companionDialogOpen = false" class="relative z-[10000]">
        <DialogOverlay class="fixed inset-0 bg-black/50" />
        <div class="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel class="w-full max-w-md rounded-xl bg-chat-panel border border-chat-border shadow-xl p-4 focus:outline-none">
            <DialogTitle class="text-sm font-medium text-accent-muted uppercase tracking-wider mb-3">添加人际关系</DialogTitle>
            <div class="space-y-3">
              <input v-model="companionDraft.name" type="text" :class="inputCls" placeholder="角色名称" />
              <input v-model="companionDraft.relation" type="text" :class="inputCls" placeholder="关系" />
              <input v-model="companionDraft.player" type="text" :class="inputCls" placeholder="所属玩家" />
            </div>
            <div class="flex gap-2 mt-4">
              <button type="button" :class="inputCls" class="flex-1 py-2" @click="confirmCompanion()">确认</button>
              <button type="button" :class="inputCls" class="flex-1 py-2" @click="companionDialogOpen = false">取消</button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </section>
    <section :class="sectionCls">
      <h2 :class="sectionTitleCls">经历过的模组（Experienced Scenarios）</h2>
      <p class="text-xs text-accent-muted mb-3">点击「添加」在弹窗中填写后加入列表；可删除已有项。</p>
      <div class="space-y-2">
        <div v-for="(sc, idx) in form.scenarios" :key="idx" class="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
          <input v-model="sc.name" type="text" :class="inputCls" class="!py-1.5 sm:col-span-1" placeholder="模组名称" />
          <div class="flex items-center gap-2 sm:col-span-2">
            <input v-model="sc.experience" type="text" :class="inputCls" class="!py-1.5 flex-1" placeholder="游玩经历（剧情/体验）" />
            <button type="button" class="p-1.5 rounded text-accent-muted hover:text-red-400 hover:bg-white/5 shrink-0" title="删除" @click="removeScenario(idx)"><Icon icon="mdi:close" class="text-lg" /></button>
          </div>
        </div>
        <p v-if="!form.scenarios.length" class="text-sm text-accent-muted py-2">暂无，点击下方按钮添加。</p>
        <button type="button" class="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-chat-border text-accent-muted hover:text-accent hover:border-accent/50 text-sm" @click="openScenarioDialog()"><Icon icon="mdi:plus" class="text-lg" />添加</button>
      </div>
      <Dialog :open="scenarioDialogOpen" @close="scenarioDialogOpen = false" class="relative z-[10000]">
        <DialogOverlay class="fixed inset-0 bg-black/50" />
        <div class="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel class="w-full max-w-md rounded-xl bg-chat-panel border border-chat-border shadow-xl p-4 focus:outline-none">
            <DialogTitle class="text-sm font-medium text-accent-muted uppercase tracking-wider mb-3">添加经历模组</DialogTitle>
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
  </div>
</template>
