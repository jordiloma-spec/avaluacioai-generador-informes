import React, { useState, useEffect, useMemo } from 'react';
import { AppData, Student, Subject, Block, Gradient, Comment, Course, Trimester, UserProfile, Gender } from '../types';
import { generateUniqueId } from '../services/storageService';
import { Plus, Trash2, Edit2, Check, X, ChevronDown, ChevronRight, Upload, HelpCircle, FileText, CheckSquare, Square, AlertCircle, User, Key, LogOut, Crown, CreditCard, Wallet, Tag, Mail } from 'lucide-react';
import { useSession } from '../src/components/SessionContextProvider';

interface DataActions {
  students: {
    create: (student: Omit<Student, 'id'>) => Promise<Student | null>;
    update: (student: Student) => Promise<Student | null>;
    delete: (ids: string[]) => Promise<void>;
  };
  subjects: {
    create: (subject: Omit<Subject, 'id'>) => Promise<Subject | null>;
    update: (subject: Subject) => Promise<Subject | null>;
    delete: (ids: string[]) => Promise<void>;
  };
  blocks: {
    create: (block: Omit<Block, 'id'>) => Promise<Block | null>;
    update: (block: Block) => Promise<Block | null>;
    delete: (ids: string[]) => Promise<void>;
  };
  gradients: {
    create: (gradient: Omit<Gradient, 'id'>) => Promise<Gradient | null>;
    update: (gradient: Gradient) => Promise<Gradient | null>;
    delete: (ids: string[]) => Promise<void>;
  };
  comments: {
    create: (comment: Omit<Comment, 'id'>) => Promise<Comment | null>;
    update: (comment: Comment) => Promise<Comment | null>;
    delete: (ids: string[]) => Promise<void>;
  };
}

interface SettingsProps {
  data: AppData;
  user: UserProfile;
  onSave: (newData: AppData) => void; // This will now trigger a full data reload in App.tsx
  onUpdateUser: (newUser: Partial<UserProfile>) => void;
  onLogout: () => void;
  dataActions: DataActions; // New prop for CRUD operations
}

type Tab = 'profile' | 'students' | 'subjects' | 'blocks';

// Helper: CSV Parser
const parseCSV = (content: string) => {
  return content.split('\n')
    .map(line => line.split(/[;,]/).map(c => c.trim().replace(/^"|"$/g, '')))
    .filter(row => row.length > 0 && row[0]);
};

// --- REUSABLE COMPONENTS ---

const ImportSection: React.FC<{ 
  onImport: (content: string) => void; 
  label: string; 
  helpContent: React.ReactNode 
}> = ({ onImport, label, helpContent }) => {
  const [showHelp, setShowHelp] = useState(false);
  
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) onImport(evt.target.result as string);
    };
    reader.readAsText(file);
    e.target.value = ''; 
  };

  return (
    <div className="relative inline-block">
      <div className="flex items-center gap-2 mt-2">
        <label className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 rounded text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors shadow-sm">
          <Upload size={16} />
          {label}
          <input type="file" accept=".csv,.txt" onChange={handleFile} className="hidden" />
        </label>
        <button onClick={() => setShowHelp(!showHelp)} className="text-slate-400 hover:text-blue-500 transition-colors">
          <HelpCircle size={18} />
        </button>
      </div>
      {showHelp && (
        <div className="absolute top-full left-0 mt-2 z-20 bg-white p-4 border border-slate-200 shadow-xl rounded-lg w-80 text-sm text-slate-600 animate-fade-in">
            <h4 className="font-bold mb-2 flex items-center gap-2 text-slate-800"><FileText size={16}/> Format CSV esperat:</h4>
            {helpContent}
            <div className="mt-2 text-xs text-slate-400 border-t pt-2">El separador pot ser coma (,) o punt i coma (;).</div>
        </div>
      )}
    </div>
  );
};

const Checkbox: React.FC<{ checked: boolean; onChange: () => void; label?: string }> = ({ checked, onChange, label }) => (
  <button onClick={(e) => { e.stopPropagation(); onChange(); }} className={`flex items-center gap-2 group ${checked ? 'text-blue-600' : 'text-slate-300 hover:text-slate-400'}`}>
    {checked ? <CheckSquare size={20} /> : <Square size={20} />}
    {label && <span className="text-sm text-slate-700">{label}</span>}
  </button>
);

// --- TABS ---

