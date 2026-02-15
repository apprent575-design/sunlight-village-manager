
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Mail, Search, Shield, Home, BookOpen, CheckCircle, XCircle, PauseCircle, Monitor, Laptop, Smartphone, Globe, Clock, X, Loader2, MapPin, Trash2, AlertTriangle } from 'lucide-react';
import { addDays, differenceInDays, formatDistance, format } from 'date-fns';
import { SessionLog, User } from '../types';

export const AdminAccounts = () => {
  const { state, t, fetchUserSessions, deleteSessionLog, language, isRTL } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Session Modal State
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [selectedUserForSessions, setSelectedUserForSessions] = useState<User | null>(null);
  const [userSessions, setUserSessions] = useState<SessionLog[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  // Delete Confirmation State
  const [sessionToDelete, setSessionToDelete] = useState<SessionLog | null>(null);
  const [isDeletingSession, setIsDeletingSession] = useState(false);

  // Explicitly filter out admin@gmail.com just in case the context didn't catch it
  const filteredUsers = state.allUsers.filter(u => 
    u.email !== 'admin@gmail.com' &&
    (u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleViewSessions = async (user: User) => {
      setSelectedUserForSessions(user);
      setIsSessionModalOpen(true);
      setIsLoadingSessions(true);
      try {
          const sessions = await fetchUserSessions(user.id);
          setUserSessions(sessions);
      } catch (e) {
          console.error(e);
      } finally {
          setIsLoadingSessions(false);
      }
  };

  const handleRequestDelete = (e: React.MouseEvent, session: SessionLog) => {
      e.stopPropagation();
      setSessionToDelete(session);
  };

  const confirmDeleteSession = async () => {
      if (!sessionToDelete) return;
      
      setIsDeletingSession(true);
      try {
          await deleteSessionLog(sessionToDelete.id);
          // Refresh list locally
          setUserSessions(prev => prev.filter(s => s.id !== sessionToDelete.id));
          setSessionToDelete(null);
      } catch (e) {
          console.error("Delete failed", e);
          alert(language === 'ar' ? 'حدث خطأ أثناء الحذف' : 'Error deleting session');
      } finally {
          setIsDeletingSession(false);
      }
  };

  const getDeviceIcon = (userAgent: string) => {
      const ua = userAgent.toLowerCase();
      if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) return <Smartphone size={18} />;
      if (ua.includes('mac') || ua.includes('win') || ua.includes('linux')) return <Laptop size={18} />;
      return <Globe size={18} />;
  };

  const getDeviceName = (userAgent: string) => {
      let os = t('unknown');
      if (userAgent.indexOf("Win") !== -1) os = t('windows');
      if (userAgent.indexOf("Mac") !== -1) os = t('mac');
      if (userAgent.indexOf("Linux") !== -1) os = t('linux');
      if (userAgent.indexOf("Android") !== -1) os = t('android');
      if (userAgent.indexOf("like Mac") !== -1) os = t('ios');

      let browser = t('unknown');
      if (userAgent.indexOf("Chrome") !== -1) browser = t('chrome');
      else if (userAgent.indexOf("Safari") !== -1) browser = t('safari');
      else if (userAgent.indexOf("Firefox") !== -1) browser = t('firefox');
      else if (userAgent.indexOf("Edg") !== -1) browser = t('edge');

      return `${os} • ${browser}`;
  };

  const calculateDuration = (start: string, end: string) => {
      const startDate = new Date(start);
      const endDate = new Date(end);
      // If diff is very small (less than 2 mins), show "Active Now" if very recent, else "Short session"
      const diffMinutes = (endDate.getTime() - startDate.getTime()) / 60000;
      
      if (diffMinutes < 1) return t('lessThanMin');
      
      return formatDistance(startDate, endDate, { addSuffix: false });
  };

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
                        placeholder={language === 'ar' ? 'بحث عن مستخدم...' : "Search users..."} 
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
                        <th className="p-5 font-extrabold text-gray-400 text-xs uppercase tracking-wider text-center">{t('actions')}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                    {filteredUsers.length === 0 && (
                        <tr><td colSpan={5} className="p-8 text-center text-gray-500">No client accounts found.</td></tr>
                    )}
                    {filteredUsers.map(user => {
                        const unitsCount = state.units.filter(u => u.user_id === user.id).length;
                        const bookingsCount = state.bookings.filter(b => b.user_id === user.id).length;
                        
                        let subStatus = 'Not Subscribed';
                        let BadgeIcon = XCircle;
                        let badgeColor = 'bg-gray-100 text-gray-500 border-gray-200';

                        if (user.subscription) {
                             const end = addDays(new Date(user.subscription.start_date), user.subscription.duration_days);
                             const daysLeft = differenceInDays(end, new Date());
                             
                             if (user.subscription.status === 'paused') {
                                 subStatus = 'Paused';
                                 BadgeIcon = PauseCircle;
                                 badgeColor = 'bg-amber-100 text-amber-700 border-amber-200';
                             } else if (daysLeft > 0) {
                                 subStatus = 'Active';
                                 BadgeIcon = CheckCircle;
                                 badgeColor = 'bg-green-100 text-green-700 border-green-200';
                             } else {
                                 subStatus = 'Expired';
                                 BadgeIcon = XCircle;
                                 badgeColor = 'bg-red-100 text-red-700 border-red-200';
                             }
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
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badgeColor}`}>
                                    <BadgeIcon size={14} /> {subStatus === 'Active' ? t('active') : subStatus === 'Paused' ? t('paused') : subStatus === 'Expired' ? t('expired') : 'No Sub'}
                                </span>
                            </td>
                            <td className="p-5 text-center">
                                <button 
                                    onClick={() => handleViewSessions(user)}
                                    className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl text-gray-600 dark:text-gray-300 transition-colors"
                                    title={t('deviceHistory')}
                                >
                                    <Monitor size={18} />
                                </button>
                            </td>
                        </tr>
                    )})}
                </tbody>
            </table>
        </div>

        {/* Sessions Modal */}
        {isSessionModalOpen && selectedUserForSessions && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[80vh] rounded-[32px] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200 border border-gray-200 dark:border-gray-800">
                    
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
                        <div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">{t('deviceHistory')}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('deviceHistoryDesc')} <span className="font-bold text-primary-600">{selectedUserForSessions.full_name}</span></p>
                        </div>
                        <button onClick={() => setIsSessionModalOpen(false)} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                            <X size={20} className="text-gray-500" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {isLoadingSessions ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
                                <Loader2 size={32} className="animate-spin text-primary-500" />
                                <p>Loading history...</p>
                            </div>
                        ) : userSessions.length === 0 ? (
                            <div className="text-center py-12 text-gray-400 flex flex-col items-center gap-3">
                                <div className="p-4 bg-gray-100 dark:bg-slate-800 rounded-full">
                                    <Monitor size={32} />
                                </div>
                                <p>{t('noHistory')}</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Summary Stats */}
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800">
                                        <div className="text-blue-500 text-xs font-bold uppercase mb-1">{t('totalLogins')}</div>
                                        <div className="text-2xl font-black text-blue-700 dark:text-blue-300">{userSessions.length}</div>
                                    </div>
                                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-2xl border border-purple-100 dark:border-purple-800">
                                        <div className="text-purple-500 text-xs font-bold uppercase mb-1">{t('uniqueDevices')}</div>
                                        <div className="text-2xl font-black text-purple-700 dark:text-purple-300">
                                            {new Set(userSessions.map(s => s.device_id || s.user_agent)).size}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {userSessions.map((session) => (
                                        <div key={session.id} className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-all group">
                                            <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-600 dark:text-gray-300 shrink-0">
                                                {getDeviceIcon(session.user_agent)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-gray-800 dark:text-white truncate">
                                                    {getDeviceName(session.user_agent)}
                                                </h4>
                                                {/* FIX: Use flex-wrap and gap to prevent overlay on mobile RTL */}
                                                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                                                    <span className="flex items-center gap-1 shrink-0">
                                                        <Clock size={12} />
                                                        {format(new Date(session.login_at), 'dd MMM, hh:mm a')}
                                                    </span>
                                                    {session.ip_address && (
                                                        <span className="flex items-center gap-1 bg-gray-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[10px] shrink-0">
                                                            <MapPin size={10} />
                                                            {session.ip_address}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {/* Action Area */}
                                            <div className="flex flex-col items-end gap-2 shrink-0">
                                                <div className="text-right">
                                                    <div className="text-xs font-bold text-gray-400 uppercase mb-0.5">{t('duration')}</div>
                                                    <span className="inline-block px-3 py-1 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-bold">
                                                        {calculateDuration(session.login_at, session.last_active_at)}
                                                    </span>
                                                </div>
                                                
                                                {/* Delete Button (Visible on hover/tap) */}
                                                <button 
                                                    onClick={(e) => handleRequestDelete(e, session)}
                                                    className="p-2 text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors opacity-100 md:opacity-0 group-hover:opacity-100"
                                                    title={language === 'ar' ? 'حذف الجلسة' : 'Terminate Session'}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* Delete Confirmation Modal */}
        {sessionToDelete && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white dark:bg-slate-900 w-full max-w-sm p-6 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
                    <div className="flex flex-col items-center text-center">
                        <div className="p-4 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-full mb-4 ring-8 ring-red-50 dark:ring-red-900/10">
                            <AlertTriangle size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            {language === 'ar' ? 'إنهاء الجلسة؟' : 'Terminate Session?'}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 leading-relaxed">
                            {language === 'ar' 
                                ? 'سيتم تسجيل خروج المستخدم فوراً من هذا الجهاز. هل أنت متأكد؟'
                                : 'The user will be logged out immediately from this device. Are you sure?'}
                        </p>
                        
                        {/* Device Info Summary */}
                        <div className="w-full bg-gray-50 dark:bg-slate-800 p-3 rounded-xl mb-6 text-sm flex items-center gap-3 text-left">
                             <div className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm">
                                {getDeviceIcon(sessionToDelete.user_agent)}
                             </div>
                             <div className="flex-1 overflow-hidden">
                                 <div className="font-bold text-gray-800 dark:text-white truncate">{getDeviceName(sessionToDelete.user_agent)}</div>
                                 <div className="text-xs text-gray-500">{sessionToDelete.ip_address}</div>
                             </div>
                        </div>

                        <div className="flex gap-3 w-full">
                            <button 
                                onClick={() => setSessionToDelete(null)}
                                disabled={isDeletingSession}
                                className="flex-1 p-3.5 rounded-xl border border-gray-200 dark:border-slate-700 font-bold hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 transition-colors"
                            >
                                {t('cancel')}
                            </button>
                            <button 
                                onClick={confirmDeleteSession}
                                disabled={isDeletingSession}
                                className="flex-1 p-3.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold shadow-lg shadow-red-500/30 transition-all flex items-center justify-center gap-2"
                            >
                                {isDeletingSession ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                                {language === 'ar' ? 'إنهاء' : 'Terminate'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
