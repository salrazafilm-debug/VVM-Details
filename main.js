const CONTACT_EMAIL = "vvm.detailing@gmail.com";
const $ = s => document.querySelector(s);
const nav = $('#nav'), prog = $('#progress'), cta = $('.float-cta'), bg = $('.statement-bg');
const burger = $('#burger'), links = $('#links');

burger.addEventListener('click', () => {
  const o = links.classList.toggle('open');
  burger.setAttribute('aria-expanded', o);
});
links.addEventListener('click', e => { if (e.target.tagName === 'A') { links.classList.remove('open'); burger.setAttribute('aria-expanded', false); } });

function onScroll() {
  const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
  prog.style.width = (y / h * 100) + '%';
  nav.classList.toggle('scrolled', y > 40);
  cta.classList.toggle('show', y > innerHeight * .7);
  const r = bg.parentElement.getBoundingClientRect();
  if (r.bottom > 0 && r.top < innerHeight) bg.style.transform = `translateY(${(r.top - innerHeight / 2) * -.15}px)`;
}
addEventListener('scroll', onScroll, { passive: true }); onScroll();

const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}), { threshold: .15 });
document.querySelectorAll('.reveal').forEach((el, i) => {
  el.style.transitionDelay = el.closest('.cards,.pillars,.gallery') ? (i % 4) * 90 + 'ms' : '';
  io.observe(el);
});


$('#yr').textContent = new Date().getFullYear();

/* ---------- Booking calendar ---------- */
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = c => '$' + (c / 100).toLocaleString('en-US', { maximumFractionDigits: 0 });
const dur = m => { const h = Math.floor(m / 60), r = m % 60; return h ? `${h} hr${h > 1 ? 's' : ''}${r ? ` ${r} min` : ''}` : `${r} min`; };
const fmtTime = t => { let [h, m] = t.split(':').map(Number); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return `${h}:${String(m).padStart(2, '0')} ${ap}`; };
const keyOf = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const dateOf = k => new Date(+k.slice(0, 4), +k.slice(5, 7) - 1, +k.slice(8));
const longDate = k => dateOf(k).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

async function realApi(path, opts) {
  const r = await fetch('/api' + path, opts);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j.error || 'Request failed'), { status: r.status });
  return j;
}
const api = (...a) => (window.VVM_API || realApi)(...a);

const now0 = new Date();
const S = { step: 'service', services: null, item: null, variation: null, y: now0.getFullYear(), m: now0.getMonth(), days: {}, loading: false, date: null, time: null, error: '', busy: false, result: null };
const bk = $('#bk');
if (window.VVM_DEMO) $('#demoBadge').hidden = false;

const contactLine = `<p class="muted">Call or text <a href="tel:+12406019451"><b>(240) 601-9451</b></a> or email ${esc(CONTACT_EMAIL)}.</p>`;

function stepper() {
  const names = ['Service', 'Date & time', 'Details'], at = { service: 0, date: 1, details: 2, done: 3 }[S.step];
  return `<ol class="bsteps">${names.map((n, i) => `<li class="${i === at ? 'on' : i < at ? 'past' : ''}"><span>${i + 1}</span>${n}</li>`).join('')}</ol>`;
}
const back = to => `<button type="button" class="link" data-act="back" data-to="${to}">← Back</button>`;

