import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../integrations/supabase/client';
import { UserProfile, Course } from '../types';
import toast from 'react-hot-toast'; // Importa react-hot-toast

interface SessionContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  fetchUserProfile: (supabaseUser: User) => Promise<UserProfile | null>;
  updateUserProfile: (updatedProfile: Partial<UserProfile>) => Promise<void>;
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (supabaseUser: User): Promise<UserProfile | null> => {
    if (!supabaseUser) {
      return null;
    }

    let profileData = null;
    let fetchError = null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, avatar_url, current_course, gender, is_premium, daily_usage_date, daily_usage_count, gemini_api_key')
        .eq('id', supabaseUser.id)
        .single();
      
      profileData = data;
      fetchError = error;

    } catch (e) {
      console.error('fetchUserProfile: Unexpected error during Supabase profile fetch:', e);
      fetchError = e;
    }

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('fetchUserProfile: Error fetching profile from Supabase:', fetchError);
    }

    // Map Supabase data to UserProfile interface
    const userProfile: UserProfile = {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: profileData?.first_name || supabaseUser.email?.split('@')[0] || 'Usuari',
      currentCourse: (profileData?.current_course as Course) || '1r',
      gender: profileData?.gender === 'mestre' ? 'mestre' : 'mestra',
      isPremium: profileData?.is_premium || false,
      dailyUsage: {
        date: profileData?.daily_usage_date || new Date().toISOString().split('T')[0],
        count: profileData?.daily_usage_count || 0,
      },
      geminiApiKey: profileData?.gemini_api_key || undefined,
    };
    setProfile(userProfile);
    return userProfile;
  };

  const updateUserProfile = async (updatedProfile: Partial<UserProfile>) => {
    if (!user || !profile) {
      console.warn('updateUserProfile: No user or profile available to update.');
      toast.error("No s'ha pogut actualitzar el perfil: usuari no identificat.");
      return;
    }

    const updateObject: { [key: string]: any } = {
      updated_at: new Date().toISOString(),
    };
    if (updatedProfile.name !== undefined) updateObject.first_name = updatedProfile.name;
    if (updatedProfile.currentCourse !== undefined) updateObject.current_course = updatedProfile.currentCourse;
    if (updatedProfile.gender !== undefined) updateObject.gender = updatedProfile.gender;
    if (updatedProfile.isPremium !== undefined) updateObject.is_premium = updatedProfile.isPremium;
    if (updatedProfile.dailyUsage !== undefined) {
      updateObject.daily_usage_date = updatedProfile.dailyUsage.date;
      updateObject.daily_usage_count = updatedProfile.dailyUsage.count;
    }
    if (updatedProfile.geminiApiKey !== undefined) updateObject.gemini_api_key = updatedProfile.geminiApiKey;

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateObject)
      .eq('id', user.id);

    if (updateError) {
      console.error('updateUserProfile: Error updating profile in Supabase:', updateError);
      toast.error(`Error en actualitzar el perfil: ${updateError.message}`);
      return;
    }

    // Update local state
    setProfile(prev => ({ ...prev!, ...updatedProfile }));
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('logout: Error signing out:', error);
    }
    setSession(null);
    setUser(null);
    setProfile(null);
    setLoading(false);
  };

  useEffect(() => {
    let authSubscription: { unsubscribe: () => void } | undefined;

    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
        setUser(initialSession?.user || null);
        if (initialSession?.user) {
          await fetchUserProfile(initialSession.user);
        }
      } catch (error) {
        console.error('SessionContextProvider: Error during initial session fetch:', error);
      } finally {
        setLoading(false);
      }

      const { data } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user || null);
        if (currentSession?.user) {
          await fetchUserProfile(currentSession.user);
        } else {
          setProfile(null);
        }
      });
      authSubscription = data.subscription;
    };

    initializeAuth();

    return () => {
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []);

  return (
    <SessionContext.Provider value={{ session, user, profile, loading, fetchUserProfile, updateUserProfile, logout }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionContextProvider');
  }
  return context;
};