<template>
  <div class="flex flex-col h-full min-h-0 bg-base-100 overflow-hidden">
    <PageHeader
      :title="pageTitle"
      :icon="pageIcon"
      :show-back="true"
      @back="back"
    />
    <div
      class="flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-base-200 scroll-thin px-4 pt-4 pb-4 lg:max-w-4xl lg:mx-auto lg:w-full"
    >
      <LoadingSpinner v-if="loading" message="加载中…" />
      <div v-else-if="error" class="alert alert-error mb-4">{{ error }}</div>
      <div v-else-if="editType === 'module-entry' && !isOwner" class="alert alert-warning mb-4">仅房主可编辑模组词条</div>
      <template v-else>
        <!-- 查看模式：全部使用 Markdown 渲染 -->
        <template v-if="!isNew && !isEditing">
          <div class="flex flex-col min-h-[calc(100vh-10rem)]">
            <div class="mb-4 shrink-0">
              <h1 class="text-2xl sm:text-3xl font-bold text-base-content break-words mb-3">{{ displayTitle }}</h1>
              <div v-if="formattedDate" class="text-sm text-base-content/50 flex items-center gap-1">
                <Icon icon="mdi:clock-outline" />
                <span>{{ formattedDate }}</span>
              </div>
            </div>
            <div class="markdown-body text-base-content break-words" v-html="parsedContent"></div>
          </div>
        </template>
        <!-- 编辑/新建：标题 + 正文 -->
        <div v-else class="flex flex-col gap-2 sm:gap-4 min-h-[calc(100vh-10rem)]">
          <input
            v-model="title"
            type="text"
            :placeholder="titlePlaceholder"
            :readonly="!isNew && !isEditing"
            class="input input-ghost w-full text-xl sm:text-2xl font-bold px-0 focus:bg-transparent border-none focus:outline-none shrink-0"
          />
          <div class="divider my-0 opacity-50 shrink-0"></div>
          <textarea
            v-model="content"
            :placeholder="contentPlaceholder"
            :readonly="!isNew && !isEditing"
            class="textarea textarea-ghost w-full flex-1 resize-none text-base px-0 focus:bg-transparent border-none focus:outline-none leading-relaxed min-h-[calc(100vh-14rem)]"
          ></textarea>
        </div>
      </template>
    </div>
    <div class="fab">
  <div tabindex="0" role="button" class="btn btn-lg btn-circle btn-primary"><Icon icon="mdi:dots-vertical" class="text-2xl" /></div>
  <div class="fab-close">
    <span class="btn btn-circle btn-lg btn-error">✕</span>
  </div>
  <div v-if="!isNew">删除<button class="btn btn-lg btn-circle" :disabled="saving" @click="onRemove()">          
    <Icon icon="mdi:delete-outline" class="text-xl" />
  </button></div>
  <div v-if="isEditing || isNew">取消<button class="btn btn-lg btn-circle" :disabled="saving" @click="cancelEdit()">
    <Icon icon="mdi:close" class="text-xl" />
  </button></div>
  <div v-if="isEditing || isNew">保存<button class="btn btn-lg btn-circle" :disabled="saving" @click="onSave()">
    <Icon icon="mdi:content-save-outline" class="text-xl" />
  </button></div>
  <div v-if="!isNew && !isEditing">编辑 <button class="btn btn-lg btn-circle" :disabled="saving" @click="startEdit()">
    <Icon icon="mdi:pencil" class="text-xl" />
  </button></div>
