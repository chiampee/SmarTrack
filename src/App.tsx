import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { BoardsPage } from './pages/BoardsPage';
import { LinksPage } from './pages/LinksPage';
import { TasksPage } from './pages/TasksPage';
import { Layout } from './components/layout/Layout';
import { ChatHistoryPage } from './pages/ChatHistoryPage';
import './index.css';

function App() {
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
