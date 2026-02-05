import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UnitType, Unit } from '../types';
import { Plus, Home, Edit2, Trash2, Check, X, AlertTriangle } from 'lucide-react';

export const Units = () => {
  const { t, state, addUnit, updateUnit, deleteUnit } = useApp();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [unitToDelete, setUnitToDelete] = useState<Unit | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<UnitType>(UnitType.CHALET);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    if (editingId) {
      const existing = state.units.find(u => u.id === editingId);
      if (existing) {
        updateUnit({ ...existing, name, type });
        setEditingId(null);
      }
    } else {
      addUnit({
        id: crypto.randomUUID(),
        name,
        type,
        created_at: new Date().toISOString()
      });
    }
    setName('');
  };

  const startEdit = (unit: Unit) => {
    setEditingId(unit.id);
    setName(unit.name);
    setType(unit.type);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName('');
    setType(UnitType.CHALET);
  };

  const handleDeleteClick = (e: React.MouseEvent, unit: Unit) => {
    e.preventDefault();
    e.stopPropagation();
    setUnitToDelete(unit);
  };

  const confirmDelete = async () => {
    if (unitToDelete) {
        await deleteUnit(unitToDelete.id);
        setUnitToDelete(null);
    }
  };

  return (
    <div className="space-y-8 relative">
      <h2 className="text-3xl font-bold text-gray-800 dark:text-white">{t('units')}</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="glass p-6 rounded-2xl h-fit">
          <h3 className="text-xl font-bold mb-4 dark:text-white">
            {editingId ? t('editUnit') : t('addUnit')}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-300">{t('unitName')}</label>
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full p-3 rounded-xl border bg-white/50 dark:bg-slate-800 border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
                placeholder="e.g. Sunset Villa 101"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-300">{t('unitType')}</label>
              <select 
                value={type}
                onChange={e => setType(e.target.value as UnitType)}
                className="w-full p-3 rounded-xl border bg-white/50 dark:bg-slate-800 border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary-500 dark:text-white dark:bg-slate-800"
              >
                {Object.values(UnitType).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            
            <div className="flex gap-2">
              {editingId && (
                <button 
                  type="button" 
                  onClick={cancelEdit}
                  className="flex-1 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200 p-3 rounded-xl font-bold"
                >
                  {t('cancel')}
                </button>
              )}
              <button 
                type="submit"
                className="flex-1 bg-primary-500 hover:bg-primary-600 text-white p-3 rounded-xl font-bold shadow-lg shadow-primary-500/30 transition-all flex items-center justify-center gap-2"
              >
                {editingId ? <Check size={20} /> : <Plus size={20} />}
                {editingId ? t('save') : t('addUnit')}
              </button>
            </div>
          </form>
        </div>

        {/* List */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {state.units.length === 0 && (
            <div className="col-span-2 text-center p-8 text-gray-500 glass rounded-2xl">
              No units added yet. Add one to get started.
            </div>
          )}
          {state.units.map(unit => (
            <div key={unit.id} className="glass p-6 rounded-2xl flex items-center justify-between group hover:border-primary-300 transition-colors shadow-sm bg-white/40 dark:bg-slate-800/40">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-full bg-blue-50 dark:bg-blue-900/30 text-primary-500">
                  <Home size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-lg text-gray-800 dark:text-white">{unit.name}</h4>
                  <p className="text-sm text-gray-500 uppercase tracking-wide">{unit.type}</p>
                </div>
              </div>
              
              <div className="flex gap-2 relative z-10">
                <button 
                  type="button"
                  onClick={() => startEdit(unit)}
                  className="p-2 bg-gray-100 dark:bg-slate-700 hover:bg-blue-100 dark:hover:bg-blue-900 text-gray-600 dark:text-gray-300 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                  title="Edit"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  type="button"
                  onClick={(e) => handleDeleteClick(e, unit)}
                  className="p-2 bg-gray-100 dark:bg-slate-700 hover:bg-red-100 dark:hover:bg-red-900 text-gray-600 dark:text-gray-300 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Delete Confirmation Modal */}
      {unitToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass bg-white dark:bg-slate-900 w-full max-w-md p-8 rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-200 border border-red-100 dark:border-red-900/30">
            
            <div className="flex flex-col items-center text-center">
                <div className="p-4 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-full mb-6 ring-8 ring-red-50 dark:ring-red-900/10">
                    <AlertTriangle size={36} strokeWidth={2.5} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Delete {unitToDelete.name}?</h3>
                
                {/* Impact Analysis */}
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-8 w-full">
                    {state.bookings.some(b => b.unit_id === unitToDelete.id) ? (
                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-800/50">
                            <p className="font-bold text-red-700 dark:text-red-400 mb-1">
                                ⚠️ Critical Warning
                            </p>
                            <p className="text-red-600/90 dark:text-red-300/80 leading-relaxed">
                                This unit has <span className="font-bold">{state.bookings.filter(b => b.unit_id === unitToDelete.id).length} active booking(s)</span> and associated financial records. 
                                <br/><br/>
                                Deleting it will <span className="font-extrabold underline">PERMANENTLY REMOVE</span> all history, revenue data, and scheduled bookings related to this unit.
                            </p>
                        </div>
                    ) : (
                        <p className="leading-relaxed">
                            Are you sure you want to remove this unit? <br/>
                            This action cannot be undone.
                        </p>
                    )}
                </div>

                <div className="flex gap-3 w-full">
                    <button 
                        type="button"
                        onClick={() => setUnitToDelete(null)}
                        className="flex-1 p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 font-bold hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-gray-700 dark:text-gray-300"
                    >
                        {t('cancel')}
                    </button>
                    <button 
                        type="button"
                        onClick={confirmDelete}
                        className="flex-1 p-3.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold shadow-lg shadow-red-500/30 transition-all flex items-center justify-center gap-2"
                    >
                        <Trash2 size={18} />
                        Delete Unit
                    </button>
                </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};