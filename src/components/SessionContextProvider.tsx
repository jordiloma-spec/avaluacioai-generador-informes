import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../integrations/supabase/client';
import { UserProfile, Course } from '../types';
import { getStoredData, saveStoredData } from '../services/storageService';

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
    if (!supabaseUser) return null;

    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('first_name, last_name, avatar_url, current_course, gender') // Added 'gender'
      .eq('id', supabaseUser.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    // Load local usage data (for premium status and daily usage)
    const storedDataKey = `user_premium_daily_usage_${supabaseUser.id}`;
    const localUsage = JSON.parse(localStorage.getItem(storedDataKey) || '{}');

    const userProfile: UserProfile = {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: profileData?.first_name || supabaseUser.email?.split('@')[0] || 'Usuari',
      currentCourse: (profileData?.current_course as Course) || '1r',
      gender: profileData?.gender === 'mestre' ? 'mestre' : 'mestra', // Default to 'mestra'
      isPremium: localUsage.isPremium || false,
      dailyUsage: localUsage.dailyUsage || { date: new Date().toISOString().split('T')[0], count: 0 },
    };
    setProfile(userProfile);
    return userProfile;
  };

  const updateUserProfile = async (updatedProfile: Partial<UserProfile>) => {
    if (!user || !profile) return;

    // Prepare update object for Supabase profiles table
    const updateObject: { [key: string]: any } = {
      updated_at: new Date().toISOString(),
    };
    if (updatedProfile.name !== undefined) updateObject.first_name = updatedProfile.name;
    if (updatedProfile.currentCourse !== undefined) updateObject.current_course = updatedProfile.currentCourse;
    if (updatedProfile.gender !== undefined) updateObject.gender = updatedProfile.gender; // Added gender to update

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateObject)
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating profile in Supabase:', updateError);
      return;
    }

    // Update local premium/daily usage data
    const storedDataKey = `user_premium_daily_usage_${user.id}`;
    const newLocalUsage = {
      isPremium: updatedProfile.isPremium !== undefined ? updatedProfile.isPremium : profile.isPremium,
      dailyUsage: updatedProfile.dailyUsage || profile.dailyUsage,
    };
    localStorage.setItem(storedDataKey, JSON.stringify(newLocalUsage));

    setProfile(prev => ({ ...prev!, ...updatedProfile }));
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user || null);
      if (currentSession?.user) {
        await fetchUserProfile(currentSession.user);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    // Initial session check
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user || null);
      if (initialSession?.user) {
        await fetchUserProfile(initialSession.user);
      }
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
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