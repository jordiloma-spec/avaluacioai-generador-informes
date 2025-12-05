import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../integrations/supabase/client';
import { UserProfile, Course } from '../types';
import { getLocalUserUsageData, saveLocalUserUsageData } from '../services/storageService';

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
        .select('first_name, last_name, avatar_url, current_course, gender')
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

    // Load local usage data (for premium status and daily usage)
    const localUsage = getLocalUserUsageData(supabaseUser.id);
    console.log('fetchUserProfile: Local usage data:', localUsage);

    const userProfile: UserProfile = {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: profileData?.first_name || supabaseUser.email?.split('@')[0] || 'Usuari',
      currentCourse: (profileData?.current_course as Course) || '1r',
      gender: profileData?.gender === 'mestre' ? 'mestre' : 'mestra', // Default to 'mestra'
      isPremium: localUsage?.isPremium || false,
      dailyUsage: localUsage?.dailyUsage || { date: new Date().toISOString().split('T')[0], count: 0 },
    };
    setProfile(userProfile);
    console.log('fetchUserProfile: Profile set:', userProfile);
    return userProfile;
  };

  const updateUserProfile = async (updatedProfile: Partial<UserProfile>) => {
    if (!user || !profile) {
      console.warn('updateUserProfile: No user or profile available to update.');
      return;
    }
    console.log('updateUserProfile: Attempting to update profile for user ID:', user.id, 'with:', updatedProfile);

    const updateObject: { [key: string]: any } = {
      updated_at: new Date().toISOString(),
    };
    if (updatedProfile.name !== undefined) updateObject.first_name = updatedProfile.name;
    if (updatedProfile.currentCourse !== undefined) updateObject.current_course = updatedProfile.currentCourse;
    if (updatedProfile.gender !== undefined) updateObject.gender = updatedProfile.gender;

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateObject)
      .eq('id', user.id);

    if (updateError) {
      console.error('updateUserProfile: Error updating profile in Supabase:', updateError);
      return;
    }
    console.log('updateUserProfile: Profile updated in Supabase.');

    // Update local usage data
    const newLocalUsage = {
      isPremium: updatedProfile.isPremium !== undefined ? updatedProfile.isPremium : profile.isPremium,
      dailyUsage: updatedProfile.dailyUsage || profile.dailyUsage,
    };
    saveLocalUserUsageData(user.id, newLocalUsage);
    console.log('updateUserProfile: Local usage data updated:', newLocalUsage);

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
    console.log('SessionContextProvider: useEffect triggered for auth state listener and initial session check.');
    
    // Listener for auth state changes (after initial load)
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log('onAuthStateChange: Event:', event, 'Session:', currentSession);
      setSession(currentSession);
      setUser(currentSession?.user || null);
      if (currentSession?.user) {
        // Only fetch profile if it's a new session or user changed
        if (!profile || profile.id !== currentSession.user.id) {
          await fetchUserProfile(currentSession.user);
        }
      } else {
        setProfile(null);
      }
      // Do NOT set loading=false here, let the initial getSession handle it.
      // This listener is for *changes* after initial load.
    });

    // Handle initial session load
    const loadInitialSession = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        console.log('getSession: Initial session data:', initialSession);
        setSession(initialSession);
        setUser(initialSession?.user || null);
        if (initialSession?.user) {
          await fetchUserProfile(initialSession.user);
        }
      } catch (error) {
        console.error('getSession: Error fetching initial session:', error);
      } finally {
        setLoading(false); // Ensure loading is false after initial session fetch (success or failure)
        console.log('getSession: setLoading(false) called from initial session check (finally).');
      }
    };

    loadInitialSession();

    return () => {
      console.log('SessionContextProvider: Unsubscribing from auth listener.');
      authListener.subscription.unsubscribe();
    };
  }, []); // Empty dependency array means it runs once on mount

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