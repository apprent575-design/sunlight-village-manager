
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { AppState, Language, Theme, Unit, Booking, Expense, User, Subscription, SessionLog } from '../types';
import { TRANSLATIONS } from '../constants';
import { addDays, isAfter, differenceInDays, format, isValid, subHours } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';

// --- CONFIGURATION ---
const SUPER_ADMIN_EMAIL = 'admin@gmail.com';

// Fix: Define Locale type from the imported object as it might not be exported by 'date-fns' directly
type Locale = typeof enUS;

interface DateSettings {
  language: 'match' | 'en' | 'ar';
  format: 'names' | 'numbers';
}

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  toggleTheme: () => void;
  
  // Date Settings
  dateSettings: DateSettings;
  setDateSettings: (settings: DateSettings) => void;
  dateLocale: Locale;
  formatDate: (date: Date | string | number) => string;
  formatHeaderDate: (date: Date | string | number) => string;

  user: User | null;
  login: (email: string, password?: string) => Promise<void>;
  signup: (email: string, password?: string, fullName?: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  logout: () => Promise<void>;
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
  
  // Admin Analytics & Security
  fetchUserSessions: (userId: string) => Promise<SessionLog[]>;
  deleteSessionLog: (sessionId: string) => Promise<void>;

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
  // --- Settings ---
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved === 'en' || saved === 'ar') ? saved : 'en';
  });
  
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    return (saved === 'dark' || saved === 'light') ? saved : 'light';
  });

  const [dateSettings, setDateSettingsState] = useState<DateSettings>(() => {
    const saved = localStorage.getItem('dateSettings');
    return saved ? JSON.parse(saved) : { language: 'match', format: 'names' };
  });

  const setDateSettings = (settings: DateSettings) => {
      setDateSettingsState(settings);
      localStorage.setItem('dateSettings', JSON.stringify(settings));
  };

  // Derived Date Logic
  const effectiveDateLang = dateSettings.language === 'match' ? language : dateSettings.language;
  const dateLocale = effectiveDateLang === 'ar' ? arSA : enUS;

  const formatDate = (date: Date | string | number) => {
      const d = new Date(date);
      if (!isValid(d)) return 'Invalid';
      // MMMM for full month name
      const fmt = dateSettings.format === 'names' ? 'dd MMMM yyyy' : 'dd/MM/yyyy';
      return format(d, fmt, { locale: dateLocale });
  };

  const formatHeaderDate = (date: Date | string | number) => {
      const d = new Date(date);
      if (!isValid(d)) return '';
      const fmt = dateSettings.format === 'names' ? 'EEEE, d MMMM yyyy' : 'EEEE, dd/MM/yyyy';
      return format(d, fmt, { locale: dateLocale });
  };

  // --- State ---
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Data State
  const [units, setUnits] = useState<Unit[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  // Refs for State Access in Listeners (Prevents Stale Closures & Re-subscriptions)
  const userRef = useRef(user);
  const allUsersRef = useRef(allUsers);
  const isMounted = useRef(true);
  
  // Session tracking ref
  const currentSessionId = useRef<string | null>(null);
  const sessionInterval = useRef<any>(null);

  useEffect(() => { userRef.current = user; }, [user]);
  useEffect(() => { allUsersRef.current = allUsers; }, [allUsers]);

  // Computed Properties
  const isAdmin = user?.email === SUPER_ADMIN_EMAIL || user?.role === 'admin';
  
  const getSubscriptionStatus = () => {
    if (isAdmin) return { isValid: true, days: 999, exists: true }; // Admin always valid
    
    if (!user?.subscription) return { isValid: false, days: 0, exists: false };
    if (user.subscription.status === 'paused') return { isValid: false, days: 0, exists: true };

    // Manual parse for ISO string
    const start = new Date(user.subscription.start_date);
    const end = addDays(start, user.subscription.duration_days);
    const today = new Date();
    const isValid = isAfter(end, today);
    const days = differenceInDays(end, today);
    return { isValid, days: days > 0 ? days : 0, exists: true };
  };

  const { isValid: hasValidSubscription, days: daysRemaining, exists: subExists } = getSubscriptionStatus();

  // --- Effects ---
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

  // --- SESSION TRACKING LOGIC ---
  
  // Helper to fetch Public IP with Fallback
  const getPublicIP = async (): Promise<string> => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 3000); // 3s Timeout

      try {
          // Primary: Ipify
          const response = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
          if (response.ok) {
              const data = await response.json();
              clearTimeout(id);
              return data.ip;
          }
          throw new Error('Ipify failed');
      } catch (e) {
          try {
              // Fallback: ip-api
              const response = await fetch('http://ip-api.com/json', { signal: controller.signal });
              if (response.ok) {
                  const data = await response.json();
                  clearTimeout(id);
                  return data.query; // ip-api uses 'query' field for IP
              }
          } catch (err) {
              clearTimeout(id);
              return 'Unknown';
          }
          clearTimeout(id);
          return 'Unknown';
      }
  };

  // Helper to get persistent Device ID
  const getDeviceId = (): string => {
      let deviceId = localStorage.getItem('sunlight_device_id');
      if (!deviceId) {
          deviceId = crypto.randomUUID();
          localStorage.setItem('sunlight_device_id', deviceId);
      }
      return deviceId;
  };

  const trackSession = async (userId: string) => {
    if (!supabase) return;

    try {
        const deviceId = getDeviceId();
        // Fire and forget IP fetch to not block UI, but wait slightly
        const ip = await getPublicIP();

        // 1. Check if there is an active session for this device in the last 24 hours
        const cutoffTime = subHours(new Date(), 24).toISOString();
        
        const { data: existingSession } = await supabase
            .from('session_logs')
            .select('id')
            .eq('user_id', userId)
            .eq('device_id', deviceId)
            .gt('last_active_at', cutoffTime)
            .order('last_active_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (existingSession) {
            // Update existing session
            currentSessionId.current = existingSession.id;
            await supabase
                .from('session_logs')
                .update({ 
                    last_active_at: new Date().toISOString(),
                    ip_address: ip // Update IP in case network changed
                })
                .eq('id', existingSession.id);
        } else {
            // Create new session
            const { data } = await supabase.from('session_logs').insert([{
                user_id: userId,
                device_id: deviceId,
                user_agent: navigator.userAgent,
                ip_address: ip,
                login_at: new Date().toISOString(),
                last_active_at: new Date().toISOString()
            }]).select('id').single();

            if (data) {
                currentSessionId.current = data.id;
            }
        }

        // 2. Start Heartbeat (Check every 5 seconds)
        // CRITICAL: This is the fallback mechanism. If Realtime fails, this will catch the deletion.
        if (sessionInterval.current) clearInterval(sessionInterval.current);
        
        sessionInterval.current = setInterval(async () => {
            // Only proceed if we have a session ID
            if (currentSessionId.current) {
                // Try to update the session. 
                // We use .select() to get the return data.
                // If the row was deleted, .maybeSingle() will return null because no row matched the ID.
                const { data, error } = await supabase!
                    .from('session_logs')
                    .update({ last_active_at: new Date().toISOString() })
                    .eq('id', currentSessionId.current)
                    .select('id')
                    .maybeSingle();

                // If Data is NULL, it means the session row does not exist anymore (Deleted by Admin)
                if (!data || error) {
                    console.warn("Session heartbeat failed - Session deleted remotely.");
                    await logout();
                    window.location.replace('/'); // Force reload to clear state
                }
            }
        }, 5000); // Check every 5 seconds for faster response

    } catch (e) {
        console.error("Session tracking error", e);
    }
  };

  const endSessionTracking = () => {
      if (sessionInterval.current) clearInterval(sessionInterval.current);
      currentSessionId.current = null;
  };

  useEffect(() => {
      if (user) {
          trackSession(user.id);
      } else {
          endSessionTracking();
      }
      return () => {
          if (sessionInterval.current) clearInterval(sessionInterval.current);
      };
  }, [user?.id]);


  // --- REALTIME SUBSCRIPTIONS (Data Sync + Force Logout) ---
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase.channel('app-db-changes')
        // 1. Subscription Updates
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'subscriptions' },
            (payload) => {
                const { eventType, new: newRecord, old: oldRecord } = payload;
                const currentUser = userRef.current;
                
                // Identify Target User ID
                let targetUserId = newRecord?.user_id || oldRecord?.user_id;
                
                // Special handle for delete where oldRecord might only have ID
                if (eventType === 'DELETE' && !targetUserId && currentUser?.subscription?.id === oldRecord.id) {
                    targetUserId = currentUser.id;
                }

                if (!targetUserId) return;

                // Update Current User
                if (currentUser && currentUser.id === targetUserId) {
                    setUser(prev => {
                        if (!prev) return null;
                        if (eventType === 'DELETE') return { ...prev, subscription: undefined };
                        return { ...prev, subscription: newRecord as Subscription };
                    });
                }

                // Update Admin List
                setAllUsers(prev => prev.map(u => {
                    if (u.id === targetUserId) {
                         if (eventType === 'DELETE') return { ...u, subscription: undefined };
                         return { ...u, subscription: newRecord as Subscription };
                    }
                    return u;
                }));
            }
        )
        // 2. FORCE LOGOUT LISTENER (Session Deletion)
        .on(
            'postgres_changes',
            { event: 'DELETE', schema: 'public', table: 'session_logs' },
            async (payload) => {
                // Check if the deleted session ID matches CURRENT browser session ID
                // Note: old record usually contains the primary key (id)
                if (currentSessionId.current && payload.old && payload.old.id === currentSessionId.current) {
                    console.warn("Realtime: Session terminated by admin.");
                    await logout();
                    window.location.replace('/'); // Force reload
                }
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
  }, []);

  // --- INITIALIZATION LOGIC ---
  useEffect(() => {
    isMounted.current = true;

    const initialize = async () => {
      if (!supabase) {
        if (isMounted.current) setIsLoading(false);
        return;
      }

      try {
        const { data: { session }, error } = await (supabase as any).auth.getSession();
        if (error) throw error;

        if (session?.user && isMounted.current) {
          const currentUser = await buildUserObject(session.user);
          setUser(currentUser);
          await fetchData(currentUser);
        }
      } catch (err) {
        console.error("App Initialization Error:", err);
      } finally {
        if (isMounted.current) setIsLoading(false);
      }
    };

    initialize();

    // Listen for Auth Changes
    const { data: { subscription } } = (supabase as any).auth.onAuthStateChange(async (event: string, session: any) => {
      if (!isMounted.current) return;

      if (event === 'SIGNED_IN' && session?.user) {
         setUser(prev => {
             if (prev?.id !== session.user.id) {
                 setIsLoading(true);
                 buildUserObject(session.user).then(newUser => {
                     if (isMounted.current) {
                         setUser(newUser);
                         fetchData(newUser).then(() => setIsLoading(false));
                     }
                 });
             }
             return prev; 
         });
      } else if (event === 'SIGNED_OUT') {
         setUser(null);
         setUnits([]);
         setBookings([]);
         setExpenses([]);
         setAllUsers([]);
         setIsLoading(false);
      }
    });

    return () => {
      isMounted.current = false;
      subscription.unsubscribe();
    };
  }, []);

  // --- Core Functions ---

  const buildUserObject = async (authUser: any): Promise<User> => {
    const email = authUser.email;

    if (email === SUPER_ADMIN_EMAIL) {
      return {
        id: authUser.id,
        email: email,
        full_name: 'Super Admin',
        role: 'admin',
        subscription: { 
            id: 'admin-unlimited', 
            user_id: authUser.id, 
            start_date: new Date().toISOString(), 
            duration_days: 9999, 
            price: 0, 
            status: 'active' 
        }
      };
    }

    try {
        const { data: profile } = await supabase!.from('profiles').select('*').eq('id', authUser.id).maybeSingle();
        const { data: sub } = await supabase!.from('subscriptions').select('*').eq('user_id', authUser.id).maybeSingle();
        
        return {
            id: authUser.id,
            email: email,
            full_name: profile?.full_name || email.split('@')[0],
            role: 'user',
            subscription: sub
        };
    } catch (e) {
        return { id: authUser.id, email: email, role: 'user' };
    }
  };

  const fetchData = async (currentUser: User) => {
    if (!supabase) return;

    try {
      if (currentUser.email === SUPER_ADMIN_EMAIL || currentUser.role === 'admin') {
          // --- ADMIN FETCH ---
          const [uRes, bRes, eRes, pRes, sRes] = await Promise.all([
            supabase.from('units').select('*'),
            supabase.from('bookings').select('*'),
            supabase.from('expenses').select('*'),
            supabase.from('profiles').select('*'), 
            supabase.from('subscriptions').select('*')
          ]);

          if (isMounted.current) {
              if (uRes.data) setUnits(uRes.data);
              if (bRes.data) setBookings(bRes.data);
              if (eRes.data) setExpenses(eRes.data);
              
              if (pRes.data) {
                 const allSubs = sRes.data || [];
                 const usersWithSubs = pRes.data
                    .filter((p: any) => p.email !== SUPER_ADMIN_EMAIL)
                    .map((profile: any) => ({
                         ...profile,
                         subscription: allSubs.find((s: any) => s.user_id === profile.id)
                     }));
                 setAllUsers(usersWithSubs);
              }
          }
      } else {
          // --- USER FETCH ---
          const [uRes, bRes, eRes, sRes] = await Promise.all([
            supabase.from('units').select('*').eq('user_id', currentUser.id),
            supabase.from('bookings').select('*').eq('user_id', currentUser.id),
            supabase.from('expenses').select('*').eq('user_id', currentUser.id),
            supabase.from('subscriptions').select('*').eq('user_id', currentUser.id).maybeSingle()
          ]);

          if (isMounted.current) {
              if (uRes.data) setUnits(uRes.data);
              if (bRes.data) setBookings(bRes.data);
              if (eRes.data) setExpenses(eRes.data);
              if (sRes.data) setUser(prev => prev ? { ...prev, subscription: sRes.data as Subscription } : null);
          }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  // --- Actions ---
  const login = async (email: string, password?: string) => {
    if (!supabase) return;
    const { error } = await (supabase as any).auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signup = async (email: string, password?: string, fullName?: string) => {
    if (!supabase) return;
    const { error } = await (supabase as any).auth.signUp({
      email, password: password!, options: { data: { full_name: fullName } }
    });
    if (error) throw error;
  };

  const logout = async () => {
    setUser(null);
    setUnits([]);
    setBookings([]);
    setExpenses([]);
    setAllUsers([]);
    endSessionTracking();
    localStorage.removeItem('sb-nvnykdzmshpwcevipkdl-auth-token');
    
    try {
        if (supabase) await (supabase as any).auth.signOut();
    } catch (e) {
        console.log("Server logout failed (harmless):", e);
    } finally {
        setIsLoading(false);
    }
  };

  const updatePassword = async (password: string) => {
      if(!supabase) return;
      await (supabase as any).auth.updateUser({ password });
  };

  // --- Admin CRUD ---
  const addAccount = async (email: string, password: string, fullName: string) => { if (!supabase) return; };
  const deleteAccount = async (id: string) => {
      if (!supabase) return;
      setAllUsers(prev => prev.filter(u => u.id !== id)); 
      await supabase.from('profiles').delete().eq('id', id);
  };

  // IMPORTANT: Enhanced session fetching using RPC to bypass RLS issues
  const fetchUserSessions = async (userId: string): Promise<SessionLog[]> => {
      if (!supabase) return [];
      
      // 1. Try RPC First (Guarantees Access if enabled in SQL)
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_user_sessions', { target_user_id: userId });

      if (!rpcError && rpcData) {
          return rpcData as SessionLog[];
      }

      // 2. Fallback to Standard Select (If RPC fails/not exists)
      const { data, error } = await supabase
        .from('session_logs')
        .select('id, user_id, user_agent, ip_address, login_at, last_active_at, device_id')
        .eq('user_id', userId)
        .order('last_active_at', { ascending: false })
        .limit(50);
      
      if (error) {
          console.error("Fetch sessions failed:", error);
          return [];
      }
      return data as SessionLog[];
  };

  // Delete a specific session log (Force Logout)
  const deleteSessionLog = async (sessionId: string) => {
      if (!supabase) return;
      await supabase.from('session_logs').delete().eq('id', sessionId);
  };

  // --- Subscription Management ---
  const addSubscription = async (subscription: Subscription) => {
      setAllUsers(prev => prev.map(u => u.id === subscription.user_id ? { ...u, subscription } : u));
      if (user && user.id === subscription.user_id) setUser({ ...user, subscription });

      if (!supabase) return;
      const { error } = await supabase.from('subscriptions').upsert(subscription).select().single();
      if (error) {
          console.error("Sub Error:", error);
          if (user) fetchData(user);
          throw new Error(error.message);
      }
  };
  
  const updateSubscription = async (subscription: Subscription) => { await addSubscription(subscription); };

  const deleteSubscription = async (id: string) => {
      const targetUser = allUsers.find(u => u.subscription?.id === id);
      if (targetUser) {
          const updatedUser = { ...targetUser, subscription: undefined };
          setAllUsers(prev => prev.map(u => u.id === targetUser.id ? updatedUser : u));
          if (user && user.id === targetUser.id) setUser({ ...user, subscription: undefined });
      }

      if (!supabase) return;
      const { error } = await supabase.from('subscriptions').delete().eq('id', id);
      if (error) {
           if (user) fetchData(user);
           throw error;
      }
  };

  // --- Data CRUD ---
  const checkRestriction = () => {
      if (isAdmin) return;
      if (!subExists) throw new Error(language === 'ar' ? 'غير مشترك.' : 'Access Denied.');
      if (user?.subscription?.status === 'paused') throw new Error(language === 'ar' ? 'اشتراكك موقوف.' : 'Subscription paused.');
      if (!hasValidSubscription) throw new Error(language === 'ar' ? 'انتهى الاشتراك.' : 'Subscription expired.');
  };

  const addBooking = async (booking: Booking) => {
    checkRestriction();
    if (!user) throw new Error("User not authenticated");
    booking.user_id = user.id; 
    setBookings(prev => [booking, ...prev]); 
    if (!supabase) return;
    const { error } = await supabase.from('bookings').insert([booking]);
    if (error) { setBookings(prev => prev.filter(b => b.id !== booking.id)); throw error; }
  };

  const updateBooking = async (updated: Booking) => {
    setBookings(prev => prev.map(b => b.id === updated.id ? updated : b));
    if (!supabase) return;
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
      unit.user_id = user.id; 
      setUnits(prev => [...prev, unit]);
      if(!supabase) return;
      const { error } = await supabase.from('units').insert([unit]);
      if(error) { setUnits(prev => prev.filter(u => u.id !== unit.id)); throw error; }
  };
  
  const updateUnit = async (u: Unit) => {
      setUnits(prev => prev.map(un => un.id === u.id ? u : un));
      if(!supabase) return;
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
      setExpenses(prev => [expense, ...prev]);
      if(!supabase) return;
      const { error } = await supabase.from('expenses').insert([expense]);
      if(error) { setExpenses(prev => prev.filter(e => e.id !== expense.id)); throw error; }
  };
  
  const updateExpense = async (ex: Expense) => {
      setExpenses(prev => prev.map(e => e.id === ex.id ? ex : e));
      if(!supabase) return;
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
      dateSettings, setDateSettings, dateLocale, formatDate, formatHeaderDate,
      user, login, signup, updatePassword, logout,
      state: { units, bookings, expenses, allUsers },
      addBooking, updateBooking, deleteBooking,
      addExpense, updateExpense, deleteExpense,
      addUnit, updateUnit, deleteUnit,
      addAccount, deleteAccount, addSubscription, updateSubscription, deleteSubscription,
      fetchUserSessions, deleteSessionLog,
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
