// Pure booking rules. No network calls, so they can be tested offline.
const TZ = 'America/New_York';
const CFG = {
  firstStart: 7 * 60,   // 7:00 AM
  lastStart: 14 * 60,   // 2:00 PM
  step: 30,             // minutes between offered start times
  maxPerDay: 2,
  maxShortPerDay: 3,    // allowed only when every job that day is interior-only or exterior-only
  minNoticeHours: Number(process.env.MIN_NOTICE_HOURS || 12),
  maxDaysAhead: Number(process.env.MAX_DAYS_AHEAD || 365),
  // A new job may only go before an existing booking if the free time before it is at least this long.
  // Stops short jobs being squeezed in ahead of a late-morning booking.
  minWindowMin: Number(process.env.MIN_WINDOW_MIN || 300),
};

const dtf = new Intl.DateTimeFormat('en-US', {
  timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
});
function parts(d) {
  const p = Object.fromEntries(dtf.formatToParts(d).map(x => [x.type, x.value]));
  return { y: +p.year, mo: +p.month, d: +p.day, h: +p.hour, mi: +p.minute, s: +p.second };
}
const pad = n => String(n).padStart(2, '0');
function offsetMinutes(d) {
  const p = parts(d);
  return (Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi, p.s) - d.getTime()) / 60000;
}
// 'YYYY-MM-DD' + minutes after local midnight -> UTC Date
function localToUtc(dateStr, minutes) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const guess = new Date(Date.UTC(y, m - 1, d, 0, minutes));
  let utc = new Date(guess.getTime() - offsetMinutes(guess) * 60000);
  const off2 = offsetMinutes(utc);
  utc = new Date(guess.getTime() - off2 * 60000);
  return utc;
}
function utcToLocal(date) {
  const p = parts(date);
  return { date: `${p.y}-${pad(p.mo)}-${pad(p.d)}`, minutes: p.h * 60 + p.mi };
}
const toHHMM = m => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
const fromHHMM = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

function kindOf(itemName) {
  const n = String(itemName || '').toLowerCase();
  if (n.includes('full factory')) return 'full';
  if (n.includes('paint enhancement') || n.includes('ceramic coating')) return 'ceramic';
  if (n.startsWith('interior')) return 'interior';
  if (n.startsWith('exterior')) return 'exterior';
  if (n.includes('maintenance')) return 'full';
  return 'other';
}
const isShort = k => k === 'interior' || k === 'exterior';

function daysFromToday(dateStr, now) {
  const today = utcToLocal(now).date;
  const a = Date.UTC(...today.split('-').map((v, i) => i === 1 ? v - 1 : +v));
  const b = Date.UTC(...dateStr.split('-').map((v, i) => i === 1 ? v - 1 : +v));
  return Math.round((b - a) / 86400000);
}

// dayBlocks: [{ start, end, kind }] in minutes after local midnight (end includes transition time)
// service: { kind, durationMin, transitionMin }
function slotsForDay(dateStr, dayBlocks, service, now, cfg = CFG) {
  const ahead = daysFromToday(dateStr, now);
  if (ahead < 0 || ahead > cfg.maxDaysAhead) return [];
  if (dayBlocks.some(b => b.kind === 'ceramic')) return [];
  if (service.kind === 'ceramic' && dayBlocks.length > 0) return [];
  const kinds = [...dayBlocks.map(b => b.kind), service.kind];
  const cap = kinds.every(isShort) ? cfg.maxShortPerDay : cfg.maxPerDay;
  if (kinds.length > cap) return [];

  const length = service.durationMin + (service.transitionMin || 0);
  const earliest = now.getTime() + cfg.minNoticeHours * 3600000;
  const out = [];
  for (let s = cfg.firstStart; s <= cfg.lastStart; s += cfg.step) {
    if (localToUtc(dateStr, s).getTime() < earliest) continue;
    const e = s + length;
    if (dayBlocks.some(b => s < b.end && e > b.start)) continue;
    const next = dayBlocks.filter(b => b.start >= s).sort((a, b) => a.start - b.start)[0];
    if (next) {
      const prevEnd = Math.max(0, ...dayBlocks.filter(b => b.end <= s).map(b => b.end));
      if (next.start - Math.max(cfg.firstStart, prevEnd) < cfg.minWindowMin) continue;
    }
    out.push(toHHMM(s));
  }
  return out;
}

module.exports = { CFG, TZ, localToUtc, utcToLocal, toHHMM, fromHHMM, kindOf, slotsForDay, daysFromToday };
