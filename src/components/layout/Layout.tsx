import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export const Layout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Header onMenu={() => setOpen(!open)} />
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <main className="mt-12 p-4 transition-all duration-300 md:ml-64">
        {children}
      </main>
    </div>
  );
};
