<script setup>
import { inject } from 'vue'
import { Icon } from '@iconify/vue'
import { labelCls, inputCls, sectionCls, sectionTitleCls, genderOptions, occupationOptions } from '../../composables/useCharacterForm'
import ListboxSelect from '../ui/ListboxSelect.vue'
import ComboboxSelect from '../ui/ComboboxSelect.vue'

const { form, syncDerived, openRollAllChars } = inject('characterForm')
</script>

<template>
  <div class="space-y-6">
    <section :class="sectionCls">
      <h2 :class="sectionTitleCls">基础信息（Basic Information）</h2>
      <div class="grid grid-cols-2 gap-2">
        <div><label :class="labelCls">姓名</label><input v-model="form.name" type="text" :class="inputCls" placeholder="姓名" /></div>
        <ComboboxSelect v-model="form.occupation" label="职业" :options="occupationOptions" placeholder="输入或选择职业" />
        <div><label :class="labelCls">年龄</label><input v-model.number="form.age" type="number" min="15" max="99" :class="inputCls" /></div>
        <ListboxSelect v-model="form.gender" label="性别" :options="genderOptions" placeholder="选择性别" />
        <div><label :class="labelCls">现居地</label><input v-model="form.currentResidence" type="text" :class="inputCls" placeholder="现居地" /></div>
        <div><label :class="labelCls">出生地</label><input v-model="form.birthplace" type="text" :class="inputCls" placeholder="出生地" /></div>
      </div>
    </section>
    <section :class="sectionCls">
      <div class="flex items-start justify-between gap-2 mb-3">
        <h2 :class="sectionTitleCls">核心属性（Characteristics）</h2>
        <button type="button" class="p-2.5 rounded-xl bg-accent/20 border border-accent/40 text-accent hover:bg-accent/30 shrink-0" title="一键随机全部属性" @click="openRollAllChars">
          <Icon icon="mdi:dice-multiple" class="text-2xl" />
        </button>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <template v-for="item in [{k:'str',l:'力量STR'},{k:'dex',l:'敏捷DEX'},{k:'siz',l:'体型SIZ'},{k:'app',l:'外貌APP'},{k:'con',l:'体质CON'},{k:'int',l:'智力INT'},{k:'pow',l:'意志POW'},{k:'edu',l:'教育EDU'},{k:'luc',l:'幸运LUC'}]" :key="item.k">
          <div><label class="block text-xs text-accent-muted truncate mb-1">{{ item.l }}</label><input v-model.number="form[item.k]" type="number" min="0" max="99" class="w-full px-2 py-1.5 rounded bg-chat-bg border border-chat-border text-white text-sm focus:border-accent outline-none" /></div>
        </template>
      </div>
    </section>
    <section :class="sectionCls">
      <h2 :class="sectionTitleCls">核心数值面板</h2>
      <div class="flex flex-wrap gap-4">
        <div><label :class="labelCls">生命（HP）</label><div class="px-3 py-2 rounded-lg bg-chat-bg border border-chat-border text-white">{{ form.hpCurrent }}/{{ syncDerived.hpMax }}</div></div>
        <div><label :class="labelCls">魔法（MP）</label><div class="px-3 py-2 rounded-lg bg-chat-bg border border-chat-border text-white">{{ form.mpCurrent }}/{{ syncDerived.mpMax }}</div></div>
        <div><label :class="labelCls">理智（SAN）</label><div class="px-3 py-2 rounded-lg bg-chat-bg border border-chat-border text-white">{{ form.sanCurrent }}/99</div></div>
      </div>
    </section>
    <section :class="sectionCls">
      <h2 :class="sectionTitleCls">人物状态（Character Status）</h2>
      <p class="text-xs text-accent-muted mb-3">仅供展示，由 KP 在跑团过程中自行修改。</p>
      <div class="flex flex-wrap gap-3">
        <span class="px-3 py-1.5 rounded-lg border text-sm" :class="form.seriousWound ? 'bg-accent/20 border-accent text-accent' : 'bg-chat-bg border-chat-border text-accent-muted'">{{ form.seriousWound ? '重伤' : '健康' }}</span>
        <span class="px-3 py-1.5 rounded-lg border text-sm" :class="form.unconscious ? 'bg-accent/20 border-accent text-accent' : 'bg-chat-bg border-chat-border text-accent-muted'">{{ form.unconscious ? '昏迷' : '清醒' }}</span>
        <span class="px-3 py-1.5 rounded-lg border text-sm" :class="form.dead ? 'bg-accent/20 border-accent text-accent' : 'bg-chat-bg border-chat-border text-accent-muted'">{{ form.dead ? '死亡' : '存活' }}</span>
        <span class="px-3 py-1.5 rounded-lg border text-sm" :class="(form.temporaryInsanity || form.permanentInsanity || form.indefiniteInsanity) ? 'bg-accent/20 border-accent text-accent' : 'bg-chat-bg border-chat-border text-accent-muted'">{{ form.temporaryInsanity ? '临时疯狂' : form.permanentInsanity ? '永久疯狂' : form.indefiniteInsanity ? '不定期疯狂' : '心智正常' }}</span>
      </div>
    </section>
  </div>
</template>
