/* ==========================================================================
   tl-gtm.js — Go-to-Market LATAM: página editorial a pantalla completa
   (overlay del núcleo). Contenido desde TL.data.gtm si existe; si no, datos
   calculados de TL_DATA + textos provisorios marcados "Borrador"/"Entwurf".
   API: window.TL_GTM = { open(section?), close(), sections() }
   ========================================================================== */
(function () {
  'use strict';
  const { u } = TL;
  const html = u.html, raw = u.raw;
  const t = (k, v) => TL.i18n.t(k, v);
  const I = TL.i18n;

  /* ── Diccionario ES / DE ─────────────────────────────────────────────── */
  I.extend({
    es: {
      'gtm.kicker': 'Go-to-Market LATAM',
      'gtm.ovTitle': 'Plan de entrada comercial 2026–2028',
      'gtm.cover.kicker': 'Plan de entrada comercial · 2026–2028',
      'gtm.cover.title1': 'Go-to-Market',
      'gtm.cover.title2': 'LATAM',
      'gtm.cover.lead': 'Dónde, con quién y en qué orden ampliar la venta de máquinas TRUMPF para chapa en América Latina, fuera de México y Brasil. Basado en {n} empresas relevadas, {r} representantes evaluados y {o} proyectos de inversión.',
      'gtm.cover.by': 'Elaborado por',
      'gtm.cover.date': 'Estado',
      'gtm.cover.scope': 'Alcance',
      'gtm.cover.scopeV': '{n} países objetivo',
      'gtm.cover.photo': 'TruLaser Serie 5000 · Foto: TRUMPF',
      'gtm.draft': 'Borrador',
      'gtm.draftTip': 'Texto provisorio: se reemplaza por la versión final del plan.',
      'gtm.print': 'Imprimir',
      'gtm.toc': 'Contenido',
      'gtm.toMap': 'Ver en el mapa',
      'gtm.open': 'Abrir ficha',
      'gtm.s.summary': 'Resumen ejecutivo',
      'gtm.s.matrix': 'Matriz de priorización',
      'gtm.s.countries': 'Prioridades por país',
      'gtm.s.phases': 'Etapas del plan',
      'gtm.s.reps': 'Estrategia de representantes',
      'gtm.s.accounts': 'Cuentas clave',
      'gtm.s.competition': 'Posicionamiento competitivo',
      'gtm.s.goals': 'Metas e indicadores',
      'gtm.s.next': 'Próximos pasos',
      'gtm.k.clients': 'Clientes potenciales',
      'gtm.k.clientsS': 'empresas que procesan chapa o tubo',
      'gtm.k.a': 'Prioridad A',
      'gtm.k.aS': '{p} del total',
      'gtm.k.reps': 'Representantes evaluados',
      'gtm.k.repsS': 'en shortlist: {n}',
      'gtm.k.opps': 'Proyectos en el radar',
      'gtm.k.oppsS': '{usd} de inversión anunciada',
      'gtm.k.countries': 'Países con datos',
      'gtm.k.countriesS': 'de {n} países objetivo',
      'gtm.sum.head': '{list} concentran el {p} de los prospectos A.',
      'gtm.sum.headAll': '{list} concentran el {p} de los prospectos.',
      'gtm.sum.head1': '{list} concentra el {p} de los prospectos A.',
      'gtm.sum.headAll1': '{list} concentra el {p} de los prospectos.',
      'gtm.sum.headNone': 'El relevamiento está en curso: los prospectos se suman a medida que se publican las fichas.',
      'gtm.sum.p1': 'TRUMPF atiende la región con filiales propias en {subs} y con representantes en {reps}. En el resto de los países objetivo no se encontró un canal confirmado de venta de máquinas.',
      'gtm.sum.p2': 'El relevamiento identificó {n} empresas que procesan chapa o tubo en volumen; {a} califican como prioridad A por encaje sectorial, tamaño y necesidad de renovación. En {cm} de ellas hay evidencia de máquinas de la competencia o corte térmico: una base instalada que se puede reemplazar.',
      'gtm.sum.p3': 'La recomendación es secuenciar: primero los mercados con prospectos A y algún acceso («Atacar ya»); en paralelo, construir el canal donde el potencial supera la cobertura actual («Construir canal»); el resto se atiende de forma oportunista desde los países vecinos.',
      'gtm.facts': 'TRUMPF en cifras',
      'gtm.factsSrc': 'Fuente: TRUMPF, perfil de la empresa y comunicado de prensa del 22/07/2026. Cifras 2025/26 preliminares; las definitivas se publican el 15/10/2026.',
      'gtm.m.lead': 'Cada país se ubica según el potencial relevado y el acceso comercial que existe hoy. Los cuadrantes separan dónde conviene vender ya y dónde primero hay que construir el canal.',
      'gtm.m.x': 'Cobertura y acceso actual',
      'gtm.m.y': 'Potencial',
      'gtm.m.low': 'bajo',
      'gtm.m.high': 'alto',
      'gtm.q.attack': 'Atacar ya',
      'gtm.q.build': 'Construir canal',
      'gtm.q.opp': 'Oportunista',
      'gtm.q.watch': 'Monitorear',
      'gtm.m.formula': 'Potencial = 3 × prospectos A + 2 × B + 1 × C + potencial de mercado (alto 6 · medio 4 · bajo 2). Acceso = 2 × representantes en shortlist + presencia TRUMPF (filial 3 · representante 2) + distribuidores de la competencia detectados. Tamaño del círculo = número de prospectos.',
      'gtm.m.tipN': '{n} prospectos · A {a} · B {b} · C {c}',
      'gtm.m.tipAcc': 'Shortlist: {s} · Distribuidores competencia: {d}',
      'gtm.m.tipClick': 'Clic para ver el país en el mapa',
      'gtm.m.empty': 'Sin datos suficientes para ubicar países todavía.',
      'gtm.pres.subsidiary': 'Filial TRUMPF',
      'gtm.pres.representative': 'Representante TRUMPF',
      'gtm.pres.none': 'Sin canal TRUMPF',
      'gtm.c.lead': 'Los seis países con mayor potencial, con su composición de prospectos, los rubros dominantes y el socio comercial candidato.',
      'gtm.c.country': 'País',
      'gtm.c.prospects': 'Prospectos',
      'gtm.c.sectors': 'Rubros principales',
      'gtm.c.rep': 'Representante candidato',
      'gtm.c.market': 'Dato de mercado',
      'gtm.c.tbd': 'A definir',
      'gtm.c.existing': 'actual',
      'gtm.c.mfg': 'Manufactura {p} del PIB',
      'gtm.c.laser': 'import. láser {usd} ({y})',
      'gtm.c.gdp': 'PIB {usd}',
      'gtm.p.lead': 'Cuatro etapas en 24 meses, cada una con un entregable que habilita la siguiente.',
      'gtm.p.months': 'meses',
      'gtm.p1.t': 'Validar',
      'gtm.p1.i': 'Revisar matriz y top 20 con el equipo de ventas de TRUMPF|Primeras entrevistas con los representantes de la shortlist|Visitas de diagnóstico a cuentas A de los países «Atacar ya»',
      'gtm.p2.t': 'Activar',
      'gtm.p2.i': 'Acuerdos de representación con uno o dos socios|Formación comercial y técnica de los representantes|Visitas de referencia a clientes TRUMPF y demostraciones',
      'gtm.p3.t': 'Convertir',
      'gtm.p3.i': 'Primeras cotizaciones formales y pedidos|Esquema de financiación y servicio local definido|Presencia en las ferias del sector',
      'gtm.p4.t': 'Escalar',
      'gtm.p4.i': 'Extender el modelo a los países «Construir canal»|Servicio técnico local con stock de repuestos|Casos de referencia publicados en la región',
      'gtm.p.fairs': 'Ferias relevantes (inteligencia de país)',
      'gtm.r.lead': 'Una máquina TRUMPF cuesta entre USD 150.000 y 1,5 millones: el representante tiene que acompañar una venta técnica larga y sostener el servicio después de la instalación. Por eso se priorizan importadores de bienes de capital complementarios —mecanizado CNC, soldadura, automatización— con taller y técnicos propios, y sin marcas que compitan en chapa.',
      'gtm.r.model': 'Modelo de canal',
      'gtm.r.m': 'Un representante por país en los mercados con masa crítica|Un socio regional para Centroamérica, con cobertura de Guatemala a Panamá|Soporte de aplicación y servicio desde las filiales TRUMPF de la región|Exclusividad sujeta a metas anuales de visitas y cotizaciones',
      'gtm.r.criteria': 'Criterios de idoneidad (puntos sobre 100)',
      'gtm.r.short': 'Shortlist actual',
      'gtm.r.none': 'Todavía no hay representantes en la shortlist.',
      'gtm.r.name': 'Representante',
      'gtm.r.fit': 'Idoneidad',
      'gtm.r.brands': 'Marcas representadas',
      'gtm.r.service': 'Servicio',
      'gtm.r.techs': 'técnicos',
      'gtm.r.workshop': 'taller',
      'gtm.r.parts': 'repuestos',
      'gtm.rc.portfolio_fit': 'Afinidad de portafolio',
      'gtm.rc.service': 'Servicio técnico',
      'gtm.rc.scale': 'Escala y solidez',
      'gtm.rc.market_access': 'Acceso al mercado',
      'gtm.rc.no_conflict': 'Sin conflicto de marcas',
      'gtm.a.lead': 'Las 20 empresas con mayor puntaje del relevamiento. Clic en una fila para abrir la ficha en el mapa.',
      'gtm.a.company': 'Empresa',
      'gtm.a.sector': 'Rubro',
      'gtm.a.fit': 'Recomendación TRUMPF',
      'gtm.a.score': 'Puntaje',
      'gtm.a.none': 'Sin empresas publicadas todavía.',
      'gtm.x.lead': 'Máquinas detectadas en webs, fotos, videos y avisos de empleo de los prospectos, agrupadas por origen de la marca. Solo se cuentan las que tienen evidencia.',
      'gtm.x.total': '{n} máquinas con evidencia en {c} empresas',
      'gtm.x.none': 'Todavía no hay máquinas detectadas.',
      'gtm.x.args': 'Argumentario',
      'gtm.x.china.t': 'Frente a fabricantes chinos',
      'gtm.x.china': 'Ganan por precio de compra y plazo de entrega. El argumento TRUMPF es el costo por pieza a lo largo de la vida útil: disponibilidad, calidad de corte constante, servicio y repuestos respaldados por el fabricante y mayor valor de reventa.',
      'gtm.x.turkey.t': 'Frente a fabricantes turcos',
      'gtm.x.turkey': 'Fuertes en plegadoras y cizallas de gama media con buena relación precio-prestación. TRUMPF se diferencia por precisión de ángulo, cambio de herramienta automatizado y productividad por turno, sobre todo con lotes variables.',
      'gtm.x.japan.t': 'Frente a fabricantes japoneses',
      'gtm.x.japan': 'Competidor premium con canal propio y base instalada en varios países. La diferencia está en la amplitud del portafolio —láser 2D y 3D, punzonado, combinadas, plegado, tubo y soldadura láser—, la fuente láser de desarrollo propio y la automatización integrada.',
      'gtm.x.europe.t': 'Frente a otros fabricantes europeos',
      'gtm.x.europe': 'Mismo segmento de precio y argumentos parecidos. Decide la cercanía: tiempo de respuesta del servicio, ingeniería de aplicaciones local y software de programación y producción de un solo proveedor.',
      'gtm.x.thermal.t': 'Frente al corte térmico',
      'gtm.x.thermal': 'Para quien corta chapa fina y media con plasma u oxicorte, o terceriza el corte, el láser de fibra reduce retrabajo, mejora el borde y permite volver a fabricar en casa piezas que hoy se compran afuera.',
      'gtm.x.photo': 'TruMatic 5000 con automatización de carga y descarga · Foto: TRUMPF',
      'gtm.g.lead': 'Metas iniciales para discutir, calculadas sobre la base actual de prospectos (primer ejercicio: dos visitas por cuenta A, una por cuenta B y una cada cuatro cuentas C). Se ajustan una vez acordados territorio y representantes.',
      'gtm.g.metric': 'Indicador',
      'gtm.g.y1': 'Ejercicio 2026/27',
      'gtm.g.y2': 'Ejercicio 2027/28',
      'gtm.g.visits': 'Visitas comerciales',
      'gtm.g.demos': 'Demostraciones',
      'gtm.g.quotes': 'Cotizaciones formales',
      'gtm.g.machines': 'Máquinas vendidas',
      'gtm.g.partners': 'Representantes activos',
      'gtm.g.note': 'Ejercicio fiscal de TRUMPF: julio a junio.',
      'gtm.n.i': 'Revisar este plan con el área de ventas internacionales de TRUMPF y fijar los países del primer año|Contactar a los representantes de la shortlist y validar interés, exclusividad y capacidad de servicio|Agendar visitas a las diez primeras cuentas del top 20|Definir la oferta de financiación y las condiciones de entrega para la región|Mantener el atlas vivo: radar de inversiones y seguimiento comercial semanal',
      'gtm.end.t': 'Hablemos.',
      'gtm.end.p': 'Este plan es un punto de partida. Con el equipo de TRUMPF se convierte en un presupuesto, un territorio y una agenda.',
      'gtm.end.role': 'Autor del relevamiento y del plan',
      'gtm.more': 'Más',
    },
    de: {
      'gtm.kicker': 'Go-to-Market LATAM',
      'gtm.ovTitle': 'Markteintrittsplan 2026–2028',
      'gtm.cover.kicker': 'Markteintrittsplan · 2026–2028',
      'gtm.cover.title1': 'Go-to-Market',
      'gtm.cover.title2': 'LATAM',
      'gtm.cover.lead': 'Wo, mit wem und in welcher Reihenfolge TRUMPF den Vertrieb von Blechbearbeitungsmaschinen in Lateinamerika – außerhalb Mexikos und Brasiliens – ausbauen kann. Grundlage: {n} untersuchte Unternehmen, {r} bewertete Vertriebspartner und {o} Investitionsprojekte.',
      'gtm.cover.by': 'Erstellt von',
      'gtm.cover.date': 'Stand',
      'gtm.cover.scope': 'Umfang',
      'gtm.cover.scopeV': '{n} Zielländer',
      'gtm.cover.photo': 'TruLaser Serie 5000 · Foto: TRUMPF',
      'gtm.draft': 'Entwurf',
      'gtm.draftTip': 'Vorläufiger Text – wird durch die finale Fassung des Plans ersetzt.',
      'gtm.print': 'Drucken',
      'gtm.toc': 'Inhalt',
      'gtm.toMap': 'Auf der Karte zeigen',
      'gtm.open': 'Profil öffnen',
      'gtm.s.summary': 'Management Summary',
      'gtm.s.matrix': 'Priorisierungsmatrix',
      'gtm.s.countries': 'Prioritäten nach Ländern',
      'gtm.s.phases': 'Phasen des Plans',
      'gtm.s.reps': 'Vertriebspartnerstrategie',
      'gtm.s.accounts': 'Schlüsselkunden',
      'gtm.s.competition': 'Wettbewerbsposition',
      'gtm.s.goals': 'Ziele und Kennzahlen',
      'gtm.s.next': 'Nächste Schritte',
      'gtm.k.clients': 'Potenzielle Kunden',
      'gtm.k.clientsS': 'Unternehmen der Blech- und Rohrbearbeitung',
      'gtm.k.a': 'Priorität A',
      'gtm.k.aS': '{p} der Gesamtzahl',
      'gtm.k.reps': 'Bewertete Vertriebspartner',
      'gtm.k.repsS': 'auf der Shortlist: {n}',
      'gtm.k.opps': 'Projekte im Radar',
      'gtm.k.oppsS': '{usd} angekündigte Investitionen',
      'gtm.k.countries': 'Länder mit Daten',
      'gtm.k.countriesS': 'von {n} Zielländern',
      'gtm.sum.head': '{list} vereinen {p} der A-Kandidaten.',
      'gtm.sum.headAll': '{list} vereinen {p} der Kandidaten.',
      'gtm.sum.head1': '{list} vereint {p} der A-Kandidaten.',
      'gtm.sum.headAll1': '{list} vereint {p} der Kandidaten.',
      'gtm.sum.headNone': 'Die Erhebung läuft: Kandidaten kommen hinzu, sobald die Profile veröffentlicht sind.',
      'gtm.sum.p1': 'TRUMPF ist in der Region mit eigenen Tochtergesellschaften in {subs} und mit Vertretungen in {reps} präsent. In den übrigen Zielländern wurde kein bestätigter Vertriebskanal für Maschinen gefunden.',
      'gtm.sum.p2': 'Die Erhebung identifiziert {n} Unternehmen, die Blech oder Rohr in relevanten Mengen verarbeiten; {a} erreichen Priorität A – aufgrund von Branchenfit, Größe und Modernisierungsbedarf. Bei {cm} davon sind Wettbewerbsmaschinen oder thermisches Trennen nachgewiesen: eine installierte Basis, die sich ablösen lässt.',
      'gtm.sum.p3': 'Empfehlung: schrittweise vorgehen. Zuerst die Märkte mit A-Kandidaten und vorhandenem Zugang („Jetzt angreifen“); parallel den Vertriebskanal dort aufbauen, wo das Potenzial die heutige Abdeckung übersteigt („Kanal aufbauen“); die übrigen Länder opportunistisch aus den Nachbarmärkten betreuen.',
      'gtm.facts': 'TRUMPF in Zahlen',
      'gtm.factsSrc': 'Quelle: TRUMPF, Unternehmensprofil und Pressemitteilung vom 22.07.2026. Zahlen 2025/26 vorläufig; die endgültigen Werte erscheinen am 15.10.2026.',
      'gtm.m.lead': 'Jedes Land ist nach erhobenem Potenzial und heutigem Marktzugang positioniert. Die Quadranten zeigen, wo sich sofortiger Vertrieb lohnt und wo zuerst der Kanal aufgebaut werden muss.',
      'gtm.m.x': 'Heutige Abdeckung und Marktzugang',
      'gtm.m.y': 'Potenzial',
      'gtm.m.low': 'niedrig',
      'gtm.m.high': 'hoch',
      'gtm.q.attack': 'Jetzt angreifen',
      'gtm.q.build': 'Kanal aufbauen',
      'gtm.q.opp': 'Opportunistisch',
      'gtm.q.watch': 'Beobachten',
      'gtm.m.formula': 'Potenzial = 3 × A-Kandidaten + 2 × B + 1 × C + Marktpotenzial (hoch 6 · mittel 4 · niedrig 2). Zugang = 2 × Partner auf der Shortlist + TRUMPF-Präsenz (Tochtergesellschaft 3 · Vertretung 2) + erkannte Händler des Wettbewerbs. Kreisgröße = Anzahl der Kandidaten.',
      'gtm.m.tipN': '{n} Kandidaten · A {a} · B {b} · C {c}',
      'gtm.m.tipAcc': 'Shortlist: {s} · Händler Wettbewerb: {d}',
      'gtm.m.tipClick': 'Klick zeigt das Land auf der Karte',
      'gtm.m.empty': 'Noch nicht genügend Daten, um Länder zu positionieren.',
      'gtm.pres.subsidiary': 'TRUMPF-Tochtergesellschaft',
      'gtm.pres.representative': 'TRUMPF-Vertretung',
      'gtm.pres.none': 'Kein TRUMPF-Kanal',
      'gtm.c.lead': 'Die sechs Länder mit dem höchsten Potenzial – mit Kandidatenstruktur, führenden Branchen und möglichem Vertriebspartner.',
      'gtm.c.country': 'Land',
      'gtm.c.prospects': 'Kandidaten',
      'gtm.c.sectors': 'Hauptbranchen',
      'gtm.c.rep': 'Partnerkandidat',
      'gtm.c.market': 'Marktdaten',
      'gtm.c.tbd': 'Offen',
      'gtm.c.existing': 'bestehend',
      'gtm.c.mfg': 'Industrie {p} des BIP',
      'gtm.c.laser': 'Laserimporte {usd} ({y})',
      'gtm.c.gdp': 'BIP {usd}',
      'gtm.p.lead': 'Vier Phasen in 24 Monaten; jede liefert ein Ergebnis, das die nächste ermöglicht.',
      'gtm.p.months': 'Monate',
      'gtm.p1.t': 'Validieren',
      'gtm.p1.i': 'Matrix und Top 20 mit dem TRUMPF-Vertrieb abstimmen|Erstgespräche mit den Partnern der Shortlist|Diagnosebesuche bei A-Kunden in den Ländern „Jetzt angreifen“',
      'gtm.p2.t': 'Aktivieren',
      'gtm.p2.i': 'Vertretungsverträge mit ein bis zwei Partnern|Vertriebs- und Technikschulung der Partner|Referenzbesuche bei TRUMPF-Kunden und Vorführungen',
      'gtm.p3.t': 'Abschließen',
      'gtm.p3.i': 'Erste formelle Angebote und Aufträge|Finanzierungsmodell und lokaler Service festgelegt|Präsenz auf den Branchenmessen',
      'gtm.p4.t': 'Skalieren',
      'gtm.p4.i': 'Modell auf die Länder „Kanal aufbauen“ übertragen|Lokaler technischer Service mit Ersatzteillager|Veröffentlichte Referenzfälle in der Region',
      'gtm.p.fairs': 'Relevante Messen (Länderanalyse)',
      'gtm.r.lead': 'Eine TRUMPF-Maschine kostet zwischen 150.000 und 1,5 Mio. USD: Der Partner muss einen langen, technischen Verkaufsprozess begleiten und nach der Installation den Service sicherstellen. Bevorzugt werden daher Importeure komplementärer Investitionsgüter – CNC-Zerspanung, Schweißtechnik, Automatisierung – mit eigener Werkstatt und eigenen Technikern und ohne konkurrierende Blechmarken.',
      'gtm.r.model': 'Kanalmodell',
      'gtm.r.m': 'Ein Partner pro Land in Märkten mit kritischer Masse|Ein regionaler Partner für Zentralamerika, von Guatemala bis Panama|Anwendungs- und Servicesupport durch die TRUMPF-Tochtergesellschaften der Region|Exklusivität gekoppelt an jährliche Ziele für Besuche und Angebote',
      'gtm.r.criteria': 'Eignungskriterien (Punkte von 100)',
      'gtm.r.short': 'Aktuelle Shortlist',
      'gtm.r.none': 'Noch keine Partner auf der Shortlist.',
      'gtm.r.name': 'Partner',
      'gtm.r.fit': 'Eignung',
      'gtm.r.brands': 'Vertretene Marken',
      'gtm.r.service': 'Service',
      'gtm.r.techs': 'Techniker',
      'gtm.r.workshop': 'Werkstatt',
      'gtm.r.parts': 'Ersatzteile',
      'gtm.rc.portfolio_fit': 'Portfoliopassung',
      'gtm.rc.service': 'Technischer Service',
      'gtm.rc.scale': 'Größe und Stabilität',
      'gtm.rc.market_access': 'Marktzugang',
      'gtm.rc.no_conflict': 'Keine Markenkonflikte',
      'gtm.a.lead': 'Die 20 Unternehmen mit der höchsten Bewertung. Ein Klick auf die Zeile öffnet das Profil auf der Karte.',
      'gtm.a.company': 'Unternehmen',
      'gtm.a.sector': 'Branche',
      'gtm.a.fit': 'TRUMPF-Empfehlung',
      'gtm.a.score': 'Score',
      'gtm.a.none': 'Noch keine veröffentlichten Unternehmen.',
      'gtm.x.lead': 'In Websites, Fotos, Videos und Stellenanzeigen der Kandidaten erkannte Maschinen, gruppiert nach Herkunft der Marke. Gezählt wird nur, was belegt ist.',
      'gtm.x.total': '{n} belegte Maschinen bei {c} Unternehmen',
      'gtm.x.none': 'Noch keine Maschinen erkannt.',
      'gtm.x.args': 'Argumentation',
      'gtm.x.china.t': 'Gegenüber chinesischen Herstellern',
      'gtm.x.china': 'Sie gewinnen über Anschaffungspreis und Lieferzeit. Das TRUMPF-Argument sind die Stückkosten über die Lebensdauer: Verfügbarkeit, gleichbleibende Schnittqualität, Service und Ersatzteile direkt vom Hersteller und ein höherer Wiederverkaufswert.',
      'gtm.x.turkey.t': 'Gegenüber türkischen Herstellern',
      'gtm.x.turkey': 'Stark bei Abkantpressen und Scheren der Mittelklasse mit gutem Preis-Leistungs-Verhältnis. TRUMPF punktet mit Winkelgenauigkeit, automatisiertem Werkzeugwechsel und Produktivität pro Schicht – besonders bei wechselnden Losgrößen.',
      'gtm.x.japan.t': 'Gegenüber japanischen Herstellern',
      'gtm.x.japan': 'Premium-Wettbewerber mit eigenem Vertrieb und installierter Basis in mehreren Ländern. Der Unterschied liegt in der Breite des Portfolios – 2D- und 3D-Laser, Stanzen, Kombimaschinen, Biegen, Rohr und Laserschweißen –, der selbst entwickelten Laserquelle und der integrierten Automatisierung.',
      'gtm.x.europe.t': 'Gegenüber anderen europäischen Herstellern',
      'gtm.x.europe': 'Gleiches Preissegment, ähnliche Argumente. Entscheidend ist die Nähe: Reaktionszeit im Service, lokale Anwendungstechnik sowie Programmier- und Fertigungssoftware aus einer Hand.',
      'gtm.x.thermal.t': 'Gegenüber thermischem Trennen',
      'gtm.x.thermal': 'Wer dünne und mittlere Bleche mit Plasma oder autogen schneidet oder das Schneiden zukauft, reduziert mit dem Faserlaser Nacharbeit, verbessert die Kantenqualität und holt zugekaufte Teile zurück in die eigene Fertigung.',
      'gtm.x.photo': 'TruMatic 5000 mit Be- und Entladeautomatisierung · Foto: TRUMPF',
      'gtm.g.lead': 'Erste Zielwerte zur Diskussion, berechnet auf Basis der aktuellen Kandidaten (erstes Geschäftsjahr: zwei Besuche je A-Kunde, einer je B-Kunde und einer je vier C-Kunden). Sie werden angepasst, sobald Gebiet und Partner feststehen.',
      'gtm.g.metric': 'Kennzahl',
      'gtm.g.y1': 'GJ 2026/27',
      'gtm.g.y2': 'GJ 2027/28',
      'gtm.g.visits': 'Kundenbesuche',
      'gtm.g.demos': 'Vorführungen',
      'gtm.g.quotes': 'Formelle Angebote',
      'gtm.g.machines': 'Verkaufte Maschinen',
      'gtm.g.partners': 'Aktive Vertriebspartner',
      'gtm.g.note': 'TRUMPF-Geschäftsjahr: Juli bis Juni.',
      'gtm.n.i': 'Diesen Plan mit dem internationalen Vertrieb von TRUMPF abstimmen und die Länder für das erste Jahr festlegen|Partner der Shortlist kontaktieren: Interesse, Exklusivität und Servicekapazität prüfen|Besuche bei den ersten zehn Unternehmen der Top 20 terminieren|Finanzierungsangebot und Lieferbedingungen für die Region festlegen|Den Atlas aktuell halten: Investitionsradar und wöchentliches Vertriebs-Tracking',
      'gtm.end.t': 'Sprechen wir.',
      'gtm.end.p': 'Dieser Plan ist ein Ausgangspunkt. Gemeinsam mit dem TRUMPF-Team wird daraus ein Budget, ein Gebiet und ein Zeitplan.',
      'gtm.end.role': 'Verfasser der Analyse und des Plans',
      'gtm.more': 'Mehr',
    },
  });
  /* ── Utilidades compartidas con Metodología (TL.ed) ─────────────────── */
  const ED = (TL.ed = TL.ed || {});
  const D = () => TL.data;
  const pickTxt = (o, base) => { const v = I.pick(o, base); return Array.isArray(v) ? v : v ? String(v) : ''; };
  const lines = (k) => t(k).split('|').filter(Boolean);
  ED.lines = lines;
  ED.draftTag = () => html`<span class="ed-draft" title="${t('gtm.draftTip')}">${t('gtm.draft')}</span>`;
  ED.num = (n) => String(n).padStart(2, '0');
  ED.flag = (cc) => (TL.ui.flag ? TL.ui.flag(cc, 18) : raw(''));
  /** Cabecera de sección: número mono + título (+ marca de borrador). */
  ED.secHead = (n, title, draft) => html`<header class="ed-sec-head"><span class="ed-sec-n mono">${ED.num(n)}</span><h2 class="ed-h2">${title}</h2>${draft ? ED.draftTag() : ''}</header>`;
  /** Párrafos desde string (con \n\n) o array. */
  ED.prose = (v, cls = '') => {
    const arr = Array.isArray(v) ? v : String(v || '').split(/\n{2,}/);
    return raw(arr.filter((x) => x && String(x).trim()).map((p) => `<p class="${cls}">${u.esc(typeof p === 'string' ? p : I.pick(p, 'text') || '')}</p>`).join(''));
  };
  /** Ítems genéricos de TL.data.gtm: strings u objetos {title,text,items}. */
  ED.items = function itemsHtml(items) {
    if (!Array.isArray(items) || !items.length) return raw('');
    return raw('<ul class="ed-list">' + items.map((it) => {
      if (it == null) return '';
      if (typeof it !== 'object') return `<li>${u.esc(it)}</li>`;
      const ti = I.pick(it, 'title') || I.pick(it, 'name') || I.pick(it, 'label') || '';
      const tx = I.pick(it, 'text') || I.pick(it, 'body') || I.pick(it, 'description') || I.pick(it, 'value') || '';
      const sub = Array.isArray(it.items) ? String(itemsHtml(it.items)) : '';
      return `<li>${ti ? `<b>${u.esc(ti)}</b>` : ''}${ti && tx ? ' — ' : ''}${u.esc(Array.isArray(tx) ? tx.join(' · ') : tx)}${sub}</li>`;
    }).join('') + '</ul>');
  };
  ED.fmtUsd = (n) => (n >= 1e9 ? 'USD ' + I.dec(n / 1e9, 1) + (I.lang === 'de' ? ' Mrd.' : ' mil M') : n >= 1e6 ? 'USD ' + I.dec(n / 1e6, n >= 1e8 ? 0 : 1) + (I.lang === 'de' ? ' Mio.' : ' M') : 'USD ' + I.int(n));

  /* ── Modelo calculado desde TL_DATA ─────────────────────────────────── */
  const POT = { alto: 6, medio: 4, bajo: 2 };
  function model() {
    const d = D();
    const clients = d.clients || [], reps = d.reps || [], opps = d.opps || [];
    const st = d.stats(clients);
    const shortlist = reps.filter((r) => r.shortlist);
    const oppUsd = u.sum(opps, (o) => o.amount_usd);
    const presence = d.trumpf?.latam_presence || [];
    const targets = d.targetCountries();
    const per = targets.map((k) => {
      const cl = d.clientsOf(k.cc), rp = d.repsOf(k.cc), sl = rp.filter((r) => r.shortlist);
      const dl = d.dealersOf(k.cc).filter((x) => d.groupOfBrand(x.brand, x.brand_group) !== 'trumpf');
      const pres = presence.filter((p) => p.country === k.cc);
      const s = d.stats(cl);
      const potLevel = k.potential || k.intel?.potential?.level || null;
      const presScore = pres.reduce((a, p) => a + (p.type === 'subsidiary' ? 3 : 2), 0);
      return {
        cc: k.cc, k, name: d.countryName(k.cc), cl, s, rp, sl, dl, pres, potLevel,
        x: sl.length * 2 + presScore + dl.length,
        y: (s.A || 0) * 3 + (s.B || 0) * 2 + (s.C || 0) + (POT[potLevel] || 0),
        n: cl.length, opps: d.oppsOf(k.cc),
      };
    });
    const plotted = per.filter((p) => p.n > 0 || p.x > 0 || p.potLevel);
    const xMax = Math.max(1, ...plotted.map((p) => p.x)), yMax = Math.max(1, ...plotted.map((p) => p.y));
    const xMid = xMax / 2, yMid = yMax / 2;
    plotted.forEach((p) => { p.q = p.y >= yMid ? (p.x >= xMid ? 'attack' : 'build') : (p.x >= xMid ? 'opp' : 'watch'); });
    per.forEach((p) => { if (!p.q) p.q = 'watch'; });
    const ranked = plotted.slice().sort((a, b) => b.y - a.y || b.n - a.n || b.x - a.x);
    const covered = per.filter((p) => p.n > 0 || p.rp.length > 0).length;
    const withComp = clients.filter((c) => d.hasCompetitor(c) || (c.machines || []).some((m) => d.groupOfBrand(m.brand, m.brand_group) === 'corte_termico')).length;
    return { d, clients, reps, opps, st, shortlist, oppUsd, presence, targets, per, plotted, ranked, xMax, yMax, xMid, yMid, covered, withComp };
  }

  /* ── Contenido editorial externo (TL.data.gtm) ──────────────────────── */
  const ALIAS = {
    summary: ['summary', 'resumen', 'executive', 'executive_summary', 'resumen_ejecutivo'],
    matrix: ['matrix', 'matriz', 'prioritization', 'priorizacion'],
    countries: ['countries', 'paises', 'priorities', 'prioridades', 'country_priorities'],
    phases: ['phases', 'etapas', 'plan', 'timeline', 'roadmap'],
    reps: ['reps', 'representantes', 'partners', 'channel', 'rep_strategy'],
    accounts: ['accounts', 'cuentas', 'key_accounts', 'top20'],
    competition: ['competition', 'competencia', 'positioning', 'posicionamiento'],
    goals: ['goals', 'metas', 'kpis', 'targets'],
    next: ['next', 'next_steps', 'proximos_pasos', 'pasos'],
  };
  function gtmSections() {
    const g = D().gtm;
    if (!g || typeof g !== 'object') return [];
    let arr = Array.isArray(g) ? g : Array.isArray(g.sections) ? g.sections
      : Object.entries(g).filter(([, v]) => v && typeof v === 'object' && !Array.isArray(v)).map(([id, v]) => Object.assign({ id }, v));
    return arr.filter((s) => s && typeof s === 'object').map((s, i) => Object.assign({ id: 'x' + i }, s));
  }
  function extFor(id) {
    const al = ALIAS[id] || [id];
    return gtmSections().find((s) => al.includes(u.norm(s.id).replace(/[\s-]+/g, '_'))) || null;
  }
  function extOthers() {
    const known = Object.values(ALIAS).flat();
    return gtmSections().filter((s) => !known.includes(u.norm(s.id).replace(/[\s-]+/g, '_')));
  }
  /** Texto de una sección: el de TL.data.gtm si existe, si no el borrador. */
  function body(id, draftHtml) {
    const ext = extFor(id);
    const b = ext ? pickTxt(ext, 'body') || pickTxt(ext, 'text') : '';
    if (ext && (b || ext.items)) return { html: raw(String(ED.prose(b)) + String(ED.items(ext.items))), draft: false, ext };
    return { html: draftHtml, draft: true, ext };
  }
  const titleOf = (id) => { const e = extFor(id); return (e && I.pick(e, 'title')) || t('gtm.s.' + id); };

  /* ── TRUMPF en cifras: valores breves desde trumpf.facts ────────────── */
  const DE_REPL = [[/ejercicio anterior/g, 'Vorjahr'], [/Alemania aprox\./g, 'Deutschland ca.'], [/sede de Ditzingen aprox\./g, 'Standort Ditzingen ca.'],
    [/superó a Alemania/g, 'vor Deutschland'], [/EE\. UU\./g, 'USA'], [/Más de/g, 'Über'], [/filiales/g, 'Tochtergesellschaften'], [/Alemania/g, 'Deutschland'], [/M EUR/g, 'Mio. €']];
  const deTxt = (s) => (I.lang === 'de' ? DE_REPL.reduce((a, [r, v]) => a.replace(r, v), s) : s);
  const FACT_PICK = [/fundaci/i, /ventas ejercicio 2025\/26/i, /entrada de pedidos/i, /empleados del grupo/i, /filiales/i, /mayor mercado/i];
  function factFigures() {
    const facts = D().trumpf?.facts || [];
    const chosen = FACT_PICK.map((re) => facts.find((f) => re.test(f.label_es || ''))).filter(Boolean);
    const list = chosen.length >= 3 ? chosen : facts.slice(0, 6);
    return list.map((f) => {
      const v = String(f.value || '');
      const paren = (v.match(/\(([^)]*)\)/) || [])[1] || '';
      const head = v.replace(/\(.*$/, '').split(';')[0].trim();
      const m = head.match(/^(Más de\s+)?([\d][\d.,]*)\s*(M EUR)?/i);
      let big = head, unit = '';
      if (m) { big = (m[1] ? '>' : '') + m[2]; unit = m[3] ? (I.lang === 'de' ? 'Mio. €' : 'M EUR') : ''; }
      let sub = paren.split(';')[0].trim();
      if (!m && !sub) sub = '';
      if (sub.length > 42) sub = '';
      if (/filiales/i.test(f.label_es) && !sub) sub = '';
      return { label: String(I.pick(f, 'label') || '').replace(/\s*\(.*$/, ''), big: deTxt(big), unit, sub: deTxt(sub) };
    }).filter((x) => x.big && x.big.length <= 12);
  }

  ED.model = model;

  /* ── Portada ────────────────────────────────────────────────────────── */
  const author = () => D().cfg?.author || window.TL_CONFIG?.author || 'Matías Banzer';
  const REPORT_DATE = '2026-10-07';
  function secCover(M) {
    const g = D().gtm;
    const lead = (g && !Array.isArray(g) && (I.pick(g, 'lead') || I.pick(g, 'intro')))
      || t('gtm.cover.lead', { n: I.int(M.clients.length), r: I.int(M.reps.length), o: I.int(M.opps.length) });
    return html`<header class="ed-cover" id="ed-sec-top">
      <div class="ed-cover-text">
        <p class="ed-kicker mono">${t('gtm.cover.kicker')}</p>
        <h1 class="ed-h1"><span>${t('gtm.cover.title1')}</span> <b>${t('gtm.cover.title2')}</b></h1>
        <i class="ed-laser" aria-hidden="true"></i>
        <p class="ed-lead">${lead}</p>
        <dl class="ed-meta">
          <div><dt>${t('gtm.cover.by')}</dt><dd>${author()}</dd></div>
          <div><dt>${t('gtm.cover.date')}</dt><dd>${I.date(REPORT_DATE, { day: 'numeric', month: 'long', year: 'numeric' })}</dd></div>
          <div><dt>${t('gtm.cover.scope')}</dt><dd>${t('gtm.cover.scopeV', { n: I.int(M.targets.length) })}</dd></div>
        </dl>
        <button type="button" class="btn btn-ghost btn-sm ed-print-cover ed-noprint" data-ed-print>${TL.ui.icon('print')}<span>${t('gtm.print')}</span></button>
      </div>
      <figure class="ed-cover-fig">
        <img src="assets/trumpf/products/trulaser-series-5000.jpg" alt="TruLaser 5030 fiber" decoding="async">
        <figcaption class="mono">${t('gtm.cover.photo')}</figcaption>
      </figure>
    </header>`;
  }

  /* ── 01 Resumen ejecutivo ───────────────────────────────────────────── */
  const pctStr = (a, b) => (b ? I.pct(a / b) : '—');
  function kpi(label, value, sub, opts = {}) {
    const v = Number(value);
    return html`<div class="ed-kpi${opts.accent ? ' is-accent' : ''}"><span class="ed-kpi-l">${label}</span>
      <b class="ed-kpi-n mono" data-ed-count="${isFinite(v) ? v : ''}">${isFinite(v) ? '0' : value}</b><span class="ed-kpi-s">${sub || ''}</span></div>`;
  }
  ED.kpi = kpi;
  function secSummary(M, n) {
    const st = M.st, N = M.clients.length;
    const names = (arr) => I.list(arr.map((p) => p.name));
    let head;
    const byA = M.per.filter((p) => p.s.A > 0).sort((a, b) => b.s.A - a.s.A).slice(0, 3);
    const byN = M.per.filter((p) => p.n > 0).sort((a, b) => b.n - a.n).slice(0, 3);
    if (st.A > 0 && byA.length) head = t(byA.length === 1 ? 'gtm.sum.head1' : 'gtm.sum.head', { list: names(byA), p: pctStr(u.sum(byA, (p) => p.s.A), st.A) });
    else if (N && byN.length) head = t(byN.length === 1 ? 'gtm.sum.headAll1' : 'gtm.sum.headAll', { list: names(byN), p: pctStr(u.sum(byN, (p) => p.n), N) });
    else head = t('gtm.sum.headNone');
    const subs = M.presence.filter((p) => p.type === 'subsidiary').map((p) => D().countryName(p.country));
    const reps = M.presence.filter((p) => p.type !== 'subsidiary').map((p) => D().countryName(p.country));
    const draft = html`${subs.length || reps.length ? html`<p>${t('gtm.sum.p1', { subs: I.list(subs.length ? subs : ['—']), reps: I.list(reps.length ? reps : ['—']) })}</p>` : ''}
      <p>${t('gtm.sum.p2', { n: I.int(N), a: I.int(st.A || 0), cm: I.int(M.withComp) })}</p>
      <p>${t('gtm.sum.p3')}</p>`;
    const b = body('summary', draft);
    return html`<section class="ed-sec" id="ed-sec-summary" data-sec="summary">
      ${ED.secHead(n, titleOf('summary'), b.draft)}
      <p class="ed-statement ed-rv">${head}</p>
      <div class="ed-kpis ed-rv" data-count-group>
        ${kpi(t('gtm.k.clients'), N, t('gtm.k.clientsS'))}
        ${kpi(t('gtm.k.a'), st.A || 0, t('gtm.k.aS', { p: pctStr(st.A || 0, N) }), { accent: true })}
        ${kpi(t('gtm.k.reps'), M.reps.length, t('gtm.k.repsS', { n: I.int(M.shortlist.length) }))}
        ${kpi(t('gtm.k.opps'), M.opps.length, t('gtm.k.oppsS', { usd: M.oppUsd ? ED.fmtUsd(M.oppUsd) : 'USD —' }))}
        ${kpi(t('gtm.k.countries'), M.covered, t('gtm.k.countriesS', { n: I.int(M.targets.length) }))}
      </div>
      <div class="ed-prose ed-rv">${b.html}</div>
    </section>`;
  }

  /* ── Franja "TRUMPF en cifras" ──────────────────────────────────────── */
  function secFacts() {
    const figs = factFigures();
    if (!figs.length) return raw('');
    return html`<aside class="ed-facts ed-rv" aria-label="${t('gtm.facts')}">
      <p class="ed-facts-t mono">${t('gtm.facts')}</p>
      <div class="ed-facts-grid">${figs.map((f) => html`<div class="ed-fact"><b class="ed-fact-n">${f.big}${f.unit ? html` <small>${f.unit}</small>` : ''}</b>
        <span class="ed-fact-l">${f.label}</span>${f.sub ? html`<span class="ed-fact-s mono">${f.sub}</span>` : ''}</div>`)}</div>
      <p class="ed-note">${t('gtm.factsSrc')}</p>
    </aside>`;
  }

  /* ── 02 Matriz de priorización (burbujas SVG) ───────────────────────── */
  const QUADS = ['attack', 'build', 'opp', 'watch'];
  function bubbleSvg(M) {
    const W = 880, H = 500, ml = 54, mr = 24, mt = 26, mb = 50, pw = W - ml - mr, ph = H - mt - mb;
    const padX = M.xMax * 0.07 + 0.3, padY = M.yMax * 0.07 + 0.3;
    const xs = (v) => ml + ((v + padX) / (M.xMax * 1.1 + padX)) * pw;
    const ys = (v) => mt + ph - ((v + padY) / (M.yMax * 1.12 + padY)) * ph;
    const maxN = Math.max(1, ...M.plotted.map((p) => p.n));
    const pts = M.plotted.map((p) => ({ p, x: xs(p.x), y: ys(p.y), r: 9 + 25 * Math.sqrt(p.n / maxN) }));
    for (let it = 0; it < 90; it++) {        // separa burbujas superpuestas
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
        const a = pts[i], b = pts[j];
        let dx = b.x - a.x, dy = b.y - a.y, dist = Math.hypot(dx, dy);
        const min = a.r + b.r + 3;
        if (dist >= min) continue;
        if (dist < 0.01) { const ang = (j * 2.4) % (2 * Math.PI); dx = Math.cos(ang); dy = Math.sin(ang); dist = 1; }
        const push = (min - dist) / 2;
        a.x -= (dx / dist) * push; a.y -= (dy / dist) * push; b.x += (dx / dist) * push; b.y += (dy / dist) * push;
      }
      pts.forEach((q) => { q.x = u.clamp(q.x, ml + q.r, ml + pw - q.r); q.y = u.clamp(q.y, mt + q.r, mt + ph - q.r); });
    }
    const qx = xs(M.xMid), qy = ys(M.yMid);
    const ql = (q, x, y, anchor) => `<text class="ed-q-l" x="${x}" y="${y}" text-anchor="${anchor}">${u.esc(t('gtm.q.' + q).toUpperCase())}</text>`;
    const bubs = pts.sort((a, b) => b.r - a.r).map((q, i) => {
      const p = q.p, small = q.r < 15;
      const lab = `<text class="ed-bub-cc${small ? ' out' : ''}" ${small ? `x="${q.r + 5}" y="4" text-anchor="start"` : 'y="4" text-anchor="middle"'}>${u.esc(p.cc)}</text>`;
      const name = !small ? `<text class="ed-bub-name" x="${q.r + 6}" y="4">${u.esc(p.name)}</text>` : '';
      const aria = `${p.name}: ${t('gtm.q.' + p.q)}. ${t('gtm.m.tipN', { n: p.n, a: p.s.A || 0, b: p.s.B || 0, c: p.s.C || 0 })}`;
      return `<g class="ed-bub" data-cc="${p.cc}" data-q="${p.q}" transform="translate(${q.x.toFixed(1)} ${q.y.toFixed(1)})" tabindex="0" role="button" aria-label="${u.esc(aria)}">
        <g class="ed-bub-in" style="--d:${120 + i * 40}ms"><circle r="${q.r.toFixed(1)}"/>${lab}</g>${name}</g>`;
    }).join('');
    return raw(`<svg class="ed-bubbles" viewBox="0 0 ${W} ${H}" role="group" aria-label="${u.esc(t('gtm.s.matrix'))}">
      <rect class="ed-q-hi" x="${qx}" y="${mt}" width="${ml + pw - qx}" height="${qy - mt}"/>
      <line class="ed-q-line" x1="${qx}" y1="${mt}" x2="${qx}" y2="${mt + ph}"/><line class="ed-q-line" x1="${ml}" y1="${qy}" x2="${ml + pw}" y2="${qy}"/>
      <line class="ed-axis" x1="${ml}" y1="${mt + ph}" x2="${ml + pw}" y2="${mt + ph}"/><line class="ed-axis" x1="${ml}" y1="${mt}" x2="${ml}" y2="${mt + ph}"/>
      ${ql('attack', ml + pw - 10, mt + 18, 'end')}${ql('build', ml + 12, mt + 18, 'start')}${ql('opp', ml + pw - 10, mt + ph - 12, 'end')}${ql('watch', ml + 12, mt + ph - 12, 'start')}
      <text class="ed-ax-t" x="${ml + pw}" y="${H - 14}" text-anchor="end">${u.esc(t('gtm.m.x'))} →</text>
      <text class="ed-ax-e" x="${ml}" y="${H - 14}">${u.esc(t('gtm.m.low'))}</text>
      <text class="ed-ax-t" transform="translate(${ml - 20} ${mt}) rotate(-90)" text-anchor="end">${u.esc(t('gtm.m.y'))} →</text>
      <text class="ed-ax-e" transform="translate(${ml - 20} ${mt + ph}) rotate(-90)" text-anchor="start">${u.esc(t('gtm.m.low'))}</text>
      <g class="ed-bubs">${bubs}</g></svg>`);
  }
  function secMatrix(M, n) {
    const b = body('matrix', html`<p>${t('gtm.m.lead')}</p>`);
    const byQ = u.groupBy(M.ranked, (p) => p.q);
    return html`<section class="ed-sec" id="ed-sec-matrix" data-sec="matrix">
      ${ED.secHead(n, titleOf('matrix'), b.draft)}
      <div class="ed-prose ed-rv">${b.html}</div>
      ${M.plotted.length ? html`<figure class="ed-chart ed-wide ed-rv" data-chart="bubbles">${bubbleSvg(M)}<div class="ed-tip" role="tooltip" hidden></div></figure>
        <dl class="ed-quads ed-wide">${QUADS.map((q) => html`<div data-q="${q}"><dt><i class="ed-q-dot"></i>${t('gtm.q.' + q)}</dt>
          <dd>${(byQ[q] || []).length ? (byQ[q] || []).map((p, i) => html`${i ? ', ' : ''}<button type="button" class="ed-link" data-cc="${p.cc}">${p.name}</button>`) : '—'}</dd></div>`)}</dl>
        <p class="ed-note ed-wide">${t('gtm.m.formula')}</p>`
        : html`<p class="ed-note">${t('gtm.m.empty')}</p>`}
    </section>`;
  }
  /* ── 03 Prioridades por país ────────────────────────────────────────── */
  function marketFact(k) {
    const e = k?.intel?.economy, im = k?.intel?.imports, out = [];
    if (e?.manufacturing_pct_gdp != null) out.push(t('gtm.c.mfg', { p: I.dec(e.manufacturing_pct_gdp, 1) + ' %' }));
    const laser = (im?.items || []).find((x) => /845611|l[áa]ser/i.test((x.hs || '') + ' ' + (x.label_es || '')));
    if (laser?.usd) out.push(t('gtm.c.laser', { usd: ED.fmtUsd(laser.usd), y: im.year || '' }));
    else if (e?.gdp_usd_bn) out.push(t('gtm.c.gdp', { usd: ED.fmtUsd(e.gdp_usd_bn * 1e9) }));
    return out.join(' · ');
  }
  function repCandidate(p) {
    const by = (a, b) => D().score(b) - D().score(a);
    const best = p.sl.slice().sort(by)[0] || p.rp.filter((r) => !r.competitor_conflict?.conflict).sort(by)[0];
    if (best) return { name: best.name, id: best.id, fit: D().score(best), short: !!best.shortlist };
    const pr = p.pres[0];
    return pr ? { name: pr.name, existing: true, type: pr.type } : null;
  }
  const abcBar = (s, n) => (n ? raw(`<span class="ed-abc" aria-hidden="true">${['A', 'B', 'C'].map((k) => (s[k] ? `<i data-t="${k}" style="flex:${s[k]}"></i>` : '')).join('')}</span>`) : raw(''));
  function secCountries(M, n) {
    const top = M.ranked.slice(0, 6);
    const mk = top.some((p) => marketFact(p.k));
    const b = body('countries', html`<p>${t('gtm.c.lead')}</p>`);
    return html`<section class="ed-sec" id="ed-sec-countries" data-sec="countries">
      ${ED.secHead(n, titleOf('countries'), b.draft && !!b.ext)}
      <div class="ed-prose ed-rv">${b.html}</div>
      ${top.length ? html`<div class="ed-table-wrap ed-wide ed-rv"><table class="ed-table ed-t-countries">
        <thead><tr><th>${t('gtm.c.country')}</th><th class="r">${t('gtm.c.prospects')}</th><th>${t('gtm.c.sectors')}</th><th>${t('gtm.c.rep')}</th>${mk ? html`<th>${t('gtm.c.market')}</th>` : ''}</tr></thead>
        <tbody>${top.map((p, i) => {
          const rc = repCandidate(p), secs = D().topSectors(p.cl, 3);
          return html`<tr>
            <td><span class="ed-rank mono">${ED.num(i + 1)}</span><button type="button" class="ed-cty" data-cc="${p.cc}">${ED.flag(p.cc)}<b>${p.name}</b></button>
              <span class="ed-qchip" data-q="${p.q}">${t('gtm.q.' + p.q)}</span></td>
            <td class="r"><b class="mono">${I.int(p.n)}</b>${abcBar(p.s, p.n)}<span class="ed-abc-l mono">A ${p.s.A || 0} · B ${p.s.B || 0} · C ${p.s.C || 0}</span></td>
            <td>${secs.length ? secs.map((s) => s.name).join(' · ') : '—'}</td>
            <td>${rc ? html`${rc.id ? html`<button type="button" class="ed-link" data-open="${rc.id}">${rc.name}</button>` : rc.name}
              <span class="ed-sub mono">${rc.existing ? (t('gtm.pres.' + (rc.type === 'subsidiary' ? 'subsidiary' : 'representative')) + ' · ' + t('gtm.c.existing')) : (rc.short ? 'Shortlist · ' : '') + (rc.fit ? I.int(rc.fit) + '/100' : '')}</span>` : html`<span class="ed-muted">${t('gtm.c.tbd')}</span>`}</td>
            ${mk ? html`<td class="ed-market">${marketFact(p.k) || '—'}</td>` : ''}</tr>`;
        })}</tbody></table></div>` : html`<p class="ed-note">${t('gtm.m.empty')}</p>`}
    </section>`;
  }

  /* ── 04 Etapas del plan ─────────────────────────────────────────────── */
  const PHASES = [['0–3', 'gtm.p1'], ['3–6', 'gtm.p2'], ['6–12', 'gtm.p3'], ['12–24', 'gtm.p4']];
  function secPhases(M, n) {
    const ext = extFor('phases');
    const extPh = (ext?.items || []).filter((x) => x && typeof x === 'object' && (x.period || x.when || x.months));
    const phases = extPh.length ? extPh.map((x) => ({ when: x.period || x.when || x.months, title: I.pick(x, 'title') || I.pick(x, 'label'), items: Array.isArray(x.items) ? x.items.map((y) => (typeof y === 'object' ? I.pick(y, 'text') || I.pick(y, 'title') : y)) : [I.pick(x, 'text')].filter(Boolean) }))
      : PHASES.map(([when, k]) => ({ when, title: t(k + '.t'), items: lines(k + '.i') }));
    const draft = !extPh.length;
    const lead = ext && (pickTxt(ext, 'body') || pickTxt(ext, 'text'));
    const fairs = [];
    M.targets.forEach((k) => (k.intel?.fairs || []).forEach((f) => fairs.push(Object.assign({ cc: k.cc }, f))));
    return html`<section class="ed-sec" id="ed-sec-phases" data-sec="phases">
      ${ED.secHead(n, titleOf('phases'), draft)}
      <div class="ed-prose ed-rv">${lead ? ED.prose(lead) : html`<p>${t('gtm.p.lead')}</p>`}</div>
      <ol class="ed-phases ed-wide ed-rv"><i class="ed-ph-track" aria-hidden="true"><i></i></i>
        ${phases.map((p, i) => html`<li class="ed-phase" style="--i:${i}"><span class="ed-ph-when mono">${p.when} <small>${t('gtm.p.months')}</small></span>
          <i class="ed-ph-mark" aria-hidden="true"></i><h3 class="ed-h3">${p.title}</h3><ul>${p.items.map((x) => html`<li>${x}</li>`)}</ul></li>`)}
      </ol>
      ${fairs.length ? html`<div class="ed-fairs ed-wide ed-rv"><p class="ed-label mono">${t('gtm.p.fairs')}</p><ul>${fairs.slice(0, 8).map((f) => html`<li>${ED.flag(f.cc)}<span>${f.name}</span><span class="ed-sub mono">${[f.city, f.month].filter(Boolean).join(' · ')}</span></li>`)}</ul></div>` : ''}
    </section>`;
  }

  /* ── 05 Estrategia de representantes ────────────────────────────────── */
  const REP_CRIT = [['portfolio_fit', 25], ['service', 25], ['scale', 20], ['market_access', 15], ['no_conflict', 15]];
  ED.weights = (rows, prefix) => html`<ul class="ed-weights">${rows.map(([k, w], i) => html`<li style="--w:${w / 25};--i:${i}"><span>${t(prefix + k)}</span><i class="ed-wbar" aria-hidden="true"><i></i></i><b class="mono">${w}</b></li>`)}</ul>`;
  function secReps(M, n) {
    const b = body('reps', html`<p>${t('gtm.r.lead')}</p>`);
    const sl = M.shortlist.slice().sort((a, c) => D().score(c) - D().score(a));
    return html`<section class="ed-sec" id="ed-sec-reps" data-sec="reps">
      ${ED.secHead(n, titleOf('reps'), b.draft)}
      <div class="ed-prose ed-rv">${b.html}</div>
      <div class="ed-split ed-wide ed-rv">
        <div><p class="ed-label mono">${t('gtm.r.model')}</p><ol class="ed-numlist">${lines('gtm.r.m').map((x, i) => html`<li><span class="mono">${ED.num(i + 1)}</span>${x}</li>`)}</ol></div>
        <div><p class="ed-label mono">${t('gtm.r.criteria')}</p>${ED.weights(REP_CRIT, 'gtm.rc.')}</div>
      </div>
      <p class="ed-label mono ed-wide">${t('gtm.r.short')}</p>
      ${sl.length ? html`<div class="ed-table-wrap ed-wide ed-rv"><table class="ed-table ed-t-reps">
        <thead><tr><th>${t('gtm.r.name')}</th><th>${t('gtm.c.country')}</th><th>${t('gtm.r.brands')}</th><th>${t('gtm.r.service')}</th><th class="r">${t('gtm.r.fit')}</th></tr></thead>
        <tbody>${sl.map((r) => {
          const sv = r.service || {};
          const svc = [sv.technicians ? sv.technicians + ' ' + t('gtm.r.techs') : '', sv.workshop ? t('gtm.r.workshop') : '', sv.spare_parts ? t('gtm.r.parts') : ''].filter(Boolean).join(' · ');
          return html`<tr class="ed-row" data-open="${r.id}"><td><button type="button" class="ed-link" data-open="${r.id}">${r.name}</button><span class="ed-sub">${r.city || ''}</span></td>
            <td>${ED.flag(r.country)} ${D().countryName(r.country)}</td><td>${(r.brands || []).slice(0, 4).map((x) => x.brand).join(', ') || '—'}</td>
            <td>${svc || '—'}</td><td class="r"><b class="mono">${I.int(D().score(r))}</b> <span class="ed-tier" data-t="${r.tier || 'C'}">${r.tier || '—'}</span></td></tr>`;
        })}</tbody></table></div>` : html`<p class="ed-note ed-wide">${t('gtm.r.none')}</p>`}
    </section>`;
  }

  /* ── 06 Cuentas clave (top 20) ──────────────────────────────────────── */
  function secAccounts(M, n) {
    const top = M.clients.slice().sort((a, b) => D().score(b) - D().score(a) || String(a.name).localeCompare(String(b.name))).slice(0, 20);
    const b = body('accounts', html`<p>${t('gtm.a.lead')}</p>`);
    return html`<section class="ed-sec" id="ed-sec-accounts" data-sec="accounts">
      ${ED.secHead(n, titleOf('accounts'), false)}
      <div class="ed-prose ed-rv">${b.html}</div>
      ${top.length ? html`<div class="ed-table-wrap ed-wide ed-rv"><table class="ed-table ed-t-acc">
        <thead><tr><th class="r">#</th><th>${t('gtm.a.company')}</th><th>${t('gtm.c.country')}</th><th>${t('gtm.a.sector')}</th><th>${t('gtm.a.fit')}</th><th class="r">${t('gtm.a.score')}</th></tr></thead>
        <tbody>${top.map((c, i) => html`<tr class="ed-row" data-open="${c.id}">
          <td class="r mono ed-muted">${ED.num(i + 1)}</td>
          <td><button type="button" class="ed-link" data-open="${c.id}">${c.name}</button><span class="ed-sub">${c.city || ''}</span></td>
          <td class="mono">${ED.flag(c.country)} ${c.country}</td>
          <td>${(c.sectors || []).slice(0, 2).map((s) => D().sectorName(s)).join(' · ') || '—'}</td>
          <td>${(c.trumpf_fit || []).slice(0, 2).map((f) => f.series).filter(Boolean).join(' · ') || '—'}</td>
          <td class="r"><b class="mono">${I.int(D().score(c))}</b> <span class="ed-tier" data-t="${c.tier || 'C'}">${c.tier || '—'}</span></td></tr>`)}</tbody></table></div>`
        : html`<p class="ed-note">${t('gtm.a.none')}</p>`}
    </section>`;
  }
  /* ── 07 Posicionamiento competitivo ─────────────────────────────────── */
  const ARGS = ['china', 'turkey', 'japan', 'europe', 'thermal'];
  function secCompetition(M, n) {
    const ib = D().installedBase().total || {};
    const rows = Object.entries(ib).sort((a, b) => b[1] - a[1]);
    const total = u.sum(rows, (r) => r[1]), max = Math.max(1, ...rows.map((r) => r[1]));
    const withM = M.clients.filter((c) => (c.machines || []).length).length;
    const ext = extFor('competition');
    const extBody = ext && (pickTxt(ext, 'body') || pickTxt(ext, 'text'));
    return html`<section class="ed-sec" id="ed-sec-competition" data-sec="competition">
      ${ED.secHead(n, titleOf('competition'), !ext)}
      <div class="ed-prose ed-rv"><p>${t('gtm.x.lead')}</p>${extBody ? ED.prose(extBody) : ''}</div>
      ${rows.length ? html`<div class="ed-bars ed-wide ed-rv"><p class="ed-label mono">${t('gtm.x.total', { n: I.int(total), c: I.int(withM) })}</p>
        <ul>${rows.map(([g, v], i) => { const G = D().group(g); return html`<li style="--i:${i}"><span class="ed-bar-l"><i class="ed-sw" style="background:${G.color}"></i>${G.name}</span>
          <i class="ed-bar" aria-hidden="true"><i style="width:${((v / max) * 100).toFixed(1)}%;background:${G.color}"></i></i>
          <b class="mono">${I.int(v)}</b><span class="mono ed-muted">${I.pct(v / (total || 1))}</span></li>`; })}</ul></div>`
        : html`<p class="ed-note">${t('gtm.x.none')}</p>`}
      ${ext?.items ? html`<div class="ed-prose ed-rv">${ED.items(ext.items)}</div>` : html`<p class="ed-label mono ed-wide">${t('gtm.x.args')}</p>
        <dl class="ed-args ed-wide ed-rv">${ARGS.map((k) => html`<div><dt>${t('gtm.x.' + k + '.t')}</dt><dd>${t('gtm.x.' + k)}</dd></div>`)}</dl>`}
      <figure class="ed-fig ed-wide ed-rv"><img src="assets/trumpf/products/trumatic-5000.jpg" alt="TruMatic 5000" loading="lazy" decoding="async"><figcaption class="mono">${t('gtm.x.photo')}</figcaption></figure>
    </section>`;
  }

  /* ── 08 Metas e indicadores (provisorio, calculado) ─────────────────── */
  function goals(M) {
    const s = M.st, A = s.A || 0, B = s.B || 0, C = s.C || 0;
    const v1 = Math.max(12, 2 * A + B + Math.round(C / 4));
    const v2 = Math.round(v1 * 1.5);
    const q1 = Math.round(v1 * 0.15), q2 = Math.round(v2 * 0.2);
    const p1 = Math.max(1, Math.min(M.shortlist.length || 2, 3));
    return [
      ['visits', v1, v2], ['demos', Math.round(v1 * 0.2), Math.round(v2 * 0.25)], ['quotes', q1, q2],
      ['machines', Math.max(1, Math.round(q1 * 0.2)), Math.max(2, Math.round(q2 * 0.25))], ['partners', p1, Math.max(p1 + 2, M.shortlist.length)],
    ];
  }
  function secGoals(M, n) {
    const b = body('goals', html`<p>${t('gtm.g.lead')}</p>`);
    const rows = goals(M);
    return html`<section class="ed-sec" id="ed-sec-goals" data-sec="goals">
      ${ED.secHead(n, titleOf('goals'), b.draft)}
      <div class="ed-prose ed-rv">${b.html}</div>
      ${b.draft ? html`<div class="ed-table-wrap ed-wide ed-rv"><table class="ed-table ed-t-goals">
        <thead><tr><th>${t('gtm.g.metric')}</th><th class="r">${t('gtm.g.y1')}</th><th class="r">${t('gtm.g.y2')}</th></tr></thead>
        <tbody>${rows.map(([k, a, c]) => html`<tr><td>${t('gtm.g.' + k)}</td><td class="r"><b class="mono ed-goal-n" data-ed-count="${a}">0</b></td><td class="r"><b class="mono ed-goal-n" data-ed-count="${c}">0</b></td></tr>`)}</tbody></table>
        <p class="ed-note">${t('gtm.g.note')}</p></div>` : ''}
    </section>`;
  }

  /* ── Secciones adicionales de TL.data.gtm (render genérico) ─────────── */
  function secExtra(s, n) {
    const id = 'x-' + String(s.id).replace(/[^\w-]/g, '');
    return html`<section class="ed-sec" id="ed-sec-${id}" data-sec="${id}">
      ${ED.secHead(n, I.pick(s, 'title') || s.id, false)}
      <div class="ed-prose ed-rv">${ED.prose(pickTxt(s, 'body') || pickTxt(s, 'text'))}${ED.items(s.items)}</div></section>`;
  }

  /* ── 09 Próximos pasos + cierre ─────────────────────────────────────── */
  function secNext(M, n) {
    const ext = extFor('next');
    const items = ext?.items ? ext.items.map((x) => (typeof x === 'object' ? I.pick(x, 'text') || I.pick(x, 'title') : x)) : lines('gtm.n.i');
    const extBody = ext && (pickTxt(ext, 'body') || pickTxt(ext, 'text'));
    return html`<section class="ed-sec" id="ed-sec-next" data-sec="next">
      ${ED.secHead(n, titleOf('next'), !ext)}
      ${extBody ? html`<div class="ed-prose ed-rv">${ED.prose(extBody)}</div>` : ''}
      <ol class="ed-steps ed-rv">${items.map((x, i) => html`<li style="--i:${i}"><span class="mono">${ED.num(i + 1)}</span><p>${x}</p></li>`)}</ol>
      <div class="ed-end ed-rv">
        <i class="ed-laser" aria-hidden="true"></i>
        <p class="ed-end-t">${t('gtm.end.t')}</p>
        <p class="ed-end-p">${t('gtm.end.p')}</p>
        <p class="ed-sign"><b>${author()}</b><span>${t('gtm.end.role')}</span><span class="mono">Market Atlas LATAM · ${I.date(REPORT_DATE)}</span></p>
      </div>
    </section>`;
  }

  /* ── Ensamble ───────────────────────────────────────────────────────── */
  function plan() {
    const list = [['summary', secSummary], ['matrix', secMatrix], ['countries', secCountries], ['phases', secPhases], ['reps', secReps],
      ['accounts', secAccounts], ['competition', secCompetition], ['goals', secGoals]];
    extOthers().forEach((s) => list.push(['x-' + String(s.id).replace(/[^\w-]/g, ''), (M, n) => secExtra(s, n), I.pick(s, 'title') || s.id]));
    list.push(['next', secNext]);
    return list;
  }
  function sections() {
    return plan().map(([id, , title], i) => ({ id, n: ED.num(i + 1), title: title || titleOf(id) }));
  }
  function build() {
    const M = model();
    const secs = plan();
    const toc = sections();
    return html`<div class="ed-page" data-ed="gtm">
      <i class="ed-progress" aria-hidden="true"><i></i></i>
      ${secCover(M)}
      <nav class="ed-toc" aria-label="${t('gtm.toc')}"><p class="ed-label mono">${t('gtm.toc')}</p>
        <ol>${toc.map((s) => html`<li><a href="#ed-sec-${s.id}" data-sec="${s.id}"><span class="mono">${s.n}</span>${s.title}</a></li>`)}</ol>
        <button type="button" class="btn btn-ghost btn-sm ed-print-btn ed-noprint" data-ed-print>${TL.ui.icon('print')}<span>${t('gtm.print')}</span></button>
      </nav>
      <main class="ed-main">
        ${secs.map(([id, fn], i) => (id === 'matrix' ? html`${secFacts()}${fn(M, i + 1)}` : fn(M, i + 1)))}
      </main>
    </div>`;
  }
  /* ── Cableado común de páginas editoriales (también lo usa Metodología) ─ */
  ED.finalizeCounts = (root) => u.qsa('[data-ed-count]', root).forEach((el) => {
    const v = el.dataset.edCount; if (v !== '' && isFinite(+v)) el.textContent = I.int(+v);
  });
  /** Activa reveal, count-up, índice con scrollspy, progreso, impresión. Devuelve cleanup. */
  ED.mount = function (api, page, opts = {}) {
    const scroller = api.scroll || page.closest('.ov-scroll') || null;
    const offs = [];
    // Cadena de ancestros para @media print (solo esta página se imprime)
    for (let n = page.parentElement; n && n !== document.documentElement; n = n.parentElement) n.classList.add('ed-pc');
    const reveal = (el) => {
      el.classList.add('is-in');
      u.qsa('[data-ed-count]', el).forEach((c, i) => {
        if (c.dataset.done) return; c.dataset.done = '1';
        const v = c.dataset.edCount; if (v === '' || !isFinite(+v)) return;
        if (opts.instant || TL.reduceMotion) c.textContent = I.int(+v);
        else TL.ui.countUp(c, +v, { duration: 1100, delay: i * 60 });
      });
    };
    const rvs = u.qsa('.ed-rv', page);
    if (opts.instant || TL.reduceMotion || !('IntersectionObserver' in window)) { page.classList.add('ed-static'); rvs.forEach(reveal); }
    else {
      const io = new IntersectionObserver((ents) => ents.forEach((e) => { if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target); } }),
        { root: scroller, threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
      rvs.forEach((el) => io.observe(el));
      offs.push(() => io.disconnect());
    }
    // Índice: scrollspy + salto suave
    const links = u.qsa('.ed-toc a[data-sec]', page);
    const secs = links.map((a) => page.querySelector('#ed-sec-' + a.dataset.sec)).filter(Boolean);
    const setActive = (id) => links.forEach((a) => { const on = a.dataset.sec === id; a.classList.toggle('is-active', on); if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    const spy = () => {
      if (!secs.length) return;
      const top = (scroller ? scroller.getBoundingClientRect().top : 0) + (scroller ? scroller.clientHeight : innerHeight) * 0.28;
      let cur = null;
      secs.forEach((s) => { if (s.getBoundingClientRect().top <= top) cur = s; });
      setActive(cur ? cur.dataset.sec : null);
    };
    const bar = page.querySelector('.ed-progress > i');
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0; spy();
        if (bar && scroller) { const max = scroller.scrollHeight - scroller.clientHeight; bar.style.transform = `scaleX(${max > 0 ? u.clamp(scroller.scrollTop / max, 0, 1) : 0})`; }
      });
    };
    (scroller || window).addEventListener('scroll', onScroll, { passive: true });
    offs.push(() => (scroller || window).removeEventListener('scroll', onScroll));
    ED.scrollTo = (id, smooth = true) => {
      const el = page.querySelector('#ed-sec-' + id) || page.querySelector('[data-sec="' + id + '"]');
      if (!el) return;
      if (!scroller) { el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' }); return; }
      const y = el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - 20;
      scroller.scrollTo({ top: y, behavior: smooth && !TL.reduceMotion ? 'smooth' : 'auto' });
    };
    const onClick = (e) => {
      const a = e.target.closest('.ed-toc a[data-sec]');
      if (a) { e.preventDefault(); ED.scrollTo(a.dataset.sec); return; }
      if (e.target.closest('[data-ed-print]')) { ED.print(page); }
    };
    page.addEventListener('click', onClick);
    const beforePrint = () => { page.classList.add('ed-static'); u.qsa('.ed-rv', page).forEach((el) => el.classList.add('is-in')); ED.finalizeCounts(page); };
    window.addEventListener('beforeprint', beforePrint);
    offs.push(() => window.removeEventListener('beforeprint', beforePrint));
    requestAnimationFrame(onScroll);
    return () => {
      offs.forEach((f) => f());
      if (!document.querySelector('.ed-page:not([data-dead])')) u.qsa('.ed-pc').forEach((n) => n.classList.remove('ed-pc'));
    };
  };
  ED.print = (page) => {
    if (page) { page.classList.add('ed-static'); u.qsa('.ed-rv', page).forEach((el) => el.classList.add('is-in')); ED.finalizeCounts(page); }
    setTimeout(() => window.print(), 60);
  };
  ED.unmount = (page, cleanup) => { if (page) page.dataset.dead = '1'; try { cleanup?.(); } catch (e) { /* noop */ } };

  /* ── Interacciones propias de GTM ───────────────────────────────────── */
  function wireGtm(page, M) {
    const fig = page.querySelector('[data-chart="bubbles"]');
    const tip = fig?.querySelector('.ed-tip');
    const byCc = new Map(M.plotted.map((p) => [p.cc, p]));
    if (fig && fig.scrollWidth > fig.clientWidth) requestAnimationFrame(() => { fig.scrollLeft = fig.scrollWidth; }); // teléfono: mostrar «Atacar ya»
    const presTxt = (p) => (p.pres.length ? p.pres.map((x) => t('gtm.pres.' + (x.type === 'subsidiary' ? 'subsidiary' : 'representative'))).join(' · ') : t('gtm.pres.none'));
    const show = (g) => {
      const p = byCc.get(g.dataset.cc); if (!p || !tip) return;
      tip.innerHTML = String(html`<p class="ed-tip-h">${ED.flag(p.cc)}<b>${p.name}</b><span class="ed-qchip" data-q="${p.q}">${t('gtm.q.' + p.q)}</span></p>
        <p class="mono">${t('gtm.m.tipN', { n: p.n, a: p.s.A || 0, b: p.s.B || 0, c: p.s.C || 0 })}</p>
        <p class="mono">${t('gtm.m.tipAcc', { s: p.sl.length, d: p.dl.length })}</p><p>${presTxt(p)}</p>
        <p class="ed-tip-c">${t('gtm.m.tipClick')}</p>`);
      tip.hidden = false;
      const fr = fig.getBoundingClientRect(), br = g.querySelector('circle').getBoundingClientRect();
      const w = tip.offsetWidth, h = tip.offsetHeight;
      let x = br.left - fr.left + br.width / 2 - w / 2, y = br.top - fr.top - h - 10;
      if (y < 0) y = br.bottom - fr.top + 10;
      x += fig.scrollLeft;
      tip.style.transform = `translate(${u.clamp(x, fig.scrollLeft, fig.scrollLeft + fr.width - w).toFixed(0)}px, ${y.toFixed(0)}px)`;
      g.classList.add('is-hot');
    };
    const hide = (g) => { if (tip) tip.hidden = true; g?.classList.remove('is-hot'); };
    const goCountry = (cc) => { close(); setTimeout(() => TL.nav?.country?.(cc), 60); };
    const goOpen = (id) => { close(); setTimeout(() => TL.nav?.open?.(id, { fly: true }), 60); };
    fig?.addEventListener('pointerover', (e) => { const g = e.target.closest('.ed-bub'); if (g) show(g); });
    fig?.addEventListener('pointerout', (e) => { const g = e.target.closest('.ed-bub'); if (g && !g.contains(e.relatedTarget)) hide(g); });
    fig?.addEventListener('focusin', (e) => { const g = e.target.closest('.ed-bub'); if (g) show(g); });
    fig?.addEventListener('focusout', (e) => { const g = e.target.closest('.ed-bub'); if (g) hide(g); });
    fig?.addEventListener('keydown', (e) => { const g = e.target.closest('.ed-bub'); if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); goCountry(g.dataset.cc); } });
    page.addEventListener('click', (e) => {
      const g = e.target.closest('.ed-bub, [data-cc]');
      if (g && g.dataset.cc) { goCountry(g.dataset.cc); return; }
      const o = e.target.closest('[data-open]');
      if (o) goOpen(o.dataset.open);
    });
  }

  /* ── Ciclo de vida ──────────────────────────────────────────────────── */
  let cur = null; // { api, page, cleanup }
  function mountInto(api, opts = {}) {
    const M = model();
    const page = u.el(build());
    if (cur?.page) { ED.unmount(cur.page, cur.cleanup); cur.page.remove(); }
    api.body.innerHTML = '';
    api.body.appendChild(page);
    const cleanup = ED.mount(api, page, opts);
    wireGtm(page, M);
    cur = { api, page, cleanup };
    return page;
  }
  function open(section) {
    if (!TL.ui?.overlay) return;
    const api = TL.ui.overlay.open({
      id: 'gtm', kicker: t('gtm.kicker'), title: t('gtm.ovTitle'), content: '', cls: 'ed-ov ed-ov-gtm',
      onClose: () => { if (cur && cur.api === api) { ED.unmount(cur.page, cur.cleanup); cur = null; } },
    });
    mountInto(api);
    if (section) { ED.scrollTo(section, false); requestAnimationFrame(() => ED.scrollTo(section, false)); }
    return api;
  }
  function close() { TL.ui?.overlay?.close('gtm'); }
  function rerender() {
    if (!cur || !TL.ui.overlay.isOpen('gtm')) return;
    const { api } = cur, sc = api.scroll;
    const ratio = sc ? sc.scrollTop / Math.max(1, sc.scrollHeight - sc.clientHeight) : 0;
    api.el.querySelector('.ov-kicker') && (api.el.querySelector('.ov-kicker').textContent = t('gtm.kicker'));
    api.el.querySelector('.ov-title') && (api.el.querySelector('.ov-title').textContent = t('gtm.ovTitle'));
    const xs = api.el.querySelector('.ov-x span'); if (xs) xs.textContent = t('ui.close');
    mountInto(api, { instant: true });
    if (sc) requestAnimationFrame(() => { sc.scrollTop = ratio * (sc.scrollHeight - sc.clientHeight); });
  }
  TL.on('lang', rerender);
  TL.on('data:changed', rerender);

  window.TL_GTM = { open, close, sections, isOpen: () => !!TL.ui?.overlay?.isOpen('gtm') };

  TL.views.register({
    id: 'gtm', order: 50, icon: 'gtm', label: 'rail.gtm', kind: 'action',
    run: () => window.TL_GTM.open(),
  });
})();
