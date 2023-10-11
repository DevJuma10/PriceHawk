"use server"
import { connectToDB } from "../scraper/mongoose";
import { scrapeAmazonProduct } from "../scraper/scraper";
import Product from "../models/product.models";
import { revalidatePath } from "next/cache";
import { getAveragePrice, getHighestPrice, getLowestPrice } from "../scraper/utils";
import { generateEmailBody, sendEmail } from "../nodemailer";
export async function scrapeAndStoreProduct (productUrl) {
    if(!productUrl) {
        console.log('NO PRODUCT URL')
        return;
    }

    try {
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
  
      const similarProducts = await Product.find({
        _id: { $ne: productId },
      }).limit(3);
  
      return similarProducts;
    } catch (error) {
      console.log(error);
    }
  }

export async function addUserEmailToProduct(productId,userEmail){
  try {
    const product = await Product.findById(productId)
    if(!product) {
      return;
    }

    const userExists = product.users.some((user) => user.email === userEmail)
    console.log(userExists)
    if(!userExists){
      product.users.push({email: userEmail})

      await product.save();

      const emailContent = await generateEmailBody(product, "WELCOME");

      await sendEmail(emailContent, [userEmail])
      console.log(emailContent
        )

    }
  } catch (error) {
    console.log(error) 
  }
}