function render() {
  if (S.step === 'error') { bk.innerHTML = `<p><b>Online booking is unavailable right now.</b></p>${contactLine}`; return; }
  if (!S.services) { bk.innerHTML = '<p class="muted">Loading open times…</p>'; return; }
  let html = stepper();
  if (S.step === 'service') {
    html += '<div class="svc-list">' + S.services.map((g, i) => `
      <div class="svc ${S.item === i ? 'open' : ''}">
        <button type="button" class="svc-head" data-act="item" data-i="${i}"><b>${esc(g.name)}</b><span>from ${money(g.variations[0].priceCents)}</span></button>
        ${S.item === i ? `<div class="sizes-pick">${g.variations.map(v => `<button type="button" class="chip" data-act="variation" data-id="${esc(v.id)}"><b>${esc(v.label)}</b><span>${money(v.priceCents)} · ${dur(v.minutes)}</span></button>`).join('')}</div>` : ''}
      </div>`).join('') + '</div>';
  } else if (S.step === 'date') {
    const label = new Date(S.y, S.m, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const first = new Date(S.y, S.m, 1).getDay(), total = new Date(S.y, S.m + 1, 0).getDate();
    const atNow = S.y === now0.getFullYear() && S.m === now0.getMonth();
    let cells = '<span></span>'.repeat(first);
    for (let d = 1; d <= total; d++) {
      const k = keyOf(S.y, S.m, d), open = (S.days[k] || []).length > 0;
      cells += `<button type="button" class="day ${open ? 'open' : ''} ${S.date === k ? 'sel' : ''}" ${open ? `data-act="day" data-d="${k}"` : 'disabled'} aria-label="${open ? 'Available ' : 'Unavailable '}${esc(longDate(k))}">${d}</button>`;
    }
    html += `${back('service')}
      <p class="picked"><b>${esc(S.item.name)}</b> · ${esc(S.variation.label)} · ${money(S.variation.priceCents)} · about ${dur(S.variation.minutes)}</p>
      <div class="cal">
        <div class="cal-head"><button type="button" class="nav-m" data-act="prev" ${atNow ? 'disabled' : ''} aria-label="Previous month">‹</button><b>${label}</b><button type="button" class="nav-m" data-act="next" aria-label="Next month">›</button></div>
        <div class="dow">${['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => `<span>${d}</span>`).join('')}</div>
        <div class="grid ${S.loading ? 'loading' : ''}">${cells}</div>
      </div>
      <p class="muted small">${S.loading ? 'Checking open days…' : 'Highlighted days are open.'}</p>
      ${S.date ? `<p class="picked"><b>${esc(longDate(S.date))}</b>, start time:</p><div class="slots">${(S.days[S.date] || []).map(t => `<button type="button" class="slot" data-act="time" data-t="${t}">${fmtTime(t)}</button>`).join('')}</div>` : ''}`;
  } else if (S.step === 'details') {
    html += `${back('date')}
      <div class="sum">
        <p class="sum-k">Your booking</p>
        <h3 class="sum-t">${esc(S.item.name)}</h3>
        <p class="sum-v">${esc(S.variation.label)} · ${money(S.variation.priceCents)} · about ${dur(S.variation.minutes)}</p>
        <p class="sum-d">${esc(longDate(S.date)).replace(/ (\d+)$/, '&nbsp;$1')} <span class="sum-at">at ${fmtTime(S.time)}</span></p>
      </div>
      <form id="bform" class="form" novalidate>
        <label>Name<input id="f-name" name="name" required autocomplete="name"></label>
        <label>Phone<input id="f-phone" name="phone" type="tel" required autocomplete="tel"></label>
        <label>Email<input id="f-email" name="email" type="email" required autocomplete="email"></label>
        <label>Vehicle (year, make, model)<input id="f-vehicle" name="vehicle" required placeholder="e.g. 2022 Lexus IS 350"></label>
        <label>Address &amp; concerns<span class="hint">Where should we arrive + any concerns or questions can let us know here - We will get back to you as soon as possible! Thank you!!!</span><textarea id="f-notes" name="notes" rows="4" placeholder="Street address, city, ZIP"></textarea></label>
        <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
        ${S.error ? `<p class="err" role="alert">${esc(S.error)}</p>` : ''}
        <button class="btn primary" type="submit" ${S.busy ? 'disabled' : ''}>${S.busy ? 'Booking…' : 'Book my day'}</button>
        <p class="nodep">No deposit needed - we take payment only after we complete your service, thank you!</p>
      </form>`;
  } else if (S.step === 'done') {
    html = `<div class="done"><h3>Your booking is now reserved!</h3>
      <p><b>${esc(S.item.name)}</b> · ${esc(S.variation.label)}<br>${esc(longDate(S.date))} at ${fmtTime(S.time)}</p>
      <p>We will reach out shortly to answer any questions and confirm all details! Thank you!</p>
      ${contactLine}</div>`;
  }
  bk.innerHTML = html;
}

async function loadMonth() {
  S.loading = true; S.days = {}; render();
  try {
    const month = `${S.y}-${String(S.m + 1).padStart(2, '0')}`;
    S.days = (await api(`/availability?variation=${encodeURIComponent(S.variation.id)}&month=${month}`)).days || {};
  } catch (e) { S.error = e.message; }
  S.loading = false; render();
}

bk.addEventListener('click', async e => {
  const t = e.target.closest('[data-act]'); if (!t) return;
  const a = t.dataset.act;
  if (a === 'item') { S.item = S.item === +t.dataset.i ? null : +t.dataset.i; render(); }
  else if (a === 'variation') {
    const g = S.services[S.item]; S.variation = g.variations.find(v => v.id === t.dataset.id); S.item = g;
    S.date = null; S.time = null; S.step = 'date'; await loadMonth();
  }
  else if (a === 'prev' || a === 'next') { S.m += a === 'next' ? 1 : -1; if (S.m > 11) { S.m = 0; S.y++; } if (S.m < 0) { S.m = 11; S.y--; } S.date = null; await loadMonth(); }
  else if (a === 'day') { S.date = t.dataset.d; render(); }
  else if (a === 'time') { S.time = t.dataset.t; S.error = ''; S.step = 'details'; render(); }
  else if (a === 'back') {
    S.step = t.dataset.to;
    if (S.step === 'service') { S.item = S.services.indexOf(S.item); if (S.item < 0) S.item = null; }
    render();
  }
});

bk.addEventListener('submit', async e => {
  e.preventDefault();
  const f = Object.fromEntries(new FormData(e.target));
  const digits = (f.phone || '').replace(/\D/g, '');
  if ((f.name || '').trim().length < 2) S.error = 'Please enter your name.';
  else if (digits.length < 10) S.error = 'Please enter a 10-digit phone number.';
  else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email || '')) S.error = 'Please enter a valid email.';
  else if ((f.vehicle || '').trim().length < 2) S.error = 'Please enter your vehicle year, make and model.';
  else S.error = '';
  if (S.error) { render(); return; }
  S.busy = true; render();
  try {
    S.result = await api('/book', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...f, variationId: S.variation.id, date: S.date, time: S.time }) });
    S.step = 'done';
  } catch (err) {
    S.error = err.message;
    if (err.status === 409) { S.step = 'date'; S.time = null; S.busy = false; await loadMonth(); S.error = ''; return; }
  }
  S.busy = false; render();
});

