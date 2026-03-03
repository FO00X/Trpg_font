/**
 * COC 7th 职业元数据：信誉范围、职业属性公式（用于自动计算本职点数）
 * 兴趣点数 = 智力×2（规则书标准）
 * 选择职业序号为 0 或清空职业时，不套用模板，本职/兴趣总数置 0，供手动填写。
 */

const ATTR_MAP = {
  教育: 'edu',
  敏捷: 'dex',
  力量: 'str',
  外貌: 'app',
  意志: 'pow',
  体型: 'siz',
  // 职业公式中仍使用“智力”一词，对应内部 int，外部展示名改为“灵感”
  智力: 'int',
}

/**
 * 解析并计算「职业属性」公式
 * 公式形式：教育×4、教育×2＋敏捷×2、教育×2＋力量或敏捷×2 等
 * @param {string} formula - 公式字符串
 * @param {{ str, dex, siz, app, con, int, pow, edu }} attrs - 角色属性
 * @returns {number} 本职点数总额
 */
export function evalCareerFormula(formula, attrs) {
  if (!formula || typeof formula !== 'string') return 0
  const a = attrs || {}
  const get = (key) => Math.max(0, Number(a[key]) || 0)

  let sum = 0
  // 按 ＋ 分割项，每项可能为 "教育×4" 或 "力量或敏捷×2"
  const parts = formula.split(/＋|\+/)
  for (const part of parts) {
    const trimmed = part.trim()
    const match = trimmed.match(/^(.+?)×(\d+)$/)
    if (!match) continue
    const expr = match[1].trim()
    const mult = parseInt(match[2], 10) || 0
    if (expr.includes('或')) {
      const names = expr.split('或').map((s) => s.trim())
      let maxVal = 0
      for (const name of names) {
        const key = ATTR_MAP[name]
        if (key) maxVal = Math.max(maxVal, get(key))
      }
      sum += maxVal * mult
    } else {
      const key = ATTR_MAP[expr]
      if (key) sum += get(key) * mult
    }
  }
  return Math.max(0, Math.min(999, sum))
}

/**
 * 根据职业名查找元数据（支持带后缀的匹配，与 getCareerSkillNames 一致）
 */
export function getOccupationMeta(occupationName) {
  if (!occupationName || !OCCUPATION_META) return null
  const name = String(occupationName).trim()
  if (OCCUPATION_META[name]) return OCCUPATION_META[name]
  const suffixes = ['(原作向)', '(古典)', '(现代)']
  for (const suffix of suffixes) {
    const key = name + suffix
    if (OCCUPATION_META[key]) return OCCUPATION_META[key]
  }
  return null
}

/** 兴趣点数公式：智力×2（COC 7th 标准） */
export function evalInterestFormula(attrs) {
  const int = Math.max(0, Number(attrs?.int) || 0)
  return Math.min(999, int * 2)
}

/**
 * 职业名 -> { creditMin, creditMax, pointFormula }
 * 仅列出与 occupationCareers / occupationGroups 中一致的键名
 */
