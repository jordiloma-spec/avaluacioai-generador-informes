import { AppData, UserProfile, Course } from '../types';

// The DATA_PREFIX and AppData management will be moved to Supabase via dataService.ts
// This file will now only handle user-specific local storage for premium/daily usage.

const USER_PREMIUM_DAILY_USAGE_PREFIX = 'user_premium_daily_usage_';

export const generateUniqueId = () => Math.random().toString(36).substr(2, 9); // Still useful for client-side temporary IDs if needed

// --- USAGE LOGIC (still local for now) ---

export const checkDailyLimit = (user: UserProfile): boolean => {
  if (user.isPremium) return true;

  const today = new Date().toISOString().split('T')[0];
  
  // If stored date is different from today, they have full quota
  if (user.dailyUsage.date !== today) {
    return true;
  }

  return user.dailyUsage.count < 5;
};

export const incrementDailyUsage = (user: UserProfile): UserProfile => {
  if (user.isPremium) return user;

  const today = new Date().toISOString().split('T')[0];
  let newUsage = { ...user.dailyUsage };

  if (newUsage.date !== today) {
    newUsage = { date: today, count: 1 };
  } else {
    newUsage.count += 1;
  }

  const updatedUser = { ...user, dailyUsage: newUsage };
  // Note: In a real app, this would update the user profile in Supabase
  // For this demo, we'll assume the `onUpdateUser` callback in App.tsx handles persistence.
  // The actual persistence of dailyUsage is now handled in SessionContextProvider's updateUserProfile.
  return updatedUser;
};

// --- Local Storage for User Profile (Premium/Daily Usage) ---
// These functions are now primarily used by SessionContextProvider
export const getLocalUserUsageData = (userId: string) => {
  const key = `${USER_PREMIUM_DAILY_USAGE_PREFIX}${userId}`;
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : null;
};

export const saveLocalUserUsageData = (userId: string, data: { isPremium: boolean; dailyUsage: { date: string; count: number } }) => {
  const key = `${USER_PREMIUM_DAILY_USAGE_PREFIX}${userId}`;
  localStorage.setItem(key, JSON.stringify(data));
};