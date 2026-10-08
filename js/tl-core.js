/* ==========================================================================
   tl-core.js — namespace window.TL, bus de eventos, estado, utilidades,
   almacenamiento, motor i18n, tema y registro de vistas.
   Scripts clásicos (file://): todo cuelga de window.TL.
   ========================================================================== */
(function () {
  'use strict';

  const TL = (window.TL = window.TL || {});
  TL.version = '1.0.0';

  /* ── Bus de eventos ─────────────────────────────────────────────────── */
  const handlers = new Map();
  TL.on = function (evt, fn) {
    if (!handlers.has(evt)) handlers.set(evt, new Set());
    handlers.get(evt).add(fn);
    return () => TL.off(evt, fn);
  };
  TL.off = function (evt, fn) { handlers.get(evt)?.delete(fn); };
  TL.once = function (evt, fn) {
    const off = TL.on(evt, (...a) => { off(); fn(...a); });
    return off;
  };
  TL.emit = function (evt, ...args) {
    const set = handlers.get(evt);
    if (!set) return;
    for (const fn of [...set]) {
      try { fn(...args); } catch (err) { console.error('[TL] handler error en "' + evt + '"', err); }
    }
  };

  /* ── Almacenamiento seguro (file:// puede bloquearlo) ───────────────── */
  TL.store = {
    get(key, def = null) {
      try {
        const raw = localStorage.getItem('tl.' + key);
        if (raw === null) return def;
        return JSON.parse(raw);
      } catch (e) { return def; }
    },
    set(key, val) {
      try { localStorage.setItem('tl.' + key, JSON.stringify(val)); return true; } catch (e) { return false; }
    },
    del(key) { try { localStorage.removeItem('tl.' + key); } catch (e) { /* noop */ } },
    raw(key) { try { return localStorage.getItem('tl.' + key); } catch (e) { return null; } },
    setRaw(key, v) { try { localStorage.setItem('tl.' + key, v); } catch (e) { /* noop */ } },
  };

  /* ── Utilidades ─────────────────────────────────────────────────────── */
  class SafeHtml {
    constructor(s) { this.s = s; }
    toString() { return this.s; }
  }
  const escMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = (v) => (v == null ? '' : String(v).replace(/[&<>"']/g, (c) => escMap[c]));

  const u = (TL.u = {
    SafeHtml,
    esc,
    /** Marca un string como HTML ya seguro. */
    raw: (s) => new SafeHtml(String(s == null ? '' : s)),
    /** Template tag: escapa valores salvo SafeHtml y arrays de SafeHtml. */
    html(strings, ...vals) {
      let out = strings[0];
      for (let i = 0; i < vals.length; i++) {
        const v = vals[i];
        let s;
        if (v instanceof SafeHtml) s = v.s;
        else if (Array.isArray(v)) s = v.map((x) => (x instanceof SafeHtml ? x.s : esc(x))).join('');
        else s = esc(v);
        out += s + strings[i + 1];
      }
      return new SafeHtml(out);
    },
    /** Crea un elemento desde un string/SafeHtml (una raíz). */
    el(html) {
      const t = document.createElement('template');
      t.innerHTML = String(html).trim();
      return t.content.firstElementChild;
    },
    /** Crea un fragmento desde un string/SafeHtml. */
    frag(html) {
      const t = document.createElement('template');
      t.innerHTML = String(html).trim();
      return t.content;
    },
    qs: (sel, root = document) => root.querySelector(sel),
    qsa: (sel, root = document) => Array.from(root.querySelectorAll(sel)),
    /** Hyperscript mínimo: h('div.clase', {onclick, 'aria-label'}, hijos...) */
    h(tag, props, ...kids) {
      const m = /^([a-z0-9-]+)((?:[.#][\w-]+)*)$/i.exec(tag) || [null, 'div', ''];
      const node = document.createElement(m[1]);
      (m[2].match(/[.#][\w-]+/g) || []).forEach((t) => {
        if (t[0] === '.') node.classList.add(t.slice(1)); else node.id = t.slice(1);
      });
      if (props && (props.nodeType || typeof props === 'string' || Array.isArray(props) || props instanceof SafeHtml)) {
        kids.unshift(props); props = null;
      }
      for (const [k, v] of Object.entries(props || {})) {
        if (v == null || v === false) continue;
        if (k === 'class') node.className += (node.className ? ' ' : '') + v;
        else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
        else if (k === 'dataset') Object.assign(node.dataset, v);
        else if (k === 'html') node.innerHTML = String(v);
        else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
        else if (v === true) node.setAttribute(k, '');
        else node.setAttribute(k, v);
      }
      const add = (c) => {
        if (c == null || c === false) return;
        if (Array.isArray(c)) c.forEach(add);
        else if (c instanceof SafeHtml) node.insertAdjacentHTML('beforeend', c.s);
        else if (c.nodeType) node.appendChild(c);
        else node.appendChild(document.createTextNode(String(c)));
      };
      kids.forEach(add);
      return node;
    },
    clamp: (v, a, b) => Math.min(b, Math.max(a, v)),
    lerp: (a, b, t) => a + (b - a) * t,
    map01: (v, a, b) => (b === a ? 0 : (v - a) / (b - a)),
    sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
    raf: () => new Promise((r) => requestAnimationFrame(r)),
    debounce(fn, ms = 120) {
      let t;
      const d = (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
      d.cancel = () => clearTimeout(t);
      return d;
    },
    throttle(fn, ms = 100) {
      let last = 0, t;
      return (...a) => {
        const now = performance.now();
        const rest = ms - (now - last);
        clearTimeout(t);
        if (rest <= 0) { last = now; fn(...a); } else t = setTimeout(() => { last = performance.now(); fn(...a); }, rest);
      };
    },
    /** get(obj, 'a.b.0.c', def) sin explotar con null/undefined. */
    get(obj, path, def) {
      let cur = obj;
      for (const k of String(path).split('.')) {
        if (cur == null) return def;
        cur = cur[k];
      }
      return cur === undefined || cur === null ? def : cur;
    },
    uid: (p = 'id') => p + '-' + Math.random().toString(36).slice(2, 8),
    unique: (arr) => Array.from(new Set(arr)),
    groupBy(arr, fn) {
      const m = {};
      for (const x of arr) { const k = fn(x); (m[k] || (m[k] = [])).push(x); }
      return m;
    },
    sum: (arr, fn = (x) => x) => arr.reduce((a, x) => a + (+fn(x) || 0), 0),
    initials(name) {
      const w = String(name || '?').replace(/[^\p{L}\p{N}\s]/gu, ' ').trim().split(/\s+/).filter(Boolean);
      if (!w.length) return '?';
      return (w.length === 1 ? w[0].slice(0, 2) : w[0][0] + w[1][0]).toUpperCase();
    },
    /** Normaliza texto para búsqueda (sin tildes, minúsculas). */
    norm: (s) => String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim(),
    hexToRgb(hex) {
      const h = String(hex).replace('#', '');
      const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    },
    rgba(hex, a) { const [r, g, b] = u.hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; },
    /** Mezcla lineal de dos hex (t=0 → a, t=1 → b). */
    mix(a, b, t) {
      const A = u.hexToRgb(a), B = u.hexToRgb(b);
      const c = A.map((x, i) => Math.round(x + (B[i] - x) * t));
      return '#' + c.map((x) => x.toString(16).padStart(2, '0')).join('');
    },
    /** Rampa multi-parada: stops = [[0,'#hex'],[1,'#hex']] */
    ramp(stops, t) {
      t = u.clamp(t, 0, 1);
      for (let i = 1; i < stops.length; i++) {
        if (t <= stops[i][0]) {
          const [t0, c0] = stops[i - 1], [t1, c1] = stops[i];
          return u.mix(c0, c1, (t - t0) / (t1 - t0 || 1));
        }
      }
      return stops[stops.length - 1][1];
    },
    /** Lee una variable CSS del :root (tokens) */
    css(name, el = document.documentElement) {
      return getComputedStyle(el).getPropertyValue(name).trim();
    },
    async copy(text) {
      try {
        if (navigator.clipboard && window.isSecureContext !== false) { await navigator.clipboard.writeText(text); return true; }
      } catch (e) { /* cae al plan B */ }
      try {
        const ta = document.createElement('textarea');
        ta.value = text; ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
        document.body.appendChild(ta); ta.select();
        const ok = document.execCommand('copy');
        ta.remove();
        return ok;
      } catch (e) { return false; }
    },
    download(filename, content, mime = 'text/plain;charset=utf-8') {
      const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; document.body.appendChild(a); a.click();
      setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 400);
    },
    /** Distancia haversine en km. */
    km(a, b) {
      const R = 6371, rad = Math.PI / 180;
      const dLat = (b[1] - a[1]) * rad, dLon = (b[0] - a[0]) * rad;
      const s = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin(dLon / 2) ** 2;
      return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
    },
    /** Asegura que un callback corra al terminar la transición (o por timeout). */
    afterTransition(el, fn, ms = 600) {
      let done = false;
      const end = () => { if (done) return; done = true; el.removeEventListener('transitionend', onEnd); fn(); };
      const onEnd = (e) => { if (e.target === el) end(); };
      el.addEventListener('transitionend', onEnd);
      setTimeout(end, ms);
    },
  });

  /** ¿El usuario pidió menos movimiento? (se evalúa en vivo) */
  const mqReduce = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  Object.defineProperty(TL, 'reduceMotion', { get: () => mqReduce.matches });

  /* ── Estado global ──────────────────────────────────────────────────── */
  const initialLang = document.documentElement.getAttribute('lang') === 'de' ? 'de' : 'es';
  const initialTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';

  TL.state = {
    lang: initialLang,
    theme: initialTheme,
    view: 'clients',          // id de la vista activa del riel
    country: null,            // cc del país en foco (o null = región)
    selected: null,           // { kind: 'client'|'rep'|'opp', id } con la ficha abierta
    hover: null,              // { kind, id } bajo el cursor
    panelOpen: true,
    present: false,
    colorMode: 'tier',        // 'tier' | 'competition'
    satellite: true,
    buildings3d: false,
    introDone: false,
  };

  /** Cambia estado y emite 'state' + 'change:<clave>' por cada clave modificada. */
  TL.set = function (patch) {
    const prev = {};
    const changed = [];
    for (const k of Object.keys(patch)) {
      if (TL.state[k] !== patch[k]) { prev[k] = TL.state[k]; TL.state[k] = patch[k]; changed.push(k); }
    }
    if (!changed.length) return false;
    for (const k of changed) TL.emit('change:' + k, TL.state[k], prev[k]);
    TL.emit('state', { patch, prev, changed });
    return true;
  };
  TL.get = (k) => TL.state[k];

  /* ── i18n ───────────────────────────────────────────────────────────── */
  const LOCALE = { es: 'es-AR', de: 'de-DE' };
  const i18n = (TL.i18n = {
    dict: { es: {}, de: {} },
    get lang() { return TL.state.lang; },
    get locale() { return LOCALE[TL.state.lang] || 'es-AR'; },
    /** Agrega traducciones: extend({ es: { 'k': 'v' }, de: { 'k': 'v' } }) */
    extend(pack) {
      for (const l of Object.keys(pack)) Object.assign((i18n.dict[l] = i18n.dict[l] || {}), pack[l]);
    },
    has: (key) => key in i18n.dict[TL.state.lang] || key in i18n.dict.es,
    /** t('clave', {n: 3}) → texto en el idioma activo (cae a ES, luego a la clave). */
    t(key, vars) {
      let s = i18n.dict[TL.state.lang][key];
      if (s == null) s = i18n.dict.es[key];
      if (s == null) return key;
      if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
      return s;
    },
    /** Plural simple: busca key.one / key.other */
    tn(key, n, vars) {
      const k = n === 1 && i18n.has(key + '.one') ? key + '.one' : key + '.other';
      return i18n.t(k, Object.assign({ n: i18n.int(n) }, vars));
    },
    /** Objeto bilingüe {es, de} (o string) → texto en el idioma activo. */
    L(v) {
      if (v == null) return '';
      if (typeof v === 'string') return v;
      return v[TL.state.lang] || v.es || v.en || '';
    },
    /** Campo de datos bilingüe: base_de si hay, si no base_es, si no base. */
    pick(obj, base, lang = TL.state.lang) {
      if (!obj) return '';
      const empty = (x) => x == null || x === '' || (Array.isArray(x) && !x.length);
      const a = obj[base + '_' + lang];
      if (!empty(a)) return a;
      const b = obj[base + '_es'];
      if (!empty(b)) return b;
      const c = obj[base];
      return empty(c) ? (Array.isArray(c) ? c : '') : c;
    },
    num(n, o) { return n == null || isNaN(n) ? '—' : new Intl.NumberFormat(i18n.locale, o).format(n); },
    int(n) { return i18n.num(Math.round(n), { maximumFractionDigits: 0 }); },
    dec(n, d = 1) { return i18n.num(n, { minimumFractionDigits: d, maximumFractionDigits: d }); },
    pct(n, d = 0) { return n == null || isNaN(n) ? '—' : i18n.num(n, { style: 'percent', maximumFractionDigits: d }); },
    compact(n) { return n == null || isNaN(n) ? '—' : new Intl.NumberFormat(i18n.locale, { notation: 'compact', maximumFractionDigits: 1 }).format(n); },
    usd(n, compact = true) {
      if (n == null || isNaN(n)) return '—';
      const f = new Intl.NumberFormat(i18n.locale, { style: 'currency', currency: 'USD', maximumFractionDigits: 0, notation: compact && n >= 1e6 ? 'compact' : 'standard' });
      return f.format(n);
    },
    date(d, o = { day: 'numeric', month: 'short', year: 'numeric' }) {
      if (!d) return '';
      const dt = d instanceof Date ? d : new Date(/^\d{4}-\d{2}$/.test(d) ? d + '-01' : d);
      if (isNaN(dt)) return String(d);
      return new Intl.DateTimeFormat(i18n.locale, o).format(dt);
    },
    monthYear(d) { return i18n.date(d, { month: 'short', year: 'numeric' }); },
    list(arr) {
      try { return new Intl.ListFormat(i18n.locale, { style: 'long', type: 'conjunction' }).format(arr); } catch (e) { return arr.join(', '); }
    },
    /** Aplica data-i18n / data-i18n-html / data-i18n-attr en un subárbol. */
    apply(root = document) {
      root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = i18n.t(el.dataset.i18n); });
      root.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = i18n.t(el.dataset.i18nHtml); });
      root.querySelectorAll('[data-i18n-attr]').forEach((el) => {
        el.dataset.i18nAttr.split(';').forEach((pair) => {
          const [attr, key] = pair.split(':').map((s) => s.trim());
          if (attr && key) el.setAttribute(attr, i18n.t(key));
        });
      });
    },
    /** Cambia idioma sin recargar: guarda, aplica y emite 'lang'. */
    set(lang) {
      if (lang !== 'es' && lang !== 'de') return;
      if (TL.state.lang === lang) return;
      TL.store.setRaw('lang', lang);
      document.documentElement.setAttribute('lang', lang);
      TL.state.lang = lang;
      i18n.apply(document);
      document.title = i18n.t('app.title');
      TL.emit('change:lang', lang);
      TL.emit('lang', lang);
    },
  });

  /* ── Tema ───────────────────────────────────────────────────────────── */
  TL.theme = {
    get: () => TL.state.theme,
    set(theme, opts = {}) {
      if (theme !== 'light' && theme !== 'dark') return;
      if (theme === TL.state.theme && !opts.force) return;
      const apply = () => {
        document.documentElement.setAttribute('data-theme', theme);
        TL.state.theme = theme;
        if (opts.persist !== false) TL.store.setRaw('theme', theme);
        const meta = document.querySelector('meta[name="color-scheme"]');
        if (meta) meta.content = theme;
        TL.emit('change:theme', theme);
        TL.emit('theme', theme);
      };
      // View Transition (fundido suave) cuando el navegador lo soporta
      if (!opts.instant && document.startViewTransition && !TL.reduceMotion && TL.state.introDone) {
        const root = document.documentElement;
        root.classList.add('vt-theme');
        const vt = document.startViewTransition(async () => { apply(); await u.raf(); await u.raf(); });
        vt.finished.finally(() => root.classList.remove('vt-theme'));
      } else apply();
    },
    toggle() { TL.theme.set(TL.state.theme === 'dark' ? 'light' : 'dark'); },
  };

  /* ── Registro de vistas del riel ────────────────────────────────────── */
  const viewMap = new Map();
  TL.views = {
    /**
     * register({ id, order, icon, label, kind:'panel'|'action', group:'main'|'tools',
     *            mapMode, render(container, ctx), onOpen(ctx), onClose(), run(), legend(), available() })
     * label = clave i18n o {es,de}. icon = nombre de TL.ui.icons.
     */
    register(def) {
      if (!def || !def.id) throw new Error('TL.views.register: falta id');
      viewMap.set(def.id, Object.assign({ order: 100, kind: 'panel', group: 'main' }, def));
      TL.emit('views:changed');
      return def;
    },
    unregister(id) { viewMap.delete(id); TL.emit('views:changed'); },
    get: (id) => viewMap.get(id),
    list: () => [...viewMap.values()].sort((a, b) => a.order - b.order),
    label(v) {
      if (!v) return '';
      if (typeof v.label === 'string' && i18n.has(v.label)) return i18n.t(v.label);
      return i18n.L(v.label) || v.id;
    },
    isAvailable: (v) => (typeof v.available === 'function' ? !!v.available() : true),
  };

  /* ── Arranque diferido: promesa "ready" ─────────────────────────────── */
  let readyResolve;
  TL.ready = new Promise((r) => { readyResolve = r; });
  TL._resolveReady = () => readyResolve();
  /** Ejecuta fn al terminar el arranque (o ya, si pasó). */
  TL.whenReady = (fn) => TL.ready.then(fn);

  /* Consola amigable ante errores no atrapados: nunca romper la UI */
  window.addEventListener('error', (e) => { if (window.TL_DEBUG) console.warn('[TL] error', e.message); });
})();
