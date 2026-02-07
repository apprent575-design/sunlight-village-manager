
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User, Subscription } from '../types';
import { addDays, format, differenceInDays, parseISO, isAfter, isValid } from 'date-fns';
import { Users, Search, Plus, Calendar, DollarSign, Download, Trash2, Edit2, CheckCircle, XCircle, AlertTriangle, Loader2, PauseCircle, PlayCircle } from 'lucide-react';
import { generateSubscriptionReceipt } from '../utils/pdfGenerator';

export const AdminSubscriptions = () => {
  const { state, t, addSubscription, updateSubscription, deleteSubscription, isRTL, language } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  
  const [subToDelete, setSubToDelete] = useState<Subscription | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Form State
  const [duration, setDuration] = useState(30);
  const [price, setPrice] = useState(0);
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Calculate end date for display
  const endDateDisplay = isValid(parseISO(startDate)) && duration 
    ? format(addDays(parseISO(startDate), duration), 'yyyy-MM-dd') 
    : '-';

  const openModal = (user: User, existingSub?: Subscription) => {
      setSelectedUser(user);
      if (existingSub) {
          setEditingSubId(existingSub.id);
          setDuration(existingSub.duration_days);
          setPrice(existingSub.price);
          setStartDate(existingSub.start_date);
      } else {
          setEditingSubId(null);
          setDuration(30);
          setPrice(0);
          setStartDate(format(new Date(), 'yyyy-MM-dd'));
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    // Logic: If we are adding/renewing, we almost certainly want it to be 'active'
    const subPayload: Subscription = {
        id: editingSubId || crypto.randomUUID(),
        user_id: selectedUser.id,
        start_date: startDate,
        duration_days: duration,
        price: price,
        status: 'active' // Auto-activate on save
    };

    try {
        if (editingSubId) {
            await updateSubscription(subPayload);
        } else {
            await addSubscription(subPayload);
        }
        setSelectedUser(null);
        setEditingSubId(null);
    } catch (error) {
        alert("Failed to save subscription! Make sure your account is an Admin in the database.\n\nError: " + (error as any).message);
    }
  };

  const confirmDelete = async () => {
      if(subToDelete) {
          setIsDeleting(true);
          try {
              await deleteSubscription(subToDelete.id);
          } catch (error) {
              alert("Failed to delete. Error: " + (error as any).message);
          } finally {
              setIsDeleting(false);
              setSubToDelete(null);
          }
      }
  };

  const togglePause = async (sub: Subscription) => {
      const newStatus = sub.status === 'paused' ? 'active' : 'paused';
      try {
          await updateSubscription({ ...sub, status: newStatus });
      } catch (error) {
          alert("Failed to update status.");
      }
  };

  const filteredUsers = state.allUsers.filter(u => 
    u.role !== 'admin' && 
    (u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-8">
       <div className="flex justify-between items-center">
         <h2 className="text-3xl font-bold text-gray-800 dark:text-white">{t('subscriptions')}</h2>
       </div>

       {/* Search */}
       <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
             type="text" 
             placeholder="Search users..." 
             className="w-full pl-10 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-gray-700 outline-none focus:ring-2 ring-primary-500"
             value={searchTerm}
             onChange={e => setSearchTerm(e.target.value)}
          />
       </div>

       {/* User Cards */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map(user => {
              const sub = user.subscription;
              let daysLeft = 0;
              let isExpired = true;
              let isPaused = sub?.status === 'paused';

              if (sub) {
                  const end = addDays(parseISO(sub.start_date), sub.duration_days);
                  daysLeft = differenceInDays(end, new Date());
                  // Explicit status check overrides date calc for UI badge
                  isExpired = daysLeft <= 0;
              }

              return (
                <div key={user.id} className="glass p-6 rounded-3xl relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-lg">
                                {user.full_name?.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800 dark:text-white">{user.full_name}</h3>
                                <p className="text-xs text-gray-500">{user.email}</p>
                            </div>
                        </div>
                        {sub && (
                            <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                                isPaused 
                                    ? 'bg-amber-100 text-amber-700' 
                                    : !isExpired 
                                        ? 'bg-green-100 text-green-700' 
                                        : 'bg-red-100 text-red-700'
                            }`}>
                                {isPaused ? t('paused') : !isExpired ? t('active') : t('expired')}
                            </div>
                        )}
                    </div>

                    {sub ? (
                        <div className={`space-y-3 mb-6 p-4 rounded-2xl ${isPaused ? 'bg-amber-50 dark:bg-amber-900/10' : 'bg-gray-50 dark:bg-slate-800/50'}`}>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">{t('daysRemaining')}</span>
                                <span className={`font-bold ${daysLeft < 5 ? 'text-red-500' : 'text-gray-800 dark:text-white'}`}>
                                    {daysLeft > 0 ? daysLeft : 0} {t('days')}
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                <div 
                                    className={`h-full rounded-full ${isPaused ? 'bg-amber-400' : daysLeft < 5 ? 'bg-red-500' : 'bg-green-500'}`} 
                                    style={{ width: `${Math.min((daysLeft / sub.duration_days) * 100, 100)}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-400 mt-2">
                                <span>Start: {sub.start_date}</span>
                                <span>Total: {sub.price} EGP</span>
                            </div>
                        </div>
                    ) : (
                        <div className="mb-6 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl text-center text-sm text-gray-500 italic">
                            No active subscription
                        </div>
                    )}

                    <div className="flex gap-2">
                        <button 
                            onClick={() => openModal(user, sub)}
                            className="flex-1 bg-primary-500 hover:bg-primary-600 text-white py-2 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                        >
                            {sub ? <Edit2 size={16}/> : <Plus size={16}/>}
                            {sub ? t('renew') : t('addSubscription')}
                        </button>
                        {sub && (
                            <>
                             <button 
                                onClick={() => togglePause(sub)}
                                className={`p-2 rounded-xl transition-colors ${sub.status === 'paused' ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}
                                title={sub.status === 'paused' ? t('resumeSubscription') : t('pauseSubscription')}
                            >
                                {sub.status === 'paused' ? <PlayCircle size={18}/> : <PauseCircle size={18}/>}
                            </button>
                            <button 
                                onClick={() => generateSubscriptionReceipt(user, sub, language, t)}
                                className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100"
                                title={t('printReceipt')}
                            >
                                <Download size={18}/>
                            </button>
                             <button 
                                onClick={() => setSubToDelete(sub)}
                                className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100"
                                title={t('deleteSubscription')}
                            >
                                <Trash2 size={18}/>
                            </button>
                            </>
                        )}
                    </div>
                </div>
              );
          })}
       </div>

       {/* Add/Edit Subscription Modal */}
       {selectedUser && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
               <div className="glass bg-white dark:bg-slate-900 w-full max-w-md p-8 rounded-3xl animate-in zoom-in">
                   <h3 className="text-2xl font-bold mb-4 dark:text-white">
                       {editingSubId ? t('editSubscription') : t('addSubscription')}
                   </h3>
                   <p className="mb-6 text-gray-500">for <span className="font-bold text-primary-500">{selectedUser.full_name}</span></p>
                   
                   <form onSubmit={handleSubmit} className="space-y-4">
                       <div>
                           <label className="block text-sm font-bold mb-1 dark:text-gray-300">{t('startDate')}</label>
                           <input 
                              type="date" 
                              required 
                              value={startDate} 
                              onChange={e => setStartDate(e.target.value)} 
                              className="w-full p-3 rounded-xl border bg-white text-gray-900 border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                            />
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                           <div>
                               <label className="block text-sm font-bold mb-1 dark:text-gray-300">{t('durationDays')}</label>
                               <input 
                                  type="number" 
                                  required 
                                  value={duration} 
                                  onChange={e => setDuration(Number(e.target.value))} 
                                  className="w-full p-3 rounded-xl border bg-white text-gray-900 border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                />
                           </div>
                           <div>
                               <label className="block text-sm font-bold mb-1 dark:text-gray-300">{t('price')}</label>
                               <input 
                                  type="number" 
                                  required 
                                  value={price} 
                                  onChange={e => setPrice(Number(e.target.value))} 
                                  className="w-full p-3 rounded-xl border bg-white text-gray-900 border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                />
                           </div>
                       </div>
                       
                       {/* End Date Display */}
                       <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-700 dark:text-blue-300 flex justify-between items-center">
                           <span className="font-medium">Ends On:</span>
                           <span className="font-bold text-lg">{endDateDisplay}</span>
                       </div>

                       <div className="flex gap-3 mt-6">
                           <button type="button" onClick={() => setSelectedUser(null)} className="flex-1 p-3 rounded-xl bg-gray-100 dark:bg-slate-800 font-bold">{t('cancel')}</button>
                           <button type="submit" className="flex-1 p-3 rounded-xl bg-primary-500 text-white font-bold">{t('save')}</button>
                       </div>
                   </form>
               </div>
           </div>
       )}

       {/* Delete Confirmation Modal */}
       {subToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass bg-white dark:bg-slate-900 w-full max-w-md p-8 rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-200 border border-red-100 dark:border-red-900/30">
            
            <div className="flex flex-col items-center text-center">
                <div className="p-4 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-full mb-6 ring-8 ring-red-50 dark:ring-red-900/10">
                    {isDeleting ? <Loader2 size={36} className="animate-spin" /> : <AlertTriangle size={36} strokeWidth={2.5} />}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Delete Subscription?</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-8">
                    This will remove the active subscription. <br/>
                    The user will lose access to add new data immediately.
                </p>

                <div className="flex gap-3 w-full">
                    <button 
                        type="button"
                        onClick={() => setSubToDelete(null)}
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
