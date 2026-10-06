---
name: project-stores
description: Supported stores in PriceHawk, their scrapers, currencies, and JS-rendering strategy
metadata:
  type: project
---

# Supported Stores

## Existing (Axios + Cheerio, no JS rendering needed)
- **amazon** — `lib/scraper/scraper.js` — USD — uses Bright Data residential proxy
- **jumia** — `lib/scraper/scrapers/jumia.js` — multi-currency (KES/NGN/ZAR/etc.)
- **takealot** — `lib/scraper/scrapers/takealot.js` — ZAR

## Added 2026-05-21 (Bright Data Scraping Browser + puppeteer-core)
- **backmarket** — `lib/scraper/scrapers/backmarket.js` — USD/EUR/GBP/AUD/JPY (region-aware)
- **swappa** — `lib/scraper/scrapers/swappa.js` — USD (US-only marketplace)
- **reebelo** — `lib/scraper/scrapers/reebelo.js` — USD/AUD/NZD/SGD/CAD (region-aware)

## Scraping strategy for Back Market / Swappa / Reebelo
Uses `lib/scraper/brightDataBrowser.js` which connects to Bright Data's Scraping Browser via WebSocket (puppeteer-core). This renders JavaScript before returning HTML to Cheerio. Requires env var:
```
BRIGHT_DATA_SCRAPING_BROWSER_WS=wss://brd-customer-<ID>-zone-scraping_browser:<PASS>@brd.superproxy.io:9222
```

## How to add a new store
1. Create `lib/scraper/scrapers/<store>.js`
2. Add URL pattern + currency to `lib/scraper/detectStore.js`
3. Add case to switch in `lib/actions/index.js` AND `app/api/cron/route.js`
4. Add store name to enum in `lib/models/product.models.js`

**Why:** All three new sites are React/SPA apps; plain Axios returns near-empty HTML, so a remote headless browser is required.
**How to apply:** Future store additions — check if the target site uses SSR or CSR to decide between plain Axios vs. Scraping Browser.
