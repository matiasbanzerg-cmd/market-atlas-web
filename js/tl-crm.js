/* ==========================================================================
   tl-crm.js — Seguimiento comercial (CRM liviano).
   Estados por prospecto + notas, respaldo en localStorage y sincronización
   con n8n (TL_CONFIG.n8n.crm: action list / upsert). Bloque para la ficha
   (renderInto) y tablero a pantalla completa (kanban + tabla + Excel).
   API: TL.crm = { get, status, set, note, renderInto, openBoard, sync, STATES }
   ========================================================================== */
(function () {
  'use strict';
  const { u } = TL;
  const html = u.html, raw = u.raw;
  const t = (k, v) => TL.i18n.t(k, v);
  const icon = (n, c) => TL.ui.icon(n, c);

  const STATES = ['sin_contactar', 'contactado', 'reunion', 'demo', 'cotizacion', 'negociacion', 'ganado', 'perdido'];
  const LINEAR = STATES.slice(0, 6);
  const PIPE = ['contactado', 'reunion', 'demo', 'cotizacion', 'negociacion'];
  const DEFAULT = 'sin_contactar';

  /* ── Almacenamiento local ───────────────────────────────────────────── */
  let db = TL.store.get('crm', {}) || {};
  if (typeof db !== 'object' || Array.isArray(db)) db = {};
  let queue = TL.store.get('crmQueue', []) || [];
  if (!Array.isArray(queue)) queue = [];
  const persist = () => TL.store.set('crm', db);
  const persistQueue = () => TL.store.set('crmQueue', queue);

  const author = () => TL.data?.cfg?.author || window.TL_CONFIG?.author || 'Matías Banzer';
  const now = () => new Date().toISOString();
  const ts = (iso) => { const n = Date.parse(iso || ''); return isFinite(n) ? n : 0; };
  const valid = (s) => STATES.includes(s);
  const label = (s) => t('crm.st.' + (valid(s) ? s : DEFAULT));

  function entry(id) {
    let e = db[id];
    if (!e || typeof e !== 'object') e = db[id] = { status: DEFAULT, owner: '', notes: [], updated_at: null, updated_by: '' };
    if (!Array.isArray(e.notes)) e.notes = [];
    if (!valid(e.status)) e.status = DEFAULT;
    return e;
  }
  const get = (id) => {
    const e = db[id];
    return {
      status: valid(e?.status) ? e.status : DEFAULT, owner: e?.owner || '', notes: (e?.notes || []).slice(),
      updated_at: e?.updated_at || null, updated_by: e?.updated_by || '',
    };
  };
  const lastNote = (id) => { const n = db[id]?.notes; return n && n.length ? n[n.length - 1] : null; };

  /* ── Estado de sincronización ───────────────────────────────────────── */
  const SY = { mode: 'local', at: null, busy: false, error: null };
  const setSync = (patch) => { Object.assign(SY, patch); TL.emit('crm:sync', Object.assign({}, SY)); paintSyncAll(); };
  const hasNet = () => !!(TL.net && TL.net.has && TL.net.has('crm'));

  function normNote(n, it) {
    if (n == null) return null;
    if (typeof n === 'string') return { text: n, author: it?.updated_by || '', at: it?.updated_at || now() };
    const text = String(n.text ?? n.note ?? '').trim();
    if (!text) return null;
    return { text, author: n.author || it?.updated_by || '', at: n.at || n.created_at || n.date || it?.updated_at || now() };
  }
  /** Fusiona un ítem remoto: gana el updated_at más reciente; notas = unión sin duplicados. */
  function mergeItem(it) {
    if (!it || !it.id) return false;
    const e = entry(it.id);
    let changed = false;
    if (ts(it.updated_at) > ts(e.updated_at)) {
      if (valid(it.status) && it.status !== e.status) { e.status = it.status; changed = true; }
      if (it.owner != null) e.owner = it.owner;
      e.updated_at = it.updated_at; e.updated_by = it.updated_by || e.updated_by;
    }
    (Array.isArray(it.notes) ? it.notes : []).map((n) => normNote(n, it)).filter(Boolean).forEach((n) => {
      const dup = e.notes.some((m) => u.norm(m.text) === u.norm(n.text) && (m.author || '') === (n.author || '') && Math.abs(ts(m.at) - ts(n.at)) < 15 * 60e3);
      if (!dup) { e.notes.push(n); changed = true; }
    });
    if (changed) e.notes.sort((a, b) => ts(a.at) - ts(b.at));
    return changed;
  }

  async function push(op) {
    if (!hasNet()) { setSync({ mode: 'local', error: 'unconfigured' }); return false; }
    const r = await TL.net.call('crm', op, { timeout: 20000 });
    if (r && r.ok) {
      if (r.item && mergeItem(r.item)) { persist(); TL.emit('crm:changed', r.item.id); }
      setSync({ mode: 'synced', at: new Date(), error: null });
      return true;
    }
    queue.push(op); persistQueue();
    setSync({ mode: 'local', error: r?.error || 'error' });
    return false;
  }

  /** Lista remota → merge; luego reenvía la cola pendiente. */
  async function sync() {
    if (!hasNet()) { setSync({ mode: 'local', error: 'unconfigured', busy: false }); return { ok: false, local: true }; }
    if (SY.busy) return { ok: false, busy: true };
    setSync({ busy: true });
    const r = await TL.net.call('crm', { action: 'list' }, { timeout: 25000 });
    if (!r || !r.ok) { setSync({ busy: false, mode: 'local', error: r?.error || 'error' }); return { ok: false }; }
    const ids = [];
    (Array.isArray(r.items) ? r.items : []).forEach((it) => { if (mergeItem(it)) ids.push(it.id); });
    if (ids.length) { persist(); ids.forEach((id) => TL.emit('crm:changed', id)); }
    const pending = queue.splice(0);
    persistQueue();
    for (let i = 0; i < pending.length; i++) {
      const ok = await TL.net.call('crm', pending[i], { timeout: 20000 });
      if (!ok || !ok.ok) { queue.unshift(...pending.slice(i)); persistQueue(); break; }
      if (ok.item && mergeItem(ok.item)) { persist(); TL.emit('crm:changed', ok.item.id); }
    }
    setSync({ busy: false, mode: 'synced', at: new Date(), error: null });
    return { ok: true, merged: ids.length };
  }

  /* ── Mutaciones ─────────────────────────────────────────────────────── */
  function setStatus(id, status) {
    if (!id || !valid(status)) return false;
    const e = entry(id);
    if (e.status === status) return false;
    e.status = status; e.updated_at = now(); e.updated_by = author();
    if (!e.owner) e.owner = author();
    persist();
    TL.emit('crm:changed', id);
    push({ action: 'upsert', id, status, author: author() });
    return true;
  }
  function addNote(id, text) {
    text = String(text || '').trim();
    if (!id || !text) return false;
    const e = entry(id);
    const n = { text, author: author(), at: now() };
    e.notes.push(n); e.updated_at = n.at; e.updated_by = n.author;
    if (!e.owner) e.owner = author();
    persist();
    TL.emit('crm:changed', id);
    push({ action: 'upsert', id, note: { text, author: n.author }, author: n.author });
    return true;
  }
  /* ── Formato ────────────────────────────────────────────────────────── */
  function rel(iso) {
    const ms = ts(iso); if (!ms) return '—';
    const d = (ms - Date.now()) / 1000, a = Math.abs(d);
    let rtf;
    try { rtf = new Intl.RelativeTimeFormat(TL.i18n.locale, { numeric: 'auto' }); } catch (e) { return TL.i18n.date(new Date(ms)); }
    if (a < 45) return t('crm.justNow');
    if (a < 3600) return rtf.format(Math.round(d / 60), 'minute');
    if (a < 86400) return rtf.format(Math.round(d / 3600), 'hour');
    if (a < 86400 * 30) return rtf.format(Math.round(d / 86400), 'day');
    return TL.i18n.date(new Date(ms));
  }
  const fullDate = (iso) => (ts(iso) ? TL.i18n.date(new Date(ts(iso)), { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '');
  const clock = (d) => TL.i18n.date(d, { hour: '2-digit', minute: '2-digit' });

  /* ── Indicador de sincronización ────────────────────────────────────── */
  function syncHtml(withBtn = false) {
    const mode = SY.busy ? 'busy' : SY.mode;
    const txt = SY.busy ? t('crm.syncing') : SY.mode === 'synced' ? t('crm.synced', { time: SY.at ? clock(SY.at) : '' }) : t('crm.localOnly');
    const tip = SY.mode === 'synced' ? t('crm.syncedTip') : hasNet() ? t('crm.offlineTip') : t('crm.localTip');
    return html`<span class="crm-sync" data-crm-sync data-mode="${mode}" title="${tip}"><i aria-hidden="true"></i><span>${txt}</span>${withBtn && hasNet() ? html`<button type="button" class="crm-sync-btn" data-act="sync" aria-label="${t('crm.syncNow')}" title="${t('crm.syncNow')}">${icon('refresh')}</button>` : ''}</span>`;
  }
  function paintSyncAll() {
    document.querySelectorAll('[data-crm-sync]').forEach((el) => {
      const withBtn = !!el.querySelector('.crm-sync-btn') || el.dataset.btn === '1';
      const n = u.el(syncHtml(withBtn));
      if (withBtn) n.dataset.btn = '1';
      el.replaceWith(n);
    });
  }

  /* ── Bloque de la ficha: stepper + notas ────────────────────────────── */
  function renderInto(el, id) {
    if (!el || !id) return;
    if (typeof el._crmOff === 'function') el._crmOff();
    el.classList.add('crm-blk');
    let seen = false;
    const paint = () => {
      const ta = el.querySelector('.crm-ta');
      const draft = ta ? ta.value : '';
      const hadFocus = ta && document.activeElement === ta;
      const e = get(id);
      const cur = e.status, ci = LINEAR.indexOf(cur), closed = cur === 'ganado' || cur === 'perdido';
      const notes = e.notes.slice().reverse();
      el.innerHTML = String(html`
        <div class="crm-blk-top"><span class="crm-lbl">${t('crm.status')}</span>${syncHtml()}</div>
        <div class="crm-stepper" role="group" aria-label="${t('crm.status')}">
          <ol class="crm-track">${LINEAR.map((s, i) => html`<li>
            <button type="button" class="crm-step" data-st="${s}" aria-pressed="${s === cur}" data-done="${closed || (ci >= 0 && i < ci)}">
              <span class="crm-step-bar" aria-hidden="true"></span>
              <span class="crm-step-n num">${String(i + 1).padStart(2, '0')}</span>
              <span class="crm-step-l">${label(s)}</span>
            </button></li>`)}
          </ol>
          <div class="crm-outs">
            <button type="button" class="crm-out" data-st="ganado" data-kind="won" aria-pressed="${cur === 'ganado'}">${icon('check')}<span>${label('ganado')}</span></button>
            <button type="button" class="crm-out" data-st="perdido" data-kind="lost" aria-pressed="${cur === 'perdido'}">${icon('close')}<span>${label('perdido')}</span></button>
          </div>
        </div>
        <p class="crm-upd">${e.updated_at ? html`${t('crm.lastChange')} <b>${label(cur)}</b> · ${e.updated_by || author()} · <time title="${fullDate(e.updated_at)}">${rel(e.updated_at)}</time>` : t('crm.never')}</p>
        <form class="crm-form" novalidate>
          <label class="sr" for="crm-ta-${id}">${t('crm.notePh')}</label>
          <textarea class="crm-ta" id="crm-ta-${id}" rows="3" placeholder="${t('crm.notePh')}"></textarea>
          <div class="crm-form-row"><span class="crm-hint"><kbd>Ctrl</kbd> + <kbd>↵</kbd></span>
            <button type="submit" class="btn btn-ink btn-sm">${icon('plus')}<span>${t('crm.addNote')}</span></button></div>
        </form>
        <div class="crm-notes-h"><span class="crm-lbl">${t('crm.history')}</span><span class="num">${notes.length}</span></div>
        ${notes.length ? html`<ul class="crm-notes">${notes.map((n) => html`<li class="crm-note">
            <div class="crm-note-h"><b>${n.author || '—'}</b><time class="num" datetime="${n.at}" title="${fullDate(n.at)}">${rel(n.at)}</time></div>
            <p>${n.text}</p></li>`)}</ul>` : html`<p class="crm-empty">${t('crm.noNotes')}</p>`}
      `);
      const nta = el.querySelector('.crm-ta');
      nta.value = draft;
      if (hadFocus) nta.focus({ preventScroll: true });
    };
    const onClick = (ev) => {
      const b = ev.target.closest('[data-st]');
      if (b && el.contains(b)) { setStatus(id, b.dataset.st); return; }
      if (ev.target.closest('[data-act="sync"]')) sync();
    };
    const submit = () => {
      const ta = el.querySelector('.crm-ta');
      if (!ta || !ta.value.trim()) { ta?.focus(); return; }
      const v = ta.value; ta.value = '';
      addNote(id, v);
      el.querySelector('.crm-ta')?.focus({ preventScroll: true });
    };
    const onSubmit = (ev) => { if (ev.target.closest('.crm-form')) { ev.preventDefault(); submit(); } };
    const onKey = (ev) => { if (ev.target.classList?.contains('crm-ta') && ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) { ev.preventDefault(); submit(); } };
    el.addEventListener('click', onClick);
    el.addEventListener('submit', onSubmit);
    el.addEventListener('keydown', onKey);
    const guard = (fn) => (...a) => { if (!el.isConnected) { if (seen) off(); return; } seen = true; fn(...a); };
    const offs = [
      TL.on('crm:changed', guard((x) => { if (x === id) paint(); })),
      TL.on('lang', guard(paint)),
    ];
    const off = () => { offs.forEach((f) => f()); el.removeEventListener('click', onClick); el.removeEventListener('submit', onSubmit); el.removeEventListener('keydown', onKey); el._crmOff = null; };
    el._crmOff = off;
    paint();
    return { refresh: paint, destroy: off };
  }
  /* ── Tablero a pantalla completa ────────────────────────────────────── */
  const COL_PAGE = 30, ROW_PAGE = 60;
  const BV = { mode: TL.store.get('crmView', 'board') === 'table' ? 'table' : 'board', kind: 'client', cc: '', tier: '', st: '', q: '', sort: { key: 'score', dir: -1 }, rows: ROW_PAGE, col: {} };
  let ov = null, wrap = null, firstKpi = true, io = null, ovOffs = [];

  const pool = () => (BV.kind === 'rep' ? TL.data.reps : TL.data.clients);
  function filtered(ignoreState) {
    const q = u.norm(BV.q);
    return pool().filter((r) => (!BV.cc || r.country === BV.cc) && (!BV.tier || r.tier === BV.tier)
      && (ignoreState || !BV.st || get(r.id).status === BV.st)
      && (!q || u.norm([r.name, r.legal_name, r.city, r.id, TL.data.countryName(r.country)].join(' ')).includes(q)));
  }
  const score = (r) => Math.round(TL.data.score(r));
  const stKind = (s) => (s === 'ganado' ? 'won' : s === 'perdido' ? 'lost' : PIPE.includes(s) ? 'pipe' : 'idle');

  function kpisHtml() {
    const list = filtered(true), n = list.length;
    const cnt = (arr) => list.filter((r) => arr.includes(get(r.id).status)).length;
    const pct = (x) => (n ? TL.i18n.pct(x / n) : '—');
    const k = [
      { label: t(BV.kind === 'rep' ? 'crm.kTotalReps' : 'crm.kTotal'), value: n },
      { label: t('crm.kPipe'), value: cnt(PIPE), sub: pct(cnt(PIPE)) },
      { label: t('crm.kMeet'), value: cnt(['reunion', 'demo']), sub: pct(cnt(['reunion', 'demo'])) },
      { label: t('crm.kQuote'), value: cnt(['cotizacion', 'negociacion']), sub: t('crm.kQuoteSub') },
      { label: t('crm.kWon'), value: cnt(['ganado']), sub: pct(cnt(['ganado'])), accent: true },
    ];
    const el = u.el(html`<div class="crm-kpis kpis">${k.map((x) => TL.ui.kpi ? TL.ui.kpi(x) : html`<div class="kpi"><span class="kpi-l">${x.label}</span><b class="kpi-n num">${x.value}</b></div>`)}</div>`);
    if (!firstKpi) el.querySelectorAll('[data-count]').forEach((b) => { b.textContent = TL.i18n.int(+b.dataset.count); b.removeAttribute('data-count'); });
    return el;
  }

  function barHtml() {
    const ccs = u.unique(pool().map((r) => r.country)).filter(Boolean).map((cc) => ({ cc, name: TL.data.countryName(cc) })).sort((a, b) => a.name.localeCompare(b.name, TL.i18n.lang));
    const segBtn = (attr, val, cur, txt) => html`<button type="button" ${raw(attr)}="${val}" aria-pressed="${val === cur}">${txt}</button>`;
    return html`<div class="crm-bar">
      <div class="seg" role="group" aria-label="${t('crm.viewAs')}">${segBtn('data-view', 'board', BV.mode, t('crm.board'))}${segBtn('data-view', 'table', BV.mode, t('crm.table'))}</div>
      <div class="seg" role="group" aria-label="${t('crm.kind')}">${segBtn('data-kindsel', 'client', BV.kind, t('crm.clients'))}${segBtn('data-kindsel', 'rep', BV.kind, t('crm.reps'))}</div>
      <span class="crm-bar-sep" aria-hidden="true"></span>
      <label class="crm-sel-w"><span class="sr">${t('crm.fCountry')}</span><select data-f="cc"><option value="">${t('crm.allCountries')}</option>${ccs.map((c) => html`<option value="${c.cc}" ${raw(c.cc === BV.cc ? 'selected' : '')}>${c.name}</option>`)}</select>${icon('chevDown')}</label>
      <div class="seg crm-tiers" role="group" aria-label="${t('crm.fTier')}">${segBtn('data-tier', '', BV.tier, t('crm.allTiers'))}${['A', 'B', 'C'].map((x) => segBtn('data-tier', x, BV.tier, x))}</div>
      <label class="crm-sel-w"><span class="sr">${t('crm.fStatus')}</span><select data-f="st"><option value="">${t('crm.allStates')}</option>${STATES.map((s) => html`<option value="${s}" ${raw(s === BV.st ? 'selected' : '')}>${label(s)}</option>`)}</select>${icon('chevDown')}</label>
      <label class="crm-search">${icon('search')}<span class="sr">${t('ui.search')}</span><input type="search" data-f="q" value="${BV.q}" placeholder="${t('crm.searchPh')}" autocomplete="off" spellcheck="false"></label>
      <span class="crm-count num" aria-live="polite"></span>
    </div>`;
  }

  function cardHtml(r, i) {
    const e = get(r.id), ln = lastNote(r.id), sc = score(r);
    return html`<article class="crm-card" draggable="true" data-id="${r.id}" style="--i:${Math.min(i, 12)}">
      <button type="button" class="crm-card-open" data-open="${r.id}">
        ${TL.ui.logo(r, 30)}
        <span class="crm-card-t"><b>${r.name || r.id}</b><span>${TL.ui.flag(r.country, 13)}${r.city ? r.city + ' · ' : ''}${r.country}</span></span>
        <span class="crm-tr" data-tier="${r.tier || 'C'}">${TL.ui.ring({ score: sc, tier: r.tier || 'C', size: 28, label: false, animate: false })}<i>${r.tier || 'C'}</i></span>
      </button>
      <div class="crm-card-f">
        <p class="crm-card-note${ln ? '' : ' is-empty'}">${ln ? ln.text : t('crm.noNotesShort')}</p>
        <span class="crm-card-m">
          <time class="num" title="${fullDate(e.updated_at)}">${e.updated_at ? rel(e.updated_at) : ''}</time>
          <button type="button" class="crm-card-menu" data-menu="${r.id}" aria-haspopup="menu" aria-expanded="false" aria-label="${t('crm.changeStatus')}: ${r.name || r.id}" title="${t('crm.changeStatus')}">${icon('chevDown')}</button>
        </span>
      </div>
    </article>`;
  }
  function boardHtml(list) {
    const by = u.groupBy(list, (r) => get(r.id).status);
    const sorter = (a, b) => ts(get(b.id).updated_at) - ts(get(a.id).updated_at) || score(b) - score(a);
    return html`<div class="crm-board">${STATES.map((s, si) => {
      const items = (by[s] || []).sort(sorter), lim = BV.col[s] || COL_PAGE;
      return html`<section class="crm-col" data-st="${s}" data-kind="${stKind(s)}" aria-label="${label(s)} (${items.length})">
        <header class="crm-col-h"><span class="crm-col-i num">${si < 6 ? String(si + 1).padStart(2, '0') : si === 6 ? '✓' : '×'}</span><span class="crm-col-l">${label(s)}</span><b class="num">${items.length}</b></header>
        <div class="crm-col-b" data-drop="${s}">${items.slice(0, lim).map(cardHtml)}
          ${items.length > lim ? html`<button type="button" class="btn btn-ghost btn-sm crm-more" data-more-col="${s}">${t('ui.showMore', { n: Math.min(COL_PAGE, items.length - lim) })}</button>` : ''}
          ${items.length ? '' : html`<p class="crm-col-empty">${t('crm.dropHere')}</p>`}
        </div>
      </section>`;
    })}</div>`;
  }

  const COLS = [['name', 'crm.colName'], ['cc', 'crm.colCountry'], ['city', 'crm.colCity'], ['tier', 'crm.colTier'], ['score', 'crm.colScore'], ['status', 'crm.colStatus'], ['updated', 'crm.colUpdated'], ['notes', 'crm.colNotes']];
  const sortVal = {
    name: (r) => u.norm(r.name), cc: (r) => u.norm(TL.data.countryName(r.country)), city: (r) => u.norm(r.city), tier: (r) => r.tier || 'Z',
    score: (r) => score(r), status: (r) => STATES.indexOf(get(r.id).status), updated: (r) => ts(get(r.id).updated_at), notes: (r) => get(r.id).notes.length,
  };
  function sortedRows(list) {
    const f = sortVal[BV.sort.key] || sortVal.score, d = BV.sort.dir;
    return list.slice().sort((a, b) => { const x = f(a), y = f(b); return (x < y ? -1 : x > y ? 1 : 0) * d || score(b) - score(a); });
  }
  function rowHtml(r) {
    const e = get(r.id);
    return html`<tr data-id="${r.id}" data-kind="${stKind(e.status)}">
      <td class="crm-td-name"><button type="button" class="crm-t-open" data-open="${r.id}">${TL.ui.logo(r, 24)}<span>${r.name || r.id}</span></button></td>
      <td><span class="crm-t-cc">${TL.ui.flag(r.country, 14)}${TL.data.countryName(r.country)}</span></td>
      <td>${r.city || '—'}</td>
      <td><span class="crm-tier" data-tier="${r.tier || 'C'}">${r.tier || 'C'}</span></td>
      <td class="num crm-td-r">${score(r)}</td>
      <td><span class="crm-sel-w crm-sel-sm" data-kind="${stKind(e.status)}"><select class="crm-sel" data-id="${r.id}" aria-label="${t('crm.changeStatus')}: ${r.name || r.id}">${STATES.map((s) => html`<option value="${s}" ${raw(s === e.status ? 'selected' : '')}>${label(s)}</option>`)}</select>${icon('chevDown')}</span></td>
      <td class="num"><time title="${fullDate(e.updated_at)}">${e.updated_at ? rel(e.updated_at) : '—'}</time></td>
      <td class="num crm-td-r">${e.notes.length || '—'}</td>
    </tr>`;
  }
  function tableHtml(list) {
    const rows = sortedRows(list);
    return html`<div class="crm-tw"><table class="crm-table">
      <thead><tr>${COLS.map(([k, lk]) => html`<th scope="col" aria-sort="${BV.sort.key === k ? (BV.sort.dir > 0 ? 'ascending' : 'descending') : 'none'}" class="${k === 'score' || k === 'notes' ? 'crm-td-r' : ''}"><button type="button" data-sort="${k}">${t(lk)}${icon(BV.sort.key === k ? (BV.sort.dir > 0 ? 'chevUp' : 'chevDown') : 'sort', 'crm-sort-ico')}</button></th>`)}</tr></thead>
      <tbody>${rows.slice(0, BV.rows).map(rowHtml)}</tbody>
    </table>
    ${rows.length > BV.rows ? html`<div class="crm-sentinel"><button type="button" class="btn btn-ghost btn-sm" data-more-rows>${t('ui.showMore', { n: Math.min(ROW_PAGE, rows.length - BV.rows) })}</button></div>` : ''}
    ${rows.length ? '' : TL.ui.empty ? TL.ui.empty(t('crm.noMatch'), 'filter') : ''}
    </div>`;
  }
  /* ── Pintado y eventos del tablero ──────────────────────────────────── */
  function paintMain() {
    if (!wrap) return;
    const main = wrap.querySelector('.crm-main');
    const board = main.querySelector('.crm-board');
    const keepX = board ? board.scrollLeft : 0;
    const colY = {}; main.querySelectorAll('.crm-col-b').forEach((c) => { colY[c.dataset.drop] = c.scrollTop; });
    const list = filtered(false);
    main.dataset.mode = BV.mode;
    main.innerHTML = String(BV.mode === 'table' ? tableHtml(list) : boardHtml(list));
    const nb = main.querySelector('.crm-board');
    if (nb) { nb.scrollLeft = keepX; main.querySelectorAll('.crm-col-b').forEach((c) => { c.scrollTop = colY[c.dataset.drop] || 0; }); }
    const total = pool().length;
    const cnt = wrap.querySelector('.crm-count');
    if (cnt) cnt.textContent = list.length === total ? TL.i18n.int(total) : `${TL.i18n.int(list.length)} / ${TL.i18n.int(total)}`;
    wrap.querySelectorAll('[data-view]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === BV.mode)));
    wrap.querySelectorAll('[data-kindsel]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.kindsel === BV.kind)));
    wrap.querySelectorAll('[data-tier]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tier === BV.tier)));
    observeRows();
  }
  function paintKpis() {
    const old = wrap?.querySelector('.crm-kpis'); if (!old) return;
    const n = kpisHtml(); old.replaceWith(n);
    if (firstKpi) { TL.ui.reveal?.(n); firstKpi = false; }
  }
  function paintAll() {
    if (!wrap) return;
    const q = wrap.querySelector('[data-f="q"]'), hadQ = q && document.activeElement === q;
    wrap.innerHTML = String(html`<header class="crm-head">
        <div><p class="kicker">${t('crm.kicker')}</p><h1 class="crm-h1">${t('crm.boardTitle')}</h1><p class="crm-lead">${t('crm.lead')}</p></div>
        <div class="crm-head-r">${syncHtml(true)}</div>
      </header>
      <div class="crm-kpis"></div>
      ${barHtml()}
      <div class="crm-main"></div>`);
    paintKpis(); paintMain();
    if (hadQ) { const nq = wrap.querySelector('[data-f="q"]'); nq.focus(); nq.setSelectionRange(nq.value.length, nq.value.length); }
  }
  const refresh = u.debounce(() => { paintKpis(); paintMain(); }, 60);

  function observeRows() {
    io?.disconnect(); io = null;
    const sen = wrap?.querySelector('.crm-sentinel');
    if (!sen || !('IntersectionObserver' in window)) return;
    io = new IntersectionObserver((ents) => { if (ents.some((x) => x.isIntersecting)) { BV.rows += ROW_PAGE; paintMain(); } }, { root: ov?.scroll || null, rootMargin: '400px' });
    io.observe(sen);
  }

  function openRec(id) {
    closeMenu();
    ov?.close();
    setTimeout(() => (TL.nav?.open ? TL.nav.open(id, { fly: true }) : TL.ficha?.open?.(id)), 60);
  }

  function bindBoard(el) {
    el.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b || !el.contains(b)) return;
      const d = b.dataset;
      if (d.view) { BV.mode = d.view; TL.store.set('crmView', BV.mode); BV.rows = ROW_PAGE; paintMain(); }
      else if (d.kindsel) { BV.kind = d.kindsel; BV.cc = ''; BV.col = {}; BV.rows = ROW_PAGE; firstKpi = false; paintAll(); }
      else if (d.tier !== undefined && b.closest('.crm-tiers')) { BV.tier = d.tier; refresh(); }
      else if (d.open) openRec(d.open);
      else if (d.menu) openMenu(b, d.menu);
      else if (d.sort) { BV.sort = { key: d.sort, dir: BV.sort.key === d.sort ? -BV.sort.dir : (d.sort === 'score' || d.sort === 'updated' || d.sort === 'notes' ? -1 : 1) }; paintMain(); el.querySelector(`[data-sort="${d.sort}"]`)?.focus(); }
      else if (d.moreCol) { BV.col[d.moreCol] = (BV.col[d.moreCol] || COL_PAGE) + COL_PAGE; paintMain(); }
      else if (b.hasAttribute('data-more-rows')) { BV.rows += ROW_PAGE; paintMain(); }
      else if (d.act === 'sync') sync();
    });
    el.addEventListener('change', (e) => {
      const s = e.target;
      if (s.classList.contains('crm-sel')) { setStatus(s.dataset.id, s.value); return; }
      if (s.dataset.f === 'cc' || s.dataset.f === 'st') { BV[s.dataset.f] = s.value; BV.col = {}; BV.rows = ROW_PAGE; refresh(); }
    });
    const onQ = u.debounce((v) => { BV.q = v; BV.rows = ROW_PAGE; refresh(); }, 140);
    el.addEventListener('input', (e) => { if (e.target.dataset.f === 'q') onQ(e.target.value); });

    // Drag & drop nativo
    let dragId = null;
    el.addEventListener('dragstart', (e) => {
      const c = e.target.closest?.('.crm-card'); if (!c) return;
      dragId = c.dataset.id;
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', dragId); } catch (err) { /* noop */ }
      requestAnimationFrame(() => c.classList.add('is-drag'));
      el.querySelector('.crm-board')?.classList.add('is-dragging');
    });
    el.addEventListener('dragend', (e) => {
      e.target.closest?.('.crm-card')?.classList.remove('is-drag');
      el.querySelectorAll('.crm-col.is-over').forEach((c) => c.classList.remove('is-over'));
      el.querySelector('.crm-board')?.classList.remove('is-dragging');
      dragId = null;
    });
    el.addEventListener('dragover', (e) => {
      const col = e.target.closest?.('.crm-col'); if (!col || !dragId) return;
      e.preventDefault(); e.dataTransfer.dropEffect = 'move';
      if (!col.classList.contains('is-over')) { el.querySelectorAll('.crm-col.is-over').forEach((c) => c.classList.remove('is-over')); col.classList.add('is-over'); }
    });
    el.addEventListener('dragleave', (e) => {
      const col = e.target.closest?.('.crm-col');
      if (col && !col.contains(e.relatedTarget)) col.classList.remove('is-over');
    });
    el.addEventListener('drop', (e) => {
      const col = e.target.closest?.('.crm-col'); if (!col) return;
      e.preventDefault();
      let id = dragId;
      try { id = e.dataTransfer.getData('text/plain') || id; } catch (err) { /* noop */ }
      col.classList.remove('is-over');
      if (id && setStatus(id, col.dataset.st)) flash(id);
    });
  }
  function flash(id) {
    setTimeout(() => {
      const c = wrap?.querySelector(`.crm-card[data-id="${CSS.escape(id)}"]`);
      if (!c) return;
      c.classList.add('is-moved');
      c.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: TL.reduceMotion ? 'auto' : 'smooth' });
      setTimeout(() => c.classList.remove('is-moved'), 1200);
    }, 90);
  }

  /* ── Menú de estado accesible por teclado ───────────────────────────── */
  let menu = null;
  function closeMenu(refocus) {
    if (!menu) return;
    const { el, btn, popEsc, onDown } = menu;
    menu = null;
    popEsc?.(); document.removeEventListener('pointerdown', onDown, true);
    btn?.setAttribute('aria-expanded', 'false');
    el.remove();
    if (refocus) {
      const id = btn?.dataset.menu;
      const nb = id && wrap?.querySelector(`[data-menu="${CSS.escape(id)}"]`);
      (nb || btn)?.focus?.({ preventScroll: true });
    }
  }
  function openMenu(btn, id) {
    if (menu && menu.btn === btn) { closeMenu(true); return; }
    closeMenu();
    const cur = get(id).status;
    const el = u.el(html`<div class="crm-menu" role="menu" aria-label="${t('crm.changeStatus')}">${STATES.map((s) => html`<button type="button" role="menuitemradio" aria-checked="${s === cur}" data-to="${s}" data-kind="${stKind(s)}" tabindex="-1"><i aria-hidden="true"></i><span>${label(s)}</span>${s === cur ? icon('check') : ''}</button>`)}</div>`);
    document.body.appendChild(el);
    const r = btn.getBoundingClientRect(), w = el.offsetWidth, h = el.offsetHeight;
    el.style.left = u.clamp(r.right - w, 8, innerWidth - w - 8) + 'px';
    el.style.top = (r.bottom + 4 + h > innerHeight - 8 ? Math.max(8, r.top - h - 4) : r.bottom + 4) + 'px';
    btn.setAttribute('aria-expanded', 'true');
    const items = u.qsa('[role="menuitemradio"]', el);
    const focusAt = (i) => items[(i + items.length) % items.length].focus();
    focusAt(Math.max(0, STATES.indexOf(cur)));
    el.addEventListener('keydown', (e) => {
      const i = items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); focusAt(i + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); focusAt(i - 1); }
      else if (e.key === 'Home') { e.preventDefault(); focusAt(0); }
      else if (e.key === 'End') { e.preventDefault(); focusAt(items.length - 1); }
      else if (e.key === 'Tab') { e.preventDefault(); closeMenu(true); }
    });
    el.addEventListener('click', (e) => {
      const it = e.target.closest('[data-to]'); if (!it) return;
      const changed = setStatus(id, it.dataset.to);
      closeMenu(false);
      setTimeout(() => { wrap?.querySelector(`[data-menu="${CSS.escape(id)}"]`)?.focus({ preventScroll: true }); if (changed) flash(id); }, 100);
    });
    const onDown = (e) => { if (!el.contains(e.target) && e.target !== btn && !btn.contains(e.target)) closeMenu(false); };
    document.addEventListener('pointerdown', onDown, true);
    menu = { el, btn, onDown, popEsc: TL.ui.escPush ? TL.ui.escPush(() => closeMenu(true)) : null };
  }
  /* ── Exportar a Excel (SheetJS) ─────────────────────────────────────── */
  const pad2 = (n) => String(n).padStart(2, '0');
  const ymd = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const stamp = (iso) => { const n = ts(iso); if (!n) return ''; const d = new Date(n); return `${ymd(d)} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`; };
  const first = (a) => (Array.isArray(a) ? a.find(Boolean) || '' : a || '');
  const yes = (b) => (b ? t('ui.yes') : t('ui.no'));

  function sheet(X, head, rows) {
    const ws = X.utils.aoa_to_sheet([head].concat(rows));
    ws['!cols'] = head.map((h, i) => {
      let w = String(h).length;
      for (let r = 0; r < rows.length && r < 400; r++) w = Math.max(w, String(rows[r][i] ?? '').length);
      return { wch: u.clamp(w + 2, 6, 60) };
    });
    if (rows.length) ws['!autofilter'] = { ref: X.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rows.length, c: head.length - 1 } }) };
    ws['!freeze'] = { xSplit: 0, ySplit: 1 };
    ws['!views'] = [{ state: 'frozen', ySplit: 1 }];
    return ws;
  }
  /** SheetJS CE no escribe paneles congelados: se inyectan en el XML de cada hoja. */
  function freezeHeader(X, buf, nSheets) {
    try {
      if (!X.CFB) return buf;
      const cfb = X.CFB.read(new Uint8Array(buf), { type: 'array' });
      const enc = new TextEncoder(), dec = new TextDecoder();
      for (let i = 1; i <= nSheets; i++) {
        const f = X.CFB.find(cfb, `/xl/worksheets/sheet${i}.xml`); if (!f) continue;
        const xml = dec.decode(f.content).replace(/<sheetView([^>]*?)\/>/, '<sheetView$1><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A2" sqref="A2"/></sheetView>');
        f.content = enc.encode(xml); f.size = f.content.length;
      }
      return X.CFB.write(cfb, { fileType: 'zip', type: 'array' });
    } catch (e) { return buf; }
  }
  function exportXlsx() {
    const X = window.XLSX;
    if (!X || !X.utils) { TL.ui.toast?.(t('crm.noXlsx'), { kind: 'error' }); return null; }
    const D = TL.data, h = (k) => t('crm.x.' + k);
    const clients = D.clients.slice().sort((a, b) => score(b) - score(a));
    const cRows = clients.map((c) => {
      const e = get(c.id), ln = lastNote(c.id);
      return [c.id, c.name || '', D.countryName(c.country), c.city || '', D.segmentName(c.segment), (c.sectors || []).map(D.sectorName).join(', '), c.tier || '', score(c),
        c.size?.employees ?? '', c.website || '', first(c.contacts?.phones), first(c.contacts?.emails),
        u.unique((c.trumpf_fit || []).map((f) => f.series).filter(Boolean)).join(', '), label(e.status), ln?.text || '', stamp(e.updated_at)];
    });
    const reps = D.reps.slice().sort((a, b) => score(b) - score(a));
    const rRows = reps.map((r) => {
      const e = get(r.id), ln = lastNote(r.id);
      return [r.id, r.name || '', D.countryName(r.country), r.city || '', r.tier || '', score(r), yes(r.shortlist), (r.brands || []).map((b) => b.brand).filter(Boolean).join(', '),
        yes(r.service?.has_service), yes(r.competitor_conflict?.conflict), r.website || '', first(r.contacts?.phones), first(r.contacts?.emails), label(e.status), ln?.text || '', stamp(e.updated_at)];
    });
    const nRows = [];
    Object.keys(db).forEach((id) => (db[id]?.notes || []).forEach((n) => {
      const kind = D.kindOf(id);
      nRows.push([id, D.rec(id)?.name || '', kind === 'rep' ? t('crm.x.kindRep') : t('crm.x.kindClient'), stamp(n.at), n.author || '', n.text || '', ts(n.at)]);
    }));
    nRows.sort((a, b) => b[6] - a[6]).forEach((r) => r.pop());

    const wb = X.utils.book_new();
    wb.Props = { Title: 'TRUMPF · Market Atlas LATAM — ' + t('crm.boardTitle'), Author: author(), CreatedDate: new Date() };
    X.utils.book_append_sheet(wb, sheet(X, ['ID', h('company'), h('country'), h('city'), h('segment'), h('sectors'), 'Tier', h('score'), h('employees'), 'Web', h('phone'), 'Email', h('series'), h('status'), h('lastNote'), h('updated')], cRows), t('crm.x.sheetClients'));
    X.utils.book_append_sheet(wb, sheet(X, ['ID', h('company'), h('country'), h('city'), 'Tier', h('fit'), 'Shortlist', h('brands'), h('service'), h('conflict'), 'Web', h('phone'), 'Email', h('status'), h('lastNote'), h('updated')], rRows), t('crm.x.sheetReps'));
    X.utils.book_append_sheet(wb, sheet(X, ['ID', h('company'), h('kind'), h('date'), h('author'), h('note')], nRows), t('crm.x.sheetNotes'));
    const name = `TRUMPF-MarketAtlas-LATAM-Seguimiento-${ymd(new Date())}.xlsx`;
    try {
      const out = freezeHeader(X, X.write(wb, { bookType: 'xlsx', type: 'array', compression: true }), 3);
      u.download(name, new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      TL.ui.toast?.(t('crm.exported', { n: cRows.length + rRows.length }), { kind: 'ok' });
    } catch (e) {
      console.error('[TL.crm] export', e);
      TL.ui.toast?.(t('crm.exportFail'), { kind: 'error' });
      return null;
    }
    return name;
  }

  /* ── Abrir el tablero ───────────────────────────────────────────────── */
  function openBoard() {
    if (!TL.ui.overlay) { TL.ui.toast?.(t('ui.unavailable')); return null; }
    firstKpi = true;
    wrap = u.h('div.crm-wrap');
    bindBoard(wrap);
    ov = TL.ui.overlay.open({
      id: 'crm', kicker: t('crm.kicker'), title: t('crm.boardTitle'), content: wrap, cls: 'crm-ov',
      actions: [{ label: t('crm.export'), icon: 'download', kind: 'lime', onClick: exportXlsx }],
      onClose() { closeMenu(); io?.disconnect(); io = null; ovOffs.forEach((f) => f()); ovOffs = []; ov = null; wrap = null; },
    });
    ov.el.querySelector('.ov-actions .btn')?.setAttribute('aria-label', t('crm.export'));
    wrap.classList.add('crm-anim');
    paintAll();
    setTimeout(() => wrap?.classList.remove('crm-anim'), 1400);
    ovOffs = [
      TL.on('crm:changed', () => refresh()),
      TL.on('data:changed', () => refresh()),
      TL.on('lang', () => {
        if (!ov) return;
        ov.el.querySelector('.ov-kicker').textContent = t('crm.kicker');
        ov.el.querySelector('.ov-title').textContent = t('crm.boardTitle');
        const ab = ov.el.querySelector('.ov-actions .btn'); if (ab) { ab.setAttribute('aria-label', t('crm.export')); const sp = ab.querySelector('span'); if (sp) sp.textContent = t('crm.export'); }
        firstKpi = false; paintAll();
      }),
    ];
    if (hasNet() && !SY.busy && (!SY.at || Date.now() - SY.at > 60e3)) sync();
    return ov;
  }

  /* ── API ────────────────────────────────────────────────────────────── */
  TL.crm = {
    STATES: STATES.slice(),
    get, status: (id) => get(id).status, set: setStatus, note: addNote,
    label, renderInto, openBoard, sync, exportXlsx,
    syncState: () => Object.assign({}, SY),
    all: () => JSON.parse(JSON.stringify(db)),
  };
  TL.whenReady?.(() => sync());
  TL.on('net', (on) => { if (on) sync(); });
  /* ── i18n ───────────────────────────────────────────────────────────── */
  TL.i18n.extend({
    es: {
      'crm.st.sin_contactar': 'Sin contactar', 'crm.st.contactado': 'Contactado', 'crm.st.reunion': 'Reunión', 'crm.st.demo': 'Demo',
      'crm.st.cotizacion': 'Cotización', 'crm.st.negociacion': 'Negociación', 'crm.st.ganado': 'Ganado', 'crm.st.perdido': 'Perdido',
      'crm.status': 'Estado del contacto',
      'crm.lastChange': 'Último cambio:',
      'crm.never': 'Sin movimientos registrados todavía.',
      'crm.notePh': 'Nota de la llamada o visita, próximo paso…',
      'crm.addNote': 'Agregar nota',
      'crm.history': 'Historial',
      'crm.noNotes': 'Todavía no hay notas.',
      'crm.noNotesShort': 'Sin notas',
      'crm.justNow': 'recién',
      'crm.synced': 'Sincronizado · {time}',
      'crm.syncing': 'Sincronizando…',
      'crm.localOnly': 'Solo local',
      'crm.syncedTip': 'Guardado en este equipo y en el servidor (n8n).',
      'crm.localTip': 'Sin servidor configurado: los cambios se guardan solo en este navegador.',
      'crm.offlineTip': 'Servidor no disponible: los cambios quedan en este navegador y se envían al reconectar.',
      'crm.syncNow': 'Sincronizar ahora',
      'crm.kicker': 'Seguimiento comercial',
      'crm.boardTitle': 'Pipeline LATAM',
      'crm.lead': 'Estado de cada prospecto, de la primera llamada al cierre. Arrastrá las tarjetas para cambiar de etapa.',
      'crm.kTotal': 'Prospectos', 'crm.kTotalReps': 'Representantes', 'crm.kPipe': 'En pipeline', 'crm.kMeet': 'Reuniones y demos',
      'crm.kQuote': 'Cotizaciones', 'crm.kQuoteSub': 'incl. negociación', 'crm.kWon': 'Ganados',
      'crm.viewAs': 'Vista', 'crm.board': 'Tablero', 'crm.table': 'Tabla',
      'crm.kind': 'Tipo', 'crm.clients': 'Clientes', 'crm.reps': 'Representantes',
      'crm.fCountry': 'País', 'crm.allCountries': 'Todos los países', 'crm.fTier': 'Tier', 'crm.allTiers': 'Todos',
      'crm.fStatus': 'Estado', 'crm.allStates': 'Todos los estados', 'crm.searchPh': 'Empresa, ciudad o ID',
      'crm.changeStatus': 'Cambiar estado',
      'crm.dropHere': 'Soltá una tarjeta acá',
      'crm.noMatch': 'Ningún prospecto coincide con los filtros.',
      'crm.colName': 'Empresa', 'crm.colCountry': 'País', 'crm.colCity': 'Ciudad', 'crm.colTier': 'Tier', 'crm.colScore': 'Puntaje',
      'crm.colStatus': 'Estado', 'crm.colUpdated': 'Actualizado', 'crm.colNotes': 'Notas',
      'crm.export': 'Exportar a Excel',
      'crm.exported': 'Excel generado · {n} registros',
      'crm.exportFail': 'No se pudo generar el Excel.',
      'crm.noXlsx': 'La librería de Excel no está disponible.',
      'crm.x.sheetClients': 'Prospectos', 'crm.x.sheetReps': 'Representantes', 'crm.x.sheetNotes': 'Notas',
      'crm.x.company': 'Empresa', 'crm.x.country': 'País', 'crm.x.city': 'Ciudad', 'crm.x.segment': 'Segmento', 'crm.x.sectors': 'Rubros',
      'crm.x.score': 'Puntaje', 'crm.x.employees': 'Empleados', 'crm.x.phone': 'Teléfono', 'crm.x.series': 'Series TRUMPF recomendadas',
      'crm.x.status': 'Estado', 'crm.x.lastNote': 'Última nota', 'crm.x.updated': 'Actualizado', 'crm.x.fit': 'Idoneidad',
      'crm.x.brands': 'Marcas', 'crm.x.service': 'Servicio técnico', 'crm.x.conflict': 'Conflicto con competencia',
      'crm.x.kind': 'Tipo', 'crm.x.date': 'Fecha', 'crm.x.author': 'Autor', 'crm.x.note': 'Nota',
      'crm.x.kindClient': 'Cliente', 'crm.x.kindRep': 'Representante',
    },
    de: {
      'crm.st.sin_contactar': 'Nicht kontaktiert', 'crm.st.contactado': 'Kontaktiert', 'crm.st.reunion': 'Termin', 'crm.st.demo': 'Vorführung',
      'crm.st.cotizacion': 'Angebot', 'crm.st.negociacion': 'Verhandlung', 'crm.st.ganado': 'Gewonnen', 'crm.st.perdido': 'Verloren',
      'crm.status': 'Kontaktstatus',
      'crm.lastChange': 'Letzte Änderung:',
      'crm.never': 'Noch keine Aktivität erfasst.',
      'crm.notePh': 'Notiz zu Anruf oder Besuch, nächster Schritt …',
      'crm.addNote': 'Notiz hinzufügen',
      'crm.history': 'Verlauf',
      'crm.noNotes': 'Noch keine Notizen.',
      'crm.noNotesShort': 'Keine Notizen',
      'crm.justNow': 'gerade eben',
      'crm.synced': 'Synchronisiert · {time}',
      'crm.syncing': 'Wird synchronisiert …',
      'crm.localOnly': 'Nur lokal',
      'crm.syncedTip': 'Auf diesem Gerät und auf dem Server (n8n) gespeichert.',
      'crm.localTip': 'Kein Server konfiguriert: Änderungen werden nur in diesem Browser gespeichert.',
      'crm.offlineTip': 'Server nicht erreichbar: Änderungen bleiben lokal und werden bei Verbindung übertragen.',
      'crm.syncNow': 'Jetzt synchronisieren',
      'crm.kicker': 'Vertriebsverfolgung',
      'crm.boardTitle': 'Pipeline LATAM',
      'crm.lead': 'Status jedes Interessenten vom ersten Anruf bis zum Abschluss. Karten per Drag & Drop in die nächste Phase ziehen.',
      'crm.kTotal': 'Interessenten', 'crm.kTotalReps': 'Vertretungen', 'crm.kPipe': 'In der Pipeline', 'crm.kMeet': 'Termine und Vorführungen',
      'crm.kQuote': 'Angebote', 'crm.kQuoteSub': 'inkl. Verhandlung', 'crm.kWon': 'Gewonnen',
      'crm.viewAs': 'Ansicht', 'crm.board': 'Board', 'crm.table': 'Tabelle',
      'crm.kind': 'Typ', 'crm.clients': 'Kunden', 'crm.reps': 'Vertretungen',
      'crm.fCountry': 'Land', 'crm.allCountries': 'Alle Länder', 'crm.fTier': 'Stufe', 'crm.allTiers': 'Alle',
      'crm.fStatus': 'Status', 'crm.allStates': 'Alle Status', 'crm.searchPh': 'Unternehmen, Stadt oder ID',
      'crm.changeStatus': 'Status ändern',
      'crm.dropHere': 'Karte hierher ziehen',
      'crm.noMatch': 'Kein Interessent entspricht den Filtern.',
      'crm.colName': 'Unternehmen', 'crm.colCountry': 'Land', 'crm.colCity': 'Stadt', 'crm.colTier': 'Stufe', 'crm.colScore': 'Punkte',
      'crm.colStatus': 'Status', 'crm.colUpdated': 'Aktualisiert', 'crm.colNotes': 'Notizen',
      'crm.export': 'Nach Excel exportieren',
      'crm.exported': 'Excel erstellt · {n} Datensätze',
      'crm.exportFail': 'Die Excel-Datei konnte nicht erstellt werden.',
      'crm.noXlsx': 'Die Excel-Bibliothek ist nicht verfügbar.',
      'crm.x.sheetClients': 'Interessenten', 'crm.x.sheetReps': 'Vertretungen', 'crm.x.sheetNotes': 'Notizen',
      'crm.x.company': 'Unternehmen', 'crm.x.country': 'Land', 'crm.x.city': 'Stadt', 'crm.x.segment': 'Segment', 'crm.x.sectors': 'Branchen',
      'crm.x.score': 'Punktzahl', 'crm.x.employees': 'Mitarbeitende', 'crm.x.phone': 'Telefon', 'crm.x.series': 'Empfohlene TRUMPF-Baureihen',
      'crm.x.status': 'Status', 'crm.x.lastNote': 'Letzte Notiz', 'crm.x.updated': 'Aktualisiert', 'crm.x.fit': 'Eignung',
      'crm.x.brands': 'Marken', 'crm.x.service': 'Technischer Service', 'crm.x.conflict': 'Wettbewerbskonflikt',
      'crm.x.kind': 'Typ', 'crm.x.date': 'Datum', 'crm.x.author': 'Autor', 'crm.x.note': 'Notiz',
      'crm.x.kindClient': 'Kunde', 'crm.x.kindRep': 'Vertretung',
    },
  });
})();
