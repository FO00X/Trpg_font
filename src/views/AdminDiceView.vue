<template>
  <div class="flex flex-col h-full relative bg-base-100">
    <PageHeader v-if="standalone" title="骰子设置" icon="mdi:dice-multiple-outline">
      <template #actions>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="btn btn-ghost btn-sm"
            :disabled="loading || saving"
            title="恢复默认"
            @click="resetToDefaults"
          >
            <Icon icon="mdi:restore" class="text-xl" />
          </button>
          <button
            type="button"
            class="btn btn-primary btn-sm"
            :disabled="loading || saving"
            title="保存设置"
            @click="saveConfig"
          >
            <Icon :icon="saving ? 'mdi:loading' : 'mdi:content-save-outline'" class="text-xl" :class="{ 'animate-spin': saving }" />
          </button>
        </div>
      </template>
    </PageHeader>

    <div :class="standalone ? 'flex-1 overflow-y-auto scroll-thin p-4' : 'min-h-0'">
      <div class="max-w-2xl mx-auto space-y-6">
        <div class="bg-base-200/50 rounded-3xl p-6 md:p-8 space-y-6">
          <div>
            <h2 class="text-xl font-bold text-base-content mb-2 flex items-center gap-2">
              <Icon icon="mdi:dice-multiple-outline" /> 3D 骰子参数
            </h2>
          </div>

          <div v-if="loading" class="flex items-center gap-2 text-base-content/60 py-4">
            <span class="loading loading-spinner loading-sm"></span>
            加载中…
          </div>
          <template v-else>
          <!-- 外观 -->
          <div class="space-y-4">
            <h3 class="text-sm font-semibold text-base-content/70 uppercase tracking-wider flex items-center gap-2">
              <Icon icon="mdi:palette-outline" class="text-base" /> 外观
            </h3>
            <div class="form-control flex-1">
              <label class="label">
                <span class="label-text font-medium">主题色</span>
              </label>
            <div class="flex items-center gap-3">
                <input
                  v-model="form.themeColor"
                  type="color"
                  class="w-10 h-10 rounded-lg cursor-pointer border border-base-300"
                />
                <input
                  v-model="form.themeColor"
                  type="text"
                  class="input input-bordered w-full max-w-[10rem] rounded-xl font-mono text-sm"
                  placeholder="#4826F2"
                />
                <div class="form-control flex-1">
              <label class="label cursor-pointer justify-start gap-3">
                <input v-model="form.shadows" type="checkbox" class="checkbox checkbox-primary" />
                <span class="label-text">开启阴影</span>
              </label>
          </div>
              </div>
            </div>

            <div class="form-control w-full">
              <label class="label">
                <span class="label-text font-medium">光效强度</span>
                <span class="label-text-alt text-base-content/50">0 ~ 2</span>
              </label>
              <input
                v-model.number="form.lightIntensity"
                type="range"
                min="0"
                max="2"
                step="0.1"
                class="range range-primary range-sm"
              />
              <div class="w-full flex justify-between text-xs text-base-content/50 px-1">
                <span>0</span>
                <span>{{ form.lightIntensity }}</span>
                <span>2</span>
              </div>
            </div>
          </div>

          <div class="divider my-2"></div>

          <!-- 尺寸与力度 -->
          <div class="space-y-4">
            <h3 class="text-sm font-semibold text-base-content/70 uppercase tracking-wider flex items-center gap-2">
              <Icon icon="mdi:arrow-up-down" class="text-base" /> 尺寸与力度
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="flex items-center gap-3">
                <div class="w-28 shrink-0 text-sm font-medium text-base-content/80">骰子缩放</div>
                <input
                  v-model.number="form.scale"
                  type="number"
                  min="1"
                  max="10"
                  step="0.5"
                  class="input input-bordered w-full rounded-xl"
                />
              </div>
              <div class="flex items-center gap-3">
                <div class="w-28 shrink-0 text-sm font-medium text-base-content/80">起始高度</div>
                <input
                  v-model.number="form.startingHeight"
                  type="number"
                  min="1"
                  max="20"
                  step="0.5"
                  class="input input-bordered w-full rounded-xl"
                />
              </div>
              <div class="flex items-center gap-3">
                <div class="w-28 shrink-0 text-sm font-medium text-base-content/80">投掷力度</div>
                <input
                  v-model.number="form.throwForce"
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  class="input input-bordered w-full rounded-xl"
                />
              </div>
              <div class="flex items-center gap-3">
                <div class="w-28 shrink-0 text-sm font-medium text-base-content/80">旋转力度</div>
                <input
                  v-model.number="form.spinForce"
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  class="input input-bordered w-full rounded-xl"
                />
              </div>
              <div class="flex items-center gap-3">
                <div class="w-28 shrink-0 text-sm font-medium text-base-content/80">投掷力度分散</div>
                <input
                  v-model.number="form.throwForceSpread"
                  type="number"
                  min="0"
                  max="5"
                  step="0.5"
                  class="input input-bordered w-full rounded-xl"
                />
              </div>
              <div class="flex items-center gap-3">
                <div class="w-28 shrink-0 text-sm font-medium text-base-content/80">旋转力度分散</div>
                <input
                  v-model.number="form.spinForceSpread"
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  class="input input-bordered w-full rounded-xl"
                />
              </div>
            </div>
          </div>

          <div class="divider my-2"></div>

          <!-- 物理 -->
          <div class="space-y-4">
            <h3 class="text-sm font-semibold text-base-content/70 uppercase tracking-wider flex items-center gap-2">
              <Icon icon="hugeicons:physics" class="text-base" /> 物理
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="flex items-center gap-3">
                <div class="w-28 shrink-0 text-sm font-medium text-base-content/80">重力</div>
                <input
                  v-model.number="form.gravity"
                  type="number"
                  min="0"
                  max="15"
                  step="0.5"
                  class="input input-bordered w-full rounded-xl"
                />
              </div>
              <div class="flex items-center gap-3">
                <div class="w-28 shrink-0 text-sm font-medium text-base-content/80">质量</div>
                <input
                  v-model.number="form.mass"
                  type="number"
                  min="0.1"
                  max="10"
                  step="0.5"
                  class="input input-bordered w-full rounded-xl"
                />
              </div>
              <div class="flex items-center gap-3">
                <div class="w-28 shrink-0 text-sm font-medium text-base-content/80">摩擦系数</div>
                <input
                  v-model.number="form.friction"
                  type="number"
                  min="0"
                  max="1"
                  step="0.05"
                  class="input input-bordered w-full rounded-xl"
                />
              </div>
              <div class="flex items-center gap-3">
                <div class="w-28 shrink-0 text-sm font-medium text-base-content/80">弹性（反弹）</div>
                <input
                  v-model.number="form.restitution"
                  type="number"
                  min="0"
                  max="1"
                  step="0.05"
                  class="input input-bordered w-full rounded-xl"
                />
              </div>
              <div class="flex items-center gap-3">
                <div class="w-28 shrink-0 text-sm font-medium text-base-content/80">线性阻尼</div>
                <input
                  v-model.number="form.linearDamping"
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  class="input input-bordered w-full rounded-xl"
                />
              </div>
              <div class="flex items-center gap-3">
                <div class="w-28 shrink-0 text-sm font-medium text-base-content/80">角阻尼</div>
                <input
                  v-model.number="form.angularDamping"
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  class="input input-bordered w-full rounded-xl"
                />
              </div>
            </div>
          </div>

          <div class="divider my-2"></div>

          <!-- 其他 -->
          <div class="space-y-4">
            <h3 class="text-sm font-semibold text-base-content/70 uppercase tracking-wider flex items-center gap-2">
              <Icon icon="mdi:cog-outline" class="text-base" /> 其他
            </h3>
            <div class="flex items-center gap-3">
              <div class="w-28 shrink-0">
                <div class="text-sm font-medium text-base-content/80">延迟 (ms)</div>
                <div class="text-xs text-base-content/50 mt-0.5">投掷前延迟</div>
              </div>
              <input
                v-model.number="form.delay"
                type="number"
                min="0"
                max="500"
                step="10"
                class="input input-bordered w-full max-w-40 rounded-xl"
              />
            </div>
            <div class="flex items-center justify-between gap-3">
              <div class="min-w-0">
                <div class="text-sm font-medium text-base-content/80">离屏渲染</div>
                <div class="text-xs text-base-content/50 mt-0.5">可提升性能</div>
              </div>
              <input v-model="form.offscreen" type="checkbox" class="checkbox checkbox-primary shrink-0" />
            </div>
          </div>

          <div v-if="standalone" class="pt-4 flex flex-wrap gap-3">
            <button
              type="button"
              class="btn btn-outline rounded-xl active:scale-95 transition-transform"
              @click="resetToDefaults"
            >
              <Icon icon="mdi:restore" class="text-lg" />
              恢复默认
            </button>
            <button
              type="button"
              class="btn btn-primary rounded-xl active:scale-95 transition-transform"
              :disabled="saving"
              @click="saveConfig"
            >
              <Icon v-if="saving" icon="mdi:loading" class="animate-spin text-lg" />
              <Icon v-else icon="mdi:content-save-outline" class="text-lg" />
              {{ saving ? '保存中…' : '保存设置' }}
            </button>
          </div>
          </template>
        </div>

      </div>
    </div>

    <div class="fab">
  <div tabindex="0" role="button" class="btn btn-lg btn-circle btn-primary">
    <Icon icon="mdi:dice-5-outline" class="text-2xl" />
  </div>

  <div class="fab-close"><span class="btn btn-circle btn-lg btn-error">✕</span></div>

  <div><button class="btn btn-lg btn-circle" @click="testRoll('1d4')"><Icon icon="mdi:dice-d4-outline" class="text-2xl" /></button></div>
  <div><button class="btn btn-lg btn-circle" @click="testRoll('1d6')"><Icon icon="mdi:dice-d6-outline" class="text-2xl" /></button></div>
  <div><button class="btn btn-lg btn-circle" @click="testRoll('1d8')"><Icon icon="mdi:dice-d8-outline" class="text-2xl" /></button></div>
  <div><button class="btn btn-lg btn-circle" @click="testRoll('1d10')"><Icon icon="mdi:dice-d10-outline" class="text-2xl" /></button></div>
  <div><button class="btn btn-lg btn-circle" @click="testRoll('1d12')"><Icon icon="mdi:dice-d12-outline" class="text-2xl" /></button></div>
  <div><button class="btn btn-lg btn-circle" @click="testRoll('1d20')"><Icon icon="mdi:dice-d20-outline" class="text-2xl" /></button></div>
