import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCharactersStore } from '../stores/characters'

const CREDIT_TABLE = [
  { max: 4, creditRating: '无', cash: '$0', spendingLevelDesc: '无', assetsDesc: '一无所有' },
  { max: 9, creditRating: '赤贫', cash: '$5', spendingLevelDesc: '仅能糊口', assetsDesc: '极少' },
  { max: 19, creditRating: '贫困', cash: '$20', spendingLevelDesc: '勉强维持', assetsDesc: '很少' },
  { max: 29, creditRating: '一般偏下', cash: '$50', spendingLevelDesc: '日常温饱', assetsDesc: '有限' },
  { max: 49, creditRating: '一般', cash: '$100', spendingLevelDesc: '一般生活', assetsDesc: '一般' },
  { max: 69, creditRating: '小康', cash: '$200', spendingLevelDesc: '舒适', assetsDesc: '可观' },
  { max: 89, creditRating: '富裕', cash: '$500', spendingLevelDesc: '宽裕', assetsDesc: '丰厚' },
  { max: 99, creditRating: '极富', cash: '$2,000', spendingLevelDesc: '奢华', assetsDesc: '巨额' },
]

export const SHEET_TABS = [
  { id: 'basic', label: '基础信息', icon: 'mdi:account' },
  { id: 'ability', label: '能力体系', icon: 'mdi:sword-cross' },
  { id: 'assets', label: '资产背景', icon: 'mdi:bag-personal' },
  { id: 'social', label: '剧情社交', icon: 'mdi:book-open-variant' },
]

export const genderOptions = [{ value: '男', label: '男' }, { value: '女', label: '女' }]
export const occupationOptions = [
  '医生', '律师', '侦探', '记者', '教授', '学生', '作家', '艺术家', '古董商', '工程师',
  '军人', '警察', '司机', '佣人', '农民', '猎人', '流浪汉', '罪犯', '图书馆管理员',
  '神职人员', '神秘学家', '探险家', '飞行员', '水手', '演员', '舞蹈家', '音乐家', '摄影师',
]

export const inputCls = 'w-full px-3 py-2 rounded-lg bg-chat-bg border border-chat-border text-white placeholder-accent-muted focus:border-accent outline-none'
export const labelCls = 'block text-sm text-[#a6adc8] mb-1'
export const sectionCls = 'rounded-xl bg-chat-panel border border-chat-border p-4'
export const sectionTitleCls = 'text-sm font-medium text-accent-muted uppercase tracking-wider mb-3'

