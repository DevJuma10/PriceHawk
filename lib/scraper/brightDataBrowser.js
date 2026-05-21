import puppeteer from 'puppeteer-core';

/**
 * Fetches fully JS-rendered HTML via Bright Data Scraping Browser.
 * Requires BRIGHT_DATA_SCRAPING_BROWSER_WS env var:
 *   wss://brd-customer-<ID>-zone-scraping_browser:<PASSWORD>@brd.superproxy.io:9222
 *
 * Bright Data dashboard → Scraping Browser zone → copy the WebSocket endpoint.
 */
export async function fetchRenderedHTML(url) {
  const wsEndpoint = process.env.BRIGHT_DATA_SCRAPING_BROWSER_WS;
  if (!wsEndpoint) throw new Error('BRIGHT_DATA_SCRAPING_BROWSER_WS is not set');

  const browser = await puppeteer.connect({ browserWSEndpoint: wsEndpoint });
  try {
    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    return await page.content();
  } finally {
    // disconnect (not close) — Bright Data manages the remote browser lifecycle
    await browser.disconnect();
  }
}

/**
 * Parses all JSON-LD <script> blocks and returns the first one matching @type.
 * Used by scrapers as the most reliable structured-data source.
 */
export function findJsonLd($, type) {
  const scripts = $('script[type="application/ld+json"]').toArray();
  for (const el of scripts) {
    try {
      const data = JSON.parse($(el).html());
      const items = Array.isArray(data) ? data : [data];
      const match = items.find((d) => d?.['@type'] === type);
      if (match) return match;
    } catch {
      // malformed JSON-LD — skip
    }
  }
  return null;
}
