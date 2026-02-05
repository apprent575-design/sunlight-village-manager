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

const AppContent = () => {
  const { user } = useApp();

  return (
    <HashRouter>
      {!user ? (
        <Auth />
      ) : (
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/calendar" element={<CalendarView />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/units" element={<Units />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
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