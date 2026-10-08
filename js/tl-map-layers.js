/* ==========================================================================
   tl-map-layers.js — capas de puntos: clientes (clusters + tiers), representantes
   (rombos), distribuidores de la competencia (cuadrados), oportunidades (pulso ámbar),
   selección, resaltado/atenuado y ruta de gira. Se suma a TL.map.
   ========================================================================== */
(function () {
  'use strict';
  const { u } = TL;
  const M = TL.map;
  const BOLD = ['Noto Sans Bold'];
  const EMPTY = { type: 'FeatureCollection', features: [] };
  const Z = (...s) => ['interpolate', ['linear'], ['zoom'], ...s];
  let pointScale = 1;

  const pal = () => TL.mapStyle.palette(TL.state.theme);
  const tierExpr = () => ['match', ['get', 'tier'], 'A', u.css('--tier-a'), 'B', u.css('--tier-b'), u.css('--tier-c')];

  /** Radio del punto: crece con el puntaje y con el zoom (stops con expresión de puntaje). */
  const dotRadius = (extra = 0) => {
    const sc = (a, b) => ['+', extra, ['*', pointScale, ['interpolate', ['linear'], ['get', 'sc'], 40, a, 100, b]]];
    return Z(2, sc(2.6, 4.6), 6, sc(3.8, 6.6), 10, sc(5.4, 9), 15, sc(8, 13), 19, sc(12, 18));
  };

  M.clientFeatures = (list) => list.map((c) => {
    const g = TL.data.primaryGroup(c);
    return { type: 'Feature', properties: { id: c.id, tier: c.tier, sc: Math.round(TL.data.score(c)), gk: g, gc: TL.data.groupColor(g), cc: c.country, nw: c.isNew ? 1 : 0 }, geometry: { type: 'Point', coordinates: [c.lng, c.lat] } };
  });
  const repFeatures = () => ({ type: 'FeatureCollection', features: TL.data.reps.map((r) => ({ type: 'Feature', properties: { id: r.id, sh: r.shortlist ? 1 : 0, sc: Math.round(TL.data.score(r)), cc: r.country }, geometry: { type: 'Point', coordinates: [r.lng, r.lat] } })) });
  const dealerFeatures = () => ({ type: 'FeatureCollection', features: TL.data.dealers.filter((d) => isFinite(d.lat) && isFinite(d.lng)).map((d, i) => ({ type: 'Feature', properties: { id: 'DL-' + i, brand: d.brand, gc: TL.data.groupColor(TL.data.groupOfBrand(d.brand, d.brand_group)), cc: d.country }, geometry: { type: 'Point', coordinates: [d.lng, d.lat] } })) });

  /** Lista de clientes visibles en el mapa = filtros globales (no el país en foco). */
  M.visibleClients = () => TL.filters.apply(TL.data.clients);

  M.addPointLayers = function () {
    const map = M.instance, p = pal(), D = TL.data;
    map.addSource('clients', {
      type: 'geojson', data: { type: 'FeatureCollection', features: M.clientFeatures(M.visibleClients()) }, cluster: true, clusterRadius: 44, clusterMaxZoom: 9,
      clusterProperties: { a: ['+', ['case', ['==', ['get', 'tier'], 'A'], 1, 0]], b: ['+', ['case', ['==', ['get', 'tier'], 'B'], 1, 0]], s: ['+', ['get', 'sc']] },
    });
    map.addSource('reps', { type: 'geojson', data: repFeatures() });
    map.addSource('dealers', { type: 'geojson', data: dealerFeatures() });
    map.addSource('hov', { type: 'geojson', data: EMPTY });
    map.addSource('route', { type: 'geojson', data: EMPTY, lineMetrics: true });
    map.addSource('route-pts', { type: 'geojson', data: EMPTY });

    const add = (l) => map.addLayer(l);
    add({ id: 'cl-cluster-ring', type: 'circle', source: 'clients', filter: ['has', 'point_count'], paint: { 'circle-color': 'rgba(0,0,0,0)', 'circle-stroke-color': p.clusterFill, 'circle-stroke-width': 1, 'circle-stroke-opacity': 0.35, 'circle-radius': ['step', ['get', 'point_count'], 21, 10, 26, 30, 32, 100, 40] } });
    add({ id: 'cl-cluster', type: 'circle', source: 'clients', filter: ['has', 'point_count'], paint: { 'circle-color': p.clusterFill, 'circle-radius': ['step', ['get', 'point_count'], 15, 10, 19, 30, 24, 100, 30], 'circle-stroke-width': 2, 'circle-stroke-color': p.ptHalo, 'circle-opacity': 0.96 } });
    add({ id: 'cl-cluster-n', type: 'symbol', source: 'clients', filter: ['has', 'point_count'], layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-font': BOLD, 'text-size': 12.5, 'text-allow-overlap': true }, paint: { 'text-color': p.clusterText } });
    add({ id: 'cl-halo', type: 'circle', source: 'clients', filter: ['!', ['has', 'point_count']], layout: { 'circle-sort-key': ['get', 'sc'] }, paint: { 'circle-color': p.ptHalo, 'circle-radius': dotRadius(2.4), 'circle-opacity': 0.96, 'circle-radius-transition': { duration: 350 } } });
    add({ id: 'cl-dot', type: 'circle', source: 'clients', filter: ['!', ['has', 'point_count']], layout: { 'circle-sort-key': ['get', 'sc'] },
      paint: { 'circle-color': tierExpr(), 'circle-radius': dotRadius(0), 'circle-stroke-width': ['match', ['get', 'tier'], 'A', 1.5, 0], 'circle-stroke-color': u.css('--tier-a-line'), 'circle-opacity': 1, 'circle-radius-transition': { duration: 350 }, 'circle-color-transition': { duration: 350 } } });
    add({ id: 'hov-ring', type: 'circle', source: 'hov', paint: { 'circle-color': 'rgba(0,0,0,0)', 'circle-radius': Z(2, 10, 10, 15, 16, 24), 'circle-stroke-width': 2, 'circle-stroke-color': u.css('--accent'), 'circle-stroke-opacity': 0.95 } });
    // representantes: rombos (halo + color); shortlist en lima
    add({ id: 'rp-halo', type: 'symbol', source: 'reps', layout: { 'icon-image': 'diamond', 'icon-size': Z(2, 0.5, 8, 0.8, 14, 1.2), 'icon-allow-overlap': true, 'visibility': 'none' }, paint: { 'icon-color': p.ptHalo } });
    add({ id: 'rp-icon', type: 'symbol', source: 'reps', layout: { 'icon-image': 'diamond', 'icon-size': Z(2, ['*', ['case', ['==', ['get', 'sh'], 1], 1, 0.82], 0.4], 8, ['*', ['case', ['==', ['get', 'sh'], 1], 1, 0.82], 0.62], 14, ['*', ['case', ['==', ['get', 'sh'], 1], 1, 0.82], 0.95]), 'icon-allow-overlap': true, 'visibility': 'none' },
      paint: { 'icon-color': ['case', ['==', ['get', 'sh'], 1], u.css('--rep-short'), u.css('--rep')] } });
    // competencia: cuadrados por grupo de marca
    add({ id: 'dl-halo', type: 'symbol', source: 'dealers', layout: { 'icon-image': 'square', 'icon-size': Z(2, 0.46, 8, 0.7, 14, 1), 'icon-allow-overlap': true, 'visibility': 'none' }, paint: { 'icon-color': p.ptHalo } });
    add({ id: 'dl-icon', type: 'symbol', source: 'dealers', layout: { 'icon-image': 'square', 'icon-size': Z(2, 0.34, 8, 0.52, 14, 0.78), 'icon-allow-overlap': true, 'visibility': 'none' }, paint: { 'icon-color': ['get', 'gc'] } });
    // ruta de gira
    add({ id: 'route-case', type: 'line', source: 'route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': p.ptHalo, 'line-width': 7, 'line-opacity': 0.9 } });
    add({ id: 'route-line', type: 'line', source: 'route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': p.route, 'line-width': 3.2 } });
    add({ id: 'route-pt', type: 'circle', source: 'route-pts', paint: { 'circle-color': p.route, 'circle-radius': 11, 'circle-stroke-width': 2, 'circle-stroke-color': p.ptHalo } });
    add({ id: 'route-n', type: 'symbol', source: 'route-pts', layout: { 'text-field': ['get', 'n'], 'text-font': BOLD, 'text-size': 12, 'text-allow-overlap': true }, paint: { 'text-color': TL.state.theme === 'dark' ? '#131313' : '#FFFFFF' } });
    M.setMode(TL.state.view && TL.views.get(TL.state.view)?.mapMode || 'clients');
  };

  /* ── Modos de capa ──────────────────────────────────────────────────── */
  const GROUP = {
    cl: ['cl-cluster-ring', 'cl-cluster', 'cl-cluster-n', 'cl-halo', 'cl-dot'],
    rp: ['rp-halo', 'rp-icon'],
    dl: ['dl-halo', 'dl-icon'],
  };
  const vis = (g, on) => GROUP[g].forEach((id) => M.instance.getLayer(id) && M.instance.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none'));

  /** mode: 'clients' | 'reps' | 'competition' | 'radar' | 'none' */
  M.setMode = function (mode) {
    const map = M.instance; if (!map || !map.getLayer('cl-dot')) return;
    mode = mode || 'clients';
    M.mode = mode;
    vis('cl', mode === 'clients' || mode === 'competition' || mode === 'radar');
    vis('rp', mode === 'reps');
    vis('dl', mode === 'competition');
    M.setColorMode(mode === 'competition' ? 'competition' : 'tier');
    M.setOppMarkers(mode === 'radar');
    M.highlight(M.hl || null);
    TL.emit('map:mode', mode);
  };
  M.setColorMode = function (cm) {
    const map = M.instance; if (!map || !map.getLayer('cl-dot')) return;
    TL.set({ colorMode: cm });
    if (cm === 'competition') {
      map.setPaintProperty('cl-dot', 'circle-color', ['get', 'gc']);
      map.setPaintProperty('cl-dot', 'circle-stroke-width', 1.2);
      map.setPaintProperty('cl-dot', 'circle-stroke-color', pal().ptHalo);
    } else {
      map.setPaintProperty('cl-dot', 'circle-color', tierExpr());
      map.setPaintProperty('cl-dot', 'circle-stroke-width', ['match', ['get', 'tier'], 'A', 1.5, 0]);
      map.setPaintProperty('cl-dot', 'circle-stroke-color', u.css('--tier-a-line'));
    }
  };

  /* ── Datos filtrados ────────────────────────────────────────────────── */
  M.refreshPoints = u.debounce(function () {
    const map = M.instance; if (!map || !map.getSource('clients')) return;
    M.setPointScale(0.5, false);
    map.getSource('clients').setData({ type: 'FeatureCollection', features: M.clientFeatures(M.visibleClients()) });
    map.getSource('reps').setData(repFeatures());
    map.getSource('dealers').setData(dealerFeatures());
    M.refreshCountries();
    requestAnimationFrame(() => M.setPointScale(1, true));
  }, 40);
  /** Muestra solo estos ids de cliente (null = según filtros globales). */
  M.setClientIds = function (ids) {
    const map = M.instance; if (!map || !map.getSource('clients')) return;
    const list = ids ? ids.map((i) => TL.data.client(i)).filter(Boolean) : M.visibleClients();
    map.getSource('clients').setData({ type: 'FeatureCollection', features: M.clientFeatures(list) });
  };
  M.setPointScale = function (f, animated) {
    const map = M.instance; if (!map || !map.getLayer('cl-dot')) return;
    pointScale = f;
    const dur = animated ? 380 : 0;
    ['cl-halo', 'cl-dot'].forEach((id) => { map.setPaintProperty(id, 'circle-radius-transition', { duration: dur }); });
    map.setPaintProperty('cl-halo', 'circle-radius', dotRadius(2.4));
    map.setPaintProperty('cl-dot', 'circle-radius', dotRadius(0));
  };

  /* ── Resaltar / atenuar ─────────────────────────────────────────────── */
  M.hl = null;
  M.highlight = function (ids, o = {}) {
    const map = M.instance; if (!map || !map.getLayer('cl-dot')) return;
    const base = M.mode === 'radar' ? 0.3 : 1, dim = o.dim ?? 0.12;
    const set = ids && ids.length ? Array.from(new Set(ids)) : null;
    M.hl = set;
    const inSet = ['in', ['get', 'id'], ['literal', set || []]];
    const op = (on, off) => (set ? ['case', inSet, on, off] : base * on);
    map.setPaintProperty('cl-dot', 'circle-opacity', op(1, dim));
    map.setPaintProperty('cl-dot', 'circle-stroke-opacity', op(1, dim));
    map.setPaintProperty('cl-halo', 'circle-opacity', op(0.96, dim * 0.8));
    map.setLayoutProperty('cl-dot', 'circle-sort-key', set ? ['case', inSet, 1000, ['get', 'sc']] : ['get', 'sc']);
    map.setLayoutProperty('cl-halo', 'circle-sort-key', set ? ['case', inSet, 1000, ['get', 'sc']] : ['get', 'sc']);
    ['rp-icon', 'rp-halo'].forEach((id) => map.getLayer(id) && map.setPaintProperty(id, 'icon-opacity', op(1, dim)));
    TL.emit('highlight', set);
  };
  M.clearHighlight = () => M.highlight(null);

  /* ── Hover (anillo) y selección (marcador pulsante en DOM: sin repintado continuo) ── */
  M.setHover = function (rec) {
    const src = M.instance?.getSource('hov'); if (!src) return;
    src.setData(rec ? { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [rec.lng, rec.lat] } } : EMPTY);
  };
  M.select = function (id) {
    M.clearSelection();
    const r = TL.data.rec(id); if (!r || !M.instance) return;
    const el = u.h('div.sel-marker', u.h('i'), u.h('i'), u.h('b'));
    M._sel = new maplibregl.Marker({ element: el, anchor: 'center', pitchAlignment: 'viewport', rotationAlignment: 'viewport' }).setLngLat([r.lng, r.lat]).addTo(M.instance);
  };
  M.clearSelection = function () { M._sel?.remove(); M._sel = null; };

  /* ── Oportunidades: marcadores ámbar con pulso CSS ──────────────────── */
  M.setOppMarkers = function (on) {
    const map = M.instance; if (!map) return;
    if (!on) { (M._opps || []).forEach((m) => m.remove()); M._opps = null; return; }
    if (M._opps) return;
    M._opps = TL.data.opps.filter((o) => isFinite(o.lat) && isFinite(o.lng)).map((o) => {
      const el = u.h('button.opp-marker', { type: 'button', 'aria-label': TL.i18n.pick(o, 'title'), dataset: { id: o.id } }, u.h('i'), u.h('i'), u.h('b'));
      el.addEventListener('click', (e) => { e.stopPropagation(); TL.emit('map:click', { kind: 'opp', id: o.id }); });
      el.addEventListener('mouseenter', (e) => TL.emit('map:hover', { kind: 'opp', id: o.id, x: e.clientX, y: e.clientY }));
      el.addEventListener('mouseleave', () => TL.emit('map:hover', null));
      return new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat([o.lng, o.lat]).addTo(map);
    });
  };
  M.markOpp = function (id) { (M._opps || []).forEach((m) => m.getElement().classList.toggle('is-on', m.getElement().dataset.id === id)); };

  /* ── Ruta de gira (se dibuja como un corte láser) ───────────────────── */
  M.routeGradient = (t) => ['step', ['line-progress'], pal().route, Math.max(t, 0.0001), 'rgba(0,0,0,0)'];
  M.addRoute = function (coords, labels = []) {
    const map = M.instance; if (!map || !map.getSource('route') || coords.length < 2) return;
    map.getSource('route').setData({ type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } }] });
    map.getSource('route-pts').setData({ type: 'FeatureCollection', features: coords.map((c, i) => ({ type: 'Feature', properties: { n: String(labels[i] ?? i + 1) }, geometry: { type: 'Point', coordinates: c } })) });
    if (TL.reduceMotion || !window.gsap) { map.setPaintProperty('route-line', 'line-gradient', M.routeGradient(1.01)); return; }
    const o = { t: 0 };
    map.setPaintProperty('route-line', 'line-gradient', M.routeGradient(0));
    M._routeAnim = true;
    gsap.to(o, { t: 1.01, duration: 1.5, ease: 'power2.inOut', onUpdate: () => map.setPaintProperty('route-line', 'line-gradient', M.routeGradient(o.t)), onComplete: () => { M._routeAnim = false; } });
  };
  M.clearRoute = function () {
    const map = M.instance; if (!map || !map.getSource('route')) return;
    map.getSource('route').setData(EMPTY); map.getSource('route-pts').setData(EMPTY);
  };

  /** Tras cambiar de tema: recolorea capas de puntos (los tokens CSS ya cambiaron). */
  M.restyleOverlays = function () {
    const map = M.instance; if (!map || !map.getLayer('cl-dot')) return;
    const p = pal(), s = (id, k, v) => map.getLayer(id) && map.setPaintProperty(id, k, v);
    s('cl-cluster-ring', 'circle-stroke-color', p.clusterFill); s('cl-cluster', 'circle-color', p.clusterFill); s('cl-cluster', 'circle-stroke-color', p.ptHalo);
    s('cl-cluster-n', 'text-color', p.clusterText); s('cl-halo', 'circle-color', p.ptHalo);
    s('hov-ring', 'circle-stroke-color', u.css('--accent'));
    s('rp-halo', 'icon-color', p.ptHalo); s('rp-icon', 'icon-color', ['case', ['==', ['get', 'sh'], 1], u.css('--rep-short'), u.css('--rep')]);
    s('dl-halo', 'icon-color', p.ptHalo);
    s('route-case', 'line-color', p.ptHalo); s('route-pt', 'circle-color', p.route); s('route-pt', 'circle-stroke-color', p.ptHalo);
    s('route-n', 'text-color', TL.state.theme === 'dark' ? '#131313' : '#FFFFFF');
    if (!M._routeAnim) s('route-line', 'line-gradient', M.routeGradient(1.01));
    M.setColorMode(TL.state.colorMode);
  };

  TL.on('filters', () => M.refreshPoints());
  TL.on('data:changed', () => M.refreshPoints());
})();
