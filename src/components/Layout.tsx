import React, { useState } from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { useCategories } from '../context/CategoriesContext'
import { useTestMode } from '../context/TestModeContext'
import { AlertTriangle, X } from 'lucide-react'

export const Layout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { categories } = useCategories()
  const { isTestMode, disableTestMode } = useTestMode()
  
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Test Mode Banner */}
      {isTestMode && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="w-4 h-4" />
            <span>TEST MODE: Auth0 bypassed - Using test user account</span>
          </div>
          <button
            onClick={disableTestMode}
            className="p-1 hover:bg-amber-600 rounded transition-colors"
            aria-label="Disable test mode"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      <Header onMenu={() => setIsSidebarOpen(!isSidebarOpen)} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} categories={categories} />
      <main className={`transition-all duration-300 lg:ml-64 px-4 md:px-6 lg:px-8 pb-4 sm:pb-10 ${isTestMode ? 'pt-28' : 'pt-20'}`}>
        <div className="max-w-[95%] lg:max-w-[98%] xl:max-w-[99%] mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
