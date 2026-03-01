<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import PageHeader from '../components/PageHeader.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import Toast from '../components/Toast.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
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

const title = ref('')
const content = ref('')
const images = ref([])
const imageUrls = ref([])
const saving = ref(false)
const loading = ref(true)
const error = ref('')
const uploadingImage = ref(false)

// Toast 和确认对话框
const toastRef = ref(null)
const confirmDialogVisible = ref(false)
const confirmDialogTitle = ref('确认')
const confirmDialogMessage = ref('')
let confirmDialogResolve = null
let confirmDialogReject = null

function showToast(message, duration = 3000) {
  if (toastRef.value) {
    toastRef.value.show(message, duration)
  }
}

function showConfirm(title, message) {
  return new Promise((resolve) => {
    confirmDialogTitle.value = title
    confirmDialogMessage.value = message
    confirmDialogVisible.value = true
    confirmDialogResolve = () => {
      resolve(true)
      confirmDialogVisible.value = false
    }
    confirmDialogReject = () => {
      resolve(false)
      confirmDialogVisible.value = false
    }
  })
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
  e.target.value = ''
}

function removeImage(index) {
  imageUrls.value.splice(index, 1)
  images.value = [...imageUrls.value]
}

async function save() {
  saving.value = true
  error.value = ''
  if (isNew.value) {
    const res = await cluesStore.create(roomId.value, { title: title.value, content: content.value, images: imageUrls.value })
    saving.value = false
    if (!res.ok) {
      error.value = res.message || '创建失败'
      return
    }
    router.replace({ name: 'clue-edit', params: { roomId: roomId.value, clueId: res.data.id } })
    return
  }
  const res = await cluesStore.update(clueId.value, { title: title.value, content: content.value, images: imageUrls.value })
  saving.value = false
  if (!res.ok) {
    error.value = res.message || '保存失败'
  } else {
    error.value = ''
    images.value = imageUrls.value
  }
}

async function removeClue() {
  const confirmed = await showConfirm('确认删除', '确定删除这条线索？')
  if (!confirmed) return
  saving.value = true
  const res = await cluesStore.remove(clueId.value)
  saving.value = false
  if (res.ok) {
    router.push({ name: 'clues', params: { roomId: roomId.value } })
  } else {
    error.value = res.message || '删除失败'
  }
}

function back() {
  router.push({ name: 'clues', params: { roomId: roomId.value } })
}
</script>

<template>
  <div class="flex flex-col h-full">
    <PageHeader
      :title="isNew ? '新建线索' : '编辑线索'"
      icon="mdi:lightbulb-on-outline"
      hide-base-100
    >
      <template #actions>
        <button v-if="!isNew" type="button" class="btn btn-ghost btn-square btn-sm text-error" title="删除" :disabled="saving" @click="removeClue">
          <Icon icon="mdi:delete-outline" class="text-lg" />
        </button>
        <button type="button" class="btn btn-ghost btn-square btn-sm" title="返回" @click="back">
          <Icon icon="mdi:arrow-left" class="text-lg" />
        </button>
      </template>
    </PageHeader>
    <div class="flex-1 overflow-y-auto scroll-thin p-4">
      <LoadingSpinner v-if="loading" message="加载中…" />
      <div v-else-if="error" class="alert alert-error mb-4">{{ error }}</div>
      <template v-else>
        <div class="max-w-2xl mx-auto space-y-4">
          <input v-model="title" type="text" placeholder="标题" class="input input-bordered w-full" />
          <textarea v-model="content" placeholder="内容（可选）…" rows="10" class="textarea textarea-bordered w-full resize-y min-h-[200px]" />
          <div class="card card-bordered bg-base-200">
            <div class="card-body p-4">
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-sm font-medium text-base-content/60 uppercase tracking-wider">图片</h3>
                <label class="btn btn-primary btn-sm gap-1">
                  <Icon icon="mdi:image-plus" class="text-lg" />
                  添加图片
                  <input type="file" accept="image/*" multiple class="hidden" :disabled="uploadingImage" @change="handleImageUpload" />
                </label>
              </div>
              <div v-if="uploadingImage" class="text-sm text-base-content/60 mb-2">上传中…</div>
              <div v-if="imageUrls.length" class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div v-for="(url, index) in imageUrls" :key="index" class="relative group aspect-square rounded-lg overflow-hidden bg-base-300">
                  <img :src="url" alt="" class="w-full h-full object-cover" />
                  <button type="button" class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-primary-content" @click="removeImage(index)">
                    <Icon icon="mdi:delete" class="text-2xl" />
                  </button>
                </div>
              </div>
              <p v-else class="text-sm text-base-content/50">暂无图片，点击上方按钮添加</p>
            </div>
          </div>
          <div class="flex gap-2">
            <button type="button" class="btn btn-primary" :disabled="saving" @click="save">
              {{ saving ? '保存中…' : (isNew ? '创建' : '保存') }}
            </button>
            <button type="button" class="btn btn-ghost" :disabled="saving" @click="back">取消</button>
          </div>
        </div>
      </template>
    </div>
  </div>

  <!-- Toast 提示 -->
  <Toast ref="toastRef" />
  
  <!-- 确认对话框 -->
  <ConfirmDialog
    v-model:visible="confirmDialogVisible"
    :title="confirmDialogTitle"
    :message="confirmDialogMessage"
    @confirm="confirmDialogResolve"
    @cancel="confirmDialogReject"
  />
</template>
