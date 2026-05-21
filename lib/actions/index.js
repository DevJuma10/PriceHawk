"use server"
import { connectToDB } from "../scraper/mongoose";
import { scrapeAmazonProduct } from "../scraper/scraper";
import { scrapeJumiaProduct } from "../scraper/scrapers/jumia";
import { scrapetakealotProduct } from "../scraper/scrapers/takealot";
import { scrapeBackMarketProduct } from "../scraper/scrapers/backmarket";
import { scrapeSwappaProduct } from "../scraper/scrapers/swappa";
import { scrapeReebeloProduct } from "../scraper/scrapers/reebelo";
import { detectStoreFromUrl } from "../scraper/detectStore";
import Product from "../models/product.models";
import { revalidatePath } from "next/cache";
import { getAveragePrice, getHighestPrice, getLowestPrice } from "../scraper/utils";
import { generateEmailBody, sendEmail } from "../nodemailer";
import { randomUUID } from "crypto";

// Dispatch to the correct scraper based on URL
async function scrapeProduct(url) {
  const storeInfo = detectStoreFromUrl(url);
  if (!storeInfo) throw new Error(`Unrecognised store URL: ${url}`);

  switch (storeInfo.store) {
    case 'jumia':       return scrapeJumiaProduct(url);
    case 'takealot':    return scrapetakealotProduct(url);
    case 'backmarket':  return scrapeBackMarketProduct(url);
    case 'swappa':      return scrapeSwappaProduct(url);
    case 'reebelo':     return scrapeReebeloProduct(url);
    default:            return scrapeAmazonProduct(url);
  }
}

async function upsertProduct(scrapedProduct, productGroupId) {
  const existing = await Product.findOne({ url: scrapedProduct.url });

  let product = { ...scrapedProduct, productGroupId };

  if (existing) {
    const updatedPriceHistory = [
      ...existing.priceHistory,
      { price: scrapedProduct.currentPrice },
    ];
    product = {
      ...product,
      priceHistory: updatedPriceHistory,
      lowestPrice: getLowestPrice(updatedPriceHistory),
      highestPrice: getHighestPrice(updatedPriceHistory),
      averagePrice: getAveragePrice(updatedPriceHistory),
    };
  }

  return Product.findOneAndUpdate(
    { url: scrapedProduct.url },
    product,
    { upsert: true, new: true }
  );
}

// Track a single URL (legacy / direct use)
export async function scrapeAndStoreProduct(productUrl) {
  if (!productUrl) return;

  try {
    await connectToDB();
    const storeInfo = detectStoreFromUrl(productUrl) || { store: 'amazon', currency: '$' };
    const scrapedProduct = await scrapeProduct(productUrl);
    if (!scrapedProduct) return;

    const productGroupId = randomUUID();
    const newProduct = await upsertProduct(
      { ...scrapedProduct, store: storeInfo.store, currency: storeInfo.currency },
      productGroupId
    );
    revalidatePath(`/products/${newProduct._id}`);
  } catch (error) {
    throw new Error(`Failed to create/update product: ${error.message}`);
  }
}

// Track multiple URLs for the same product — links them via a shared productGroupId
export async function scrapeAndStoreMultiStore(urls) {
  if (!urls?.length) return;

  try {
    await connectToDB();
    const productGroupId = randomUUID();

    const results = await Promise.allSettled(
      urls.map(async (url) => {
        const storeInfo = detectStoreFromUrl(url);
        if (!storeInfo) throw new Error(`Unrecognised URL: ${url}`);

        const scraped = await scrapeProduct(url);
        if (!scraped) return null;

        const newProduct = await upsertProduct(
          { ...scraped, store: storeInfo.store, currency: storeInfo.currency },
          productGroupId
        );
        revalidatePath(`/products/${newProduct._id}`);
        return newProduct;
      })
    );

    const failures = results.filter((r) => r.status === 'rejected');
    if (failures.length) {
      console.error('Some URLs failed to scrape:', failures.map((f) => f.reason));
    }
  } catch (error) {
    throw new Error(`Failed to scrape multi-store product: ${error.message}`);
  }
}

// Returns all products grouped by productGroupId — single DB query (no N+1)
export async function getAllProductGroups() {
  try {
    await connectToDB();
    const products = await Product.find().lean();

    // Group by productGroupId in JS — one DB round-trip regardless of product count
    const groups = {};
    for (const product of products) {
      const gid = product.productGroupId || product._id.toString();
      if (!groups[gid]) groups[gid] = [];
      groups[gid].push(product);
    }

    return Object.values(groups);
  } catch (error) {
    console.log(error);
    return [];
  }
}

export async function getProductById(productId) {
  try {
    await connectToDB();
    const product = await Product.findOne({ _id: productId });
    if (!product) return null;
    return product;
  } catch (error) {
    console.log(error);
  }
}

export async function getAllProducts() {
  try {
    await connectToDB();
    const products = await Product.find();
    return products;
  } catch (error) {
    console.log(error);
  }
}

export async function getSimilarProducts(productId) {
  try {
    await connectToDB();
    const currentProduct = await Product.findById(productId);
    if (!currentProduct) return null;

    const similarProducts = await Product.find({
      _id: { $ne: productId },
    }).limit(3);

    return similarProducts;
  } catch (error) {
    console.log(error);
  }
}

export async function addUserEmailToProduct(productId, userEmail) {
  try {
    await connectToDB();
    const product = await Product.findById(productId);
    if (!product) return;

    const userExists = product.users.some((user) => user.email === userEmail);
    if (!userExists) {
      product.users.push({ email: userEmail });
      await product.save();

      const emailContent = await generateEmailBody(product, "WELCOME");
      await sendEmail(emailContent, [userEmail]);
    }
  } catch (error) {
    console.log(error);
  }
}
