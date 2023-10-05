"use server"
import { connectToDB } from "../scraper/mongoose";
import { scrapeAmazonProduct } from "../scraper/scraper";
import Product from "../models/product.models";
import { revalidatePath } from "next/cache";
import { getAveragePrice, getHighestPrice, getLowestPrice } from "../scraper/utils";
export async function scrapeAndStoreProduct (productUrl) {
    if(!productUrl) {
        console.log('NO PRODUCT URL')
        return;
    }

    try {
        console.log(`----------------------------${process.env.MONGODB_URI}`)
        connectToDB()
        const scrapedProduct = await scrapeAmazonProduct(productUrl)

        if(!scrapedProduct) return;

        let product = scrapedProduct;

        const existingProduct = await Product.findOne({url:scrapedProduct.url})

        if (existingProduct){
            const updatedPriceHistory = [
                ...existingProduct.priceHistory, 
                {price:scrapedProduct.currentPrice}
            ]

            product = {
                ...scrapedProduct,
                priceHistory: updatedPriceHistory,
                lowestPrice: getLowestPrice(updatedPriceHistory),
                highestPrice: getHighestPrice(updatedPriceHistory),
                averagePrice: getAveragePrice(updatedPriceHistory),

            }
        }

        const newProduct = await Product.findOneAndUpdate(
            {url: scrapedProduct.url},
            product,
            {upsert: true, new:true}
        );

        revalidatePath(`/products/${newProduct._id}`)

    } catch (error) {
        throw new Error(`Failed to create/update product: ${error.message}`)
    } 
}

export async function getProductById(productId) {
    try {
      connectToDB();
  
      const product = await Product.findOne({ _id: productId });
  
      if(!product) return null;
  
      return product;
    } catch (error) {
      console.log(error);
    }
  }
  
  export async function getAllProducts() {
    try {
      connectToDB();
  
      const products = await Product.find();
  
      return products;
    } catch (error) {
      console.log(error);
    }
  }
  
  export async function getSimilarProducts(productId) {
    try {
      connectToDB();
  
      const currentProduct = await Product.findById(productId);
  
      if(!currentProduct) return null;
    }

    catch(error){
        console.log(error)
    }
  }