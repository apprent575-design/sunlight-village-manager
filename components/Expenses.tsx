import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Expense } from '../types';
import { Plus, Download, Calendar, Edit2, Trash2, Check, X } from 'lucide-react';
import { format, isWithinInterval, isValid } from 'date-fns';
import { generateExpenseReport } from '../utils/pdfGenerator';

export const Expenses = () => {
  const { t, state, addExpense, updateExpense, deleteExpense, language } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Filters
  const [filterUnit, setFilterUnit] = useState<string>('all');
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');
  
  const [expenseData, setExpenseData] = useState<Partial<Expense>>({
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
        await updateExpense({
            ...expenseData,
            id: editingId,
            created_at: state.expenses.find(ex => ex.id === editingId)?.created_at || new Date().toISOString()
        } as Expense);
    } else {
        await addExpense({
            ...expenseData,
            id: crypto.randomUUID(),
            created_at: new Date().toISOString()
        } as Expense);
    }
    closeForm();
  };

  const handleEdit = (expense: Expense) => {
    setEditingId(expense.id);
    setExpenseData({
        title: expense.title,
        amount: expense.amount,
        category: expense.category,
        date: format(new Date(expense.date), 'yyyy-MM-dd'),
        unit_id: expense.unit_id
    });
    setShowAdd(true);
  };

  const handleDelete = async (id: string) => {
    const message = language === 'ar' 
        ? "هل أنت متأكد أنك تريد حذف هذا المصروف؟ لا يمكن التراجع عن هذا الإجراء." 
        : "Are you sure you want to delete this expense? This action cannot be undone.";
        
    if(confirm(message)) {
        await deleteExpense(id);
    }
  };

  const closeForm = () => {
    setShowAdd(false);
    setEditingId(null);
    setExpenseData({
        title: '',
        amount: 0,
        category: 'Maintenance',
        date: format(new Date(), 'yyyy-MM-dd'),
        unit_id: state.units[0]?.id || ''
    });
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
            onClick={() => { closeForm(); setShowAdd(true); }}
            className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary-500/30"
           >
             <Plus size={18} />
             {t('addExpense')}
           </button>
        </div>
      </div>

      {showAdd && (
        <form onSubmit={handleSubmit} className="glass p-6 rounded-2xl animate-in fade-in slide-in-from-top-4 border-2 border-primary-100 dark:border-primary-900/30">
          <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg dark:text-white">{editingId ? 'Edit Expense' : t('addExpense')}</h3>
              <button type="button" onClick={closeForm} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700"><X size={18}/></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Title</label>
              <input required type="text" className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-gray-700" value={expenseData.title} onChange={e => setExpenseData({...expenseData, title: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">{t('amount')} ({t('currency')})</label>
              <input required type="number" className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-gray-700" value={expenseData.amount} onChange={e => setExpenseData({...expenseData, amount: parseFloat(e.target.value)})} />
            </div>
             <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">{t('unit')}</label>
              <select className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-gray-700" value={expenseData.unit_id} onChange={e => setExpenseData({...expenseData, unit_id: e.target.value})}>
                {state.units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
             <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">{t('date')}</label>
              <input required type="date" className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-gray-700" value={expenseData.date} onChange={e => setExpenseData({...expenseData, date: e.target.value})} />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={closeForm} className="px-4 py-2 text-gray-500 font-bold">{t('cancel')}</button>
            <button type="submit" className="px-4 py-2 bg-primary-500 text-white rounded-lg font-bold flex items-center gap-2">
                <Check size={18} />
                {t('save')}
            </button>
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
              <th className="p-4 text-center w-24">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredExpenses.map(expense => {
              const d = new Date(expense.date);
              return (
              <tr key={expense.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 group">
                <td className="p-4">{isValid(d) ? format(d, 'MMM dd, yyyy') : 'Invalid Date'}</td>
                <td className="p-4">{state.units.find(u => u.id === expense.unit_id)?.name}</td>
                <td className="p-4 font-medium">{expense.title}</td>
                <td className="p-4 text-sm text-gray-500">{expense.category}</td>
                <td className="p-4 text-right font-mono text-red-500">-{expense.amount} {t('currency')}</td>
                <td className="p-4 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={() => handleEdit(expense)}
                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button 
                        onClick={() => handleDelete(expense.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                    >
                        <Trash2 size={16} />
                    </button>
                </td>
              </tr>
            )})}
             <tr className="bg-gray-50 dark:bg-slate-800 font-bold">
               <td colSpan={4} className="p-4 text-right">{t('total')}</td>
               <td className="p-4 text-right text-red-600">
                 -{filteredExpenses.reduce((sum, e) => sum + e.amount, 0)} {t('currency')}
               </td>
               <td></td>
             </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};