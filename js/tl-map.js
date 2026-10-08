/* ==========================================================================
   tl-map.js — mapa principal MapLibre (globo): creación, tema/idioma sin perder
   cámara ni capas, padding según paneles, API de cámara y lectura de coordenadas.
   Capas de puntos: tl-map-layers.js · hover/click: tl-map-hover.js · intro: tl-map-intro.js
   ========================================================================== */
(function () {
  'use strict';
  const { u } = TL;
  const M = (TL.map = { instance: null, mode: 'clients', _paint: {}, pad: { top: 0, right: 0, bottom: 0, left: 0 } });
  const HOME = { center: [-68, -14], zoom: 2.35, pitch: 0, bearing: 0 };
  M.HOME = HOME;

  let resolveReady;
  M.ready = new Promise((r) => { resolveReady = r; });

  /** Países de TL_GEO con conteo y valor normalizado `t` (0..1) para la rampa. */
  M.enrichGeo = function () {
    const D = TL.data, max = D.maxClients || 1;
    const features = D.geo.features.map((f) => {
      const cc = f.properties.cc, k = D.country(cc), n = k ? k.counts.clients : 0;
      return { type: 'Feature', properties: Object.assign({}, f.properties, { n, t: Math.sqrt(n / max), role: k?.role || f.properties.role || 'other' }), geometry: f.geometry };
    });
    return { type: 'FeatureCollection', features };
  };
  M.refreshCountries = function () {
    const src = M.instance?.getSource('countries');
    if (src) src.setData(M.enrichGeo());
  };

  /** Padding que respeta panel derecho / ficha / hoja inferior. */
  M.computePadding = function () {
    const w = window.innerWidth, h = window.innerHeight;
    const css = (n, d) => parseFloat(u.css(n)) || d;
    const gap = css('--gap', 12);
    const p = { top: 70, right: 0, bottom: 0, left: 0 };
    if (w <= 1100) {
      p.bottom = TL.state.panelOpen || document.body.classList.contains('ficha-open') ? Math.round(h * 0.46) : 0;
    } else {
      p.left = css('--rail-w', 52) + gap * 2;
      if (document.body.classList.contains('ficha-open')) p.right = css('--ficha-w', 780) + gap * 2;
      else if (TL.state.panelOpen) p.right = css('--panel-w', 420) + gap * 2;
    }
    return p;
  };
  M.setPadding = function (animate = true) {
    const map = M.instance; if (!map) return;
    const p = M.computePadding();
    const same = ['top', 'right', 'bottom', 'left'].every((k) => Math.abs((M.pad[k] || 0) - p[k]) < 1);
    if (same) return;
    M.pad = p;
    if (!animate || TL.reduceMotion) map.setPadding(p); else map.easeTo({ padding: p, duration: 520, easing: (t) => 1 - Math.pow(1 - t, 4) });
  };

  /** Crea el mapa. Devuelve la promesa M.ready (se resuelve tras añadir capas de puntos). */
  M.init = function (container) {
    const theme = TL.state.theme;
    let map;
    try {
      map = new maplibregl.Map({
        container, style: TL.mapStyle.build(theme, M.enrichGeo()), center: [-30, 10], zoom: 0.6, pitch: 0, bearing: 0,
        minZoom: 0.4, maxZoom: 13, maxPitch: 0, attributionControl: false, fadeDuration: 180, dragRotate: false, pitchWithRotate: false, touchPitch: false,   // globo fijo: solo se hace girar (sin inclinar ni rotar)
        // rendimiento: sin MSAA y con densidad de píxeles acotada (en pantallas 2x dibujar a 2x cuadruplica el trabajo de la GPU)
        canvasContextAttributes: { antialias: false }, pixelRatio: Math.min(window.devicePixelRatio || 1, 1.5),
        renderWorldCopies: false, cooperativeGestures: false, hash: false,
      });
    } catch (err) {
      console.error('[TL.map] WebGL no disponible', err);
      TL.emit('map:error', err);
      return M.ready;
    }
    M.instance = map;
    map.touchZoomRotate.disableRotation(); map.keyboard.disableRotation();
    map.on('error', (e) => {
      const msg = String(e?.error?.message || '');
      if (/Failed to fetch|NetworkError|AJAXError|Load failed/i.test(msg)) M.offline = true;
      else if (window.TL_DEBUG) console.warn('[TL.map]', msg);
    });
    map.on('styleimagemissing', (e) => M.makeImage(e.id));
    map.on('load', () => {
      try {
        M.addPointLayers();
        M.bindInteractions();
        M.applyPadding0();
        M.setSatellite(true);   // vista por defecto: globo satelital (el botón permite volver al mapa vectorial)
        document.body.classList.add('map-ready');
        TL.emit('map:ready');
        resolveReady(M);
      } catch (err) { console.error('[TL.map] init', err); resolveReady(M); }
    });
    map.on('move', M.updateCoords);
    return M.ready;
  };
  M.applyPadding0 = function () {
    M.pad = M.computePadding(); M.instance.setPadding(M.pad);
    // caché de paints del tema inicial para poder diffear al cambiar de tema
    for (const spec of TL.mapStyle.baseLayers(TL.mapStyle.palette(TL.state.theme))) for (const [k, v] of Object.entries(spec.paint || {})) M._paint[spec.id + '|' + k] = JSON.stringify(v);
    M.makeImage('hatch-' + TL.state.theme);
  };

  /** Imágenes procedurales: trama de las filiales (hatch-*), rombo y cuadrado SDF. */
  M.makeImage = function (id) {
    const map = M.instance; if (!map || map.hasImage(id)) return;
    const mk = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); draw(x, w, h); return x.getImageData(0, 0, w, h); };
    if (id.startsWith('hatch-')) {
      const col = TL.mapStyle.palette(id.endsWith('dark') ? 'dark' : 'light').hatch;
      map.addImage(id, mk(10, 10, (x, w, h) => { x.strokeStyle = col; x.lineWidth = 1.4; x.beginPath(); x.moveTo(-1, h + 1); x.lineTo(w + 1, -1); x.moveTo(-1, 1); x.lineTo(1, -1); x.moveTo(w - 1, h + 1); x.lineTo(w + 1, h - 1); x.stroke(); }), { pixelRatio: 1 });
    } else if (id === 'diamond') {
      map.addImage(id, mk(40, 40, (x) => { x.fillStyle = '#fff'; x.beginPath(); x.moveTo(20, 2); x.lineTo(38, 20); x.lineTo(20, 38); x.lineTo(2, 20); x.closePath(); x.fill(); }), { sdf: true, pixelRatio: 2 });
    } else if (id === 'square') {
      map.addImage(id, mk(36, 36, (x) => { x.fillStyle = '#fff'; x.fillRect(5, 5, 26, 26); }), { sdf: true, pixelRatio: 2 });
    }
  };

  /* ── Tema e idioma sin recrear el style ─────────────────────────────── */
  M.applyTheme = function (theme) {
    const map = M.instance; if (!map || !map.isStyleLoaded()) return;
    const p = TL.mapStyle.palette(theme);
    for (const spec of TL.mapStyle.baseLayers(p)) {
      if (!map.getLayer(spec.id)) continue;
      for (const [k, v] of Object.entries(spec.paint || {})) {
        const key = spec.id + '|' + k, s = JSON.stringify(v);
        if (M._paint[key] !== s) { map.setPaintProperty(spec.id, k, v); M._paint[key] = s; }
      }
    }
    // el trazo de hatch cambia de imagen según tema
    M.makeImage('hatch-' + theme);
    if (map.getLayer('ch-hatch')) map.setPaintProperty('ch-hatch', 'fill-pattern', 'hatch-' + theme);
    const stops = TL.mapStyle.rampStops(theme);
    map.setPaintProperty('ch-fill', 'fill-color', ['interpolate', ['linear'], ['get', 't'], 0, stops[0], 0.2, stops[1], 0.5, stops[2], 0.8, stops[3], 1, stops[4]]);
    map.setPaintProperty('ch-hover', 'fill-color', u.css('--accent'));
    map.setPaintProperty('ch-hover-line', 'line-color', u.css('--accent'));
    map.setSky(Object.assign({ 'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 1, 4, 0.9, 7, 0] }, p.sky));
    M.restyleOverlays?.(theme);
  };
  M.applyLang = function () {
    const map = M.instance; if (!map || !map.isStyleLoaded()) return;
    const nm = TL.mapStyle.nameExpr();
    ['lbl-country', 'lbl-state', 'lbl-city', 'lbl-town', 'lbl-minor', 'lbl-road'].forEach((id) => { if (map.getLayer(id)) map.setLayoutProperty(id, 'text-field', nm); });
    if (map.getLayer('ch-label')) map.setLayoutProperty('ch-label', 'text-field', TL.i18n.t('map.subsidiary'));
  };

  /* ── Lectura de coordenadas (instrumento) ───────────────────────────── */
  const el = {};
  M.updateCoords = u.throttle(function () {
    const map = M.instance; if (!map) return;
    el.root = el.root || document.getElementById('tl-coords');
    if (!el.root) return;
    el.lat = el.lat || el.root.querySelector('.c-lat'); el.lon = el.lon || el.root.querySelector('.c-lon'); el.z = el.z || el.root.querySelector('.c-zoom');
    const c = map.getCenter();
    const f = (v, pos, neg, d = 3) => Math.abs(v).toFixed(d) + '°' + (v >= 0 ? pos : neg);
    el.lat.textContent = f(c.lat, 'N', 'S'); el.lon.textContent = f(c.lng, 'E', 'W');
    el.z.textContent = 'z ' + map.getZoom().toFixed(1);
    TL.emit('map:move', { center: c, zoom: map.getZoom() });
  }, 60);

  /* ── Cámara ─────────────────────────────────────────────────────────── */
  M.flyTo = function (o = {}) {
    const map = M.instance; if (!map) return;
    M.spin(false);
    // los vuelos de cámara son navegación: siempre animados (con "reducir movimiento" del sistema saltaban de golpe)
    const opts = Object.assign({ padding: M.pad, duration: 2000, curve: 1.5, essential: true }, o);
    map.flyTo(opts);
  };
  M.fitBbox = function (bbox, o = {}) {
    const map = M.instance; if (!map || !bbox) return;
    const cam = map.cameraForBounds(bbox, { padding: o.margin ?? 36, maxZoom: o.maxZoom ?? 8.5 });
    if (!cam) return;
    M.flyTo(Object.assign({ center: cam.center, zoom: cam.zoom, pitch: 0, bearing: 0, duration: 1900 }, o.fly));
  };
  M.fitPoints = function (coords, o = {}) {
    const map = M.instance; if (!map || !coords.length) return;
    if (coords.length === 1) return M.flyTo({ center: coords[0], zoom: o.maxZoom ?? 11, pitch: 0, bearing: 0, duration: 1800 });
    const b = coords.reduce((bb, c) => bb.extend(c), new maplibregl.LngLatBounds(coords[0], coords[0]));
    M.fitBbox([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()], o);
  };
  M.flyToCountry = function (cc) {
    const k = TL.data.country(cc); if (!k) return;
    if (k.bbox) M.fitBbox(k.bbox, { maxZoom: k.zoom ? k.zoom + 0.6 : 8 });
    else M.flyTo({ center: k.center, zoom: k.zoom || 5, pitch: 0, bearing: 0 });
  };
  /** Vuelo a una empresa / representante / oportunidad: zoom según precisión de la ubicación. */
  M.flyToEntity = function (id, o = {}) {
    const hit = TL.data.get(id); if (!hit) return;
    const r = hit.rec, prec = r.geo_precision || 'calle';
    const z = hit.kind === 'opp' ? 11 : prec === 'ciudad' ? 11.6 : prec === 'calle' ? 15.2 : 16.2;
    const pitch = prec === 'ciudad' ? 25 : 52;
    M.flyTo(Object.assign({ center: [r.lng, r.lat], zoom: z, pitch, bearing: o.bearing ?? -18, duration: 2600, curve: 1.6 }, o));
  };
  M.home = function (o = {}) { M.flyTo(Object.assign({}, HOME, { duration: 2200 }, o)); };
  M.zoomBy = (d) => { M.spin(false); M.instance?.easeTo({ zoom: M.instance.getZoom() + d, duration: 320, easing: (t) => 1 - Math.pow(1 - t, 3) }); };
  M.resetNorth = () => M.instance?.easeTo({ bearing: 0, pitch: 0, duration: 600 });

  /* ── Rotación lenta del globo (se detiene al primer gesto) ──────────── */
  let spinning = false, last = 0, raf = 0;
  const SPEED = 4.2; // grados por segundo
  const tick = (ts) => {
    if (!spinning) return;
    const map = M.instance;
    if (map && !document.hidden && map.getZoom() < 4.2) {
      const dt = Math.min(64, ts - last), c = map.getCenter();
      c.lng -= (SPEED * dt) / 1000;
      map.jumpTo({ center: c });
    }
    last = ts;
    raf = requestAnimationFrame(tick);
  };
  const stopOnGesture = () => M.spin(false);
  M.spin = function (on) {
    if (on === spinning) return;
    if (on && TL.reduceMotion) return;
    spinning = !!on;
    cancelAnimationFrame(raf);
    ['pointerdown', 'wheel', 'keydown', 'touchstart'].forEach((t) => (on ? window.addEventListener(t, stopOnGesture, { passive: true, once: true, capture: true }) : window.removeEventListener(t, stopOnGesture, { capture: true })));
    if (on) { last = performance.now(); raf = requestAnimationFrame(tick); }
    TL.emit('map:spin', spinning);
  };
  M.isSpinning = () => spinning;

  /* ── Satélite y edificios 3D ────────────────────────────────────────── */
  const FILLS = ['lc', 'lu-urb', 'lu-ind', 'park', 'water'];
  M.setSatellite = function (on) {
    const map = M.instance; if (!map) return;
    TL.set({ satellite: !!on });
    map.setLayoutProperty('sat', 'visibility', on ? 'visible' : 'none');
    FILLS.forEach((id) => map.getLayer(id) && map.setLayoutProperty(id, 'visibility', on ? 'none' : 'visible'));
    map.setPaintProperty('bg', 'background-color', on ? '#0A0F14' : TL.mapStyle.palette(TL.state.theme).land);
    document.getElementById('ctl-sat')?.setAttribute('aria-pressed', on ? 'true' : 'false');
    M.updateAttribution?.();
  };
  M.set3D = function (on) {
    const map = M.instance; if (!map) return;
    TL.set({ buildings3d: !!on });
    document.getElementById('ctl-3d')?.setAttribute('aria-pressed', on ? 'true' : 'false');
    // 3D = vista en perspectiva (se nota a cualquier zoom) + edificios en relieve al acercarse; 2D = vista cenital
    if (!TL.state.booting) map.easeTo(on ? { pitch: map.getZoom() < 4 ? 40 : 55, bearing: map.getBearing() || -12, duration: 900 } : { pitch: 0, bearing: 0, duration: 700 });
  };
})();