</div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { Icon } from '@iconify/vue'
import PageHeader from '../components/PageHeader.vue'
import { useDiceConfig } from '../stores/diceConfig'
import { useDice3D } from '../composables/useDice3D'
import { useToast } from '../composables/useToast'

defineProps({
  standalone: { type: Boolean, default: true },
})

const { config, loadFromServer, save, resetAndSave, defaults } = useDiceConfig()
const { roll, updateConfig: updateDiceBoxConfig, reloadConfigFromServer } = useDice3D()
const toast = useToast()
const saving = ref(false)
const loading = ref(true)

const form = reactive({
  themeColor: '',
  scale: 3,
  spinForce: 3,
  throwForce: 2,
  startingHeight: 8,
  gravity: 3,
  mass: 3,
  friction: 0.4,
  restitution: 0.3,
  linearDamping: 0.5,
  angularDamping: 0.4,
  spinForceSpread: 3,
  throwForceSpread: 0,
  lightIntensity: 0.8,
  shadows: true,
  delay: 50,
  offscreen: true,
})

function syncFormFromConfig() {
  form.themeColor = config.value.themeColor ?? defaults.themeColor
  form.scale = config.value.scale ?? defaults.scale
  form.spinForce = config.value.spinForce ?? defaults.spinForce
  form.throwForce = config.value.throwForce ?? defaults.throwForce
  form.startingHeight = config.value.startingHeight ?? defaults.startingHeight
  form.gravity = config.value.gravity ?? defaults.gravity
  form.mass = config.value.mass ?? defaults.mass
  form.friction = config.value.friction ?? defaults.friction
  form.restitution = config.value.restitution ?? defaults.restitution
  form.linearDamping = config.value.linearDamping ?? defaults.linearDamping
  form.angularDamping = config.value.angularDamping ?? defaults.angularDamping
  form.spinForceSpread = config.value.spinForceSpread ?? defaults.spinForceSpread
  form.throwForceSpread = config.value.throwForceSpread ?? defaults.throwForceSpread
  form.lightIntensity = config.value.lightIntensity ?? defaults.lightIntensity
  form.shadows = config.value.shadows ?? defaults.shadows
  form.delay = config.value.delay ?? defaults.delay
  form.offscreen = config.value.offscreen ?? defaults.offscreen
}

