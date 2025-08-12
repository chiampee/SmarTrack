import React, { createContext, useContext, ReactNode } from 'react';

interface SettingsContextType {
  showOnboarding: () => void;
  showDiagnostics: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
  showOnboarding: () => void;
  showDiagnostics: () => void;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({
  children,
  showOnboarding,
  showDiagnostics,
}) => {
  return (
    <SettingsContext.Provider value={{ showOnboarding, showDiagnostics }}>
      {children}
    </SettingsContext.Provider>
  );
}; 