export function useCharacterForm() {
  const route = useRoute()
  const router = useRouter()
  const {
    getById,
    getDefaultSheet,
    getDerived,
    create,
    update,
    PRESET_SKILLS,
    SKILL_TYPE_OPTIONS,
    PRESET_WEAPONS,
    WEAPON_PENETRATE_OPTIONS,
    normalizeWeapons,
  } = useCharactersStore()

  const isNew = computed(() => route.name === 'character-new')
  const id = computed(() => route.params.id)
  const sheetTab = ref('basic')
  const form = ref({ ...getDefaultSheet() })
  const derived = computed(() => getDerived(form.value))
  const syncDerived = computed(() => ({
    hpMax: derived.value.hpMax,
    mpMax: derived.value.mpMax,
    sanInitial: derived.value.sanInitial,
    move: derived.value.move,
    damageBonus: derived.value.damageBonus,
    build: derived.value.build,
  }))
  const skillPoints = computed(() => {
    const skills = form.value.skills || []
    const careerUsed = skills.reduce((sum, s) => sum + (Number(s.career) || 0), 0)
    const interestUsed = skills.reduce((sum, s) => sum + (Number(s.interest) || 0), 0)
    const careerTotal = Number(form.value.skillRule?.careerPointsTotal) || 0
    const interestTotal = Number(form.value.skillRule?.interestPointsTotal) || 0
    return {
      careerPointsUsed: careerUsed,
      careerPointsRemain: Math.max(0, careerTotal - careerUsed),
      interestPointsUsed: interestUsed,
      interestPointsRemain: Math.max(0, interestTotal - interestUsed),
    }
  })
  const creditDerived = computed(() => {
    const skills = form.value.skills || []
    const creditSkill = skills.find(s => s.id === 'credit')
    const value = creditSkill
      ? Math.min(99, (creditSkill.base || 0) + (creditSkill.career || 0) + (creditSkill.interest || 0) + (creditSkill.growth || 0))
      : 0
    const row = CREDIT_TABLE.find(r => value <= r.max) || CREDIT_TABLE[CREDIT_TABLE.length - 1]
    return { creditRating: row.creditRating, cash: row.cash, spendingLevel: row.spendingLevelDesc, assets: row.assetsDesc }
  })

  watch(
    () => ({ hpMax: derived.value.hpMax, mpMax: derived.value.mpMax, sanInitial: derived.value.sanInitial }),
    (d) => {
      form.value.hpCurrent = d.hpMax
      form.value.mpCurrent = d.mpMax
      form.value.sanCurrent = d.sanInitial
    },
    { immediate: true }
  )

  onMounted(() => {
    if (!isNew.value && id.value) {
      const c = getById(id.value)
      if (c) {
        const def = getDefaultSheet()
        form.value = { ...def, ...c }
        form.value.skillRule = { ...def.skillRule, ...(c.skillRule || {}) }
        form.value.combat = { ...def.combat, ...(c.combat || {}) }
        form.value.possessions = { ...def.possessions, ...(c.possessions || {}) }
        form.value.mythos = { ...def.mythos, ...(c.mythos || {}) }
        form.value.story = { ...def.story, ...(c.story || {}) }
        form.value.weapons = normalizeWeapons(c.weapons)
        form.value.companions = Array.isArray(c.companions) ? c.companions : def.companions
        form.value.scenarios = Array.isArray(c.scenarios) ? c.scenarios : def.scenarios
        if (!form.value.skills || form.value.skills.length !== PRESET_SKILLS.length) {
          form.value.skills = getDefaultSheet().skills
        }
      } else {
        router.replace('/characters')
      }
    }
  })

  function save() {
    const name = form.value.name?.trim() || '未命名'
    if (isNew.value) {
      const newId = create({ ...form.value, name })
      router.replace(`/characters/${newId}`)
    } else {
      update(id.value, { ...form.value, name })
    }
  }

  function goBack() {
    router.push('/characters')
  }

  const addWeaponDialogOpen = ref(false)
  function addWeaponFromPreset(preset) {
    form.value.weapons.push({
      name: preset.name,
      skill: preset.skill ?? '',
      success: preset.success ?? '',
      damage: preset.damage ?? '',
      range: preset.range ?? '',
      penetrate: preset.penetrate ?? '',
      attacks: String(preset.attacks ?? ''),
      ammo: String(preset.ammo ?? ''),
      malfunction: String(preset.malfunction ?? ''),
    })
    addWeaponDialogOpen.value = false
  }
  function removeWeapon(idx) {
    if (idx <= 0) return
    form.value.weapons.splice(idx, 1)
  }

  const companionDialogOpen = ref(false)
  const companionDraft = ref({ name: '', relation: '', player: '' })
  function openCompanionDialog() {
    companionDraft.value = { name: '', relation: '', player: '' }
    companionDialogOpen.value = true
  }
  function confirmCompanion() {
    form.value.companions.push({
      name: companionDraft.value.name ?? '',
      relation: companionDraft.value.relation ?? '',
      player: companionDraft.value.player ?? '',
    })
    companionDialogOpen.value = false
  }
  function removeCompanion(idx) {
    form.value.companions.splice(idx, 1)
  }

  const scenarioDialogOpen = ref(false)
  const scenarioDraft = ref({ name: '', experience: '' })
  function openScenarioDialog() {
    scenarioDraft.value = { name: '', experience: '' }
    scenarioDialogOpen.value = true
  }
  function confirmScenario() {
    form.value.scenarios.push({
      name: scenarioDraft.value.name ?? '',
      experience: scenarioDraft.value.experience ?? '',
    })
    scenarioDialogOpen.value = false
  }
  function removeScenario(idx) {
    form.value.scenarios.splice(idx, 1)
  }

  function penetrateLabel(value) {
    const opt = WEAPON_PENETRATE_OPTIONS.find(o => o.value === value)
    return opt ? opt.label : '-'
  }

  // 掷骰弹窗：一键随机全部属性时先播动画再应用
  const diceRollOpen = ref(false)
  const diceRollBatch = ref([])
  const CHAR_ROLL_BATCH = [
    { notation: '3d6', key: 'str', label: '力量STR', multiply: 5 },
    { notation: '3d6', key: 'dex', label: '敏捷DEX', multiply: 5 },
    { notation: '2d6+6', key: 'siz', label: '体型SIZ', multiply: 5 },
    { notation: '3d6', key: 'app', label: '外貌APP', multiply: 5 },
    { notation: '3d6', key: 'con', label: '体质CON', multiply: 5 },
    { notation: '2d6+6', key: 'int', label: '智力INT', multiply: 5 },
    { notation: '3d6', key: 'pow', label: '意志POW', multiply: 5 },
    { notation: '2d6+6', key: 'edu', label: '教育EDU', multiply: 5 },
    { notation: '3d6', key: 'luc', label: '幸运LUC', multiply: 5 },
  ]
  function openRollAllChars() {
    diceRollBatch.value = [...CHAR_ROLL_BATCH]
    diceRollOpen.value = true
  }
  function onDiceRollConfirm(payload) {
    Object.keys(payload).forEach((key) => { form.value[key] = payload[key] })
    diceRollOpen.value = false
  }
  function closeDiceRoll() {
    diceRollOpen.value = false
  }

  function skillSuccess(s) {
    return (s.base || 0) + (s.career || 0) + (s.interest || 0) + (s.growth || 0)
  }

  return {
    form,
    isNew,
    id,
    sheetTab,
    derived,
    syncDerived,
    skillPoints,
    creditDerived,
    save,
    goBack,
    addWeaponDialogOpen,
    addWeaponFromPreset,
    removeWeapon,
    companionDialogOpen,
    companionDraft,
    openCompanionDialog,
    confirmCompanion,
    removeCompanion,
    scenarioDialogOpen,
    scenarioDraft,
    openScenarioDialog,
    confirmScenario,
    removeScenario,
    penetrateLabel,
    openRollAllChars,
    diceRollOpen,
    diceRollBatch,
    onDiceRollConfirm,
    closeDiceRoll,
    skillSuccess,
    PRESET_SKILLS,
    SKILL_TYPE_OPTIONS,
    PRESET_WEAPONS,
    WEAPON_PENETRATE_OPTIONS,
    getDefaultSheet,
  }
}
