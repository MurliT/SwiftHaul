import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Building, Phone, Key, ShieldCheck, CheckCircle2, ChevronRight, Award } from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '../services/mockApi';

const Login = () => {
  const { sendOtp, verifyOtp, showToast } = useAuth();
  
  // Login Form States
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1: Phone, 2: OTP, 3: Optional KYC
  const [selectedRole, setSelectedRole] = useState('owner'); // owner, manager, dispatcher
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [debugOtp, setDebugOtp] = useState('');

  // KYC Verification States
  const [gstin, setGstin] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [kycVerifying, setKycVerifying] = useState(false);
  const [kycDone, setKycDone] = useState(false);

  // Send OTP handler
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      showToast('Please enter a valid 10-digit Indian phone number', 'warning');
      return;
    }
    
    setSending(true);
    // Format to standard Indian format if not prefixed
    const formattedPhone = phone.startsWith('+91') ? phone : `+91 ${phone.trim()}`;
    
    try {
      const data = await sendOtp(formattedPhone);
      setDebugOtp(data.debugOtp || '');
      setStep(2);
      showToast(`OTP sent (Mock Gateway)! Code: ${data.debugOtp}`, 'success');
    } catch (err) {
      // Toast already handled by context
    } finally {
      setSending(false);
    }
  };

  // Verify OTP handler
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      showToast('Please enter the 6-digit OTP code', 'warning');
      return;
    }

    setVerifying(true);
    const formattedPhone = phone.startsWith('+91') ? phone : `+91 ${phone.trim()}`;
    
    try {
      await verifyOtp(formattedPhone, otp, selectedRole);
      // Move to KYC onboarding if owner, else directly to dashboard
      if (selectedRole === 'owner') {
        setStep(3);
      } else {
        window.location.href = '/';
      }
    } catch (err) {
      // Error handled by context
    } finally {
      setVerifying(false);
    }
  };

  // Skip KYC
  const handleSkipKyc = () => {
    showToast('KYC step skipped. You can complete this later.', 'info');
    window.location.href = '/';
  };

  // Verify KYC
  const handleVerifyKyc = async (e) => {
    e.preventDefault();
    if (!gstin || gstin.length !== 15) {
      showToast('GSTIN must be 15 alphanumeric characters', 'warning');
      return;
    }
    if (!aadhaar || aadhaar.length !== 12) {
      showToast('Aadhaar number must be 12 digits', 'warning');
      return;
    }

    setKycVerifying(true);
    try {
      const token = localStorage.getItem('cookie_accessToken'); // check auth token exists
      const response = await axios.post(`${API_BASE}/kyc/verify`, { gstin, aadhaar }, {
        headers: token ? { 'Authorization': `Bearer ${JSON.parse(token).value}` } : {}
      });
      setKycDone(true);
      showToast('GSTIN and Owner Identity verified successfully via DigiLocker!', 'success');
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } catch (err) {
      showToast(err.response?.data?.message || 'KYC verification failed', 'error');
    } finally {
      setKycVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 animate-fade-in">
        
        {/* App Title */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-brand-blue to-sky-400 flex items-center justify-center shadow-lg shadow-brand-blue/30 mb-3">
            <Building className="h-8 w-8 text-white animate-pulse" />
          </div>
          <h1 className="text-2xl font-black tracking-wider text-white">SwiftHaul</h1>
          <p className="text-slate-400 text-xs text-center mt-1">
            Indore Last-Mile Coordination Portal
          </p>
        </div>

        {/* STEP 1: Phone Entry */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-6">
            <div>
              <label className="block text-slate-300 text-sm font-semibold mb-2">
                Business Phone Number
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 font-bold text-sm">
                  +91
                </span>
                <input
                  type="tel"
                  placeholder="98260 12345"
                  maxLength="10"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-14 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-medium focus:outline-none focus:border-brand-blue transition-colors placeholder-slate-700"
                  disabled={sending}
                  required
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                We will send a 6-digit OTP code to verify your phone number via SMS.
              </p>
            </div>

            {/* Role Switcher for easy testing */}
            <div className="bg-slate-950/60 p-4 border border-slate-800 rounded-xl">
              <span className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-3">
                Verify Role Claims (RBAC Testing):
              </span>
              <div className="grid grid-cols-3 gap-2">
                {['owner', 'manager', 'dispatcher'].map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setSelectedRole(role)}
                    className={`py-2 text-xs font-semibold rounded-lg capitalize border transition-all ${
                      selectedRole === role
                        ? 'bg-brand-blue text-white border-brand-blue shadow-md'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                {selectedRole === 'owner' && "⚡ OWNER: Full access to all components and billing operations."}
                {selectedRole === 'manager' && "🛡️ MANAGER: View and coordination access, invoices disabled."}
                {selectedRole === 'dispatcher' && "🚚 DISPATCHER: Restricted to dashboard, booking creation, and driver roster."}
              </p>
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full bg-brand-blue hover:bg-sky-700 disabled:bg-slate-800 text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg shadow-brand-blue/15 hover:shadow-brand-blue/20 transition-all flex items-center justify-center gap-2"
            >
              {sending ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                <>
                  Request SMS OTP
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: OTP Entry */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-slate-300 text-sm font-semibold">
                  Verification Code
                </label>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-brand-blue hover:text-sky-400 font-semibold"
                >
                  Change Number
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
                  <Key className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  maxLength="6"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold tracking-widest text-center focus:outline-none focus:border-brand-blue transition-colors placeholder-slate-800"
                  disabled={verifying}
                  required
                />
              </div>
              
              {/* Mock SMS Notice */}
              {debugOtp && (
                <div className="mt-3 p-3 bg-slate-950 border border-slate-800/80 rounded-xl text-center">
                  <span className="text-[11px] text-slate-400 font-medium block">MSG91 SMS Gateway Sim Output:</span>
                  <span className="text-sm font-black tracking-widest text-emerald-400">{debugOtp}</span>
                  <span className="text-[10px] text-slate-500 block mt-1">(Bypass OTP: 123456)</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={verifying}
              className="w-full bg-brand-blue hover:bg-sky-700 disabled:bg-slate-800 text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              {verifying ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                <>
                  Verify OTP & Log In
                  <ShieldCheck className="h-5 w-5" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 3: Optional KYC step (DigiLocker) */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center p-3 bg-slate-950/40 border border-dashed border-slate-800 rounded-2xl">
              <Award className="h-10 w-10 text-yellow-500 mx-auto mb-2 animate-bounce" />
              <h2 className="text-white font-bold text-base">Quick Business Onboarding</h2>
              <p className="text-slate-400 text-[11px] mt-1">
                Link GSTIN & verify business identity using DigiLocker integration.
              </p>
            </div>

            <form onSubmit={handleVerifyKyc} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-[11px] font-semibold uppercase tracking-wider mb-1">
                  GSTIN (Business GST ID)
                </label>
                <input
                  type="text"
                  placeholder="23AABCS1421D1Z5"
                  maxLength="15"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold tracking-wider placeholder-slate-800 focus:outline-none focus:border-brand-blue transition-colors text-sm"
                  disabled={kycVerifying || kycDone}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] font-semibold uppercase tracking-wider mb-1">
                  Owner Aadhaar Number
                </label>
                <input
                  type="text"
                  placeholder="12-digit Aadhaar"
                  maxLength="12"
                  value={aadhaar}
                  onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold tracking-widest placeholder-slate-800 focus:outline-none focus:border-brand-blue transition-colors text-sm"
                  disabled={kycVerifying || kycDone}
                  required
                />
              </div>

              {kycDone ? (
                <div className="flex items-center gap-2 justify-center py-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="h-5 w-5" />
                  KYC Verified successfully! Redirecting...
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleSkipKyc}
                    className="border border-slate-800 hover:border-slate-700 text-slate-400 py-2.5 rounded-xl text-xs font-bold transition-all"
                  >
                    Verify Later
                  </button>
                  <button
                    type="submit"
                    disabled={kycVerifying}
                    className="bg-brand-blue hover:bg-sky-700 text-white py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
                  >
                    {kycVerifying ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    ) : (
                      'DigiLocker Verify'
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default Login;
