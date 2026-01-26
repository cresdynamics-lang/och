"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CommunityShell } from "@/components/community/CommunityShell"
import { createClient } from "@/lib/supabase/client"

export default function CommunityPage() {
  const router = useRouter()
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        router.push("/login")
        return
      }

      setUserId(user.id)
      setLoading(false)
    }

    checkAuth()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading community...</p>
        </div>
      </div>
    )
  }

  if (!userId) {
    return null
  }

  return <CommunityShell userId={userId} />
}

