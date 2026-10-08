# The Tirupattur Urban Co-operative Bank Ltd. — Static Website

Plain HTML, CSS and JavaScript. No build step: open `index.html` in a browser, or upload
the whole folder to any static host (Netlify, GitHub Pages, cPanel `public_html`, etc.).

## Theme
Deep indigo (`--teal` / `--teal-deep` tokens, kept under their old names) with saffron
accents (`--accent*`). Banners are plain colour gradients — no background photos,
round photo badges or kolam patterns. Tokens are at the top of `css/style.css`.

## BEFORE GOING LIVE — details still needed
No verified public source was found for these, so the old bank's values were removed
rather than guessed. Add them when the bank confirms them:

| Detail | Where to add it |
|---|---|
| Logo | Replace `assets/tucb-logo.svg` (placeholder emblem) and `assets/favicon.png` |
| Phone / email | Footer, home "Visit the branch", contact page cards, customer-corner FAQ |
| Street address & exact map pin | Footer, contact page, about page; Google Maps links search for the bank by name |
| IFSC, registration no., history, membership figures | about.html (sections were removed) |
| Board member names | about.html board grid (Managing Director: B.C. Kumar, per Tirupattur district directory) |
| Enquiry form | Removed (it emailed the previous bank); re-add with the bank's email or a form service |
| Downloadable forms | customer-corner.html lists them as "At branch"; add PDFs in `assets/forms/` and relink |
| Interest rates | rates.html, index.html — confirm current board-approved rates |

Every English text change also needs its Tamil entry in `js/translations.js`
(exact-text lookup).

## Pages
index, about, deposits, loans, services, rates, customer-corner, notices, contact, 404.
