
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Mail, Search, Shield, Home, BookOpen, CheckCircle, XCircle } from 'lucide-react';
import { addDays, parseISO, isAfter } from 'date-fns';

export const AdminAccounts = () => {
  const { state, t } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = state.allUsers.filter(u => 
    (u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-8 relative">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
               <h2 className="text-3xl font-bold text-gray-800 dark:text-white">{t('accounts')}</h2>
               <p className="text-gray-500 dark:text-gray-400 mt-1">Manage user access and subscriptions</p>
            </div>
            
            <div className="flex gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search users..." 
                        className="w-full pl-10 p-3 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 ring-primary-500"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
        </div>

        {/* User List Table */}
        <div className="glass rounded-3xl overflow-hidden overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-gray-700">
                    <tr>
                        <th className="p-5 font-extrabold text-gray-400 text-xs uppercase tracking-wider">{t('fullName')} / {t('email')}</th>
                        <th className="p-5 font-extrabold text-gray-400 text-xs uppercase tracking-wider text-center">{t('units')}</th>
                        <th className="p-5 font-extrabold text-gray-400 text-xs uppercase tracking-wider text-center">{t('bookings')}</th>
                        <th className="p-5 font-extrabold text-gray-400 text-xs uppercase tracking-wider text-center">{t('subscriptionStatus')}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                    {filteredUsers.map(user => {
                        const unitsCount = state.units.filter(u => u.user_id === user.id).length;
                        const bookingsCount = state.bookings.filter(b => b.user_id === user.id).length;
                        
                        let isSubscribed = false;
                        if (user.subscription) {
                             const end = addDays(parseISO(user.subscription.start_date), user.subscription.duration_days);
                             isSubscribed = isAfter(end, new Date());
                        }

                        return (
                        <tr key={user.id} className="hover:bg-gray-50/80 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="p-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center font-bold text-gray-600 dark:text-gray-300">
                                        {user.full_name?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <div className="font-bold text-gray-800 dark:text-white">{user.full_name || 'No Name'}</div>
                                            {user.role === 'admin' && (
                                                <span className="inline-flex items-center gap-1 text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded text-[10px] border border-purple-100">
                                                    <Shield size={10}/> Admin
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                            <Mail size={12} /> {user.email}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td className="p-5 text-center">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-bold text-sm">
                                    <Home size={14} /> {unitsCount}
                                </div>
                            </td>
                            <td className="p-5 text-center">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 font-bold text-sm">
                                    <BookOpen size={14} /> {bookingsCount}
                                </div>
                            </td>
                            <td className="p-5 text-center">
                                {isSubscribed ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                                        <CheckCircle size={14} /> {t('active')}
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                                        <XCircle size={14} /> {user.subscription ? t('expired') : 'Not Subscribed'}
                                    </span>
                                )}
                            </td>
                        </tr>
                    )})}
                </tbody>
            </table>
        </div>
    </div>
  );
};
