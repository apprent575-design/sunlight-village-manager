
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LogIn, UserPlus, AlertCircle, ArrowRight, Lock, CheckCircle } from 'lucide-react';

export const Auth = () => {
  const { login, signup, t, language } = useApp();
  
  // UI State
  const [isLogin, setIsLogin] = useState(true);
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password, fullName);
        // On success, show confirmation message
        setSuccessMsg(language === 'ar' 
            ? "تم إنشاء الحساب بنجاح! يرجى مراجعة بريدك الإلكتروني (بما في ذلك مجلد الرسائل غير المرغوب فيها) لتأكيد وتفعيل الحساب قبل تسجيل الدخول."
            : "Registration successful! Please check your email (including spam folder) to confirm and activate your account before logging in.");
        setIsLogin(true); // Switch back to login view
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
             {isLogin ? 'Welcome Back!' : 'Start your journey'}
           </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-200 rounded-2xl flex items-start gap-3 text-sm border border-red-100 dark:border-red-800/50 animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-200 rounded-2xl flex items-start gap-3 text-sm border border-green-100 dark:border-green-800/50 animate-in fade-in slide-in-from-top-2">
            <CheckCircle size={18} className="shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div className="animate-in slide-in-from-bottom-5 fade-in duration-300">
               <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1.5 ml-1">{t('fullName')}</label>
               <input 
                  type="text" 
                  required={!isLogin}
                  className="w-full p-3.5 rounded-2xl border bg-gray-50/50 dark:bg-slate-800/50 border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-gray-900 dark:text-white placeholder:text-gray-400"
                  placeholder="John Doe"
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
              placeholder="user@example.com"
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
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white p-4 rounded-2xl font-bold shadow-xl shadow-primary-600/30 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex justify-center items-center gap-2 mt-8"
          >
            {loading ? (
                <span className="animate-pulse">Processing...</span>
            ) : (
                <>
                  {isLogin ? t('signIn') : t('signUp')}
                  <ArrowRight size={20} />
                </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center space-y-4">
            <button 
                onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); setSuccessMsg(''); }}
                className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
                {isLogin ? t('noAccount') : t('haveAccount')} <span className="underline decoration-2 decoration-primary-400 underline-offset-4">{isLogin ? t('signUp') : t('signIn')}</span>
            </button>
        </div>
      </div>
    </div>
  );
};
