/**
 * Redesigned Recipe Sidebar Component
 * Re-imagined as "Micro-Skill Boosters" for mission execution
 * Features OCH dark theme, contextual boosters, and skill-gain previews
 */
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BookOpen, 
  Search, 
  CheckCircle2, 
  ExternalLink, 
  Flame, 
  Sparkles, 
  Zap,
  Target,
  ArrowRight,
  TrendingUp,
  ChevronDown,
  Info
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useQuery } from '@tanstack/react-query'
import { apiGateway } from '@/services/apiGateway'
import clsx from 'clsx'

interface Recipe {
  id: string
  slug?: string
  title: string
  description: string
  duration?: number
  difficulty?: string
  completed?: boolean
  skill_gain?: string
}

interface RecipeSidebarEnhancedProps {
  recipeIds: string[]
  className?: string
}

export function RecipeSidebarEnhanced({ recipeIds, className = '' }: RecipeSidebarEnhancedProps) {
  const [completedRecipes, setCompletedRecipes] = useState<Set<string>>(new Set())
  const [isOpen, setIsOpen] = useState(true)

  const { data: recipesData } = useQuery<Recipe[]>({
    queryKey: ['recipes', recipeIds],
    queryFn: async () => {
      // Fetch real recipes from API
      try {
        const response: any = await apiGateway.get('/missions/recipes', {
          params: { recipe_ids: recipeIds.join(',') }
        })
        return Array.isArray(response) ? response : (response?.results || [])
      } catch (error) {
        console.debug('Recipes API not available:', error)
        return []
      }
    },
    enabled: recipeIds.length > 0,
  })

  const recipes = recipesData || []
  const remainingRecipes = recipes.filter((r) => !completedRecipes.has(r.id))

  const handleMarkComplete = (recipeId: string) => {
    setCompletedRecipes((prev) => new Set([...Array.from(prev), recipeId]))
  }

  if (recipeIds.length === 0) {
    return (
      <Card className="bg-och-midnight/40 border border-och-steel/10 p-6 rounded-[2rem] text-center">
        <Info className="w-8 h-8 text-och-steel/30 mx-auto mb-3" />
        <p className="text-[10px] font-black text-och-steel uppercase tracking-widest">No Contextual Boosters</p>
        <p className="text-[9px] text-och-steel/60 font-medium italic mt-1">"You have the required intel for this sector."</p>
      </Card>
    )
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={clsx(
          "hidden lg:flex flex-col gap-6 bg-och-midnight/40 rounded-[2.5rem] p-8 border border-och-steel/10 h-full sticky top-6 backdrop-blur-md",
          className
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-och-gold/10 text-och-gold border border-och-gold/20">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-white uppercase tracking-tighter">Recipe Engine</h4>
              <p className="text-[10px] text-och-steel font-bold uppercase tracking-widest">{remainingRecipes.length} Micro-Boosters</p>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto pr-2 custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {remainingRecipes.map((recipe) => (
              <motion.div
                key={recipe.id}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                <RecipeCard
                  recipe={recipe}
                  onComplete={() => handleMarkComplete(recipe.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {remainingRecipes.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 rounded-full bg-och-mint/10 border border-och-mint/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-och-mint" />
            </div>
              <p className="text-sm font-black text-white uppercase tracking-tighter">Boosters Consumed</p>
              <p className="text-[10px] text-och-steel font-medium italic mt-1">"Intel alignment complete."</p>
            </motion.div>
          )}
        </div>

        {/* Intelligence Link */}
        <div className="p-5 rounded-2xl bg-och-steel/5 border border-och-steel/10 group cursor-pointer hover:bg-och-steel/10 transition-all">
           <div className="flex items-center justify-between mb-2">
             <span className="text-[9px] font-black text-och-steel uppercase tracking-widest">Global Library</span>
             <ExternalLink className="w-3 h-3 text-och-steel group-hover:text-white transition-colors" />
           </div>
           <p className="text-[10px] text-white font-bold group-hover:text-och-mint transition-colors">Access All Skill Boosters</p>
        </div>
      </aside>

      {/* Mobile Bottom Sheet (Minimalist version) */}
      <div className="lg:hidden fixed bottom-20 left-4 right-4 z-50">
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-och-midnight/90 backdrop-blur-xl rounded-[2rem] border border-och-gold/20 shadow-2xl overflow-hidden"
        >
          <button 
              onClick={() => setIsOpen(!isOpen)}
            className="w-full p-5 flex items-center justify-between border-b border-och-steel/10"
            >
            <div className="flex items-center gap-3">
              <Flame className="w-5 h-5 text-och-gold" />
              <span className="text-xs font-black text-white uppercase tracking-widest">Recipe Engine ({remainingRecipes.length})</span>
          </div>
            <ChevronDown className={clsx("w-4 h-4 text-och-steel transition-transform", isOpen ? "rotate-180" : "")} />
          </button>

          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 space-y-3 max-h-[50vh] overflow-y-auto">
            {remainingRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onComplete={() => handleMarkComplete(recipe.id)}
              />
            ))}
          </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </>
  )
}

function RecipeCard({
  recipe,
  onComplete,
}: {
  recipe: Recipe
  onComplete: () => void
}) {
  return (
    <Card
      className="p-5 bg-white/5 border border-och-steel/10 hover:border-och-gold/30 hover:bg-white/10 transition-all rounded-2xl group"
    >
      <div className="flex items-start justify-between mb-3">
        <h5 className="font-black text-white text-xs uppercase tracking-tight flex-1 group-hover:text-och-gold transition-colors">{recipe.title}</h5>
        <Badge variant="steel" className="ml-2 text-[8px] px-1 py-0 font-black tracking-widest">
          {recipe.duration} MIN
          </Badge>
      </div>
      
      <p className="text-[11px] text-och-steel font-medium mb-4 line-clamp-2 leading-relaxed italic">
        "{recipe.description}"
      </p>

      {recipe.skill_gain && (
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-3 h-3 text-och-mint" />
          <span className="text-[9px] font-black text-och-mint uppercase tracking-widest">{recipe.skill_gain}</span>
        </div>
      )}

      <div className="flex items-center gap-2 pt-2 border-t border-och-steel/5">
        <Link href={`/recipes/${recipe.slug || recipe.id}`} className="flex-1">
          <Button
            variant="outline"
            size="sm"
            className="w-full h-9 rounded-xl border-och-steel/20 text-och-steel text-[9px] font-black uppercase tracking-widest hover:border-white transition-all"
          >
            <ExternalLink className="w-3 h-3 mr-2" />
            Deploy
          </Button>
        </Link>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-9 rounded-xl border-och-mint/20 text-och-mint text-[9px] font-black uppercase tracking-widest hover:bg-och-mint hover:text-black transition-all"
          onClick={(e) => {
            e.stopPropagation()
            onComplete()
          }}
        >
          <CheckCircle2 className="w-3 h-3 mr-2" />
          Got it
        </Button>
      </div>
    </Card>
  )
}
