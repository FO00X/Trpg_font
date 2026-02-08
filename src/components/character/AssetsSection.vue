<script setup>
import { inject } from 'vue'
import { labelCls, inputCls, sectionCls, sectionTitleCls } from '../../composables/useCharacterForm'
import { STORY_LABELS, STORY_KEYS } from '../../data/characterConstants'

const { form, creditDerived } = inject('characterForm')
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
        <div v-for="key in STORY_KEYS" :key="key">
          <label :class="labelCls">{{ STORY_LABELS[key] }}</label>
          <textarea v-model="form.story[key]" :class="inputCls" rows="2" class="resize-y" />
        </div>
      </div>
    </section>
  </div>
</template>
