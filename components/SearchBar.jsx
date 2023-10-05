"use client"

import { scrapeAndStoreProduct } from "@/lib/actions";
import { useState } from "react"
export default function SearchBar() {

    const [searchPrompt, setSearchPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false)

    const isValidAmazonProductUrl = (url) => {
        try {
            const parsedUrl = new URL(url)
            const hostname = parsedUrl.hostname;

            if(
                hostname.includes('amazon.com') || 
                hostname.includes('amazon.') || 
                hostname.endsWith('amazon')
                ) {

                    return true
                }

        } catch (error) {
            console.log(error)
            return false
        }

        return false
    }

    const handleSubmit = async (e) => {
    //submit logic
        e.preventDefault();

        const isValidLink = isValidAmazonProductUrl(searchPrompt)

        if(!isValidLink){
            
            return alert('Please Provide a valid Amazon link')
        }

        try {
            setIsLoading(true)

            //Scrape product page
            const product = await scrapeAndStoreProduct(searchPrompt)

        } catch (error) {
            console.log(error)
        } finally{
            setIsLoading(false)
        }

    }

  return (
    <form 
        className='flex flex-wrap gap-4 mt-12'
        onSubmit={handleSubmit}>
            
        <input 
            type="text"
            value={searchPrompt}
            onChange={(e) => setSearchPrompt(e.target.value)}
            placeholder="Enter product link"
            className="searchbar-input"
             />

        <button 
            type="sumbit" 
            className="searchbar-btn"
            disabled={searchPrompt === ''}>
            {isLoading ? 'Searching...' : 'Search'}
        </button>
    </form>
  )
}
