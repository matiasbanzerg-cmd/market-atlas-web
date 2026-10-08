/* ==========================================================================
   tl-ai.js — Inteligencia artificial vía n8n (TL.net.call): Preguntale al mapa,
   Preparar visita (briefing imprimible) e Investigar empresa nueva.
   Sin endpoint o con error: aviso "IA sin conexión" y, en `ask`, una respuesta
   LOCAL heurística sobre TL.data (la demo funciona sin n8n).
   API: TL.ai = { status(), enabled(name), ask(q), visit(id), investigate(url),
                  compact(records), highlighted(), clearHighlight(), fitHighlighted(),
                  notice(name,opts), laser(), format(text), typeInto(el,text,done) }
   ========================================================================== */
(function () {
  'use strict';
  const TL = window.TL;
  const { u } = TL;
  const html = u.html, raw = u.raw;
  const t = (k, v) => TL.i18n.t(k, v);

  TL.i18n.extend({
    es: {
      'ai.st.online': 'IA conectada',
      'ai.st.offline': 'IA sin conexión',
      'ai.st.unconfigured': 'IA sin configurar',
      'ai.offTitle': 'IA sin conexión',
      'ai.off.unconfigured': 'Los flujos de IA corren en n8n y en este equipo no están configurados (falta data/config.js). El resto del atlas funciona igual, incluso sin internet.',
      'ai.off.offline': 'No se pudo contactar al servidor de IA (n8n). Revisá la conexión a internet y volvé a intentar.',
      'ai.off.error': 'El servidor de IA respondió con un error ({e}). Volvé a intentar en un momento.',
      'ai.off.localAsk': 'Mientras tanto, respondo con un análisis local de los datos del atlas.',
      'ai.off.localVisit': 'Podés generar un borrador local a partir de la ficha (sin IA).',
      'ai.localAnswer': 'Respuesta local (sin IA)',
      'ai.aiAnswer': 'Respuesta · IA',
      'ai.showOnMap': 'Ver en el mapa',
      'ai.clearHl': 'Limpiar resaltado',
      'ai.nHighlighted.one': '1 resaltado en el mapa', 'ai.nHighlighted.other': '{n} resaltados en el mapa',
      'ai.nResults.one': '1 resultado', 'ai.nResults.other': '{n} resultados',
      'ai.short.unconfigured': 'n8n no está configurado en este equipo: la respuesta sale de un análisis local de los datos del atlas.',
      'ai.short.offline': 'El servidor de IA no respondió: la respuesta sale de un análisis local de los datos del atlas.',
      'ai.short.error': 'El servidor de IA devolvió un error: la respuesta sale de un análisis local de los datos del atlas.',
      'ai.results': 'Resultados',
      'ai.suggestions': 'Seguir preguntando',
      'ai.retry': 'Reintentar',
      'ai.close': 'Cerrar',
      'ai.pill.one': '1 resaltado por la IA', 'ai.pill.other': '{n} resaltados por la IA',
      'ai.pillLocal.one': '1 resaltado · análisis local', 'ai.pillLocal.other': '{n} resaltados · análisis local',
      'ai.pillShow': 'Ver',
      /* respuesta local */
      'ai.l.clients.one': 'empresa', 'ai.l.clients.other': 'empresas',
      'ai.l.reps.one': 'representante', 'ai.l.reps.other': 'representantes',
      'ai.l.found': 'Encontré **{n} {what}** para: {crit}.',
      'ai.l.foundAll': 'Encontré **{n} {what}** en el atlas.',
      'ai.l.best': 'Las más prometedoras: {list}.',
      'ai.l.bestReps': 'Destacan: {list}.',
      'ai.l.topN': 'Muestro las {n} primeras por puntaje.',
      'ai.l.relaxed': 'Sin coincidencias exactas: amplié la búsqueda sin el criterio «{c}».',
      'ai.l.none': 'No encontré registros con esos criterios ({crit}).',
      'ai.l.noneHint': 'Probá quitar un criterio o preguntar por otro país.',
      'ai.l.base': 'Máquinas detectadas en el resultado: {list}.',
      'ai.l.replaceHint': 'Son candidatas a reemplazo o upgrade: tienen equipos de la competencia, plasma o equipamiento con años de uso.',
      'ai.l.notUnderstood': 'Sin IA no pude interpretar la pregunta. Probá nombrando un país, un rubro, un tier, una marca o una familia TRUMPF; por ejemplo «tier A en Chile con plegadoras Amada».',
      'ai.l.tour': 'Para una primera gira conviene empezar por **{city}** ({country}): {np}, {a} de tier A y puntaje medio {avg}.',
      'ai.l.prospects.one': '1 prospecto', 'ai.l.prospects.other': '{n} prospectos',
      'ai.l.tourNext': 'Siguientes paradas lógicas: {list}.',
      'ai.l.tourNone': 'Todavía no hay suficientes prospectos tier A/B para proponer una gira.',
      'ai.l.pts': 'pts',
      'ai.c.tier': 'tier {t}',
      'ai.c.group': 'máquinas de origen {g}',
      'ai.c.brand': 'máquinas {b}',
      'ai.c.competitor': 'con máquinas de la competencia',
      'ai.c.replace': 'candidatas a reemplazo / upgrade',
      'ai.c.family': '{f} recomendada',
      'ai.c.noConflict': 'sin conflicto de marcas',
      'ai.c.shortlist': 'en la shortlist',
      'ai.c.repBrand': 'representa {b}',
      'ai.s.top': 'Top 5 tier A en {c}',
      'ai.s.comp': '¿Quiénes en {c} tienen máquinas de la competencia?',
      'ai.s.reps': 'Representantes en {c}',
      'ai.s.family': '¿Qué empresas necesitan {f}?',
      'ai.s.bigA': 'Las 10 empresas más grandes de tier A',
    },
    de: {
      'ai.st.online': 'KI verbunden',
      'ai.st.offline': 'KI offline',
      'ai.st.unconfigured': 'KI nicht eingerichtet',
      'ai.offTitle': 'KI nicht verbunden',
      'ai.off.unconfigured': 'Die KI-Workflows laufen in n8n und sind auf diesem Rechner nicht eingerichtet (data/config.js fehlt). Alles andere im Atlas funktioniert weiterhin – auch ohne Internet.',
      'ai.off.offline': 'Der KI-Server (n8n) ist nicht erreichbar. Bitte die Internetverbindung prüfen und erneut versuchen.',
      'ai.off.error': 'Der KI-Server hat einen Fehler gemeldet ({e}). Bitte gleich noch einmal versuchen.',
      'ai.off.localAsk': 'Bis dahin antworte ich mit einer lokalen Auswertung der Atlas-Daten.',
      'ai.off.localVisit': 'Aus dem Profil lässt sich ein lokaler Entwurf erstellen (ohne KI).',
      'ai.localAnswer': 'Lokale Antwort (ohne KI)',
      'ai.aiAnswer': 'Antwort · KI',
      'ai.showOnMap': 'Auf der Karte zeigen',
      'ai.clearHl': 'Hervorhebung aufheben',
      'ai.nHighlighted.one': '1 auf der Karte hervorgehoben', 'ai.nHighlighted.other': '{n} auf der Karte hervorgehoben',
      'ai.nResults.one': '1 Treffer', 'ai.nResults.other': '{n} Treffer',
      'ai.short.unconfigured': 'n8n ist auf diesem Rechner nicht eingerichtet – die Antwort stammt aus einer lokalen Auswertung der Atlas-Daten.',
      'ai.short.offline': 'Der KI-Server antwortet nicht – die Antwort stammt aus einer lokalen Auswertung der Atlas-Daten.',
      'ai.short.error': 'Der KI-Server meldete einen Fehler – die Antwort stammt aus einer lokalen Auswertung der Atlas-Daten.',
      'ai.results': 'Treffer',
      'ai.suggestions': 'Weiterfragen',
      'ai.retry': 'Erneut versuchen',
      'ai.close': 'Schließen',
      'ai.pill.one': '1 von der KI hervorgehoben', 'ai.pill.other': '{n} von der KI hervorgehoben',
      'ai.pillLocal.one': '1 hervorgehoben · lokale Auswertung', 'ai.pillLocal.other': '{n} hervorgehoben · lokale Auswertung',
      'ai.pillShow': 'Zeigen',
      'ai.l.clients.one': 'Unternehmen', 'ai.l.clients.other': 'Unternehmen',
      'ai.l.reps.one': 'Vertretung', 'ai.l.reps.other': 'Vertretungen',
      'ai.l.found': '**{n} {what}** gefunden für: {crit}.',
      'ai.l.foundAll': 'Im Atlas gibt es **{n} {what}**.',
      'ai.l.best': 'Am vielversprechendsten: {list}.',
      'ai.l.bestReps': 'Hervorzuheben: {list}.',
      'ai.l.topN': 'Angezeigt werden die ersten {n} nach Score.',
      'ai.l.relaxed': 'Keine exakten Treffer – das Kriterium „{c}“ wurde gelockert.',
      'ai.l.none': 'Keine Datensätze für diese Kriterien ({crit}).',
      'ai.l.noneHint': 'Ein Kriterium weglassen oder nach einem anderen Land fragen.',
      'ai.l.base': 'Erkannter Maschinenpark in den Treffern: {list}.',
      'ai.l.replaceHint': 'Kandidaten für Ersatz oder Upgrade: Wettbewerbsmaschinen, Plasma oder ältere Anlagen.',
      'ai.l.notUnderstood': 'Ohne KI ließ sich die Frage nicht auswerten. Am besten ein Land, eine Branche, eine Stufe (A/B/C), eine Marke oder eine TRUMPF-Produktfamilie nennen – z. B. „Stufe A in Chile mit Amada-Abkantpressen“.',
      'ai.l.tour': 'Für die erste Reise bietet sich **{city}** ({country}) an: {np}, davon {a} der Stufe A, Ø-Score {avg}.',
      'ai.l.prospects.one': '1 Interessent', 'ai.l.prospects.other': '{n} Interessenten',
      'ai.l.tourNext': 'Sinnvolle nächste Stationen: {list}.',
      'ai.l.tourNone': 'Noch zu wenige Interessenten der Stufen A/B, um eine Reise vorzuschlagen.',
      'ai.l.pts': 'Pkt.',
      'ai.c.tier': 'Stufe {t}',
      'ai.c.group': 'Maschinen aus {g}',
      'ai.c.brand': '{b}-Maschinen',
      'ai.c.competitor': 'mit Wettbewerbsmaschinen',
      'ai.c.replace': 'Ersatz-/Upgrade-Potenzial',
      'ai.c.family': '{f} empfohlen',
      'ai.c.noConflict': 'ohne Markenkonflikt',
      'ai.c.shortlist': 'auf der Shortlist',
      'ai.c.repBrand': 'vertritt {b}',
      'ai.s.top': 'Top 5 der Stufe A in {c}',
      'ai.s.comp': 'Wer in {c} hat Wettbewerbsmaschinen?',
      'ai.s.reps': 'Vertretungen in {c}',
      'ai.s.family': 'Welche Unternehmen brauchen {f}?',
      'ai.s.bigA': 'Die 10 größten Unternehmen der Stufe A',
    },
  });
  const AI = (TL.ai = {});
  const D = () => TL.data;
  const nrm = (s) => String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  /* ── Estado de conexión ─────────────────────────────────────────────── */
  const failed = {};                     // name → 'offline' | 'error'
  AI.enabled = (name = 'ask') => !!(TL.net && typeof TL.net.has === 'function' && TL.net.has(name));
  AI.status = (name = 'ask') => (!AI.enabled(name) ? 'unconfigured' : failed[name] ? 'offline' : 'online');
  function track(name, r) {
    const before = AI.status(name);
    if (r && r.ok) delete failed[name]; else failed[name] = r?.offline ? 'offline' : 'error';
    if (AI.status(name) !== before) TL.emit('ai:status', { name, status: AI.status(name) });
  }
  async function call(name, body, timeout) {
    if (!AI.enabled(name)) return { ok: false, offline: false, unconfigured: true, error: 'unconfigured' };
    let r;
    try { r = await TL.net.call(name, Object.assign({ lang: TL.i18n.lang }, body), { timeout }); } catch (e) { r = { ok: false, offline: true, error: String(e?.message || e) }; }
    if (!r || typeof r !== 'object') r = { ok: false, error: 'empty' };
    track(name, r);
    return r;
  }
  const reasonOf = (r) => (r?.unconfigured ? 'unconfigured' : r?.offline ? 'offline' : 'error');

  /** Aviso elegante "IA sin conexión". opts: { compact, reason, error } */
  AI.notice = function (name = 'ask', o = {}) {
    const reason = o.reason || (AI.status(name) === 'online' ? 'offline' : AI.status(name));
    const msg = reason === 'error' ? t('ai.off.error', { e: o.error || '—' }) : t('ai.off.' + (reason === 'unconfigured' ? 'unconfigured' : 'offline'));
    const extra = name === 'ask' ? t('ai.off.localAsk') : name === 'visit' ? t('ai.off.localVisit') : '';
    return html`<div class="ai-off ${o.compact ? 'is-compact' : ''}" data-reason="${reason}" role="note">
      <span class="ai-off-ico">${TL.ui.icon('warn')}</span>
      <div><b>${t('ai.offTitle')}</b><p>${msg}${extra ? ' ' + extra : ''}</p></div></div>`;
  };

  /* ── Registros compactos para el contrato `ask` ─────────────────────── */
  const short = (s, n = 160) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length <= n ? s : s.slice(0, s.lastIndexOf(' ', n - 1) > 60 ? s.lastIndexOf(' ', n - 1) : n - 1) + '…'; };
  AI.compact = function (records) {
    const d = D(), L = TL.i18n;
    const list = records || d.clients.concat(d.reps);
    return list.filter(Boolean).map((r) => {
      const rep = d.kindOf(r.id) === 'rep' || (!r.score && !!r.fit);
      if (rep) {
        return { id: r.id, n: r.name, k: 'r', c: r.country, ci: r.city || '', s: (r.categories || r.industries_served || []).slice(0, 6), sg: r.shortlist ? 'shortlist' : '',
          t: r.tier || '', sc: Math.round(d.score(r)), e: r.employees || '', m: u.unique((r.brands || []).map((b) => b.brand).filter(Boolean)), p: [], f: [], x: short(L.pick(r, 'summary')) };
      }
      return { id: r.id, n: r.name, k: 'c', c: r.country, ci: r.city || '', s: (r.sectors || []).slice(0, 6), sg: r.segment || '', t: r.tier || '', sc: Math.round(d.score(r)),
        e: r.size?.employees || '', m: u.unique((r.machines || []).map((m) => m.brand).filter(Boolean)), p: (r.products || []).slice(0, 5).map((p) => p.name).filter(Boolean),
        f: (r.trumpf_fit || []).map((x) => x.series).filter(Boolean), x: short(L.pick(r, 'summary')) };
    });
  };

  /* ── Resaltado en el mapa + píldora flotante ────────────────────────── */
  let hl = null, hlSrc = 'ai', pill = null;
  AI.highlighted = () => hl;
  const sameSet = (a, b) => a && b && a.length === b.length && a.every((x) => b.includes(x));
  function applyHighlight(ids, src) {
    const ok = (ids || []).filter((id) => D().get(id));
    if (!ok.length) return;
    hl = u.unique(ok); hlSrc = src || 'ai';
    TL.map?.highlight?.(hl);
    paintPill();
  }
  AI.clearHighlight = function () { hl = null; TL.map?.clearHighlight?.(); paintPill(); };
  AI.fitHighlighted = function () {
    const pts = (hl || []).map((id) => D().rec(id)).filter((r) => r && isFinite(r.lng) && isFinite(r.lat)).map((r) => [+r.lng, +r.lat]);
    if (pts.length && TL.map?.fitPoints) TL.map.fitPoints(pts, { maxZoom: 9, margin: 70 });
  };
  TL.on('highlight', (set) => {
    if (TL.map?._searchHover || !hl) return;
    if (!set || !sameSet(set, hl)) { hl = null; paintPill(); }
  });
  function paintPill() {
    if (!pill) {
      pill = u.h('div.ai-pill#ai-pill', { role: 'status', hidden: true });
      pill.addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.a === 'fit') AI.fitHighlighted(); else AI.clearHighlight();
      });
      document.body.appendChild(pill);
    }
    const show = !!(hl && hl.length) && !TL.search?.isOpen?.();
    if (show) {
      pill.innerHTML = `<i class="ai-pill-dot"></i><span>${u.esc(TL.i18n.tn(hlSrc === 'local' ? 'ai.pillLocal' : 'ai.pill', hl.length))}</span>
        <button type="button" data-a="fit">${TL.ui.icon('pin')}<span>${u.esc(t('ai.pillShow'))}</span></button>
        <button type="button" data-a="clear" aria-label="${u.esc(t('ai.clearHl'))}" title="${u.esc(t('ai.clearHl'))}">${TL.ui.icon('close')}</button>`;
      if (pill.hidden) { pill.hidden = false; void pill.offsetWidth; }
      pill.classList.add('is-on');
    } else if (!pill.hidden) {
      pill.classList.remove('is-on');
      setTimeout(() => { if (!pill.classList.contains('is-on')) pill.hidden = true; }, 200);
    }
  }
  TL.on('search:open', paintPill);
  TL.on('search:close', paintPill);
  TL.on('lang', () => { if (pill && !pill.hidden) paintPill(); });

  /* ── Texto: formato mínimo y tipeo progresivo ───────────────────────── */
  AI.format = function (text) {
    const inline = (x) => u.esc(x).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
    const BUL = /^\s*([-•*]|\d+[.)])\s+/;
    let out = '', para = [], list = null;
    const flushP = () => { if (para.length) out += `<p>${para.map(inline).join('<br>')}</p>`; para = []; };
    const flushL = () => { if (list) out += `<${list.tag}>${list.items.map((x) => `<li>${inline(x)}</li>`).join('')}</${list.tag}>`; list = null; };
    String(text || '').replace(/\r/g, '').split('\n').forEach((line) => {
      if (!line.trim()) { flushP(); flushL(); return; }
      if (BUL.test(line)) {
        flushP();
        const tag = /^\s*\d/.test(line) ? 'ol' : 'ul';
        if (!list || list.tag !== tag) { flushL(); list = { tag, items: [] }; }
        list.items.push(line.replace(BUL, ''));
      } else { flushL(); para.push(line); }
    });
    flushP(); flushL();
    return out;
  };
  /** Escribe `text` de a poco en `el` (≈1.4 s en total). Devuelve stop() que completa al instante. */
  AI.typeInto = function (el, text, done) {
    let fin = false;
    const finish = () => { if (fin) return; fin = true; el.classList.remove('is-typing'); el.innerHTML = AI.format(text); done?.(); };
    if (TL.reduceMotion || !text) { finish(); return () => {}; }
    const plain = String(text).replace(/\*\*/g, '');
    const dur = Math.min(1800, 500 + plain.length * 6), t0 = performance.now();
    el.classList.add('is-typing');
    const tick = (now) => {
      if (fin) return;
      const i = Math.min(plain.length, Math.ceil(((now - t0) / dur) * plain.length));
      el.textContent = plain.slice(0, i);
      if (i < plain.length) requestAnimationFrame(tick); else finish();
    };
    requestAnimationFrame(tick);
    return finish;
  };

  /* ── Loader: trayectoria de corte láser sobre una pieza de chapa ────── */
  const PART = 'M12 12 H52 L58 18 H70 L76 12 H116 V44 L110 50 V58 L116 64 V84 H76 L70 78 H58 L52 84 H12 V64 L18 58 V50 L12 44 Z';
  AI.laser = function (cls = '') {
    const mo = TL.reduceMotion ? '' : `<animateMotion dur="2.6s" repeatCount="indefinite" calcMode="linear" path="${PART}"/>`;
    return raw(`<svg class="ai-laser ${cls}" viewBox="0 0 128 96" aria-hidden="true"><path class="al-ghost" d="${PART}"/><circle class="al-hole" cx="34" cy="48" r="7"/><circle class="al-hole" cx="94" cy="48" r="7"/><path class="al-cut" d="${PART}" pathLength="100"/><g class="al-spark"${TL.reduceMotion ? ' transform="translate(12 12)"' : ''}><circle class="al-glow" r="6">${mo}</circle><circle class="al-core" r="1.8">${mo}</circle></g></svg>`);
  };
  /* ── Motor LOCAL (sin IA): interpreta la pregunta con heurísticas ───── */
  const DEMONYM = {
    PE: ['peru', 'peruan'], CL: ['chile', 'chilen'], CO: ['colombia', 'kolumbien', 'colombian', 'kolumbian'], AR: ['argentin'],
    UY: ['uruguay'], EC: ['ecuador', 'ecuatorian', 'ecuadorian'], BO: ['bolivi'], PY: ['paraguay'], VE: ['venezol', 'venezuel'],
    CR: ['costa rica', 'costarric'], PA: ['panama'], GT: ['guatemal'], DO: ['dominican', 'dominikan'], HN: ['hondur'],
    SV: ['salvador'], NI: ['nicaragu'], MX: ['mexic', 'mexik'], BR: ['brasil', 'brazil', 'brasilian'],
  };
  const REGION = {
    centroamerica: { re: /(centro ?america|zentralamerika|central america|mittelamerika)/, cc: ['GT', 'BZ', 'HN', 'SV', 'NI', 'CR', 'PA'] },
    caribe: { re: /(caribe|karibik|caribbean)/, cc: ['DO', 'PR', 'CU', 'JM', 'HT', 'TT', 'BS', 'BB'] },
    andes: { re: /(andin|anden|andean)/, cc: ['CO', 'EC', 'PE', 'BO', 'VE'] },
    conosur: { re: /(cono sur|southern cone)/, cc: ['AR', 'CL', 'UY', 'PY'] },
  };
  const GROUP_WORDS = {
    china: ['chin'], japon: ['japo', 'japan'], turquia: ['turc', 'turk', 'tuerk'], premium_eu: ['europe', 'europa', 'europae'],
    usa: ['estadounid', 'norteameric', 'us-amerikan'], corte_termico: ['plasma', 'oxicorte', 'oxiacet', 'brennschneid'],
    soldadura: ['soldador'], robot: ['robot'], mecanizado: ['mecaniz', 'cnc mecan', 'zerspan'],
  };
  const SECTOR_SYN = {
    tableros: ['tabler', 'gabinete', 'envolvente', 'schaltschr', 'schaltanlag'], hvac: ['hvac', 'climatiz', 'aire acondicionado', 'ducto', 'klima', 'lueftung'],
    refrigeracion: ['refriger', 'kaelte', 'kuehl'], linea_blanca: ['linea blanca', 'electrodomest', 'haushaltsger'], agro: ['agro', 'agricol', 'landtechn', 'landmaschin'],
    mineria: ['miner', 'bergbau'], carrocerias: ['carroc', 'fahrzeugaufbau', 'aufbauten'], muebles_metalicos: ['mueble', 'moebel'],
    gastronomia_inox: ['gastronom', 'gastro', 'cocinas industr'], almacenaje: ['almacen', 'estanter', 'rack', 'regal', 'lagertechn'],
    energia_renovable: ['renovab', 'solar', 'eolic', 'erneuerbar', 'windkraft'], automotriz: ['automotri', 'autopart', 'automobil', 'kfz'],
    construccion: ['construcc', 'estructura'], transformadores: ['transformad', 'transformator'], datacenter_telecom: ['data center', 'datacenter', 'telecom', 'rechenzentr'],
    ascensores: ['ascensor', 'aufzug'], medico: ['medic', 'hospital', 'medizin'], oil_gas: ['petrol', 'oil & gas', 'oil and gas', 'erdoel'],
    iluminacion_senaletica: ['ilumin', 'senaletic', 'beleucht'], maquinaria_industrial: ['maquinaria industrial', 'maschinenbau'],
    naval_defensa_ferroviario: ['naval', 'ferrovi', 'defensa', 'schiffbau', 'bahn'], alimentos_farma_inox: ['alimentos', 'farma', 'lebensmittel', 'pharma'],
  };
  const FAMILY_SYN = {
    panel_bending: ['panelador', 'paneladora', 'panelizador', 'panel bend', 'paneelbieg', 'trubend center', 'biegezentrum'],
    punch_laser: ['punzonado-laser', 'punzonado laser', 'trumatic', 'stanz-laser', 'stanzlaser'],
    punching: ['punzon', 'stanz', 'trupunch'], tube_laser: ['tubo', 'tubos', 'rohr', 'trulaser tube'],
    laser_welding: ['soldadura laser', 'laserschweiss', 'trulaser weld', 'truweld'], laser_3d: ['laser 3d', '3d-laser', 'trulaser cell'],
    bending: ['plegador', 'plegado', 'abkant', 'biegemasch', 'trubend serie', 'trubend series'], laser_2d: ['laser 2d', '2d-laser', 'corte laser', 'laserschneid', 'trulaser serie', 'trulaser series'],
  };
  const wordAt = (q, w) => { let i = q.indexOf(w); while (i > -1) { if (i === 0 || !/[a-z0-9]/.test(q[i - 1])) return true; i = q.indexOf(w, i + 1); } return false; };
  const anyWord = (q, arr) => arr.some((w) => wordAt(q, w));
  const STOP = new Set('que quienes cuales donde como con sin para por los las del de la el en y o un una unos unas mas tienen tiene hay son top mejores empresas empresa podriamos conviene welche wer wo wie mit ohne fur und oder der die das den dem ein eine haben hat sind gibt the and with in of'.split(' '));

  function parse(question) {
    const q = ' ' + nrm(question).replace(/[¿?¡!.,;:()"“”«»]/g, ' ').replace(/\s+/g, ' ') + ' ';
    const d = D(), tx = d.taxonomy || {};
    const P = { q, crit: [], kind: /(represent|vertret|distribuid|haendler|handler|dealer)/.test(q) ? 'r' : 'c', countries: [], limit: 0, sort: 'score' };
    // Países (nombre ES/DE, código, gentilicio) y regiones
    d.countries.forEach((k) => {
      const names = [nrm(k.name_es), nrm(k.name_de)].filter((x) => x && x.length > 3).concat(DEMONYM[k.cc] || []);
      if (anyWord(q, names) || new RegExp('(^|[^A-Za-z])' + k.cc + '([^A-Za-z]|$)').test(String(question))) P.countries.push(k.cc);
    });
    Object.values(REGION).forEach((r) => { if (r.re.test(q)) r.cc.forEach((cc) => { if (d.country(cc) && !P.countries.includes(cc)) P.countries.push(cc); }); });
    P.countries = u.unique(P.countries);
    // Ciudad (si no es a la vez un país mencionado)
    const cities = u.unique(d.clients.concat(d.reps).map((r) => r.city).filter((c) => c && nrm(c).length >= 4));
    P.city = cities.find((c) => wordAt(q, nrm(c)) && !P.countries.some((cc) => nrm(d.countryName(cc)) === nrm(c))) || null;
    // Tier
    const tm = q.match(/\b(?:tier|stufe)[\s-]*([abc])\b/) || q.match(/\b([abc])[\s-]kunden\b/);
    P.tier = tm ? tm[1].toUpperCase() : /(prioridad alta|hohe prioritaet|hoher prioritaet)/.test(q) ? 'A' : null;
    // Top N
    const nm = q.match(/\btop[\s-]*(\d{1,3})\b/) || q.match(/\b(\d{1,3})\s+(mejores|principales|primeros|primeras|besten|groessten|wichtigsten|empresas|unternehmen|mas)\b/);
    P.limit = nm ? Math.min(100, +nm[1]) : 0;
    if (/(mas grandes|groessten|groesste|largest|biggest)/.test(q)) P.sort = 'size';
    // Segmento
    if (/\b(taller|talleres|job ?shop|lohnfertig|lohnfertiger|metalurgica de servicio)/.test(q)) P.segment = 'job_shop';
    else if (/\b(fabricante|fabricantes|oem|hersteller|herstellern)\b/.test(q)) P.segment = 'oem';
    // Rubro (taxonomía + sinónimos)
    P.sectors = Object.keys(tx.sectors || SECTOR_SYN).filter((key) => {
      if (key === 'job_shop' || key === 'otros') return false;
      const v = tx.sectors?.[key] || {};
      const full = [nrm(v.es), nrm(v.de)].filter((x) => x && x.length > 3);
      return anyWord(q, full) || anyWord(q, SECTOR_SYN[key] || []) || wordAt(q, key.replace(/_/g, ' '));
    });
    // Familia TRUMPF recomendada (paneladora antes que plegado genérico)
    P.families = [];
    Object.keys(FAMILY_SYN).forEach((f) => {
      if (f === 'bending' && P.families.includes('panel_bending') && !/(plegador|abkant)/.test(q)) return;
      const v = tx.families?.[f] || {};
      if (anyWord(q, FAMILY_SYN[f]) || (v.es && wordAt(q, nrm(v.es))) || (v.de && wordAt(q, nrm(v.de)))) P.families.push(f);
    });
    // Grupo de marca y marca puntual
    P.groups = Object.keys(GROUP_WORDS).filter((g) => anyWord(q, GROUP_WORDS[g]));
    const brands = u.unique(d.clients.flatMap((c) => (c.machines || []).map((m) => m.brand)).concat(d.reps.flatMap((r) => (r.brands || []).map((b) => b.brand))).filter(Boolean));
    P.brands = brands.filter((b) => nrm(b).length >= 3 && wordAt(q, nrm(b)) && (nrm(b) !== 'trumpf' || /(tienen|tiene|con|mit|haben|instalad|ya son|bereits)\s+(maquinas\s+|maschinen\s+)?trumpf/.test(q)));
    P.competitor = /(competencia|competidor|wettbewerb|konkurren)/.test(q);
    P.replace = /(reemplaz|sustitu|renov|upgrade|actualiz|ersetz|ersatz|austausch|modernisier)/.test(q);
    P.tour = /(gira|viaje|visita|recorrido|reise|besuch|roadshow|\btour\b)/.test(q) && P.kind === 'c';
    P.noConflict = /(sin conflicto|ohne (marken)?konflikt|no conflict|konfliktfrei)/.test(q);
    P.shortlist = /shortlist|preseleccion/.test(q);
    P.free = q.split(' ').filter((w) => w.length >= 4 && !STOP.has(w));
    return P;
  }

  /** Criterios aplicables (orden = prioridad para relajar: el primero se quita primero). */
  function criteria(P) {
    const d = D(), C = [], L = TL.i18n;
    const fam = (c) => (c.trumpf_fit || []).map((x) => x.family);
    if (P.kind === 'c') {
      if (P.segment) C.push({ k: 'segment', label: d.segmentName(P.segment), test: (c) => c.segment === P.segment || c.segment === 'mixto' || (P.segment === 'job_shop' && (c.sectors || []).includes('job_shop')) });
      if (P.sectors.length) C.push({ k: 'sector', label: L.list(P.sectors.map(d.sectorName)), test: (c) => (c.sectors || []).some((s) => P.sectors.includes(s)) });
      if (P.families.length) C.push({ k: 'family', label: t('ai.c.family', { f: L.list(P.families.map(d.familyName)) }), test: (c) => fam(c).some((f) => P.families.includes(f)) });
      if (P.brands.length) C.push({ k: 'brand', label: t('ai.c.brand', { b: L.list(P.brands) }), test: (c) => (c.machines || []).some((m) => P.brands.some((b) => nrm(m.brand) === nrm(b))) });
      if (P.groups.length) C.push({ k: 'group', label: t('ai.c.group', { g: L.list(P.groups.map((g) => d.group(g).name)) }), test: (c) => d.groupsOf(c).some((g) => P.groups.includes(g)) });
      if (P.competitor && !P.replace) C.push({ k: 'comp', label: t('ai.c.competitor'), test: (c) => d.hasCompetitor(c) });
      if (P.replace) C.push({ k: 'replace', label: t('ai.c.replace'), test: (c) => d.hasCompetitor(c) || (c.score?.upgrade || 0) >= 12 });
    } else {
      if (P.brands.length) C.push({ k: 'brand', label: t('ai.c.repBrand', { b: L.list(P.brands) }), test: (r) => (r.brands || []).some((b) => P.brands.some((x) => nrm(b.brand) === nrm(x))) });
      if (P.noConflict) C.push({ k: 'conflict', label: t('ai.c.noConflict'), test: (r) => !r.competitor_conflict?.conflict });
      if (P.shortlist) C.push({ k: 'short', label: t('ai.c.shortlist'), test: (r) => !!r.shortlist });
    }
    if (P.city) C.push({ k: 'city', label: P.city, test: (r) => nrm(r.city) === nrm(P.city) });
    if (P.tier) C.push({ k: 'tier', label: t('ai.c.tier', { t: P.tier }), test: (r) => r.tier === P.tier });
    if (P.countries.length) C.push({ k: 'country', fixed: true, label: L.list(P.countries.map(d.countryName)), test: (r) => P.countries.includes(r.country) });
    return C;
  }
  const pts = (r) => `**${r.name}** (${[r.city, Math.round(D().score(r)) + ' ' + t('ai.l.pts'), r.tier].filter(Boolean).join(' · ')})`;

  function tourAnswer(P) {
    const d = D(), L = TL.i18n;
    let pool = d.clients.filter((c) => c.tier === 'A' || c.tier === 'B');
    if (P.countries.length) pool = pool.filter((c) => P.countries.includes(c.country));
    if (!pool.length) return { answer: t('ai.l.tourNone'), ids: [] };
    const by = {};
    pool.forEach((c) => {
      const k = nrm(c.city) + '|' + c.country;
      const e = (by[k] = by[k] || { city: c.city, cc: c.country, list: [], w: 0 });
      e.list.push(c); e.w += d.score(c) * (c.tier === 'A' ? 1.5 : 1);
    });
    const ranked = Object.values(by).sort((a, b) => b.w - a.w);
    const top = ranked[0];
    const all = d.clients.filter((c) => nrm(c.city) === nrm(top.city) && c.country === top.cc).sort((a, b) => d.score(b) - d.score(a));
    const s = d.stats(all);
    let answer = t('ai.l.tour', { city: top.city, country: d.countryName(top.cc), np: L.tn('ai.l.prospects', all.length), a: L.int(s.A || 0), avg: L.int(s.avg) });
    answer += ' ' + t('ai.l.best', { list: L.list(all.slice(0, 3).map(pts)) });
    const next = ranked.slice(1, 4).map((e) => `${e.city} (${d.countryName(e.cc)}, ${e.list.length})`);
    if (next.length) answer += '\n\n' + t('ai.l.tourNext', { list: L.list(next) });
    return { answer, ids: all.map((c) => c.id), country: top.cc };
  }

  function suggest(P, ccHint) {
    const d = D(), L = TL.i18n;
    const cc = ccHint || P.countries[0] || d.ranking()[0]?.cc;
    const cn = cc ? d.countryName(cc) : '';
    const out = [];
    if (cn) out.push(P.kind === 'r' ? t('ai.s.top', { c: cn }) : t('ai.s.comp', { c: cn }));
    if (cn && P.kind === 'c') out.push(t('ai.s.reps', { c: cn }));
    if (cn && !(P.tier === 'A' && P.limit)) out.push(t('ai.s.top', { c: cn }));
    const fam = P.families[0] || (d.clients[0]?.trumpf_fit || [])[0]?.family;
    if (fam && !P.families.length) out.push(t('ai.s.family', { f: L.L(d.family(fam)) || d.familyName(fam) }));
    if (!P.tour) out.push(t('search.ex.3'));
    return u.unique(out).filter((s) => nrm(s) !== nrm(P.q).trim()).slice(0, 3);
  }

  /** Respuesta local: { ok:true, source:'local', answer, ids, suggestions } */
  AI._parse = (q) => parse(q);
  AI._criteria = (q) => criteria(parse(q));
  AI.local = function (question) {
    const d = D(), L = TL.i18n;
    const P = parse(question);
    if (P.tour) { const r = tourAnswer(P); return { ok: true, source: 'local', answer: r.answer, ids: r.ids, suggestions: suggest(P, r.country) }; }
    const base = P.kind === 'r' ? d.reps : d.clients;
    const C = criteria(P);
    let list = [], dropped = [];
    if (C.length) {
      let active = C.slice();
      list = base.filter((r) => active.every((c) => c.test(r)));
      while (!list.length && active.some((c) => !c.fixed)) {
        const i = active.findIndex((c) => !c.fixed);
        dropped.push(active[i].label);
        active.splice(i, 1);
        list = base.filter((r) => active.every((c) => c.test(r)));
      }
      if (!list.length) {
        return { ok: true, source: 'local', answer: t('ai.l.none', { crit: C.map((c) => c.label).join(' · ') }) + ' ' + t('ai.l.noneHint'), ids: [], suggestions: suggest(P) };
      }
    } else if (P.limit || /(todas|todos|alle|all)\b/.test(P.q) || P.kind === 'r') {
      list = base.slice();
    } else {
      // Nada estructurado: búsqueda libre por nombre / ciudad / rubro
      const hay = (r) => nrm([r.name, r.city, (r.sectors || []).map(d.sectorName).join(' '), (r.products || []).map((p) => p.name).join(' ')].join(' '));
      list = P.free.length ? base.filter((r) => P.free.some((w) => wordAt(' ' + hay(r), w.slice(0, Math.max(4, w.length - 2))))) : [];
      if (!list.length) return { ok: true, source: 'local', answer: t('ai.l.notUnderstood'), ids: [], suggestions: suggest(P) };
    }
    list = list.slice().sort(P.sort === 'size' ? (a, b) => d.sizeRank(b) - d.sizeRank(a) || d.score(b) - d.score(a) : (a, b) => d.score(b) - d.score(a));
    const total = list.length;
    if (P.limit) list = list.slice(0, P.limit);
    const what = TL.i18n.tn(P.kind === 'r' ? 'ai.l.reps' : 'ai.l.clients', total).replace(/^\d+\s*/, '');
    const kept = C.filter((c) => !dropped.includes(c.label));
    let answer = kept.length ? t('ai.l.found', { n: L.int(total), what, crit: kept.map((c) => c.label).join(' · ') }) : t('ai.l.foundAll', { n: L.int(total), what });
    if (P.limit && total > P.limit) answer += ' ' + t('ai.l.topN', { n: L.int(P.limit) });
    if (dropped.length) answer += ' ' + t('ai.l.relaxed', { c: dropped.join(' · ') });
    answer += '\n\n' + t(P.kind === 'r' ? 'ai.l.bestReps' : 'ai.l.best', { list: L.list(list.slice(0, 3).map(pts)) });
    if (P.kind === 'c' && (P.replace || P.competitor || P.groups.length || P.brands.length)) {
      const cnt = {};
      list.forEach((c) => (c.machines || []).forEach((m) => { if (m.brand) cnt[m.brand] = (cnt[m.brand] || 0) + 1; }));
      const top = Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([b, n]) => `${b} (${n})`);
      if (top.length) answer += '\n\n' + t('ai.l.base', { list: L.list(top) });
      if (P.replace) answer += ' ' + t('ai.l.replaceHint');
    }
    return { ok: true, source: 'local', answer, ids: list.map((r) => r.id), suggestions: suggest(P, list[0]?.country) };
  };

  /** Preguntale al mapa. Resuelve SIEMPRE { ok, source:'ai'|'local', answer, ids[], suggestions[], reason? } */
  AI.ask = async function (question) {
    question = String(question || '').trim();
    if (!question) return { ok: false, source: 'local', answer: '', ids: [], suggestions: [] };
    let res;
    const r = await call('ask', { question, records: AI.compact() }, 45000);
    if (r.ok) {
      res = {
        ok: true, source: 'ai', answer: String(r.answer || ''),
        ids: (Array.isArray(r.ids) ? r.ids : []).map(String).filter((id) => D().get(id)),
        suggestions: (Array.isArray(r.suggestions) ? r.suggestions : []).map(String).slice(0, 4),
      };
    } else {
      res = Object.assign(AI.local(question), { reason: reasonOf(r), error: r.error });
    }
    if (res.ids.length) applyHighlight(res.ids, res.source); else if (hl) AI.clearHighlight();
    TL.emit('ai:answer', Object.assign({ question }, res));
    return res;
  };
  /* ── Textos de Preparar visita / Investigar ─────────────────────────── */
  TL.i18n.extend({
    es: {
      'ai.v.title': 'Preparar visita', 'ai.v.kicker': 'Briefing de visita',
      'ai.v.s1': 'Leer la ficha completa', 'ai.v.s2': 'Cruzar con el portfolio TRUMPF', 'ai.v.s3': 'Anticipar objeciones', 'ai.v.s4': 'Redactar el briefing',
      'ai.v.snapshot': 'Panorama', 'ai.v.why': 'Por qué TRUMPF', 'ai.v.recommended': 'Series recomendadas', 'ai.v.questions': 'Preguntas para la visita',
      'ai.v.objections': 'Objeciones probables y respuestas', 'ai.v.demo': 'Idea de demo', 'ai.v.next': 'Próximos pasos',
      'ai.v.print': 'Imprimir / PDF', 'ai.v.local': 'Borrador local (sin IA)', 'ai.v.ai': 'Generado con IA', 'ai.v.draft': 'Generar borrador local',
      'ai.v.prepared': 'Preparado el {d}', 'ai.v.objection': 'Objeción', 'ai.v.answer': 'Respuesta',
      'ai.v.facts': '{emp} empleados', 'ai.v.plant': 'planta de {m2} m²', 'ai.v.founded': 'fundada en {y}',
      'ai.v.q1': '¿Qué volumen de chapa procesan por mes y en qué espesores y materiales?',
      'ai.v.q2': '¿Dónde está hoy el cuello de botella: corte, punzonado o plegado?',
      'ai.v.q3': '¿Cuántos turnos trabajan y cuánto tiempo pierden en preparación y cambios de herramienta?',
      'ai.v.q4': '¿Qué antigüedad tienen las máquinas actuales y cuánto cuestan su mantenimiento y consumo?',
      'ai.v.q5': '¿Qué proyectos o clientes nuevos esperan para los próximos 12 a 24 meses?',
      'ai.v.q6': '¿Cómo deciden y financian una inversión de este tamaño?',
      'ai.v.o1': 'Una máquina china cuesta la mitad.',
      'ai.v.a1': 'El precio de compra es solo una parte. TRUMPF baja el costo por pieza con mayor disponibilidad, menor consumo y un valor de reventa muy superior: conviene comparar el costo total a 7–10 años.',
      'ai.v.o2': '¿Quién nos da servicio técnico acá?',
      'ai.v.a2': 'TRUMPF tiene filiales propias en México y Brasil y está armando una red de representantes con técnicos locales, repuestos y soporte remoto.',
      'ai.v.o3': 'Ya trabajamos con {b} y estamos conformes.',
      'ai.v.a3': 'No hace falta reemplazar todo: una TRUMPF puede sumar capacidad justo donde hoy está el cuello de botella y convivir con el parque actual.',
      'ai.v.o4': 'No es el momento de invertir.',
      'ai.v.a4': 'Se puede empezar por una máquina de entrada y crecer por etapas; armamos juntos el cálculo de retorno con sus propias piezas.',
      'ai.v.w.comp': 'Equipos detectados de {b}: oportunidad concreta de reemplazo o upgrade.',
      'ai.v.w.sector': 'Rubro {s}: uso intensivo de chapa donde TRUMPF lidera en precisión y automatización.',
      'ai.v.w.size': 'Escala suficiente para automatizar: {f}.',
      'ai.v.demoTpl': 'Llevar una pieza típica de {c} ({p}) y fabricarla en una {s} en el centro de demostración, midiendo tiempo de ciclo, calidad de canto y costo por pieza frente a su proceso actual.',
      'ai.v.n1': 'Enviar el resumen de la visita y la propuesta de pieza de prueba.',
      'ai.v.n2': 'Pedir planos o archivos DXF de 2 o 3 piezas representativas.',
      'ai.v.n3': 'Calcular costo por pieza y retorno de la inversión.',
      'ai.v.n4': 'Agendar la demo o la visita a un cliente de referencia.',
      'ai.v.genericPart': 'su producto principal',
      'ai.i.title': 'Investigar empresa nueva', 'ai.i.kicker': 'IA · Investigación',
      'ai.i.lead': 'Pegá la web de una empresa. La IA la lee, detecta productos y procesos, calcula el puntaje TRUMPF y la ubica en el mapa.',
      'ai.i.url': 'Sitio web de la empresa', 'ai.i.ph': 'www.empresa.com.pe', 'ai.i.go': 'Investigar', 'ai.i.bad': 'Ingresá una dirección web válida (p. ej. www.empresa.com).',
      'ai.i.s1': 'Leer la web', 'ai.i.s2': 'Detectar productos', 'ai.i.s3': 'Calcular puntaje', 'ai.i.s4': 'Ubicar en el mapa',
      'ai.i.view': 'Ver ficha', 'ai.i.add': 'Agregar al mapa', 'ai.i.added': '{n} se agregó al mapa', 'ai.i.again': 'Investigar otra',
      'ai.i.opp': 'Oportunidad TRUMPF', 'ai.i.approx': 'Ubicación aproximada (centro del país): revisala en la ficha.',
      'ai.i.dup': 'Esta empresa ya está en el atlas.', 'ai.i.noCompany': 'La IA no devolvió una ficha utilizable.',
    },
    de: {
      'ai.v.title': 'Besuch vorbereiten', 'ai.v.kicker': 'Besuchs-Briefing',
      'ai.v.s1': 'Profil auswerten', 'ai.v.s2': 'Mit dem TRUMPF-Portfolio abgleichen', 'ai.v.s3': 'Einwände vorwegnehmen', 'ai.v.s4': 'Briefing verfassen',
      'ai.v.snapshot': 'Überblick', 'ai.v.why': 'Warum TRUMPF', 'ai.v.recommended': 'Empfohlene Baureihen', 'ai.v.questions': 'Fragen für den Termin',
      'ai.v.objections': 'Mögliche Einwände und Antworten', 'ai.v.demo': 'Demo-Idee', 'ai.v.next': 'Nächste Schritte',
      'ai.v.print': 'Drucken / PDF', 'ai.v.local': 'Lokaler Entwurf (ohne KI)', 'ai.v.ai': 'KI-generiert', 'ai.v.draft': 'Lokalen Entwurf erstellen',
      'ai.v.prepared': 'Erstellt am {d}', 'ai.v.objection': 'Einwand', 'ai.v.answer': 'Antwort',
      'ai.v.facts': '{emp} Mitarbeitende', 'ai.v.plant': '{m2} m² Werksfläche', 'ai.v.founded': 'gegründet {y}',
      'ai.v.q1': 'Welche Blechmengen verarbeiten Sie pro Monat – in welchen Stärken und Werkstoffen?',
      'ai.v.q2': 'Wo liegt heute der Engpass: beim Schneiden, Stanzen oder Biegen?',
      'ai.v.q3': 'Wie viele Schichten fahren Sie, und wie viel Zeit geht beim Rüsten verloren?',
      'ai.v.q4': 'Wie alt sind die vorhandenen Maschinen, und was kosten Wartung und Energie?',
      'ai.v.q5': 'Welche neuen Projekte oder Kunden erwarten Sie in den nächsten 12 bis 24 Monaten?',
      'ai.v.q6': 'Wie werden Investitionen dieser Größenordnung entschieden und finanziert?',
      'ai.v.o1': 'Eine chinesische Maschine kostet die Hälfte.',
      'ai.v.a1': 'Der Kaufpreis ist nur ein Teil. TRUMPF senkt die Stückkosten durch höhere Verfügbarkeit, geringeren Verbrauch und einen deutlich höheren Wiederverkaufswert – entscheidend sind die Gesamtkosten über 7–10 Jahre.',
      'ai.v.o2': 'Wer übernimmt hier vor Ort den Service?',
      'ai.v.a2': 'TRUMPF hat eigene Tochtergesellschaften in Mexiko und Brasilien und baut ein Vertretungsnetz mit lokalen Technikern, Ersatzteilen und Remote-Support auf.',
      'ai.v.o3': 'Wir arbeiten bereits mit {b} und sind zufrieden.',
      'ai.v.a3': 'Es muss nicht alles ersetzt werden: Eine TRUMPF-Maschine kann genau dort Kapazität schaffen, wo heute der Engpass liegt, und neben dem bestehenden Maschinenpark laufen.',
      'ai.v.o4': 'Jetzt ist nicht der richtige Zeitpunkt für Investitionen.',
      'ai.v.a4': 'Der Einstieg kann mit einer Einstiegsmaschine erfolgen und schrittweise wachsen; die Amortisation rechnen wir gemeinsam mit Ihren eigenen Teilen.',
      'ai.v.w.comp': 'Erkannte Maschinen von {b}: konkretes Ersatz- oder Upgrade-Potenzial.',
      'ai.v.w.sector': 'Branche {s}: blechintensiv – genau dort, wo TRUMPF bei Präzision und Automatisierung führt.',
      'ai.v.w.size': 'Ausreichende Größe für Automatisierung: {f}.',
      'ai.v.demoTpl': 'Ein typisches Teil von {c} ({p}) im Demo-Center auf einer {s} fertigen und Zykluszeit, Kantenqualität und Stückkosten mit dem heutigen Prozess vergleichen.',
      'ai.v.n1': 'Besuchszusammenfassung und Vorschlag für ein Testteil senden.',
      'ai.v.n2': 'Zeichnungen oder DXF-Dateien von 2–3 typischen Teilen anfragen.',
      'ai.v.n3': 'Stückkosten und Amortisation berechnen.',
      'ai.v.n4': 'Demo oder Besuch bei einem Referenzkunden vereinbaren.',
      'ai.v.genericPart': 'sein Hauptprodukt',
      'ai.i.title': 'Neues Unternehmen recherchieren', 'ai.i.kicker': 'KI · Recherche',
      'ai.i.lead': 'Website eines Unternehmens einfügen. Die KI liest sie, erkennt Produkte und Prozesse, berechnet den TRUMPF-Score und verortet das Unternehmen auf der Karte.',
      'ai.i.url': 'Website des Unternehmens', 'ai.i.ph': 'www.firma.com.pe', 'ai.i.go': 'Recherchieren', 'ai.i.bad': 'Bitte eine gültige Webadresse eingeben (z. B. www.firma.com).',
      'ai.i.s1': 'Website lesen', 'ai.i.s2': 'Produkte erkennen', 'ai.i.s3': 'Score berechnen', 'ai.i.s4': 'Auf der Karte verorten',
      'ai.i.view': 'Profil ansehen', 'ai.i.add': 'Zur Karte hinzufügen', 'ai.i.added': '{n} wurde zur Karte hinzugefügt', 'ai.i.again': 'Weiteres recherchieren',
      'ai.i.opp': 'TRUMPF-Potenzial', 'ai.i.approx': 'Ungefährer Standort (Landesmitte) – bitte im Profil prüfen.',
      'ai.i.dup': 'Dieses Unternehmen ist bereits im Atlas.', 'ai.i.noCompany': 'Die KI hat kein verwertbares Profil geliefert.',
    },
  });

  /* ── Modal (usa TL.ui.modal del núcleo; mínimo de respaldo si faltara) ── */
  function modal(o) {
    if (TL.ui?.modal) return TL.ui.modal(Object.assign({ actions: [] }, o));
    const host = document.getElementById('tl-modal-root') || document.body;
    const el = u.h('div.ai-fbm', { role: 'dialog', 'aria-modal': 'true' });
    el.innerHTML = `<div class="ai-fbm-scrim"></div><div class="ai-fbm-box ${u.esc(o.cls || '')}"><header><h2>${u.esc(o.title || '')}</h2><button type="button" class="icon-btn" aria-label="${u.esc(t('ai.close'))}">${TL.ui.icon('close')}</button></header><div class="ai-fbm-body"></div></div>`;
    host.appendChild(el);
    const body = el.querySelector('.ai-fbm-body');
    let off = null;
    const api = {
      el, body,
      setContent(x) { body.innerHTML = ''; if (x && x.nodeType) body.appendChild(x); else body.innerHTML = String(x || ''); },
      close() { off?.(); el.remove(); o.onClose?.(); },
    };
    el.querySelector('.ai-fbm-scrim').onclick = api.close;
    el.querySelector('header button').onclick = api.close;
    off = TL.ui?.escPush ? TL.ui.escPush(api.close) : null;
    if (o.content) api.setContent(o.content);
    return api;
  }
  AI._modal = modal;

  /** Pasos animados con loader láser. keys = claves i18n. */
  function stepsView(keys, lead) {
    const node = u.el(`<div class="ai-work">${AI.laser()}<div class="ai-work-txt">${lead ? `<p class="ai-work-lead">${u.esc(lead)}</p>` : ''}<ol class="ai-steps">${keys.map((k, i) => `<li data-st="${i ? 'wait' : 'run'}"><span class="mono">${String(i + 1).padStart(2, '0')}</span><b>${u.esc(t(k))}</b><i class="ai-st-ico"></i></li>`).join('')}</ol></div></div>`);
    const lis = Array.from(node.querySelectorAll('li'));
    let cur = 0, timer = 0;
    const set = (i) => { cur = i; lis.forEach((li, j) => { li.dataset.st = j < i ? 'done' : j === i ? 'run' : 'wait'; }); };
    const tick = () => { if (cur < lis.length - 1) { set(cur + 1); timer = setTimeout(tick, 1500 + Math.random() * 700); } };
    timer = setTimeout(tick, 1300);
    return {
      node,
      async done() { clearTimeout(timer); for (let i = cur; i <= lis.length; i++) { set(i); if (!TL.reduceMotion) await u.sleep(130); } },
      fail() { clearTimeout(timer); if (lis[cur]) lis[cur].dataset.st = 'fail'; node.classList.add('is-failed'); },
      stop() { clearTimeout(timer); },
    };
  }
  /* ── Portfolio: foto oficial por serie (match por línea + número) ───── */
  const ns = (s) => nrm(s).replace(/\bserie\b/g, 'series').replace(/\s+/g, ' ').trim();
  function portfolioFor(series, family) {
    const a = findIn(D().portfolio || [], series, family);
    if (a && a.image) return a;
    const b = findIn((window.TL_FALLBACK && window.TL_FALLBACK.portfolio) || [], series, family);
    return b && b.image ? Object.assign({}, a || {}, { image: b.image, tagline_es: (a && a.tagline_es) || b.tagline_es, tagline_de: (a && a.tagline_de) || b.tagline_de }) : a || b;
  }
  function findIn(P, series, family) {
    const s = ns(series);
    if (!s && !family) return null;
    let p = P.find((x) => ns(x.series) === s);
    if (!p && s) {
      const line = s.replace(/\s*series.*$/, '').replace(/\s*\d.*$/, '').trim();
      const num = (s.match(/\d{3,4}/) || [])[0];
      p = P.find((x) => { const xs = ns(x.series); return line && xs.startsWith(line) && (!num || xs.includes(num)) && (!family || x.family === family); })
        || P.find((x) => { const xs = ns(x.series); return line && xs.startsWith(line) && (!num || xs.includes(num)); });
    }
    return p || null;
  }

  /* ── Borrador local del briefing (sin IA) ───────────────────────────── */
  function localBrief(rec) {
    const d = D(), L = TL.i18n;
    const comp = u.unique((rec.machines || []).filter((m) => m.kind === 'competidor' || (d.groupOfBrand(m.brand, m.brand_group) !== 'trumpf')).map((m) => m.brand).filter(Boolean));
    const sz = rec.size || {};
    const facts = [sz.employees ? t('ai.v.facts', { emp: sz.employees }) : '', sz.plant_m2 ? t('ai.v.plant', { m2: L.int(sz.plant_m2) }) : '', sz.founded ? t('ai.v.founded', { y: sz.founded }) : ''].filter(Boolean);
    const why = [L.pick(rec, 'opportunity')];
    if (comp.length) why.push(t('ai.v.w.comp', { b: L.list(comp) }));
    if ((rec.sectors || []).length) why.push(t('ai.v.w.sector', { s: L.list(rec.sectors.slice(0, 2).map(d.sectorName)) }));
    const fit = rec.trumpf_fit || [];
    const prod = (rec.products || [])[0];
    const obj = [1, 2].concat(comp.length ? [3] : [], [4]).map((i) => ({ objection: t('ai.v.o' + i, { b: comp[0] || '' }), answer: t('ai.v.a' + i) }));
    return {
      title: rec.name,
      snapshot: [L.pick(rec, 'summary'), facts.length ? facts.join(' · ') + '.' : ''].filter(Boolean).join(' '),
      why_trumpf: why.filter(Boolean),
      recommended: fit.map((f) => ({ series: f.series, family: f.family, why: L.pick(f, 'why') })),
      questions: [1, 2, 3, 4, 5, 6].map((i) => t('ai.v.q' + i)),
      objections: obj,
      demo_idea: fit.length ? t('ai.v.demoTpl', { c: rec.name, p: prod ? (L.pick(prod, 'name') || prod.name) : t('ai.v.genericPart'), s: fit[0].series }) : '',
      next_steps: [1, 2, 3, 4].map((i) => t('ai.v.n' + i)),
    };
  }

  const arr = (x) => (Array.isArray(x) ? x : x ? [x] : []);
  function briefView(b, rec, src) {
    const d = D(), L = TL.i18n;
    const recs = arr(b.recommended).map((r) => (typeof r === 'string' ? { series: r } : r)).filter((r) => r && r.series);
    const fam = (s) => (rec.trumpf_fit || []).find((f) => ns(f.series) === ns(s))?.family;
    const cards = recs.map((r) => {
      const p = portfolioFor(r.series, r.family || fam(r.series));
      const img = p?.image ? `<img src="${u.esc(p.image)}" alt="${u.esc(r.series)}" loading="lazy" decoding="async">` : `<span class="ab-ph">${TL.ui.icon(TL.ui.processIcon(r.family || fam(r.series) || p?.family))}</span>`;
      return `<figure class="ab-card"><div class="ab-img">${img}</div><figcaption><b>${u.esc(r.series)}</b>${p ? `<span>${u.esc(L.pick(p, 'tagline'))}</span>` : ''}${r.why ? `<p>${u.esc(r.why)}</p>` : ''}</figcaption></figure>`;
    }).join('');
    const li = (xs, tag = 'ul') => (xs.length ? `<${tag} class="ab-list">${xs.map((x) => `<li>${u.esc(String(x))}</li>`).join('')}</${tag}>` : '');
    const objs = arr(b.objections).map((o) => (typeof o === 'string' ? { objection: o } : o)).filter((o) => o && o.objection);
    const sec = (key, body, cls = '') => (body ? `<section class="ab-sec ${cls}"><h3>${u.esc(t(key))}</h3>${body}</section>` : '');
    const place = [rec.city, d.countryName(rec.country)].filter(Boolean).join(' · ');
    return `<article class="ai-brief">
      <header class="ab-head">
        ${TL.ui.logo(rec, 56)}
        <div class="ab-id"><p class="ab-kick mono">${u.esc(t('ai.v.kicker'))} · ${u.esc(t('ai.v.prepared', { d: L.date(new Date()) }))}</p>
          <h2>${u.esc(b.title || rec.name)}</h2>
          <p class="ab-place">${TL.ui.flag(rec.country, 18)}<span>${u.esc(place)}</span>${rec.segment ? `<span>· ${u.esc(d.segmentName(rec.segment))}</span>` : ''}</p></div>
        <div class="ab-score">${TL.ui.ring({ score: d.score(rec), tier: rec.tier || 'C', size: 54, animate: false })}<span class="ab-src" data-src="${src}">${TL.ui.icon(src === 'ai' ? 'sparkle' : 'info')}${u.esc(t(src === 'ai' ? 'ai.v.ai' : 'ai.v.local'))}</span></div>
      </header>
      ${sec('ai.v.snapshot', b.snapshot ? `<p class="ab-lead">${u.esc(b.snapshot)}</p>` : '')}
      <div class="ab-cols">${sec('ai.v.why', li(arr(b.why_trumpf)))}${sec('ai.v.questions', li(arr(b.questions), 'ol'))}</div>
      ${sec('ai.v.recommended', cards ? `<div class="ab-cards">${cards}</div>` : '')}
      ${sec('ai.v.objections', objs.length ? `<dl class="ab-objs">${objs.map((o) => `<div><dt><span class="mono">${u.esc(t('ai.v.objection'))}</span>${u.esc(o.objection)}</dt>${o.answer ? `<dd><span class="mono">${u.esc(t('ai.v.answer'))}</span>${u.esc(o.answer)}</dd>` : ''}</div>`).join('')}</dl>` : '')}
      <div class="ab-cols">${sec('ai.v.demo', b.demo_idea ? `<p>${u.esc(b.demo_idea)}</p>` : '', 'ab-demo')}${sec('ai.v.next', li(arr(b.next_steps), 'ol'), 'ab-next')}</div>
      <footer class="ab-foot mono"><span>TRUMPF · Market Atlas LATAM</span><span>${u.esc(rec.id)}</span></footer>
    </article>`;
  }

  /** Imprime SOLO el briefing (clonado en un contenedor propio). */
  function printNode(node) {
    const holder = u.h('div#ai-print');
    holder.appendChild(node.cloneNode(true));
    document.body.appendChild(holder);
    document.body.classList.add('ai-printing');
    let done = false;
    const end = () => { if (done) return; done = true; document.body.classList.remove('ai-printing'); holder.remove(); window.removeEventListener('afterprint', end); };
    window.addEventListener('afterprint', end);
    setTimeout(() => { try { window.print(); } finally { setTimeout(end, 300); } }, 60);
  }

  const actionsBar = (btns) => u.el(`<div class="ai-actions">${btns.map((b, i) => `<button type="button" class="btn ${b.kind === 'lime' ? 'btn-lime' : b.kind === 'ink' ? 'btn-ink' : 'btn-ghost'}" data-b="${i}">${b.icon ? TL.ui.icon(b.icon) : ''}<span>${u.esc(b.label)}</span></button>`).join('')}</div>`);
  /** Contenido + botones: usa el pie del modal del núcleo (setActions) o una barra propia. */
  function withActions(content, btns, m) {
    const node = content.nodeType ? content : u.el(String(content));
    if (m && typeof m.setActions === 'function') {
      m.setActions(btns.map((b) => ({ label: b.label, kind: b.kind || 'ghost', icon: b.icon, onClick: () => b.run() })));
      return node;
    }
    const wrap = u.h('div.ai-view');
    wrap.appendChild(node);
    const bar = actionsBar(btns);
    bar.addEventListener('click', (e) => { const x = e.target.closest('button[data-b]'); if (x) btns[+x.dataset.b].run(x); });
    wrap.appendChild(bar);
    return wrap;
  }
  const bare = (m, node) => { m.setActions?.([]); m.setContent(node); };

  /** Preparar visita: briefing de n8n (o borrador local) en modal grande imprimible. */
  AI.visit = async function (id) {
    const rec = D().rec(id);
    if (!rec) return null;
    const m = modal({ title: t('ai.v.title') + ' · ' + rec.name, size: 'lg', cls: 'ai-modal ai-visit' });
    const show = (brief, src) => {
      const view = withActions(u.el(briefView(brief, rec, src)), [
        { label: t('ai.close'), kind: 'ghost', run: () => m.close() },
        { label: t('ai.v.print'), kind: 'lime', icon: 'print', run: () => printNode(view.matches('.ai-brief') ? view : view.querySelector('.ai-brief')) },
      ], m);
      m.setContent(view);
      m.body?.scrollTo?.(0, 0);
    };
    const offline = (r) => {
      const view = withActions(u.el(`<div class="ai-offwrap">${AI.notice('visit', { reason: reasonOf(r), error: r.error })}</div>`), [
        { label: t('ai.close'), kind: 'ghost', run: () => m.close() },
        ...(AI.enabled('visit') ? [{ label: t('ai.retry'), kind: 'ghost', icon: 'refresh', run: () => { m.close(); AI.visit(id); } }] : []),
        { label: t('ai.v.draft'), kind: 'lime', icon: 'sparkle', run: () => show(localBrief(rec), 'local') },
      ], m);
      m.setContent(view);
    };
    if (!AI.enabled('visit')) { offline({ unconfigured: true }); return m; }
    const st = stepsView(['ai.v.s1', 'ai.v.s2', 'ai.v.s3', 'ai.v.s4'], rec.name);
    bare(m, st.node);
    const slim = Object.assign({}, rec); delete slim.photos; delete slim.logo;
    const r = await call('visit', { record: slim }, 90000);
    if (r.ok && r.brief) { await st.done(); show(r.brief, 'ai'); }
    else { st.fail(); await u.sleep(450); offline(r.ok ? { error: t('ai.i.noCompany') } : r); }
    return m;
  };
  AI.localBrief = localBrief;
  AI.portfolioFor = portfolioFor;
  /* ── Investigar empresa nueva ───────────────────────────────────────── */
  function cleanUrl(v) {
    v = String(v || '').trim();
    if (!v) return null;
    if (!/^https?:\/\//i.test(v)) v = 'https://' + v;
    try {
      const x = new URL(v);
      if (!/^https?:$/.test(x.protocol) || !/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(x.hostname) || /\.$/.test(x.hostname)) return null;
      return x.href;
    } catch (e) { return null; }
  }
  const tierOf = (s) => (s >= 70 ? 'A' : s >= 55 ? 'B' : 'C');
  function normalizeCompany(c, url) {
    const d = D();
    const rec = Object.assign({}, c);
    rec.id = rec.id || 'AI-' + Date.now();
    rec.isNew = true;
    rec.website = rec.website || url;
    rec.name = rec.name || rec.legal_name || new URL(url).hostname.replace(/^www\./, '');
    rec.score = Object.assign({}, rec.score || {});
    if (rec.score.total == null && rec.score) rec.score.total = ['sector_fit', 'size', 'sheet_volume', 'upgrade', 'growth', 'web'].reduce((a, k) => a + (+rec.score[k] || 0), 0);
    rec.tier = rec.tier || tierOf(+rec.score.total || 0);
    ['sectors', 'products', 'machines', 'trumpf_fit', 'signals', 'sources'].forEach((k) => { if (!Array.isArray(rec[k])) rec[k] = []; });
    rec.discovered_via = rec.discovered_via || 'IA · investigate';
    if (rec.lat == null || rec.lng == null || rec.lat === '' || !isFinite(+rec.lat) || !isFinite(+rec.lng)) {
      const k = d.country(rec.country);
      if (k?.center) { rec.lng = k.center[0]; rec.lat = k.center[1]; rec.geo_precision = 'ciudad'; rec._approx = true; }
    } else { rec.lat = +rec.lat; rec.lng = +rec.lng; }
    return rec;
  }
  const hostOf = (s) => { try { return new URL(cleanUrl(s)).hostname.replace(/^www\./, ''); } catch (e) { return ''; } };

  function previewView(rec) {
    const d = D(), L = TL.i18n;
    const place = [rec.city, d.countryName(rec.country)].filter(Boolean).join(' · ');
    const chips = (rec.sectors || []).slice(0, 3).map((s) => String(TL.ui.chip(d.sectorName(s)))).join('') + (rec.trumpf_fit || []).slice(0, 3).map((f) => String(TL.ui.chip(f.series, { cls: 'chip-fit' }))).join('');
    return `<div class="ai-prev">
      <div class="ap-head">${TL.ui.logo(rec, 60)}
        <div class="ap-id"><span class="ap-new">${u.esc(t('ui.newAI'))}</span><h3>${u.esc(rec.name)}</h3>
          <p>${rec.country ? TL.ui.flag(rec.country, 18) : ''}<span>${u.esc(place)}</span>${rec.segment ? `<span>· ${u.esc(d.segmentName(rec.segment))}</span>` : ''}</p></div>
        ${TL.ui.ring({ score: d.score(rec), tier: rec.tier, size: 60 })}</div>
      ${L.pick(rec, 'summary') ? `<p class="ap-sum">${u.esc(L.pick(rec, 'summary'))}</p>` : ''}
      ${L.pick(rec, 'opportunity') ? `<div class="ap-opp"><p class="ap-k mono">${u.esc(t('ai.i.opp'))}</p><p>${u.esc(L.pick(rec, 'opportunity'))}</p></div>` : ''}
      ${chips ? `<div class="ap-chips">${chips}</div>` : ''}
      ${rec._approx ? `<p class="ap-note">${TL.ui.icon('info')}${u.esc(t('ai.i.approx'))}</p>` : ''}
    </div>`;
  }

  /** Modal: URL → pasos animados → vista previa → Ver ficha / Agregar al mapa. */
  AI.investigate = function (url) {
    const m = modal({ title: t('ai.i.title'), size: 'md', cls: 'ai-modal ai-inv' });
    const on = AI.enabled('investigate');
    const form = () => {
      const node = u.el(`<form class="ai-form" novalidate>
        <p class="ai-lead">${u.esc(t('ai.i.lead'))}</p>
        ${on ? '' : String(AI.notice('investigate', { reason: 'unconfigured' }))}
        <label class="ai-field"><span class="ai-lbl">${u.esc(t('ai.i.url'))}</span>
          <span class="ai-inrow">${TL.ui.icon('web')}<input type="url" inputmode="url" autocomplete="url" spellcheck="false" name="url" placeholder="${u.esc(t('ai.i.ph'))}" value="${u.esc(url || '')}" aria-describedby="ai-url-err"></span></label>
        <p class="ai-err" id="ai-url-err" role="alert" hidden>${u.esc(t('ai.i.bad'))}</p>
        <div class="ai-actions"><button type="submit" class="btn btn-lime" ${on ? '' : 'disabled'}>${TL.ui.icon('sparkle')}<span>${u.esc(t('ai.i.go'))}</span></button></div>
      </form>`);
      const inp = node.querySelector('input'), err = node.querySelector('.ai-err');
      inp.addEventListener('input', () => { err.hidden = true; inp.removeAttribute('aria-invalid'); });
      node.addEventListener('submit', (e) => {
        e.preventDefault();
        const v = cleanUrl(inp.value);
        if (!v) { err.hidden = false; inp.setAttribute('aria-invalid', 'true'); inp.focus(); return; }
        if (on) run(v);
      });
      bare(m, node);
      setTimeout(() => inp.focus(), 60);
    };
    const run = async (v) => {
      const dup = D().clients.find((c) => c.website && hostOf(c.website) === hostOf(v));
      const st = stepsView(['ai.i.s1', 'ai.i.s2', 'ai.i.s3', 'ai.i.s4'], hostOf(v));
      bare(m, st.node);
      const r = await call('investigate', { url: v }, 120000);
      if (!r.ok || !r.company || typeof r.company !== 'object') {
        st.fail(); await u.sleep(450);
        m.setContent(withActions(u.el(`<div class="ai-offwrap">${AI.notice('investigate', { reason: r.ok ? 'error' : reasonOf(r), error: r.ok ? t('ai.i.noCompany') : r.error })}</div>`), [
          { label: t('ai.close'), kind: 'ghost', run: () => m.close() },
          { label: t('ai.retry'), kind: 'lime', icon: 'refresh', run: () => run(v) },
        ], m));
        return;
      }
      await st.done();
      const rec = normalizeCompany(r.company, v);
      let added = !!D().get(rec.id);
      const add = () => {
        if (!added && !D().get(rec.id)) { D().addExtra(rec); TL.map?.refreshPoints?.(); }
        added = true;
      };
      const view = withActions(u.el(`<div>${dup ? `<p class="ap-note">${TL.ui.icon('info')}${u.esc(t('ai.i.dup'))}</p>` : ''}${previewView(rec)}</div>`), [
        { label: t('ai.i.again'), kind: 'ghost', icon: 'refresh', run: () => { url = ''; form(); } },
        { label: t('ai.i.view'), kind: 'ghost', run: () => {
          if (!added && TL.ficha?.preview) { m.close(); TL.ficha.preview(rec); return; }
          add(); m.close(); TL.nav?.open?.(rec.id, { fly: true });
        } },
        { label: t('ai.i.add'), kind: 'lime', icon: 'pin', run: () => {
          add(); m.close();
          TL.ui.toast?.(t('ai.i.added', { n: rec.name }), { kind: 'ok' });
          setTimeout(() => TL.nav?.open?.(rec.id, { fly: true }), 120);
        } },
      ], m);
      m.setContent(view);
      TL.ui.reveal?.(view);
    };
    if (url && on && cleanUrl(url)) run(cleanUrl(url)); else form();
    return m;
  };
  AI.cleanUrl = cleanUrl;
})();
