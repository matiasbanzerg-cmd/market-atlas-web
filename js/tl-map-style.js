/* ==========================================================================
   tl-map-style.js — estilo propio claro/oscuro sobre vector tiles de OpenFreeMap.
   TL.mapStyle.build(theme) → objeto style v8 · TL.mapStyle.palette(theme)
   El cambio de tema NO reemplaza el style: se diffean los paint (ver tl-map.js).
   ========================================================================== */
(function () {
  'use strict';
  const MS = (TL.mapStyle = {});

  const GLYPHS = 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf';
  const OMT = 'https://tiles.openfreemap.org/planet';
  const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
  const REG = ['Noto Sans Regular'], BOLD = ['Noto Sans Bold'];

  const PAL = {
    light: {
      land: '#F1F2F5', water: '#D6E0EA', waterway: '#CBD7E3', wood: '#E9EDEF', grass: '#EDF0F0', farm: '#F0F1F2', sand: '#F3F1EC', ice: '#FAFBFC',
      park: '#E6ECEA', urban: '#EBEDF1', industrial: 'rgba(187,208,58,.26)', industrialLine: 'rgba(139,156,42,.5)',
      boundary: '#A9B5C2', boundaryState: '#C4CCD6', roadMajor: '#FFFFFF', roadMajorCase: '#D3D9E0', roadMid: '#FFFFFF', roadMinor: '#F8F9FB', roadCase: '#DDE2E8',
      building: '#E4E8ED', buildingLine: '#D2D8DF', building3d: '#D9DFE6',
      text: '#3A4552', textMuted: '#707B88', halo: 'rgba(241,242,245,.92)', countryText: '#5A6674',
      grat: 'rgba(40,81,114,.10)', hatch: 'rgba(40,81,114,.55)', chLine: '#FFFFFF', chOther: '#E4E8EE', chOtherLine: '#D2D9E1', chLabel: '#285172',
      ptHalo: '#FFFFFF', ptText: '#131313', clusterFill: '#285172', clusterText: '#FFFFFF', route: '#131313',
      sky: { 'sky-color': '#CFDBE8', 'sky-horizon-blend': 0.6, 'horizon-color': '#F3F5F8', 'horizon-fog-blend': 0.7, 'fog-color': '#EEF1F5', 'fog-ground-blend': 0.2 },
    },
    dark: {
      land: '#10202F', water: '#070B10', waterway: '#0C1520', wood: '#112436', grass: '#112436', farm: '#10202F', sand: '#132638', ice: '#1A2E42',
      park: '#102A34', urban: '#122538', industrial: 'rgba(198,219,72,.16)', industrialLine: 'rgba(198,219,72,.34)',
      boundary: '#3D5873', boundaryState: '#24394D', roadMajor: '#37526E', roadMajorCase: '#0B141E', roadMid: '#2A4157', roadMinor: '#1F3347', roadCase: '#0B141E',
      building: '#172C41', buildingLine: '#21405C', building3d: '#25435F',
      text: '#A5B8CA', textMuted: '#6F879D', halo: 'rgba(7,11,16,.92)', countryText: '#7F96AB',
      grat: 'rgba(110,160,205,.10)', hatch: 'rgba(143,189,224,.5)', chLine: '#0B0F14', chOther: '#132536', chOtherLine: '#1D3248', chLabel: '#C6DB48',
      ptHalo: '#0B0F14', ptText: '#EEF2F5', clusterFill: '#5C8DB5', clusterText: '#06090D', route: '#C6DB48',
      sky: { 'sky-color': '#0A1626', 'sky-horizon-blend': 0.55, 'horizon-color': '#2E6C99', 'horizon-fog-blend': 0.85, 'fog-color': '#0D2236', 'fog-ground-blend': 0.35 },
    },
  };
  MS.palette = (theme) => PAL[theme] || PAL.light;
  MS.rampStops = (theme) => {
    const g = (n) => TL.u.css('--ramp-' + n, document.documentElement) || '#889';
    return [g(1), g(2), g(3), g(4), g(5)];
  };

  const lang = () => TL.state.lang;
  /** Expresión de nombre según idioma de la UI (ES/DE) con respaldo al nombre local. */
  MS.nameExpr = (l = lang()) => ['coalesce', ['get', 'name:' + l], ['get', 'name_' + l], ['get', 'name:latin'], ['get', 'name']];
  const Z = (...s) => ['interpolate', ['linear'], ['zoom'], ...s];

  /** Capas del mapa base (los ids son estables: el tema se aplica diffeando sus paint). */
  MS.baseLayers = function (p) {
    return [
      { id: 'bg', type: 'background', paint: { 'background-color': p.land } },
      { id: 'sat', type: 'raster', source: 'satellite', layout: { visibility: 'none' }, paint: { 'raster-fade-duration': 300, 'raster-saturation': -0.15, 'raster-brightness-max': 0.92 } },
      { id: 'lc', type: 'fill', source: 'omt', 'source-layer': 'landcover', maxzoom: 9,
        paint: { 'fill-color': ['match', ['get', 'class'], ['wood', 'forest'], p.wood, ['grass', 'scrub'], p.grass, 'farmland', p.farm, 'sand', p.sand, 'ice', p.ice, p.land], 'fill-opacity': Z(2, 0.0, 4, 0.75, 8, 0.9) } },
      { id: 'lu-urb', type: 'fill', source: 'omt', 'source-layer': 'landuse', minzoom: 8, filter: ['in', ['get', 'class'], ['literal', ['residential', 'suburb', 'neighbourhood', 'commercial', 'retail']]],
        paint: { 'fill-color': p.urban, 'fill-opacity': Z(8, 0, 11, 1) } },
      { id: 'lu-ind', type: 'fill', source: 'omt', 'source-layer': 'landuse', minzoom: 8, filter: ['in', ['get', 'class'], ['literal', ['industrial', 'quarry']]],
        paint: { 'fill-color': p.industrial, 'fill-opacity': Z(8, 0, 11, 1), 'fill-outline-color': p.industrialLine } },
      { id: 'park', type: 'fill', source: 'omt', 'source-layer': 'park', minzoom: 6, paint: { 'fill-color': p.park, 'fill-opacity': Z(6, 0, 9, 1) } },
      // el coroplético (TL_GEO) va ENTRE la tierra y el agua: el agua del mapa base recorta limpio la costa
      ...MS.choroplethLayers(p),
      { id: 'water', type: 'fill', source: 'omt', 'source-layer': 'water', paint: { 'fill-color': p.water } },
      { id: 'waterway', type: 'line', source: 'omt', 'source-layer': 'waterway', minzoom: 8, paint: { 'line-color': p.waterway, 'line-width': Z(8, 0.5, 14, 2) } },
      { id: 'grat', type: 'line', source: 'graticule', paint: { 'line-color': p.grat, 'line-width': 0.6 } },
      { id: 'bnd-state', type: 'line', source: 'omt', 'source-layer': 'boundary', minzoom: 4, filter: ['all', ['==', ['get', 'admin_level'], 4], ['!=', ['get', 'maritime'], 1]],
        paint: { 'line-color': p.boundaryState, 'line-width': Z(4, 0.4, 10, 1), 'line-dasharray': [3, 2], 'line-opacity': Z(4, 0, 6, 1) } },
      { id: 'bnd-country', type: 'line', source: 'omt', 'source-layer': 'boundary', filter: ['all', ['==', ['get', 'admin_level'], 2], ['!=', ['get', 'maritime'], 1]],
        layout: { 'line-join': 'round' }, paint: { 'line-color': p.boundary, 'line-width': Z(1, 0.5, 6, 1, 12, 1.6) } },
      ...MS.roadLayers(p),
      { id: 'bld', type: 'fill', source: 'omt', 'source-layer': 'building', minzoom: 13, paint: { 'fill-color': p.building, 'fill-opacity': Z(13, 0, 15, 1), 'fill-outline-color': p.buildingLine } },
      { id: 'bld-3d', type: 'fill-extrusion', source: 'omt', 'source-layer': 'building', minzoom: 14.5, layout: { visibility: 'visible' },
        paint: { 'fill-extrusion-color': p.building3d, 'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 8], 'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
          'fill-extrusion-opacity': Z(14.5, 0, 16, 0.92), 'fill-extrusion-vertical-gradient': true } },
      ...MS.labelLayers(p),
    ];
  };

  /** Coroplético: países objetivo (rampa acero), filiales (trama), resto apagado. */
  MS.choroplethLayers = function (p) {
    const lit = ['coalesce', ['feature-state', 'lit'], 1];
    const op = (a, b, c, d) => Z(2, ['*', lit, a], 4, ['*', lit, b], 6.2, ['*', lit, c], 9, ['*', lit, d]);
    const stops = MS.rampStops(TL.state.theme);
    return [
      { id: 'ch-other', type: 'fill', source: 'countries', filter: ['==', ['get', 'role'], 'other'], paint: { 'fill-color': p.chOther, 'fill-opacity': Z(1, 0.55, 5, 0.35, 8, 0) } },
      { id: 'ch-fill', type: 'fill', source: 'countries', filter: ['==', ['get', 'role'], 'target'],
        paint: { 'fill-color': ['interpolate', ['linear'], ['get', 't'], 0, stops[0], 0.2, stops[1], 0.5, stops[2], 0.8, stops[3], 1, stops[4]], 'fill-opacity': op(0.9, 0.76, 0.3, 0.06) } },
      { id: 'ch-hatch', type: 'fill', source: 'countries', filter: ['==', ['get', 'role'], 'excluded'],
        paint: { 'fill-pattern': 'hatch-' + (TL.state.theme === 'dark' ? 'dark' : 'light'), 'fill-opacity': op(0.9, 0.76, 0.22, 0.04) } },
      { id: 'ch-hover', type: 'fill', source: 'countries', filter: ['==', ['get', 'role'], 'target'],
        paint: { 'fill-color': TL.u.css('--accent') || '#BBD03A', 'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.3, 0] } },
      { id: 'ch-line', type: 'line', source: 'countries', filter: ['!=', ['get', 'role'], 'other'], layout: { 'line-join': 'round' },
        paint: { 'line-color': p.chLine, 'line-width': Z(2, 0.6, 6, 1.2), 'line-opacity': Z(5, 0.9, 8, 0.2) } },
      { id: 'ch-hover-line', type: 'line', source: 'countries', filter: ['==', ['get', 'role'], 'target'],
        paint: { 'line-color': TL.u.css('--accent') || '#BBD03A', 'line-width': ['case', ['boolean', ['feature-state', 'hover'], false], 2.2, 0], 'line-opacity': Z(5, 1, 9, 0.3) } },
      { id: 'ch-label', type: 'symbol', source: 'excl-labels', maxzoom: 6.5,
        layout: { 'text-field': TL.i18n.t('map.subsidiary'), 'text-font': BOLD, 'text-size': Z(2, 9, 5, 12), 'text-letter-spacing': 0.1, 'text-transform': 'uppercase', 'text-max-width': 8, 'text-allow-overlap': false },
        paint: { 'text-color': p.chLabel, 'text-halo-color': p.halo, 'text-halo-width': 1.2, 'text-opacity': Z(2, 0, 3, 1) } },
    ];
  };

  MS.roadLayers = function (p) {
    const cls = (...c) => ['in', ['get', 'class'], ['literal', c]];
    const L = { 'line-cap': 'round', 'line-join': 'round' };
    const T = (id, filter, minzoom, color, width, extra) => Object.assign({ id, type: 'line', source: 'omt', 'source-layer': 'transportation', minzoom, filter, layout: L, paint: { 'line-color': color, 'line-width': width } }, extra || {});
    return [
      T('road-major-case', cls('primary', 'trunk', 'motorway'), 7, p.roadMajorCase, Z(7, 0.8, 12, 3.2, 18, 14)),
      T('road-minor', cls('minor', 'service', 'track'), 12, p.roadMinor, Z(12, 0.4, 16, 3, 19, 9)),
      T('road-mid', cls('secondary', 'tertiary'), 9, p.roadMid, Z(9, 0.5, 14, 2.6, 18, 9)),
      T('road-major', cls('primary', 'trunk', 'motorway'), 6, p.roadMajor, Z(6, 0.5, 12, 2.2, 18, 11)),
    ];
  };

  MS.labelLayers = function (p) {
    const T = (id, filter, o) => Object.assign({ id, type: 'symbol', source: 'omt', 'source-layer': 'place', filter,
      paint: { 'text-color': p.text, 'text-halo-color': p.halo, 'text-halo-width': 1.3 } }, o);
    const nm = MS.nameExpr();
    return [
      T('lbl-country', ['==', ['get', 'class'], 'country'], { maxzoom: 7,
        layout: { 'text-field': nm, 'text-font': BOLD, 'text-size': Z(1, 8.5, 4, 11, 6, 14), 'text-transform': 'uppercase', 'text-letter-spacing': 0.14, 'text-max-width': 7, 'symbol-sort-key': ['get', 'rank'] },
        paint: { 'text-color': p.countryText, 'text-halo-color': p.halo, 'text-halo-width': 1.4, 'text-opacity': Z(1.4, 0, 2.4, 0.95) } }),
      T('lbl-state', ['==', ['get', 'class'], 'state'], { minzoom: 4.5, maxzoom: 8,
        layout: { 'text-field': nm, 'text-font': REG, 'text-size': Z(4.5, 9.5, 8, 12), 'text-transform': 'uppercase', 'text-letter-spacing': 0.08, 'text-max-width': 7 },
        paint: { 'text-color': p.textMuted, 'text-halo-color': p.halo, 'text-halo-width': 1.2, 'text-opacity': Z(4.5, 0, 5.5, 0.9) } }),
      T('lbl-city', ['==', ['get', 'class'], 'city'], { minzoom: 4,
        layout: { 'text-field': nm, 'text-font': BOLD, 'text-size': Z(4, 10.5, 9, 14, 14, 18), 'text-max-width': 8, 'symbol-sort-key': ['get', 'rank'] } }),
      T('lbl-town', ['==', ['get', 'class'], 'town'], { minzoom: 8,
        layout: { 'text-field': nm, 'text-font': REG, 'text-size': Z(8, 10.5, 13, 13.5), 'text-max-width': 8, 'symbol-sort-key': ['get', 'rank'] } }),
      T('lbl-minor', ['in', ['get', 'class'], ['literal', ['village', 'suburb', 'quarter', 'neighbourhood']]], { minzoom: 11,
        layout: { 'text-field': nm, 'text-font': REG, 'text-size': Z(11, 10, 15, 12.5), 'text-max-width': 7 }, paint: { 'text-color': p.textMuted, 'text-halo-color': p.halo, 'text-halo-width': 1.2 } }),
      { id: 'lbl-road', type: 'symbol', source: 'omt', 'source-layer': 'transportation_name', minzoom: 14.5,
        layout: { 'text-field': nm, 'text-font': REG, 'text-size': 11, 'symbol-placement': 'line', 'text-letter-spacing': 0.04 },
        paint: { 'text-color': p.textMuted, 'text-halo-color': p.halo, 'text-halo-width': 1.2 } },
    ];
  };

  /** Retícula lat/lon como instrumento de medición (cada 15°). */
  MS.graticule = function () {
    const f = [];
    for (let lat = -75; lat <= 75; lat += 15) { const c = []; for (let lng = -180; lng <= 180; lng += 10) c.push([lng, lat]); f.push({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: c } }); }
    for (let lng = -180; lng < 180; lng += 15) { const c = []; for (let lat = -85; lat <= 85; lat += 5) c.push([lng, lat]); f.push({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: c } }); }
    return { type: 'FeatureCollection', features: f };
  };

  /** Style completo. geo = FeatureCollection de países ya enriquecida. */
  MS.build = function (theme, geo) {
    const p = MS.palette(theme);
    return {
      version: 8, name: 'TRUMPF Atlas · ' + theme,
      projection: { type: 'globe' },
      sky: Object.assign({ 'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 1, 4, 0.9, 7, 0] }, p.sky),
      glyphs: GLYPHS,
      sources: {
        omt: { type: 'vector', url: OMT },
        satellite: { type: 'raster', tiles: [ESRI], tileSize: 256, maxzoom: 19, attribution: 'Esri, Maxar, Earthstar Geographics' },
        countries: { type: 'geojson', data: geo, promoteId: 'cc' },
        // un solo punto por filial: el rótulo sobre el polígono se repetía en cada tesela
        'excl-labels': { type: 'geojson', data: { type: 'FeatureCollection', features: [
          { type: 'Feature', properties: { cc: 'BR' }, geometry: { type: 'Point', coordinates: [-51.5, -11.5] } },
          { type: 'Feature', properties: { cc: 'MX' }, geometry: { type: 'Point', coordinates: [-102.5, 24.2] } }] } },
        graticule: { type: 'geojson', data: MS.graticule() },
      },
      layers: MS.baseLayers(p),
    };
  };
})();
