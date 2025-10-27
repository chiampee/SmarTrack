import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'

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
          name: categoryName, // Store the original name
          count: 1
        })
      }
    })

    // Convert to array of Category objects
    const categoriesArray: Category[] = Array.from(categoryMap.values()).map(({ name, count }) => ({
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name: name,
      linkCount: count
    }))

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

