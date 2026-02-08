<script setup>
import { inject } from 'vue'
import { labelCls, inputCls, sectionCls, sectionTitleCls } from '../../composables/useCharacterForm'

const { form, creditDerived } = inject('characterForm')

const storyLabels = {
  intro: '个人介绍',
  appearance: '形象描述',
  belief: '思想与信念',
  importantPerson: '重要之人',
  significantPlace: '意义非凡之地',
  preciousThing: '宝贵之物',
  traits: '特质',
  woundsScars: '伤口与疤痕',
  mentalDisorder: '精神症状',
}
const storyKeys = ['intro', 'appearance', 'belief', 'importantPerson', 'significantPlace', 'preciousThing', 'traits', 'woundsScars', 'mentalDisorder']
</script>

<template>
  <div class="space-y-6">
    <section :class="sectionCls">
      <h2 :class="sectionTitleCls">物品与装备（Possessions）</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label :class="labelCls">信用评级</label><span class="text-white">{{ creditDerived.creditRating }}</span></div>
        <div><label :class="labelCls">现金</label><span class="text-white">{{ creditDerived.cash }}</span></div>
        <div><label :class="labelCls">消费水平</label><span class="text-white">{{ creditDerived.spendingLevel }}</span></div>
        <div><label :class="labelCls">资产</label><span class="text-white">{{ creditDerived.assets }}</span></div>
        <div class="sm:col-span-2"><label :class="labelCls">随身携带物品/装备</label><textarea v-model="form.possessions.other" rows="2" :class="inputCls" placeholder="请输入随身携带物品/装备，可补充描述" /></div>
      </div>
    </section>
    <section :class="sectionCls">
      <h2 :class="sectionTitleCls">背景故事（Story）</h2>
      <div class="space-y-3">
        <div v-for="key in storyKeys" :key="key">
          <label :class="labelCls">{{ storyLabels[key] }}</label>
          <textarea v-model="form.story[key]" :class="inputCls" rows="2" class="resize-y" />
        </div>
      </div>
    </section>
  </div>
</template>
