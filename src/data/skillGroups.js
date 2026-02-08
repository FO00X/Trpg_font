/**
 * COC 7th 技能分组（与规则书 Uy 一致），用于能力体系按分类展示
 */
export const SKILL_GROUP_ORDER = [
  '特殊',
  '探索',
  '社交',
  '战斗',
  '医疗',
  '运动',
  '知识',
  '技术',
  '操纵',
  '其它',
]

/** 分组 id -> 技能名列表（规则书中的名称，用于匹配我们的 PRESET_SKILLS.name） */
export const SKILL_GROUP_NAMES = {
  特殊: ['信用评级', '克苏鲁神话'],
  探索: ['侦查', '聆听', '图书馆使用', '计算机使用Ω', '潜行', '追踪', '导航', '读唇'],
  社交: ['话术', '说服', '取悦', '恐吓', '心理学', '母语', '外语'],
  战斗: ['闪避', '格斗', '射击', '投掷', '爆破', '炮术'],
  医疗: ['急救', '医学', '精神分析', '催眠'],
  运动: ['攀爬', '跳跃', '游泳', '潜水'],
  知识: ['博物学', '神秘学', '考古学', '人类学', '估价', '会计', '法律', '历史', '电子学Ω', '科学'],
  技术: ['乔装', '妙手', '锁匠', '机械维修', '电气维修', '驯兽', '技艺', '生存'],
  操纵: ['汽车驾驶', '骑术', '驾驶', '操作重型机械'],
  其它: [],
}

/**
 * 根据技能得到所属分组标签（用于表头）
 * @param {{ name?: string, typeOption?: string, typeValue?: string }} skill - 技能行
 * @returns {string} 分组中文名，如 '特殊'、'探索'
 */
export function getSkillGroupLabel(skill) {
  if (!skill?.name) return '其它'
  const baseName = (skill.name || '').replace(/\d$/, '') // 外语1 -> 外语, 科学1 -> 科学
  const displayName = skill.typeOption
    ? baseName + (skill.typeValue ? `(${skill.typeValue})` : '')
    : (skill.name || '')
  for (const group of SKILL_GROUP_ORDER) {
    const names = SKILL_GROUP_NAMES[group] || []
    if (names.some((n) => n === displayName || n === skill.name || n === baseName)) return group
    if (skill.name === '汽车驾驶' && names.includes('汽车驾驶')) return group
  }
  return '其它'
}
