'use client'

interface BudgetThermometerProps {
  used: number
  total: number
  currency?: string
  className?: string
}

export function BudgetThermometer({ used, total, currency = 'BWP', className = '' }: BudgetThermometerProps) {
  const percentage = total > 0 ? (used / total) * 100 : 0
  const colorClass = percentage >= 90 ? 'bg-red-500' : percentage >= 75 ? 'bg-amber-500' : 'bg-emerald-500'
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }
  
  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-700">
          {formatCurrency(used)} / {formatCurrency(total)}
        </span>
        <span className={`text-sm font-bold ${
          percentage >= 90 ? 'text-red-600' : percentage >= 75 ? 'text-amber-600' : 'text-emerald-600'
        }`}>
          {percentage.toFixed(0)}%
        </span>
      </div>
      <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`${colorClass} h-full transition-all duration-1000 ease-out relative`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        >
          {/* Animated arrow indicator */}
          {percentage > 0 && (
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2">
              <div className="w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-gray-800"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

