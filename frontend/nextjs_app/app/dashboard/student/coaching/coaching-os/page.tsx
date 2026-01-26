/**
 * Student Coaching OS Dashboard
 * Main hub for student cybersecurity training and resources
 */
'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  BookOpen,
  Target,
  Users,
  Award,
  ChevronRight,
  Shield,
  Code,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';

export default function StudentCoachingOSPage() {
  const modules = [
    {
      title: 'Recipe Library',
      description: 'Interactive cybersecurity hands-on labs and step-by-step guides',
      icon: BookOpen,
      href: '/dashboard/student/coaching/recipes',
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'from-emerald-500/10 to-teal-600/10'
    },
    {
      title: 'Missions',
      description: 'Structured cybersecurity challenges and real-world scenarios',
      icon: Target,
      href: '/dashboard/student/missions',
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'from-blue-500/10 to-indigo-600/10'
    },
    {
      title: 'Curriculum',
      description: 'Comprehensive learning paths and skill development tracks',
      icon: Shield,
      href: '/dashboard/student/curriculum',
      color: 'from-purple-500 to-pink-600',
      bgColor: 'from-purple-500/10 to-pink-600/10'
    },
    {
      title: 'Coaching Sessions',
      description: '1-on-1 mentoring and personalized guidance',
      icon: Users,
      href: '/dashboard/student/coaching',
      color: 'from-orange-500 to-red-600',
      bgColor: 'from-orange-500/10 to-red-600/10'
    }
  ];

  const stats = [
    { label: 'Recipes Completed', value: '12', icon: Award },
    { label: 'Skills Mastered', value: '8', icon: Code },
    { label: 'Missions Solved', value: '15', icon: Target },
    { label: 'Progress Score', value: '87%', icon: TrendingUp }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/30 to-slate-950">
      {/* HEADER */}
      <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-indigo-900/50">
        <div className="container mx-auto px-6 py-8 max-w-6xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-indigo-400 via-white to-purple-400 bg-clip-text text-transparent">
                Coaching OS
              </h1>
              <p className="text-xl text-slate-300 mt-2">
                Your Cybersecurity Training Hub
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="container mx-auto px-6 py-12 max-w-6xl">

        {/* WELCOME SECTION */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">Welcome to Your Training Dashboard</h2>
          <p className="text-slate-400 text-lg max-w-2xl">
            Access interactive cybersecurity labs, complete missions, follow structured curricula,
            and get personalized coaching to advance your cybersecurity career.
          </p>
        </div>

        {/* MAIN FEATURED SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* LEFT: Recipe Library Feature Card */}
          <div className="lg:col-span-2">
            <Card className="group relative overflow-hidden bg-gradient-to-br from-emerald-500/10 to-teal-600/10 border-slate-700/50 hover:border-emerald-500/50 transition-all duration-300 h-full">
              <div className="pb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-white" />
                  </div>
                  <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="text-3xl text-white mb-2">Interactive Recipe Library</h3>
                <p className="text-slate-400 text-lg">
                  Master cybersecurity skills with hands-on labs, step-by-step guides, and practical exercises.
                  Access 60+ recipes across all difficulty levels and specializations.
                </p>
              </div>
              <div className="pt-0">
                <div className="flex gap-3">
                  <Link href="/dashboard/student/coaching/recipes" className="flex-1">
                    <Button
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 transition-all text-lg py-3"
                    >
                      <BookOpen className="w-5 h-5 mr-2" />
                      Explore Recipes
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>

          {/* RIGHT: Quick Recipe Access */}
          <div className="lg:col-span-1">
            <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 border-slate-700/50 h-full">
              <div className="pb-4">
                <h4 className="text-xl text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-400" />
                  Quick Access
                </h4>
                <p className="text-slate-400">
                  Jump into hands-on learning
                </p>
              </div>
              <div className="space-y-4">
                <Link href="/dashboard/student/coaching/recipes">
                  <Button
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 transition-all"
                    size="lg"
                  >
                    <BookOpen className="w-5 h-5 mr-2" />
                    Recipe Engine
                  </Button>
                </Link>

                <div className="text-center py-4">
                  <p className="text-sm text-slate-500 mb-2">Popular Categories</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-slate-800/50 text-slate-300 text-xs rounded-full">Defender</span>
                    <span className="px-3 py-1 bg-slate-800/50 text-slate-300 text-xs rounded-full">Offensive</span>
                    <span className="px-3 py-1 bg-slate-800/50 text-slate-300 text-xs rounded-full">GRC</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, index) => (
            <Card key={index} className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 border-slate-700/50">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-sm text-slate-400">{stat.label}</p>
                  </div>
                  <stat.icon className="w-8 h-8 text-indigo-400" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* OTHER MODULES GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {modules.slice(1).map((module, index) => (
            <Card key={index} className={`group relative overflow-hidden bg-gradient-to-br ${module.bgColor} border-slate-700/50 hover:border-slate-600/70 transition-all duration-300`}>
              <div className="pb-4">
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 bg-gradient-to-r ${module.color} rounded-xl flex items-center justify-center mb-4`}>
                    <module.icon className="w-6 h-6 text-white" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
                <h4 className="text-xl text-white">{module.title}</h4>
                <p className="text-slate-400">
                  {module.description}
                </p>
              </div>
              <div>
                <Link href={module.href}>
                  <Button
                    className={`w-full bg-gradient-to-r ${module.color} hover:opacity-90 transition-opacity`}
                  >
                    Access {module.title}
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>

        {/* QUICK ACTIONS */}
        <div className="mt-12">
          <h3 className="text-xl font-bold text-white mb-6">Additional Resources</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-slate-900/50 border-slate-700/50 hover:bg-slate-800/50 transition-colors">
              <div className="p-6">
                <Target className="w-8 h-8 text-blue-400 mb-4" />
                <h4 className="text-lg font-semibold text-white mb-2">Mission Challenges</h4>
                <p className="text-slate-400 text-sm mb-4">
                  Tackle real-world cybersecurity scenarios and challenges
                </p>
                <Link href="/dashboard/student/missions">
                  <Button variant="outline" size="sm" className="w-full">
                    Start Missions
                  </Button>
                </Link>
              </div>
            </Card>

            <Card className="bg-slate-900/50 border-slate-700/50 hover:bg-slate-800/50 transition-colors">
              <div className="p-6">
                <Shield className="w-8 h-8 text-purple-400 mb-4" />
                <h4 className="text-lg font-semibold text-white mb-2">Learning Paths</h4>
                <p className="text-slate-400 text-sm mb-4">
                  Follow structured curricula for comprehensive skill development
                </p>
                <Link href="/dashboard/student/curriculum">
                  <Button variant="outline" size="sm" className="w-full">
                    View Curriculum
                  </Button>
                </Link>
              </div>
            </Card>

            <Card className="bg-slate-900/50 border-slate-700/50 hover:bg-slate-800/50 transition-colors">
              <div className="p-6">
                <Users className="w-8 h-8 text-orange-400 mb-4" />
                <h4 className="text-lg font-semibold text-white mb-2">Mentor Sessions</h4>
                <p className="text-slate-400 text-sm mb-4">
                  Get personalized guidance from expert cybersecurity mentors
                </p>
                <Link href="/dashboard/student/coaching">
                  <Button variant="outline" size="sm" className="w-full">
                    Book Session
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
