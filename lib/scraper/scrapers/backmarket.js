import * as cheerio from 'cheerio';
import { extractPrice } from '../utils';
import { fetchRenderedHTML, findJsonLd } from '../brightDataBrowser';

export async function scrapeBackMarketProduct(url) {
  try {
    const html = await fetchRenderedHTML(url);
    const $ = cheerio.load(html);

    let title = '';
    let currentPrice = 0;
    let originalPrice = 0;
    let image = '';
    let description = '';
    let reviewsCount = 0;

    // JSON-LD is the most reliable — Back Market includes Product structured data
    const ld = findJsonLd($, 'Product');
    if (ld) {
      title = ld.name || '';
      description = typeof ld.description === 'string' ? ld.description : '';
      const offer = Array.isArray(ld.offers) ? ld.offers[0] : ld.offers;
      currentPrice = parseFloat(offer?.price || 0);
      image = Array.isArray(ld.image) ? ld.image[0] : (ld.image || '');
      reviewsCount = ld.aggregateRating?.reviewCount || 0;
    }

    // CSS fallbacks (Back Market uses data-qa attributes for testability)
    if (!title) {
      title =
        $('[data-qa="product-title"]').text().trim() ||
        $('h1[class*="title"]').first().text().trim() ||
        $('h1').first().text().trim();
    }

    if (!currentPrice) {
      const raw = extractPrice(
        $('[data-qa="product-price"]'),
        $('[class*="Price"] [class*="price-value"]'),
        $('[class*="price-amount"]'),
        $('span[itemprop="price"]'),
      );
      currentPrice = parseFloat(raw?.replace(/,/g, '') || '0');
    }

    if (!originalPrice) {
      const raw = extractPrice(
        $('[class*="crossed-out"]'),
        $('[data-qa="original-price"]'),
        $('del'),
        $('s'),
      );
      originalPrice = parseFloat(raw?.replace(/,/g, '') || String(currentPrice));
    }

    if (!image) {
      image =
        $('[data-qa="product-photo"] img').first().attr('src') ||
        $('picture source').first().attr('srcset')?.split(' ')[0] ||
        $('picture img').first().attr('src') ||
        $('meta[property="og:image"]').attr('content') ||
        '';
    }

    // Back Market shows an "Add to cart" button when in stock
    const isOutOfStock = $('[data-qa="add-to-cart"]').length === 0 &&
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
    console.error(`Back Market scrape failed for ${url}:`, error.message);
    return null;
  }
}