</div>
    <!-- 附加图片 -->
    <div
      v-if="!loading && !error && (editType !== 'module-entry' || isOwner) && (isNew || isEditing || imageUrls.length > 0)"
      class="fixed left-4 right-25 bottom-4 z-40 rounded-2xl border border-base-200 bg-base-100/95 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
      style="padding-bottom: env(safe-area-inset-bottom, 0px);"
    >
      <button
        type="button"
        class="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-base-200/50 transition-colors"
        @click="imagesExpanded = !imagesExpanded"
      >
        <div class="flex items-center gap-2 text-[11px] font-bold text-base-content/40 uppercase tracking-wider">
          <Icon icon="mdi:image-multiple-outline" class="text-sm" />
          附加图片
          <span class="text-primary font-normal">({{ imageUrls.length }}/3)</span>
        </div>
        <Icon
          :icon="imagesExpanded ? 'mdi:chevron-down' : 'mdi:chevron-up'"
          class="text-xl text-base-content/40 transition-transform"
        />
      </button>
      <Transition
        enter-active-class="transition-all duration-200 ease-out"
        enter-from-class="opacity-0 max-h-0"
        enter-to-class="opacity-100 max-h-[180px]"
        leave-active-class="transition-all duration-150 ease-in"
        leave-from-class="opacity-100 max-h-[180px]"
        leave-to-class="opacity-0 max-h-0"
      >
        <div v-show="imagesExpanded" class="overflow-hidden">
          <div class="px-4 pb-4 pt-0 flex flex-wrap gap-3 overflow-hidden max-h-24">
            <div v-for="(url, index) in imageUrls" :key="url" class="flex flex-col items-center gap-1 shrink-0">
              <button
                type="button"
                class="w-14 h-14 rounded-xl overflow-hidden bg-base-300 shrink-0 block cursor-pointer hover:opacity-90 transition-opacity"
                @click="previewImageUrl = url"
              >
                <img :src="url" alt="" class="w-full h-full object-cover pointer-events-none" />
              </button>
              <button
                v-if="isNew || isEditing"
                type="button"
                class="text-[10px] text-primary hover:text-error hover:underline"
                @click="confirmRemoveImage(index)"
              >
                删除
              </button>
            </div>
            <label
              v-if="(isNew || isEditing) && imageUrls.length < 3"
              class="w-14 h-14 rounded-xl bg-base-300 shrink-0 flex items-center justify-center cursor-pointer hover:bg-base-200 transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              :class="{ 'pointer-events-none': uploadingImage }"
            >
              <Icon :icon="uploadingImage ? 'mdi:loading' : 'mdi:plus'" :class="uploadingImage ? 'text-2xl animate-spin' : 'text-2xl text-base-content/60'" />
              <input type="file" accept="image/*" multiple class="hidden" :disabled="uploadingImage" @change="handleImageUpload" />
            </label>
          </div>
        </div>
      </Transition>
    </div>

    <!-- 图片预览 -->
    <Teleport to="body">
      <div
        v-if="previewImageUrl"
        class="fixed inset-0 z-[10001] flex items-center justify-center bg-black/70 p-4"
        @click.self="previewImageUrl = null"
      >
        <button
          type="button"
          class="absolute top-4 right-4 p-2 rounded-lg bg-white/20 text-white hover:bg-white/30"
          aria-label="关闭"
          @click="previewImageUrl = null"
        >
          <Icon icon="mdi:close" class="text-2xl" />
        </button>
        <img
          :src="previewImageUrl"
          alt="预览"
          class="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
          @click.stop
        />
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import PageHeader from '../components/PageHeader.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import { useToast } from '../composables/useToast'
import { useConfirmDialog } from '../composables/useConfirmDialog'
import { formatDateTime } from '../utils/date'
import { useCluesStore } from '../stores/clues'
import { useNotesStore } from '../stores/notes'
import { useGameRoomsStore } from '../stores/gameRooms'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../lib/supabase'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { confirm } = useConfirmDialog()

const editType = computed(() => {
  const name = route.name
  if (name === 'clue-new' || name === 'clue-edit') return 'clue'
  if (name === 'note-new' || name === 'note-edit') return 'note'
  if (name === 'module-entry-new' || name === 'module-entry-edit') return 'module-entry'
  return 'clue'
})

const isNew = computed(() => {
  const name = route.name
  return name === 'clue-new' || name === 'note-new' || name === 'module-entry-new'
})

const roomId = computed(() => route.params.roomId)
const clueId = computed(() => route.params.clueId)
const noteId = computed(() => route.params.id)
const entryId = computed(() => route.params.entryId)

const pageTitle = computed(() => {
  const labels = {
    clue: { new: '新建线索', edit: '编辑线索', view: '线索' },
    note: { new: '新建笔记', edit: '编辑笔记', view: '笔记' },
    'module-entry': { new: '新建词条', edit: '编辑词条', view: '词条' },
  }[editType.value]
  if (isNew.value) return labels.new
  return isEditing.value ? labels.edit : labels.view
})

const pageIcon = computed(() => {
  const icons = { clue: 'mdi:lightbulb-on-outline', note: 'mdi:note-text-outline', 'module-entry': 'mdi:file-document-edit-outline' }
  return icons[editType.value] || 'mdi:file-document-outline'
})

const titlePlaceholder = computed(() => {
  const placeholders = {
    clue: '无标题线索',
    note: '无标题笔记',
    'module-entry': '词条标题（如：【背景信息】）',
  }
  return placeholders[editType.value] || '标题'
})

