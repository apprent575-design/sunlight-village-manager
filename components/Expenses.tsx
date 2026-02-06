import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Expense } from '../types';
import { Plus, Download, Calendar, Edit2, Trash2, Check, X, AlertTriangle, Loader2 } from 'lucide-react';
import { format, isWithinInterval, isValid } from 'date-fns';
import { generateExpenseReport } from '../utils/pdfGenerator';

export const Expenses = () => {
  const { t, state, addExpense, updateExpense, deleteExpense, language } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Delete State
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
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

  const handleDeleteClick = (expense: Expense) => {
    setExpenseToDelete(expense);
  };

  const confirmDelete = async () => {
    if (expenseToDelete) {
        setIsDeleting(true);
        try {
            await deleteExpense(expenseToDelete.id);
        } finally {
            setIsDeleting(false);
            setExpenseToDelete(null);
        }
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
    <div className="space-y-6 relative">
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
              <label className="text-xs font-bold text-gray-500 uppercase">{t('category')}</label>
              <select 
                className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-gray-700"
                value={expenseData.category} 
                onChange={e => setExpenseData({...expenseData, category: e.target.value})}
              >
                <option value="Maintenance">Maintenance</option>
                <option value="Electricity">Electricity</option>
                <option value="Water">Water</option>
                <option value="Internet">Internet</option>
                <option value="Gas">Gas</option>
                <option value="Cleaning Supplies">Cleaning Supplies</option>
                <option value="Furniture">Furniture</option>
                <option value="Other">Other</option>
              </select>
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

      {/* Added overflow-x-auto for mobile horizontal scrolling */}
      <div className="glass rounded-2xl overflow-hidden overflow-x-auto no-scrollbar">
        <table className="w-full text-left dark:text-gray-300 whitespace-nowrap md:whitespace-normal">
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
                <td className="p-4 text-sm text-gray-500">
                    <span className="bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded text-xs">
                        {expense.category || 'Maintenance'}
                    </span>
                </td>
                <td className="p-4 text-right font-mono text-red-500">-{expense.amount} {t('currency')}</td>
                {/* Removed opacity classes to make buttons always visible */}
                <td className="p-4 flex items-center justify-center gap-2 transition-opacity">
                    <button 
                        onClick={() => handleEdit(expense)}
                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button 
                        onClick={() => handleDeleteClick(expense)}
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

      {/* Delete Confirmation Modal */}
      {expenseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass bg-white dark:bg-slate-900 w-full max-w-md p-8 rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-200 border border-red-100 dark:border-red-900/30">
            
            <div className="flex flex-col items-center text-center">
                <div className="p-4 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-full mb-6 ring-8 ring-red-50 dark:ring-red-900/10">
                    {isDeleting ? <Loader2 size={36} className="animate-spin" /> : <AlertTriangle size={36} strokeWidth={2.5} />}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Delete Expense?</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-8">
                    Are you sure you want to remove <br/>
                    <span className="font-bold text-gray-800 dark:text-gray-200">{expenseToDelete.title}</span>? 
                    <br/>This action cannot be undone.
                </p>

                <div className="flex gap-3 w-full">
                    <button 
                        type="button"
                        onClick={() => setExpenseToDelete(null)}
                        disabled={isDeleting}
                        className="flex-1 p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 font-bold hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-gray-700 dark:text-gray-300 disabled:opacity-50"
                    >
                        {t('cancel')}
                    </button>
                    <button 
                        type="button"
                        onClick={confirmDelete}
                        disabled={isDeleting}
                        className="flex-1 p-3.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold shadow-lg shadow-red-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isDeleting ? 'Deleting...' : (
                            <>
                                <Trash2 size={18} />
                                Delete
                            </>
                        )}
                    </button>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};