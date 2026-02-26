<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import PageHeader from '../components/PageHeader.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
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
  if (!confirm('确定删除这条线索？')) return
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
      hide-sidebar
    >
      <template #actions>
        <button
          v-if="!isNew"
          type="button"
          class="p-2 rounded-lg text-red-400 hover:bg-white/10"
          title="删除"
          :disabled="saving"
          @click="removeClue"
        >
          <Icon icon="mdi:delete-outline" class="text-lg" />
        </button>
        <button
          type="button"
          class="p-2 rounded-lg text-accent-muted hover:text-white hover:bg-white/10"
          title="返回"
          @click="back"
        >
          <Icon icon="mdi:arrow-left" class="text-lg" />
        </button>
      </template>
    </PageHeader>
    <div class="flex-1 overflow-y-auto scroll-thin p-4">
      <LoadingSpinner v-if="loading" message="加载中…" />
      <div v-else-if="error" class="text-red-400 mb-4">{{ error }}</div>
      <template v-else>
        <div class="max-w-2xl mx-auto space-y-4">
          <input
            v-model="title"
            type="text"
            placeholder="标题"
            class="w-full px-4 py-3 rounded-xl bg-chat-panel border border-chat-border text-white placeholder-accent-muted focus:border-accent outline-none"
          />
          <textarea
            v-model="content"
            placeholder="内容（可选）…"
            rows="10"
            class="w-full px-4 py-3 rounded-xl bg-chat-panel border border-chat-border text-white placeholder-accent-muted focus:border-accent outline-none resize-y min-h-[200px]"
          />
          <div class="rounded-xl bg-chat-panel border border-chat-border p-4">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-medium text-accent-muted uppercase tracking-wider">图片</h3>
              <label
                class="px-3 py-1.5 rounded-lg bg-accent/20 text-accent text-sm cursor-pointer hover:bg-accent/30 transition-colors"
              >
                <Icon icon="mdi:image-plus" class="inline text-lg mr-1" />
                <span>添加图片</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  class="hidden"
                  :disabled="uploadingImage"
                  @change="handleImageUpload"
                />
              </label>
            </div>
            <div v-if="uploadingImage" class="text-sm text-accent-muted mb-2">上传中…</div>
            <div v-if="imageUrls.length" class="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div
                v-for="(url, index) in imageUrls"
                :key="index"
                class="relative group aspect-square rounded-lg overflow-hidden bg-chat-bg border border-chat-border"
              >
                <img :src="url" alt="" class="w-full h-full object-cover" />
                <button
                  type="button"
                  class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                  @click="removeImage(index)"
                >
                  <Icon icon="mdi:delete" class="text-2xl" />
                </button>
              </div>
            </div>
            <p v-else class="text-sm text-accent-muted">暂无图片，点击上方按钮添加</p>
          </div>
          <div class="flex gap-2">
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
        </div>
      </template>
    </div>
  </div>
</template>
