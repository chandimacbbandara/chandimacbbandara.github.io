/* ==========================================================
   lab.js — live / ML-flavoured additions for the portfolio
   1. In-browser neural-net playground (real backprop, no libs)
   2. Live GitHub panel (public API, cached)
   3. Live Hugging Face Space status
   4. Hero status strip (Colombo clock, last push)
   5. Ctrl/⌘ + K command palette
   Loads after main.js and never touches its state.
   ========================================================== */
(function (root) {
  'use strict';

  /* ------------------------------------------------------
     Pure ML core (no DOM) — also exported for Node testing
     ------------------------------------------------------ */
  const sigmoid = z => 1 / (1 + Math.exp(-z));
  const gauss = () => {
    const u = 1 - Math.random(), v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };

  class MLP {
    /* sizes e.g. [2,12,12,1]; tanh hidden, sigmoid output, BCE loss, Adam */
    constructor(sizes, lr = 0.02) {
      this.s = sizes; this.lr = lr; this.t = 0;
      this.W = []; this.b = []; this.mW = []; this.vW = []; this.mb = []; this.vb = [];
      for (let l = 0; l < sizes.length - 1; l++) {
        const i = sizes[l], o = sizes[l + 1], lim = Math.sqrt(6 / (i + o));
        const w = new Float64Array(i * o);
        for (let k = 0; k < w.length; k++) w[k] = (Math.random() * 2 - 1) * lim;
        this.W.push(w); this.b.push(new Float64Array(o));
        this.mW.push(new Float64Array(i * o)); this.vW.push(new Float64Array(i * o));
        this.mb.push(new Float64Array(o));     this.vb.push(new Float64Array(o));
      }
    }
    forward(x) {
      const L = this.s.length - 1, a = [Float64Array.from(x)];
      for (let l = 0; l < L; l++) {
        const i = this.s[l], o = this.s[l + 1], W = this.W[l], b = this.b[l], inp = a[l];
        const out = new Float64Array(o);
        for (let j = 0; j < o; j++) {
          let s = b[j];
          for (let k = 0; k < i; k++) s += W[j * i + k] * inp[k];
          out[j] = l === L - 1 ? sigmoid(s) : Math.tanh(s);
        }
        a.push(out);
      }
      return a;
    }
    predict(x) { const a = this.forward(x); return a[a.length - 1][0]; }
    trainBatch(X, Y, idx) {
      const L = this.s.length - 1, n = idx.length, eps = 1e-9;
      const gW = this.W.map(w => new Float64Array(w.length));
      const gb = this.b.map(b => new Float64Array(b.length));
      let loss = 0;
      for (const id of idx) {
        const a = this.forward(X[id]), y = Y[id], p = a[L][0];
        loss += -(y * Math.log(p + eps) + (1 - y) * Math.log(1 - p + eps));
        let delta = Float64Array.of(p - y);
        for (let l = L - 1; l >= 0; l--) {
          const i = this.s[l], o = this.s[l + 1], W = this.W[l], inp = a[l];
          for (let j = 0; j < o; j++) {
            gb[l][j] += delta[j];
            for (let k = 0; k < i; k++) gW[l][j * i + k] += delta[j] * inp[k];
          }
          if (l > 0) {
            const nd = new Float64Array(i);
            for (let k = 0; k < i; k++) {
              let s = 0;
              for (let j = 0; j < o; j++) s += W[j * i + k] * delta[j];
              nd[k] = s * (1 - inp[k] * inp[k]);
            }
            delta = nd;
          }
        }
      }
      // Adam
      this.t++;
      const b1 = 0.9, b2 = 0.999, e = 1e-8;
      const c1 = 1 - Math.pow(b1, this.t), c2 = 1 - Math.pow(b2, this.t);
      for (let l = 0; l < L; l++) {
        const upd = (P, G, M, V) => {
          for (let k = 0; k < P.length; k++) {
            const g = G[k] / n;
            M[k] = b1 * M[k] + (1 - b1) * g;
            V[k] = b2 * V[k] + (1 - b2) * g * g;
            P[k] -= this.lr * (M[k] / c1) / (Math.sqrt(V[k] / c2) + e);
          }
        };
        upd(this.W[l], gW[l], this.mW[l], this.vW[l]);
        upd(this.b[l], gb[l], this.mb[l], this.vb[l]);
      }
      return loss / n;
    }
  }

  /* 2-D toy datasets in roughly [-1, 1]^2, labels 0/1 */
  function makeData(name, n = 220) {
    const X = [], Y = [];
    for (let i = 0; i < n; i++) {
      const c = i % 2;
      let x, y;
      if (name === 'moons') {
        const t = Math.random() * Math.PI;
        x = c ? 1 - Math.cos(t) : Math.cos(t);
        y = c ? 0.5 - Math.sin(t) : Math.sin(t);
        x = (x - 0.5) / 1.6 + gauss() * 0.07;
        y = (y - 0.25) / 0.9 + gauss() * 0.07;
      } else if (name === 'circles') {
        const r = (c ? 0.8 : 0.35) + gauss() * 0.05, a = Math.random() * 2 * Math.PI;
        x = r * Math.cos(a); y = r * Math.sin(a);
      } else if (name === 'spiral') {
        const t = 0.15 + Math.random() * 0.85, a = t * 3 * Math.PI + c * Math.PI;
        x = 0.9 * t * Math.cos(a) + gauss() * 0.03;
        y = 0.9 * t * Math.sin(a) + gauss() * 0.03;
      } else { // xor
        x = (Math.random() * 2 - 1) * 0.92; y = (Math.random() * 2 - 1) * 0.92;
        if (Math.abs(x) < 0.08) x += x < 0 ? -0.1 : 0.1;
        if (Math.abs(y) < 0.08) y += y < 0 ? -0.1 : 0.1;
        X.push([x, y]); Y.push(x * y > 0 ? 1 : 0); continue;
      }
      X.push([x, y]); Y.push(c);
    }
    return { X, Y };
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { MLP, makeData };
  if (typeof document === 'undefined') return;

  /* ------------------------------------------------------
     Helpers
     ------------------------------------------------------ */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const GH_USER = 'chandimacbbandara';
  const HF_USER = 'chandimabandara';

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function rel(t) {
    const s = (Date.now() - new Date(t).getTime()) / 1000;
    if (!isFinite(s) || s < 60) return 'just now';
    if (s < 3600) return Math.floor(s / 60) + 'm ago';
    if (s < 86400) return Math.floor(s / 3600) + 'h ago';
    const d = s / 86400;
    if (d < 30) return Math.floor(d) + 'd ago';
    if (d < 365) return Math.floor(d / 30) + 'mo ago';
    return Math.floor(d / 365) + 'y ago';
  }
  async function cachedJSON(url, key, ttl = 600000) {
    try {
      const c = JSON.parse(sessionStorage.getItem(key));
      if (c && Date.now() - c.t < ttl) return c.d;
    } catch (e) { /* ignore */ }
    const r = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const d = await r.json();
    try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), d })); } catch (e) { /* ignore */ }
    return d;
  }

  /* Theme sync: reads the live accent + background so canvases and
     overlays follow whatever the existing theme toggle does. */
  const FALLBACK_ACCENT = [124, 156, 255];
  const AMBER = [245, 158, 11];
  let accent = FALLBACK_ACCENT, bg = [11, 11, 15], bgCss = 'rgb(11, 11, 15)';
  function parseRGB(c) {
    const m = (c || '').match(/[\d.]+/g);
    if (!m || m.length < 3) return null;
    const a = m.length > 3 ? +m[3] : 1;
    return a === 0 ? null : m.slice(0, 3).map(Number);
  }
  function syncTheme() {
    const cands = [$('.accent-word'), $('.hero-label'), $('.logo-dot'), $('.btn-primary')];
    let found = null;
    for (const n of cands) {
      if (!n) continue;
      const c = parseRGB(getComputedStyle(n).color);
      if (c && (c[0] + c[1] + c[2]) > 0 && (c[0] + c[1] + c[2]) < 750) { found = c; break; }
    }
    accent = found || FALLBACK_ACCENT;
    let b = parseRGB(getComputedStyle(document.body).backgroundColor)
         || parseRGB(getComputedStyle(document.documentElement).backgroundColor);
    bg = b || [11, 11, 15];
    bgCss = `rgb(${bg.join(',')})`;
    const rs = document.documentElement.style;
    rs.setProperty('--lab-accent', `rgb(${accent.join(',')})`);
    rs.setProperty('--lab-bg', bgCss);
  }
  syncTheme();
  const tt = $('#themeToggle');
  if (tt) tt.addEventListener('click', () => { setTimeout(syncTheme, 60); setTimeout(syncTheme, 400); });
  new MutationObserver(() => setTimeout(syncTheme, 30))
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });

  /* ------------------------------------------------------
     1. Neural-net playground
     ------------------------------------------------------ */
  function initNN() {
    const cv = $('#nnCanvas'), lcv = $('#lossCanvas');
    if (!cv || !lcv) return;
    const ctx = cv.getContext('2d'), lctx = lcv.getContext('2d');
    const G = 44, grid = document.createElement('canvas');
    grid.width = grid.height = G;
    const gctx = grid.getContext('2d'), img = gctx.createImageData(G, G);

    const SIZES = [2, 12, 12, 1];
    let ds = 'moons', data = makeData(ds), net = new MLP(SIZES, 0.02);
    let step = 0, ema = null, losses = [], acc = 0, frameN = 0;
    let running = !reduced, visible = false;

    const out = { step: $('#nnStep'), loss: $('#nnLoss'), acc: $('#nnAcc') };
    const badge = $('#nnBadge'), playBtn = $('#nnPlay');

    function fit() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(200, Math.round(cv.getBoundingClientRect().width * dpr));
      cv.width = cv.height = w;
      lcv.width = Math.max(200, Math.round(lcv.getBoundingClientRect().width * dpr));
      lcv.height = Math.round(64 * dpr);
      draw(true);
    }

    function accuracy() {
      let ok = 0;
      for (let i = 0; i < data.X.length; i++) ok += ((net.predict(data.X[i]) > 0.5) ? 1 : 0) === data.Y[i];
      return ok / data.X.length;
    }

    function drawField() {
      const d = img.data;
      for (let j = 0; j < G; j++) {
        for (let i = 0; i < G; i++) {
          const x = (i + 0.5) / G * 2 - 1, y = 1 - (j + 0.5) / G * 2;
          const p = net.predict([x, y]), o = (j * G + i) * 4;
          d[o]     = accent[0] * (1 - p) + AMBER[0] * p;
          d[o + 1] = accent[1] * (1 - p) + AMBER[1] * p;
          d[o + 2] = accent[2] * (1 - p) + AMBER[2] * p;
          d[o + 3] = 36 + 120 * Math.abs(2 * p - 1);
        }
      }
      gctx.putImageData(img, 0, 0);
    }

    function draw(force) {
      const W = cv.width;
      if (force || frameN % 2 === 0) drawField();
      ctx.clearRect(0, 0, W, W);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(grid, 0, 0, W, W);
      const r = W * 0.0125;
      for (let i = 0; i < data.X.length; i++) {
        const [x, y] = data.X[i], c = data.Y[i] ? AMBER : accent;
        ctx.beginPath();
        ctx.arc((x + 1) / 2 * W, (1 - y) / 2 * W, r, 0, 6.2832);
        ctx.fillStyle = `rgb(${c.join(',')})`;
        ctx.fill();
        ctx.lineWidth = Math.max(1, W * 0.003);
        ctx.strokeStyle = `rgba(${bg.join(',')},.85)`;
        ctx.stroke();
      }
      drawLoss();
    }

    function drawLoss() {
      const W = lcv.width, H = lcv.height;
      lctx.clearRect(0, 0, W, H);
      const ymax = Math.max(0.8, ...losses), pad = 4;
      const Y = v => H - pad - (v / ymax) * (H - pad * 2);
      // ln(2) = loss of a coin-flip classifier
      lctx.setLineDash([4, 5]);
      lctx.strokeStyle = 'rgba(128,128,128,.4)'; lctx.lineWidth = 1;
      lctx.beginPath(); lctx.moveTo(0, Y(0.693)); lctx.lineTo(W, Y(0.693)); lctx.stroke();
      lctx.setLineDash([]);
      lctx.fillStyle = 'rgba(128,128,128,.7)';
      lctx.font = `${Math.round(H * 0.17)}px "JetBrains Mono", monospace`;
      lctx.fillText('ln 2', 4, Y(0.693) - 4);
      if (losses.length < 2) return;
      const dx = W / 239;
      lctx.beginPath();
      losses.forEach((v, i) => (i ? lctx.lineTo(i * dx, Y(v)) : lctx.moveTo(0, Y(v))));
      lctx.strokeStyle = `rgb(${accent.join(',')})`; lctx.lineWidth = 1.8 * (W / 400); lctx.stroke();
      lctx.lineTo((losses.length - 1) * dx, H); lctx.lineTo(0, H); lctx.closePath();
      lctx.fillStyle = `rgba(${accent.join(',')},.12)`; lctx.fill();
    }

    function readout() {
      out.step.textContent = step.toLocaleString();
      out.loss.textContent = ema == null ? '—' : ema.toFixed(3);
      out.acc.textContent = (acc * 100).toFixed(1) + '%';
    }

    function setRunning(v) {
      running = v;
      playBtn.textContent = v ? 'pause' : 'train';
      badge.className = 'lab-badge' + (v ? '' : ' idle');
      badge.lastChild.textContent = v ? 'training live' : 'paused';
    }

    function reset() {
      net = new MLP(SIZES, 0.02);
      step = 0; ema = null; losses = []; acc = accuracy(); frameN = 0;
      readout(); draw(true);
    }

    function tick() {
      requestAnimationFrame(tick);
      if (!running || !visible || document.hidden) return;
      frameN++;
      for (let k = 0; k < 3; k++) {
        const idx = [];
        for (let b = 0; b < 32; b++) idx.push((Math.random() * data.X.length) | 0);
        const l = net.trainBatch(data.X, data.Y, idx);
        ema = ema == null ? l : ema * 0.94 + l * 0.06;
        step++;
      }
      losses.push(ema);
      if (losses.length > 240) losses.shift();
      if (frameN % 8 === 0) acc = accuracy();
      if (frameN % 3 === 0) readout();
      draw(false);
    }

    $$('#nnDatasets [data-ds]').forEach(b => b.addEventListener('click', () => {
      ds = b.dataset.ds; data = makeData(ds);
      $$('#nnDatasets [data-ds]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      reset();
    }));
    playBtn.addEventListener('click', () => setRunning(!running));
    $('#nnReset').addEventListener('click', reset);

    new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { threshold: 0.1 }).observe(cv);
    let rz; window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(fit, 150); });

    setRunning(running);
    fit(); acc = accuracy(); readout();
    requestAnimationFrame(tick);
  }

  /* ------------------------------------------------------
     2. GitHub panel + hero "last push"
     ------------------------------------------------------ */
  async function initGitHub() {
    const body = $('#ghBody'), badge = $('#ghBadge'), push = $('#hsPush');
    if (!body) return;
    try {
      const [user, repos, events] = await Promise.all([
        cachedJSON(`https://api.github.com/users/${GH_USER}`, 'lab_gh_user'),
        cachedJSON(`https://api.github.com/users/${GH_USER}/repos?per_page=100&sort=pushed`, 'lab_gh_repos'),
        cachedJSON(`https://api.github.com/users/${GH_USER}/events/public?per_page=30`, 'lab_gh_events').catch(() => [])
      ]);
      const own = repos.filter(r => !r.fork);
      const stars = repos.reduce((s, r) => s + (r.stargazers_count || 0), 0);

      body.textContent = '';
      const stats = el('div', 'gh-stats');
      [[user.public_repos, 'repos'], [stars, 'stars'], [user.followers, 'followers']].forEach(([v, k]) => {
        const d = el('div'); d.append(el('b', null, String(v ?? '—')), el('span', null, k)); stats.append(d);
      });
      body.append(stats);

      // language mix across own repos
      const tally = {};
      own.forEach(r => { if (r.language) tally[r.language] = (tally[r.language] || 0) + 1; });
      const langs = Object.entries(tally).sort((a, b) => b[1] - a[1]).slice(0, 5);
      const total = langs.reduce((s, [, n]) => s + n, 0);
      if (total) {
        const bar = el('div', 'gh-langbar'), leg = el('div', 'gh-legend');
        const ops = [1, 0.72, 0.52, 0.38, 0.26];
        langs.forEach(([name, n], i) => {
          const seg = el('i'); seg.style.flex = String(n); seg.style.opacity = ops[i]; bar.append(seg);
          const li = el('span'); const sw = el('i'); sw.style.opacity = ops[i];
          li.append(sw, document.createTextNode(`${name} ${Math.round(n / total * 100)}%`)); leg.append(li);
        });
        body.append(bar, leg);
      }

      // latest commit, terminal style
      const pe = events.find(e => e.type === 'PushEvent');
      const term = el('div', 'gh-term');
      if (pe) {
        const commits = (pe.payload && pe.payload.commits) || [];
        const c = commits[commits.length - 1];
        const repoName = (pe.repo && pe.repo.name || '').split('/')[1] || 'repo';
        const l1 = el('div'); l1.append(Object.assign(el('span', 'p', '$ '), {}), document.createTextNode('git log -1'));
        const l2 = el('div');
        if (c) {
          const msg = c.message.split('\n')[0];
          l2.append(el('span', 'm', c.sha.slice(0, 7) + '  '),
                    document.createTextNode(msg.length > 70 ? msg.slice(0, 69) + '…' : msg));
        } else {
          l2.append(document.createTextNode('pushed to ' + repoName));
        }
        const l3 = el('div', 'm', `${repoName} · ${rel(pe.created_at)}`);
        term.append(l1, l2, l3);
        if (push) push.textContent = 'last push ' + rel(pe.created_at);
      } else {
        term.append(el('div', 'm', 'no recent public push events'));
        if (own[0] && push) push.textContent = 'last push ' + rel(own[0].pushed_at);
      }
      body.append(term);

      // recently active repos
      const ul = el('ul', 'gh-list');
      own.slice(0, 4).forEach(r => {
        const li = el('li'), a = el('a'); a.href = r.html_url; a.target = '_blank'; a.rel = 'noopener';
        a.dataset.cursor = 'hover';
        a.append(el('b', null, r.name), el('small', null, `${r.language || '—'} · ${rel(r.pushed_at)}`));
        li.append(a); ul.append(li);
      });
      body.append(ul);
      body.append(el('p', 'lab-note', 'Fetched from the public GitHub API in your browser · cached for 10 min'));
      badge.className = 'lab-badge';
    } catch (err) {
      body.textContent = '';
      const p = el('p', 'lab-note', 'Couldn’t reach the GitHub API right now (offline or rate-limited). ');
      const a = el('a', null, 'Open the profile →'); a.href = `https://github.com/${GH_USER}`;
      a.target = '_blank'; a.rel = 'noopener'; p.append(a); body.append(p);
      badge.className = 'lab-badge err'; badge.lastChild.textContent = 'offline';
      if (push) push.textContent = 'github unreachable';
    }
  }

  /* ------------------------------------------------------
     3. Hugging Face Space status
     ------------------------------------------------------ */
  const SPACES = [
    ['lms-priority-analyser', 'LMS Priority Analyser'],
    ['stress-level-prediction-ai', 'Mental-Health Early Detection'],
    ['Resume-Screening-System', 'Resume Screening (RAG)'],
    ['AI-Car-Damage-Detection-System', 'Car Damage Detection'],
    ['student-retention-analysis', 'Student Retention']
  ];
  async function initSpaces() {
    const list = $('#spList'), badge = $('#spBadge'), sum = $('#spSummary');
    if (!list) return;
    list.textContent = '';
    const rows = SPACES.map(([slug, label]) => {
      const li = el('li'), a = el('a');
      a.href = `https://huggingface.co/spaces/${HF_USER}/${slug}`; a.target = '_blank'; a.rel = 'noopener';
      a.dataset.cursor = 'hover';
      const st = el('span', 'sp-state sk'); st.append(el('i'), document.createTextNode('checking'));
      a.append(el('span', 'sp-name', label), st); li.append(a); list.append(li);
      return { slug, st };
    });
    let awake = 0, known = 0;
    await Promise.all(rows.map(async ({ slug, st }) => {
      let cls = 'unknown', txt = 'unknown';
      try {
        const d = await cachedJSON(`https://huggingface.co/api/spaces/${HF_USER}/${slug}`, 'lab_sp_' + slug, 300000);
        const stage = ((d.runtime && d.runtime.stage) || '').toUpperCase();
        known++;
        if (stage === 'RUNNING') { cls = 'running'; txt = 'running'; awake++; }
        else if (stage === 'SLEEPING' || stage === 'PAUSED') { cls = 'sleeping'; txt = 'asleep · wakes on visit'; }
        else if (stage.includes('BUILD') || stage === 'STOPPED') { cls = 'building'; txt = stage.includes('BUILD') ? 'building' : 'stopped'; }
        else if (stage.includes('ERROR')) { cls = 'error'; txt = 'error'; }
        else { txt = stage ? stage.toLowerCase() : 'unknown'; }
      } catch (e) { /* leave unknown */ }
      st.className = 'sp-state ' + cls;
      st.lastChild.textContent = txt;
    }));
    if (!known) { badge.className = 'lab-badge idle'; badge.lastChild.textContent = 'unavailable'; sum.textContent = 'Couldn’t query the Hugging Face API from this browser.'; }
    else { sum.textContent = `${awake} of ${SPACES.length} Spaces awake right now. Free Spaces sleep when idle and wake on the first visit.`; }
  }

  /* ------------------------------------------------------
     4. Hero clock + count-up stats
     ------------------------------------------------------ */
  function initClock() {
    const t = $('#hsClock'); if (!t) return;
    const f = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Colombo', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const upd = () => { t.textContent = 'Colombo ' + f.format(new Date()) + ' · UTC+5:30'; };
    upd(); setInterval(upd, 1000);
  }
  function initCounts() {
    const pc = $('[data-count="projects"]');
    if (pc) pc.dataset.count = String($$('#projects .project, #events .project').length);
    const nodes = $$('[data-count]');
    const run = n => {
      const target = parseFloat(n.dataset.count), dec = +(n.dataset.dec || 0);
      if (reduced || !isFinite(target)) { n.textContent = target.toFixed(dec); return; }
      const t0 = performance.now(), dur = 1100;
      (function f(now) {
        const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        n.textContent = (target * e).toFixed(dec);
        if (k < 1) requestAnimationFrame(f);
      })(t0);
    };
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { run(e.target); io.unobserve(e.target); }
    }), { threshold: 0.6 });
    nodes.forEach(n => io.observe(n));
  }

  /* ------------------------------------------------------
     5. Command palette (Ctrl/⌘ + K)
     ------------------------------------------------------ */
  function initPalette() {
    const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
    const root = el('div', 'cmdk'); root.hidden = true;
    root.innerHTML =
      '<div class="cmdk-panel" role="dialog" aria-modal="true" aria-label="Command palette">' +
      '<input class="cmdk-input" type="text" placeholder="Jump to a section, project or action…" aria-label="Search" autocomplete="off" spellcheck="false" />' +
      '<ul class="cmdk-list" role="listbox"></ul>' +
      '<div class="cmdk-foot"><span><kbd>↑</kbd><kbd>↓</kbd>navigate</span><span><kbd>↵</kbd>open</span><span><kbd>esc</kbd>close</span></div>' +
      '</div>';
    document.body.append(root);
    const input = $('.cmdk-input', root), listEl = $('.cmdk-list', root);

    // header hint button
    const actions = $('.header-actions');
    if (actions) {
      const hint = el('button', 'kbd-hint', isMac ? '⌘ K' : 'Ctrl K');
      hint.type = 'button'; hint.setAttribute('aria-label', 'Open command palette');
      hint.dataset.cursor = 'hover';
      hint.addEventListener('click', () => open());
      actions.insertBefore(hint, actions.firstChild);
    }

    const go = hash => {
      const t = $(hash);
      if (t) t.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    };
    function build() {
      const items = [];
      [['home', 'Home'], ['about', 'About'], ['skills', 'Skills'], ['lab', 'The Lab'],
       ['events', 'Hackathons'], ['projects', 'Projects'], ['contact', 'Contact']]
        .forEach(([id, label]) => items.push({ kind: 'go to', label, run: () => go('#' + id) }));
      $$('.project').forEach(p => {
        const h = p.querySelector('h3'); if (!h) return;
        items.push({
          kind: 'project', label: h.textContent.trim(),
          run: () => {
            if (!p.offsetParent) { const all = $('.filter-btn[data-filter="all"]'); if (all) all.click(); }
            setTimeout(() => p.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' }), 80);
          }
        });
      });
      items.push({ kind: 'action', label: 'Toggle light / dark theme', run: () => { const b = $('#themeToggle'); if (b) b.click(); } });
      const link = (sel, label) => { const a = $(sel); if (a) items.push({ kind: 'link', label, run: () => window.open(a.href, '_blank', 'noopener') }); };
      link('.hero-ctas a[href$=".pdf"]', 'Download CV');
      link('.contact-links a[href*="github.com"]', 'Open GitHub');
      link('.contact-links a[href*="linkedin.com"]', 'Open LinkedIn');
      items.push({ kind: 'action', label: 'Send an email', run: () => { location.href = 'mailto:chandimacbbandara@gmail.com'; } });
      return items;
    }

    let items = [], shown = [], sel = 0, lastFocus = null;
    function render() {
      const q = input.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      shown = items.filter(i => q.every(w => (i.label + ' ' + i.kind).toLowerCase().includes(w)));
      sel = Math.min(sel, Math.max(0, shown.length - 1));
      listEl.textContent = '';
      if (!shown.length) { listEl.append(el('li', 'cmdk-empty', 'Nothing matches that.')); return; }
      shown.forEach((it, i) => {
        const li = el('li', 'cmdk-item'); li.setAttribute('role', 'option');
        li.setAttribute('aria-selected', String(i === sel));
        li.append(el('span', null, it.label), el('small', null, it.kind));
        li.addEventListener('mousemove', () => { if (sel !== i) { sel = i; mark(); } });
        li.addEventListener('click', () => choose(i));
        listEl.append(li);
      });
    }
    function mark() {
      $$('.cmdk-item', listEl).forEach((n, i) => n.setAttribute('aria-selected', String(i === sel)));
      const cur = $$('.cmdk-item', listEl)[sel]; if (cur) cur.scrollIntoView({ block: 'nearest' });
    }
    function choose(i) { const it = shown[i]; if (!it) return; close(); setTimeout(it.run, 30); }
    function open() {
      lastFocus = document.activeElement; items = build(); sel = 0; input.value = '';
      root.hidden = false; render(); input.focus();
    }
    function close() {
      root.hidden = true;
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    input.addEventListener('input', () => { sel = 0; render(); });
    input.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') { e.preventDefault(); sel = (sel + 1) % Math.max(1, shown.length); mark(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); sel = (sel - 1 + shown.length) % Math.max(1, shown.length); mark(); }
      else if (e.key === 'Enter') { e.preventDefault(); choose(sel); }
    });
    root.addEventListener('mousedown', e => { if (e.target === root) close(); });
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); root.hidden ? open() : close(); }
      else if (e.key === 'Escape' && !root.hidden) close();
    });
  }

  /* ------------------------------------------------------
     Boot
     ------------------------------------------------------ */
  function boot() {
    initClock(); initCounts(); initPalette(); initNN(); initGitHub();
    const sp = $('#spList');
    if (sp && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => {
        if (es[0].isIntersecting) { io.disconnect(); initSpaces(); }
      }, { rootMargin: '200px' });
      io.observe(sp);
    } else { initSpaces(); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

})(typeof window !== 'undefined' ? window : globalThis);