import React, { useEffect, useState, createContext, useContext } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { AddLog } from './pages/AddLog';
import { Settings } from './pages/Settings';
import { LoginPage } from './pages/LoginPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { loadGoogleScript, getAccessToken, signOut, tryAutoLogin } from './services/googleAuth';
import { getSettings } from './services/storage';
import { AppSettings } from './types';

// Create Context
export const SettingsContext = createContext<AppSettings | null>(null);
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used within SettingsContext.Provider");
  return context;
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  const fetchSettings = async () => {
    try {
      const s = await getSettings();
      setSettings(s);
    } catch (e) {
      console.error("Failed to fetch settings", e);
    }
  }

  const handleLoginSuccess = async () => {
    setIsAuthenticated(true);
    await fetchSettings();
  };

  useEffect(() => {
    const init = async () => {
      try {
        await loadGoogleScript();
        // Attempt auto-login
        const loggedIn = await tryAutoLogin();
        if (loggedIn) {
          setIsAuthenticated(true);
          await fetchSettings();
        }
      } catch (e) {
        console.error("Failed to load Google Scripts or Auto Login", e);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const handleLogout = () => {
    signOut();
    setIsAuthenticated(false);
    setSettings(null);
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // If authenticated but no settings loaded yet (should happen fast after login success)
  if (!settings) {
    return <div className="min-h-screen flex items-center justify-center">Loading Settings...</div>;
  }

  if (!settings.isConfigured) {
    return (
      <HashRouter>
        <OnboardingPage />
      </HashRouter>
    );
  }

  return (
    <SettingsContext.Provider value={settings}>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/add" element={<AddLog />} />
            <Route path="/edit/:id" element={<AddLog />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
      </HashRouter>
    </SettingsContext.Provider>
  );
};

export default App;