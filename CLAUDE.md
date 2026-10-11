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
- Service cards in this order: Full Factory Reset (gold, #1, crown badge, holographic border), Interior Reset, Exterior Reset, Headlight Restoration (wide standard card, full width so the 2-column grid never leaves an orphan; Before/After photo slots `headlight-before` / `headlight-after` in `assets/uploads/`; $135 from Square's bookable item; CTA is Book my day because it IS bookable online, alone or added to another service), Paint Enhancement + Ceramic (diamond card, last).
  - Gold card: photos must stay untinted. Title is the biggest text on the card, "SAVE HUGE $$$" must stay clearly smaller. "PH-balanced" always capital PH. Checklist rows share one check style and align exactly.
  - Size pills flip on tap to show price. No "From $" pricing.
  - Diamond card "More info" flips to a tabbed guide. Any grid must not leave an orphan last row at any width (audit widths 340 to 1280).
- Book Now section: dark star-sky stage, single yellow glowing title (no rainbow), gold line along the top edge. Footer continues the dark sky.
- Button text is bold, all caps. Booking button says "Book my day".
- Do not show the street address (it is a home address). Phone (240) 601-9451, email vvm.detailing@gmail.com, Instagram @vvm.details.

## Booking system
- The first row for each vehicle is its year, make and model; Confirm locks it in (Edit unlocks it) and only then do the services appear. The details step no longer asks for vehicles. The preview trick: services/availability/book can be faked in a throwaway `_demo.html` (copy of index.html with a `window.VVM_API` mock before main.js); delete it before committing.
- Customers pick one or more services per vehicle (a cart: tap + on any size, tap again to remove), and say how many vehicles: 1, 2 or 3+. 2 vehicles = two bookings the same day, back to back (each vehicle can have its own services). 3+ vehicles are never booked online: the page shows Text / Email buttons. Rules for carts live in `resolvePlan` in `netlify/lib/rules.js` (ceramic stands alone; Full Factory Reset cannot be combined with Interior/Exterior; each service once per vehicle; max 4 services per vehicle). A vehicle's services are combined into one job (durations add; interior + exterior together count as a full detail). API: `/availability?plan=A.B,C&month=YYYY-MM` (comma = next vehicle, dot = another service on the same vehicle) and `/book` with `plan` (array of arrays of ids) and `vehicles` (array of text). The email lists both vehicles and the total.
- Customers pick day, time. The calendar reads real bookings from Square (read-only) and applies `netlify/lib/rules.js`:
  starts 7:00 AM to 2:00 PM every 30 min; no overlaps (Square duration + transition); max 2 bookings per day (3 only if all are interior-only or exterior-only);
  ceramic coating takes the whole day; no job squeezed before an existing booking unless 5+ free hours (`MIN_WINDOW_MIN`); any weekday; 12 h notice; up to a year ahead.
- Owner is on Square Free, which cannot create bookings through the API. So `BOOKING_MODE=request` (default): the request is emailed via Netlify Forms (`booking-request`) to the owner, who adds it to Square by hand. The site holds the time (Netlify Blobs, 3 days) until it appears in Square at the same start time.
- Order in `book.js` matters: email first, hold second; fail loudly, never silently.
- When a booking goes through the customer sees a big celebration screen (confetti, gold check, giant "YAY!", "You're all booked and ready!", "Your booking is now reserved.") in `#book .yay` styles; keep that wording and the reduced-motion fallback. No deposit; payment after the service.
- Env vars (Netlify only): `SQUARE_ACCESS_TOKEN`, `SQUARE_ENV=production`, `BOOKING_MODE=request`.

## Square facts
- Location ID `L6GQ2NMD5YF1H`, timezone America/New_York, one team member (the owner). Prices and durations come from Square's service library, which is the source of truth.
- The Square connector available to Claude is read-only for the catalog (`ITEMS_WRITE` was refused). Reconnecting it with write access is the owner's step.
- **Maintenance Plan** (clients only) is hidden from the website on purpose: `isPublic()` in `netlify/lib/square.js` filters it out of `services`, `availability` and `book`. It still blocks time as a 'full' job. Headlight Restoration and Engine Bay are 'other' and never shown.
- Square has TWO items named Headlight Restoration: a bookable appointment service ($135, 45 min, the one the site shows) and an older plain product ($100, not bookable). The owner may want to delete the old one. Headlight has its own kind `headlight` in `kindOf`; it is bookable online and counts as a short job (3 a day allowed when every job is short). Square lists it as 45 min but the owner says it takes an hour: the owner must change the duration in Square (the site always uses Square's duration).
- Square `price_description` text on some variations is stale (for example Paint Enhancement says $725/$1050); the real `price_money` is what the site uses and it matches.

## Domain and email facts (checked 2026-10-11)
- vvmdetails.com and www still point at the old **Squarespace** site (A records 198.49.23.x / 198.185.159.x, www CNAME ext-sq.squarespace.com). Name servers are ns-cloud-c*.googledomains.com, so the domain is registered at Squarespace Domains (ex Google Domains). Switch only the apex A record and the www CNAME to Netlify, keep the name servers, and never touch the registration.
- No MX records. SPF is `v=spf1 -all` and DMARC is `p=reject`, so the domain sends and receives no mail. Any `@vvmdetails.com` mailbox or sending needs MX plus an SPF/DKIM update first.
- Old Squarespace URLs (`/home /about /contact /appointments /services-store...`) are 301-redirected in `netlify.toml`.
- The 404 page uses root-relative links because Netlify serves it at any depth. Keep it that way.

## Open items (as of 2026-10-11)
1. Square catalog (owner does it; connector is read-only and the dashboard UI edits are blocked for Claude): Full Factory Reset Mini-Van is now **$410** (fixed 2026-10-11, verified). Interior Reset **still has no Truck variation**: owner must add Truck $255, 4 hrs, assigned to them, online-bookable (the site already shows it). Until then the booking calendar has no Interior Reset Truck.
2. Netlify: repo is imported but a deploy could not be confirmed (no status on the GitHub commit). Still needed: confirm deploy published, Forms email notification to vvm.detailing@gmail.com, add the three env vars (the owner pastes the Square token, never Claude), test booking, then point vvmdetails.com (last).
3. Terms page: `terms.html` is built (linked from footers, sitemap and the booking consent line) from the safe defaults in `drafts/terms-draft.md`, and the owner approved it as written on 2026-10-11 (sections 5, 6 and 10 included; section 10 was not legally reviewed). Service times and start times are left out because the booking flow shows them. Payment methods, water/power, late fees, warranty and coating aftercare days are deliberately NOT stated; add them only if the owner answers those `[YOUR CALL]` items.
3b. **Do not push to master yet.** The owner wants ONE final deploy (Netlify free plan: 15 credits per deploy, 300 a month). Pending work lives on the local branch `final-polish`. Before the final push: owner adds `SQUARE_ACCESS_TOKEN` in Netlify, then merge to master and push once, check Netlify > Forms shows `booking-request`, Make the project public, test booking, DNS last.
4. Replace screenshot-crop photos with the owner's originals; fill `ceramic-1..4` and `ceramic-video` slots.
5. Ideas not done: customer reviews section, Google Business link, analytics (would require updating privacy.html).

## Working here
- Preview: serve the folder (`python3 -m http.server`) or open `index.html`. Without the Netlify functions, the booking area shows the call/text fallback by design.
- Run `npm test` before pushing. Check phone width (about 390px) and desktop (1280px). Keep `prefers-reduced-motion` support.
