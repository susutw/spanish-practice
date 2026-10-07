(function () {
  'use strict';

  const { CATEGORIES, WORDS } = window.Words;
  const CAT = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]));
  const ALL_KEYS = CATEGORIES.map((c) => c.key);
  const NO_TILDE_MIN = 0.3; // 每一輪至少 30% 是「不用標」
  const TEST_SHARE = 5; // 約 1/5 的字保留給測驗

  // ---------- 題庫 ----------
  function hash(s) {
    let h = 2166136261;
    for (const ch of s) {
      h ^= ch.codePointAt(0);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  const ENTRIES = CATEGORIES.flatMap(({ key }) =>
    WORDS[key].split('\n').map((s) => s.trim()).filter(Boolean).map((line) => {
      const e = Accent.parseEntry(line, key);
      e.testOnly = hash(e.word) % TEST_SHARE === 0;
      e.info = Accent.explain(e);
      return e;
    })
  );
  const PRACTICE = ENTRIES.filter((e) => !e.testOnly);
  const TEST = ENTRIES.filter((e) => e.testOnly);
  const hasTilde = (e) => e.accentIndex >= 0;

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // 依類別取字；若「不用標」比例不足，從其他類別補不用標的字進來
  function buildPool(source, cats) {
    const pool = source.filter((e) => cats.has(e.category));
    const noCount = pool.filter((e) => !hasTilde(e)).length;
    let extras = [];
    if (pool.length && noCount / pool.length < NO_TILDE_MIN) {
      const need = Math.ceil((NO_TILDE_MIN * pool.length - noCount) / (1 - NO_TILDE_MIN));
      extras = shuffle(source.filter((e) => !cats.has(e.category) && !hasTilde(e))).slice(0, need);
    }
    return { items: pool.concat(extras), mixed: extras.length };
  }

  // 抽 n 題，保證不用標的字至少占 NO_TILDE_MIN
  function pickBalanced(items, n) {
    if (n >= items.length) return shuffle(items);
    const yes = shuffle(items.filter(hasTilde));
    const no = shuffle(items.filter((e) => !hasTilde(e)));
    let noTake = Math.max(Math.ceil(n * NO_TILDE_MIN), Math.round((n * no.length) / items.length));
    noTake = Math.min(noTake, no.length);
    const yesTake = Math.min(n - noTake, yes.length);
    noTake = Math.min(n - yesTake, no.length);
    return shuffle(yes.slice(0, yesTake).concat(no.slice(0, noTake)));
  }

  // ---------- 儲存 ----------
  const store = {
    get(k, d) {
      try {
        const v = localStorage.getItem(k);
        return v ? JSON.parse(v) : d;
      } catch {
        return d;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem(k, JSON.stringify(v));
      } catch {
        /* 私密模式等情況下無法儲存，忽略 */
      }
    },
  };

  const STATS_KEY = 'acento.stats.v1';
  const Stats = {
    data: store.get(STATS_KEY, { practice: {}, test: {}, history: [] }),
    record(mode, cat, ok) {
      const row = (this.data[mode][cat] ||= { c: 0, t: 0 });
      row.t++;
      if (ok) row.c++;
      store.set(STATS_KEY, this.data);
    },
    addTest(result) {
      this.data.history.unshift(result);
      this.data.history = this.data.history.slice(0, 10);
      store.set(STATS_KEY, this.data);
    },
    reset() {
      this.data = { practice: {}, test: {}, history: [] };
      store.set(STATS_KEY, this.data);
    },
  };

  // ---------- 語音 ----------
  const Speech = {
    supported: 'speechSynthesis' in window,
    voices: [],
    voice: null,
    rate: store.get('acento.rate', 0.85),
    init(onChange) {
      if (!this.supported) return onChange();
      const load = () => {
        const all = speechSynthesis.getVoices();
        this.voices = all
          .filter((v) => /^es([-_]|$)/i.test(v.lang))
          .sort((a, b) => a.lang.localeCompare(b.lang) || a.name.localeCompare(b.name));
        const saved = store.get('acento.voice', null);
        this.voice =
          this.voices.find((v) => v.voiceURI === saved) ||
          this.voices.find((v) => /es[-_]ES/i.test(v.lang) && v.localService) ||
          this.voices.find((v) => /es[-_]ES/i.test(v.lang)) ||
          this.voices[0] ||
          null;
        onChange();
      };
      load();
      speechSynthesis.addEventListener?.('voiceschanged', load);
    },
    setVoice(uri) {
      this.voice = this.voices.find((v) => v.voiceURI === uri) || null;
      store.set('acento.voice', uri);
    },
    setRate(r) {
      this.rate = r;
      store.set('acento.rate', r);
    },
    speak(text, slow) {
      if (!this.supported) return;
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = this.voice ? this.voice.lang : 'es-ES';
      if (this.voice) u.voice = this.voice;
      u.rate = slow ? Math.max(0.4, this.rate * 0.6) : this.rate;
      speechSynthesis.speak(u);
    },
  };

  function setupVoicebar() {
    const sel = document.getElementById('voice-select');
    const rate = document.getElementById('rate');
    const rateVal = document.getElementById('rate-val');
    const warn = document.getElementById('voice-warn');
    rate.value = Speech.rate;
    rateVal.textContent = `${Speech.rate}×`;
    rate.addEventListener('input', () => {
      Speech.setRate(Number(rate.value));
      rateVal.textContent = `${rate.value}×`;
    });
    sel.addEventListener('change', () => Speech.setVoice(sel.value));
    Speech.init(() => {
      sel.innerHTML = '';
      for (const v of Speech.voices) {
        const o = document.createElement('option');
        o.value = v.voiceURI;
        o.textContent = `${v.name}（${v.lang}）`;
        o.selected = v === Speech.voice;
        sel.appendChild(o);
      }
      sel.disabled = !Speech.voices.length;
      if (!Speech.supported) {
        warn.textContent = '這個瀏覽器不支援語音合成，請改用 Chrome、Edge 或 Safari。';
        warn.hidden = false;
      } else if (!Speech.voices.length) {
        warn.textContent = '找不到西班牙語語音。請在系統設定中安裝西班牙語語音（macOS：系統設定 → 輔助使用 → 語音內容；Windows：設定 → 時間與語言 → 語音）。';
        warn.hidden = false;
      } else {
        warn.hidden = true;
      }
    });
  }

  // ---------- 題目卡 ----------
  const ICON_SPEAKER =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a10 10 0 0 1 0 14"/></svg>';

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function withAccent(plain, idx) {
    if (idx < 0) return plain;
    const map = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú' };
    return plain.slice(0, idx) + map[plain[idx]] + plain.slice(idx + 1);
  }

  function createQuiz(root, { mode, onAnswered, onNext }) {
    root.innerHTML = `
      <div class="quiz">
        <div class="quiz-top"><span class="quiz-cat"></span><span class="quiz-progress"></span></div>
        <div class="audio-row">
          <button class="play-btn" data-act="play">${ICON_SPEAKER}<span>播放</span></button>
          <button class="play-btn slow" data-act="slow">慢速</button>
        </div>
        <div class="word" aria-label="點選要標重音的字母"></div>
        <div class="none-row"><button class="none-btn">不用標</button></div>
        <div class="feedback" hidden></div>
        <div class="next-row" hidden><button class="btn primary next-btn">下一題 →</button></div>
      </div>`;
    const card = root.querySelector('.quiz');
    const catEl = root.querySelector('.quiz-cat');
    const progEl = root.querySelector('.quiz-progress');
    const playBtn = root.querySelector('[data-act="play"]');
    const wordEl = root.querySelector('.word');
    const noneBtn = root.querySelector('.none-btn');
    const fbEl = root.querySelector('.feedback');
    const nextRow = root.querySelector('.next-row');
    const nextBtn = root.querySelector('.next-btn');
    let cur = null;
    let answered = false;
    let vowelBtns = [];

    playBtn.addEventListener('click', () => replay(false));
    root.querySelector('[data-act="slow"]').addEventListener('click', () => replay(true));
    noneBtn.addEventListener('click', () => answer(-1));
    nextBtn.addEventListener('click', () => onNext());

    function replay(slow) {
      if (!cur) return;
      playBtn.classList.remove('pulse');
      Speech.speak(cur.word, slow);
    }

    function show(entry, { progress = '', autoplay = true } = {}) {
      cur = entry;
      answered = false;
      card.classList.remove('answered');
      catEl.textContent = CAT[entry.category].name;
      progEl.textContent = progress;
      wordEl.innerHTML = '';
      vowelBtns = [];
      [...entry.plain].forEach((ch, i) => {
        if (Accent.VOWELS.includes(ch)) {
          const b = el('button', 'letter', ch);
          b.dataset.i = i;
          b.addEventListener('click', () => answer(i));
          vowelBtns.push(b);
          wordEl.appendChild(b);
        } else {
          wordEl.appendChild(el('span', 'letter consonant', ch));
        }
      });
      noneBtn.disabled = false;
      noneBtn.className = 'none-btn';
      fbEl.hidden = true;
      nextRow.hidden = true;
      if (autoplay) replay(false);
      else playBtn.classList.add('pulse');
    }

    function answer(idx) {
      if (!cur || answered) return;
      answered = true;
      card.classList.add('answered');
      const ok = idx === cur.accentIndex;
      for (const b of vowelBtns) b.disabled = true;
      noneBtn.disabled = true;
      if (cur.accentIndex >= 0) {
        const b = vowelBtns.find((x) => Number(x.dataset.i) === cur.accentIndex);
        b.textContent = cur.word[cur.accentIndex];
        b.classList.add('correct');
      } else {
        noneBtn.classList.add('correct');
      }
      if (!ok) {
        if (idx >= 0) vowelBtns.find((x) => Number(x.dataset.i) === idx).classList.add('wrong');
        else noneBtn.classList.add('wrong');
      }
      renderFeedback(ok, idx);
      fbEl.hidden = false;
      nextRow.hidden = false;
      nextBtn.focus({ preventScroll: true });
      Stats.record(mode, cur.category, ok);
      onAnswered(cur, ok);
    }

    function renderFeedback(ok, idx) {
      const info = cur.info;
      fbEl.innerHTML = '';
      fbEl.appendChild(el('div', `verdict ${ok ? 'ok' : 'bad'}`, ok ? '答對了！' : '不對喔'));
      const line = el('div', 'answer-line');
      line.appendChild(el('span', 'answer-word', cur.word));
      const syl = el('span', 'syllables');
      cur.syllables.forEach((s, i) => {
        if (i) syl.appendChild(document.createTextNode(' · '));
        syl.appendChild(i === cur.stressIndex ? el('b', null, s) : document.createTextNode(s));
      });
      line.appendChild(syl);
      if (!ok) line.appendChild(el('span', 'yours', `你的答案：${idx < 0 ? `${cur.plain}（不標）` : withAccent(cur.plain, idx)}`));
      fbEl.appendChild(line);
      const tags = el('div', 'tags');
      tags.appendChild(el('span', 'tag strong', info.typeName));
      tags.appendChild(el('span', 'tag', info.typeZh));
      if (info.hiato) tags.appendChild(el('span', 'tag strong', 'hiato'));
      tags.appendChild(el('span', 'tag', `類別：${CAT[cur.category].name}`));
      fbEl.appendChild(tags);
      const ul = el('ul', 'why');
      for (const l of info.lines) ul.appendChild(el('li', null, l));
      fbEl.appendChild(ul);
      if (cur.note) fbEl.appendChild(el('div', 'note', `備註：${cur.note}`));
    }

    function handleKey(e) {
      if (e.key === ' ') {
        e.preventDefault();
        replay(false);
      } else if (e.key === 'Enter' && answered) {
        e.preventDefault();
        onNext();
      } else if (!answered && e.key === '0') {
        answer(-1);
      } else if (!answered && /^[1-9]$/.test(e.key)) {
        const b = vowelBtns[Number(e.key) - 1];
        if (b) answer(Number(b.dataset.i));
      }
    }

    return { show, handleKey };
  }

  // ---------- 類別篩選 ----------
  function renderChips(container, selected, source, onChange) {
    container.innerHTML = '';
    const allBtn = el('button', 'chip', '全部');
    allBtn.setAttribute('aria-pressed', String(selected.size === ALL_KEYS.length));
    allBtn.addEventListener('click', () => {
      selected.clear();
      ALL_KEYS.forEach((k) => selected.add(k));
      renderChips(container, selected, source, onChange);
      onChange();
    });
    container.appendChild(allBtn);
    for (const c of CATEGORIES) {
      const count = source.filter((e) => e.category === c.key).length;
      const b = el('button', 'chip', c.name);
      b.title = c.zh;
      b.appendChild(el('small', null, String(count)));
      b.setAttribute('aria-pressed', String(selected.has(c.key) && selected.size !== ALL_KEYS.length));
      b.addEventListener('click', () => {
        // 從「全部」點某類別 → 只選該類別；否則切換
        if (selected.size === ALL_KEYS.length) {
          selected.clear();
          selected.add(c.key);
        } else if (selected.has(c.key)) {
          if (selected.size === 1) return;
          selected.delete(c.key);
        } else {
          selected.add(c.key);
        }
        renderChips(container, selected, source, onChange);
        onChange();
      });
      container.appendChild(b);
    }
  }

  function loadSelection(key) {
    const saved = store.get(key, ALL_KEYS).filter((k) => CAT[k]);
    return new Set(saved.length ? saved : ALL_KEYS);
  }

  // ---------- 練習 ----------
  const Practice = (() => {
    const selected = loadSelection('acento.practice.cats');
    let deck = [];
    let pos = 0;
    let session = { c: 0, t: 0 };
    let started = false;
    const sessionEl = document.getElementById('practice-session');
    const mixEl = document.getElementById('practice-mix');

    const quiz = createQuiz(document.getElementById('practice-quiz'), {
      mode: 'practice',
      onAnswered(entry, ok) {
        session.t++;
        if (ok) session.c++;
        // 答錯的字在幾題之後再出一次
        if (!ok) deck.splice(Math.min(deck.length, pos + 3 + Math.floor(Math.random() * 4)), 0, entry);
        renderSession();
      },
      onNext: () => next(true),
    });

    function rebuild() {
      const { items, mixed } = buildPool(PRACTICE, selected);
      deck = shuffle(items);
      pos = 0;
      mixEl.hidden = !mixed;
      mixEl.textContent = `這些類別幾乎都要標重音，已混入 ${mixed} 個其他類別「不用標」的字。`;
    }

    function next(autoplay) {
      if (pos >= deck.length) rebuild();
      quiz.show(deck[pos++], { autoplay });
    }

    function renderSession() {
      sessionEl.textContent = session.t ? `本次練習：${session.c} / ${session.t} 答對（${Math.round((session.c / session.t) * 100)}%）` : '';
    }

    renderChips(document.getElementById('practice-chips'), selected, PRACTICE, () => {
      store.set('acento.practice.cats', [...selected]);
      rebuild();
      next(true);
    });

    return {
      enter() {
        if (started) return;
        started = true;
        rebuild();
        next(false); // 瀏覽器要求使用者先互動才能發聲
      },
      handleKey: (e) => quiz.handleKey(e),
    };
  })();

  // ---------- 測驗 ----------
  const Test = (() => {
    const selected = loadSelection('acento.test.cats');
    const setupEl = document.getElementById('test-setup');
    const runEl = document.getElementById('test-run');
    const sumEl = document.getElementById('test-summary');
    const countSel = document.getElementById('test-count');
    const availEl = document.getElementById('test-available');
    let items = [];
    let pos = 0;
    let results = [];
    let running = false;

    const quiz = createQuiz(document.getElementById('test-quiz'), {
      mode: 'test',
      onAnswered(entry, ok) {
        results.push({ entry, ok });
      },
      onNext: () => (pos < items.length ? showCurrent() : finish()),
    });

    function updateAvail() {
      const { items: pool, mixed } = buildPool(TEST, selected);
      availEl.textContent = `可用 ${pool.length} 題${mixed ? `（含混入 ${mixed} 個不用標的字）` : ''}`;
    }

    function showCurrent() {
      quiz.show(items[pos], { progress: `${pos + 1} / ${items.length}` });
      pos++;
    }

    function start() {
      const { items: pool } = buildPool(TEST, selected);
      const n = countSel.value === 'all' ? pool.length : Number(countSel.value);
      items = pickBalanced(pool, n);
      pos = 0;
      results = [];
      running = true;
      setupEl.hidden = true;
      sumEl.hidden = true;
      runEl.hidden = false;
      showCurrent();
    }

    function finish() {
      running = false;
      const correct = results.filter((r) => r.ok).length;
      Stats.addTest({ date: new Date().toISOString(), correct, total: results.length, cats: [...selected] });
      const byCat = {};
      for (const r of results) {
        const row = (byCat[r.entry.category] ||= { c: 0, t: 0 });
        row.t++;
        if (r.ok) row.c++;
      }
      const wrong = results.filter((r) => !r.ok);
      sumEl.innerHTML = '';
      sumEl.appendChild(el('h2', null, '測驗結果'));
      sumEl.appendChild(el('p', 'score-big', `${correct} / ${results.length}`));
      sumEl.appendChild(statTable(byCat));
      if (wrong.length) {
        sumEl.appendChild(el('h3', null, '答錯的字'));
        const ul = el('ul', 'wrong-list');
        for (const { entry } of wrong) {
          const li = el('li');
          li.appendChild(el('b', null, entry.word));
          li.appendChild(document.createTextNode(` — ${entry.info.typeName}：${entry.info.lines[0]}`));
          ul.appendChild(li);
        }
        sumEl.appendChild(ul);
      }
      const again = el('button', 'btn primary', '再測一次');
      again.addEventListener('click', () => {
        sumEl.hidden = true;
        setupEl.hidden = false;
      });
      sumEl.appendChild(again);
      runEl.hidden = true;
      sumEl.hidden = false;
    }

    renderChips(document.getElementById('test-chips'), selected, TEST, () => {
      store.set('acento.test.cats', [...selected]);
      updateAvail();
    });
    updateAvail();
    document.getElementById('test-start').addEventListener('click', start);

    return {
      handleKey(e) {
        if (running) quiz.handleKey(e);
      },
    };
  })();

  // ---------- 統計 ----------
  function statTable(data) {
    const table = el('table', 'stat-table');
    table.innerHTML = '<thead><tr><th>類別</th><th></th><th class="num">答對 / 作答</th><th class="num">答對率</th></tr></thead>';
    const tbody = el('tbody');
    let sc = 0;
    let st = 0;
    const rows = CATEGORIES.map((c) => [c.name, data[c.key] || { c: 0, t: 0 }]);
    for (const [, r] of rows) {
      sc += r.c;
      st += r.t;
    }
    rows.push(['合計', { c: sc, t: st }]);
    for (const [name, r] of rows) {
      const tr = el('tr');
      tr.appendChild(el('td', null, name));
      const barTd = el('td');
      const bar = el('div', 'bar');
      const fill = el('span');
      fill.style.width = r.t ? `${(r.c / r.t) * 100}%` : '0';
      bar.appendChild(fill);
      barTd.appendChild(bar);
      tr.appendChild(barTd);
      tr.appendChild(el('td', 'num', `${r.c} / ${r.t}`));
      tr.appendChild(el('td', 'num', r.t ? `${Math.round((r.c / r.t) * 100)}%` : '—'));
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    return table;
  }

  function renderStats() {
    const p = document.getElementById('stats-practice');
    const t = document.getElementById('stats-test');
    const h = document.getElementById('stats-history');
    p.replaceChildren(statTable(Stats.data.practice));
    t.replaceChildren(statTable(Stats.data.test));
    h.innerHTML = '';
    if (!Stats.data.history.length) {
      h.appendChild(el('p', 'muted', '還沒有測驗紀錄。'));
      return;
    }
    const ul = el('ul', 'wrong-list');
    for (const r of Stats.data.history) {
      const d = new Date(r.date);
      const cats = r.cats.length === ALL_KEYS.length ? '全部類別' : r.cats.map((k) => CAT[k]?.name).join('、');
      ul.appendChild(el('li', null, `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — ${r.correct} / ${r.total}（${cats}）`));
    }
    h.appendChild(ul);
  }

  document.getElementById('stats-reset').addEventListener('click', () => {
    if (confirm('確定要清除所有練習與測驗紀錄？')) {
      Stats.reset();
      renderStats();
    }
  });

  // ---------- 路由 ----------
  const VIEWS = ['practice', 'test', 'stats', 'rules'];
  let current = null;

  function route() {
    const name = VIEWS.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'practice';
    current = name;
    for (const v of VIEWS) document.getElementById(`view-${v}`).hidden = v !== name;
    for (const a of document.querySelectorAll('.tabs a')) a.classList.toggle('active', a.dataset.view === name);
    document.getElementById('voicebar').hidden = !(name === 'practice' || name === 'test');
    if (name === 'practice') Practice.enter();
    if (name === 'stats') renderStats();
  }

  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target.closest('select, input, textarea')) return;
    // 按鈕聚焦時 Enter 交給按鈕本身處理，避免重複觸發
    if (e.key === 'Enter' && e.target.closest('button')) return;
    if (current === 'practice') Practice.handleKey(e);
    else if (current === 'test') Test.handleKey(e);
  });

  window.addEventListener('hashchange', route);
  setupVoicebar();
  route();
})();
