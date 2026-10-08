/* ==========================================================================
   tl-panel.js — panel derecho contextual: cascarón con crossfade, filtros con
   chips, y las vistas Clientes (región → país → lista), Representantes,
   Competencia y Radar.  API: TL.panel.{open,close,toggle,show,render,refresh}
   ========================================================================== */
(function () {
  'use strict';
  const { u } = TL;
  const html = u.html, raw = u.raw;
  const t = (k, v) => TL.i18n.t(k, v);
  const P = (TL.panel = {});
  let host, body, curKey = '', cleanup = null, renderToken = 0;

  P.init = function () {
    host = document.getElementById('tl-panel');
    body = document.getElementById('tl-panel-body');
    P.el = host; P.body = body;
    document.getElementById('panel-toggle').addEventListener('click', () => P.toggle());
    document.getElementById('panel-grip').addEventListener('click', () => host.classList.toggle('is-tall'));
    applyOpen(innerWidth <= 1100 ? true : TL.store.get('panelOpen', true) !== false);
    TL.on('lang', () => P.render({ keepScroll: true }));
    TL.on('change:view', () => P.render());
    TL.on('change:country', () => P.render());
    TL.on('data:changed', () => P.render({ keepScroll: true }));
    TL.on('filters:sort', () => P.render({ keepScroll: true, soft: true }));
    window.addEventListener('resize', u.debounce(() => TL.map?.setPadding(false), 160));
    P.render({ first: true });
  };

  function applyOpen(on) {
    TL.state.panelOpen = !!on;
    document.body.classList.toggle('panel-open', !!on);
    host?.setAttribute('aria-hidden', on ? 'false' : 'true');
    document.getElementById('panel-toggle')?.setAttribute('aria-expanded', on ? 'true' : 'false');
  }
  P.isOpen = () => TL.state.panelOpen;
  P.open = () => { if (P.isOpen()) return; applyOpen(true); TL.store.set('panelOpen', true); TL.map?.setPadding(); TL.emit('panel:toggle', true); };
  P.close = () => { if (!P.isOpen()) return; applyOpen(false); TL.store.set('panelOpen', false); TL.map?.setPadding(); TL.emit('panel:toggle', false); };
  P.toggle = () => (P.isOpen() ? P.close() : P.open());

  /**
   * Muestra contenido con crossfade + deslizamiento de 8 px.
   * content: Node | string | SafeHtml. opts: { key, dir: 1|-1, keepScroll }
   */
  P.show = function (content, opts = {}) {
    const next = u.h('div.pv');
    if (content && content.nodeType) next.appendChild(content); else next.innerHTML = String(content || '');
    const old = body.querySelector('.pv:not(.leaving)');
    const dir = opts.dir || 1;
    const scrollTop = opts.keepScroll ? body.scrollTop : 0;
    if (old && !TL.reduceMotion && !opts.instant) {
      old.classList.add('leaving'); old.style.setProperty('--dx', -8 * dir + 'px');
      setTimeout(() => old.remove(), 200);
      next.style.setProperty('--dx', 8 * dir + 'px');
      next.classList.add('entering');
      body.appendChild(next);
      requestAnimationFrame(() => requestAnimationFrame(() => next.classList.remove('entering')));
    } else { body.innerHTML = ''; body.appendChild(next); }
    body.scrollTop = scrollTop;
    TL.i18n.apply(next);
    if (!opts.keepScroll && !opts.soft) UI().sweep(host);
    UI().reveal(next);
    return next;
  };
  const UI = () => TL.ui;

  /** Re-renderiza la vista activa según estado (vista + país). */
  P.render = function (o = {}) {
    if (!body) return;
    const v = TL.views.get(TL.state.view) || TL.views.get('clients');
    if (!v || v.kind === 'action') return;
    const key = v.id + '|' + (TL.state.country || '') + '|' + TL.state.lang;
    const ctx = { country: TL.state.country, lang: TL.state.lang };
    if (typeof cleanup === 'function') { try { cleanup(); } catch (e) { /* noop */ } cleanup = null; }
    const token = ++renderToken;
    const holder = u.h('div.pv-in');
    const res = v.render ? v.render(holder, ctx) : null;
    const done = (fn) => { if (token === renderToken) cleanup = typeof fn === 'function' ? fn : null; };
    if (res && typeof res.then === 'function') res.then(done); else done(res);
    const dir = key.split('|')[1] && !curKey.split('|')[1] ? 1 : !key.split('|')[1] && curKey.split('|')[1] ? -1 : 1;
    P.show(holder, { dir, keepScroll: !!o.keepScroll, instant: !!o.first, soft: !!o.soft });
    curKey = key;
    P.renderLegend?.();
  };
  P.refresh = () => P.render({ keepScroll: true });
  // @@END-PANEL-1
})();