async function saveConfig() {
  saving.value = true
  try {
    await save({
      themeColor: form.themeColor,
      scale: Number(form.scale),
      spinForce: Number(form.spinForce),
      throwForce: Number(form.throwForce),
      startingHeight: Number(form.startingHeight),
      gravity: Number(form.gravity),
      mass: Number(form.mass),
      friction: Number(form.friction),
      restitution: Number(form.restitution),
      linearDamping: Number(form.linearDamping),
      angularDamping: Number(form.angularDamping),
      spinForceSpread: Number(form.spinForceSpread),
      throwForceSpread: Number(form.throwForceSpread),
      lightIntensity: Number(form.lightIntensity),
      shadows: Boolean(form.shadows),
      delay: Number(form.delay),
      offscreen: Boolean(form.offscreen),
    })
    toast.success('已保存到数据库，下次投骰时生效。')
  } catch (e) {
    toast.error('保存失败：' + (e?.message || String(e)))
  } finally {
    saving.value = false
  }
}

async function resetToDefaults() {
  try {
    await resetAndSave()
    syncFormFromConfig()
    toast.success('已恢复默认并保存到数据库。')
  } catch (e) {
    toast.error('恢复默认失败：' + (e?.message || String(e)))
  }
}

onMounted(async () => {
  loading.value = true
  try {
    await loadFromServer()
    syncFormFromConfig()
  } catch (e) {
    toast.error('加载配置失败：' + (e?.message || String(e)))
  } finally {
    loading.value = false
  }
})

