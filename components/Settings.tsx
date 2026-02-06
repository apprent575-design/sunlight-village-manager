import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Moon, Sun, Globe, Shield, User, Check, AlertCircle, Loader2 } from 'lucide-react';

export const Settings = () => {
  const { t, theme, toggleTheme, language, setLanguage, updatePassword, user } = useApp();
  
  // Password Change State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passMessage, setPassMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMessage(null);

    if (newPassword.length < 6) {
        setPassMessage({ type: 'error', text: language === 'ar' ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters' });
        return;
    }

    if (newPassword !== confirmPassword) {
        setPassMessage({ type: 'error', text: language === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match' });
        return;
    }

    setIsChangingPass(true);
    try {
        await updatePassword(newPassword);
        setPassMessage({ type: 'success', text: language === 'ar' ? 'تم تحديث كلمة المرور بنجاح' : 'Password updated successfully' });
        setNewPassword('');
        setConfirmPassword('');
    } catch (error: any) {
        setPassMessage({ type: 'error', text: error.message || 'Failed to update password' });
    } finally {
        setIsChangingPass(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div className="flex items-end justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
            <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white tracking-tight">{t('settings')}</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your preferences and account security</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Profile Card */}
        <div className="glass p-8 rounded-3xl relative overflow-hidden group hover:shadow-glow transition-all duration-500">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                <User size={140} />
            </div>
            <div className="relative z-10">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold mb-6 shadow-lg shadow-primary-500/30 ring-4 ring-white dark:ring-slate-800">
                    {user?.full_name?.charAt(0) || 'U'}
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-1">{user?.full_name || 'Admin User'}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-mono bg-white/60 dark:bg-slate-800/60 w-fit px-3 py-1 rounded-lg border border-gray-100 dark:border-gray-700">
                    {user?.email}
                </p>
                <div className="mt-8 flex gap-2">
                    <span className="px-4 py-1.5 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
                        Active Account
                    </span>
                    <span className="px-4 py-1.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
                        Admin
                    </span>
                </div>
            </div>
        </div>

        {/* Appearance Card */}
        <div className="glass p-8 rounded-3xl flex flex-col justify-center space-y-8">
             {/* Theme Toggle - PRESERVED RTL FIX */}
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-100 dark:bg-slate-700 text-orange-600 dark:text-orange-400 rounded-2xl shadow-sm">
                        {theme === 'light' ? <Sun size={24} /> : <Moon size={24} />}
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-800 dark:text-white text-lg">{t('theme')}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{theme === 'dark' ? t('darkMode') : t('lightMode')}</p>
                    </div>
                </div>
                
                {/* Fixed Toggle for RTL */}
                <button 
                  onClick={toggleTheme}
                  dir="ltr"
                  className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75 ${theme === 'dark' ? 'bg-primary-600' : 'bg-gray-200'}`}
                >
                  <span className="sr-only">Use setting</span>
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`}
                  />
                </button>
             </div>

             <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent"></div>

             {/* Language Toggle */}
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-slate-700 text-blue-600 dark:text-blue-400 rounded-2xl shadow-sm">
                        <Globe size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-800 dark:text-white text-lg">{t('language')}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Interface language</p>
                    </div>
                </div>
                <div className="flex bg-gray-100 dark:bg-slate-800 p-1.5 rounded-xl border border-gray-200 dark:border-gray-700">
                    <button 
                        onClick={() => setLanguage('en')}
                        className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${language === 'en' ? 'bg-white dark:bg-slate-600 shadow-sm text-primary-600 dark:text-white transform scale-105' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                        EN
                    </button>
                    <button 
                        onClick={() => setLanguage('ar')}
                        className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${language === 'ar' ? 'bg-white dark:bg-slate-600 shadow-sm text-primary-600 dark:text-white transform scale-105' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                        AR
                    </button>
                </div>
             </div>
        </div>

        {/* Security / Change Password - Full Width */}
        <div className="md:col-span-2 glass p-8 rounded-3xl border border-white/50 dark:border-white/10 relative overflow-hidden">
             {/* Decorative Blur */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

             <div className="flex items-start gap-4 mb-8">
                 <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-2xl border border-red-100 dark:border-red-800/30">
                     <Shield size={28} />
                 </div>
                 <div>
                     <h3 className="text-xl font-bold text-gray-800 dark:text-white">Security & Password</h3>
                     <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Ensure your account uses a strong, unique password.</p>
                 </div>
             </div>

             <form onSubmit={handlePasswordChange} className="max-w-xl relative z-10">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                     <div className="space-y-2">
                         <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 ml-1">New Password</label>
                         <input 
                            type="password" 
                            className="w-full p-4 rounded-2xl border bg-white/60 dark:bg-slate-900/60 border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500 transition-all backdrop-blur-sm"
                            placeholder="Min. 6 characters"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                         />
                     </div>
                     <div className="space-y-2">
                         <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 ml-1">Confirm Password</label>
                         <input 
                            type="password" 
                            className="w-full p-4 rounded-2xl border bg-white/60 dark:bg-slate-900/60 border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500 transition-all backdrop-blur-sm"
                            placeholder="Repeat password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                         />
                     </div>
                 </div>

                 {passMessage && (
                     <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 text-sm font-medium animate-in slide-in-from-left-2 ${passMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                         {passMessage.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
                         {passMessage.text}
                     </div>
                 )}

                 <button 
                    type="submit" 
                    disabled={isChangingPass || !newPassword}
                    className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-8 py-4 rounded-2xl font-bold hover:bg-gray-800 dark:hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-gray-200 dark:shadow-none hover:shadow-xl hover:-translate-y-0.5"
                 >
                    {isChangingPass ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                    Update Password
                 </button>
             </form>
        </div>

      </div>
    </div>
  );
};