import React, { useState, useEffect } from 'react';
import { AppData, UserProfile } from './types';
import { getStoredData, saveStoredData } from './services/storageService';
import { Evaluator } from './components/Evaluator';
import { Settings } from './components/Settings';
import { Login } from './components/Login';
import { SessionContextProvider, useSession } from './src/components/SessionContextProvider'; // Ruta corregida
import { PenTool, Settings as SettingsIcon, Crown } from 'lucide-react';

function AppContent() {
  const { session, user, profile, loading, updateUserProfile, logout } = useSession();
  const [data, setData] = useState<AppData | null>(null);
  const [currentView, setCurrentView] = useState<'evaluator' | 'settings'>('evaluator');

  useEffect(() => {
    if (profile) {
      const loadedData = getStoredData(profile.id);
      setData(loadedData);
    } else {
      setData(null);
    }
  }, [profile]);

  const handleSaveData = (newData: AppData) => {
    if (!profile) return;
    setData(newData);
    saveStoredData(profile.id, newData);
  };

  const handleUpdateUser = async (updatedProfile: Partial<UserProfile>) => {
    if (!profile) return;
    // Update local usage data (premium status, daily usage)
    const newProfile = { ...profile, ...updatedProfile };
    await updateUserProfile(newProfile); // This will update Supabase and local storage for premium/usage
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-slate-500">Carregant sessió...</div>;
  }

  if (!session || !profile) {
    return <Login />;
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
                <span className="font-semibold">{profile.name}</span> | {profile.currentCourse}
                {profile.isPremium && <Crown size={12} className="text-yellow-500 ml-1 fill-yellow-500"/>}
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
            user={profile}
            onUpdateUser={handleUpdateUser}
          />
        ) : (
          <Settings 
            data={data} 
            user={profile} 
            onSave={handleSaveData} 
            onUpdateUser={handleUpdateUser}
            onLogout={logout}
          />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <SessionContextProvider>
      <AppContent />
    </SessionContextProvider>
  );
}