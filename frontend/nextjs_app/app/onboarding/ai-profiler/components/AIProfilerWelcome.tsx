'use client'

import { motion } from 'framer-motion'

interface AIProfilerWelcomeProps {
  onStart: () => void
}

export default function AIProfilerWelcome({ onStart }: AIProfilerWelcomeProps) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-4xl mx-auto text-center"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <div className="text-6xl mb-4">🎯</div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            AI Career Profiler
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Discover your perfect OCH track with our intelligent assessment
          </p>
        </motion.div>

        {/* OCH Tracks Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-white mb-6">OCH Career Tracks</h2>
          <p className="text-gray-300 mb-6 text-center">
            You'll be matched to one of these specialized cybersecurity tracks based on your assessment
          </p>
          <div className="grid md:grid-cols-5 gap-4">
            {[
              { 
                key: 'defender', 
                name: 'Defender', 
                icon: '🛡️', 
                desc: 'Protect systems and networks from cyber threats',
                color: 'defender-blue'
              },
              { 
                key: 'offensive', 
                name: 'Offensive', 
                icon: '⚔️', 
                desc: 'Ethical hacking and penetration testing',
                color: 'crimson'
              },
              { 
                key: 'innovation', 
                name: 'Innovation', 
                icon: '🔬', 
                desc: 'Develop cutting-edge security technologies',
                color: 'mint'
              },
              { 
                key: 'leadership', 
                name: 'Leadership', 
                icon: '👑', 
                desc: 'Lead security teams and strategy',
                color: 'sahara-gold'
              },
              { 
                key: 'grc', 
                name: 'GRC', 
                icon: '📋', 
                desc: 'Governance, Risk & Compliance',
                color: 'steel'
              }
            ].map((track, index) => (
              <motion.div
                key={track.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-5 hover:bg-white/20 transition-all border border-white/10 hover:border-white/30 hover:shadow-lg"
              >
                <div className="text-3xl mb-3 text-center">{track.icon}</div>
                <div className="text-white font-bold text-base mb-2 text-center">{track.name}</div>
                <div className="text-gray-400 text-xs text-center leading-relaxed">{track.desc}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-white mb-6">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div className="bg-white/5 rounded-lg p-6">
              <div className="text-3xl mb-3">🧠</div>
              <h3 className="text-white font-semibold mb-2">Smart Assessment</h3>
              <p className="text-gray-300 text-sm">
                Answer scenario-based questions that reveal your natural tendencies and preferences.
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-6">
              <div className="text-3xl mb-3">⚖️</div>
              <h3 className="text-white font-semibold mb-2">Weighted Analysis</h3>
              <p className="text-gray-300 text-sm">
                Our AI evaluates your technical aptitude, problem-solving style, and work preferences.
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-6">
              <div className="text-3xl mb-3">🎯</div>
              <h3 className="text-white font-semibold mb-2">Perfect Match</h3>
              <p className="text-gray-300 text-sm">
                Get matched with the OCH track that maximizes your potential and career growth.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Start Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 1.0 }}
        >
          <button
            onClick={onStart}
            className="bg-gradient-to-r from-och-orange to-och-crimson hover:from-och-orange/80 hover:to-och-crimson/80 text-white text-xl font-bold px-12 py-4 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            Start AI Assessment
          </button>
          <p className="text-gray-400 text-sm mt-4">
            Takes about 10-15 minutes • No wrong answers
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}

































