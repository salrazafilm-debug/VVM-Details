const { sq, loadCatalog, getLocationId, blocksByDay, json, fail, httpError, BOOKABLE } = require('../lib/square');
const { slotsForDay, localToUtc, fromHHMM } = require('../lib/rules');
const { blocksWithHolds, addHold } = require('../lib/holds');
const crypto = require('crypto');

const clean = (s, max) => String(s || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') throw httpError(405, 'Use POST.');
    const b = JSON.parse(event.body || '{}');
    if (b.website) return json(200, { ok: true }); // honeypot: bots fill this in

    const name = clean(b.name, 80), email = clean(b.email, 120), vehicle = clean(b.vehicle, 120), notes = clean(b.notes, 1000);
    const digits = String(b.phone || '').replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '');
    if (name.length < 2) throw httpError(400, 'Please enter your name.');
    if (digits.length !== 10) throw httpError(400, 'Please enter a 10-digit phone number.');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw httpError(400, 'Please enter a valid email.');
    if (vehicle.length < 2) throw httpError(400, 'Please enter your vehicle year, make and model.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(b.date || '') || !/^\d{2}:\d{2}$/.test(b.time || '')) throw httpError(400, 'Invalid date or time.');

    const catalog = await loadCatalog();
    const v = catalog[b.variationId];
    if (!v || !BOOKABLE.has(v.kind) || !v.bookable) throw httpError(400, 'Unknown service.');

    // Re-check availability on the server so a stale page can never double-book.
    const nextDay = new Date(localToUtc(b.date, 24 * 60 + 60)); // safely into the next local day
    const toDate = nextDay.toISOString().slice(0, 10);
    const blocks = await blocksWithHolds(event, await blocksByDay(b.date, toDate, catalog), b.date.slice(0, 7));
    const open = slotsForDay(b.date, blocks[b.date] || [], v, new Date());
    if (!open.includes(b.time)) throw httpError(409, 'Sorry, that time was just taken. Please pick another.');

    const result = { ok: true, when: `${b.date} ${b.time}`, service: `${v.item} (${v.label})` };

    // Free Square plans cannot create bookings through the API, so by default the
    // request goes to Netlify Forms (emailed to the owner) to be confirmed in Square.
    if (process.env.BOOKING_MODE !== 'square') {
      // 1) Send the request to the owner first. If this fails the customer is told, and no time is held.
      const h = event.headers || {};
      const origin = process.env.URL || (h.host ? `${h['x-forwarded-proto'] || 'https'}://${h.host}` : '');
      if (!origin) throw httpError(503, 'We could not send your request. Please call or text us to book.');
      let sent;
      try {
        sent = await fetch(origin + '/', {
          method: 'POST', redirect: 'manual',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            'form-name': 'booking-request', name, phone: String(b.phone), email, vehicle, notes,
            service: `${v.item} - ${v.label}`, date: b.date, time: b.time,
          }),
        });
      } catch (e) { console.error('form post failed:', e.message); }
      if (!sent || sent.status >= 400) throw httpError(502, 'We could not send your request. Please call or text us to book.');
      // 2) Only after the owner has been notified, hold the time so nobody else can pick it.
      const start = fromHHMM(b.time);
      await addHold(event, { date: b.date, start, end: start + v.durationMin + (v.transitionMin || 0), kind: v.kind });
      return json(200, { ...result, mode: 'request' });
    }
    if (process.env.DRY_RUN !== 'false') return json(200, { ...result, mode: 'square', dryRun: true });

    const [given, ...rest] = name.split(/\s+/);
    const found = await sq('/v2/customers/search', { method: 'POST', body: { query: { filter: { email_address: { exact: email } } } } });
    let customerId = found.customers && found.customers[0] && found.customers[0].id;
    if (!customerId) {
      const created = await sq('/v2/customers', { method: 'POST', body: {
        idempotency_key: crypto.randomUUID(), given_name: given, family_name: rest.join(' ') || undefined,
        email_address: email, phone_number: '+1' + digits,
      } });
      customerId = created.customer.id;
    }

    const booking = await sq('/v2/bookings', { method: 'POST', body: {
      idempotency_key: crypto.randomUUID(),
      booking: {
        location_id: await getLocationId(),
        start_at: localToUtc(b.date, fromHHMM(b.time)).toISOString(),
        customer_id: customerId,
        customer_note: `Booked on vvmdetails.com\nVehicle: ${vehicle}\nConcerns: ${notes || 'None'}\nPhone: ${b.phone}`,
        appointment_segments: [{
          duration_minutes: v.durationMin,
          service_variation_id: v.id,
          service_variation_version: v.version,
          team_member_id: process.env.SQUARE_TEAM_MEMBER_ID || v.teamMemberId,
        }],
      },
    } });
    return json(200, { ...result, mode: 'square', bookingId: booking.booking.id });
  } catch (e) { return fail(e); }
};
