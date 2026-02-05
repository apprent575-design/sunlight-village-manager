import React from 'react';
import { useApp } from '../context/AppContext';
import { Moon, Sun, Globe } from 'lucide-react';

export const Settings = () => {
  const { t, theme, toggleTheme, language, setLanguage } = useApp();

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h2 className="text-3xl font-bold text-gray-800 dark:text-white">{t('settings')}</h2>

      <div className="glass rounded-2xl p-8 space-y-8">
        {/* Appearance */}
        <div>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-700 dark:text-gray-200">
            <Sun size={20} /> Appearance
          </h3>
          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-gray-700">
            <span className="dark:text-white">{t('theme')}</span>
            <button 
              onClick={toggleTheme}
              dir="ltr" 
              className={`
                relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none
                ${theme === 'dark' ? 'bg-primary-600' : 'bg-gray-300'}
              `}
            >
              <span
                className={`
                  inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform
                  ${theme === 'dark' ? 'translate-x-7' : 'translate-x-1'}
                `}
              />
            </button>
          </div>
        </div>

        {/* Language */}
        <div>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-700 dark:text-gray-200">
            <Globe size={20} /> {t('language')}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setLanguage('en')}
              className={`p-4 rounded-xl border-2 transition-all ${language === 'en' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 dark:border-gray-700 dark:text-gray-300'}`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage('ar')}
              className={`p-4 rounded-xl border-2 transition-all font-sans ${language === 'ar' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 dark:border-gray-700 dark:text-gray-300'}`}
            >
              العربية
            </button>
          </div>
        </div>

        {/* Password (Stub) */}
        <div>
           <h3 className="text-lg font-bold mb-4 text-gray-700 dark:text-gray-200">Security</h3>
           <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-gray-700">
             <p className="text-sm text-gray-500 mb-4">Change your account password</p>
             <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm font-medium dark:text-white">Change Password</button>
           </div>
        </div>
      </div>
    </div>
  );
};