(async function init() {
  try { S.services = (await api('/services')).services; if (!S.services.length) throw new Error('none'); }
  catch { S.step = 'error'; S.services = []; }
  render();
})();

document.querySelectorAll('.sizes').forEach(ul => ul.addEventListener('click', e => {
  const b = e.target.closest('.size'); if (!b) return;
  const on = b.classList.toggle('flipped');
  b.setAttribute('aria-pressed', on);
}));

/* ---------- "More info" flip card ---------- */
document.querySelectorAll('.flip').forEach(w => {
  const inner = w.querySelector('.flip-inner'), front = w.querySelector('.flip-face.front'), back = w.querySelector('.flip-face.back');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let timer;
  const inert = (el, on) => { el.toggleAttribute('inert', on); el.setAttribute('aria-hidden', String(on)); };
  inert(back, true);
  function set(open) {
    clearTimeout(timer);
    if (open) { inner.style.height = front.offsetHeight + 'px'; inner.offsetHeight; inner.style.height = back.offsetHeight + 'px'; }
    else { inner.style.height = back.offsetHeight + 'px'; inner.offsetHeight; inner.style.height = front.offsetHeight + 'px'; timer = setTimeout(() => { if (!w.classList.contains('flipped')) inner.style.height = ''; }, reduce ? 0 : 750); }
    w.classList.toggle('flipped', open);
    inert(front, open); inert(back, !open);
    w.querySelectorAll('[data-flip="open"]').forEach(b => b.setAttribute('aria-expanded', String(open)));
    w.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    setTimeout(() => (open ? back.querySelector('h3') : w.querySelector('[data-flip="open"]')).focus({ preventScroll: true }), reduce ? 0 : 750);
  }
  w.addEventListener('click', e => { const b = e.target.closest('[data-flip]'); if (b) set(b.dataset.flip === 'open'); });
  w.addEventListener('keydown', e => { if (e.key === 'Escape' && w.classList.contains('flipped')) set(false); });
  // keep the card height in step with the open guide (tab changes, images loading, window resize)
  new ResizeObserver(() => { if (w.classList.contains('flipped')) inner.style.height = back.offsetHeight + 'px'; }).observe(back);
});

