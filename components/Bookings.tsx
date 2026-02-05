import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Booking, BookingStatus, PaymentStatus } from '../types';
import { Plus, Edit2, Trash2, FileText, CheckCircle, Clock, XCircle, MessageCircle, Calendar, ThumbsUp, ThumbsDown, DollarSign } from 'lucide-react';
import { format, addDays, parseISO, isWithinInterval, isValid } from 'date-fns';
import { generateReceipt } from '../utils/pdfGenerator';

export const Bookings = () => {
  const { t, state, addBooking, updateBooking, deleteBooking, language } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Filters
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');

  // Form State
  const [formData, setFormData] = useState<Partial<Booking>>({
    tenant_name: '',
    phone: '',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    nights: 1,
    unit_id: state.units[0]?.id || '',
    nightly_rate: 0,
    village_fee: 0,
    housekeeping_enabled: false,
    housekeeping_price: 0,
    deposit_enabled: false,
    deposit_amount: 0,
    status: BookingStatus.PENDING,
    payment_status: PaymentStatus.UNPAID,
    notes: '',
    tenant_rating_good: true, // Default to 'Welcome Again'
  });

  // Auto Calculations
  useEffect(() => {
    if (formData.start_date && formData.nights) {
      const parsedDate = parseISO(formData.start_date);
      
      // Prevent invalid date operations
      if (!isValid(parsedDate)) return;

      const end = addDays(parsedDate, Number(formData.nights));
      
      // Calculate Grand Total (Tenant Pays)
      // Logic: (BaseRate + VillageFee) * Nights + Housekeeping
      const base = Number(formData.nightly_rate || 0);
      const fee = Number(formData.village_fee || 0);
      const nights = Number(formData.nights || 0);
      const housekeeping = formData.housekeeping_enabled ? Number(formData.housekeeping_price || 0) : 0;
      
      const total = ((base + fee) * nights) + housekeeping;
      
      setFormData(prev => ({
        ...prev,
        end_date: isValid(end) ? format(end, 'yyyy-MM-dd') : prev.end_date,
        total_rental_price: total
      }));
    }
  }, [formData.start_date, formData.nights, formData.nightly_rate, formData.village_fee, formData.housekeeping_enabled, formData.housekeeping_price]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Construct payload
    const bookingPayload = {
      ...formData,
      id: editingId || crypto.randomUUID(),
      // Preserve original creation date if editing, otherwise new date
      created_at: editingId 
        ? (state.bookings.find(b => b.id === editingId)?.created_at || new Date().toISOString()) 
        : new Date().toISOString(),
    } as Booking;

    try {
      if (editingId) {
        await updateBooking(bookingPayload);
      } else {
        await addBooking(bookingPayload);
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error("Failed to save booking:", error);
      alert("Failed to save booking. Please try again.");
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      tenant_name: '',
      phone: '',
      start_date: format(new Date(), 'yyyy-MM-dd'),
      nights: 1,
      unit_id: state.units[0]?.id || '',
      nightly_rate: 0,
      village_fee: 0,
      housekeeping_enabled: false,
      housekeeping_price: 0,
      deposit_enabled: false,
      deposit_amount: 0,
      status: BookingStatus.PENDING,
      payment_status: PaymentStatus.UNPAID,
      notes: '',
      tenant_rating_good: true,
    });
  };

  const handleEdit = (booking: Booking) => {
    setEditingId(booking.id);
    let startDate = format(new Date(), 'yyyy-MM-dd');
    let endDate = format(new Date(), 'yyyy-MM-dd');

    try {
        if (booking.start_date && isValid(new Date(booking.start_date))) {
            startDate = format(new Date(booking.start_date), 'yyyy-MM-dd');
        }
        if (booking.end_date && isValid(new Date(booking.end_date))) {
            endDate = format(new Date(booking.end_date), 'yyyy-MM-dd');
        }
    } catch (e) {
        console.error("Invalid date in booking", e);
    }

    setFormData({
      ...booking,
      start_date: startDate,
      end_date: endDate,
    });
    setIsModalOpen(true);
  };

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.CONFIRMED: return <span className="flex items-center gap-1 text-green-600 bg-green-100 px-3 py-1 rounded-full text-xs font-bold"><CheckCircle size={14}/> {t('confirmed')}</span>;
      case BookingStatus.PENDING: return <span className="flex items-center gap-1 text-yellow-700 bg-yellow-100 px-3 py-1 rounded-full text-xs font-bold"><Clock size={14}/> {t('pending')}</span>;
      case BookingStatus.CANCELLED: return <span className="flex items-center gap-1 text-red-600 bg-red-100 px-3 py-1 rounded-full text-xs font-bold"><XCircle size={14}/> {t('cancelled')}</span>;
    }
  };

  // Filter Bookings
  const filteredBookings = state.bookings.filter(b => {
    if (!filterStart || !filterEnd) return true;
    const bookingDate = new Date(b.start_date);
    if (!isValid(bookingDate)) return false;
    const start = new Date(filterStart);
    const end = new Date(filterEnd);
    if (!isValid(start) || !isValid(end)) return true; // Ignore filter if dates invalid
    return isWithinInterval(bookingDate, { start, end });
  });

  const formatDateSafe = (dateStr: string) => {
      const d = new Date(dateStr);
      return isValid(d) ? format(d, 'MMM dd') : 'Invalid Date';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">{t('bookings')}</h2>
        <div className="flex flex-col md:flex-row gap-4 items-end md:items-center w-full md:w-auto">
            {/* Date Filters */}
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <Calendar size={18} className="text-gray-500" />
                <input 
                    type="date" 
                    className="bg-transparent outline-none text-sm dark:text-gray-300 w-32" 
                    value={filterStart}
                    onChange={(e) => setFilterStart(e.target.value)}
                />
                <span className="text-gray-400">→</span>
                <input 
                    type="date" 
                    className="bg-transparent outline-none text-sm dark:text-gray-300 w-32" 
                    value={filterEnd}
                    onChange={(e) => setFilterEnd(e.target.value)}
                />
            </div>

            <button 
              onClick={() => { resetForm(); setIsModalOpen(true); }}
              className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-primary-500/30 transition-all font-bold w-full md:w-auto justify-center"
            >
              <Plus size={20} />
              {t('addBooking')}
            </button>
        </div>
      </div>

      {/* Grid Cards View */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredBookings.map((booking) => {
           const unit = state.units.find(u => u.id === booking.unit_id);
           const dailyTotal = (booking.nightly_rate || 0) + (booking.village_fee || 0);

           return (
            <div key={booking.id} className="glass p-6 rounded-2xl relative border-l-[6px] border-primary-500 shadow-sm hover:shadow-md transition-shadow dark:bg-slate-800/80">
              <div className="flex justify-between items-start mb-4">
                <div>
                   <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-1">{booking.tenant_name}</h3>
                   <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <span>{unit?.name}</span>
                      <span>•</span>
                      <span>{booking.nights} {t('nights')}</span>
                   </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {getStatusBadge(booking.status)}
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${booking.payment_status === PaymentStatus.PAID ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {booking.payment_status === PaymentStatus.PAID ? t('paid') : t('unpaid')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm mb-6 p-4 bg-gray-50 dark:bg-slate-900/50 rounded-xl">
                 <div>
                    <span className="block text-gray-400 text-xs mb-1">{t('dates')}</span>
                    <span className="font-medium dark:text-gray-200">
                        {formatDateSafe(booking.start_date)} - {formatDateSafe(booking.end_date)}
                    </span>
                 </div>
                 <div>
                    <span className="block text-gray-400 text-xs mb-1">{t('nightlyRate')} (Base)</span>
                    <span className="font-medium dark:text-gray-200">{booking.nightly_rate} {t('currency')}</span>
                 </div>
                 <div>
                    <span className="block text-gray-400 text-xs mb-1">{t('dailyTotal')} (+Fees)</span>
                    <span className="font-medium text-orange-600 dark:text-orange-400">{dailyTotal} {t('currency')}</span>
                 </div>
                 <div>
                    <span className="block text-gray-400 text-xs mb-1">{t('grandTotal')}</span>
                    <span className="font-bold text-primary-600 text-lg">{booking.total_rental_price} {t('currency')}</span>
                 </div>
              </div>
              
              {/* Notes Preview */}
              {booking.notes && (
                <div className="mb-4 text-xs text-gray-500 italic border-l-2 border-gray-200 pl-2">
                   "{booking.notes.length > 50 ? booking.notes.substring(0,50) + '...' : booking.notes}"
                </div>
              )}

              <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-4">
                 <div className="flex items-center gap-2">
                     <a 
                        href={`https://wa.me/20${booking.phone}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-2 text-green-600 hover:text-green-700 font-bold bg-green-50 hover:bg-green-100 px-3 py-2 rounded-lg transition-colors"
                     >
                        <MessageCircle size={18} />
                        <span className="hidden sm:inline">WhatsApp</span>
                     </a>
                     {booking.tenant_rating_good !== undefined && (
                        <span className={`p-2 rounded-lg ${booking.tenant_rating_good ? 'text-green-500 bg-green-50' : 'text-red-500 bg-red-50'}`} title={booking.tenant_rating_good ? t('welcomeAgain') : t('notWelcome')}>
                            {booking.tenant_rating_good ? <ThumbsUp size={16} /> : <ThumbsDown size={16} />}
                        </span>
                     )}
                 </div>
                 
                 <div className="flex gap-2">
                    <button onClick={() => generateReceipt(booking, unit?.name || '', language, t)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><FileText size={18} /></button>
                    <button onClick={() => handleEdit(booking)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"><Edit2 size={18} /></button>
                    <button onClick={() => deleteBooking(booking.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                 </div>
              </div>
            </div>
           );
        })}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in duration-200 bg-white dark:bg-slate-900">
            <h3 className="text-3xl font-bold mb-8 text-gray-800 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-4">
              {editingId ? t('editBooking') : t('addBooking')}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tenant Info */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('tenant')} Name</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full p-4 rounded-xl border bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                    value={formData.tenant_name}
                    onChange={e => setFormData({...formData, tenant_name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Phone (WhatsApp)</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 z-10 text-gray-500 font-bold select-none pointer-events-none">+20</span>
                    <input 
                        required 
                        type="tel" 
                        className="w-full p-4 pl-12 rounded-xl border bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                        placeholder="1XXXXXXXXX"
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value.replace(/[^0-9]/g, '')})}
                    />
                  </div>
                </div>
              </div>

              {/* Status & Rating */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                  <div className="space-y-2">
                       <label className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('status')}</label>
                       <select
                        className="w-full p-3 rounded-lg border bg-white dark:bg-slate-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 outline-none"
                        value={formData.status}
                        onChange={e => setFormData({...formData, status: e.target.value as BookingStatus})}
                       >
                         {Object.values(BookingStatus).map(s => <option key={s} value={s}>{s}</option>)}
                       </select>
                  </div>
                  
                  <div className="space-y-2">
                       <label className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('paymentStatus')}</label>
                       <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setFormData({...formData, payment_status: PaymentStatus.PAID})}
                            className={`flex-1 p-3 rounded-lg font-bold border-2 transition-all ${formData.payment_status === PaymentStatus.PAID ? 'border-green-500 bg-green-50 text-green-700' : 'border-transparent bg-white dark:bg-slate-700 text-gray-500'}`}
                          >
                            {t('paid')}
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData({...formData, payment_status: PaymentStatus.UNPAID})}
                            className={`flex-1 p-3 rounded-lg font-bold border-2 transition-all ${formData.payment_status === PaymentStatus.UNPAID ? 'border-red-500 bg-red-50 text-red-700' : 'border-transparent bg-white dark:bg-slate-700 text-gray-500'}`}
                          >
                            {t('unpaid')}
                          </button>
                       </div>
                  </div>

                  <div className="md:col-span-2 space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Tenant Rating (Evaluation)</label>
                      <div className="flex gap-4">
                          <button
                            type="button"
                            onClick={() => setFormData({...formData, tenant_rating_good: true})}
                            className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg font-bold border-2 transition-all ${formData.tenant_rating_good ? 'border-green-500 bg-green-50 text-green-700' : 'border-transparent bg-white dark:bg-slate-700 text-gray-400'}`}
                          >
                             <ThumbsUp size={18} /> {t('welcomeAgain')}
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData({...formData, tenant_rating_good: false})}
                            className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg font-bold border-2 transition-all ${!formData.tenant_rating_good ? 'border-red-500 bg-red-50 text-red-700' : 'border-transparent bg-white dark:bg-slate-700 text-gray-400'}`}
                          >
                             <ThumbsDown size={18} /> {t('notWelcome')}
                          </button>
                      </div>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Unit Select */}
                <div className="space-y-2 md:col-span-1">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('unit')}</label>
                  <select 
                    className="w-full p-4 rounded-xl border bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 outline-none"
                    value={formData.unit_id}
                    onChange={e => setFormData({...formData, unit_id: e.target.value})}
                  >
                    {state.units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                
                {/* Dates */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Start Date</label>
                  <input 
                    type="date" 
                    className="w-full p-4 rounded-xl border bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 outline-none"
                    value={formData.start_date}
                    onChange={e => setFormData({...formData, start_date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('nights')}</label>
                  <input 
                    type="number" 
                    min="1"
                    className="w-full p-4 rounded-xl border bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 outline-none"
                    value={formData.nights}
                    onChange={e => setFormData({...formData, nights: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              {/* Read Only End Date */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-700 dark:text-blue-300 flex justify-between items-center font-medium">
                <span>Check Out Date</span>
                <span className="font-bold text-lg">{formData.end_date}</span>
              </div>

              {/* Financials */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('nightlyRate')} (Base)</label>
                  <input 
                    type="number" 
                    className="w-full p-4 rounded-xl border bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 outline-none"
                    value={formData.nightly_rate}
                    onChange={e => setFormData({...formData, nightly_rate: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('villageFee')} <span className="text-xs font-normal text-gray-500">(Optional)</span></label>
                  <input 
                    type="number" 
                    className="w-full p-4 rounded-xl border bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 outline-none"
                    value={formData.village_fee}
                    onChange={e => setFormData({...formData, village_fee: parseFloat(e.target.value)})}
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800">
                  <span className="font-bold dark:text-gray-300">{t('housekeeping')}?</span>
                  <input 
                    type="checkbox" 
                    className="w-6 h-6 rounded text-primary-500 focus:ring-primary-500"
                    checked={formData.housekeeping_enabled}
                    onChange={e => setFormData({...formData, housekeeping_enabled: e.target.checked})}
                  />
                </div>
                {formData.housekeeping_enabled && (
                   <input 
                    type="number" 
                    placeholder="Housekeeping Price"
                    className="w-full p-4 rounded-xl border bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-top-2"
                    value={formData.housekeeping_price}
                    onChange={e => setFormData({...formData, housekeeping_price: parseFloat(e.target.value)})}
                  />
                )}

                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800">
                  <span className="font-bold dark:text-gray-300">{t('deposit')}?</span>
                  <input 
                    type="checkbox" 
                    className="w-6 h-6 rounded text-primary-500 focus:ring-primary-500"
                    checked={formData.deposit_enabled}
                    onChange={e => setFormData({...formData, deposit_enabled: e.target.checked})}
                  />
                </div>
                 {formData.deposit_enabled && (
                   <input 
                    type="number" 
                    placeholder="Deposit Amount"
                    className="w-full p-4 rounded-xl border bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-top-2"
                    value={formData.deposit_amount}
                    onChange={e => setFormData({...formData, deposit_amount: parseFloat(e.target.value)})}
                  />
                )}
              </div>
              
               {/* Total Display */}
               <div className="p-6 rounded-2xl bg-gray-900 text-white flex justify-between items-center shadow-lg">
                  <div className="flex flex-col">
                      <span className="text-gray-400 text-sm">Grand Total (Tenant Pays)</span>
                      <span className="text-xs text-gray-500">Includes Fees & Housekeeping</span>
                  </div>
                  <span className="text-3xl font-bold text-primary-400">
                    {formData.total_rental_price} {t('currency')}
                  </span>
               </div>
               
               {/* Notes Field */}
               <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('notes')}</label>
                  <textarea 
                    className="w-full p-4 rounded-xl border bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 outline-none h-24 resize-none"
                    placeholder="Any specific requests or details about the tenant..."
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                  />
               </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold transition-colors"
                >
                  {t('cancel')}
                </button>
                <button 
                  type="submit" 
                  className="flex-1 p-4 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold shadow-lg shadow-primary-500/30 transition-all"
                >
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};