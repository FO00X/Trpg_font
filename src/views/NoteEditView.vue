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
const isEditing = ref(false)

const headerTitle = computed(() => {
  if (isNew.value) return '新建笔记'
  return isEditing.value ? '编辑笔记' : '查看笔记'
})

onMounted(async () => {
  if (isNew.value) {
    isEditing.value = true
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
    return res
  }
  const res = await notesStore.update(id.value, { title: title.value, content: content.value })
  saving.value = false
  if (!res.ok) {
    error.value = res.message || '保存失败'
  }
  return res
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

async function onSaveEdit() {
  const res = await save()
  if (res?.ok && !isNew.value) {
    isEditing.value = false
  }
}

function onStartEdit() {
  if (!isNew.value) {
    isEditing.value = true
  }
}

function onCancelEdit() {
  if (isNew.value) {
    back()
    return
  }
  // 重新加载一次内容，丢弃本地修改
  isEditing.value = false
}
</script>

<template>
  <div class="flex flex-col h-full">
    <PageHeader
      :title="headerTitle"
      icon="mdi:note-text-outline"
      :show-back="!isNew"
      @back="back"
    >
      <template #actions>
        <div class="flex items-center justify-center">
          <!-- 右侧：根据场景显示操作按钮 -->
          <!-- 新建：取消 + 创建 -->
          <template v-if="isNew">
            <button
              type="button"
              class="px-3 py-1.5 rounded-lg border border-chat-border text-xs text-accent-muted hover:bg-white/5 ml-2"
              :disabled="saving"
              @click="back"
            >
              取消
            </button>
            <button
              type="button"
              class="px-3 py-1.5 rounded-lg bg-accent text-xs text-white font-medium disabled:opacity-50 ml-2"
              :disabled="saving"
              @click="onSaveEdit"
            >
              {{ saving ? '创建中…' : '创建' }}
            </button>
          </template>

          <!-- 已有笔记：编辑 / 删除 / 保存 / 取消 -->
          <template v-else>
            <!-- 删除始终在最右侧 -->
            <button
              type="button"
              class="p-1 rounded-lg text-red-400 hover:bg-white/10 ml-2"
              title="删除"
              :disabled="saving"
              @click="removeNote"
            >
              <Icon icon="mdi:delete-outline" class="text-lg" />
            </button>

            <!-- 查看模式：显示编辑图标按钮 -->
            <button
              v-if="!isEditing"
              type="button"
              class="p-1 rounded-lg text-accent hover:bg-white/10 ml-2"
              :disabled="saving"
              @click="onStartEdit"
            >
              <Icon icon="mdi:pencil-outline" class="text-lg" />
            </button>

            <!-- 编辑模式：显示保存 + 取消 -->
            <template v-else>
              <button
                type="button"
                class="px-2 py-1 rounded-lg bg-accent text-xs text-white font-medium disabled:opacity-50 ml-2"
                :disabled="saving"
                @click="onSaveEdit"
              >
                {{ saving ? '保存中…' : '保存' }}
              </button>
              <button
                type="button"
                class="px-2 py-1 rounded-lg border border-chat-border text-xs text-accent-muted hover:bg-white/5 ml-2"
                :disabled="saving"
                @click="onCancelEdit"
              >
                取消
              </button>
            </template>
          </template>
        </div>
      </template>
    </PageHeader>
    <div class="flex-1 overflow-y-auto scroll-thin p-4">
      <div v-if="loading" class="text-accent-muted">加载中…</div>
      <div v-else-if="error" class="text-red-400 mb-4">{{ error }}</div>
      <template v-else>
        <!-- 内容区域：根据模式切换只读 / 可编辑 -->
        <template v-if="isNew || isEditing">
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
        </template>
        <template v-else>
          <div class="px-4 py-3 rounded-xl bg-chat-panel border border-chat-border mb-4">
            <div class="text-lg font-semibold text-white break-words">
              {{ title || '（无标题）' }}
            </div>
          </div>
          <div class="px-4 py-3 rounded-xl bg-chat-panel border border-chat-border text-sm text-accent-muted whitespace-pre-wrap break-words min-h-[200px]">
            {{ content || '（暂无内容）' }}
          </div>
        </template>
      </template>
    </div>
  </div>
</template>
