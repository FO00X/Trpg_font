<template>
  <div class="flex flex-col h-full">
    <PageHeader
      v-if="standalone"
      title="成就管理"
      icon="mdi:trophy-outline"
    >
      <template #actions>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="btn btn-ghost btn-sm"
            :disabled="loading"
            title="刷新"
            @click="load"
          >
            <Icon icon="mdi:refresh" class="text-xl" />
          </button>
          <button
            type="button"
            class="btn btn-primary btn-sm"
            :disabled="loading || saving || !isAdmin"
            title="新建成就"
            @click="startCreate"
          >
            <Icon icon="mdi:plus" class="text-xl" />
          </button>
        </div>
      </template>
    </PageHeader>

    <div :class="standalone ? 'flex-1 overflow-y-auto scroll-thin p-4' : 'min-h-0'">
      <p v-if="!isAdmin" class="text-base-content text-center py-8">
        你没有权限查看此页面。
      </p>
      <template v-else>
        <div class="max-w-4xl mx-auto space-y-2">
          <div v-if="error" class="alert alert-error text-sm">
            {{ error }}
          </div>

          <!-- 编辑 / 新建表单 -->
          <div
            v-if="editing"
            class="card card-bordered bg-base-200/60"
          >
            <div class="p-2">
              <div class="flex items-center justify-between gap-2">
                <h2 class="card-title text-base-content text-base">
                  {{ creating ? '新建成就' : '编辑成就' }}
                </h2>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    class="btn btn-ghost btn-xs"
                    :disabled="saving"
                    @click="cancelEdit"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    class="btn btn-primary btn-xs"
                    :disabled="saving"
                    @click="save"
                  >
                    <Icon
                      :icon="saving ? 'mdi:loading' : 'mdi:content-save-outline'"
                      class="text-lg"
                      :class="{ 'animate-spin': saving }"
                    />
                    <span class="ml-1">保存</span>
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div class="form-control">
                  <label class="label">
                    <span class="label-text font-medium">成就 ID</span>
                    <span class="label-text-alt text-xs text-base-content/50">仅英文/数字/下划线</span>
                  </label>
                  <input
                    v-model="form.id"
                    type="text"
                    class="input input-bordered input-sm rounded-xl font-mono"
                    :disabled="!creating"
                    placeholder="如 first_message"
                  />
                </div>

                <div class="form-control">
                  <label class="label">
                    <span class="label-text font-medium">名称</span>
                  </label>
                  <input
                    v-model="form.title"
                    type="text"
                    class="input input-bordered input-sm rounded-xl"
                    placeholder="如 开口说话"
                  />
                </div>

                <div class="form-control">
                  <label class="label">
                    <span class="label-text font-medium">分类</span>
                  </label>
                  <input
                    v-model="form.category"
                    type="text"
                    class="input input-bordered input-sm rounded-xl"
                    placeholder="如 聊天 / 掷骰 / 笔记 / 跑团"
                  />
                </div>

                <div class="form-control">
                  <label class="label">
                    <span class="label-text font-medium">图标</span>
                    <span class="label-text-alt text-xs text-base-content/50">Iconify 名称，默认 mdi:trophy-outline</span>
                  </label>
                  <input
                    v-model="form.icon"
                    type="text"
                    class="input input-bordered input-sm rounded-xl font-mono"
                    placeholder="mdi:trophy-outline"
                  />
                </div>

                <div class="form-control">
                  <label class="label">
                    <span class="label-text font-medium">统计键（stat_key）</span>
                    <span class="label-text-alt text-xs text-base-content/50">决定由哪个事件触发</span>
                  </label>
                  <select
                    v-model="form.stat_key"
                    class="select select-bordered select-sm rounded-xl"
                  >
                    <option value="messagesSent">messagesSent（发送消息次数）</option>
                    <option value="diceRolls">diceRolls（掷骰次数）</option>
                    <option value="diceCriticalSuccess">diceCriticalSuccess（大成功次数）</option>
                    <option value="diceCriticalFail">diceCriticalFail（大失败次数）</option>
                    <option value="diceSuccess">diceSuccess（检定成功次数）</option>
                    <option value="diceFail">diceFail（检定失败次数）</option>
                    <option value="diceOnTheLine">diceOnTheLine（卡线次数）</option>
                    <option value="notesCreated">notesCreated（创建笔记次数）</option>
                    <option value="roomsCreated">roomsCreated（创建房间次数）</option>
                  </select>
                </div>

                <div class="form-control">
                  <label class="label">
                    <span class="label-text font-medium">数值（threshold）</span>
                    <span class="label-text-alt text-xs text-base-content/50">达到此次数后解锁</span>
                  </label>
                  <input
                    v-model.number="form.threshold"
                    type="number"
                    min="1"
                    class="input input-bordered input-sm rounded-xl"
                  />
                </div>

                <div class="form-control">
                  <label class="label">
                    <span class="label-text font-medium">排序（sort_order）</span>
                    <span class="label-text-alt text-xs text-base-content/50">越小越靠前，可选</span>
                  </label>
                  <input
                    v-model.number="form.sort_order"
                    type="number"
                    class="input input-bordered input-sm rounded-xl"
                  />
                </div>

                <div class="form-control">
                  <label class="label cursor-pointer">
                    <span class="label-text font-medium">是否启用</span>
                  </label>
                  <label class="label cursor-pointer justify-start gap-3">
                    <input
                      v-model="form.enabled"
                      type="checkbox"
                      class="checkbox checkbox-primary checkbox-sm"
                    />
                    <span class="label-text text-sm">启用（玩家可见且可解锁）</span>
                  </label>
                </div>
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium">描述</span>
                </label>
                <textarea
                  v-model="form.description"
                  rows="3"
                  class="textarea textarea-bordered text-sm rounded-xl"
                  placeholder="例如：在任意房间发送第一条聊天消息"
                />
              </div>
            </div>
          </div>

          <!-- 列表 -->
          <LoadingSpinner v-if="loading" message="加载中…" />
          <div            v-else-if="!editing && !creating && !loading"
            class="card card-bordered bg-base-200/40 overflow-hidden"
          >
            <div class="overflow-x-auto">
              <table class="table table-zebra table-sm">
                <thead>
                  <tr>
                    <th class="text-base-content/70">名称</th>
                    <th class="text-base-content/70">分类</th>
                    <th class="text-base-content/70 text-right">数值</th>
                    <th class="text-base-content/70 text-center">启用</th>
                    <th class="text-base-content/70 w-28 text-center">操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="list.length === 0">
                    <td colspan="7" class="text-center text-base-content/60 py-6">
                      暂无成就配置，点击右上角「新建成就」添加。
                    </td>
                  </tr>
                  <tr
                    v-for="row in list"
                    :key="row.id"
                  >
                    <td class="text-sm max-w-[160px] truncate">
                      {{ row.title }}
                    </td>
                    <td class="text-xs text-base-content/70 max-w-[100px] truncate">
                      {{ row.category || '—' }}
                    </td>
                    <td class="text-right text-sm">
                      {{ row.threshold }}
                    </td>
                    <td class="text-center">
                      <input
                        type="checkbox"
                        class="toggle toggle-sm toggle-primary"
                        :checked="row.enabled !== false"
                        :disabled="saving"
                        :aria-label="row.enabled !== false ? '启用' : '停用'"
                        @change="toggleEnabled(row)"
                      />
                    </td>
                    <td class="text-center">
                      <div class="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          class="btn btn-ghost btn-xs btn-circle"
                          title="编辑"
                          :disabled="saving"
                          @click="startEdit(row)"
                        >
                          <Icon icon="mdi:pencil" class="text-lg" />
                        </button>
                        <button
                          type="button"
                          class="btn btn-ghost btn-xs btn-circle text-error"
                          title="删除"
                          :disabled="saving"
                          @click="remove(row)"
                        >
                          <Icon icon="mdi:delete-outline" class="text-lg" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import PageHeader from '../components/PageHeader.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'
