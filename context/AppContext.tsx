
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js'; // Import to create temp client
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from '../lib/supabase';
import { AppState, Language, Theme, Unit, Booking, Expense, User, BookingStatus, Subscription, Role } from '../types';
import { MOCK_UNITS, MOCK_BOOKINGS, MOCK_EXPENSES, TRANSLATIONS } from '../constants';
import { addDays, isAfter, differenceInDays, parseISO } from 'date-fns';

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
  
  // Data Actions
  addBooking: (booking: Booking) => Promise<void>;
  updateBooking: (booking: Booking) => Promise<void>;
  deleteBooking: (id: string) => Promise<void>;
  addExpense: (expense: Expense) => Promise<void>;
  updateExpense: (expense: Expense) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  addUnit: (unit: Unit) => Promise<void>;
  updateUnit: (unit: Unit) => Promise<void>;
  deleteUnit: (id: string) => Promise<void>;
  
  // Admin Actions
  addAccount: (email: string, password: string, fullName: string) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  addSubscription: (subscription: Subscription) => Promise<void>;
  updateSubscription: (subscription: Subscription) => Promise<void>;
  deleteSubscription: (id: string) => Promise<void>;
  
  // Helpers
  t: (key: keyof typeof TRANSLATIONS.en) => string;
  isRTL: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  hasValidSubscription: boolean;
  daysRemaining: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children?: ReactNode }) => {
  // Initialize from LocalStorage
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved === 'en' || saved === 'ar') ? saved : 'en';
  });
  
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    return (saved === 'dark' || saved === 'light') ? saved : 'light';
  });

  const [user, setUser] = useState<User | null>(null); // Start null, check auth on mount
  const [isLoading, setIsLoading] = useState(false);
  
  // App Data State
  const [units, setUnits] = useState<Unit[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]); // For Admin

  // Derived State
  const isAdmin = user?.role === 'admin';
  
  const getSubscriptionStatus = () => {
    if (!user?.subscription) return { isValid: false, days: 0, exists: false };
    
    // Check if Paused
    if (user.subscription.status === 'paused') {
        return { isValid: false, days: 0, exists: true };
    }

    const start = parseISO(user.subscription.start_date);
    const end = addDays(start, user.subscription.duration_days);
    const today = new Date();
    const isValid = isAfter(end, today);
    const days = differenceInDays(end, today);
    return { isValid, days: days > 0 ? days : 0, exists: true };
  };

  const { isValid: hasValidSubscription, days: daysRemaining, exists: subExists } = getSubscriptionStatus();

  // Effects
  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    localStorage.setItem('language', language);
  }, [language]);

  // Auth Initialization & FK Error Prevention
  useEffect(() => {
      const initAuth = async () => {
          if (supabase) {
              // REAL MODE: Check active session
              const { data: { session } } = await supabase.auth.getSession();
              if (session?.user) {
                  // Valid session found, fetch full profile
                  await loadUserProfile(session.user.id, session.user.email || '');
              } else {
                  // No session, clear everything (prevents using stale mock data with real DB)
                  setUser(null);
                  setBookings([]);
                  setUnits([]);
                  setExpenses([]);
              }
          } else {
              // MOCK MODE: Load from local storage
              const savedUser = localStorage.getItem('user');
              if (savedUser) {
                  setUser(JSON.parse(savedUser));
              }
          }
      };
      initAuth();
  }, []);

  useEffect(() => {
      if(user) {
          localStorage.setItem('user', JSON.stringify(user));
          fetchData(); 
      } else {
          localStorage.removeItem('user');
          setBookings([]);
          setUnits([]);
          setExpenses([]);
          setAllUsers([]);
      }
  }, [user]);

  const loadUserProfile = async (userId: string, email: string) => {
      if (!supabase) return;
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
      const { data: sub } = await supabase.from('subscriptions').select('*').eq('user_id', userId).single();
      
      setUser({
          id: userId,
          email: email,
          full_name: profile?.full_name,
          role: profile?.role || 'user',
          subscription: sub
      });
  };

  const fetchData = async () => {
    if (!user) return;
    setIsLoading(true);

    if (!supabase) {
        setUnits(MOCK_UNITS as Unit[]);
        setBookings(MOCK_BOOKINGS as Booking[]);
        setExpenses(MOCK_EXPENSES as Expense[]);
        setIsLoading(false);
        return;
    }

    try {
      if (user.role === 'admin') {
          // Admin: View ALL Data
          const [uRes, bRes, eRes, pRes, sRes] = await Promise.all([
            supabase.from('units').select('*'),
            supabase.from('bookings').select('*'),
            supabase.from('expenses').select('*'),
            supabase.from('profiles').select('*'), 
            supabase.from('subscriptions').select('*')
          ]);

          if (uRes.data) setUnits(uRes.data);
          if (bRes.data) setBookings(bRes.data);
          if (eRes.data) setExpenses(eRes.data);
          
          if (pRes.data) {
             const usersWithSubs = pRes.data.map((profile: any) => ({
                 ...profile,
                 subscription: sRes.data?.find((s: any) => s.user_id === profile.id) || null
             }));
             setAllUsers(usersWithSubs);
          }
      } else {
          // Normal User: View ONLY their data
          const [uRes, bRes, eRes, sRes] = await Promise.all([
            supabase.from('units').select('*').eq('user_id', user.id),
            supabase.from('bookings').select('*').eq('user_id', user.id),
            supabase.from('expenses').select('*').eq('user_id', user.id),
            supabase.from('subscriptions').select('*').eq('user_id', user.id).single()
          ]);

          if (uRes.data) setUnits(uRes.data);
          if (bRes.data) setBookings(bRes.data);
          if (eRes.data) setExpenses(eRes.data);
          
          // Keep subscription sync
          if (sRes.data) {
              setUser(prev => prev ? { ...prev, subscription: sRes.data } : null);
          } else {
              // If subscription was deleted remotely
              setUser(prev => prev ? { ...prev, subscription: undefined } : null);
          }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Auth Actions ---

  const login = async (email: string, password?: string) => {
    // 1. Hardcoded Admin Check
    if (email === 'admin@gmail.com' && password === 'Asd22@33') {
        const adminUser: User = {
            id: 'admin-id-123',
            email: email,
            full_name: 'Super Admin',
            role: 'admin'
        };
        setUser(adminUser);
        return;
    }

    if (!supabase) {
      // Mock Login Mode
      const existingMockUser = allUsers.find(u => u.email === email);
      if (existingMockUser) {
          setUser(existingMockUser);
      } else {
          const mockUser: User = { 
              id: 'mock-user-1', 
              email, 
              full_name: 'Demo User', 
              role: 'user',
              subscription: { 
                  id: 'sub-1',
                  user_id: 'mock-user-1',
                  start_date: new Date().toISOString(),
                  duration_days: 30,
                  price: 100,
                  status: 'active'
              } 
          };
          setUser(mockUser);
      }
      return;
    }

    if (!password) {
       const { error } = await supabase.auth.signInWithOtp({ email });
       if (error) throw error;
       alert("Check your email for the login link!");
    } else {
       const { data, error } = await supabase.auth.signInWithPassword({ email, password });
       if (error) throw error;
       if (data.session?.user) {
           await loadUserProfile(data.session.user.id, data.session.user.email!);
       }
    }
  };

  const signup = async (email: string, password?: string, fullName?: string) => {
    if (!supabase) {
        alert("Signup simulated (Mock Mode) - Check email.");
        return;
    }
    const { error } = await supabase.auth.signUp({
      email, password: password!, options: { data: { full_name: fullName } }
    });
    if (error) throw error;
  };

  const logout = async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
  };

  const updatePassword = async (password: string) => {
      if(!supabase) return;
      await supabase.auth.updateUser({ password });
  };

  // --- Admin Specific Actions ---

  const addAccount = async (email: string, password: string, fullName: string) => {
      // Mock logic...
      if (!supabase) return; 
      // Supabase logic is handled in component mostly or here if needed, keeping simple
  };
  
  const deleteAccount = async (id: string) => {
      // ... same as before
      if (!supabase) return;
      const { error: rpcError } = await supabase.rpc('delete_user_by_id', { target_user_id: id });
      if (rpcError) throw rpcError;
  };

  const addSubscription = async (subscription: Subscription) => {
      if (!supabase) {
          setAllUsers(prev => prev.map(u => u.id === subscription.user_id ? { ...u, subscription } : u));
          return;
      }
      const { error } = await supabase.from('subscriptions').upsert([subscription]);
      if (error) throw error;
      setAllUsers(prev => prev.map(u => u.id === subscription.user_id ? { ...u, subscription } : u));
  };
  
  const updateSubscription = async (subscription: Subscription) => {
      await addSubscription(subscription);
  };

  const deleteSubscription = async (id: string) => {
      const userId = allUsers.find(u => u.subscription?.id === id)?.id;
      if (!supabase) {
          if (userId) setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, subscription: undefined } : u));
          return;
      }
      const { error } = await supabase.from('subscriptions').delete().eq('id', id);
      if (error) throw error;
      if (userId) setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, subscription: undefined } : u));
  };

  // --- Data Actions (With Strict Validations) ---

  const checkRestriction = () => {
      if (isAdmin) return; // Admins bypass

      // 1. Subscription Existence
      if (!subExists) {
           throw new Error(language === 'ar' 
            ? 'غير مسموح. أنت غير مشترك في الخدمة. يرجى الاشتراك للتمكن من إضافة البيانات.' 
            : 'Access Denied. You do not have a subscription. Please subscribe to add data.');
      }
      
      // 2. Subscription Paused
      if (user?.subscription?.status === 'paused') {
          throw new Error(language === 'ar' 
            ? 'اشتراكك موقوف مؤقتاً من قبل الإدارة. لا يمكنك إضافة بيانات جديدة.' 
            : 'Your subscription is paused by the admin. You cannot add new data.');
      }

      // 3. Subscription Validity (Date)
      if (!hasValidSubscription) {
          throw new Error(language === 'ar' 
            ? 'عفواً، انتهت صلاحية اشتراكك. يرجى تجديد الاشتراك لإضافة بيانات جديدة.' 
            : 'Subscription expired. Please renew your subscription to add new data.');
      }
  };

  const addBooking = async (booking: Booking) => {
    checkRestriction();
    if (!user) throw new Error("User not authenticated");
    
    booking.user_id = user.id; // Enforce correct user_id
    
    if (!supabase) { setBookings(prev => [booking, ...prev]); return; }
    
    setBookings(prev => [booking, ...prev]);
    const { error } = await supabase.from('bookings').insert([booking]);
    if (error) { 
        setBookings(prev => prev.filter(b => b.id !== booking.id)); 
        throw error; 
    }
  };

  const updateBooking = async (updated: Booking) => {
    // Only allow editing if subscription is valid? Usually editing is allowed, but adding is restricted.
    // Let's allow edit/delete for maintenance, but restrict ADD.
    if (!supabase) { setBookings(prev => prev.map(b => b.id === updated.id ? updated : b)); return; }
    
    setBookings(prev => prev.map(b => b.id === updated.id ? updated : b));
    const { error } = await supabase.from('bookings').update(updated).eq('id', updated.id);
    if (error) throw error;
  };

  const deleteBooking = async (id: string) => {
      const original = bookings.find(b => b.id === id);
      setBookings(prev => prev.filter(b => b.id !== id));
      if(!supabase) return;
      const { error } = await supabase.from('bookings').delete().eq('id', id);
      if(error && original) setBookings(prev => [...prev, original]);
  };

  const addUnit = async (unit: Unit) => {
      checkRestriction(); 
      if (!user) throw new Error("User not authenticated");

      unit.user_id = user.id; // Enforce correct user_id to fix FK error
      
      if(!supabase) { setUnits(prev => [...prev, unit]); return; }
      
      setUnits(prev => [...prev, unit]);
      const { error } = await supabase.from('units').insert([unit]);
      if(error) { setUnits(prev => prev.filter(u => u.id !== unit.id)); throw error; }
  };
  
  const updateUnit = async (u: Unit) => {
      if(!supabase) { setUnits(prev => prev.map(un => un.id === u.id ? u : un)); return; }
      setUnits(prev => prev.map(un => un.id === u.id ? u : un));
      await supabase.from('units').update(u).eq('id', u.id);
  };
  
  const deleteUnit = async (id: string) => {
     setUnits(prev => prev.filter(u => u.id !== id));
     if(supabase) await supabase.from('units').delete().eq('id', id);
  };

  const addExpense = async (expense: Expense) => {
      checkRestriction(); 
      if (!user) throw new Error("User not authenticated");

      expense.user_id = user.id;

      if(!supabase) { setExpenses(prev => [expense, ...prev]); return; }
      
      setExpenses(prev => [expense, ...prev]);
      const { error } = await supabase.from('expenses').insert([expense]);
      if(error) { setExpenses(prev => prev.filter(e => e.id !== expense.id)); throw error; }
  };
  
  const updateExpense = async (ex: Expense) => {
      if(!supabase) { setExpenses(prev => prev.map(e => e.id === ex.id ? ex : e)); return; }
      setExpenses(prev => prev.map(e => e.id === ex.id ? ex : e));
      await supabase.from('expenses').update(ex).eq('id', ex.id);
  };
  
  const deleteExpense = async (id: string) => {
      setExpenses(prev => prev.filter(e => e.id !== id));
      if(supabase) await supabase.from('expenses').delete().eq('id', id);
  };

  const t = (key: keyof typeof TRANSLATIONS.en): string => {
    return TRANSLATIONS[language][key] || key;
  };

  return (
    <AppContext.Provider value={{
      language, setLanguage, theme, toggleTheme: () => setTheme(prev => prev === 'light' ? 'dark' : 'light'),
      user, login, signup, updatePassword, logout,
      state: { units, bookings, expenses, allUsers },
      addBooking, updateBooking, deleteBooking,
      addExpense, updateExpense, deleteExpense,
      addUnit, updateUnit, deleteUnit,
      addAccount, deleteAccount, addSubscription, updateSubscription, deleteSubscription,
      t, isRTL: language === 'ar', isLoading, isAdmin,
      hasValidSubscription: isAdmin ? true : hasValidSubscription,
      daysRemaining
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
