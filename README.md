# Kaveripattinam Urban Co-operative Bank Ltd. — Static Website

Plain HTML, CSS and JavaScript. No build step or server needed: open `index.html`
in a browser, or upload the whole folder to any static host (Netlify, GitHub Pages,
cPanel `public_html`, etc.).

## Pages
| File | Content |
|---|---|
| index.html | Home: quick links, notices, product categories, jewel loan, rates, calculators, map |
| about.html | About the bank, mission, membership steps, board of directors |
| deposits.html | Savings, current, fixed, recurring, senior citizen, children's savings |
| loans.html | Jewel, housing, vehicle, business/MSME, personal, education, loan against deposit, agricultural |
| services.html | NEFT/RTGS/IMPS, lockers, RuPay card, SMS alerts, DD, UPI, CTS, insurance schemes, pension/DBT |
| rates.html | Deposit & loan rate tables, EMI and FD calculators |
| customer-corner.html | KYC, form downloads, grievance steps, DICGC, fraud awareness |
| contact.html | Address, phone, hours, Google Map, enquiry form, directions |
| 404.html | Not-found page |

## BEFORE GOING LIVE — replace these placeholders
Placeholders are highlighted in yellow on the site. Find & replace across all `.html` files:

| Placeholder | Replace with |
|---|---|
| `04343-XXXXXX` and `+914343000000` | Branch landline (STD code 04343 is correct for Kaveripattinam) |
| `+91 9XXXX XXXXX` / `+919XXXXXXXXX` | Branch mobile / WhatsApp |
| `info@kaveripattinamucb.in` | Official email |
| `To be updated` | IFSC code |
| `Salem Main Road` | Exact door number and street |
| `Name to be added` (about.html) | Board members' names |
| Interest rates (rates.html, index.html) | Current board-approved rates |
| Map coordinates `12.4219,78.2166` | Exact branch pin from Google Maps (right-click the building → copy coordinates) |

Also remove the `.placeholder` highlight: once replaced, the yellow marking disappears
automatically only if you also delete the wrapping `<span class="placeholder">` — or simply
delete the `.placeholder` rule in `css/style.css`.

## Forms
Put PDF forms in a new `forms/` folder and change each `href="#forms"` in
customer-corner.html to e.g. `forms/account-opening.pdf`.

The contact form opens the visitor's email app (static site, no server). To collect
submissions online, point it at a service such as Formspree.

## Structure
```
css/style.css   all styling (colour tokens at the top)
js/main.js      menu, calculators, enquiry form, back-to-top
assets/         logo.svg, favicon.svg, kolam.svg (decorative pattern)
```
Fonts: Anek Tamil and Mukta Malar from Google Fonts (both support Tamil script).
