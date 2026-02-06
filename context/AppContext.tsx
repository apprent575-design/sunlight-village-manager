import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { AppState, Language, Theme, Unit, Booking, Expense, User, BookingStatus } from '../types';
import { MOCK_UNITS, MOCK_BOOKINGS, MOCK_EXPENSES, TRANSLATIONS } from '../constants';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  toggleTheme: () => void;
  user: User | null;
  login: (email: string, password?: string) => Promise<void>;
  signup: (email: string, password?: string, fullName?: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  logout: () => void;
  state: AppState;
  addBooking: (booking: Booking) => Promise<void>;
  updateBooking: (booking: Booking) => Promise<void>;
  deleteBooking: (id: string) => Promise<void>;
  addExpense: (expense: Expense) => Promise<void>;
  updateExpense: (expense: Expense) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  addUnit: (unit: Unit) => Promise<void>;
  updateUnit: (unit: Unit) => Promise<void>;
  deleteUnit: (id: string) => Promise<void>;
  t: (key: keyof typeof TRANSLATIONS.en) => string;
  isRTL: boolean;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children?: ReactNode }) => {
  // Initialize from LocalStorage or default
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved === 'en' || saved === 'ar') ? saved : 'en';
  });
  
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    return (saved === 'dark' || saved === 'light') ? saved : 'light';
  });

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // App Data State
  const [units, setUnits] = useState<Unit[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // 1. Theme Effect (Update DOM & LocalStorage)
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // 2. RTL Effect (Update DOM & LocalStorage)
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    localStorage.setItem('language', language);
  }, [language]);

  // 3. Initialize Data & Auth
  useEffect(() => {
    if (!supabase) {
      // Fallback to Mock Data ONLY if no Supabase keys are configured in lib/supabase.ts
      console.warn("Using Mock Data (No Supabase Connection)");
      setUnits(MOCK_UNITS as Unit[]);
      setBookings(MOCK_BOOKINGS as Booking[]);
      setExpenses(MOCK_EXPENSES as Expense[]);
      return;
    }

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email || '', full_name: session.user.user_metadata?.full_name });
        fetchData();
      }
    });

    // Listen for Auth Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email || '', full_name: session.user.user_metadata?.full_name });
        fetchData();
      } else {
        setUser(null);
        setBookings([]);
        setUnits([]);
        setExpenses([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchData = async () => {
    if (!supabase) return;
    setIsLoading(true);
    try {
      const [unitsRes, bookingsRes, expensesRes] = await Promise.all([
        supabase.from('units').select('*'),
        supabase.from('bookings').select('*').order('created_at', { ascending: false }),
        supabase.from('expenses').select('*').order('date', { ascending: false })
      ]);

      if (unitsRes.data) setUnits(unitsRes.data);
      if (bookingsRes.data) setBookings(bookingsRes.data);
      if (expensesRes.data) setExpenses(expensesRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Helper: Availability Check ---
  const checkAvailability = (newBooking: Booking) => {
    // Skip check if status is Cancelled
    if (newBooking.status === BookingStatus.CANCELLED) return true;

    const start = new Date(newBooking.start_date);
    const end = new Date(newBooking.end_date);

    const hasConflict = bookings.some(existing => {
      // Ignore self
      if (existing.id === newBooking.id) return false;
      // Ignore cancelled bookings
      if (existing.status === BookingStatus.CANCELLED) return false;
      // Must be same unit
      if (existing.unit_id !== newBooking.unit_id) return false;

      const existingStart = new Date(existing.start_date);
      const existingEnd = new Date(existing.end_date);

      // Overlap logic: (StartA < EndB) and (EndA > StartB)
      return start < existingEnd && end > existingStart;
    });

    if (hasConflict) {
      throw new Error(language === 'ar' 
        ? 'هذه الوحدة محجوزة بالفعل في هذه الفترة' 
        : 'This unit is already booked for the selected dates.'
      );
    }
    return true;
  };

  // --- Auth Actions ---

  const login = async (email: string, password?: string) => {
    if (!supabase) {
      // Mock Login
      setUser({ id: 'mock-user-1', email, full_name: 'Admin User' });
      return;
    }

    if (!password) {
       const { error } = await supabase.auth.signInWithOtp({ email });
       if (error) throw error;
       alert("Check your email for the login link!");
    } else {
       const { error } = await supabase.auth.signInWithPassword({ email, password });
       if (error) throw error;
    }
  };

  const signup = async (email: string, password?: string, fullName?: string) => {
    if (!supabase) {
      setUser({ id: 'mock-user-new', email, full_name: fullName });
      return;
    }
    
    if (!password) throw new Error("Password required for signup");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    });

    if (error) throw error;
  };

  const updatePassword = async (password: string) => {
    if (!supabase) {
        console.log("Mock: Password updated to", password);
        return;
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  };

  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
  };

  // --- Database Actions ---

  const addBooking = async (booking: Booking) => {
    checkAvailability(booking); 

    if (!supabase) {
      setBookings(prev => [booking, ...prev]);
      return;
    }
    // Optimistic Update
    setBookings(prev => [booking, ...prev]);

    // Send full object. Ensure SQL columns exist!
    const { error } = await supabase.from('bookings').insert([booking]);
    if (error) { 
        console.error(error);
        setBookings(prev => prev.filter(b => b.id !== booking.id)); // Rollback
        throw error; 
    }
  };

  const updateBooking = async (updatedBooking: Booking) => {
    checkAvailability(updatedBooking); 

    if (!supabase) {
      setBookings(prev => prev.map(b => b.id === updatedBooking.id ? updatedBooking : b));
      return;
    }
    
    const original = bookings.find(b => b.id === updatedBooking.id);
    setBookings(prev => prev.map(b => b.id === updatedBooking.id ? updatedBooking : b)); // Optimistic

    const { error } = await supabase.from('bookings').update(updatedBooking).eq('id', updatedBooking.id);
    if (error) { 
        console.error(error);
        if(original) setBookings(prev => prev.map(b => b.id === updatedBooking.id ? original : b)); // Rollback
        throw error; 
    }
  };

  const deleteBooking = async (id: string) => {
    const original = bookings.find(b => b.id === id);
    // Optimistic Update
    setBookings(prev => prev.filter(b => b.id !== id));
    
    if (!supabase) return;

    const { error } = await supabase.from('bookings').delete().eq('id', id);
    if (error) { 
        console.error("Supabase Delete Failed", error);
        if(original) setBookings(prev => [...prev, original]); // Rollback
        alert("Failed to delete booking from database. Restoring..."); 
    }
  };

  const addExpense = async (expense: Expense) => {
    if (!supabase) {
      setExpenses(prev => [expense, ...prev]);
      return;
    }
    setExpenses(prev => [expense, ...prev]);
    const { error } = await supabase.from('expenses').insert([expense]);
    if (error) { 
        console.error(error); 
        setExpenses(prev => prev.filter(e => e.id !== expense.id));
        alert("Failed to add expense"); 
    } 
  };

  const updateExpense = async (updatedExpense: Expense) => {
    if (!supabase) {
      setExpenses(prev => prev.map(e => e.id === updatedExpense.id ? updatedExpense : e));
      return;
    }
    const original = expenses.find(e => e.id === updatedExpense.id);
    setExpenses(prev => prev.map(e => e.id === updatedExpense.id ? updatedExpense : e));

    const { error } = await supabase.from('expenses').update(updatedExpense).eq('id', updatedExpense.id);
    if (error) { 
        console.error(error); 
        if(original) setExpenses(prev => prev.map(e => e.id === updatedExpense.id ? original : e));
        alert("Failed to update expense"); 
    } 
  };

  const deleteExpense = async (id: string) => {
    const original = expenses.find(e => e.id === id);
    setExpenses(prev => prev.filter(e => e.id !== id));

    if (!supabase) return;

    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) { 
        console.error(error); 
        if(original) setExpenses(prev => [...prev, original]);
        alert("Failed to delete expense"); 
    } 
  };

  const addUnit = async (unit: Unit) => {
    if (!supabase) {
      setUnits(prev => [...prev, unit]);
      return;
    }
    setUnits(prev => [...prev, unit]);
    const { error } = await supabase.from('units').insert([unit]);
    if (error) { 
        console.error(error); 
        setUnits(prev => prev.filter(u => u.id !== unit.id));
        alert("Failed to add unit"); 
    } 
  };

  const updateUnit = async (updatedUnit: Unit) => {
    if (!supabase) {
      setUnits(prev => prev.map(u => u.id === updatedUnit.id ? updatedUnit : u));
      return;
    }
    const original = units.find(u => u.id === updatedUnit.id);
    setUnits(prev => prev.map(u => u.id === updatedUnit.id ? updatedUnit : u));

    const { error } = await supabase.from('units').update(updatedUnit).eq('id', updatedUnit.id);
    if (error) { 
        console.error(error); 
        if(original) setUnits(prev => prev.map(u => u.id === updatedUnit.id ? original : u));
        alert("Failed to update unit"); 
    } 
  };

  const deleteUnit = async (id: string) => {
    // Store backup for rollback
    const originalUnit = units.find(u => u.id === id);
    const originalBookings = bookings.filter(b => b.unit_id === id);
    const originalExpenses = expenses.filter(e => e.unit_id === id);

    // Optimistic Update: Remove everything locally first
    setBookings(prev => prev.filter(b => b.unit_id !== id));
    setExpenses(prev => prev.filter(e => e.unit_id !== id));
    setUnits(prev => prev.filter(u => u.id !== id));

    if (!supabase) return;

    try {
        // A. Delete Expenses linked to unit
        const { error: expError } = await supabase.from('expenses').delete().eq('unit_id', id);
        if (expError) console.error("Error deleting expenses:", expError); // Don't block, try to continue

        // B. Delete Bookings linked to unit
        const { error: bkError } = await supabase.from('bookings').delete().eq('unit_id', id);
        if (bkError) console.error("Error deleting bookings:", bkError);

        // C. Delete Unit
        const { error: unitError } = await supabase.from('units').delete().eq('id', id);
        if (unitError) throw unitError;

    } catch (error) {
        console.error("Failed to delete unit (and its data):", error);
        alert("Failed to delete unit. Please check your connection.");
        // Rollback state
        if(originalUnit) setUnits(prev => [...prev, originalUnit]);
        if(originalBookings.length) setBookings(prev => [...prev, ...originalBookings]);
        if(originalExpenses.length) setExpenses(prev => [...prev, ...originalExpenses]);
    }
  };

  const t = (key: keyof typeof TRANSLATIONS.en): string => {
    return TRANSLATIONS[language][key] || key;
  };

  return (
    <AppContext.Provider value={{
      language,
      setLanguage,
      theme,
      toggleTheme: () => setTheme(prev => prev === 'light' ? 'dark' : 'light'),
      user,
      login,
      signup,
      updatePassword,
      logout,
      state: { units, bookings, expenses },
      addBooking,
      updateBooking,
      deleteBooking,
      addExpense,
      updateExpense,
      deleteExpense,
      addUnit,
      updateUnit,
      deleteUnit,
      t,
      isRTL: language === 'ar',
      isLoading
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};