/* ==========================================================================
   tl-ui.js — primitivas de UI: íconos lineales, banderas SVG, anillo de puntaje,
   placa de logo, chips, contadores, toast, modal, overlay, lightbox, barrido láser.
   ========================================================================== */
(function () {
  'use strict';
  const { u } = TL;
  const UI = (TL.ui = {});
  const html = u.html, raw = u.raw;

  /* ── Íconos (viewBox 20×20, trazo 1.5, currentColor) ────────────────── */
  UI.icons = {
    clients: '<path d="M2.8 16.5V9l4.4 2.8V9l4.4 2.8V4h5.6v12.5z"/><path d="M2.8 16.5h14.4M13 7h1.6M13 10h1.6"/>',
    reps: '<path d="M10 2.8 17.2 10 10 17.2 2.8 10z"/><circle cx="10" cy="10" r="1.7"/>',
    competition: '<path d="M4 16.5V10M10 16.5V3.8M16 16.5v-4.7"/><path d="M2.5 16.5h15"/>',
    radar: '<circle cx="10" cy="10" r="7"/><circle cx="10" cy="10" r="3.4"/><path d="m10 10 4.6-4.6"/>',
    gtm: '<path d="M5 17.2V3.2"/><path d="M5 4h9.4l-2.1 3.1 2.1 3.1H5"/>',
    tour: '<circle cx="4.8" cy="15.2" r="1.7"/><circle cx="15.2" cy="4.8" r="1.7"/><path d="M6.3 14.3c4.6-1.2 1.4-5 4.8-6.3 1.4-.5 2.3-1 3.1-2" stroke-dasharray="1.6 2.2"/>',
    method: '<path d="M5 2.8h7l3.2 3.2v11.2H5z"/><path d="M12 2.8V6h3.2M7.4 11.2l1.8 1.8 3.4-3.6"/>',
    crm: '<rect x="3" y="3.5" width="4" height="13"/><rect x="8" y="3.5" width="4" height="9"/><rect x="13" y="3.5" width="4" height="6"/>',
    search: '<circle cx="8.5" cy="8.5" r="5.5"/><path d="M12.7 12.7 17 17"/>',
    close: '<path d="M4.5 4.5l11 11M15.5 4.5l-11 11"/>',
    back: '<path d="M12.5 4.5 7 10l5.5 5.5"/>',
    next: '<path d="M7.5 4.5 13 10l-5.5 5.5"/>',
    chevDown: '<path d="m5 7.8 5 5 5-5"/>',
    chevUp: '<path d="m5 12.2 5-5 5 5"/>',
    plus: '<path d="M10 4v12M4 10h12"/>',
    minus: '<path d="M4 10h12"/>',
    check: '<path d="m4.5 10.5 3.6 3.6 7.4-8"/>',
    external: '<path d="M8 4.5H4.5v11h11V12M11.5 4.5h4v4M15.5 4.5 9 11"/>',
    pin: '<path d="M10 17.5s5.5-5 5.5-9.2a5.5 5.5 0 0 0-11 0c0 4.2 5.5 9.2 5.5 9.2z"/><circle cx="10" cy="8.2" r="2"/>',
    route: '<path d="M4 16V4h6a3 3 0 0 1 0 6H8"/><path d="m11 14 3 3 3-3"/>',
    phone: '<path d="M5.2 3h2.6l1.2 3.3-1.6 1.1a8 8 0 0 0 4.2 4.2l1.1-1.6 3.3 1.2v2.6a1.6 1.6 0 0 1-1.7 1.6A12.6 12.6 0 0 1 3.6 4.7 1.6 1.6 0 0 1 5.2 3z"/>',
    mail: '<rect x="2.8" y="4.5" width="14.4" height="11" rx="1"/><path d="m3 5.5 7 5.3 7-5.3"/>',
    chat: '<path d="M3.5 15.8 4.6 12.6A6.4 6.4 0 1 1 7.4 15.4z"/><path d="M7.8 8.6c.2 1.6 1.6 3 3.6 3.4"/>',
    link: '<path d="M8.4 11.6a3 3 0 0 0 4.2 0l2.4-2.4a3 3 0 0 0-4.2-4.2l-.9.9"/><path d="M11.6 8.4a3 3 0 0 0-4.2 0L5 10.8a3 3 0 0 0 4.2 4.2l.9-.9"/>',
    web: '<circle cx="10" cy="10" r="7.2"/><path d="M2.8 10h14.4M10 2.8c2.2 2 3.3 4.4 3.3 7.2s-1.1 5.2-3.3 7.2M10 2.8C7.8 4.8 6.7 7.2 6.7 10s1.1 5.2 3.3 7.2"/>',
    copy: '<rect x="7" y="7" width="9.5" height="9.5"/><path d="M13 7V4H3.5v9.5H7"/>',
    download: '<path d="M10 3.5v9M6.2 9 10 12.8 13.8 9M4 16.5h12"/>',
    print: '<path d="M6 7V3h8v4M6 14H3.5V7.5h13V14H14M6 11.5h8V17H6z"/>',
    sort: '<path d="M6 4v12m0 0-2.5-2.6M6 16l2.5-2.6M14 16V4m0 0-2.5 2.6M14 4l2.5 2.6"/>',
    filter: '<path d="M3 5h14M5.5 10h9M8 15h4"/>',
    users: '<circle cx="7.5" cy="7" r="2.6"/><path d="M2.8 16c.4-3 2.4-4.6 4.7-4.6S11.8 13 12.2 16"/><circle cx="14" cy="7.6" r="2"/><path d="M13.6 11.6c2 .1 3.3 1.5 3.6 4"/>',
    calendar: '<rect x="3" y="4.5" width="14" height="12"/><path d="M3 8.5h14M7 3v3M13 3v3"/>',
    area: '<path d="M3.5 3.5h13v13h-13z"/><path d="M3.5 8h4.5v4.5H3.5M12 3.5v4.5"/>',
    badge: '<path d="M10 2.8 12 4l2.3-.2.9 2.1 2 1.2-.5 2.3.5 2.3-2 1.2-.9 2.1L12 15.2 10 16.4 8 15.2l-2.3.2-.9-2.1-2-1.2.5-2.3-.5-2.3 2-1.2.9-2.1L8 4z" transform="translate(0 -.4) scale(.98)"/><path d="m7.4 10 1.9 1.9 3.4-3.6"/>',
    export: '<circle cx="9" cy="10" r="6.4"/><path d="M2.6 10h12.8M9 3.6c-1.8 2-2.7 4-2.7 6.4s.9 4.4 2.7 6.4"/><path d="M13.5 6.5h3.4v3.4M16.9 6.5l-3.3 3.3" stroke-width="1.6"/>',
    group: '<circle cx="5" cy="5.5" r="1.9"/><circle cx="15" cy="5.5" r="1.9"/><circle cx="10" cy="15" r="1.9"/><path d="M6.8 6.2 9 13.2M13.2 6.2 11 13.2M7 5.5h6"/>',
    sparkle: '<path d="M10 3v4M10 13v4M3 10h4M13 10h4M5.6 5.6l2 2M12.4 12.4l2 2M14.4 5.6l-2 2M7.6 12.4l-2 2"/>',
    info: '<circle cx="10" cy="10" r="7.2"/><path d="M10 9.2v4.6M10 6.4v.1"/>',
    warn: '<path d="M10 3.2 17.4 16H2.6z"/><path d="M10 8.2v3.6M10 13.8v.1"/>',
    refresh: '<path d="M16 9a6 6 0 1 0-1.2 4.2M16 4v5h-5"/>',
    camera: '<path d="M3 6.5h3l1.2-2h5.6l1.2 2h3v9.5H3z"/><circle cx="10" cy="11" r="2.8"/>',
    expand: '<path d="M11.5 3.5h5v5M8.5 16.5h-5v-5M16.5 3.5 11 9M3.5 16.5 9 11"/>',
    play: '<path d="M6 3.8v12.4L16.2 10z"/>',
    star: '<path d="m10 3 2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5L2.8 8.3l5-.7z"/>',
    laser_2d: '<path d="M10 2.8v7"/><path d="M6.4 14.2 10 10.6l3.6 3.6M3 15.5h14"/>',
    punching: '<rect x="3.5" y="11" width="13" height="4.5"/><path d="M8 11V4.5h4V11M10 4.5V3"/>',
    punch_laser: '<rect x="3.5" y="11.5" width="13" height="4"/><path d="M7.5 11.5V6h2.6v5.5M14 3.5v5M12.4 6.8 14 8.6l1.6-1.8"/>',
    bending: '<path d="M3 14.5h6.2L15.8 7.6"/><path d="M3 17.2h14"/>',
    panel_bending: '<rect x="4" y="4" width="12" height="12"/><path d="M4 8.5h12M4 12h12"/>',
    tube_laser: '<ellipse cx="6" cy="10" rx="2.3" ry="4.4"/><path d="M6 5.6h9.8M6 14.4h9.8M15.8 5.6a2.3 4.4 0 0 1 0 8.8"/>',
    laser_welding: '<path d="M10 2.8v6M4 15.5h12M6.2 12.6 8 11M13.8 12.6 12 11M10 14v-3.4"/>',
    laser_3d: '<path d="M10 2.8 16.2 6.2v7.6L10 17.2 3.8 13.8V6.2z"/><path d="M3.8 6.2 10 9.6l6.2-3.4M10 9.6v7.6"/>',
  };
  /** Devuelve <svg> como SafeHtml. icon('pin', 'ico-lg') */
  UI.icon = (name, cls = '') => raw(`<svg class="ico ${cls}" viewBox="0 0 20 20" aria-hidden="true">${UI.icons[name] || UI.icons.info}</svg>`);
  UI.processIcon = (k) => (UI.icons[k] ? k : 'laser_2d');

  /* ── Banderas simplificadas (SVG propio, sin emojis; Windows no dibuja banderas emoji) ── */
  const H = (cols, ws) => { const t = ws.reduce((a, b) => a + b, 0); let y = 0; return cols.map((c, i) => { const h = (ws[i] / t) * 16; const r = `<rect y="${y}" width="24" height="${h + .2}" fill="${c}"/>`; y += h; return r; }).join(''); };
  const V = (cols) => cols.map((c, i) => `<rect x="${i * 8}" width="8.1" height="16" fill="${c}"/>`).join('');
  const FLAGS = {
    AR: () => H(['#74ACDF', '#fff', '#74ACDF'], [1, 1, 1]) + '<circle cx="12" cy="8" r="1.7" fill="#F6B40E"/>',
    CL: () => '<rect width="24" height="16" fill="#fff"/><rect y="8" width="24" height="8" fill="#D52B1E"/><rect width="8" height="8" fill="#0039A6"/><circle cx="4" cy="4" r="1.4" fill="#fff"/>',
    UY: () => H(['#fff', '#0038A8', '#fff', '#0038A8', '#fff', '#0038A8', '#fff', '#0038A8', '#fff'], [1, 1, 1, 1, 1, 1, 1, 1, 1]) + '<rect width="9" height="8.9" fill="#fff"/><circle cx="4.5" cy="4.4" r="2" fill="#FCD116"/>',
    PY: () => H(['#D52B1E', '#fff', '#0038A8'], [1, 1, 1]) + '<circle cx="12" cy="8" r="1.8" fill="none" stroke="#2B7A3B" stroke-width=".7"/>',
    BO: () => H(['#D52B1E', '#F9E300', '#007934'], [1, 1, 1]),
    PE: () => V(['#D91023', '#fff', '#D91023']),
    EC: () => H(['#FFDD00', '#034EA2', '#ED1C24'], [2, 1, 1]),
    CO: () => H(['#FCD116', '#003893', '#CE1126'], [2, 1, 1]),
    VE: () => H(['#FFCC00', '#00247D', '#CF142B'], [1, 1, 1]) + '<g fill="#fff"><circle cx="8" cy="8.6" r=".6"/><circle cx="10.2" cy="9.2" r=".6"/><circle cx="12" cy="9.4" r=".6"/><circle cx="13.8" cy="9.2" r=".6"/><circle cx="16" cy="8.6" r=".6"/></g>',
    CR: () => H(['#002B7F', '#fff', '#CE1126', '#fff', '#002B7F'], [1, 1, 2, 1, 1]),
    PA: () => '<rect width="24" height="16" fill="#fff"/><rect x="12" width="12" height="8" fill="#D21034"/><rect y="8" width="12" height="8" fill="#005293"/>',
    GT: () => V(['#4997D0', '#fff', '#4997D0']),
    SV: () => H(['#0F47AF', '#fff', '#0F47AF'], [1, 1, 1]),
    HN: () => H(['#0073CF', '#fff', '#0073CF'], [1, 1, 1]) + '<g fill="#0073CF"><circle cx="9.5" cy="8" r=".6"/><circle cx="14.5" cy="8" r=".6"/><circle cx="12" cy="8" r=".6"/></g>',
    NI: () => H(['#0067C6', '#fff', '#0067C6'], [1, 1, 1]),
    DO: () => '<rect width="24" height="16" fill="#fff"/><rect width="10" height="6.4" fill="#002D62"/><rect x="14" width="10" height="6.4" fill="#CE1126"/><rect y="9.6" width="10" height="6.4" fill="#CE1126"/><rect x="14" y="9.6" width="10" height="6.4" fill="#002D62"/>',
    CU: () => H(['#002A8F', '#fff', '#002A8F', '#fff', '#002A8F'], [1, 1, 1, 1, 1]) + '<path d="M0 0 11 8 0 16z" fill="#CF142B"/>',
    PR: () => H(['#ED0000', '#fff', '#ED0000', '#fff', '#ED0000'], [1, 1, 1, 1, 1]) + '<path d="M0 0 11 8 0 16z" fill="#0050F0"/>',
    MX: () => V(['#006847', '#fff', '#CE1126']) + '<circle cx="12" cy="8" r="1.6" fill="#8C6B2F"/>',
    BR: () => '<rect width="24" height="16" fill="#009B3A"/><path d="M12 2.2 21.4 8 12 13.8 2.6 8z" fill="#FEDF00"/><circle cx="12" cy="8" r="3" fill="#002776"/>',
    HT: () => H(['#00209F', '#D21034'], [1, 1]),
    BZ: () => '<rect width="24" height="16" fill="#003F87"/><rect width="24" height="2" fill="#CE1126"/><rect y="14" width="24" height="2" fill="#CE1126"/><circle cx="12" cy="8" r="3.4" fill="#fff"/>',
  };
  /** Bandera cuadrada-suave 3:2. flag('PE') → SafeHtml */
  UI.flag = (cc, w = 18) => {
    const body = FLAGS[cc] ? FLAGS[cc]() : `<rect width="24" height="16" fill="#899FB2"/><text x="12" y="11" text-anchor="middle" font-size="7.5" font-weight="700" fill="#fff" font-family="monospace">${u.esc(cc || '')}</text>`;
    return raw(`<span class="flag" style="--w:${w}px"><svg viewBox="0 0 24 16" preserveAspectRatio="none" aria-hidden="true">${body}</svg></span>`);
  };

  /* ── Anillo de puntaje con letra de tier ────────────────────────────── */
  UI.ring = ({ score = 0, tier = 'C', size = 52, label = true, animate = true } = {}) => {
    const C = 2 * Math.PI * 18, off = C * (1 - u.clamp(score, 0, 100) / 100);
    const col = `var(--tier-${String(tier).toLowerCase()})`;
    return raw(`<span class="ring" data-tier="${tier}" style="--size:${size}px"><svg viewBox="0 0 44 44" aria-hidden="true"><circle class="ring-bg" cx="22" cy="22" r="18"/><circle class="ring-fg" cx="22" cy="22" r="18" style="stroke:${col};stroke-dasharray:${C.toFixed(2)};stroke-dashoffset:${animate ? C.toFixed(2) : off.toFixed(2)}" data-off="${off.toFixed(2)}" transform="rotate(-90 22 22)"/></svg>${label ? `<b class="ring-t">${tier}</b><i class="ring-n num" data-count="${Math.round(score)}">${animate ? 0 : Math.round(score)}</i>` : ''}</span>`);
  };
  /** Dispara la animación de anillos + contadores dentro de root. */
  UI.reveal = (root = document) => {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      root.querySelectorAll('.ring-fg[data-off]').forEach((c) => { c.style.strokeDashoffset = c.dataset.off; });
      root.querySelectorAll('[data-count]').forEach((el) => UI.countUp(el, +el.dataset.count, { decimals: +(el.dataset.dec || 0), delay: +(el.dataset.delay || 0) }));
    }));
  };
  UI.countUp = (el, to, { from = 0, duration = 900, decimals = 0, delay = 0, format } = {}) => {
    const fmt = format || ((v) => (decimals ? TL.i18n.dec(v, decimals) : TL.i18n.int(v)));
    if (TL.reduceMotion || !isFinite(to)) { el.textContent = fmt(to); return; }
    const t0 = performance.now() + delay;
    const step = (now) => {
      const t = u.clamp((now - t0) / duration, 0, 1);
      const e = t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
      el.textContent = fmt(from + (to - from) * e);
      if (t < 1) requestAnimationFrame(step);
    };
    el.textContent = fmt(from);
    requestAnimationFrame(step);
  };

  /* ── Placa de logo (contraste garantizado vía logo_bg) ──────────────── */
  UI.logo = (rec, size = 44) => {
    const bg = rec?.logo_bg === 'dark' ? 'dark' : 'light';
    const inner = rec?.logo
      ? `<img class="logo-img" src="${u.esc(rec.logo)}" alt="" loading="lazy" decoding="async">`
      : `<span class="logo-mono">${u.esc(u.initials(rec?.name))}</span>`;
    return raw(`<span class="logo-plate ${rec?.logo ? '' : 'nologo'}" data-bg="${bg}" data-ini="${u.esc(u.initials(rec?.name))}" style="--s:${size}px">${inner}</span>`);
  };
  document.addEventListener('error', (e) => {
    const t = e.target;
    if (t && t.tagName === 'IMG' && t.classList.contains('logo-img')) {
      const p = t.parentNode; p.classList.add('nologo'); t.remove();
      p.insertAdjacentHTML('beforeend', `<span class="logo-mono">${u.esc(p.dataset.ini || '·')}</span>`);
    }
  }, true);

  /* ── Chip, barra, barrido láser, toast ──────────────────────────────── */
  UI.chip = (text, { color, title, cls = '' } = {}) => raw(`<span class="chip ${cls}"${title ? ` title="${u.esc(title)}"` : ''}>${color ? `<i class="chip-dot" style="background:${color}"></i>` : ''}${u.esc(text)}</span>`);
  UI.sweep = (el = document.getElementById('tl-panel')) => {
    const s = el?.querySelector('.laser-sweep'); if (!s || TL.reduceMotion) return;
    s.classList.remove('run'); void s.offsetWidth; s.classList.add('run');
  };
  UI.toast = (msg, { ms = 2600, kind = 'info' } = {}) => {
    const root = document.getElementById('tl-toast-root'); if (!root) return;
    const t = u.h('div.toast', { 'data-kind': kind, role: 'status' }, msg);
    root.appendChild(t);
    requestAnimationFrame(() => t.classList.add('in'));
    setTimeout(() => { t.classList.remove('in'); u.afterTransition(t, () => t.remove(), 400); }, ms);
  };

  /* ── Pila de Esc: solo responde la capa superior ────────────────────── */
  const escStack = [];
  UI.escPush = (fn) => { const e = { fn }; escStack.push(e); return () => { const i = escStack.indexOf(e); if (i >= 0) escStack.splice(i, 1); }; };
  UI.escTop = () => escStack[escStack.length - 1]?.fn || null;
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || e.defaultPrevented) return;
    const fn = UI.escTop(); if (!fn) return;
    e.preventDefault(); e.stopPropagation();
    try { fn(e); } catch (err) { console.error('[TL.ui] esc', err); }
  });

  const put = (host, c) => {
    host.innerHTML = '';
    if (c == null) return;
    if (c.nodeType) host.appendChild(c); else host.innerHTML = String(c);
  };
  /** Foco atrapado dentro de un contenedor (Tab / Shift+Tab). */
  const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';
  const trapFocus = (root) => (e) => {
    if (e.key !== 'Tab') return;
    const f = u.qsa(FOCUSABLE, root).filter((x) => x.offsetParent !== null);
    if (!f.length) return;
    const a = f[0], z = f[f.length - 1];
    if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
    else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
  };

  /* ── Estado vacío y KPI ─────────────────────────────────────────────── */
  UI.empty = (text, icon = 'info') => raw(`<div class="empty">${UI.icon(icon)}<p>${u.esc(text)}</p></div>`);
  UI.kpi = ({ label, value, decimals = 0, suffix = '', prefix = '', sub = '', accent = false } = {}) => {
    const v = Number(value);
    const num = isFinite(v) ? `<b class="kpi-n num" data-count="${v}" data-dec="${decimals}">0</b>` : `<b class="kpi-n num">${u.esc(value ?? '—')}</b>`;
    return raw(`<div class="kpi${accent ? ' kpi-accent' : ''}"><span class="kpi-l">${u.esc(label)}</span><span class="kpi-v">${prefix ? `<i class="kpi-x">${u.esc(prefix)}</i>` : ''}${num}${suffix ? `<i class="kpi-x">${u.esc(suffix)}</i>` : ''}</span>${sub ? `<span class="kpi-s">${u.esc(sub)}</span>` : ''}</div>`);
  };

  /* ── Modal ──────────────────────────────────────────────────────────── */
  UI.modal = function ({ title = '', content = '', actions = [], size = 'md', cls = '', onClose } = {}) {
    const root = document.getElementById('tl-modal-root');
    const prevFocus = document.activeElement;
    const el = u.h('div.modal', { class: cls, 'data-size': size, role: 'dialog', 'aria-modal': 'true' });
    el.innerHTML = `<div class="modal-scrim" data-close></div><div class="modal-box" tabindex="-1"><i class="laser-sweep" aria-hidden="true"></i>
      <header class="modal-head"><h2 class="modal-title"></h2><button type="button" class="icon-btn modal-x" data-close data-i18n-attr="aria-label:ui.close" aria-label="${u.esc(TL.i18n.t('ui.close'))}">${UI.icon('close')}</button></header>
      <div class="modal-body thin-scroll"></div><footer class="modal-foot" hidden></footer></div>`;
    const box = el.querySelector('.modal-box'), body = el.querySelector('.modal-body'), foot = el.querySelector('.modal-foot');
    el.querySelector('.modal-title').textContent = title || '';
    if (!title) el.querySelector('.modal-title').classList.add('sr');
    put(body, content);
    let closed = false, popEsc;
    const api = {
      el, body,
      close() {
        if (closed) return; closed = true; popEsc?.();
        el.classList.remove('in');
        u.afterTransition(box, () => el.remove(), 360);
        try { onClose?.(); } catch (err) { console.error(err); }
        if (prevFocus && prevFocus.focus) prevFocus.focus({ preventScroll: true });
      },
      setContent(c) { put(body, c); TL.i18n.apply(body); UI.reveal(body); },
      setActions(list) { renderActions(list); },
      setTitle(s) { el.querySelector('.modal-title').textContent = s; },
    };
    function renderActions(list) {
      foot.innerHTML = ''; foot.hidden = !(list && list.length);
      (list || []).forEach((a) => {
        const b = u.h('button.btn', { type: 'button', class: a.kind ? 'btn-' + a.kind : '' });
        if (a.icon) b.insertAdjacentHTML('beforeend', String(UI.icon(a.icon)));
        b.appendChild(u.h('span', a.label));
        b.addEventListener('click', () => a.onClick ? a.onClick(api) : api.close());
        foot.appendChild(b);
      });
    }
    renderActions(actions);
    el.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) api.close(); });
    el.addEventListener('keydown', trapFocus(el));
    root.appendChild(el);
    popEsc = UI.escPush(() => api.close());
    TL.i18n.apply(body);
    requestAnimationFrame(() => { el.classList.add('in'); UI.sweep(box); UI.reveal(body); box.focus({ preventScroll: true }); });
    return api;
  };

  /* ── Overlay editorial a pantalla completa ──────────────────────────── */
  const overlays = new Map();
  UI.overlay = {
    open({ id = 'ov', title = '', kicker = '', content = '', cls = '', onClose, actions } = {}) {
      if (overlays.has(id)) overlays.get(id).close(true);
      const root = document.getElementById('tl-overlay-root');
      const prevFocus = document.activeElement;
      const el = u.h('section.overlay', { class: cls, role: 'dialog', 'aria-modal': 'true', 'data-id': id });
      el.innerHTML = `<div class="ov-bar"><div class="ov-brand"><img class="logo-on-light" src="assets/trumpf/trumpf-logo.svg" alt="" width="26" height="26"><img class="logo-on-dark" src="assets/trumpf/trumpf-logo-white.svg" alt="" width="26" height="26">
        <span class="ov-kicker mono"></span><span class="ov-title"></span></div><div class="ov-actions"></div>
        <button type="button" class="btn btn-ghost btn-sm ov-x" data-close>${UI.icon('close')}<span data-i18n="ui.close">${u.esc(TL.i18n.t('ui.close'))}</span><kbd>Esc</kbd></button></div>
        <i class="laser-sweep" aria-hidden="true"></i><div class="ov-scroll thin-scroll" tabindex="-1"><div class="ov-body"></div></div>`;
      el.querySelector('.ov-kicker').textContent = kicker || '';
      el.querySelector('.ov-title').textContent = title || '';
      const body = el.querySelector('.ov-body'), scroll = el.querySelector('.ov-scroll');
      const acts = el.querySelector('.ov-actions');
      (actions || []).forEach((a) => {
        const b = u.h('button.btn.btn-sm', { type: 'button', class: a.kind ? 'btn-' + a.kind : 'btn-ghost' });
        if (a.icon) b.insertAdjacentHTML('beforeend', String(UI.icon(a.icon)));
        b.appendChild(u.h('span', a.label)); b.addEventListener('click', () => a.onClick?.(api)); acts.appendChild(b);
      });
      put(body, content);
      let closed = false, popEsc;
      const api = {
        el, body, scroll, id,
        close(instant) {
          if (closed) return; closed = true; popEsc?.(); overlays.delete(id);
          document.body.classList.toggle('overlay-open', overlays.size > 0);
          if (instant) el.remove(); else { el.classList.remove('in'); u.afterTransition(el, () => el.remove(), 520); }
          try { onClose?.(); } catch (err) { console.error(err); }
          if (prevFocus && prevFocus.focus && !instant) prevFocus.focus({ preventScroll: true });
        },
        setContent(c) { put(body, c); TL.i18n.apply(body); UI.reveal(body); },
        setTitle(tt, k) { if (tt != null) el.querySelector('.ov-title').textContent = tt; if (k != null) el.querySelector('.ov-kicker').textContent = k; },
      };
      el.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) api.close(); });
      root.appendChild(el);
      overlays.set(id, api);
      TL.map?.spin?.(false);
      document.body.classList.add('overlay-open');
      popEsc = UI.escPush(() => api.close());
      TL.i18n.apply(body);
      requestAnimationFrame(() => requestAnimationFrame(() => { el.classList.add('in'); UI.sweep(el); UI.reveal(body); scroll.focus({ preventScroll: true }); }));
      return api;
    },
    close(id) { if (id) overlays.get(id)?.close(); else [...overlays.values()].forEach((o) => o.close()); },
    isOpen: (id) => (id ? overlays.has(id) : overlays.size > 0),
    get: (id) => overlays.get(id) || null,
  };

  /* ── Lightbox con flechas ───────────────────────────────────────────── */
  UI.lightbox = (() => {
    let items = [], idx = 0, popEsc = null, el = null;
    const render = () => {
      const it = items[idx] || {};
      el.querySelector('.lb-img').innerHTML = `<img src="${u.esc(it.src)}" alt="${u.esc(it.caption || '')}" decoding="async">`;
      el.querySelector('.lb-cap').textContent = it.caption || '';
      el.querySelector('.lb-n').textContent = items.length > 1 ? `${idx + 1} / ${items.length}` : '';
      el.querySelectorAll('.lb-nav').forEach((b) => { b.hidden = items.length < 2; });
    };
    const go = (d) => { if (items.length < 2) return; idx = (idx + d + items.length) % items.length; render(); };
    const onKey = (e) => { if (e.key === 'ArrowRight') go(1); else if (e.key === 'ArrowLeft') go(-1); };
    const api = {
      open(list, i = 0) {
        items = (list || []).filter((x) => x && x.src); if (!items.length) return;
        idx = u.clamp(i, 0, items.length - 1);
        el = document.getElementById('tl-lightbox');
        if (!el.dataset.built) {
          el.dataset.built = '1'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
          el.innerHTML = `<div class="lb-scrim" data-lb-close></div><figure class="lb-fig"><div class="lb-img"></div><figcaption><span class="lb-cap"></span><span class="lb-n mono"></span></figcaption></figure>
            <button type="button" class="lb-nav lb-prev icon-btn" data-d="-1">${UI.icon('back')}</button><button type="button" class="lb-nav lb-next icon-btn" data-d="1">${UI.icon('next')}</button>
            <button type="button" class="lb-x icon-btn" data-lb-close>${UI.icon('close')}</button>`;
          el.addEventListener('click', (e) => { const n = e.target.closest('.lb-nav'); if (n) return go(+n.dataset.d); if (e.target.closest('[data-lb-close]')) api.close(); });
        }
        el.querySelector('.lb-prev').setAttribute('aria-label', TL.i18n.t('ui.previous'));
        el.querySelector('.lb-next').setAttribute('aria-label', TL.i18n.t('ui.next'));
        el.querySelector('.lb-x').setAttribute('aria-label', TL.i18n.t('ui.close'));
        render();
        el.hidden = false; requestAnimationFrame(() => el.classList.add('in'));
        popEsc?.(); popEsc = UI.escPush(() => api.close());
        document.addEventListener('keydown', onKey);
        el.querySelector('.lb-x').focus({ preventScroll: true });
      },
      close() {
        if (!el || el.hidden) return;
        popEsc?.(); popEsc = null; document.removeEventListener('keydown', onKey);
        el.classList.remove('in'); setTimeout(() => { el.hidden = true; }, 260);
      },
      isOpen: () => !!el && !el.hidden,
    };
    return api;
  })();

})();
