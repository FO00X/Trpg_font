import { ref, computed } from 'vue'
import { CREDIT_TABLE } from '../data/characterConstants'
import { PRESET_WEAPONS_FULL, WEAPON_CATEGORIES } from '../data/presetWeapons'
import { OCCUPATION_CAREER_SKILLS } from '../data/occupationCareers'

// COC 7th 伤害加值/体型表
const strSizTable = [
  [[2, 12], [-2, -2]], [[13, 16], [-1, -1]], [[17, 24], [0, 0]],
  [[25, 32], [1, 1]], [[33, 40], [2, 2]],
]
function getDamageBonusAndBuild(str, siz) {
  const sum = (str || 0) + (siz || 0)
  for (const [[lo, hi], [db, build]] of strSizTable) {
    if (sum >= lo && sum <= hi) return { damageBonus: db, build }
  }
  return sum > 40 ? { damageBonus: 2, build: 2 } : { damageBonus: -2, build: -2 }
}

// 预设技能：{ id, name, base, typeOptions? }
const PRESET_SKILLS = [
  { id: 'credit', name: '信用评级', base: 0 },
  { id: 'cthulhu_mythos', name: '克苏鲁神话', base: 0 },
  { id: 'spot_hidden', name: '侦查', base: 25 },
  { id: 'listen', name: '聆听', base: 20 },
  { id: 'stealth', name: '潜行', base: 20 },
  { id: 'track', name: '追踪', base: 10 },
  { id: 'read_lips', name: '读唇', base: 5 },
  { id: 'library_use', name: '图书馆使用', base: 20 },
  { id: 'navigate', name: '导航', base: 10 },
  { id: 'computer', name: '计算机使用Ω', base: 5 },
  { id: 'charm', name: '取悦', base: 15 },
  { id: 'fast_talk', name: '话术', base: 5 },
  { id: 'intimidate', name: '恐吓', base: 15 },
  { id: 'persuade', name: '说服', base: 10 },
  { id: 'psychology', name: '心理学', base: 10 },
  { id: 'mother_tongue', name: '母语', base: 0, typeOption: 'language' },
  { id: 'foreign_1', name: '外语1', base: 0, typeOption: 'language' },
  { id: 'foreign_2', name: '外语2', base: 0, typeOption: 'language' },
  { id: 'foreign_3', name: '外语3', base: 0, typeOption: 'language' },
  { id: 'fighting_brawl', name: '格斗(斗殴)', base: 25 },
  { id: 'fighting_1', name: '格斗', base: 0, typeOption: 'fighting' },
  { id: 'fighting_2', name: '格斗', base: 0, typeOption: 'fighting' },
  { id: 'firearm_pistol', name: '射击(手枪)', base: 20 },
  { id: 'firearm_rifle', name: '射击(步/霰)', base: 25 },
  { id: 'firearm_1', name: '射击', base: 0, typeOption: 'firearm' },
  { id: 'dodge', name: '闪避', base: 0 },
  { id: 'throw', name: '投掷', base: 20 },
  { id: 'demolition', name: '爆破', base: 0 },
  { id: 'heavy_weapons', name: '炮术', base: 0 },
  { id: 'first_aid', name: '急救', base: 30 },
  { id: 'medicine', name: '医学', base: 0 },
  { id: 'psychoanalysis', name: '精神分析', base: 0 },
  { id: 'hypnosis', name: '催眠', base: 0 },
  { id: 'climb', name: '攀爬', base: 20 },
  { id: 'jump', name: '跳跃', base: 20 },
  { id: 'swim', name: '游泳', base: 20 },
  { id: 'dive', name: '潜水', base: 0 },
  { id: 'survival_1', name: '生存', base: 0, typeOption: 'survival' },
  { id: 'survival_2', name: '生存', base: 0, typeOption: 'survival' },
  { id: 'survival_3', name: '生存', base: 0, typeOption: 'survival' },
  { id: 'appraise', name: '估价', base: 5 },
  { id: 'anthropology', name: '人类学', base: 0 },
  { id: 'accounting', name: '会计', base: 5 },
  { id: 'law', name: '法律', base: 5 },
  { id: 'history', name: '历史', base: 5 },
  { id: 'archaeology', name: '考古学', base: 0 },
  { id: 'natural_world', name: '博物学', base: 10 },
  { id: 'occult', name: '神秘学', base: 5 },
  { id: 'electronics', name: '电子学Ω', base: 0 },
  { id: 'electrical_repair', name: '电气维修', base: 10 },
  { id: 'mechanical_repair', name: '机械维修', base: 10 },
  { id: 'sleight_of_hand', name: '妙手', base: 10 },
  { id: 'locksmith', name: '锁匠', base: 0 },
  { id: 'drive_auto', name: '汽车驾驶', base: 20 },
  { id: 'drive_1', name: '驾驶', base: 0, typeOption: 'drive' },
  { id: 'operate_heavy', name: '操作重型机械', base: 0 },
  { id: 'disguise', name: '乔装', base: 5 },
  { id: 'animal_handling', name: '驯兽', base: 5 },
  { id: 'ride', name: '骑术', base: 5 },
  { id: 'science_1', name: '科学', base: 0, typeOption: 'science' },
  { id: 'science_2', name: '科学', base: 0, typeOption: 'science' },
  { id: 'science_3', name: '科学', base: 0, typeOption: 'science' },
  { id: 'art_1', name: '技艺', base: 0, typeOption: 'art' },
  { id: 'art_2', name: '技艺', base: 0, typeOption: 'art' },
  { id: 'art_3', name: '技艺', base: 0, typeOption: 'art' },
]

