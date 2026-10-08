/* ==========================================================================
   tl-tour.js — Modo presentación: recorrido guiado de 11 pasos con cámara,
   captions grandes ES/DE (máscara + barrido láser + count-up), barra de
   progreso por paso, avance automático, teclado de presentador y salida limpia.
   API: TL.tour = { start(step), stop(), next(), prev(), toggle(), isOn() }
   ========================================================================== */
(function () {
  'use strict';
  const { u } = TL;
  const t = (k, v) => TL.i18n.t(k, v);
  const D = () => TL.data;
  const CA_BBOX = [-92.5, 7, -77, 18.5];          // Centroamérica
  const DEFAULT_CC = ['PE', 'CO', 'CL'];

  /* ── Textos ─────────────────────────────────────────────────────────── */
  TL.i18n.extend({
    es: {
      'tour.aria': 'Modo presentación',
      'tour.step': 'Paso {n}',
      'tour.prev': 'Anterior',
      'tour.next': 'Siguiente',
      'tour.pause': 'Pausa',
      'tour.play': 'Reproducir',
      'tour.exit': 'Salir',
      'tour.paused': 'En pausa',
      'tour.hint': '← → navegar · Espacio pausa · Esc salir',
      'tour.by': 'Por {author}',
      // 1 · portada
      'tour.s1.k': 'TRUMPF · Werkzeugmaschinen',
      'tour.s1.t1': 'Market Atlas',
      'tour.s1.t2': 'LATAM',
      'tour.s1.p': 'Dónde vender corte láser, punzonado y plegado en Latinoamérica: prospectos, representantes y competencia, analizados empresa por empresa.',
      // 2 · panorama
      'tour.s2.k': 'Panorama regional',
      'tour.s2.t1': 'El mercado,',
      'tour.s2.t2': 'empresa por empresa',
      'tour.s2.p': 'Cada punto es un fabricante o taller verificado, con máquinas detectadas, rubro y puntaje de encaje con el portfolio TRUMPF. México y Brasil quedan fuera: ya los atienden filiales propias.',
      'tour.kpi.clients': 'Prospectos',
      'tour.kpi.tierA': 'Tier A',
      'tour.kpi.countries': 'Países',
      'tour.kpi.reps': 'Representantes',
      'tour.kpi.opps': 'Oportunidades',
      // 3–6 · países
      'tour.c.k': 'Mercado clave · n.º {rank}',
      'tour.c.t1': 'Foco en',
      'tour.c.p': 'Los cinco prospectos mejor puntuados, resaltados en el mapa. Rubro dominante: {sector}.',
      'tour.c.pNoSector': 'Los cinco prospectos mejor puntuados, resaltados en el mapa.',
      'tour.c.empty': 'Todavía sin prospectos verificados en este país: el relevamiento sigue en curso.',
      'tour.c.top': 'Mejores prospectos',
      'tour.c.market': 'Dato de mercado',
      'tour.c.gdp': 'PIB {v}',
      'tour.c.mfg': 'industria {v} del PIB',
      'tour.c.laser': 'importó {v} en máquinas láser ({china} desde China)',
      'tour.c.laserNoChina': 'importó {v} en máquinas láser',
      'tour.c.sectors': 'Rubros principales',
      // 7 · ficha
      'tour.f.k': 'Un prospecto tier A, de cerca',
      'tour.f.score': 'Puntaje de encaje',
      'tour.f.machines': 'Máquinas detectadas',
      'tour.f.empty': 'La ficha completa reúne planta, máquinas, contactos y el equipo TRUMPF recomendado.',
      // 8 · competencia
      'tour.m.k': 'Competencia',
      'tour.m.t1': 'Lo que ya',
      'tour.m.t2': 'está instalado',
      'tour.m.p': 'Máquinas detectadas en webs, fotos y catálogos de cada prospecto, por grupo de marca. Cada equipo de la competencia abre una conversación de reemplazo.',
      'tour.m.comp': 'Base instalada de la competencia',
      'tour.m.repl': 'Oportunidades de reemplazo',
      'tour.m.china': 'China {v}',
      // 9 · radar
      'tour.r.k': 'Radar de inversiones',
      'tour.r.t1': 'Dónde se',
      'tour.r.t2': 'invierte ahora',
      'tour.r.p': 'Plantas nuevas, ampliaciones y parques industriales que van a necesitar capacidad de corte y plegado.',
      'tour.r.n': 'Proyectos detectados',
      'tour.r.sum': 'Inversión anunciada',
      'tour.r.top': 'Los proyectos más grandes',
      // 10 · representantes
      'tour.p.k': 'Representantes',
      'tour.p.t1': 'Socios para',
      'tour.p.t2': 'vender y dar servicio',
      'tour.p.p': 'Empresas con servicio técnico propio, cartera afín y sin conflicto de marcas. Primero Centroamérica y Ecuador, donde TRUMPF no tiene representante; en Perú, plan conjunto con Andes Technology.',
      'tour.p.n': 'Evaluados',
      'tour.p.short': 'En la shortlist',
      'tour.p.ca': 'Centroamérica',
      // 11 · go-to-market
      'tour.g.k': 'Go-to-Market',
      'tour.g.t1': 'Plan en cuatro etapas.',
      'tour.g.t2': 'Hablemos.',
      'tour.g.m1': '0–3 meses', 'tour.g.d1': 'Validar: visitas a los tier A y elección de representantes.',
      'tour.g.m2': '3–6 meses', 'tour.g.d2': 'Activar: demos, contratos de representación y primeras ofertas.',
      'tour.g.m3': '6–12 meses', 'tour.g.d3': 'Cerrar: primeras instalaciones y referencias locales.',
      'tour.g.m4': '12–24 meses', 'tour.g.d4': 'Escalar: servicio, repuestos y nuevos países.',
      'tour.g.open': 'Abrir el plan Go-to-Market',
    },
    de: {
      'tour.aria': 'Präsentationsmodus',
      'tour.step': 'Schritt {n}',
      'tour.prev': 'Zurück',
      'tour.next': 'Weiter',
      'tour.pause': 'Pause',
      'tour.play': 'Abspielen',
      'tour.exit': 'Beenden',
      'tour.paused': 'Pausiert',
      'tour.hint': '← → blättern · Leertaste Pause · Esc beenden',
      'tour.by': 'Von {author}',
      'tour.s1.k': 'TRUMPF · Werkzeugmaschinen',
      'tour.s1.t1': 'Market Atlas',
      'tour.s1.t2': 'LATAM',
      'tour.s1.p': 'Wo sich Laserschneiden, Stanzen und Biegen in Lateinamerika verkaufen lassen: Interessenten, Vertretungen und Wettbewerb – Unternehmen für Unternehmen ausgewertet.',
      'tour.s2.k': 'Regionaler Überblick',
      'tour.s2.t1': 'Der Markt –',
      'tour.s2.t2': 'Unternehmen für Unternehmen',
      'tour.s2.p': 'Jeder Punkt ist ein geprüfter Hersteller oder Lohnfertiger – mit erkanntem Maschinenpark, Branche und Passung zum TRUMPF-Portfolio. Mexiko und Brasilien bleiben außen vor: Dort sind eigene Tochtergesellschaften aktiv.',
      'tour.kpi.clients': 'Interessenten',
      'tour.kpi.tierA': 'Tier A',
      'tour.kpi.countries': 'Länder',
      'tour.kpi.reps': 'Vertretungen',
      'tour.kpi.opps': 'Projekte',
      'tour.c.k': 'Schlüsselmarkt · Nr. {rank}',
      'tour.c.t1': 'Im Fokus:',
      'tour.c.p': 'Die fünf am besten bewerteten Interessenten sind auf der Karte hervorgehoben. Stärkste Branche: {sector}.',
      'tour.c.pNoSector': 'Die fünf am besten bewerteten Interessenten sind auf der Karte hervorgehoben.',
      'tour.c.empty': 'Noch keine geprüften Interessenten in diesem Land – die Erhebung läuft.',
      'tour.c.top': 'Top-Interessenten',
      'tour.c.market': 'Marktdaten',
      'tour.c.gdp': 'BIP {v}',
      'tour.c.mfg': 'Industrie {v} des BIP',
      'tour.c.laser': 'Laserimporte {v} ({china} aus China)',
      'tour.c.laserNoChina': 'Laserimporte {v}',
      'tour.c.sectors': 'Hauptbranchen',
      'tour.f.k': 'Ein Tier-A-Interessent im Detail',
      'tour.f.score': 'Passung',
      'tour.f.machines': 'Erkannte Maschinen',
      'tour.f.empty': 'Das Profil bündelt Werk, Maschinenpark, Kontakte und die empfohlene TRUMPF-Lösung.',
      'tour.m.k': 'Wettbewerb',
      'tour.m.t1': 'Was bereits',
      'tour.m.t2': 'installiert ist',
      'tour.m.p': 'Maschinen, die auf Websites, Fotos und in Katalogen der Interessenten erkannt wurden – nach Herstellergruppe. Jede Wettbewerbsmaschine ist ein Anlass für ein Ersatzgespräch.',
      'tour.m.comp': 'Installierte Basis des Wettbewerbs',
      'tour.m.repl': 'Ersatzpotenziale',
      'tour.m.china': 'China {v}',
      'tour.r.k': 'Investitionsradar',
      'tour.r.t1': 'Wo jetzt',
      'tour.r.t2': 'investiert wird',
      'tour.r.p': 'Neue Werke, Erweiterungen und Industrieparks, die Schneid- und Biegekapazität brauchen werden.',
      'tour.r.n': 'Erkannte Projekte',
      'tour.r.sum': 'Angekündigte Investitionen',
      'tour.r.top': 'Die größten Projekte',
      'tour.p.k': 'Vertretungen',
      'tour.p.t1': 'Partner für',
      'tour.p.t2': 'Vertrieb und Service',
      'tour.p.p': 'Unternehmen mit eigenem Service, passendem Portfolio und ohne Markenkonflikt. Zuerst Mittelamerika und Ecuador, wo TRUMPF keinen Partner hat; in Peru ein gemeinsamer Plan mit Andes Technology.',
      'tour.p.n': 'Bewertet',
      'tour.p.short': 'Auf der Shortlist',
      'tour.p.ca': 'Zentralamerika',
      'tour.g.k': 'Go-to-Market',
      'tour.g.t1': 'Ein Plan in vier Phasen.',
      'tour.g.t2': 'Lassen Sie uns sprechen.',
      'tour.g.m1': '0–3 Monate', 'tour.g.d1': 'Validieren: Besuche bei Tier-A-Interessenten, Auswahl der Vertretungen.',
      'tour.g.m2': '3–6 Monate', 'tour.g.d2': 'Aktivieren: Demos, Vertretungsverträge, erste Angebote.',
      'tour.g.m3': '6–12 Monate', 'tour.g.d3': 'Abschließen: erste Installationen und lokale Referenzen.',
      'tour.g.m4': '12–24 Monate', 'tour.g.d4': 'Skalieren: Service, Ersatzteile und weitere Länder.',
      'tour.g.open': 'Go-to-Market-Plan öffnen',
    },
  });

  /* ── Datos calculados ───────────────────────────────────────────────── */
  const byScore = (a, b) => D().score(b) - D().score(a) || String(a.name).localeCompare(String(b.name));

  /** Los 4 países del recorrido: ranking con datos, completado con PE/CO/CL y el resto del ranking. */
  function tourCountries() {
    const rk = (D().ranking?.() || []).filter((k) => k && k.cc);
    const out = rk.filter((k) => (k.counts?.clients || 0) > 0).slice(0, 4).map((k) => k.cc);
    for (const cc of DEFAULT_CC.concat(rk.map((k) => k.cc))) {
      if (out.length >= 4) break;
      if (!out.includes(cc) && D().country(cc)) out.push(cc);
    }
    for (const cc of DEFAULT_CC) { if (out.length >= 4) break; if (!out.includes(cc)) out.push(cc); }
    return out.slice(0, 4);
  }
  const topOf = (cc, n = 5) => D().clientsOf(cc).slice().sort(byScore).slice(0, n);

  function topTierA() {
    const cs = D().clients || [];
    const first = tourCountries()[0];
    const a = cs.filter((c) => c.tier === 'A').sort(byScore);
    return a.find((c) => c.country === first) || a[0] || cs.slice().sort(byScore)[0] || null;
  }

  /** Dato de mercado del país: piezas de texto desde country.intel (o null). */
  function marketFact(cc) {
    const intel = D().country(cc)?.intel;
    if (!intel) return null;
    const parts = [];
    const ec = intel.economy || {};
    if (isFinite(ec.gdp_usd_bn) && ec.gdp_usd_bn > 0) parts.push(t('tour.c.gdp', { v: TL.i18n.usd(ec.gdp_usd_bn * 1e9) }));
    if (isFinite(ec.manufacturing_pct_gdp) && ec.manufacturing_pct_gdp > 0) parts.push(t('tour.c.mfg', { v: TL.i18n.pct(ec.manufacturing_pct_gdp / 100, 1) }));
    const laser = (intel.imports?.items || []).find((x) => String(x.hs || '').startsWith('845611'));
    if (laser && isFinite(laser.usd)) {
      const china = (intel.imports?.origins || []).find((o) => /china/i.test(o.country || ''));
      parts.push(china ? t('tour.c.laser', { v: TL.i18n.usd(laser.usd), china: TL.i18n.pct(china.share_pct / 100) }) : t('tour.c.laserNoChina', { v: TL.i18n.usd(laser.usd) }));
    }
    return parts.length ? parts : null;
  }

  function competition() {
    const tot = D().installedBase?.().total || {};
    const all = Object.values(tot).reduce((a, b) => a + b, 0);
    const own = tot.trumpf || 0, unknown = tot.otro || 0;
    const comp = Math.max(0, all - own - unknown);
    const groups = Object.entries(tot).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).map(([key, n]) => ({ key, n, g: D().group(key) }));
    return { all, comp, compPct: all ? comp / all : 0, chinaPct: all ? (tot.china || 0) / all : 0, groups, repl: (D().replacementList?.() || []).length };
  }

  const countriesWithData = () => {
    const n = (D().countries || []).filter((k) => k.role === 'target' && (k.counts?.clients || 0) > 0).length;
    return n || D().targetCountries?.().length || 0;
  };
  const author = () => D().cfg?.author || window.TL_CONFIG?.author || 'Matías Banzer';

  /* ── Construcción de captions ───────────────────────────────────────── */
  const { html, raw } = u;
  const pad2 = (n) => String(n).padStart(2, '0');
  let wi = 0, ri = 0;                              // índices de stagger (palabras / bloques)
  /** Palabras enmascaradas (suben al entrar). w: 'l' (300) | 'b' (700) */
  const words = (text, w) => raw(String(text || '').split(/\s+/).filter(Boolean)
    .map((x) => `<span class="tt-m" style="--i:${wi++}"><span>${u.esc(x)}</span></span>`).join(' '));
  const rev = () => `--i:${ri++}`;
  const tierTag = (tier) => html`<span class="tt-tier" data-tier="${tier || 'C'}">${tier || 'C'}</span>`;

  /** fig = { label, to, fmt:'int'|'pct'|'usd'|'dec', suffix } */
  const figs = (list) => raw(`<div class="tt-figs tt-r" style="${rev()}">${list.filter(Boolean).map((f) => String(html`<div class="tt-fig"><b class="num" data-to="${f.to}" data-fmt="${f.fmt || 'int'}">0</b>${f.suffix ? html`<small class="mono">${f.suffix}</small>` : ''}<span class="tt-lbl">${f.label}</span></div>`)).join('')}</div>`);

  function clientList(list) {
    return html`<ol class="tt-list tt-r" style="${rev()}">${list.map((c, i) => html`<li><span class="tt-idx mono">${pad2(i + 1)}</span>${tierTag(c.tier)}<span class="tt-nm">${c.name}</span><span class="tt-sub">${c.city || ''}</span></li>`)}</ol>`;
  }

  /** Cada paso: { id, dur(ms), mode, cam(ctx), cap() → {kicker, title:[[w,txt]], text, body:SafeHtml}, cues:[{at,fn}], exit() } */
  function buildSteps() {
    const ccs = tourCountries();
    const steps = [];

    steps.push({
      id: 'cover', dur: 9000, mode: 'clients',
      cam(ctx) {
        TL.map.flyTo?.({ center: [-58, -12], zoom: 1.6, pitch: 0, bearing: 0, duration: 2400, curve: 1.2 });
        afterMove(ctx, () => TL.map.spin?.(true));
      },
      cap: () => ({
        kicker: t('tour.s1.k'), cls: 'is-cover',
        title: [['l', t('tour.s1.t1')], ['b', t('tour.s1.t2')]],
        text: t('tour.s1.p'),
        body: html`<p class="tt-author tt-r" style="${rev()}"><i></i><span>${t('tour.by', { author: author() })}</span><span class="mono">${TL.i18n.monthYear(new Date())}</span></p>`,
      }),
      exit: () => TL.map.spin?.(false),
    });

    steps.push({
      id: 'overview', dur: 9000, mode: 'clients',
      cam: () => TL.map.home?.({ duration: 2400 }),
      cap: () => {
        const cs = D().clients || [];
        return {
          kicker: t('tour.s2.k'),
          title: [['l', t('tour.s2.t1')], ['b', t('tour.s2.t2')]],
          text: t('tour.s2.p'),
          body: figs([
            { label: t('tour.kpi.clients'), to: cs.length },
            { label: t('tour.kpi.tierA'), to: cs.filter((c) => c.tier === 'A').length },
            { label: t('tour.kpi.countries'), to: countriesWithData() },
            { label: t('tour.kpi.reps'), to: (D().reps || []).length },
            { label: t('tour.kpi.opps'), to: (D().opps || []).length },
          ]),
          cls: 'is-kpis',
        };
      },
    });

    ccs.forEach((cc, i) => {
      steps.push({
        id: 'country-' + cc, dur: 8500, mode: 'clients', cc,
        cam: () => {
          // vuelo continuo de país a país sobre el globo (alejar, desplazar, acercar)
          const k = D().country(cc);
          if (k && Array.isArray(k.center)) TL.map.flyTo?.({ center: k.center, zoom: Math.min(k.zoom || 4.5, 5.2), pitch: 0, bearing: 0, duration: 3400, curve: 1.42 });
          else TL.map.flyToCountry?.(cc);
          const ids = topOf(cc).map((c) => c.id);
          if (ids.length) TL.map.highlight?.(ids); else TL.map.clearHighlight?.();
        },
        cap: () => {
          const all = D().clientsOf(cc), top = topOf(cc);
          const sec = D().topSectors?.(all, 1)?.[0];
          const mk = marketFact(cc);
          const k = D().country(cc);
          const text = !all.length ? t('tour.c.empty') : sec ? t('tour.c.p', { sector: sec.name }) : t('tour.c.pNoSector');
          const secs = (D().topSectors?.(all, 3) || []).map((x) => x.name);
          const mline = mk ? mk.join(' · ') : secs.length > 1 ? secs.join(' · ') : '';
          return {
            kicker: t('tour.c.k', { rank: i + 1 }),
            title: [['l', t('tour.c.t1')], ['b', D().countryName(cc)]],
            flag: cc,
            text,
            body: html`${figs([
              { label: t('tour.kpi.clients'), to: all.length },
              { label: t('tour.kpi.tierA'), to: k?.counts?.A ?? all.filter((c) => c.tier === 'A').length },
            ])}${top.length ? clientList(top) : ''}${mline ? html`<p class="tt-market tt-r" style="${rev()}"><span class="tt-lbl">${t(mk ? 'tour.c.market' : 'tour.c.sectors')}</span><span>${mline}</span></p>` : ''}`,
          };
        },
        exit: () => TL.map.clearHighlight?.(),
      });
    });

    // (sin paso de ficha individual: la presentación es ejecutiva)
    const star = topTierA();
    false && steps.push({
      id: 'ficha', dur: 11000, mode: 'clients', ficha: true,
      cam: () => {
        if (!star) { TL.map.home?.(); return; }
        openFicha(star.id);
      },
      cap: () => {
        if (!star) return { kicker: t('tour.f.k'), title: [['l', t('tour.f.k')]], text: t('tour.f.empty') };
        const opp = String(TL.i18n.pick(star, 'opportunity') || TL.i18n.pick(star, 'summary') || t('tour.f.empty'));
        return {
          kicker: t('tour.f.k'),
          title: [['b', star.name]],
          flag: star.country,
          sub: [star.city, D().countryName(star.country)].filter(Boolean).join(', '),
          text: opp.length > 220 ? opp.slice(0, 217).replace(/\s+\S*$/, '') + ' …' : opp,
          body: figs([
            { label: t('tour.f.score'), to: Math.round(D().score(star)), suffix: '/100' },
            { label: t('tour.f.machines'), to: (star.machines || []).length },
          ]),
        };
      },
      exit: () => { TL.ficha?.close?.(); TL.map.clearSelection?.(); },
    });

    steps.push({
      id: 'competition', dur: 9000, mode: 'competition',
      cam: () => TL.map.home?.({ pitch: 18, duration: 2400 }),
      cap: () => {
        const c = competition();
        const bar = c.all ? html`<div class="tt-bar tt-r" style="${rev()}" role="img" aria-label="${c.groups.map((g) => g.g.name + ' ' + g.n).join(', ')}">${c.groups.map((g) => html`<i style="flex:${g.n};background:${g.g.color}"></i>`)}</div>
          <ul class="tt-legend tt-r" style="${rev()}">${c.groups.slice(0, 5).map((g) => html`<li><i style="background:${g.g.color}"></i>${g.g.name}<span class="mono">${TL.i18n.pct(g.n / c.all)}</span></li>`)}</ul>` : '';
        return {
          kicker: t('tour.m.k'),
          title: [['l', t('tour.m.t1')], ['b', t('tour.m.t2')]],
          text: t('tour.m.p'),
          body: html`${figs([
            { label: t('tour.m.comp'), to: c.compPct, fmt: 'pct' },
            { label: t('tour.m.repl'), to: c.repl },
          ])}${bar}`,
        };
      },
    });

    steps.push({
      id: 'radar', dur: 9000, mode: 'radar',
      cam: () => TL.map.home?.({ zoom: 2.6, pitch: 0, duration: 2400 }),
      cap: () => {
        const ops = (D().opps || []).filter((o) => isFinite(o.amount_usd));
        const top = ops.slice().sort((a, b) => b.amount_usd - a.amount_usd).slice(0, 3);
        const sum = ops.reduce((a, o) => a + (+o.amount_usd || 0), 0);
        return {
          kicker: t('tour.r.k'),
          title: [['l', t('tour.r.t1')], ['b', t('tour.r.t2')]],
          text: t('tour.r.p'),
          body: html`${figs([
            { label: t('tour.r.n'), to: (D().opps || []).length },
            sum > 0 ? { label: t('tour.r.sum'), to: sum, fmt: 'usd' } : null,
          ])}${top.length ? html`<p class="tt-cap-h tt-lbl tt-r" style="${rev()}">${t('tour.r.top')}</p><ol class="tt-list tt-opps tt-r" style="${rev()}">${top.map((o) => html`<li><span class="tt-flag">${TL.ui.flag(o.country, 18)}</span><span class="tt-nm">${TL.i18n.pick(o, 'title')}</span><span class="tt-sub">${[o.city, D().countryName(o.country)].filter(Boolean).join(', ')}</span><span class="tt-amt mono">${TL.i18n.usd(o.amount_usd)}</span></li>`)}</ol>` : ''}`,
        };
      },
    });

    steps.push({
      id: 'reps', dur: 11000, mode: 'reps',
      cam: () => TL.map.flyTo?.({ center: [-84.5, 12.5], zoom: 4.4, pitch: 0, bearing: 0, duration: 3400, curve: 1.42 }),
      cues: [{ at: 0.48, fn: (ctx) => {
        TL.map.fitBbox?.(CA_BBOX, { maxZoom: 6.2 });
        ctx.cap?.querySelectorAll('.tt-stops [data-stop]').forEach((el) => el.classList.toggle('on', el.dataset.stop === '1'));
      } }],
      cap: () => {
        const reps = D().reps || [];
        const short = reps.filter((r) => r.shortlist).sort(byScore);
        const shown = (short.length ? short : reps.slice().sort(byScore)).slice(0, 4);
        return {
          kicker: t('tour.p.k'),
          title: [['l', t('tour.p.t1')], ['b', t('tour.p.t2')]],
          text: t('tour.p.p'),
          body: html`<div class="tt-stops tt-r" style="${rev()}"><span data-stop="0" class="on">${TL.ui.flag('PE', 16)}${D().countryName('PE')}</span><i aria-hidden="true"></i><span data-stop="1">${t('tour.p.ca')}</span></div>${figs([
            { label: t('tour.p.n'), to: reps.length },
            { label: t('tour.p.short'), to: short.length },
          ])}${shown.length ? html`<ol class="tt-list tt-r" style="${rev()}">${shown.map((r, i) => html`<li><span class="tt-idx mono">${pad2(i + 1)}</span>${tierTag(r.tier)}<span class="tt-nm">${r.name}</span><span class="tt-sub">${[r.city, D().countryName(r.country)].filter(Boolean).join(', ')}</span></li>`)}</ol>` : ''}`,
        };
      },
    });

    steps.push({
      id: 'gtm', dur: 14000, mode: 'clients', last: true,
      cam: (ctx) => {
        TL.map.flyTo?.({ center: [-66, -16], zoom: 1.9, pitch: 0, bearing: 0, duration: 2600, curve: 1.2 });
        afterMove(ctx, () => TL.map.spin?.(true));
      },
      cap: () => ({
        kicker: t('tour.g.k'), cls: 'is-gtm',
        title: [['l', t('tour.g.t1')], ['b', t('tour.g.t2')]],
        body: html`<ol class="tt-plan tt-r" style="${rev()}">${[1, 2, 3, 4].map((n) => html`<li style="--n:${n}"><span class="mono">${t('tour.g.m' + n)}</span><p>${t('tour.g.d' + n)}</p></li>`)}</ol>
          <div class="tt-cta tt-r" style="${rev()}">${typeof window.TL_GTM?.open === 'function' ? html`<button type="button" class="btn btn-lime" data-act="gtm">${TL.ui.icon('gtm')}<span>${t('tour.g.open')}</span></button>` : ''}<span class="tt-author"><i></i><span>${author()}</span></span></div>`,
      }),
      exit: () => TL.map.spin?.(false),
    });
    return steps;
  }

  /* ── Motor ──────────────────────────────────────────────────────────── */
  let on = false, steps = [], idx = -1, paused = false, ended = false, elapsed = 0;
  let raf = 0, lastTs = 0, token = 0, ctx = { token: 0, cap: null }, fired = new Set();
  let root = null, capsEl = null, progEl = null, ctrlEl = null, prev = null, fsEntered = false;
  let escRemove = null, idleTimer = 0, offs = [];

  const PAUSE_SVG = '<svg class="ico" viewBox="0 0 20 20" aria-hidden="true"><path d="M7 4.5v11M13 4.5v11"/></svg>';
  const PLAY_SVG = '<svg class="ico ico-fill" viewBox="0 0 20 20" aria-hidden="true"><path d="M6 3.8v12.4L16.2 10z"/></svg>';

  /** Ejecuta fn cuando termina el movimiento de cámara actual (si el paso sigue activo). */
  function afterMove(c, fn) {
    const map = TL.map.instance;
    if (!map || TL.reduceMotion) return;
    map.once('moveend', () => { if (on && c.token === token) fn(); });
  }
  function openFicha(id) {
    const tk = token;
    // en tablet/teléfono la ficha ocupa la pantalla: el caption ya resume la empresa
    if (window.innerWidth <= 1100) { TL.map.select?.(id); TL.map.flyToEntity?.(id, { duration: 2600 }); return; }
    try {
      if (TL.nav?.open) TL.nav.open(id, { fly: false });
      else { TL.map.select?.(id); TL.ficha?.open?.(id); }
    } catch (e) { console.warn('[TL.tour] ficha', e); }
    // la ficha cambia el padding (ocupa la derecha): fijarlo antes de volar
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (!on || tk !== token) return;
      TL.map.setPadding?.(false);
      TL.map.flyToEntity?.(id, { duration: 2800 });
    }));
  }
  function applyMode(mode) {
    if (TL.state.view !== mode && TL.views?.get?.(mode)) {
      try { if (TL.nav?.view) TL.nav.view(mode); else TL.set({ view: mode }); } catch (e) { console.warn('[TL.tour] view', e); }
    }
    if (TL.map.mode !== mode) TL.map.setMode?.(mode);
  }
  const camera = () => {
    const m = TL.map.instance; if (!m) return null;
    return { center: m.getCenter().toArray(), zoom: m.getZoom(), pitch: m.getPitch(), bearing: m.getBearing() };
  };
  const blocking = () => !!(TL.ui.overlay?.isOpen?.() || document.querySelector('#tl-modal-root > *')
    || (document.getElementById('tl-lightbox') && !document.getElementById('tl-lightbox').hidden));

  /* ── Montaje del DOM ────────────────────────────────────────────────── */
  function mount() {
    if (root) return;
    root = u.el(html`<div id="tl-tour" class="tt" role="region" hidden>
      <div class="tt-shade" aria-hidden="true"></div>
      <div class="tt-prog" role="group"></div>
      <div class="tt-brand" aria-hidden="true">
        <img class="logo-on-light" src="assets/trumpf/trumpf-logo.svg" alt="" width="28" height="28" decoding="async">
        <img class="logo-on-dark" src="assets/trumpf/trumpf-logo-white.svg" alt="" width="28" height="28" decoding="async">
        <span>Market Atlas <b>LATAM</b></span>
      </div>
      <div class="tt-caps" aria-live="polite"></div>
      <div class="tt-ctrl" role="toolbar">
        <span class="tt-state mono"></span>
        <button type="button" class="tt-btn" data-act="prev">${TL.ui.icon('back')}</button>
        <button type="button" class="tt-btn tt-play" data-act="play"></button>
        <button type="button" class="tt-btn" data-act="next">${TL.ui.icon('next')}</button>
        <i class="tt-sep" aria-hidden="true"></i>
        <button type="button" class="tt-btn tt-exit" data-act="exit">${TL.ui.icon('close')}<kbd class="mono">Esc</kbd></button>
        <p class="tt-hint mono"></p>
      </div>
    </div>`);
    document.body.appendChild(root);
    capsEl = root.querySelector('.tt-caps');
    progEl = root.querySelector('.tt-prog');
    ctrlEl = root.querySelector('.tt-ctrl');
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      const a = b.dataset.act;
      if (a === 'prev') prev_();
      else if (a === 'next') next();
      else if (a === 'play') togglePause();
      else if (a === 'exit') stop();
      else if (a === 'seek') go(+b.dataset.i, { dir: +b.dataset.i < idx ? -1 : 1 });
      else if (a === 'gtm') { setPaused(true); try { window.TL_GTM?.open?.(); } catch (err) { console.warn('[TL.tour] gtm', err); } }
    });
  }
  function buildProgress() {
    progEl.innerHTML = steps.map((s, i) => `<button type="button" class="tt-seg" data-act="seek" data-i="${i}"><i></i></button>`).join('');
    labelProgress();
  }
  function labelProgress() {
    progEl.setAttribute('aria-label', t('tour.aria'));
    progEl.querySelectorAll('.tt-seg').forEach((b, i) => b.setAttribute('aria-label', t('tour.step', { n: i + 1 })));
  }
  function setFill(i, p) {
    const seg = progEl?.children[i]?.firstElementChild;
    if (seg) seg.style.transform = `scaleX(${p.toFixed(4)})`;
  }
  function updateProgress() {
    if (!progEl) return;
    Array.from(progEl.children).forEach((b, i) => {
      b.classList.toggle('is-done', i < idx); b.classList.toggle('is-cur', i === idx);
      b.setAttribute('aria-current', i === idx ? 'step' : 'false');
      b.firstElementChild.style.transform = `scaleX(${i < idx ? 1 : 0})`;
    });
  }
  function updateCtrl() {
    if (!ctrlEl) return;
    root.setAttribute('aria-label', t('tour.aria'));
    ctrlEl.setAttribute('aria-label', t('tour.aria'));
    const set = (act, label) => { const b = ctrlEl.querySelector(`[data-act="${act}"]`); b.setAttribute('aria-label', label); b.title = label; };
    set('prev', t('tour.prev')); set('next', t('tour.next')); set('exit', t('tour.exit'));
    const pb = ctrlEl.querySelector('[data-act="play"]');
    pb.innerHTML = paused ? PLAY_SVG : PAUSE_SVG;
    set('play', paused ? t('tour.play') : t('tour.pause'));
    pb.setAttribute('aria-pressed', paused ? 'true' : 'false');
    ctrlEl.querySelector('[data-act="prev"]').disabled = idx <= 0;
    ctrlEl.querySelector('[data-act="next"]').disabled = idx >= steps.length - 1;
    ctrlEl.querySelector('.tt-state').textContent = paused && !ended ? t('tour.paused') : `${pad2(idx + 1)} / ${pad2(steps.length)}`;
    ctrlEl.querySelector('.tt-hint').textContent = t('tour.hint');
    root.classList.toggle('is-paused', paused);
  }

  /* ── Captions ───────────────────────────────────────────────────────── */
  function runCounts(el, instant) {
    el.querySelectorAll('[data-to]').forEach((b, k) => {
      const to = +b.dataset.to, f = b.dataset.fmt;
      const format = f === 'pct' ? (v) => TL.i18n.pct(v) : f === 'usd' ? (v) => TL.i18n.usd(v) : null;
      if (instant || !TL.ui.countUp) { b.textContent = format ? format(to) : TL.i18n.int(to); return; }
      TL.ui.countUp(b, to, { format, duration: 1300, delay: 380 + k * 110 });
    });
  }
  function renderCaption(o = {}) {
    const st = steps[idx]; if (!st || !capsEl) return;
    wi = 1; ri = 2;
    let c;
    try { c = st.cap() || {}; } catch (e) { console.warn('[TL.tour] caption', e); c = {}; }
    const title = (c.title || []).map(([w, txt]) => html`<span class="tt-sg tt-sg-${w}">${words(txt, w)}</span> `);
    const el = u.el(html`<div class="tt-cap ${c.cls || ''}" data-step="${st.id}">
      <i class="tt-laser" aria-hidden="true"></i>
      <p class="tt-kick mono"><span class="tt-m" style="--i:0"><span><b>${pad2(idx + 1)}</b><em>/ ${pad2(steps.length)}</em><i class="tt-tick" aria-hidden="true"></i>${c.flag ? html`<span class="tt-flag">${TL.ui.flag(c.flag, 16)}</span>` : ''}${c.kicker || ''}</span></span></p>
      <h2 class="tt-title">${title}</h2>
      ${c.sub ? html`<p class="tt-subl tt-r" style="--i:0">${c.sub}</p>` : ''}
      ${c.text ? html`<p class="tt-text tt-r" style="--i:1">${c.text}</p>` : ''}
      ${c.body || ''}
    </div>`);
    const olds = capsEl.querySelectorAll('.tt-cap:not(.is-out)');
    if (o.instant) {
      olds.forEach((x) => x.remove());
      el.classList.add('is-in', 'no-anim');
      capsEl.appendChild(el);
      runCounts(el, true);
    } else {
      // el texto anterior termina de irse ANTES de que entre el nuevo (no se superponen)
      olds.forEach((x) => { x.classList.add('is-out'); x.setAttribute('aria-hidden', 'true'); setTimeout(() => x.remove(), 440); });
      el.classList.add('is-pre');
      if (olds.length) el.style.visibility = 'hidden';
      capsEl.appendChild(el);
      const tk = token;
      setTimeout(() => {
        if (tk !== token || !el.isConnected) return;
        el.style.visibility = '';
        void el.offsetWidth;
        el.classList.remove('is-pre'); el.classList.add('is-in');
        runCounts(el);
      }, olds.length ? 900 : 40);
    }
    ctx.cap = el;
  }

  /* ── Navegación ─────────────────────────────────────────────────────── */
  function go(i, o = {}) {
    if (!on || !steps.length) return;
    i = u.clamp(i | 0, 0, steps.length - 1);
    if (i === idx && !o.initial) return;
    const old = steps[idx];
    if (old) { try { old.exit?.(); } catch (e) { console.warn('[TL.tour] exit', e); } }
    token++;
    idx = i; elapsed = 0; ended = false; fired = new Set();
    const st = steps[i];
    ctx = { token, step: st, cap: null };
    TL.map.setPadding?.(false);
    applyMode(st.mode);
    renderCaption({ dir: o.dir || 1 });
    root.classList.toggle('is-ficha', !!st.ficha && window.innerWidth > 1100);
    try { st.cam?.(ctx); } catch (e) { console.warn('[TL.tour] cam', e); }
    updateProgress(); updateCtrl();
    TL.emit('tour:step', { index: i, id: st.id });
  }
  function next() { if (on && idx < steps.length - 1) go(idx + 1, { dir: 1 }); }
  function prev_() { if (on && idx > 0) go(idx - 1, { dir: -1 }); }
  function setPaused(v) {
    paused = !!v;
    if (!paused && ended) { ended = false; go(0); return; }
    updateCtrl();
    if (paused) wake();
  }
  const togglePause = () => setPaused(!paused);

  function tick(ts) {
    raf = requestAnimationFrame(tick);
    const dt = Math.min(100, ts - (lastTs || ts)); lastTs = ts;
    if (!on || paused || ended || document.hidden || blocking()) return;
    const st = steps[idx]; if (!st) return;
    elapsed += dt;
    const p = Math.min(1, elapsed / st.dur);
    (st.cues || []).forEach((c, k) => { if (p >= c.at && !fired.has(k)) { fired.add(k); try { c.fn(ctx); } catch (e) { console.warn('[TL.tour] cue', e); } } });
    setFill(idx, p);
    if (p >= 1) {
      if (idx < steps.length - 1) go(idx + 1);
      else { ended = true; paused = true; updateCtrl(); wake(); }
    }
  }

  /* ── Eventos ────────────────────────────────────────────────────────── */
  function wake() {
    if (!root) return;
    root.classList.add('is-awake');
    document.body.classList.remove('tt-idle');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (!on || paused || ctrlEl.matches(':hover, :focus-within')) return;
      root.classList.remove('is-awake');
      document.body.classList.add('tt-idle');
    }, 2600);
  }
  function onKey(e) {
    if (!on || e.defaultPrevented && e.key !== 'Escape') return;
    const tg = e.target;
    if (tg && (tg.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName))) return;
    if (blocking()) return;                          // overlay / modal / lightbox manejan sus teclas
    if ((e.key === ' ' || e.key === 'Enter') && tg?.closest?.('button, a')) return;
    switch (e.key) {
      case 'ArrowRight': case 'PageDown': next(); break;
      case 'ArrowLeft': case 'PageUp': prev_(); break;
      case ' ': case 'Spacebar': togglePause(); break;
      case 'Home': go(0, { dir: -1 }); break;
      case 'End': go(steps.length - 1); break;
      case 'Escape': stop(); break;
      default: return;
    }
    e.preventDefault(); e.stopPropagation();
    wake();
  }
  function onFs() {
    if (document.fullscreenElement) { fsEntered = true; return; }
    if (fsEntered && on) { fsEntered = false; stop({ fromFs: true }); }
  }
  const onUserMap = () => { if (on && !paused) setPaused(true); };
  function bind() {
    const add = (tgt, ev, fn, opt) => { if (!tgt) return; tgt.addEventListener(ev, fn, opt); offs.push(() => tgt.removeEventListener(ev, fn, opt)); };
    add(window, 'keydown', onKey, true);
    add(window, 'mousemove', wake, { passive: true });
    add(window, 'pointerdown', wake, { passive: true });
    add(document, 'fullscreenchange', onFs);
    ['pointerdown', 'wheel', 'touchstart'].forEach((ev) => {
      add(document.getElementById('tl-map'), ev, onUserMap, { passive: true });
      add(document.getElementById('tl-ficha'), ev, onUserMap, { passive: true });
    });
    offs.push(TL.on('lang', () => { if (!on) return; renderCaption({ instant: true }); labelProgress(); updateCtrl(); }));
    escRemove = TL.ui.escPush ? TL.ui.escPush(() => stop()) : null;
  }
  function unbind() {
    offs.forEach((f) => { try { f(); } catch (e) { /* noop */ } });
    offs = [];
    try { escRemove?.(); } catch (e) { /* noop */ }
    escRemove = null;
  }

  /* ── Entrar / salir ─────────────────────────────────────────────────── */
  function start(step = 0) {
    if (on) { go(step); return; }
    if (!TL.data) return;
    on = true; paused = false; ended = false; idx = -1;
    if (TL.map.isIntroPlaying?.()) TL.map.skipIntro?.();
    prev = { view: TL.state.view, mode: TL.map.mode, cam: camera(), country: TL.state.country, panelOpen: TL.state.panelOpen };
    try { TL.ficha?.isOpen?.() && TL.ficha.close(); } catch (e) { /* noop */ }
    try { TL.search?.close?.(); } catch (e) { /* noop */ }
    try { TL.ui.overlay?.isOpen?.() && TL.ui.overlay.close(); } catch (e) { /* noop */ }
    TL.map.clearSelection?.();
    try {
      const de = document.documentElement;
      if (!document.fullscreenElement && de.requestFullscreen) { const pr = de.requestFullscreen({ navigationUI: 'hide' }); if (pr && pr.catch) pr.catch(() => {}); }
    } catch (e) { /* pantalla completa opcional */ }
    TL.set({ present: true });
    document.body.classList.add('is-presenting');
    mount();
    steps = buildSteps();
    buildProgress();
    root.hidden = false;
    requestAnimationFrame(() => root.classList.add('is-on'));
    bind();
    wake();
    lastTs = 0; cancelAnimationFrame(raf); raf = requestAnimationFrame(tick);
    const begin = () => { if (on) go(step, { initial: true }); };
    if (TL.map.instance) begin(); else Promise.resolve(TL.map.ready).then(begin);
    TL.emit('tour:start');
  }

  function stop(o = {}) {
    if (!on) return;
    try { steps[idx]?.exit?.(); } catch (e) { /* noop */ }
    on = false; token++;
    cancelAnimationFrame(raf); clearTimeout(idleTimer);
    unbind();
    TL.map.spin?.(false);
    TL.map.clearHighlight?.();
    try { TL.ficha?.isOpen?.() && TL.ficha.close(); } catch (e) { /* noop */ }
    TL.map.clearSelection?.();
    if (root) {
      root.classList.remove('is-on', 'is-awake', 'is-ficha', 'is-paused');
      const r = root;
      setTimeout(() => { if (!on) { r.hidden = true; capsEl.innerHTML = ''; } }, TL.reduceMotion ? 0 : 420);
    }
    document.body.classList.remove('is-presenting', 'tt-idle');
    TL.set({ present: false });
    // vista y capa previas
    const pv = prev?.view;
    if (pv && TL.state.view !== pv) {
      try { if (TL.nav?.view) TL.nav.view(pv); else TL.set({ view: pv }); } catch (e) { /* noop */ }
    }
    const pm = prev?.mode || TL.views?.get?.(pv)?.mapMode || 'clients';
    if (TL.map.mode !== pm) TL.map.setMode?.(pm);
    if (prev && TL.state.country !== prev.country) TL.set({ country: prev.country });
    if (prev && !prev.panelOpen && TL.panel?.isOpen?.()) TL.panel.close();
    if (!o.fromFs && document.fullscreenElement) {
      fsEntered = false;
      try { const pr = document.exitFullscreen?.(); if (pr && pr.catch) pr.catch(() => {}); } catch (e) { /* noop */ }
    }
    fsEntered = false;
    TL.map.setPadding?.(false);
    if (prev?.cam) TL.map.flyTo?.(Object.assign({}, prev.cam, { duration: 1600, curve: 1.3 }));
    idx = -1;
    TL.emit('tour:stop');
  }

  /* Padding del mapa en modo presentación: sin riel ni panel; el caption ocupa
     la franja inferior izquierda, la ficha (paso 7) la derecha. */
  const basePadding = TL.map.computePadding;
  if (typeof basePadding === 'function') {
    TL.map.computePadding = function () {
      if (!TL.state.present) return basePadding.apply(this, arguments);
      const w = window.innerWidth, h = window.innerHeight;
      const gap = parseFloat(u.css('--gap')) || 12;
      const ficha = document.body.classList.contains('ficha-open');
      if (w <= 1100) return { top: 48, right: 0, left: 0, bottom: Math.round(h * (ficha ? 0.5 : 0.42)) };
      if (ficha) return { top: 48, right: (parseFloat(u.css('--ficha-w')) || 780) + gap * 2, bottom: Math.round(h * 0.4), left: 24 };
      return { top: 48, right: 40, bottom: 40, left: Math.round(Math.min(w * 0.36, 640)) };
    };
  }

  TL.tour = {
    start,
    stop: () => stop(),
    next,
    prev: prev_,
    toggle: () => (on ? stop() : start()),
    pause: (v = true) => on && setPaused(v),
    isOn: () => on,
    get index() { return idx; },
    get length() { return steps.length; },
  };
})();
