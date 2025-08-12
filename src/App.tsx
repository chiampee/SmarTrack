import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { BoardsPage } from './pages/BoardsPage';
import { LinksPage } from './pages/LinksPage';
import { TasksPage } from './pages/TasksPage';
import { Layout } from './components/layout/Layout';
import { ChatHistoryPage } from './pages/ChatHistoryPage';
import { OnboardingModal } from './components/OnboardingModal';
import { DiagnosticModal } from './components/DiagnosticModal';
import { migrationService } from './services/migrationService';
import { useSettingsStore } from './stores/settingsStore';
import { useLinkStore } from './stores/linkStore';
import { SettingsProvider } from './contexts/SettingsContext';
import './index.css';

function App() {
  const { showOnboarding, setShowOnboarding, setHasSeenOnboarding, hasSeenOnboarding, setDontShowOnboarding } = useSettingsStore();
  const { rawLinks } = useLinkStore();
  const [diagnosticOpen, setDiagnosticOpen] = useState(false);

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
        <Layout>
          <Routes>
            <Route path="/" element={<LinksPage />} />
            <Route path="/boards" element={<BoardsPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/chat-history" element={<ChatHistoryPage />} />
          </Routes>
        </Layout>
        
        <OnboardingModal 
          isOpen={showOnboarding} 
          onClose={handleOnboardingClose}
          onDontShowAgain={setDontShowOnboarding}
        />
        
        <DiagnosticModal 
          isOpen={diagnosticOpen} 
          onClose={() => setDiagnosticOpen(false)}
        />
      </Router>
    </SettingsProvider>
  );
}

export default App;
