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

  describe('Back Market', () => {
    it('detects backmarket.com with USD', () => {
      expect(detectStoreFromUrl('https://www.backmarket.com/en-us/p/iphone-15-pro/abc123')).toEqual(
        { store: 'backmarket', currency: 'USD' }
      )
    })
    it('detects backmarket.co.uk with GBP', () => {
      expect(detectStoreFromUrl('https://www.backmarket.co.uk/en-gb/p/iphone-15/abc')).toEqual(
        { store: 'backmarket', currency: 'GBP' }
      )
    })
    it('detects backmarket.fr with EUR', () => {
      expect(detectStoreFromUrl('https://www.backmarket.fr/fr-fr/p/iphone-15/abc')).toEqual(
        { store: 'backmarket', currency: 'EUR' }
      )
    })
  })

  describe('Swappa', () => {
    it('detects swappa.com with USD', () => {
      expect(detectStoreFromUrl('https://swappa.com/buy/apple-iphone-15-pro-max-256gb')).toEqual(
        { store: 'swappa', currency: 'USD' }
      )
    })
  })

  describe('Reebelo', () => {
    it('detects reebelo.com with USD', () => {
      expect(detectStoreFromUrl('https://reebelo.com/products/apple-iphone-15-pro')).toEqual(
        { store: 'reebelo', currency: 'USD' }
      )
    })
    it('detects reebelo.com.au with AUD', () => {
      expect(detectStoreFromUrl('https://reebelo.com.au/products/apple-iphone-15')).toEqual(
        { store: 'reebelo', currency: 'AUD' }
      )
    })
    it('detects reebelo.sg with SGD', () => {
      expect(detectStoreFromUrl('https://reebelo.sg/products/apple-iphone-15')).toEqual(
        { store: 'reebelo', currency: 'SGD' }
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
