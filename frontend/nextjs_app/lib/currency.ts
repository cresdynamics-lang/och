/**
 * Currency conversion utilities
 * Converts USD to local currencies based on country
 */

// Currency exchange rates (as of latest update)
// These should ideally come from an API, but for now we'll use static rates
// Default to Kenya (KES) as primary market
const EXCHANGE_RATES: Record<string, number> = {
  'KE': 130.0, // Kenyan Shilling (KES) - 1 USD = 130 KES
  'US': 1.0,   // US Dollar
  'BW': 13.5,  // Botswana Pula
  'ZA': 18.5,  // South African Rand
  'NG': 1500.0, // Nigerian Naira
  'GH': 12.0,  // Ghanaian Cedi
  'TZ': 2300.0, // Tanzanian Shilling
  'UG': 3700.0, // Ugandan Shilling
  'ET': 55.0,  // Ethiopian Birr
  'RW': 1300.0, // Rwandan Franc
}

// Currency symbols
const CURRENCY_SYMBOLS: Record<string, string> = {
  'KE': 'KES',
  'US': 'USD',
  'BW': 'BWP',
  'ZA': 'ZAR',
  'NG': 'NGN',
  'GH': 'GHS',
  'TZ': 'TZS',
  'UG': 'UGX',
  'ET': 'ETB',
  'RW': 'RWF',
}

/**
 * Get currency code for a country
 */
export function getCurrencyCode(countryCode?: string | null): string {
  if (!countryCode) return 'KES' // Default to Kenya
  return CURRENCY_SYMBOLS[countryCode.toUpperCase()] || 'KES'
}

/**
 * Convert USD to local currency
 */
export function convertUSDToLocal(usdAmount: number, countryCode?: string | null): number {
  if (!usdAmount || usdAmount === 0) return 0
  const code = countryCode?.toUpperCase() || 'KE'
  const rate = EXCHANGE_RATES[code] || EXCHANGE_RATES['KE']
  return usdAmount * rate
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, countryCode?: string | null): string {
  const currencyCode = getCurrencyCode(countryCode)
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
  
  return `${formatted} ${currencyCode}`
}

/**
 * Format currency with symbol
 */
export function formatCurrencyWithSymbol(amount: number, countryCode?: string | null): string {
  const currencyCode = getCurrencyCode(countryCode)
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
  
  // Add symbol prefix for common currencies
  const symbolMap: Record<string, string> = {
    'KES': 'KSh',
    'USD': '$',
    'BWP': 'P',
    'ZAR': 'R',
    'NGN': '₦',
    'GHS': '₵',
  }
  
  const symbol = symbolMap[currencyCode] || currencyCode
  return `${symbol} ${formatted}`
}

/**
 * Calculate annual price with 10% discount
 */
export function calculateAnnualPrice(monthlyPriceUSD: number, countryCode?: string | null): {
  monthlyUSD: number
  annualUSD: number
  annualLocal: number
  discount: number
  formattedMonthly: string
  formattedAnnual: string
} {
  const annualUSD = monthlyPriceUSD * 12
  const discount = annualUSD * 0.1 // 10% discount
  const annualDiscountedUSD = annualUSD - discount
  
  const monthlyLocal = convertUSDToLocal(monthlyPriceUSD, countryCode)
  const annualLocal = convertUSDToLocal(annualDiscountedUSD, countryCode)
  
  return {
    monthlyUSD: monthlyPriceUSD,
    annualUSD: annualDiscountedUSD,
    annualLocal,
    discount,
    formattedMonthly: formatCurrencyWithSymbol(monthlyLocal, countryCode),
    formattedAnnual: formatCurrencyWithSymbol(annualLocal, countryCode),
  }
}
