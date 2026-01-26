'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Shield, 
  Target, 
  Eye, 
  Users, 
  GraduationCap, 
  Trophy, 
  ArrowRight,
  MapPin,
  CheckCircle,
  Heart,
  Lightbulb,
  TrendingUp
} from 'lucide-react'

function NavigationHeader({ currentPath }: { currentPath: string }) {
  const router = useRouter()
  const handleStartTrial = () => router.push('/signup/student')
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-och-midnight/95 backdrop-blur-md border-b border-och-steel/20">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-och-mint" />
            <span className="text-xl font-bold text-och-mint">OCH Platform</span>
          </Link>
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className={`${currentPath === '/' ? 'text-och-mint' : 'text-och-steel'} hover:text-och-mint transition-colors`}>Home</Link>
            <Link href="/pricing" className={`${currentPath === '/pricing' ? 'text-och-mint' : 'text-och-steel'} hover:text-och-mint transition-colors`}>Pricing</Link>
            <Link href="/about" className={`${currentPath === '/about' ? 'text-och-mint' : 'text-och-steel'} hover:text-och-mint transition-colors`}>About</Link>
          </div>
          <div className="flex items-center space-x-4">
            <button type="button" onClick={handleStartTrial} className="px-4 py-2 bg-och-defender hover:bg-och-defender/90 text-white rounded-lg font-semibold transition-all duration-200">Get Started</button>
            <Link href="/login/student" className="px-4 py-2 border border-och-mint text-och-mint hover:bg-och-mint/10 rounded-lg font-semibold transition-all duration-200">Sign In</Link>
          </div>
        </div>
      </nav>
    </header>
  )
}

