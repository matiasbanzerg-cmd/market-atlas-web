/* ==========================================================================
   tl-data.js — capa de datos: índices, accesores, taxonomía, estadísticas y
   filtros globales. Lee window.TL_DATA / TL_GEO / TL_CONFIG (o el mock de dev).
   ========================================================================== */
(function () {
  'use strict';
  const { u } = TL;
  const D = (TL.data = {});

  const GROUP_BY_BRAND = {
    premium_eu: ['bystronic', 'salvagnini', 'prima power', 'finn-power', 'lvd', 'euromac', 'boschert', 'blm', 'adige', 'gasparini', 'adira', 'schroeder', 'safandarley'],
    japon: ['amada', 'mazak', 'mitsubishi', 'murata'],
    turquia: ['durma', 'ermaksan', 'baykal', 'nukon', 'dener', 'coastone'],
    china: ['bodor', 'hsg', "han's laser", 'gweike', 'senfeng', 'hymson', 'penta laser', 'hgtech', 'jfy', 'yawei', 'accurl'],
    usa: ['cincinnati'],
    corte_termico: ['hypertherm', 'kjellberg', 'esab', 'messer', 'koike'],
    soldadura: ['lincoln', 'miller', 'fronius', 'kemppi'],
    robot: ['fanuc', 'yaskawa', 'kuka'],
    mecanizado: ['haas', 'dmg mori', 'okuma', 'hurco'],
    trumpf: ['trumpf'],
  };
  const FALLBACK_GROUP_COLOR = {
    trumpf: '#BBD03A', premium_eu: '#4F708B', japon: '#C0392B', turquia: '#D98324', china: '#8E4B8F', usa: '#2E7D9A',
    corte_termico: '#B8860B', soldadura: '#6B8E23', robot: '#5A6B7B', mecanizado: '#7D6B5A', otro: '#899FB2', none: '#9AA7B3',
  };
  const SIZE_ORDER = { 'pequeña': 1, 'pequena': 1, mediana: 2, grande: 3 };

  D.isMock = !!window.TL_IS_MOCK;
  D.cfg = window.TL_CONFIG || { n8n: {}, author: '' };
  D.geo = window.TL_GEO || { type: 'FeatureCollection', features: [] };
  D.raw = window.TL_DATA || { clients: [], reps: [], countries: [], opportunities: [], dealers: [], portfolio: [], taxonomy: {} };
  D.taxonomy = D.raw.taxonomy || {};
  D.meta = D.raw.meta || {};
  D.gtm = D.raw.gtm || null;
  const FB = window.TL_FALLBACK || {};
  D.trumpf = (D.raw.trumpf && (D.raw.trumpf.facts || []).length) ? D.raw.trumpf : (FB.trumpf || { facts: [], latam_presence: [] });
  D.portfolio = (D.raw.portfolio && D.raw.portfolio.length) ? D.raw.portfolio : (FB.portfolio || []);
  D.dealers = D.raw.dealers || [];

  D.clients = [];
  D.reps = [];
  D.opps = [];
  D.countries = [];
  const byId = new Map();
  const byCc = new Map();

  /* ── Construcción de índices ────────────────────────────────────────── */
  D.rebuild = function () {
    D.clients = (D.raw.clients || []).concat(D.extras || []).filter((c) => c && c.id && isFinite(c.lat) && isFinite(c.lng));
    D.reps = (D.raw.reps || []).filter((r) => r && r.id && isFinite(r.lat) && isFinite(r.lng));
    D.opps = (D.raw.opportunities || []).filter((o) => o && o.id);
    D.countries = (D.raw.countries || []).slice();
    byId.clear(); byCc.clear();
    D.clients.forEach((c) => byId.set(c.id, { kind: 'client', rec: c }));
    D.reps.forEach((r) => byId.set(r.id, { kind: 'rep', rec: r }));
    D.opps.forEach((o) => byId.set(o.id, { kind: 'opp', rec: o }));
    D.countries.forEach((c) => byCc.set(c.cc, c));
    D.recount();
  };

  /** Recalcula conteos por país desde los registros reales (incluye extras de IA). */
  D.recount = function () {
    D.countries.forEach((k) => { k.counts = { clients: 0, A: 0, B: 0, C: 0, reps: 0 }; });
    D.clients.forEach((c) => { const k = byCc.get(c.country); if (k) { k.counts.clients++; k.counts[c.tier] = (k.counts[c.tier] || 0) + 1; } });
    D.reps.forEach((r) => { const k = byCc.get(r.country); if (k) k.counts.reps++; });
    D.maxClients = Math.max(1, ...D.countries.map((k) => k.counts.clients));
  };

  /** Empresas agregadas con la IA ("Investigar empresa nueva"): se guardan en localStorage. */
  D.extras = TL.store.get('extras', []);
  D.addExtra = function (client) {
    const rec = Object.assign({ isNew: true, tier: 'C' }, client);
    if (!rec.id) rec.id = 'NEW-' + Math.random().toString(36).slice(2, 7).toUpperCase();
    D.extras.push(rec);
    TL.store.set('extras', D.extras);
    D.rebuild();
    TL.emit('data:changed', { added: rec.id });
    return rec;
  };
  D.removeExtra = function (id) {
    D.extras = D.extras.filter((c) => c.id !== id);
    TL.store.set('extras', D.extras);
    D.rebuild();
    TL.emit('data:changed', { removed: id });
  };

  /* ── Accesores ──────────────────────────────────────────────────────── */
  D.get = (id) => byId.get(id) || null;
  D.rec = (id) => byId.get(id)?.rec || null;
  D.kindOf = (id) => byId.get(id)?.kind || null;
  D.client = (id) => (byId.get(id)?.kind === 'client' ? byId.get(id).rec : null);
  D.rep = (id) => (byId.get(id)?.kind === 'rep' ? byId.get(id).rec : null);
  D.opp = (id) => (byId.get(id)?.kind === 'opp' ? byId.get(id).rec : null);
  D.country = (cc) => byCc.get(cc) || null;
  D.isTarget = (cc) => byCc.get(cc)?.role === 'target';
  D.targetCountries = () => D.countries.filter((k) => k.role === 'target');
  D.countryName = (cc) => {
    const k = byCc.get(cc);
    if (k) return TL.i18n.pick(k, 'name') || cc;
    const f = D.geo.features.find((x) => x.properties?.cc === cc);
    return f ? TL.i18n.pick(f.properties, 'name') : cc || '';
  };
  D.clientsOf = (cc) => D.clients.filter((c) => c.country === cc);
  D.repsOf = (cc) => D.reps.filter((r) => r.country === cc);
  D.oppsOf = (cc) => D.opps.filter((o) => o.country === cc);
  D.dealersOf = (cc) => D.dealers.filter((d) => d.country === cc);

  D.sectorName = (k) => (D.taxonomy.sectors?.[k] ? TL.i18n.L(D.taxonomy.sectors[k]) : String(k || '').replace(/_/g, ' '));
  D.segmentName = (k) => (D.taxonomy.segments?.[k] ? TL.i18n.L(D.taxonomy.segments[k]) : k || '');
  D.family = (k) => D.taxonomy.families?.[k] || null;
  D.familyName = (k) => (D.family(k) ? TL.i18n.L(D.family(k)) : String(k || '').replace(/_/g, ' '));
  D.familyLine = (k) => D.family(k)?.line || '';

  /** Clave de grupo de una marca (usa brand_group del dato o la tabla del contrato). */
  D.groupOfBrand = function (brand, hint) {
    if (hint) return hint;
    const b = String(brand || '').toLowerCase();
    for (const [g, list] of Object.entries(GROUP_BY_BRAND)) if (list.some((x) => b.includes(x))) return g;
    return 'otro';
  };
  D.group = function (key) {
    const g = D.taxonomy.brand_groups?.[key];
    const color = g?.color || FALLBACK_GROUP_COLOR[key] || FALLBACK_GROUP_COLOR.otro;
    const name = g ? TL.i18n.L(g) : key === 'none' ? TL.i18n.t('comp.none') : key;
    return { key, name, color };
  };
  D.groupColor = (key) => D.group(key).color;
  D.groupKeys = () => Object.keys(D.taxonomy.brand_groups || FALLBACK_GROUP_COLOR).filter((k) => k !== 'none');

  /** Grupo "principal" de un cliente para el modo Competencia. */
  D.primaryGroup = function (c) {
    const ms = c.machines || [];
    if (!ms.length) return 'none';
    const gs = ms.map((m) => D.groupOfBrand(m.brand, m.brand_group));
    if (gs.includes('trumpf') || ms.some((m) => m.kind === 'trumpf')) return 'trumpf';
    const cnt = {};
    gs.forEach((g) => { cnt[g] = (cnt[g] || 0) + 1; });
    return Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0] || 'none';
  };
  D.groupsOf = (c) => u.unique((c.machines || []).map((m) => D.groupOfBrand(m.brand, m.brand_group)));
  D.hasCompetitor = (c) => (c.machines || []).some((m) => m.kind === 'competidor' || (m.kind !== 'trumpf' && D.groupOfBrand(m.brand, m.brand_group) !== 'trumpf' && D.groupOfBrand(m.brand, m.brand_group) !== 'otro'));
  D.hasTrumpf = (c) => (c.machines || []).some((m) => m.kind === 'trumpf' || D.groupOfBrand(m.brand, m.brand_group) === 'trumpf');

  D.tierColor = (t) => ({ A: TL.u.css('--tier-a'), B: TL.u.css('--tier-b'), C: TL.u.css('--tier-c') }[t] || '#899FB2');
  D.sizeClass = (c) => String(c?.size?.size_class || '').toLowerCase();
  D.sizeRank = (c) => SIZE_ORDER[D.sizeClass(c)] || 0;
  D.score = (c) => Number(c?.score?.total ?? c?.fit?.total ?? 0) || 0;
  D.logoOf = (rec) => rec?.logo || null;
  D.portfolioItem = function (series, family) {
    const s = String(series || '').toLowerCase();
    return D.portfolio.find((p) => String(p.series || '').toLowerCase() === s)
      || D.portfolio.find((p) => s && String(p.series || '').toLowerCase().includes(s.replace(/^tru\w+\s*/, '')) && (!family || p.family === family))
      || D.portfolio.find((p) => p.family === family) || null;
  };

  /* ── Estadísticas ───────────────────────────────────────────────────── */
  D.stats = function (list) {
    const s = { n: list.length, A: 0, B: 0, C: 0, avg: 0 };
    let sum = 0;
    list.forEach((c) => { s[c.tier] = (s[c.tier] || 0) + 1; sum += D.score(c); });
    s.avg = s.n ? sum / s.n : 0;
    return s;
  };
  D.ranking = () => D.targetCountries().slice().sort((a, b) => b.counts.clients - a.counts.clients || a.cc.localeCompare(b.cc));
  D.topSectors = function (list, n = 6) {
    const cnt = {};
    list.forEach((c) => (c.sectors || []).forEach((s) => { cnt[s] = (cnt[s] || 0) + 1; }));
    return Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, n).map(([key, count]) => ({ key, count, name: D.sectorName(key) }));
  };
  /** Base instalada detectada por grupo de marca: { total:{g:n}, byCountry:{cc:{g:n}} } */
  D.installedBase = function () {
    const total = {}, byCountry = {};
    D.clients.forEach((c) => (c.machines || []).forEach((m) => {
      const g = D.groupOfBrand(m.brand, m.brand_group);
      total[g] = (total[g] || 0) + 1;
      const b = (byCountry[c.country] = byCountry[c.country] || {});
      b[g] = (b[g] || 0) + 1;
    }));
    return { total, byCountry };
  };
  /** Clientes con máquinas de la competencia o equipo viejo/de baja gama (oportunidad de reemplazo). */
  D.replacementList = function (cc) {
    return D.clients
      .filter((c) => (!cc || c.country === cc) && (D.hasCompetitor(c) || (c.score?.upgrade || 0) >= 12))
      .sort((a, b) => (b.score?.upgrade || 0) - (a.score?.upgrade || 0) || D.score(b) - D.score(a));
  };
  D.potentialRank = (p) => ({ alto: 3, medio: 2, bajo: 1 }[p] || 0);

  /* ── Filtros globales (panel + mapa) ────────────────────────────────── */
  const blank = () => ({ sectors: [], segments: [], tiers: [], sizes: [], brands: [], families: [], q: '' });
  const F = (TL.filters = {
    f: blank(),
    sort: 'score',
    get: () => F.f,
    count() {
      return ['sectors', 'segments', 'tiers', 'sizes', 'brands', 'families'].reduce((a, k) => a + F.f[k].length, 0) + (F.f.q ? 1 : 0);
    },
    set(patch) {
      F.f = Object.assign({}, F.f, patch);
      TL.emit('filters', F.f);
    },
    toggle(key, val) {
      const arr = F.f[key].slice();
      const i = arr.indexOf(val);
      if (i >= 0) arr.splice(i, 1); else arr.push(val);
      F.set({ [key]: arr });
    },
    reset() { F.f = blank(); TL.emit('filters', F.f); },
    setSort(s) { F.sort = s; TL.emit('filters:sort', s); },
    test(c) {
      const f = F.f;
      if (f.tiers.length && !f.tiers.includes(c.tier)) return false;
      if (f.segments.length && !f.segments.includes(c.segment)) return false;
      if (f.sectors.length && !(c.sectors || []).some((s) => f.sectors.includes(s))) return false;
      if (f.sizes.length && !f.sizes.includes(D.sizeClass(c))) return false;
      if (f.families.length && !(c.trumpf_fit || []).some((x) => f.families.includes(x.family))) return false;
      if (f.brands.length) {
        const gs = D.groupsOf(c);
        const ok = f.brands.some((b) => (b === 'none' ? !gs.length : gs.includes(b)));
        if (!ok) return false;
      }
      if (f.q) {
        const hay = u.norm([c.name, c.city, c.legal_name, (c.sectors || []).map(D.sectorName).join(' ')].join(' '));
        if (!hay.includes(u.norm(f.q))) return false;
      }
      return true;
    },
    apply: (list) => (F.count() ? list.filter(F.test) : list),
    sorter(list) {
      const by = F.sort;
      const arr = list.slice();
      if (by === 'name') arr.sort((a, b) => String(a.name).localeCompare(String(b.name), TL.i18n.lang));
      else if (by === 'size') arr.sort((a, b) => D.sizeRank(b) - D.sizeRank(a) || D.score(b) - D.score(a));
      else arr.sort((a, b) => D.score(b) - D.score(a) || String(a.name).localeCompare(String(b.name)));
      return arr;
    },
    /** Chips activos: [{ key, value, label }] para pintar y quitar uno a uno. */
    chips() {
      const f = F.f, out = [];
      f.tiers.forEach((v) => out.push({ key: 'tiers', value: v, label: TL.i18n.t('tier.' + v) }));
      f.sectors.forEach((v) => out.push({ key: 'sectors', value: v, label: D.sectorName(v) }));
      f.segments.forEach((v) => out.push({ key: 'segments', value: v, label: D.segmentName(v) }));
      f.sizes.forEach((v) => out.push({ key: 'sizes', value: v, label: TL.i18n.t('size.' + v) }));
      f.brands.forEach((v) => out.push({ key: 'brands', value: v, label: v === 'none' ? TL.i18n.t('comp.none') : D.group(v).name }));
      f.families.forEach((v) => out.push({ key: 'families', value: v, label: D.familyName(v) }));
      if (f.q) out.push({ key: 'q', value: f.q, label: '“' + f.q + '”' });
      return out;
    },
    removeChip(c) { if (c.key === 'q') F.set({ q: '' }); else F.toggle(c.key, c.value); },
  });

  D.rebuild();
})();
