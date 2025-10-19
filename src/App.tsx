import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { BoardsPage } from './pages/BoardsPage';
import { LinksPage } from './pages/LinksPage';
import { TasksPage } from './pages/TasksPage';
import { Layout } from './components/layout/Layout';
import { ChatHistoryPage } from './pages/ChatHistoryPage';
import { DataSourceDebugPage } from './pages/DataSourceDebugPage';
import { DatabaseValidationPage } from './pages/DatabaseValidationPage';
import { DatabaseTestPage } from './pages/DatabaseTestPage';
import { LoginPage } from './pages/LoginPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { OnboardingModal } from './components/OnboardingModal';
import { DiagnosticModal } from './components/DiagnosticModal';
import { migrationService } from './services/migrationService';
import { useSettingsStore } from './stores/settingsStore';
import { useLinkStore } from './stores/linkStore';
import { useAuth } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import './utils/consoleTestRunner'; // Initialize console test functions
import './index.css';

// Protected Route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  const { showOnboarding, setShowOnboarding, setHasSeenOnboarding, hasSeenOnboarding, setDontShowOnboarding } = useSettingsStore();
  const { rawLinks } = useLinkStore();
  const [diagnosticOpen, setDiagnosticOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    console.log('🚀 App starting up...');
    console.log('📊 Environment check:', {
      hasOpenAIKey: !!import.meta.env.VITE_OPENAI_API_KEY,
      model: import.meta.env.VITE_OPENAI_MODEL,
      embedModel: import.meta.env.VITE_OPENAI_EMBED_MODEL
    });
    
    // Run migrations in a safer way
    try {
      migrationService.backfillConversations().catch((err) => console.error('Migration failed', err));
      migrationService.backfillSummaryEmbeddings().catch((err) => console.error('Embedding migration failed', err));
    } catch (error) {
      console.error('Migration service error:', error);
    }
  }, []);

  // Listen for diagnostic modal trigger
  useEffect(() => {
    const handleOpenDiagnosticModal = () => {
      setDiagnosticOpen(true);
    };

    window.addEventListener('openDiagnosticModal', handleOpenDiagnosticModal);
    return () => {
      window.removeEventListener('openDiagnosticModal', handleOpenDiagnosticModal);
    };
  }, []);

  // Show onboarding only for truly new users who have never seen it
  useEffect(() => {
    console.log('👥 Onboarding check:', { rawLinksLength: rawLinks.length, hasSeenOnboarding, showOnboarding });
    
    // Check if user has chosen not to show onboarding again
    const dontShowAgain = localStorage.getItem('dontShowOnboarding') === 'true';
    
    // Only show onboarding if user has never seen it and hasn't opted out
    if (!hasSeenOnboarding && !showOnboarding && !dontShowAgain) {
      setShowOnboarding(true);
    }
  }, [hasSeenOnboarding, showOnboarding, setShowOnboarding]);

  const handleOnboardingClose = () => {
    setShowOnboarding(false);
    setHasSeenOnboarding(true);
  };

  const handleShowOnboarding = () => {
    setDontShowOnboarding(false);
    setShowOnboarding(true);
  };

  const handleShowDiagnostics = () => {
    setDiagnosticOpen(true);
  };

  console.log('🎨 Rendering App component');

  return (
    <SettingsProvider showOnboarding={handleShowOnboarding} showDiagnostics={handleShowDiagnostics}>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/callback" element={<AuthCallbackPage />} />
          
          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout>
                <LinksPage />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/boards" element={
            <ProtectedRoute>
              <Layout>
                <BoardsPage />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/tasks" element={
            <ProtectedRoute>
              <Layout>
                <TasksPage />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/chat-history" element={
            <ProtectedRoute>
              <Layout>
                <ChatHistoryPage />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/debug-data-sources" element={
            <ProtectedRoute>
              <Layout>
                <DataSourceDebugPage />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/database-validation" element={
            <ProtectedRoute>
              <Layout>
                <DatabaseValidationPage />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/database-tests" element={
            <ProtectedRoute>
              <Layout>
                <DatabaseTestPage />
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
        
        {isAuthenticated && (
          <>
            <OnboardingModal 
              isOpen={showOnboarding} 
              onClose={handleOnboardingClose}
              onDontShowAgain={setDontShowOnboarding}
            />
            
            <DiagnosticModal 
              isOpen={diagnosticOpen} 
              onClose={() => setDiagnosticOpen(false)}
            />
          </>
        )}
      </Router>
    </SettingsProvider>
  );
}

export default App;
