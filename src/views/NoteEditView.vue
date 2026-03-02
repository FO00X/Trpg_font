<template>
  <div class="flex flex-col h-full bg-base-100">
    <PageHeader
      :title="headerTitle"
      icon="mdi:note-text-outline"
      :show-back="!isNew"
      @back="back"
    >
      <template #actions>
        <div class="flex items-center justify-center gap-1 sm:gap-2">
          <!-- 右侧：根据场景显示操作按钮 -->
          <!-- 新建：取消 + 创建 -->
          <template v-if="isNew">
            <button type="button" class="btn btn-ghost " :disabled="saving" @click="back">
              <Icon icon="mdi:close" class="text-xl" />
            </button>
            <button type="button" class="btn btn-primary" :disabled="saving || !canSave" @click="onSaveEdit">
              <Icon :icon="saving ? 'mdi:loading' : 'mdi:plus'" class="text-xl" />
            </button>
          </template>
          <template v-else>
            <button v-if="!isEditing" type="button" class="btn btn-ghost btn-square btn-sm text-error" title="删除" :disabled="saving" @click="removeNote">
              <Icon icon="mdi:delete-outline" class="text-lg" />
            </button>
            <button v-if="!isEditing" type="button" class="btn btn-ghost btn-square btn-sm" :disabled="saving" @click="onStartEdit" title="编辑">
              <Icon icon="mdi:pencil-outline" class="text-lg" />
            </button>
            <template v-else>
              <button type="button" class="btn btn-ghost" :disabled="saving" @click="onCancelEdit">
                <Icon icon="mdi:close" class="text-xl" />
              </button>
              <button type="button" class="btn btn-primary" :disabled="saving || !canSave" @click="onSaveEdit">
                <Icon icon="mdi:check" class="text-xl" />
                {{ saving ? '保存中…' : '保存' }}
              </button>
            </template>
          </template>
        </div>
      </template>
    </PageHeader>
    <div class="flex-1 overflow-y-auto bg-base-200 scroll-thin px-4 pt-4 lg:max-w-4xl lg:mx-auto lg:w-full">
      <LoadingSpinner v-if="loading" message="加载中…" />
      <div v-else-if="error" class="alert alert-error mb-4">{{ error }}</div>
      <template v-else>
        <!-- 编辑模式 -->
        <div v-if="isNew || isEditing" class="flex flex-col h-full gap-2 sm:gap-4">
          <input 
            v-model="title" 
            type="text" 
            placeholder="无标题笔记" 
            class="input input-ghost w-full text-xl sm:text-2xl font-bold px-0 focus:bg-transparent border-none focus:outline-none" 
          />
          <div class="divider my-0 opacity-50"></div>
          <textarea 
            v-model="content" 
            placeholder="开始输入内容… (支持 Markdown 语法)" 
            class="textarea textarea-ghost w-full flex-1 resize-none text-base px-0 focus:bg-transparent border-none focus:outline-none leading-relaxed min-h-[300px]" 
          ></textarea>
        </div>
        <!-- 查看模式 -->
        <div v-else class="flex flex-col h-full">
          <div class="mb-6">
            <h1 class="text-2xl sm:text-3xl font-bold text-base-content break-words mb-3">{{ title || '无标题笔记' }}</h1>
            <div class="text-sm text-base-content/50 flex items-center gap-1">
              <Icon icon="mdi:clock-outline" />
              <span>{{ formattedDate }}</span>
            </div>
          </div>
          <div class="markdown-body text-base-content break-words" v-html="parsedContent"></div>
        </div>
      </template>
    </div>
  </div>

</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

import PageHeader from '../components/PageHeader.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import { useToast } from '../composables/useToast'
import { useConfirmDialog } from '../composables/useConfirmDialog'
import { formatDateTime } from '../utils/date'
import { useNotesStore } from '../stores/notes'

const route = useRoute()
const router = useRouter()
const notesStore = useNotesStore()
const toast = useToast()
const { confirm } = useConfirmDialog()

const isNew = computed(() => route.name === 'note-new')
const id = computed(() => route.params.id)

const title = ref('')
const content = ref('')
const originalTitle = ref('')
const originalContent = ref('')
const updatedAt = ref(null)

const saving = ref(false)
const loading = ref(true)
const error = ref('')
const isEditing = ref(false)

const headerTitle = computed(() => {
  if (isNew.value) return '新建笔记'
  return isEditing.value ? '编辑笔记' : '查看笔记'
})

const parsedContent = computed(() => {
  if (!content.value) return '<p class="text-base-content/50">（暂无内容）</p>'
  const rawHtml = marked.parse(content.value)
  return DOMPurify.sanitize(rawHtml)
})

const formattedDate = computed(() => formatDateTime(updatedAt.value))

const canSave = computed(() => {
  return title.value.trim().length > 0 || content.value.trim().length > 0
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
    originalTitle.value = res.data.title
    originalContent.value = res.data.content
    updatedAt.value = res.data.updated_at
  } else {
    error.value = '笔记不存在'
  }
})