export const OCCUPATION_META = {
  '会计师': { creditMin: 30, creditMax: 70, pointFormula: '教育×4' },
  '杂技演员': { creditMin: 9, creditMax: 20, pointFormula: '教育×2＋敏捷×2' },
  '戏剧演员': { creditMin: 9, creditMax: 40, pointFormula: '教育×2＋外貌×2' },
  '电影演员': { creditMin: 20, creditMax: 90, pointFormula: '教育×2＋外貌×2' },
  '中介调查员': { creditMin: 20, creditMax: 45, pointFormula: '教育×2＋力量或敏捷×2' },
  '精神病医生(古典)': { creditMin: 10, creditMax: 60, pointFormula: '教育×4' },
  '动物训练师': { creditMin: 10, creditMax: 40, pointFormula: '教育×2＋外貌或意志×2' },
  '文物学家(原作向)': { creditMin: 30, creditMax: 70, pointFormula: '教育×4' },
  '古董商': { creditMin: 30, creditMax: 50, pointFormula: '教育×4' },
  '考古学家(原作向)': { creditMin: 10, creditMax: 40, pointFormula: '教育×4' },
  '建筑师': { creditMin: 30, creditMax: 70, pointFormula: '教育×4' },
  '艺术家': { creditMin: 9, creditMax: 50, pointFormula: '教育×2＋敏捷或意志×2' },
  '精神病院护工': { creditMin: 8, creditMax: 20, pointFormula: '教育×2＋力量或敏捷×2' },
  '运动员': { creditMin: 9, creditMax: 70, pointFormula: '教育×2＋力量或敏捷×2' },
  '作家(原作向)': { creditMin: 9, creditMax: 30, pointFormula: '教育×4' },
  '酒保': { creditMin: 8, creditMax: 25, pointFormula: '教育×2＋外貌×2' },
  '猎人': { creditMin: 20, creditMax: 50, pointFormula: '教育×2＋力量或敏捷×2' },
  '书商': { creditMin: 20, creditMax: 40, pointFormula: '教育×4' },
  '赏金猎人': { creditMin: 9, creditMax: 30, pointFormula: '教育×2＋力量或敏捷×2' },
  '拳击手/摔跤手': { creditMin: 9, creditMax: 60, pointFormula: '教育×2＋力量×2' },
  '管家/男仆/女仆': { creditMin: 9, creditMax: 40, pointFormula: '教育×4' },
  '神职人员': { creditMin: 9, creditMax: 60, pointFormula: '教育×4' },
  '程序员/电子工程师(现代)': { creditMin: 10, creditMax: 70, pointFormula: '教育×4' },
  '黑客/骇客(现代)': { creditMin: 10, creditMax: 70, pointFormula: '教育×4' },
  '牛仔': { creditMin: 9, creditMax: 20, pointFormula: '教育×2＋力量或敏捷×2' },
  '工匠': { creditMin: 10, creditMax: 10, pointFormula: '教育×2＋敏捷×2' },
  '医生(原作向)': { creditMin: 30, creditMax: 80, pointFormula: '教育×4' },
  '流浪者': { creditMin: 0, creditMax: 5, pointFormula: '教育×2＋外貌或敏捷或力量×2' },
  '编辑': { creditMin: 10, creditMax: 30, pointFormula: '教育×4' },
  '政府官员': { creditMin: 50, creditMax: 90, pointFormula: '教育×2＋外貌×2' },
  '工程师': { creditMin: 30, creditMax: 60, pointFormula: '教育×4' },
  '艺人': { creditMin: 9, creditMax: 70, pointFormula: '教育×2＋外貌×2' },
  '探险家(古典)': { creditMin: 55, creditMax: 80, pointFormula: '教育×2＋外貌或敏捷或力量×2' },
  '农民': { creditMin: 9, creditMax: 30, pointFormula: '教育×2＋力量或敏捷×2' },
  '联邦探员': { creditMin: 20, creditMax: 40, pointFormula: '教育×4' },
  '消防员': { creditMin: 9, creditMax: 30, pointFormula: '教育×2＋力量或敏捷×2' },
  '驻外记者': { creditMin: 10, creditMax: 40, pointFormula: '教育×4' },
  '法医': { creditMin: 40, creditMax: 60, pointFormula: '教育×4' },
  '赌徒': { creditMin: 8, creditMax: 50, pointFormula: '教育×2＋外貌或敏捷×2' },
  '绅士/淑女': { creditMin: 40, creditMax: 90, pointFormula: '教育×2＋外貌×2' },
  '游民': { creditMin: 0, creditMax: 5, pointFormula: '教育×2＋外貌或敏捷×2' },
  '记者(原作向)-调查记者': { creditMin: 9, creditMax: 30, pointFormula: '教育×4' },
  '记者(原作向)-通讯记者': { creditMin: 9, creditMax: 30, pointFormula: '教育×4' },
  '法官': { creditMin: 50, creditMax: 80, pointFormula: '教育×4' },
  '实验室助理': { creditMin: 10, creditMax: 30, pointFormula: '教育×4' },
  '工人-非熟练工人': { creditMin: 9, creditMax: 30, pointFormula: '教育×2＋力量或敏捷×2' },
  '工人-伐木工': { creditMin: 9, creditMax: 30, pointFormula: '教育×2＋力量或敏捷×2' },
  '工人-矿工': { creditMin: 9, creditMax: 30, pointFormula: '教育×2＋力量或敏捷×2' },
  '律师': { creditMin: 30, creditMax: 80, pointFormula: '教育×4' },
  '图书馆管理员(原作向)': { creditMin: 9, creditMax: 35, pointFormula: '教育×4' },
  '技师': { creditMin: 9, creditMax: 40, pointFormula: '教育×4' },
  '军官': { creditMin: 20, creditMax: 70, pointFormula: '教育×2＋力量或敏捷×2' },
  '传教士': { creditMin: 0, creditMax: 30, pointFormula: '教育×2＋外貌×2' },
  '登山家': { creditMin: 30, creditMax: 60, pointFormula: '教育×2＋力量或敏捷×2' },
  '博物馆管理员': { creditMin: 10, creditMax: 30, pointFormula: '教育×4' },
  '音乐家': { creditMin: 9, creditMax: 30, pointFormula: '教育×2＋意志或敏捷×2' },
  '护士': { creditMin: 9, creditMax: 30, pointFormula: '教育×4' },
  '神秘学家': { creditMin: 9, creditMax: 65, pointFormula: '教育×4' },
  '旅行家': { creditMin: 5, creditMax: 20, pointFormula: '教育×2＋力量或敏捷×2' },
  '药剂师': { creditMin: 35, creditMax: 75, pointFormula: '教育×4' },
  '摄影师-摄影师': { creditMin: 9, creditMax: 30, pointFormula: '教育×4' },
  '摄影师-摄影记者': { creditMin: 10, creditMax: 30, pointFormula: '教育×4' },
  '飞行员-飞行员': { creditMin: 20, creditMax: 70, pointFormula: '教育×2＋敏捷×2' },
  '飞行员-特技飞行员(古典)': { creditMin: 30, creditMax: 60, pointFormula: '教育×4' },
  '警方(原作向)-警探': { creditMin: 20, creditMax: 50, pointFormula: '教育×2＋力量或敏捷×2' },
  '警方(原作向)-巡警': { creditMin: 9, creditMax: 30, pointFormula: '教育×2＋力量或敏捷×2' },
  '私家侦探': { creditMin: 9, creditMax: 30, pointFormula: '教育×2＋力量或敏捷×2' },
  '教授(原作向)': { creditMin: 20, creditMax: 70, pointFormula: '教育×4' },
  '淘金客': { creditMin: 0, creditMax: 10, pointFormula: '教育×2＋力量或敏捷×2' },
  '性工作者': { creditMin: 5, creditMax: 50, pointFormula: '教育×2＋外貌×2' },
  '精神病学家': { creditMin: 30, creditMax: 80, pointFormula: '教育×4' },
  '心理学家/精神分析学家': { creditMin: 10, creditMax: 40, pointFormula: '教育×4' },
  '研究员': { creditMin: 9, creditMax: 30, pointFormula: '教育×4' },
  '海员-军舰海员': { creditMin: 9, creditMax: 30, pointFormula: '教育×4' },
  '海员-民船海员': { creditMin: 20, creditMax: 40, pointFormula: '教育×4' },
  '推销员': { creditMin: 9, creditMax: 40, pointFormula: '教育×2＋外貌×2' },
  '科学家': { creditMin: 9, creditMax: 50, pointFormula: '教育×4' },
  '秘书': { creditMin: 9, creditMax: 30, pointFormula: '教育×2＋敏捷或外貌×2' },
  '店老板': { creditMin: 20, creditMax: 40, pointFormula: '教育×2＋外貌或敏捷×2' },
  '士兵/海军陆战队士兵': { creditMin: 9, creditMax: 30, pointFormula: '教育×2＋力量或敏捷×2' },
  '间谍': { creditMin: 20, creditMax: 60, pointFormula: '教育×2＋外貌或敏捷×2' },
  '学生/实习生': { creditMin: 5, creditMax: 10, pointFormula: '教育×4' },
  '替身演员': { creditMin: 10, creditMax: 50, pointFormula: '教育×2＋力量或敏捷×2' },
  '部落成员': { creditMin: 0, creditMax: 15, pointFormula: '教育×2＋力量或敏捷×2' },
  '殡葬师': { creditMin: 20, creditMax: 40, pointFormula: '教育×4' },
  '工会活动家': { creditMin: 5, creditMax: 50, pointFormula: '教育×4' },
  '服务生': { creditMin: 9, creditMax: 20, pointFormula: '教育×2＋外貌或敏捷×2' },
  '白领工人-职员/主管': { creditMin: 9, creditMax: 20, pointFormula: '教育×4' },
  '白领工人-中高层管理人员': { creditMin: 20, creditMax: 80, pointFormula: '教育×4' },
  '狂热者': { creditMin: 0, creditMax: 30, pointFormula: '教育×2＋外貌或意志×2' },
  '饲养员': { creditMin: 9, creditMax: 40, pointFormula: '教育×4' },
  '业余艺术爱好者(原作向)': { creditMin: 50, creditMax: 99, pointFormula: '教育×2＋外貌×2' },
  '潜水员': { creditMin: 9, creditMax: 30, pointFormula: '教育×2＋敏捷×2' },
  '司机-私人司机': { creditMin: 10, creditMax: 40, pointFormula: '教育×2＋敏捷×2' },
  '司机-司机': { creditMin: 9, creditMax: 20, pointFormula: '教育×2＋力量或敏捷×2' },
  '司机-出租车司机': { creditMin: 9, creditMax: 30, pointFormula: '教育×2＋敏捷×2' },
  '设计师': { creditMin: 20, creditMax: 60, pointFormula: '教育×4' },
  '除魅师(现代)': { creditMin: 20, creditMax: 60, pointFormula: '教育×4' },
  '教团首领': { creditMin: 30, creditMax: 30, pointFormula: '教育×4' },
  '罪犯-刺客': { creditMin: 30, creditMax: 60, pointFormula: '教育×2＋力量或敏捷×2' },
  '罪犯-银行劫匪': { creditMin: 5, creditMax: 75, pointFormula: '教育×2＋力量或敏捷×2' },
  '罪犯-打手/暴徒': { creditMin: 5, creditMax: 30, pointFormula: '教育×2＋力量×2' },
  '罪犯-窃贼': { creditMin: 5, creditMax: 40, pointFormula: '教育×2＋敏捷×2' },
  '罪犯-欺诈师': { creditMin: 10, creditMax: 65, pointFormula: '教育×2＋外貌×2' },
  '罪犯-独行罪犯': { creditMin: 5, creditMax: 65, pointFormula: '教育×2＋敏捷或外貌×2' },
  '罪犯-女飞贼(古典)': { creditMin: 10, creditMax: 80, pointFormula: '教育×2＋外貌×2' },
  '罪犯-赃物贩子': { creditMin: 20, creditMax: 40, pointFormula: '教育×2＋外貌×2' },
  '罪犯-赝造者': { creditMin: 20, creditMax: 60, pointFormula: '教育×4' },
  '罪犯-走私者': { creditMin: 20, creditMax: 60, pointFormula: '教育×2＋外貌或敏捷×2' },
  '罪犯-混混': { creditMin: 3, creditMax: 10, pointFormula: '教育×2＋力量或敏捷×2' },
  '黑帮-黑帮老大': { creditMin: 60, creditMax: 95, pointFormula: '教育×2＋外貌×2' },
  '黑帮-马仔': { creditMin: 9, creditMax: 20, pointFormula: '教育×2＋力量或敏捷×2' },
  '勤杂护工': { creditMin: 6, creditMax: 15, pointFormula: '教育×2＋力量×2' },
  '事务所侦探/保安': { creditMin: 20, creditMax: 45, pointFormula: '教育×2＋力量或敏捷×2' },
  '摄影师': { creditMin: 9, creditMax: 30, pointFormula: '教育×4' },
  '职员/主管': { creditMin: 9, creditMax: 20, pointFormula: '教育×4' },
  '中高层管理人员': { creditMin: 20, creditMax: 80, pointFormula: '教育×4' },
  '程序员': { creditMin: 10, creditMax: 70, pointFormula: '教育×4' },
  '司机': { creditMin: 9, creditMax: 20, pointFormula: '教育×2＋力量或敏捷×2' },
  '私人司机': { creditMin: 10, creditMax: 40, pointFormula: '教育×2＋敏捷×2' },
  '出租车司机': { creditMin: 9, creditMax: 30, pointFormula: '教育×2＋敏捷×2' },
  '调查记者(原作向)': { creditMin: 9, creditMax: 30, pointFormula: '教育×4' },
  '通讯记者(原作向)': { creditMin: 9, creditMax: 30, pointFormula: '教育×4' },
  '伐木工': { creditMin: 9, creditMax: 30, pointFormula: '教育×2＋力量或敏捷×2' },
  '技工': { creditMin: 9, creditMax: 40, pointFormula: '教育×4' },
  '矿工': { creditMin: 9, creditMax: 30, pointFormula: '教育×2＋力量或敏捷×2' },
  '警探(原作向)': { creditMin: 20, creditMax: 50, pointFormula: '教育×2＋力量或敏捷×2' },
  '巡警(原作向)': { creditMin: 9, creditMax: 30, pointFormula: '教育×2＋力量或敏捷×2' },
  '刺客': { creditMin: 30, creditMax: 60, pointFormula: '教育×2＋力量或敏捷×2' },
  '银行劫匪': { creditMin: 5, creditMax: 75, pointFormula: '教育×2＋力量或敏捷×2' },
  '打手/暴徒': { creditMin: 5, creditMax: 30, pointFormula: '教育×2＋力量×2' },
  '窃贼': { creditMin: 5, creditMax: 40, pointFormula: '教育×2＋敏捷×2' },
  '欺诈师': { creditMin: 10, creditMax: 65, pointFormula: '教育×2＋外貌×2' },
  '独行罪犯': { creditMin: 5, creditMax: 65, pointFormula: '教育×2＋敏捷或外貌×2' },
  '女飞贼(古典)': { creditMin: 10, creditMax: 80, pointFormula: '教育×2＋外貌×2' },
  '赃物贩子': { creditMin: 20, creditMax: 40, pointFormula: '教育×2＋外貌×2' },
  '赝造者': { creditMin: 20, creditMax: 60, pointFormula: '教育×4' },
  '走私者': { creditMin: 20, creditMax: 60, pointFormula: '教育×2＋外貌或敏捷×2' },
  '混混': { creditMin: 3, creditMax: 10, pointFormula: '教育×2＋力量或敏捷×2' },
  '海军': { creditMin: 9, creditMax: 30, pointFormula: '教育×4' },
  '司法人员': { creditMin: 30, creditMax: 80, pointFormula: '教育×4' },
  '黑帮老大': { creditMin: 60, creditMax: 95, pointFormula: '教育×2＋外貌×2' },
  '黑帮马仔': { creditMin: 9, creditMax: 20, pointFormula: '教育×2＋力量或敏捷×2' },
}
