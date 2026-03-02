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
          <button type="button" class="btn btn-ghost btn-sm" @click="goBack">取消</button>
          <button type="button" class="btn btn-primary btn-sm" @click="save">保存</button>
        </div>
      </template>
    </PageHeader>

    <div class="flex-1 overflow-y-auto scroll-thin p-4 pb-24">
      <div class="max-w-4xl mx-auto space-y-6">
        <template v-if="sheetTab === 'basic'">
          <BasicInfoSection />
          <div class="flex flex-col items-end gap-2">
            <div v-if="validationErrors.length" class="alert alert-warning text-sm w-full py-2">{{ validationErrors.join('；') }}</div>
            <div v-if="saveError" class="alert alert-error text-sm w-full py-2">{{ saveError }}</div>
          </div>
        </template>
        <template v-else-if="sheetTab === 'ability'">
          <AbilitySection />
          <div class="flex flex-col items-end gap-2">
            <div v-if="validationErrors.length" class="alert alert-warning text-sm w-full py-2">{{ validationErrors.join('；') }}</div>
            <div v-if="saveError" class="alert alert-error text-sm w-full py-2">{{ saveError }}</div>
          </div>
        </template>
        <template v-else-if="sheetTab === 'assets'">
          <AssetsSection />
          <div class="flex flex-col items-end gap-2">
            <div v-if="validationErrors.length" class="alert alert-warning text-sm w-full py-2">{{ validationErrors.join('；') }}</div>
            <div v-if="saveError" class="alert alert-error text-sm w-full py-2">{{ saveError }}</div>
          </div>
        </template>
        <template v-else-if="sheetTab === 'social'">
          <SocialSection />
          <div class="flex flex-col items-end gap-2">
            <div v-if="validationErrors.length" class="alert alert-warning text-sm w-full py-2">{{ validationErrors.join('；') }}</div>
            <div v-if="saveError" class="alert alert-error text-sm w-full py-2">{{ saveError }}</div>
          </div>
        </template>
      </div>
    </div>

    <!-- 底部导航 -->
    <div class="border-t border-base-300 bg-base-100 flex shrink-0">
      <button
        v-for="t in SHEET_TABS"
        :key="t.id"
        type="button"
        class="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-xs transition-colors"
        :class="sheetTab === t.id ? 'text-accent bg-base-200/60' : 'text-base-content hover:text-accent'"
        @click="sheetTab = t.id"
      >
        <Icon :icon="t.icon" class="text-lg shrink-0" />
        <span>{{ t.label }}</span>
      </button>
    </div>

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
import { useConfirmDialog } from '../composables/useConfirmDialog'

const { confirm } = useConfirmDialog()
const confirmFn = (title, message) => confirm({ title, message })
const ctx = useCharacterForm({ confirmFn })
provide('characterForm', ctx)

const { form, isNew, sheetTab, save, goBack, validationErrors, saveError } = ctx
</script>

