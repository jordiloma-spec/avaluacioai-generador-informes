export type Gender = 'nen' | 'nena';
export type Trimester = '1' | '2' | '3';
export type Course = '1r' | '2n' | '3r' | '4t' | '5è' | '6è';

export interface UserProfile {
  id: string;
  email: string;
  password: string; // Stored locally for demo purposes
  name: string;
  currentCourse: Course;
  isPremium: boolean;
  dailyUsage: {
    date: string; // YYYY-MM-DD
    count: number;
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
  subjectId: string;
  name: string;
  trimesters: Trimester[]; // Which trimesters this block is active
}

export interface Gradient {
  id: string;
  blockId: string;
  tag: string; // e.g., "A", "B", "Excel·lent"
  text: string; // The long description
}

export interface Comment {
  id: string;
  blockId: string;
  tag: string; // Short tag
  text: string; // Long text
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