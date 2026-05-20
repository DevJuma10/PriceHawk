import axios from 'axios';
import * as cheerio from 'cheerio';
import { extractPrice } from '../utils';

export async function scrapetakealotProduct(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-ZA,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
    });

    const $ = cheerio.load(response.data);

    const title =
      $('h1.product-title').text().trim() ||
      $('h1[class*="title"]').first().text().trim() ||
      $('h1').first().text().trim();

    const currentPriceRaw = extractPrice(
      $('span[class*="buy-box"] .currency'),
      $('span.currency + span'),
      $('span[class*="price"] .currency'),
    );

    const originalPriceRaw = extractPrice(
      $('span[class*="listed-price"] .currency'),
      $('del span.currency'),
    );

    const currentPrice = parseFloat(currentPriceRaw?.replace(/,/g, '') || '0');
    const originalPrice = parseFloat(originalPriceRaw?.replace(/,/g, '') || currentPrice.toString());

    const image =
      $('img[class*="product-image"]').first().attr('src') ||
      $('img[class*="gallery"]').first().attr('src') ||
      $('meta[property="og:image"]').attr('content') ||
      '';

    const isOutOfStock =
      $('button[class*="add-to-cart"]').length === 0 ||
      $('span[class*="out-of-stock"]').length > 0;

    const discountRate = originalPrice > currentPrice
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
      reviewsCount: 0,
      description: '',
    };
  } catch (error) {
    console.error(`Takealot scrape failed for ${url}:`, error.message);
    return null;
  }
}
