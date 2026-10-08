/* ==========================================================================
   tl-search.js — paleta de comandos ⌘K: búsqueda tolerante (sin tildes) con
   ranking sobre empresas, representantes, países, ciudades y oportunidades,
   sugerencias, acciones rápidas y modo "Preguntale al mapa (IA)".
   API: TL.search = { open(mode, query), close(), isOpen(), ask(q) }
   El núcleo conecta ⌘K / Ctrl+K y #search-trigger → TL.search.open().
   ========================================================================== */
(function () {
  'use strict';
  const TL = window.TL;
  const { u } = TL;
  const html = u.html, raw = u.raw;
  const t = (k, v) => TL.i18n.t(k, v);

  TL.i18n.extend({
    es: {
      'search.placeholder': 'Buscar empresas, ciudades, países',
      'search.placeholderAsk': 'Escribí tu pregunta sobre el mercado…',
      'search.open': 'Abrir el buscador',
      'search.title': 'Buscador',
      'search.mode': 'Modo de búsqueda',
      'search.modeFind': 'Buscar',
      'search.modeAsk': 'Preguntale al mapa (IA)',
      'search.navigate': 'navegar',
      'search.open2': 'abrir',
      'search.close': 'cerrar',
      'search.tabMode': 'modo',
      'search.ask2': 'preguntar',
      'search.g.clients': 'Empresas',
      'search.g.reps': 'Representantes',
      'search.g.countries': 'Países',
      'search.g.cities': 'Ciudades',
      'search.g.opps': 'Oportunidades',
      'search.g.actions': 'Acciones',
      'search.g.top': 'Mejores prospectos · Tier A',
      'search.g.topCountries': 'Países con más prospectos',
      'search.g.examples': 'Preguntas de ejemplo',
      'search.g.suggest': 'Sugerencias',
      'search.rep': 'Representante',
      'search.shortlist': 'Shortlist',
      'search.subsidiary': 'Filial TRUMPF · fuera del alcance',
      'search.nClients.one': '1 empresa',
      'search.nClients.other': '{n} empresas',
      'search.nReps.one': '1 representante',
      'search.nReps.other': '{n} representantes',
      'search.nA': '{n} tier A',
      'search.filterMap': 'Filtrar el mapa por «{q}»',
      'search.filterMapSub': '{n} empresas coinciden',
      'search.empty': 'Nada coincide con «{q}».',
      'search.emptyHint': 'Probá con otra grafía, una ciudad o un rubro, o preguntale al mapa con IA.',
      'search.askThis': 'Preguntarle al mapa: «{q}»',
      'search.act.crm': 'Abrir Seguimiento',
      'search.act.tour': 'Modo presentación',
      'search.act.investigate': 'Investigar empresa nueva (IA)',
      'search.act.ask': 'Preguntale al mapa (IA)',
      'search.act.theme': 'Cambiar tema claro / oscuro',
      'search.act.lang': 'Auf Deutsch umschalten',
      'search.act.home': 'Volver a la vista general',
      'search.kw.crm': 'seguimiento crm kanban tablero estado pipeline',
      'search.kw.tour': 'presentacion tour recorrido demo',
      'search.kw.investigate': 'investigar nueva empresa url web ia agregar',
      'search.kw.ask': 'preguntar ia pregunta mapa',
      'search.kw.theme': 'tema oscuro claro modo noche',
      'search.kw.lang': 'idioma aleman deutsch sprache',
      'search.kw.home': 'inicio home region latam',
      'search.ex.1': '¿Qué talleres en Perú tienen máquinas chinas que podríamos reemplazar?',
      'search.ex.2': 'Top 10 tier A con paneladora recomendada',
      'search.ex.3': '¿Dónde conviene la primera gira?',
      'search.ex.4': 'Fabricantes de tableros eléctricos en Colombia',
      'search.ex.5': 'Representantes en Centroamérica sin conflicto de marcas',
      'search.askHint': 'La IA lee las fichas compactas de todas las empresas y representantes y responde con resultados resaltados en el mapa.',
      'search.thinking': 'Analizando {n} registros',
      'search.opp': 'Oportunidad',
    },
    de: {
      'search.placeholder': 'Unternehmen, Städte, Länder suchen',
      'search.placeholderAsk': 'Ihre Frage zum Markt …',
      'search.open': 'Suche öffnen',
      'search.title': 'Suche',
      'search.mode': 'Suchmodus',
      'search.modeFind': 'Suchen',
      'search.modeAsk': 'Frag die Karte (KI)',
      'search.navigate': 'navigieren',
      'search.open2': 'öffnen',
      'search.close': 'schließen',
      'search.tabMode': 'Modus',
      'search.ask2': 'fragen',
      'search.g.clients': 'Unternehmen',
      'search.g.reps': 'Vertretungen',
      'search.g.countries': 'Länder',
      'search.g.cities': 'Städte',
      'search.g.opps': 'Projekte',
      'search.g.actions': 'Aktionen',
      'search.g.top': 'Top-Interessenten · Stufe A',
      'search.g.topCountries': 'Länder mit den meisten Interessenten',
      'search.g.examples': 'Beispielfragen',
      'search.g.suggest': 'Vorschläge',
      'search.rep': 'Vertretung',
      'search.shortlist': 'Shortlist',
      'search.subsidiary': 'TRUMPF-Tochtergesellschaft · nicht im Fokus',
      'search.nClients.one': '1 Unternehmen',
      'search.nClients.other': '{n} Unternehmen',
      'search.nReps.one': '1 Vertretung',
      'search.nReps.other': '{n} Vertretungen',
      'search.nA': '{n} × Stufe A',
      'search.filterMap': 'Karte nach „{q}“ filtern',
      'search.filterMapSub': '{n} Unternehmen passen',
      'search.empty': 'Keine Treffer für „{q}“.',
      'search.emptyHint': 'Andere Schreibweise, eine Stadt oder Branche versuchen – oder die Karte per KI fragen.',
      'search.askThis': 'Die Karte fragen: „{q}“',
      'search.act.crm': 'Vertriebs-Tracking öffnen',
      'search.act.tour': 'Präsentationsmodus',
      'search.act.investigate': 'Neues Unternehmen recherchieren (KI)',
      'search.act.ask': 'Frag die Karte (KI)',
      'search.act.theme': 'Hell / Dunkel umschalten',
      'search.act.lang': 'Cambiar a español',
      'search.act.home': 'Zur Gesamtansicht',
      'search.kw.crm': 'tracking crm kanban board status pipeline seguimiento',
      'search.kw.tour': 'praesentation tour demo',
      'search.kw.investigate': 'recherchieren neues unternehmen url web ki hinzufuegen',
      'search.kw.ask': 'fragen ki frage karte',
      'search.kw.theme': 'thema dunkel hell nachtmodus design',
      'search.kw.lang': 'sprache spanisch espanol idioma',
      'search.kw.home': 'start uebersicht region latam',
      'search.ex.1': 'Welche Lohnfertiger in Peru haben chinesische Maschinen, die wir ersetzen könnten?',
      'search.ex.2': 'Top 10 der Stufe A mit empfohlener Paneelbiegemaschine',
      'search.ex.3': 'Wo lohnt sich die erste Reise?',
      'search.ex.4': 'Schaltanlagenbauer in Kolumbien',
      'search.ex.5': 'Vertretungen in Zentralamerika ohne Markenkonflikt',
      'search.askHint': 'Die KI liest die Kurzprofile aller Unternehmen und Vertretungen und antwortet mit Treffern, die auf der Karte hervorgehoben werden.',
      'search.thinking': '{n} Datensätze werden analysiert',
      'search.opp': 'Projekt',
    },
  });

  /* ── Normalización con mapa de índices (para resaltar sobre el original) ── */
  const nch = (c) => c.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  function normMap(s) {
    s = String(s == null ? '' : s);
    let n = ''; const map = [];
    for (let i = 0; i < s.length; i++) {
      const c = nch(s[i]);
      for (let k = 0; k < c.length; k++) { n += c[k]; map.push(i); }
    }
    return { n, map, s };
  }
  const N = (s) => normMap(s).n;
  const isWordStart = (str, i) => i === 0 || !/[a-z0-9]/.test(str[i - 1]);

  /** Tipo de coincidencia de un token en un texto normalizado: 1 prefijo · .8 palabra · .5 contiene · .3 casi */
  function matchKind(f, q) {
    if (!f || !q) return 0;
    if (f.startsWith(q)) return 1;
    let i = f.indexOf(q), contains = 0;
    while (i > -1) {
      if (isWordStart(f, i)) return 0.8;
      contains = 0.5;
      i = f.indexOf(q, i + 1);
    }
    if (contains) return contains;
    if (q.length >= 4) {                       // tolerancia a un error de tipeo, por palabra
      const words = f.split(/[^a-z0-9]+/);
      for (const w of words) {
        if (w.length < q.length - 1) continue;
        if (lev1(w.slice(0, q.length), q) || lev1(w.slice(0, q.length + 1), q) || lev1(w.slice(0, q.length - 1), q)) return 0.3;
      }
    }
    return 0;
  }
  /** ¿distancia de edición ≤ 1? (rápido, sin matriz) */
  function lev1(a, b) {
    if (a === b) return true;
    const la = a.length, lb = b.length;
    if (Math.abs(la - lb) > 1) return false;
    let i = 0, j = 0, diff = 0;
    while (i < la && j < lb) {
      if (a[i] === b[j]) { i++; j++; continue; }
      if (++diff > 1) return false;
      if (la > lb) i++; else if (lb > la) j++; else { i++; j++; }
    }
    return diff + (la - i) + (lb - j) <= 1;
  }

  /* Pesos por campo: nombre > razón social > ciudad > rubro > productos > país */
  const W = { name: 100, legal: 82, city: 66, sector: 48, product: 40, country: 30, kw: 36 };

  /* ── Índice ─────────────────────────────────────────────────────────── */
  let IDX = null;
  function buildIndex() {
    const D = TL.data, L = TL.i18n;
    const items = [];
    const f = (text, w) => [N(text), w];
    D.clients.forEach((c) => {
      items.push({
        type: 'client', id: c.id, label: c.name || c.legal_name || c.id, rec: c, boost: D.score(c) / 100,
        fields: [f(c.name, W.name), f(c.legal_name, W.legal), f(c.city, W.city),
          ...(c.sectors || []).map((s) => f(D.sectorName(s), W.sector)),
          ...(c.products || []).slice(0, 12).map((p) => f(L.pick(p, 'name') || p.name, W.product)),
          f(D.countryName(c.country), W.country)],
      });
    });
    D.reps.forEach((r) => {
      items.push({
        type: 'rep', id: r.id, label: r.name || r.legal_name || r.id, rec: r, boost: (r.shortlist ? 0.3 : 0) + D.score(r) / 200,
        fields: [f(r.name, W.name), f(r.legal_name, W.legal), f(r.city, W.city),
          ...(r.brands || []).map((b) => f(b.brand, W.sector)), f(D.countryName(r.country), W.country)],
      });
    });
    D.countries.forEach((k) => {
      const nm = L.pick(k, 'name') || k.cc;
      items.push({
        type: 'country', id: k.cc, label: nm, rec: k, boost: (k.counts?.clients || 0) / Math.max(1, D.maxClients || 1),
        fields: [f(k.name_es, W.name), f(k.name_de, W.name), [k.cc.toLowerCase(), W.legal]],
      });
    });
    // Ciudades únicas (clientes + reps) con conteo y coordenadas promedio
    const cities = new Map();
    const addCity = (r, kind) => {
      if (!r.city || !isFinite(r.lat) || !isFinite(r.lng)) return;
      const key = N(r.city) + '|' + r.country;
      const e = cities.get(key) || { name: r.city, cc: r.country, n: 0, reps: 0, lat: 0, lng: 0, pts: 0, a: 0 };
      if (kind === 'rep') e.reps++; else { e.n++; if (r.tier === 'A') e.a++; }
      e.lat += +r.lat; e.lng += +r.lng; e.pts++;
      cities.set(key, e);
    };
    D.clients.forEach((c) => addCity(c, 'client'));
    D.reps.forEach((r) => addCity(r, 'rep'));
    cities.forEach((e, key) => {
      e.lat /= e.pts; e.lng /= e.pts;
      items.push({ type: 'city', id: key, label: e.name, rec: e, boost: (e.n + e.reps) / 20, fields: [f(e.name, W.name), f(D.countryName(e.cc), W.country)] });
    });
    D.opps.forEach((o) => {
      items.push({
        type: 'opp', id: o.id, label: L.pick(o, 'title') || o.id, rec: o, boost: Math.min(1, (o.amount_usd || 0) / 2e8),
        fields: [f(o.title_es, W.name), f(o.title_de, W.name), f(o.city, W.city), f(D.sectorName(o.sector), W.sector), f(D.countryName(o.country), W.country)],
      });
    });
    ACTIONS.forEach((a) => {
      items.push({ type: 'action', id: a.id, label: t(a.key), act: a, boost: 0, fields: [f(t(a.key), W.name), f(t('search.kw.' + a.id), W.kw)] });
    });
    IDX = items;
    return items;
  }
  const index = () => IDX || buildIndex();
  TL.on('data:changed', () => { IDX = null; });
  /* ── Acciones rápidas ───────────────────────────────────────────────── */
  const ACTIONS = [
    { id: 'crm', icon: 'crm', key: 'search.act.crm', when: () => !!TL.crm?.openBoard, run: () => TL.crm.openBoard() },
    { id: 'tour', icon: 'play', key: 'search.act.tour', when: () => !!TL.tour?.start, run: () => TL.tour.start() },
    { id: 'investigate', icon: 'sparkle', key: 'search.act.investigate', when: () => !!TL.ai?.investigate, run: () => TL.ai.investigate() },
    { id: 'ask', icon: 'chat', key: 'search.act.ask', keep: true, run: () => setMode('ask', true) },
    { id: 'theme', icon: 'expand', key: 'search.act.theme', keep: true, run: () => TL.theme.toggle(), iconSvg: '<path d="M10 3.2a6.8 6.8 0 1 0 0 13.6z" fill="currentColor" stroke="none"/><circle cx="10" cy="10" r="6.8"/>' },
    { id: 'lang', icon: 'web', key: 'search.act.lang', keep: true, run: () => TL.i18n.set(TL.i18n.lang === 'de' ? 'es' : 'de') },
    { id: 'home', icon: 'back', key: 'search.act.home', when: () => !!TL.nav?.home, run: () => TL.nav.home() },
  ];
  const actionOk = (a) => (a.when ? a.when() : true);

  /* ── Búsqueda con ranking ───────────────────────────────────────────── */
  const LIMIT = { client: 8, rep: 4, country: 4, city: 5, opp: 4, action: 3 };
  const ORDER = ['client', 'rep', 'country', 'city', 'opp', 'action'];
  const GROUP_KEY = { client: 'search.g.clients', rep: 'search.g.reps', country: 'search.g.countries', city: 'search.g.cities', opp: 'search.g.opps', action: 'search.g.actions' };

  function scoreItem(it, toks, whole) {
    let total = 0;
    for (const q of toks) {
      let best = 0;
      for (const [txt, w] of it.fields) {
        const k = matchKind(txt, q);
        // "contiene" solo en nombre / razón social; tolerancia a typos solo en nombre y ciudad
        if (!k || (k === 0.5 && w < W.legal) || (k === 0.3 && w < W.city)) continue;
        if (k * w > best) best = k * w;
      }
      if (!best) return 0;              // todos los tokens deben coincidir en algún campo
      total += best;
    }
    total /= toks.length;
    if (toks.length > 1 && it.fields[0][0].includes(whole)) total += 18;   // frase completa en el nombre
    return total + it.boost * 6;
  }

  /** Busca y devuelve grupos [{type, label, items:[{it, score}], total}] ordenados por relevancia. */
  function search(query) {
    const whole = N(query).replace(/\s+/g, ' ').trim();
    if (!whole) return [];
    const toks = whole.split(' ').filter(Boolean);
    const byType = {};
    for (const it of index()) {
      if (it.type === 'action' && !actionOk(it.act)) continue;
      const s = scoreItem(it, toks, whole);
      if (s > 0) (byType[it.type] = byType[it.type] || []).push({ it, score: s });
    }
    const groups = ORDER.filter((k) => byType[k]).map((type) => {
      const arr = byType[type].sort((a, b) => b.score - a.score || String(a.it.label).localeCompare(String(b.it.label)));
      return { type, label: t(GROUP_KEY[type]), items: arr.slice(0, LIMIT[type]), total: arr.length, best: arr[0].score };
    });
    // Grupos por mejor coincidencia (el orden fijo desempata)
    groups.sort((a, b) => (b.best - a.best > 8 ? 1 : a.best - b.best > 8 ? -1 : ORDER.indexOf(a.type) - ORDER.indexOf(b.type)));
    return groups;
  }

  /** Resalta los tokens del query dentro de `label` con <mark>. */
  function mark(label, query) {
    const toks = N(query).split(/\s+/).filter(Boolean);
    const m = normMap(label);
    const ranges = [];
    toks.forEach((q) => {
      let i = m.n.indexOf(q), pick = -1;
      while (i > -1) { if (isWordStart(m.n, i)) { pick = i; break; } if (pick < 0) pick = i; i = m.n.indexOf(q, i + 1); }
      if (pick > -1) ranges.push([m.map[pick], m.map[pick + q.length - 1] + 1]);
    });
    if (!ranges.length) return u.esc(label);
    ranges.sort((a, b) => a[0] - b[0]);
    const merged = [];
    ranges.forEach((r) => { const last = merged[merged.length - 1]; if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]); else merged.push(r.slice()); });
    let out = '', pos = 0;
    merged.forEach(([a, b]) => { out += u.esc(label.slice(pos, a)) + '<mark>' + u.esc(label.slice(a, b)) + '</mark>'; pos = b; });
    return out + u.esc(label.slice(pos));
  }

  /* ── Filas ──────────────────────────────────────────────────────────── */
  const D = () => TL.data;
  const tierTag = (rec) => (rec?.tier ? `<span class="ps-tier" data-tier="${u.esc(rec.tier)}">${u.esc(rec.tier)}</span><span class="ps-sc num">${Math.round(D().score(rec))}</span>` : '');
  const iconPlate = (name, cls = '', svg) => `<span class="ps-plate ps-ico ${cls}">${svg ? `<svg class="ico" viewBox="0 0 20 20" aria-hidden="true">${svg}</svg>` : TL.ui.icon(name)}</span>`;
  const place = (city, cc) => [city, cc ? D().countryName(cc) : ''].filter(Boolean).join(' · ');

  function rowParts(it, q) {
    const rec = it.rec, L = TL.i18n;
    const name = q ? mark(it.label, q) : u.esc(it.label);
    switch (it.type) {
      case 'client':
        return { plate: `<span class="ps-plate">${TL.ui.logo(rec, 30)}</span>`, name, meta: u.esc(place(rec.city, rec.country)) + (rec.isNew ? ` <span class="ps-new">${u.esc(t('ui.newAI'))}</span>` : ''), side: tierTag(rec) };
      case 'rep':
        return { plate: `<span class="ps-plate">${TL.ui.logo(rec, 30)}</span>`, name, meta: u.esc(t('search.rep') + ' · ' + place(rec.city, rec.country)), side: (rec.shortlist ? `<span class="ps-short">${u.esc(t('search.shortlist'))}</span>` : '') + tierTag(rec) };
      case 'country': {
        const n = rec.counts?.clients || 0, a = rec.counts?.A || 0;
        const meta = rec.role === 'excluded' ? t('search.subsidiary') : [L.tn('search.nClients', n), a ? t('search.nA', { n: a }) : '', rec.counts?.reps ? L.tn('search.nReps', rec.counts.reps) : ''].filter(Boolean).join(' · ');
        return { plate: `<span class="ps-plate ps-flag">${TL.ui.flag(rec.cc, 22)}</span>`, name, meta: u.esc(meta), side: `<span class="ps-cc mono">${u.esc(rec.cc)}</span>` };
      }
      case 'city': {
        const meta = [D().countryName(rec.cc), rec.n ? L.tn('search.nClients', rec.n) : '', rec.reps ? L.tn('search.nReps', rec.reps) : ''].filter(Boolean).join(' · ');
        return { plate: iconPlate('pin'), name, meta: u.esc(meta), side: `<span class="ps-coord mono">${L.dec(Math.abs(rec.lat), 2)}°${rec.lat < 0 ? 'S' : 'N'} ${L.dec(Math.abs(rec.lng), 2)}°${rec.lng < 0 ? 'W' : 'E'}</span>` };
      }
      case 'opp':
        return { plate: iconPlate('radar', 'ps-opp'), name, meta: u.esc([t('search.opp'), place(rec.city, rec.country)].filter(Boolean).join(' · ')), side: rec.amount_usd ? `<span class="ps-amt num">${u.esc(L.usd(rec.amount_usd))}</span>` : (rec.amount_text ? `<span class="ps-amt num">${u.esc(rec.amount_text)}</span>` : '') };
      case 'action':
        return { plate: iconPlate(it.act.icon, 'ps-act', it.act.iconSvg), name, meta: '', side: '' };
      case 'example':
        return { plate: iconPlate('chat', 'ps-act', '<path d="M5 4v6.5h10"/><path d="M11.5 7l3.5 3.5-3.5 3.5"/>'), name: u.esc(it.label), meta: '', side: '' };
      case 'filter':
        return { plate: iconPlate('filter', 'ps-act'), name: u.esc(it.label), meta: u.esc(it.meta || ''), side: '' };
      default:
        return { plate: iconPlate('info'), name, meta: '', side: '' };
    }
  }

  let optSeq = 0;
  function rowHtml(it, q, i) {
    const p = rowParts(it, q);
    return `<div class="ps-row" role="option" id="pal-opt-${++optSeq}" data-nav data-i="${i}" data-type="${it.type}" aria-selected="false" style="--d:${Math.min(i, 12) * 28}ms">
      ${p.plate}<span class="ps-main"><span class="ps-name">${p.name}</span>${p.meta ? `<span class="ps-meta">${p.meta}</span>` : ''}</span>
      <span class="ps-side">${p.side}</span><kbd class="ps-enter" aria-hidden="true">↵</kbd></div>`;
  }
  const groupHead = (label, count) => `<div class="ps-grp" role="presentation"><span>${u.esc(label)}</span>${count != null ? `<i class="num">${count}</i>` : ''}</div>`;
  /* ── Controlador de la paleta ───────────────────────────────────────── */
  let root, box, input, list, segEl, aiFoot, inited = false;
  let open_ = false, mode = 'find', flat = [], active = -1, escOff = null, lastFocus = null, closeT = 0;
  let ask = { status: 'idle', q: '', res: null, typed: false }, askTok = 0, typeStop = null;

  function ensureInit() {
    if (inited) return !!root;
    inited = true;
    root = document.getElementById('tl-palette');
    if (!root) return false;
    box = root.querySelector('.pal-box');
    input = document.getElementById('pal-input');
    list = document.getElementById('pal-list');
    segEl = document.getElementById('pal-mode');
    const foot = root.querySelector('.pal-foot');
    if (foot && !foot.querySelector('.pf-tab')) {
      foot.insertAdjacentHTML('beforeend', '<span class="pf-tab"><kbd>Tab</kbd> <em data-i18n="search.tabMode"></em></span><span class="pf-ai" id="pal-ai"></span>');
      TL.i18n.apply(foot);
    }
    aiFoot = document.getElementById('pal-ai');
    box.insertAdjacentHTML('afterbegin', '<i class="pal-laser" aria-hidden="true"></i>');

    root.querySelector('.pal-scrim')?.addEventListener('click', () => close());
    segEl?.addEventListener('click', (e) => { const b = e.target.closest('button[data-mode]'); if (b) setMode(b.dataset.mode, true); });
    input.addEventListener('input', onInput);
    root.addEventListener('keydown', onKey);
    list.addEventListener('click', (e) => {
      const el = e.target.closest('[data-nav]'); if (!el) return;
      const it = flat[+el.dataset.i]; if (it) runItem(it);
    });
    list.addEventListener('pointermove', (e) => {
      const el = e.target.closest('[data-nav]'); if (!el) { hoverOff(); return; }
      const i = +el.dataset.i;
      if (i !== active) setActive(i, false);
      const it = flat[i];
      if (it && (it.type === 'client' || it.type === 'rep')) hoverOn(it.id); else hoverOff();
    });
    list.addEventListener('pointerleave', hoverOff);
    TL.on('lang', () => { IDX = null; if (open_) { applyModeUI(); render(); } });
    TL.on('data:changed', () => { if (open_) render(); });
    TL.on('ai:status', () => { if (open_) { paintAiFoot(); if (mode === 'ask' && ask.status === 'idle') render(); } });
    return true;
  }

  /* Resaltado sutil del punto al pasar por una fila (restaura el de la IA al salir) */
  let hovId = null, hovT = 0;
  function hoverOn(id) {
    clearTimeout(hovT);
    if (hovId === id || !TL.map?.highlight) return;
    hovId = id;
    TL.map._searchHover = true;
    TL.map.highlight([id], { dim: 0.32 });
    TL.map._searchHover = false;
  }
  function hoverOff() {
    if (!hovId) return;
    clearTimeout(hovT);
    hovT = setTimeout(() => {
      hovId = null;
      if (!TL.map?.highlight) return;
      TL.map._searchHover = true;
      const keep = TL.ai?.highlighted?.();
      if (keep && keep.length) TL.map.highlight(keep); else TL.map.clearHighlight();
      TL.map._searchHover = false;
    }, 70);
  }

  function setActive(i, scroll = true) {
    const rows = list.querySelectorAll('[data-nav]');
    rows.forEach((r) => { r.classList.remove('is-active'); r.setAttribute('aria-selected', 'false'); });
    active = i;
    const el = i > -1 ? list.querySelector(`[data-nav][data-i="${i}"]`) : null;
    if (el) {
      el.classList.add('is-active'); el.setAttribute('aria-selected', 'true');
      input.setAttribute('aria-activedescendant', el.id || '');
      if (scroll) el.scrollIntoView({ block: 'nearest' });
    } else input.removeAttribute('aria-activedescendant');
  }
  function move(d) {
    if (!flat.length) return;
    let i = active + d;
    if (i < 0) i = flat.length - 1;
    if (i >= flat.length) i = 0;
    setActive(i);
  }

  function onInput() {
    if (mode === 'find') render();
    else if (ask.status !== 'loading') { if (active > -1) setActive(-1); }
  }

  function onKey(e) {
    if (!open_) return;
    const k = e.key;
    if (k === 'ArrowDown') { e.preventDefault(); move(1); }
    else if (k === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (k === 'Home' && e.target !== input) { e.preventDefault(); setActive(0); }
    else if (k === 'Enter' && !e.isComposing) {
      e.preventDefault();
      if (active > -1 && flat[active]) runItem(flat[active]);
      else if (mode === 'ask') submitAsk(input.value);
      else if (flat[0]) runItem(flat[0]);
    } else if (k === 'Tab') {
      if (e.target === input && !e.shiftKey) { e.preventDefault(); setMode(mode === 'find' ? 'ask' : 'find', true); return; }
      trapTab(e);
    } else if (k === 'Escape' && !TL.ui?.escPush) { e.preventDefault(); close(); }
  }
  function trapTab(e) {
    const f = Array.from(box.querySelectorAll('input, button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')).filter((x) => x.offsetParent !== null);
    if (!f.length) return;
    const i = f.indexOf(document.activeElement);
    e.preventDefault();
    const n = e.shiftKey ? (i <= 0 ? f.length - 1 : i - 1) : (i === f.length - 1 ? 0 : i + 1);
    f[n].focus();
  }

  function applyModeUI() {
    root.dataset.mode = mode;
    segEl?.querySelectorAll('button[data-mode]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.mode === mode ? 'true' : 'false'));
    input.placeholder = t(mode === 'ask' ? 'search.placeholderAsk' : 'search.placeholder');
    const ok = root.querySelector('.pal-foot em[data-i18n="search.open2"]');
    if (ok) ok.textContent = t(mode === 'ask' ? 'search.ask2' : 'search.open2');
    paintAiFoot();
  }
  function paintAiFoot() {
    if (!aiFoot) return;
    const st = TL.ai?.status?.() || 'unconfigured';
    aiFoot.dataset.st = st;
    aiFoot.innerHTML = `<i></i>${u.esc(t('ai.st.' + st))}`;
  }

  function setMode(m, focus) {
    if (m !== 'find' && m !== 'ask') m = 'find';
    const was = mode;
    mode = m;
    if (was !== m) {
      if (m === 'ask') input.value = ask.status === 'answer' ? ask.q : (was === 'find' ? input.value : '');
      else if (was === 'ask') input.value = '';
    }
    applyModeUI();
    render();
    if (focus) input.focus();
  }
  /* ── Render ─────────────────────────────────────────────────────────── */
  function render() {
    if (!root) return;
    typeStop?.(); typeStop = null;
    flat = []; optSeq = 0;
    if (mode === 'ask') renderAsk(); else renderFind();
    list.scrollTop = 0;
  }
  const push = (it) => { flat.push(it); return flat.length - 1; };
  const addRows = (arr, q) => arr.map((it) => rowHtml(it, q, push(it))).join('');

  function suggestions() {
    const d = D();
    let h = '';
    const top = d.clients.filter((c) => c.tier === 'A').sort((a, b) => d.score(b) - d.score(a)).slice(0, 6)
      .map((c) => ({ type: 'client', id: c.id, label: c.name, rec: c }));
    if (top.length) h += groupHead(t('search.g.top')) + addRows(top, '');
    const cs = d.ranking().filter((k) => (k.counts?.clients || 0) > 0).slice(0, 4)
      .map((k) => ({ type: 'country', id: k.cc, label: TL.i18n.pick(k, 'name') || k.cc, rec: k }));
    if (cs.length) h += groupHead(t('search.g.topCountries')) + addRows(cs, '');
    const acts = ACTIONS.filter(actionOk).map((a) => ({ type: 'action', id: a.id, label: t(a.key), act: a }));
    h += groupHead(t('search.g.actions')) + addRows(acts, '');
    return h;
  }

  function renderFind() {
    const q = input.value;
    let h = '';
    if (!q.trim()) h = suggestions();
    else {
      const groups = search(q);
      groups.forEach((g) => {
        h += groupHead(g.label, g.total) + addRows(g.items.map((x) => x.it), q);
        if (g.type === 'client' && g.total >= 2) {
          h += addRows([{ type: 'filter', id: 'filter', q: q.trim(), label: t('search.filterMap', { q: q.trim() }), meta: t('search.filterMapSub', { n: TL.i18n.int(g.total) }) }], '');
        }
      });
      if (!groups.length) {
        h = `<div class="ps-empty">${TL.ui.icon('search')}<p>${u.esc(t('search.empty', { q: q.trim() }))}</p><span>${u.esc(t('search.emptyHint'))}</span></div>`;
        h += addRows([{ type: 'askthis', id: 'askthis', q: q.trim(), label: t('search.askThis', { q: q.trim() }) }], '');
      }
    }
    list.innerHTML = h;
    setActive(flat.length ? 0 : -1, false);
  }

  function renderAsk() {
    let h = '';
    const st = TL.ai?.status?.() || 'unconfigured';
    if (ask.status === 'loading') {
      const n = (TL.data.clients.length + TL.data.reps.length);
      h = `<div class="pa-loading">${TL.ai?.laser?.() || ''}<p class="pa-q">${u.esc(ask.q)}</p><span class="mono">${u.esc(t('search.thinking', { n: TL.i18n.int(n) }))}<i class="pa-dots"><b>.</b><b>.</b><b>.</b></i></span></div>`;
      list.innerHTML = h; setActive(-1, false); return;
    }
    if (ask.status === 'answer' && ask.res) { renderAnswer(); return; }
    h += `<div class="pa-intro"><p>${u.esc(t('search.askHint'))}</p>${st === 'online' ? '' : String(TL.ai?.notice?.('ask', { compact: true }) || '')}</div>`;
    const ex = [1, 2, 3, 4, 5].map((i) => ({ type: 'example', id: 'ex' + i, label: t('search.ex.' + i) }));
    h += groupHead(t('search.g.examples')) + addRows(ex, '');
    list.innerHTML = h;
    setActive(-1, false);
  }

  function renderAnswer() {
    const res = ask.res, d = D();
    const recs = (res.ids || []).map((id) => d.get(id)).filter(Boolean);
    const shown = recs.slice(0, 12).map((hit) => ({ type: hit.kind === 'rep' ? 'rep' : hit.kind === 'opp' ? 'opp' : 'client', id: hit.rec.id, label: hit.rec.name || TL.i18n.pick(hit.rec, 'title') || hit.rec.id, rec: hit.rec }));
    const local = res.source === 'local';
    let h = `<div class="pa-ans">
      <p class="pa-kick"><span class="pa-badge" data-src="${local ? 'local' : 'ai'}">${TL.ui.icon(local ? 'info' : 'sparkle')}${u.esc(t(local ? 'ai.localAnswer' : 'ai.aiAnswer'))}</span></p>
      ${local && res.reason ? `<p class="pa-note">${u.esc(t('ai.short.' + res.reason))}</p>` : ''}
      <div class="pa-text" aria-live="polite"></div>`;
    const tools = [];
    if (recs.length) {
      tools.push({ type: 'btn', id: 'fit', label: t('ai.showOnMap'), icon: 'pin', run: () => { close({ restore: false }); TL.ai?.fitHighlighted?.(); } });
      tools.push({ type: 'btn', id: 'clear', label: t('ai.clearHl'), icon: 'close', run: () => { TL.ai?.clearHighlight?.(); ask.typed = true; render(); } });
    }
    const hlOn = (TL.ai?.highlighted?.() || []).length;
    h += `<div class="pa-tools">${tools.map((b) => `<button type="button" class="btn btn-sm ${b.id === 'fit' ? 'btn-ink' : 'btn-ghost'}" data-nav data-i="${push(b)}" id="pal-opt-${++optSeq}">${TL.ui.icon(b.icon)}<span>${u.esc(b.label)}</span></button>`).join('')}
      ${recs.length ? `<span class="pa-count mono">${u.esc(TL.i18n.tn(hlOn ? 'ai.nHighlighted' : 'ai.nResults', recs.length))}</span>` : ''}</div></div>`;
    if (shown.length) h += groupHead(t('ai.results'), recs.length) + addRows(shown, '');
    const sugs = (res.suggestions || []).filter(Boolean).slice(0, 4);
    if (sugs.length) {
      h += groupHead(t('ai.suggestions')) + '<div class="pa-sugs">' + sugs.map((s) => {
        const i = push({ type: 'example', id: 'sug', label: String(s) });
        return `<button type="button" class="pa-chip" data-nav data-i="${i}" id="pal-opt-${++optSeq}">${u.esc(String(s))}</button>`;
      }).join('') + '</div>';
    }
    list.innerHTML = h;
    setActive(-1, false);
    const el = list.querySelector('.pa-text');
    if (ask.typed || !TL.ai?.typeInto) { el.innerHTML = TL.ai?.format?.(res.answer || '') || u.esc(res.answer || ''); }
    else { typeStop = TL.ai.typeInto(el, res.answer || '', () => { ask.typed = true; }); }
  }

  /* ── Acciones de las filas ──────────────────────────────────────────── */
  function runItem(it) {
    const nav = TL.nav || {};
    switch (it.type) {
      case 'client': case 'rep':
        close({ restore: false }); nav.open?.(it.id, { fly: true }); break;
      case 'country':
        close({ restore: false }); nav.country?.(it.id); break;
      case 'city':
        close({ restore: false }); nav.city?.(it.rec.name, it.rec.lng, it.rec.lat, 11); break;
      case 'opp':
        close({ restore: false });
        if (nav.open) nav.open(it.id, { fly: true });
        else { nav.view?.('radar'); TL.map?.flyToEntity?.(it.id); TL.emit('radar:focus', it.id); }
        break;
      case 'action':
        if (!it.act.keep) close({ restore: false });
        it.act.run();
        break;
      case 'filter':
        close({ restore: false }); TL.filters?.set({ q: it.q }); nav.view?.('clients'); break;
      case 'askthis':
        input.value = it.q; setMode('ask', true); submitAsk(it.q); break;
      case 'example':
        input.value = it.label; submitAsk(it.label); break;
      case 'btn':
        it.run(); break;
    }
  }

  async function submitAsk(q) {
    q = String(q || '').trim();
    if (!q || !TL.ai?.ask) return;
    const tok = ++askTok;
    ask = { status: 'loading', q, res: null, typed: false };
    render();
    let res;
    try { res = await TL.ai.ask(q); } catch (err) { res = { ok: false, answer: String(err?.message || err), ids: [], suggestions: [], source: 'local' }; }
    if (tok !== askTok) return;
    ask = { status: 'answer', q, res, typed: TL.reduceMotion };
    if (open_ && mode === 'ask') render();
  }

  /* ── Abrir / cerrar ─────────────────────────────────────────────────── */
  function open(m = 'find', query) {
    if (!ensureInit()) return;
    clearTimeout(closeT);
    const wasOpen = open_;
    mode = m === 'ask' ? 'ask' : 'find';
    if (query != null) input.value = String(query);
    else if (!wasOpen) input.value = mode === 'ask' ? (ask.status === 'answer' ? ask.q : '') : '';
    applyModeUI();
    render();
    if (!wasOpen) {
      lastFocus = document.activeElement;
      open_ = true;
      root.hidden = false;
      root.classList.remove('is-open', 'is-closing');
      void root.offsetWidth;
      root.classList.add('is-open');
      document.body.classList.add('palette-open');
      document.getElementById('search-trigger')?.setAttribute('aria-expanded', 'true');
      escOff = TL.ui?.escPush ? TL.ui.escPush(() => close()) : null;
      TL.emit('search:open', mode);
    }
    requestAnimationFrame(() => { input.focus(); if (query == null) input.select(); });
  }

  function close(o = {}) {
    if (!open_) return;
    open_ = false;
    typeStop?.(); typeStop = null;
    if (ask.status === 'answer') ask.typed = true;
    if (escOff) { try { escOff(); } catch (e) { /* noop */ } escOff = null; }
    hoverOff();
    root.classList.remove('is-open');
    root.classList.add('is-closing');
    document.body.classList.remove('palette-open');
    document.getElementById('search-trigger')?.setAttribute('aria-expanded', 'false');
    closeT = setTimeout(() => { root.hidden = true; root.classList.remove('is-closing'); }, TL.reduceMotion ? 0 : 170);
    if (o.restore !== false && lastFocus && document.contains(lastFocus)) { try { lastFocus.focus({ preventScroll: true }); } catch (e) { /* noop */ } }
    lastFocus = null;
    TL.emit('search:close');
  }

  TL.search = {
    open,
    close,
    isOpen: () => open_,
    /** Abre la paleta en modo IA y pregunta directamente. */
    ask(q) { open('ask', q); submitAsk(q); },
    /** Búsqueda programática (sin UI): [{type, id, label, score}] */
    query(q) { return search(q).flatMap((g) => g.items.map((x) => ({ type: g.type, id: x.it.id, label: x.it.label, score: x.score }))); },
    norm: N,
  };
})();
