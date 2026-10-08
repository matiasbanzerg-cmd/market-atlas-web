/* ==========================================================================
   tl-ficha.js — Ficha de cliente y de representante (hoja grande desde la derecha).
   API: TL.ficha = { open(id, opts), close(), isOpen(), current() }
   Eventos: emite 'ficha:open'(id) y 'ficha:close'. No mueve la cámara (eso es TL.nav.open).
   opts: { section:'contacts' } para abrir directo en una sección.
   ========================================================================== */
(function () {
  'use strict';
  const { u } = TL;
  const html = u.html, raw = u.raw, esc = u.esc;
  const t = (k, v) => TL.i18n.t(k, v);
  const pick = (o, k) => TL.i18n.pick(o, k);
  const RESEARCHED = '2026-10-07';

  /* ── i18n ───────────────────────────────────────────────────────────── */
  TL.i18n.extend({
    es: {
      'ficha.aria': 'Ficha de empresa',
      'ficha.kind.client': 'Cliente potencial',
      'ficha.kind.rep': 'Representante',
      'ficha.visit': 'Preparar visita (IA)',
      'ficha.addTour': 'Agregar a gira',
      'ficha.print': 'Imprimir / PDF',
      'ficha.close': 'Cerrar ficha',
      'ficha.aiOffline': 'IA sin conexión: la preparación de visitas no está disponible.',
      'ficha.plannerOff': 'El planificador de giras no está disponible.',
      'ficha.score': 'Puntaje',
      'ficha.fit': 'Idoneidad',
      'ficha.nav': 'Secciones de la ficha',
      'ficha.openLink': 'Abrir enlace',
      'ficha.notFound': 'No se encontró la empresa.',
      'ficha.shortlist': 'Shortlist',
      'ficha.demo': 'Datos de demostración',
      'sec.summary': 'Resumen', 'sec.opportunity': 'Oportunidad', 'sec.location': 'Ubicación', 'sec.products': 'Productos',
      'sec.plant': 'Planta y máquinas', 'sec.signals': 'Señales', 'sec.contacts': 'Contactos', 'sec.score': 'Puntaje',
      'sec.sources': 'Fuentes', 'sec.crm': 'Seguimiento', 'sec.brands': 'Marcas', 'sec.service': 'Servicio técnico',
      'sec.market': 'Mercado', 'sec.assessment': 'Evaluación', 'sec.fit': 'Idoneidad',
      'sec.opportunity.long': 'Oportunidad TRUMPF',
      'fact.employees': 'Empleados', 'fact.founded': 'Fundada', 'fact.plant': 'Planta', 'fact.plants': 'Plantas',
      'fact.certs': 'Certificaciones', 'fact.exports': 'Exporta a', 'fact.group': 'Grupo', 'fact.branches': 'Sucursales',
      'fact.services': 'Servicios', 'fact.categories': 'Categorías', 'fact.segment': 'Segmento', 'fact.size': 'Tamaño',
      'fact.source': 'según {s}',
      'opp.series': 'Series recomendadas',
      'opp.why': 'Por qué para {name}',
      'opp.more': 'Ver en trumpf.com',
      'opp.specs': 'Datos clave',
      'opp.none': 'Todavía no hay series recomendadas para esta empresa.',
      'loc.atlas': 'Atlas', 'loc.google': 'Google Maps', 'loc.map': 'Mapa', 'loc.sat': 'Satélite',
      'loc.source': 'Fuente del mapa', 'loc.mode': 'Tipo de mapa',
      'loc.open': 'Abrir en Google Maps', 'loc.street': 'Street View', 'loc.dir': 'Cómo llegar',
      'loc.address': 'Dirección', 'loc.coords': 'Coordenadas', 'loc.precision': 'Precisión',
      'loc.prec.exacta': 'Ubicación exacta', 'loc.prec.calle': 'Aproximada a la calle', 'loc.prec.ciudad': 'Solo ciudad',
      'loc.prec.exacta.d': 'Coordenadas de la planta verificadas sobre el mapa o en la web oficial.',
      'loc.prec.calle.d': 'El punto cae sobre la calle o cuadra de la dirección publicada; el acceso exacto puede variar.',
      'loc.prec.ciudad.d': 'Sin dirección confirmada: el punto marca el centro de la ciudad.',
      'loc.noGeo': 'Sin coordenadas para esta empresa.',
      'loc.mapOff': 'El mapa interactivo no está disponible. Usá la pestaña Google Maps o los enlaces.',
      'prod.none': 'No se identificaron productos en fuentes públicas.',
      'prod.zoom': 'Ampliar imagen',
      'prod.processes': 'Procesos TRUMPF aplicables',
      'plant.gallery': 'Galería', 'plant.machines': 'Máquinas detectadas',
      'plant.noMachines': 'No se detectaron máquinas en fuentes públicas.',
      'col.brand': 'Marca', 'col.type': 'Tipo', 'col.model': 'Modelo', 'col.evidence': 'Evidencia', 'col.conf': 'Confianza',
      'conf.alta': 'Alta', 'conf.media': 'Media', 'conf.baja': 'Baja',
      'plant.replace': 'Oportunidad de reemplazo / upgrade',
      'plant.isClient': 'Ya es cliente TRUMPF',
      'plant.isClient.d': 'Tiene equipos TRUMPF en planta: el foco es ampliar capacidad, automatizar y fortalecer el servicio.',
      'arg.china': 'Equipos chinos ({brands}). Argumento: precisión y repetibilidad en serie, servicio técnico y repuestos locales con tiempos de respuesta comprometidos, y un valor de reventa que protege la inversión.',
      'arg.corte_termico': 'Corte por plasma u oxicorte ({brands}). Argumento: el láser de fibra entrega cantos limpios, sin escoria ni retrabajo, y baja el costo por pieza en chapa fina y media.',
      'arg.japon': 'Equipos japoneses ({brands}). Argumento: automatización (carga y descarga, almacén, celdas de plegado), costo total de propiedad y software integrado TruTops / Oseon.',
      'arg.premium_eu': 'Equipos europeos ({brands}). Argumento: automatización de punta a punta, costo total de propiedad y software integrado TruTops / Oseon con servicio de fábrica.',
      'arg.turquia': 'Equipos turcos ({brands}). Argumento: productividad por turno (velocidad, cambio de herramientas, automatización) y disponibilidad de máquina con servicio de fábrica.',
      'arg.other': 'Equipos de otras marcas ({brands}). Argumento: modernizar con tecnología de fibra, automatización y el servicio TRUMPF.',
      'sig.none': 'Sin señales recientes registradas.',
      'ct.channels': 'Canales', 'ct.people': 'Personas',
      'ct.phone': 'Teléfono', 'ct.email': 'Email', 'ct.whatsapp': 'WhatsApp', 'ct.linkedin': 'LinkedIn', 'ct.web': 'Web',
      'ct.instagram': 'Instagram', 'ct.facebook': 'Facebook', 'ct.youtube': 'YouTube',
      'ct.vcard': 'Descargar vCard', 'ct.vcardDone': 'vCard descargada',
      'ct.copy': 'Copiar', 'ct.copied': 'Copiado: {x}', 'ct.copyFail': 'No se pudo copiar',
      'ct.none': 'Sin datos de contacto públicos.', 'ct.noPeople': 'Sin personas identificadas.',
      'sc.sector_fit': 'Afinidad del sector', 'sc.size': 'Tamaño', 'sc.sheet_volume': 'Volumen de chapa', 'sc.upgrade': 'Potencial de upgrade',
      'sc.growth': 'Crecimiento', 'sc.web': 'Presencia web',
      'sc.portfolio_fit': 'Afinidad de cartera', 'sc.service': 'Servicio técnico', 'sc.scale': 'Escala y solidez',
      'sc.market_access': 'Acceso al mercado', 'sc.no_conflict': 'Sin conflicto de marcas',
      'sc.total': 'Total', 'sc.scaleTitle': 'Escala',
      'sc.note.client': 'Suma de seis componentes, de 0 a 100. A ≥ 70 · B 55–69 · C < 55.',
      'sc.note.rep': 'Suma de cinco componentes, de 0 a 100. A ≥ 70 · B 55–69 · C < 55.',
      'sc.review': 'Nota de revisión',
      'src.none': 'Sin fuentes registradas.', 'src.conf': 'Confianza general', 'src.researched': 'Investigado el {d}',
      'src.via': 'Descubierta vía', 'src.webNote': 'Sobre su web',
      'crm.empty': 'El seguimiento comercial se activa con el módulo de Seguimiento.',
      'crm.s.sin_contactar': 'Sin contactar', 'crm.s.contactado': 'Contactado', 'crm.s.reunion': 'Reunión', 'crm.s.demo': 'Demo',
      'crm.s.cotizacion': 'Cotización', 'crm.s.negociacion': 'Negociación', 'crm.s.cierre': 'Ganado / perdido',
      'brands.title': 'Marcas que representa', 'brands.exclusive': 'Exclusiva', 'brands.nonExclusive': 'No exclusiva',
      'brands.none': 'Sin marcas registradas.',
      'conflict.title': 'Conflicto con la competencia',
      'conflict.yes': 'Representa competidores directos de TRUMPF: {brands}.',
      'conflict.no': 'Sin marcas competidoras de TRUMPF en su cartera.',
      'service.has': 'Servicio propio', 'service.tech': 'Técnicos', 'service.workshop': 'Taller', 'service.parts': 'Repuestos',
      'service.evidence': 'Ver evidencia', 'service.none': 'Sin evidencia de servicio técnico.',
      'market.industries': 'Industrias que atiende', 'market.clients': 'Clientes clave', 'market.none': 'Sin datos.',
      'assess.strengths': 'Fortalezas', 'assess.risks': 'Riesgos', 'assess.approach': 'Cómo abordarlos',
      'assess.shortlist': 'Preseleccionado para la shortlist',
    },
    de: {
      'ficha.aria': 'Unternehmensprofil',
      'ficha.kind.client': 'Potenzieller Kunde',
      'ficha.kind.rep': 'Vertriebspartner',
      'ficha.visit': 'Besuch vorbereiten (KI)',
      'ficha.addTour': 'Zur Besuchstour',
      'ficha.print': 'Drucken / PDF',
      'ficha.close': 'Profil schließen',
      'ficha.aiOffline': 'KI offline: Die Besuchsvorbereitung ist nicht verfügbar.',
      'ficha.plannerOff': 'Der Tourenplaner ist nicht verfügbar.',
      'ficha.score': 'Score',
      'ficha.fit': 'Eignung',
      'ficha.nav': 'Abschnitte des Profils',
      'ficha.openLink': 'Link öffnen',
      'ficha.notFound': 'Unternehmen nicht gefunden.',
      'ficha.shortlist': 'Shortlist',
      'ficha.demo': 'Demodaten',
      'sec.summary': 'Überblick', 'sec.opportunity': 'Potenzial', 'sec.location': 'Standort', 'sec.products': 'Produkte',
      'sec.plant': 'Werk & Maschinen', 'sec.signals': 'Signale', 'sec.contacts': 'Kontakte', 'sec.score': 'Bewertung',
      'sec.sources': 'Quellen', 'sec.crm': 'Nachverfolgung', 'sec.brands': 'Marken', 'sec.service': 'Service',
      'sec.market': 'Markt', 'sec.assessment': 'Einschätzung', 'sec.fit': 'Eignung',
      'sec.opportunity.long': 'TRUMPF-Potenzial',
      'fact.employees': 'Mitarbeitende', 'fact.founded': 'Gegründet', 'fact.plant': 'Werksfläche', 'fact.plants': 'Werke',
      'fact.certs': 'Zertifizierungen', 'fact.exports': 'Export nach', 'fact.group': 'Konzern', 'fact.branches': 'Niederlassungen',
      'fact.services': 'Leistungen', 'fact.categories': 'Kategorien', 'fact.segment': 'Segment', 'fact.size': 'Größe',
      'fact.source': 'laut {s}',
      'opp.series': 'Empfohlene Baureihen',
      'opp.why': 'Warum für {name}',
      'opp.more': 'Auf trumpf.com ansehen',
      'opp.specs': 'Eckdaten',
      'opp.none': 'Für dieses Unternehmen sind noch keine Baureihen empfohlen.',
      'loc.atlas': 'Atlas', 'loc.google': 'Google Maps', 'loc.map': 'Karte', 'loc.sat': 'Satellit',
      'loc.source': 'Kartenquelle', 'loc.mode': 'Kartentyp',
      'loc.open': 'In Google Maps öffnen', 'loc.street': 'Street View', 'loc.dir': 'Route planen',
      'loc.address': 'Adresse', 'loc.coords': 'Koordinaten', 'loc.precision': 'Genauigkeit',
      'loc.prec.exacta': 'Exakter Standort', 'loc.prec.calle': 'Straßengenau', 'loc.prec.ciudad': 'Nur Stadt',
      'loc.prec.exacta.d': 'Werkskoordinaten, auf der Karte oder der offiziellen Website verifiziert.',
      'loc.prec.calle.d': 'Der Punkt liegt an der veröffentlichten Straße bzw. im Block; die genaue Zufahrt kann abweichen.',
      'loc.prec.ciudad.d': 'Keine bestätigte Adresse: Der Punkt markiert das Stadtzentrum.',
      'loc.noGeo': 'Für dieses Unternehmen liegen keine Koordinaten vor.',
      'loc.mapOff': 'Die interaktive Karte ist nicht verfügbar. Bitte Google Maps oder die Links nutzen.',
      'prod.none': 'In öffentlichen Quellen wurden keine Produkte identifiziert.',
      'prod.zoom': 'Bild vergrößern',
      'prod.processes': 'Passende TRUMPF-Verfahren',
      'plant.gallery': 'Galerie', 'plant.machines': 'Erkannte Maschinen',
      'plant.noMachines': 'In öffentlichen Quellen wurden keine Maschinen erkannt.',
      'col.brand': 'Marke', 'col.type': 'Typ', 'col.model': 'Modell', 'col.evidence': 'Nachweis', 'col.conf': 'Konfidenz',
      'conf.alta': 'Hoch', 'conf.media': 'Mittel', 'conf.baja': 'Niedrig',
      'plant.replace': 'Ersatz- und Upgrade-Potenzial',
      'plant.isClient': 'Bereits TRUMPF-Kunde',
      'plant.isClient.d': 'TRUMPF-Maschinen im Einsatz: Fokus auf Kapazitätserweiterung, Automatisierung und Service.',
      'arg.china': 'Chinesische Anlagen ({brands}). Argumente: Präzision und Wiederholgenauigkeit in der Serie, lokaler Service mit zugesagten Reaktionszeiten und ein Wiederverkaufswert, der die Investition absichert.',
      'arg.corte_termico': 'Plasma- bzw. Brennschneiden ({brands}). Argumente: Der Faserlaser liefert saubere Kanten ohne Schlacke und Nacharbeit und senkt die Stückkosten bei Dünn- und Mittelblech.',
      'arg.japon': 'Japanische Anlagen ({brands}). Argumente: Automatisierung (Be- und Entladung, Lager, Biegezellen), Gesamtbetriebskosten (TCO) und durchgängige Software mit TruTops / Oseon.',
      'arg.premium_eu': 'Europäische Anlagen ({brands}). Argumente: durchgängige Automatisierung, Gesamtbetriebskosten (TCO) und integrierte Software mit TruTops / Oseon samt Werksservice.',
      'arg.turquia': 'Türkische Anlagen ({brands}). Argumente: Produktivität pro Schicht (Geschwindigkeit, Werkzeugwechsel, Automatisierung) und hohe Verfügbarkeit dank Werksservice.',
      'arg.other': 'Anlagen anderer Hersteller ({brands}). Argumente: Modernisierung mit Fasertechnologie, Automatisierung und TRUMPF-Service.',
      'sig.none': 'Keine aktuellen Signale erfasst.',
      'ct.channels': 'Kanäle', 'ct.people': 'Ansprechpartner',
      'ct.phone': 'Telefon', 'ct.email': 'E-Mail', 'ct.whatsapp': 'WhatsApp', 'ct.linkedin': 'LinkedIn', 'ct.web': 'Website',
      'ct.instagram': 'Instagram', 'ct.facebook': 'Facebook', 'ct.youtube': 'YouTube',
      'ct.vcard': 'vCard herunterladen', 'ct.vcardDone': 'vCard heruntergeladen',
      'ct.copy': 'Kopieren', 'ct.copied': 'Kopiert: {x}', 'ct.copyFail': 'Kopieren fehlgeschlagen',
      'ct.none': 'Keine öffentlichen Kontaktdaten.', 'ct.noPeople': 'Keine Ansprechpartner identifiziert.',
      'sc.sector_fit': 'Branchenpassung', 'sc.size': 'Unternehmensgröße', 'sc.sheet_volume': 'Blechvolumen', 'sc.upgrade': 'Upgrade-Potenzial',
      'sc.growth': 'Wachstum', 'sc.web': 'Webpräsenz',
      'sc.portfolio_fit': 'Portfolio-Passung', 'sc.service': 'Technischer Service', 'sc.scale': 'Größe & Stabilität',
      'sc.market_access': 'Marktzugang', 'sc.no_conflict': 'Konfliktfreiheit',
      'sc.total': 'Gesamt', 'sc.scaleTitle': 'Skala',
      'sc.note.client': 'Summe aus sechs Komponenten, 0 bis 100. A ≥ 70 · B 55–69 · C < 55.',
      'sc.note.rep': 'Summe aus fünf Komponenten, 0 bis 100. A ≥ 70 · B 55–69 · C < 55.',
      'sc.review': 'Prüfvermerk',
      'src.none': 'Keine Quellen erfasst.', 'src.conf': 'Gesamtkonfidenz', 'src.researched': 'Recherchiert am {d}',
      'src.via': 'Gefunden über', 'src.webNote': 'Zur Website',
      'crm.empty': 'Die Vertriebsnachverfolgung wird mit dem Modul „Nachverfolgung“ aktiviert.',
      'crm.s.sin_contactar': 'Nicht kontaktiert', 'crm.s.contactado': 'Kontaktiert', 'crm.s.reunion': 'Termin', 'crm.s.demo': 'Demo',
      'crm.s.cotizacion': 'Angebot', 'crm.s.negociacion': 'Verhandlung', 'crm.s.cierre': 'Gewonnen / verloren',
      'brands.title': 'Vertretene Marken', 'brands.exclusive': 'Exklusiv', 'brands.nonExclusive': 'Nicht exklusiv',
      'brands.none': 'Keine Marken erfasst.',
      'conflict.title': 'Wettbewerbskonflikt',
      'conflict.yes': 'Vertritt direkte TRUMPF-Wettbewerber: {brands}.',
      'conflict.no': 'Keine TRUMPF-Wettbewerber im Portfolio.',
      'service.has': 'Eigener Service', 'service.tech': 'Techniker', 'service.workshop': 'Werkstatt', 'service.parts': 'Ersatzteile',
      'service.evidence': 'Nachweis ansehen', 'service.none': 'Kein Nachweis für technischen Service.',
      'market.industries': 'Bediente Branchen', 'market.clients': 'Schlüsselkunden', 'market.none': 'Keine Angaben.',
      'assess.strengths': 'Stärken', 'assess.risks': 'Risiken', 'assess.approach': 'Ansprache',
      'assess.shortlist': 'Für die Shortlist vorausgewählt',
    },
  });

  /* ── Helpers ────────────────────────────────────────────────────────── */
  const LOCAL_ICONS = {
    linkedin: '<rect x="3" y="3" width="14" height="14"/><path d="M6.6 8.6v5M6.6 6.2v.1M9.6 13.6v-5M9.6 10.8c0-1.4.9-2.2 2-2.2s1.9.8 1.9 2.2v2.8"/>',
    instagram: '<rect x="3.2" y="3.2" width="13.6" height="13.6" rx="3.6"/><circle cx="10" cy="10" r="3.1"/><path d="M14 6v.1"/>',
    facebook: '<path d="M11.4 17V10.4h2.2l.4-2.6h-2.6V6.3c0-.8.3-1.3 1.4-1.3H14V2.8a17 17 0 0 0-2-.1c-2 0-3.3 1.2-3.3 3.4v1.7H6.5v2.6h2.2V17"/>',
    youtube: '<rect x="2.6" y="4.8" width="14.8" height="10.4" rx="2.6"/><path d="m8.6 7.8 3.6 2.2-3.6 2.2z"/>',
    person: '<circle cx="10" cy="4.6" r="1.8"/><path d="M7.4 17.2 8 11.6 6.6 10.8l.8-3.6h5.2l.8 3.6-1.4.8.6 5.6"/>',
    layers: '<path d="M10 2.8 17.2 7 10 11.2 2.8 7z"/><path d="m2.8 10.6 7.2 4.2 7.2-4.2M2.8 14l7.2 4.2 7.2-4.2" opacity=".55"/>',
    target: '<circle cx="10" cy="10" r="6.6"/><circle cx="10" cy="10" r="2.2"/><path d="M10 1.8v3M10 15.2v3M1.8 10h3M15.2 10h3"/>',
    tool: '<path d="M12.4 3.4a3.8 3.8 0 0 0-4.6 4.9L3.4 12.7a1.6 1.6 0 0 0 2.3 2.3l4.4-4.4a3.8 3.8 0 0 0 4.9-4.6l-2.2 2.2-2-.4-.4-2z"/>',
    box: '<path d="M10 2.8 16.6 6v8L10 17.2 3.4 14V6z"/><path d="M3.4 6 10 9.2 16.6 6M10 9.2v8"/>',
    factory: '<path d="M2.8 16.5V9l4.4 2.8V9l4.4 2.8V4h5.6v12.5z"/><path d="M2.8 16.5h14.4M13 7h1.6M13 10h1.6"/>',
  };
  const ico = (name, cls = '') => (LOCAL_ICONS[name]
    ? raw(`<svg class="ico ${cls}" viewBox="0 0 20 20" aria-hidden="true">${LOCAL_ICONS[name]}</svg>`)
    : TL.ui.icon(name, cls));
  const arr = (x) => (Array.isArray(x) ? x.filter((v) => v != null && v !== '') : x == null || x === '' ? [] : [x]);
  const has = (x) => !(x == null || x === '' || (Array.isArray(x) && !x.length));
  /** Solo http(s), mailto y tel: nunca javascript: desde los datos. */
  const safeUrl = (s) => {
    const v = String(s || '').trim();
    if (!v) return '';
    if (/^(https?:|mailto:|tel:)/i.test(v)) return v;
    if (/^www\./i.test(v) || /^[\w-]+(\.[\w-]+)+(\/|$)/.test(v)) return 'https://' + v;
    return '';
  };
  /** Imágenes: http(s), data:image o rutas relativas (assets/...). */
  const imgSrc = (s) => { const v = String(s || '').trim(); if (!v) return ''; if (/^(https?:|data:image\/)/i.test(v)) return v; return /^[a-z][\w+.-]*:/i.test(v) ? '' : v; };
  const domain = (s) => { try { return new URL(safeUrl(s)).hostname.replace(/^www\./, ''); } catch (e) { return String(s || ''); } };
  const shortUrl = (s) => { try { const x = new URL(safeUrl(s)); return (x.hostname.replace(/^www\./, '') + x.pathname).replace(/\/$/, ''); } catch (e) { return String(s || ''); } };
  const ext = (url, label, cls = 'f-link') => {
    const href = safeUrl(url);
    if (!href) return html`<span class="${cls}">${label}</span>`;
    return html`<a class="${cls}" href="${href}" target="_blank" rel="noopener noreferrer">${label}${TL.ui.icon('external', 'ico-xs')}</a>`;
  };
  const confKey = (c) => (['alta', 'media', 'baja'].includes(String(c || '').toLowerCase()) ? String(c).toLowerCase() : '');
  const confMeter = (c) => {
    const k = confKey(c);
    if (!k) return html`<span class="f-muted">—</span>`;
    const n = { alta: 3, media: 2, baja: 1 }[k];
    return html`<span class="meter" data-n="${n}" title="${t('col.conf')}: ${t('conf.' + k)}"><i></i><i></i><i></i><em>${t('conf.' + k)}</em></span>`;
  };
  const fmtEmp = (e) => (typeof e === 'number' ? TL.i18n.int(e) : String(e).replace(/(\d)\s*-\s*(\d)/g, '$1–$2'));
  const countryLabel = (x) => (/^[A-Z]{2}$/.test(String(x)) ? html`<span class="f-cc">${TL.ui.flag(x, 16)}${TL.data.countryName(x)}</span>` : html`<span class="f-cc">${x}</span>`);
  const empty = (txt, icon = 'info') => html`<div class="f-empty">${TL.ui.icon(icon)}<span>${txt}</span></div>`;
  const nameOf = (p) => (TL.state.lang === 'de' && p?.name_de ? p.name_de : p?.name || '');

  /** Encabezado de sección: numeración mono "01 —" + rótulo en mayúsculas. */
  const sec = (key, n, label, body, aside = '') => html`<section class="fs st" id="fs-${key}" data-sec="${key}" style="--i:${Math.min(n, 9)}" aria-labelledby="fs-${key}-t">
    <header class="fs-h"><span class="fs-n mono">${String(n).padStart(2, '0')} —</span><h3 class="fs-t" id="fs-${key}-t">${label}</h3>${aside ? raw(`<div class="fs-aside">${aside}</div>`) : ''}</header>
    ${body}</section>`;

  /* ── Portfolio TRUMPF: empareja trumpf_fit[].series con la foto oficial ─ */
  const normSeries = (s) => u.norm(s).replace(/\bseries?\b/g, ' ').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  const numOf = (s) => (String(s || '').match(/\d{3,4}/) || [''])[0];
  function matchIn(pool, fit) {
    const target = normSeries(fit.series), num = numOf(fit.series), fam = fit.family;
    if (!pool.length || !target) return null;
    let p = pool.find((x) => normSeries(x.series) === target);
    if (p) return { p, q: 3 };
    p = pool.find((x) => (!fam || x.family === fam) && normSeries(x.series).startsWith(target));
    if (p) return { p, q: 2 };
    p = num && pool.find((x) => (!fam || x.family === fam) && numOf(x.series) === num && normSeries(x.series).split(' ')[0] === target.split(' ')[0]);
    if (p) return { p, q: 1 };
    p = pool.find((x) => x.family === fam);
    return p ? { p, q: 0 } : null;
  }
  function portfolioFor(fit) {
    const a = matchIn(TL.data.portfolio || [], fit);
    const b = matchIn((window.TL_FALLBACK && window.TL_FALLBACK.portfolio) || [], fit);
    if (!a && !b) { const p = TL.data.portfolioItem?.(fit.series, fit.family); return p ? { p, q: 0 } : null; }
    const best = !b || (a && a.q >= b.q) ? a : b, other = best === a ? b : a;
    const out = Object.assign({}, best.p);
    if (other && normSeries(other.p.series) === normSeries(out.series)) {
      for (const k of Object.keys(other.p)) if (!has(out[k])) out[k] = other.p[k];
    }
    return { p: out, q: best.q };
  }

  /* ── Secciones de cliente ───────────────────────────────────────────── */
  const factRow = (facts) => {
    const list = facts.filter(Boolean);
    if (!list.length) return '';
    return html`<dl class="facts">${list.map((f) => html`<div class="fact">
      <dt>${ico(f.ico)}<span>${t(f.k)}</span></dt>
      <dd class="${f.mono ? 'num' : ''}">${f.v}${f.sub ? html`<small>${f.sub}</small>` : ''}</dd></div>`)}</dl>`;
  };

  function secSummaryClient(c, n) {
    const s = c.size || {};
    const plants = arr(s.plants), certs = arr(s.certifications), exp = arr(s.exports_to), services = arr(pick(c, 'services'));
    const summary = pick(c, 'summary');
    const body = html`${summary ? html`<p class="f-lead">${summary}</p>` : empty(t('ui.unknown'))}
      ${factRow([
        has(s.employees) && { ico: 'users', k: 'fact.employees', v: fmtEmp(s.employees), mono: true, sub: s.employees_source ? t('fact.source', { s: s.employees_source }) : '' },
        has(s.founded) && { ico: 'calendar', k: 'fact.founded', v: String(s.founded), mono: true },
        has(s.plant_m2) && +s.plant_m2 > 0 && { ico: 'area', k: 'fact.plant', v: TL.i18n.int(+s.plant_m2) + ' m²', mono: true },
        plants.length && { ico: 'pin', k: 'fact.plants', v: String(plants.length), mono: true, sub: plants.join(' · ') },
        certs.length && { ico: 'badge', k: 'fact.certs', v: certs.join(' · ') },
        exp.length && { ico: 'export', k: 'fact.exports', v: raw(exp.map((x) => String(countryLabel(x))).join('')) },
        has(s.group) && { ico: 'group', k: 'fact.group', v: s.group },
      ])}
      ${services.length ? html`<div class="f-tags"><span class="f-k">${t('fact.services')}</span>${services.map((x) => TL.ui.chip(x))}</div>` : ''}`;
    return sec('summary', n, t('sec.summary'), body);
  }

  function fitCard(c, f, i) {
    const m = portfolioFor(f);
    const p = m?.p || {};
    const exact = m && m.q >= 1;
    const series = exact ? p.series : f.series || p.series || '';
    const img = exact && p.image ? p.image : '';
    const line = TL.data.familyLine(f.family) || p.series?.split(' ')[0] || '';
    const why = pick(f, 'why');
    const tag = exact ? pick(p, 'tagline') : '';
    const specs = exact && (TL.state.lang === 'es' || p.key_specs_de) ? pick(p, 'key_specs') : '';
    const url = exact ? p.url : 'https://www.trumpf.com';
    return html`<article class="tf st" style="--i:${i + 2}">
      <figure class="tf-img ${img ? '' : 'is-ph'}">${img
        ? html`<img src="${img}" alt="${series}" loading="lazy" decoding="async" data-ph="${TL.ui.processIcon(f.family)}">`
        : html`<span class="ph-ico">${TL.ui.icon(TL.ui.processIcon(f.family))}</span>`}
        <figcaption class="mono">${line}</figcaption></figure>
      <div class="tf-body">
        <p class="tf-fam">${TL.ui.icon(TL.ui.processIcon(f.family), 'ico-xs')}<span>${TL.data.familyName(f.family)}</span></p>
        <h4 class="tf-name">${series}</h4>
        ${tag ? html`<p class="tf-tag">${tag}</p>` : ''}
        ${why ? html`<div class="tf-why"><span class="tf-why-k">${t('opp.why', { name: c.name || '' })}</span><p>${why}</p></div>` : ''}
        ${specs ? html`<p class="tf-specs"><span class="f-k">${t('opp.specs')}</span>${specs}</p>` : ''}
        ${ext(url, t('opp.more'), 'f-link tf-link')}
      </div></article>`;
  }
  function secOpportunity(c, n) {
    const fits = arr(c.trumpf_fit);
    const opp = pick(c, 'opportunity');
    const body = html`${opp ? html`<p class="f-callout">${opp}</p>` : ''}
      ${fits.length ? html`<p class="f-sub">${t('opp.series')}</p><div class="tf-list">${fits.map((f, i) => fitCard(c, f, i))}</div>` : empty(t('opp.none'))}`;
    return sec('opportunity', n, t('sec.opportunity.long'), body);
  }

  const fmtCoord = (lat, lng) => `${Math.abs(lat).toFixed(5)}° ${lat < 0 ? 'S' : 'N'}   ${Math.abs(lng).toFixed(5)}° ${lng < 0 ? 'W' : 'E'}`;
  function secLocation(r, n) {
    const ok = isFinite(r.lat) && isFinite(r.lng) && r.lat != null && r.lng != null;
    if (!ok) return sec('location', n, t('sec.location'), empty(t('loc.noGeo'), 'pin'));
    const ll = `${(+r.lat).toFixed(6)},${(+r.lng).toFixed(6)}`;
    const prec = ['exacta', 'calle', 'ciudad'].includes(r.geo_precision) ? r.geo_precision : '';
    const addr = [r.address, r.city !== r.address ? r.city : '', r.region && r.region !== r.city ? r.region : ''].filter(Boolean).join(', ');
    const st = state.loc;
    const body = html`<div class="loc-bar">
        <div class="seg seg-sm" role="group" aria-label="${t('loc.source')}">
          <button type="button" data-act="loc-src" data-v="atlas" aria-pressed="${st.src === 'atlas'}">${t('loc.atlas')}</button>
          <button type="button" data-act="loc-src" data-v="google" aria-pressed="${st.src === 'google'}">${t('loc.google')}</button></div>
        <div class="seg seg-sm" role="group" aria-label="${t('loc.mode')}">
          <button type="button" data-act="loc-mode" data-v="map" aria-pressed="${!st.sat}">${t('loc.map')}</button>
          <button type="button" data-act="loc-mode" data-v="sat" aria-pressed="${st.sat}">${t('loc.sat')}</button></div>
      </div>
      <div class="loc-map" data-src="${st.src}" data-ll="${ll}">
        <div class="loc-mini" aria-hidden="true"></div><div class="loc-gmap"></div>
        <span class="loc-read mono" aria-hidden="true">${fmtCoord(+r.lat, +r.lng)}</span>
        <span class="loc-cross" aria-hidden="true"></span>
      </div>
      <div class="loc-info">
        <dl class="loc-dl">
          <div><dt>${t('loc.address')}</dt><dd>${addr || '—'}<span class="f-cc">${TL.ui.flag(r.country, 16)}${TL.data.countryName(r.country)}</span></dd></div>
          <div><dt>${t('loc.coords')}</dt><dd class="num">${ll.replace(',', ', ')} <button type="button" class="f-copy" data-act="copy" data-v="${ll}" aria-label="${t('ct.copy')}" title="${t('ct.copy')}">${TL.ui.icon('copy')}</button></dd></div>
          ${prec ? html`<div><dt>${t('loc.precision')}</dt><dd><span class="prec" data-p="${prec}"><i></i>${t('loc.prec.' + prec)}</span><small>${t('loc.prec.' + prec + '.d')}</small></dd></div>` : ''}
        </dl>
        <div class="loc-links">
          <a class="btn btn-sm" href="https://www.google.com/maps/search/?api=1&query=${ll}" target="_blank" rel="noopener noreferrer">${TL.ui.icon('pin')}<span>${t('loc.open')}</span></a>
          <a class="btn btn-sm" href="https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${ll}" target="_blank" rel="noopener noreferrer">${ico('person')}<span>${t('loc.street')}</span></a>
          <a class="btn btn-sm" href="https://www.google.com/maps/dir/?api=1&destination=${ll}" target="_blank" rel="noopener noreferrer">${TL.ui.icon('route')}<span>${t('loc.dir')}</span></a>
        </div>
      </div>`;
    return sec('location', n, t('sec.location'), body);
  }

  function secProducts(c, n) {
    const ps = arr(c.products);
    if (!ps.length) return sec('products', n, t('sec.products'), empty(t('prod.none'), 'box'));
    const sector = arr(c.sectors)[0];
    let k = 0;
    const body = html`<div class="pg">${ps.map((p, i) => {
      const procs = arr(p.processes);
      const ph = procs[0] ? TL.ui.processIcon(procs[0]) : 'box';
      const src = imgSrc(p.image);
      const fig = src
        ? html`<button type="button" class="pc-fig" data-act="prod-zoom" data-i="${k++}" aria-label="${t('prod.zoom')}: ${nameOf(p)}"><img src="${src}" alt="" loading="lazy" decoding="async" data-ph="${ph}"><span class="pc-zoom">${TL.ui.icon('expand')}</span></button>`
        : html`<div class="pc-fig is-ph" title="${sector ? TL.data.sectorName(sector) : ''}"><span class="ph-ico">${ico(ph)}</span></div>`;
      return html`<article class="pc st" style="--i:${Math.min(i + 2, 9)}">${fig}<div class="pc-body">
        <h4 class="pc-name">${nameOf(p)}</h4>${pick(p, 'detail') ? html`<p class="pc-det">${pick(p, 'detail')}</p>` : ''}
        ${procs.length ? html`<div class="pc-proc" aria-label="${t('prod.processes')}">${procs.map((x) => html`<span class="proc" title="${TL.data.familyName(x)}">${TL.ui.icon(TL.ui.processIcon(x))}<span class="sr">${TL.data.familyName(x)}</span></span>`)}</div>` : ''}
      </div></article>`;
    })}</div>`;
    return sec('products', n, t('sec.products'), body);
  }

  /** Fotos → [{src, caption}] (acepta strings u objetos {src, caption_es/_de}). */
  const photosOf = (list) => arr(list).map((x) => (typeof x === 'string' ? { src: x } : x))
    .map((x) => ({ src: imgSrc(x?.src || x?.url), caption: pick(x, 'caption') || '' })).filter((x) => x.src);
  const galleryOf = (rec) => (Array.isArray(rec.photos) ? photosOf(rec.photos) : photosOf(rec.photos?.plant).concat(photosOf(rec.photos?.machines)));
  const gallery = (rec) => {
    const g = galleryOf(rec);
    if (!g.length) return '';
    return html`<p class="f-sub">${t('plant.gallery')} <span class="num f-muted">${g.length}</span></p>
      <div class="gal">${g.map((p, i) => html`<button type="button" class="gal-it st" style="--i:${Math.min(i + 2, 9)}" data-act="gal" data-i="${i}" aria-label="${p.caption || t('prod.zoom')}">
        <img src="${p.src}" alt="" loading="lazy" decoding="async" data-ph="camera">${p.caption ? html`<span class="gal-cap">${p.caption}</span>` : ''}</button>`)}</div>`;
  };

  const ARG_ORDER = ['china', 'corte_termico', 'turquia', 'japon', 'premium_eu', 'usa', 'otro'];
  function replaceNotice(c) {
    const by = {};
    arr(c.machines).forEach((m) => {
      const g = TL.data.groupOfBrand(m.brand, m.brand_group);
      if (g === 'trumpf' || m.kind === 'trumpf' || ['soldadura', 'robot', 'mecanizado'].includes(g)) return;
      (by[g] = by[g] || new Set()).add(m.brand || '—');
    });
    const gs = ARG_ORDER.filter((g) => by[g]).slice(0, 3);
    if (!gs.length) return '';
    return html`<div class="f-alert" data-kind="opp"><span class="f-alert-i">${ico('target')}</span><div>
      <p class="f-alert-t">${t('plant.replace')}</p>
      ${gs.map((g) => {
        const key = ['china', 'corte_termico', 'turquia', 'japon', 'premium_eu'].includes(g) ? g : 'other';
        return html`<p class="f-alert-p"><i class="g-dot" style="background:${TL.data.group(g).color}"></i>${t('arg.' + key, { brands: [...by[g]].join(', ') })}</p>`;
      })}</div></div>`;
  }

  function secPlant(c, n) {
    const ms = arr(c.machines);
    const table = ms.length ? html`<div class="f-table-wrap"><table class="f-table">
      <thead><tr><th>${t('col.brand')}</th><th>${t('col.type')}</th><th>${t('col.model')}</th><th>${t('col.evidence')}</th><th>${t('col.conf')}</th></tr></thead>
      <tbody>${ms.map((m) => {
        const g = TL.data.group(TL.data.groupOfBrand(m.brand, m.brand_group));
        const ev = m.evidence || '';
        return html`<tr>
          <td><span class="brand-chip" style="--g:${g.color}" title="${g.name}"><i></i>${m.brand || '—'}</span></td>
          <td>${m.type || '—'}</td><td class="num">${m.model || '—'}</td>
          <td class="ev"><div class="ev-in">${ev ? html`<span class="ev-t" title="${ev}">${ev}</span>` : ''}${safeUrl(m.url) ? html`<a class="ev-l" href="${safeUrl(m.url)}" target="_blank" rel="noopener noreferrer" title="${domain(m.url)}">${TL.ui.icon('external')}<span class="sr">${t('ficha.openLink')}</span></a>` : ''}${!ev && !safeUrl(m.url) ? '—' : ''}</div></td>
          <td>${confMeter(m.confidence)}</td></tr>`;
      })}</tbody></table></div>` : empty(t('plant.noMachines'), 'factory');
    const isClient = TL.data.hasTrumpf(c) ? html`<div class="f-alert" data-kind="trumpf"><span class="f-alert-i">${TL.ui.icon('check')}</span><div><p class="f-alert-t">${t('plant.isClient')}</p><p class="f-alert-p">${t('plant.isClient.d')}</p></div></div>` : '';
    const comp = TL.data.hasCompetitor(c) ? replaceNotice(c) : '';
    // tecnología que la empresa declara (servicios, productos, resumen) + aviso cuando no publica marcas
    const de = TL.state.lang === 'de';
    const TECH = { laser: ['Corte láser', 'Laserschneiden'], bending: ['Plegado CNC', 'Abkanten'], punching: ['Punzonado', 'Stanzen'], plasma: ['Plasma / oxicorte', 'Plasma-/Brennschneiden'], tube: ['Corte de tubos', 'Rohrschneiden'], welding_robot: ['Soldadura robotizada', 'Roboterschweißen'], waterjet: ['Corte por agua', 'Wasserstrahlschneiden'], cnc: ['Mecanizado / CNC', 'CNC-Fertigung'], stamping: ['Estampado / prensas', 'Umformen / Pressen'] };
    const tech = arr(c.tech).filter((k) => TECH[k]);
    const branded = ms.some((m) => String(m.brand || '').trim());
    const techRow = html`<p class="f-sub">${de ? 'Technologie laut eigener Angabe' : 'Tecnología declarada'}</p>${tech.length ? html`<div class="f-tech">${tech.map((k) => html`<span>${TECH[k][de ? 1 : 0]}</span>`)}</div>` : ''}${!branded && c.kind !== 'rep' ? html`<p class="f-tech-note">${de ? 'Die Firma veröffentlicht die Marken ihrer Maschinen nicht: beim Besuch klären (Chance für Ersatz oder Erweiterung).' : 'La empresa no publica la marca de sus máquinas: validarlo en la visita (oportunidad de reemplazo o ampliación).'}</p>` : ''}`;
    const body = html`${gallery(c)}${techRow}${ms.length || galleryOf(c).length ? html`<p class="f-sub">${t('plant.machines')} <span class="num f-muted">${ms.length || ''}</span></p>` : ''}${table}${isClient}${comp}`;
    return sec('plant', n, t('sec.plant'), body);
  }

  function secSignals(c, n) {
    const ss = arr(c.signals).slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
    const body = ss.length ? html`<ol class="tline">${ss.map((s, i) => html`<li class="st" style="--i:${Math.min(i + 2, 9)}">
      <span class="tline-d num">${s.date ? TL.i18n.monthYear(s.date) : '—'}</span>
      <div class="tline-b"><p>${pick(s, 'text')}</p>${safeUrl(s.url) ? ext(s.url, domain(s.url), 'f-link f-src') : ''}</div></li>`)}</ol>` : empty(t('sig.none'), 'radar');
    return sec('signals', n, t('sec.signals'), body);
  }

  /* ── Contactos + vCard ──────────────────────────────────────────────── */
  function channelsOf(rec) {
    const ct = rec.contacts || {}, out = [];
    arr(ct.phones).forEach((v) => out.push({ k: 'phone', ico: 'phone', v, href: 'tel:' + String(v).replace(/[^\d+]/g, '') }));
    arr(ct.emails).forEach((v) => out.push({ k: 'email', ico: 'mail', v, href: 'mailto:' + v }));
    arr(ct.whatsapp).forEach((v) => {
      const s = String(v);
      out.push(/^https?:/i.test(s) ? { k: 'whatsapp', ico: 'chat', v: shortUrl(s), href: safeUrl(s), copy: s } : { k: 'whatsapp', ico: 'chat', v: s, href: 'https://wa.me/' + s.replace(/\D/g, ''), copy: s });
    });
    if (rec.website) out.push({ k: 'web', ico: 'web', v: shortUrl(rec.website), href: safeUrl(rec.website), copy: rec.website });
    ['linkedin', 'instagram', 'facebook', 'youtube'].forEach((k) => arr(ct[k]).forEach((v) => out.push({ k, ico: k, v: shortUrl(v), href: safeUrl(v), copy: v })));
    return out.filter((x) => x.v);
  }
  function secContacts(rec, n) {
    const ch = channelsOf(rec), people = arr(rec.contacts?.people).map((p) => (typeof p === 'string' ? { name: p } : p));
    const list = ch.length ? html`<ul class="ct-list">${ch.map((x) => html`<li class="ct-row">
        <span class="ct-ico">${ico(x.ico)}</span><span class="ct-k">${t('ct.' + x.k)}</span>
        ${x.href ? html`<a class="ct-v ${x.k === 'phone' ? 'num' : ''}" href="${x.href}" ${/^https?:/.test(x.href) ? raw('target="_blank" rel="noopener noreferrer"') : ''}>${x.v}</a>` : html`<span class="ct-v">${x.v}</span>`}
        <button type="button" class="f-copy" data-act="copy" data-v="${x.copy || x.v}" aria-label="${t('ct.copy')}: ${x.v}" title="${t('ct.copy')}">${TL.ui.icon('copy')}</button></li>`)}</ul>` : empty(t('ct.none'), 'phone');
    const ppl = people.length ? html`<ul class="pp-list">${people.map((p) => html`<li class="pp">
        <span class="pp-ini">${u.initials(p.name)}</span>
        <div class="pp-b"><b>${p.name || '—'}</b>${pick(p, 'role') ? html`<span>${pick(p, 'role')}</span>` : ''}${safeUrl(p.source) ? ext(p.source, domain(p.source), 'f-link f-src') : ''}</div>
        ${p.name ? html`<button type="button" class="f-copy" data-act="copy" data-v="${[p.name, pick(p, 'role')].filter(Boolean).join(' — ')}" aria-label="${t('ct.copy')}: ${p.name}" title="${t('ct.copy')}">${TL.ui.icon('copy')}</button>` : ''}</li>`)}</ul>` : empty(t('ct.noPeople'), 'users');
    const body = html`<div class="ct-grid"><div><p class="f-sub">${t('ct.channels')}</p>${list}</div><div><p class="f-sub">${t('ct.people')}</p>${ppl}</div></div>`;
    const aside = String(html`<button type="button" class="btn btn-sm" data-act="vcard">${TL.ui.icon('download')}<span>${t('ct.vcard')}</span></button>`);
    return sec('contacts', n, t('sec.contacts'), body, aside);
  }
  const vEsc = (s) => String(s == null ? '' : s).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');
  function vcard(rec) {
    const ct = rec.contacts || {};
    const L = ['BEGIN:VCARD', 'VERSION:3.0', 'N:' + vEsc(rec.name) + ';;;;', 'FN:' + vEsc(rec.name), 'ORG:' + vEsc(rec.legal_name || rec.name)];
    L.push('ADR;TYPE=WORK:;;' + [rec.address, rec.city, rec.region, '', TL.data.countryName(rec.country)].map(vEsc).join(';'));
    arr(ct.phones).forEach((p) => L.push('TEL;TYPE=WORK,VOICE:' + vEsc(p)));
    arr(ct.whatsapp).forEach((p) => { if (!/^https?:/i.test(p)) L.push('TEL;TYPE=CELL:' + vEsc(p)); });
    arr(ct.emails).forEach((e) => L.push('EMAIL;TYPE=INTERNET,WORK:' + vEsc(e)));
    [rec.website, ...arr(ct.linkedin), ...arr(ct.instagram), ...arr(ct.facebook), ...arr(ct.youtube)].map(safeUrl).filter(Boolean).forEach((x) => L.push('URL:' + x));
    if (isFinite(rec.lat) && isFinite(rec.lng) && rec.lat != null) L.push('GEO:' + (+rec.lat).toFixed(6) + ';' + (+rec.lng).toFixed(6));
    const people = arr(ct.people).map((p) => (typeof p === 'string' ? p : [p.name, p.role].filter(Boolean).join(' – '))).filter(Boolean);
    const note = [rec.tier ? 'Tier ' + rec.tier + ' · ' + TL.data.score(rec) + '/100' : '', pick(rec, 'summary'), people.length ? t('ct.people') + ': ' + people.join('; ') : '', 'TRUMPF Market Atlas LATAM · ' + RESEARCHED].filter(Boolean).join('\n');
    L.push('NOTE:' + vEsc(note), 'END:VCARD');
    const file = String(rec.name || rec.id).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '') || 'contacto';
    u.download(file + '.vcf', L.join('\r\n') + '\r\n', 'text/vcard;charset=utf-8');
    TL.ui.toast(t('ct.vcardDone'));
  }

  /* ── Puntaje ────────────────────────────────────────────────────────── */
  const CLIENT_MAX = { sector_fit: 25, size: 20, sheet_volume: 15, upgrade: 15, growth: 15, web: 10 };
  const REP_MAX = { portfolio_fit: 25, service: 25, scale: 20, market_access: 15, no_conflict: 15 };
  function secScore(rec, kind, n) {
    const isRep = kind === 'rep';
    const comp = (isRep ? rec.fit : rec.score) || {};
    const MAX = isRep ? REP_MAX : CLIENT_MAX;
    const total = Math.round(TL.data.score(rec));
    const tier = rec.tier || (total >= 70 ? 'A' : total >= 55 ? 'B' : 'C');
    const pos = u.clamp(total, 0, 100);
    const rows = Object.keys(MAX).map((k, i) => {
      const v = +comp[k] || 0, max = MAX[k];
      return html`<li class="sc-row" style="--i:${i}"><span class="sc-k">${t('sc.' + k)}</span>
        <span class="sc-track"><i style="--v:${u.clamp(v / max, 0, 1).toFixed(3)}"></i></span>
        <span class="sc-v num"><b data-count="${v}">0</b><em>/${max}</em></span></li>`;
    });
    const note = isRep ? '' : rec.review?.note;
    const body = html`<div class="sc-top">
        <div class="sc-total"><span class="sc-num num" data-count="${total}">0</span><span class="sc-of num">/100</span></div>
        <div class="sc-tier"><span class="tier-tag" data-tier="${tier}">${t('tier.' + tier)}</span><span>${t('tier.' + tier + '.long')}</span></div>
        <div class="sc-scale" aria-label="${t('sc.scaleTitle')}">
          <div class="sc-zones"><span data-z="C" style="width:55%">C</span><span data-z="B" style="width:15%">B</span><span data-z="A" style="width:30%">A</span></div>
          <span class="sc-mark" style="--p:${pos}%"><i></i></span>
          <div class="sc-ticks num"><span style="left:0">0</span><span style="left:55%">55</span><span style="left:70%">70</span><span style="left:100%">100</span></div>
        </div>
      </div>
      <ul class="sc-bars">${rows}</ul>
      <p class="f-note">${t(isRep ? 'sc.note.rep' : 'sc.note.client')}</p>
      ${note ? html`<div class="f-alert" data-kind="note"><span class="f-alert-i">${TL.ui.icon('info')}</span><div><p class="f-alert-t">${t('sc.review')}</p><p class="f-alert-p">${note}</p></div></div>` : ''}`;
    return sec('score', n, t(isRep ? 'sec.fit' : 'sec.score'), body);
  }

  function secSources(rec, n) {
    const src = arr(rec.sources).map((s) => (typeof s === 'string' ? { url: s } : s));
    const list = src.length ? html`<ol class="src-list">${src.map((s, i) => html`<li>
        <span class="src-n num">${String(i + 1).padStart(2, '0')}</span>
        <span class="src-l">${s.label || domain(s.url)}</span>
        ${safeUrl(s.url) ? ext(s.url, domain(s.url), 'f-link src-d') : html`<span class="src-d f-muted">—</span>`}</li>`)}</ol>` : empty(t('src.none'), 'link');
    const webNote = pick(rec, 'web_note');
    const body = html`${list}
      <div class="src-meta">
        <div><span class="f-k">${t('src.conf')}</span>${confMeter(rec.confidence)}</div>
        <div><span class="f-k">${TL.ui.icon('calendar', 'ico-xs')}</span><span>${t('src.researched', { d: TL.i18n.date(RESEARCHED) })}</span></div>
        ${rec.discovered_via ? html`<div><span class="f-k">${t('src.via')}</span><span>${rec.discovered_via}</span></div>` : ''}
      </div>
      ${webNote ? html`<p class="f-note"><span class="f-k">${t('src.webNote')}</span> ${webNote}</p>` : ''}`;
    return sec('sources', n, t('sec.sources'), body);
  }

  const CRM_STAGES = ['sin_contactar', 'contactado', 'reunion', 'demo', 'cotizacion', 'negociacion', 'cierre'];
  function secCrm(rec, n) {
    return sec('crm', n, t('sec.crm'), html`<div class="ficha-crm" data-id="${rec.id}"></div>`);
  }
  function fillCrm(root, id) {
    const el = root.querySelector('.ficha-crm');
    if (!el) return;
    if (typeof TL.crm?.renderInto === 'function') {
      try { TL.crm.renderInto(el, id); return; } catch (e) { console.warn('[ficha] crm', e); }
    }
    el.innerHTML = String(html`<ol class="crm-steps" aria-hidden="true">${CRM_STAGES.map((s, i) => html`<li class="${i === 0 ? 'is-on' : ''}"><i></i><span>${t('crm.s.' + s)}</span></li>`)}</ol>
      ${empty(t('crm.empty'), 'crm')}`);
  }

  /* ── Secciones de representante ─────────────────────────────────────── */
  function secSummaryRep(r, n) {
    const branches = arr(r.branches).map((b) => (typeof b === 'string' ? b : b?.city || b?.name || '')).filter(Boolean);
    const cats = arr(r.categories);
    const summary = pick(r, 'summary');
    const body = html`${summary ? html`<p class="f-lead">${summary}</p>` : empty(t('ui.unknown'))}
      ${factRow([
        has(r.founded) && { ico: 'calendar', k: 'fact.founded', v: String(r.founded), mono: true },
        has(r.employees) && { ico: 'users', k: 'fact.employees', v: fmtEmp(r.employees), mono: true },
        branches.length && { ico: 'pin', k: 'fact.branches', v: String(branches.length), mono: true, sub: branches.join(' · ') },
        cats.length && { ico: 'box', k: 'fact.categories', v: cats.map((c) => TL.data.sectorName(c)).join(' · ') },
      ])}
      ${r.shortlist ? html`<div class="f-alert" data-kind="short"><span class="f-alert-i">${TL.ui.icon('star')}</span><div><p class="f-alert-t">${t('assess.shortlist')}</p>${pick(r, 'shortlist_rationale') ? html`<p class="f-alert-p">${pick(r, 'shortlist_rationale')}</p>` : ''}</div></div>` : ''}`;
    return sec('summary', n, t('sec.summary'), body);
  }

  function secBrands(r, n) {
    const bs = arr(r.brands).map((b) => (typeof b === 'string' ? { brand: b } : b));
    const cc = r.competitor_conflict || {};
    const grid = bs.length ? html`<div class="br-grid">${bs.map((b, i) => {
      const g = TL.data.group(TL.data.groupOfBrand(b.brand, b.brand_group));
      return html`<div class="br st" style="--i:${Math.min(i + 2, 9)};--g:${g.color}"><span class="br-bar"></span>
        <b class="br-name">${b.brand || '—'}</b><span class="br-cat">${b.category || ''}</span>
        <span class="br-meta"><span class="brand-chip" style="--g:${g.color}"><i></i>${g.name}</span>
        ${b.exclusive === true ? html`<span class="br-ex">${t('brands.exclusive')}</span>` : b.exclusive === false ? html`<span class="br-ex is-no">${t('brands.nonExclusive')}</span>` : ''}</span></div>`;
    })}</div>` : empty(t('brands.none'), 'reps');
    const conflict = cc.conflict
      ? html`<div class="f-alert" data-kind="warn"><span class="f-alert-i">${TL.ui.icon('warn')}</span><div><p class="f-alert-t">${t('conflict.title')}</p><p class="f-alert-p">${t('conflict.yes', { brands: arr(cc.brands).join(', ') || '—' })}</p>${pick(cc, 'note') ? html`<p class="f-alert-p">${pick(cc, 'note')}</p>` : ''}</div></div>`
      : html`<div class="f-alert" data-kind="ok"><span class="f-alert-i">${TL.ui.icon('check')}</span><div><p class="f-alert-t">${t('conflict.title')}</p><p class="f-alert-p">${t('conflict.no')}</p></div></div>`;
    return sec('brands', n, t('brands.title'), html`${grid}${conflict}`);
  }

  function secService(r, n) {
    const s = r.service || {};
    const yn = (v) => (v === true ? html`<span class="yn is-y">${TL.ui.icon('check', 'ico-xs')}${t('ui.yes')}</span>` : v === false ? html`<span class="yn is-n">${TL.ui.icon('minus', 'ico-xs')}${t('ui.no')}</span>` : html`<span class="f-muted">—</span>`);
    const any = s.has_service != null || has(s.technicians) || s.workshop != null || s.spare_parts != null || pick(s, 'note');
    const body = any ? html`<dl class="svc">
        <div><dt>${t('service.has')}</dt><dd>${yn(s.has_service)}</dd></div>
        <div><dt>${t('service.tech')}</dt><dd class="num">${has(s.technicians) ? String(s.technicians) : '—'}</dd></div>
        <div><dt>${t('service.workshop')}</dt><dd>${yn(s.workshop)}</dd></div>
        <div><dt>${t('service.parts')}</dt><dd>${yn(s.spare_parts)}</dd></div></dl>
      ${pick(s, 'note') ? html`<p class="f-body">${pick(s, 'note')}</p>` : ''}
      ${safeUrl(s.evidence_url) ? ext(s.evidence_url, t('service.evidence') + ' · ' + domain(s.evidence_url)) : ''}` : empty(t('service.none'), 'tool');
    return sec('service', n, t('sec.service'), body);
  }

  function secMarket(r, n) {
    const ind = arr(r.industries_served), kc = arr(r.key_clients).map((k) => (typeof k === 'string' ? k : k?.name || ''));
    const body = html`<div class="two-col">
      <div><p class="f-sub">${t('market.industries')}</p>${ind.length ? html`<div class="f-tags">${ind.map((x) => TL.ui.chip(TL.data.sectorName(x)))}</div>` : html`<p class="f-muted">${t('market.none')}</p>`}</div>
      <div><p class="f-sub">${t('market.clients')}</p>${kc.length ? html`<ul class="kc">${kc.filter(Boolean).map((x) => html`<li>${x}</li>`)}</ul>` : html`<p class="f-muted">${t('market.none')}</p>`}</div></div>`;
    return sec('market', n, t('sec.market'), body);
  }

  function secAssessment(r, n) {
    const st = arr(pick(r, 'strengths')), rk = arr(pick(r, 'risks')), ap = pick(r, 'approach');
    const col = (k, list, cls) => html`<div class="sw-col ${cls}"><p class="f-sub">${t(k)}</p>${list.length ? html`<ul>${list.map((x) => html`<li>${x}</li>`)}</ul>` : html`<p class="f-muted">${t('market.none')}</p>`}</div>`;
    const body = html`<div class="two-col f-sw">${col('assess.strengths', st, 'is-s')}${col('assess.risks', rk, 'is-r')}</div>
      ${ap ? html`<div class="f-approach"><p class="f-sub">${t('assess.approach')}</p><p class="f-callout">${ap}</p></div>` : ''}`;
    return sec('assessment', n, t('sec.assessment'), body);
  }

  /* ── Composición por tipo ───────────────────────────────────────────── */
  const SECTIONS = {
    client: [['summary', secSummaryClient], ['opportunity', secOpportunity], ['location', secLocation], ['products', secProducts], ['plant', secPlant],
      ['signals', secSignals], ['contacts', secContacts], ['score', (r, n) => secScore(r, 'client', n)], ['sources', secSources], ['crm', secCrm]],
    rep: [['summary', secSummaryRep], ['brands', secBrands], ['service', secService], ['market', secMarket], ['assessment', secAssessment],
      ['score', (r, n) => secScore(r, 'rep', n)], ['location', secLocation], ['contacts', secContacts], ['sources', secSources], ['crm', secCrm]],
  };
  const NAV_LABEL = { score: (kind) => t(kind === 'rep' ? 'sec.fit' : 'sec.score') };

  /* ── Estado del módulo ──────────────────────────────────────────────── */
  const state = { id: null, kind: null, open: false, escOff: null, lastFocus: null, mini: null, loc: { src: 'atlas', sat: false }, active: 'summary', lock: 0, seen: new Set() };
  const F = (TL.ficha = {});
  const root = () => document.getElementById('tl-ficha');
  const cur = () => root()?.querySelector('.ficha-stack > .fb:not(.is-out)') || null;
  const recNow = () => TL.data.get(state.id)?.rec || state.rec || null;

  /* ── Encabezado + barra de secciones ────────────────────────────────── */
  function header(rec, kind, anim) {
    const isRep = kind === 'rep';
    const score = Math.round(TL.data.score(rec));
    const tier = rec.tier || (score >= 70 ? 'A' : score >= 55 ? 'B' : 'C');
    const sectors = isRep ? arr(rec.categories) : arr(rec.sectors);
    const more = sectors.length - 4;
    const tags = [
      !isRep && rec.segment ? html`<span class="chip chip-seg">${TL.data.segmentName(rec.segment)}</span>` : '',
      ...sectors.slice(0, 4).map((s) => TL.ui.chip(TL.data.sectorName(s))),
      more > 0 ? html`<span class="chip chip-more num">+${more}</span>` : '',
    ];
    const place = [rec.city, TL.data.countryName(rec.country)].filter(Boolean);
    const actions = html`${!isRep ? html`<button type="button" class="btn btn-sm btn-lime" data-act="visit">${TL.ui.icon('sparkle')}<span>${t('ficha.visit')}</span></button>` : ''}
      <button type="button" class="btn btn-sm" data-act="tour">${TL.ui.icon('route')}<span>${t('ficha.addTour')}</span></button>
      <button type="button" class="btn btn-sm" data-act="print">${TL.ui.icon('print')}<span class="hide-sm">${t('ficha.print')}</span></button>`;
    return html`<header class="fh st" style="--i:0">
      <div class="fh-main">
        <div class="fh-logo">${TL.ui.logo(rec, 56)}</div>
        <div class="fh-id">
          <p class="fh-kick mono"><span>${t(isRep ? 'ficha.kind.rep' : 'ficha.kind.client')}</span><span class="fh-sep">/</span><span>${rec.id}</span>
            ${rec.isNew ? html`<span class="chip chip-new">${t('ui.newAI')}</span>` : ''}${isRep && rec.shortlist ? html`<span class="chip chip-lime">${t('ficha.shortlist')}</span>` : ''}</p>
          <h2 class="fh-name" id="ficha-title">${rec.name || rec.id}</h2>
          <p class="fh-loc">${TL.ui.flag(rec.country, 18)}<span>${place.join(' · ')}</span></p>
          <div class="fh-tags">${tags}</div>
        </div>
        <div class="fh-score">${TL.ui.ring({ score, tier, size: 64, animate: anim })}<span class="fh-score-l mono">${t(isRep ? 'ficha.fit' : 'ficha.score')}</span></div>
      </div>
      <div class="fh-actions">${actions}</div>
      <button type="button" class="icon-btn fh-close" data-act="close" aria-label="${t('ficha.close')}" title="${t('ficha.close')} (Esc)">${TL.ui.icon('close')}</button>
    </header>`;
  }
  function navBar(list, kind) {
    return html`<nav class="fnav st" style="--i:1" aria-label="${t('ficha.nav')}">${list.map(([k]) => {
      const label = NAV_LABEL[k] ? NAV_LABEL[k](kind) : t('sec.' + k);
      return html`<button type="button" data-act="nav" data-sec="${k}" aria-current="${k === 'summary' ? 'true' : 'false'}">${label}</button>`;
    })}<i class="fnav-ind" aria-hidden="true"></i></nav>`;
  }

  function build(rec, kind, anim) {
    const list = SECTIONS[kind];
    const fb = u.h('div.fb', { 'data-kind': kind, class: anim ? 'anim' : 'no-anim' });
    const secs = list.map(([k, fn], i) => String(fn(rec, i + 1))).join('');
    fb.innerHTML = `<p class="f-print-head mono">TRUMPF · Market Atlas LATAM — ${esc(TL.i18n.date(RESEARCHED))}</p>` +
      String(header(rec, kind, anim)) + String(navBar(list, kind)) +
      `<div class="ficha-scroll" tabindex="-1"><div class="fs-wrap">${secs}</div>
       <footer class="f-foot mono"><span>TRUMPF · Market Atlas LATAM</span><span>${esc(rec.id)}</span><span>${esc(t('src.researched', { d: TL.i18n.date(RESEARCHED) }))}</span></footer></div>`;
    return fb;
  }

  /* ── Montaje: scrollspy, revelado por sección, mini-mapa ────────────── */
  function wire(fb, anim) {
    const sc = fb.querySelector('.ficha-scroll');
    const secs = [...fb.querySelectorAll('.fs')];
    const vis = new Map();
    const atBottom = () => sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 6;
    const pickActive = () => {
      if (Date.now() < state.lock) return;
      let k = secs.find((s) => vis.get(s.dataset.sec))?.dataset.sec;
      if (atBottom()) k = secs[secs.length - 1]?.dataset.sec;
      if (k && k !== state.active) setActive(k);
    };
    const spy = new IntersectionObserver((ents) => { ents.forEach((e) => vis.set(e.target.dataset.sec, e.isIntersecting)); pickActive(); },
      { root: sc, rootMargin: '-6% 0px -62% 0px', threshold: 0 });
    const rev = new IntersectionObserver((ents) => ents.forEach((e) => {
      if (!e.isIntersecting) return;
      rev.unobserve(e.target);
      onReveal(fb, e.target);
    }), { root: sc, rootMargin: '0px 0px -6% 0px', threshold: 0 });
    secs.forEach((s) => {
      spy.observe(s);
      if (!anim && state.seen.has(s.dataset.sec)) { s.classList.add('is-in'); finalize(s); if (s.dataset.sec === 'location') requestAnimationFrame(() => mountMap(fb)); } else rev.observe(s);
    });
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const y = sc.scrollTop;
        if (y > 56 && !fb.classList.contains('is-condensed')) fb.classList.add('is-condensed');
        else if (y < 6 && fb.classList.contains('is-condensed')) fb.classList.remove('is-condensed');
        if (atBottom()) pickActive();
      });
    };
    sc.addEventListener('scroll', onScroll, { passive: true });
    const nav = fb.querySelector('.fnav');
    nav?.addEventListener('scroll', () => navEdges(nav), { passive: true });
    // Prefetch del mini-mapa cuando Ubicación se acerca a la vista
    const locSec = fb.querySelector('#fs-location');
    const pre = locSec ? new IntersectionObserver((ents) => { if (ents.some((e) => e.isIntersecting)) { pre.disconnect(); mountMap(fb); } }, { root: sc, rootMargin: '0px 0px 45% 0px' }) : null;
    if (pre) pre.observe(locSec);
    fb._off = () => { spy.disconnect(); rev.disconnect(); pre?.disconnect(); sc.removeEventListener('scroll', onScroll); };
    if (anim) TL.ui.reveal(fb.querySelector('.fh'));
    else finalize(fb.querySelector('.fh'));
    fillCrm(fb, state.id);
    requestAnimationFrame(() => moveInd(fb, false));
  }
  /** Sin animación: anillos y contadores directo en su valor final. */
  function finalize(scope) {
    if (!scope) return;
    if (scope.classList.contains('fs')) scope.classList.add('is-static', 'is-in');
    scope.querySelectorAll('.ring-fg[data-off]').forEach((c) => { c.style.transition = 'none'; c.style.strokeDashoffset = c.dataset.off; });
    scope.querySelectorAll('[data-count]').forEach((el) => { el.textContent = TL.i18n.int(+el.dataset.count); });
  }
  function onReveal(fb, s) {
    const k = s.dataset.sec, seen = state.seen.has(k);
    state.seen.add(k);
    s.classList.add('is-in');
    if (k === 'location') mountMap(fb);
    if (k === 'score') { if (seen) finalize(s); else TL.ui.reveal(s); }
  }
  function teardown(fb) {
    if (!fb) return;
    try { fb._off?.(); } catch (e) { /* noop */ }
    fb._off = null;
    if (state.mini) { try { state.mini.destroy(); } catch (e) { /* noop */ } state.mini = null; }
  }

  function setActive(k, instant) {
    state.active = k;
    const fb = cur(); if (!fb) return;
    fb.querySelectorAll('.fnav button').forEach((b) => b.setAttribute('aria-current', b.dataset.sec === k ? 'true' : 'false'));
    moveInd(fb, !instant);
  }
  function moveInd(fb, animate) {
    const nav = fb.querySelector('.fnav'), ind = fb.querySelector('.fnav-ind');
    const b = nav?.querySelector(`button[data-sec="${state.active}"]`) || nav?.querySelector('button');
    if (!b || !ind) return;
    if (!animate) ind.style.transition = 'none';
    ind.style.width = b.offsetWidth + 'px';
    ind.style.transform = `translateX(${b.offsetLeft}px)`;
    if (!animate) { void ind.offsetWidth; ind.style.transition = ''; }
    const target = b.offsetLeft - (nav.clientWidth - b.offsetWidth) / 2;
    if (nav.scrollWidth > nav.clientWidth) nav.scrollTo({ left: Math.max(0, target), behavior: animate && !TL.reduceMotion ? 'smooth' : 'auto' });
    navEdges(nav);
  }
  function navEdges(nav) {
    const over = nav.scrollWidth > nav.clientWidth + 2;
    nav.classList.toggle('is-over', over);
    nav.classList.toggle('at-start', over && nav.scrollLeft < 4);
    nav.classList.toggle('at-end', over && nav.scrollLeft > nav.scrollWidth - nav.clientWidth - 4);
  }
  function scrollToSec(k, instant) {
    const fb = cur(); if (!fb) return;
    const sc = fb.querySelector('.ficha-scroll'), s = fb.querySelector('#fs-' + k);
    if (!s || !sc) return;
    state.lock = Date.now() + (instant || TL.reduceMotion ? 120 : 800);
    setActive(k);
    sc.scrollTo({ top: Math.max(0, s.offsetTop - 6), behavior: instant || TL.reduceMotion ? 'auto' : 'smooth' });
  }

  /* ── Ubicación: mini-mapa MapLibre o Google Maps embebido ───────────── */
  function mountMap(fb) {
    const box = fb.querySelector('.loc-map');
    if (!box || box._mounted) return;
    box._mounted = true;
    applyLoc(fb);
  }
  function applyLoc(fb) {
    const box = fb.querySelector('.loc-map');
    if (!box || !box._mounted) return;
    const [lat, lng] = box.dataset.ll.split(',').map(Number);
    const L = state.loc;
    if (L.src === 'atlas' && (typeof TL.map?.createMini !== 'function' || !window.maplibregl)) L.src = 'google';
    box.dataset.src = L.src;
    fb.querySelectorAll('[data-act="loc-src"]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === L.src)));
    fb.querySelectorAll('[data-act="loc-mode"]').forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.v === 'sat') === L.sat)));
    if (L.src === 'atlas') {
      if (!state.mini) {
        try { state.mini = TL.map.createMini(box.querySelector('.loc-mini'), { lng, lat, zoom: 15, satellite: L.sat }); }
        catch (e) { console.warn('[ficha] mini-mapa', e); state.mini = null; L.src = 'google'; box.classList.add('mini-off'); return applyLoc(fb); }
      } else state.mini.setSatellite(L.sat);
      requestAnimationFrame(() => state.mini?.resize());
    } else {
      const g = box.querySelector('.loc-gmap');
      const src = `https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed${L.sat ? '&t=k' : ''}`;
      let f = g.querySelector('iframe');
      if (!f) {
        f = document.createElement('iframe');
        f.setAttribute('loading', 'lazy');
        f.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
        f.setAttribute('title', 'Google Maps');
        f.setAttribute('allowfullscreen', '');
        g.appendChild(f);
      }
      if (f.getAttribute('src') !== src) f.setAttribute('src', src);
    }
  }

  /* ── Acciones (delegación) ──────────────────────────────────────────── */
  function onClick(e) {
    const b = e.target.closest('[data-act]');
    if (!b || !root().contains(b)) return;
    const act = b.dataset.act, rec = recNow(), fb = cur();
    switch (act) {
      case 'close': F.close(); break;
      case 'visit':
        if (TL.ai && typeof TL.ai.visit === 'function') TL.ai.visit(state.id);
        else TL.ui.toast(t('ficha.aiOffline'), { kind: 'warn' });
        break;
      case 'tour':
        if (TL.planner && typeof TL.planner.add === 'function') TL.planner.add(state.id);
        else TL.ui.toast(t('ficha.plannerOff'), { kind: 'warn' });
        break;
      case 'print': doPrint(); break;
      case 'nav': scrollToSec(b.dataset.sec); break;
      case 'loc-src': state.loc.src = b.dataset.v; applyLoc(fb); break;
      case 'loc-mode': state.loc.sat = b.dataset.v === 'sat'; applyLoc(fb); break;
      case 'copy': {
        const v = b.dataset.v || '';
        Promise.resolve(u.copy(v)).then((ok) => {
          TL.ui.toast(ok ? t('ct.copied', { x: v.length > 48 ? v.slice(0, 46) + '…' : v }) : t('ct.copyFail'), { kind: ok ? 'info' : 'warn' });
          if (ok) { b.classList.add('is-done'); setTimeout(() => b.classList.remove('is-done'), 1200); }
        });
        break;
      }
      case 'vcard': if (rec) vcard(rec); break;
      case 'prod-zoom': {
        const items = arr(rec?.products).filter((p) => imgSrc(p.image)).map((p) => ({ src: imgSrc(p.image), caption: [nameOf(p), pick(p, 'detail')].filter(Boolean).join(' — ') }));
        lightbox(items, +b.dataset.i || 0);
        break;
      }
      case 'gal': if (rec) lightbox(galleryOf(rec), +b.dataset.i || 0); break;
      default: break;
    }
  }
  function lightbox(items, i) {
    if (!items.length) return;
    if (TL.ui.lightbox && typeof TL.ui.lightbox.open === 'function') TL.ui.lightbox.open(items, i);
    else window.open(items[i]?.src || items[0].src, '_blank', 'noopener');
  }
  /** Imagen rota → placeholder elegante con ícono. */
  function onImgError(e) {
    const img = e.target;
    if (!img || img.tagName !== 'IMG' || !img.dataset.ph || !root()?.contains(img)) return;
    const holder = img.closest('.tf-img, .pc-fig, .gal-it');
    if (!holder) return;
    if (holder.classList.contains('gal-it')) { holder.remove(); return; }
    holder.classList.add('is-ph');
    if (holder.tagName === 'BUTTON') { holder.disabled = true; holder.removeAttribute('data-act'); }
    img.insertAdjacentHTML('afterend', `<span class="ph-ico">${ico(img.dataset.ph)}</span>`);
    img.remove();
  }

  function doPrint() {
    const fb = cur(); if (!fb) return;
    fb.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; });
    fb.querySelectorAll('.fs:not(.is-in)').forEach((s) => finalize(s));
    document.body.classList.add('ficha-printing');
    const done = () => { document.body.classList.remove('ficha-printing'); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    setTimeout(() => { try { window.print(); } finally { setTimeout(done, 300); } }, 60);
  }

  const pushEsc = (fn) => {
    if (typeof TL.ui.escPush === 'function') return TL.ui.escPush(fn);
    const h = (e) => { if (e.key === 'Escape' && !e.defaultPrevented) fn(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  };

  /* ── Apertura / cierre / crossfade ──────────────────────────────────── */
  function ensureShell(el) {
    if (el._ready) return;
    el._ready = true;
    el.classList.add('ficha');
    el.innerHTML = '<i class="ficha-laser" aria-hidden="true"></i><i class="ficha-beam" aria-hidden="true"></i><div class="ficha-stack"></div>';
    el.setAttribute('aria-labelledby', 'ficha-title');
    el.addEventListener('click', onClick);
    el.addEventListener('error', onImgError, true);
  }
  function swap(fb, mode) {
    const stack = root().querySelector('.ficha-stack');
    stack.querySelectorAll('.fb.is-out').forEach((x) => x.remove());
    const old = stack.querySelector('.fb');
    if (old) {
      teardown(old);
      if (mode === 'cross' && !TL.reduceMotion) { old.classList.add('is-out'); old.setAttribute('aria-hidden', 'true'); setTimeout(() => old.remove(), 280); }
      else old.remove();
    }
    stack.appendChild(fb);
    wire(fb, mode !== 'none');
  }
  function sweep(el) {
    if (TL.reduceMotion) return;
    el.classList.remove('sweep'); void el.offsetWidth; el.classList.add('sweep');
  }

  F.open = function (id, opts = {}) {
    // También acepta un registro suelto (p. ej. empresa investigada por la IA aún no agregada al mapa)
    const loose = id && typeof id === 'object' ? id : null;
    if (loose) { if (!loose.id) loose.id = 'NEW-' + Math.random().toString(36).slice(2, 7).toUpperCase(); id = loose.id; }
    const hit = TL.data.get(id) || (loose ? { kind: opts.kind === 'rep' ? 'rep' : 'client', rec: loose } : null);
    const el = root();
    if (!el || !hit || (hit.kind !== 'client' && hit.kind !== 'rep')) return false;
    ensureShell(el);
    if (state.open && state.id === id) { if (opts.section) scrollToSec(opts.section); return true; }
    const wasOpen = state.open;
    state.id = id; state.kind = hit.kind; state.rec = hit.rec; state.active = 'summary'; state.seen = new Set();
    state.loc = { src: state.loc.src === 'google' && !window.maplibregl ? 'google' : 'atlas', sat: false };
    swap(build(hit.rec, hit.kind, true), wasOpen ? 'cross' : 'enter');
    el.setAttribute('aria-label', hit.rec.name || id);
    sweep(el);
    if (!wasOpen) {
      state.lastFocus = document.activeElement;
      state.open = true;
      el.setAttribute('aria-hidden', 'false');
      el.classList.add('is-open');
      document.body.classList.add('ficha-open');
      state.escOff = pushEsc(() => F.close());
      setTimeout(() => { if (state.open) el.focus({ preventScroll: true }); }, 80);
    }
    TL.set({ selected: { kind: hit.kind, id } });
    TL.map?.setPadding?.();
    TL.emit('ficha:open', id);
    if (opts.section) setTimeout(() => scrollToSec(opts.section), wasOpen ? 60 : 380);
    return true;
  };

  F.close = function () {
    if (!state.open) return;
    const el = root(), id = state.id;
    state.open = false;
    teardown(cur());
    el.classList.remove('is-open', 'sweep');
    el.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('ficha-open', 'ficha-printing');
    state.escOff?.(); state.escOff = null;
    state.id = null; state.kind = null; state.rec = null;
    TL.set({ selected: null });
    TL.map?.setPadding?.();
    TL.emit('ficha:close', id);
    setTimeout(() => { if (!state.open) el.querySelector('.ficha-stack')?.replaceChildren(); }, 520);
    const lf = state.lastFocus; state.lastFocus = null;
    if (lf && lf.isConnected && typeof lf.focus === 'function' && !el.contains(lf)) { try { lf.focus({ preventScroll: true }); } catch (e) { /* noop */ } }
  };
  F.isOpen = () => state.open;
  F.current = () => (state.open ? { id: state.id, kind: state.kind } : null);

  /** Re-render en el lugar (idioma / datos): conserva scroll, sección activa y modo de mapa. */
  function rerender() {
    if (!state.open) return;
    const hit = TL.data.get(state.id) || (state.rec ? { kind: state.kind, rec: state.rec } : null);
    if (!hit) { F.close(); return; }
    state.rec = hit.rec;
    const old = cur();
    const sc = old?.querySelector('.ficha-scroll');
    const top = sc ? sc.scrollTop : 0, condensed = old?.classList.contains('is-condensed');
    const active = state.active;
    const fb = build(hit.rec, hit.kind, false);
    if (condensed) fb.classList.add('is-condensed');
    swap(fb, 'none');
    const nsc = fb.querySelector('.ficha-scroll');
    state.lock = Date.now() + 250;
    nsc.scrollTop = top;
    state.active = active;
    setActive(active, true);
    root().setAttribute('aria-label', hit.rec.name || state.id);
  }
  TL.on('lang', rerender);
  TL.on('data:changed', rerender);
  window.addEventListener('resize', u.debounce(() => { const fb = cur(); if (fb && state.open) { moveInd(fb, false); state.mini?.resize(); } }, 120));
})();
