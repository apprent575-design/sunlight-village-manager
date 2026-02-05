import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  LayoutDashboard, 
  Calendar, 
  BookOpen, 
  DollarSign, 
  PieChart, 
  Settings, 
  Menu, 
  X,
  Home,
  LogOut,
  Sun,
  Moon,
  Languages
} from 'lucide-react';

export const Layout = ({ children }: { children?: React.ReactNode }) => {
  const { t, theme, toggleTheme, language, setLanguage, logout, isRTL } = useApp();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: t('dashboard') },
    { path: '/bookings', icon: BookOpen, label: t('bookings') },
    { path: '/calendar', icon: Calendar, label: t('calendar') },
    { path: '/expenses', icon: DollarSign, label: t('expenses') },
    { path: '/reports', icon: PieChart, label: t('reports') },
    { path: '/units', icon: Home, label: t('units') },
    { path: '/settings', icon: Settings, label: t('settings') },
  ];

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:sticky top-0 h-screen w-64 glass z-30 transition-transform duration-300 ease-in-out
        ${isRTL ? 'right-0' : 'left-0'}
        ${sidebarOpen ? 'translate-x-0' : (isRTL ? 'translate-x-full' : '-translate-x-full')}
        md:translate-x-0
        flex flex-col
      `}>
        <div className="p-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-teal-400">
            Sunlight VM
          </h1>
          <button onClick={toggleSidebar} className="md:hidden text-gray-500">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 py-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center px-4 py-3 rounded-xl transition-all duration-200
                  ${isActive 
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-slate-800/50'}
                `}
              >
                <item.icon size={20} className={isRTL ? 'ml-3' : 'mr-3'} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100 dark:border-gray-800">
            {/* Theme-aware footer container: Blue tint in dark mode */}
            <div className="p-4 rounded-2xl bg-primary-50 dark:bg-sky-900/20 border border-primary-100 dark:border-sky-800/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary-600 dark:text-sky-400 uppercase tracking-wider">{t('settings')}</span>
                <div className="flex gap-1">
                    <button 
                      onClick={toggleTheme}
                      className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-sky-900/40 text-gray-500 dark:text-sky-300 transition-colors shadow-sm"
                    >
                      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                    </button>
                    <button 
                      onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
                      className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-sky-900/40 text-gray-500 dark:text-sky-300 font-bold text-xs transition-colors shadow-sm w-8"
                    >
                      {language === 'en' ? 'AR' : 'EN'}
                    </button>
                </div>
              </div>
              
              <button 
                onClick={logout}
                className="w-full flex items-center justify-center px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400 rounded-xl transition-all shadow-sm border border-gray-100 dark:border-slate-700 font-medium text-sm group"
              >
                <LogOut size={16} className={`${isRTL ? 'ml-2' : 'mr-2'} group-hover:scale-110 transition-transform`} />
                {t('logout')}
              </button>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden glass sticky top-0 z-10 p-4 flex items-center justify-between">
          <button onClick={toggleSidebar} className="text-gray-600 dark:text-gray-300">
            <Menu size={24} />
          </button>
          <span className="font-bold text-gray-800 dark:text-white">Sunlight VM</span>
          <div className="w-6" /> {/* Spacer */}
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          {children}
        </div>
      </main>
    </div>
  );
};