// 武器使用技能选项（参考规则书）
export const WEAPON_SKILL_OPTIONS = [
  '格斗(斗殴)', '格斗(刀剑)', '格斗(矛)', '格斗(斧)', '格斗(绞索)', '格斗(链锯)', '格斗(链枷)', '格斗(鞭)',
  '射击(手枪)', '射击(步/霰)', '射击(冲锋枪)', '射击(弓弩)', '射击(机枪)', '射击(重武器)',
  '投掷', '爆破', '炮术',
]

// 贯穿选项：空=-, 0=✗, 1=✓
export const WEAPON_PENETRATE_OPTIONS = [
  { value: '', label: '-' },
  { value: '0', label: '✗' },
  { value: '1', label: '✓' },
]

// 可选择的预设武器（来自规则书，见 src/data/presetWeapons.js），供本 store 与外部使用
export { PRESET_WEAPONS_FULL as PRESET_WEAPONS, WEAPON_CATEGORIES }

// 技能类型选项
export const SKILL_TYPE_OPTIONS = {
  language: ['中文', '英语', '日语', '法语', '德语', '拉丁语', '希腊语', '其他'],
  fighting: ['斗殴', '剑', '矛', '斧', '鞭', '绞索', '链枷', '其他'],
  firearm: ['手枪', '步/霰', '冲锋枪', '步枪', '弓', '其他'],
  survival: ['沙漠', '海洋', '森林', '极地', '其他'],
  science: ['生物学', '化学', '地质学', '物理学', '药学', '天文学', '植物学', '动物学', '其他'],
  art: ['艺术', '书法', '表演', '摄影', '写作', '音乐', '绘画', '雕塑', '其他'],
  drive: ['汽车', '马车', '飞行器', '船', '其他'],
}

function defaultSkillRow(s) {
  return {
    id: s.id,
    name: s.name,
    base: s.base,
    typeOption: s.typeOption,
    custom: s.custom,
    typeValue: '',
    career: 0,
    interest: 0,
    growth: 0,
  }
}

const defaultWeaponRow = { name: '徒手格斗', skill: '格斗(斗殴)', success: 25, damage: '1D3+DB', range: '接触', penetrate: '', attacks: '1', ammo: '', malfunction: '' }

