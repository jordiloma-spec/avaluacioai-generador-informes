import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../integrations/supabase/client';
import { UserProfile, Course } from '../types';
// REMOVED: import { getLocalUserUsageData, saveLocalUserUsageData } from '../services/storageService';

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

  console.log('SessionContextProvider: Component rendered, loading state:', loading);

  const fetchUserProfile = async (supabaseUser: User): Promise<UserProfile | null> => {
    if (!supabaseUser) {
      console.log('fetchUserProfile: No supabaseUser provided, returning null.');
      return null;
    }
    console.log('fetchUserProfile: Attempting to fetch profile for user ID:', supabaseUser.id);

    let profileData = null;
    let fetchError = null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, avatar_url, current_course, gender, is_premium, daily_usage_date, daily_usage_count, gemini_api_key') // Added new columns
        .eq('id', supabaseUser.id)
        .single();
      
      profileData = data;
      fetchError = error;

    } catch (e) {
      console.error('fetchUserProfile: Unexpected error during Supabase profile fetch:', e);
      fetchError = e; // Catch any unexpected errors
    }

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows found, which is fine for new users
      console.error('fetchUserProfile: Error fetching profile from Supabase:', fetchError);
    }
    console.log('fetchUserProfile: Profile data from Supabase (after fetch attempt):', profileData);
    console.log('fetchUserProfile: Raw gemini_api_key from Supabase:', profileData?.gemini_api_key);


    // Map Supabase data to UserProfile interface
    const userProfile: UserProfile = {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: profileData?.first_name || supabaseUser.email?.split('@')[0] || 'Usuari',
      currentCourse: (profileData?.current_course as Course) || '1r',
      gender: profileData?.gender === 'mestre' ? 'mestre' : 'mestra', // Default to 'mestra'
      isPremium: profileData?.is_premium || false, // Now from Supabase
      dailyUsage: {
        date: profileData?.daily_usage_date || new Date().toISOString().split('T')[0], // Now from Supabase
        count: profileData?.daily_usage_count || 0, // Now from Supabase
      },
      geminiApiKey: profileData?.gemini_api_key || undefined, // Nova: Clau API de Gemini
    };
    setProfile(userProfile);
    console.log('fetchUserProfile: Profile set:', userProfile);
    console.log('fetchUserProfile: UserProfile geminiApiKey after mapping:', userProfile.geminiApiKey);
    return userProfile;
  };

  const updateUserProfile = async (updatedProfile: Partial<UserProfile>) => {
    if (!user || !profile) {
      console.warn('updateUserProfile: No user or profile available to update.');
      return;
    }
    console.log('updateUserProfile: Attempting to update profile for user ID:', user.id, 'with:', updatedProfile);
    console.log('updateUserProfile: Incoming updatedProfile.geminiApiKey:', updatedProfile.geminiApiKey);


    const updateObject: { [key: string]: any } = {
      updated_at: new Date().toISOString(),
    };
    if (updatedProfile.name !== undefined) updateObject.first_name = updatedProfile.name;
    if (updatedProfile.currentCourse !== undefined) updateObject.current_course = updatedProfile.currentCourse;
    if (updatedProfile.gender !== undefined) updateObject.gender = updatedProfile.gender;
    if (updatedProfile.isPremium !== undefined) updateObject.is_premium = updatedProfile.isPremium; // Now updates Supabase
    if (updatedProfile.dailyUsage !== undefined) { // Now updates Supabase
      updateObject.daily_usage_date = updatedProfile.dailyUsage.date;
      updateObject.daily_usage_count = updatedProfile.dailyUsage.count;
    }
    if (updatedProfile.geminiApiKey !== undefined) updateObject.gemini_api_key = updatedProfile.geminiApiKey; // Nova: Actualitza la clau API

    console.log('updateUserProfile: Supabase updateObject:', updateObject);

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateObject)
      .eq('id', user.id);

    if (updateError) {
      console.error('updateUserProfile: Error updating profile in Supabase:', updateError);
      return;
    }
    console.log('updateUserProfile: Profile updated in Supabase.');

    // Update local state
    setProfile(prev => ({ ...prev!, ...updatedProfile }));
    console.log('updateUserProfile: Profile state updated locally.');
  };

  const logout = async () => {
    console.log('logout: Attempting to sign out.');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('logout: Error signing out:', error);
    } else {
      console.log('logout: Signed out successfully.');
    }
    setSession(null);
    setUser(null);
    setProfile(null);
    setLoading(false); // Ensure loading is false after logout
    console.log('logout: setLoading(false) called.');
  };

  useEffect(() => {
    console.log('SessionContextProvider: Initial mount effect triggered.');
    let authSubscription: { unsubscribe: () => void } | undefined;

    const initializeAuth = async () => {
      try {
        console.log('SessionContextProvider: Attempting to get initial session.');
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        console.log('SessionContextProvider: Initial session result:', initialSession);
        setSession(initialSession);
        setUser(initialSession?.user || null);
        if (initialSession?.user) {
          await fetchUserProfile(initialSession.user);
        }
      } catch (error) {
        console.error('SessionContextProvider: Error during initial session fetch:', error);
      } finally {
        setLoading(false);
        console.log('SessionContextProvider: Initial loading set to FALSE.');
      }

      // Set up the listener after the initial load attempt
      const { data } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
        console.log('SessionContextProvider: onAuthStateChange event:', event, 'currentSession:', currentSession);
        setSession(currentSession);
        setUser(currentSession?.user || null);
        if (currentSession?.user) {
          // Always fetch profile on auth state change if user exists, to ensure latest profile data
          await fetchUserProfile(currentSession.user);
        } else {
          setProfile(null);
        }
      });
      authSubscription = data.subscription;
    };

    initializeAuth();

    return () => {
      console.log('SessionContextProvider: Cleanup - Unsubscribing from auth listener.');
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []); // Empty dependency array

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