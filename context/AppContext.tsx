import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { AppState, Language, Theme, Unit, Booking, Expense, User } from '../types';
import { MOCK_UNITS, MOCK_BOOKINGS, MOCK_EXPENSES, TRANSLATIONS } from '../constants';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  toggleTheme: () => void;
  user: User | null;
  login: (email: string, password?: string) => Promise<void>;
  signup: (email: string, password?: string, fullName?: string) => Promise<void>;
  logout: () => void;
  state: AppState;
  addBooking: (booking: Booking) => Promise<void>;
  updateBooking: (booking: Booking) => Promise<void>;
  deleteBooking: (id: string) => Promise<void>;
  addExpense: (expense: Expense) => Promise<void>;
  addUnit: (unit: Unit) => Promise<void>;
  updateUnit: (unit: Unit) => Promise<void>;
  deleteUnit: (id: string) => Promise<void>;
  t: (key: keyof typeof TRANSLATIONS.en) => string;
  isRTL: boolean;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children?: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [theme, setTheme] = useState<Theme>('light');
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // App Data State
  const [units, setUnits] = useState<Unit[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // 1. Theme Effect
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // 2. RTL Effect
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  // 3. Initialize Data & Auth
  useEffect(() => {
    if (!supabase) {
      // Fallback to Mock Data if no Supabase keys
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

  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
  };

  // --- Database Actions ---

  const addBooking = async (booking: Booking) => {
    if (!supabase) {
      setBookings(prev => [booking, ...prev]);
      return;
    }
    const { error } = await supabase.from('bookings').insert([booking]);
    if (error) { console.error(error); alert("Failed to save booking"); } 
    else { setBookings(prev => [booking, ...prev]); fetchData(); }
  };

  const updateBooking = async (updatedBooking: Booking) => {
    if (!supabase) {
      setBookings(prev => prev.map(b => b.id === updatedBooking.id ? updatedBooking : b));
      return;
    }
    const { error } = await supabase.from('bookings').update(updatedBooking).eq('id', updatedBooking.id);
    if (error) { console.error(error); alert("Failed to update booking"); } 
    else { setBookings(prev => prev.map(b => b.id === updatedBooking.id ? updatedBooking : b)); }
  };

  const deleteBooking = async (id: string) => {
    if (!supabase) {
      setBookings(prev => prev.filter(b => b.id !== id));
      return;
    }
    const { error } = await supabase.from('bookings').delete().eq('id', id);
    if (error) { console.error(error); alert("Failed to delete booking"); } 
    else { setBookings(prev => prev.filter(b => b.id !== id)); }
  };

  const addExpense = async (expense: Expense) => {
    if (!supabase) {
      setExpenses(prev => [expense, ...prev]);
      return;
    }
    const { error } = await supabase.from('expenses').insert([expense]);
    if (error) { console.error(error); alert("Failed to add expense"); } 
    else { setExpenses(prev => [expense, ...prev]); fetchData(); }
  };

  const addUnit = async (unit: Unit) => {
    if (!supabase) {
      setUnits(prev => [...prev, unit]);
      return;
    }
    const { error } = await supabase.from('units').insert([unit]);
    if (error) { console.error(error); alert("Failed to add unit"); } 
    else { setUnits(prev => [...prev, unit]); fetchData(); }
  };

  const updateUnit = async (updatedUnit: Unit) => {
    if (!supabase) {
      setUnits(prev => prev.map(u => u.id === updatedUnit.id ? updatedUnit : u));
      return;
    }
    const { error } = await supabase.from('units').update(updatedUnit).eq('id', updatedUnit.id);
    if (error) { console.error(error); alert("Failed to update unit"); } 
    else { setUnits(prev => prev.map(u => u.id === updatedUnit.id ? updatedUnit : u)); }
  };

  const deleteUnit = async (id: string) => {
    // 1. Mock Mode: Update Local State immediately (Cascade manually)
    if (!supabase) {
      setBookings(prev => prev.filter(b => b.unit_id !== id));
      setExpenses(prev => prev.filter(e => e.unit_id !== id));
      setUnits(prev => prev.filter(u => u.id !== id));
      return;
    }

    // 2. Real DB Mode: Perform Cascade Delete manually to avoid FK errors
    try {
        // A. Delete Expenses linked to unit
        const { error: expError } = await supabase.from('expenses').delete().eq('unit_id', id);
        if (expError) throw expError;

        // B. Delete Bookings linked to unit
        const { error: bkError } = await supabase.from('bookings').delete().eq('unit_id', id);
        if (bkError) throw bkError;

        // C. Delete Unit
        const { error: unitError } = await supabase.from('units').delete().eq('id', id);
        if (unitError) throw unitError;

        // D. Update State
        setBookings(prev => prev.filter(b => b.unit_id !== id));
        setExpenses(prev => prev.filter(e => e.unit_id !== id));
        setUnits(prev => prev.filter(u => u.id !== id));
        
    } catch (error) {
        console.error("Failed to delete unit (and its data):", error);
        alert("Failed to delete unit. Please check your connection.");
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
      logout,
      state: { units, bookings, expenses },
      addBooking,
      updateBooking,
      deleteBooking,
      addExpense,
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