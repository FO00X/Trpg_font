/**
 * 角色卡相关共享常量（COC 7th）
 */

// 信用评级对照表：根据技能值查出等级名称与生活规格描述
export const CREDIT_TABLE = [
  {
    max: 9,
    creditRating: '身无分文',
    lifeStyleDesc: '连最基础的贫穷线都未触及，名下无任何资产与收入。\n居所：无固定住处，仅能露宿街头、桥洞或废弃场所。\n出行：纯步行、扒乘交通工具，或靠逃票搭乘火车、轮船，无任何合规出行保障。',
  },
  {
    max: 19,
    creditRating: '贫穷',
    lifeStyleDesc: '仅能维持最低限度生存，勉强覆盖最廉价的栖身与果腹需求。\n居所：最简陋的出租棚屋、廉价睡袋旅馆，无任何生活配套。\n出行：仅选择最低廉的公共交通，优先价格而非时效与安全，稳定性极差。',
  },
  {
    max: 49,
    creditRating: '标准',
    lifeStyleDesc: '拥有安稳的基础生活水平，满足日常温饱与基础需求。\n居所：普通公寓/民居，可租赁或自有，配套齐全。\n出行：常规民用交通，拥有个人代步车辆，出行便捷且稳定。\n饮食：三餐规律，偶尔在外就餐，无生存压力。',
  },
  {
    max: 69,
    creditRating: '小康',
    lifeStyleDesc: '脱离基础生存，可享受品质生活与轻奢消费。\n居所：户型/地段优质的住宅，部分配有佣人（管家、保洁、园丁等），城郊或乡间另有度假居所，出行可入住高端酒店。\n出行：高端代步车辆，长途优先舒适舱位，注重体验而非性价比。',
  },
  {
    max: 89,
    creditRating: '富裕',
    lifeStyleDesc: '全面享受顶级物质资源，消费无需考量成本。\n居所：市中心豪宅、带庭院的庄园，配专属仆从团队（管家、女仆、园丁、厨师等），全球多地拥有度假别墅，常住顶级酒店套房。\n出行：私人高端座驾、头等舱/商务包机，交通以极致舒适与私密为核心。',
  },
  {
    max: 99,
    creditRating: '豪富',
    lifeStyleDesc: '财富已脱离实用价值，仅为数字符号，位列全球顶层财富圈层。\n生活规格与富裕层级相近，但资源、人脉、资产规模无上限，任何消费与需求均可无条件满足，金钱不再构成任何约束。',
  },
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
