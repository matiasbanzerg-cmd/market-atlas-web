/* TL.trip — Planificador de VIAJE multi-país para el Sales Manager LATAM.
   Elegís origen, fecha, países, clientes y (opcional) el representante; calcula el orden óptimo de países (ida y vuelta),
   las visitas por día, vuelos (tiempo y costo estimados), hotel, viáticos y el presupuesto total, día por día.
   API: TL.trip = { open() } — se abre desde la vista Gira (botón "Planificar viaje"). */
(function () {
  const TL = window.TL; if (!TL) return;
  const u = TL.u, D = () => TL.data;
  const L = (es, de) => (TL.state.lang === 'de' ? de : es);
  const esc = (s) => u.esc(String(s ?? ''));
  const ORIGINS = [
    ['Santa Cruz de la Sierra', -17.78, -63.18], ['La Paz', -16.50, -68.15], ['Lima', -12.05, -77.04], ['Bogotá', 4.71, -74.07],
    ['Santiago de Chile', -33.45, -70.67], ['Buenos Aires', -34.60, -58.38], ['Ciudad de Panamá', 8.98, -79.52], ['Ditzingen (DE)', 48.83, 9.07]]
  // tarifa de hotel de negocios por noche (USD, estimación) por país
  const HOTEL = { AR: 130, CL: 140, CO: 115, PE: 120, EC: 110, VE: 120, UY: 145, PY: 100, BO: 95, GT: 115, CR: 135, PA: 145, SV: 110, HN: 105, NI: 95, BZ: 140, DO: 130, PR: 190, JM: 170, TT: 160, CU: 120, HT: 140, GY: 160, SR: 120 }
  const st = { origin: 0, start: nextMonday(), ccs: [], picks: {}, rep: {}, cand: {}, perDay: 3, perDiem: 75, fare: 1 }

  function nextMonday() { const d = new Date(); d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7)); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
  // ruta por tierra: factor de rodeo sobre la distancia en línea recta y velocidad media (km/h) según el relieve del país
  const ROAD = { AR: [1.15, 85], UY: [1.15, 80], PY: [1.2, 70], CL: [1.2, 80], CO: [1.45, 45], PE: [1.35, 50], EC: [1.35, 50], BO: [1.4, 45], VE: [1.35, 55] }
  const roadOf = (cc) => ROAD[cc] || [1.3, 55]
  const km = (a, b) => { const R = 6371, r = Math.PI / 180, dLa = (b[0] - a[0]) * r, dLo = (b[1] - a[1]) * r; const h = Math.sin(dLa / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLo / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)) }
  const flightH = (k) => 0.75 + k / 780 + (k > 2600 ? 1.5 : 0)           // incluye despegue/aterrizaje y una escala en tramos largos
  const flightUsd = (k) => Math.max(160, Math.round((90 + 0.13 * k) * st.fare / 10) * 10)
  const usd = (n) => 'US$ ' + TL.i18n.int(Math.round(n))
  const hm = (h) => `${Math.floor(h)} h ${String(Math.round((h % 1) * 60)).padStart(2, '0')}`
  const fmtDate = (d) => d.toLocaleDateString(TL.state.lang === 'de' ? 'de-DE' : 'es-AR', { weekday: 'short', day: 'numeric', month: 'short' })

  function countriesAvail() {
    return D().countries.filter((k) => k.role === 'target' && (D().clientsOf(k.cc).length || k.trumpf_rep || D().reps.some((r) => r.country === k.cc)))
      .sort((a, b) => D().clientsOf(b.cc).length - D().clientsOf(a.cc).length)
  }
  function topClients(cc) { return D().clientsOf(cc).slice().sort((a, b) => D().score(b) - D().score(a)).slice(0, 10) }
  function shortlist(cc) { return D().reps.filter((r) => r.country === cc && r.shortlist) }
  function toggleCountry(cc) {
    const i = st.ccs.indexOf(cc)
    if (i >= 0) { st.ccs.splice(i, 1); return }
    st.ccs.push(cc)
    if (!st.picks[cc]) st.picks[cc] = topClients(cc).filter((c) => c.tier !== 'C').slice(0, 3).map((c) => c.id)
    if (st.rep[cc] == null) st.rep[cc] = !!D().country(cc)?.trumpf_rep
    if (st.cand[cc] == null) st.cand[cc] = !D().country(cc)?.trumpf_rep && shortlist(cc).length > 0
  }

  /* ── Optimización ── */
  function stopsOf(cc) {
    const k = D().country(cc)
    const v = (st.picks[cc] || []).map((id) => D().rec(id)).filter((r) => r && isFinite(r.lat)).map((r) => ({ kind: 'client', id: r.id, name: r.name, city: r.city, lat: r.lat, lng: r.lng }))
    const tr = k?.trumpf_rep
    if (st.rep[cc] && tr) {                                                 // oficina real del representante (research/trumpf-reps.json); si falta, la capital
      const at = isFinite(tr.lat) ? { lat: tr.lat, lng: tr.lng, city: tr.city || '' } : { lat: k.center[1], lng: k.center[0], city: '' }
      v.push({ kind: 'rep', name: tr.name, city: at.city, lat: at.lat, lng: at.lng })
    }
    if (st.cand[cc]) for (const r of shortlist(cc).slice(0, 2)) if (isFinite(r.lat)) v.push({ kind: 'cand', id: r.id, name: r.name, city: r.city, lat: r.lat, lng: r.lng })
    return v
  }
  function cityOf(stops, cc) {
    if (!stops.length) { const k = D().country(cc); return { name: D().countryName(cc), lat: k.center[1], lng: k.center[0] } }
    const cnt = {}; stops.forEach((s) => { if (s.city) cnt[s.city] = (cnt[s.city] || 0) + 1 })
    const name = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0]?.[0] || D().countryName(cc)
    const lat = stops.reduce((a, s) => a + s.lat, 0) / stops.length, lng = stops.reduce((a, s) => a + s.lng, 0) / stops.length
    return { name, lat, lng }
  }
  // suburbios e industriales → ciudad con aeropuerto/negocios
  const METRO = { Lima: /callao|\bate\b|lur[ií]n|villa el salvador|chorrillos|los olivos|huachipa|santa anita|independencia|chilca|san juan de lurigancho|lima/i, 'Bogotá': /funza|mosquera|cota|toc[aá]ncip[aá]|soacha|madrid|siberia|bogot/i, 'Medellín': /itag[uü][ií]|envigado|rionegro|la estrella|sabaneta|bello|medell/i, Cali: /yumbo|palmira|jamund|\bcali\b/i, Pereira: /dosquebradas|pereira/i, Santiago: /quilicura|pudahuel|san bernardo|maip[uú]|lampa|renca|puente alto|cerrillos|santiago/i, 'Buenos Aires': /pilar|tigre|san mart[ií]n|matanza|avellaneda|lan[uú]s|quilmes|escobar|campana|garin|tortuguitas|buenos aires|caba/i, 'Ciudad de Guatemala': /mixco|villa nueva|amatitl|guatemala/i, Guayaquil: /dur[aá]n|guayaquil/i, 'Asunción': /luque|san lorenzo|fernando de la mora|mariano roque|limpio|capiat|asunci/i, 'San Salvador': /santa tecla|antiguo cuscatl|soyapango|ilopango|apopa|san salvador/i, 'San José': /heredia|alajuela|cartago|coyol|san jos/i, 'Santo Domingo': /haina|santo domingo/i, 'La Paz': /el alto|la paz/i, Montevideo: /las piedras|pando|montevideo/i, 'San Pedro Sula': /choloma|villanueva|san pedro sula/i }
  const metro = (city) => Object.keys(METRO).find((m) => METRO[m].test(city || '')) || city
  function bestOrder(origin, nodes) {                                       // TSP ida y vuelta: exacto hasta 8 países, si no vecino más cercano + 2-opt
    const n = nodes.length; if (n <= 1) return nodes.map((_, i) => i)
    const pts = [origin, ...nodes.map((x) => [x.lat, x.lng])]
    const d = (i, j) => km(pts[i], pts[j])
    const cost = (p) => { let s = d(0, p[0] + 1); for (let i = 1; i < p.length; i++) s += d(p[i - 1] + 1, p[i] + 1); return s + d(p[p.length - 1] + 1, 0) }
    if (n <= 8) {
      let best = null, bc = Infinity
      const perm = (arr, l) => { if (l === arr.length) { const c = cost(arr); if (c < bc) { bc = c; best = arr.slice() } return } for (let i = l; i < arr.length; i++) { [arr[l], arr[i]] = [arr[i], arr[l]]; perm(arr, l + 1); [arr[l], arr[i]] = [arr[i], arr[l]] } }
      perm(nodes.map((_, i) => i), 0); return best
    }
    let p = [], left = new Set(nodes.map((_, i) => i)), cur = 0
    while (left.size) { let b = -1, bd = Infinity; for (const i of left) { const x = d(cur, i + 1); if (x < bd) { bd = x; b = i } } p.push(b); left.delete(b); cur = b + 1 }
    for (let imp = true; imp;) { imp = false; for (let i = 0; i < n - 1; i++) for (let j = i + 1; j < n; j++) { const q = p.slice(0, i).concat(p.slice(i, j + 1).reverse(), p.slice(j + 1)); if (cost(q) < cost(p) - 1) { p = q; imp = true } } }
    return p
  }
  function orderStops(stops, from) {                                        // visitas dentro de la ciudad: primero el representante, luego vecino más cercano
    const out = stops.filter((s) => s.kind === 'rep'), left = stops.filter((s) => s.kind !== 'rep'); let cur = out.length ? [out[0].lat, out[0].lng] : from
    while (left.length) { let b = 0, bd = Infinity; left.forEach((s, i) => { const x = km(cur, [s.lat, s.lng]); if (x < bd) { bd = x; b = i } }); const s = left.splice(b, 1)[0]; out.push(s); cur = [s.lat, s.lng] }
    return out
  }
  function plan() {
    const o = ORIGINS[st.origin], origin = [o[1], o[2]]
    // nodos = ciudades reales (visitas a < 120 km se agrupan en la misma ciudad; suburbios → ciudad principal)
    const nodes = []
    for (const cc of st.ccs) {
      const stops = stopsOf(cc)
      if (!stops.length) { const c = cityOf([], cc); nodes.push({ cc, stops: [], city: c.name, lat: c.lat, lng: c.lng }); continue }
      for (const s of stops) {
        let g = nodes.find((n) => n.cc === cc && km([n.lat, n.lng], [s.lat, s.lng]) < 120)
        if (!g) { g = { cc, stops: [], lat: s.lat, lng: s.lng }; nodes.push(g) }
        g.stops.push(s); g.lat = g.stops.reduce((a, x) => a + x.lat, 0) / g.stops.length; g.lng = g.stops.reduce((a, x) => a + x.lng, 0) / g.stops.length
      }
    }
    nodes.forEach((n) => { if (!n.city) n.city = metro(cityOf(n.stops, n.cc).name) })
    if (!nodes.length) return null
    const order = bestOrder(origin, nodes).map((i) => nodes[i])
    const days = []; let date = new Date(st.start + 'T08:00:00'); const legs = []
    let prev = { name: o[0], lat: origin[0], lng: origin[1], cc: null }, cost = { flights: 0, hotel: 0, perDiem: 0, local: 0 }, totalKm = 0, visits = 0, nFlights = 0, ground$ = 0
    // cada día guarda dónde se duerme (sleep) para calcular el hotel; el día del regreso no tiene noche
    const newDay = (cc, title, items, sleep = cc) => { days.push({ date: new Date(date), cc, title, items, sleep }); date.setDate(date.getDate() + 1) }
    const nVisits = (d) => d.items.filter((x) => x.t === 'client' || x.t === 'rep' || x.t === 'cand').length
    // si el último día en la ciudad anterior termina al mediodía (≤ 2 visitas), el viaje se hace esa misma tarde y se gana un día
    const canLeaveAfternoon = (h, max = 4) => { const d = days[days.length - 1]; const vs = d && d.items.filter((x) => x.hr != null); return !!d && d.cc && vs.length > 0 && vs.length <= 2 && Math.max(...vs.map((x) => x.hr)) <= 11.5 && h <= max }
    const legOf = (from, to) => {
      const k = km([from.lat, from.lng], [to.lat, to.lng]), [f, v] = roadOf(to.cc), roadKm = k * f, roadH = 0.3 + roadKm / v
      const ground = from.cc && from.cc === to.cc && roadH <= 4                 // por tierra solo dentro del país y si son ≤ 4 h de ruta real
      return ground ? { ground, k, dist: roadKm, h: roadH, usd: Math.round(20 + 0.5 * roadKm) } : { ground, k, dist: k, h: flightH(k), usd: flightUsd(k) }
    }
    for (const nd of order) {
      const lg = legOf(prev, nd); totalKm += lg.dist
      if (lg.ground) ground$ += lg.usd; else { cost.flights += lg.usd; nFlights++ }
      legs.push([[prev.lng, prev.lat], [nd.lng, nd.lat]])
      const queue = orderStops(nd.stops, [nd.lat, nd.lng])
      const move = { t: lg.ground ? 'ground' : 'flight', txt: lg.ground ? L(`Traslado terrestre ${prev.name} → ${nd.city}`, `Landtransfer ${prev.name} → ${nd.city}`) : L(`Vuelo ${prev.name} → ${nd.city}`, `Flug ${prev.name} → ${nd.city}`), meta: `${hm(lg.h)} · ${TL.i18n.int(Math.round(lg.dist))} km · ${usd(lg.usd)}` }
      if (canLeaveAfternoon(lg.h)) {                                          // viaje por la tarde, al terminar las visitas
        const d = days[days.length - 1]; move.meta = L('Por la tarde', 'Nachmittags') + ' · ' + move.meta
        d.items.push(move); d.title = `${d.title} → ${nd.city}`; d.sleep = nd.cc
      } else {
        const items = [move]
        if (lg.h <= 2.2 && queue.length && ![0, 6].includes(date.getDay())) items.push(visitItem(queue.shift(), 15))   // viaje corto por la mañana: una visita por la tarde
        newDay(nd.cc, nd.city, items)
      }
      while (queue.length) {
        while ([0, 6].includes(date.getDay())) newDay(nd.cc, nd.city, [{ t: 'rest', txt: L('Fin de semana · preparación y seguimiento', 'Wochenende · Vorbereitung und Nachfassen') }])
        const items = []; for (let i = 0; i < st.perDay && queue.length; i++) items.push(visitItem(queue.shift(), [9, 11.5, 15, 17][i] ?? 17))
        newDay(nd.cc, nd.city, items)
      }
      visits += nd.stops.length
      prev = { name: nd.city, lat: nd.lat, lng: nd.lng, cc: nd.cc }
    }
    const kb = km([prev.lat, prev.lng], origin); totalKm += kb; const hb = flightH(kb), fb = flightUsd(kb); cost.flights += fb
    legs.push([[prev.lng, prev.lat], [origin[1], origin[0]]])
    const back = { t: 'flight', txt: L(`Vuelo de regreso ${prev.name} → ${o[0]}`, `Rückflug ${prev.name} → ${o[0]}`), meta: `${hm(hb)} · ${TL.i18n.int(Math.round(kb))} km · ${usd(fb)}` }
    if (canLeaveAfternoon(hb, 6)) { const d = days[days.length - 1]; back.meta = L('Por la tarde', 'Nachmittags') + ' · ' + back.meta; d.items.push(back); d.sleep = null }
    else newDay(null, o[0], [back], null)
    cost.hotel = days.reduce((a, d) => a + (d.sleep ? HOTEL[d.sleep] || 130 : 0), 0)
    cost.perDiem = days.length * st.perDiem
    cost.local = visits * 25 + order.length * 40 + ground$                  // taxis por visita + traslados aeropuerto + tramos por tierra
    const sub = cost.flights + cost.hotel + cost.perDiem + cost.local
    return { order, days, legs, totalKm, visits, cost, contingency: sub * 0.1, total: sub * 1.1, flights: nFlights + 1, countries: new Set(order.map((n) => n.cc)).size, cities: order.length }
    function visitItem(s, hr) { const lab = s.kind === 'rep' ? L('Representante TRUMPF', 'TRUMPF-Partner') : s.kind === 'cand' ? L('Candidato a representante', 'Partnerkandidat') : L('Cliente potencial', 'Potenzieller Kunde'); return { t: s.kind, hr, txt: s.name, meta: `${String(Math.floor(hr)).padStart(2, '0')}:${hr % 1 ? '30' : '00'} · ${lab}${s.city ? ' · ' + s.city : ''}`, id: s.id } }
  }

  /* ── Interfaz ── */
  let body = null, last = null, ovApi = null
  const route = () => [ORIGINS[st.origin][0], ...last.order.map((n) => n.city), ORIGINS[st.origin][0]].join(' → ')
  function render() {
    if (!body) return
    const avail = countriesAvail()
    const opt = (v, cur, label) => `<option value="${v}"${String(v) === String(cur) ? ' selected' : ''}>${esc(label)}</option>`
    const countryCfg = (cc) => {
      const k = D().country(cc), tr = k?.trumpf_rep, sl = shortlist(cc)
      const picks = topClients(cc).map((c) => `<label class="tv-pick"><input type="checkbox" data-pick="${cc}" value="${esc(c.id)}"${(st.picks[cc] || []).includes(c.id) ? ' checked' : ''}><span>${esc(c.name)}</span><em>${esc(c.tier)} · ${esc(c.city || '')}</em></label>`).join('')
      const rep = tr ? `<label class="tv-pick tv-rep"><input type="checkbox" data-rep="${cc}"${st.rep[cc] ? ' checked' : ''}><span>${esc(L('Reunión con el representante', 'Termin mit dem Partner'))}: ${esc(tr.name)}</span></label>` : ''
      const cand = !tr && sl.length ? `<label class="tv-pick tv-rep"><input type="checkbox" data-cand="${cc}"${st.cand[cc] ? ' checked' : ''}><span>${esc(L('Reunirse con candidatos a representante', 'Treffen mit Partnerkandidaten'))}: ${esc(sl.slice(0, 2).map((r) => r.name).join(', '))}</span></label>` : ''
      return `<div class="tv-country"><p class="tv-cc-h">${TL.ui.flag(cc, 14)}<b>${esc(D().countryName(cc))}</b></p><div class="tv-picks">${picks}</div>${rep}${cand}</div>`
    }
    const cfg = `<div class="tv-cfg">
      <div class="tv-row">
        <label>${esc(L('Origen', 'Abflugort'))}<select data-k="origin">${ORIGINS.map((o, i) => opt(i, st.origin, o[0])).join('')}</select></label>
        <label>${esc(L('Inicio', 'Start'))}<input type="date" data-k="start" value="${st.start}"></label>
        <label>${esc(L('Visitas por día', 'Besuche/Tag'))}<select data-k="perDay">${[2, 3, 4].map((n) => opt(n, st.perDay, n)).join('')}</select></label>
        <label>${esc(L('Tarifa aérea', 'Flugtarif'))}<select data-k="fare">${opt(1, st.fare, L('Económica', 'Economy'))}${opt(2.6, st.fare, 'Business')}</select></label>
      </div>
      <p class="tv-lbl">${esc(L('Países a visitar', 'Zu besuchende Länder'))}</p>
      <div class="tv-ccs">${avail.map((k) => `<button type="button" class="tv-cc" data-cc="${k.cc}" aria-pressed="${st.ccs.includes(k.cc)}">${TL.ui.flag(k.cc, 14)}${esc(D().countryName(k.cc))}<b class="num">${D().clientsOf(k.cc).length}</b></button>`).join('')}</div>
      ${st.ccs.map(countryCfg).join('')}
    </div>`
    last = st.ccs.length ? plan() : null
    let res = `<div class="tv-empty">${esc(L('Elegí uno o más países para armar el viaje.', 'Wähle ein oder mehrere Länder für die Reise.'))}</div>`
    if (last) {
      const kpis = [[L('Días', 'Tage'), last.days.length], [L('Países', 'Länder'), last.countries], [L('Ciudades', 'Städte'), last.cities], [L('Visitas', 'Besuche'), last.visits], [L('Vuelos', 'Flüge'), last.flights], ['km', TL.i18n.int(Math.round(last.totalKm))], [L('Presupuesto', 'Budget'), usd(last.total)]]
      const days = last.days.map((d, i) => `<li><p class="tv-day"><b class="num">${esc(L('Día', 'Tag'))} ${i + 1}</b><span>${esc(fmtDate(d.date))}</span>${d.cc ? TL.ui.flag(d.cc, 13) : ''}<em>${esc(d.title)}</em></p><ul>${d.items.map((it) => `<li class="tv-it tv-${it.t}"><span>${esc(it.txt)}</span>${it.meta ? `<small>${esc(it.meta)}</small>` : ''}</li>`).join('')}</ul></li>`).join('')
      const budget = [[L('Vuelos', 'Flüge'), last.cost.flights], [L('Hoteles', 'Hotels'), last.cost.hotel], [L('Viáticos', 'Tagegeld'), last.cost.perDiem], [L('Transporte local', 'Lokaler Transport'), last.cost.local], [L('Imprevistos (10 %)', 'Reserve (10 %)'), last.contingency]]
      res = `<div class="tv-res">
        <div class="tv-kpis">${kpis.map(([a, b]) => `<div><span>${esc(a)}</span><b class="num">${b}</b></div>`).join('')}</div>
        <p class="tv-lbl">${esc(L('Recorrido óptimo', 'Optimale Reihenfolge'))}: ${esc(route())}</p>
        <ol class="tv-days">${days}</ol>
        <table class="tv-budget"><tbody>${budget.map(([a, b]) => `<tr><td>${esc(a)}</td><td class="num">${usd(b)}</td></tr>`).join('')}<tr class="tv-tot"><td>${esc(L('Total estimado', 'Geschätzte Summe'))}</td><td class="num">${usd(last.total)}</td></tr></tbody></table>
        <p class="tv-note">${esc(L('Estimaciones de referencia: tarifa aérea según distancia, hotel de negocios por país, viáticos de US$ 75 por día y taxis por visita. Ajustar con la agencia de viajes.', 'Richtwerte: Flugpreis nach Distanz, Businesshotel je Land, 75 US$ Tagegeld und Taxi je Besuch. Mit dem Reisebüro abstimmen.'))}</p>
        <div class="tv-act"><button type="button" class="btn btn-sm" data-act="map">${esc(L('Ver en el mapa', 'Auf der Karte'))}</button><button type="button" class="btn btn-sm btn-ghost" data-act="copy">${esc(L('Copiar itinerario', 'Reiseplan kopieren'))}</button><button type="button" class="btn btn-sm btn-ghost" data-act="xlsx">Excel</button><button type="button" class="btn btn-sm btn-ghost" data-act="print">${esc(L('Imprimir / PDF', 'Drucken / PDF'))}</button></div>
      </div>`
    }
    body.innerHTML = `<div class="tv">${cfg}${res}</div>`
  }
  function text() {
    if (!last) return ''
    const lines = last.days.map((d, i) => `${L('Día', 'Tag')} ${i + 1} (${fmtDate(d.date)}) ${d.title}: ` + d.items.map((x) => x.txt + (x.meta ? ' [' + x.meta + ']' : '')).join(' | '))
    return [L('Viaje', 'Reise') + ': ' + route(), ...lines, L('Total estimado', 'Geschätzte Summe') + ': ' + usd(last.total)].join('\n')
  }
  function onClick(e) {
    const ccBtn = e.target.closest('.tv-cc'); if (ccBtn) { toggleCountry(ccBtn.dataset.cc); render(); return }
    const act = e.target.closest('[data-act]')?.dataset.act; if (!act || !last) return
    if (act === 'map') {
      const pts = [last.legs[0][0], ...last.legs.map((l) => l[1])]
      ovApi?.close()
      TL.map.addRoute?.(pts, ['●', ...last.order.map((n, i) => String(i + 1)), '●'])
      TL.map.home?.({ zoom: 2.4 })
    }
    if (act === 'copy') navigator.clipboard?.writeText(text()).then(() => TL.ui.toast?.(L('Itinerario copiado', 'Reiseplan kopiert'))).catch(() => {})
    if (act === 'print') window.print()
    if (act === 'xlsx' && window.XLSX) {
      const rows = []
      last.days.forEach((d, i) => d.items.forEach((x) => rows.push({ [L('Día', 'Tag')]: i + 1, [L('Fecha', 'Datum')]: d.date.toISOString().slice(0, 10), [L('Ciudad', 'Stadt')]: d.title, [L('Actividad', 'Aktivität')]: x.txt, [L('Detalle', 'Detail')]: x.meta || '' })))
      rows.push({}, { [L('Actividad', 'Aktivität')]: L('Total estimado', 'Geschätzte Summe'), [L('Detalle', 'Detail')]: usd(last.total) })
      const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), L('Itinerario', 'Reiseplan')); XLSX.writeFile(wb, 'viaje-latam.xlsx')
    }
  }
  function onChange(e) {
    const el = e.target
    if (el.dataset.k) { st[el.dataset.k] = el.dataset.k === 'start' ? el.value : Number(el.value); render(); return }
    if (el.dataset.pick) { const cc = el.dataset.pick, s = new Set(st.picks[cc] || []); el.checked ? s.add(el.value) : s.delete(el.value); st.picks[cc] = [...s]; render(); return }
    if (el.dataset.rep) { st.rep[el.dataset.rep] = el.checked; render(); return }
    if (el.dataset.cand) { st.cand[el.dataset.cand] = el.checked; render() }
  }
  TL.trip = {
    open() {
      const ov = ovApi = TL.ui.overlay.open({ id: 'trip', kicker: L('Gira', 'Reise'), title: L('Planificador de viaje LATAM', 'Reiseplaner LATAM'), cls: 'ov-trip' })
      body = (ov?.el || document.querySelector('.overlay[data-id="trip"]'))?.querySelector('.ov-body')
      if (!body) return
      if (!st.ccs.length) ['PE', 'CO'].forEach((cc) => D().country(cc) && toggleCountry(cc))
      body.addEventListener('click', onClick); body.addEventListener('change', onChange)
      render()
    },
  }
  document.addEventListener('click', (e) => { if (e.target.closest('[data-trip-open]')) TL.trip.open() })
})();
