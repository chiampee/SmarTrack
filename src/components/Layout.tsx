import React, { useState, createContext, useContext } from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { useCategories } from '../context/CategoriesContext'

// Context for passing add link handler from Dashboard to Header
const AddLinkContext = createContext<{
  setAddLinkHandler: (handler: (() => void) | undefined) => void
  getAddLinkHandler: () => (() => void) | undefined
}>({
  setAddLinkHandler: () => {},
  getAddLinkHandler: () => undefined,
})

export const useAddLink = () => {
  const { setAddLinkHandler } = useContext(AddLinkContext)
  return setAddLinkHandler
}

export const Layout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [addLinkHandler, setAddLinkHandlerState] = useState<(() => void) | undefined>(undefined)
  const { categories } = useCategories()
  
  const setAddLinkHandler = (handler: (() => void) | undefined) => {
    setAddLinkHandlerState(handler)
  }
  
  const getAddLinkHandler = () => addLinkHandler
  
  return (
    <AddLinkContext.Provider value={{ setAddLinkHandler, getAddLinkHandler }}>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Header onMenu={() => setIsSidebarOpen(!isSidebarOpen)} onAddLink={addLinkHandler} />
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} categories={categories} />
        <main className="pt-20 transition-all duration-300 lg:ml-64 px-4 md:px-6 lg:px-8 pb-4 sm:pb-10">
          <div className="max-w-[95%] lg:max-w-[98%] xl:max-w-[99%] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </AddLinkContext.Provider>
  )
}
