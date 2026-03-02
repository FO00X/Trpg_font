<template>
  <div class="flex flex-col h-full min-h-0 bg-base-100 overflow-hidden">
    <PageHeader
      :title="isNew ? '新建线索' : (isEditing ? '编辑线索' : '线索')"
      icon="mdi:lightbulb-on-outline"
      :show-back="!isNew"
      @back="back"
    >
      <template #actions>
        <div class="flex items-center justify-center gap-1 sm:gap-2">
          <template v-if="isNew">
            <button type="button" class="btn btn-ghost" :disabled="saving" @click="back">
              <Icon icon="mdi:close" class="text-xl" />
            </button>
            <button type="button" class="btn btn-primary" :disabled="saving || !canSave" @click="save">
              <Icon :icon="saving ? 'mdi:loading' : 'mdi:plus'" class="text-xl" />
            </button>
          </template>
          <template v-else>
            <button type="button" class="btn btn-ghost btn-square btn-sm text-error" title="删除" :disabled="saving" @click="removeClue">
              <Icon icon="mdi:delete-outline" class="text-lg" />
            </button>
            <template v-if="isEditing">
              <button type="button" class="btn btn-ghost btn-square btn-sm" title="取消" :disabled="saving" @click="cancelEdit">
                <Icon icon="mdi:close" class="text-lg" />
              </button>
              <button type="button" class="btn btn-ghost btn-square btn-sm" title="保存" :disabled="saving" @click="save">
                <Icon icon="mdi:check" class="text-lg" />
              </button>
            </template>
            <button v-else type="button" class="btn btn-ghost btn-square btn-sm" title="编辑" :disabled="saving" @click="startEdit">
              <Icon icon="mdi:pencil" class="text-lg" />
            </button>
          </template>
        </div>
      </template>
    </PageHeader>
    <div
      class="flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-base-200 scroll-thin px-4 pt-4 pb-4 lg:max-w-4xl lg:mx-auto lg:w-full"
    >
      <LoadingSpinner v-if="loading" message="加载中…" />
      <div v-else-if="error" class="alert alert-error mb-4">{{ error }}</div>
      <template v-else>
        <div class="flex flex-col gap-2 sm:gap-4 min-h-[calc(100vh-10rem)]">
          <input
            v-model="title"
            type="text"
            placeholder="无标题线索"
            :readonly="!isNew && !isEditing"
            class="input input-ghost w-full text-xl sm:text-2xl font-bold px-0 focus:bg-transparent border-none focus:outline-none shrink-0"
          />
          <div class="divider my-0 opacity-50 shrink-0"></div>
          <textarea
            v-model="content"
            placeholder="开始输入内容…（可选）"
            :readonly="!isNew && !isEditing"
            class="textarea textarea-ghost w-full flex-1 resize-none text-base px-0 focus:bg-transparent border-none focus:outline-none leading-relaxed min-h-[calc(100vh-14rem)]"
          ></textarea>
        </div>
      </template>
    </div>

    <!-- 附加图片：悬浮底部，可收起展开 -->
    <div
      v-if="!loading && !error"
      class="fixed left-4 right-4 bottom-4 z-40 rounded-2xl border border-base-200 bg-base-100/95 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
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
                @click="openPreview(url)"
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

    <!-- 图片预览弹窗 -->
    <Teleport to="body">
      <div
        v-if="previewImageUrl"
        class="fixed inset-0 z-[10001] flex items-center justify-center bg-black/70 p-4"
        @click.self="closePreview"
      >
        <button
          type="button"
          class="absolute top-4 right-4 p-2 rounded-lg bg-white/20 text-white hover:bg-white/30"
          aria-label="关闭"
          @click="closePreview"
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
import PageHeader from '../components/PageHeader.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import { useToast } from '../composables/useToast'
import { useConfirmDialog } from '../composables/useConfirmDialog'
import { useCluesStore } from '../stores/clues'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const roomId = computed(() => route.params.roomId)
const clueId = computed(() => route.params.clueId)
const isNew = computed(() => route.name === 'clue-new')

const cluesStore = useCluesStore()
const auth = useAuthStore()
const toast = useToast()
const { confirm } = useConfirmDialog()

const title = ref('')
const content = ref('')
const images = ref([])
const imageUrls = ref([])
const saving = ref(false)
const loading = ref(true)
const error = ref('')
const uploadingImage = ref(false)
const previewImageUrl = ref(null)
const isMounted = ref(true)
const isEditing = ref(false)
const originalTitle = ref('')
const originalContent = ref('')
const originalImageUrls = ref([])
const imagesExpanded = ref(true)

const canSave = computed(() => title.value.trim().length > 0 || content.value.trim().length > 0)

function openPreview(url) {
  previewImageUrl.value = url
}

function closePreview() {
  previewImageUrl.value = null
}

async function confirmRemoveImage(index) {
  const confirmed = await confirm({ title: '确认删除', message: '确定要删除这张图片吗？' })
  if (confirmed) removeImage(index)
}

