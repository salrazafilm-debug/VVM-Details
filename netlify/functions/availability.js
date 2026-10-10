const { loadCatalog, blocksByDay, json, fail, httpError, BOOKABLE } = require('../lib/square');
const { slotsForDay } = require('../lib/rules');

exports.handler = async (event) => {
  try {
    const { variation, month } = event.queryStringParameters || {};
    if (!/^\d{4}-\d{2}$/.test(month || '')) throw httpError(400, 'Invalid month.');
    const catalog = await loadCatalog();
    const v = catalog[variation];
    if (!v || !BOOKABLE.has(v.kind)) throw httpError(400, 'Unknown service.');

    const [y, m] = month.split('-').map(Number);
    const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
    const blocks = await blocksByDay(`${month}-01`, `${next}-01`, catalog);
    const now = new Date();
    const total = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const days = {};
    for (let d = 1; d <= total; d++) {
      const key = `${month}-${String(d).padStart(2, '0')}`;
      const slots = slotsForDay(key, blocks[key] || [], v, now);
      if (slots.length) days[key] = slots;
    }
    return json(200, { days });
  } catch (e) { return fail(e); }
};
