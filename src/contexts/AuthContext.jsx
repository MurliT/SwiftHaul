import React, { createContext, useContext, useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE, decodeMockToken, mockAuthSession } from '../services/mockApi';
import { Bell, AlertTriangle } from 'lucide-react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  // Toast helper
  const showToast = (message, type = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  useEffect(() => {
    // Listen to custom toast events (e.g. from MockWebSocket)
    const handleToastEvent = (e) => {
      if (e.detail && e.detail.message) {
        showToast(e.detail.message, e.detail.type || 'info');
      }
    };
    window.addEventListener('swifthaul-toast', handleToastEvent);
    return () => window.removeEventListener('swifthaul-toast', handleToastEvent);
  }, []);

  // Sync token checks on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = mockAuthSession.getAccessToken();
      if (token) {
        const claims = decodeMockToken(token);
        if (claims) {
          setUser({
            phone: claims.sub,
            role: claims.role,
            businessName: claims.businessName || 'SwiftHaul Partner',
            gstin: claims.gstin
          });
        }
      }
      setLoading(false);
    };

    initAuth();

    // Listen to silent refresh failures (trigger logouts)
    const handleLogout = () => {
      setUser(null);
      showToast('Session expired. Please log in again.', 'warning');
    };
    window.addEventListener('auth-logout', handleLogout);
    return () => window.removeEventListener('auth-logout', handleLogout);
  }, []);

  // OTP Request
  const sendOtp = async (phone) => {
    try {
      const response = await axios.post(`${API_BASE}/auth/otp/send`, { phone });
      return response.data;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to send OTP';
      showToast(errMsg, 'error');
      throw new Error(errMsg);
    }
  };

  // OTP Verification
  const verifyOtp = async (phone, otp, selectedRole) => {
    try {
      const response = await axios.post(`${API_BASE}/auth/otp/verify`, {
        phone,
        otp,
        role: selectedRole
      });
      
      const token = mockAuthSession.getAccessToken();
      const claims = decodeMockToken(token);
      
      if (claims) {
        setUser({
          phone: claims.sub,
          role: claims.role,
          businessName: claims.businessName || 'SwiftHaul Partner',
          gstin: claims.gstin
        });
        showToast('Successfully logged in!', 'success');
      }
      return response.data;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Invalid OTP verification';
      showToast(errMsg, 'error');
      throw new Error(errMsg);
    }
  };

  // Logout
  const logout = async () => {
    try {
      await axios.post(`${API_BASE}/auth/logout`);
    } catch (e) {
      // Ignore cleanup error
    } finally {
      setUser(null);
      mockAuthSession.clear();
      showToast('Logged out successfully', 'info');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, sendOtp, verifyOtp, logout, showToast, toasts }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl shadow-lg border flex items-start gap-3 animate-fade-in transition-all duration-300 ${
              toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
              toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
              toast.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' :
              'bg-slate-800 border-slate-700 text-white'
            }`}
          >
            {toast.type === 'warning' || toast.type === 'error' ? (
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            ) : (
              <Bell className="h-5 w-5 shrink-0 mt-0.5" />
            )}
            <div className="text-sm font-medium">{toast.message}</div>
          </div>
        ))}
      </div>
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Route-level Guard Wrapper
export const AuthGuard = ({ children, allowedRoles }) => {
  const { user, loading, showToast } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-blue border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Show toast and display restricted banner
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
        <div className="rounded-full bg-red-50 p-4 text-red-500 mb-4">
          <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0-6V9m0 12a9 9 0 110-18 9 9 0 010 18z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Restricted Access</h2>
        <p className="text-slate-500 max-w-md">
          Your role as <strong>{user.role.toUpperCase()}</strong> does not permit viewing this page. Please contact the business owner to update your permissions.
        </p>
      </div>
    );
  }

  return children;
};


