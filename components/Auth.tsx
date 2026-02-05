import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserPlus, LogIn, AlertCircle } from 'lucide-react';

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
      {/* Background decoration */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/20 blur-[100px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-400/20 blur-[100px]" />

      <div className="glass p-8 rounded-3xl w-full max-w-md shadow-2xl border border-white/50 dark:border-gray-700 z-10 transition-all duration-300">
        <div className="text-center mb-8">
           <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-400 mb-2">Sunlight VM</h1>
           <p className="text-gray-500 dark:text-gray-400">
             {isLoginMode ? 'Welcome back! Please sign in.' : 'Create an account to get started.'}
           </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-xl flex items-center gap-2 text-sm">
            <AlertCircle size={16} />
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {!isLoginMode && (
             <div className="animate-in fade-in slide-in-from-top-2">
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Full Name</label>
                <input 
                  type="text" 
                  required={!isLoginMode}
                  className="w-full p-3 rounded-xl border bg-white/50 dark:bg-slate-800 border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500 transition-all text-gray-900 dark:text-white"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
             </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">{t('email')}</label>
            <input 
              type="email" 
              required
              className="w-full p-3 rounded-xl border bg-white/50 dark:bg-slate-800 border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500 transition-all text-gray-900 dark:text-white"
              placeholder="admin@sunlight.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div>
             <label className="block text-sm font-medium mb-1 dark:text-gray-300">{t('password')}</label>
             <input 
              type="password" 
              required
              className="w-full p-3 rounded-xl border bg-white/50 dark:bg-slate-800 border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500 transition-all text-gray-900 dark:text-white"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
             />
          </div>

          {!isLoginMode && (
             <div className="animate-in fade-in slide-in-from-top-2">
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Confirm Password</label>
                <input 
                  type="password" 
                  required={!isLoginMode}
                  className="w-full p-3 rounded-xl border bg-white/50 dark:bg-slate-800 border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500 transition-all text-gray-900 dark:text-white"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
             </div>
          )}
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white p-3 rounded-xl font-bold shadow-lg shadow-primary-500/30 transition-all flex justify-center items-center gap-2 mt-6"
          >
            {loading ? (
                <span className="animate-pulse">Processing...</span>
            ) : (
                <>
                  {isLoginMode ? <LogIn size={20} /> : <UserPlus size={20} />}
                  {isLoginMode ? t('signIn') : 'Create Account'}
                </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
                {isLoginMode ? "Don't have an account?" : "Already have an account?"}
                <button 
                    onClick={() => { setIsLoginMode(!isLoginMode); setErrorMsg(''); }}
                    className="ml-2 text-primary-600 dark:text-primary-400 font-bold hover:underline focus:outline-none"
                >
                    {isLoginMode ? 'Sign Up' : 'Sign In'}
                </button>
            </p>
        </div>
      </div>
    </div>
  );
};