const contentPlaceholder = computed(() => {
  const placeholders = {
    clue: '开始输入内容…（可选）',
    note: '开始输入内容…（支持 Markdown 语法）',
    'module-entry': '在此填写正文内容…',
  }
  return placeholders[editType.value] || '内容'
})

const displayTitle = computed(() => {
  const empty = { clue: '无标题线索', note: '无标题笔记', 'module-entry': '无标题词条' }[editType.value] || '无标题'
  return title.value || empty
})

const cluesStore = useCluesStore()
const notesStore = useNotesStore()
const { fetchRoom, updateModuleEntries } = useGameRoomsStore()
const auth = useAuthStore()

const title = ref('')
const content = ref('')
const saving = ref(false)
const loading = ref(true)
const error = ref('')
const isEditing = ref(false)
const fabOpen = ref(false)
const originalTitle = ref('')
const originalContent = ref('')

const imageUrls = ref([])
const originalImageUrls = ref([])
const uploadingImage = ref(false)
const imagesExpanded = ref(true)
const isMounted = ref(true)
const previewImageUrl = ref(null)

const updatedAt = ref(null)
const entries = ref([])
const isOwner = ref(false)

const canSave = computed(() => title.value.trim().length > 0 || content.value.trim().length > 0)

const parsedContent = computed(() => {
  if (!content.value) return '<p class="text-base-content/50">（暂无内容）</p>'
  return DOMPurify.sanitize(marked.parse(content.value))
})
const formattedDate = computed(() => formatDateTime(updatedAt.value))

const hasUnsavedChanges = computed(() => {
  if (isNew.value) return canSave.value
  if (!isEditing.value) return false
  let changed = title.value !== originalTitle.value || content.value !== originalContent.value
  changed = changed || JSON.stringify(imageUrls.value) !== JSON.stringify(originalImageUrls.value)
  return changed
})

function getBackRoute() {
  if (editType.value === 'clue') return { name: 'clues', params: { roomId: roomId.value } }
  if (editType.value === 'note') return { name: 'notes' }
  return { name: 'room-module', params: { roomId: roomId.value } }
}

async function load() {
  if (editType.value === 'clue') {
    if (isNew.value) { loading.value = false; return }
    const res = await cluesStore.fetchOne(clueId.value)
    loading.value = false
    if (!res.ok) { error.value = res.message || '加载失败'; return }
    if (res.data) {
      title.value = res.data.title
      content.value = res.data.content
      const imgList = res.data.images || []
      imageUrls.value = imgList
      originalTitle.value = res.data.title
      originalContent.value = res.data.content
      originalImageUrls.value = [...imgList]
      updatedAt.value = res.data.updated_at
    } else error.value = '线索不存在'
    return
  }
  if (editType.value === 'note') {
    if (isNew.value) { isEditing.value = true; loading.value = false; return }
    const res = await notesStore.fetchOne(noteId.value)
    loading.value = false
    if (!res.ok) { error.value = res.message || '加载失败'; return }
    if (res.data) {
      title.value = res.data.title
      content.value = res.data.content
      const imgList = res.data.images || []
      imageUrls.value = imgList
      originalTitle.value = res.data.title
      originalContent.value = res.data.content
      originalImageUrls.value = [...imgList]
      updatedAt.value = res.data.updated_at
    } else error.value = '笔记不存在'
    return
  }
  if (editType.value === 'module-entry') {
    const room = await fetchRoom(roomId.value)
    if (!room) { loading.value = false; error.value = '房间不存在或无权访问'; return }
    const uid = auth.user?.value?.id
    isOwner.value = !!(uid && room.ownerId && uid === room.ownerId)
    entries.value = (room.moduleEntries || []).map((e) => ({
      id: e.id || crypto.randomUUID?.() || `e-${Date.now()}`,
      title: e.title ?? '',
      content: e.content ?? '',
      images: e.images || [],
    }))
    if (isNew.value) { isEditing.value = true; loading.value = false; return }
    const entry = entries.value.find((e) => e.id === entryId.value)
    if (!entry) { loading.value = false; error.value = '词条不存在'; return }
    title.value = entry.title
    content.value = entry.content
    const imgList = entry.images || []
    imageUrls.value = imgList
    originalTitle.value = entry.title
    originalContent.value = entry.content
    originalImageUrls.value = [...imgList]
    loading.value = false
  }
}

onMounted(() => { load() })
onBeforeUnmount(() => { isMounted.value = false })