import { useToast } from '../composables/useToast'

defineProps({
  standalone: { type: Boolean, default: true },
})

const auth = useAuthStore()
const toast = useToast()

const isAdmin = computed(() => auth.user?.value?.role === 'admin')

const list = ref([])
const loading = ref(false)
const saving = ref(false)
const error = ref('')

const editing = ref(false)
const creating = ref(false)
const editingId = ref(null)

const form = ref({
  id: '',
  title: '',
  description: '',
  category: '',
  icon: 'mdi:trophy-outline',
  stat_key: 'messagesSent',
  threshold: 1,
  sort_order: 0,
  enabled: true,
})

function resetForm() {
  form.value = {
    id: '',
    title: '',
    description: '',
    category: '',
    icon: 'mdi:trophy-outline',
    stat_key: 'messagesSent',
    threshold: 1,
    sort_order: 0,
    enabled: true,
  }
}

function startCreate() {
  resetForm()
  editing.value = true
  creating.value = true
  editingId.value = null
}

function startEdit(row) {
  editing.value = true
  creating.value = false
  editingId.value = row.id
  form.value = {
    id: row.id,
    title: row.title || '',
    description: row.description || '',
    category: row.category || '',
    icon: row.icon || 'mdi:trophy-outline',
    stat_key: row.stat_key || 'messagesSent',
    threshold: row.threshold ?? 1,
    sort_order: row.sort_order ?? 0,
    enabled: row.enabled !== false,
  }
}

