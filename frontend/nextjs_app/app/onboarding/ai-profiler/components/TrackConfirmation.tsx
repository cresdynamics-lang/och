'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { CheckCircle2, XCircle, ArrowRight } from 'lucide-react'

interface Track {
  key: string
  name: string
  description: string
  icon?: string
}

interface TrackConfirmationProps {
  recommendedTrack: Track
  allTracks: Track[]
  onConfirm: (trackKey: string) => void
  onDecline: () => void
}

const TRACK_INFO: Record<string, { icon: string; color: string; description: string }> = {
  defender: {
    icon: '🛡️',
    color: 'from-blue-500 to-blue-700',
    description: 'Protect systems, detect threats, and respond to incidents'
  },
  offensive: {
    icon: '⚔️',
    color: 'from-red-500 to-red-700',
    description: 'Ethical hacking, penetration testing, and security research'
  },
  grc: {
    icon: '📋',
    color: 'from-purple-500 to-purple-700',
    description: 'Governance, risk management, and compliance'
  },
  innovation: {
    icon: '💡',
    color: 'from-green-500 to-green-700',
    description: 'Build security solutions, innovate, and create new technologies'
  },
  leadership: {
    icon: '👑',
    color: 'from-yellow-500 to-yellow-700',
    description: 'Lead security teams, strategize, and drive organizational change'
  }
}

export default function TrackConfirmation({
  recommendedTrack,
  allTracks,
  onConfirm,
  onDecline
}: TrackConfirmationProps) {
  const [selectedTrack, setSelectedTrack] = useState<string>(recommendedTrack.key)
  const [showOtherTracks, setShowOtherTracks] = useState(false)

  const trackInfo = TRACK_INFO[recommendedTrack.key] || {
    icon: '🎯',
    color: 'from-gray-500 to-gray-700',
    description: recommendedTrack.description
  }

  const handleConfirm = () => {
    onConfirm(selectedTrack)
  }

  const handleDecline = () => {
    setShowOtherTracks(true)
  }

  const handleSelectOtherTrack = (trackKey: string) => {
    setSelectedTrack(trackKey)
  }

  if (showOtherTracks) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gradient-to-br from-och-midnight via-och-space to-och-crimson">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl w-full"
        >
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">
              Choose Your Track
            </h2>
            <p className="text-gray-300 text-center mb-8">
              Select the cybersecurity track you'd like to pursue
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {allTracks.map((track) => {
                const info = TRACK_INFO[track.key] || {
                  icon: '🎯',
                  color: 'from-gray-500 to-gray-700',
                  description: track.description
                }
                const isSelected = selectedTrack === track.key
                const isRecommended = track.key === recommendedTrack.key

                return (
                  <motion.button
                    key={track.key}
                    onClick={() => handleSelectOtherTrack(track.key)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-och-orange bg-och-orange/20'
                        : 'border-white/20 bg-white/5 hover:border-white/40'
                    }`}
                  >
                    <div className="text-4xl mb-3">{info.icon}</div>
                    <h3 className="text-xl font-bold text-white mb-2">{track.name}</h3>
                    <p className="text-sm text-gray-300 mb-3">{info.description}</p>
                    {isRecommended && (
                      <span className="text-xs bg-och-orange/30 text-och-orange px-2 py-1 rounded font-semibold">
                        Recommended for You
                      </span>
                    )}
                    {isSelected && (
                      <div className="mt-3 flex items-center justify-center text-och-orange">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    )}
                  </motion.button>
                )
              })}
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setShowOtherTracks(false)}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={!selectedTrack}
                className="px-8 py-3 bg-gradient-to-r from-och-orange to-och-crimson hover:from-och-orange/80 hover:to-och-crimson/80 text-white rounded-lg font-bold transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Confirm Selection
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gradient-to-br from-och-midnight via-och-space to-och-crimson">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl w-full"
      >
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-white/20">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="text-6xl mb-4"
            >
              {trackInfo.icon}
            </motion.div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Track Recommendation
            </h1>
            <p className="text-xl text-gray-300">
              Based on your profiling assessment, we recommend:
            </p>
          </div>

          {/* Recommended Track Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`bg-gradient-to-r ${trackInfo.color} rounded-xl p-8 mb-8 border-2 border-white/30 shadow-xl`}
          >
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white mb-3">
                {recommendedTrack.name} Track
              </h2>
              <p className="text-white/90 text-lg mb-6">
                {trackInfo.description}
              </p>
              <div className="inline-block bg-white/20 px-6 py-3 rounded-full border-2 border-white/30">
                <span className="text-white font-bold text-lg">
                  🎯 Best Match for Your Profile
                </span>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              onClick={handleConfirm}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex-1 sm:flex-none px-8 py-4 bg-gradient-to-r from-och-orange to-och-crimson hover:from-och-orange/80 hover:to-och-crimson/80 text-white rounded-lg font-bold text-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-6 h-6" />
              Confirm & Proceed
            </motion.button>

            <motion.button
              onClick={handleDecline}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="flex-1 sm:flex-none px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-lg font-bold text-lg transition-all border-2 border-white/20 flex items-center justify-center gap-2"
            >
              <XCircle className="w-6 h-6" />
              Choose Different Track
            </motion.button>
          </div>

          {/* Info Text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center text-gray-400 text-sm mt-6"
          >
            Based on your profiling assessment, this track aligns best with your skills and interests.<br />
            You can change your track later in settings if needed.
          </motion.p>
        </div>
      </motion.div>
    </div>
  )
}
