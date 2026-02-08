const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '../public/beautified.js'), 'utf8');
const start = content.indexOf('const o1 = [') + 12;
let end = content.indexOf('    Yx = ');
end = content.lastIndexOf('}', end) + 1;
const arrStr = content.slice(start, end);

let arr;
try {
  arr = eval('[' + arrStr + ']');
} catch (e) {
  console.error(e.message);
  process.exit(1);
}

const Yx = {
  cg: ['徒手格斗','弓箭','黄铜指虎','长鞭','燃烧的火把','链锯','包革金属棒(大头棍、护身棒)','大棒(棒球棒、拨火棍)','小型棍棒(警棍)','弩','绞索','手斧/手镰','大型刀(甘蔗刀等)','中型刀(切肉餐刀等)','小型刀(弹簧折叠刀等)','220V通电导线','催泪喷雾','双节棍','投石','手里剑','矛、骑士长枪','投矛','大型剑(马刀)','中型剑(佩剑、重剑)','轻型剑(花剑、剑杖)','电棍','电击枪','战斗回力镖','伐木斧'],
  sq: ['燧发手枪','.22(5.6mm)小型自动手枪','.25(6.35mm)短口手枪(单管)','.32(7.65mm)左轮','.32(7.65mm)自动手枪','.357马格南左轮','.38(9mm)左轮','.38(9mm)自动手枪','贝瑞塔M9','9mm格洛克17','9mm鲁格P08','.41(10.4mm)左轮','.44(11.2mm)马格南左轮','.45(11.43mm)左轮','.45(11.43mm)自动手枪','IMI 沙漠之鹰'],
  bbq: ['.58 (14.7mm)1855年式春田步枪','.22 (5.6mm)栓式枪机步枪','.30 (7.62mm)杠杆式枪机步枪','.45 (11.43mm)马蒂尼-亨利步枪','莫兰上校的气动步枪③','加兰德M1、M2步枪','SKS半自动步枪(56半)','.303(7.7mm)李-恩菲尔德','.30-06(7.62mm)手动枪机步枪','.30-06(7.62mm)半自动步枪','.444(11.28mm)马林步枪','猎象枪(双管)'],
  tsq: ['AK-47或AKM','AK-74','FN FAL 突击步枪','加利尔突击步枪','M16A2','M4','斯泰尔AUG','贝雷塔AR70/90'],
  xdq: ['20号霰弹枪(双管)','16号霰弹枪(双管)','12号霰弹枪(双管)','12号霰弹枪(手压式)','12号霰弹枪(半自动)','12号霰弹枪(双管,锯短)','10号霰弹枪(双管)','12号贝里尼M3(折叠式枪托)','12号SPAS (折叠式枪托)'],
  cfq: ['MP18I/M现代28II','MP5','MAC-11','蝎式','汤普森','乌兹'],
  jjbq: ['巴雷特M82','PTRD-41反坦克步枪'],
  jq: ['1882年式加特林','M1918式勃朗宁自动步枪','勃朗宁M1917A1(7.62mm)','布伦轻机枪','路易斯Ⅰ型机枪','GE M134式7.62mm速射机枪','FN 米尼米，弹夹/弹带','维克斯.303机枪'],
  qt: ['莫洛托夫鸡尾酒','信号枪(信号弹枪)','M79式40mm榴弹发射器','炸药棒','雷管','爆破筒','塑胶炸弹(C-4)，4盎司','手榴弹','81mm迫击炮','75mm野战火炮','120mm坦克主炮','5英寸(127mm)舰炮','反步兵地雷','阔剑地雷','火焰喷射器','M72式单发轻型反坦克炮']
};

const nameToCat = {};
for (const [catId, names] of Object.entries(Yx)) {
  for (const n of names) nameToCat[n] = catId;
}

function toApp(w, i) {
  const penetrate = w.tho === 1 ? '1' : (w.tho === 0 ? '' : String(w.tho || ''));
  return {
    id: 'w_' + i,
    name: w.name || '',
    skill: w.skill || '',
    success: '',
    damage: w.dam || '',
    range: w.range || '',
    penetrate,
    attacks: (w.round != null && w.round !== '') ? String(w.round) : '',
    ammo: (w.num != null && w.num !== '') ? String(w.num) : '',
    malfunction: (w.err != null && w.err !== '') ? String(w.err) : '',
    categoryId: nameToCat[w.name] || 'qt'
  };
}

const converted = arr.map(toApp);
const categories = [
  ['cg', '常规'], ['sq', '手枪'], ['bbq', '半自动步枪'], ['tsq', '全自动步枪'],
  ['xdq', '霰弹枪'], ['cfq', '冲锋枪'], ['jjbq', '狙击步枪'], ['jq', '机枪'], ['qt', '其它']
];

const out = `/**
 * COC 7th 预设武器（来自规则书），创建角色时选择武器使用
 * 由 scripts/extract-weapons.cjs 从 public/beautified.js 生成
 */

export const WEAPON_CATEGORIES = ${JSON.stringify(categories.map(([id, label]) => ({ id, label })), null, 2)};

export const PRESET_WEAPONS_FULL = ${JSON.stringify(converted, null, 2)};
`;

fs.writeFileSync(path.join(__dirname, '../src/data/presetWeapons.js'), out, 'utf8');
console.log('Written src/data/presetWeapons.js, weapons:', arr.length);
