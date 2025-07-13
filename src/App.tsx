import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { BoardsPage } from './pages/BoardsPage';
import { LinksPage } from './pages/LinksPage';
import { TasksPage } from './pages/TasksPage';
import { Layout } from './components/layout/Layout';
import { ChatHistoryPage } from './pages/ChatHistoryPage';
import { migrationService } from './services/migrationService';
import './index.css';

function App() {
  React.useEffect(() => {
    // Run one-off migrations (non-blocking)
    migrationService.backfillConversations().catch((err) => console.error('Migration failed', err));
    migrationService.backfillSummaryEmbeddings().catch((err) => console.error('Embedding migration failed', err));
  }, []);
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
    </Router>
  );
}

export default App;