const ProfileTab: React.FC<{ 
  user: UserProfile; 
  onUpdateUser: (u: Partial<UserProfile>) => void;
  data: AppData;
  onSaveData: (d: AppData) => void; // This will trigger a full data reload in App.tsx
  onLogout: () => void; 
}> = ({ user, onUpdateUser, data, onSaveData, onLogout }) => {
  const { supabase } = useSession();
  const [form, setForm] = useState({ 
    name: user.name, 
    course: user.currentCourse,
    gender: user.gender,
  });
  const [promoCode, setPromoCode] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setIsDirty(
      form.name !== user.name || 
      form.course !== user.currentCourse ||
      form.gender !== user.gender
    );
  }, [form, user]);

  const handleSave = async () => {
    // Check if course changed
    if (form.course !== user.currentCourse) {
      if (data.students.length > 0 && window.confirm(`Has canviat el teu curs a ${form.course}. Vols actualitzar el curs de tots els teus ${data.students.length} alumnes actuals a ${form.course}?`)) {
         // This will trigger a full data reload in App.tsx after update
         // For now, we'll just update the user profile and let App.tsx handle the student update if needed.
         // The student update logic should be handled by dataActions.students.update in StudentsTab.
      }
    }

    await onUpdateUser({ name: form.name, currentCourse: form.course, gender: form.gender });
    setIsDirty(false);
    alert("Perfil actualitzat correctament.");
  };

  const handlePromoCode = async () => {
    if (promoCode.trim().toLowerCase() === 'loma') {
      await onUpdateUser({ isPremium: true });
      alert("Codi promocional acceptat! Ara tens accés Premium il·limitat.");
      setPromoCode('');
    } else {
      alert("Codi promocional invàlid.");
    }
  };

  const handlePaymentSimulation = async (method: string) => {
    // In a real app, this would redirect to Stripe/Paypal
    if (window.confirm(`Vols procedir al pagament de 12€ mitjançant ${method}? (Simulació)`)) {
       await onUpdateUser({ isPremium: true });
       alert("Pagament realitzat amb èxit! El teu compte és ara Premium.");
    }
  };

  const handlePasswordReset = async () => {
    if (!user.email) {
      alert("No s'ha pogut trobar el teu correu electrònic per restablir la contrasenya.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    if (error) {
      console.error("Error sending password reset email:", error);
      alert(`Error en enviar l'enllaç de recuperació: ${error.message}`);
    } else {
      alert("S'ha enviat un enllaç de recuperació de contrasenya al teu correu electrònic.");
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const usageCount = user.dailyUsage.date === today ? user.dailyUsage.count : 0;

  return (
    <div className="space-y-6">
       {/* User Info */}
       <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-w-2xl">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <User className="text-blue-500"/> Les meves dades
          </h3>
          
          <div className="space-y-4">
             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nom</label>
               <input 
                 type="text" 
                 value={form.name} 
                 onChange={e => setForm({...form, name: e.target.value})}
                 className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
               />
             </div>
             
             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email (No editable)</label>
               <input 
                 type="text" 
                 value={user.email} 
                 disabled
                 className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-500 rounded-lg cursor-not-allowed"
               />
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
               <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Curs Actual</label>
                 <select 
                   value={form.course} 
                   onChange={e => setForm({...form, course: e.target.value as Course})}
                   className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                 >
                    {['1r', '2n', '3r', '4t', '5è', '6è'].map(c => <option key={c} value={c}>{c}</option>)}
                 </select>
                 <p className="text-xs text-slate-400 mt-1">Curs que s'assignarà per defecte als nous alumnes.</p>
               </div>
               
               <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Gènere (Mestre/a)</label>
                 <select 
                   value={form.gender} 
                   onChange={e => setForm({...form, gender: e.target.value as 'mestre' | 'mestra'})}
                   className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                 >
                    <option value="mestre">Mestre</option>
                    <option value="mestra">Mestra</option>
                 </select>
                 <p className="text-xs text-slate-400 mt-1">S'utilitza per adaptar el llenguatge de l'IA.</p>
               </div>

               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contrasenya</label>
                  <button 
                    onClick={handlePasswordReset}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors"
                  >
                    <Mail size={16} /> Restablir Contrasenya
                  </button>
                  <p className="text-xs text-slate-400 mt-1">Enviarem un enllaç al teu correu.</p>
               </div>
             </div>

             <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <button 
                  onClick={onLogout}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium flex items-center gap-2"
                >
                  <LogOut size={16} /> Tancar Sessió
                </button>

                <button 
                  onClick={handleSave}
                  disabled={!isDirty}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm transition-all"
                >
                  Guardar Canvis
                </button>
             </div>
          </div>
       </div>

       {/* Subscription Info */}
       <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-w-2xl relative overflow-hidden">
          {user.isPremium ? (
             <div className="absolute top-0 right-0 p-4">
                <Crown className="text-yellow-400 h-16 w-16 opacity-20 rotate-12" />
             </div>
          ) : null}
          
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Crown className={user.isPremium ? "text-yellow-500" : "text-slate-400"}/> Estat de la Subscripció
          </h3>

          {user.isPremium ? (
             <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-6 text-center">
                <h4 className="text-xl font-black text-amber-600 mb-2">Compte PREMIUM Actiu</h4>
                <p className="text-amber-800">Gaudeix d'informes il·limitats i accés complet.</p>
             </div>
          ) : (
             <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                   <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-slate-700">Pla Gratuït</span>
                      <span className="text-xs font-bold px-2 py-1 bg-slate-200 rounded text-slate-600">{usageCount} / 5 utilitzats avui</span>
                   </div>
                   <div className="w-full bg-slate-200 rounded-full h-2.5">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${Math.min((usageCount / 5) * 100, 100)}%` }}></div>
                   </div>
                   <p className="text-xs text-slate-500 mt-2">Tens un límit de 5 informes per dia. Passa't a Premium per eliminar el límit.</p>
                </div>

                <div className="border-t border-slate-100 pt-6">
                   <h4 className="font-bold text-lg mb-4 text-center">Fes-te Premium per només 12€/any</h4>
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                      <button onClick={() => handlePaymentSimulation('PayPal')} className="flex flex-col items-center justify-center p-3 border border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all">
                         <span className="font-bold text-blue-800 italic">PayPal</span>
                      </button>
                      <button onClick={() => handlePaymentSimulation('Google Pay')} className="flex flex-col items-center justify-center p-3 border border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all">
                         <Wallet className="text-slate-700 mb-1" size={20}/>
                         <span className="text-xs font-bold">Google Pay</span>
                      </button>
                      <button onClick={() => handlePaymentSimulation('Targeta')} className="flex flex-col items-center justify-center p-3 border border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all">
                         <CreditCard className="text-slate-700 mb-1" size={20}/>
                         <span className="text-xs font-bold">Targeta</span>
                      </button>
                   </div>
                   
                   <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex items-center gap-3">
                      <Tag size={18} className="text-slate-400"/>
                      <input 
                         type="text" 
                         value={promoCode}
                         onChange={(e) => setPromoCode(e.target.value)}
                         placeholder="Tens un codi promocional?"
                         className="flex-1 bg-transparent border-none outline-none text-sm"
                      />
                      <button 
                         onClick={handlePromoCode}
                         disabled={!promoCode}
                         className="text-xs font-bold text-blue-600 hover:underline disabled:opacity-50"
                      >
                         APLICAR
                      </button>
                   </div>
                </div>
             </div>
          )}
       </div>
    </div>
  );
};

const StudentsTab: React.FC<{ data: AppData; defaultCourse: Course; dataActions: DataActions }> = ({ data, defaultCourse, dataActions }) => {
  const [newStudent, setNewStudent] = useState<Partial<Student>>({ name: '', gender: 'nen', course: defaultCourse });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Student>>({});

  useEffect(() => {
    setNewStudent(prev => ({ ...prev, course: defaultCourse }));
  }, [defaultCourse]);

  const addStudent = async () => {
    if (!newStudent.name) return;
    await dataActions.students.create({
      name: newStudent.name,
      gender: newStudent.gender as Gender,
      course: newStudent.course as Course
    });
    setNewStudent({ name: '', gender: 'nen', course: defaultCourse });
  };

  const handleImport = async (content: string) => {
    const rows = parseCSV(content);
    const studentsToCreate: Omit<Student, 'id'>[] = [];
    rows.forEach(row => {
      if (row.length >= 1) {
         const name = row[0];
         const genderRaw = (row[1] || '').toLowerCase();
         const gender: Gender = (genderRaw.includes('nena') || genderRaw === 'f' || genderRaw.includes('dona')) ? 'nena' : 'nen';
         studentsToCreate.push({ name, gender, course: defaultCourse });
      }
    });
    if (studentsToCreate.length > 0) {
      // Batch creation is not directly supported by current dataActions.students.create,
      // so we'll loop. In a real app, a batch insert function would be ideal.
      for (const student of studentsToCreate) {
        await dataActions.students.create(student);
      }
      alert(`S'han importat ${studentsToCreate.length} alumnes al curs ${defaultCourse}.`);
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setSelectedIds(newSet);
  };

  const deleteSelected = async () => {
    if (!window.confirm(`Esborrar ${selectedIds.size} alumnes?`)) return;
    await dataActions.students.delete(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const bulkChangeCourse = async (newCourse: Course) => {
    if (!window.confirm(`Canviar el curs a ${newCourse} per a ${selectedIds.size} alumnes?`)) return;
    for (const id of Array.from(selectedIds)) {
      const studentToUpdate = data.students.find(s => s.id === id);
      if (studentToUpdate) {
        await dataActions.students.update({ ...studentToUpdate, course: newCourse });
      }
    }
    setSelectedIds(new Set());
  };

  const startEdit = (s: Student) => { setEditingId(s.id); setEditForm(s); };
  const saveEdit = async () => {
    if (!editingId || !editForm.name) return;
    await dataActions.students.update(editForm as Student);
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      {/* ADD BAR */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap gap-4 items-end mb-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nom</label>
            <input type="text" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Nom de l'alumne" />
          </div>
          <div className="w-24">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Curs</label>
            <select value={newStudent.course} onChange={e => setNewStudent({...newStudent, course: e.target.value as Course})} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none">
              {['1r', '2n', '3r', '4t', '5è', '6è'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="w-28">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Gènere</label>
            <select value={newStudent.gender} onChange={e => setNewStudent({...newStudent, gender: e.target.value as Gender})} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none">
              <option value="nen">Nen</option>
              <option value="nena">Nena</option>
            </select>
          </div>
          <button onClick={addStudent} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium shadow-sm transition-colors">
            <Plus size={18} /> Afegir
          </button>
        </div>
        <ImportSection label="Importar Alumnes (CSV)" onImport={handleImport} helpContent={<div className="font-mono text-xs bg-slate-100 p-2 rounded">Nom, Sexe<br/>Pau Garcia, nen<br/>Anna Vila, nena</div>} />
      </div>

      {/* BULK ACTIONS */}
      {selectedIds.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg flex items-center justify-between animate-fade-in shadow-sm">
          <span className="font-medium text-blue-800 ml-2">{selectedIds.size} seleccionats</span>
          <div className="flex gap-3">
             <select className="text-sm border border-blue-300 rounded px-2 py-1 bg-white text-blue-800 outline-none focus:border-blue-500" onChange={(e) => { if(e.target.value) bulkChangeCourse(e.target.value as Course); e.target.value = ''; }}>
               <option value="">Canviar Curs...</option>
               {['1r', '2n', '3r', '4t', '5è', '6è'].map(c => <option key={c} value={c}>{c}</option>)}
             </select>
             <button onClick={deleteSelected} className="flex items-center gap-1 text-sm bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 transition-colors">
               <Trash2 size={16} /> Esborrar
             </button>
          </div>
        </div>
      )}

      {/* LIST */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="flex items-center px-4 py-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
           <div className="w-10 text-center">
              <Checkbox checked={selectedIds.size === data.students.length && data.students.length > 0} onChange={() => setSelectedIds(selectedIds.size === data.students.length ? new Set() : new Set(data.students.map(s => s.id)))} />
           </div>
           <div className="flex-1 px-4">Nom</div>
           <div className="w-24 px-2">Curs</div>
           <div className="w-24 px-2">Gènere</div>
           <div className="w-20 text-right">Accions</div>
        </div>
        
        <div className="divide-y divide-slate-100">
          {data.students.map(s => (
            <div key={s.id} className={`flex items-center px-4 py-3 hover:bg-slate-50 transition-colors group ${selectedIds.has(s.id) ? 'bg-blue-50/50' : ''}`}>
               <div className="w-10 text-center flex-shrink-0">
                  <Checkbox checked={selectedIds.has(s.id)} onChange={() => toggleSelect(s.id)} />
               </div>
               
               {editingId === s.id ? (
                  <>
                    <div className="flex-1 px-4"><input className="w-full border rounded px-2 py-1 text-sm" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} autoFocus /></div>
                    <div className="w-24 px-2"><select className="w-full border rounded px-2 py-1 text-sm" value={editForm.course} onChange={e => setEditForm({...editForm, course: e.target.value as Course})}>{['1r','2n','3r','4t','5è','6è'].map(c=><option key={c} value={c}>{c}</option>)}</select></div>
                    <div className="w-24 px-2"><select className="w-full border rounded px-2 py-1 text-sm" value={editForm.gender} onChange={e => setEditForm({...editForm, gender: e.target.value as Gender})}><option value="nen">Nen</option><option value="nena">Nena</option></select></div>
                    <div className="w-20 px-2 flex justify-end gap-1">
                      <button onClick={saveEdit} className="text-emerald-500 hover:bg-emerald-50 p-1 rounded"><Check size={18}/></button>
                      <button onClick={() => setEditingId(null)} className="text-slate-400 hover:bg-slate-100 p-1 rounded"><X size={18}/></button>
                    </div>
                  </>
               ) : (
                  <>
                    <div className="flex-1 px-4 font-medium text-slate-800">{s.name}</div>
                    <div className="w-24 px-2 text-sm text-slate-600">{s.course}</div>
                    <div className="w-24 px-2 text-sm text-slate-600 capitalize">{s.gender}</div>
                    <div className="w-20 px-2 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={() => startEdit(s)} className="text-slate-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50"><Edit2 size={18}/></button>
                       <button onClick={async () => {if(window.confirm('Esborrar?')) await dataActions.students.delete([s.id])}} className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50"><Trash2 size={18}/></button>
                    </div>
                  </>
               )}
            </div>
          ))}
          {data.students.length === 0 && <div className="p-8 text-center text-slate-400 italic">No hi ha alumnes.</div>}
        </div>
      </div>
    </div>
  );
};

const SubjectsTab: React.FC<{ data: AppData; dataActions: DataActions }> = ({ data, dataActions }) => {
  const [newSubName, setNewSubName] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const addSub = async () => {
    if (!newSubName) return;
    await dataActions.subjects.create({ name: newSubName });
    setNewSubName('');
  };

  const cascadeDelete = async (ids: string[]) => {
    await dataActions.subjects.delete(ids);
    setSelectedIds(new Set());
  };

  const handleImport = async (content: string) => {
    const rows = parseCSV(content);
    const subjectsToCreate: Omit<Subject, 'id'>[] = rows.map(r => ({ name: r[0] })).filter(s => s.name);
    if(subjectsToCreate.length) {
       for (const subject of subjectsToCreate) {
         await dataActions.subjects.create(subject);
       }
       alert(`${subjectsToCreate.length} àrees importades.`);
    }
  };

  const startEdit = (s: Subject) => { setEditingId(s.id); setEditName(s.name); };
  const saveEdit = async () => {
    if(editingId && editName) {
        const subjectToUpdate = data.subjects.find(s => s.id === editingId);
        if (subjectToUpdate) {
          await dataActions.subjects.update({ ...subjectToUpdate, name: editName });
        }
        setEditingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex gap-4 items-end mb-4">
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nom de l'Àrea</label>
            <input type="text" value={newSubName} onChange={e => setNewSubName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: Matemàtiques" />
          </div>
          <button onClick={addSub} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"><Plus size={18} /> Afegir</button>
        </div>
        <ImportSection label="Importar Àrees (CSV)" onImport={handleImport} helpContent={<div className="font-mono text-xs bg-slate-100 p-2 rounded">Nom Àrea<br/>Matemàtiques<br/>Medi Natural</div>} />
      </div>

      {selectedIds.size > 0 && (
         <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg flex items-center justify-between animate-fade-in shadow-sm">
           <span className="font-medium text-blue-800 ml-2">{selectedIds.size} seleccionats</span>
           <button onClick={async () => { if(window.confirm('Segur? S\'esborraran també els blocs.')) await cascadeDelete(Array.from(selectedIds)); }} className="flex items-center gap-1 text-sm bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 transition-colors">
             <Trash2 size={16} /> Esborrar
           </button>
         </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="flex items-center px-4 py-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
           <div className="w-10 text-center"><Checkbox checked={selectedIds.size === data.subjects.length && data.subjects.length > 0} onChange={() => setSelectedIds(selectedIds.size===data.subjects.length ? new Set() : new Set(data.subjects.map(s=>s.id)))} /></div>
           <div className="flex-1 px-4">Àrea</div>
           <div className="w-20 text-right">Accions</div>
        </div>
        <div className="divide-y divide-slate-100">
           {data.subjects.map(s => (
             <div key={s.id} className={`flex items-center px-4 py-3 hover:bg-slate-50 transition-colors group ${selectedIds.has(s.id) ? 'bg-blue-50/50' : ''}`}>
                <div className="w-10 text-center"><Checkbox checked={selectedIds.has(s.id)} onChange={() => { const n = new Set(selectedIds); if(n.has(s.id)) n.delete(s.id); else n.add(s.id); setSelectedIds(n); }} /></div>
                {editingId === s.id ? (
                  <>
                     <div className="flex-1 px-4"><input className="w-full border rounded px-2 py-1" value={editName} onChange={e => setEditName(e.target.value)} autoFocus /></div>
                     <div className="w-20 px-2 flex justify-end gap-1">
                        <button onClick={saveEdit} className="text-emerald-500 hover:bg-emerald-50 p-1 rounded"><Check size={18}/></button>
                        <button onClick={() => setEditingId(null)} className="text-slate-400 hover:bg-slate-100 p-1 rounded"><X size={18}/></button>
                     </div>
                  </>
                ) : (
                  <>
                    <div className="flex-1 px-4 font-medium text-slate-800">{s.name}</div>
                    <div className="w-20 px-2 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={() => startEdit(s)} className="text-slate-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50"><Edit2 size={18}/></button>
                       <button onClick={async () => { if(window.confirm('Segur?')) await cascadeDelete([s.id]); }} className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50"><Trash2 size={18}/></button>
                    </div>
                  </>
                )}
             </div>
           ))}
           {data.subjects.length === 0 && <div className="p-8 text-center text-slate-400 italic">No hi ha àrees.</div>}
        </div>
      </div>
    </div>
  );
};

const BlockContentEditor: React.FC<{ block: Block; data: AppData; dataActions: DataActions }> = ({ block, data, dataActions }) => {
    const [mode, setMode] = useState<'gradients' | 'comments'>('gradients');
    const [gTag, setGTag] = useState('');
    const [gText, setGText] = useState('');
    const [cTag, setCTag] = useState('');
    const [cText, setCText] = useState('');

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ tag: '', text: '' });

    const blockGradients = data.gradients.filter(g => g.block_id === block.id); // Changed to block_id
    const blockComments = data.comments.filter(c => c.block_id === block.id); // Changed to block_id

    const addGradient = async () => {
        if(!gTag || !gText) return;
        await dataActions.gradients.create({ block_id: block.id, tag: gTag, text: gText }); // Changed to block_id
        setGTag(''); setGText('');
    };

    const addComment = async () => {
        if(!cTag || !cText) return;
        await dataActions.comments.create({ block_id: block.id, tag: cTag, text: cText }); // Changed to block_id
        setCTag(''); setCText('');
    };

    const startEdit = (item: { id: string, tag: string, text: string }) => {
      setEditingId(item.id);
      setEditForm({ tag: item.tag, text: item.text });
    };

    const saveEdit = async (type: 'gradient' | 'comment') => {
      if (!editingId) return;
      if (type === 'gradient') {
        const gradientToUpdate = data.gradients.find(g => g.id === editingId);
        if (gradientToUpdate) {
          await dataActions.gradients.update({ ...gradientToUpdate, block_id: block.id, tag: editForm.tag, text: editForm.text }); // Ensure block_id is passed
        }
      } else {
        const commentToUpdate = data.comments.find(c => c.id === editingId);
        if (commentToUpdate) {
          await dataActions.comments.update({ ...commentToUpdate, block_id: block.id, tag: editForm.tag, text: editForm.text }); // Ensure block_id is passed
        }
      }
      setEditingId(null);
    };

    return (
        <div className="p-4 bg-slate-50 border-t border-slate-200 animate-fade-in">
            <div className="flex gap-2 mb-4 border-b border-slate-200">
                <button onClick={() => setMode('gradients')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${mode === 'gradients' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Gradients</button>
                <button onClick={() => setMode('comments')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${mode === 'comments' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Comentaris</button>
            </div>

            {mode === 'gradients' ? (
                <div className="space-y-3">
                    <div className="flex gap-2 items-end">
                        <div className="w-24"><input placeholder="Tag (Ex: A)" value={gTag} onChange={e => setGTag(e.target.value)} className="w-full text-sm px-3 py-2 border rounded-md" /></div>
                        <div className="flex-1"><input placeholder="Text del gradient..." value={gText} onChange={e => setGText(e.target.value)} className="w-full text-sm px-3 py-2 border rounded-md" /></div>
                        <button onClick={addGradient} className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"><Plus size={18}/></button>
                    </div>
                    <ul className="space-y-2">
                        {blockGradients.map(g => (
                            <li key={g.id} className="flex items-center gap-3 text-sm bg-white p-2 rounded border border-slate-200 shadow-sm group">
                                {editingId === g.id ? (
                                  <>
                                    <input className="w-16 border rounded px-1 py-1 font-bold text-center" value={editForm.tag} onChange={e => setEditForm({...editForm, tag: e.target.value})} autoFocus />
                                    <input className="flex-1 border rounded px-2 py-1" value={editForm.text} onChange={e => setEditForm({...editForm, text: e.target.value})} />
                                    <div className="flex gap-1">
                                      <button onClick={() => saveEdit('gradient')} className="text-emerald-500 hover:bg-emerald-50 p-1 rounded"><Check size={16}/></button>
                                      <button onClick={() => setEditingId(null)} className="text-slate-400 hover:bg-slate-100 p-1 rounded"><X size={16}/></button>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <span className="font-bold w-12 text-center bg-slate-100 rounded py-1 shrink-0">{g.tag}</span>
                                    <span className="flex-1 text-slate-600">{g.text}</span>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={() => startEdit(g)} className="text-slate-400 hover:text-blue-500 p-1"><Edit2 size={16}/></button>
                                      <button onClick={async () => await dataActions.gradients.delete([g.id])} className="text-slate-300 hover:text-red-500 p-1"><X size={16}/></button>
                                    </div>
                                  </>
                                )}
                            </li>
                        ))}
                         {blockGradients.length === 0 && <li className="text-xs text-slate-400 italic">No hi ha gradients.</li>}
                    </ul>
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="flex gap-2 items-end">
                        <div className="w-32"><input placeholder="Tag Curt" value={cTag} onChange={e => setCTag(e.target.value)} className="w-full text-sm px-3 py-2 border rounded-md" /></div>
                        <div className="flex-1"><input placeholder="Text del comentari..." value={cText} onChange={e => setCText(e.target.value)} className="w-full text-sm px-3 py-2 border rounded-md" /></div>
                        <button onClick={addComment} className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"><Plus size={18}/></button>
                    </div>
                    <ul className="space-y-2">
                        {blockComments.length === 0 && <li className="text-xs text-slate-400 italic">No hi ha comentaris.</li>}
                        {blockComments.map(c => (
                            <li key={c.id} className="flex items-center gap-3 text-sm bg-white p-2 rounded border border-slate-200 shadow-sm group">
                                {editingId === c.id ? (
                                  <>
                                    <input className="w-24 border rounded px-1 py-1 font-bold text-center" value={editForm.tag} onChange={e => setEditForm({...editForm, tag: e.target.value})} autoFocus />
                                    <input className="flex-1 border rounded px-2 py-1" value={editForm.text} onChange={e => setEditForm({...editForm, text: e.target.value})} />
                                    <div className="flex gap-1">
                                      <button onClick={() => saveEdit('comment')} className="text-emerald-500 hover:bg-emerald-50 p-1 rounded"><Check size={16}/></button>
                                      <button onClick={() => setEditingId(null)} className="text-slate-400 hover:bg-slate-100 p-1 rounded"><X size={16}/></button>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <span className="font-bold w-24 text-center bg-slate-100 rounded py-1 shrink-0 truncate">{c.tag}</span>
                                    <span className="flex-1 text-slate-600">{c.text}</span>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={() => startEdit(c)} className="text-slate-400 hover:text-blue-500 p-1"><Edit2 size={16}/></button>
                                      <button onClick={async () => await dataActions.comments.delete([c.id])} className="text-slate-300 hover:text-red-500 p-1"><X size={16}/></button>
                                    </div>
                                  </>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

const BlocksTab: React.FC<{ data: AppData; dataActions: DataActions }> = ({ data, dataActions }) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(data.subjects[0]?.id || '');
  const [expandedBlockId, setExpandedBlockId] = useState<string | null>(null);
  
  const [newBlockName, setNewBlockName] = useState('');
  const [newBlockTrims, setNewBlockTrims] = useState<Trimester[]>(['1', '2', '3']);
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', trims: [] as Trimester[] });

  // Ensure valid subject selection on load
  useEffect(() => {
    if (!selectedSubjectId && data.subjects.length > 0) {
      setSelectedSubjectId(data.subjects[0].id);
    }
  }, [data.subjects, selectedSubjectId]);

  const activeBlocks = useMemo(() => data.blocks.filter(b => b.subject_id === selectedSubjectId), [data.blocks, selectedSubjectId]); // Changed to b.subject_id

  const addBlock = async () => {
    if (!newBlockName || !selectedSubjectId) return;
    await dataActions.blocks.create({
      subject_id: selectedSubjectId, // Changed to subject_id
      name: newBlockName,
      trimesters: newBlockTrims
    });
    setNewBlockName('');
  };

  const handleImportBlocks = async (content: string) => {
    if (!selectedSubjectId) return alert("Selecciona primer una àrea.");
    const rows = parseCSV(content);
    const blocksToCreate: Omit<Block, 'id'>[] = [];
    rows.forEach(r => {
      if (r[0]) {
        const tRaw = r[1] ? r[1].match(/[123]/g) : ['1','2','3'];
        blocksToCreate.push({
          subject_id: selectedSubjectId, // Changed to subject_id
          name: r[0],
          trimesters: tRaw ? tRaw as Trimester[] : ['1','2','3']
        });
      }
    });
    if (blocksToCreate.length) {
      for (const block of blocksToCreate) {
        await dataActions.blocks.create(block);
      }
      alert(`${blocksToCreate.length} blocs importats.`);
    }
  };

  const handleImportContent = async (content: string) => {
    if (!selectedSubjectId) return alert("Selecciona primer una àrea.");
    const rows = parseCSV(content);
    let gCount = 0, cCount = 0;
    
    const blockMap = new Map(activeBlocks.map(b => [b.name.toLowerCase().trim(), b.id]));

    for (const r of rows) {
      if (r.length < 4) continue;
      const bName = r[0].toLowerCase().trim();
      const type = r[1].toUpperCase().trim();
      const tag = r[2].trim();
      const text = r[3].trim();
      
      const bId = blockMap.get(bName);
      if (bId) {
        if (type.startsWith('G')) {
          await dataActions.gradients.create({ block_id: bId, tag, text }); // Changed to block_id
          gCount++;
        } else if (type.startsWith('C')) {
          await dataActions.comments.create({ block_id: bId, tag, text }); // Changed to block_id
          cCount++;
        }
      }
    }

    if (gCount + cCount > 0) {
      alert(`Importats: ${gCount} Gradients i ${cCount} Comentaris.`);
    } else {
      alert("No s'han trobat coincidències de noms de blocs. Revisa que els noms siguin exactes.");
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setSelectedIds(newSet);
  };

  const deleteSelected = async () => {
    if (!window.confirm(`Esborrar ${selectedIds.size} blocs?`)) return;
    await dataActions.blocks.delete(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const bulkSetTrims = async (trims: Trimester[]) => {
    if (!window.confirm(`Aplicar trimestres [${trims.join(',')}] a ${selectedIds.size} blocs?`)) return;
    for (const id of Array.from(selectedIds)) {
      const blockToUpdate = data.blocks.find(b => b.id === id);
      if (blockToUpdate) {
        await dataActions.blocks.update({ ...blockToUpdate, trimesters: trims });
      }
    }
    setSelectedIds(new Set());
  };

  const startEdit = (b: Block) => { setEditingId(b.id); setEditForm({ name: b.name, trims: b.trimesters }); };
  const saveEdit = async () => {
    if (editingId && editForm.name) {
      const blockToUpdate = data.blocks.find(b => b.id === editingId);
      if (blockToUpdate) {
        await dataActions.blocks.update({ ...blockToUpdate, name: editForm.name, trimesters: editForm.trims });
      }
      setEditingId(null);
    }
  };

  if (!selectedSubjectId && data.subjects.length > 0) {
    return <div className="p-8 text-center text-slate-400">Selecciona una àrea per gestionar els blocs.</div>;
  }
  if (data.subjects.length === 0) {
    return <div className="p-8 text-center text-slate-400">Primer crea una àrea a la pestanya Àrees.</div>;
  }

  return (
    <div className="space-y-6">
       {/* Top Controls */}
       <div className="flex flex-col md:flex-row gap-4 justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex-1">
             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Selecciona Àrea</label>
             <select 
               value={selectedSubjectId} 
               onChange={e => { setSelectedSubjectId(e.target.value); setSelectedIds(new Set()); setExpandedBlockId(null); }}
               className="w-full px-3 py-2 border border-slate-300 rounded-lg text-lg font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
             >
                {data.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
             </select>
          </div>
          <div className="flex flex-col items-end gap-2">
             <ImportSection label="Imp. Blocs" onImport={handleImportBlocks} helpContent={<div className="font-mono text-xs bg-slate-100 p-2 rounded">Nom Bloc, Trimestres<br/>Numeració, 1 2<br/>Càlcul, 1 2 3</div>} />
             <ImportSection label="Imp. Continguts" onImport={handleImportContent} helpContent={<div className="font-mono text-xs bg-slate-100 p-2 rounded">NomBloc; Tipus(G/C); Tag; Text<br/>Numeració; G; A; Assoliment Excel·lent...<br/>Numeració; C; Calc; Cal millorar càlcul...</div>} />
          </div>
       </div>

       {/* Add Block */}
       <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-wrap gap-4 items-end">
             <div className="flex-1 min-w-[200px]">
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nom del Bloc</label>
               <input type="text" value={newBlockName} onChange={e => setNewBlockName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: Resolució de problemes" />
             </div>
             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Trimestres</label>
               <div className="flex gap-2 bg-white px-2 py-2 border border-slate-300 rounded-lg">
                 {['1','2','3'].map(t => (
                   <label key={t} className="flex items-center gap-1 cursor-pointer select-none">
                     <input type="checkbox" checked={newBlockTrims.includes(t as Trimester)} onChange={e => {
                        if(e.target.checked) setNewBlockTrims([...newBlockTrims, t as Trimester]);
                        else setNewBlockTrims(newBlockTrims.filter(x => x !== t));
                     }} className="accent-blue-600"/>
                     <span className="text-sm font-medium text-slate-700">{t}T</span>
                   </label>
                 ))}
               </div>
             </div>
             <button onClick={addBlock} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"><Plus size={18}/> Afegir</button>
          </div>
       </div>

       {/* Bulk Actions */}
       {selectedIds.size > 0 && (
         <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg flex items-center justify-between animate-fade-in shadow-sm">
           <span className="font-medium text-blue-800 ml-2">{selectedIds.size} seleccionats</span>
           <div className="flex gap-3">
             <div className="flex items-center gap-1 bg-white border border-blue-300 rounded px-2">
                <span className="text-xs text-blue-800 font-medium">Assignar:</span>
                {['1','2','3'].map(t => (
                    <button key={t} onClick={() => bulkSetTrims([t as Trimester])} className="text-xs px-2 py-1 hover:bg-blue-100 rounded text-blue-700">{t}T</button>
                ))}
                <button onClick={() => bulkSetTrims(['1','2','3'])} className="text-xs px-2 py-1 hover:bg-blue-100 rounded text-blue-700 font-bold">Tots</button>
             </div>
             <button onClick={deleteSelected} className="flex items-center gap-1 text-sm bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 transition-colors">
               <Trash2 size={16} /> Esborrar
             </button>
           </div>
         </div>
       )}

       {/* List */}
       <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
         <div className="flex items-center px-4 py-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
             <div className="w-10 text-center"><Checkbox checked={selectedIds.size === activeBlocks.length && activeBlocks.length > 0} onChange={() => setSelectedIds(selectedIds.size===activeBlocks.length ? new Set() : new Set(activeBlocks.map(b=>b.id)))} /></div>
             <div className="w-8"></div>
             <div className="flex-1 px-4">Bloc</div>
             <div className="w-24 px-2">Trimestres</div>
             <div className="w-20 text-right">Accions</div>
         </div>
         <div className="divide-y divide-slate-100">
            {activeBlocks.map(b => (
              <div key={b.id} className="group">
                 <div className={`flex items-center px-4 py-3 hover:bg-slate-50 transition-colors ${selectedIds.has(b.id) ? 'bg-blue-50/50' : ''}`}>
                    <div className="w-10 text-center flex-shrink-0"><Checkbox checked={selectedIds.has(b.id)} onChange={() => toggleSelect(b.id)} /></div>
                    <div className="w-8 flex justify-center">
                       <button onClick={() => setExpandedBlockId(expandedBlockId === b.id ? null : b.id)} className={`p-1 rounded-full hover:bg-slate-200 transition-colors ${expandedBlockId===b.id ? 'rotate-90 text-blue-600' : 'text-slate-400'}`}>
                         <ChevronRight size={18} />
                       </button>
                    </div>

                    {editingId === b.id ? (
                      <>
                         <div className="flex-1 px-4"><input className="w-full border rounded px-2 py-1" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} autoFocus /></div>
                         <div className="w-24 px-2 flex gap-1">
                            {['1','2','3'].map(t => (
                              <label key={t} className="text-xs cursor-pointer"><input type="checkbox" checked={editForm.trims.includes(t as Trimester)} onChange={e => {
                                if(e.target.checked) setEditForm({...editForm, trims: [...editForm.trims, t as Trimester]});
                                else setEditForm({...editForm, trims: editForm.trims.filter(x=>x!==t)});
                              }}/>{t}</label>
                            ))}
                         </div>
                         <div className="w-20 px-2 flex justify-end gap-1">
                            <button onClick={saveEdit} className="text-emerald-500 hover:bg-emerald-50 p-1 rounded"><Check size={18}/></button>
                            <button onClick={() => setEditingId(null)} className="text-slate-400 hover:bg-slate-100 p-1 rounded"><X size={18}/></button>
                         </div>
                      </>
                    ) : (
                      <>
                        <div className="flex-1 px-4 font-medium text-slate-800 cursor-pointer" onClick={() => setExpandedBlockId(expandedBlockId === b.id ? null : b.id)}>{b.name}</div>
                        <div className="w-24 px-2 flex gap-1">
                           {b.trimesters.map(t => <span key={t} className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">{t}T</span>)}
                        </div>
                        <div className="w-20 px-2 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => startEdit(b)} className="text-slate-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50"><Edit2 size={18}/></button>
                           <button onClick={async () => {if(window.confirm('Esborrar?')) await dataActions.blocks.delete([b.id])}} className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50"><Trash2 size={18}/></button>
                        </div>
                      </>
                    )}
                 </div>
                 {/* Expanded Content */}
                 {expandedBlockId === b.id && (
                    <BlockContentEditor block={b} data={data} dataActions={dataActions} />
                 )}
              </div>
            ))}
            {activeBlocks.length === 0 && <div className="p-8 text-center text-slate-400 italic">No hi ha blocs en aquesta àrea.</div>}
         </div>
       </div>
    </div>
  );
};

export const Settings: React.FC<SettingsProps> = ({ data, user, onSave, onUpdateUser, onLogout, dataActions }) => {
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  return (
    <div className="flex flex-col md:flex-row gap-8 animate-fade-in">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 flex-shrink-0">
         <nav className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-row md:flex-col">
            <button onClick={() => setActiveTab('profile')} className={`flex-1 md:flex-none flex items-center px-6 py-4 text-sm font-medium border-l-4 transition-all ${activeTab === 'profile' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-transparent text-slate-600 hover:bg-slate-50'}`}>
              <User className="mr-3" size={18} /> Perfil
            </button>
            <button onClick={() => setActiveTab('students')} className={`flex-1 md:flex-none flex items-center px-6 py-4 text-sm font-medium border-l-4 transition-all ${activeTab === 'students' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-transparent text-slate-600 hover:bg-slate-50'}`}>
              Alumnes
            </button>
            <button onClick={() => setActiveTab('subjects')} className={`flex-1 md:flex-none flex items-center px-6 py-4 text-sm font-medium border-l-4 transition-all ${activeTab === 'subjects' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-transparent text-slate-600 hover:bg-slate-50'}`}>
              Àrees
            </button>
            <button onClick={() => setActiveTab('blocks')} className={`flex-1 md:flex-none flex items-center px-6 py-4 text-sm font-medium border-l-4 transition-all ${activeTab === 'blocks' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-transparent text-slate-600 hover:bg-slate-50'}`}>
              Blocs i Continguts
            </button>
         </nav>
      </aside>

      {/* Content Area */}
      <div className="flex-1 min-w-0">
         <h2 className="text-2xl font-bold text-slate-800 mb-6 border-b border-slate-200 pb-2">
            {activeTab === 'profile' && 'El meu Perfil'}
            {activeTab === 'students' && 'Gestió d\'Alumnes'}
            {activeTab === 'subjects' && 'Gestió d\'Àrees'}
            {activeTab === 'blocks' && 'Gestió de Blocs i Continguts'}
         </h2>
         
         {activeTab === 'profile' && <ProfileTab user={user} onUpdateUser={onUpdateUser} data={data} onSaveData={onSave} onLogout={onLogout} />}
         {activeTab === 'students' && <StudentsTab data={data} defaultCourse={user.currentCourse} dataActions={dataActions} />}
         {activeTab === 'subjects' && <SubjectsTab data={data} dataActions={dataActions} />}
         {activeTab === 'blocks' && <BlocksTab data={data} dataActions={dataActions} />}
      </div>
    </div>
  );
};