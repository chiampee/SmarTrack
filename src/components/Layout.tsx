import React, { useState } from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { useCategories } from '../context/CategoriesContext'

export const Layout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { categories } = useCategories()
  
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Header onMenu={() => setIsSidebarOpen(!isSidebarOpen)} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} categories={categories} />
      <main className="pt-20 transition-all duration-300 lg:ml-64 px-4 md:px-6 lg:px-8 pb-10">
        <div className="max-w-[95%] lg:max-w-[98%] xl:max-w-[99%] mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
