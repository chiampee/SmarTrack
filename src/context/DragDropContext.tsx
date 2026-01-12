import React, { createContext, useContext, useState, useCallback } from 'react'

interface DragDropContextType {
  onDropOnCollection: ((collectionId: string, linkId: string) => void) | null
  setDropHandler: (handler: ((collectionId: string, linkId: string) => void) | null) => void
  isDragging: boolean
  setIsDragging: (isDragging: boolean) => void
}

const DragDropContext = createContext<DragDropContextType>({
  onDropOnCollection: null,
  setDropHandler: () => {},
  isDragging: false,
  setIsDragging: () => {},
})

export const DragDropProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dropHandler, setDropHandler] = useState<((collectionId: string, linkId: string) => void) | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const setHandler = useCallback((handler: ((collectionId: string, linkId: string) => void) | null) => {
    setDropHandler(() => handler)
  }, [])

  return (
    <DragDropContext.Provider 
      value={{ 
        onDropOnCollection: dropHandler, 
        setDropHandler: setHandler,
        isDragging,
        setIsDragging,
      }}
    >
      {children}
    </DragDropContext.Provider>
  )
}

export const useDragDrop = () => useContext(DragDropContext)
