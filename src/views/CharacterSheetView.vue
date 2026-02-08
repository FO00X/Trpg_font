<template>
  <div class="flex flex-col h-full">
    <PageHeader
      :title="isNew ? '创建角色' : (form.name || '未命名')"
      icon="mdi:card-account-details"
      :show-back="false"
      back-label="返回列表"
      @back="goBack"
    >
      <template #actions>
        <div class="flex items-center gap-2">
          <button type="button" class="px-4 py-2 rounded-lg text-accent-muted hover:text-white border border-chat-border" @click="goBack">取消</button>
          <button type="button" class="px-4 py-2 rounded-lg bg-accent text-chat-bg font-medium hover:opacity-90" @click="save">保存</button>
        </div>
      </template>
    </PageHeader>

    <div class="flex-1 overflow-y-auto scroll-thin p-4 pb-24">
      <div class="max-w-4xl mx-auto space-y-6">
        <BasicInfoSection v-show="sheetTab === 'basic'" />
        <AbilitySection v-show="sheetTab === 'ability'" />
        <AssetsSection v-show="sheetTab === 'assets'" />
        <SocialSection v-show="sheetTab === 'social'" />
      </div>
    </div>

    <!-- 掷骰动画弹窗 -->
    <DiceRollModal
      :open="diceRollOpen"
      :batch="diceRollBatch"
      :max-rolls="diceRollMaxRolls"
      :initial-all-results="diceRollInitialResults"
      @results="onDiceRollResults"
      @confirm="onDiceRollConfirm"
      @close="closeDiceRoll"
    />

    <!-- 底部导航 -->
    <nav class="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around h-14 px-2 border-t border-chat-border bg-chat-panel/95 backdrop-blur">
      <button
        v-for="t in SHEET_TABS"
        :key="t.id"
        type="button"
        class="flex flex-col items-center justify-center gap-0.5 flex-1 h-full min-w-0 py-1 text-xs transition-colors rounded-lg"
        :class="sheetTab === t.id ? 'text-accent' : 'text-accent-muted hover:text-white'"
        @click="sheetTab = t.id"
      >
        <Icon :icon="t.icon" class="text-xl shrink-0" />
        <span class="truncate w-full text-center">{{ t.label }}</span>
      </button>
    </nav>
  </div>
</template>

<script setup>
import { provide } from 'vue'
import { Icon } from '@iconify/vue'
import { useCharacterForm, SHEET_TABS } from '../composables/useCharacterForm'
import PageHeader from '../components/PageHeader.vue'
import BasicInfoSection from '../components/character/BasicInfoSection.vue'
import AbilitySection from '../components/character/AbilitySection.vue'
import AssetsSection from '../components/character/AssetsSection.vue'
import SocialSection from '../components/character/SocialSection.vue'
import DiceRollModal from '../components/DiceRollModal.vue'

const ctx = useCharacterForm()
provide('characterForm', ctx)

const { form, isNew, sheetTab, save, goBack, diceRollOpen, diceRollBatch, diceRollMaxRolls, diceRollInitialResults, onDiceRollResults, onDiceRollConfirm, closeDiceRoll } = ctx
</script>

