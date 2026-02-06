
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Bookings } from './components/Bookings';
import { CalendarView } from './components/CalendarView';
import { Expenses } from './components/Expenses';
import { Reports } from './components/Reports';
import { Units } from './components/Units';
import { Settings } from './components/Settings';
import { Auth } from './components/Auth';
import { AdminAccounts } from './components/AdminAccounts';
import { AdminSubscriptions } from './components/AdminSubscriptions';
import { AdminReports } from './components/AdminReports';

const AppContent = () => {
  const { user, isAdmin } = useApp();

  return (
    <HashRouter>
      {!user ? (
        <Auth />
      ) : (
        <Layout>
          <Routes>
            {/* Common Routes */}
            <Route path="/settings" element={<Settings />} />

            {/* Admin Routes */}
            {isAdmin ? (
               <>
                 <Route path="/admin/dashboard" element={<Dashboard />} /> {/* Reuse Dashboard for overview for now */}
                 <Route path="/admin/accounts" element={<AdminAccounts />} />
                 <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
                 <Route path="/admin/reports" element={<AdminReports />} />
                 <Route path="*" element={<Navigate to="/admin/subscriptions" replace />} />
               </>
            ) : (
               /* User Routes */
               <>
                 <Route path="/" element={<Dashboard />} />
                 <Route path="/bookings" element={<Bookings />} />
                 <Route path="/calendar" element={<CalendarView />} />
                 <Route path="/expenses" element={<Expenses />} />
                 <Route path="/reports" element={<Reports />} />
                 <Route path="/units" element={<Units />} />
                 <Route path="*" element={<Navigate to="/" replace />} />
               </>
            )}
          </Routes>
        </Layout>
      )}
    </HashRouter>
  );
};

const App = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
