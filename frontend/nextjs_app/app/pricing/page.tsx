'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Shield, 
  CheckCircle, 
  ArrowRight, 
  Zap,
  Star,
  Crown
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

export default function PricingPage() {
  const router = useRouter()

  const handleStartTrial = () => {
    router.push('/signup/student')
  }

  const pricingPlans = [
    {
      duration: '1 Month',
      total: 'KSh 980',
      monthly: 'KSh 980',
      discount: 'Base',
      savings: null,
      popular: false
    },
    {
      duration: '3 Months',
      total: 'KSh 2,660',
      monthly: '~KSh 887',
      discount: 'Small discount',
      savings: 'KSh 280',
      popular: false
    },
    {
      duration: '6 Months',
      total: 'KSh 5,040',
      monthly: 'KSh 840',
      discount: 'Medium discount',
      savings: 'KSh 840',
      popular: false
    },
    {
      duration: '9 Months',
      total: 'KSh 7,280',
      monthly: '~KSh 809',
      discount: 'Larger discount',
      savings: 'KSh 1,540',
      popular: false
    },
    {
      duration: '12 Months',
      total: 'KSh 9,520',
      monthly: '~KSh 793',
      discount: 'Annual plan, renewable',
      savings: 'KSh 2,240',
      popular: true
    }
  ]

  const features = [
    'Community forums and events',
    'Student Mentorship Program (SMP)',
    'Progress tracking and certificates',
    'Priority support',
    'Full platform access',
    'Learning resources and materials',
    'Progress analytics and insights'
  ]

  const faqs = [
    {
      question: 'How does the 14-day free trial work?',
      answer: 'The free trial gives you full access to all OCH features for 14 days. No credit card required to start. After the trial, choose a subscription plan to continue your journey.'
    },
    {
      question: 'Can I upgrade or downgrade my plan?',
      answer: 'Yes, you can upgrade at any time. When upgrading, you\'ll be charged the prorated difference. Downgrades take effect at the end of your current billing period.'
    },
    {
      question: 'What happens if I cancel my subscription?',
      answer: 'You\'ll continue to have access until the end of your paid period. After that, you\'ll need an active subscription to continue using the platform.'
    },
    {
      question: 'Are there student discounts?',
      answer: 'Our pricing is already optimized for students. The annual plan offers the best value at just KSh 793/month, saving you 19% compared to monthly billing.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept major credit cards, debit cards, and mobile money (M-Pesa, Airtel Money) for Kenyan students. All transactions are secure and encrypted.'
    }
  ]

  return (
    <div className="min-h-screen bg-och-midnight text-white">
      <NavigationHeader currentPath="/pricing" />
      
      <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Start Your Journey Today</h1>
            <p className="text-xl text-och-steel mb-6">
              Start with a <span className="text-och-mint font-bold">14-day free trial</span>, continue from just <span className="text-och-mint font-bold">KSh 793/month</span>
            </p>
            <p className="text-och-steel max-w-3xl mx-auto">
              All subscriptions include full access to Community, SMP, and Certificates. 
              Choose the plan that works best for your journey.
            </p>
          </div>

          {/* Pricing Table */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-16">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`bg-och-midnight border-2 rounded-2xl p-6 ${
                  plan.popular 
                    ? 'border-och-mint/50 shadow-lg shadow-och-mint/10 relative' 
                    : 'border-och-steel/20'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-och-mint text-och-midnight px-4 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
                      <Crown className="h-3 w-3" />
                      <span>Best Value</span>
                    </span>
                  </div>
                )}
                <div className="text-center mb-6">
                  <div className="text-sm text-och-steel mb-2">{plan.duration}</div>
                  <div className="text-3xl font-bold text-white mb-1">{plan.total}</div>
                  <div className="text-sm text-och-mint mb-2">{plan.monthly}/month</div>
                  {plan.savings && (
                    <div className="text-xs text-och-savanna-green">Save {plan.savings}</div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleStartTrial}
                  className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 ${
                    plan.popular
                      ? 'bg-och-mint hover:bg-och-mint/90 text-och-midnight'
                      : 'bg-och-defender hover:bg-och-defender/90 text-white'
                  }`}
                >
                  {plan.popular ? 'Start Annual Plan' : 'Select Plan'}
                </button>
              </div>
            ))}
          </div>

          {/* Features */}
          <div className="bg-och-midnight border border-och-steel/20 rounded-2xl p-8 mb-16">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">What's Included in Every Plan</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-och-savanna-green flex-shrink-0" />
                  <span className="text-och-steel">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div key={idx} className="bg-och-midnight border border-och-steel/20 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-2">{faq.question}</h3>
                  <p className="text-och-steel">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-r from-och-defender/20 via-och-night-sky/30 to-och-defender/20 border border-och-defender/40 rounded-2xl p-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Transform Your Cyber Journey?</h2>
            <p className="text-xl text-och-steel mb-8 max-w-2xl mx-auto">
              Start your 14-day free trial today. No credit card required.
            </p>
            <button
              type="button"
              onClick={handleStartTrial}
              className="px-8 py-4 bg-och-mint hover:bg-och-mint/90 text-och-midnight rounded-xl font-bold text-lg transition-all duration-200 flex items-center space-x-2 mx-auto"
            >
              <Zap className="h-5 w-5" />
              <span>Start Free Trial</span>
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

