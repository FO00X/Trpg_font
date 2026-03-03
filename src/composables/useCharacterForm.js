import { ref, computed, onMounted, watch, nextTick, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCharactersStore } from '../stores/characters'
import { generateName } from '../utils/randomName'
import { SKILL_GROUP_ORDER, getSkillGroupLabel } from '../data/skillGroups'
import { OCCUPATION_GROUPS } from '../data/occupationGroups'
import { getOccupationMeta, evalCareerFormula, evalInterestFormula } from '../data/occupationMeta'
import { useDice3D } from './useDice3D'
import { parseNotation } from '../utils/dice'

export const SHEET_TABS = [
  { id: 'basic', label: '基础信息', icon: 'mdi:account' },
  { id: 'ability', label: '能力体系', icon: 'mdi:sword-cross' },
  { id: 'assets', label: '资产背景', icon: 'mdi:bag-personal' },
  { id: 'social', label: '剧情社交', icon: 'mdi:book-open-variant' },
]

export const genderOptions = [{ value: '男', label: '男' }, { value: '女', label: '女' }]

export const inputCls = 'w-full px-3 py-2 rounded-lg bg-base-100 border border-base-300 text-base-content placeholder-accent-muted focus:border-accent outline-none'
export const labelCls = 'block text-sm text-base-content/60 mb-1'
export const sectionCls = 'rounded-xl bg-base-100 border border-base-200 p-4'
export const sectionTitleCls = 'text-sm font-semibold text-base-content uppercase tracking-wider mb-3'

