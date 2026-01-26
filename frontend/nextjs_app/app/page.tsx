'use client'

import { memo, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Shield, 
  ArrowRight,
  Users,
  Target,
  Zap,
  BookOpen,
  Trophy,
  TrendingUp,
  CheckCircle,
  GraduationCap,
  MessageSquare,
  BarChart3
} from 'lucide-react'

// Memoize NavigationHeader to prevent unnecessary re-renders
const NavigationHeader = memo(function NavigationHeader({ currentPath }: { currentPath: string }) {
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
})

NavigationHeader.displayName = 'NavigationHeader'

// Memoized Persona Card
const PersonaCard = memo(function PersonaCard({ persona }: { persona: any }) {
  const Icon = persona.icon
  return (
    <div className={`bg-och-midnight border-2 ${persona.borderColor} rounded-2xl p-6 hover:border-opacity-60 transition-all duration-200 hover:shadow-lg`}>
      <div className={`${persona.bgColor} ${persona.color} w-16 h-16 rounded-xl flex items-center justify-center mb-4`}>
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{persona.title}</h3>
      <p className="text-och-steel">{persona.description}</p>
    </div>
  )
})

PersonaCard.displayName = 'PersonaCard'

// Memoized Feature Card
const FeatureCard = memo(function FeatureCard({ feature }: { feature: any }) {
  const Icon = feature.icon
  return (
    <div className="bg-och-midnight border border-och-steel/20 rounded-xl p-6 hover:border-och-mint/30 transition-all duration-200">
      <div className="bg-och-mint/10 text-och-mint w-12 h-12 rounded-lg flex items-center justify-center mb-4">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
      <p className="text-och-steel">{feature.description}</p>
    </div>
  )
})

FeatureCard.displayName = 'FeatureCard'

// Memoized Footer
const Footer = memo(function Footer({ onStartTrial }: { onStartTrial: () => void }) {
  return (
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
              <button type="button" onClick={onStartTrial} className="block text-left text-och-steel hover:text-och-mint transition-colors">
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
  )
})

Footer.displayName = 'Footer'

export default function HomePage() {
  const router = useRouter()

  // Memoize handler to prevent re-creation
  const handleStartTrial = useMemo(() => {
    return () => {
      router.push('/signup/student')
    }
  }, [router])

  // Memoize static data arrays
  const personas = useMemo(() => [
    {
      icon: GraduationCap,
      title: 'Student',
      description: 'Begin your cybersecurity journey with personalized learning paths, mentorship, and hands-on practice.',
      color: 'text-och-defender',
      bgColor: 'bg-och-defender/10',
      borderColor: 'border-och-defender/30'
    },
    {
      icon: Users,
      title: 'Mentor',
      description: 'Guide the next generation of cyber professionals with powerful mentoring tools and insights.',
      color: 'text-och-gold',
      bgColor: 'bg-och-gold/10',
      borderColor: 'border-och-gold/30'
    },
    {
      icon: Target,
      title: 'Program Director',
      description: 'Oversee program strategy, manage cohorts, and drive outcomes with comprehensive analytics.',
      color: 'text-och-mint',
      bgColor: 'bg-och-mint/10',
      borderColor: 'border-och-mint/30'
    },
    {
      icon: BarChart3,
      title: 'Analyst',
      description: 'Analyze data, generate insights, and create comprehensive reports for strategic decisions.',
      color: 'text-och-orange',
      bgColor: 'bg-och-orange/10',
      borderColor: 'border-och-orange/30'
    }
  ], [])

  const features = useMemo(() => [
    {
      icon: Zap,
      title: 'Role-Based Dashboards',
      description: 'Personalized interfaces tailored to your specific role and needs'
    },
    {
      icon: TrendingUp,
      title: 'Advanced Analytics',
      description: 'Real-time insights and comprehensive reporting tools'
    },
    {
      icon: Shield,
      title: 'Secure Authentication',
      description: 'Enterprise-grade security with persona-based access control'
    },
    {
      icon: MessageSquare,
      title: 'Mentorship Network',
      description: 'Connect with mentors and mentees in a supportive community'
    },
    {
      icon: BookOpen,
      title: 'Learning Resources',
      description: 'Access curated courses, materials, and educational content'
    },
    {
      icon: Trophy,
      title: 'Progress Tracking',
      description: 'Monitor your growth with detailed progress metrics and achievements'
    }
  ], [])

  return (
    <div className="min-h-screen bg-och-midnight text-white">
      <NavigationHeader currentPath="/" />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-white leading-tight">
              Empower Your Journey with
              <span className="text-och-mint block">OCH Platform</span>
            </h1>
            <p className="text-xl md:text-2xl text-och-steel mb-8 max-w-3xl mx-auto leading-relaxed">
              Connect, learn, and grow through personalized mentorship and role-based experiences. 
              Africa's premier cyber talent platform for university students.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                type="button"
                onClick={handleStartTrial}
                className="px-8 py-4 bg-och-mint hover:bg-och-mint/90 text-och-midnight rounded-xl font-bold text-lg transition-all duration-200 flex items-center space-x-2 shadow-lg shadow-och-mint/20"
              >
                <Zap className="h-5 w-5" />
                <span>Start Free Trial</span>
                <ArrowRight className="h-5 w-5" />
              </button>
              <Link
                href="/about"
                className="px-8 py-4 border-2 border-och-mint text-och-mint hover:bg-och-mint/10 rounded-xl font-bold text-lg transition-all duration-200"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Personas Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-och-midnight/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">Choose Your Persona</h2>
            <p className="text-xl text-och-steel max-w-2xl mx-auto">
              Tailored experiences for every role in the cybersecurity ecosystem
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {personas.map((persona, idx) => (
              <PersonaCard key={idx} persona={persona} />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">Platform Features</h2>
            <p className="text-xl text-och-steel max-w-2xl mx-auto">
              Everything you need to succeed in your cybersecurity journey
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <FeatureCard key={idx} feature={feature} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-och-defender/20 via-och-night-sky/30 to-och-defender/20 border border-och-defender/40 rounded-2xl p-12 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Ready to Transform Your Cyber Journey?</h2>
            <p className="text-xl text-och-steel mb-8 max-w-2xl mx-auto">
              Start your 14-day free trial today. No credit card required. 
              Join Africa's premier cybersecurity talent development platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                type="button"
                onClick={handleStartTrial}
                className="px-8 py-4 bg-och-mint hover:bg-och-mint/90 text-och-midnight rounded-xl font-bold text-lg transition-all duration-200 flex items-center space-x-2 shadow-lg shadow-och-mint/20"
              >
                <Zap className="h-5 w-5" />
                <span>Start Free Trial</span>
                <ArrowRight className="h-5 w-5" />
              </button>
              <Link
                href="/pricing"
                className="px-8 py-4 border-2 border-och-mint text-och-mint hover:bg-och-mint/10 rounded-xl font-bold text-lg transition-all duration-200"
              >
                View Pricing
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-och-steel">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-och-savanna-green" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-och-savanna-green" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-och-savanna-green" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer onStartTrial={handleStartTrial} />
    </div>
  )
}
