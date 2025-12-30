import React from 'react';
import { Cat, Settings } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isSettingsPage = location.pathname === '/settings';

  return (
    <div className="min-h-screen bg-orange-50 text-stone-800 flex flex-col max-w-md mx-auto shadow-2xl overflow-hidden min-h-screen relative overflow-x-hidden">

      <main className="flex-1 p-4 pb-24 overflow-y-auto scrollbar-hide">
        {children}
      </main>
    </div>
  );
};