async function onSave() {
  if (isNew.value && !canSave.value) {
    toast.error('标题和内容不能同时为空')
    return
  }
  saving.value = true
  error.value = ''
  if (editType.value === 'clue') {
    if (isNew.value) {
      const res = await cluesStore.create(roomId.value, { title: title.value, content: content.value, images: imageUrls.value })
      saving.value = false
      if (!res.ok) { error.value = res.message || '创建失败'; toast.error('创建失败：' + (res.message || '未知错误')); return }
      toast.success('创建成功')
      router.replace({ name: 'clue-edit', params: { roomId: roomId.value, clueId: res.data.id } })
      return
    }
    const res = await cluesStore.update(clueId.value, { title: title.value, content: content.value, images: imageUrls.value })
    saving.value = false
    if (!res.ok) { error.value = res.message || '保存失败'; toast.error('保存失败：' + (res.message || '未知错误')); return }
    originalTitle.value = title.value
    originalContent.value = content.value
    originalImageUrls.value = [...imageUrls.value]
    isEditing.value = false
    toast.success('保存成功')
    return
  }
  if (editType.value === 'note') {
    if (isNew.value) {
      const res = await notesStore.create({ title: title.value, content: content.value, images: imageUrls.value })
      saving.value = false
      if (!res.ok) { error.value = res.message || '创建失败'; toast.error('创建失败：' + (res.message || '未知错误')); return }
      toast.success('创建成功')
      router.replace({ name: 'note-edit', params: { id: res.data.id } })
      return
    }
    const res = await notesStore.update(noteId.value, { title: title.value, content: content.value, images: imageUrls.value })
    saving.value = false
    if (!res.ok) { error.value = res.message || '保存失败'; toast.error('保存失败：' + (res.message || '未知错误')); return }
    originalTitle.value = title.value
    originalContent.value = content.value
    originalImageUrls.value = [...imageUrls.value]
    if (res.data?.updated_at) updatedAt.value = res.data.updated_at
    isEditing.value = false
    toast.success('保存成功')
    return
  }
  if (editType.value === 'module-entry') {
    if (isNew.value) {
      const id = crypto.randomUUID?.() || `e-${Date.now()}-${Math.random().toString(36).slice(2)}`
      const list = [...entries.value, { id, title: title.value, content: content.value, images: imageUrls.value }]
      const res = await updateModuleEntries(roomId.value, list)
      saving.value = false
      if (!res?.ok) { error.value = res?.message || '创建失败'; toast.error('创建失败：' + (res?.message || '未知错误')); return }
      toast.success('创建成功')
      router.replace({ name: 'module-entry-edit', params: { roomId: roomId.value, entryId: id } })
      return
    }
    const list = entries.value.map((e) =>
      e.id === entryId.value ? { ...e, title: title.value, content: content.value, images: imageUrls.value } : e
    )
    const res = await updateModuleEntries(roomId.value, list)
    saving.value = false
    if (!res?.ok) { error.value = res?.message || '保存失败'; toast.error('保存失败：' + (res?.message || '未知错误')); return }
    entries.value = list
    originalTitle.value = title.value
    originalContent.value = content.value
    originalImageUrls.value = [...imageUrls.value]
    isEditing.value = false
    toast.success('保存成功')
  }
}

function startEdit() { isEditing.value = true }

function cancelEdit() {
  title.value = originalTitle.value
  content.value = originalContent.value
  imageUrls.value = [...originalImageUrls.value]
  isEditing.value = false
  error.value = ''
}

async function onRemove() {
  const labels = { clue: '线索', note: '笔记', 'module-entry': '词条' }[editType.value]
  const confirmed = await confirm({ title: '确认删除', message: `确定删除这条${labels}？` })
  if (!confirmed) return
  saving.value = true
  if (editType.value === 'clue') {
    const res = await cluesStore.remove(clueId.value)
    saving.value = false
    if (res.ok) { toast.success('删除成功'); router.push(getBackRoute()); return }
    error.value = res.message || '删除失败'
    toast.error('删除失败：' + (res.message || '未知错误'))
    return
  }
  if (editType.value === 'note') {
    const res = await notesStore.remove(noteId.value)
    saving.value = false
    if (res.ok) { toast.success('删除成功'); router.push({ name: 'notes' }); return }
    error.value = res.message || '删除失败'
    toast.error('删除失败：' + (res.message || '未知错误'))
    return
  }
  if (editType.value === 'module-entry') {
    const list = entries.value.filter((e) => e.id !== entryId.value)
    const res = await updateModuleEntries(roomId.value, list)
    saving.value = false
    if (res?.ok) { toast.success('删除成功'); router.push(getBackRoute()); return }
    error.value = res?.message || '删除失败'
    toast.error('删除失败：' + (res?.message || '未知错误'))
  }
}

