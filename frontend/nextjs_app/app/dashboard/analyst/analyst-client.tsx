'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'

export default function AnalystClient() {
  const [isLoading] = useState(false)

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-och-mint">Analyst Dashboard</h1>
        <p className="text-och-steel">TalentScope insights and analytics</p>
      </div>

      {/* Core Readiness Metrics */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-white">Core Readiness Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <p className="text-och-steel text-sm mb-1">Core Readiness Score</p>
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-och-steel/20 rounded w-24 mb-2"></div>
                <div className="h-2 bg-och-steel/20 rounded"></div>
              </div>
            ) : (
              <>
                <p className="text-3xl font-bold text-white">--/100</p>
                <ProgressBar value={0} variant="mint" className="mt-2" />
              </>
            )}
          </Card>
          <Card>
            <p className="text-och-steel text-sm mb-1">Estimated Readiness Window</p>
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-och-steel/20 rounded w-32 mb-2"></div>
                <div className="h-6 bg-och-steel/20 rounded w-20"></div>
              </div>
            ) : (
              <>
                <p className="text-3xl font-bold text-white">--</p>
                <Badge variant="steel" className="mt-2">No data</Badge>
              </>
            )}
          </Card>
          <Card>
            <p className="text-och-steel text-sm mb-1">Learning Velocity</p>
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-och-steel/20 rounded w-24 mb-2"></div>
                <div className="h-4 bg-och-steel/20 rounded w-32"></div>
              </div>
            ) : (
              <>
                <p className="text-3xl font-bold text-white">--</p>
                <p className="text-xs text-och-steel mt-1">points/month</p>
              </>
            )}
          </Card>
        </div>
        <Card>
          <h3 className="text-xl font-bold mb-4 text-white">Readiness Trend</h3>
          {isLoading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="animate-pulse text-och-steel">Loading chart...</div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center">
              <p className="text-och-steel">No readiness trend data available</p>
            </div>
          )}
        </Card>
      </div>

      {/* Skill and Behavior Analysis */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-white">Skill and Behavior Analysis</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <h3 className="text-xl font-bold mb-4 text-white">Skill Heatmap</h3>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-och-steel/20 rounded mb-2"></div>
                    <div className="h-2 bg-och-steel/20 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-och-steel">No skill heatmap data available</p>
              </div>
            )}
          </Card>

          <Card>
            <h3 className="text-xl font-bold mb-4 text-white">Behavior & Study Patterns</h3>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="animate-pulse p-3 bg-och-midnight/50 rounded-lg">
                    <div className="h-4 bg-och-steel/20 rounded mb-2"></div>
                    <div className="h-3 bg-och-steel/20 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-och-steel">No behavior pattern data available</p>
              </div>
            )}
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-xl font-bold mb-4 text-white">Strengths</h3>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-och-steel/20 rounded mb-2"></div>
                    <div className="h-2 bg-och-steel/20 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-och-steel">No strengths data available</p>
              </div>
            )}
          </Card>

          <Card>
            <h3 className="text-xl font-bold mb-4 text-white">Weaknesses</h3>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-och-steel/20 rounded mb-2"></div>
                    <div className="h-2 bg-och-steel/20 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-och-steel">No weaknesses data available</p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Career and Pathway Insights */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-white">Career and Pathway Insights</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-xl font-bold mb-4 text-white">Career Pathway</h3>
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-4 bg-och-steel/20 rounded w-32 mb-4"></div>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-12 bg-och-steel/20 rounded"></div>
                  ))}
                </div>
                <div className="h-2 bg-och-steel/20 rounded"></div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-och-steel">No career pathway data available</p>
              </div>
            )}
          </Card>

          <Card>
            <h3 className="text-xl font-bold mb-4 text-white">Track-Specific Benchmarks</h3>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-och-steel/20 rounded mb-2"></div>
                    <div className="h-2 bg-och-steel/20 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-och-steel">No track benchmark data available</p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Advanced Reporting (Professional Tier) */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-white">Career Readiness Report</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <h3 className="text-xl font-bold mb-4 text-white">Job Fit Analysis</h3>
            {isLoading ? (
              <div className="space-y-4 animate-pulse">
                <div>
                  <div className="h-4 bg-och-steel/20 rounded w-32 mb-2"></div>
                  <div className="h-8 bg-och-steel/20 rounded w-24 mb-2"></div>
                  <div className="h-2 bg-och-steel/20 rounded"></div>
                </div>
                <div>
                  <div className="h-4 bg-och-steel/20 rounded w-40 mb-2"></div>
                  <div className="h-8 bg-och-steel/20 rounded w-32"></div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-och-steel mb-1">Job Fit Score</p>
                  <p className="text-3xl font-bold text-white">--/100</p>
                  <ProgressBar value={0} variant="mint" className="mt-2" />
                </div>
                <div>
                  <p className="text-sm text-och-steel mb-1">Hiring Timeline Prediction</p>
                  <p className="text-2xl font-bold text-och-steel">--</p>
                </div>
              </div>
            )}
          </Card>

          <Card>
            <h3 className="text-xl font-bold mb-4 text-white">Missing Skills</h3>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse p-3 bg-och-midnight/50 rounded-lg">
                    <div className="h-4 bg-och-steel/20 rounded mb-2"></div>
                    <div className="h-3 bg-och-steel/20 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-och-steel">No missing skills data available</p>
              </div>
            )}
          </Card>
        </div>

        <Card>
          <h3 className="text-xl font-bold mb-4 text-white">Improvement Plan</h3>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse p-4 bg-och-midnight/50 rounded-lg">
                  <div className="h-4 bg-och-steel/20 rounded mb-2"></div>
                  <div className="h-3 bg-och-steel/20 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-och-steel">No improvement plan data available</p>
            </div>
          )}
        </Card>
      </div>

      {/* Mentorship Impact */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-white">Mentorship Impact</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-xl font-bold mb-4 text-white">Mentor Influence Index</h3>
            {isLoading ? (
              <div className="animate-pulse">
                <div className="mb-6">
                  <div className="h-4 bg-och-steel/20 rounded w-40 mb-2"></div>
                  <div className="h-10 bg-och-steel/20 rounded w-24 mb-2"></div>
                  <div className="h-2 bg-och-steel/20 rounded"></div>
                </div>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-3 bg-och-midnight/50 rounded-lg">
                      <div className="h-4 bg-och-steel/20 rounded mb-2"></div>
                      <div className="h-2 bg-och-steel/20 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-6">
                  <p className="text-sm text-och-steel mb-1">Overall Influence Score</p>
                  <p className="text-4xl font-bold text-och-steel">--/10</p>
                  <ProgressBar value={0} variant="mint" className="mt-2" />
                </div>
                <div className="text-center py-4">
                  <p className="text-och-steel">No mentor influence metrics available</p>
                </div>
              </div>
            )}
          </Card>

          <Card>
            <h3 className="text-xl font-bold mb-4 text-white">Mentor-Performance Correlation</h3>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-pulse text-och-steel">Loading chart...</div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <p className="text-och-steel">No correlation data available</p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <Card>
          <h2 className="text-2xl font-bold mb-4 text-white">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/dashboard/analyst/analytics">
              <Button variant="outline" className="flex flex-col items-center justify-center gap-2 h-24 w-full">
                <span className="text-2xl">📊</span>
                <span className="text-xs text-center">View Analytics</span>
              </Button>
            </Link>
            <Link href="/dashboard/analyst/reports">
              <Button variant="outline" className="flex flex-col items-center justify-center gap-2 h-24 w-full">
                <span className="text-2xl">📄</span>
                <span className="text-xs text-center">Generate Report</span>
              </Button>
            </Link>
            <Link href="/dashboard/analyst/data-sources">
              <Button variant="outline" className="flex flex-col items-center justify-center gap-2 h-24 w-full">
                <span className="text-2xl">💾</span>
                <span className="text-xs text-center">Data Sources</span>
              </Button>
            </Link>
            <Link href="/dashboard/analyst/analytics">
              <Button variant="outline" className="flex flex-col items-center justify-center gap-2 h-24 w-full">
                <span className="text-2xl">📈</span>
                <span className="text-xs text-center">Export Data</span>
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
