# PriceHawk

## About

PriceHawk is an Amazon product price tracker built with Next.js 13. Paste any Amazon product URL and PriceHawk will scrape the product details, store them in MongoDB, and monitor the price over time — alerting subscribed users via email whenever a significant price event occurs (lowest price ever, back in stock, or a discount above 40%).

## Features

- **Amazon product scraping** — extracts title, current/original price, images, discount rate, stock status, and description using Axios + Cheerio routed through Bright Data residential proxies.
- **Price history tracking** — every re-scrape appends a timestamped snapshot; lowest, highest, and average prices are always kept up to date.
- **Automated cron job** — a cron-triggered API route (`/api/cron`) re-scrapes all tracked products on a schedule and fires email alerts when conditions are met.
- **Email notifications** — four alert types sent via Nodemailer (Outlook):
  - `WELCOME` — confirmation when a user starts tracking a product
  - `LOWEST_PRICE` — price has hit an all-time low
  - `CHANGE_OF_STOCK` — an out-of-stock item is back in stock
  - `THRESHOLD_MET` — discount exceeds 40%
- **Trending products page** — home page shows all tracked products in a searchable grid with a hero carousel.
- **Product detail page** — shows full price stats and lets new users subscribe with their email address.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 13 (App Router) |
| Styling | Tailwind CSS |
| Scraping | Axios + Cheerio |
| Proxy | Bright Data residential proxies |
| Database | MongoDB + Mongoose |
| Email | Nodemailer (Outlook/Hotmail) |
| UI | Headless UI, react-responsive-carousel |

## Project Structure

```
├── app/
│   ├── api/cron/route.js       # Cron job — re-scrapes all products & sends alerts
│   ├── products/[id]/page.jsx  # Product detail page
│   ├── page.js                 # Home page (search + trending grid)
│   └── layout.js
├── components/
│   ├── HeroCarousel.jsx        # Homepage carousel
│   ├── SearchBar.jsx           # Amazon URL input
│   ├── ProductCard.jsx         # Card used in trending grid
│   ├── PriceInfoCard.jsx       # Price stat display
│   ├── Modal.jsx               # Email subscription modal
│   └── Navbar.jsx
└── lib/
    ├── actions/index.js        # Server actions (scrape, store, query products)
    ├── models/product.models.js
    ├── scraper/
    │   ├── scraper.js          # Amazon scraping logic
    │   ├── utils.js            # Price extraction + email notification helpers
    │   └── mongoose.js         # DB connection
    └── nodemailer/index.js     # Email generation & sending
```

## Environment Variables

Create a `.env.local` file at the project root with the following:

```env
# MongoDB
MONGODB_URI=

# Bright Data proxy
BRIGHT_DATA_USERNAME=
BRIGHT_DATA_PASSWORD=
BRIGHT_DATA_PORT=

# Email (Outlook/Hotmail)
EMAIL_PASSWORD=
```

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

To trigger the cron job manually during development, hit:

```
GET http://localhost:3000/api/cron
```