function back() {
  if (isNew.value && canSave.value) {
    confirm({ title: '放弃新建', message: '有未保存的内容，确定要离开吗？' }).then((c) => { if (c) router.push(getBackRoute()) })
  } else if (!isNew.value && isEditing.value && hasUnsavedChanges.value) {
    confirm({ title: '放弃编辑', message: '有未保存的修改，确定要离开吗？' }).then((c) => { if (c) router.push(getBackRoute()) })
  } else {
    router.push(getBackRoute())
  }
}

function getImageUploadPrefix() {
  const uid = auth.user?.value?.id
  if (editType.value === 'clue') return `${roomId.value}`
  if (editType.value === 'note') return `notes/${uid || 'anon'}`
  return `module/${roomId.value}`
}

async function uploadImage(file) {
  uploadingImage.value = true
  try {
    const uid = auth.user?.value?.id
    if (!uid) throw new Error('未登录')
    const fileExt = file.name.split('.').pop()
    const prefix = getImageUploadPrefix()
    const fileName = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
    const { data, error: uploadError } = await supabase.storage.from('room-clues-images').upload(fileName, file, { cacheControl: '3600', upsert: false })
    if (uploadError) throw uploadError
    const { data: { publicUrl } } = supabase.storage.from('room-clues-images').getPublicUrl(data.path)
    return publicUrl
  } finally {
    if (isMounted.value) uploadingImage.value = false
  }
}

async function confirmRemoveImage(index) {
  const c = await confirm({ title: '确认删除', message: '确定要删除这张图片吗？' })
  if (c) { imageUrls.value.splice(index, 1) }
}

async function handleImageUpload(e) {
  const files = Array.from(e.target.files || [])
  if (!files.length) return
  if (isMounted.value) error.value = ''
  for (const file of files) {
    if (imageUrls.value.length >= 3) break
    if (!file.type.startsWith('image/')) { if (isMounted.value) error.value = '请选择图片文件'; continue }
    try {
      const url = await uploadImage(file)
      if (url && isMounted.value) imageUrls.value.push(url)
    } catch (err) {
      if (isMounted.value) error.value = err.message || '图片上传失败'
    }
  }
  if (isMounted.value && imageUrls.value.length >= 3) toast.info('最多上传 3 张图片')
  e.target.value = ''
}
</script>

<style scoped>
.markdown-body { font-family: inherit; line-height: 1.55; }
.markdown-body :deep(h1), .markdown-body :deep(h2), .markdown-body :deep(h3), .markdown-body :deep(h4), .markdown-body :deep(h5), .markdown-body :deep(h6) { font-weight: 600; margin-top: 1.2em; margin-bottom: 0.4em; }
.markdown-body :deep(h1) { font-size: 2em; }
.markdown-body :deep(h2) { font-size: 1.5em; border-bottom: 1px solid var(--color-base-300); padding-bottom: 0.3em; }
.markdown-body :deep(h3) { font-size: 1.25em; }
.markdown-body :deep(p), .markdown-body :deep(blockquote), .markdown-body :deep(ul), .markdown-body :deep(ol), .markdown-body :deep(dl), .markdown-body :deep(table), .markdown-body :deep(pre) { margin-top: 0; margin-bottom: 0.4em; }
.markdown-body :deep(ul), .markdown-body :deep(ol) { padding-left: 2em; list-style: auto; }
.markdown-body :deep(blockquote) { padding: 0 1em; color: color-mix(in oklch, var(--color-base-content) 60%, transparent); border-left: 0.25em solid var(--color-base-300); }
.markdown-body :deep(code) { padding: 0.2em 0.4em; margin: 0; font-size: 85%; background-color: var(--color-base-200); border-radius: 6px; font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace; }
.markdown-body :deep(pre) { padding: 1rem; overflow: auto; font-size: 85%; line-height: 1.45; background-color: var(--color-base-200); border-radius: 6px; }
.markdown-body :deep(pre code) { padding: 0; margin: 0; background-color: transparent; border: 0; }
.markdown-body :deep(img) { max-width: 100%; box-sizing: content-box; }
.markdown-body :deep(a) { color: var(--color-primary); text-decoration: underline; }
.markdown-body :deep(hr) { height: 0.25em; padding: 0; margin: 24px 0; background-color: var(--color-base-300); border: 0; }
</style>