export function useCharacterForm(options = {}) {
  const { confirmFn } = options
  const route = useRoute()
  const router = useRouter()
  const {
    getById,
    fetchCharacter,
    getDefaultSheet,
    getDerived,
    normalizeCharacter,
    getCreditDerived,
    skillSuccess: storeSkillSuccess,
    skillDisplayName,
    getCareerSkillNames,
    penetrateLabel,
    create,
    update,
    PRESET_SKILLS,
    SKILL_TYPE_OPTIONS,
    PRESET_WEAPONS,
    WEAPON_CATEGORIES,
    WEAPON_PENETRATE_OPTIONS,
    normalizeWeapons,
  } = useCharactersStore()

  const skillSuccess = (s) => storeSkillSuccess(s, form.value)

  const isNew = computed(() => route.name === 'character-new')
  const id = computed(() => route.params.id)
  const sheetTab = ref('basic')
  const form = ref({ ...getDefaultSheet() })
  const isDirty = ref(false)
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
  const creditDerived = computed(() => getCreditDerived(form.value.skills || []))

  /** 根据所选职业与核心属性同步本职/兴趣点数；职业为空时置 0（自定义职业） */
  function syncSkillRuleFromOccupation() {
    const occ = form.value.occupation?.trim()
    if (!occ) {
      form.value.skillRule = { ...form.value.skillRule, careerPointsTotal: 0, interestPointsTotal: 0 }
      return
    }
    const meta = getOccupationMeta(occ)
    const attrs = {
      str: form.value.str,
      dex: form.value.dex,
      siz: form.value.siz,
      app: form.value.app,
      int: form.value.int,
      pow: form.value.pow,
      edu: form.value.edu,
    }
    const careerTotal = meta?.pointFormula ? evalCareerFormula(meta.pointFormula, attrs) : 0
    const interestTotal = evalInterestFormula(attrs)
    form.value.skillRule = {
      ...form.value.skillRule,
      careerPointsTotal: careerTotal,
      interestPointsTotal: interestTotal,
    }
  }

  watch(
    () => [
      form.value.occupation,
      form.value.str,
      form.value.dex,
      form.value.siz,
      form.value.app,
      form.value.int,
      form.value.pow,
      form.value.edu,
    ],
    () => syncSkillRuleFromOccupation(),
    { immediate: true }
  )

  watch(form, () => { isDirty.value = true }, { deep: true })

  /** 按技能分组顺序分组的技能列表，用于能力体系表按分类展示 */
  const skillsByGroup = computed(() => {
    const skills = form.value.skills || []
    const order = SKILL_GROUP_ORDER || []
    const byGroup = {}
    for (const s of skills) {
      const group = getSkillGroupLabel(s)
      if (!byGroup[group]) byGroup[group] = []
      byGroup[group].push(s)
    }
    return order.map((group) => ({ group, skills: byGroup[group] || [] })).filter((g) => g.skills.length > 0)
  })

  /** 当前职业本职技能名集合（用于判断是否在技能名前加星号） */
  const careerSkillNames = computed(() => {
    const names = getCareerSkillNames(form.value.occupation) || []
    return new Set(names)
  })

  /** 判断某技能是否为当前职业的本职技能 */
  function isCareerSkill(skill) {
    if (!skill) return false
    const displayName = skillDisplayName(skill)
    if (careerSkillNames.value.has(displayName)) return true
    const baseName = (skill.name || '').replace(/\d$/, '')
    if (careerSkillNames.value.has(baseName)) return true
    return false
  }

  watch(
    () => ({ hpMax: derived.value.hpMax, mpMax: derived.value.mpMax, sanInitial: derived.value.sanInitial }),
    (d) => {
      form.value.hpCurrent = d.hpMax
      form.value.mpCurrent = d.mpMax
      form.value.sanCurrent = d.sanInitial
    },
    { immediate: true }
  )

  /** 按卡片区分：每张卡的幸运/全属性掷骰结果独立，不跨卡 */
  const { roll: roll3D, isInitialized: isDice3DInitialized } = useDice3D()

  function onBeforeUnload(e) {
    if (isDirty.value) e.preventDefault()
  }
  onMounted(() => {
    window.addEventListener('beforeunload', onBeforeUnload)
    if (isNew.value) {
      isDirty.value = false
    }
    if (!isNew.value && id.value) {
      let c = getById(id.value)
      if (c) {
        form.value = normalizeCharacter(c)
        if (!form.value.skills || form.value.skills.length !== PRESET_SKILLS.length) {
          form.value.skills = getDefaultSheet().skills
        }
        nextTick(() => { isDirty.value = false })
      } else if (id.value) {
        fetchCharacter(id.value).then((char) => {
          if (char) {
            form.value = normalizeCharacter(char)
            if (!form.value.skills || form.value.skills.length !== PRESET_SKILLS.length) {
              form.value.skills = getDefaultSheet().skills
            }
            nextTick(() => { isDirty.value = false })
          } else {
            router.replace('/characters')
          }
        })
      } else {
        router.replace('/characters')
      }
    }
  })
  onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', onBeforeUnload)
  })

  const validationErrors = ref([])

  /** 保存前校验，返回错误信息数组，空数组表示通过 */
  function validateForm() {
    const errs = []
    const f = form.value

    const age = Number(f.age)
    if (Number.isNaN(age) || age < 15 || age > 99) {
      errs.push('年龄需在 15～99 之间')
    }

    const attrs = ['str', 'dex', 'siz', 'app', 'con', 'int', 'pow', 'edu', 'luc']
    if (f.attributesSource === 'manual') {
      let total = 0
      for (const k of CHAR_ATTRS) {
        const v = Number(f[k])
        if (Number.isNaN(v) || v < CHAR_MIN || v > CHAR_MAX) {
          errs.push(`属性 ${k} 需在 ${CHAR_MIN}～${CHAR_MAX} 之间`)
        } else {
          total += v
        }
      }
      if (total > CHAR_POINTS_TOTAL) {
        errs.push(`8 项核心属性总和不能超过 ${CHAR_POINTS_TOTAL}（当前 ${total}）`)
      }
      const luc = Number(f.luc)
      if (!Number.isNaN(luc) && (luc < 0 || luc > CHAR_MAX)) {
        errs.push(`幸运需在 0～${CHAR_MAX} 之间`)
      }
    } else {
      for (const k of attrs) {
        const v = Number(f[k])
        if (!Number.isNaN(v) && (v < 0 || v > CHAR_MAX)) {
          errs.push(`属性 ${k} 需在 0～${CHAR_MAX} 之间`)
        }
      }
    }

    if (f.occupation?.trim()) {
      const points = skillPoints.value
      if (points.careerPointsRemain < 0) {
        errs.push('本职技能点数已超出分配总额，请调整技能点')
      }
      if (points.interestPointsRemain < 0) {
        errs.push('兴趣技能点数已超出分配总额，请调整技能点')
      }
    }

    return errs
  }

  const saveError = ref('')
  async function save() {
    const errs = validateForm()
    if (errs.length > 0) {
      validationErrors.value = errs
      return
    }
    validationErrors.value = []
    saveError.value = ''
    const name = form.value.name?.trim() || '未命名'
    if (isNew.value) {
      const newId = await create({ ...form.value, name })
      if (newId) {
        isDirty.value = false
        goBack()
      } else {
        saveError.value = '创建失败，请稍后重试'
      }
    } else {
      const ok = await update(id.value, { ...form.value, name })
      if (ok) {
        isDirty.value = false
        goBack()
      } else {
        saveError.value = '保存失败，请稍后重试'
      }
    }
  }

  async function goBack(force = false) {
    if (!force && isDirty.value) {
      const message = '当前有未保存的修改，确定要离开吗？'
      let confirmed = false
      if (confirmFn) {
        confirmed = await confirmFn('确认离开', message)
      } else {
        confirmed = window.confirm(message)
      }
      if (!confirmed) return
    }
    isDirty.value = false
    if (window.history.length > 1) {
      router.back()
    } else {
      router.replace('/characters')
    }
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

  // 随机生成姓名弹窗（国家/地区 + 性别）
  const randomNameModalOpen = ref(false)
  const randomNameCountry = ref('china')
  const randomNameGender = ref('unknown')
  const generatedName = ref('')
  function openRandomNameModal() {
    randomNameCountry.value = 'china'
    randomNameGender.value = 'unknown'
    generatedName.value = generateName(randomNameCountry.value, randomNameGender.value)
    randomNameModalOpen.value = true
  }
  function doGenerateRandomName() {
    generatedName.value = generateName(randomNameCountry.value, randomNameGender.value)
  }
  function confirmRandomName() {
    if (generatedName.value?.trim()) {
      form.value.name = generatedName.value.trim()
    }
    randomNameModalOpen.value = false
  }
  function closeRandomNameModal() {
    randomNameModalOpen.value = false
  }

  // 职业选择弹窗（从列表快速选择）
  const occupationPickerOpen = ref(false)
  function openOccupationPicker() {
    occupationPickerOpen.value = true
  }
  function closeOccupationPicker() {
    occupationPickerOpen.value = false
  }
  function selectOccupation(occupation) {
    form.value.occupation = occupation ?? ''
    occupationPickerOpen.value = false
  }

  const CHAR_MIN = 0
  const CHAR_MAX = 90
  const CHAR_ATTRS = ['str', 'dex', 'siz', 'app', 'con', 'int', 'pow', 'edu']
  const CHAR_POINTS_TOTAL = 480
  const CHAR_ROLL_BATCH = [
    { notation: '3d6', key: 'str', label: '力量STR', multiply: 5 },
    { notation: '3d6', key: 'dex', label: '敏捷DEX', multiply: 5 },
    { notation: '2d6+6', key: 'siz', label: '体型SIZ', multiply: 5 },
    { notation: '3d6', key: 'app', label: '外貌APP', multiply: 5 },
    { notation: '3d6', key: 'con', label: '体质CON', multiply: 5 },
    { notation: '2d6+6', key: 'int', label: '灵感INT', multiply: 5 },
    { notation: '3d6', key: 'pow', label: '意志POW', multiply: 5 },
    { notation: '2d6+6', key: 'edu', label: '教育EDU', multiply: 5 },
    { notation: '3d6', key: 'luc', label: '幸运LUC', multiply: 5 },
  ]

  async function rollBatchOnce(batch) {
    const list = []
    if (!isDice3DInitialized.value) return list
    try {
      const notations = batch.map((b) => b.notation)
      const res = await roll3D(notations)
      // dice-box 返回扁平数组：每颗骰子一个元素，不是按组。需按 notation 的 count 切片并求和
      if (Array.isArray(res) && res.length > 0) {
        let idx = 0
        for (const b of batch) {
          const parsed = parseNotation(b.notation)
          if (!parsed) continue
          const { count, modifier } = parsed
          const slice = res.slice(idx, idx + count)
          idx += count
          const base = slice.reduce((sum, d) => sum + (Number(d?.value) ?? 0), 0) + (modifier || 0)
          list.push({ key: b.key, base, multiply: b.multiply || 1 })
        }
      }
    } catch (_) {
    }
    return list
  }

  const ROLL_MAX = 5
  const rollHistory = ref([]) // 最多 5 组掷骰结果
  const rollIndex = ref(0)   // 当前展示的是第几组（0~4）

  // 加载已保存的 rolled 角色时，将当前属性作为第 1 组
  watch(
    () => form.value.attributesSource,
    (src) => {
      if (src === 'rolled' && rollHistory.value.length === 0) {
        const snap = {}
        CHAR_ROLL_BATCH.forEach((b) => {
          const v = form.value[b.key]
          if (v != null) snap[b.key] = Math.min(CHAR_MAX, Math.max(0, Number(v) || 0))
        })
        if (Object.keys(snap).length > 0) {
          rollHistory.value = [snap]
          rollIndex.value = 0
        }
      }
    },
    { immediate: true }
  )

  function applyRollToForm(snapshot) {
    Object.keys(snapshot).forEach((key) => {
      form.value[key] = snapshot[key]
    })
    form.value.attributesSource = 'rolled'
  }

  function snapshotFromList(list) {
    const snap = {}
    list.forEach(({ key, base, multiply }) => {
      const value = (Number(base) || 0) * (multiply || 1)
      snap[key] = Math.min(CHAR_MAX, Math.max(0, Number(value) || 0))
    })
    return snap
  }

  const rollRolling = ref(false)

  async function openRollAllChars() {
    if (rollHistory.value.length >= ROLL_MAX) {
      // 已达 5 次，在已有结果之间切换（同步，无需 loading）
      rollIndex.value = (rollIndex.value + 1) % ROLL_MAX
      applyRollToForm(rollHistory.value[rollIndex.value])
      return
    }
    rollRolling.value = true
    try {
      const list = await rollBatchOnce(CHAR_ROLL_BATCH)
      if (!list.length) return
      const snap = snapshotFromList(list)
      rollHistory.value.push(snap)
      rollIndex.value = rollHistory.value.length - 1
      applyRollToForm(snap)
    } finally {
      rollRolling.value = false
    }
  }

  async function openRollLuckOnly() {
    if (rollRolling.value) return
    rollRolling.value = true
    try {
      const list = await rollBatchOnce(CHAR_ROLL_BATCH.filter((b) => b.key === 'luc'))
      if (!list.length) return
      const item = list[0]
      const value = (Number(item.base) || 0) * (item.multiply || 1)
      form.value.luc = Math.min(CHAR_MAX, Math.max(0, Number(value) || 0))
    } finally {
      rollRolling.value = false
    }
  }
  const charPointsRemaining = computed(() => {
    if (form.value.attributesSource !== 'manual') return 0
    const used = CHAR_ATTRS.reduce((sum, k) => sum + Math.min(CHAR_MAX, Math.max(0, Number(form.value[k]) || 0)), 0)
    return CHAR_POINTS_TOTAL - used
  })

  return {
    form,
    isNew,
    id,
    sheetTab,
    derived,
    syncDerived,
    skillPoints,
    creditDerived,
    validationErrors,
    saveError,
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
    randomNameModalOpen,
    randomNameCountry,
    randomNameGender,
    generatedName,
    openRandomNameModal,
    doGenerateRandomName,
    confirmRandomName,
    closeRandomNameModal,
    occupationPickerOpen,
    openOccupationPicker,
    closeOccupationPicker,
    selectOccupation,
    penetrateLabel,
    openRollAllChars,
    openRollLuckOnly,
    rollHistory,
    rollIndex,
    rollRolling,
    ROLL_MAX,
    CHAR_ATTRS,
    CHAR_MIN,
    CHAR_MAX,
    CHAR_POINTS_TOTAL,
    charPointsRemaining,
    skillSuccess,
    skillDisplayName,
    skillsByGroup,
    isCareerSkill,
    getSkillGroupLabel,
    SKILL_GROUP_ORDER,
    PRESET_SKILLS,
    SKILL_TYPE_OPTIONS,
    PRESET_WEAPONS,
    WEAPON_CATEGORIES,
    WEAPON_PENETRATE_OPTIONS,
    getDefaultSheet,
    occupationGroups: OCCUPATION_GROUPS,
  }
}
