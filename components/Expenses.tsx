import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Expense } from '../types';
import { Plus, Download, Calendar } from 'lucide-react';
import { format, isWithinInterval, isValid } from 'date-fns';
import { generateExpenseReport } from '../utils/pdfGenerator';

export const Expenses = () => {
  const { t, state, addExpense, language } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [filterUnit, setFilterUnit] = useState<string>('all');
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');
  
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    title: '',
    amount: 0,
    category: 'Maintenance',
    date: format(new Date(), 'yyyy-MM-dd'),
    unit_id: state.units[0]?.id || ''
  });

  const filteredExpenses = state.expenses.filter(e => {
    const matchesUnit = filterUnit === 'all' || e.unit_id === filterUnit;
    let matchesDate = true;
    if (filterStart && filterEnd) {
      const d = new Date(e.date);
      const start = new Date(filterStart);
      const end = new Date(filterEnd);
      if (isValid(d) && isValid(start) && isValid(end)) {
          matchesDate = isWithinInterval(d, { start, end });
      }
    }
    return matchesUnit && matchesDate;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addExpense({
      ...newExpense,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    } as Expense);
    setShowAdd(false);
    setNewExpense({ ...newExpense, title: '', amount: 0 });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">{t('expenses')}</h2>
        
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <Calendar size={18} className="text-gray-500" />
                <input 
                    type="date" 
                    className="bg-transparent outline-none text-sm dark:text-gray-300 w-28" 
                    value={filterStart}
                    onChange={(e) => setFilterStart(e.target.value)}
                />
                <span className="text-gray-400">→</span>
                <input 
                    type="date" 
                    className="bg-transparent outline-none text-sm dark:text-gray-300 w-28" 
                    value={filterEnd}
                    onChange={(e) => setFilterEnd(e.target.value)}
                />
            </div>

           <select 
            className="p-2 rounded-xl border bg-white/50 dark:bg-slate-800 border-gray-200 dark:border-gray-700 outline-none"
            value={filterUnit}
            onChange={(e) => setFilterUnit(e.target.value)}
           >
             <option value="all">{t('allUnits')}</option>
             {state.units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
           </select>
           
           <button 
             onClick={() => generateExpenseReport(filteredExpenses, state.units, language, t)}
             className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-xl flex items-center justify-center gap-2 shadow-lg"
           >
             <Download size={18} />
             PDF
           </button>

           <button 
            onClick={() => setShowAdd(true)}
            className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary-500/30"
           >
             <Plus size={18} />
             {t('addExpense')}
           </button>
        </div>
      </div>

      {showAdd && (
        <form onSubmit={handleSubmit} className="glass p-6 rounded-2xl animate-in fade-in slide-in-from-top-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Title</label>
              <input required type="text" className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-gray-700" value={newExpense.title} onChange={e => setNewExpense({...newExpense, title: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">{t('amount')} ({t('currency')})</label>
              <input required type="number" className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-gray-700" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: parseFloat(e.target.value)})} />
            </div>
             <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">{t('unit')}</label>
              <select className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-gray-700" value={newExpense.unit_id} onChange={e => setNewExpense({...newExpense, unit_id: e.target.value})}>
                {state.units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
             <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">{t('date')}</label>
              <input required type="date" className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-gray-700" value={newExpense.date} onChange={e => setNewExpense({...newExpense, date: e.target.value})} />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-gray-500">{t('cancel')}</button>
            <button type="submit" className="px-4 py-2 bg-primary-500 text-white rounded-lg">{t('save')}</button>
          </div>
        </form>
      )}

      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full text-left dark:text-gray-300">
          <thead className="bg-gray-100/50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="p-4">{t('date')}</th>
              <th className="p-4">{t('unit')}</th>
              <th className="p-4">Title</th>
              <th className="p-4">{t('category')}</th>
              <th className="p-4 text-right">{t('amount')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredExpenses.map(expense => {
              const d = new Date(expense.date);
              return (
              <tr key={expense.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50">
                <td className="p-4">{isValid(d) ? format(d, 'MMM dd, yyyy') : 'Invalid Date'}</td>
                <td className="p-4">{state.units.find(u => u.id === expense.unit_id)?.name}</td>
                <td className="p-4 font-medium">{expense.title}</td>
                <td className="p-4 text-sm text-gray-500">{expense.category}</td>
                <td className="p-4 text-right font-mono text-red-500">-{expense.amount} {t('currency')}</td>
              </tr>
            )})}
             <tr className="bg-gray-50 dark:bg-slate-800 font-bold">
               <td colSpan={4} className="p-4 text-right">{t('total')}</td>
               <td className="p-4 text-right text-red-600">
                 -{filteredExpenses.reduce((sum, e) => sum + e.amount, 0)} {t('currency')}
               </td>
             </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};