function cancelEdit() {
  if (saving.value) return
  editing.value = false
  creating.value = false
  editingId.value = null
}

async function load() {
  if (!isAdmin.value) return
  loading.value = true
  error.value = ''
  try {
    const { data, error: err } = await supabase
      .from('achievements')
      .select('id, title, description, category, icon, stat_key, threshold, enabled, sort_order')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
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

async function save() {
  if (!isAdmin.value) {
    error.value = '仅管理员可以编辑成就'
    return
  }
  const id = (form.value.id || '').trim()
  const title = (form.value.title || '').trim()
  const statKey = (form.value.stat_key || '').trim()
  const threshold = Number(form.value.threshold || 1) || 1

  if (!id) {
    error.value = '请填写成就 ID'
    return
  }
  if (!/^[a-zA-Z0-9_:-]+$/.test(id)) {
    error.value = '成就 ID 仅支持字母、数字、下划线、冒号和短横线'
    return
  }
  if (!title) {
    error.value = '请填写成就名称'
    return
  }
  if (!statKey) {
    error.value = '请选择统计键（stat_key）'
    return
  }

  saving.value = true
  error.value = ''
  try {
    const payload = {
      id,
      title,
      description: (form.value.description || '').trim(),
      category: (form.value.category || '').trim() || '其他',
      icon: (form.value.icon || '').trim() || 'mdi:trophy-outline',
      stat_key: statKey,
      threshold,
      enabled: !!form.value.enabled,
      sort_order: Number(form.value.sort_order ?? 0) || 0,
      updated_at: new Date().toISOString(),
    }

    if (creating.value) {
      const { data, error: err } = await supabase
        .from('achievements')
        .insert({
          ...payload,
          created_at: new Date().toISOString(),
        })
        .select('id, title, description, category, icon, stat_key, threshold, enabled, sort_order')
        .single()
      if (err) {
        error.value = err.message || '保存失败'
        return
      }
      list.value = [...list.value, data]
      toast.success('成就已创建')
    } else if (editingId.value) {
      const { data, error: err } = await supabase
        .from('achievements')
        .update(payload)
        .eq('id', editingId.value)
        .select('id, title, description, category, icon, stat_key, threshold, enabled, sort_order')
        .single()
      if (err) {
        error.value = err.message || '保存失败'
        return
      }
      const idx = list.value.findIndex((x) => x.id === editingId.value)
      if (idx >= 0) {
        const next = [...list.value]
        next[idx] = data
        list.value = next
      }
      toast.success('成就已更新')
    }

    editing.value = false
    creating.value = false
    editingId.value = null
  } finally {
    saving.value = false
  }
}

async function toggleEnabled(row) {
  if (!isAdmin.value || saving.value) return
  const nextEnabled = !(row.enabled !== false)
  saving.value = true
  error.value = ''
  try {
    const { data, error: err } = await supabase
      .from('achievements')
      .update({ enabled: nextEnabled, updated_at: new Date().toISOString() })
      .eq('id', row.id)
      .select('id, title, description, category, icon, stat_key, threshold, enabled, sort_order')
      .single()
    if (err) {
      error.value = err.message || '更新失败'
      return
    }
    const idx = list.value.findIndex((x) => x.id === row.id)
    if (idx >= 0) {
      const next = [...list.value]
      next[idx] = { ...next[idx], ...data }
      list.value = next
    }
    toast.success(nextEnabled ? '已启用' : '已停用')
  } finally {
    saving.value = false
  }
}

async function remove(row) {
  if (!isAdmin.value || saving.value) return
  // 简单确认
  // eslint-disable-next-line no-alert
  const confirmed = window.confirm(`确定删除成就「${row.title || row.id}」吗？此操作不可恢复。`)
  if (!confirmed) return

  saving.value = true
  error.value = ''
  try {
    const { error: err } = await supabase
      .from('achievements')
      .delete()
      .eq('id', row.id)
    if (err) {
      error.value = err.message || '删除失败'
      return
    }
    list.value = list.value.filter((x) => x.id !== row.id)
    toast.success('成就已删除')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  if (isAdmin.value) load()
})

defineExpose({ load, loading })
</script>

