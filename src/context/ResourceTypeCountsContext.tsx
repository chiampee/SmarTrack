import React, { createContext, useContext, useState } from 'react'
import {
  type ResourceTypeCounts,
  defaultResourceTypeCounts,
} from '../constants/resourceTypes'

export type { ResourceTypeCounts } from '../constants/resourceTypes'

interface ResourceTypeCountsContextValue {
  typeCounts: ResourceTypeCounts
  setTypeCounts: (counts: ResourceTypeCounts) => void
}

const ResourceTypeCountsContext = createContext<ResourceTypeCountsContextValue | undefined>(undefined)

export const useResourceTypeCounts = () => {
  const ctx = useContext(ResourceTypeCountsContext)
  if (ctx === undefined) throw new Error('useResourceTypeCounts must be used within ResourceTypeCountsProvider')
  return ctx
}

export const ResourceTypeCountsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [typeCounts, setTypeCounts] = useState<ResourceTypeCounts>(defaultResourceTypeCounts)

  return (
    <ResourceTypeCountsContext.Provider value={{ typeCounts, setTypeCounts }}>
      {children}
    </ResourceTypeCountsContext.Provider>
  )
}
