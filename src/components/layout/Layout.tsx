import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { ErrorBoundary } from '../ErrorBoundary';

export const Layout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Header onMenu={() => setOpen(!open)} />
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <main className="pt-14 transition-all duration-300 md:ml-64 px-3 sm:px-4">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
    </div>
  );
};
