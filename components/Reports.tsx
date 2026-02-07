
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FileText, Download, Calendar, Coins } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { generateFinancialReport, generateOccupancyReport, generateVillageFeesReport } from '../utils/pdfGenerator';

export const Reports = () => {
  const { t, state, language } = useApp();
  
  // Filters
  const [filterStart, setFilterStart] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [filterEnd, setFilterEnd] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [selectedUnit, setSelectedUnit] = useState<string>('all');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">{t('reports')}</h2>
        
        {/* Filters Area */}
        <div className="glass p-3 rounded-2xl flex flex-wrap gap-3 items-center bg-white/40 dark:bg-slate-800/40">
            <div className="flex items-center gap-2 px-2">
                <Calendar size={18} className="text-gray-500" />
                <span className="text-sm font-bold text-gray-600 dark:text-gray-300 hidden md:block">{t('dates')}:</span>
            </div>
            <input 
                type="date" 
                className="bg-white dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 ring-primary-500 dark:text-white"
                value={filterStart}
                onChange={(e) => setFilterStart(e.target.value)}
            />
            <span className="text-gray-400">→</span>
            <input 
                type="date" 
                className="bg-white dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 ring-primary-500 dark:text-white"
                value={filterEnd}
                onChange={(e) => setFilterEnd(e.target.value)}
            />
            
            <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-2 hidden md:block"></div>

            <select
                className="bg-white dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 ring-primary-500 dark:text-white"
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
            >
                <option value="all">{t('allUnits')}</option>
                {state.units.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                ))}
            </select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Financial Report */}
        <div className="glass p-6 rounded-2xl flex flex-col justify-between h-auto min-h-[14rem] transition-transform hover:-translate-y-1 hover:shadow-lg">
          <div>
             <div className="p-3 bg-blue-100 dark:bg-blue-900 w-fit rounded-xl mb-4">
                <FileText className="text-blue-600 dark:text-blue-300" size={24} />
             </div>
             <h3 className="text-xl font-bold dark:text-white">{t('financialSummary')}</h3>
             <p className="text-gray-500 text-sm mt-2 mb-4">{t('financialSummaryDesc')}</p>
          </div>
          <button 
            onClick={() => generateFinancialReport(state.units, state.bookings, state.expenses, language, t, filterStart, filterEnd, selectedUnit)}
            className="flex items-center justify-center gap-2 w-full p-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 font-bold"
          >
            <Download size={20} /> {t('downloadPDF')}
          </button>
        </div>

        {/* Occupancy Report */}
        <div className="glass p-6 rounded-2xl flex flex-col justify-between h-auto min-h-[14rem] transition-transform hover:-translate-y-1 hover:shadow-lg">
          <div>
             <div className="p-3 bg-purple-100 dark:bg-purple-900 w-fit rounded-xl mb-4">
                <FileText className="text-purple-600 dark:text-purple-300" size={24} />
             </div>
             <h3 className="text-xl font-bold dark:text-white">{t('occupancyReport')}</h3>
             <p className="text-gray-500 text-sm mt-2 mb-4">{t('occupancyReportDesc')}</p>
          </div>
          <button 
             onClick={() => generateOccupancyReport(state.units, state.bookings, language, t, filterStart, filterEnd, selectedUnit)}
             className="flex items-center justify-center gap-2 w-full p-3.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/30 font-bold"
          >
            <Download size={20} /> {t('downloadPDF')}
          </button>
        </div>

        {/* Village Fees Report (New) */}
        <div className="glass p-6 rounded-2xl flex flex-col justify-between h-auto min-h-[14rem] transition-transform hover:-translate-y-1 hover:shadow-lg border-2 border-orange-100 dark:border-orange-900/30">
          <div>
             <div className="p-3 bg-orange-100 dark:bg-orange-900 w-fit rounded-xl mb-4">
                <Coins className="text-orange-600 dark:text-orange-300" size={24} />
             </div>
             <h3 className="text-xl font-bold dark:text-white">{t('villageFeesReport')}</h3>
             <p className="text-gray-500 text-sm mt-2 mb-4">{t('villageFeesReportDesc')}</p>
          </div>
          <button 
             onClick={() => generateVillageFeesReport(state.units, state.bookings, language, t, filterStart, filterEnd, selectedUnit)}
             className="flex items-center justify-center gap-2 w-full p-3.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors shadow-lg shadow-orange-500/30 font-bold"
          >
            <Download size={20} /> {t('downloadPDF')}
          </button>
        </div>
      </div>

      <div className="glass p-6 rounded-2xl">
        <h3 className="text-lg font-bold mb-4 dark:text-white">{t('snapshot')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-xl text-center">
             <span className="block text-2xl font-bold text-gray-800 dark:text-white">{state.bookings.length}</span>
             <span className="text-xs text-gray-500 uppercase">{t('totalBookings')}</span>
           </div>
           <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-xl text-center">
             <span className="block text-2xl font-bold text-gray-800 dark:text-white">{state.units.length}</span>
             <span className="text-xs text-gray-500 uppercase">{t('totalUnits')}</span>
           </div>
           <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-xl text-center">
             <span className="block text-2xl font-bold text-gray-800 dark:text-white">{state.expenses.length}</span>
             <span className="text-xs text-gray-500 uppercase">{t('expenseRecords')}</span>
           </div>
           <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-xl text-center">
             <span className="block text-2xl font-bold text-gray-800 dark:text-white">
               {format(new Date(), 'MMM dd')}
             </span>
             <span className="text-xs text-gray-500 uppercase">{t('today')}</span>
           </div>
        </div>
      </div>
    </div>
  );
};
