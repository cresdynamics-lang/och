'use client'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { User, Briefcase, FileText } from 'lucide-react'

interface StudentMarketplaceTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
  children: React.ReactNode
}

export function StudentMarketplaceTabs({ activeTab, onTabChange, children }: StudentMarketplaceTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-3 bg-och-midnight/50 border border-och-defender/30 mb-6">
        <TabsTrigger 
          value="profile" 
          className="data-[state=active]:bg-och-gold/20 data-[state=active]:text-och-gold data-[state=active]:border-b-2 data-[state=active]:border-och-gold"
        >
          <User className="w-4 h-4 mr-2" />
          Profile
        </TabsTrigger>
        <TabsTrigger 
          value="jobs"
          className="data-[state=active]:bg-och-gold/20 data-[state=active]:text-och-gold data-[state=active]:border-b-2 data-[state=active]:border-och-gold"
        >
          <Briefcase className="w-4 h-4 mr-2" />
          Jobs
        </TabsTrigger>
        <TabsTrigger 
          value="applications"
          className="data-[state=active]:bg-och-gold/20 data-[state=active]:text-och-gold data-[state=active]:border-b-2 data-[state=active]:border-och-gold"
        >
          <FileText className="w-4 h-4 mr-2" />
          Applications
        </TabsTrigger>
      </TabsList>
      {children}
    </Tabs>
  )
}
