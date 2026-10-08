/* ==========================================================================
   tl-app.js — arranque y cascarón: loader (corte láser), navegación central
   (TL.nav), riel, cabecera, controles del mapa, atajos de teclado.
   Corre en DOMContentLoaded, después de que todos los módulos se registraron.
   ========================================================================== */
(function () {
  'use strict';
  const { u } = TL;
  const t = (k, v) => TL.i18n.t(k, v);
  const A = (TL.app = {});
  const $ = (id) => document.getElementById(id);

  TL.i18n.extend({
    es: {
      'app.demo': 'Datos de demostración', 'app.demoHint': 'Todavía no llegaron las fichas investigadas: se muestran registros ficticios para probar la plataforma.',
      'app.mapError': 'El mapa 3D necesita WebGL. Los paneles siguen disponibles.', 'app.excluded': '{name}: mercado atendido por la filial TRUMPF',
      'app.city': '{name} · {n} empresas', 'app.aiOff': 'IA sin conexión', 'app.keys': 'Atajos: Ctrl K buscar · Esc cerrar',
    },
    de: {
      'app.demo': 'Demodaten', 'app.demoHint': 'Die recherchierten Profile sind noch nicht eingetroffen: Es werden fiktive Datensätze zum Testen angezeigt.',
      'app.mapError': 'Die 3D-Karte benötigt WebGL. Die Bereiche bleiben verfügbar.', 'app.excluded': '{name}: Markt wird von der TRUMPF Niederlassung betreut',
      'app.city': '{name} · {n} Unternehmen', 'app.aiOff': 'KI offline', 'app.keys': 'Tastenkürzel: Strg K Suche · Esc schließen',
    },
  });

  /* ── Loader: trayectoria de corte sobre la pieza de chapa ───────────── */
  const loader = { p: 0, raf: 0, done: false };
  function runLoader() {
    const svg = document.querySelector('.ld-part'); if (!svg) return;
    const paths = u.qsa('.ld-p', svg), spark = svg.querySelector('.ld-spark');
    const lens = paths.map((p) => { const L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L; return L; });
    const total = lens.reduce((a, b) => a + b, 0);
    const bar = document.querySelector('.ld-bar i');
    const DUR = TL.reduceMotion ? 1 : 2600;
    let t0 = performance.now();
    const step = (now) => {
      const k = u.clamp((now - t0) / DUR, 0, 1);
      let d = k * total;
      for (let i = 0; i < paths.length; i++) {
        const L = lens[i], cut = u.clamp(d, 0, L);
        paths[i].style.strokeDashoffset = L - cut;
        if (d > 0 && d <= L) { const pt = paths[i].getPointAtLength(cut); spark.setAttribute('transform', `translate(${pt.x} ${pt.y})`); }
        d -= L;
      }
      bar && (bar.style.transform = `scaleX(${Math.max(k * 0.86, loader.p)})`);
      if (k < 1) loader.raf = requestAnimationFrame(step);
      else if (!loader.done) { t0 = performance.now(); paths.forEach((p, i) => { p.style.strokeDashoffset = lens[i]; }); loader.raf = requestAnimationFrame(step); }
      else spark.style.opacity = 0;
    };
    loader.raf = requestAnimationFrame(step);
  }
  function loaderStatus(key, p) {
    const s = $('ld-status'); if (s) s.textContent = t(key);
    loader.p = Math.max(loader.p, p || 0);
    const bar = document.querySelector('.ld-bar i'); if (bar) bar.style.transform = `scaleX(${loader.p})`;
  }
  function endLoader() {
    if (loader.done) return; loader.done = true;
    loaderStatus('loader.ready', 1);
    setTimeout(() => { document.body.classList.remove('is-loading'); cancelAnimationFrame(loader.raf); }, TL.reduceMotion ? 0 : 380);
  }

  /* ── Navegación central ─────────────────────────────────────────────── */
  const nav = (TL.nav = {});
  const panelView = (id) => { const v = TL.views.get(id); return v && v.kind !== 'action' ? v : null; };

  nav.open = function (id, o = {}) {
    const hit = TL.data.get(id); if (!hit) return;
    const fly = o.fly !== false;
    if (hit.kind === 'opp') {
      if (TL.state.view !== 'radar' && TL.views.get('radar')) nav.view('radar');
      if (fly) TL.map.flyToEntity(id);
      TL.map.markOpp?.(id);
      TL.emit('radar:focus', id);
      return;
    }
    const r = hit.rec;
    if (r.country && TL.data.isTarget(r.country) && TL.state.country !== r.country && ['clients', 'reps'].includes(TL.state.view)) TL.set({ country: r.country });
    TL.map.select(id);
    if (TL.ficha && TL.ficha.open) TL.ficha.open(id, o); else TL.set({ selected: { kind: hit.kind, id } });
    if (fly) requestAnimationFrame(() => TL.map.flyToEntity(id));
  };

  nav.country = function (cc, o = {}) {
    if (!cc) return nav.region();
    const k = TL.data.country(cc);
    if (!k) return;
    if (k.role !== 'target') { TL.ui.toast(t('app.excluded', { name: TL.data.countryName(cc) })); TL.map.flyToCountry(cc); return; }
    TL.ficha?.isOpen?.() && TL.ficha.close();
    if (!panelView(TL.state.view)) nav.view('clients', { silent: true });
    TL.set({ country: cc });
    TL.panel.open();
    if (o.fly !== false) TL.map.flyToCountry(cc);
  };
  /** Vuelve a la región (sin país en foco) manteniendo la vista. */
  nav.region = function (o = {}) {
    TL.set({ country: null });
    if (o.fly !== false) TL.map.home();
  };
  nav.home = function () {
    TL.ficha?.isOpen?.() && TL.ficha.close();
    TL.ui.overlay.close();
    TL.map.clearHighlight(); TL.map.clearSelection();
    if (TL.state.view !== 'clients') nav.view('clients', { silent: true });
    TL.set({ country: null });
    TL.map.home();
  };
  nav.view = function (id, o = {}) {
    const v = TL.views.get(id); if (!v || !TL.views.isAvailable(v)) return;
    if (v.kind === 'action') { try { v.run?.(); } catch (err) { console.error('[TL] vista', id, err); } return; }
    const prev = TL.views.get(TL.state.view);
    if (prev && prev.id !== id) { try { prev.onClose?.(); } catch (err) { console.error(err); } }
    TL.map.clearHighlight?.();
    TL.set({ view: id });
    TL.map.setMode?.(v.mapMode || 'clients');
    try { v.onOpen?.({ country: TL.state.country }); } catch (err) { console.error(err); }
    if (!o.keepPanel && !TL.state.present) TL.panel.open();
    renderRail();
  };
  nav.city = function (name, lng, lat, zoom = 11) {
    if (!isFinite(lng) || !isFinite(lat)) return;
    const n = TL.data.clients.filter((c) => u.norm(c.city) === u.norm(name)).length;
    const cc = (TL.data.clients.find((c) => u.norm(c.city) === u.norm(name)) || TL.data.reps.find((r) => u.norm(r.city) === u.norm(name)))?.country;
    if (cc && TL.data.isTarget(cc) && cc !== TL.state.country) TL.set({ country: cc });
    TL.map.flyTo({ center: [lng, lat], zoom, pitch: 30, bearing: 0, duration: 2200 });
    if (n) TL.ui.toast(t('app.city', { name, n }));
  };

  /* ── Riel ───────────────────────────────────────────────────────────── */
  function renderRail() {
    const rail = $('tl-rail'); if (!rail) return;
    const list = TL.views.list().filter(TL.views.isAvailable);
    const main = list.filter((v) => v.group !== 'tools'), tools = list.filter((v) => v.group === 'tools');
    const item = (v) => {
      const cur = v.kind !== 'action' && TL.state.view === v.id;
      return `<button type="button" class="rail-item" data-view="${u.esc(v.id)}" aria-current="${cur}" aria-label="${u.esc(TL.views.label(v))}">${TL.ui.icon(v.icon || 'info')}<span class="lbl">${u.esc(TL.views.label(v))}</span></button>`;
    };
    rail.innerHTML = main.map(item).join('') + (tools.length ? '<i class="rail-sep" aria-hidden="true"></i>' + tools.map(item).join('') : '');
  }
  TL.views.refresh = renderRail;

  /* ── Leyenda (abajo izquierda) ──────────────────────────────────────── */
  A.setLegend = function (content) {
    const box = $('legend-box'); if (!box) return;
    if (!content) { box.hidden = true; box.innerHTML = ''; return; }
    box.innerHTML = String(content); box.hidden = false;
  };

  /* ── Atribución del mapa (instrumento discreto) ─────────────────────── */
  TL.map.updateAttribution = function () {
    let el = $('tl-attrib');
    if (!el) { el = u.h('div.attrib#tl-attrib'); $('tl-controls')?.appendChild(el); }
    el.textContent = t(TL.state.satellite ? 'map.attribSat' : 'map.attrib');
  };

  /* ── Cabecera y controles ───────────────────────────────────────────── */
  function bindChrome() {
    $('brand-home')?.addEventListener('click', (e) => { e.preventDefault(); nav.home(); });
    $('search-trigger')?.addEventListener('click', () => TL.search?.open?.('find'));
    const mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
    const kbd = $('search-kbd'); if (kbd) kbd.textContent = mac ? '⌘ K' : 'Ctrl K';
    $('lang-seg')?.addEventListener('click', (e) => { const b = e.target.closest('[data-lang]'); if (b) TL.i18n.set(b.dataset.lang); });
    $('btn-theme')?.addEventListener('click', () => TL.theme.toggle());
    $('btn-crm')?.addEventListener('click', () => (TL.crm?.openBoard ? TL.crm.openBoard() : TL.ui.toast(t('ui.unavailable'))));
    $('btn-present')?.addEventListener('click', () => (TL.tour?.start ? TL.tour.start() : TL.ui.toast(t('ui.unavailable'))));
    $('tl-rail')?.addEventListener('click', (e) => { const b = e.target.closest('[data-view]'); if (b) nav.view(b.dataset.view); });
    $('ctl-zoom-in')?.addEventListener('click', () => TL.map.zoomBy(1));
    $('ctl-zoom-out')?.addEventListener('click', () => TL.map.zoomBy(-1));
    $('ctl-sat')?.addEventListener('click', () => TL.map.setSatellite(!TL.state.satellite));
    $('ctl-3d')?.addEventListener('click', () => {
      const on = !TL.state.buildings3d; TL.map.set3D(on);
      const m = TL.map.instance; if (m && on && m.getPitch() < 30 && m.getZoom() > 13) m.easeTo({ pitch: 55, duration: 900 });
      if (m && !on && m.getPitch() > 0) m.easeTo({ pitch: 0, duration: 700 });
    });
    $('ctl-reset')?.addEventListener('click', () => nav.region());
    syncLangSeg();
    $('ctl-3d')?.setAttribute('aria-pressed', TL.state.buildings3d ? 'true' : 'false');
  }
  function syncLangSeg() {
    u.qsa('#lang-seg [data-lang]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.lang === TL.state.lang ? 'true' : 'false'));
  }

  /* ── Atajos de teclado ──────────────────────────────────────────────── */
  function bindKeys() {
    document.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      const typing = /input|textarea|select/i.test(e.target.tagName) || e.target.isContentEditable;
      if ((e.metaKey || e.ctrlKey) && k === 'k') { e.preventDefault(); TL.search?.isOpen?.() ? TL.search.close() : TL.search?.open?.('find'); return; }
      if (typing || e.metaKey || e.ctrlKey || e.altKey || TL.state.present) return;
      if (k === '/' ) { e.preventDefault(); TL.search?.open?.('find'); }
      else if (e.key === 'Escape' && !TL.ui.escTop()) {
        if (TL.map.hl) TL.map.clearHighlight();
        else if (TL.state.country) nav.region();
      }
    });
  }

  /* ── Eventos globales ───────────────────────────────────────────────── */
  function bindEvents() {
    TL.on('lang', () => { syncLangSeg(); renderRail(); TL.map.applyLang(); TL.map.updateAttribution(); TL.panel.renderLegend?.(); });
    TL.on('theme', (th) => { TL.map.applyTheme(th); });
    TL.on('views:changed', renderRail);
    TL.on('change:view', renderRail);
    TL.on('map:click', (h) => { if (h && h.kind === 'opp') nav.open(h.id, { fly: true }); });
    TL.on('ficha:close', () => { TL.map.clearSelection(); TL.set({ selected: null }); TL.map.setPadding(); });
    TL.on('ficha:open', () => TL.map.setPadding());
    TL.on('panel:toggle', () => TL.map.setPadding());
    TL.on('change:satellite', () => TL.map.updateAttribution());
    window.addEventListener('resize', u.debounce(() => TL.map.setPadding(), 180));
  }

  /* ── Aviso de datos de demostración ─────────────────────────────────── */
  function demoBadge() {
    if (!TL.data.isMock) return;
    const b = u.h('button.demo-badge.mono', { type: 'button' });
    const paint = () => { b.textContent = t('app.demo'); b.title = t('app.demoHint'); };
    paint(); TL.on('lang', paint);
    b.addEventListener('click', () => TL.ui.toast(t('app.demoHint'), { ms: 5200 }));
    $('tl-controls')?.prepend(b);
  }

  /* ── Arranque ───────────────────────────────────────────────────────── */
  async function boot() {
    document.title = t('app.title');
    TL.i18n.apply(document);
    runLoader();
    loaderStatus('loader.data', 0.18);
    bindChrome(); bindKeys(); bindEvents();
    renderRail();
    try { TL.panel.init(); } catch (err) { console.error('[TL] panel', err); }
    demoBadge();
    TL.map.drawStars();
    loaderStatus('loader.map', 0.42);
    let mapOk = true;
    const ready = TL.map.init($('tl-map'));
    if (!TL.map.instance) { mapOk = false; }
    const timeout = u.sleep(9000).then(() => 'timeout');
    const res = mapOk ? await Promise.race([ready, timeout]) : 'error';
    loaderStatus(res === 'timeout' ? 'loader.offline' : 'loader.layers', 0.86);
    TL.map.updateAttribution();
    endLoader();
    TL._resolveReady();
    TL.emit('ready');
    if (res === 'error') {
      document.body.classList.add('chrome-in', 'map-in', 'no-map');
      TL.set({ introDone: true });
      TL.ui.toast(t('app.mapError'), { ms: 6000, kind: 'warn' });
      return;
    }
    if (res === 'timeout') {
      // el estilo base no cargó (sin red): igual mostramos la UI; las capas llegan si el mapa termina de cargar
      document.body.classList.add('map-in', 'chrome-in');
      TL.set({ introDone: true });
      TL.ui.toast(t('map.offlineHint'), { ms: 5200, kind: 'warn' });
      ready.then(() => TL.map.instance.jumpTo(TL.map.HOME));
      return;
    }
    await u.sleep(TL.reduceMotion ? 0 : 320);
    TL.map.intro();
    if (TL.map.offline) TL.ui.toast(t('map.offlineHint'), { ms: 5200, kind: 'warn' });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
