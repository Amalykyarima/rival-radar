/* Shared demo store: the storefront and the dashboard read and write the same browser storage,
   so open shop.html and index.html in two tabs and they stay in sync.
   In production this is the platform's database. */
(function () {
  const KEY = "priceRadar.demo.v1";
  const blank = () => ({ events: [], emails: [], purchases: [], promos: [], session: null });
  function read() {
    try { return Object.assign(blank(), JSON.parse(localStorage.getItem(KEY) || "{}")); } catch { return blank(); }
  }
  function write(s) {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
    listeners.forEach(f => f());
  }
  const listeners = [];
  let last = JSON.stringify(read());
  window.addEventListener("storage", e => { if (e.key === KEY) { last = e.newValue; listeners.forEach(f => f()); } });
  setInterval(() => { const now = JSON.stringify(read()); if (now !== last) { last = now; listeners.forEach(f => f()); } }, 1500);

  function healthy() {
    try { localStorage.setItem(KEY + ".probe", "1"); const ok = localStorage.getItem(KEY + ".probe") === "1"; localStorage.removeItem(KEY + ".probe"); return ok; } catch { return false; }
  }
  window.PR_BUILD = "build 13";
  window.PRStore = {
    get: read,
    status() {
      const ok = healthy(), file = location.protocol === "file:";
      return { ok: ok && !file, warn: !ok ? "Browser storage is blocked here, so the two pages can't share data. Open demo.html from the local server (python3 -m http.server 8000)."
        : file ? "Opened as a file. Some browsers won't share data between files. Use http://localhost:8000/demo.html instead." : "",
        where: location.origin === "null" ? location.protocol : location.origin };
    },
    addEvent(e) { const s = read(); s.events.push({ ...e, at: e.at || new Date().toISOString() }); write(s); },
    addEmail(m) { const s = read(); s.emails.push({ ...m, id: m.id || "em" + Date.now() + Math.random().toString(36).slice(2, 5), sent_at: new Date().toISOString() }); write(s); },
    addPurchase(p) { const s = read(); s.purchases.push({ ...p, at: new Date().toISOString() }); write(s); },
    setSession(userId, tab) { const s = read(); s.session = userId; s.sessionTab = tab || null; s.sessionAt = Date.now(); write(s); },
    clearInbox(email) { const s = read(); const t = new Date().toISOString(); s.emails.forEach(m => { if (m.to_email === email && !m.cleared_at) m.cleared_at = t; }); write(s); },
    revoke(ids) { const s = read(); const t = new Date().toISOString(); s.emails.forEach(m => { if (ids.includes(m.id) && !m.revoked_at) m.revoked_at = t; }); s.promos.forEach(p => { if (ids.includes(p.id) && !p.revoked_at) p.revoked_at = t; }); write(s); },
    addPromo(p) { const s = read(); s.promos.push({ ...p, created_at: new Date().toISOString() }); write(s); },
    resetUser(userId, email) { const s = read();
      s.events = s.events.filter(e => e.user_id !== userId); s.emails = s.emails.filter(m => m.to_email !== email); s.purchases = s.purchases.filter(p => p.user_id !== userId); write(s); },
    reset() { write(blank()); },
    subscribe(f) { listeners.push(f); }
  };
})();
