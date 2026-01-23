import React from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { useCategories } from '../context/CategoriesContext'
import { useSidebar } from '../context/SidebarContext'

export const Layout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isSidebarOpen, toggleSidebar, closeSidebar } = useSidebar()
  const { categories } = useCategories()
  
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Header onMenu={toggleSidebar} />
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} categories={categories} />
      <main className="pt-20 transition-all duration-300 lg:ml-16 px-8 lg:px-12 pb-4 sm:pb-10">
        <div className="max-w-[1200px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
