const { loadCatalog, json, fail, BOOKABLE } = require('../lib/square');

const ORDER = { full: 0, interior: 1, exterior: 2, ceramic: 3 };

exports.handler = async () => {
  try {
    const cat = await loadCatalog();
    const groups = {};
    for (const v of Object.values(cat)) {
      if (!BOOKABLE.has(v.kind) || !v.bookable || !v.durationMin) continue;
      const g = (groups[v.item] = groups[v.item] || { name: v.item, kind: v.kind, variations: [] });
      g.variations.push({ id: v.id, label: v.label, priceCents: v.priceCents, minutes: v.durationMin });
    }
    const list = Object.values(groups).sort((a, b) => ORDER[a.kind] - ORDER[b.kind]);
    list.forEach(g => g.variations.sort((a, b) => a.priceCents - b.priceCents));
    return json(200, { services: list });
  } catch (e) { return fail(e); }
};
