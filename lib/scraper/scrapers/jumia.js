import axios from 'axios';
import * as cheerio from 'cheerio';
import { extractPrice } from '../utils';

export async function scrapeJumiaProduct(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    const $ = cheerio.load(response.data);

    const title =
      $('h1.-fs20.-pts.-pbxs').text().trim() ||
      $('h1.name').text().trim() ||
      $('h1').first().text().trim();

    const currentPriceRaw = extractPrice(
      $('span.-b.-ltr.-tal.-fs24'),
      $('span.-b.-ltr.-tal.-fs20'),
      $('span[data-price]'),
    );

    const originalPriceRaw = extractPrice(
      $('span.-lthr.-fs16'),
      $('span.was-price'),
    );

    const currentPrice = parseFloat(currentPriceRaw?.replace(/,/g, '') || '0');
    const originalPrice = parseFloat(originalPriceRaw?.replace(/,/g, '') || currentPrice.toString());

    const image =
      $('img.-fw.-fh').first().attr('src') ||
      $('img.slick-slide').first().attr('data-src') ||
      $('img').first().attr('src') ||
      '';

    const isOutOfStock =
      $('div.-pbs.-ptxs.-tal button').text().toLowerCase().includes('out of stock') ||
      $('button.btn').text().toLowerCase().includes('out of stock');

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
    console.error(`Jumia scrape failed for ${url}:`, error.message);
    return null;
  }
}
