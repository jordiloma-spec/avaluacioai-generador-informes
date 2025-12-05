import { AppData, UserProfile, Course } from '../types';

const DATA_PREFIX = 'avaluacio_data_';

export const generateUniqueId = () => Math.random().toString(36).substr(2, 9);

const INITIAL_DATA: AppData = {
  students: [],
  subjects: [],
  blocks: [],
  gradients: [],
  comments: [],
};

// --- USAGE LOGIC ---

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
  return updatedUser;
};


// --- DATA MANAGEMENT (PER USER) ---

export const getStoredData = (userId: string): AppData => {
  const key = `${DATA_PREFIX}${userId}`;
  const stored = localStorage.getItem(key);
  if (stored) {
    return JSON.parse(stored);
  }
  // If no data exists for this user, return initial empty structure
  return JSON.parse(JSON.stringify(INITIAL_DATA));
};

export const saveStoredData = (userId: string, data: AppData) => {
  const key = `${DATA_PREFIX}${userId}`;
  localStorage.setItem(key, JSON.stringify(data));
};