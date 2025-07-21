import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { BoardsPage } from './pages/BoardsPage';
import { LinksPage } from './pages/LinksPage';
import { TasksPage } from './pages/TasksPage';
import { Layout } from './components/layout/Layout';
import { ChatHistoryPage } from './pages/ChatHistoryPage';
import { OnboardingModal } from './components/OnboardingModal';
import { migrationService } from './services/migrationService';
import { useSettingsStore } from './stores/settingsStore';
import { useLinkStore } from './stores/linkStore';
import './index.css';

function App() {
  const { showOnboarding, setShowOnboarding, setHasSeenOnboarding, hasSeenOnboarding } = useSettingsStore();
  const { rawLinks } = useLinkStore();

  useEffect(() => {
    console.log('🚀 App starting up...');
    console.log('📊 Environment check:', {
      hasOpenAIKey: !!import.meta.env.VITE_OPENAI_API_KEY,
      model: import.meta.env.VITE_OPENAI_MODEL,
      embedModel: import.meta.env.VITE_OPENAI_EMBED_MODEL
    });
    
    // Run one-off migrations (non-blocking)
    migrationService.backfillConversations().catch((err) => console.error('Migration failed', err));
    migrationService.backfillSummaryEmbeddings().catch((err) => console.error('Embedding migration failed', err));
  }, []);

  // Show onboarding for new users (no links and haven't seen onboarding)
  useEffect(() => {
    console.log('👥 Onboarding check:', { rawLinksLength: rawLinks.length, hasSeenOnboarding, showOnboarding });
    if (rawLinks.length === 0 && !hasSeenOnboarding && !showOnboarding) {
      setShowOnboarding(true);
    }
  }, [rawLinks.length, hasSeenOnboarding, showOnboarding, setShowOnboarding]);

  const handleOnboardingClose = () => {
    setShowOnboarding(false);
    setHasSeenOnboarding(true);
  };

  console.log('🎨 Rendering App component');

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<BoardsPage />} />
          <Route path="/links" element={<LinksPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/chat-history" element={<ChatHistoryPage />} />
        </Routes>
      </Layout>
      
      <OnboardingModal 
        isOpen={showOnboarding} 
        onClose={handleOnboardingClose} 
      />
    </Router>
  );
}

export default App;
