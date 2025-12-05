import React, { useState, useEffect } from 'react';
import { AppData, UserProfile } from './types';
import { getStoredData, saveStoredData } from './services/storageService';
import { Evaluator } from './components/Evaluator';
import { Settings } from './components/Settings';
import { Login } from './components/Login';
import { PenTool, Settings as SettingsIcon, Crown } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [data, setData] = useState<AppData | null>(null);
  const [currentView, setCurrentView] = useState<'evaluator' | 'settings'>('evaluator');

  // Check for logged in user on mount (if we were persisting session, which we do implicitly via saving 'users' but not current session token in this demo, 
  // we could check localStorage for a 'currentUserId'. For now, simple flow: always login on refresh for security in this demo context or keep state in memory).
  // Ideally, we'd have a 'session' service. 

  useEffect(() => {
    if (user) {
      const loadedData = getStoredData(user.id);
      setData(loadedData);
    } else {
      setData(null);
    }
  }, [user]);

  const handleLogin = (loggedInUser: UserProfile) => {
    setUser(loggedInUser);
    setCurrentView('evaluator'); // Default to evaluator on login
  };

  const handleLogout = () => {
    setUser(null);
    setData(null);
  };

  const handleSaveData = (newData: AppData) => {
    if (!user) return;
    setData(newData);
    saveStoredData(user.id, newData);
  };

  const handleUpdateUser = (updatedUser: UserProfile) => {
    setUser(updatedUser);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  if (!data) return <div className="flex h-screen items-center justify-center text-slate-500">Carregant dades...</div>;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500">
                Avaluació<span className="font-light text-slate-600">AI</span>
              </span>
              <div className="hidden md:flex text-xs text-slate-500 items-center gap-1 bg-slate-100 px-2 py-1 rounded-full">
                <span className="font-semibold">{user.name}</span> | {user.currentCourse}
                {user.isPremium && <Crown size={12} className="text-yellow-500 ml-1 fill-yellow-500"/>}
              </div>
            </div>
            <div className="flex items-center space-x-2 md:space-x-4">
              <button
                onClick={() => setCurrentView('evaluator')}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'evaluator' 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <PenTool size={18} className="mr-2" />
                <span className="hidden sm:inline">Avaluar</span>
              </button>
              <button
                onClick={() => setCurrentView('settings')}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'settings' 
                    ? 'bg-slate-100 text-slate-900' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <SettingsIcon size={18} className="mr-2" />
                <span className="hidden sm:inline">Dades i Perfil</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {currentView === 'evaluator' ? (
          <Evaluator 
            data={data} 
            user={user}
            onUpdateUser={handleUpdateUser}
          />
        ) : (
          <Settings 
            data={data} 
            user={user} 
            onSave={handleSaveData} 
            onUpdateUser={handleUpdateUser}
            onLogout={handleLogout}
          />
        )}
      </main>
    </div>
  );
}