import * as cheerio from 'cheerio';
import { extractPrice } from '../utils';
import { fetchRenderedHTML, findJsonLd } from '../brightDataBrowser';

export async function scrapeReebeloProduct(url) {
  try {
    const html = await fetchRenderedHTML(url);
    const $ = cheerio.load(html);

    let title = '';
    let currentPrice = 0;
    let originalPrice = 0;
    let image = '';
    let description = '';
    let reviewsCount = 0;

    // Reebelo is a Next.js app with server-side rendering — JSON-LD should always be present
    const ld = findJsonLd($, 'Product');
    if (ld) {
      title = ld.name || '';
      description = typeof ld.description === 'string' ? ld.description : '';
      const offer = Array.isArray(ld.offers) ? ld.offers[0] : ld.offers;
      currentPrice = parseFloat(offer?.price || 0);
      image = Array.isArray(ld.image) ? ld.image[0] : (ld.image || '');
      reviewsCount = ld.aggregateRating?.reviewCount || 0;
    }

    // CSS fallbacks — Reebelo uses Tailwind so class names may change; prefer semantic attrs
    if (!title) {
      title =
        $('h1[class*="product"]').first().text().trim() ||
        $('h1').first().text().trim() ||
        $('meta[property="og:title"]').attr('content') ||
        '';
    }

    if (!currentPrice) {
      const raw = extractPrice(
        $('[class*="selling-price"]'),
        $('[class*="sale-price"]'),
        $('[class*="product-price"]'),
        $('span[class*="price"]'),
      );
      currentPrice = parseFloat(raw?.replace(/,/g, '') || '0');
    }

    if (!originalPrice) {
      const raw = extractPrice(
        $('[class*="compare-price"]'),
        $('[class*="original-price"]'),
        $('del'),
        $('s'),
      );
      originalPrice = parseFloat(raw?.replace(/,/g, '') || String(currentPrice));
    }

    if (!image) {
      image =
        $('img[class*="product"]').first().attr('src') ||
        $('img[class*="carousel"]').first().attr('src') ||
        $('[class*="product-image"] img').first().attr('src') ||
        $('meta[property="og:image"]').attr('content') ||
        '';
    }

    // Reebelo shows "Add to Cart" when in stock; "Sold Out" or similar when not
    const soldOutText = $('body').text().toLowerCase();
    const isOutOfStock =
      soldOutText.includes('sold out') ||
      soldOutText.includes('out of stock') ||
      $('button[class*="add-to-cart"]').length === 0;

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
    console.error(`Reebelo scrape failed for ${url}:`, error.message);
    return null;
  }
}
