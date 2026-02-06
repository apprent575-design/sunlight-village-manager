import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserPlus, LogIn, AlertCircle, ArrowRight } from 'lucide-react';

export const Auth = () => {
  const { login, signup, t } = useApp();
  const [isLoginMode, setIsLoginMode] = useState(true);
  
  // Form State
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (isLoginMode) {
        await login(email, password);
      } else {
        if (password !== confirmPassword) {
            setErrorMsg("Passwords do not match");
            setLoading(false);
            return;
        }
        await signup(email, password, fullName);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-slate-900 p-4 relative overflow-hidden">
      
      {/* Animated Background Blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] rounded-full bg-blue-400/30 mix-blend-multiply filter blur-[128px] animate-[pulse_8s_ease-in-out_infinite]" />
          <div className="absolute top-[20%] right-[-10%] w-[35rem] h-[35rem] rounded-full bg-purple-400/30 mix-blend-multiply filter blur-[128px] animate-[pulse_10s_ease-in-out_infinite_2s]" />
          <div className="absolute bottom-[-10%] left-[20%] w-[45rem] h-[45rem] rounded-full bg-teal-400/20 mix-blend-multiply filter blur-[128px] animate-[pulse_12s_ease-in-out_infinite_4s]" />
      </div>

      <div className="glass p-8 md:p-12 rounded-[2.5rem] w-full max-w-[440px] shadow-2xl border border-white/40 dark:border-white/10 z-10 backdrop-blur-xl relative">
        <div className="text-center mb-10">
           <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-2xl mx-auto mb-6 shadow-lg shadow-blue-500/30 flex items-center justify-center transform rotate-3">
              <span className="text-3xl">☀️</span>
           </div>
           <h1 className="text-4xl font-black text-gray-800 dark:text-white tracking-tight mb-2">Sunlight</h1>
           <p className="text-gray-500 dark:text-gray-400 font-medium">
             {isLoginMode ? 'Sign in to manage your village.' : 'Join the management team.'}
           </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-200 rounded-2xl flex items-start gap-3 text-sm border border-red-100 dark:border-red-800/50">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {!isLoginMode && (
             <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1.5 ml-1">Full Name</label>
                <input 
                  type="text" 
                  required={!isLoginMode}
                  className="w-full p-3.5 rounded-2xl border bg-gray-50/50 dark:bg-slate-800/50 border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-gray-900 dark:text-white placeholder:text-gray-400"
                  placeholder="e.g. John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
             </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1.5 ml-1">{t('email')}</label>
            <input 
              type="email" 
              required
              className="w-full p-3.5 rounded-2xl border bg-gray-50/50 dark:bg-slate-800/50 border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-gray-900 dark:text-white placeholder:text-gray-400"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div>
             <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1.5 ml-1">{t('password')}</label>
             <input 
              type="password" 
              required
              className="w-full p-3.5 rounded-2xl border bg-gray-50/50 dark:bg-slate-800/50 border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-gray-900 dark:text-white placeholder:text-gray-400 tracking-widest"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
             />
          </div>

          {!isLoginMode && (
             <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1.5 ml-1">Confirm Password</label>
                <input 
                  type="password" 
                  required={!isLoginMode}
                  className="w-full p-3.5 rounded-2xl border bg-gray-50/50 dark:bg-slate-800/50 border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-gray-900 dark:text-white placeholder:text-gray-400 tracking-widest"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
             </div>
          )}
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white p-4 rounded-2xl font-bold shadow-xl shadow-primary-600/30 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex justify-center items-center gap-2 mt-8"
          >
            {loading ? (
                <span className="animate-pulse">Processing...</span>
            ) : (
                <>
                  {isLoginMode ? t('signIn') : 'Create Account'}
                  <ArrowRight size={20} />
                </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                {isLoginMode ? "New to Sunlight?" : "Already have an account?"}
                <button 
                    onClick={() => { setIsLoginMode(!isLoginMode); setErrorMsg(''); }}
                    className="ml-2 text-primary-600 dark:text-primary-400 font-bold hover:text-primary-700 transition-colors focus:outline-none"
                >
                    {isLoginMode ? 'Create Account' : 'Sign In'}
                </button>
            </p>
        </div>
      </div>
    </div>
  );
};