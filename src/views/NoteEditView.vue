<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import PageHeader from '../components/PageHeader.vue'
import { useNotesStore } from '../stores/notes'

const route = useRoute()
const router = useRouter()
const notesStore = useNotesStore()

const isNew = computed(() => route.name === 'note-new')
const id = computed(() => route.params.id)

const title = ref('')
const content = ref('')
const saving = ref(false)
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  if (isNew.value) {
    loading.value = false
    return
  }
  const res = await notesStore.fetchOne(id.value)
  loading.value = false
  if (!res.ok) {
    error.value = res.message || '加载失败'
    return
  }
  if (res.data) {
    title.value = res.data.title
    content.value = res.data.content
  } else {
    error.value = '笔记不存在'
  }
})

async function save() {
  saving.value = true
  error.value = ''
  if (isNew.value) {
    const res = await notesStore.create({ title: title.value, content: content.value })
    saving.value = false
    if (!res.ok) {
      error.value = res.message || '创建失败'
      return
    }
    router.replace({ name: 'note-edit', params: { id: res.data.id } })
    return
  }
  const res = await notesStore.update(id.value, { title: title.value, content: content.value })
  saving.value = false
  if (!res.ok) {
    error.value = res.message || '保存失败'
  }
}

async function removeNote() {
  if (!confirm('确定删除这篇笔记？')) return
  saving.value = true
  const res = await notesStore.remove(id.value)
  saving.value = false
  if (res.ok) {
    router.push({ name: 'notes' })
  } else {
    error.value = res.message || '删除失败'
  }
}

function back() {
  router.push({ name: 'notes' })
}
</script>

<template>
  <div class="flex flex-col h-full">
    <PageHeader
      :title="isNew ? '新建笔记' : '编辑笔记'"
      icon="mdi:note-text-outline"
    >
      <template #actions>
        <button
          v-if="!isNew"
          type="button"
          class="p-2 rounded-lg text-red-400 hover:bg-white/10"
          title="删除"
          :disabled="saving"
          @click="removeNote"
        >
          <Icon icon="mdi:delete-outline" class="text-lg" />
        </button>
        <button
          type="button"
          class="p-2 rounded-lg text-accent-muted hover:bg-white/10"
          title="返回"
          @click="back"
        >
          <Icon icon="mdi:arrow-left" class="text-lg" />
        </button>
      </template>
    </PageHeader>
    <div class="flex-1 overflow-y-auto scroll-thin p-4">
      <div v-if="loading" class="text-accent-muted">加载中…</div>
      <div v-else-if="error" class="text-red-400 mb-4">{{ error }}</div>
      <template v-else>
        <input
          v-model="title"
          type="text"
          placeholder="标题"
          class="w-full px-4 py-3 rounded-xl bg-chat-panel border border-chat-border text-white placeholder-accent-muted focus:border-accent outline-none mb-4"
        />
        <textarea
          v-model="content"
          placeholder="内容…"
          rows="16"
          class="w-full px-4 py-3 rounded-xl bg-chat-panel border border-chat-border text-white placeholder-accent-muted focus:border-accent outline-none resize-y min-h-[200px]"
        />
        <div class="flex gap-2 mt-4">
          <button
            type="button"
            class="px-4 py-2 rounded-xl bg-accent text-white font-medium disabled:opacity-50"
            :disabled="saving"
            @click="save"
          >
            {{ saving ? '保存中…' : (isNew ? '创建' : '保存') }}
          </button>
          <button
            type="button"
            class="px-4 py-2 rounded-xl border border-chat-border text-accent-muted hover:bg-white/5"
            :disabled="saving"
            @click="back"
          >
            取消
          </button>
        </div>
      </template>
    </div>
  </div>
</template>
