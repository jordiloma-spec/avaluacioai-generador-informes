import React, { useState, useEffect, useCallback } from 'react';
import { AppData, UserProfile, Student, Subject, Block, Gradient, Comment, Course, Gender, Trimester } from './types';
import { Evaluator } from './components/Evaluator';
import { Settings } from './components/Settings';
import { Login } from './components/Login';
import { SessionContextProvider, useSession } from './src/components/SessionContextProvider';
import { PenTool, Settings as SettingsIcon, Crown } from 'lucide-react';
import {
  fetchAllUserData,
  createStudent, updateStudent, deleteStudents,
  createSubject, updateSubject, deleteSubjects,
  createBlock, updateBlock, deleteBlocks,
  createGradient, updateGradient, deleteGradients,
  createComment, updateComment, deleteComments,
} from './services/dataService'; // Import new data service

function AppContent() {
  const { session, user, profile, loading, updateUserProfile, logout } = useSession();
  const [data, setData] = useState<AppData | null>(null);
  const [currentView, setCurrentView] = useState<'evaluator' | 'settings'>('evaluator');

  // Function to fetch all user data from Supabase
  const loadAppData = useCallback(async (userId: string) => {
    setLoading(true); // Set loading true while fetching app data
    const fetchedData = await fetchAllUserData(userId);
    setData(fetchedData);
    setLoading(false); // Set loading false after fetching app data
  }, []);

  useEffect(() => {
    if (profile && user) {
      loadAppData(profile.id);
    } else {
      setData(null); // Clear data if no profile
    }
  }, [profile, user, loadAppData]);

  // Handlers for data modifications (passed to Settings component)
  const handleSaveData = useCallback(async (newData: AppData) => {
    // This function is now more of a placeholder if we were to save the whole object.
    // Instead, individual CRUD operations will be used.
    // For now, we just update the local state.
    setData(newData);
  }, []);

  const handleUpdateUser = useCallback(async (updatedProfile: Partial<UserProfile>) => {
    if (!profile) return;
    await updateUserProfile(updatedProfile);
  }, [profile, updateUserProfile]);

  // Individual CRUD operations for Settings component
  const dataActions = {
    students: {
      create: async (student: Omit<Student, 'id'>) => {
        if (!user) return null;
        const newStudent = await createStudent(user.id, student);
        if (newStudent) setData(prev => ({ ...prev!, students: [...prev!.students, newStudent] }));
        return newStudent;
      },
      update: async (student: Student) => {
        const updated = await updateStudent(student);
        if (updated) setData(prev => ({ ...prev!, students: prev!.students.map(s => s.id === updated.id ? updated : s) }));
        return updated;
      },
      delete: async (ids: string[]) => {
        await deleteStudents(ids);
        setData(prev => ({ ...prev!, students: prev!.students.filter(s => !ids.includes(s.id)) }));
      },
    },
    subjects: {
      create: async (subject: Omit<Subject, 'id'>) => {
        if (!user) return null;
        const newSubject = await createSubject(user.id, subject);
        if (newSubject) setData(prev => ({ ...prev!, subjects: [...prev!.subjects, newSubject] }));
        return newSubject;
      },
      update: async (subject: Subject) => {
        const updated = await updateSubject(subject);
        if (updated) setData(prev => ({ ...prev!, subjects: prev!.subjects.map(s => s.id === updated.id ? updated : s) }));
        return updated;
      },
      delete: async (ids: string[]) => {
        await deleteSubjects(ids);
        // Also delete related blocks, gradients, comments
        const blocksToDelete = data!.blocks.filter(b => ids.includes(b.subjectId)).map(b => b.id);
        await deleteBlocks(blocksToDelete);
        await deleteGradients(data!.gradients.filter(g => blocksToDelete.includes(g.blockId)).map(g => g.id));
        await deleteComments(data!.comments.filter(c => blocksToDelete.includes(c.blockId)).map(c => c.id));
        setData(prev => ({
          ...prev!,
          subjects: prev!.subjects.filter(s => !ids.includes(s.id)),
          blocks: prev!.blocks.filter(b => !blocksToDelete.includes(b.id)),
          gradients: prev!.gradients.filter(g => !blocksToDelete.includes(g.blockId)),
          comments: prev!.comments.filter(c => !blocksToDelete.includes(c.blockId)),
        }));
      },
    },
    blocks: {
      create: async (block: Omit<Block, 'id'>) => {
        if (!user) return null;
        const newBlock = await createBlock(user.id, block);
        if (newBlock) setData(prev => ({ ...prev!, blocks: [...prev!.blocks, newBlock] }));
        return newBlock;
      },
      update: async (block: Block) => {
        const updated = await updateBlock(block);
        if (updated) setData(prev => ({ ...prev!, blocks: prev!.blocks.map(b => b.id === updated.id ? updated : b) }));
        return updated;
      },
      delete: async (ids: string[]) => {
        await deleteBlocks(ids);
        // Also delete related gradients and comments
        await deleteGradients(data!.gradients.filter(g => ids.includes(g.blockId)).map(g => g.id));
        await deleteComments(data!.comments.filter(c => ids.includes(c.blockId)).map(c => c.id));
        setData(prev => ({
          ...prev!,
          blocks: prev!.blocks.filter(b => !ids.includes(b.id)),
          gradients: prev!.gradients.filter(g => !ids.includes(g.blockId)),
          comments: prev!.comments.filter(c => !ids.includes(c.blockId)),
        }));
      },
    },
    gradients: {
      create: async (gradient: Omit<Gradient, 'id'>) => {
        if (!user) return null;
        const newGradient = await createGradient(user.id, gradient);
        if (newGradient) setData(prev => ({ ...prev!, gradients: [...prev!.gradients, newGradient] }));
        return newGradient;
      },
      update: async (gradient: Gradient) => {
        const updated = await updateGradient(gradient);
        if (updated) setData(prev => ({ ...prev!, gradients: prev!.gradients.map(g => g.id === updated.id ? updated : g) }));
        return updated;
      },
      delete: async (ids: string[]) => {
        await deleteGradients(ids);
        setData(prev => ({ ...prev!, gradients: prev!.gradients.filter(g => !ids.includes(g.id)) }));
      },
    },
    comments: {
      create: async (comment: Omit<Comment, 'id'>) => {
        if (!user) return null;
        const newComment = await createComment(user.id, comment);
        if (newComment) setData(prev => ({ ...prev!, comments: [...prev!.comments, newComment] }));
        return newComment;
      },
      update: async (comment: Comment) => {
        const updated = await updateComment(comment);
        if (updated) setData(prev => ({ ...prev!, comments: prev!.comments.map(c => c.id === updated.id ? updated : c) }));
        return updated;
      },
      delete: async (ids: string[]) => {
        await deleteComments(ids);
        setData(prev => ({ ...prev!, comments: prev!.comments.filter(c => !ids.includes(c.id)) }));
      },
    },
  };


  if (loading || !data) { // Check for both session loading and app data loading
    return <div className="flex h-screen items-center justify-center text-slate-500">Carregant dades de l'aplicació...</div>;
  }

  if (!session || !profile) {
    return <Login />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500">
                Avaluació<span className="font-light text-slate-600">AI</span>
              </span>
              <div className="hidden md:flex text-xs text-slate-500 items-center gap-1 bg-slate-100 px-2 py-1 rounded-full">
                <span className="font-semibold">{profile.name}</span> | {profile.currentCourse}
                {profile.isPremium && <Crown size={12} className="text-yellow-500 ml-1 fill-yellow-500"/>}
              </div>
            </div>
            <div className="flex items-center space-x-2 md:space-x-4">
              <button
                onClick={() => setCurrentView('evaluator')}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'evaluator' 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <PenTool size={18} className="mr-2" />
                <span className="hidden sm:inline">Avaluar</span>
              </button>
              <button
                onClick={() => setCurrentView('settings')}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'settings' 
                    ? 'bg-slate-100 text-slate-900' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <SettingsIcon size={18} className="mr-2" />
                <span className="hidden sm:inline">Dades i Perfil</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {currentView === 'evaluator' ? (
          <Evaluator 
            data={data} 
            user={profile}
            onUpdateUser={handleUpdateUser}
          />
        ) : (
          <Settings 
            data={data} 
            user={profile} 
            onSave={handleSaveData} // This will be a no-op or handle full data refresh
            onUpdateUser={handleUpdateUser}
            onLogout={logout}
            dataActions={dataActions} // Pass individual CRUD actions
          />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <SessionContextProvider>
      <AppContent />
    </SessionContextProvider>
  );
}