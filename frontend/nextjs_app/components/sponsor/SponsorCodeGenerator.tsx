'use client'

import { useState } from 'react'
import { sponsorClient } from '@/services/sponsorClient'

export function SponsorCodeGenerator() {
  const [seats, setSeats] = useState(5)
  const [valuePerSeat, setValuePerSeat] = useState(300)
  const [loading, setLoading] = useState(false)
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const result = await sponsorClient.generateCodes({
        seats: seats,
        value_per_seat: valuePerSeat,
      })
      const code = result?.[0]?.code || 'SPNSR-' + Date.now()
      setGeneratedCode(code)
      
      // Copy to clipboard
      if (code) {
        navigator.clipboard.writeText(code)
      }
      
      // Trigger confetti effect (simple visual feedback)
      const confetti = document.createElement('div')
      confetti.className = 'fixed inset-0 pointer-events-none z-50'
      confetti.innerHTML = '🎉'
      confetti.style.fontSize = '48px'
      confetti.style.textAlign = 'center'
      confetti.style.paddingTop = '20vh'
      confetti.style.animation = 'fadeOut 2s forwards'
      document.body.appendChild(confetti)
      setTimeout(() => confetti.remove(), 2000)
      
    } catch (error) {
      console.error('Failed to generate code:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 border border-dashed border-gray-300 hover:border-emerald-400 transition-colors rounded-2xl bg-white">
      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
        🔑 Generate Sponsor Code
      </h3>
      
      {generatedCode && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Generated Code:</p>
          <p className="font-mono font-bold text-emerald-700">{generatedCode}</p>
          <p className="text-xs text-emerald-600 mt-1">✓ Copied to clipboard</p>
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Seats</label>
          <input
            type="number"
            value={seats}
            onChange={(e) => setSeats(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
            min={1}
            max={100}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Value per Seat (BWP)</label>
          <input
            type="number"
            value={valuePerSeat}
            onChange={(e) => setValuePerSeat(Math.max(0, parseInt(e.target.value) || 0))}
            min={0}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold py-2.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating...' : 'Generate Code'}
          </button>
          <button className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
            History
          </button>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes fadeOut {
          0% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.5) translateY(-50px); }
        }
      `}</style>
    </div>
  )
}

