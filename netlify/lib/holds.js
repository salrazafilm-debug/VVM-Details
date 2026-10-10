// Holds: a reserved time is blocked on the site right away, before it is entered in Square.
// A hold disappears when a Square booking appears at the same time, or after HOLD_DAYS.
// Everything here fails open: if storage is unavailable the site still works, just without holds.
const TTL_MS = Number(process.env.HOLD_DAYS || 3) * 86400000;

function openStore(event) {
  const blobs = require('@netlify/blobs');
  blobs.connectLambda(event);
  return blobs.getStore('holds');
}

async function readHolds(store, month, now = Date.now()) {
  const out = {};
  const { blobs } = await store.list({ prefix: month });
  await Promise.all(blobs.map(async ({ key }) => {
    const h = await store.get(key, { type: 'json' });
    if (!h || h.expires < now) { await store.delete(key).catch(() => {}); return; }
    (out[h.date] = out[h.date] || []).push({ ...h, key });
  }));
  return out;
}

// days: Square blocks by date. Holds already covered by a Square booking at the same start are dropped.
function mergeHolds(days, holds) {
  const merged = {};
  for (const [d, list] of Object.entries(days)) merged[d] = [...list];
  const obsolete = [];
  for (const [date, list] of Object.entries(holds)) {
    for (const h of list) {
      if ((days[date] || []).some(b => Math.abs(b.start - h.start) <= 30)) { obsolete.push(h.key); continue; }
      (merged[date] = merged[date] || []).push({ start: h.start, end: h.end, kind: h.kind });
    }
  }
  return { merged, obsolete };
}

async function blocksWithHolds(event, days, month, store) {
  try {
    store = store || openStore(event);
    const { merged, obsolete } = mergeHolds(days, await readHolds(store, month));
    obsolete.forEach(k => store.delete(k).catch(() => {}));
    return merged;
  } catch (e) {
    console.error('holds unavailable:', e.message);
    return days;
  }
}

async function addHold(event, hold, store) {
  try {
    store = store || openStore(event);
    const key = `${hold.date}/${hold.start}-${Math.random().toString(36).slice(2, 8)}`;
    await store.setJSON(key, { ...hold, expires: Date.now() + TTL_MS });
  } catch (e) {
    console.error('could not save hold:', e.message);
  }
}

module.exports = { blocksWithHolds, addHold, mergeHolds, readHolds };
