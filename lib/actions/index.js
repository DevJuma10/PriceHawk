"use server"
import { scrapeAmazonProduct } from "../scraper/scraper";

export async function scrapeAndStoreProduct (productUrl) {
    if(!productUrl) {
        console.log('NO PRODUCT URL')
        return;
    }

    try {
        const scrapedProduct = await scrapeAmazonProduct(productUrl)

        if(!scrapedProduct) return
    } catch (error) {
        throw new Error(`Failed to create/update product: ${error.message}`)
    } 
}