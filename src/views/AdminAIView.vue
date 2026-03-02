<template>
  <div class="flex flex-col h-full bg-base-100">
    <PageHeader title="AI管理" icon="mdi:robot-outline" />

    <div class="flex-1 overflow-y-auto scroll-thin p-6">
      <div class="max-w-2xl mx-auto">
        <div class="bg-base-200/50 rounded-3xl p-6 md:p-8 space-y-6">
          <div>
            <h2 class="text-xl font-bold text-base-content mb-2 flex items-center gap-2">
              <Icon icon="mdi:cog-outline" /> AI API 设置
            </h2>
            <p class="text-sm text-base-content/60">
              设置用于日志转小说等功能的 AI 接口参数。该接口需兼容 OpenAI 的 Chat Completions 格式。
            </p>
          </div>

          <div v-if="loading" class="flex items-center gap-2 text-base-content/60">
            <span class="loading loading-spinner loading-sm"></span> 加载中...
          </div>
          <div v-else-if="error" class="alert alert-error">
            <Icon icon="mdi:alert-circle-outline" class="text-xl" />
            <span>{{ error }}</span>
          </div>
          <div v-else class="space-y-4">
            <div class="form-control w-full">
              <label class="label">
                <span class="label-text font-medium">API URL</span>
              </label>
              <input
                v-model="form.apiUrl"
                type="text"
                placeholder="https://api.openai.com/v1/chat/completions"
                class="input input-bordered w-full rounded-xl focus:border-primary/50 focus:bg-base-100 transition-colors bg-base-100"
              />
            </div>

            <div class="form-control w-full">
              <label class="label">
                <span class="label-text font-medium">API Key</span>
              </label>
              <input
                v-model="form.apiKey"
                type="password"
                placeholder="sk-..."
                class="input input-bordered w-full rounded-xl focus:border-primary/50 focus:bg-base-100 transition-colors bg-base-100"
              />
            </div>

            <div class="form-control w-full ">
              <label class="label flex items-center justify-between">
                <span class="label-text font-medium">模型 (Model)</span>
                <span v-if="loadingModels" class="label-text-alt text-base-content/60 flex items-center gap-1">
                  <span class="loading loading-spinner loading-xs"></span> 获取中...
                </span>
                <button
                  v-else
                  type="button"
                  class="label-text-alt text-primary hover:underline flex items-center gap-1"
                  @click="fetchModels"
                  :disabled="!form.apiUrl || !form.apiKey"
                  title="重新获取模型列表"
                >
                  <Icon icon="mdi:refresh" class="text-xl" /> 
                </button>
              </label>
              <select
                v-model="form.model"
                class="select select-bordered w-full rounded-xl focus:border-primary/50 focus:bg-base-100 transition-colors bg-base-100"
                :disabled="loadingModels || !displayModels.length"
              >
                <option value="" disabled selected>{{ displayModels.length ? '请选择一个模型' : '请先填写 URL 和 Key，然后刷新模型' }}</option>
                <option v-for="model in displayModels" :key="model" :value="model">
                  {{ model === form.model && !availableModels.includes(form.model) ? `${model} (当前保存的值)` : model }}
                </option>
              </select>
              <label class="label" v-if="modelFetchError">
                <span class="label-text-alt text-error">{{ modelFetchError }}</span>
              </label>
            </div>
            
            <div class="pt-4 flex gap-3">
              <button
                type="button"
                class="btn btn-outline rounded-xl flex-1 active:scale-95 transition-transform"
                :disabled="testing"
                @click="testConfig"
              >
                <Icon v-if="testing" icon="mdi:loading" class="animate-spin text-lg" />
                <Icon v-else icon="mdi:flask-outline" class="text-lg" />
                {{ testing ? '测试中...' : '测试连接' }}
              </button>
              <button
                type="button"
                class="btn btn-primary rounded-xl flex-1 active:scale-95 transition-transform"
                :disabled="saving"
                @click="saveConfig"
              >
                <Icon v-if="saving" icon="mdi:loading" class="animate-spin text-lg" />
                <Icon v-else icon="mdi:content-save-outline" class="text-lg" />
                {{ saving ? '保存中...' : '保存设置' }}
              </button>
            </div>
          </div>
        </div>
        
        <div v-if="testResult" class="mt-4 p-4 rounded-xl border" :class="testResult.success ? 'bg-success/10 border-success/30 text-success-content' : 'bg-error/10 border-error/30 text-error-content'">
          <div class="flex items-center gap-2 font-bold mb-1">
            <Icon :icon="testResult.success ? 'mdi:check-circle-outline' : 'mdi:close-circle-outline'" class="text-xl" />
            {{ testResult.success ? '连接成功' : '连接失败' }}
          </div>
          <div class="text-sm whitespace-pre-wrap break-words">{{ testResult.message }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import PageHeader from '../components/PageHeader.vue'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const loading = ref(true)
const saving = ref(false)
const testing = ref(false)
const error = ref('')
const testResult = ref(null)

const loadingModels = ref(false)
const modelFetchError = ref('')
const availableModels = ref([])

const form = ref({
  apiUrl: 'https://api.openai.com/v1/chat/completions',
  apiKey: '',
  model: 'gpt-4o-mini'
})

const displayModels = computed(() => {
  const list = [...availableModels.value]
  if (form.value.model && !list.includes(form.value.model)) {
    list.unshift(form.value.model)
  }
  return list
})

onMounted(async () => {
  await fetchConfig()
})

async function fetchConfig() {
  loading.value = true
  error.value = ''
  try {
    const { data, error: err } = await supabase
      .from('system_settings')
      .select('value')
      .eq('id', 'ai_config')
      .single()
    
    if (err && err.code !== 'PGRST116') throw err
    
    if (data?.value) {
      form.value.apiUrl = data.value.apiUrl || form.value.apiUrl
      form.value.apiKey = data.value.apiKey || ''
      form.value.model = data.value.model || form.value.model
      
      // 如果有 API URL 和 Key，尝试自动获取模型列表
      if (form.value.apiUrl && form.value.apiKey) {
        fetchModels()
      }
    }
  } catch (e) {
    error.value = '加载配置失败：' + e.message
  } finally {
    loading.value = false
  }
}

async function testConfig() {
  testing.value = true
  testResult.value = null
  try {
    const res = await fetch(form.value.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${form.value.apiKey}`
      },
      body: JSON.stringify({
        model: form.value.model,
        messages: [{ role: 'user', content: '测试：请回复"收到"' }]
      })
    })
    
    if (!res.ok) {
      const txt = await res.text()
      throw new Error(`HTTP 错误 ${res.status}: ${txt}`)
    }
    
    const json = await res.json()
    const content = json.choices?.[0]?.message?.content
    
    if (content) {
      testResult.value = {
        success: true,
        message: `API 响应正常。\nAI 回复内容：${content}`
      }
    } else {
      throw new Error(`响应格式异常：\n${JSON.stringify(json, null, 2)}`)
    }
  } catch (e) {
    testResult.value = {
      success: false,
      message: e.message
    }
  } finally {
    testing.value = false
  }
}

async function fetchModels() {
  if (!form.value.apiUrl || !form.value.apiKey) {
    modelFetchError.value = '请先填写 API URL 和 API Key'
    return
  }
  
  loadingModels.value = true
  modelFetchError.value = ''
  
  try {
    // 解析出基础 URL（移除 /chat/completions 等路径）
    let baseUrl = form.value.apiUrl
    if (baseUrl.endsWith('/chat/completions')) {
      baseUrl = baseUrl.replace('/chat/completions', '')
    } else if (baseUrl.endsWith('/completions')) {
      baseUrl = baseUrl.replace('/completions', '')
    }
    
    // 确保有 /v1 前缀（如果原 URL 包含的话，上面替换后通常会保留）
    // 如果没有 /v1，且不是特定平台的定制 URL，大部分兼容 OpenAI 的接口都需要 /v1/models
    const modelsUrl = `${baseUrl}/models`
    
    const res = await fetch(modelsUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${form.value.apiKey}`
      }
    })
    
    if (!res.ok) {
      const txt = await res.text()
      throw new Error(`获取失败 (${res.status}): ${txt.substring(0, 100)}...`)
    }
    
    const json = await res.json()
    if (json && json.data && Array.isArray(json.data)) {
      // 提取模型 ID 并排序
      availableModels.value = json.data
        .map(m => m.id)
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b))
        
      if (availableModels.value.length === 0) {
        throw new Error('接口返回了空模型列表')
      }
      
      // 如果当前没有选择模型，或者选择的模型不在列表中，且列表不为空，默认选择第一个
      if (!form.value.model || (!availableModels.value.includes(form.value.model) && availableModels.value.length > 0)) {
        // 如果表单里的模型在可选列表里没有，我们保留它作为自定义选项（在模板中处理），
        // 但如果有 "gpt-3.5-turbo" 或 "gpt-4o-mini" 等常见模型，优先选择它们
        const preferred = availableModels.value.find(m => m.includes('gpt-4o-mini')) || 
                          availableModels.value.find(m => m.includes('gpt-3.5')) ||
                          availableModels.value[0]
        if (!form.value.model) {
          form.value.model = preferred
        }
      }
    } else {
      throw new Error('响应格式异常，未找到模型数据数组')
    }
  } catch (e) {
    modelFetchError.value = `获取模型列表失败：${e.message}`
    console.error('获取模型失败:', e)
  } finally {
    loadingModels.value = false
  }
}

async function saveConfig() {
  saving.value = true
  error.value = ''
  try {
    const { error: err } = await supabase
      .from('system_settings')
      .upsert({
        id: 'ai_config',
        value: {
          apiUrl: form.value.apiUrl,
          apiKey: form.value.apiKey,
          model: form.value.model
        }
      })
    
    if (err) throw err
    
    alert('保存成功！')
  } catch (e) {
    error.value = '保存配置失败：' + e.message
  } finally {
    saving.value = false
  }
}
</script>
