import React, { useState } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer, ToolbarProps, View, EventProps } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS, arSA } from 'date-fns/locale';
import { useApp } from '../context/AppContext';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, List, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BookingStatus } from '../types';

// Localizer setup
const locales = {
  'en-US': enUS,
  'ar': arSA,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Custom Event Component for richer display
const CustomEvent = ({ event }: EventProps<any>) => {
  // Icon based on status
  const StatusIcon = () => {
    switch(event.status) {
        case BookingStatus.CONFIRMED: return <CheckCircle size={12} strokeWidth={3} />;
        case BookingStatus.PENDING: return <Clock size={12} strokeWidth={3} />;
        case BookingStatus.CANCELLED: return <XCircle size={12} strokeWidth={3} />;
        default: return null;
    }
  };

  return (
    <div className="flex flex-col justify-center h-full w-full px-1 overflow-hidden leading-tight" title={`${event.title} • ${event.desc}`}>
      <div className="flex items-center gap-1.5 w-full mb-0.5">
         <span className="shrink-0 opacity-90"><StatusIcon /></span>
         <span className="font-bold text-xs truncate w-full block">{event.title}</span>
      </div>
      <div className="text-[10px] opacity-80 truncate w-full block font-medium pl-0.5">
        {event.desc}
      </div>
    </div>
  );
};

// Custom Toolbar Component
const CustomToolbar = ({ onNavigate, onView, date, view }: ToolbarProps) => {
  const { t, isRTL } = useApp();
  const navigate = useNavigate();

  const label = format(date, 'MMMM yyyy');

  return (
    <div className="flex flex-col xl:flex-row items-center justify-between mb-4 gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
      
      {/* Left: Actions */}
      <div className="w-full xl:w-auto flex items-center gap-3 order-2 xl:order-1">
         <button 
            onClick={() => navigate('/bookings')}
            className="flex-1 xl:flex-none bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary-600/20 active:scale-95 text-sm"
        >
            <Plus size={18} strokeWidth={2.5} />
            <span>{t('addBooking')}</span>
        </button>

        <div className="flex bg-gray-100 dark:bg-slate-700 p-1 rounded-xl">
           <button 
             onClick={() => onView('month')}
             className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${view === 'month' ? 'bg-white dark:bg-slate-600 shadow text-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
           >
             <CalendarIcon size={14} /> <span className="hidden sm:inline">Month</span>
           </button>
           <button 
             onClick={() => onView('agenda')}
             className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${view === 'agenda' ? 'bg-white dark:bg-slate-600 shadow text-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
           >
             <List size={14} /> <span className="hidden sm:inline">Agenda</span>
           </button>
        </div>
      </div>

      {/* Center: Navigation & Title */}
      <div className="w-full xl:w-auto flex items-center justify-between xl:justify-center gap-4 order-1 xl:order-2">
         <button onClick={() => onNavigate('PREV')} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full text-gray-600 dark:text-gray-300 transition-colors">
            {isRTL ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
         </button>
         
         <div className="text-center min-w-[140px]">
            <h2 className="text-lg md:text-xl font-bold text-gray-800 dark:text-white font-sans capitalize">{label}</h2>
         </div>

         <button onClick={() => onNavigate('NEXT')} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full text-gray-600 dark:text-gray-300 transition-colors">
            {isRTL ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
         </button>
      </div>
      
      {/* Right: Legend (Responsive) */}
      <div className="flex flex-wrap justify-center items-center gap-2 order-3 text-[10px] md:text-xs font-medium w-full xl:w-auto mt-2 xl:mt-0">
         <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full border border-blue-100 dark:border-blue-800">
            <span className="w-2 h-2 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.5)]"></span>
            <span className="text-gray-700 dark:text-gray-300">{t('confirmed')}</span>
         </div>
         <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded-full border border-amber-100 dark:border-amber-800">
            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]"></span>
            <span className="text-gray-700 dark:text-gray-300">{t('pending')}</span>
         </div>
         <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-900/30 px-2 py-1 rounded-full border border-rose-100 dark:border-rose-800">
            <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></span>
            <span className="text-gray-700 dark:text-gray-300">{t('cancelled')}</span>
         </div>
      </div>
    </div>
  );
};

export const CalendarView = () => {
  const { state, isRTL, language } = useApp();
  const [view, setView] = useState<View>('month');

  const events = state.bookings.map(b => ({
    id: b.id,
    title: b.tenant_name,
    desc: state.units.find(u => u.id === b.unit_id)?.name || 'Unit',
    start: new Date(b.start_date),
    end: new Date(b.end_date),
    status: b.status,
    resource: b.unit_id
  }));

  const messages = {
    allDay: 'All Day',
    previous: isRTL ? 'السابق' : 'Back',
    next: isRTL ? 'التالي' : 'Next',
    today: isRTL ? 'اليوم' : 'Today',
    month: isRTL ? 'شهر' : 'Month',
    week: isRTL ? 'أسبوع' : 'Week',
    day: isRTL ? 'يوم' : 'Day',
    agenda: isRTL ? 'أجندة' : 'Agenda',
    date: isRTL ? 'التاريخ' : 'Date',
    time: isRTL ? 'الوقت' : 'Time',
    event: isRTL ? 'حدث' : 'Event',
    noEventsInRange: 'No bookings in this range',
    showMore: (total: number) => `+${total} more`
  };

  const eventPropGetter = (event: any) => {
    let className = 'shadow-sm border-l-4 transition-all hover:brightness-95 ';
    
    switch (event.status) {
        case BookingStatus.CONFIRMED:
            className += 'bg-blue-600 border-blue-800 text-white';
            break;
        case BookingStatus.PENDING:
            className += 'bg-amber-400 border-amber-600 text-slate-900 font-bold'; // Dark text on Amber for contrast
            break;
        case BookingStatus.CANCELLED:
            className += 'bg-rose-500 border-rose-800 text-white opacity-60 decoration-slice line-through';
            break;
        default:
            className += 'bg-slate-500 border-slate-700 text-white';
    }

    return { className };
  };

  return (
    <div className="h-[calc(100vh-120px)] p-2 md:p-6 glass rounded-3xl flex flex-col overflow-hidden bg-white/40 dark:bg-slate-900/40 border border-white/20">
      <div className="flex-1">
        <BigCalendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            rtl={isRTL} 
            culture={language === 'ar' ? 'ar' : 'en-US'}
            messages={messages}
            components={{
                toolbar: CustomToolbar,
                event: CustomEvent
            }}
            view={view}
            onView={setView}
            eventPropGetter={eventPropGetter}
            views={['month', 'agenda']} 
            popup
            className="font-sans h-full text-gray-700 dark:text-gray-200"
        />
      </div>
    </div>
  );
};