/* ==========================================================================
   tl-map-intro.js — secuencia de apertura (globo → título → coroplético que se
   enciende país por país → cámara sobre Latinoamérica) y campo de estrellas.
   ========================================================================== */
(function () {
  'use strict';
  const { u } = TL;
  const M = TL.map;
  let tl = null, playing = false;

  /* Estrellas tenues en canvas estático (solo se ven en tema oscuro) */
  M.drawStars = function () {
    const c = document.getElementById('tl-stars'); if (!c) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1), w = innerWidth, h = innerHeight;
    c.width = w * dpr; c.height = h * dpr;
    const x = c.getContext('2d'); x.scale(dpr, dpr);
    let s = 7;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const n = Math.round((w * h) / 5200);
    for (let i = 0; i < n; i++) {
      const r = rnd() ** 3 * 1.15 + 0.2, a = 0.12 + rnd() * 0.55;
      x.fillStyle = rnd() > 0.86 ? `rgba(198,219,72,${a * 0.7})` : `rgba(190,215,240,${a})`;
      x.beginPath(); x.arc(rnd() * w, rnd() * h, r, 0, 6.283); x.fill();
    }
  };
  window.addEventListener('resize', u.debounce(() => M.drawStars(), 250));

  const setLit = (cc, v) => M.instance.setFeatureState({ source: 'countries', id: cc }, { lit: v });
  const litCountries = () => TL.data.geo.features.map((f) => f.properties).filter((p) => p.role !== 'other').map((p) => p.cc);

  function buildTitle() {
    const root = document.getElementById('intro-title'); if (!root) return [];
    const words = TL.i18n.t('intro.title').split(' ');
    root.innerHTML = words.map((w, i) => `<span class="w${i === words.length - 1 ? ' strong' : ''}"><span>${u.esc(w)}</span></span>`).join('');
    return Array.from(root.querySelectorAll('.w > span'));
  }
  function finish() {
    playing = false;
    document.body.classList.add('chrome-in');
    document.getElementById('tl-intro').style.visibility = 'hidden';
    litCountries().forEach((cc) => setLit(cc, 1));
    M.setPointScale?.(1, false);
    TL.set({ introDone: true });
    TL.emit('intro:done');
  }

  /** Reproduce la intro. opts.replay: vuelve a "inicio" con la secuencia completa. */
  M.intro = function (opts = {}) {
    const map = M.instance;
    if (!map || playing) return;
    playing = true;
    tl?.kill();
    const ccs = litCountries();
    const root = document.getElementById('tl-intro');

    if (TL.reduceMotion || !window.gsap || M._skipPending) {
      M._skipPending = false;
      document.body.classList.add('map-in');
      map.jumpTo({ center: M.HOME.center, zoom: M.HOME.zoom, pitch: 0, bearing: 0 });
      return finish();
    }
    // estado inicial
    ccs.forEach((cc) => setLit(cc, 0));
    M.setPointScale(0, false);
    map.jumpTo({ center: opts.replay ? map.getCenter() : [-28, 16], zoom: opts.replay ? 1.0 : 0.5, pitch: 0, bearing: 0 });
    M.setPadding(false);
    const words = buildTitle();
    root.style.visibility = 'visible';
    gsap.set('.intro-kicker', { opacity: 0, y: 8 });
    gsap.set('.intro-laser', { scaleX: 0 });
    gsap.set(words, { yPercent: 105, y: 0 });
    document.body.classList.add('map-in');
    M.spin(true);

    const cam = { z: map.getZoom() };
    const lit = { v: 0 };
    tl = gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete: () => { tl = null; } });
    tl.to(cam, { z: 1.45, duration: 4.2, ease: 'power1.inOut', onUpdate: () => map.getZoom() < 4 && M.isSpinning() && map.setZoom(cam.z) }, 0)
      .to('.intro-kicker', { opacity: 1, y: 0, duration: 0.8 }, 0.7)
      .to(words, { yPercent: 0, duration: 1.1, stagger: 0.12, ease: 'expo.out' }, 0.8)
      .to('.intro-laser', { scaleX: 1, duration: 1.2, ease: 'expo.inOut' }, 1.5)
      // el coroplético se enciende país por país (orden por cantidad de prospectos)
      .to(lit, { v: ccs.length, duration: 1.8, ease: 'none', onUpdate: () => {
        const order = ccs.slice().sort((a, b) => (TL.data.country(b)?.counts.clients || 0) - (TL.data.country(a)?.counts.clients || 0));
        order.forEach((cc, i) => { const k = u.clamp(lit.v - i, 0, 1); setLit(cc, k * k * (3 - 2 * k)); });
      } }, 2.2)
      .add(() => {
        const userTookControl = !M.isSpinning();   // un gesto del usuario ya detuvo la rotación
        M.spin(false);
        document.body.classList.add('chrome-in');
        if (!userTookControl) M.flyTo({ center: M.HOME.center, zoom: M.HOME.zoom, pitch: 0, bearing: 0, duration: 2600, curve: 1.1 });
      }, 4.1)
      .to(root, { opacity: 0, x: -24, duration: 0.9, ease: 'power2.in' }, 4.3)
      .add(() => {
        const o = { f: 0 };
        gsap.to(o, { f: 1, duration: 1.0, ease: 'power2.out', onUpdate: () => M.setPointScale(o.f, false) });
      }, 5.4)
      .add(() => { gsap.set(root, { opacity: 1, x: 0 }); finish(); }, 6.9);
    TL.once('map:interrupt', () => { /* reservado */ });
  };
  /** Salta la intro (primer gesto del usuario durante la secuencia). */
  M.skipIntro = function () {
    if (!playing) { if (!TL.state.introDone) M._skipPending = true; return; }
    tl?.progress(1); tl?.kill(); tl = null;
    M.spin(false);
    M.instance.jumpTo({ center: M.HOME.center, zoom: M.HOME.zoom, pitch: 0, bearing: 0 });
    gsap.set(document.getElementById('tl-intro'), { opacity: 1, x: 0 });
    finish();
  };
  M.isIntroPlaying = () => playing;
})();
