<script setup>
import { ref, computed, onMounted } from 'vue'
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
    uploadingImage.value = false
  }
}

async function handleImageUpload(e) {
  const files = Array.from(e.target.files || [])
  if (!files.length) return
  error.value = ''
  for (const file of files) {
    if (imageUrls.value.length >= 3) break
    if (!file.type.startsWith('image/')) {
      error.value = '请选择图片文件'
      continue
    }
    try {
      const url = await uploadImage(file)
      if (url) {
        imageUrls.value.push(url)
        images.value.push(url)
      }
    } catch (err) {
      error.value = err.message || '图片上传失败'
    }
  }
  if (imageUrls.value.length >= 3) {
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
    toast.success('保存成功')
  }
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

function back() {
  if (isNew.value && canSave.value) {
    confirm({ title: '放弃新建', message: '有未保存的内容，确定要离开吗？' }).then((confirmed) => {
      if (confirmed) router.push({ name: 'clues', params: { roomId: roomId.value } })
    })
  } else {
    router.push({ name: 'clues', params: { roomId: roomId.value } })
  }
}
</script>

<template>
  <div class="flex flex-col h-full bg-base-100">
    <PageHeader
      :title="isNew ? '新建线索' : '编辑线索'"
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
            <button type="button" class="btn btn-ghost btn-square btn-sm" :disabled="saving" @click="save" title="保存">
              <Icon icon="mdi:check" class="text-lg" />
            </button>
          </template>
        </div>
      </template>
    </PageHeader>
    <div class="flex-1 overflow-y-auto bg-base-200 scroll-thin px-4 pt-4 lg:max-w-4xl lg:mx-auto lg:w-full">
      <LoadingSpinner v-if="loading" message="加载中…" />
      <div v-else-if="error" class="alert alert-error mb-4">{{ error }}</div>
      <template v-else>
        <div class="flex flex-col gap-2 sm:gap-4">
          <input
            v-model="title"
            type="text"
            placeholder="无标题线索"
            class="input input-ghost w-full text-xl sm:text-2xl font-bold px-0 focus:bg-transparent border-none focus:outline-none"
          />
          <div class="divider my-0 opacity-50"></div>
          <textarea
            v-model="content"
            placeholder="开始输入内容…（可选）"
            class="textarea textarea-ghost w-full flex-1 resize-none text-base px-0 focus:bg-transparent border-none focus:outline-none leading-relaxed min-h-[300px]"
          ></textarea>

          <div class="bg-base-100 rounded-2xl p-4 border border-base-200 mt-4">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2 text-[11px] font-bold text-base-content/40 uppercase tracking-wider">
                <Icon icon="mdi:image-multiple-outline" class="text-sm"/> 
                附加图片
              </div>
              <label
                class="btn btn-primary btn-sm rounded-xl gap-1 active:scale-95 transition-transform"
                :class="{ 'btn-disabled opacity-50': imageUrls.length >= 3 || uploadingImage }"
              >
                <Icon icon="mdi:image-plus" class="text-lg" />
                添加图片
                <span v-if="imageUrls.length > 0" class="text-xs opacity-80">({{ imageUrls.length }}/3)</span>
                <input type="file" accept="image/*" multiple class="hidden" :disabled="uploadingImage || imageUrls.length >= 3" @change="handleImageUpload" />
              </label>
            </div>
            
            <div v-if="uploadingImage" class="text-sm text-base-content/60 mb-2 flex items-center gap-2">
              <span class="loading loading-spinner loading-xs"></span> 上传中…
            </div>
            
            <div v-if="imageUrls.length" class="flex flex-wrap gap-3">
              <div v-for="(url, index) in imageUrls" :key="index" class="flex flex-col items-center gap-1">
                <button
                  type="button"
                  class="w-16 h-16 rounded-xl overflow-hidden bg-base-300 shrink-0 block cursor-pointer hover:opacity-90 transition-opacity"
                  @click="openPreview(url)"
                >
                  <img :src="url" alt="" class="w-full h-full object-cover pointer-events-none" />
                </button>
                <button
                  type="button"
                  class="text-xs text-primary hover:text-error hover:underline"
                  @click="confirmRemoveImage(index)"
                >
                  删除
                </button>
              </div>
            </div>
            <p v-else class="text-sm text-base-content/40 italic flex items-center gap-2">
              <Icon icon="mdi:image-off-outline" class="text-lg"/> 暂无图片
            </p>
          </div>
        </div>
      </template>
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