onMounted(async () => {
  if (isNew.value) {
    loading.value = false
    return
  }
  const res = await cluesStore.fetchOne(clueId.value)
  loading.value = false
  if (!res.ok) {
    error.value = res.message || '加载失败'
    return
  }
  if (res.data) {
    title.value = res.data.title
    content.value = res.data.content
    const imgList = res.data.images || []
    images.value = imgList
    imageUrls.value = imgList
    originalTitle.value = res.data.title
    originalContent.value = res.data.content
    originalImageUrls.value = [...imgList]
  } else {
    error.value = '线索不存在'
  }
})

async function uploadImage(file) {
  uploadingImage.value = true
  try {
    const uid = auth.user?.value?.id
    if (!uid) throw new Error('未登录')
    const fileExt = file.name.split('.').pop()
    const fileName = `${roomId.value}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
    const { data, error: uploadError } = await supabase.storage
      .from('room-clues-images')
      .upload(fileName, file, { cacheControl: '3600', upsert: false })
    if (uploadError) throw uploadError
    const { data: { publicUrl } } = supabase.storage.from('room-clues-images').getPublicUrl(data.path)
    return publicUrl
  } finally {
    if (isMounted.value) uploadingImage.value = false
  }
}

onBeforeUnmount(() => {
  isMounted.value = false
})

async function handleImageUpload(e) {
  const files = Array.from(e.target.files || [])
  if (!files.length) return
  if (isMounted.value) error.value = ''
  for (const file of files) {
    if (imageUrls.value.length >= 3) break
    if (!file.type.startsWith('image/')) {
      if (isMounted.value) error.value = '请选择图片文件'
      continue
    }
    try {
      const url = await uploadImage(file)
      if (url && isMounted.value) {
        imageUrls.value.push(url)
        images.value.push(url)
      }
    } catch (err) {
      if (isMounted.value) error.value = err.message || '图片上传失败'
    }
  }
  if (isMounted.value && imageUrls.value.length >= 3) {
    toast.info('最多上传 3 张图片')
  }
  e.target.value = ''
}

function removeImage(index) {
  imageUrls.value.splice(index, 1)
  images.value = [...imageUrls.value]
}

async function save() {
  if (isNew.value && !canSave.value) {
    toast.error('标题和内容不能同时为空')
    return
  }
  saving.value = true
  error.value = ''
  if (isNew.value) {
    const res = await cluesStore.create(roomId.value, { title: title.value, content: content.value, images: imageUrls.value })
    saving.value = false
    if (!res.ok) {
      error.value = res.message || '创建失败'
      toast.error('创建失败：' + (res.message || '未知错误'))
      return
    }
    toast.success('创建成功')
    router.replace({ name: 'clue-edit', params: { roomId: roomId.value, clueId: res.data.id } })
    return
  }
  const res = await cluesStore.update(clueId.value, { title: title.value, content: content.value, images: imageUrls.value })
  saving.value = false
  if (!res.ok) {
    error.value = res.message || '保存失败'
    toast.error('保存失败：' + (res.message || '未知错误'))
  } else {
    error.value = ''
    images.value = imageUrls.value
    originalTitle.value = title.value
    originalContent.value = content.value
    originalImageUrls.value = [...imageUrls.value]
    isEditing.value = false
    toast.success('保存成功')
  }
}

function startEdit() {
  isEditing.value = true
}

function cancelEdit() {
  title.value = originalTitle.value
  content.value = originalContent.value
  imageUrls.value = [...originalImageUrls.value]
  images.value = [...originalImageUrls.value]
  isEditing.value = false
  error.value = ''
}

async function removeClue() {
  const confirmed = await confirm({ title: '确认删除', message: '确定删除这条线索？' })
  if (!confirmed) return
  saving.value = true
  const res = await cluesStore.remove(clueId.value)
  saving.value = false
  if (res.ok) {
    toast.success('删除成功')
    router.push({ name: 'clues', params: { roomId: roomId.value } })
  } else {
    error.value = res.message || '删除失败'
    toast.error('删除失败：' + (res.message || '未知错误'))
  }
}

const hasUnsavedChanges = computed(() => {
  if (isNew.value) return canSave.value
  if (!isEditing.value) return false
  return (
    title.value !== originalTitle.value ||
    content.value !== originalContent.value ||
    JSON.stringify(imageUrls.value) !== JSON.stringify(originalImageUrls.value)
  )
})

function back() {
  if (isNew.value && canSave.value) {
    confirm({ title: '放弃新建', message: '有未保存的内容，确定要离开吗？' }).then((confirmed) => {
      if (confirmed) router.push({ name: 'clues', params: { roomId: roomId.value } })
    })
  } else if (!isNew.value && isEditing.value && hasUnsavedChanges.value) {
    confirm({ title: '放弃编辑', message: '有未保存的修改，确定要离开吗？' }).then((confirmed) => {
      if (confirmed) router.push({ name: 'clues', params: { roomId: roomId.value } })
    })
  } else {
    router.push({ name: 'clues', params: { roomId: roomId.value } })
  }
}
</script>