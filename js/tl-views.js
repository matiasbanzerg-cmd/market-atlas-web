/* ==========================================================================
   tl-views.js — vista "Clientes" del riel (inicio): región → país → lista
   filtrable con KPIs, ranking de países, rubros y mejores prospectos.
   Expone TL.vw.{clientRow, bindRows, incremental} para reutilizar en otras vistas.
   ========================================================================== */
(function () {
  'use strict';
  const { u } = TL;
  const t = (k, v) => TL.i18n.t(k, v);
  const I = () => TL.i18n;
  const D = () => TL.data;
  const VW = (TL.vw = {});

  TL.i18n.extend({
    es: {
      'cl.kicker': 'Latinoamérica · sin México ni Brasil', 'cl.title': 'Clientes potenciales',
      'cl.sub': 'Fabricantes y talleres que trabajan chapa y tubo, investigados uno por uno y priorizados por su encaje con TRUMPF.',
      'cl.kpi.clients': 'Prospectos', 'cl.kpi.A': 'Tier A', 'cl.kpi.countries': 'Países activos', 'cl.kpi.reps': 'Representantes',
      'cl.kpi.avg': 'Puntaje medio', 'cl.tiers': 'Distribución por prioridad', 'cl.countries': 'Países', 'cl.top': 'Mejores prospectos',
      'cl.sectors': 'Rubros más frecuentes', 'cl.back': 'Latinoamérica', 'cl.list': 'Empresas', 'cl.noCountry': 'Todavía no hay fichas publicadas para {name}.',
      'cl.noCountryHint': 'Los lotes de investigación se suman al mapa a medida que se revisan.', 'cl.intel': 'Mercado',
      'cl.pop': 'Población', 'cl.gdp': 'PIB', 'cl.growth': 'Crecimiento', 'cl.manuf': 'Industria / PIB', 'cl.mio': 'M', 'cl.bn': 'mil M',
      'cl.imports': 'Importación de máquinas de chapa {y}', 'cl.trumpf': 'Presencia TRUMPF', 'cl.excluded': 'México y Brasil quedan fuera: los atiende la filial TRUMPF.',
      'cl.allCountries': 'Ver todos', 'region.sudamerica': 'Sudamérica', 'region.centroamerica': 'Centroamérica', 'region.caribe': 'Caribe', 'region.norteamerica': 'Norteamérica', 'cl.kpi.repsShort': 'Repres.', 'cl.empty': 'Ningún prospecto coincide con los filtros.', 'cl.machinesN': '{n} máq.',
    },
    de: {
      'cl.kicker': 'Lateinamerika · ohne Mexiko und Brasilien', 'cl.title': 'Potenzielle Kunden',
      'cl.sub': 'Hersteller und Lohnfertiger für Blech und Rohr – einzeln recherchiert und nach ihrer Passung zu TRUMPF priorisiert.',
      'cl.kpi.clients': 'Interessenten', 'cl.kpi.A': 'Stufe A', 'cl.kpi.countries': 'Aktive Länder', 'cl.kpi.reps': 'Partner',
      'cl.kpi.avg': 'Ø Bewertung', 'cl.tiers': 'Verteilung nach Priorität', 'cl.countries': 'Länder', 'cl.top': 'Top-Interessenten',
      'cl.sectors': 'Häufigste Branchen', 'cl.back': 'Lateinamerika', 'cl.list': 'Unternehmen', 'cl.noCountry': 'Für {name} sind noch keine Profile veröffentlicht.',
      'cl.noCountryHint': 'Die Rechercheblöcke erscheinen auf der Karte, sobald sie geprüft sind.', 'cl.intel': 'Markt',
      'cl.pop': 'Bevölkerung', 'cl.gdp': 'BIP', 'cl.growth': 'Wachstum', 'cl.manuf': 'Industrie / BIP', 'cl.mio': 'Mio.', 'cl.bn': 'Mrd.',
      'cl.imports': 'Import von Blechbearbeitungsmaschinen {y}', 'cl.trumpf': 'TRUMPF Präsenz', 'cl.excluded': 'Mexiko und Brasilien sind ausgenommen: Sie werden von der TRUMPF Niederlassung betreut.',
      'cl.allCountries': 'Alle anzeigen', 'region.sudamerica': 'Südamerika', 'region.centroamerica': 'Mittelamerika', 'region.caribe': 'Karibik', 'region.norteamerica': 'Nordamerika', 'cl.kpi.repsShort': 'Partner', 'cl.empty': 'Kein Interessent entspricht den Filtern.', 'cl.machinesN': '{n} Masch.',
    },
  });

  /* ── Piezas reutilizables ───────────────────────────────────────────── */
  const place = (r) => [r.city, D().countryName(r.country)].filter(Boolean).join(' · ');
  VW.clientRow = function (c, o = {}) {
    const gs = D().groupsOf(c).slice(0, 4);
    const sec = (c.sectors || []).slice(0, 2).map(D().sectorName).join(' · ');
    return `<button type="button" class="crow" data-id="${u.esc(c.id)}" style="--i:${o.i || 0}">
      ${TL.ui.logo(c, 38)}
      <span class="crow-id"><b class="crow-n">${u.esc(c.name)}${c.isNew ? ` <em class="tag-new">${u.esc(t('ui.newAI'))}</em>` : ''}</b>
        <span class="crow-m">${o.flag ? TL.ui.flag(c.country, 14) : ''}${u.esc(o.flag ? place(c) : c.city || '')}${sec ? `<i>·</i>${u.esc(sec)}` : ''}</span></span>
      <span class="crow-g" aria-hidden="true">${gs.map((g) => `<i style="background:${D().groupColor(g)}" title="${u.esc(D().group(g).name)}"></i>`).join('')}</span>
      ${TL.ui.ring({ score: D().score(c), tier: c.tier || 'C', size: 38 })}
    </button>`;
  };
  /** Click → ficha; hover → anillo en el mapa. */
  VW.bindRows = function (root) {
    root.addEventListener('click', (e) => { const b = e.target.closest('[data-id]'); if (b && b.classList.contains('crow')) TL.nav.open(b.dataset.id); });
    root.addEventListener('mouseover', (e) => { const b = e.target.closest('.crow'); if (b) TL.map.setHover?.(D().rec(b.dataset.id)); });
    root.addEventListener('mouseleave', () => TL.map.setHover?.(null));
  };
  /** Render incremental: pinta de a `step` y suma más al acercarse al final. */
  VW.incremental = function (host, list, renderFn, step = 40) {
    let n = 0, io = null;
    const sentinel = u.h('div.inc-sentinel');
    const more = () => {
      const chunk = list.slice(n, n + step);
      host.insertAdjacentHTML('beforeend', chunk.map((x, i) => renderFn(x, n + i)).join(''));
      TL.ui.reveal(host);
      n += chunk.length;
      if (n >= list.length) { io?.disconnect(); sentinel.remove(); }
    };
    more();
    if (n < list.length) {
      host.after(sentinel);
      io = new IntersectionObserver((es) => es.some((e) => e.isIntersecting) && more(), { root: host.closest('.panel-scroll') || null, rootMargin: '400px' });
      io.observe(sentinel);
    }
    return () => io?.disconnect();
  };
  const head = (kicker, title, sub) => `<header class="pv-head"><p class="kicker mono">${kicker}</p><h2 class="pv-title">${title}</h2>${sub ? `<p class="pv-sub">${sub}</p>` : ''}</header>`;
  VW.head = head;
  const tierBar = (s, big) => {
    const n = Math.max(1, s.A + s.B + s.C);
    return `<div class="tbar${big ? ' tbar-lg' : ''}" role="img" aria-label="A ${s.A}, B ${s.B}, C ${s.C}">${['A', 'B', 'C'].map((k) => s[k] ? `<i class="tb-${k.toLowerCase()}" style="--w:${(s[k] / n) * 100}%"></i>` : '').join('')}</div>`;
  };
  VW.tierBar = tierBar;

  /* ── Región (sin país en foco) ──────────────────────────────────────── */
  function renderRegion(root) {
    const all = D().clients, vis = TL.filters.apply(all), s = D().stats(vis);
    const ranking = D().ranking();
    const withData = ranking.filter((k) => k.counts.clients > 0);
    const max = Math.max(1, ...ranking.map((k) => k.counts.clients));
    const countriesN = new Set(all.map((c) => c.country)).size;
    let showAll = false;
    const countryRow = (k, i) => {
      const c = k.counts;
      return `<button type="button" class="krow" data-cc="${k.cc}" style="--i:${i}">
        ${TL.ui.flag(k.cc, 20)}<span class="krow-n">${u.esc(D().countryName(k.cc))}</span>
        ${k.potential ? `<em class="pot pot-${k.potential}">${u.esc(t('potential.' + k.potential))}</em>` : ''}
        <span class="krow-bar"><span style="--w:${(c.clients / max) * 100}%">${tierBar(c)}</span></span>
        <b class="krow-c num">${c.clients}</b></button>`;
    };
    root.innerHTML = head(u.esc(t('cl.kicker')), u.esc(t('cl.title')), u.esc(t('cl.sub'))) + `
      <section class="pv-sec kpis">${TL.ui.kpi({ label: t('cl.kpi.clients'), value: s.n })}${TL.ui.kpi({ label: t('cl.kpi.A'), value: s.A, accent: true })}${TL.ui.kpi({ label: t('cl.kpi.countries'), value: countriesN })}${TL.ui.kpi({ label: t('cl.kpi.reps'), value: D().reps.length })}</section>
      <section class="pv-sec"><h3 class="h-sec">${u.esc(t('cl.tiers'))}</h3>${tierBar(s, true)}
        <div class="tleg">${['A', 'B', 'C'].map((k) => `<span><i class="sw dot ${k.toLowerCase()}"></i>${u.esc(t('tier.' + k))} <b class="num">${s[k]}</b><em>${u.esc(t('tier.' + k + '.long'))}</em></span>`).join('')}</div></section>
      <section class="pv-sec"><h3 class="h-sec">${u.esc(t('cl.countries'))}<span class="h-aux num">${withData.length}/${ranking.length}</span></h3><div class="klist"></div>
        ${ranking.length > withData.length ? `<button type="button" class="btn btn-sm btn-ghost k-all">${u.esc(t('cl.allCountries'))}</button>` : ''}
        <p class="note">${TL.ui.icon('info')}<span>${u.esc(t('cl.excluded'))}</span></p></section>
      <section class="pv-sec"><h3 class="h-sec">${u.esc(t('cl.top'))}</h3><div class="clist top"></div></section>
      <section class="pv-sec"><h3 class="h-sec">${u.esc(t('cl.sectors'))}</h3><div class="secs"></div></section>`;
    const klist = root.querySelector('.klist');
    const paintK = () => { const l = showAll ? ranking : (withData.length ? withData : ranking.slice(0, 10)); klist.innerHTML = l.map(countryRow).join(''); };
    paintK();
    root.querySelector('.k-all')?.addEventListener('click', (e) => { showAll = !showAll; e.currentTarget.textContent = showAll ? t('ui.less') : t('cl.allCountries'); paintK(); });
    klist.addEventListener('click', (e) => { const b = e.target.closest('[data-cc]'); if (b) TL.nav.country(b.dataset.cc); });
    let hov = null;
    const fs = (cc, on) => { try { TL.map.instance?.setFeatureState({ source: 'countries', id: cc }, { hover: on }); } catch (err) { /* noop */ } };
    klist.addEventListener('mouseover', (e) => { const b = e.target.closest('[data-cc]'); const cc = b?.dataset.cc || null; if (cc === hov) return; if (hov) fs(hov, false); hov = cc; if (cc) fs(cc, true); });
    klist.addEventListener('mouseleave', () => { if (hov) fs(hov, false); hov = null; });
    const top = TL.filters.sorter(vis).slice(0, 8);
    const tl = root.querySelector('.clist.top');
    tl.innerHTML = top.length ? top.map((c, i) => VW.clientRow(c, { i, flag: true })).join('') : String(TL.ui.empty(t(all.length ? 'cl.empty' : 'ui.noResults'), 'clients'));
    VW.bindRows(tl);
    const secs = D().topSectors(vis, 10), smax = Math.max(1, ...secs.map((x) => x.count));
    root.querySelector('.secs').innerHTML = secs.map((x) => `<button type="button" class="srow" data-s="${u.esc(x.key)}" aria-pressed="${TL.filters.get().sectors.includes(x.key)}"><span>${u.esc(x.name)}</span><i style="--w:${(x.count / smax) * 100}%"></i><b class="num">${x.count}</b></button>`).join('');
    root.querySelector('.secs').addEventListener('click', (e) => { const b = e.target.closest('[data-s]'); if (b) TL.filters.toggle('sectors', b.dataset.s); });
    return () => { if (hov) fs(hov, false); };
  }

  /* ── País en foco ───────────────────────────────────────────────────── */
  function intelBlock(k) {
    const it = k.intel; if (!it) return '';
    const e = it.economy || {};
    const cell = (l, v) => (v == null || v === '' ? '' : `<div><span>${u.esc(l)}</span><b class="num">${v}</b></div>`);
    const imp = it.imports?.items?.length ? u.sum(it.imports.items, (x) => x.usd) : 0;
    const text = I().pick(it, 'metalworking');
    const tp = it.trumpf_presence;
    return `<section class="pv-sec intel"><h3 class="h-sec">${u.esc(t('cl.intel'))}${e.year ? `<span class="h-aux num">${e.year}</span>` : ''}</h3>
      <div class="intel-grid">${cell(t('cl.pop'), e.population_m != null ? I().dec(e.population_m, 1) + ' ' + t('cl.mio') : null)}${cell(t('cl.gdp'), e.gdp_usd_bn != null ? 'US$ ' + I().int(e.gdp_usd_bn) + ' ' + t('cl.bn') : null)}${cell(t('cl.growth'), e.gdp_growth_pct != null ? I().dec(e.gdp_growth_pct, 1) + ' %' : null)}${cell(t('cl.manuf'), e.manufacturing_pct_gdp != null ? I().dec(e.manufacturing_pct_gdp, 1) + ' %' : null)}</div>
      ${imp ? `<p class="intel-imp"><span>${u.esc(t('cl.imports', { y: it.imports.year || '' }))}</span><b class="num">${I().usd(imp)}</b></p>` : ''}
      ${text ? `<p class="intel-txt clamp-4">${u.esc(text)}</p>` : ''}
      ${tp && tp.status && !k.trumpf_rep ? `<p class="intel-tp">${TL.ui.icon('badge')}<span><b>${u.esc(t('cl.trumpf'))}:</b> ${u.esc(tp.partner || tp.status)}</span></p>` : ''}</section>`;
  }
  /* Bloques de la ficha de país: representante TRUMPF, oportunidades del radar, ferias y competencia */
  const L = (es, de) => (TL.state.lang === 'de' ? de : es);
  function repBlock(k) {
    const r = k.trumpf_rep; if (!r) return '';
    const plate = r.logo_bg === 'dark' ? '#0D1520' : '#FFFFFF';
    const logo = r.logo ? `<span class="cc-rep-logo" style="background:${plate}"><img src="${u.esc(r.logo)}" alt="" loading="lazy" decoding="async"></span>` : `<span class="cc-rep-logo cc-rep-ini">${u.esc((r.name || '?').slice(0, 2).toUpperCase())}</span>`;
    const kind = r.type === 'filial' ? L('Filial TRUMPF', 'TRUMPF-Tochtergesellschaft') : L('Representante oficial TRUMPF', 'Offizieller TRUMPF-Vertriebspartner');
    return `<section class="pv-sec cc-rep">${logo}<div><p class="cc-rep-k mono">${u.esc(kind)}</p><p class="cc-rep-n">${u.esc(r.name)}</p>${r.address ? `<p class="cc-rep-a">${u.esc(r.address)}</p>` : ''}${r.url ? `<a href="${u.esc(r.url)}" target="_blank" rel="noopener">${u.esc(r.url.replace(/^https?:\/\/(www\.)?/, ''))}</a>` : ''}</div></section>`;
  }
  function oppsBlock(cc) {
    const list = (D().opps || []).filter((o) => o.country === cc).sort((a, b) => (b.amount_usd || 0) - (a.amount_usd || 0));
    if (!list.length) return '';
    const st = (s) => ({ anunciado: L('Anunciado', 'Angekündigt'), licitacion: L('En licitación', 'Ausschreibung'), adjudicado: L('Adjudicado', 'Vergeben'), en_construccion: L('En construcción', 'Im Bau') }[s] || s || '');
    const rows = list.map((o) => `<li class="cc-opp"><div><b>${u.esc(I().pick(o, 'title') || '')}</b><span>${u.esc([st(o.status), o.date, o.city].filter(Boolean).join(' · '))}</span></div><div class="cc-opp-r">${o.amount_usd ? `<b class="num">${I().usd(o.amount_usd)}</b>` : (o.amount_text ? `<em>${u.esc(o.amount_text)}</em>` : '')}${o.source_url ? `<a href="${u.esc(o.source_url)}" target="_blank" rel="noopener">${u.esc(L('Fuente', 'Quelle'))}</a>` : ''}</div></li>`).join('');
    return `<section class="pv-sec cc-opps"><h3 class="h-sec">${u.esc(L('Oportunidades de inversión', 'Investitionschancen'))}<span class="h-aux num">${list.length}</span></h3><ul>${rows}</ul></section>`;
  }
  function fairsBlock(k) {
    const f = (k.intel?.fairs || []).filter((x) => x && x.name); if (!f.length) return '';
    return `<section class="pv-sec cc-fairs"><h3 class="h-sec">${u.esc(L('Ferias y fechas clave', 'Messen und wichtige Termine'))}</h3><ul>${f.map((x) => `<li><b>${x.url ? `<a href="${u.esc(x.url)}" target="_blank" rel="noopener">${u.esc(x.name)}</a>` : u.esc(x.name)}</b><span>${u.esc([x.month, x.city].filter(Boolean).join(' · '))}</span></li>`).join('')}</ul></section>`;
  }
  function compBlock(k) {
    const c = (k.intel?.competitors || []).filter((x) => x && x.brand && x.presence && !/sin_presencia/.test(x.presence)); if (!c.length) return '';
    const pr = (p) => ({ filial: L('filial', 'Tochter'), distribuidor: L('distribuidor', 'Händler') }[p] || p);
    return `<section class="pv-sec cc-comp"><h3 class="h-sec">${u.esc(L('Competencia presente', 'Präsenter Wettbewerb'))}</h3><div class="cc-chips">${c.map((x) => `<span class="cc-chip"><b>${u.esc(x.brand)}</b>${u.esc(pr(x.presence))}${x.partner ? ' · ' + u.esc(String(x.partner).replace(/\s*\(.*\)\s*$/, '')) : ''}</span>`).join('')}</div></section>`;
  }
  function renderCountry(root, cc) {
    const k = D().country(cc); if (!k) return renderRegion(root);
    const base = D().clientsOf(cc), c = k.counts;
    root.innerHTML = `<button type="button" class="pv-back">${TL.ui.icon('back')}<span>${u.esc(t('cl.back'))}</span></button>
      <header class="pv-head pv-head-cc"><p class="kicker mono">${TL.ui.flag(cc, 18)}<span>${u.esc(cc)}${k.region ? ' · ' + u.esc(t('region.' + k.region)) : ''}</span></p>
        <h2 class="pv-title">${u.esc(D().countryName(cc))}</h2>
        ${k.potential ? `<p class="pv-sub"><em class="pot pot-${k.potential}">${u.esc(t('potential.' + k.potential))}</em></p>` : ''}
        <button type="button" class="btn btn-sm cp-open" data-country-open="${u.esc(cc)}">${u.esc(L('Ver ficha completa del país', 'Vollständiges Länderprofil'))} →</button></header>
      <section class="pv-sec kpis kpis-5">${TL.ui.kpi({ label: t('cl.kpi.clients'), value: c.clients })}${TL.ui.kpi({ label: 'A', value: c.A, accent: true })}${TL.ui.kpi({ label: 'B', value: c.B })}${TL.ui.kpi({ label: 'C', value: c.C })}${TL.ui.kpi({ label: t('cl.kpi.repsShort'), value: c.reps })}</section>
      ${repBlock(k)}${intelBlock(k)}${oppsBlock(cc)}${fairsBlock(k)}${compBlock(k)}
      <section class="pv-sec pv-list"><h3 class="h-sec">${u.esc(t('cl.list'))}</h3><div class="flt-host"></div><div class="clist"></div></section>`;
    root.querySelector('.pv-back').addEventListener('click', () => TL.nav.region());
    const list = root.querySelector('.clist');
    VW.bindRows(list);
    if (!base.length) {
      list.innerHTML = `<div class="empty empty-lg">${TL.ui.icon('clients')}<p>${u.esc(t('cl.noCountry', { name: D().countryName(cc) }))}</p><span>${u.esc(t('cl.noCountryHint'))}</span></div>`;
      return null;
    }
    let bar = null, stop = null;
    const paint = () => {
      stop?.();
      const host = root.querySelector('.flt-host');
      host.innerHTML = ''; bar = TL.filtersUI.bar(host, base);
      const items = TL.filters.sorter(TL.filters.apply(base));
      TL.filtersUI.setCount(bar, items.length);
      list.innerHTML = '';
      if (!items.length) { list.innerHTML = String(TL.ui.empty(t('cl.empty'), 'filter')); return; }
      stop = VW.incremental(list, items, (x, i) => VW.clientRow(x, { i: i % 40 }));
    };
    paint();
    const keepFocus = () => { const a = document.activeElement; const inSearch = a && a.matches('.flt-search input'); const pos = inSearch ? a.selectionStart : 0; paint(); if (inSearch) { const i = root.querySelector('.flt-search input'); i.focus(); i.setSelectionRange(pos, pos); } };
    const off1 = TL.on('filters', keepFocus), off2 = TL.on('filters:sort', keepFocus);
    return () => { off1(); off2(); stop?.(); };
  }

  TL.views.register({
    id: 'clients', order: 10, icon: 'clients', label: 'rail.clients', kind: 'panel', mapMode: 'clients',
    render(root, ctx) {
      if (ctx.country) return renderCountry(root, ctx.country);
      const off = TL.on('filters', () => { if (!TL.state.country && TL.state.view === 'clients') TL.panel.render({ keepScroll: true, soft: true }); });
      const c = renderRegion(root);
      return () => { off(); c?.(); };
    },
    legend: () => TL.filtersUI.clientLegend(),
  });
})();
