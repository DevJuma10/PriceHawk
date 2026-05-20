const STORE_PATTERNS = [
  {
    store: 'amazon',
    currency: '$',
    test: (h) => h.includes('amazon.com') || h.includes('amazon.co.'),
  },
  {
    store: 'jumia',
    test: (h) => h.includes('jumia.'),
    currency: (hostname) => {
      if (hostname.includes('.co.ke')) return 'KES'
      if (hostname.includes('.com.ng')) return 'NGN'
      if (hostname.includes('.co.za')) return 'ZAR'
      if (hostname.includes('.co.tz')) return 'TZS'
      if (hostname.includes('.co.ug')) return 'UGX'
      if (hostname.includes('.com.gh')) return 'GHS'
      return 'USD'
    },
  },
  {
    store: 'takealot',
    currency: 'ZAR',
    test: (h) => h.includes('takealot.com'),
  },
]

/**
 * Detects store from a product URL.
 * Returns { store, currency } or null for unrecognised URLs.
 */
export function detectStoreFromUrl(url) {
  try {
    const { hostname } = new URL(url)
    const h = hostname.toLowerCase()

    for (const pattern of STORE_PATTERNS) {
      if (pattern.test(h)) {
        const currency =
          typeof pattern.currency === 'function'
            ? pattern.currency(h)
            : pattern.currency
        return { store: pattern.store, currency }
      }
    }
    return null
  } catch {
    return null
  }
}
