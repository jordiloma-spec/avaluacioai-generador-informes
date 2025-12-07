import { supabase } from '../integrations/supabase/client';
import { Student, Subject, Block, Gradient, Comment, AppData, Course, Gender, Trimester } from '../types';

// --- Fetch All Data for a User ---
export const fetchAllUserData = async (userId: string): Promise<AppData> => {
  const [
    studentsRes,
    subjectsRes,
    blocksRes,
    gradientsRes,
    commentsRes,
  ] = await Promise.all([
    supabase.from('students').select('*').eq('user_id', userId),
    supabase.from('subjects').select('*').eq('user_id', userId),
    supabase.from('blocks').select('*').eq('user_id', userId),
    supabase.from('gradients').select('*').eq('user_id', userId),
    supabase.from('comments').select('*').eq('user_id', userId),
  ]);

  if (studentsRes.error) console.error('Error fetching students:', studentsRes.error);
  if (subjectsRes.error) console.error('Error fetching subjects:', subjectsRes.error);
  if (blocksRes.error) console.error('Error fetching blocks:', blocksRes.error);
  if (gradientsRes.error) console.error('Error fetching gradients:', gradientsRes.error);
  if (commentsRes.error) console.error('Error fetching comments:', commentsRes.error);

  return {
    students: studentsRes.data || [],
    subjects: subjectsRes.data || [],
    blocks: blocksRes.data || [],
    gradients: gradientsRes.data || [],
    comments: commentsRes.data || [],
  };
};

// --- Student CRUD ---
export const createStudent = async (userId: string, student: Omit<Student, 'id'>): Promise<Student | null> => {
  console.log('dataService: Intentant crear alumne a Supabase:', { ...student, user_id: userId });
  const { data, error } = await supabase.from('students').insert({ ...student, user_id: userId }).select().single();
  if (error) {
    console.error('dataService: Error creant alumne:', error);
    return null;
  }
  console.log('dataService: Alumne creat amb èxit:', data);
  return data;
};

export const updateStudent = async (student: Student): Promise<Student | null> => {
  console.log('dataService: Intentant actualitzar alumne a Supabase:', student);
  const { data, error } = await supabase.from('students').update(student).eq('id', student.id).select().single();
  if (error) {
    console.error('dataService: Error actualitzant alumne:', error);
    return null;
  }
  console.log('dataService: Alumne actualitzat amb èxit:', data);
  return data;
};

export const deleteStudents = async (ids: string[]): Promise<void> => {
  console.log('dataService: Intentant esborrar alumnes a Supabase amb IDs:', ids);
  const { error } = await supabase.from('students').delete().in('id', ids);
  if (error) console.error('dataService: Error esborrant alumnes:', error);
  else console.log('dataService: Alumnes esborrats amb èxit.');
};

// --- Subject CRUD ---
export const createSubject = async (userId: string, subject: Omit<Subject, 'id'>): Promise<Subject | null> => {
  console.log('dataService: Intentant crear àrea a Supabase:', { ...subject, user_id: userId });
  const { data, error } = await supabase.from('subjects').insert({ ...subject, user_id: userId }).select().single();
  if (error) {
    console.error('dataService: Error creant àrea:', error);
    return null;
  }
  console.log('dataService: Àrea creada amb èxit:', data);
  return data;
};

export const updateSubject = async (subject: Subject): Promise<Subject | null> => {
  console.log('dataService: Intentant actualitzar àrea a Supabase:', subject);
  const { data, error } = await supabase.from('subjects').update(subject).eq('id', subject.id).select().single();
  if (error) {
    console.error('dataService: Error actualitzant àrea:', error);
    return null;
  }
  console.log('dataService: Àrea actualitzada amb èxit:', data);
  return data;
};

export const deleteSubjects = async (ids: string[]): Promise<void> => {
  console.log('dataService: Intentant esborrar àrees a Supabase amb IDs:', ids);
  const { error } = await supabase.from('subjects').delete().in('id', ids);
  if (error) console.error('dataService: Error esborrant àrees:', error);
  else console.log('dataService: Àrees esborrades amb èxit.');
};

