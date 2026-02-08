/**
 * 角色卡相关共享常量（COC 7th）
 */

// 信用评级对照表：根据技能值查出现金/消费/资产描述
export const CREDIT_TABLE = [
  { max: 4, creditRating: '无', cash: '$0', spendingLevelDesc: '无', assetsDesc: '一无所有' },
  { max: 9, creditRating: '赤贫', cash: '$5', spendingLevelDesc: '仅能糊口', assetsDesc: '极少' },
  { max: 19, creditRating: '贫困', cash: '$20', spendingLevelDesc: '勉强维持', assetsDesc: '很少' },
  { max: 29, creditRating: '一般偏下', cash: '$50', spendingLevelDesc: '日常温饱', assetsDesc: '有限' },
  { max: 49, creditRating: '一般', cash: '$100', spendingLevelDesc: '一般生活', assetsDesc: '一般' },
  { max: 69, creditRating: '小康', cash: '$200', spendingLevelDesc: '舒适', assetsDesc: '可观' },
  { max: 89, creditRating: '富裕', cash: '$500', spendingLevelDesc: '宽裕', assetsDesc: '丰厚' },
  { max: 99, creditRating: '极富', cash: '$2,000', spendingLevelDesc: '奢华', assetsDesc: '巨额' },
]

// 属性缩写标签
export const CHAR_LABELS = {
  str: '力量STR',
  dex: '敏捷DEX',
  siz: '体型SIZ',
  app: '外貌APP',
  con: '体质CON',
  int: '智力INT',
  pow: '意志POW',
  edu: '教育EDU',
  luc: '幸运LUC',
}

// 背景故事字段标签与顺序
export const STORY_LABELS = {
  intro: '个人介绍',
  appearance: '形象描述',
  belief: '思想与信念',
  importantPerson: '重要之人',
  significantPlace: '意义非凡之地',
  preciousThing: '宝贵之物',
  traits: '特质',
  woundsScars: '伤口与疤痕',
  mentalDisorder: '精神症状',
}

export const STORY_KEYS = [
  'intro',
  'appearance',
  'belief',
  'importantPerson',
  'significantPlace',
  'preciousThing',
  'traits',
  'woundsScars',
  'mentalDisorder',
]
