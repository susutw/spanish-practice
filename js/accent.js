// 重音規則核心：解析題庫格式、判斷重音類型、產生規則說明。
// 題庫格式："can-CIÓN|備註" — 用 - 分音節，重音音節全大寫，| 後為選填備註。
(function (root) {
  'use strict';

  const UNACCENT = { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u' };
  const STRONG = 'aeo';
  const WEAK = 'iu';
  const VOWELS = 'aeiou';

  function strip(s) {
    return s.replace(/[áéíóú]/g, (c) => UNACCENT[c]);
  }

  function isUpper(s) {
    return s === s.toUpperCase() && s !== s.toLowerCase();
  }

  function parseEntry(raw, category) {
    const [form, note = ''] = raw.split('|').map((s) => s.trim());
    const parts = form.split('-');
    const stressed = parts.map(isUpper);
    const syllables = parts.map((p) => p.toLowerCase());
    const word = syllables.join('');
    const accentIndex = word.search(/[áéíóú]/);
    return {
      raw: form,
      word,
      plain: strip(word),
      syllables,
      stressIndex: stressed.indexOf(true),
      stressCount: stressed.filter(Boolean).length,
      accentIndex,
      category,
      note,
    };
  }

  // 重音落在弱母音 i/u，且隔壁音節是強母音 a/e/o（中間的 h 不影響）
  function detectHiato(e) {
    const k = e.stressIndex;
    const syl = strip(e.syllables[k]);
    const core = syl.replace(/^h/, '');
    const next = k + 1 < e.syllables.length ? strip(e.syllables[k + 1]).replace(/^h/, '') : '';
    const prev = k > 0 ? strip(e.syllables[k - 1]) : '';
    const endsWeak = WEAK.includes(syl.slice(-1)) && STRONG.includes(next[0] || '-');
    const startsWeak = WEAK.includes(core[0]) && STRONG.includes(prev.slice(-1) || '-');
    return endsWeak || startsWeak;
  }

  function analyze(e) {
    const n = e.syllables.length;
    const fromEnd = n - 1 - e.stressIndex;
    const last = e.plain.slice(-1);
    const endsVNS = (VOWELS + 'ns').includes(last);
    let type;
    if (n === 1) type = 'mono';
    else if (fromEnd === 0) type = 'aguda';
    else if (fromEnd === 1) type = 'llana';
    else if (fromEnd === 2) type = 'esdrujula';
    else type = 'sobresdrujula';

    const hiato = n > 1 && detectHiato(e);
    let expectTilde;
    if (type === 'mono') expectTilde = false;
    else if (hiato) expectTilde = true;
    else if (type === 'aguda') expectTilde = endsVNS;
    else if (type === 'llana') expectTilde = !endsVNS;
    else expectTilde = true;

    return { type, hiato, endsVNS, last, expectTilde };
  }

  const TYPE_INFO = {
    mono: { name: 'monosílabo', zh: '單音節字' },
    aguda: { name: 'aguda', zh: '重音在最後一個音節' },
    llana: { name: 'llana', zh: '重音在倒數第二個音節' },
    esdrujula: { name: 'esdrújula', zh: '重音在倒數第三個音節' },
    sobresdrujula: { name: 'sobresdrújula', zh: '重音在倒數第四個音節' },
  };

  function describeEnding(last) {
    if (VOWELS.includes(last)) return `母音「${last}」`;
    if (last === 'n' || last === 's') return `「${last}」`;
    if (last === 'y') return '「y」（字尾的 y 算子音）';
    return `子音「${last}」`;
  }

  // 找出同一音節內的雙母音，以及跨音節的強母音相連，作為補充說明
  function vowelNotes(e, a) {
    const notes = [];
    for (const syl of e.syllables) {
      const m = strip(syl).match(/[aeiou]{2,}/);
      if (m && /[iu]/.test(m[0])) {
        notes.push(`「${m[0]}」是雙母音（diptongo），算在同一個音節「${syl}」裡。`);
        break;
      }
    }
    if (!a.hiato) {
      for (let i = 0; i + 1 < e.syllables.length; i++) {
        const end = strip(e.syllables[i]).slice(-1);
        const start = strip(e.syllables[i + 1])[0];
        if (STRONG.includes(end) && STRONG.includes(start)) {
          notes.push(`「${end}」和「${start}」都是強母音，自然分成兩個音節，照一般規則判斷即可。`);
          break;
        }
      }
    }
    return notes;
  }

  function explain(e) {
    const a = analyze(e);
    const info = TYPE_INFO[a.type];
    const lines = [];
    if (a.type === 'mono') {
      lines.push('單音節字原則上不標重音（區別重音的字例外，見「規則」頁）。');
    } else if (a.hiato) {
      lines.push('重音落在弱母音 i / u，旁邊又是強母音 a / e / o，兩個母音分開唸（hiato）。');
      lines.push('這種情況一律在 i / u 上標重音，不看一般規則。');
    } else if (a.type === 'aguda') {
      lines.push(a.endsVNS
        ? `aguda 結尾是${describeEnding(a.last)} → 要標重音。`
        : `aguda 結尾是${describeEnding(a.last)}，不是母音、n、s → 不用標。`);
    } else if (a.type === 'llana') {
      lines.push(a.endsVNS
        ? `llana 結尾是${describeEnding(a.last)} → 不用標。`
        : `llana 結尾是${describeEnding(a.last)}，不是母音、n、s → 要標重音。`);
    } else {
      lines.push(`${info.name} 一律要標重音。`);
    }
    lines.push(...vowelNotes(e, a));
    return { type: a.type, typeName: info.name, typeZh: info.zh, hiato: a.hiato, needsTilde: a.expectTilde, lines };
  }

  const ACCENT = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú' };

  // 音節的主要母音：有強母音取強母音，否則取最後一個母音；que/qui/gue/gui 的 u 不發音
  function nucleusIndex(syl) {
    const idx = [];
    for (let i = 0; i < syl.length; i++) {
      if (!VOWELS.includes(syl[i])) continue;
      if (syl[i] === 'u' && /[qg]/.test(syl[i - 1] || '') && /[ei]/.test(syl[i + 1] || '')) continue;
      idx.push(i);
    }
    return idx.find((i) => STRONG.includes(syl[i])) ?? idx[idx.length - 1];
  }

  // 把重音分別放在每個音節的唸法（真正的字標 real: true）。
  // 單音節字，或母音相連牽涉弱母音（移動重音會改變音節數）時回傳 null。
  function stressVariants(e) {
    const n = e.syllables.length;
    if (n < 2) return null;
    const plainSyl = e.syllables.map(strip);
    for (let i = 0; i + 1 < n; i++) {
      const a = plainSyl[i].slice(-1);
      const b = plainSyl[i + 1].replace(/^h/, '')[0];
      if (VOWELS.includes(a) && VOWELS.includes(b) && (WEAK.includes(a) || WEAK.includes(b))) return null;
    }
    return plainSyl.map((syl, k) => {
      if (k === e.stressIndex) return { k, word: e.word, syllables: e.syllables, real: true };
      const nuc = nucleusIndex(syl);
      const syls = plainSyl.slice();
      syls[k] = syl.slice(0, nuc) + ACCENT[syl[nuc]] + syl.slice(nuc + 1);
      return { k, word: syls.join(''), syllables: syls, real: false };
    });
  }

  // 解析「比較」字組：每組用空行分開
  function parseGroups(text) {
    return text
      .split(/\n\s*\n/)
      .map((block) => block.split('\n').map((s) => s.trim()).filter(Boolean).map((line) => parseEntry(line, 'pair')))
      .filter((g) => g.length);
  }

  // 回傳錯誤訊息陣列，空陣列代表此字標註與規則一致
  function validate(e) {
    const errs = [];
    if (e.stressCount !== 1) return [`重音音節數量應為 1，實際為 ${e.stressCount}`];
    if (!/^[a-záéíóúñü]+$/.test(e.word)) errs.push('含有非法字元');
    if ((e.word.match(/[áéíóú]/g) || []).length > 1) errs.push('有多個重音符號');
    const a = analyze(e);
    const has = e.accentIndex >= 0;
    if (a.expectTilde !== has) {
      errs.push(`依規則（${a.type}${a.hiato ? ', hiato' : ''}）${a.expectTilde ? '應該' : '不應'}標重音`);
    }
    if (has) {
      const before = e.syllables.slice(0, e.stressIndex).join('').length;
      const len = e.syllables[e.stressIndex].length;
      if (e.accentIndex < before || e.accentIndex >= before + len) errs.push('重音符號不在重音音節上');
    }
    return errs;
  }

  const Accent = { strip, parseEntry, analyze, explain, validate, stressVariants, parseGroups, VOWELS };
  if (typeof module !== 'undefined' && module.exports) module.exports = Accent;
  else root.Accent = Accent;
})(typeof window !== 'undefined' ? window : globalThis);
