const fs = require('fs');
const path = require('path');

/** Skip commas and whitespace; return new index */
function skipCommaAndSpace(str, i) {
  while (i < str.length && /[\s,]/.test(str[i])) i++;
  return i;
}

/** Parse skills block string to array of skill name strings */
function parseSkillsBlock(block) {
  const out = [];
  const str = block.trim();
  let i = 0;
  while (i < str.length) {
    i = skipCommaAndSpace(str, i);
    if (i >= str.length) break;
    const rest = str.slice(i);
    if (rest[0] === '"') {
      const end = rest.indexOf('"', 1);
      if (end === -1) break;
      out.push(rest.slice(1, end));
      i += end + 1;
      continue;
    }
    if (rest[0] === '[') {
      let depth = 1;
      let j = 1;
      while (depth > 0 && j < rest.length) {
        if (rest[j] === '[') depth++;
        else if (rest[j] === ']') depth--;
        j++;
      }
      const inner = parseSkillsBlock(rest.slice(1, j - 1));
      out.push(...inner);
      i += j;
      continue;
    }
    if (rest[0] === '{') {
      let depth = 1;
      let j = 1;
      while (depth > 0 && j < rest.length) {
        if (rest[j] === '{') depth++;
        else if (rest[j] === '}') depth--;
        j++;
      }
      const objStr = rest.slice(1, j - 1);
      const colon = objStr.indexOf(':');
      if (colon !== -1) {
        const key = objStr.slice(0, colon).trim();
        const keyName = key.startsWith('"') ? key.slice(1, -1) : key;
        const val = objStr.slice(colon + 1).trim();
        const valMatch = val.match(/^"([^"]*)"$/);
        const valStr = valMatch ? valMatch[1] : '';
        if (valStr) out.push(keyName + '(' + valStr + ')');
        else out.push(keyName);
      }
      i += j;
      continue;
    }
    i++;
  }
  return out.filter((s) => s && !/^[\s,]+$/.test(s));
}

const content = fs.readFileSync(path.join(__dirname, '../public/beautified.js'), 'utf8');

// Find gr = [ ... ]; then extract blocks by matching "name: \"...\"" (so we don't split inside skills arrays)
const grStart = content.indexOf('gr = [');
if (grStart === -1) throw new Error('gr = [ not found');
const afterBracket = content.indexOf('[', grStart) + 1;
const grEnd = content.indexOf('}];', afterBracket);
if (grEnd === -1) throw new Error('}]; not found');
const grContent = content.slice(afterBracket, grEnd + 1);

const nameRe = /name:\s*"([^"]+)"/g;
const nameMatches = [];
let m;
while ((m = nameRe.exec(grContent)) !== null) nameMatches.push({ name: m[1], start: m.index });

const blocks = [];
for (let i = 0; i < nameMatches.length; i++) {
  const start = nameMatches[i].start;
  const end = i + 1 < nameMatches.length ? nameMatches[i + 1].start : grContent.length;
  blocks.push({ name: nameMatches[i].name, block: grContent.slice(start, end) });
}

const occupationCareers = {};
for (const { name, block } of blocks) {
  const skillsStart = block.indexOf('skills:');
  if (skillsStart === -1) continue;
  const bracketStart = block.indexOf('[', skillsStart);
  if (bracketStart === -1) continue;
  let depth = 1;
  let j = bracketStart + 1;
  while (depth > 0 && j < block.length) {
    if (block[j] === '[') depth++;
    else if (block[j] === ']') depth--;
    j++;
  }
  const skillsBlock = block.slice(bracketStart + 1, j - 1);
  occupationCareers[name] = parseSkillsBlock(skillsBlock).filter(Boolean);
}

const out = `/**
 * COC 7th 职业本职技能（从 public/beautified.js gr 提取）
 * 由 scripts/extract-occupations.cjs 生成
 */
export const OCCUPATION_CAREER_SKILLS = ${JSON.stringify(occupationCareers, null, 2)};
`;

fs.writeFileSync(path.join(__dirname, '../src/data/occupationCareers.js'), out, 'utf8');
console.log('Written src/data/occupationCareers.js, occupations:', Object.keys(occupationCareers).length);
