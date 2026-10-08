/* ==========================================================================
   tl-map-hover.js — interacciones del mapa: hover de país (tooltip), hover de
   empresa/representante (tarjeta flotante con resorte), click y clusters.
   ========================================================================== */
(function () {
  'use strict';
  const { u } = TL;
  const M = TL.map;
  const html = u.html, raw = u.raw;

  let cardEl, tipEl, cardQX, cardQY, tipQX, tipQY;
  let hoverCc = null, hoverKey = '', cardShown = false, tipShown = false, hideT = 0;

  /** Capas con las que se puede interactuar según el modo actual. */
  M.interactiveLayers = function () {
    const map = M.instance;
    const L = M.mode === 'reps' ? ['rp-icon', 'rp-halo'] : ['cl-dot', 'cl-halo', 'cl-cluster'].concat(M.mode === 'competition' ? ['dl-icon'] : []);
    return L.filter((id) => map.getLayer(id));
  };

  M.bindInteractions = function () {
    const map = M.instance;
    cardEl = document.getElementById('tl-hovercard');
    tipEl = document.getElementById('tl-tooltip');
    if (window.gsap) {
      cardQX = gsap.quickTo(cardEl, 'x', { duration: 0.5, ease: 'expo.out' }); cardQY = gsap.quickTo(cardEl, 'y', { duration: 0.5, ease: 'expo.out' });
      tipQX = gsap.quickTo(tipEl, 'x', { duration: 0.35, ease: 'expo.out' }); tipQY = gsap.quickTo(tipEl, 'y', { duration: 0.35, ease: 'expo.out' });
    }
    let ev = null, raf = 0;
    map.on('mousemove', (e) => { ev = e; if (!raf) raf = requestAnimationFrame(() => { raf = 0; onMove(ev); }); });
    map.getCanvas().addEventListener('mouseleave', () => { clearHover(); });
    map.on('movestart', () => { if (map.isMoving() && hoverKey) hideCard(); });
    map.on('click', onClick);
    map.on('dragstart', () => { M.spin(false); hideCard(); hideTip(); });
    TL.on('map:hover', (h) => {   // marcadores DOM (oportunidades)
      if (!h) return hideCard();
      const o = TL.data.opp(h.id); if (!o) return;
      showCard('opp:' + h.id, cardOpp(o), h.x, h.y);
    });
  };

  function onMove(e) {
    const map = M.instance;
    if (!map || map.isMoving() && M.isSpinning()) return;
    const hits = map.queryRenderedFeatures(e.point, { layers: M.interactiveLayers() });
    const canvas = map.getCanvas();
    if (hits.length) {
      const f = hits[0], pr = f.properties || {};
      hideTip(); setCountryHover(null);
      canvas.style.cursor = 'pointer';
      if (f.layer.id === 'cl-cluster') { M.setHover(null); hideCard(); return; }
      if (f.layer.id === 'dl-icon') { M.setHover(null); showCard('dl:' + pr.id, cardDealer(pr), e.originalEvent.clientX, e.originalEvent.clientY); return; }
      const rec = TL.data.rec(pr.id); if (!rec) return;
      if (f.layer.id.startsWith('cl-')) M.setHover(rec); else M.setHover(null);
      showCard(pr.id, f.layer.id.startsWith('rp-') ? cardRep(rec) : cardClient(rec), e.originalEvent.clientX, e.originalEvent.clientY);
      return;
    }
    M.setHover(null); hideCard();
    const ch = map.queryRenderedFeatures(e.point, { layers: ['ch-fill', 'ch-hatch'].filter((id) => map.getLayer(id)) });
    if (ch.length && map.getZoom() < 8.5) {
      const cc = ch[0].properties.cc, role = ch[0].properties.role;
      canvas.style.cursor = role === 'target' ? 'pointer' : '';
      setCountryHover(role === 'target' ? cc : null);
      showTip(cc, role, e.originalEvent.clientX, e.originalEvent.clientY);
    } else { canvas.style.cursor = ''; setCountryHover(null); hideTip(); }
  }
  function clearHover() { M.setHover?.(null); hideCard(); hideTip(); setCountryHover(null); M.instance && (M.instance.getCanvas().style.cursor = ''); }

  function setCountryHover(cc) {
    const map = M.instance;
    if (cc === hoverCc) return;
    if (hoverCc) map.setFeatureState({ source: 'countries', id: hoverCc }, { hover: false });
    hoverCc = cc;
    if (cc) map.setFeatureState({ source: 'countries', id: cc }, { hover: true });
  }

  async function onClick(e) {
    const map = M.instance;
    const hits = map.queryRenderedFeatures(e.point, { layers: M.interactiveLayers() });
    if (hits.length) {
      const f = hits[0], pr = f.properties || {};
      M.spin(false);
      if (f.layer.id === 'cl-cluster') {
        try {
          const z = await map.getSource('clients').getClusterExpansionZoom(pr.cluster_id);
          M.flyTo({ center: f.geometry.coordinates, zoom: Math.min(z + 0.4, 17), duration: 900, curve: 1.2 });
        } catch (err) { /* noop */ }
        return;
      }
      if (f.layer.id === 'dl-icon') return;
      hideCard();
      TL.emit('map:click', { kind: TL.data.kindOf(pr.id), id: pr.id });
      TL.nav.open(pr.id);
      return;
    }
    const ch = map.queryRenderedFeatures(e.point, { layers: ['ch-fill'].filter((id) => map.getLayer(id)) });
    if (ch.length && map.getZoom() < 8.5) { hideTip(); TL.nav.country(ch[0].properties.cc); }
  }

  /* ── Posicionamiento con resorte ────────────────────────────────────── */
  function place(el, qx, qy, px, py, shown) {
    const w = el.offsetWidth || 300, h = el.offsetHeight || 180;
    const rightLimit = innerWidth - (document.body.classList.contains('panel-open') && innerWidth > 1100 ? 450 : 12);
    let x = px + 20, y = py + 20, ox = 'left', oy = 'top';
    if (x + w > rightLimit) { x = px - w - 20; ox = 'right'; }
    if (y + h > innerHeight - 12) { y = Math.max(12, py - h - 20); oy = 'bottom'; }
    el.style.transformOrigin = ox + ' ' + oy;
    if (!window.gsap) { el.style.transform = `translate3d(${x}px,${y}px,0)`; return; }
    if (!shown) gsap.set(el, { x, y }); else { qx(x); qy(y); }
  }

  function showCard(key, content, px, py) {
    clearTimeout(hideT);
    if (key !== hoverKey) { cardEl.innerHTML = content; hoverKey = key; TL.i18n.apply(cardEl); }
    cardEl.hidden = false;
    place(cardEl, cardQX, cardQY, px, py, cardShown);
    if (!cardShown) { requestAnimationFrame(() => cardEl.classList.add('on')); cardShown = true; }
  }
  function hideCard() {
    if (!cardShown) return;
    cardShown = false; hoverKey = '';
    cardEl.classList.remove('on');
    hideT = setTimeout(() => { if (!cardShown) cardEl.hidden = true; }, 180);
  }
  M.hideHover = hideCard;

  function showTip(cc, role, px, py) {
    const k = TL.data.country(cc), g = (id) => TL.data.country(id);
    let body;
    if (role === 'target' && k) {
      const c = k.counts, pot = k.potential ? TL.i18n.t('potential.' + k.potential) : TL.i18n.t('potential.none');
      body = html`<div class="tt-name">${TL.ui.flag(cc, 20)}<span>${TL.data.countryName(cc)}</span></div>
        <div class="tt-row"><span>${TL.i18n.t('tt.clients')}</span><b class="num">${c.clients}</b></div>
        <div class="tt-row tt-tiers"><i style="--c:var(--tier-a)">A <b class="num">${c.A}</b></i><i style="--c:var(--tier-b)">B <b class="num">${c.B}</b></i><i style="--c:var(--tier-c)">C <b class="num">${c.C}</b></i></div>
        <div class="tt-row"><span>${TL.i18n.t('tt.reps')}</span><b class="num">${c.reps}</b></div>
        <div class="tt-row"><span>${TL.i18n.t('tt.potential')}</span><b>${pot}</b></div>
        <div class="tt-hint">${TL.i18n.t('map.clickCountry')}</div>`;
    } else {
      const cc2 = cc;
      body = html`<div class="tt-name">${TL.ui.flag(cc2, 20)}<span>${TL.data.countryName(cc2)}</span></div><div class="tt-row"><span>${TL.i18n.t('map.subsidiary')}</span></div>`;
    }
    const key = cc + role + TL.state.lang;
    if (tipEl.dataset.key !== key) { tipEl.innerHTML = body; tipEl.dataset.key = key; }
    tipEl.hidden = false;
    place(tipEl, tipQX, tipQY, px, py, tipShown);
    if (!tipShown) { tipShown = true; requestAnimationFrame(() => tipEl.classList.add('on')); }
  }
  function hideTip() { if (!tipShown) return; tipShown = false; tipEl.classList.remove('on'); setTimeout(() => { if (!tipShown) tipEl.hidden = true; }, 160); }

  /* ── Contenido de las tarjetas ──────────────────────────────────────── */
  const t = (k, v) => TL.i18n.t(k, v);
  const machineChips = (list, max = 4) => {
    const seen = new Set(), chips = [];
    (list || []).forEach((m) => {
      const key = String(m.brand || '').toLowerCase(); if (!key || seen.has(key)) return; seen.add(key);
      const g = TL.data.groupOfBrand(m.brand, m.brand_group);
      chips.push(TL.ui.chip(m.brand, { color: TL.data.groupColor(g), cls: g === 'trumpf' ? 'chip-trumpf' : '' }));
    });
    const more = chips.length - max;
    return raw(chips.slice(0, max).map(String).join('') + (more > 0 ? `<span class="chip chip-more">+${more}</span>` : ''));
  };
  const sectorChips = (c, n = 2) => raw((c.sectors || []).slice(0, n).map((s) => String(TL.ui.chip(TL.data.sectorName(s)))).join(''));
  const place2 = (r) => [r.city, TL.data.countryName(r.country)].filter(Boolean).join(' · ');

  function cardClient(c) {
    const tier = c.tier || 'C', sc = TL.data.score(c);
    return String(html`<div class="hc-top">${TL.ui.logo(c, 46)}
      <div class="hc-id"><b class="hc-name">${c.name}</b><span class="hc-place">${TL.ui.flag(c.country, 15)}${place2(c)}</span></div>
      ${TL.ui.ring({ score: sc, tier, size: 50, animate: false })}</div>
      <div class="hc-chips">${sectorChips(c)}${c.isNew ? raw(`<span class="chip chip-new">${t('ui.newAI')}</span>`) : ''}</div>
      <div class="hc-sec"><span class="hc-lbl">${t('hc.machines')}</span>${(c.machines || []).length ? machineChips(c.machines) : raw(`<span class="hc-none">${t('hc.noMachines')}</span>`)}</div>
      <div class="hc-foot"><span>${t('map.clickToOpen')}</span>${TL.ui.icon('next')}</div>`);
  }
  function cardRep(r) {
    const conflict = r.competitor_conflict?.conflict;
    return String(html`<div class="hc-top">${TL.ui.logo(r, 46)}
      <div class="hc-id"><b class="hc-name">${r.name}</b><span class="hc-place">${TL.ui.flag(r.country, 15)}${place2(r)}</span></div>
      ${TL.ui.ring({ score: TL.data.score(r), tier: r.tier || 'C', size: 50, animate: false })}</div>
      <div class="hc-chips">${r.shortlist ? raw(`<span class="chip chip-lime">${t('hc.shortlist')}</span>`) : ''}${r.service?.has_service ? raw(`<span class="chip">${t('hc.service')}</span>`) : ''}${conflict ? raw(`<span class="chip chip-warn">${t('hc.conflict')}</span>`) : ''}</div>
      <div class="hc-sec"><span class="hc-lbl">${t('hc.brands')}</span>${machineChips((r.brands || []).map((b) => ({ brand: b.brand, brand_group: b.brand_group })), 5)}</div>
      <div class="hc-foot"><span>${t('map.clickToOpen')}</span>${TL.ui.icon('next')}</div>`);
  }
  function cardOpp(o) {
    return String(html`<div class="hc-top"><div class="hc-opp-ico">${TL.ui.icon('radar')}</div>
      <div class="hc-id"><b class="hc-name">${TL.i18n.pick(o, 'title')}</b><span class="hc-place">${TL.ui.flag(o.country, 15)}${[o.city, TL.data.countryName(o.country)].filter(Boolean).join(' · ')}</span></div></div>
      <div class="hc-chips">${o.amount_usd ? raw(`<span class="chip chip-amber num">${TL.i18n.usd(o.amount_usd)}</span>`) : ''}${o.status ? raw(`<span class="chip">${u.esc(o.status)}</span>`) : ''}${o.sector ? raw(`<span class="chip">${u.esc(TL.data.sectorName(o.sector))}</span>`) : ''}</div>`);
  }
  function cardDealer(pr) {
    const g = TL.data.group(TL.data.groupOfBrand(pr.brand));
    return String(html`<div class="hc-top"><div class="hc-opp-ico" style="color:${g.color}">${TL.ui.icon('competition')}</div>
      <div class="hc-id"><b class="hc-name">${pr.brand}</b><span class="hc-place">${TL.ui.flag(pr.cc, 15)}${TL.data.countryName(pr.cc)} · ${t('hc.dealer')}</span></div></div>`);
  }

  TL.i18n.extend({
    es: { 'hc.machines': 'Máquinas detectadas', 'hc.noMachines': 'Sin máquinas detectadas todavía', 'hc.brands': 'Marcas que representa', 'hc.shortlist': 'Shortlist', 'hc.service': 'Servicio técnico', 'hc.conflict': 'Conflicto de marcas', 'hc.dealer': 'Distribuidor de la competencia',
      'tt.clients': 'Prospectos', 'tt.reps': 'Representantes', 'tt.potential': 'Potencial', 'comp.none': 'Sin máquinas detectadas', 'size.grande': 'Grande', 'size.mediana': 'Mediana', 'size.pequeña': 'Pequeña', 'size.pequena': 'Pequeña' },
    de: { 'hc.machines': 'Erkannte Maschinen', 'hc.noMachines': 'Noch keine Maschinen erkannt', 'hc.brands': 'Vertretene Marken', 'hc.shortlist': 'Shortlist', 'hc.service': 'Technischer Service', 'hc.conflict': 'Markenkonflikt', 'hc.dealer': 'Händler des Wettbewerbs',
      'tt.clients': 'Interessenten', 'tt.reps': 'Vertriebspartner', 'tt.potential': 'Potenzial', 'comp.none': 'Keine Maschinen erkannt', 'size.grande': 'Groß', 'size.mediana': 'Mittel', 'size.pequeña': 'Klein', 'size.pequena': 'Klein' },
  });
})();
