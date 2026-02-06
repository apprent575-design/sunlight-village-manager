import React from 'react';
import { useApp } from '../context/AppContext';
import { Calendar, DollarSign, TrendingUp, Users, Clock } from 'lucide-react';
import { format, isValid } from 'date-fns';

const StatCard = ({ title, value, icon: Icon, gradient, trend }: any) => (
  <div className={`relative overflow-hidden rounded-3xl p-6 shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl border border-white/20 ${gradient}`}>
    {/* Background Pattern */}
    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 rounded-full bg-white/10 blur-2xl"></div>
    <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-20 h-20 rounded-full bg-black/5 blur-xl"></div>
    
    <div className="relative z-10 flex justify-between items-start">
        <div>
            <p className="text-white/80 text-sm font-semibold tracking-wide uppercase mb-2">{title}</p>
            <h3 className="text-3xl font-extrabold text-white">{value}</h3>
        </div>
        <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl shadow-inner text-white">
            <Icon size={24} strokeWidth={2.5} />
        </div>
    </div>
    
    {/* Optional Trend Indicator */}
    {trend && (
        <div className="mt-4 flex items-center gap-1 text-white/90 text-sm font-medium bg-white/10 w-fit px-2 py-1 rounded-lg">
            <TrendingUp size={14} />
            <span>On track</span>
        </div>
    )}
  </div>
);

export const Dashboard = () => {
  const { t, state, user } = useApp();

  const activeBookings = state.bookings.filter(b => b.status === 'Confirmed' || b.status === 'Pending').length;
  
  // Calculate Net Profit
  const totalRentalRevenue = state.bookings
    .filter(b => b.status === 'Confirmed')
    .reduce((sum, b) => sum + (b.nightly_rate * b.nights), 0);
    
  const totalExpenses = state.expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalRentalRevenue - totalExpenses;

  // Active or Upcoming rentals
  const rentals = state.bookings
    .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
    .slice(0, 10);

  const formatDateSafe = (dateStr: string) => {
    const d = new Date(dateStr);
    return isValid(d) ? format(d, 'MMM dd') : 'Invalid';
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
            <h2 className="text-4xl font-extrabold text-gray-800 dark:text-white tracking-tight">
                {t('dashboard')}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">
                Welcome back, <span className="text-primary-600 dark:text-primary-400 font-bold">{user?.full_name || 'Admin'}</span> 👋
            </p>
        </div>
        <div className="text-sm font-medium text-gray-400 bg-white/60 dark:bg-slate-800/60 px-5 py-2.5 rounded-2xl border border-white dark:border-gray-700 shadow-sm backdrop-blur-sm">
            {format(new Date(), 'EEEE, d MMMM yyyy')}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title={t('totalActiveBookings')} 
          value={activeBookings} 
          icon={Calendar} 
          gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
        />
        <StatCard 
          title={t('netProfit')} 
          value={`${netProfit.toLocaleString()} ${t('currency')}`} 
          icon={TrendingUp} 
          gradient="bg-gradient-to-br from-emerald-400 to-teal-600"
          trend
        />
        <StatCard 
          title={t('totalExpenses')} 
          value={`${totalExpenses.toLocaleString()} ${t('currency')}`} 
          icon={DollarSign} 
          gradient="bg-gradient-to-br from-rose-400 to-red-600"
        />
      </div>

      {/* Recent Activity Table */}
      <div className="glass rounded-3xl overflow-hidden shadow-card border border-white/50 dark:border-white/5">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700/50 flex items-center justify-between bg-white/40 dark:bg-slate-800/40">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-xl">
                    <Clock size={20} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">{t('rentalOverview')}</h3>
            </div>
            <button className="text-sm font-bold text-primary-600 hover:text-primary-700 transition-colors bg-primary-50 dark:bg-primary-900/10 px-4 py-2 rounded-xl">View All</button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/80 dark:bg-slate-800/80 backdrop-blur-sm">
              <tr>
                <th className="p-5 text-xs font-extrabold uppercase text-gray-400 tracking-wider">{t('unit')}</th>
                <th className="p-5 text-xs font-extrabold uppercase text-gray-400 tracking-wider">{t('tenant')}</th>
                <th className="p-5 text-xs font-extrabold uppercase text-gray-400 tracking-wider">{t('dates')}</th>
                <th className="p-5 text-xs font-extrabold uppercase text-gray-400 tracking-wider text-center">{t('status')}</th>
                <th className="p-5 text-xs font-extrabold uppercase text-gray-400 tracking-wider text-right">{t('grandTotal')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {rentals.length === 0 && (
                 <tr><td colSpan={5} className="p-10 text-center text-gray-500 italic">No recent activity found.</td></tr>
              )}
              {rentals.map((rental) => {
                const unitName = state.units.find(u => u.id === rental.unit_id)?.name || 'Unknown Unit';
                return (
                  <tr key={rental.id} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors group">
                    <td className="p-5 font-bold text-gray-700 dark:text-gray-200 flex items-center gap-3">
                        <div className="w-2 h-8 bg-primary-500 rounded-full opacity-0 group-hover:opacity-100 transition-all transform scale-y-0 group-hover:scale-y-100"></div>
                        {unitName}
                    </td>
                    <td className="p-5 font-medium text-gray-600 dark:text-gray-400">{rental.tenant_name}</td>
                    <td className="p-5 text-sm text-gray-500">
                      <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-800 w-fit px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-700">
                          <span>{formatDateSafe(rental.start_date)}</span>
                          <span className="text-gray-300">→</span>
                          <span>{formatDateSafe(rental.end_date)}</span>
                      </div>
                    </td>
                    <td className="p-5 text-center">
                       <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border shadow-sm ${
                           rental.payment_status === 'Paid' 
                             ? 'bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400' 
                             : 'bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400'
                       }`}>
                           <div className={`w-1.5 h-1.5 rounded-full ${rental.payment_status === 'Paid' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                           {t(rental.payment_status.toLowerCase() as any)}
                       </span>
                    </td>
                    <td className="p-5 text-right font-mono font-bold text-gray-800 dark:text-white text-lg">
                        {rental.total_rental_price.toLocaleString()} <span className="text-xs text-gray-400 font-sans">{t('currency')}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};