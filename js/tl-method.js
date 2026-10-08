/* ==========================================================================
   tl-method.js — Metodología: cómo se construyó el atlas (página editorial
   corta, mismo sistema visual que Go-to-Market; reutiliza TL.ed de tl-gtm.js).
   API: window.TL_METHOD = { open(), close() }
   ========================================================================== */
(function () {
  'use strict';
  const { u } = TL;
  const html = u.html, raw = u.raw;
  const t = (k, v) => TL.i18n.t(k, v);
  const I = TL.i18n;

  I.extend({
    es: {
      'method.kicker': 'Metodología',
      'method.ovTitle': 'Cómo se construyó el atlas',
      'method.cover.kicker': 'Market Atlas LATAM · Metodología',
      'method.cover.t1': 'Método',
      'method.cover.t2': 'y fuentes',
      'method.cover.lead': 'Todos los datos provienen de fuentes públicas: webs de las empresas, prensa, registros sectoriales y estadísticas oficiales. La investigación la hicieron agentes de IA que trabajaron en paralelo bajo un protocolo común, y cada ficha pasó por un filtro de calidad y una revisión antes de entrar al mapa.',
      'method.cover.date': 'Fecha de corte',
      'method.cover.scope': 'Cobertura',
      'method.cover.scopeV': '{n} países objetivo, sin México ni Brasil',
      'method.cover.by': 'Elaborado por',
      'method.s.process': 'Proceso',
      'method.s.results': 'Resultados',
      'method.s.clients': 'Puntaje de clientes',
      'method.s.reps': 'Idoneidad de representantes',
      'method.s.brands': 'Grupos de marcas',
      'method.s.sources': 'Fuentes',
      'method.s.limits': 'Limitaciones',
      'method.p1.t': 'Descubrimiento',
      'method.p1': 'Búsqueda por rubro y ciudad en directorios, cámaras, ferias, prensa y avisos de empleo.',
      'method.p2.t': 'Escaneo web',
      'method.p2': 'Lectura de la web propia: productos, servicios, contactos, logo, imágenes, ubicación y marcas mencionadas.',
      'method.p3.t': 'Filtro de calidad',
      'method.p3': 'Se descartan empresas sin web propia activa, sin proceso de chapa relevante, duplicadas o sin planta en el país.',
      'method.p4.t': 'Máquinas y señales',
      'method.p4': 'Máquinas y marcas solo con evidencia (foto, texto, video, aviso) y señales de crecimiento 2024–2026.',
      'method.p5.t': 'Revisión y puntaje',
      'method.p5': 'Puntaje con escala fija y revisión independiente con veredicto: aceptar, corregir o rechazar.',
      'method.agents': 'Cada agente investigó un país y un rubro a la vez, con las mismas instrucciones, el mismo esquema de datos y un límite de consultas por empresa. Los resultados se consolidaron en un único conjunto de datos, se geolocalizaron con la dirección publicada y se tradujeron al alemán.',
      'method.r.lead': 'Conteos del conjunto de datos publicado en el atlas.',
      'method.k.clients': 'Clientes potenciales',
      'method.k.clientsS': 'A {a} · B {b} · C {c}',
      'method.k.reps': 'Representantes evaluados',
      'method.k.repsS': 'en shortlist: {n}',
      'method.k.opps': 'Proyectos de inversión',
      'method.k.oppsS': 'radar de oportunidades',
      'method.k.countries': 'Países con datos',
      'method.k.countriesS': 'de {n} países objetivo',
      'method.k.review': 'Revisión: {a} fichas aceptadas, {r} con corrección.',
      'method.t.country': 'País',
      'method.t.clients': 'Clientes',
      'method.t.reps': 'Repr.',
      'method.t.opps': 'Oport.',
      'method.t.dealers': 'Distrib. comp.',
      'method.t.intel': 'Inteligencia',
      'method.t.yes': 'sí',
      'method.c.lead': 'Cada empresa suma hasta 100 puntos en seis componentes. El puntaje ordena las listas y define la prioridad (tier).',
      'method.cw.sector_fit': 'Encaje sectorial: peso de la chapa en el producto',
      'method.cw.size': 'Tamaño: empleados, plantas, grupo',
      'method.cw.sheet_volume': 'Volumen de piezas de chapa o tubo',
      'method.cw.upgrade': 'Potencial de renovación del parque',
      'method.cw.growth': 'Crecimiento 2024–2026',
      'method.cw.web': 'Presencia digital y de marca',
      'method.c.upgrade': 'Renovación: plasma, oxicorte, CO₂, equipos antiguos o corte tercerizado puntúan más alto; quien invirtió hace poco en un competidor premium, más bajo.',
      'method.scale': 'Escala de prioridad',
      'method.rp.lead': 'Los candidatos a representante se evalúan sobre 100 puntos con la misma escala de tiers.',
      'method.rw.portfolio_fit': 'Afinidad de portafolio',
      'method.rw.service': 'Servicio técnico propio',
      'method.rw.scale': 'Escala y solidez',
      'method.rw.market_access': 'Acceso al mercado industrial',
      'method.rw.no_conflict': 'Sin conflicto de marcas',
      'method.rp.short': 'La shortlist reúne a los candidatos con mejor idoneidad, servicio técnico comprobado y sin conflicto directo con TRUMPF. Los distribuidores de marcas competidoras no se descartan: quedan registrados como inteligencia competitiva.',
      'method.b.lead': 'Las máquinas detectadas se agrupan por origen y tipo de fabricante. El mismo color se usa en todo el atlas.',
      'method.src.lead': 'Solo fuentes públicas y verificables. Cada máquina, señal y contacto guarda la URL de su evidencia.',
      'method.src.i': 'Webs corporativas de las empresas y sus catálogos|Prensa económica y sectorial|Cámaras, asociaciones y directorios industriales|Avisos de empleo y redes profesionales|Banco Mundial y UN Comtrade (datos de país e importaciones)|trumpf.com: portafolio, cifras y presencia en la región',
      'method.src.intel': 'La inteligencia de país cita {n} fuentes adicionales.',
      'method.lim': 'Es un relevamiento de escritorio con fuentes públicas a la fecha de corte. Puede haber empresas relevantes sin presencia web y datos desactualizados; tamaños y volúmenes son estimaciones. Las máquinas se informan solo con evidencia, por lo que la base instalada real es mayor que la detectada. Los contactos son únicamente los publicados por las propias empresas o la prensa. Antes de cualquier decisión comercial, los datos deben validarse en campo.',
    },
    de: {
      'method.kicker': 'Methodik',
      'method.ovTitle': 'Wie der Atlas entstanden ist',
      'method.cover.kicker': 'Market Atlas LATAM · Methodik',
      'method.cover.t1': 'Methodik',
      'method.cover.t2': 'und Quellen',
      'method.cover.lead': 'Alle Daten stammen aus öffentlichen Quellen: Unternehmenswebsites, Presse, Branchenverzeichnisse und amtliche Statistiken. Recherchiert haben KI-Agenten, die parallel nach einem gemeinsamen Protokoll arbeiteten; jedes Profil durchlief einen Qualitätsfilter und eine Prüfung, bevor es in die Karte aufgenommen wurde.',
      'method.cover.date': 'Stichtag',
      'method.cover.scope': 'Abdeckung',
      'method.cover.scopeV': '{n} Zielländer, ohne Mexiko und Brasilien',
      'method.cover.by': 'Erstellt von',
      'method.s.process': 'Ablauf',
      'method.s.results': 'Ergebnisse',
      'method.s.clients': 'Kunden-Scoring',
      'method.s.reps': 'Eignung der Vertriebspartner',
      'method.s.brands': 'Markengruppen',
      'method.s.sources': 'Quellen',
      'method.s.limits': 'Grenzen der Analyse',
      'method.p1.t': 'Recherche',
      'method.p1': 'Suche nach Branche und Stadt in Verzeichnissen, Kammern, Messen, Presse und Stellenanzeigen.',
      'method.p2.t': 'Web-Scan',
      'method.p2': 'Auswertung der eigenen Website: Produkte, Leistungen, Kontakte, Logo, Bilder, Standort und genannte Marken.',
      'method.p3.t': 'Qualitätsfilter',
      'method.p3': 'Aussortiert werden Firmen ohne aktive eigene Website, ohne relevante Blechbearbeitung, Dubletten oder ohne Werk im Land.',
      'method.p4.t': 'Maschinen und Signale',
      'method.p4': 'Maschinen und Marken nur mit Nachweis (Foto, Text, Video, Anzeige) sowie Wachstumssignale 2024–2026.',
      'method.p5.t': 'Prüfung und Scoring',
      'method.p5': 'Bewertung nach fester Skala und unabhängige Prüfung mit Urteil: annehmen, nachbessern oder ablehnen.',
      'method.agents': 'Jeder Agent bearbeitete jeweils ein Land und eine Branche – mit denselben Anweisungen, demselben Datenschema und einer Obergrenze an Abfragen pro Unternehmen. Die Ergebnisse wurden in einem Datensatz zusammengeführt, anhand der veröffentlichten Adresse georeferenziert und ins Deutsche übersetzt.',
      'method.r.lead': 'Kennzahlen des im Atlas veröffentlichten Datensatzes.',
      'method.k.clients': 'Potenzielle Kunden',
      'method.k.clientsS': 'A {a} · B {b} · C {c}',
      'method.k.reps': 'Bewertete Vertriebspartner',
      'method.k.repsS': 'auf der Shortlist: {n}',
      'method.k.opps': 'Investitionsprojekte',
      'method.k.oppsS': 'Chancen-Radar',
      'method.k.countries': 'Länder mit Daten',
      'method.k.countriesS': 'von {n} Zielländern',
      'method.k.review': 'Prüfung: {a} Profile angenommen, {r} nachgebessert.',
      'method.t.country': 'Land',
      'method.t.clients': 'Kunden',
      'method.t.reps': 'Partner',
      'method.t.opps': 'Projekte',
      'method.t.dealers': 'Händler Wettb.',
      'method.t.intel': 'Länderanalyse',
      'method.t.yes': 'ja',
      'method.c.lead': 'Jedes Unternehmen erhält bis zu 100 Punkte in sechs Komponenten. Der Score sortiert die Listen und bestimmt die Priorität (Tier).',
      'method.cw.sector_fit': 'Branchenfit: Anteil von Blech am Produkt',
      'method.cw.size': 'Größe: Mitarbeitende, Werke, Konzern',
      'method.cw.sheet_volume': 'Menge an Blech- und Rohrteilen',
      'method.cw.upgrade': 'Modernisierungspotenzial des Maschinenparks',
      'method.cw.growth': 'Wachstum 2024–2026',
      'method.cw.web': 'Digitaler Auftritt und Marke',
      'method.c.upgrade': 'Modernisierung: Plasma, Autogen, CO₂, alte Anlagen oder zugekaufte Schneidleistung erhöhen den Wert; eine kürzliche Investition in einen Premium-Wettbewerber senkt ihn.',
      'method.scale': 'Prioritätsskala',
      'method.rp.lead': 'Partnerkandidaten werden auf 100 Punkte bewertet – mit derselben Tier-Skala.',
      'method.rw.portfolio_fit': 'Portfoliopassung',
      'method.rw.service': 'Eigener technischer Service',
      'method.rw.scale': 'Größe und Stabilität',
      'method.rw.market_access': 'Zugang zum Industriemarkt',
      'method.rw.no_conflict': 'Keine Markenkonflikte',
      'method.rp.short': 'Die Shortlist umfasst die Kandidaten mit der besten Eignung, nachgewiesenem technischem Service und ohne direkten Konflikt mit TRUMPF. Händler von Wettbewerbsmarken werden nicht verworfen, sondern als Wettbewerbsinformation erfasst.',
      'method.b.lead': 'Erkannte Maschinen werden nach Herkunft und Herstellertyp gruppiert. Dieselbe Farbe gilt im gesamten Atlas.',
      'method.src.lead': 'Nur öffentliche, überprüfbare Quellen. Jede Maschine, jedes Signal und jeder Kontakt ist mit der URL des Nachweises gespeichert.',
      'method.src.i': 'Unternehmenswebsites und Kataloge|Wirtschafts- und Fachpresse|Kammern, Verbände und Industrieverzeichnisse|Stellenanzeigen und berufliche Netzwerke|Weltbank und UN Comtrade (Länderdaten und Importe)|trumpf.com: Portfolio, Kennzahlen und Präsenz in der Region',
      'method.src.intel': 'Die Länderanalysen zitieren {n} weitere Quellen.',
      'method.lim': 'Es handelt sich um eine Desk-Research auf Basis öffentlicher Quellen zum Stichtag. Relevante Unternehmen ohne Webauftritt können fehlen, Angaben können veraltet sein; Größen und Mengen sind Schätzungen. Maschinen werden nur mit Nachweis erfasst – die tatsächliche installierte Basis ist daher größer als die erkannte. Kontakte stammen ausschließlich aus Veröffentlichungen der Unternehmen oder der Presse. Vor geschäftlichen Entscheidungen sind die Daten vor Ort zu validieren.',
    },
  });
  const D = () => TL.data;
  const ED = () => TL.ed || {};
  const REPORT_DATE = '2026-10-07';
  const BRANDS = {
    trumpf: 'TRUMPF', premium_eu: 'Bystronic, Salvagnini, Prima Power, LVD, Euromac, Boschert, BLM/Adige, Gasparini, Adira, Schroeder',
    japon: 'Amada, Mazak, Mitsubishi, Murata', turquia: 'Durma, Ermaksan, Baykal, Nukon, Dener, Coastone',
    china: "Bodor, HSG, Han's Laser, Gweike, Senfeng, Hymson, Penta Laser, HGTECH, JFY, Yawei, Accurl", usa: 'Cincinnati',
    corte_termico: 'Hypertherm, Kjellberg, ESAB, Messer, Koike', soldadura: 'Lincoln, Miller, Fronius, Kemppi', robot: 'Fanuc, Yaskawa, KUKA',
    mecanizado: 'Haas, DMG Mori, Okuma, Hurco', otro: '—',
  };
  const CW = [['sector_fit', 25], ['size', 20], ['sheet_volume', 15], ['upgrade', 15], ['growth', 15], ['web', 10]];
  const RW = [['portfolio_fit', 25], ['service', 25], ['scale', 20], ['market_access', 15], ['no_conflict', 15]];
  const SECS = ['process', 'results', 'clients', 'reps', 'brands', 'sources', 'limits'];

  const head = (i, id) => ED().secHead(i, t('method.s.' + id), false);
  const scaleBar = () => html`<div class="ed-scale"><p class="ed-label mono">${t('method.scale')}</p>
    <div class="ed-scale-bar"><span data-t="C" style="width:55%">C</span><span data-t="B" style="width:15%">B</span><span data-t="A" style="width:30%">A</span></div>
    <div class="ed-scale-ticks"><span style="left:0">0</span><span style="left:55%">55</span><span style="left:70%">70</span><span style="left:100%">100</span></div></div>`;

  function counts() {
    const d = D(), mc = d.meta?.counts || {};
    const cl = d.clients || [], st = d.stats(cl);
    const n = cl.length || mc.clients || 0;
    return {
      clients: n, A: (cl.length ? st.A : mc.clients_A) || 0, B: (cl.length ? st.B : mc.clients_B) || 0, C: (cl.length ? st.C : mc.clients_C) || 0,
      reps: (d.reps || []).length || mc.reps || 0, short: (d.reps || []).filter((r) => r.shortlist).length || mc.reps_shortlist || 0,
      opps: (d.opps || []).length || mc.opportunities || 0,
      accepted: cl.filter((c) => c.review?.verdict === 'accept').length, redo: cl.filter((c) => c.review?.verdict === 'redo').length,
    };
  }

  function build() {
    const E = ED(), d = D(), K = counts();
    const targets = d.targetCountries();
    const rows = targets.map((k) => ({ k, cl: d.clientsOf(k.cc), rp: d.repsOf(k.cc), op: d.oppsOf(k.cc), dl: d.dealersOf(k.cc) }))
      .filter((r) => r.cl.length || r.rp.length || r.op.length || r.dl.length || r.k.intel)
      .sort((a, b) => b.cl.length - a.cl.length || b.rp.length - a.rp.length || a.k.cc.localeCompare(b.k.cc));
    const covered = targets.filter((k) => d.clientsOf(k.cc).length || d.repsOf(k.cc).length).length;
    const intelSrc = u.sum(targets, (k) => (k.intel?.sources || []).length);
    const author = d.cfg?.author || window.TL_CONFIG?.author || 'Matías Banzer';
    const steps = [1, 2, 3, 4, 5];
    const groups = d.groupKeys().filter((g) => g !== 'none');
    return html`<div class="ed-page" data-ed="method">
      <i class="ed-progress" aria-hidden="true"><i></i></i>
      <header class="ed-cover ed-cover-method" id="ed-sec-top">
        <div class="ed-cover-text">
          <p class="ed-kicker mono">${t('method.cover.kicker')}</p>
          <h1 class="ed-h1"><span>${t('method.cover.t1')}</span> <b>${t('method.cover.t2')}</b></h1>
          <i class="ed-laser" aria-hidden="true"></i>
          <p class="ed-lead">${t('method.cover.lead')}</p>
          <button type="button" class="btn btn-ghost btn-sm ed-print-cover ed-noprint" data-ed-print>${TL.ui.icon('print')}<span>${t('gtm.print')}</span></button>
        </div>
        <dl class="ed-meta ed-meta-col">
          <div><dt>${t('method.cover.date')}</dt><dd>${I.date(REPORT_DATE, { day: 'numeric', month: 'long', year: 'numeric' })}</dd></div>
          <div><dt>${t('method.cover.scope')}</dt><dd>${t('method.cover.scopeV', { n: I.int(targets.length) })}</dd></div>
          <div><dt>${t('method.cover.by')}</dt><dd>${author}</dd></div>
        </dl>
      </header>
      <nav class="ed-toc" aria-label="${t('gtm.toc')}"><p class="ed-label mono">${t('gtm.toc')}</p>
        <ol>${SECS.map((id, i) => html`<li><a href="#ed-sec-${id}" data-sec="${id}"><span class="mono">${E.num(i + 1)}</span>${t('method.s.' + id)}</a></li>`)}</ol>
        <button type="button" class="btn btn-ghost btn-sm ed-print-btn ed-noprint" data-ed-print>${TL.ui.icon('print')}<span>${t('gtm.print')}</span></button>
      </nav>
      <main class="ed-main">
        <section class="ed-sec" id="ed-sec-process" data-sec="process">${head(1, 'process')}
          <figure class="ed-pipe ed-rv" aria-hidden="true"><svg viewBox="0 0 1000 40">
            <line class="ed-pipe-rail" x1="0" y1="20" x2="1000" y2="20"/>
            <line class="ed-pipe-beam" x1="0" y1="20" x2="1000" y2="20" style="--len:1000"/>
            ${raw(steps.map((s, i) => `<rect class="ed-pipe-node" style="--i:${i}" x="${i * 200 + i * 4.4}" y="14" width="12" height="12"/>`).join(''))}
          </svg></figure>
          <ol class="ed-pipe-steps ed-rv">${steps.map((s) => html`<li><span class="mono">${E.num(s)}</span><b>${t('method.p' + s + '.t')}</b>${t('method.p' + s)}</li>`)}</ol>
          <div class="ed-prose ed-rv" style="margin-top:36px"><p>${t('method.agents')}</p></div>
        </section>

        <section class="ed-sec" id="ed-sec-results" data-sec="results">${head(2, 'results')}
          <div class="ed-prose ed-rv"><p>${t('method.r.lead')}</p></div>
          <div class="ed-kpis ed-kpis-4 ed-rv" style="margin-top:32px">
            ${E.kpi(t('method.k.clients'), K.clients, t('method.k.clientsS', { a: K.A, b: K.B, c: K.C }))}
            ${E.kpi(t('method.k.reps'), K.reps, t('method.k.repsS', { n: I.int(K.short) }))}
            ${E.kpi(t('method.k.opps'), K.opps, t('method.k.oppsS'))}
            ${E.kpi(t('method.k.countries'), covered, t('method.k.countriesS', { n: I.int(targets.length) }))}
          </div>
          ${K.accepted || K.redo ? html`<p class="ed-note">${t('method.k.review', { a: I.int(K.accepted), r: I.int(K.redo) })}</p>` : ''}
          ${rows.length ? html`<div class="ed-table-wrap ed-rv"><table class="ed-table ed-t-method">
            <thead><tr><th>${t('method.t.country')}</th><th class="r">${t('method.t.clients')}</th><th class="r">A</th><th class="r">B</th><th class="r">C</th>
              <th class="r">${t('method.t.reps')}</th><th class="r">${t('method.t.opps')}</th><th class="r">${t('method.t.dealers')}</th><th>${t('method.t.intel')}</th></tr></thead>
            <tbody>${rows.map((r) => { const s = d.stats(r.cl); return html`<tr class="ed-row" data-cc="${r.k.cc}">
              <td><button type="button" class="ed-cty" data-cc="${r.k.cc}">${E.flag(r.k.cc)}<b>${d.countryName(r.k.cc)}</b></button></td>
              <td class="r mono">${I.int(r.cl.length)}</td><td class="r mono">${s.A || 0}</td><td class="r mono">${s.B || 0}</td><td class="r mono">${s.C || 0}</td>
              <td class="r mono">${I.int(r.rp.length)}${r.rp.some((x) => x.shortlist) ? html` <span class="ed-muted">(${r.rp.filter((x) => x.shortlist).length})</span>` : ''}</td>
              <td class="r mono">${I.int(r.op.length)}</td><td class="r mono">${I.int(r.dl.length)}</td>
              <td>${r.k.intel ? html`<span class="ed-qchip">${t('method.t.yes')}</span>` : html`<span class="ed-muted">—</span>`}</td></tr>`; })}</tbody></table></div>` : ''}
        </section>

        <section class="ed-sec" id="ed-sec-clients" data-sec="clients">${head(3, 'clients')}
          <div class="ed-prose ed-rv"><p>${t('method.c.lead')}</p></div>
          <div class="ed-split ed-rv"><div>${E.weights(CW, 'method.cw.')}</div>
            <div>${scaleBar()}<p class="ed-note">${t('method.c.upgrade')}</p></div></div>
        </section>

        <section class="ed-sec" id="ed-sec-reps" data-sec="reps">${head(4, 'reps')}
          <div class="ed-prose ed-rv"><p>${t('method.rp.lead')}</p></div>
          <div class="ed-split ed-rv"><div>${E.weights(RW, 'method.rw.')}</div>
            <div>${scaleBar()}<p class="ed-note">${t('method.rp.short')}</p></div></div>
        </section>

        <section class="ed-sec" id="ed-sec-brands" data-sec="brands">${head(5, 'brands')}
          <div class="ed-prose ed-rv"><p>${t('method.b.lead')}</p></div>
          <ul class="ed-groups ed-rv" style="margin-top:28px">${groups.map((g) => { const G = d.group(g); return html`<li><i class="ed-sw" style="background:${G.color}"></i><b>${G.name}</b><span>${BRANDS[g] || ''}</span></li>`; })}</ul>
        </section>

        <section class="ed-sec" id="ed-sec-sources" data-sec="sources">${head(6, 'sources')}
          <div class="ed-prose ed-rv"><p>${t('method.src.lead')}</p>${E.items(E.lines('method.src.i'))}
            ${intelSrc ? html`<p class="ed-note">${t('method.src.intel', { n: I.int(intelSrc) })}</p>` : ''}</div>
        </section>

        <section class="ed-sec" id="ed-sec-limits" data-sec="limits">${head(7, 'limits')}
          <div class="ed-warn ed-rv" role="note">${TL.ui.icon('info')}<p>${t('method.lim')}</p></div>
          <p class="ed-sign ed-rv" style="margin-top:64px"><b>${author}</b><span class="mono">Market Atlas LATAM · ${I.date(REPORT_DATE)}</span></p>
        </section>
      </main>
    </div>`;
  }

  let cur = null;
  function mountInto(api, opts = {}) {
    const E = ED();
    const page = u.el(build());
    if (cur?.page) { E.unmount(cur.page, cur.cleanup); cur.page.remove(); }
    api.body.innerHTML = '';
    api.body.appendChild(page);
    const cleanup = E.mount(api, page, opts);
    page.addEventListener('click', (e) => {
      const c = e.target.closest('[data-cc]');
      if (c) { close(); setTimeout(() => TL.nav?.country?.(c.dataset.cc), 60); }
    });
    cur = { api, page, cleanup };
  }
  function open() {
    if (!TL.ui?.overlay || !TL.ed?.mount) return;
    const api = TL.ui.overlay.open({
      id: 'method', kicker: t('method.kicker'), title: t('method.ovTitle'), content: '', cls: 'ed-ov ed-ov-method',
      onClose: () => { if (cur && cur.api === api) { ED().unmount(cur.page, cur.cleanup); cur = null; } },
    });
    mountInto(api);
    return api;
  }
  function close() { TL.ui?.overlay?.close('method'); }
  function rerender() {
    if (!cur || !TL.ui.overlay.isOpen('method')) return;
    const { api } = cur, sc = api.scroll, y = sc ? sc.scrollTop : 0;
    const k = api.el.querySelector('.ov-kicker'), ti = api.el.querySelector('.ov-title');
    if (k) k.textContent = t('method.kicker');
    if (ti) ti.textContent = t('method.ovTitle');
    const xs = api.el.querySelector('.ov-x span'); if (xs) xs.textContent = t('ui.close');
    mountInto(api, { instant: true });
    if (sc) requestAnimationFrame(() => { sc.scrollTop = y; });
  }
  TL.on('lang', rerender);
  TL.on('data:changed', rerender);

  window.TL_METHOD = { open, close, isOpen: () => !!TL.ui?.overlay?.isOpen('method') };

  TL.views.register({
    id: 'method', order: 70, icon: 'method', label: 'rail.method', kind: 'action', group: 'tools',
    run: () => window.TL_METHOD.open(),
  });
})();