function buildPreviewConfig() {
  return {
    themeColor: form.themeColor,
    scale: Number(form.scale),
    spinForce: Number(form.spinForce),
    throwForce: Number(form.throwForce),
    startingHeight: Number(form.startingHeight),
    gravity: Number(form.gravity),
    mass: Number(form.mass),
    friction: Number(form.friction),
    restitution: Number(form.restitution),
    linearDamping: Number(form.linearDamping),
    angularDamping: Number(form.angularDamping),
    spinForceSpread: Number(form.spinForceSpread),
    throwForceSpread: Number(form.throwForceSpread),
    lightIntensity: Number(form.lightIntensity),
    enableShadows: Boolean(form.shadows),
    delay: Number(form.delay),
    offscreen: Boolean(form.offscreen),
  }
}

async function testRoll(notation) {
  try {
    // 用当前页面的临时数据更新 DiceBox，再投骰
    updateDiceBoxConfig(buildPreviewConfig())
    await roll(notation)
  } catch (e) {
    toast.error('投骰失败：' + (e?.message || String(e)))
  }
}

onBeforeUnmount(() => {
  // 离开本页后，恢复为数据库配置，避免影响其他页面
  reloadConfigFromServer().catch(() => {})
})

defineExpose({
  saveConfig,
  resetToDefaults,
  saving,
  loading,
})
</script>
