# VVM Details: project guide for Claude

Website for **VVM Details**, a mobile car wash and detailing business (Chesapeake Beach, MD; serves DC, MD, VA).
Owner is non-technical and works from their phone. Keep explanations short and plain. Do the work, then say what changed.
Static site (no build step) + Netlify Functions for booking. Netlify auto-deploys every push to `master`, so **everything pushed goes live**.
Never put tokens or secrets in the repo or in chat. Never write to the owner's Square account without them confirming the exact change.

## Files
- `index.html`, `styles.css`, `main.js`: the whole site (one page). `privacy.html`, `404.html`, `robots.txt`, `sitemap.xml`.
- `assets/` images (currently low-res crops from screenshots; owner will send originals). `assets/uploads/` is where owner photos/videos go, see its README. Slots load only when the "Photos & Video" tab opens.
- `netlify/functions/` `services.js`, `availability.js`, `book.js`. `netlify/lib/` `rules.js` (booking rules), `square.js`, `holds.js`.
- `netlify.toml`: publish dir is `.` (the whole repo is published), so non-site files are blocked with forced 404 redirects. **Add any new non-site file or folder to that list.** Also holds security and cache headers.
- `SETUP.md`: launch checklist for the owner. `drafts/terms-draft.md`: terms draft, not public. `tests/` run with `npm test`.

## Look and feel (the owner is picky; follow these)
- Page background pink `#e9b3b3`. Logo colors: blue `#4f8ff0`, yellow `#f0d63c`, red `#e4572e`. Dark ink `#1a1214`.
- Fonts: Montserrat italic 800/900 for headings, Manrope for body. Headings tight and bold. Key words in CAPS and bold.
- Copy tone: short, confident, happy, "love". Fewer words, more impact. Wide lines, not tall narrow columns.
- **Holographic text must loop seamlessly**: gradient tile is 200% wide made of two identical cycles that start and end on the same color, animated `background-position 0% -> 200%` (`@keyframes holoFlow`). Never use a keyframe that jumps back (the owner saw it "turn off and on").
- **No mouse-follow tilt, zoom or distortion on cards.** Hover on buttons lifting slightly is fine.
- Service cards in this order: Full Factory Reset (gold, #1, crown badge, holographic border), Interior Reset, Exterior Reset, Paint Enhancement + Ceramic (diamond card, last).
  - Gold card: photos must stay untinted. Title is the biggest text on the card, "SAVE HUGE $$$" must stay clearly smaller. "PH-balanced" always capital PH. Checklist rows share one check style and align exactly.
  - Size pills flip on tap to show price. No "From $" pricing.
  - Diamond card "More info" flips to a tabbed guide. Any grid must not leave an orphan last row at any width (audit widths 340 to 1280).
- Book Now section: dark star-sky stage, single yellow glowing title (no rainbow), gold line along the top edge. Footer continues the dark sky.
- Button text is bold, all caps. Booking button says "Book my day".
- Do not show the street address (it is a home address). Phone (240) 601-9451, email vvm.detailing@gmail.com, Instagram @vvm.details.

## Booking system
- Customers pick service, size, day, time. The calendar reads real bookings from Square (read-only) and applies `netlify/lib/rules.js`:
  starts 7:00 AM to 2:00 PM every 30 min; no overlaps (Square duration + transition); max 2 bookings per day (3 only if all are interior-only or exterior-only);
  ceramic coating takes the whole day; no job squeezed before an existing booking unless 5+ free hours (`MIN_WINDOW_MIN`); any weekday; 12 h notice; up to a year ahead.
- Owner is on Square Free, which cannot create bookings through the API. So `BOOKING_MODE=request` (default): the request is emailed via Netlify Forms (`booking-request`) to the owner, who adds it to Square by hand. The site holds the time (Netlify Blobs, 3 days) until it appears in Square at the same start time.
- Order in `book.js` matters: email first, hold second; fail loudly, never silently.
- Customer sees "Your booking is now reserved!". No deposit; payment after the service.
- Env vars (Netlify only): `SQUARE_ACCESS_TOKEN`, `SQUARE_ENV=production`, `BOOKING_MODE=request`.

## Square facts
- Location ID `L6GQ2NMD5YF1H`, timezone America/New_York, one team member (the owner). Prices and durations come from Square's service library, which is the source of truth.
- The Square connector available to Claude is read-only for the catalog (`ITEMS_WRITE` was refused). Reconnecting it with write access is the owner's step.

## Open items (as of the last session)
1. Square catalog: Full Factory Reset **Mini-Van to $410** (site already says $410); Interior Reset **add Truck** $255, 4 hrs, online-bookable (site already shows it). Calendar shows Square's data until fixed.
2. Netlify: repo is imported. Still needed: confirm deploy published, Forms email notification to vvm.detailing@gmail.com, add the three env vars, test booking, then point vvmdetails.com (last).
3. Terms page: waiting on the owner's answers to the `[YOUR CALL]` items in `drafts/terms-draft.md`, then build `terms.html` and link it beside Privacy (footer and booking consent line).
4. Replace screenshot-crop photos with the owner's originals; fill `ceramic-1..4` and `ceramic-video` slots.
5. Ideas not done: customer reviews section, Google Business link, analytics (would require updating privacy.html).

## Working here
- Preview: serve the folder (`python3 -m http.server`) or open `index.html`. Without the Netlify functions, the booking area shows the call/text fallback by design.
- Run `npm test` before pushing. Check phone width (about 390px) and desktop (1280px). Keep `prefers-reduced-motion` support.
