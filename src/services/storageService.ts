import { AppData, UserProfile, Course } from '../types';

// The DATA_PREFIX and AppData management will be moved to Supabase via dataService.ts
// This file will now only handle user-specific local storage for premium/daily usage.
// REMOVED: USER_PREMIUM_DAILY_USAGE_PREFIX and related local storage functions.

export const generateUniqueId = () => Math.random().toString(36).substr(2, 9); // Still useful for client-side temporary IDs if needed

// --- USAGE LOGIC (now interacts with UserProfile directly, which is sourced from Supabase) ---

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
  // The actual persistence of dailyUsage is now handled in SessionContextProvider's updateUserProfile,
  // which will write to Supabase. This function now just returns the updated UserProfile object.
  return updatedUser;
};

// REMOVED: getLocalUserUsageData and saveLocalUserUsageData