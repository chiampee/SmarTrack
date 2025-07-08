import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { BoardsPage } from './pages/BoardsPage';
import { LinksPage } from './pages/LinksPage';
import './index.css';

function App() {
  return (
    <Router>
      <header className="flex items-center gap-4 bg-gray-100 px-4 py-2">
        <Link to="/" className="text-lg font-semibold">
          Smart Research Tracker
        </Link>
        <nav className="flex gap-3 text-sm">
          <Link to="/">Boards</Link>
          <Link to="/links">Links</Link>
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<BoardsPage />} />
        <Route path="/links" element={<LinksPage />} />
      </Routes>
    </Router>
  );
}

export default App;
