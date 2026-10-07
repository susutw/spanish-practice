// 驗證題庫：每個字的重音音節標註都必須和規則推導出的「要不要標、標在哪」一致。
// 用法：node scripts/validate.js
const Accent = require('../js/accent.js');
const { CATEGORIES, WORDS } = require('../js/words.js');

const seen = new Map();
let errors = 0;
let total = 0;
for (const { key } of CATEGORIES) {
  const lines = WORDS[key].split('\n').map((s) => s.trim()).filter(Boolean);
  let tilde = 0;
  for (const line of lines) {
    const e = Accent.parseEntry(line, key);
    total++;
    if (e.accentIndex >= 0) tilde++;
    const errs = Accent.validate(e);
    if (seen.has(e.word)) errs.push(`重複（已出現在 ${seen.get(e.word)}）`);
    seen.set(e.word, key);
    if (errs.length) {
      errors++;
      console.log(`✗ [${key}] ${line}: ${errs.join('；')}`);
    }
  }
  console.log(`${key.padEnd(10)} ${String(lines.length).padStart(3)} 字（要標 ${tilde}、不用標 ${lines.length - tilde}）`);
}
// 「比較」字組：標註要符合規則，同組拼法相同，且每個字重音位置不同
const { PAIRS } = require('../js/pairs.js');
const groups = Accent.parseGroups(PAIRS);
for (const g of groups) {
  const label = g.map((e) => e.raw).join(' / ');
  const errs = [];
  for (const e of g) errs.push(...Accent.validate(e).map((m) => `${e.raw}: ${m}`));
  if (g.length < 2) errs.push('一組至少要兩個字');
  if (new Set(g.map((e) => e.plain)).size !== 1) errs.push('去掉重音後拼法不同');
  if (new Set(g.map((e) => e.word)).size !== g.length) errs.push('有重複的字');
  if (errs.length) {
    errors++;
    console.log(`✗ [比較] ${label}: ${errs.join('；')}`);
  }
}
console.log(`比較字組   ${groups.length} 組`);

console.log(`\n共 ${total} 字，${errors} 個錯誤`);
process.exit(errors ? 1 : 0);
