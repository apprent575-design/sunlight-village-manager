
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FileText, Download, Calendar, Coins, ChevronsRight } from 'lucide-react';
import { format } from 'date-fns';
import { generateFinancialReport, generateOccupancyReport, generateVillageFeesReport } from '../utils/pdfGenerator';

const startOfMonth = (date: Date) => {
    const d = new Date(date);
    d.setDate(1);
    d.setHours(0,0,0,0);
    return d;
}

const endOfMonth = (date: Date) => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + 1);
    d.setDate(0);
    d.setHours(23, 59, 59, 999);
    return d;
}

export const Reports = () => {
  const { t, state, language, isRTL, formatHeaderDate } = useApp();
  
  // Filters
  const [filterStart, setFilterStart] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [filterEnd, setFilterEnd] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [selectedUnit, setSelectedUnit] = useState<string>('all');

  const handleAllTime = () => {
    const dates: number[] = [];
    
    // Collect all relevant dates
    state.bookings.forEach(b => {
        if(b.start_date) dates.push(new Date(b.start_date).getTime());
        if(b.end_date) dates.push(new Date(b.end_date).getTime());
    });
    state.expenses.forEach(e => {
        if(e.date) dates.push(new Date(e.date).getTime());
    });
    // Add today to ensure current data is covered if bookings are old
    dates.push(new Date().getTime());

    if (dates.length > 0) {
        const minDate = Math.min(...dates);
        const maxDate = Math.max(...dates);
        setFilterStart(format(new Date(minDate), 'yyyy-MM-dd'));
        setFilterEnd(format(new Date(maxDate), 'yyyy-MM-dd'));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-3xl font-black text-gray-800 dark:text-white order-1 md:order-2">{t('reports')}</h2>
        
        <div className="flex flex-col items-center order-2 md:order-1">
            <div className="bg-white dark:bg-slate-800 p-2 rounded-xl flex items-center gap-2 shadow-sm border border-gray-200 dark:border-slate-700 overflow-x-auto max-w-[90vw] md:max-w-full no-scrollbar">
                <select
                    className="bg-transparent text-sm font-bold text-gray-600 dark:text-gray-300 outline-none px-2 max-w-[120px]"
                    value={selectedUnit}
                    onChange={(e) => setSelectedUnit(e.target.value)}
                >
                    <option value="all">{t('allUnits')}</option>
                    {state.units.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                </select>
                
                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1 shrink-0"></div>

                {/* Calendar Icon - Black as requested */}
                <Calendar size={18} className="text-black dark:text-white shrink-0" />

                <input 
                    type="date" 
                    className="text-sm outline-none bg-transparent w-28 md:w-32 dark:text-white" 
                    value={filterStart} 
                    onChange={e => setFilterStart(e.target.value)} 
                />
                <span className="text-gray-300 shrink-0">{isRTL ? '←' : '→'}</span>
                <input 
                    type="date" 
                    className="text-sm outline-none bg-transparent w-28 md:w-32 dark:text-white" 
                    value={filterEnd} 
                    onChange={e => setFilterEnd(e.target.value)} 
                />
                
                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1 shrink-0"></div>

                <button 
                    onClick={handleAllTime}
                    className="ml-2 px-3 py-1 text-xs font-bold bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-600 dark:text-gray-300 rounded-lg transition-colors whitespace-nowrap shrink-0"
                    title="Set range to All Time"
                >
                    {t('allTime')}
                </button>
            </div>
            <div className="md:hidden mt-1 text-[10px] text-gray-400 font-medium flex items-center gap-1 animate-pulse">
                <span>{t('swipeForMore')}</span> <ChevronsRight size={10} className={isRTL ? 'rotate-180' : ''}/>
            </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Village Fees (Orange) */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[24px] border-2 border-orange-50 dark:border-orange-900/30 shadow-sm flex flex-col items-center text-center hover:border-orange-200 dark:hover:border-orange-700 transition-colors">
            <div className="w-14 h-14 rounded-2xl bg-orange-100 dark:bg-orange-900/50 text-orange-500 flex items-center justify-center mb-4">
                <Coins size={28} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{t('villageFeesReport')}</h3>
            <p className="text-sm text-gray-400 mb-8">{t('villageFeesReportDesc')}</p>
            <button 
                onClick={() => generateVillageFeesReport(state.units, state.bookings, language, t, filterStart, filterEnd, selectedUnit)}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-bold shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 hover:shadow-xl transition-all"
            >
                <Download size={18} /> {t('downloadPDF')}
            </button>
        </div>

        {/* Occupancy (Purple) */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[24px] border-2 border-purple-50 dark:border-purple-900/30 shadow-sm flex flex-col items-center text-center hover:border-purple-200 dark:hover:border-purple-700 transition-colors">
            <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/50 text-purple-500 flex items-center justify-center mb-4">
                <FileText size={28} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{t('occupancyReport')}</h3>
            <p className="text-sm text-gray-400 mb-8">{t('occupancyReportDesc')}</p>
            <button 
                onClick={() => generateOccupancyReport(state.units, state.bookings, language, t, filterStart, filterEnd, selectedUnit)}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2 hover:shadow-xl transition-all"
            >
                <Download size={18} /> {t('downloadPDF')}
            </button>
        </div>

        {/* Financial (Blue) */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[24px] border-2 border-blue-50 dark:border-blue-900/30 shadow-sm flex flex-col items-center text-center hover:border-blue-200 dark:hover:border-blue-700 transition-colors">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/50 text-blue-500 flex items-center justify-center mb-4">
                <FileText size={28} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{t('financialSummary')}</h3>
            <p className="text-sm text-gray-400 mb-8">{t('financialSummaryDesc')}</p>
            <button 
                onClick={() => generateFinancialReport(state.units, state.bookings, state.expenses, language, t, filterStart, filterEnd, selectedUnit)}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 hover:shadow-xl transition-all"
            >
                <Download size={18} /> {t('downloadPDF')}
            </button>
        </div>

      </div>

      {/* Snapshot */}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-[24px] shadow-sm border border-gray-100 dark:border-slate-700">
        <h3 className="text-lg font-bold mb-6 text-right text-gray-800 dark:text-white">{t('snapshot')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
           <div className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-2xl border border-gray-100 dark:border-slate-600">
             <div className="text-2xl font-black text-gray-800 dark:text-white">{state.bookings.length}</div>
             <div className="text-xs text-gray-400 uppercase font-bold mt-1">{t('totalBookings')}</div>
           </div>
           <div className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-2xl border border-gray-100 dark:border-slate-600">
             <div className="text-2xl font-black text-gray-800 dark:text-white">{state.units.length}</div>
             <div className="text-xs text-gray-400 uppercase font-bold mt-1">{t('totalUnits')}</div>
           </div>
           <div className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-2xl border border-gray-100 dark:border-slate-600">
             <div className="text-2xl font-black text-gray-800 dark:text-white">{state.expenses.length}</div>
             <div className="text-xs text-gray-400 uppercase font-bold mt-1">{t('expenseRecords')}</div>
           </div>
           <div className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-2xl border border-gray-100 dark:border-slate-600">
             <div className="text-2xl font-black text-gray-800 dark:text-white capitalize">
               {formatHeaderDate(new Date())}
             </div>
             <div className="text-xs text-gray-400 uppercase font-bold mt-1">{t('today')}</div>
           </div>
        </div>
      </div>
    </div>
  );
};
