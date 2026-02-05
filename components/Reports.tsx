import React from 'react';
import { useApp } from '../context/AppContext';
import { FileText, Download } from 'lucide-react';
import { format } from 'date-fns';
import { generateFinancialReport, generateOccupancyReport } from '../utils/pdfGenerator';

export const Reports = () => {
  const { t, state, language } = useApp();

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800 dark:text-white">{t('reports')}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass p-6 rounded-2xl flex flex-col justify-between h-48">
          <div>
             <div className="p-3 bg-blue-100 dark:bg-blue-900 w-fit rounded-lg mb-4">
                <FileText className="text-blue-600 dark:text-blue-300" size={24} />
             </div>
             <h3 className="text-xl font-bold dark:text-white">Financial Summary</h3>
             <p className="text-gray-500 text-sm">Download net profit and revenue breakdown.</p>
          </div>
          <button 
            onClick={() => generateFinancialReport(state.units, state.bookings, state.expenses, language, t)}
            className="flex items-center justify-center gap-2 w-full p-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
          >
            <Download size={18} /> Download PDF
          </button>
        </div>

        <div className="glass p-6 rounded-2xl flex flex-col justify-between h-48">
          <div>
             <div className="p-3 bg-purple-100 dark:bg-purple-900 w-fit rounded-lg mb-4">
                <FileText className="text-purple-600 dark:text-purple-300" size={24} />
             </div>
             <h3 className="text-xl font-bold dark:text-white">Occupancy Report</h3>
             <p className="text-gray-500 text-sm">Detailed view of unit usage and tenant history.</p>
          </div>
          <button 
             onClick={() => generateOccupancyReport(state.units, state.bookings, language, t)}
             className="flex items-center justify-center gap-2 w-full p-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors"
          >
            <Download size={18} /> Download PDF
          </button>
        </div>
      </div>

      <div className="glass p-6 rounded-2xl">
        <h3 className="text-lg font-bold mb-4 dark:text-white">Snapshot</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-xl text-center">
             <span className="block text-2xl font-bold text-gray-800 dark:text-white">{state.bookings.length}</span>
             <span className="text-xs text-gray-500 uppercase">Total Bookings</span>
           </div>
           <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-xl text-center">
             <span className="block text-2xl font-bold text-gray-800 dark:text-white">{state.units.length}</span>
             <span className="text-xs text-gray-500 uppercase">Total Units</span>
           </div>
           <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-xl text-center">
             <span className="block text-2xl font-bold text-gray-800 dark:text-white">{state.expenses.length}</span>
             <span className="text-xs text-gray-500 uppercase">Expense Records</span>
           </div>
           <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-xl text-center">
             <span className="block text-2xl font-bold text-gray-800 dark:text-white">
               {format(new Date(), 'MMM dd')}
             </span>
             <span className="text-xs text-gray-500 uppercase">Today</span>
           </div>
        </div>
      </div>
    </div>
  );
};