/* ==========================================================================
   tl-planner.js — Gira: planificador de visitas con ruta optimizada.
   País → ciudad → prospectos (clientes + representantes) → "Optimizar ruta"
   (vecino más cercano + 2-opt sobre haversine) → ruta numerada en el mapa,
   tramos, tiempos, días sugeridos, Google Maps multi-parada e impresión.
   API: TL.planner = { add, remove, has, list, open, optimize, clear }
   ========================================================================== */
(function () {
  'use strict';
  const { u } = TL;
  const html = u.html, raw = u.raw;
  const t = (k, v) => TL.i18n.t(k, v);
  const icon = (n, c) => TL.ui.icon(n, c);

  /* ── Supuestos de tiempo (documentados en el pie de la vista) ─────────── */
  const DETOUR = 1.3;          // factor de rodeo sobre la línea recta
  const CITY_KMH = 28;         // velocidad urbana
  const ROAD_KMH = 65;         // tramos interurbanos (> 30 km en línea recta)
  const INTERCITY_KM = 30;
  const VISIT_MIN = 60;        // duración de cada visita
  const DAY_H = 9;             // jornada máxima sugerida
  const DAY_START = 9 * 60;    // 09:00
  const GM_MAX_WP = 9;         // waypoints por URL de Google Maps
  const PAGE = 40;

  /* ── Estado persistido ──────────────────────────────────────────────── */
  const blank = () => ({ cc: null, city: 'all', ids: [], start: 'first', route: null });
  let S = Object.assign(blank(), TL.store.get('planner', {}) || {});
  if (!Array.isArray(S.ids)) S.ids = [];
  const save = () => TL.store.set('planner', S);

  let root = null;            // raíz montada en el panel (si la vista está activa)
  let shown = PAGE;           // render incremental de la lista
  let drawnKey = '';          // ruta actualmente dibujada en el mapa

  /* ── Datos ──────────────────────────────────────────────────────────── */
  const recOf = (id) => TL.data.rec(id);
  const kindOf = (id) => TL.data.kindOf(id);
  const coord = (r) => [Number(r.lng), Number(r.lat)];
  const cityKey = (r) => u.norm(r?.city || '') || '—';
  const okGeo = (r) => r && isFinite(r.lat) && isFinite(r.lng);

  /** Prospectos de un país: clientes + representantes con coordenadas. */
  function prospects(cc) {
    if (!cc) return [];
    return TL.data.clientsOf(cc).concat(TL.data.repsOf(cc)).filter(okGeo);
  }
  function inScope(r) {
    return r && r.country === S.cc && (S.city === 'all' || cityKey(r) === S.city);
  }
  /** Lista visible: país + ciudad, ordenada por puntaje. */
  function scopeList() {
    return prospects(S.cc).filter(inScope)
      .sort((a, b) => TL.data.score(b) - TL.data.score(a) || String(a.name).localeCompare(String(b.name)));
  }
  /** Seleccionados dentro del alcance actual, en orden de selección. */
  const scopedIds = () => S.ids.filter((id) => inScope(recOf(id)) && okGeo(recOf(id)));

  /** Ciudades del país con conteo y rótulo más frecuente. */
  function cities(cc) {
    const g = {};
    prospects(cc).forEach((r) => {
      const k = cityKey(r);
      const e = (g[k] = g[k] || { key: k, n: 0, names: {} });
      e.n++; const nm = r.city || '—'; e.names[nm] = (e.names[nm] || 0) + 1;
    });
    return Object.values(g).map((e) => ({ key: e.key, n: e.n, name: Object.keys(e.names).sort((a, b) => e.names[b] - e.names[a])[0] }))
      .sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
  }
  /** Países con prospectos (orden por cantidad). */
  function countries() {
    const cnt = {};
    TL.data.clients.concat(TL.data.reps).forEach((r) => { if (okGeo(r) && r.country) cnt[r.country] = (cnt[r.country] || 0) + 1; });
    return Object.keys(cnt).map((cc) => ({ cc, n: cnt[cc], name: TL.data.countryName(cc) }))
      .sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
  }
  function ensureCountry() {
    const list = countries();
    const has = (cc) => list.some((c) => c.cc === cc);
    if (S.cc && has(S.cc)) return;
    const first = S.ids.map(recOf).find(okGeo);
    S.cc = (TL.state.country && has(TL.state.country) && TL.state.country) || first?.country || list[0]?.cc || null;
    S.city = 'all';
  }

  /* ── Optimización: vecino más cercano + 2-opt (camino abierto, inicio fijo) ── */
  function matrix(pts) {
    const n = pts.length, d = Array.from({ length: n }, () => new Float64Array(n));
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) d[i][j] = d[j][i] = u.km(pts[i], pts[j]);
    return d;
  }
  function nearest(d) {
    const n = d.length, used = new Uint8Array(n), order = [0];
    used[0] = 1;
    for (let s = 1; s < n; s++) {
      const last = order[order.length - 1];
      let best = -1, bd = Infinity;
      for (let j = 0; j < n; j++) if (!used[j] && d[last][j] < bd) { bd = d[last][j]; best = j; }
      used[best] = 1; order.push(best);
    }
    return order;
  }
  function twoOpt(order, d) {
    const n = order.length;
    if (n < 4) return order;
    let improved = true, guard = 0;
    while (improved && guard++ < 200) {
      improved = false;
      for (let i = 1; i < n - 1; i++) {
        for (let k = i + 1; k < n; k++) {
          const a = order[i - 1], b = order[i], c = order[k], e = k + 1 < n ? order[k + 1] : -1;
          const before = d[a][b] + (e >= 0 ? d[c][e] : 0);
          const after = d[a][c] + (e >= 0 ? d[b][e] : 0);
          if (after + 1e-9 < before) {
            for (let x = i, y = k; x < y; x++, y--) { const tmp = order[x]; order[x] = order[y]; order[y] = tmp; }
            improved = true;
          }
        }
      }
    }
    return order;
  }
  const centroid = (pts) => [u.sum(pts, (p) => p[0]) / pts.length, u.sum(pts, (p) => p[1]) / pts.length];

  /** Calcula la ruta para ids (orden de selección) y modo de inicio. */
  function solve(ids, start) {
    const recs = ids.map(recOf).filter(okGeo);
    if (recs.length < 2 && !(start === 'center' && recs.length === 1)) return null;
    const pts = recs.map(coord);
    const origin = start === 'center' ? centroid(pts) : null;
    const nodes = origin ? [origin].concat(pts) : pts;
    const d = matrix(nodes);
    const order = twoOpt(nearest(d), d);
    const seq = (origin ? order.filter((i) => i !== 0).map((i) => i - 1) : order).map((i) => recs[i].id);
    return { ids: seq, start, origin, cc: S.cc, city: S.city, at: Date.now() };
  }

  /* ── Métricas: tramos, tiempos, días, horarios ──────────────────────── */
  function legTime(km) { return (km * DETOUR) / (km > INTERCITY_KM ? ROAD_KMH : CITY_KMH) * 60; } // minutos
  function metrics(route) {
    const recs = route.ids.map(recOf).filter(okGeo);
    const stops = [];
    let prev = route.origin || null, cum = 0, drive = 0;
    recs.forEach((r) => {
      const p = coord(r);
      const line = prev ? u.km(prev, p) : 0;
      const km = line * DETOUR, min = prev ? legTime(line) : 0;
      cum += km; drive += min;
      stops.push({ rec: r, id: r.id, p, km, cum, min });
      prev = p;
    });
    // días: corte greedy cuando la jornada supera DAY_H
    const days = [];
    let cur = null;
    stops.forEach((s) => {
      const add = s.min + VISIT_MIN;
      if (!cur || (cur.min + add > DAY_H * 60 && cur.stops.length)) { cur = { stops: [], min: 0, km: 0 }; days.push(cur); }
      cur.stops.push(s); cur.min += add; cur.km += s.km;
    });
    // horarios estimados por día (inicio 09:00)
    days.forEach((dy, di) => {
      let clock = DAY_START;
      dy.stops.forEach((s, i) => { clock += i === 0 && di > 0 && !route.origin ? 0 : s.min; s.eta = clock; clock += VISIT_MIN; });
      dy.end = clock;
    });
    const total = drive + stops.length * VISIT_MIN;
    return { stops, days, km: cum, drive, total, over: total > DAY_H * 60, nDays: days.length };
  }
  /* ── Formato ────────────────────────────────────────────────────────── */
  const fKm = (km) => (km < 10 ? TL.i18n.dec(km, 1) : TL.i18n.int(km)) + ' km';
  const fDur = (min) => {
    min = Math.round(min);
    const h = Math.floor(min / 60), m = min % 60;
    return h ? `${h} h${m ? ' ' + String(m).padStart(2, '0') + ' min' : ''}` : `${m} min`;
  };
  const fClock = (min) => `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(Math.round(min % 60)).padStart(2, '0')}`;
  const ll = (p) => `${(+p[1]).toFixed(6)},${(+p[0]).toFixed(6)}`;

  /* ── Google Maps: URL multi-parada (máx. 9 waypoints → se parte en tramos) ── */
  function gmUrl(pts) {
    const q = new URLSearchParams();
    q.set('api', '1');
    q.set('origin', ll(pts[0]));
    q.set('destination', ll(pts[pts.length - 1]));
    if (pts.length > 2) q.set('waypoints', pts.slice(1, -1).map(ll).join('|'));
    q.set('travelmode', 'driving');
    return 'https://www.google.com/maps/dir/?' + q.toString().replace(/%2C/g, ',').replace(/%7C/g, '|');
  }
  /** Enlaces por día; si un día tiene más de 11 puntos se parte en tramos encadenados. */
  function gmLinks(route, m) {
    const out = [];
    m.days.forEach((dy, di) => {
      const pts = (route.origin ? [route.origin] : []).concat(dy.stops.map((s) => s.p));
      if (pts.length < 2) return;
      const size = GM_MAX_WP + 2;
      const parts = [];
      for (let i = 0; i < pts.length - 1; i += size - 1) parts.push(pts.slice(i, i + size));
      parts.forEach((seg, pi) => { if (seg.length > 1) out.push({ day: di + 1, part: parts.length > 1 ? pi + 1 : 0, url: gmUrl(seg), n: seg.length }); });
    });
    return out;
  }

  /* ── Mapa ───────────────────────────────────────────────────────────── */
  const routeKey = (r) => (r ? r.ids.join(',') + '|' + r.start : '');
  function routeCoords(route) {
    const pts = route.ids.map(recOf).filter(okGeo).map(coord);
    return route.origin ? [route.origin].concat(pts) : pts;
  }
  function routeLabels(route) {
    const n = route.ids.map(recOf).filter(okGeo).length;
    const nums = Array.from({ length: n }, (_, i) => String(i + 1));
    return route.origin ? ['H'].concat(nums) : nums;
  }
  function draw(route, { fit = true } = {}) {
    const M = TL.map;
    if (!M || !route) return;
    const coords = routeCoords(route);
    if (coords.length < 2) return;
    const go = () => {
      M.addRoute?.(coords, routeLabels(route));
      drawnKey = routeKey(route);
      if (fit) M.fitPoints?.(coords, { maxZoom: 13.5, margin: 70 });
    };
    if (M.ready && typeof M.ready.then === 'function') M.ready.then(go); else go();
  }
  function undraw() { TL.map?.clearRoute?.(); drawnKey = ''; }
  function highlight() {
    const ids = scopedIds();
    if (!TL.map?.highlight) return;
    if (ids.length) TL.map.highlight(ids, { dim: 0.28 }); else TL.map.clearHighlight?.();
  }
  function flyScope() {
    const M = TL.map; if (!M) return;
    if (S.city !== 'all') {
      const pts = prospects(S.cc).filter(inScope).map(coord);
      if (pts.length) M.fitPoints?.(pts, { maxZoom: 12, margin: 80 });
    } else if (S.cc) M.flyToCountry?.(S.cc);
  }
  const isStale = () => !!S.route && (S.route.cc !== S.cc || S.route.city !== S.city || S.route.start !== S.start
    || S.route.ids.slice().sort().join() !== scopedIds().slice().sort().join());
  /* ── Render del panel ───────────────────────────────────────────────── */
  let showAllCities = false, firstPaint = true, ordMap = new Map();
  const MAX_CITIES = 12;

  function headHtml() {
    return html`<header class="pv-head tp-head">
      <p class="kicker">${t('planner.kicker')}</p>
      <h2 class="pv-title">${t('planner.title')}</h2>
      <p class="pv-sub">${t('planner.sub')}</p>
      <button type="button" class="btn btn-sm tp-trip" data-trip-open>✈ ${TL.state.lang === 'de' ? 'Reise über mehrere Länder planen' : 'Planificar viaje multi-país'}</button>
    </header>`;
  }
  const step = (n, label, extra = '') => html`<h3 class="h-sec tp-step"><span class="tp-step-n num">${String(n).padStart(2, '0')}</span>${label}${raw(extra)}</h3>`;

  function countryHtml(list) {
    return html`<section class="pv-sec tp-sec">${step(1, t('planner.country'))}
      <div class="tp-chips" role="group" aria-label="${t('planner.country')}">${list.map((c) => html`
        <button type="button" class="tp-chip" data-cc="${c.cc}" aria-pressed="${c.cc === S.cc}">${TL.ui.flag(c.cc, 16)}<span>${c.name}</span><b class="num">${c.n}</b></button>`)}
      </div></section>`;
  }
  function cityHtml() {
    const list = cities(S.cc);
    const total = u.sum(list, (c) => c.n);
    const vis = showAllCities || list.length <= MAX_CITIES + 1 ? list : list.slice(0, MAX_CITIES);
    if (S.city !== 'all' && !vis.some((c) => c.key === S.city)) { const cur = list.find((c) => c.key === S.city); if (cur) vis.push(cur); }
    return html`<section class="pv-sec tp-sec">${step(2, t('planner.city'))}
      <div class="tp-chips" role="group" aria-label="${t('planner.city')}">
        <button type="button" class="tp-chip" data-city="all" aria-pressed="${S.city === 'all'}"><span>${t('planner.allCities')}</span><b class="num">${total}</b></button>${vis.map((c) => html`
        <button type="button" class="tp-chip" data-city="${c.key}" aria-pressed="${c.key === S.city}"><span>${c.name}</span><b class="num">${c.n}</b></button>`)}
        ${vis.length < list.length ? html`<button type="button" class="tp-chip tp-chip-more" data-act="cities">+${list.length - vis.length}</button>` : ''}
      </div></section>`;
  }
  function itemHtml(r, i) {
    const sel = S.ids.includes(r.id), kind = kindOf(r.id);
    const sc = Math.round(TL.data.score(r));
    const meta = kind === 'rep' ? t('planner.rep') : (r.sectors || []).slice(0, 1).map(TL.data.sectorName).join('') || TL.data.segmentName(r.segment);
    const ord = sel ? ordMap.get(r.id) || 0 : 0;
    return html`<li class="tp-item${sel ? ' is-on' : ''}" data-id="${r.id}" style="--i:${Math.min(i, 14)}">
      <label class="tp-row">
        <input type="checkbox" class="tp-cb sr" data-id="${r.id}" ${raw(sel ? 'checked' : '')}>
        <span class="tp-box" aria-hidden="true">${icon('check')}</span>
        ${TL.ui.logo(r, 30)}
        <span class="tp-main">
          <span class="tp-name">${r.name || r.id}</span>
          <span class="tp-meta">${kind === 'rep' ? html`<i class="tp-kind">REP</i>` : ''}${r.city || ''}${meta ? ' · ' + meta : ''}</span>
        </span>
        <span class="tp-score" title="${t('planner.score')}"><i class="tp-tier" data-tier="${r.tier || 'C'}">${r.tier || 'C'}</i><b class="num">${sc}</b></span>
        ${ord ? html`<span class="tp-ord num" aria-hidden="true">${ord}</span>` : ''}
      </label>
    </li>`;
  }
  function listHtml() {
    const list = scopeList();
    const sids = scopedIds(), n = sids.length;
    ordMap = new Map(sids.map((id, i) => [id, i + 1]));
    if (!list.length) return html`<section class="pv-sec tp-sec">${step(3, t('planner.prospects'))}${emptyHtml(t('planner.noProspects'))}</section>`;
    return html`<section class="pv-sec tp-sec">${step(3, t('planner.prospects'))}
      <div class="tp-tools">
        <span class="tp-count" aria-live="polite"><b class="num">${n}</b> ${t('planner.selectedOf', { n: list.length })}</span>
        <span class="tp-tools-btns">
          <button type="button" class="tp-link" data-act="all">${t('planner.selectAll')}</button>
          <button type="button" class="tp-link" data-act="none" ${raw(n ? '' : 'disabled')}>${t('planner.selectNone')}</button>
        </span>
      </div>
      <ul class="tp-list${firstPaint ? ' tp-anim' : ''}">${list.slice(0, shown).map(itemHtml)}</ul>
      ${list.length > shown ? html`<button type="button" class="btn btn-ghost btn-sm tp-more" data-act="more">${t('ui.showMore', { n: Math.min(PAGE, list.length - shown) })}</button>` : ''}
    </section>`;
  }
  function startHtml() {
    return html`<section class="pv-sec tp-sec">${step(4, t('planner.start'))}
      <div class="seg tp-seg" role="group" aria-label="${t('planner.start')}">
        <button type="button" data-start="first" aria-pressed="${S.start === 'first'}">${t('planner.startFirst')}</button>
        <button type="button" data-start="center" aria-pressed="${S.start === 'center'}">${t('planner.startCenter')}</button>
      </div>
      <p class="tp-hint">${t(S.start === 'center' ? 'planner.startCenterHint' : 'planner.startFirstHint')}</p>
    </section>`;
  }
  function barHtml() {
    const n = scopedIds().length, need = S.start === 'center' ? 1 : 2;
    const stale = isStale();
    return html`<div class="tp-bar">
      <button type="button" class="btn btn-lime tp-opt" data-act="opt" ${raw(n >= need ? '' : 'disabled')}>
        ${icon('route')}<span>${t(S.route && stale ? 'planner.reoptimize' : 'planner.optimize')}</span><b class="num tp-opt-n">${n}</b>
      </button>
      ${n < need ? html`<span class="tp-bar-hint">${t('planner.needTwo')}</span>` : ''}
    </div>`;
  }
  const emptyHtml = (txt) => (TL.ui.empty ? TL.ui.empty(txt, 'tour') : html`<p class="empty">${txt}</p>`);
  function resultHtml() {
    const route = S.route;
    if (!route || route.cc !== S.cc) return '';
    const m = metrics(route);
    if (!m.stops.length) return '';
    const links = gmLinks(route, m);
    const stale = isStale();
    let n = 0;
    const stopLi = (s) => { n++; return html`<li class="tp-stop" style="--i:${Math.min(n, 16)}">
        <span class="tp-pin num">${n}</span>
        <span class="tp-stop-main">
          <button type="button" class="tp-stop-name" data-act="ficha" data-id="${s.id}">${s.rec.name || s.id}</button>
          <span class="tp-stop-meta">${s.rec.city || ''}${kindOf(s.id) === 'rep' ? ' · ' + t('planner.rep') : ''}</span>
          ${s.km > 0 ? html`<span class="tp-leg num">+${fKm(s.km)} · ${fDur(s.min)}<i>Σ ${fKm(s.cum)}</i></span>` : html`<span class="tp-leg num">${t('planner.firstStop')}</span>`}
        </span>
        <span class="tp-eta num" title="${t('planner.eta')}">${fClock(s.eta)}</span>
      </li>`; };
    const dayBlock = (dy, di) => html`<div class="tp-day">
        ${m.days.length > 1 ? html`<p class="tp-day-h"><b>${t('planner.day', { n: di + 1 })}</b><span class="num">${dy.stops.length} · ${fKm(dy.km)} · ${fDur(dy.min)}</span></p>` : ''}
        <ol class="tp-stops">
          ${route.origin ? html`<li class="tp-stop tp-stop-h"><span class="tp-pin num">H</span><span class="tp-stop-main"><span class="tp-stop-name">${t('planner.hotel')}</span><span class="tp-stop-meta">${t('planner.hotelHint')}</span></span><span class="tp-eta num">${fClock(DAY_START)}</span></li>` : ''}
          ${dy.stops.map(stopLi)}
        </ol></div>`;
    const kpi = (label, val, sub) => html`<div class="tp-kpi"><span class="lbl">${label}</span><b class="num">${val}</b>${sub ? html`<span class="tp-kpi-sub">${sub}</span>` : ''}</div>`;
    return html`<section class="pv-sec tp-sec tp-result${stale ? ' is-stale' : ''}" id="tp-result" aria-live="polite">
      ${step(5, t('planner.route'))}
      ${stale ? html`<p class="tp-note">${icon('info')}<span>${t('planner.stale')}</span></p>` : ''}
      <div class="tp-kpis">
        ${kpi(t('planner.kStops'), TL.i18n.int(m.stops.length))}
        ${kpi(t('planner.kKm'), '≈ ' + fKm(m.km))}
        ${kpi(t('planner.kDrive'), fDur(m.drive))}
        ${kpi(t('planner.kTotal'), fDur(m.total), t('planner.kTotalSub', { n: m.stops.length }))}
      </div>
      ${m.over ? html`<p class="tp-note tp-warn">${icon('warn')}<span>${t('planner.overDay', { h: DAY_H, n: m.nDays })}</span></p>` : ''}
      ${m.days.map(dayBlock)}
      <div class="tp-actions">
        ${links.length === 1
          ? html`<a class="btn btn-ink" href="${links[0].url}" target="_blank" rel="noopener">${icon('external')}<span>${t('planner.gmaps')}</span></a>`
          : html`<div class="tp-gm"><span class="lbl">${t('planner.gmaps')}</span>${links.map((l) => html`<a class="btn btn-sm" href="${l.url}" target="_blank" rel="noopener">${icon('external')}<span>${t('planner.day', { n: l.day })}${l.part ? ' · ' + t('planner.part', { n: l.part }) : ''}</span></a>`)}</div>`}
        <button type="button" class="btn" data-act="print">${icon('print')}<span>${t('planner.print')}</span></button>
        <button type="button" class="btn btn-ghost" data-act="clear">${icon('close')}<span>${t('planner.clear')}</span></button>
      </div>
      <p class="tp-foot">${t('planner.assumptions', { f: TL.i18n.dec(DETOUR, 1), v: CITY_KMH, r: ROAD_KMH, m: VISIT_MIN })}</p>
    </section>`;
  }

  function paint(o = {}) {
    if (!root) return;
    const list = countries();
    if (!list.length) { root.innerHTML = String(headHtml()) + String(emptyHtml(t('planner.noData'))); return; }
    const fa = document.activeElement;
    let fsel = null;
    if (fa && root.contains(fa)) {
      for (const a of ['data-id', 'data-act', 'data-cc', 'data-city', 'data-start']) {
        if (fa.hasAttribute(a)) { fsel = `${fa.tagName.toLowerCase()}[${a}="${CSS.escape(fa.getAttribute(a))}"]`; break; }
      }
    }
    root.innerHTML = [headHtml(), countryHtml(list), cityHtml(), listHtml(), startHtml(), barHtml(), resultHtml()].map(String).join('');
    if (fsel) root.querySelector(fsel)?.focus({ preventScroll: true });
    if (firstPaint) TL.ui.reveal?.(root);
    firstPaint = false;
    if (o.scrollResult) {
      const r = root.querySelector('#tp-result');
      r?.scrollIntoView({ behavior: TL.reduceMotion ? 'auto' : 'smooth', block: 'start' });
    }
  }
  /* ── Interacción ────────────────────────────────────────────────────── */
  function setCountry(cc) {
    if (!cc || cc === S.cc) return;
    S.cc = cc; S.city = 'all'; shown = PAGE; showAllCities = false;
    save(); paint();
    if (S.route && S.route.cc === cc) draw(S.route, { fit: true });
    else { if (drawnKey) undraw(); flyScope(); }
    highlight();
  }
  function setCity(key) {
    if (key === S.city) return;
    S.city = key; shown = PAGE;
    save(); paint(); flyScope(); highlight();
  }
  function toggle(id, on) {
    const has = S.ids.includes(id);
    if (on && !has) S.ids.push(id);
    if (!on && has) S.ids = S.ids.filter((x) => x !== id);
    save(); paint(); highlight();
  }
  function bind(el) {
    el.addEventListener('change', (e) => {
      const cb = e.target.closest('.tp-cb');
      if (cb) toggle(cb.dataset.id, cb.checked);
    });
    el.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b || !el.contains(b)) return;
      if (b.dataset.cc) return setCountry(b.dataset.cc);
      if (b.dataset.city) return setCity(b.dataset.city);
      if (b.dataset.start) { S.start = b.dataset.start; save(); paint(); return; }
      const a = b.dataset.act;
      if (a === 'all') { scopeList().forEach((r) => { if (!S.ids.includes(r.id)) S.ids.push(r.id); }); save(); paint(); highlight(); }
      else if (a === 'none') { S.ids = S.ids.filter((id) => !inScope(recOf(id))); save(); paint(); highlight(); }
      else if (a === 'more') { shown += PAGE; paint(); }
      else if (a === 'cities') { showAllCities = true; paint(); }
      else if (a === 'opt') API.optimize();
      else if (a === 'print') printSheet();
      else if (a === 'clear') {
        S.route = null; S.ids = S.ids.filter((id) => !inScope(recOf(id)));
        save(); undraw(); paint(); highlight();
      } else if (a === 'ficha' && b.dataset.id) TL.nav?.open ? TL.nav.open(b.dataset.id, { fly: true }) : TL.ficha?.open?.(b.dataset.id);
    });
  }

  /* ── Hoja de ruta imprimible ────────────────────────────────────────── */
  function schematic(route) {
    const pts = routeCoords(route), lab = routeLabels(route);
    if (pts.length < 2) return '';
    const W = 680, H = 230, pad = 26;
    const lat0 = centroid(pts)[1] * Math.PI / 180, kx = Math.cos(lat0);
    const xs = pts.map((p) => p[0] * kx), ys = pts.map((p) => -p[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const sc = Math.min((W - pad * 2) / (maxX - minX || 1e-6), (H - pad * 2) / (maxY - minY || 1e-6));
    const ox = (W - (maxX - minX) * sc) / 2, oy = (H - (maxY - minY) * sc) / 2;
    const P = pts.map((p, i) => [ox + (xs[i] - minX) * sc, oy + (ys[i] - minY) * sc]);
    const line = P.map((q) => q.map((v) => v.toFixed(1)).join(',')).join(' ');
    return `<svg class="tp-pr-map" viewBox="0 0 ${W} ${H}" aria-hidden="true"><polyline points="${line}" fill="none" stroke="#131313" stroke-width="1.6" stroke-dasharray="5 3"/>${P.map((q, i) => `<g><circle cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="10" fill="${lab[i] === 'H' ? '#fff' : '#131313'}" stroke="#131313" stroke-width="1.2"/><text x="${q[0].toFixed(1)}" y="${(q[1] + 3.6).toFixed(1)}" text-anchor="middle" font-size="10" font-weight="700" font-family="IBM Plex Mono, monospace" fill="${lab[i] === 'H' ? '#131313' : '#fff'}">${lab[i]}</text></g>`).join('')}</svg>`;
  }
  function printSheet() {
    const route = S.route; if (!route) return;
    const m = metrics(route), links = gmLinks(route, m);
    const cityName = S.city === 'all' ? t('planner.allCities') : (cities(S.cc).find((c) => c.key === S.city)?.name || '');
    document.getElementById('tl-print-route')?.remove();
    const tel = (r) => (r.contacts?.phones || [])[0] || '';
    const rows = m.days.map((dy, di) => String(html`
      ${m.days.length > 1 ? html`<tr class="tp-pr-day"><td colspan="7">${t('planner.day', { n: di + 1 })} · ${dy.stops.length} · ${fKm(dy.km)} · ${fDur(dy.min)}</td></tr>` : ''}
      ${dy.stops.map((s) => html`<tr><td class="num">${m.stops.indexOf(s) + 1}</td><td><b>${s.rec.name || s.id}</b><br><small>${s.rec.address || s.rec.city || ''}</small></td><td class="num">${tel(s.rec)}</td><td class="num">${fClock(s.eta)}</td><td class="num">${s.km ? fKm(s.km) : '—'}</td><td class="num">${fKm(s.cum)}</td><td class="tp-pr-notes"></td></tr>`)}`)).join('');
    const sheet = u.el(html`<div id="tl-print-route" aria-hidden="true">
      <header class="tp-pr-head">
        <div><p class="tp-pr-kick">TRUMPF · Market Atlas LATAM</p><h1>${t('planner.sheet')}</h1>
        <p class="tp-pr-sub">${TL.data.countryName(S.cc)} · ${cityName} · ${TL.i18n.date(new Date(), { day: 'numeric', month: 'long', year: 'numeric' })}</p></div>
        <dl class="tp-pr-kpis"><div><dt>${t('planner.kStops')}</dt><dd>${m.stops.length}</dd></div><div><dt>${t('planner.kKm')}</dt><dd>≈ ${fKm(m.km)}</dd></div><div><dt>${t('planner.kDrive')}</dt><dd>${fDur(m.drive)}</dd></div><div><dt>${t('planner.kTotal')}</dt><dd>${fDur(m.total)}</dd></div></dl>
      </header>
      ${raw(schematic(route))}
      ${m.over ? html`<p class="tp-pr-warn">${t('planner.overDay', { h: DAY_H, n: m.nDays })}</p>` : ''}
      <table class="tp-pr-table"><thead><tr><th>#</th><th>${t('planner.colCompany')}</th><th>${t('planner.colPhone')}</th><th>${t('planner.eta')}</th><th>${t('planner.colLeg')}</th><th>Σ</th><th>${t('planner.colNotes')}</th></tr></thead>
      <tbody>${raw(rows)}</tbody></table>
      <p class="tp-pr-foot">${t('planner.assumptions', { f: TL.i18n.dec(DETOUR, 1), v: CITY_KMH, r: ROAD_KMH, m: VISIT_MIN })}</p>
      <p class="tp-pr-links">${links.map((l) => html`<span>${t('planner.day', { n: l.day })}${l.part ? ' · ' + t('planner.part', { n: l.part }) : ''}: ${l.url}</span>`)}</p>
    </div>`);
    document.body.appendChild(sheet);
    document.body.classList.add('tp-printing');
    const done = () => { document.body.classList.remove('tp-printing'); sheet.remove(); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    API._printing = sheet;
    setTimeout(() => { try { window.print(); } catch (e) { done(); } }, 60);
  }
  /* ── API pública ────────────────────────────────────────────────────── */
  let active = false;
  const API = (TL.planner = {
    add(id) {
      const r = recOf(id);
      if (!okGeo(r)) { TL.ui.toast?.(t('planner.noGeo'), { kind: 'warn' }); return false; }
      const hadScope = scopedIds().length > 0;
      if (!S.ids.includes(id)) S.ids.push(id);
      if (!hadScope || !S.cc) { S.cc = r.country; S.city = cityKey(r); }
      else if (r.country === S.cc && !inScope(r)) S.city = 'all';
      shown = Math.max(shown, PAGE);
      save();
      const n = scopedIds().length;
      const msg = u.h('span.tp-toast', u.h('span', t('planner.added', { name: r.name || id, n })),
        TL.state.view !== 'tour' ? u.h('button.tp-toast-act', { type: 'button', onclick: () => API.open() }, t('planner.view')) : null);
      TL.ui.toast?.(msg, { ms: 4200, kind: 'ok' });
      if (TL.state.view === 'tour' && root) { paint(); highlight(); }
      TL.emit('planner:changed', S.ids.slice());
      return true;
    },
    remove(id) {
      if (!S.ids.includes(id)) return false;
      S.ids = S.ids.filter((x) => x !== id); save();
      if (root) { paint(); highlight(); }
      TL.emit('planner:changed', S.ids.slice());
      return true;
    },
    has: (id) => S.ids.includes(id),
    list: () => S.ids.slice(),
    open() {
      if (TL.nav?.view) TL.nav.view('tour'); else TL.set({ view: 'tour' });
      TL.panel?.open?.();
    },
    /** Optimiza la selección del alcance actual y dibuja la ruta. Devuelve métricas o null. */
    optimize() {
      ensureCountry();
      const route = solve(scopedIds(), S.start);
      if (!route) { TL.ui.toast?.(t('planner.needTwo'), { kind: 'warn' }); return null; }
      S.route = route; save();
      draw(route, { fit: true });
      if (root) paint({ scrollResult: true });
      const m = metrics(route);
      TL.emit('planner:route', route);
      return { ids: route.ids.slice(), km: m.km, drive: m.drive, total: m.total, days: m.nDays, links: gmLinks(route, m).map((l) => l.url) };
    },
    clear() {
      S.ids = []; S.route = null; save(); undraw();
      if (root) { paint(); highlight(); }
      TL.emit('planner:changed', []);
    },
    state: () => JSON.parse(JSON.stringify(S)),
  });

  /* ── Vista del riel ─────────────────────────────────────────────────── */
  function leave() {
    if (!active) return;
    active = false; root = null;
    TL.map?.clearHighlight?.();
    if (!S.route && drawnKey) undraw();      // la ruta queda solo si el usuario la creó
  }
  TL.on('change:view', (v, prev) => { if (prev === 'tour' && v !== 'tour') leave(); });

  TL.views.register({
    id: 'tour', order: 60, icon: 'tour', label: 'rail.tour', kind: 'panel', group: 'main', mapMode: 'clients',
    render(container) {
      ensureCountry();
      const opening = !active;
      active = true; firstPaint = opening;
      if (opening) { shown = PAGE; showAllCities = false; }
      root = u.h('div.tp');
      container.appendChild(root);
      bind(root);
      paint();
      const mine = S.route && S.route.cc === S.cc;
      if (opening) { if (mine) draw(S.route, { fit: true }); else flyScope(); }
      else if (mine && drawnKey !== routeKey(S.route)) draw(S.route, { fit: false });
      const h = () => highlight();
      if (TL.map?.ready?.then) TL.map.ready.then(h); else h();
      const mounted = root;
      return () => { if (root === mounted) root = null; };
    },
    onClose: leave,
    legend() {
      return html`<p class="legend-title">${t('rail.tour')}</p>
        <div class="legend-row">
          <span class="legend-item"><i class="tp-lg-line" aria-hidden="true"></i>${t('planner.lgRoute')}</span>
          <span class="legend-item"><i class="tp-lg-pin num" aria-hidden="true">1</i>${t('planner.lgStop')}</span>
          <span class="legend-item"><i class="tp-lg-pin tp-lg-h num" aria-hidden="true">H</i>${t('planner.hotel')}</span>
        </div>`;
    },
  });
  /* ── i18n ───────────────────────────────────────────────────────────── */
  TL.i18n.extend({
    es: {
      'planner.kicker': 'Gira de visitas',
      'planner.title': 'Planificador de ruta',
      'planner.sub': 'Elegí país y ciudad, marcá los prospectos y optimizá el recorrido del día.',
      'planner.country': 'País',
      'planner.city': 'Ciudad',
      'planner.allCities': 'Todas',
      'planner.prospects': 'Prospectos',
      'planner.selectedOf': 'seleccionados de {n}',
      'planner.selectAll': 'Marcar todos',
      'planner.selectNone': 'Desmarcar',
      'planner.score': 'Tier y puntaje',
      'planner.rep': 'Representante',
      'planner.start': 'Punto de partida',
      'planner.startFirst': 'Primer seleccionado',
      'planner.startCenter': 'Hotel / centro',
      'planner.startFirstHint': 'La ruta arranca en el primer prospecto que marcaste.',
      'planner.startCenterHint': 'La ruta sale del centro geométrico de las visitas (referencia para el hotel).',
      'planner.optimize': 'Optimizar ruta',
      'planner.reoptimize': 'Volver a optimizar',
      'planner.needTwo': 'Marcá al menos dos prospectos.',
      'planner.route': 'Ruta optimizada',
      'planner.stale': 'La selección cambió desde la última optimización.',
      'planner.kStops': 'Visitas',
      'planner.kKm': 'Distancia',
      'planner.kDrive': 'Manejo',
      'planner.kTotal': 'Jornada',
      'planner.kTotalSub': 'incl. {n} × 60 min',
      'planner.overDay': 'Supera las {h} h de jornada: conviene repartirla en {n} días.',
      'planner.day': 'Día {n}',
      'planner.part': 'tramo {n}',
      'planner.firstStop': 'Primera visita',
      'planner.eta': 'Llegada estimada',
      'planner.hotel': 'Hotel / centro',
      'planner.hotelHint': 'Salida 09:00',
      'planner.gmaps': 'Abrir en Google Maps',
      'planner.print': 'Imprimir',
      'planner.clear': 'Limpiar',
      'planner.assumptions': 'Estimación: línea recta × {f} de rodeo, {v} km/h en ciudad y {r} km/h entre ciudades, {m} min por visita, inicio 09:00.',
      'planner.noData': 'Todavía no hay prospectos con ubicación para planificar una gira.',
      'planner.noProspects': 'No hay prospectos en esta ciudad.',
      'planner.noGeo': 'Este registro no tiene ubicación en el mapa.',
      'planner.added': '{name} agregado a la gira · {n} en la selección',
      'planner.view': 'Ver gira',
      'planner.sheet': 'Hoja de ruta',
      'planner.colCompany': 'Empresa',
      'planner.colPhone': 'Teléfono',
      'planner.colLeg': 'Tramo',
      'planner.colNotes': 'Notas',
      'planner.lgRoute': 'Ruta optimizada',
      'planner.lgStop': 'Parada',
    },
    de: {
      'planner.kicker': 'Besuchsreise',
      'planner.title': 'Routenplaner',
      'planner.sub': 'Land und Stadt wählen, Interessenten markieren und die Tagesroute optimieren.',
      'planner.country': 'Land',
      'planner.city': 'Stadt',
      'planner.allCities': 'Alle',
      'planner.prospects': 'Interessenten',
      'planner.selectedOf': 'von {n} ausgewählt',
      'planner.selectAll': 'Alle markieren',
      'planner.selectNone': 'Auswahl aufheben',
      'planner.score': 'Stufe und Punktzahl',
      'planner.rep': 'Vertretung',
      'planner.start': 'Startpunkt',
      'planner.startFirst': 'Erster Eintrag',
      'planner.startCenter': 'Hotel / Zentrum',
      'planner.startFirstHint': 'Die Route beginnt beim zuerst markierten Interessenten.',
      'planner.startCenterHint': 'Die Route startet im geometrischen Mittelpunkt der Besuche (Richtwert für das Hotel).',
      'planner.optimize': 'Route optimieren',
      'planner.reoptimize': 'Neu optimieren',
      'planner.needTwo': 'Bitte mindestens zwei Interessenten markieren.',
      'planner.route': 'Optimierte Route',
      'planner.stale': 'Die Auswahl hat sich seit der letzten Optimierung geändert.',
      'planner.kStops': 'Besuche',
      'planner.kKm': 'Strecke',
      'planner.kDrive': 'Fahrzeit',
      'planner.kTotal': 'Arbeitstag',
      'planner.kTotalSub': 'inkl. {n} × 60 Min.',
      'planner.overDay': 'Mehr als {h} Std. – besser auf {n} Tage verteilen.',
      'planner.day': 'Tag {n}',
      'planner.part': 'Abschnitt {n}',
      'planner.firstStop': 'Erster Besuch',
      'planner.eta': 'Voraussichtliche Ankunft',
      'planner.hotel': 'Hotel / Zentrum',
      'planner.hotelHint': 'Abfahrt 09:00',
      'planner.gmaps': 'In Google Maps öffnen',
      'planner.print': 'Drucken',
      'planner.clear': 'Zurücksetzen',
      'planner.assumptions': 'Schätzung: Luftlinie × {f} Umwegfaktor, {v} km/h innerorts, {r} km/h zwischen Städten, {m} Min. pro Besuch, Start 09:00.',
      'planner.noData': 'Noch keine Interessenten mit Standort für eine Besuchsreise.',
      'planner.noProspects': 'Keine Interessenten in dieser Stadt.',
      'planner.noGeo': 'Für diesen Eintrag ist kein Standort hinterlegt.',
      'planner.added': '{name} zur Reise hinzugefügt · {n} ausgewählt',
      'planner.view': 'Reise ansehen',
      'planner.sheet': 'Routenblatt',
      'planner.colCompany': 'Unternehmen',
      'planner.colPhone': 'Telefon',
      'planner.colLeg': 'Etappe',
      'planner.colNotes': 'Notizen',
      'planner.lgRoute': 'Optimierte Route',
      'planner.lgStop': 'Halt',
    },
  });
})();
