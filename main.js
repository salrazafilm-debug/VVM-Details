// Edit these with real contact info
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

// 3D tilt on cards (desktop pointers only)
if (matchMedia('(hover:hover)').matches) {
  document.querySelectorAll('.tilt').forEach(c => {
    c.addEventListener('mousemove', e => {
      const b = c.getBoundingClientRect(), x = (e.clientX - b.left) / b.width - .5, y = (e.clientY - b.top) / b.height - .5;
      c.style.transition = 'box-shadow .35s';
      c.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-6px)`;
    });
    c.addEventListener('mouseleave', () => { c.style.transition = ''; c.style.transform = ''; });
  });
}

$('#form').addEventListener('submit', e => {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(e.target));
  const body = `Name: ${d.name}\nPhone: ${d.phone}\nVehicle: ${d.vehicle}\nService: ${d.service}\nNotes: ${d.notes}`;
  $('#formNote').hidden = false;
  location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Detail request – ' + d.name)}&body=${encodeURIComponent(body)}`;
});
$('#yr').textContent = new Date().getFullYear();

$('#copy').addEventListener('click', async () => {
  const b = $('#copy');
  try { await navigator.clipboard.writeText(CONTACT_EMAIL); b.textContent = 'Copied'; }
  catch { const r = document.createRange(); r.selectNodeContents($('#email')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = 'Selected'; }
  setTimeout(() => b.textContent = 'Copy', 1800);
});
