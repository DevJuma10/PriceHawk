import { NextResponse } from "next/server";
import { getLowestPrice, getHighestPrice, getAveragePrice, getEmailNotifType } from "@/lib/scraper/utils";
import { connectToDB } from "@/lib/scraper/mongoose";
import Product from "@/lib/models/product.models";
import { scrapeAmazonProduct } from "@/lib/scraper/scraper";
import { scrapeJumiaProduct } from "@/lib/scraper/scrapers/jumia";
import { scrapetakealotProduct } from "@/lib/scraper/scrapers/takealot";
import { scrapeBackMarketProduct } from "@/lib/scraper/scrapers/backmarket";
import { scrapeSwappaProduct } from "@/lib/scraper/scrapers/swappa";
import { scrapeReebeloProduct } from "@/lib/scraper/scrapers/reebelo";
import { generateEmailBody, sendEmail } from "@/lib/nodemailer";

export const maxDuration = 10;
export const dynamic = "force-dynamic";
export const revalidate = 0;

const BATCH_SIZE = 5;

// Higher index = higher priority when multiple alerts fire for the same group
const NOTIF_PRIORITY = ['THRESHOLD_MET', 'CHANGE_OF_STOCK', 'LOWEST_PRICE'];

async function scrapeByStore(url, store) {
  switch (store) {
    case 'jumia':       return scrapeJumiaProduct(url);
    case 'takealot':    return scrapetakealotProduct(url);
    case 'backmarket':  return scrapeBackMarketProduct(url);
    case 'swappa':      return scrapeSwappaProduct(url);
    case 'reebelo':     return scrapeReebeloProduct(url);
    default:            return scrapeAmazonProduct(url);
  }
}

export async function GET() {
  try {
    await connectToDB();

    const products = await Product.find({});
    if (!products?.length) throw new Error("No products fetched");

    const results = [];

    // T8: process in batches of BATCH_SIZE to stay within Vercel 10s timeout
    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      const batch = products.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(async (currentProduct) => {
          try {
            const scrapedProduct = await scrapeByStore(currentProduct.url, currentProduct.store);
            if (!scrapedProduct) return null;

            const updatedPriceHistory = [
              ...currentProduct.priceHistory,
              { price: scrapedProduct.currentPrice },
            ];

            const updatedProduct = await Product.findOneAndUpdate(
              { url: currentProduct.url },
              {
                ...scrapedProduct,
                priceHistory: updatedPriceHistory,
                lowestPrice: getLowestPrice(updatedPriceHistory),
                highestPrice: getHighestPrice(updatedPriceHistory),
                averagePrice: getAveragePrice(updatedPriceHistory),
              },
              { new: true }
            );

            const notifType = getEmailNotifType(scrapedProduct, currentProduct);
            return { product: updatedProduct, notifType };
          } catch (err) {
            console.error(`Failed to process ${currentProduct.url}:`, err.message);
            return null;
          }
        })
      );
      results.push(...batchResults.filter(Boolean));
    }

    // T4: deduplicate alerts — one email per productGroupId per event type
    const groupAlerts = {};
    for (const { product, notifType } of results) {
      if (!notifType || !product.users?.length) continue;

      const gid = product.productGroupId || product._id.toString();

      if (!groupAlerts[gid]) {
        groupAlerts[gid] = {
          product,
          notifType,
          emails: new Set(product.users.map((u) => u.email)),
        };
      } else {
        product.users.forEach((u) => groupAlerts[gid].emails.add(u.email));
        // Upgrade to higher-priority notification if applicable
        if (NOTIF_PRIORITY.indexOf(notifType) > NOTIF_PRIORITY.indexOf(groupAlerts[gid].notifType)) {
          groupAlerts[gid].notifType = notifType;
          groupAlerts[gid].product = product;
        }
      }
    }

    await Promise.all(
      Object.values(groupAlerts).map(async ({ product, notifType, emails }) => {
        const emailContent = await generateEmailBody(product, notifType);
        await sendEmail(emailContent, [...emails]);
      })
    );

    return NextResponse.json({
      message: "Ok",
      data: results.map((r) => r.product),
    });
  } catch (error) {
    throw new Error(`Failed to run cron: ${error.message}`);
  }
}
