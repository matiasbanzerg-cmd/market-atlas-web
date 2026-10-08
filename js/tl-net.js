/* ==========================================================================
   tl-net.js — llamadas a n8n (TL_CONFIG.n8n). POST JSON con "key".
   call() SIEMPRE resuelve: respuesta {ok:true,...} o {ok:false, offline, error}.
   ========================================================================== */
(function () {
  'use strict';
  const cfg = () => (window.TL_CONFIG && window.TL_CONFIG.n8n) || {};
  const N = (TL.net = {});
  N.online = navigator.onLine !== false;
  window.addEventListener('online', () => { N.online = true; TL.emit('net', true); });
  window.addEventListener('offline', () => { N.online = false; TL.emit('net', false); });

  /** ¿Hay endpoint configurado para este nombre? ('ask','visit','investigate','crm','radar') */
  N.has = (name) => typeof cfg()[name] === 'string' && /^https?:\/\//i.test(cfg()[name]);
  N.configured = () => ['ask', 'visit', 'investigate', 'crm', 'radar'].some(N.has);

  N.call = async function (name, body = {}, { timeout = 45000 } = {}) {
    if (!N.has(name)) return { ok: false, offline: false, unconfigured: true, error: 'unconfigured' };
    if (!N.online) return { ok: false, offline: true, error: 'offline' };
    const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = setTimeout(() => ctrl?.abort(), timeout);
    try {
      const res = await fetch(cfg()[name], {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctrl?.signal,
        body: JSON.stringify(Object.assign({ key: cfg().key || '', lang: TL.state.lang }, body)),
      });
      const text = await res.text();
      let data = null;
      try { data = text ? JSON.parse(text) : {}; } catch (e) { data = null; }
      if (Array.isArray(data) && data.length === 1 && typeof data[0] === 'object') data = data[0];   // n8n a veces envuelve en array
      if (!res.ok || !data || typeof data !== 'object') return { ok: false, offline: false, status: res.status, error: (data && data.error) || 'http ' + res.status };
      if (data.ok === undefined) data.ok = true;
      return data;
    } catch (err) {
      const aborted = err && err.name === 'AbortError';
      return { ok: false, offline: !aborted, timeout: aborted, error: String(err && err.message || err) };
    } finally { clearTimeout(timer); }
  };
})();
