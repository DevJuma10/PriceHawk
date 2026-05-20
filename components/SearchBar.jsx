"use client"

import { scrapeAndStoreMultiStore } from "@/lib/actions"
import { detectStoreFromUrl } from "@/lib/scraper/detectStore"
import { useState } from "react"

export default function SearchBar() {
  const [urls, setUrls] = useState([''])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const updateUrl = (index, value) => {
    setUrls((prev) => prev.map((u, i) => (i === index ? value : u)))
    setError('')
  }

  const addUrl = () => setUrls((prev) => [...prev, ''])

  const removeUrl = (index) =>
    setUrls((prev) => prev.filter((_, i) => i !== index))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const filled = urls.filter(Boolean)
    if (filled.length === 0) return

    // Validate every URL — must be a recognised store
    for (const url of filled) {
      if (!detectStoreFromUrl(url)) {
        setError(`Unrecognised store URL: ${url}. Supported: Amazon, Jumia, Takealot.`)
        return
      }
    }

    try {
      setIsLoading(true)
      await scrapeAndStoreMultiStore(filled)
      setUrls([''])
    } catch (err) {
      console.error(err)
      setError('Failed to track product. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form className="flex flex-col gap-4 mt-12" onSubmit={handleSubmit}>
      {urls.map((url, i) => (
        <div key={i} className="flex flex-wrap gap-4">
          <input
            type="text"
            value={url}
            onChange={(e) => updateUrl(i, e.target.value)}
            placeholder={
              i === 0
                ? "Paste a product URL (Amazon, Jumia, Takealot)"
                : "Add another store URL for the same product"
            }
            className="searchbar-input"
          />
          {urls.length > 1 && (
            <button
              type="button"
              onClick={() => removeUrl(i)}
              className="text-sm text-gray-500 hover:text-red-500"
            >
              Remove
            </button>
          )}
        </div>
      ))}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-4 flex-wrap">
        <button
          type="button"
          onClick={addUrl}
          className="text-sm text-primary underline"
        >
          + Add another store URL
        </button>

        <button
          type="submit"
          className="searchbar-btn"
          disabled={urls.every((u) => !u)}
        >
          {isLoading ? 'Tracking...' : 'Track'}
        </button>
      </div>
    </form>
  )
}
