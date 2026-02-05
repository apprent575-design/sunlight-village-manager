import React from 'react';
import { useApp } from '../context/AppContext';
import { Calendar, DollarSign, TrendingUp, Users } from 'lucide-react';
import { format, isValid } from 'date-fns';

const StatCard = ({ title, value, icon: Icon, colorClass }: any) => (
  <div className="glass p-6 rounded-2xl flex items-center justify-between shadow-sm">
    <div>
      <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{value}</h3>
    </div>
    <div className={`p-3 rounded-full ${colorClass}`}>
      <Icon size={24} className="text-white" />
    </div>
  </div>
);

export const Dashboard = () => {
  const { t, state } = useApp();

  const activeBookings = state.bookings.filter(b => b.status === 'Confirmed' || b.status === 'Pending').length;
  
  // Calculate Net Profit: (Base Rate * Nights) - (Total Expenses)
  const totalRentalRevenue = state.bookings
    .filter(b => b.status === 'Confirmed')
    .reduce((sum, b) => sum + (b.nightly_rate * b.nights), 0);
    
  const totalExpenses = state.expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalRentalRevenue - totalExpenses;

  // Active or Upcoming rentals for the overview
  const rentals = state.bookings
    .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
    .slice(0, 10);

  const formatDateSafe = (dateStr: string) => {
    const d = new Date(dateStr);
    return isValid(d) ? format(d, 'MMM dd') : 'Invalid';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">{t('dashboard')}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title={t('totalActiveBookings')} 
          value={activeBookings} 
          icon={Calendar} 
          colorClass="bg-blue-500" 
        />
        <StatCard 
          title={t('netProfit')} 
          value={`${netProfit.toLocaleString()} ${t('currency')}`} 
          icon={TrendingUp} 
          colorClass="bg-green-500" 
        />
        <StatCard 
          title={t('totalExpenses')} 
          value={`${totalExpenses.toLocaleString()} ${t('currency')}`} 
          icon={DollarSign} 
          colorClass="bg-red-500" 
        />
      </div>

      <div className="glass p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">{t('rentalOverview')}</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-100 dark:bg-slate-800 rounded-lg">
              <tr>
                <th className="p-4 text-xs font-bold uppercase text-gray-500 dark:text-gray-400">{t('unit')}</th>
                <th className="p-4 text-xs font-bold uppercase text-gray-500 dark:text-gray-400">{t('tenant')}</th>
                <th className="p-4 text-xs font-bold uppercase text-gray-500 dark:text-gray-400">{t('dates')}</th>
                <th className="p-4 text-xs font-bold uppercase text-gray-500 dark:text-gray-400">{t('status')}</th>
                <th className="p-4 text-xs font-bold uppercase text-gray-500 dark:text-gray-400 text-right">{t('grandTotal')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {rentals.length === 0 && (
                 <tr><td colSpan={5} className="p-6 text-center text-gray-500">No data available</td></tr>
              )}
              {rentals.map((rental) => {
                const unitName = state.units.find(u => u.id === rental.unit_id)?.name || 'Unknown Unit';
                return (
                  <tr key={rental.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 font-bold text-gray-800 dark:text-white">{unitName}</td>
                    <td className="p-4 text-gray-600 dark:text-gray-300">{rental.tenant_name}</td>
                    <td className="p-4 text-sm text-gray-500">
                      {formatDateSafe(rental.start_date)} - {formatDateSafe(rental.end_date)}
                    </td>
                    <td className="p-4">
                       <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                           rental.payment_status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                       }`}>
                           {t(rental.payment_status.toLowerCase() as any)}
                       </span>
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-gray-800 dark:text-white">
                        {rental.total_rental_price} {t('currency')}
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