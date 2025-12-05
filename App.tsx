import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppData, UserProfile, Student, Subject, Block, Gradient, Comment, Course, Gender, Trimester } from './types';
import { Evaluator } from './src/components/Evaluator';
import { Settings } from './src/components/Settings';
import { Login } from './src/components/Login';
import { SessionContextProvider, useSession } from './src/components/SessionContextProvider';
import { PenTool, Settings as SettingsIcon, Crown } from 'lucide-react';
import {
  fetchAllUserData,
  createStudent, updateStudent, deleteStudents,
  createSubject, updateSubject, deleteSubjects,
  createBlock, updateBlock, deleteBlocks,
  createGradient, updateGradient, deleteGradients,
  createComment, updateComment, deleteComments,
} from './src/services/dataService';

function AppContent() {
  const { session, user, profile, loading: sessionLoading, updateUserProfile, logout } = useSession();
  const [data, setData] = useState<AppData | null>(null);
  const [appDataLoading, setAppDataLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'evaluator' | 'settings'>('evaluator');

  const lastLoadedUserId = useRef<string | null>(null);

  const loadAppData = useCallback(async (userId: string) => {
    setAppDataLoading(true);
    const fetchedData = await fetchAllUserData(userId);
    setData(fetchedData);
    setAppDataLoading(false);
  }, []);

  useEffect(() => {
    if (profile && user) {
      if (user.id !== lastLoadedUserId.current) {
        loadAppData(profile.id);
        lastLoadedUserId.current = user.id;
      }
    } else {
      setData(null);
      setAppDataLoading(false);
      lastLoadedUserId.current = null;
    }
  }, [profile, user, loadAppData]);

  const handleSaveData = useCallback(async (newData: AppData) => {
    setData(newData);
  }, []);

  const handleUpdateUser = useCallback(async (updatedProfile: Partial<UserProfile>) => {
    if (!profile) return;
    await updateUserProfile(updatedProfile);
  }, [profile, updateUserProfile]);

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
        const blocksToDelete = data!.blocks.filter(b => ids.includes(b.subject_id)).map(b => b.id);
        await deleteBlocks(blocksToDelete);
        await deleteGradients(data!.gradients.filter(g => blocksToDelete.includes(g.block_id)).map(g => g.id));
        await deleteComments(data!.comments.filter(c => blocksToDelete.includes(c.block_id)).map(c => c.id));
        setData(prev => ({
          ...prev!,
          subjects: prev!.subjects.filter(s => !ids.includes(s.id)),
          blocks: prev!.blocks.filter(b => !blocksToDelete.includes(b.id)),
          gradients: prev!.gradients.filter(g => !blocksToDelete.includes(g.block_id)),
          comments: prev!.comments.filter(c => !blocksToDelete.includes(c.block_id)),
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
        await deleteGradients(data!.gradients.filter(g => ids.includes(g.block_id)).map(g => g.id));
        await deleteComments(data!.comments.filter(c => ids.includes(c.block_id)).map(c => c.id));
        setData(prev => ({
          ...prev!,
          blocks: prev!.blocks.filter(b => !ids.includes(b.id)),
          gradients: prev!.gradients.filter(g => !ids.includes(g.block_id)),
          comments: prev!.comments.filter(c => !ids.includes(c.block_id)),
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

  if (sessionLoading) {
    return <div className="flex h-screen items-center justify-center text-slate-500">Carregant sessió...</div>;
  }

  if (!session || !profile) {
    return <Login />;
  }

  if (appDataLoading || data === null) {
    return <div className="flex h-screen items-center justify-center text-slate-500">Carregant dades de l'aplicació...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
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
            onSave={handleSaveData}
            onUpdateUser={handleUpdateUser}
            onLogout={logout}
            dataActions={dataActions}
          />
        )}
      </main>
    </div>
  );
}

export default function App() {
  console.log('App component rendered');
  return (
    <SessionContextProvider>
      <AppContent />
    </SessionContextProvider>
  );
}