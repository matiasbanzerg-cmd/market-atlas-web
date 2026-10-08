/* TL.countryPage — ficha COMPLETA de un país en pantalla completa: todo lo investigado en un solo lugar.
   API: TL.countryPage.open(cc). Se abre desde la vista de país (botón "Ficha completa del país"). */
(function () {
  const TL = window.TL; if (!TL) return;
  const u = TL.u, D = () => TL.data, I = () => TL.i18n;
  const L = (es, de) => (TL.state.lang === 'de' ? de : es);
  const e = (s) => u.esc(String(s ?? ''));
  const pick = (o, k) => (o ? I().pick(o, k) : '') || '';
  const usd = (n) => (n ? 'US$ ' + I().int(Math.round(n / 1e6)) + ' M' : '—');
  const TECH = { laser: ['Corte láser', 'Laserschneiden'], bending: ['Plegado CNC', 'Abkanten'], punching: ['Punzonado', 'Stanzen'], plasma: ['Plasma / oxicorte', 'Plasma-/Brennschneiden'], tube: ['Corte de tubos', 'Rohrschneiden'], welding_robot: ['Soldadura robotizada', 'Roboterschweißen'], waterjet: ['Corte por agua', 'Wasserstrahl'], cnc: ['Mecanizado / CNC', 'CNC-Fertigung'], stamping: ['Estampado / prensas', 'Umformen / Pressen'] };
  const sec = (title, body, aux = '') => body ? `<section class="cp-sec"><h3 class="cp-h">${e(title)}${aux ? `<span class="num">${aux}</span>` : ''}</h3>${body}</section>` : '';
  const cell = (l, v) => (v == null || v === '' ? '' : `<div class="cp-kpi"><span>${e(l)}</span><b class="num">${e(v)}</b></div>`);
  let ovApi = null;

  function build(cc) {
    const k = D().country(cc); if (!k) return '';
    const it = k.intel || {}, eco = it.economy || {}, imp = it.imports || {}, notes = it.notes_es || {};
    const clients = D().clientsOf(cc).slice().sort((a, b) => D().score(b) - D().score(a));
    const reps = D().reps.filter((r) => r.country === cc).sort((a, b) => (b.shortlist ? 1 : 0) - (a.shortlist ? 1 : 0) || (b.fit?.total || 0) - (a.fit?.total || 0));
    const opps = (D().opps || []).filter((o) => o.country === cc).sort((a, b) => (b.amount_usd || 0) - (a.amount_usd || 0));
    const tier = (t) => clients.filter((c) => c.tier === t).length;
    const impTot = (imp.items || []).reduce((a, x) => a + (x.usd || 0), 0);
    const tr = k.trumpf_rep;

    const kpis = `<div class="cp-kpis">${cell(L('Prospectos', 'Interessenten'), clients.length)}${cell('Tier A', tier('A'))}${cell('Tier B', tier('B'))}${cell(L('Candidatos a representante', 'Partnerkandidaten'), reps.length)}${cell(L('Oportunidades', 'Chancen'), opps.length)}${cell(L('Inversión en el radar', 'Investitionen im Radar'), usd(opps.reduce((a, o) => a + (o.amount_usd || 0), 0)))}${cell(L('Importación de máquinas', 'Maschinenimporte') + (imp.year ? ' ' + imp.year : ''), impTot ? 'US$ ' + I().dec(impTot / 1e6, 1) + ' M' : '')}</div>`;

    const repHtml = tr
      ? `<div class="cp-rep"><span class="cp-rep-logo" style="background:${tr.logo_bg === 'dark' ? '#0D1520' : '#FFFFFF'}">${tr.logo ? `<img src="${e(tr.logo)}" alt="">` : e(tr.name.slice(0, 2))}</span><div><p class="cp-k">${e(tr.type === 'filial' ? L('Filial TRUMPF', 'TRUMPF-Tochtergesellschaft') : L('Representante oficial TRUMPF', 'Offizieller TRUMPF-Vertriebspartner'))}</p><p class="cp-rep-n">${e(tr.name)}</p>${tr.address ? `<p class="cp-rep-a">${e(tr.address)}</p>` : ''}${tr.url ? `<a href="${e(tr.url)}" target="_blank" rel="noopener">${e(tr.url.replace(/^https?:\/\/(www\.)?/, ''))}</a>` : ''}</div></div>`
      : `<p class="cp-p">${e(L('TRUMPF no tiene representante en este país.', 'TRUMPF hat in diesem Land keinen Vertriebspartner.'))}${reps.filter((r) => r.shortlist).length ? ' ' + e(L('Candidatos recomendados: ', 'Empfohlene Kandidaten: ')) + reps.filter((r) => r.shortlist).map((r) => `<b>${e(r.name)}</b>`).join(', ') + '.' : ''}</p>`;

    const market = `${`<div class="cp-kpis cp-kpis-s">${cell(L('Población', 'Bevölkerung'), eco.population_m != null ? I().dec(eco.population_m, 1) + ' M' : '')}${cell(L('PIB', 'BIP'), eco.gdp_usd_bn != null ? 'US$ ' + I().int(eco.gdp_usd_bn) + L(' mil M', ' Mrd.') : '')}${cell(L('Crecimiento', 'Wachstum'), eco.gdp_growth_pct != null ? I().dec(eco.gdp_growth_pct, 1) + ' %' : '')}${cell(L('Industria / PIB', 'Industrie / BIP'), eco.manufacturing_pct_gdp != null ? I().dec(eco.manufacturing_pct_gdp, 1) + ' %' : '')}${cell(L('Potencial', 'Potenzial'), k.potential ? I().t('potential.' + k.potential) : '')}</div>`}
      ${pick(it, 'metalworking') ? `<p class="cp-p">${e(pick(it, 'metalworking'))}</p>` : ''}
      ${it.potential ? `<p class="cp-p"><b>${e(L('Potencial', 'Potenzial'))}:</b> ${e(pick(it.potential, 'rationale'))}${it.potential.est_units_year ? ` <span class="cp-muted">${e(pick(it.potential, 'est_units_year'))}</span>` : ''}</p>` : ''}`;

    const impHtml = (imp.items || []).length ? `<table class="cp-t"><tbody>${imp.items.map((x) => `<tr><td>${e(pick(x, 'label'))} <span class="cp-muted">HS ${e(x.hs)}</span></td><td class="num">${x.usd ? 'US$ ' + I().dec(x.usd / 1e6, 1) + ' M' : '—'}</td></tr>`).join('')}</tbody></table>
      ${(imp.origins || []).length ? `<div class="cp-bars">${imp.origins.slice(0, 6).map((o) => `<div><span>${e(o.country)}</span><i style="--w:${Math.min(100, o.share_pct || 0)}%"></i><b class="num">${o.share_pct != null ? I().dec(o.share_pct, 1) + ' %' : ''}</b></div>`).join('')}</div>` : ''}
      ${pick(imp, 'note') ? `<p class="cp-muted cp-small">${e(pick(imp, 'note'))}</p>` : ''}` : '';

    const notesHtml = ['tariffs', 'financing', 'currency', 'logistics'].map((n) => { const v = (it[TL.state.lang === 'de' ? 'notes_de' : 'notes_es'] || notes)[n] || notes[n]; return v ? `<p class="cp-p"><b>${e({ tariffs: L('Aranceles', 'Zölle'), financing: L('Financiamiento', 'Finanzierung'), currency: L('Moneda', 'Währung'), logistics: L('Logística', 'Logistik') }[n])}:</b> ${e(v)}</p>` : '' }).join('');

    const compPres = (it.competitors || []).filter((x) => x.brand && x.presence && !/sin_presencia/.test(x.presence));
    const bc = {}; clients.forEach((c) => (c.machines || []).forEach((m) => { const b = String(m.brand || '').trim(); if (b) bc[b] = (bc[b] || 0) + 1; }));
    const tc = {}; clients.forEach((c) => (c.tech || []).forEach((t) => { tc[t] = (tc[t] || 0) + 1; }));
    const compHtml = `${compPres.length ? `<p class="cp-k">${e(L('Presencia comercial', 'Vertriebspräsenz'))}</p><div class="cp-chips">${compPres.map((x) => `<span><b>${e(x.brand)}</b> ${e(x.presence === 'filial' ? L('filial', 'Tochter') : L('distribuidor', 'Händler'))}${x.partner ? ' · ' + e(String(x.partner).replace(/\s*\(.*\)\s*$/, '')) : ''}</span>`).join('')}</div>` : ''}
      ${Object.keys(bc).length ? `<p class="cp-k">${e(L('Marcas detectadas en las empresas', 'In den Firmen erkannte Marken'))}</p><div class="cp-chips">${Object.entries(bc).sort((a, b) => b[1] - a[1]).map(([b, n]) => `<span><b>${e(b)}</b> ${n}</span>`).join('')}</div>` : ''}
      ${Object.keys(tc).length ? `<p class="cp-k">${e(L('Tecnología declarada por las empresas', 'Technologie laut Firmenangaben'))}</p><div class="cp-chips">${Object.entries(tc).sort((a, b) => b[1] - a[1]).map(([t, n]) => `<span>${e(TECH[t] ? TECH[t][TL.state.lang === 'de' ? 1 : 0] : t)} <b class="num">${n}</b></span>`).join('')}</div>` : ''}`;

    const oppHtml = opps.length ? `<ul class="cp-list">${opps.map((o) => `<li><div><b>${e(pick(o, 'title'))}</b><span>${e([o.status, o.date, o.city].filter(Boolean).join(' · '))}</span>${pick(o, 'description') ? `<p>${e(pick(o, 'description'))}</p>` : ''}</div><div class="cp-r">${o.amount_usd ? `<b class="num">${usd(o.amount_usd)}</b>` : `<span>${e(o.amount_text || '')}</span>`}${o.source_url ? `<a href="${e(o.source_url)}" target="_blank" rel="noopener">${e(L('Fuente', 'Quelle'))}</a>` : ''}</div></li>`).join('')}</ul>` : '';
    const fairs = (it.fairs || []).filter((f) => f && f.name);
    const fairHtml = fairs.length ? `<ul class="cp-list">${fairs.map((f) => `<li><div><b>${f.url ? `<a href="${e(f.url)}" target="_blank" rel="noopener">${e(f.name)}</a>` : e(f.name)}</b></div><div class="cp-r"><span>${e([f.month, f.city].filter(Boolean).join(' · '))}</span></div></li>`).join('')}</ul>` : '';
    const assoc = (it.associations || []).filter((a) => a && a.name);
    const assocHtml = assoc.length ? `<div class="cp-chips">${assoc.map((a) => a.url ? `<a href="${e(a.url)}" target="_blank" rel="noopener">${e(a.name)}</a>` : `<span>${e(a.name)}</span>`).join('')}</div>` : '';

    const cliHtml = clients.length ? `<table class="cp-t cp-rows"><thead><tr><th>${e(L('Empresa', 'Firma'))}</th><th>${e(L('Ciudad', 'Stadt'))}</th><th>${e(L('Rubro', 'Branche'))}</th><th>${e(L('Máquinas / tecnología', 'Maschinen / Technologie'))}</th><th>Tier</th></tr></thead><tbody>${clients.map((c) => `<tr data-open="${e(c.id)}"><td><b>${e(c.name)}</b></td><td>${e(c.city || '')}</td><td>${e((c.sectors || []).slice(0, 2).map((s) => D().sectorName ? D().sectorName(s) : s).join(' · '))}</td><td>${e([...(c.machines || []).map((m) => m.brand).filter(Boolean), ...(c.tech || []).map((t) => TECH[t] ? TECH[t][TL.state.lang === 'de' ? 1 : 0] : t)].slice(0, 4).join(' · '))}</td><td><span class="cp-tier t-${e(c.tier)}">${e(c.tier)} ${Math.round(D().score(c))}</span></td></tr>`).join('')}</tbody></table>` : '';
    const repsHtml = reps.length ? `<table class="cp-t cp-rows"><thead><tr><th>${e(L('Empresa', 'Firma'))}</th><th>${e(L('Ciudad', 'Stadt'))}</th><th>${e(L('Marcas que representa', 'Vertretene Marken'))}</th><th>${e(L('Idoneidad', 'Eignung'))}</th></tr></thead><tbody>${reps.map((r) => `<tr data-rep="${e(r.id)}"><td><b>${e(r.name)}</b>${r.shortlist ? ` <span class="cp-badge">${e(L('Recomendado', 'Empfohlen'))}</span>` : ''}${r.competitor_conflict?.conflict ? ` <span class="cp-badge cp-warn">${e(L('Vende competencia', 'Führt Wettbewerb'))}</span>` : ''}</td><td>${e(r.city || '')}</td><td>${e((r.brands || []).map((b) => b.brand).slice(0, 5).join(' · '))}</td><td class="num">${e(r.fit?.total ?? '')}</td></tr>`).join('')}</tbody></table>` : '';
    const srcHtml = (it.sources || []).length ? `<ul class="cp-src">${it.sources.slice(0, 20).map((s) => `<li><a href="${e(s.url)}" target="_blank" rel="noopener">${e(s.label || s.url)}</a></li>`).join('')}</ul>` : '';

    return `<div class="cp">
      <header class="cp-head">${TL.ui.flag(cc, 28)}<div><p class="cp-k">${e(L('Ficha de país', 'Länderprofil'))}</p><h2>${e(D().countryName(cc))}</h2></div></header>
      ${kpis}
      ${sec(L('Representación TRUMPF', 'TRUMPF-Vertretung'), repHtml)}
      ${sec(L('Mercado', 'Markt'), market + notesHtml)}
      ${sec(L('Importación de máquinas para chapa', 'Importe von Blechbearbeitungsmaschinen'), impHtml, imp.year || '')}
      ${sec(L('Competencia', 'Wettbewerb'), compHtml)}
      ${sec(L('Radar de oportunidades', 'Investitionsradar'), oppHtml, opps.length)}
      ${sec(L('Ferias y fechas clave', 'Messen und wichtige Termine'), fairHtml)}
      ${sec(L('Cámaras y asociaciones', 'Verbände'), assocHtml)}
      ${sec(L('Clientes potenciales', 'Potenzielle Kunden'), cliHtml, clients.length)}
      ${sec(L('Candidatos a representante', 'Partnerkandidaten'), repsHtml, reps.length)}
      ${sec(L('Fuentes', 'Quellen'), srcHtml)}
    </div>`;
  }

  TL.countryPage = {
    open(cc) {
      const k = D().country(cc); if (!k) return;
      ovApi = TL.ui.overlay.open({ id: 'country', kicker: L('País', 'Land'), title: D().countryName(cc), cls: 'ov-country', content: '' });
      const body = ovApi?.body; if (!body) return;
      body.innerHTML = build(cc);
      body.addEventListener('click', (ev) => {
        const c = ev.target.closest('[data-open]'); if (c) { ovApi?.close(); TL.ficha?.open?.(c.dataset.open); return; }
        const r = ev.target.closest('[data-rep]'); if (r) { ovApi?.close(); TL.ficha?.openRep?.(r.dataset.rep); }
      });
    },
  };
  document.addEventListener('click', (ev) => { const b = ev.target.closest('[data-country-open]'); if (b) TL.countryPage.open(b.dataset.countryOpen); });
})();