function normalizeWeapon(w) {
  return {
    name: w.name ?? '',
    skill: w.skill ?? '',
    success: w.success ?? '',
    damage: w.damage ?? '',
    range: w.range ?? '',
    penetrate: w.penetrate ?? '',
    attacks: w.attacks ?? '',
    ammo: w.ammo ?? '',
    malfunction: w.malfunction ?? '',
  }
}

function normalizeWeapons(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return [{ ...defaultWeaponRow }]
  return arr.map((w) => normalizeWeapon(w))
}

/** 将存储中的原始角色与默认表合并，返回完整 sheet（供表单/弹窗使用） */
function normalizeCharacter(c) {
  if (!c) return null
  const def = getDefaultSheet()
  return {
    ...def,
    ...c,
    skillRule: { ...def.skillRule, ...(c.skillRule || {}) },
    combat: { ...def.combat, ...(c.combat || {}) },
    possessions: { ...def.possessions, ...(c.possessions || {}) },
    mythos: { ...def.mythos, ...(c.mythos || {}) },
    story: { ...def.story, ...(c.story || {}) },
    weapons: normalizeWeapons(c.weapons),
    companions: Array.isArray(c.companions) ? c.companions : def.companions,
    scenarios: Array.isArray(c.scenarios) ? c.scenarios : def.scenarios,
  }
}

/** 技能成功率：基础+职业+兴趣+成长 */
function skillSuccess(s) {
  return (s?.base || 0) + (s?.career || 0) + (s?.interest || 0) + (s?.growth || 0)
}

/** 技能显示名（含类型选项时带括号） */
function skillDisplayName(s) {
  if (!s) return '-'
  return s.typeOption
    ? (s.name?.replace(/\d$/, '') || '') + (s.typeValue ? `(${s.typeValue})` : '')
    : (s.name || '-')
}

/** 根据职业名得到本职技能名数组（与规则书一致，用于在技能表前加星号） */
function getCareerSkillNames(occupationName) {
  if (!occupationName || !OCCUPATION_CAREER_SKILLS) return []
  const name = String(occupationName).trim()
  if (OCCUPATION_CAREER_SKILLS[name]) return OCCUPATION_CAREER_SKILLS[name]
  const suffixes = ['(原作向)', '(古典)', '(现代)']
  for (const suffix of suffixes) {
    const key = name + suffix
    if (OCCUPATION_CAREER_SKILLS[key]) return OCCUPATION_CAREER_SKILLS[key]
  }
  return []
}

/** 根据信用技能值从 CREDIT_TABLE 得到描述（含信用等级与生活规格描述） */
function getCreditFromSkillValue(value) {
  const v = Math.min(99, Math.max(0, Number(value) || 0))
  const row = CREDIT_TABLE.find((r) => v <= r.max) || CREDIT_TABLE[CREDIT_TABLE.length - 1]
  return {
    creditRating: row.creditRating,
    lifeStyleDesc: row.lifeStyleDesc ?? '',
  }
}

