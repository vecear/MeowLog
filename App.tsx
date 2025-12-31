import React, { useEffect, useState, createContext, useContext } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { AddLog } from './pages/AddLog';
import { Settings } from './pages/Settings';
import { LoginPage } from './pages/LoginPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { loadGoogleScript, getAccessToken, signOut, tryAutoLogin, handleAuthClick } from './services/googleAuth';
import { getSettings } from './services/storage';
import { AppSettings } from './types';

// Settings Context - includes settings and refresh function
interface SettingsContextType {
  settings: AppSettings;
  refreshSettings: () => Promise<void>;
}
export const SettingsContext = createContext<SettingsContextType | null>(null);
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used within SettingsContext.Provider");
  return context.settings;
};
export const useSettingsContext = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettingsContext must be used within SettingsContext.Provider");
  return context;
};

// Auth Context for logout and switch account
interface AuthContextType {
  handleLogout: () => void;
  handleSwitchAccount: () => Promise<void>;
}
export const AuthContext = createContext<AuthContextType | null>(null);
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthContext.Provider");
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
  };

  // Exposed refresh function for child components
  const refreshSettings = async () => {
    await fetchSettings();
  };

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
  };

  const handleSwitchAccount = async () => {
    // Sign out first, then trigger new login
    signOut();
    try {
      await handleAuthClick();
      await fetchSettings();
    } catch (e) {
      console.error("Failed to switch account", e);
      setIsAuthenticated(false);
      setSettings(null);
    }
  };

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
    <AuthContext.Provider value={{ handleLogout, handleSwitchAccount }}>
      <SettingsContext.Provider value={{ settings, refreshSettings }}>
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
    </AuthContext.Provider>
  );
};

export default App;