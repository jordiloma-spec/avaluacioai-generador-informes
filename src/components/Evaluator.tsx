import React, { useState, useEffect } from 'react';
import { AppData, Student, Subject, Trimester, EvaluationState, Block, UserProfile } from '../types';
import { generatePrompt, fetchReportFromGemini } from '../../services/geminiService';
import { checkDailyLimit, incrementDailyUsage } from '../../services/storageService';
import { Loader2, RefreshCw, FileText, ChevronLeft, User, BookOpen, Clock, Crown, AlertCircle, Copy } from 'lucide-react';
import toast from 'react-hot-toast'; // Importa react-hot-toast

interface EvaluatorProps {
  data: AppData;
  user: UserProfile;
  onUpdateUser: (u: Partial<UserProfile>) => void; // Changed to Partial<UserProfile>
}

export const Evaluator: React.FC<EvaluatorProps> = ({ data, user, onUpdateUser }) => {
  // Selection State
  const [trimester, setTrimester] = useState<Trimester | ''>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');

  // Evaluation State: { [blockId]: { gradientId, commentIds[] } }
  const [evaluations, setEvaluations] = useState<EvaluationState>({});

  // Result State
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [geminiReport, setGeminiReport] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);

  // Computed
  const selectedStudent = data.students.find(s => s.id === selectedStudentId);
  const selectedSubject = data.subjects.find(s => s.id === selectedSubjectId);

  // Filter blocks based on subject AND trimester
  const activeBlocks = data.blocks.filter(b => 
    b.subject_id === selectedSubjectId && 
    (trimester === '' || b.trimesters.includes(trimester as Trimester))
  );

  const handleBlockChange = (blockId: string, field: 'gradientId' | 'commentIds', value: string | string[]) => {
    setEvaluations(prev => ({
      ...prev,
      [blockId]: {
        ...prev[blockId],
        gradientId: field === 'gradientId' ? value as string : (prev[blockId]?.gradientId || null),
        commentIds: field === 'commentIds' ? value as string[] : (prev[blockId]?.commentIds || [])
      }
    }));
  };

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success(message)) // Changed alert to toast.success
      .catch(err => {
        console.error('Error copiant text:', err);
        toast.error('Error copiant el text.'); // Added error toast
      });
  };

  const handleGenerate = async () => {
    if (!selectedStudent || !selectedSubject || !trimester) return;

    // Check Limits
    if (!checkDailyLimit(user)) {
      setShowLimitModal(true);
      return;
    }
    setShowLimitModal(false);

    setLoading(true);
    setGeminiReport(''); // Clear previous report
    setGeneratedPrompt(''); // Clear previous prompt

    const prompt = generatePrompt(
      selectedStudent,
      selectedSubject,
      trimester as Trimester,
      activeBlocks,
      data.gradients,
      data.comments,
      evaluations,
      user.gender 
    );

    setGeneratedPrompt(prompt); // Display the generated prompt immediately

    try {
      const report = await fetchReportFromGemini(prompt, user.geminiApiKey); // Pass user's API key
      setGeminiReport(report);
      
      // Increment Usage on success and persist to Supabase via onUpdateUser
      const updatedUser = incrementDailyUsage(user);
      await onUpdateUser(updatedUser); // Persist the updated dailyUsage to Supabase

    } catch (e) {
      setGeminiReport('Error connectant amb Gemini.');
      toast.error('Error generant l\'informe amb Gemini.'); // Added error toast
    } finally {
      setLoading(false);
    }
  };

  const resetSubject = () => {
    setSelectedSubjectId('');
    setEvaluations({});
    setGeneratedPrompt(''); // Clear report when changing subject
    setGeminiReport('');
    setShowLimitModal(false);
  };

  const resetStudent = () => {
    setSelectedStudentId('');
    resetSubject();
  };

  // Reusable Header
  const InfoHeader = () => (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-wrap gap-4 items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-6 text-sm">
         <div className="flex items-center gap-2 text-slate-600">
           <Clock size={16} className="text-blue-500"/> 
           <span className="font-semibold text-slate-900">{trimester}r Trimestre</span>
         </div>
         <div className="flex items-center gap-2 text-slate-600">
           <User size={16} className="text-blue-500"/>
           <span className="font-semibold text-slate-900">{selectedStudent?.name}</span>
         </div>
         <div className="flex items-center gap-2 text-slate-600">
           <BookOpen size={16} className="text-blue-500"/>
           <span className="font-semibold text-slate-900">{selectedSubject?.name}</span>
         </div>
      </div>
      <div className="flex gap-2">
        <button onClick={resetSubject} className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
          Canviar Àrea
        </button>
        <button onClick={resetStudent} className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
          Canviar Alumne
        </button>
      </div>
    </div>
  );

  // -- RENDER STEPS --

  // 1. SELECT TRIMESTER
  if (!trimester) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-6 animate-fade-in">
        <h2 className="text-2xl font-bold text-slate-700">Quin trimestre avalues?</h2>
        <div className="flex gap-4">
          {(['1', '2', '3'] as Trimester[]).map((t) => (
            <button
              key={t}
              onClick={() => setTrimester(t)}
              className="px-8 py-6 text-xl font-bold bg-white border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:text-blue-600 hover:shadow-lg transition-all"
            >
              {t}r Trimestre
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 2. SELECT STUDENT
  if (!selectedStudentId) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
           <button onClick={() => setTrimester('')} className="p-2 text-slate-400 hover:text-slate-600">
             <ChevronLeft />
           </button>
           <h2 className="text-2xl font-bold text-slate-700">Tria un alumne</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {data.students.map((student) => (
            <button
              key={student.id}
              onClick={() => setSelectedStudentId(student.id)}
              className="p-6 text-left bg-white border border-slate-200 rounded-xl hover:border-blue-500 hover:shadow-md transition-all group"
            >
              <div className="font-bold text-lg text-slate-800 group-hover:text-blue-600">{student.name}</div>
              <div className="text-sm text-slate-500 capitalize">{student.course} - {student.gender}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 3. SELECT SUBJECT
  if (!selectedSubjectId) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setSelectedStudentId('')} className="p-2 text-slate-400 hover:text-slate-600">
              <ChevronLeft />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-slate-700">Tria una àrea</h2>
              <p className="text-slate-500">Alumne: <span className="font-medium text-slate-900">{selectedStudent?.name}</span> ({trimester}r Trim)</p>
            </div>
          </div>
          <button onClick={resetStudent} className="text-sm text-red-500 hover:underline">Canviar Alumne</button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {data.subjects.map((subj) => (
            <button
              key={subj.id}
              onClick={() => setSelectedSubjectId(subj.id)}
              className="p-6 text-left bg-white border border-slate-200 rounded-xl hover:border-emerald-500 hover:shadow-md transition-all group"
            >
              <div className="font-bold text-lg text-slate-800 group-hover:text-emerald-600">{subj.name}</div>
              <div className="text-sm text-slate-500">{data.blocks.filter(b => b.subject_id === subj.id && b.trimesters.includes(trimester)).length} blocs disponibles</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 4. EVALUATION FORM & RESULT
  return (
    <div className="pb-24 animate-fade-in relative">
      <InfoHeader />

      {/* Limit Alert Modal */}
      {showLimitModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full text-center space-y-4 animate-fade-in">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="text-red-600" size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Límit diari assolit</h3>
            <p className="text-sm text-slate-600">
              Has arribat al límit de 5 informes diaris del pla gratuït. Actualitza a Premium per a ús il·limitat.
            </p>
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => setShowLimitModal(false)}
                className="w-full py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
              >
                Entesos (Anar a Perfil)
              </button>
              <button 
                onClick={() => setShowLimitModal(false)}
                className="w-full py-2 text-slate-500 hover:text-slate-800"
              >
                Tancar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Blocks List */}
      <div className="space-y-8">
        {activeBlocks.length === 0 ? (
          <div className="text-center py-12 text-slate-400 italic">
            No hi ha blocs definits per a aquest trimestre en aquesta àrea.
          </div>
        ) : (
          activeBlocks.map((block) => {
            const blockGradients = data.gradients.filter(g => g.block_id === block.id); 
            const blockComments = data.comments.filter(c => c.block_id === block.id); 
            const currentEval = evaluations[block.id] || { gradientId: null, commentIds: [] };

            return (
              <div key={block.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                  <h3 className="font-bold text-lg text-slate-800">{block.name}</h3>
                </div>
                
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Gradients */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Avaluació (Gradient)</h4>
                    <div className="space-y-2">
                      {blockGradients.length === 0 && <p className="text-sm text-slate-400 italic">No hi ha gradients definits.</p>}
                      {blockGradients.map((g) => (
                        <label key={g.id} className={`flex items-start p-3 rounded-lg border cursor-pointer transition-all ${currentEval.gradientId === g.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300'}`}>
                          <input 
                            type="radio" 
                            name={`grad-${block.id}`} 
                            className="mt-1 w-4 h-4 text-blue-600"
                            checked={currentEval.gradientId === g.id}
                            onChange={() => handleBlockChange(block.id, 'gradientId', g.id)}
                          />
                          <div className="ml-3">
                             <span className="block font-bold text-sm text-slate-700">{g.tag}</span>
                             <span className="block text-xs text-slate-500">{g.text}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Comments */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Comentaris (Màx 3)</h4>
                    <div className="space-y-2">
                      {blockComments.length === 0 && <p className="text-sm text-slate-400 italic">No hi ha comentaris definits.</p>}
                      {blockComments.map((c) => {
                        const isSelected = currentEval.commentIds.includes(c.id);
                        return (
                          <label key={c.id} className={`flex items-start p-3 rounded-lg border cursor-pointer transition-all ${isSelected ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-emerald-300'}`}>
                            <input 
                              type="checkbox" 
                              className="mt-1 w-4 h-4 text-emerald-600 rounded"
                              checked={isSelected}
                              onChange={(e) => {
                                const newIds = e.target.checked
                                  ? [...currentEval.commentIds, c.id].slice(0, 3) // Max 3
                                  : currentEval.commentIds.filter(id => id !== c.id);
                                handleBlockChange(block.id, 'commentIds', newIds);
                              }}
                            />
                             <div className="ml-3">
                               <span className="block font-bold text-sm text-slate-700">{c.tag}</span>
                               <span className="block text-xs text-slate-500">{c.text}</span>
                             </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Generated Report Section */}
      {(generatedPrompt || geminiReport) && (
        <div className="mt-12 p-6 bg-white rounded-xl border border-slate-200 shadow-sm space-y-6 animate-fade-in">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="text-blue-500" size={24} /> Informe Generat
          </h3>

          {loading ? (
            <div className="flex items-center justify-center text-slate-500 py-8">
              <Loader2 className="animate-spin mr-2" size={24} /> Generant informe...
            </div>
          ) : (
            <>
              {/* Gemini Report */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-700">Informe de l'IA:</h4>
                  {geminiReport && (
                    <button 
                      onClick={() => copyToClipboard(geminiReport, 'Informe copiat!')}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                    >
                      <Copy size={14} /> Copiar
                    </button>
                  )}
                </div>
                <div className="whitespace-pre-wrap bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm text-slate-700">
                  {geminiReport || <p className="text-red-500">No s'ha pogut generar l'informe.</p>}
                </div>
              </div>

              {/* Generated Prompt */}
              <div className="space-y-2 mt-6 pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-700">Prompt enviat a Gemini:</h4>
                  {generatedPrompt && (
                    <button 
                      onClick={() => copyToClipboard(generatedPrompt, 'Prompt copiat!')}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                    >
                      <Copy size={14} /> Copiar
                    </button>
                  )}
                </div>
                <div className="whitespace-pre-wrap bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs text-slate-600">
                  {generatedPrompt || <p className="text-slate-400">No s'ha generat cap prompt.</p>}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Sticky Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-slate-200 z-50 flex justify-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <button
          onClick={handleGenerate}
          disabled={activeBlocks.length === 0}
          className="bg-blue-600 text-white font-bold text-lg px-12 py-3 rounded-full hover:bg-blue-700 shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1 flex items-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" /> : <><RefreshCw size={20}/> GENERAR INFORME</>}
        </button>
      </div>
    </div>
  );
};