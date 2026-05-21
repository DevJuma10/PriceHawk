import * as cheerio from 'cheerio';
import { extractPrice } from '../utils';
import { fetchRenderedHTML, findJsonLd } from '../brightDataBrowser';

/**
 * Swappa tracks the market price for a device model — the lowest active listing.
 * Use a model/category URL (e.g. https://swappa.com/buy/apple-iphone-15-pro-max-256gb),
 * not an individual seller listing, so the tracked price stays meaningful over time.
 */
export async function scrapeSwappaProduct(url) {
  try {
    const html = await fetchRenderedHTML(url);
    const $ = cheerio.load(html);

    let title = '';
    let currentPrice = 0;
    let originalPrice = 0;
    let image = '';
    let description = '';
    let reviewsCount = 0;

    // JSON-LD product data
    const ld = findJsonLd($, 'Product');
    if (ld) {
      title = ld.name || '';
      description = typeof ld.description === 'string' ? ld.description : '';
      const offer = Array.isArray(ld.offers) ? ld.offers[0] : ld.offers;
      currentPrice = parseFloat(offer?.lowPrice || offer?.price || 0);
      image = Array.isArray(ld.image) ? ld.image[0] : (ld.image || '');
      reviewsCount = ld.aggregateRating?.reviewCount || 0;
    }

    // On model-listing pages: title is the device name in the main heading
    if (!title) {
      title =
        $('h1[class*="title"]').first().text().trim() ||
        $('h1').first().text().trim() ||
        $('meta[property="og:title"]').attr('content') ||
        '';
    }

    // Lowest listed price (model page shows sorted listings — first price is cheapest)
    if (!currentPrice) {
      const raw = extractPrice(
        $('[class*="listing-price"]').first(),
        $('[class*="price"]').first(),
        $('span[class*="amount"]').first(),
      );
      currentPrice = parseFloat(raw?.replace(/,/g, '') || '0');
    }

    if (!originalPrice) {
      // Swappa typically doesn't show an MSRP; fall back to current price
      const raw = extractPrice($('del'), $('s'));
      originalPrice = parseFloat(raw?.replace(/,/g, '') || String(currentPrice));
    }

    if (!image) {
      image =
        $('img[class*="device"]').first().attr('src') ||
        $('img[class*="product"]').first().attr('src') ||
        $('img[class*="listing"]').first().attr('src') ||
        $('meta[property="og:image"]').attr('content') ||
        '';
    }

    // A model page with no listings = effectively out of stock
    const listingCount = parseInt($('[class*="listing-count"]').first().text().replace(/\D/g, ''), 10) || 0;
    const isOutOfStock = listingCount === 0 && $('[class*="listing-price"]').length === 0;

    const discountRate =
      originalPrice > currentPrice
        ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
        : 0;

    if (!title || currentPrice === 0) return null;

    return {
      url,
      title,
      currentPrice,
      originalPrice,
      image,
      isOutOfStock,
      discountRate,
      category: '',
      reviewsCount,
      description,
    };
  } catch (error) {
    console.error(`Swappa scrape failed for ${url}:`, error.message);
    return null;
  }
}
