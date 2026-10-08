/* ==========================================================================
   tl-filters-ui.js — controles de filtro del panel (hoja plegable con chips),
   chips de filtros activos abajo a la izquierda y leyenda de la capa activa.
   API: TL.filtersUI.{bar(container, base), chips()} · TL.panel.renderLegend()
   ========================================================================== */
(function () {
  'use strict';
  const { u } = TL;
  const t = (k, v) => TL.i18n.t(k, v);
  const FU = (TL.filtersUI = {});
  const D = () => TL.data;

  TL.i18n.extend({
    es: {
      'flt.title': 'Filtros', 'flt.tier': 'Prioridad', 'flt.segment': 'Tipo de empresa', 'flt.sector': 'Rubro', 'flt.size': 'Tamaño',
      'flt.brand': 'Marca detectada', 'flt.family': 'Familia TRUMPF recomendada', 'flt.sort.score': 'Puntaje', 'flt.sort.name': 'Nombre',
      'flt.sort.size': 'Tamaño', 'flt.results.one': '{n} resultado', 'flt.results.other': '{n} resultados', 'flt.searchList': 'Filtrar por nombre o ciudad',
      'flt.remove': 'Quitar filtro {x}', 'lg.clients': 'Clientes potenciales', 'lg.choro': 'Prospectos por país', 'lg.subsidiary': 'Filial TRUMPF (MX, BR)',
      'lg.cluster': 'Grupo de empresas',
    },
    de: {
      'flt.title': 'Filter', 'flt.tier': 'Priorität', 'flt.segment': 'Unternehmenstyp', 'flt.sector': 'Branche', 'flt.size': 'Größe',
      'flt.brand': 'Erkannte Marke', 'flt.family': 'Empfohlene TRUMPF Produktfamilie', 'flt.sort.score': 'Bewertung', 'flt.sort.name': 'Name',
      'flt.sort.size': 'Größe', 'flt.results.one': '{n} Ergebnis', 'flt.results.other': '{n} Ergebnisse', 'flt.searchList': 'Nach Name oder Stadt filtern',
      'flt.remove': 'Filter {x} entfernen', 'lg.clients': 'Potenzielle Kunden', 'lg.choro': 'Interessenten pro Land', 'lg.subsidiary': 'TRUMPF Niederlassung (MX, BR)',
      'lg.cluster': 'Unternehmensgruppe',
    },
  });

  let sheetOpen = TL.store.get('fltOpen', false);

  /** Opciones disponibles calculadas sobre `base` (lista de clientes del ámbito actual). */
  function options(base) {
    const cnt = (fn) => { const m = {}; base.forEach((c) => [].concat(fn(c) || []).forEach((k) => { if (k) m[k] = (m[k] || 0) + 1; })); return m; };
    const sort = (m) => Object.entries(m).sort((a, b) => b[1] - a[1]);
    return {
      tiers: ['A', 'B', 'C'].map((k) => [k, base.filter((c) => c.tier === k).length]),
      segments: sort(cnt((c) => c.segment)),
      sectors: sort(cnt((c) => c.sectors)),
      sizes: sort(cnt((c) => D().sizeClass(c))),
      brands: sort(cnt((c) => { const g = D().groupsOf(c); return g.length ? g : ['none']; })),
      families: sort(cnt((c) => u.unique((c.trumpf_fit || []).map((x) => x.family)))),
    };
  }
  const label = (key, v) => ({
    tiers: () => t('tier.' + v), segments: () => D().segmentName(v), sectors: () => D().sectorName(v),
    sizes: () => t('size.' + v), brands: () => (v === 'none' ? t('comp.none') : D().group(v).name), families: () => D().familyName(v),
  }[key] || (() => v))();
  const dot = (key, v) => (key === 'tiers' ? `var(--tier-${v.toLowerCase()})` : key === 'brands' && v !== 'none' ? D().groupColor(v) : null);

  /**
   * Barra de filtros para una lista: buscador + orden + botón de filtros (hoja plegable).
   * onChange se llama cuando cambian filtros u orden.
   */
  FU.bar = function (container, base) {
    const f = TL.filters.get(), n = TL.filters.count();
    const o = options(base);
    const group = (key, title, max = 99) => {
      const list = o[key].filter(([, c]) => c > 0 || f[key].includes(key)).slice(0, max);
      if (!list.length) return '';
      return `<div class="flt-g"><span class="flt-gt">${u.esc(title)}</span><div class="flt-opts">${list.map(([v, c]) => {
        const on = f[key].includes(v), col = dot(key, v);
        return `<button type="button" class="fchip" data-k="${key}" data-v="${u.esc(v)}" aria-pressed="${on}">${col ? `<i class="chip-dot" style="background:${col}"></i>` : ''}<span>${u.esc(label(key, v))}</span><em class="num">${c}</em></button>`;
      }).join('')}</div></div>`;
    };
    const el = u.el(`<div class="flt">
      <div class="flt-row">
        <label class="flt-search">${TL.ui.icon('search')}<input type="search" value="${u.esc(f.q)}" placeholder="${u.esc(t('flt.searchList'))}" aria-label="${u.esc(t('flt.searchList'))}"></label>
        <button type="button" class="btn btn-sm flt-toggle" aria-expanded="${sheetOpen}">${TL.ui.icon('filter')}<span>${u.esc(t('flt.title'))}</span>${n ? `<b class="flt-n num">${n}</b>` : ''}</button>
      </div>
      <div class="flt-sheet" ${sheetOpen ? '' : 'hidden'}>
        ${group('tiers', t('flt.tier'))}${group('segments', t('flt.segment'))}${group('sectors', t('flt.sector'), 14)}${group('sizes', t('flt.size'))}${group('brands', t('flt.brand'))}${group('families', t('flt.family'))}
        ${n ? `<button type="button" class="btn btn-sm btn-ghost flt-reset">${TL.ui.icon('close')}<span>${u.esc(t('ui.clearAll'))}</span></button>` : ''}
      </div>
      <div class="flt-meta"><span class="flt-count mono"></span>
        <label class="flt-sort"><span>${u.esc(t('ui.sortBy'))}</span><select>${['score', 'name', 'size'].map((s) => `<option value="${s}" ${TL.filters.sort === s ? 'selected' : ''}>${u.esc(t('flt.sort.' + s))}</option>`).join('')}</select></label>
      </div></div>`);
    const input = el.querySelector('input');
    input.addEventListener('input', u.debounce(() => TL.filters.set({ q: input.value.trim() }), 180));
    el.querySelector('.flt-toggle').addEventListener('click', (e) => {
      sheetOpen = !sheetOpen; TL.store.set('fltOpen', sheetOpen);
      e.currentTarget.setAttribute('aria-expanded', sheetOpen);
      el.querySelector('.flt-sheet').hidden = !sheetOpen;
    });
    el.addEventListener('click', (e) => {
      const b = e.target.closest('.fchip'); if (b) { TL.filters.toggle(b.dataset.k, b.dataset.v); return; }
      if (e.target.closest('.flt-reset')) TL.filters.reset();
    });
    el.querySelector('select').addEventListener('change', (e) => TL.filters.setSort(e.target.value));
    container.appendChild(el);
    return el;
  };
  FU.setCount = (el, n) => { const c = el?.querySelector('.flt-count'); if (c) c.textContent = TL.i18n.tn('flt.results', n); };

  /* ── Chips activos abajo a la izquierda ─────────────────────────────── */
  FU.chips = function () {
    const root = document.getElementById('filter-chips'); if (!root) return;
    const list = TL.filters.chips();
    root.innerHTML = list.map((c, i) => `<button type="button" class="achip" data-i="${i}" aria-label="${u.esc(t('flt.remove', { x: c.label }))}"><span>${u.esc(c.label)}</span>${TL.ui.icon('close')}</button>`).join('')
      + (list.length > 1 ? `<button type="button" class="achip achip-clear" data-all>${u.esc(t('ui.clearAll'))}</button>` : '');
    root.onclick = (e) => {
      const b = e.target.closest('.achip'); if (!b) return;
      if (b.hasAttribute('data-all')) TL.filters.reset(); else TL.filters.removeChip(list[+b.dataset.i]);
    };
  };
  TL.on('filters', FU.chips);
  TL.on('lang', FU.chips);

  /* ── Leyenda según la vista activa ──────────────────────────────────── */
  FU.clientLegend = () => u.raw(`<div class="legend-title">${u.esc(t('lg.clients'))}</div>
    <div class="legend-row">${['A', 'B', 'C'].map((k) => `<span class="legend-item"><i class="sw dot ${k.toLowerCase()}"></i>${u.esc(t('tier.' + k))}</span>`).join('')}
    <span class="legend-item"><i class="sw dot cl"></i>${u.esc(t('lg.cluster'))}</span></div>
    <div class="legend-row lg-2"><span class="legend-ramp"><span>${u.esc(t('lg.choro'))}</span><i></i></span><span class="legend-item"><i class="sw hatch"></i>${u.esc(t('lg.subsidiary'))}</span></div>`);
  TL.panel.renderLegend = function () {
    const v = TL.views.get(TL.state.view);
    let content = null;
    try { content = v && typeof v.legend === 'function' ? v.legend() : null; } catch (err) { console.error(err); }
    if (content === undefined || content === null) content = (!v || v.mapMode === 'clients' || !v.mapMode) ? FU.clientLegend() : null;
    TL.app?.setLegend?.(content);
  };
})();
