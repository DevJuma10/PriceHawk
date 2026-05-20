import { detectStoreFromUrl } from '../lib/scraper/detectStore.js'

describe('detectStoreFromUrl', () => {
  describe('Amazon', () => {
    it('detects amazon.com', () => {
      expect(detectStoreFromUrl('https://www.amazon.com/dp/B0CHX2F5QT')).toEqual(
        { store: 'amazon', currency: '$' }
      )
    })
    it('detects amazon.co.uk', () => {
      expect(detectStoreFromUrl('https://www.amazon.co.uk/dp/B0CHX')).toEqual(
        { store: 'amazon', currency: '$' }
      )
    })
  })

  describe('Jumia', () => {
    it('detects Jumia Kenya with KES', () => {
      expect(detectStoreFromUrl('https://www.jumia.co.ke/samsung-galaxy-s24.html')).toEqual(
        { store: 'jumia', currency: 'KES' }
      )
    })
    it('detects Jumia Nigeria with NGN', () => {
      expect(detectStoreFromUrl('https://www.jumia.com.ng/product.html')).toEqual(
        { store: 'jumia', currency: 'NGN' }
      )
    })
    it('detects Jumia South Africa with ZAR', () => {
      expect(detectStoreFromUrl('https://www.jumia.co.za/product.html')).toEqual(
        { store: 'jumia', currency: 'ZAR' }
      )
    })
  })

  describe('Takealot', () => {
    it('detects takealot.com with ZAR', () => {
      expect(detectStoreFromUrl('https://www.takealot.com/samsung-galaxy-s24/PLID94302631')).toEqual(
        { store: 'takealot', currency: 'ZAR' }
      )
    })
  })

  describe('Unknown / invalid', () => {
    it('returns null for an unrecognised store', () => {
      expect(detectStoreFromUrl('https://www.ebay.com/itm/123')).toBeNull()
    })
    it('returns null for a malformed URL', () => {
      expect(detectStoreFromUrl('not a url')).toBeNull()
    })
    it('returns null for an empty string', () => {
      expect(detectStoreFromUrl('')).toBeNull()
    })
  })
})
