const assert = require('assert');
const r = require('../netlify/lib/rules');
const now = new Date('2026-10-12T04:00:00Z'); // Mon Oct 12 2026 00:00 EDT
const full = { kind: 'full', durationMin: 330, transitionMin: 0 };
const ext = { kind: 'exterior', durationMin: 90, transitionMin: 60 };
const int = { kind: 'interior', durationMin: 215, transitionMin: 0 };
const cer = { kind: 'ceramic', durationMin: 450, transitionMin: 0 };
const d = '2026-10-20';
// empty day, full detail: 7:00..14:00 every 30 min
let s = r.slotsForDay(d, [], full, now); assert.equal(s[0], '07:00'); assert.equal(s.at(-1), '14:00'); assert.equal(s.length, 15);
// one full detail 7:00-12:30 booked -> next start must be >= 12:30
s = r.slotsForDay(d, [{ start: 420, end: 750, kind: 'full' }], full, now); assert.equal(s[0], '12:30');
// two full already -> none (cap 2)
assert.deepEqual(r.slotsForDay(d, [{ start: 420, end: 750, kind: 'full' }, { start: 780, end: 1110, kind: 'full' }], ext, now), []);
// third allowed only when all short
const two = [{ start: 420, end: 600, kind: 'exterior' }, { start: 600, end: 840, kind: 'interior' }];
assert.ok(r.slotsForDay(d, two, ext, now).length > 0);
assert.deepEqual(r.slotsForDay(d, two, full, now), []);
// ceramic: needs empty day, blocks the day
assert.ok(r.slotsForDay(d, [], cer, now).length > 0);
assert.deepEqual(r.slotsForDay(d, [{ start: 420, end: 600, kind: 'exterior' }], cer, now), []);
assert.deepEqual(r.slotsForDay(d, [{ start: 420, end: 1000, kind: 'ceramic' }], ext, now), []);
// min notice: same day at 02:00 local excludes starts before 14:00
const early = new Date('2026-10-20T06:00:00Z'); // 02:00 EDT
s = r.slotsForDay(d, [], int, early); assert.equal(s[0], '14:00');
// past + too far ahead
assert.deepEqual(r.slotsForDay('2026-10-01', [], ext, now), []);
assert.deepEqual(r.slotsForDay('2028-01-01', [], ext, now), []);
// timezone round trip incl. DST change (Nov 1 2026, 2am fall back)
for (const day of ['2026-10-20', '2026-11-01', '2026-03-08']) {
  const u = r.localToUtc(day, 7 * 60); const l = r.utcToLocal(u);
  assert.equal(l.date, day); assert.equal(l.minutes, 420);
}
assert.equal(r.localToUtc('2026-10-20', 420).toISOString(), '2026-10-20T11:00:00.000Z');
// Oct 11: existing booking 11:00-16:30 -> day is closed for every service
const eleventh = [{ start: 660, end: 990, kind: 'full' }];
for (const svc of [full, ext, int, cer, { kind: 'exterior', durationMin: 75, transitionMin: 60 }]) assert.deepEqual(r.slotsForDay(d, eleventh, svc, now), []);
// Oct 14: existing 2:00 PM interior -> a morning full detail that ends by 2:00 PM is still allowed
s = r.slotsForDay(d, [{ start: 840, end: 1055, kind: 'interior' }], full, now); assert.equal(s[0], '07:00'); assert.equal(s.at(-1), '08:30');
console.log('all rule tests passed');
