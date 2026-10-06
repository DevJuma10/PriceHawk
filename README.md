# PriceHawk

## About

PriceHawk is a multi-store product price tracker built with Next.js 13. Paste a product URL from Amazon, Jumia, Takealot, Back Market, Swappa, or Reebelo and PriceHawk will scrape the product details, store them in MongoDB, and monitor the price over time — alerting subscribed users via email whenever a significant price event occurs (lowest price ever, back in stock, or a discount above 40%).

You can submit several URLs for the same product from different stores; they're tracked as one group so prices can be compared side by side.

## Features

- **Multi-store scraping** — extracts title, current/original price, image, discount rate, stock status, and description. The store is detected from the URL (pasting without `https://` is fine).

  | Store | Currency | Scraping method |
  |-------|----------|-----------------|
  | Amazon | USD | Axios + Cheerio via Bright Data residential proxy |
  | Jumia | KES / NGN / ZAR / TZS / UGX / GHS (by country domain) | Axios + Cheerio |
  | Takealot | ZAR | Axios + Cheerio |
  | Back Market | USD / EUR / GBP / JPY / AUD (by region domain) | Bright Data Scraping Browser (puppeteer-core) + Cheerio |
  | Swappa | USD | Bright Data Scraping Browser (puppeteer-core) + Cheerio |
  | Reebelo | USD / AUD / NZD / SGD / CAD (by region domain) | Bright Data Scraping Browser (puppeteer-core) + Cheerio |

  Back Market, Swappa, and Reebelo render their pages client-side, so they're loaded in a remote headless browser before parsing. For Swappa, use a model page (e.g. `swappa.com/buy/apple-iphone-15-pro-max-256gb`) — it tracks the lowest active listing.
- **Multi-store product groups** — add extra store URLs for the same product from the search bar; the home page shows each group as one card listing every store, and highlights the cheapest when all stores share a currency.
- **Price history tracking** — every re-scrape appends a timestamped snapshot; lowest, highest, and average prices are always kept up to date.
- **Automated cron job** — a cron-triggered API route (`/api/cron`) re-scrapes all tracked products on a schedule and fires email alerts when conditions are met.
- **Email notifications** — four alert types sent via Nodemailer (Outlook):
  - `WELCOME` — confirmation when a user starts tracking a product
  - `LOWEST_PRICE` — price has hit an all-time low
  - `CHANGE_OF_STOCK` — an out-of-stock item is back in stock
  - `THRESHOLD_MET` — discount exceeds 40%
- **Trending products page** — home page shows all tracked product groups in a grid with a hero carousel.
- **Product detail page** — shows full price stats and lets new users subscribe with their email address.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 13 (App Router) |
| Styling | Tailwind CSS |
| Scraping | Axios + Cheerio, puppeteer-core (Bright Data Scraping Browser) |
| Proxy | Bright Data residential proxies (Amazon) |
| Database | MongoDB + Mongoose |
| Email | Nodemailer (Outlook/Hotmail) |
| UI | Headless UI, react-responsive-carousel |
| Tests | Jest |

## Project Structure

```
├── app/
│   ├── api/cron/route.js       # Cron job — re-scrapes all products & sends alerts
│   ├── products/[id]/page.jsx  # Product detail page
│   ├── page.js                 # Home page (search + trending grid)
│   └── layout.js
├── components/
│   ├── HeroCarousel.jsx        # Homepage carousel
│   ├── SearchBar.jsx           # Product URL input (one or more stores)
│   ├── MultiStoreCard.jsx      # Card for a product group in the trending grid
│   ├── ProductCard.jsx         # Single-product card (similar products)
│   ├── PriceInfoCard.jsx       # Price stat display
│   ├── Modal.jsx               # Email subscription modal
│   └── Navbar.jsx
├── lib/
│   ├── actions/index.js        # Server actions (scrape, store, group, query products)
│   ├── models/product.models.js
│   ├── scraper/
│   │   ├── scraper.js          # Amazon scraping logic
│   │   ├── scrapers/           # jumia, takealot, backmarket, swappa, reebelo
│   │   ├── brightDataBrowser.js # Scraping Browser connection + JSON-LD helper
│   │   ├── detectStore.js      # URL → store + currency
│   │   ├── utils.js            # Price extraction + email notification helpers
│   │   └── mongoose.js         # DB connection
│   └── nodemailer/index.js     # Email generation & sending
├── scripts/
│   └── migrate-add-store-field.mjs # One-time backfill of store/productGroupId on old records
└── __tests__/                  # Jest tests (store detection, price extraction)
```

### Adding a new store

1. Create `lib/scraper/scrapers/<store>.js`
2. Add its URL pattern and currency to `lib/scraper/detectStore.js`
3. Add a case to the scraper switch in both `lib/actions/index.js` and `app/api/cron/route.js`
4. Add the store key to the `store` enum in `lib/models/product.models.js`
5. Add a display label in `components/MultiStoreCard.jsx` and list it in the UI text

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

```env
# MongoDB
MONGODB_URI=

# Bright Data — residential proxy (Amazon scraper)
BRIGHT_DATA_USERNAME=
BRIGHT_DATA_PASSWORD=
BRIGHT_DATA_PORT=

# Bright Data — Scraping Browser (Back Market, Swappa, Reebelo scrapers)
# Dashboard → Scraping Browser zone → WebSocket endpoint
BRIGHT_DATA_SCRAPING_BROWSER_WS=

# Email (Outlook/Hotmail)
EMAIL_PASSWORD=
```

Nothing can be saved without `MONGODB_URI`, and each store's scraper fails without its Bright Data credentials.

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

If you have products saved from before multi-store support, backfill their `store` and `productGroupId` fields once (safe to re-run):

```bash
npm run migrate
```

Run the tests with:

```bash
npm test
```

To trigger the cron job manually during development, hit:

```
GET http://localhost:3000/api/cron
```
