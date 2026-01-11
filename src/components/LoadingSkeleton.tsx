import React from 'react'
import { motion } from 'framer-motion'

export const LinkCardSkeleton: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-xl border border-gray-200 p-4 mb-3"
    >
      <div className="animate-pulse">
        {/* Header skeleton */}
        <div className="flex items-start gap-3 mb-3">
          {/* Favicon skeleton */}
          <div className="w-10 h-10 bg-gray-200 rounded-lg flex-shrink-0" />
          
          {/* Title and URL skeleton */}
          <div className="flex-1 min-w-0">
            <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-4 bg-gray-100 rounded w-1/2" />
          </div>
          
          {/* Actions skeleton */}
          <div className="flex gap-2">
            <div className="w-8 h-8 bg-gray-100 rounded-lg" />
            <div className="w-8 h-8 bg-gray-100 rounded-lg" />
          </div>
        </div>
        
        {/* Description skeleton */}
        <div className="space-y-2 mb-3">
          <div className="h-3 bg-gray-100 rounded w-full" />
          <div className="h-3 bg-gray-100 rounded w-5/6" />
        </div>
        
        {/* Footer skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <div className="h-6 bg-gray-100 rounded-full w-16" />
            <div className="h-6 bg-gray-100 rounded-full w-20" />
          </div>
          <div className="h-4 bg-gray-100 rounded w-24" />
        </div>
      </div>
    </motion.div>
  )
}

export const LinkListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <LinkCardSkeleton key={i} />
      ))}
    </div>
  )
}

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="animate-pulse">
        {/* Header skeleton */}
        <div className="mb-6">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4" />
          <div className="flex gap-4">
            <div className="h-10 bg-gray-100 rounded-lg flex-1 max-w-md" />
            <div className="h-10 bg-gray-100 rounded-lg w-32" />
          </div>
        </div>
        
        {/* Stats skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="h-4 bg-gray-100 rounded w-24 mb-2" />
            <div className="h-8 bg-gray-200 rounded w-16" />
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="h-4 bg-gray-100 rounded w-24 mb-2" />
            <div className="h-8 bg-gray-200 rounded w-16" />
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="h-4 bg-gray-100 rounded w-24 mb-2" />
            <div className="h-8 bg-gray-200 rounded w-16" />
          </div>
        </div>
        
        {/* Links skeleton */}
        <LinkListSkeleton count={3} />
        
        {/* Loading message */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-gray-500">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4" 
                fill="none"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading your research...</span>
          </div>
        </div>
      </div>
    </div>
  )
}
