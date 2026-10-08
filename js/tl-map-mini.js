/* ==========================================================================
   tl-map-mini.js — mini-mapa reutilizable (una sola instancia MapLibre que se
   re-monta en cada ficha). TL.map.createMini(container, {lng,lat,zoom,satellite})
   ========================================================================== */
(function () {
  'use strict';
  const { u } = TL;
  const M = TL.map;
  const MS = TL.mapStyle;
  let host = null, mini = null, pin = null, cache = {}, ready = false, sat = false;

  const layersFor = (theme) => MS.baseLayers(MS.palette(theme)).filter((l) => l.source !== 'countries' && l.source !== 'graticule' && !['lbl-country', 'lbl-state'].includes(l.id));
  const style = (theme) => ({
    version: 8, name: 'mini-' + theme, glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
    sources: { omt: { type: 'vector', url: 'https://tiles.openfreemap.org/planet' }, satellite: { type: 'raster', tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'], tileSize: 256, maxzoom: 19 } },
    layers: layersFor(theme),
  });

  function ensure() {
    if (mini) return;
    host = u.h('div.mini-host');
    host.style.cssText = 'position:absolute;inset:0;';
    mini = new maplibregl.Map({
      container: host, style: style(TL.state.theme), center: [-70, -12], zoom: 15, pitch: 50, bearing: -20, attributionControl: false,
      canvasContextAttributes: { antialias: true }, fadeDuration: 120, maxPitch: 75, cooperativeGestures: false,
    });
    mini.addControl(new maplibregl.NavigationControl({ showCompass: true, visualizePitch: true }), 'top-left');
    mini.once('load', () => { ready = true; layersFor(TL.state.theme).forEach((l) => Object.entries(l.paint || {}).forEach(([k, v]) => { cache[l.id + '|' + k] = JSON.stringify(v); })); applySat(); });
    pin = new maplibregl.Marker({ element: u.h('div.mini-pin', u.h('i'), u.h('b')), anchor: 'bottom' }).setLngLat([0, 0]).addTo(mini);
  }
  function applySat() {
    if (!mini || !ready) return;
    mini.setLayoutProperty('sat', 'visibility', sat ? 'visible' : 'none');
    ['lc', 'lu-urb', 'lu-ind', 'park', 'water'].forEach((id) => mini.getLayer(id) && mini.setLayoutProperty(id, 'visibility', sat ? 'none' : 'visible'));
  }
  function applyTheme(theme) {
    if (!mini || !ready) return;
    for (const l of layersFor(theme)) {
      if (!mini.getLayer(l.id)) continue;
      for (const [k, v] of Object.entries(l.paint || {})) {
        const key = l.id + '|' + k, s = JSON.stringify(v);
        if (cache[key] !== s) { mini.setPaintProperty(l.id, k, v); cache[key] = s; }
      }
    }
  }
  TL.on('theme', applyTheme);
  TL.on('lang', () => {
    if (!ready) return;
    ['lbl-city', 'lbl-town', 'lbl-minor', 'lbl-road'].forEach((id) => mini.getLayer(id) && mini.setLayoutProperty(id, 'text-field', MS.nameExpr()));
  });

  /** Monta el mini-mapa dentro de `container`. Devuelve un handle. */
  M.createMini = function (container, o = {}) {
    ensure();
    container.appendChild(host);
    sat = !!o.satellite;
    const go = () => {
      mini.resize();
      applySat();
      pin.setLngLat([o.lng, o.lat]);
      mini.jumpTo({ center: [o.lng, o.lat], zoom: o.zoom ?? 15.6, pitch: o.pitch ?? 52, bearing: o.bearing ?? -18 });
    };
    if (ready) go(); else mini.once('load', go);
    requestAnimationFrame(() => mini.resize());
    return {
      map: mini,
      setCenter(lng, lat, zoom) { pin.setLngLat([lng, lat]); mini.easeTo({ center: [lng, lat], zoom: zoom ?? mini.getZoom(), duration: 900 }); },
      setSatellite(on) { sat = !!on; applySat(); },
      resize() { mini.resize(); },
      destroy() { if (host && host.parentNode === container) container.removeChild(host); },
    };
  };
})();
