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
      <header className="bg-white p-4 shadow-sm z-10 sticky top-0 flex items-center justify-between">
        <div className="w-10"></div> {/* Spacer for centering */}

        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate('/')}
        >
          <div className="bg-orange-100 p-2 rounded-full">
            <Cat className="w-6 h-6 text-orange-500" />
          </div>
          <h1 className="text-xl font-bold text-stone-700 tracking-wide">小賀Log</h1>
        </div>

        <div className="w-10 flex justify-end">
          {!isSettingsPage && (
            <button
              onClick={() => navigate('/settings')}
              className="p-2 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors"
            >
              <Settings className="w-6 h-6" />
            </button>
          )}
        </div>
      </header>
      <main className="flex-1 p-4 pb-24 overflow-y-auto scrollbar-hide">
        {children}
      </main>
    </div>
  );
};