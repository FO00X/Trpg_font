<template>
  <div class="flex flex-col h-full">
    <PageHeader title="用户列表" icon="mdi:account-supervisor">
      <template #actions>
        <button
          type="button"
          class="px-3 py-1.5 rounded-lg text-sm text-accent-muted hover:bg-white/10"
          @click="load"
        >
          刷新
        </button>
      </template>
    </PageHeader>

    <div class="flex-1 overflow-auto scroll-thin p-4">
      <p v-if="!isAdmin" class="text-accent-muted text-center py-8">
        你没有权限查看此页面。
      </p>
      <template v-else>
        <p v-if="error" class="text-red-400 mb-4">{{ error }}</p>
        <LoadingSpinner v-if="loading" message="加载中…" />
        <div v-else-if="list.length === 0" class="text-accent-muted text-center py-8">
          暂无用户数据
        </div>
        <div v-else class="overflow-x-auto rounded-xl border border-chat-border bg-chat-panel">
          <table class="w-full text-sm border-collapse">
            <thead>
              <tr class="border-b border-chat-border bg-chat-bg/80">
                <th class="text-left px-4 py-3 text-accent-muted font-medium">用户名</th>
                <th class="text-left px-4 py-3 text-accent-muted font-medium">邮箱</th>
                <th class="text-left px-4 py-3 text-accent-muted font-medium">用户 ID</th>
                <th class="text-left px-4 py-3 text-accent-muted font-medium">注册时间</th>
                <th class="text-left px-4 py-3 text-accent-muted font-medium w-20">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in list"
                :key="row.id"
                class="border-b border-chat-border/60 hover:bg-white/5 transition-colors"
              >
                <td class="px-4 py-3 max-w-[160px]">
                  <template v-if="editingId === row.id">
                    <input
                      v-model="editingUsername"
                      type="text"
                      class="w-full px-2 py-1 rounded bg-chat-bg border border-chat-border text-white text-sm outline-none focus:border-accent"
                      placeholder="用户名"
                      @keydown.enter="saveUsername(row)"
                      @keydown.esc="editingId = null"
                    />
                  </template>
                  <span v-else class="text-white truncate block max-w-[120px]">{{ row.username || '—' }}</span>
                </td>
                <td class="px-4 py-3 text-white truncate max-w-[200px]">
                  {{ row.email || '—' }}
                </td>
                <td class="px-4 py-3 text-white font-mono text-xs truncate max-w-[200px]" :title="row.id">
                  {{ row.id }}
                </td>
                <td class="px-4 py-3 text-accent-muted whitespace-nowrap">
                  {{ formatDate(row.created_at) }}
                </td>
                <td class="px-4 py-3">
                  <template v-if="editingId === row.id">
                    <button
                      type="button"
                      class="text-xs text-accent hover:underline mr-2"
                      :disabled="saving"
                      @click="saveUsername(row)"
                    >
                      保存
                    </button>
                    <button
                      type="button"
                      class="text-xs text-accent-muted hover:underline"
                      :disabled="saving"
                      @click="editingId = null"
                    >
                      取消
                    </button>
                  </template>
                  <button
                    v-else
                    type="button"
                    class="text-xs text-accent-muted hover:text-accent"
                    title="修改用户名"
                    @click="startEditUsername(row)"
                  >
                    修改
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import PageHeader from '../components/PageHeader.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const isAdmin = computed(() => auth.user?.value?.role === 'admin')

const list = ref([])
const loading = ref(false)
const error = ref('')
const editingId = ref(null)
const editingUsername = ref('')
const saving = ref(false)

function startEditUsername(row) {
  editingId.value = row.id
  editingUsername.value = row.username || ''
}

async function saveUsername(row) {
  const name = (editingUsername.value || '').trim()
  if (row.username === name) {
    editingId.value = null
    return
  }
  saving.value = true
  error.value = ''
  try {
    const { error: err } = await supabase
      .from('profiles')
      .update({ username: name || null, updated_at: new Date().toISOString() })
      .eq('id', row.id)
    if (err) {
      error.value = err.message || '保存失败'
      return
    }
    row.username = name || ''
    editingId.value = null
  } finally {
    saving.value = false
  }
}

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function load() {
  if (!isAdmin.value) return
  loading.value = true
  error.value = ''
  try {
    const { data, err } = await supabase.rpc('admin_list_users')
    if (err) {
      error.value = err.message || '加载失败'
      list.value = []
      return
    }
    list.value = Array.isArray(data) ? data : []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (isAdmin.value) load()
})
</script>