export default function AboutPage() {
  const router = useRouter()

  const handleStartTrial = () => {
    router.push('/signup/student')
  }

  const transformationPhases = [
    { phase: 0, name: 'Entry', goal: 'Awareness & Belonging', circle: 'Community Circle' },
    { phase: 1, name: 'Foundation', goal: 'Learning & Alignment', circle: 'Masterclass Circle' },
    { phase: 2, name: 'Discovery', goal: 'Skills & Confidence', circle: 'Specialist Circle' },
    { phase: 3, name: 'Competence', goal: 'Deep Practice', circle: 'Mastery Circle' },
    { phase: 4, name: 'Contribution', goal: 'Leadership & Influence', circle: 'Mastermind Circle' },
    { phase: 5, name: 'Creation', goal: 'Vision & Legacy', circle: 'Mastermind Circle' }
  ]

  return (
    <div className="min-h-screen bg-och-midnight text-white">
      <NavigationHeader currentPath="/about" />
      
      <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">About OCH Platform</h1>
            <p className="text-xl text-och-steel max-w-3xl mx-auto">
              Africa's premier cyber talent platform for university students. Transforming students into cyber leaders 
              through personalized mentorship and role-based experiences.
            </p>
          </div>

          {/* Mission */}
          <div className="bg-och-midnight border border-och-steel/20 rounded-2xl p-8 md:p-12 mb-12">
            <div className="flex items-center space-x-4 mb-6">
              <Target className="h-10 w-10 text-och-defender" />
              <h2 className="text-3xl font-bold text-white">Our Mission</h2>
            </div>
            <p className="text-lg text-och-steel leading-relaxed">
              To profile, develop, and track university students' cybersecurity skills and leadership growth across Africa. 
              We believe every student has the potential to become a cyber leader, and we provide the structured path, 
              community, and opportunities to make that transformation possible.
            </p>
          </div>

          {/* Vision */}
          <div className="bg-och-midnight border border-och-steel/20 rounded-2xl p-8 md:p-12 mb-12">
            <div className="flex items-center space-x-4 mb-6">
              <Eye className="h-10 w-10 text-och-mint" />
              <h2 className="text-3xl font-bold text-white">Our Vision</h2>
            </div>
            <p className="text-lg text-och-steel leading-relaxed mb-6">
              To become Africa's leading platform for cybersecurity talent development, creating a pipeline of skilled 
              professionals who drive innovation, protect critical infrastructure, and lead the continent's digital transformation.
            </p>
            <p className="text-lg text-och-steel leading-relaxed">
              We envision a future where African universities produce world-class cybersecurity professionals who are 
              not only technically skilled but also understand the unique challenges and opportunities in the African context.
            </p>
          </div>

          {/* OCH Philosophy */}
          <div className="bg-gradient-to-r from-och-defender/20 via-och-night-sky/30 to-och-defender/20 border border-och-defender/40 rounded-2xl p-8 md:p-12 mb-12">
            <div className="flex items-center space-x-4 mb-6">
              <Heart className="h-10 w-10 text-och-defender" />
              <h2 className="text-3xl font-bold text-white">The OCH Philosophy</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-och-savanna-green flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-white mb-2">Progressive Transformation</h3>
                  <p className="text-och-steel">
                    Learning is a journey, not a destination. Our 6-phase transformation model ensures students progress 
                    at their own pace while maintaining clear milestones and goals.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-och-savanna-green flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-white mb-2">Community-First Approach</h3>
                  <p className="text-och-steel">
                    Cybersecurity is a team sport. We build strong communities where students learn from each other, 
                    mentor peers, and grow together.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-och-savanna-green flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-white mb-2">Practical Excellence</h3>
                  <p className="text-och-steel">
                    Theory without practice is incomplete. Every concept is reinforced through hands-on labs, real-world 
                    challenges, and practical competitions.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-och-savanna-green flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-white mb-2">Leadership Development</h3>
                  <p className="text-och-steel">
                    We don't just create technicians; we develop leaders who can guide teams, make strategic decisions, 
                    and drive innovation in cybersecurity.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Transformation Journey Explanation */}
          <div className="bg-och-midnight border border-och-steel/20 rounded-2xl p-8 md:p-12 mb-12">
            <div className="flex items-center space-x-4 mb-6">
              <TrendingUp className="h-10 w-10 text-och-gold" />
              <h2 className="text-3xl font-bold text-white">The Transformation Journey</h2>
            </div>
            <p className="text-lg text-och-steel leading-relaxed mb-8">
              Every student's journey begins at Phase 0 (Entry) and progresses through six distinct phases, each designed 
              to build specific competencies and prepare for the next level. Each phase is tied to an OCH Circle, which 
              provides the activities, resources, and community needed for growth.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {transformationPhases.map((phase) => (
                <div key={phase.phase} className="bg-och-midnight/50 border border-och-steel/20 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-och-mint font-bold">Phase {phase.phase}</span>
                  </div>
                  <h3 className="font-semibold text-white mb-1">{phase.name}</h3>
                  <p className="text-xs text-och-steel mb-2">{phase.circle}</p>
                  <p className="text-sm text-och-mint">{phase.goal}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Nairobi Pilot Focus */}
          <div className="bg-och-midnight border border-och-steel/20 rounded-2xl p-8 md:p-12 mb-12">
            <div className="flex items-center space-x-4 mb-6">
              <MapPin className="h-10 w-10 text-och-orange" />
              <h2 className="text-3xl font-bold text-white">Nairobi Pilot - Our Starting Point</h2>
            </div>
            <p className="text-lg text-och-steel leading-relaxed mb-6">
              We chose Nairobi as our Phase 1 launch location because of its vibrant tech ecosystem, strong university 
              partnerships, and commitment to cybersecurity education. Our pilot focuses on:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-white mb-3 flex items-center space-x-2">
                  <GraduationCap className="h-5 w-5 text-och-defender" />
                  <span>University Partnerships</span>
                </h3>
                <p className="text-och-steel">
                  Working closely with leading universities in Nairobi including University of Nairobi, JKUAT, Strathmore, 
                  and Kenyatta University to integrate OCH into their cybersecurity programs.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-3 flex items-center space-x-2">
                  <Users className="h-5 w-5 text-och-mint" />
                  <span>Community Building</span>
                </h3>
                <p className="text-och-steel">
                  Establishing a strong Nairobi cybersecurity community where students can connect, learn, and grow together 
                  through events, competitions, and collaborative projects.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-3 flex items-center space-x-2">
                  <Trophy className="h-5 w-5 text-och-gold" />
                  <span>Competition Excellence</span>
                </h3>
                <p className="text-och-steel">
                  Hosting regular competitions that challenge students, build skills, and create pathways to industry 
                  recognition and career opportunities.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-3 flex items-center space-x-2">
                  <Lightbulb className="h-5 w-5 text-och-orange" />
                  <span>Innovation Hub</span>
                </h3>
                <p className="text-och-steel">
                  Creating an environment where innovative cybersecurity solutions are developed, tested, and launched, 
                  contributing to Africa's digital security landscape.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-r from-och-defender/20 via-och-night-sky/30 to-och-defender/20 border border-och-defender/40 rounded-2xl p-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Join the Transformation</h2>
            <p className="text-xl text-och-steel mb-8 max-w-2xl mx-auto">
              Be part of Africa's cybersecurity transformation. Start your journey today.
            </p>
            <button
              type="button"
              onClick={handleStartTrial}
              className="px-8 py-4 bg-och-mint hover:bg-och-mint/90 text-och-midnight rounded-xl font-bold text-lg transition-all duration-200 flex items-center space-x-2 mx-auto"
            >
              <span>Start Your 14-Day Free Trial</span>
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-och-steel/20 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Shield className="h-6 w-6 text-och-mint" />
                <span className="text-lg font-bold text-och-mint">OCH Platform</span>
              </div>
              <p className="text-och-steel">
                Empowering growth through mentorship and cybersecurity education across Africa.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Quick Links</h4>
              <div className="space-y-2">
                <Link href="/" className="block text-och-steel hover:text-och-mint transition-colors">Home</Link>
                <Link href="/pricing" className="block text-och-steel hover:text-och-mint transition-colors">Pricing</Link>
                <Link href="/about" className="block text-och-steel hover:text-och-mint transition-colors">About</Link>
                <Link href="/login/student" className="block text-och-steel hover:text-och-mint transition-colors">Sign In</Link>
              </div>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Get Started</h4>
              <div className="space-y-2">
                <Link href="/signup/student" className="block text-och-steel hover:text-och-mint transition-colors">Sign Up</Link>
                <Link href="/login/student" className="block text-och-steel hover:text-och-mint transition-colors">Login</Link>
                <button type="button" onClick={handleStartTrial} className="block text-left text-och-steel hover:text-och-mint transition-colors">
                  Start Free Trial
                </button>
              </div>
            </div>
          </div>
          <div className="border-t border-och-steel/20 pt-8 text-center text-och-steel">
            <p>&copy; 2024 OCH Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

