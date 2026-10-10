# Putting VVM Details live (free)

## 1. Host it on Netlify
1. Sign up at netlify.com with GitHub.
2. Add new site > Import an existing project > GitHub > `VVM-Details`, branch `master`. Netlify reads `netlify.toml`, so leave the build settings alone and click Deploy.

## 2. Connect Square (read your bookings so the calendar shows real open times)
1. Go to developer.squareup.com > Applications > create an app > Credentials > **Production** access token.
2. In Netlify: Site configuration > Environment variables. Add:
   - `SQUARE_ACCESS_TOKEN` = your token (mark as secret, never put it in the code or in chat)
   - `SQUARE_ENV` = `production`
   - `BOOKING_MODE` = `request`
3. Trigger a redeploy (Deploys > Trigger deploy).

## 3. Get booking requests by email
After the first deploy: Netlify > Forms > `booking-request` > Settings & notifications > Add email notification > `vvm.detailing@gmail.com`.

## 4. Use it
A customer picks a real open time and taps **Book my day**. The time is held on the website immediately, so nobody else can pick it, and you get an email. Add the booking in Square (you get Square's notifications and messages as usual). Once it is in Square at the same start time, the website's hold is dropped automatically. Unconfirmed holds clear on their own after 3 days (`HOLD_DAYS`). Holds use Netlify's built-in storage (Blobs), which needs no setup. If storage is ever unavailable, the site still works, it just cannot hold times.

## 5. Your own domain (do this last)
Netlify > Domain management > add `vvmdetails.com` and follow the DNS steps at your registrar.

## Rules built in (`netlify/lib/rules.js`)
7:00 AM to 2:00 PM starts, every 30 min, no overlaps (Square durations plus transition time), max 2 bookings a day or 3 when all are interior-only or exterior-only, ceramic coating takes the whole day, no new job is squeezed in before an existing booking unless there are at least 5 free hours ahead of it (`MIN_WINDOW_MIN`), any day of the week, 12 hours minimum notice, bookable up to a year ahead.

## If you move to Square Appointments Plus or Premium
Set `BOOKING_MODE` = `square` and `DRY_RUN` = `false`. The site then creates the booking in Square itself. Test with `DRY_RUN` = `true` first.

## Adding your own photos and videos
Drop files into `assets/uploads/` using the names in `assets/uploads/README.md` (for example `ceramic-1.jpg`, `ceramic-video.mp4`).
They appear automatically in the "Photos & Video" tab of the Paint Enhancement + Ceramic Coating guide (tap **More info** on that card).
Missing files show a branded "coming soon" placeholder. You can upload from GitHub's website (Add file > Upload files) or send the files to Claude.