function getDefaultSheet() {
  const basic = {
    name: '', occupation: '', age: 18, gender: '男',
    currentResidence: '', birthplace: '',
  }
  const characteristics = {
    str: 0, dex: 0, siz: 0, app: 0, con: 0, int: 0, pow: 0, edu: 0, luc: 0,
  }
  const attributesSource = 'manual'
  const corePanel = {
    hpCurrent: 0, mpCurrent: 0, sanCurrent: 0,
  }
  const status = {
    seriousWound: false,
    unconscious: false,
    dead: false,
    temporaryInsanity: false,
    permanentInsanity: false,
    indefiniteInsanity: false,
  }
  const skillRule = {
    careerPointsTotal: 0, careerPointsUsed: 0, careerPointsRemain: 0,
    interestPointsTotal: 0, interestPointsUsed: 0, interestPointsRemain: 0,
  }
  const skills = PRESET_SKILLS.map(s => defaultSkillRow(s))
  const weapons = [{ ...defaultWeaponRow }]
  const combat = { damageBonus: 0, build: 0, armor: '', move: 9 }
  const possessions = { creditRating: '', cash: '', spendingLevel: '', assets: '', other: '' }
  const mythos = { magicItems: '', spells: '', thirdContact: '' }
  const story = {
    intro: '', appearance: '', belief: '', importantPerson: '', significantPlace: '',
    preciousThing: '', traits: '', woundsScars: '', mentalDisorder: '',
  }
  const companions = []
  const scenarios = []

  return {
    campaign: '',
    era: '1920',
    skillCap: 99,
    attributesSource,
    ...basic,
    ...characteristics,
    ...corePanel,
    ...status,
    skillRule,
    skills,
    weapons: weapons,
    combat,
    possessions,
    mythos,
    story,
    companions,
    scenarios,
  }
}

const STORAGE_KEY = 'foxtrpg-characters'

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data : null
  } catch {
    return null
  }
}

function saveToStorage(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch (_) {}
}

export function useCharactersStore() {
  const defaultList = [
    { id: '1', name: '艾莉娅', campaign: '星海传说', updated: '2024-01-15', ...getDefaultSheet() },
    { id: '2', name: '索伦', campaign: '黑暗森林', updated: '2024-01-10', ...getDefaultSheet() },
  ]
  const characters = ref(loadFromStorage() ?? defaultList)

  function getDerived(sheet) {
    const con = sheet.con || 0, siz = sheet.siz || 0, pow = sheet.pow || 0, edu = sheet.edu || 0, str = sheet.str || 0
    const hpMax = Math.ceil((con + siz) / 10)
    const mpMax = Math.ceil(pow / 5)
    const sanInitial = pow // SAN 与意志 POW 同值
    const move = 9
    const { damageBonus, build } = getDamageBonusAndBuild(str, siz)
    return { hpMax, mpMax, sanInitial, move, damageBonus, build }
  }

  function getById(id) {
    return characters.value.find(c => c.id === id)
  }

  function getCreditDerived(skills) {
    if (!Array.isArray(skills)) return getCreditFromSkillValue(0)
    const creditSkill = skills.find((s) => s.id === 'credit')
    const value = creditSkill ? skillSuccess(creditSkill) : 0
    return getCreditFromSkillValue(value)
  }

  function penetrateLabel(value) {
    const opt = WEAPON_PENETRATE_OPTIONS.find((o) => o.value === value)
    return opt ? opt.label : '-'
  }

  function create(draft) {
    const id = `c-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const sheet = { ...getDefaultSheet(), ...draft, id, updated: new Date().toISOString().slice(0, 10) }
    characters.value.push(sheet)
    saveToStorage(characters.value)
    return id
  }

  function update(id, draft) {
    const i = characters.value.findIndex(c => c.id === id)
    if (i === -1) return
    characters.value[i] = { ...characters.value[i], ...draft, updated: new Date().toISOString().slice(0, 10) }
    saveToStorage(characters.value)
  }

  function remove(id) {
    characters.value = characters.value.filter(c => c.id !== id)
    saveToStorage(characters.value)
  }

  return {
    characters,
    getDefaultSheet,
    getDerived,
    getById,
    normalizeCharacter,
    getCreditDerived,
    skillSuccess,
    skillDisplayName,
    getCareerSkillNames,
    penetrateLabel,
    create,
    update,
    remove,
    PRESET_SKILLS,
    SKILL_TYPE_OPTIONS,
    PRESET_WEAPONS: PRESET_WEAPONS_FULL,
    WEAPON_CATEGORIES,
    WEAPON_SKILL_OPTIONS,
    WEAPON_PENETRATE_OPTIONS,
    normalizeWeapons,
  }
}
