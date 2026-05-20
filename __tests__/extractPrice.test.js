import { extractPrice, extractCurrency } from '../lib/scraper/utils.js'

// Minimal cheerio-like element stub
const el = (text) => ({ text: () => text })

describe('extractPrice', () => {
  it('returns the first non-empty price from a list of elements', () => {
    expect(extractPrice(el(''), el('1,299.99'), el('999'))).toBe('1299.99')
  })

  it('returns the price when it is in the first element', () => {
    expect(extractPrice(el('45.00'))).toBe('45.00')
  })

  it('strips currency symbols and commas', () => {
    expect(extractPrice(el('R 12,500'))).toBe('12500')
  })

  it('returns empty string when all elements are empty', () => {
    expect(extractPrice(el(''), el(''))).toBe('')
  })

  it('handles whole numbers without decimals', () => {
    expect(extractPrice(el('350'))).toBe('350')
  })
})

describe('extractCurrency', () => {
  it('extracts the first character as the currency symbol', () => {
    expect(extractCurrency(el('$'))).toBe('$')
  })

  it('returns empty string for empty element', () => {
    expect(extractCurrency(el(''))).toBe('')
  })

  it('handles multi-char currency text by taking first char', () => {
    expect(extractCurrency(el('R 12,500'))).toBe('R')
  })
})
