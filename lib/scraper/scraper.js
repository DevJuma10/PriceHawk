import axios from "axios";
import  * as cheerio from 'cheerio';
import { extractPrice, extractCurrency, extractDescription, getHighestPrice, getLowestPrice, getAveragePrice } from "./utils";

export async function scrapeAmazonProduct(url) {
 
    if (!url) return;

    //Bright data proxy configuration
    //curl --proxy brd.superproxy.io:22225 --proxy-user brd-customer-hl_cde12b03-zone-pricehawk:01v46wpv3uo0 -k https://lumtest.com/myip.json
    const username = process.env.BRIGHT_DATA_USERNAME
    const password = process.env.BRIGHT_DATA_PASSWORD
    const port = process.env.BRIGHT_DATA_PORT
    const session_id = (10000000 * Math.random() | 0)
    const options = {
        auth: {
            username: `${username}-session-${session_id}`,
            password,
        },
        host: 'brd.superproxy.io',
        port,
        rejectUnauthorized: false
    }

    try {
        
        const response = await axios.get(url, options);
        const $ = cheerio.load(response.data);

        const title = $('#productTitle').text().trim();
        
        const currentPrice = await extractPrice(
            $('.priceToPay span.a-price-whole'),
            $('.a.size.base.a-color-price'),
            $('.a-button-selected .a-color-base'),
          );
      
          const originalPrice = await extractPrice(
            $('#priceblock_ourprice'),
            $('.a-price.a-text-price span.a-offscreen'),
            $('#listPrice'),
            $('#priceblock_dealprice'),
            $('.a-size-base.a-color-price')
          );
            
          const isOutOfStock = $('#availability span').text().trim().toLowerCase() === 'currently unavailable'

          const images = 
          $('#imgBlkFront').attr('data-a-dynamic-image') || 
          $('#landingImage').attr('data-a-dynamic-image') ||
          '{}'
    
        const imageUrls = Object.keys(JSON.parse(images));
    
        const currency = await extractCurrency($('.a-price-symbol'))
        const discountRate = $('.savingsPercentage').text().replace(/[-%]/g, "");
    
        const description = extractDescription($)

        // Construct data from scraped data
        const data = {
            url,
            currency: currency || '$',
            image: imageUrls[0],
            title,
            currentPrice:Number(currentPrice) || Number(originalPrice),
            originalPrice:Number(originalPrice) || Number(currentPrice),
            priceHisory:[],
            discountRate:Number(discountRate),
            isOutOfStock,
            starts:4.3,
            reviewsCount:345,
            description,
            lowestPrice: Number(currentPrice) || Number(originalPrice),
            averagePrice: Number(currentPrice) || Number(originalPrice),
            highestPrice: Number(originalPrice) || Number(currentPrice)

        

        }

        return data;   

    } catch (error) {
        throw new Error(`Failed to scrape product : ${error.message}`)
    }
    
}
