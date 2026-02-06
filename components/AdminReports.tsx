
import React from 'react';
import { useApp } from '../context/AppContext';
import { FileText, Download, TrendingUp, Users } from 'lucide-react';
import { format, addDays, parseISO, isAfter } from 'date-fns';
import { generateAdminReport } from '../utils/pdfGenerator';

export const AdminReports = () => {
  const { t, state, language } = useApp();

  // Simple Stats Calculation
  const clients = state.allUsers.filter(u => u.role !== 'admin');
  const activeSubs = clients.filter(u => {
     if(!u.subscription) return false;
     const end = addDays(parseISO(u.subscription.start_date), u.subscription.duration_days);
     return isAfter(end, new Date()) && u.subscription.status !== 'paused';
  }).length;
  const totalRevenue = clients.reduce((sum, u) => sum + (u.subscription?.price || 0), 0);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800 dark:text-white">{t('adminReports')}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Main Subscription Report Card */}
        <div className="glass p-6 rounded-2xl flex flex-col justify-between h-auto min-h-[14rem] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform">
             <FileText size={120} />
          </div>
          
          <div className="relative z-10">
             <div className="p-3 bg-indigo-100 dark:bg-indigo-900 w-fit rounded-xl mb-4 text-indigo-600 dark:text-indigo-300">
                <FileText size={28} />
             </div>
             <h3 className="text-2xl font-bold dark:text-white">{t('subscriptionReport')}</h3>
             <p className="text-gray-500 text-sm mt-2 max-w-xs">{t('subscriptionReportDesc')}</p>
          </div>
          
          <button 
            onClick={() => generateAdminReport(state.allUsers, language, t)}
            className="relative z-10 flex items-center justify-center gap-2 w-full p-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/30 transition-all font-bold mt-6"
          >
            <Download size={20} /> {t('downloadPDF')}
          </button>
        </div>

        {/* Quick Snapshot Card */}
        <div className="glass p-6 rounded-2xl h-auto min-h-[14rem]">
            <h3 className="text-lg font-bold mb-6 dark:text-white">{t('snapshot')}</h3>
            <div className="space-y-4">
                
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                            <Users size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold">{t('totalClients')}</p>
                            <p className="text-xl font-bold text-gray-800 dark:text-white">{clients.length}</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-lg">
                            <TrendingUp size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold">{t('revenue')}</p>
                            <p className="text-xl font-bold text-gray-800 dark:text-white">{totalRevenue.toLocaleString()} {t('currency')}</p>
                        </div>
                    </div>
                </div>

                 <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg">
                            <FileText size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold">{t('active')}</p>
                            <p className="text-xl font-bold text-gray-800 dark:text-white">{activeSubs}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
