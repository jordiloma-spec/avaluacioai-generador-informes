import React, { useState } from 'react';
import { UserProfile, Course } from '../types';
import { loginUser, registerUser } from '../services/storageService';
import { User, Lock, Mail, School, BookOpen } from 'lucide-react';

interface LoginProps {
  onLogin: (user: UserProfile) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Register specific fields
  const [name, setName] = useState('');
  const [course, setCourse] = useState<Course>('1r');
  const [message, setMessage] = useState<{type: 'error' | 'success', text: string} | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (isRegistering) {
      try {
        if(!email || !name) throw new Error("Omple tots els camps.");
        const newUser = registerUser(email, name, course);
        setMessage({ type: 'success', text: `Registre complet! La teva contrasenya és: ${newUser.password}` });
        // Auto fill for login
        setPassword(newUser.password);
        setIsRegistering(false); 
      } catch (err: any) {
        setMessage({ type: 'error', text: err.message });
      }
    } else {
      const user = loginUser(email, password);
      if (user) {
        onLogin(user);
      } else {
        setMessage({ type: 'error', text: "Email o contrasenya incorrectes." });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-emerald-400 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
           <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500 mb-2">
             Avaluació<span className="font-light text-slate-600">AI</span>
           </h1>
           <p className="text-slate-500">
             {isRegistering ? "Crea el teu perfil docent" : "Benvingut/da de nou"}
           </p>
        </div>

        {message && (
          <div className={`p-4 mb-6 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
           {isRegistering && (
             <>
               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nom i Cognoms</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                      placeholder="Ex: Maria Vila"
                    />
                  </div>
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Curs Actual</label>
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select 
                      value={course}
                      onChange={(e) => setCourse(e.target.value as Course)}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white" 
                    >
                      {['1r', '2n', '3r', '4t', '5è', '6è'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
               </div>
             </>
           )}

           <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="correu@escola.cat"
                />
              </div>
           </div>

           {!isRegistering && (
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contrasenya</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                    placeholder="••••••••"
                  />
                </div>
             </div>
           )}

           <button 
             type="submit" 
             className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30"
           >
             {isRegistering ? "Registrar-se i Rebre Contrasenya" : "Entrar"}
           </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => { setIsRegistering(!isRegistering); setMessage(null); }}
            className="text-sm font-medium text-slate-500 hover:text-blue-600 underline"
          >
            {isRegistering ? "Ja tens compte? Inicia sessió" : "No tens compte? Registra't"}
          </button>
        </div>
      </div>
    </div>
  );
};
