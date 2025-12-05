import { AppData, UserProfile, Course } from '../types';

const USERS_KEY = 'avaluacio_ai_users';
const DATA_PREFIX = 'avaluacio_data_';

export const generateUniqueId = () => Math.random().toString(36).substr(2, 9);

const INITIAL_DATA: AppData = {
  students: [],
  subjects: [],
  blocks: [],
  gradients: [],
  comments: [],
};

// --- USER MANAGEMENT ---

export const getUsers = (): UserProfile[] => {
  const stored = localStorage.getItem(USERS_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveUser = (user: UserProfile) => {
  const users = getUsers();
  const index = users.findIndex(u => u.id === user.id);
  if (index >= 0) {
    users[index] = user;
  } else {
    users.push(user);
  }
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const loginUser = (email: string, password: string): UserProfile | null => {
  const users = getUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  
  if (user) {
    // Ensure legacy users have the new fields
    if (user.isPremium === undefined) user.isPremium = false;
    if (!user.dailyUsage) user.dailyUsage = { date: new Date().toISOString().split('T')[0], count: 0 };
    saveUser(user);
    return user;
  }
  return null;
};

export const registerUser = (email: string, name: string, course: Course): UserProfile => {
  const users = getUsers();
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error("Aquest email ja està registrat.");
  }
  
  // Simulation: Generate a random password (in a real app, this would be emailed)
  const password = Math.random().toString(36).slice(-8); 
  
  const newUser: UserProfile = {
    id: generateUniqueId(),
    email,
    password,
    name,
    currentCourse: course,
    isPremium: false,
    dailyUsage: {
      date: new Date().toISOString().split('T')[0],
      count: 0
    }
  };
  
  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  
  // Initialize empty data for this user
  saveStoredData(newUser.id, INITIAL_DATA);
  
  return newUser;
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
  saveUser(updatedUser);
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