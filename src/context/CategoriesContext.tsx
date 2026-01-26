import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { capitalizeCategoryName } from '../utils/categoryUtils'

// Debug logging helper (only in development)
const debugLog = (location: string, message: string, data: any, hypothesisId?: string) => {
  if (import.meta.env.DEV) {
    fetch('http://127.0.0.1:7242/ingest/b003c73b-405c-4cc3-b4ac-91a97cc46a70', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location, message, data, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId })
    }).catch(() => {})
  }
}

interface Category {
  id: string
  name: string
  linkCount: number
}

interface CategoriesContextType {
  categories: Category[]
  setCategories: (categories: Category[]) => void
  computeCategories: (links: any[]) => Category[]
}

const CategoriesContext = createContext<CategoriesContextType | undefined>(undefined)

export const useCategories = () => {
  const context = useContext(CategoriesContext)
  if (!context) {
    throw new Error('useCategories must be used within CategoriesProvider')
  }
  return context
}

export const CategoriesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<Category[]>([])

  const computeCategories = useCallback((links: any[]): Category[] => {
    // Count links per category (normalize to lowercase for grouping)
    const categoryMap = new Map<string, { name: string, count: number }>()
    
    links.forEach(link => {
      const categoryName = link.category || 'Uncategorized'
      const normalizedKey = categoryName.toLowerCase().trim()
      
      if (categoryMap.has(normalizedKey)) {
        const existing = categoryMap.get(normalizedKey)!
        categoryMap.set(normalizedKey, {
          name: existing.name, // Keep the first capitalized version
          count: existing.count + 1
        })
      } else {
        categoryMap.set(normalizedKey, {
          name: capitalizeCategoryName(categoryName), // Capitalize first letter by default
          count: 1
        })
      }
    })

    // Convert to array of Category objects
    const categoriesArray: Category[] = Array.from(categoryMap.values()).map(({ name, count }) => ({
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name: capitalizeCategoryName(name), // Ensure first letter is capitalized
      linkCount: count
    }))
    
    // #region agent log
    debugLog('CategoriesContext.tsx:52', 'computeCategories: Computed categories', { linkCount: links.length, categoryCount: categoriesArray.length, categories: categoriesArray.map(c => ({ name: c.name, count: c.linkCount })), sampleLinkCategories: links.slice(0, 5).map(l => l.category) }, 'E')
    // #endregion

    // Sort by link count descending, then alphabetically
    categoriesArray.sort((a, b) => {
      if (b.linkCount !== a.linkCount) {
        return b.linkCount - a.linkCount
      }
      return a.name.localeCompare(b.name)
    })

    return categoriesArray
  }, [])

  return (
    <CategoriesContext.Provider value={{ categories, setCategories, computeCategories }}>
      {children}
    </CategoriesContext.Provider>
  )
}

