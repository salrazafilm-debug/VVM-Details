# Launch checklist for vvmdetails.com

Everything is built and tested. These steps need YOUR accounts, so they are the only things left.
Never paste tokens or passwords into a chat. Put them only in Netlify's settings.

## 1. Put the site on Netlify (free) ~5 min
1. Go to netlify.com and **Sign up with GitHub**.
2. **Add new site > Import an existing project > GitHub** and choose `salrazafilm-debug/VVM-Details`, branch `master`.
3. Leave every build setting as is (Netlify reads `netlify.toml`). Click **Deploy**.
4. When it finishes you get a free address like `something.netlify.app`. Open it on your phone.

## 2. Get booking requests by email ~2 min
Netlify > your site > **Forms** > `booking-request` > **Settings & notifications > Add notification > Email** > `vvm.detailing@gmail.com`.
(The form appears after the first deploy and the first test booking.)

## 3. Connect Square so the calendar shows your real open times ~5 min
1. developer.squareup.com > sign in > **Applications** > **+** (new app, any name, e.g. "VVM Website").
2. Open the app > **Credentials** > switch to **Production** > copy the **Access token**.
3. In Netlify: **Site configuration > Environment variables > Add**:
   - `SQUARE_ACCESS_TOKEN` = (the token, mark as **secret**)
   - `SQUARE_ENV` = `production`
   - `BOOKING_MODE` = `request`
4. **Deploys > Trigger deploy > Deploy site**.
The booking section now shows live open days. Until the token is added it shows "Online booking is unavailable. Call or text us."

## 4. Fix your Square prices (the calendar reads Square, not the website)
In the Square Dashboard > Items & services > Service library:
- **Full Factory Reset > Mini-Van**: change the price to **$410** (website already shows $410).
- **Interior Reset**: add a variation **Truck**, price **$255** (same as SUV), duration 4 hrs, assigned to you, available for online booking.

## 5. Test it like a customer
Make one booking from your phone. Check: the email arrives, the time disappears for the next visitor, and the confirmation says "Your booking is now reserved!". Add it to Square yourself (Square sends its normal notifications).

## 6. Move your domain LAST
Netlify > **Domain management > Add a domain** > `vvmdetails.com` and follow the DNS steps at your registrar. Do this only after step 5 passes. Square Online keeps working until you switch DNS.

## Day to day
- A customer books > you get an email > add it in Square. Once it is in Square at the same start time the website's hold clears automatically. Unconfirmed holds clear after 3 days.
- Photos and video: drop files in `assets/uploads/` (see the README there).

## Booking rules (`netlify/lib/rules.js`)
7:00 AM to 2:00 PM starts every 30 min, no overlaps (Square durations + transition time), max 2 bookings a day or 3 when all are interior-only or exterior-only, ceramic coating takes the whole day, no new job ahead of an existing booking unless there are 5 free hours (`MIN_WINDOW_MIN`), any day of the week, 12 hours minimum notice, bookable up to a year ahead.

## If you later want the site to create the booking in Square itself
That needs Square Appointments Plus/Premium AND write permission on the token. Set `BOOKING_MODE` = `square` and `DRY_RUN` = `false`. Test with `DRY_RUN` = `true` first.
