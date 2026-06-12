import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthGuard } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NewBooking from './pages/NewBooking';
import OrderTracking from './pages/OrderTracking';
import Invoices from './pages/Invoices';
import DriverRoster from './pages/DriverRoster';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes Wrapper */}
          <Route 
            path="/" 
            element={
              <AuthGuard>
                <Layout />
              </AuthGuard>
            }
          >
            {/* Dashboard: All Roles */}
            <Route index element={<Dashboard />} />

            {/* New Booking: All Roles */}
            <Route path="booking" element={<NewBooking />} />

            {/* Live Tracking: All Roles */}
            <Route path="tracking" element={<OrderTracking />} />

            {/* Invoices: Restricted to Owner and Manager only */}
            <Route 
              path="invoices" 
              element={
                <AuthGuard allowedRoles={['owner', 'manager']}>
                  <Invoices />
                </AuthGuard>
              } 
            />

            {/* Driver Roster: All Roles */}
            <Route path="drivers" element={<DriverRoster />} />
          </Route>

          {/* Fallback Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
