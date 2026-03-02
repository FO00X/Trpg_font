<template>
  <div class="flex flex-col h-full">
    <PageHeader v-if="standalone" title="用户列表" icon="mdi:account-supervisor">
      <template #actions>
        <button type="button" :disabled="loading" class="btn btn-ghost btn-sm" @click="load">
          <Icon icon="mdi:refresh" class="text-xl" />
        </button>
      </template>
    </PageHeader>

    <div :class="standalone ? 'flex-1 overflow-auto scroll-thin p-4' : ''">
      <p v-if="!isAdmin" class="text-base-content text-center py-8">
        你没有权限查看此页面。
      </p>
      <template v-else>
        <div v-if="error" class="alert alert-error text-sm mb-4">{{ error }}</div>
        <LoadingSpinner v-if="loading" message="加载中…" />
        <div v-else-if="list.length === 0" class="text-base-content text-center py-8">
          暂无用户数据
        </div>
        <div v-else class="card card-bordered bg-base-200 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="table table-zebra">
              <thead>
                <tr>
                  <th class="text-base-content/70">用户名</th>
                  <th class="text-base-content/70">邮箱</th>
                  <th class="text-base-content/70 w-20">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in list" :key="row.id">
                  <td class="max-w-[160px]">
                    <template v-if="editingId === row.id">
                      <input
                        v-model="editingUsername"
                        type="text"
                        class="input w-full"
                        placeholder="用户名"
                        @keydown.enter="saveUsername(row)"
                        @keydown.esc="editingId = null"
                      />
                    </template>
                    <span v-else class="truncate block max-w-[120px]">{{ row.username || '—' }}</span>
                  </td>
                  <td class="truncate max-w-[200px]">{{ row.email || '—' }}</td>
                  <td>
                    <div v-if="editingId === row.id" class="flex items-center">
                      <button
                        type="button"
                        class="btn btn-ghost btn-xs btn-circle mr-1"
                        :disabled="saving"
                        @click="saveUsername(row)"
                      >
                        <Icon icon="mdi:check" class="text-lg" />
                      </button>
                      <button
                        type="button"
                        class="btn btn-ghost btn-xs btn-circle"
                        :disabled="saving"
                        @click="editingId = null"
                      >
                        <Icon icon="mdi:close" class="text-lg" />
                      </button>
                    </div>
                    <button
                      v-else
                      type="button"
                      class="btn btn-ghost btn-xs btn-circle"
                      title="修改用户名"
                      @click="startEditUsername(row)"
                    >
                      <Icon icon="mdi:pencil" class="text-lg" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
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
import { Icon } from '@iconify/vue'

defineProps({
  standalone: { type: Boolean, default: true },
})

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

defineExpose({ load, loading })
</script>