async function save() {
  if (!canSave.value) {
    toast.error('标题和内容不能同时为空')
    return { ok: false }
  }

  saving.value = true
  error.value = ''
  
  if (isNew.value) {
    const res = await notesStore.create({ title: title.value, content: content.value })
    saving.value = false
    if (!res.ok) {
      error.value = res.message || '创建失败'
      toast.error('创建失败：' + (res.message || '未知错误'))
      return res
    }
    toast.success('创建成功')
    router.replace({ name: 'note-edit', params: { id: res.data.id } })
    return res
  }
  
  const res = await notesStore.update(id.value, { title: title.value, content: content.value })
  saving.value = false
  if (!res.ok) {
    error.value = res.message || '保存失败'
    toast.error('保存失败：' + (res.message || '未知错误'))
  } else {
    originalTitle.value = title.value
    originalContent.value = content.value
    if (res.data?.updated_at) {
      updatedAt.value = res.data.updated_at
    }
    toast.success('保存成功')
  }
  return res
}

async function removeNote() {
  const confirmed = await confirm({ title: '确认删除', message: '确定删除这篇笔记？' })
  if (!confirmed) return
  saving.value = true
  const res = await notesStore.remove(id.value)
  saving.value = false
  if (res.ok) {
    toast.success('删除成功')
    setTimeout(() => {
      router.push({ name: 'notes' })
    }, 500)
  } else {
    error.value = res.message || '删除失败'
    toast.error('删除失败：' + (res.message || '未知错误'))
  }
}

function back() {
  if (isEditing.value && !isNew.value && (title.value !== originalTitle.value || content.value !== originalContent.value)) {
    confirm({ title: '放弃修改', message: '有未保存的修改，确定要放弃吗？' }).then(confirmed => {
      if (confirmed) {
        router.push({ name: 'notes' })
      }
    })
  } else if (isEditing.value && isNew.value && canSave.value) {
    confirm({ title: '放弃新建', message: '有未保存的内容，确定要离开吗？' }).then(confirmed => {
      if (confirmed) {
        router.push({ name: 'notes' })
      }
    })
  } else {
    router.push({ name: 'notes' })
  }
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
  // 如果有修改，则确认
  if (title.value !== originalTitle.value || content.value !== originalContent.value) {
    confirm({ title: '放弃修改', message: '有未保存的修改，确定要丢弃吗？' }).then(confirmed => {
      if (confirmed) {
        title.value = originalTitle.value
        content.value = originalContent.value
        isEditing.value = false
      }
    })
  } else {
    isEditing.value = false
  }
}
</script>


<style scoped>
.markdown-body {
  font-family: inherit;
  line-height: 1.6;
}
.markdown-body :deep(h1), 
.markdown-body :deep(h2), 
.markdown-body :deep(h3), 
.markdown-body :deep(h4), 
.markdown-body :deep(h5), 
.markdown-body :deep(h6) {
  font-weight: 600;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
}
.markdown-body :deep(h1) { font-size: 2em; }
.markdown-body :deep(h2) { font-size: 1.5em; border-bottom: 1px solid var(--color-base-300); padding-bottom: 0.3em; }
.markdown-body :deep(h3) { font-size: 1.25em; }
.markdown-body :deep(p), 
.markdown-body :deep(blockquote), 
.markdown-body :deep(ul), 
.markdown-body :deep(ol), 
.markdown-body :deep(dl), 
.markdown-body :deep(table), 
.markdown-body :deep(pre) {
  margin-top: 0;
  margin-bottom: 1em;
}
.markdown-body :deep(ul), 
.markdown-body :deep(ol) {
  padding-left: 2em;
  list-style: auto;
}
.markdown-body :deep(blockquote) {
  padding: 0 1em;
  color: color-mix(in oklch, var(--color-base-content) 60%, transparent);
  border-left: 0.25em solid var(--color-base-300);
}
.markdown-body :deep(code) {
  padding: 0.2em 0.4em;
  margin: 0;
  font-size: 85%;
  background-color: var(--color-base-200);
  border-radius: 6px;
  font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;
}
.markdown-body :deep(pre) {
  padding: 1rem;
  overflow: auto;
  font-size: 85%;
  line-height: 1.45;
  background-color: var(--color-base-200);
  border-radius: 6px;
}
.markdown-body :deep(pre code) {
  padding: 0;
  margin: 0;
  background-color: transparent;
  border: 0;
}
.markdown-body :deep(img) {
  max-width: 100%;
  box-sizing: content-box;
}
.markdown-body :deep(a) {
  color: var(--color-primary);
  text-decoration: underline;
}
.markdown-body :deep(hr) {
  height: 0.25em;
  padding: 0;
  margin: 24px 0;
  background-color: var(--color-base-300);
  border: 0;
}
</style>