/* ---------- guide tabs ---------- */
document.querySelectorAll('.pe-tabs').forEach(tabs => {
  const btns = [...tabs.querySelectorAll('[role="tab"]')];
  const panels = btns.map(b => document.getElementById(b.getAttribute('aria-controls')));
  const select = i => btns.forEach((b, j) => { b.setAttribute('aria-selected', String(j === i)); b.tabIndex = j === i ? 0 : -1; panels[j].hidden = j !== i; });
  btns.forEach((b, i) => b.addEventListener('click', () => select(i)));
  tabs.addEventListener('keydown', e => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const n = (btns.indexOf(document.activeElement) + (e.key === 'ArrowRight' ? 1 : -1) + btns.length) % btns.length;
    select(n); btns[n].focus();
  });
});

/* ---------- photo + video slots: drop files in assets/uploads/ and they appear ---------- */
const IMG_EXT = ['jpg', 'jpeg', 'png', 'webp'], VID_EXT = ['mp4', 'webm', 'mov'];
function firstThatLoads(urls, test, done) { (function next(i) { if (i >= urls.length) return done(null); test(urls[i], ok => ok ? done(urls[i]) : next(i + 1)); })(0); }
const caption = slot => { const c = document.createElement('span'); c.className = 'cap'; c.textContent = slot.dataset.label || ''; return c; };
document.querySelectorAll('.mslot[data-img]').forEach(slot => {
  const base = 'assets/uploads/' + slot.dataset.img;
  firstThatLoads(IMG_EXT.map(x => `${base}.${x}`), (src, cb) => { const im = new Image(); im.onload = () => cb(true); im.onerror = () => cb(false); im.src = src; }, src => {
    if (!src) return;
    const im = document.createElement('img'); im.src = src; im.alt = slot.dataset.label || ''; im.loading = 'lazy';
    slot.replaceChildren(im, caption(slot)); slot.classList.add('filled');
  });
});
document.querySelectorAll('.mslot[data-video]').forEach(slot => {
  const base = 'assets/uploads/' + slot.dataset.video;
  firstThatLoads(VID_EXT.map(x => `${base}.${x}`), (src, cb) => { const v = document.createElement('video'); v.preload = 'metadata'; v.onloadedmetadata = () => cb(true); v.onerror = () => cb(false); v.src = src; }, src => {
    if (!src) return;
    const v = document.createElement('video'); v.src = src; v.controls = true; v.playsInline = true; v.preload = 'metadata'; v.setAttribute('aria-label', slot.dataset.label || 'Video');
    slot.replaceChildren(v); slot.classList.add('filled');
  });
});
