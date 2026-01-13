import React, { createContext, useContext, useState, useEffect } from 'react'

interface TestUser {
  sub: string
  email: string
  name: string
  picture?: string
}

interface TestModeContextType {
  isTestMode: boolean
  testUser: TestUser | null
  enableTestMode: () => void
  disableTestMode: () => void
}

const TestModeContext = createContext<TestModeContextType | undefined>(undefined)

export const useTestMode = () => {
  const context = useContext(TestModeContext)
  if (!context) {
    throw new Error('useTestMode must be used within TestModeProvider')
  }
  return context
}

export const TestModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isTestMode, setIsTestMode] = useState(false)
  const [testUser, setTestUser] = useState<TestUser | null>(null)

  // Check for test mode on mount (from URL param or localStorage)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const testModeParam = urlParams.get('test') === 'true' || urlParams.get('testMode') === 'true'
    const storedTestMode = localStorage.getItem('testMode') === 'true'
    
    if (testModeParam || storedTestMode) {
      setIsTestMode(true)
      setTestUser({
        sub: 'test-user-123',
        email: 'test@smartrack.app',
        name: 'Test User',
        picture: undefined
      })
      if (testModeParam) {
        localStorage.setItem('testMode', 'true')
      }
    }
  }, [])

  const enableTestMode = () => {
    setIsTestMode(true)
    setTestUser({
      sub: 'test-user-123',
      email: 'test@smartrack.app',
      name: 'Test User',
      picture: undefined
    })
    localStorage.setItem('testMode', 'true')
    console.log('[TEST MODE] ✅ Test mode enabled - Auth0 bypassed')
  }

  const disableTestMode = () => {
    setIsTestMode(false)
    setTestUser(null)
    localStorage.removeItem('testMode')
    console.log('[TEST MODE] ❌ Test mode disabled')
  }

  return (
    <TestModeContext.Provider value={{ isTestMode, testUser, enableTestMode, disableTestMode }}>
      {children}
    </TestModeContext.Provider>
  )
}
