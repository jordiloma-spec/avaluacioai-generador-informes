export type Gender = 'nen' | 'nena';
export type Trimester = '1' | '2' | '3';
export type Course = '1r' | '2n' | '3r' | '4t' | '5è' | '6è';

export interface UserProfile {
  id: string; // Supabase user ID
  email: string;
  name: string; // From profiles table (first_name)
  currentCourse: Course; // From profiles table
  gender: 'mestre' | 'mestra'; // From profiles table
  isPremium: boolean; // Now from profiles table (is_premium)
  dailyUsage: {
    date: string; // YYYY-MM-DD, now from profiles table (daily_usage_date)
    count: number; // Now from profiles table (daily_usage_count)
  };
}

export interface Student {
  id: string;
  name: string;
  gender: Gender;
  course: Course;
}

export interface Subject {
  id: string;
  name: string;
}

export interface Block {
  id: string;
  subject_id: string;
  name: string;
  trimesters: Trimester[];
}

export interface Gradient {
  id: string;
  block_id: string;
  tag: string;
  text: string;
}

export interface Comment {
  id: string;
  block_id: string;
  tag: string;
  text: string;
}

export interface EvaluationState {
  [blockId: string]: {
    gradientId: string | null;
    commentIds: string[];
  };
}

export interface AppData {
  students: Student[];
  subjects: Subject[];
  blocks: Block[];
  gradients: Gradient[];
  comments: Comment[];
}