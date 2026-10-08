/* ==========================================================================
   tl-views-more.js — vistas del riel: Representantes (20), Competencia (30) y
   Radar de oportunidades (40). Panel derecho; el mapa cambia de modo vía mapMode.
   Prefijo i18n 'vm.*', prefijo CSS '.vm-*' (css/views.css).
   ========================================================================== */
(function () {
  'use strict';
  const { u } = TL;
  const html = u.html, raw = u.raw;
  const t = (k, v) => TL.i18n.t(k, v);
  const tn = (k, n, v) => TL.i18n.tn(k, n, v);
  const D = TL.data;
  const PAGE = 40;

  /* ── Íconos propios (solo se agregan si el núcleo no los tiene) ─────── */
  const ICONS = {
    wrench: '<path d="M12.8 3.2a3.9 3.9 0 0 0-4.6 5.1L3.4 13.1a1.6 1.6 0 0 0 2.3 2.3l4.8-4.8a3.9 3.9 0 0 0 5.1-4.6l-2.2 2.2-2-.4-.4-2z"/>',
    vm_dc: '<rect x="4" y="3" width="12" height="4.2"/><rect x="4" y="7.9" width="12" height="4.2"/><rect x="4" y="12.8" width="12" height="4.2"/><path d="M6.6 5.1h.1M6.6 10h.1M6.6 14.9h.1M10 5.1h3.4M10 10h3.4M10 14.9h3.4"/>',
    vm_mine: '<path d="M3.5 16.5 11 9"/><path d="M8.4 4.2c3.2-.9 6.2.2 8.1 2.6-2.6-1-5-1-7.3.2"/><path d="m9.6 5.6 4.8 4.8"/>',
    vm_energy: '<path d="M11.2 2.8 4.8 11.2h4.6l-.8 6 6.6-8.6H10.6z"/>',
    vm_transport: '<rect x="2.8" y="5.5" width="9.4" height="7.6"/><path d="M12.2 8h2.9l2.1 2.7v2.4h-5"/><circle cx="6" cy="14.6" r="1.5"/><circle cx="14.3" cy="14.6" r="1.5"/>',
    vm_infra: '<path d="M2.5 15.5h15M4 15.5V9.5M16 15.5V9.5M2.5 9.5h15M4 9.5c2-3.4 10-3.4 12 0M8 9.5v6M12 9.5v6"/>',
    vm_house: '<path d="M3.5 9.2 10 3.6l6.5 5.6"/><path d="M5.2 8v8.5h9.6V8M8.6 16.5v-4.4h2.8v4.4"/>',
    vm_health: '<rect x="3.2" y="3.2" width="13.6" height="13.6"/><path d="M10 6.6v6.8M6.6 10h6.8"/>',
    vm_agro: '<path d="M10 17V8.4"/><path d="M10 11.4c-3.6 0-5.6-2.4-5.6-5.6 3.4 0 5.6 2.2 5.6 5.6zM10 9.6c0-3.4 2.2-5.6 5.6-5.6 0 3.2-2 5.6-5.6 5.6z"/>',
  };
  Object.keys(ICONS).forEach((k) => { if (!TL.ui.icons[k]) TL.ui.icons[k] = ICONS[k]; });

  /* ── Utilidades de vista ────────────────────────────────────────────── */
  const ic = (n, cls) => TL.ui.icon(n, cls);
  const flag = (cc, w) => TL.ui.flag(cc, w);
  const kpi = (o) => (TL.ui.kpi ? TL.ui.kpi(o)
    : html`<div class="kpi"><span class="kpi-l">${o.label}</span><b class="kpi-v num" data-count="${o.value}" data-dec="${o.decimals || 0}">0</b>${o.suffix ? raw(`<i class="kpi-s">${u.esc(o.suffix)}</i>`) : ''}${o.sub ? raw(`<span class="kpi-sub">${u.esc(o.sub)}</span>`) : ''}</div>`);
  const empty = (text, icon) => (TL.ui.empty ? TL.ui.empty(text, icon) : html`<div class="empty">${ic(icon || 'info')}<p>${text}</p></div>`);
  /** Encabezado de vista; con cc → botón "volver a la región" + kicker con bandera (como la vista Clientes). */
  const head = (kicker, title, sub, cc) => cc
    ? html`<button type="button" class="pv-back" data-act="region">${ic('back')}<span>${t('vm.region')}</span></button>
      <header class="pv-head pv-head-cc vm-head"><p class="kicker mono">${flag(cc, 18)}<span>${cc} · ${kicker}</span></p><h2 class="pv-title">${title}</h2>${sub ? html`<p class="pv-sub">${sub}</p>` : ''}</header>`
    : html`<header class="pv-head vm-head"><p class="kicker">${kicker}</p><h2 class="pv-title">${title}</h2>${sub ? html`<p class="pv-sub">${sub}</p>` : ''}</header>`;
  const aux = (n) => html`<span class="h-aux num">${n}</span>`;
  const sec = (title, body, { cls = '', aside = '' } = {}) => html`<section class="pv-sec vm-sec ${cls}"><h3 class="h-sec">${title}${aside}</h3>${body}</section>`;
  const place = (r, withCountry) => [r.city, withCountry ? D.countryName(r.country) : ''].filter(Boolean).join(' · ');
  const pct = (a, b) => (b ? a / b : 0);

  /** Chips de marca con color del grupo (máx n + "+k"). */
  function brandChips(list, max = 4) {
    const seen = new Set(), out = [];
    (list || []).forEach((m) => {
      const key = String(m.brand || '').trim().toLowerCase(); if (!key || seen.has(key)) return; seen.add(key);
      const g = D.groupOfBrand(m.brand, m.brand_group);
      out.push(html`<span class="vm-chip${g === 'trumpf' ? ' is-trumpf' : ''}" title="${D.group(g).name}"><i style="background:${D.groupColor(g)}"></i>${m.brand}</span>`);
    });
    const more = out.length - max;
    return raw(out.slice(0, max).join('') + (more > 0 ? `<span class="vm-chip vm-chip-more num">+${more}</span>` : ''));
  }

  function goRegion() {
    if (TL.nav?.region) return TL.nav.region();
    TL.set({ country: null });
    TL.map?.home?.();
  }

  /**
   * Lista incremental: pinta de a PAGE filas y agrega un botón "Mostrar n más".
   * rowFn(item, i) → SafeHtml | string.
   */
  function incremental(host, items, rowFn, page = PAGE) {
    let shown = 0;
    const list = u.h('div.vm-list');
    const btn = u.h('button.btn.btn-ghost.btn-sm.vm-more', { type: 'button' });
    host.appendChild(list);
    const step = () => {
      const next = items.slice(shown, shown + page);
      list.insertAdjacentHTML('beforeend', next.map((x, i) => String(rowFn(x, shown + i))).join(''));
      list.querySelectorAll('.vm-row:not([style*="--i"])').forEach((el, i) => el.style.setProperty('--i', Math.min(i, 12)));
      shown += next.length;
      const rest = items.length - shown;
      if (rest > 0) { btn.textContent = t('ui.showMore', { n: TL.i18n.int(Math.min(rest, page)) }); if (!btn.isConnected) host.appendChild(btn); }
      else btn.remove();
      TL.ui.reveal(list);
    };
    btn.addEventListener('click', step);
    step();
    return { list, ensure(idx) { while (shown <= idx && shown < items.length) step(); } };
  }

  /** Delegación de clicks: [data-open] → ficha; [data-cc] → país; [data-act] → acción local. */
  function delegate(root, actions = {}) {
    root.addEventListener('click', (e) => {
      const a = e.target.closest('a[href]'); if (a) return;
      const act = e.target.closest('[data-act]');
      if (act && root.contains(act) && actions[act.dataset.act]) { actions[act.dataset.act](act, e); return; }
      const op = e.target.closest('[data-open]');
      if (op && root.contains(op)) { TL.nav.open(op.dataset.open, { fly: true }); return; }
      const cc = e.target.closest('[data-cc]');
      if (cc && root.contains(cc)) TL.nav.country(cc.dataset.cc);
    });
  }
  // @@END-VM-1

  /* ══════════════════════════════════════════════════════════════════════
     1) REPRESENTANTES
     ══════════════════════════════════════════════════════════════════════ */
  const repSort = (a, b) => D.score(b) - D.score(a) || String(a.name).localeCompare(String(b.name));
  const conflictOf = (r) => {
    const c = r.competitor_conflict || {};
    if (!c.conflict) return null;
    const brands = (c.brands || []).filter(Boolean);
    return brands.length ? t('vm.reps.conflict', { brands: brands.join(', ') }) : t('vm.reps.conflictGeneric');
  };

  function repRow(r, i, withCountry) {
    const short = !!r.shortlist, conf = conflictOf(r), svc = r.service?.has_service;
    const why = short ? TL.i18n.pick(r, 'shortlist_rationale') : '';
    return html`<button type="button" class="vm-row vm-rep${short ? ' is-short' : ''}" data-open="${r.id}">
      ${TL.ui.logo(r, 40)}
      <span class="vm-main">
        <span class="vm-name">${r.name}</span>
        <span class="vm-meta">${withCountry ? flag(r.country, 14) : ''}${place(r, withCountry) || t('ui.unknown')}</span>
        ${why ? html`<span class="vm-why">${why}</span>` : ''}
        ${(r.brands || []).length ? html`<span class="vm-chips">${brandChips(r.brands, 4)}</span>` : ''}
        <span class="vm-flags">
          <span class="vm-svc${svc ? ' is-yes' : ''}" title="${svc ? t('vm.reps.service') : t('vm.reps.noService')}">${ic(svc ? 'wrench' : 'minus')}${svc ? t('vm.reps.service') : t('vm.reps.noService')}</span>
          ${conf ? html`<span class="vm-conflict" title="${TL.i18n.pick(r.competitor_conflict, 'note') || conf}">${ic('warn')}${conf}</span>` : ''}
        </span>
      </span>
      <span class="vm-score" title="${t('vm.reps.fit')}">${TL.ui.ring({ score: D.score(r), tier: r.tier || 'C', size: 40 })}</span>
    </button>`;
  }

  function repKpis(list, region) {
    const countries = u.unique(list.map((r) => r.country)).length;
    return html`<section class="pv-sec kpis vm-kpis">
      ${kpi({ label: t('vm.reps.k.total'), value: list.length })}
      ${kpi({ label: t('vm.reps.k.short'), value: list.filter((r) => r.shortlist).length })}
      ${region ? kpi({ label: t('vm.reps.k.countries'), value: countries })
        : kpi({ label: t('vm.reps.k.noConflict'), value: list.filter((r) => !r.competitor_conflict?.conflict).length })}
      ${kpi({ label: t('vm.reps.k.service'), value: list.filter((r) => r.service?.has_service).length })}
    </section>`;
  }

  function renderRepsRegion(root) {
    const all = D.reps.slice().sort(repSort);
    const targets = D.countries.filter((k) => k.rep_target || (k.rep_target == null && k.role === 'target'));
    const rows = targets.map((k) => {
      const reps = D.repsOf(k.cc);
      return { cc: k.cc, n: reps.length, s: reps.filter((r) => r.shortlist).length, best: reps.slice().sort(repSort)[0] };
    });
    const withReps = rows.filter((x) => x.n).sort((a, b) => b.s - a.s || b.n - a.n || D.countryName(a.cc).localeCompare(D.countryName(b.cc), TL.i18n.lang));
    const pending = rows.filter((x) => !x.n).sort((a, b) => D.countryName(a.cc).localeCompare(D.countryName(b.cc), TL.i18n.lang));
    const maxN = Math.max(1, ...withReps.map((x) => x.n));
    const shortlist = all.filter((r) => r.shortlist);

    root.insertAdjacentHTML('beforeend', String(html`
      ${head(t('vm.reps.kicker'), t('vm.reps.title'), t('vm.reps.subRegion'))}
      ${repKpis(all, true)}`));

    const shortSec = u.el(String(sec(t('vm.reps.shortlist'), shortlist.length ? '' : empty(t('vm.reps.emptyRegion'), 'reps'),
      { aside: shortlist.length ? aux(shortlist.length) : '' })));
    root.appendChild(shortSec);
    if (shortlist.length) incremental(shortSec, shortlist, (r, i) => repRow(r, i, true));

    if (withReps.length) {
      root.insertAdjacentHTML('beforeend', String(sec(t('vm.reps.byCountry'), html`<div class="vm-clist">${withReps.map((x, i) => html`
        <button type="button" class="vm-crow vm-row" data-cc="${x.cc}" style="--i:${Math.min(i, 12)}">
          ${flag(x.cc, 20)}
          <span class="vm-cname">${D.countryName(x.cc)}<i>${x.best ? x.best.name : ''}</i></span>
          <span class="vm-cbar" aria-hidden="true"><i style="--w:${(x.n / maxN).toFixed(3)}"></i><b style="--w:${(x.s / maxN).toFixed(3)}"></b></span>
          <span class="vm-cnum num">${x.n}</span>
          <span class="vm-cshort num" title="${tn('vm.reps.nShort', x.s)}"><i class="vm-dia is-short"></i>${x.s}</span>
          ${ic('next', 'vm-chev')}
        </button>`)}</div>`)));
    }
    if (pending.length) {
      root.insertAdjacentHTML('beforeend', String(sec(t('vm.reps.pending'), html`<div class="vm-pending">${pending.map((x) => html`
        <button type="button" class="vm-pchip" data-cc="${x.cc}">${flag(x.cc, 14)}${D.countryName(x.cc)}</button>`)}</div>`,
        { aside: aux(pending.length) })));
    }
  }

  function renderRepsCountry(root, cc) {
    const list = D.repsOf(cc).slice().sort(repSort);
    const short = list.filter((r) => r.shortlist), rest = list.filter((r) => !r.shortlist);
    const name = D.countryName(cc);
    root.insertAdjacentHTML('beforeend', String(html`
      ${head(t('vm.reps.kicker'), name, t('vm.reps.subCountry', { country: name }), cc)}
      ${list.length ? repKpis(list, false) : ''}`));
    if (!list.length) {
      root.insertAdjacentHTML('beforeend', String(html`<section class="pv-sec vm-sec">${empty(t('vm.reps.empty', { country: name }), 'reps')}</section>`));
      return;
    }
    if (short.length) {
      const s1 = u.el(String(sec(t('vm.reps.shortlist'), '', { cls: 'vm-sec-short', aside: aux(short.length) })));
      root.appendChild(s1);
      incremental(s1, short, (r, i) => repRow(r, i, false));
    }
    if (rest.length) {
      const s2 = u.el(String(sec(short.length ? t('vm.reps.others') : t('vm.reps.title'), '', { aside: aux(rest.length) })));
      root.appendChild(s2);
      incremental(s2, rest, (r, i) => repRow(r, i, false));
    }
  }

  TL.views.register({
    id: 'reps', order: 20, icon: 'reps', label: 'rail.reps', kind: 'panel', group: 'main', mapMode: 'reps',
    render(container, ctx) {
      const root = u.h('div.vm.vm-reps');
      container.appendChild(root);
      const cc = ctx?.country ?? TL.state.country;
      if (cc) renderRepsCountry(root, cc); else renderRepsRegion(root);
      delegate(root, { region: goRegion });
    },
    legend() {
      return html`<div class="legend-title">${t('vm.reps.legend')}</div><div class="legend-row">
        <span class="legend-item"><i class="vm-dia is-short"></i>${t('vm.reps.lgShort')}</span>
        <span class="legend-item"><i class="vm-dia"></i>${t('vm.reps.lgRep')}</span></div>`;
    },
  });
  // @@END-VM-2

  /* ══════════════════════════════════════════════════════════════════════
     2) COMPETENCIA
     ══════════════════════════════════════════════════════════════════════ */
  const sumObj = (o) => Object.values(o || {}).reduce((a, b) => a + (+b || 0), 0);
  /** Orden de grupos: TRUMPF primero ("ya cliente"), luego por volumen global. */
  function groupOrder(total) {
    return Object.keys(total).filter((g) => total[g] > 0)
      .sort((a, b) => (a === 'trumpf' ? -1 : b === 'trumpf' ? 1 : total[b] - total[a] || a.localeCompare(b)));
  }
  const groupLabel = (g) => (g === 'trumpf' ? D.group(g).name + ' · ' + t('vm.comp.alreadyClient') : D.group(g).name);

  /** Motivos de reemplazo de un cliente: plasma / co2 / china / competitor / old. */
  function reasons(c) {
    const r = new Set();
    (c.machines || []).forEach((m) => {
      const g = D.groupOfBrand(m.brand, m.brand_group);
      const txt = u.norm([m.type, m.model, m.kind, m.evidence].join(' '));
      if (txt.includes('plasma') || g === 'corte_termico') r.add('plasma');
      if (/\bco2\b|co₂/.test(txt)) r.add('co2');
      if (g === 'china') r.add('china');
      if (['premium_eu', 'japon', 'turquia', 'usa'].includes(g)) r.add('competitor');
      if (/antig|viej|usad|\bold\b/.test(txt)) r.add('old');
    });
    if (!r.size && (c.score?.upgrade || 0) >= 12) r.add('old');
    return ['plasma', 'co2', 'china', 'old', 'competitor'].filter((k) => r.has(k));
  }
  const REASON_TONE = { plasma: 'amber', co2: 'amber', china: 'china', old: 'muted', competitor: 'steel' };

  function replRow(c) {
    const rs = reasons(c);
    return html`<button type="button" class="vm-row vm-repl" data-open="${c.id}">
      ${TL.ui.logo(c, 38)}
      <span class="vm-main">
        <span class="vm-name">${c.name}</span>
        <span class="vm-meta">${flag(c.country, 14)}${place(c, true)}</span>
        ${rs.length ? html`<span class="vm-reasons">${rs.map((k) => html`<span class="vm-reason" data-tone="${REASON_TONE[k]}"${k === 'china' ? raw(` style="--c:${D.groupColor('china')}"`) : ''}>${t('vm.comp.reason.' + k)}</span>`)}</span>` : ''}
        ${(c.machines || []).length ? html`<span class="vm-chips">${brandChips(c.machines, 4)}</span>` : ''}
      </span>
      <span class="vm-score">${TL.ui.ring({ score: D.score(c), tier: c.tier || 'C', size: 40 })}</span>
    </button>`;
  }

  function stackBar(obj, order, max) {
    const tot = sumObj(obj);
    const segs = order.filter((g) => obj[g] > 0).map((g) => html`<i class="vm-seg" data-g="${g}" style="flex-grow:${obj[g]};background:${D.groupColor(g)}" title="${D.group(g).name}: ${TL.i18n.int(obj[g])}"></i>`);
    return html`<span class="vm-stack" style="--w:${max ? (tot / max).toFixed(4) : 0}">${segs}</span>`;
  }

  function renderCompetition(root, cc) {
    const ib = D.installedBase();
    const base = cc ? ib.byCountry[cc] || {} : ib.total;
    const order = groupOrder(ib.total);
    const nMach = sumObj(base);
    const clients = cc ? D.clientsOf(cc) : D.clients;
    const withTrumpf = clients.filter((c) => D.hasTrumpf(c)).length;
    const replAll = D.replacementList(cc || undefined);
    const chinaShare = pct(base.china || 0, nMach);
    const name = cc ? D.countryName(cc) : '';
    const hasNone = clients.some((c) => !(c.machines || []).length);

    root.insertAdjacentHTML('beforeend', String(html`
      ${head(t('vm.comp.kicker'), cc ? name : t('vm.comp.title'), t('vm.comp.sub'), cc)}
      <section class="pv-sec kpis vm-kpis">
        ${kpi({ label: t('vm.comp.k.machines'), value: nMach })}
        ${kpi({ label: t('vm.comp.k.china'), value: Math.round(chinaShare * 100), suffix: '%', sub: t('vm.comp.k.chinaSub') })}
        ${kpi({ label: t('vm.comp.k.trumpf'), value: withTrumpf })}
        ${kpi({ label: t('vm.comp.k.replace'), value: replAll.length })}
      </section>`));

    /* Marcas por NOMBRE (no solo por grupo) + presencia comercial de cada marca por país */
    {
      const L = (es, de) => (TL.state.lang === 'de' ? de : es);
      const bc = {};
      for (const c of clients) for (const m of c.machines || []) {
        const b = String(m.brand || '').trim(); if (!b) continue;
        const o = (bc[b] ||= { n: 0, cos: new Set(), g: D.groupOfBrand(m.brand, m.brand_group), pres: [] }); o.n++; o.cos.add(c.id);
      }
      for (const k of D.countries) {
        if (cc && k.cc !== cc) continue;
        for (const x of (k.intel?.competitors || [])) {
          if (!x.brand || !x.presence || /sin_presencia/.test(x.presence)) continue;
          const o = (bc[x.brand] ||= { n: 0, cos: new Set(), g: D.groupOfBrand(x.brand), pres: [] });
          o.pres.push(`${D.countryName(k.cc)} · ${x.presence === 'filial' ? L('filial', 'Tochter') : L('distribuidor', 'Händler')}${x.partner ? ' (' + String(x.partner).replace(/\s*\(.*\)\s*$/, '') + ')' : ''}`);
        }
      }
      const rows = Object.entries(bc).sort((a, b) => (b[1].n - a[1].n) || (b[1].pres.length - a[1].pres.length));
      const branded = clients.filter((c) => (c.machines || []).some((m) => String(m.brand || '').trim())).length;
      const noPub = clients.length ? Math.round((1 - branded / clients.length) * 100) : 0;
      if (rows.length) root.insertAdjacentHTML('beforeend', String(sec(L('Marcas identificadas', 'Erkannte Marken'), html`<ul class="vm-brands">${rows.map(([b, o]) => html`<li>
          <span class="vm-b-name"><i style="background:${D.groupColor(o.g)}"></i><b>${b}</b><em>${groupLabel(o.g)}</em></span>
          <span class="vm-b-n">${o.n ? html`<b class="num">${o.n}</b> ${L(o.n === 1 ? 'máquina' : 'máquinas', o.n === 1 ? 'Maschine' : 'Maschinen')} · ${o.cos.size} ${L(o.cos.size === 1 ? 'empresa' : 'empresas', o.cos.size === 1 ? 'Firma' : 'Firmen')}` : ''}</span>
          ${o.pres.length ? html`<span class="vm-b-pres">${o.pres.join(' · ')}</span>` : ''}</li>`)}</ul>
        <p class="note">${L(`El ${noPub} % de las empresas no publica la marca de sus máquinas: es un dato para validar en cada visita.`, `${noPub} % der Firmen veröffentlichen die Marke ihrer Maschinen nicht – bei jedem Besuch zu validieren.`)}</p>`)));
    }

    /* Filtro por grupo de marca → filtros globales (mapa + listas) */
    const sel0 = TL.filters.get().brands || [];
    const chipKeys = order.filter((g) => !cc || base[g] > 0 || sel0.includes(g)).concat(hasNone || sel0.includes('none') ? ['none'] : []);
    if (order.length) {
      root.insertAdjacentHTML('beforeend', String(sec(t('vm.comp.filter'), html`<div class="vm-fchips" role="group" aria-label="${t('vm.comp.filter')}">
        <button type="button" class="vm-fchip" data-act="brand" data-g="" aria-pressed="false">${t('ui.all')}</button>
        ${chipKeys.map((g) => html`<button type="button" class="vm-fchip" data-act="brand" data-g="${g}" aria-pressed="false">
          <i style="background:${g === 'none' ? 'transparent' : D.groupColor(g)}"${g === 'none' ? raw(' class="is-none"') : ''}></i>${g === 'none' ? t('comp.none') : groupLabel(g)}${g !== 'none' ? html`<b class="num">${TL.i18n.int(base[g] || 0)}</b>` : ''}</button>`)}
      </div>`, { cls: 'vm-sec-filter' })));
    }

    /* Base instalada: barras apiladas por país (o desglose del país en foco) */
    let baseBody;
    if (!nMach) baseBody = empty(t('vm.comp.emptyBase'), 'competition');
    else if (!cc) {
      const rows = Object.keys(ib.byCountry).map((k) => ({ cc: k, n: sumObj(ib.byCountry[k]) })).filter((x) => x.n).sort((a, b) => b.n - a.n);
      const max = rows[0]?.n || 1;
      baseBody = html`<div class="vm-bars">${rows.map((x, i) => html`
        <button type="button" class="vm-bar-row" data-cc="${x.cc}" style="--i:${Math.min(i, 14)}">
          <span class="vm-bar-c">${flag(x.cc, 16)}<span>${D.countryName(x.cc)}</span></span>
          <span class="vm-bar-track">${stackBar(ib.byCountry[x.cc], order, max)}</span>
          <b class="vm-bar-n num">${TL.i18n.int(x.n)}</b>
        </button>`)}</div>`;
    } else {
      const gs = order.filter((g) => base[g] > 0);
      const gmax = Math.max(1, ...gs.map((g) => base[g]));
      baseBody = html`<div class="vm-bar-one">${stackBar(base, order, nMach)}</div>
        <div class="vm-gbreak">${gs.map((g, i) => html`<div class="vm-grow" data-g="${g}" style="--i:${i}">
          <span class="vm-gname"><i style="background:${D.groupColor(g)}"></i>${groupLabel(g)}</span>
          <span class="vm-gtrack"><i style="--w:${(base[g] / gmax).toFixed(4)};background:${D.groupColor(g)}"></i></span>
          <b class="num">${TL.i18n.int(base[g])}</b><span class="vm-gpct num">${TL.i18n.pct(base[g] / nMach)}</span></div>`)}</div>`;
    }
    const legend = nMach && !cc ? html`<div class="vm-blegend">${order.map((g) => html`<span><i style="background:${D.groupColor(g)}"></i>${groupLabel(g)}<b class="num">${TL.i18n.int(ib.total[g])}</b></span>`)}</div>` : '';
    root.insertAdjacentHTML('beforeend', String(sec(cc ? t('vm.comp.baseCountry', { country: name }) : t('vm.comp.base'), html`${baseBody}${legend}`,
      { cls: 'vm-sec-base', aside: nMach ? aux(tn('vm.comp.machines', nMach)) : '' })));

    /* Distribuidores de la competencia */
    const dealers = (cc ? D.dealersOf(cc) : D.dealers).slice()
      .sort((a, b) => String(a.brand).localeCompare(String(b.brand)) || String(a.country).localeCompare(String(b.country)));
    const dSec = u.el(String(sec(t('vm.comp.dealers'), dealers.length ? '' : empty(t('vm.comp.emptyDealers'), 'competition'),
      { aside: dealers.length ? aux(dealers.length) : '' })));
    root.appendChild(dSec);
    if (dealers.length) {
      incremental(dSec, dealers, (d, i) => {
        const g = D.groupOfBrand(d.brand, d.brand_group), geo = isFinite(d.lat) && isFinite(d.lng);
        return html`<div class="vm-row vm-deal" data-g="${g}">
          <i class="vm-sq" style="background:${D.groupColor(g)}"></i>
          <button type="button" class="vm-deal-main" data-act="dealer" data-i="${i}"${geo ? '' : raw(' disabled')}>
            <span class="vm-name">${d.brand}<em>${D.group(g).name}</em></span>
            <span class="vm-meta">${d.partner ? html`<b>${d.partner}</b>` : ''}${flag(d.country, 14)}${[d.city, cc ? '' : D.countryName(d.country)].filter(Boolean).join(' · ')}</span>
          </button>
          ${d.url ? html`<a class="icon-btn vm-ext" href="${d.url}" target="_blank" rel="noopener noreferrer" title="${t('ui.source')}" aria-label="${t('ui.source')}: ${d.partner || d.brand}">${ic('external')}</a>` : ''}
        </div>`;
      });
    }

    /* Oportunidades de reemplazo (respetan los filtros globales) */
    const rSec = u.el(String(sec(t('vm.comp.replace'), html`<p class="vm-note">${t('vm.comp.replaceSub')}</p><div class="vm-repl-host"></div>`,
      { aside: html`<span class="h-aux num" data-repl-n></span>` })));
    root.appendChild(rSec);
    const rHost = rSec.querySelector('.vm-repl-host');

    const sync = () => {
      const sel = TL.filters.get().brands || [];
      root.querySelectorAll('.vm-fchip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.g ? sel.includes(b.dataset.g) : !sel.length)));
      root.querySelectorAll('.vm-seg, .vm-grow, .vm-deal').forEach((s) => s.classList.toggle('is-dim', !!sel.length && !sel.includes(s.dataset.g)));
      const list = TL.filters.apply(replAll);
      rHost.innerHTML = '';
      rSec.querySelector('[data-repl-n]').textContent = TL.i18n.int(list.length);
      if (!list.length) rHost.innerHTML = String(empty(replAll.length ? t('vm.comp.emptyReplace') : t('vm.comp.emptyReplaceNone'), 'filter'));
      else incremental(rHost, list, replRow);
    };
    sync();

    delegate(root, {
      region: goRegion,
      brand(b) {
        const g = b.dataset.g;
        if (!g) TL.filters.set({ brands: [] }); else TL.filters.toggle('brands', g);
      },
      dealer(b) {
        const d = dealers[+b.dataset.i]; if (!d || !isFinite(d.lat)) return;
        TL.map?.flyTo?.({ center: [d.lng, d.lat], zoom: 11.5, pitch: 30, duration: 1800 });
      },
    });
    // anillo de hover en el mapa al recorrer la lista de reemplazo
    rHost.addEventListener('mouseover', (e) => { const r = e.target.closest('[data-open]'); TL.map?.setHover?.(r ? D.rec(r.dataset.open) : null); });
    rHost.addEventListener('mouseleave', () => TL.map?.setHover?.(null));
    return sync;
  }

  TL.views.register({
    id: 'competition', order: 30, icon: 'competition', label: 'rail.competition', kind: 'panel', group: 'main', mapMode: 'competition',
    render(container, ctx) {
      const root = u.h('div.vm.vm-comp');
      container.appendChild(root);
      const sync = renderCompetition(root, ctx?.country ?? TL.state.country);
      const off = TL.on('filters', () => { if (root.isConnected) sync(); });
      return () => { off(); TL.map?.setHover?.(null); };
    },
    legend() {
      const ib = D.installedBase(), order = groupOrder(ib.total);
      const keys = order.length ? order : ['trumpf'];
      return html`<div class="legend-title">${t('vm.comp.legend')}</div><div class="legend-row">
        ${keys.map((g) => html`<span class="legend-item"><i class="sw dot" style="background:${D.groupColor(g)}"></i>${groupLabel(g)}</span>`)}
        <span class="legend-item"><i class="sw sq vm-sw-dealer"></i>${t('vm.comp.lgDealer')}</span></div>`;
    },
  });
  // @@END-VM-3

  /* ══════════════════════════════════════════════════════════════════════
     3) RADAR DE OPORTUNIDADES
     ══════════════════════════════════════════════════════════════════════ */
  const R = { sector: '', status: '', sort: 'amount', all: false, fetched: false, net: 'idle', newN: 0, extra: [], benefit: null, focus: null };
  const STEPS = ['anunciado', 'licitacion', 'adjudicado', 'construccion'];
  const SECTOR_MAP = {
    data_center: ['datacenter_telecom', 'tableros', 'hvac'],
    mineria: ['mineria', 'maquinaria_industrial'],
    energia: ['transformadores', 'tableros', 'energia_renovable'],
    transporte: ['carrocerias', 'automotriz'],
    infraestructura: ['construccion', 'almacenaje'],
    vivienda: ['construccion', 'almacenaje'],
    salud: ['gastronomia_inox', 'muebles_metalicos'],
    agro: ['agro'],
    industria: ['maquinaria_industrial', 'job_shop'],
  };
  const SECTOR_ICON = {
    data_center: 'vm_dc', datacenter_telecom: 'vm_dc', mineria: 'vm_mine', energia: 'vm_energy', energia_renovable: 'vm_energy', transformadores: 'vm_energy',
    tableros: 'vm_energy', transporte: 'vm_transport', carrocerias: 'vm_transport', automotriz: 'vm_transport', infraestructura: 'vm_infra', construccion: 'vm_infra',
    vivienda: 'vm_house', salud: 'vm_health', agro: 'vm_agro', industria: 'clients',
  };
  const KEYWORDS = [[/taller|metalmec|job.?shop|lohnfert/, 'job_shop'], [/tablero|schaltanl|gabinete/, 'tableros'], [/carrocer|aufbau/, 'carrocerias'], [/inox|edelstahl/, 'gastronomia_inox'],
    [/mueble|mobel/, 'muebles_metalicos'], [/hvac|climatiz|klima/, 'hvac'], [/transformador|transformator/, 'transformadores'], [/agricol|landtech/, 'agro'], [/miner|bergbau/, 'mineria'],
    [/estructura|construc|bau\b/, 'construccion'], [/rack|almacen|lager/, 'almacenaje'], [/automo|autopart/, 'automotriz']];

  const oppSectorName = (k) => (TL.i18n.has('vm.osec.' + k) ? t('vm.osec.' + k) : D.sectorName(k));
  const stepOf = (st) => {
    const s = u.norm(st);
    if (!s) return -1;
    if (/licit|ausschreib|tender/.test(s)) return 1;
    if (/adjud|vergeb|award/.test(s)) return 2;
    if (/constru|ejecuc|obra|im bau|built/.test(s)) return 3;
    if (/anunc|plan|propu|proyect|announc|angek/.test(s)) return 0;
    return -2;   // estado no reconocido: se muestra el texto tal cual, sin progreso
  };
  const allOpps = () => D.opps.concat(R.extra.filter((x) => !D.opp(x.id)));
  const findOpp = (id) => D.opp(id) || R.extra.find((x) => x.id === id) || null;

  /** Rubros de clientes que se benefician de una oportunidad. */
  function benefitSectors(o) {
    const set = new Set(SECTOR_MAP[o.sector] || []);
    if (D.taxonomy.sectors?.[o.sector]) set.add(o.sector);
    const txt = u.norm([o.beneficiaries_es, o.beneficiaries_de, o.beneficiaries].flat().filter(Boolean).join(' '));
    if (txt) {
      Object.entries(D.taxonomy.sectors || {}).forEach(([k, v]) => {
        if ([k.replace(/_/g, ' '), v?.es, v?.de].map(u.norm).some((n) => n && n.length > 3 && txt.includes(n))) set.add(k);
      });
      KEYWORDS.forEach(([re, k]) => { if (re.test(txt)) set.add(k); });
    }
    return set;
  }
  function makersOf(o) {
    const set = benefitSectors(o);
    return D.clientsOf(o.country).filter((c) => (c.sectors || []).some((s) => set.has(s))).sort((a, b) => D.score(b) - D.score(a));
  }

  function steps(o) {
    const k = stepOf(o.status);
    if (k === -1) return '';
    if (k === -2) return html`<span class="vm-steps is-raw"><span class="vm-steps-l">${o.status}</span></span>`;
    const label = t('vm.radar.st.' + STEPS[k]);
    return html`<span class="vm-steps" data-step="${k}" title="${o.status || ''}"><span class="vm-steps-line" aria-hidden="true">${STEPS.map((s, i) => html`<i class="${i < k ? 'is-done' : i === k ? 'is-now' : ''}"></i>`)}</span><span class="vm-steps-l">${label}</span></span>`;
  }

  function oppCard(o) {
    const fams = u.unique((o.machines || []).filter(Boolean));
    const ben = TL.i18n.pick(o, 'beneficiaries');
    const benTxt = Array.isArray(ben) ? ben.join(', ') : ben;
    const amt = o.amount_usd ? TL.i18n.usd(o.amount_usd) : o.amount_text || '';
    const on = R.focus === o.id, bOn = R.benefit?.id === o.id;
    const geo = isFinite(o.lat) && isFinite(o.lng);
    return html`<article class="vm-opp${o.isNew ? ' is-new' : ''}${on ? ' is-on' : ''}" data-id="${o.id}">
      <button type="button" class="vm-opp-main" data-act="opp" data-id="${o.id}" aria-pressed="${on}">
        <span class="vm-opp-top">${flag(o.country, 15)}<span>${[D.countryName(o.country), o.city].filter(Boolean).join(' · ')}</span>
          ${o.isNew ? html`<span class="vm-new">${t('ui.new')}</span>` : ''}
          ${o.date ? html`<span class="vm-opp-date num">${TL.i18n.monthYear(o.date)}</span>` : ''}</span>
        <span class="vm-opp-title">${TL.i18n.pick(o, 'title') || o.id}</span>
        <span class="vm-opp-meta">
          ${o.sector ? html`<span class="vm-osec">${ic(SECTOR_ICON[o.sector] || 'clients')}${oppSectorName(o.sector)}</span>` : ''}
          ${amt ? html`<b class="vm-amt num">${amt}</b>` : ''}
        </span>
        ${steps(o)}
        ${geo ? '' : html`<span class="vm-nogeo">${t('vm.radar.noGeo')}</span>`}
      </button>
      <div class="vm-opp-body">
        ${fams.length ? html`<div class="vm-opp-row"><span class="vm-lbl">${t('vm.radar.families')}</span><span class="vm-fams">${fams.map((f) => html`<span class="vm-fam" title="${D.familyLine(f)}">${ic(TL.ui.processIcon(f))}${D.familyName(f)}</span>`)}</span></div>` : ''}
        ${benTxt ? html`<div class="vm-opp-row"><span class="vm-lbl">${t('vm.radar.beneficiaries')}</span><span class="vm-ben">${benTxt}</span></div>` : ''}
        <div class="vm-opp-foot">
          ${o.source_url ? html`<a class="vm-src" href="${o.source_url}" target="_blank" rel="noopener noreferrer">${ic('external')}<span>${o.source_name || t('ui.source')}</span></a>` : html`<span class="vm-src is-none">${o.source_name || ''}</span>`}
          <button type="button" class="btn btn-sm ${bOn ? 'btn-ink' : 'btn-ghost'} vm-makers-btn" data-act="${bOn ? 'unbenefit' : 'benefit'}" data-id="${o.id}" aria-expanded="${bOn}">${ic(bOn ? 'close' : 'users')}<span>${bOn ? t('vm.radar.hideMakers') : t('vm.radar.showMakers')}</span></button>
        </div>
        ${bOn ? makersBlock(o) : ''}
      </div>
    </article>`;
  }

  function makersBlock(o) {
    const list = makersOf(o);
    if (!list.length) return html`<div class="vm-makers"><p class="vm-note">${t('vm.radar.noMakers', { country: D.countryName(o.country) })}</p></div>`;
    return html`<div class="vm-makers"><p class="vm-makers-n">${ic('pin')}${tn('vm.radar.makersN', list.length)}</p>
      <div class="vm-makers-list">${list.slice(0, 12).map((c) => html`<button type="button" class="vm-mk" data-open="${c.id}">${TL.ui.logo(c, 26)}<span class="vm-name">${c.name}</span><span class="vm-meta">${c.city || ''}</span><span class="vm-tier" data-tier="${c.tier || 'C'}">${c.tier || 'C'}</span></button>`)}</div>
      ${list.length > 12 ? html`<p class="vm-note num">+${list.length - 12}</p>` : ''}</div>`;
  }
  // @@END-VM-4

  /** Radar automático (n8n): una vez por sesión; mezcla ítems nuevos marcados "Nuevo". */
  async function autoRadar() {
    if (R.fetched) return;
    R.fetched = true;
    if (!TL.net?.has?.('radar')) { R.net = 'off'; return paintAuto(); }
    R.net = 'loading'; paintAuto();
    let res;
    try { res = await TL.net.call('radar', { action: 'list' }); } catch (e) { res = null; }
    const items = Array.isArray(res?.items) ? res.items : null;
    if (!res?.ok || !items) { R.net = 'off'; return paintAuto(); }
    let n = 0, geo = 0;
    const raw0 = D.raw.opportunities || (D.raw.opportunities = []);
    items.forEach((it, i) => {
      if (!it || typeof it !== 'object') return;
      const id = String(it.id || 'RAD-' + u.norm(it.title_es || it.title || '').replace(/[^a-z0-9]+/g, '').slice(0, 24) || 'RAD-' + i);
      if (findOpp(id)) return;
      const rec = Object.assign({}, it, { id, isNew: true });
      if (!rec.title_es && rec.title) rec.title_es = rec.title;
      n++;
      if (isFinite(rec.lat) && isFinite(rec.lng) && rec.lat !== null && rec.lng !== null) { raw0.push(rec); geo++; } else R.extra.push(rec);
    });
    R.newN = n; R.net = 'ok';
    if (geo) {
      D.rebuild();
      if (TL.map?.mode === 'radar') { TL.map.setOppMarkers(false); TL.map.setOppMarkers(true); if (R.focus) TL.map.markOpp(R.focus); }
    }
    if (n && TL.state.view === 'radar') TL.panel?.render({ keepScroll: true, soft: true }); else paintAuto();
  }
  function autoLine() {
    const st = R.net === 'ok' ? 'ok' : R.net === 'loading' ? 'loading' : R.net === 'off' ? 'off' : 'idle';
    const txt = st === 'ok' ? (R.newN ? tn('vm.radar.autoOk', R.newN) : t('vm.radar.autoNone')) : st === 'loading' ? t('vm.radar.autoLoading') : st === 'off' ? t('vm.radar.autoOff') : '';
    return html`<p class="vm-auto" data-state="${st}" role="status"><i></i><span>${st === 'off' ? '' : t('vm.radar.auto') + ' · '}${txt}</span></p>`;
  }
  function paintAuto() {
    document.querySelectorAll('.vm-auto').forEach((el) => { el.outerHTML = String(autoLine()); });
  }

  function renderRadar(root, cc) {
    const scopeCc = cc && !R.all ? cc : null;
    const scoped = allOpps().filter((o) => !scopeCc || o.country === scopeCc);
    const sectors = u.unique(scoped.map((o) => o.sector).filter(Boolean));
    const states = u.unique(scoped.map((o) => stepOf(o.status)).filter((k) => k >= 0)).sort();
    if (R.sector && !sectors.includes(R.sector)) R.sector = '';
    if (R.status !== '' && !states.includes(+R.status)) R.status = '';
    const list = scoped.filter((o) => (!R.sector || o.sector === R.sector) && (R.status === '' || stepOf(o.status) === +R.status));
    list.sort(R.sort === 'date'
      ? (a, b) => String(b.date || '').localeCompare(String(a.date || '')) || (b.amount_usd || 0) - (a.amount_usd || 0)
      : (a, b) => (b.amount_usd || 0) - (a.amount_usd || 0) || String(b.date || '').localeCompare(String(a.date || '')));
    const total = u.sum(list, (o) => o.amount_usd || 0);
    const makers = new Set(); list.forEach((o) => makersOf(o).forEach((c) => makers.add(c.id)));
    const name = cc ? D.countryName(cc) : '';

    root.insertAdjacentHTML('beforeend', String(html`
      ${head(t('vm.radar.kicker'), cc ? name : t('vm.radar.title'), t('vm.radar.sub'), cc)}
      <section class="pv-sec kpis vm-kpis">
        ${kpi({ label: t('vm.radar.k.count'), value: list.length })}
        ${kpi({ label: t('vm.radar.k.amount'), value: Math.round(total / 1e6), sub: t('vm.radar.musd') })}
        ${kpi({ label: t('vm.radar.k.countries'), value: u.unique(list.map((o) => o.country)).length })}
        ${kpi({ label: t('vm.radar.k.makers'), value: makers.size })}
      </section>
      ${autoLine()}`));

    if (scoped.length || cc) {
      const fchip = (act, val, cur, label) => html`<button type="button" class="vm-fchip" data-act="${act}" data-v="${val}" aria-pressed="${String(cur)}">${label}</button>`;
      root.insertAdjacentHTML('beforeend', String(html`<section class="pv-sec vm-sec vm-filters">
        ${cc ? html`<div class="vm-frow"><span class="vm-lbl">${t('vm.radar.filterCountry')}</span><div class="vm-fchips">
          ${fchip('scope', 'cc', !R.all, html`${flag(cc, 14)}${name}`)}${fchip('scope', 'all', R.all, t('vm.radar.allCountries'))}</div></div>` : ''}
        ${sectors.length > 1 ? html`<div class="vm-frow"><span class="vm-lbl">${t('vm.radar.filterSector')}</span><div class="vm-fchips">
          ${fchip('sector', '', !R.sector, t('ui.all'))}${sectors.map((k) => fchip('sector', k, R.sector === k, html`${ic(SECTOR_ICON[k] || 'clients')}${oppSectorName(k)}`))}</div></div>` : ''}
        ${states.length > 1 ? html`<div class="vm-frow"><span class="vm-lbl">${t('vm.radar.filterStatus')}</span><div class="vm-fchips">
          ${fchip('status', '', R.status === '', t('ui.all'))}${states.map((k) => fchip('status', k, String(R.status) === String(k), t('vm.radar.st.' + STEPS[k])))}</div></div>` : ''}
        ${list.length > 1 ? html`<div class="vm-frow"><span class="vm-lbl">${t('ui.sortBy')}</span><div class="seg seg-sm vm-sort" role="group" aria-label="${t('ui.sortBy')}">
          <button type="button" data-act="sort" data-v="amount" aria-pressed="${String(R.sort !== 'date')}">${t('vm.radar.sortAmount')}</button>
          <button type="button" data-act="sort" data-v="date" aria-pressed="${String(R.sort === 'date')}">${t('vm.radar.sortDate')}</button></div></div>` : ''}
      </section>`));
    }

    const lSec = u.el(String(html`<section class="pv-sec vm-sec vm-sec-opps"><h3 class="h-sec">${t('vm.radar.list')}${aux(list.length)}</h3></section>`));
    root.appendChild(lSec);
    let inc = null;
    if (!list.length) lSec.insertAdjacentHTML('beforeend', String(empty(scoped.length ? t('vm.radar.emptyFilter') : cc && !R.all ? t('vm.radar.emptyCountry', { country: name }) : t('vm.radar.empty'), 'radar')));
    else inc = incremental(lSec, list, oppCard, 30);

    const rerender = () => TL.panel?.render({ keepScroll: true, soft: true });
    const setFocus = (id, { fly = true, scroll = true } = {}) => {
      R.focus = id;
      root.querySelectorAll('.vm-opp').forEach((el) => {
        const on = el.dataset.id === id;
        el.classList.toggle('is-on', on);
        el.querySelector('.vm-opp-main')?.setAttribute('aria-pressed', String(on));
      });
      const o = findOpp(id);
      if (o && fly && isFinite(o.lat) && isFinite(o.lng)) TL.map?.flyToEntity?.(o.id);
      TL.map?.markOpp?.(id);
      if (scroll) {
        const idx = list.findIndex((x) => x.id === id);
        if (idx >= 0 && inc) inc.ensure(idx);
        const card = root.querySelector(`.vm-opp[data-id="${CSS.escape(id)}"]`);
        if (card) requestAnimationFrame(() => card.scrollIntoView({ block: 'nearest', behavior: TL.reduceMotion ? 'auto' : 'smooth' }));
      }
    };

    delegate(root, {
      region: goRegion,
      scope(b) { R.all = b.dataset.v === 'all'; rerender(); },
      sector(b) { R.sector = b.dataset.v; rerender(); },
      status(b) { R.status = b.dataset.v === '' ? '' : +b.dataset.v; rerender(); },
      sort(b) { R.sort = b.dataset.v; rerender(); },
      opp(b) { setFocus(b.dataset.id, { scroll: false }); },
      benefit(b) {
        const o = findOpp(b.dataset.id); if (!o) return;
        const ids = makersOf(o).map((c) => c.id);
        R.benefit = { id: o.id, ids };
        TL.map?.highlight?.(ids);
        if (TL.state.country !== o.country) TL.map?.flyToCountry?.(o.country);
        R.focus = o.id; TL.map?.markOpp?.(o.id);
        swapCard(o); TL.panel?.renderLegend?.();
      },
      unbenefit(b) {
        R.benefit = null; TL.map?.clearHighlight?.();
        const o = findOpp(b.dataset.id); if (o) swapCard(o);
        TL.panel?.renderLegend?.();
      },
    });
    function swapCard(o) {
      root.querySelectorAll('.vm-opp').forEach((el) => {
        const x = findOpp(el.dataset.id); if (!x) return;
        if (x.id === o.id || el.querySelector('.vm-makers')) {
          const n = u.el(String(oppCard(x))); n.classList.add('is-swapped');
          el.replaceWith(n); TL.ui.reveal(n);
        }
      });
    }

    // restaurar estado (resaltado de beneficiarios, foco) tras re-renderizar
    if (R.benefit && list.some((o) => o.id === R.benefit.id)) TL.map?.highlight?.(R.benefit.ids);
    else if (R.benefit) { R.benefit = null; TL.map?.clearHighlight?.(); }
    if (R.focus && list.some((o) => o.id === R.focus)) setTimeout(() => root.isConnected && setFocus(R.focus, { fly: false }), 60);
    live = { focus: (id, o) => setFocus(id, Object.assign({ fly: true }, o)), has: (id) => list.some((o) => o.id === id), root };
    autoRadar();
  }
  let live = null;

  /** Enfoca una oportunidad desde afuera (mapa, presentación, búsqueda). */
  function focusOpp(id) {
    const o = findOpp(id); if (!o) return;
    R.focus = id;
    if (TL.state.country && o.country !== TL.state.country) R.all = true;
    if (R.sector && o.sector !== R.sector) R.sector = '';
    if (R.status !== '' && stepOf(o.status) !== +R.status) R.status = '';
    if (TL.state.view !== 'radar') { TL.nav?.view ? TL.nav.view('radar') : TL.set({ view: 'radar' }); return; }
    if (live?.root?.isConnected && live.has(id)) live.focus(id, { fly: false });
    else TL.panel?.render({ keepScroll: true, soft: true });
  }
  TL.on('radar:focus', focusOpp);
  TL.on('map:mode', (m) => { if (m === 'radar' && R.focus) setTimeout(() => TL.map?.markOpp?.(R.focus), 0); });

  TL.views.register({
    id: 'radar', order: 40, icon: 'radar', label: 'rail.radar', kind: 'panel', group: 'main', mapMode: 'radar',
    render(container, ctx) {
      const root = u.h('div.vm.vm-radar');
      container.appendChild(root);
      renderRadar(root, ctx?.country ?? TL.state.country);
      return () => {
        live = null;
        if (TL.state.view !== 'radar') {
          if (R.benefit) { R.benefit = null; TL.map?.clearHighlight?.(); }
          TL.map?.markOpp?.(null);
        }
      };
    },
    legend() {
      return html`<div class="legend-title">${t('vm.radar.legend')}</div><div class="legend-row">
        <span class="legend-item"><i class="vm-sw-pulse" aria-hidden="true"></i>${t('vm.radar.lgProject')}</span>
        ${R.benefit ? html`<span class="legend-item"><i class="vm-sw-hl" aria-hidden="true"></i>${t('vm.radar.lgMakers')}</span>` : ''}</div>`;
    },
  });

  /** API mínima para otros módulos (presentación, búsqueda). */
  TL.radar = { focus: focusOpp, list: allOpps, makersOf, refresh: () => { R.fetched = false; return autoRadar(); } };
  // @@END-VM-5

  /* ── Textos ES / DE ─────────────────────────────────────────────────── */
  TL.i18n.extend({
    es: {
      'vm.region': 'Región LATAM',
      'vm.reps.kicker': 'Red de representantes', 'vm.reps.title': 'Representantes',
      'vm.reps.subRegion': 'Candidatos a representar a TRUMPF en los países sin filial, evaluados por idoneidad, servicio técnico y conflicto de marcas.',
      'vm.reps.subCountry': 'Candidatos evaluados en {country}, ordenados por idoneidad. La shortlist recomendada va primero.',
      'vm.reps.k.total': 'Representantes', 'vm.reps.k.short': 'En shortlist', 'vm.reps.k.countries': 'Países con candidatos',
      'vm.reps.k.service': 'Con servicio técnico', 'vm.reps.k.noConflict': 'Sin conflicto de marcas',
      'vm.reps.shortlist': 'Shortlist recomendada', 'vm.reps.others': 'Otros candidatos', 'vm.reps.byCountry': 'Por país', 'vm.reps.pending': 'Países aún sin relevar',
      'vm.reps.service': 'Servicio técnico', 'vm.reps.noService': 'Sin servicio técnico',
      'vm.reps.conflict': 'Conflicto: {brands}', 'vm.reps.conflictGeneric': 'Conflicto con la competencia',
      'vm.reps.fit': 'Puntaje de idoneidad',
      'vm.reps.empty': 'Todavía no hay representantes relevados en {country}.',
      'vm.reps.emptyRegion': 'Todavía no hay representantes relevados. Elegí un país para ver su estado.',
      'vm.reps.nShort.one': '{n} en shortlist', 'vm.reps.nShort.other': '{n} en shortlist',
      'vm.reps.legend': 'Representantes', 'vm.reps.lgShort': 'Shortlist', 'vm.reps.lgRep': 'Candidato',
      'vm.comp.kicker': 'Inteligencia competitiva', 'vm.comp.title': 'Competencia',
      'vm.comp.sub': 'Base instalada detectada en las plantas de los prospectos y presencia local de los distribuidores de la competencia.',
      'vm.comp.k.machines': 'Máquinas detectadas', 'vm.comp.k.china': 'Competencia china', 'vm.comp.k.chinaSub': 'de la base detectada',
      'vm.comp.k.trumpf': 'Clientes con TRUMPF', 'vm.comp.k.replace': 'Oportunidades de reemplazo',
      'vm.comp.filter': 'Grupo de marca', 'vm.comp.base': 'Base instalada por país', 'vm.comp.baseCountry': 'Base instalada en {country}',
      'vm.comp.dealers': 'Distribuidores de la competencia', 'vm.comp.replace': 'Oportunidades de reemplazo',
      'vm.comp.replaceSub': 'Prospectos con equipos de la competencia, corte por plasma, láser CO₂ o maquinaria antigua.',
      'vm.comp.alreadyClient': 'ya cliente',
      'vm.comp.reason.plasma': 'Plasma', 'vm.comp.reason.co2': 'Láser CO₂', 'vm.comp.reason.china': 'Máquinas chinas',
      'vm.comp.reason.old': 'Equipo antiguo', 'vm.comp.reason.competitor': 'Competencia instalada',
      'vm.comp.emptyBase': 'Todavía no hay máquinas detectadas.', 'vm.comp.emptyDealers': 'Sin distribuidores de la competencia relevados.',
      'vm.comp.emptyReplace': 'Ninguna oportunidad de reemplazo con los filtros actuales.', 'vm.comp.emptyReplaceNone': 'Todavía no hay oportunidades de reemplazo detectadas.',
      'vm.comp.legend': 'Competencia · base detectada', 'vm.comp.lgDealer': 'Distribuidor',
      'vm.comp.machines.one': '{n} máquina', 'vm.comp.machines.other': '{n} máquinas',
      'vm.radar.kicker': 'Radar de oportunidades', 'vm.radar.title': 'Radar',
      'vm.radar.sub': 'Proyectos de inversión que van a demandar chapa procesada: quién se beneficia y qué tecnologías TRUMPF aplican.',
      'vm.radar.k.count': 'Proyectos', 'vm.radar.k.amount': 'Inversión total', 'vm.radar.k.countries': 'Países', 'vm.radar.k.makers': 'Fabricantes vinculados',
      'vm.radar.musd': 'millones de USD', 'vm.radar.list': 'Proyectos',
      'vm.radar.filterCountry': 'País', 'vm.radar.filterSector': 'Sector', 'vm.radar.filterStatus': 'Estado',
      'vm.radar.sortAmount': 'Monto', 'vm.radar.sortDate': 'Fecha', 'vm.radar.allCountries': 'Toda la región',
      'vm.radar.st.anunciado': 'Anunciado', 'vm.radar.st.licitacion': 'Licitación', 'vm.radar.st.adjudicado': 'Adjudicado', 'vm.radar.st.construccion': 'En construcción',
      'vm.radar.families': 'Tecnologías TRUMPF', 'vm.radar.beneficiaries': 'Quiénes se benefician',
      'vm.radar.showMakers': 'Ver fabricantes que se benefician', 'vm.radar.hideMakers': 'Limpiar resaltado',
      'vm.radar.makersN.one': '{n} fabricante resaltado en el mapa', 'vm.radar.makersN.other': '{n} fabricantes resaltados en el mapa',
      'vm.radar.noMakers': 'Todavía no hay fabricantes relevados de esos rubros en {country}.',
      'vm.radar.noGeo': 'Sin ubicación en el mapa',
      'vm.radar.auto': 'Radar automático', 'vm.radar.autoOff': 'Radar automático sin conexión', 'vm.radar.autoLoading': 'buscando proyectos nuevos…',
      'vm.radar.autoOk.one': '{n} proyecto nuevo', 'vm.radar.autoOk.other': '{n} proyectos nuevos', 'vm.radar.autoNone': 'sin novedades',
      'vm.radar.empty': 'Todavía no hay proyectos en el radar.', 'vm.radar.emptyCountry': 'Todavía no hay proyectos relevados en {country}.',
      'vm.radar.emptyFilter': 'Ningún proyecto coincide con los filtros.',
      'vm.radar.legend': 'Radar de oportunidades', 'vm.radar.lgProject': 'Proyecto de inversión', 'vm.radar.lgMakers': 'Fabricantes beneficiados',
      'vm.osec.data_center': 'Data centers', 'vm.osec.mineria': 'Minería', 'vm.osec.energia': 'Energía', 'vm.osec.transporte': 'Transporte',
      'vm.osec.infraestructura': 'Infraestructura', 'vm.osec.vivienda': 'Vivienda', 'vm.osec.salud': 'Salud', 'vm.osec.agro': 'Agro', 'vm.osec.industria': 'Industria',
    },
    de: {
      'vm.region': 'Region LATAM',
      'vm.reps.kicker': 'Vertriebspartnernetz', 'vm.reps.title': 'Vertriebspartner',
      'vm.reps.subRegion': 'Kandidaten für die Vertretung von TRUMPF in Ländern ohne Niederlassung – bewertet nach Eignung, technischem Service und Markenkonflikten.',
      'vm.reps.subCountry': 'Bewertete Kandidaten in {country}, sortiert nach Eignung. Die empfohlene Shortlist steht oben.',
      'vm.reps.k.total': 'Vertriebs\u00adpartner', 'vm.reps.k.short': 'Auf der Shortlist', 'vm.reps.k.countries': 'Länder mit Kandidaten',
      'vm.reps.k.service': 'Mit eigenem Service', 'vm.reps.k.noConflict': 'Ohne Markenkonflikt',
      'vm.reps.shortlist': 'Empfohlene Shortlist', 'vm.reps.others': 'Weitere Kandidaten', 'vm.reps.byCountry': 'Nach Land', 'vm.reps.pending': 'Noch nicht erfasste Länder',
      'vm.reps.service': 'Technischer Service', 'vm.reps.noService': 'Kein technischer Service',
      'vm.reps.conflict': 'Konflikt: {brands}', 'vm.reps.conflictGeneric': 'Konflikt mit Wettbewerbern',
      'vm.reps.fit': 'Eignungsbewertung',
      'vm.reps.empty': 'Für {country} sind noch keine Vertriebspartner erfasst.',
      'vm.reps.emptyRegion': 'Noch keine Vertriebspartner erfasst. Wählen Sie ein Land, um den Stand zu sehen.',
      'vm.reps.nShort.one': '{n} auf der Shortlist', 'vm.reps.nShort.other': '{n} auf der Shortlist',
      'vm.reps.legend': 'Vertriebspartner', 'vm.reps.lgShort': 'Shortlist', 'vm.reps.lgRep': 'Kandidat',
      'vm.comp.kicker': 'Wettbewerbsanalyse', 'vm.comp.title': 'Wettbewerb',
      'vm.comp.sub': 'In den Werken der Interessenten erkannte installierte Basis und lokale Präsenz der Wettbewerbshändler.',
      'vm.comp.k.machines': 'Erkannte Maschinen', 'vm.comp.k.china': 'Chinesischer Wettbewerb', 'vm.comp.k.chinaSub': 'der erkannten Basis',
      'vm.comp.k.trumpf': 'Kunden mit TRUMPF', 'vm.comp.k.replace': 'Ersatz\u00adpotenziale',
      'vm.comp.filter': 'Markengruppe', 'vm.comp.base': 'Installierte Basis nach Land', 'vm.comp.baseCountry': 'Installierte Basis in {country}',
      'vm.comp.dealers': 'Händler des Wettbewerbs', 'vm.comp.replace': 'Ersatzpotenziale',
      'vm.comp.replaceSub': 'Interessenten mit Wettbewerbsmaschinen, Plasmaschneiden, CO₂-Laser oder älterem Maschinenpark.',
      'vm.comp.alreadyClient': 'bereits Kunde',
      'vm.comp.reason.plasma': 'Plasma', 'vm.comp.reason.co2': 'CO₂-Laser', 'vm.comp.reason.china': 'Chinesische Maschinen',
      'vm.comp.reason.old': 'Älterer Maschinenpark', 'vm.comp.reason.competitor': 'Wettbewerb installiert',
      'vm.comp.emptyBase': 'Noch keine Maschinen erkannt.', 'vm.comp.emptyDealers': 'Keine Wettbewerbshändler erfasst.',
      'vm.comp.emptyReplace': 'Keine Ersatzpotenziale mit den aktuellen Filtern.', 'vm.comp.emptyReplaceNone': 'Noch keine Ersatzpotenziale erkannt.',
      'vm.comp.legend': 'Wettbewerb · erkannte Basis', 'vm.comp.lgDealer': 'Händler',
      'vm.comp.machines.one': '{n} Maschine', 'vm.comp.machines.other': '{n} Maschinen',
      'vm.radar.kicker': 'Projektradar', 'vm.radar.title': 'Radar',
      'vm.radar.sub': 'Investitionsprojekte mit Bedarf an Blechbearbeitung: wer davon profitiert und welche TRUMPF-Technologien passen.',
      'vm.radar.k.count': 'Projekte', 'vm.radar.k.amount': 'Investitionen', 'vm.radar.k.countries': 'Länder', 'vm.radar.k.makers': 'Verknüpfte Hersteller',
      'vm.radar.musd': 'Mio. USD', 'vm.radar.list': 'Projekte',
      'vm.radar.filterCountry': 'Land', 'vm.radar.filterSector': 'Sektor', 'vm.radar.filterStatus': 'Status',
      'vm.radar.sortAmount': 'Volumen', 'vm.radar.sortDate': 'Datum', 'vm.radar.allCountries': 'Ganze Region',
      'vm.radar.st.anunciado': 'Angekündigt', 'vm.radar.st.licitacion': 'Ausschreibung', 'vm.radar.st.adjudicado': 'Vergeben', 'vm.radar.st.construccion': 'Im Bau',
      'vm.radar.families': 'TRUMPF-Technologien', 'vm.radar.beneficiaries': 'Wer profitiert',
      'vm.radar.showMakers': 'Profitierende Hersteller zeigen', 'vm.radar.hideMakers': 'Hervorhebung aufheben',
      'vm.radar.makersN.one': '{n} Hersteller auf der Karte hervorgehoben', 'vm.radar.makersN.other': '{n} Hersteller auf der Karte hervorgehoben',
      'vm.radar.noMakers': 'In {country} sind noch keine Hersteller dieser Branchen erfasst.',
      'vm.radar.noGeo': 'Ohne Kartenposition',
      'vm.radar.auto': 'Automatisches Radar', 'vm.radar.autoOff': 'Automatisches Radar offline', 'vm.radar.autoLoading': 'neue Projekte werden gesucht …',
      'vm.radar.autoOk.one': '{n} neues Projekt', 'vm.radar.autoOk.other': '{n} neue Projekte', 'vm.radar.autoNone': 'keine Neuigkeiten',
      'vm.radar.empty': 'Noch keine Projekte im Radar.', 'vm.radar.emptyCountry': 'Für {country} sind noch keine Projekte erfasst.',
      'vm.radar.emptyFilter': 'Kein Projekt entspricht den Filtern.',
      'vm.radar.legend': 'Projektradar', 'vm.radar.lgProject': 'Investitionsprojekt', 'vm.radar.lgMakers': 'Profitierende Hersteller',
      'vm.osec.data_center': 'Rechenzentren', 'vm.osec.mineria': 'Bergbau', 'vm.osec.energia': 'Energie', 'vm.osec.transporte': 'Verkehr',
      'vm.osec.infraestructura': 'Infrastruktur', 'vm.osec.vivienda': 'Wohnungsbau', 'vm.osec.salud': 'Gesundheitswesen', 'vm.osec.agro': 'Landwirtschaft', 'vm.osec.industria': 'Industrie',
    },
  });
})();