// --- Block CRUD ---
export const createBlock = async (userId: string, block: Omit<Block, 'id'>): Promise<Block | null> => {
  console.log('dataService: Intentant crear bloc a Supabase:', { ...block, user_id: userId });
  const { data, error } = await supabase.from('blocks').insert({ 
    user_id: userId, 
    subject_id: block.subject_id, // Use subject_id
    name: block.name,
    trimesters: block.trimesters
  }).select().single();
  if (error) {
    console.error('dataService: Error creant bloc:', error);
    return null;
  }
  console.log('dataService: Bloc creat amb èxit:', data);
  return data;
};

export const updateBlock = async (block: Block): Promise<Block | null> => {
  console.log('dataService: Intentant actualitzar bloc a Supabase:', block);
  const { data, error } = await supabase.from('blocks').update({
    subject_id: block.subject_id, // Use subject_id
    name: block.name,
    trimesters: block.trimesters
  }).eq('id', block.id).select().single();
  if (error) {
    console.error('dataService: Error actualitzant bloc:', error);
    return null;
  }
  console.log('dataService: Bloc actualitzat amb èxit:', data);
  return data;
};

export const deleteBlocks = async (ids: string[]): Promise<void> => {
  console.log('dataService: Intentant esborrar blocs a Supabase amb IDs:', ids);
  const { error } = await supabase.from('blocks').delete().in('id', ids);
  if (error) console.error('dataService: Error esborrant blocs:', error);
  else console.log('dataService: Blocs esborrats amb èxit.');
};

// --- Gradient CRUD ---
export const createGradient = async (userId: string, gradient: Omit<Gradient, 'id'>): Promise<Gradient | null> => {
  console.log('dataService: Intentant crear gradient a Supabase:', { ...gradient, user_id: userId });
  const { data, error } = await supabase.from('gradients').insert({ 
    user_id: userId, 
    block_id: gradient.block_id, // Use block_id
    tag: gradient.tag,
    text: gradient.text
  }).select().single();
  if (error) {
    console.error('dataService: Error creant gradient:', error);
    return null;
  }
  console.log('dataService: Gradient creat amb èxit:', data);
  return data;
};

export const updateGradient = async (gradient: Gradient): Promise<Gradient | null> => {
  console.log('dataService: Intentant actualitzar gradient a Supabase:', gradient);
  const { data, error } = await supabase.from('gradients').update({
    block_id: gradient.block_id, // Use block_id
    tag: gradient.tag,
    text: gradient.text
  }).eq('id', gradient.id).select().single();
  if (error) {
    console.error('dataService: Error actualitzant gradient:', error);
    return null;
  }
  console.log('dataService: Gradient actualitzat amb èxit:', data);
  return data;
};

export const deleteGradients = async (ids: string[]): Promise<void> => {
  console.log('dataService: Intentant esborrar gradients a Supabase amb IDs:', ids);
  const { error } = await supabase.from('gradients').delete().in('id', ids);
  if (error) console.error('dataService: Error esborrant gradients:', error);
  else console.log('dataService: Gradients esborrats amb èxit.');
};

// --- Comment CRUD ---
export const createComment = async (userId: string, comment: Omit<Comment, 'id'>): Promise<Comment | null> => {
  console.log('dataService: Intentant crear comentari a Supabase:', { ...comment, user_id: userId });
  const { data, error } = await supabase.from('comments').insert({ 
    user_id: userId, 
    block_id: comment.block_id, // Use block_id
    tag: comment.tag,
    text: comment.text
  }).select().single();
  if (error) {
    console.error('dataService: Error creant comentari:', error);
    return null;
  }
  console.log('dataService: Comentari creat amb èxit:', data);
  return data;
};

export const updateComment = async (comment: Comment): Promise<Comment | null> => {
  console.log('dataService: Intentant actualitzar comentari a Supabase:', comment);
  const { data, error } = await supabase.from('comments').update({
    block_id: comment.block_id, // Use block_id
    tag: comment.tag,
    text: comment.text
  }).eq('id', comment.id).select().single();
  if (error) {
    console.error('dataService: Error actualitzant comentari:', error);
    return null;
  }
  console.log('dataService: Comentari actualitzat amb èxit:', data);
  return data;
};

export const deleteComments = async (ids: string[]): Promise<void> => {
  console.log('dataService: Intentant esborrar comentaris a Supabase amb IDs:', ids);
  const { error } = await supabase.from('comments').delete().in('id', ids);
  if (error) console.error('dataService: Error esborrant comentaris:', error);
  else console.log('dataService: Comentaris esborrats amb èxit.');
};