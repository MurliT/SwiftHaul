import axios from 'axios';

// Base API configuration
export const API_BASE = 'https://api.swifthaul.in/v1';

// Initialise Mock Database in localStorage if not exists
const initMockDb = () => {
  if (!localStorage.getItem('sh_orders')) {
    const initialOrders = [
      {
        id: 'SH-2026-9812',
        pickup: 'Vijay Nagar, Scheme No 54, Indore',
        drop: 'Palasia Square, Indore',
        status: 'delivered', // delivered, in_transit, pickup, assigned
        vehicle: 'Two-Wheeler',
        revenue: 180,
        distance: 5.4,
        date: '2026-06-12',
        customerName: 'Ravi Kumar (Pharmacy)',
        customerPhone: '+91 98260 11223',
        driverId: 'D-101',
        createdAt: '2026-06-12T08:15:00Z',
        deliverySteps: [
          { name: 'Booked', status: 'completed', time: '08:15 AM' },
          { name: 'Assigned', status: 'completed', time: '08:18 AM' },
          { name: 'Picked Up', status: 'completed', time: '08:25 AM' },
          { name: 'In Transit', status: 'completed', time: '08:32 AM' },
          { name: 'Delivered', status: 'completed', time: '08:50 AM' }
        ]
      },
      {
        id: 'SH-2026-9813',
        pickup: 'Rajwada Market, Indore',
        drop: 'Bhanwarkuan Square, Indore',
        status: 'in_transit',
        vehicle: 'Three-Wheeler',
        revenue: 450,
        distance: 6.8,
        date: '2026-06-12',
        customerName: 'Priya Sharma (Cakes)',
        customerPhone: '+91 94250 88776',
        driverId: 'D-102',
        createdAt: '2026-06-12T09:30:00Z',
        deliverySteps: [
          { name: 'Booked', status: 'completed', time: '09:30 AM' },
          { name: 'Assigned', status: 'completed', time: '09:35 AM' },
          { name: 'Picked Up', status: 'completed', time: '09:48 AM' },
          { name: 'In Transit', status: 'current', time: '10:02 AM' },
          { name: 'Delivered', status: 'pending', time: '' }
        ]
      },
      {
        id: 'SH-2026-9814',
        pickup: 'Saket Colony, Indore',
        drop: 'Annapurna Area, Indore',
        status: 'pickup',
        vehicle: 'Tata Ace',
        revenue: 850,
        distance: 12.3,
        date: '2026-06-12',
        customerName: 'Mohammed Arif (Electronics)',
        customerPhone: '+91 91110 55443',
        driverId: 'D-103',
        createdAt: '2026-06-12T10:10:00Z',
        deliverySteps: [
          { name: 'Booked', status: 'completed', time: '10:10 AM' },
          { name: 'Assigned', status: 'completed', time: '10:12 AM' },
          { name: 'Picked Up', status: 'current', time: '10:25 AM' },
          { name: 'In Transit', status: 'pending', time: '' },
          { name: 'Delivered', status: 'pending', time: '' }
        ]
      },
      {
        id: 'SH-2026-9815',
        pickup: 'LIG Colony, Indore',
        drop: 'Geeta Bhawan Square, Indore',
        status: 'assigned',
        vehicle: 'Two-Wheeler',
        revenue: 120,
        distance: 3.1,
        date: '2026-06-12',
        customerName: 'Indore Kirana Store',
        customerPhone: '+91 98270 44556',
        driverId: 'D-104',
        createdAt: '2026-06-12T10:40:00Z',
        deliverySteps: [
          { name: 'Booked', status: 'completed', time: '10:40 AM' },
          { name: 'Assigned', status: 'current', time: '10:42 AM' },
          { name: 'Picked Up', status: 'pending', time: '' },
          { name: 'In Transit', status: 'pending', time: '' },
          { name: 'Delivered', status: 'pending', time: '' }
        ]
      }
    ];
    localStorage.setItem('sh_orders', JSON.stringify(initialOrders));
  }

  if (!localStorage.getItem('sh_drivers')) {
    const initialDrivers = [
      { id: 'D-101', name: 'Amit Sharma', phone: '+91 98930 12345', vehicle: 'Two-Wheeler', zone: 'Vijay Nagar', rating: 4.8, active: true, bgvStatus: 'Verified', bgvProvider: 'Securitas India' },
      { id: 'D-102', name: 'Rajesh Khan', phone: '+91 94060 54321', vehicle: 'Three-Wheeler', zone: 'Palasia', rating: 4.5, active: true, bgvStatus: 'Verified', bgvProvider: 'AuthBridge' },
      { id: 'D-103', name: 'Vikram Singh', phone: '+91 73120 98765', vehicle: 'Tata Ace', zone: 'Bhanwarkuan', rating: 4.2, active: true, bgvStatus: 'Verified', bgvProvider: 'Securitas India' },
      { id: 'D-104', name: 'Sunil Yadav', phone: '+91 98260 99887', vehicle: 'Two-Wheeler', zone: 'Annapurna', rating: 4.9, active: true, bgvStatus: 'Verified', bgvProvider: 'AuthBridge' },
      { id: 'D-105', name: 'Sanjay Patel', phone: '+91 94240 55667', vehicle: 'Three-Wheeler', zone: 'Rajwada', rating: 4.6, active: true, bgvStatus: 'Pending', bgvProvider: 'AuthBridge' }
    ];
    localStorage.setItem('sh_drivers', JSON.stringify(initialDrivers));
  }

  if (!localStorage.getItem('sh_invoices')) {
    const initialInvoices = [
      { id: 'INV-2026-001', orderId: 'SH-2026-9812', amount: 180, date: '2026-06-12', status: 'Paid', gstin: '23AABCS1421D1Z5', hsn: '9968', gstAmount: 32.40 },
      { id: 'INV-2026-002', orderId: 'SH-2026-9813', amount: 450, date: '2026-06-12', status: 'Pending', gstin: '23AABCS1421D1Z5', hsn: '9968', gstAmount: 81.00 },
      { id: 'INV-2026-003', orderId: 'SH-2026-9814', amount: 850, date: '2026-06-11', status: 'Paid', gstin: '23AABCS1421D1Z5', hsn: '9968', gstAmount: 153.00 },
      { id: 'INV-2026-004', orderId: 'SH-2026-9811', amount: 320, date: '2026-06-10', status: 'Paid', gstin: '23AABCS1421D1Z5', hsn: '9968', gstAmount: 57.60 }
    ];
    localStorage.setItem('sh_invoices', JSON.stringify(initialInvoices));
  }
};

initMockDb();

// Helper to simulate network latency
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Decode simulated JWT client-side for role claims only (never trusted on backend)
export const decodeMockToken = (token) => {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(atob(parts[1]));
  } catch (e) {
    return null;
  }
};

// Simulated Cookie Store for access & refresh tokens
const mockCookies = {
  accessToken: null,
  refreshToken: null,
  set(name, value, expiryMinutes) {
    this[name] = value;
    const expires = new Date(Date.now() + expiryMinutes * 60 * 1000).toISOString();
    localStorage.setItem(`cookie_${name}`, JSON.stringify({ value, expires }));
  },
  get(name) {
    const raw = localStorage.getItem(`cookie_${name}`);
    if (!raw) return this[name] || null;
    const data = JSON.parse(raw);
    if (new Date(data.expires) < new Date()) {
      localStorage.removeItem(`cookie_${name}`);
      this[name] = null;
      return null;
    }
    return data.value;
  },
  clear(name) {
    this[name] = null;
    localStorage.removeItem(`cookie_${name}`);
  }
};

// Axios Request Interceptor
axios.interceptors.request.use(async (config) => {
  if (!config.url.startsWith(API_BASE)) {
    return config;
  }

  const token = mockCookies.get('accessToken');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Setup mock Axios adapter logic
axios.interceptors.request.use((config) => {
  if (!config.url.startsWith(API_BASE)) {
    return config;
  }

  // Set the custom mock adapter for this request
  config.adapter = async (config) => {
    const { url, method, data } = config;
    const path = url.replace(API_BASE, '');
    
    await delay(400); // Simulate network round-trip latency

    // Parse request body safely
    const getBody = () => {
      if (!data) return {};
      if (typeof data === 'string') {
        try {
          return JSON.parse(data);
        } catch (e) {
          return {};
        }
      }
      return data;
    };
    const body = getBody();

    // Mock OTP Send
    if (path === '/auth/otp/send' && method === 'post') {
      const { phone } = body;
      
      if (!phone || phone.length < 10) {
        return Promise.reject({ response: { status: 400, data: { message: 'Invalid phone number' } } });
      }

      // OTP Lockout logic (max 3 attempts, 30 min lockout)
      const attemptsKey = `otp_attempts_${phone}`;
      const lockoutKey = `otp_lockout_${phone}`;
      
      const lockout = localStorage.getItem(lockoutKey);
      if (lockout && new Date(lockout) > new Date()) {
        const remaining = Math.round((new Date(lockout) - new Date()) / 1000 / 60);
        return Promise.reject({ response: { status: 429, data: { message: `Too many attempts. Locked out. Try again in ${remaining} minutes.` } } });
      }

      // Increment attempts
      let attempts = parseInt(localStorage.getItem(attemptsKey) || '0');
      attempts += 1;
      localStorage.setItem(attemptsKey, attempts.toString());
      
      if (attempts >= 3) {
        const lockoutTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();
        localStorage.setItem(lockoutKey, lockoutTime);
        localStorage.removeItem(attemptsKey);
        return Promise.reject({ response: { status: 429, data: { message: 'Max verification attempts reached. Account locked for 30 minutes.' } } });
      }

      // Generate random 6 digit OTP
      const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
      console.log(`[MSG91/Twilio Mock Gateway] SMS sent to ${phone}: "Your SwiftHaul OTP is ${mockOtp}. Valid for 5 mins."`);
      
      // Save in storage (5 min expiry)
      const expiry = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      localStorage.setItem(`otp_${phone}`, JSON.stringify({ otp: mockOtp, expiry }));

      // Return mock success
      return {
        status: 200,
        data: { message: 'OTP sent successfully', debugOtp: mockOtp },
        headers: {},
        config
      };
    }

    // Mock OTP Verify
    if (path === '/auth/otp/verify' && method === 'post') {
      const { phone, otp, role = 'owner' } = body;

      const rawOtp = localStorage.getItem(`otp_${phone}`);
      if (!rawOtp) {
        return Promise.reject({ response: { status: 400, data: { message: 'OTP not requested or expired' } } });
      }

      const { otp: savedOtp, expiry } = JSON.parse(rawOtp);
      if (new Date(expiry) < new Date()) {
        localStorage.removeItem(`otp_${phone}`);
        return Promise.reject({ response: { status: 400, data: { message: 'OTP has expired' } } });
      }

      if (otp !== savedOtp && otp !== '123456') { // Allow 123456 as bypass master OTP for testing
        return Promise.reject({ response: { status: 400, data: { message: 'Invalid OTP entered' } } });
      }

      // Successful Verification: Generate JWT
      localStorage.removeItem(`otp_${phone}`);
      localStorage.removeItem(`otp_attempts_${phone}`);
      
      // Construct fake JWT (Header, Payload, Signature)
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({
        sub: phone,
        role: role, // owner, manager, dispatcher
        businessName: phone === '+91 98260 11223' ? 'Ravi Pharmacy' : 'New Indore Enterprises',
        gstin: '23AABCS1421D1Z5',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 15 * 60 // 15 mins
      }));
      const signature = 'mock_signature_hash';
      const accessToken = `${header}.${payload}.${signature}`;
      const refreshToken = `mock_refresh_token_${Math.random().toString(36).substring(2)}`;

      // Set cookie simulations
      mockCookies.set('accessToken', accessToken, 15); // 15 mins
      mockCookies.set('refreshToken', refreshToken, 30 * 24 * 60); // 30 days

      // Log concurrent session count limit check
      console.log("[Redis Session Manager] Concurrent session validated. Session limit: 3 active devices.");

      return {
        status: 200,
        data: {
          message: 'Login successful',
          user: { phone, role, businessName: 'SwiftHaul Partner' }
        },
        headers: {},
        config
      };
    }

    // Mock Silent Token Refresh
    if (path === '/auth/refresh' && method === 'post') {
      const rfToken = mockCookies.get('refreshToken');
      if (!rfToken) {
        return Promise.reject({ response: { status: 401, data: { message: 'Session expired. Please log in again.' } } });
      }

      // Generate new Access Token
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      // Extract role from current token if possible or fallback to owner
      const currAccess = mockCookies.accessToken;
      const claims = decodeMockToken(currAccess) || { role: 'owner', sub: '+91 98260 11223' };
      
      const payload = btoa(JSON.stringify({
        ...claims,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 15 * 60
      }));
      
      const newAccessToken = `${header}.${payload}.mock_signature_hash`;
      mockCookies.set('accessToken', newAccessToken, 15);

      console.log("[Auth Service] Access Token silently refreshed.");

      return {
        status: 200,
        data: { message: 'Token refreshed successfully' },
        headers: {},
        config
      };
    }

    // Mock Logout
    if (path === '/auth/logout' && method === 'post') {
      mockCookies.clear('accessToken');
      mockCookies.clear('refreshToken');
      return {
        status: 200,
        data: { message: 'Logged out successfully' },
        headers: {},
        config
      };
    }

    // Mock KYC verification (GSTIN + DigiLocker Aadhaar Verification)
    if (path === '/kyc/verify' && method === 'post') {
      const { gstin, aadhaar } = body;
      if (!gstin || gstin.length !== 15) {
        return Promise.reject({ response: { status: 400, data: { message: 'Invalid GSTIN length (Must be 15 alphanumeric characters)' } } });
      }
      if (!aadhaar || aadhaar.length !== 12) {
        return Promise.reject({ response: { status: 400, data: { message: 'Invalid Aadhaar number (Must be 12 digits)' } } });
      }

      // Mock response
      return {
        status: 200,
        data: {
          success: true,
          businessName: 'SwiftHaul Retail Hub',
          status: 'KYC Verified via DigiLocker API'
        },
        headers: {},
        config
      };
    }

    // Guard routing for subsequent endpoints (requires active mockAccessToken)
    const authHeader = config.headers['Authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Promise.reject({ response: { status: 401, data: { message: 'Unauthorized access. Token missing.' } } });
    }

    const claims = decodeMockToken(authHeader.replace('Bearer ', ''));
    if (!claims) {
      return Promise.reject({ response: { status: 401, data: { message: 'Unauthorized. Invalid Token.' } } });
    }

    // Mock Fetch Orders
    if (path === '/orders' && method === 'get') {
      const orders = JSON.parse(localStorage.getItem('sh_orders'));
      return {
        status: 200,
        data: orders,
        headers: {},
        config
      };
    }

    // Mock Create Order
    if (path === '/orders' && method === 'post') {
      const orders = JSON.parse(localStorage.getItem('sh_orders'));
      
      // Check dispatcher constraints or other options
      const newOrder = {
        id: `SH-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        pickup: body.pickup,
        drop: body.drop,
        status: 'assigned',
        vehicle: body.vehicle,
        revenue: body.revenue,
        distance: body.distance,
        date: new Date().toISOString().split('T')[0],
        customerName: body.customerName || 'Direct Booking',
        customerPhone: body.customerPhone || '+91 99999 88888',
        driverId: body.driverId || 'D-101',
        createdAt: new Date().toISOString(),
        deliverySteps: [
          { name: 'Booked', status: 'completed', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
          { name: 'Assigned', status: 'current', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
          { name: 'Picked Up', status: 'pending', time: '' },
          { name: 'In Transit', status: 'pending', time: '' },
          { name: 'Delivered', status: 'pending', time: '' }
        ]
      };
      
      orders.unshift(newOrder);
      localStorage.setItem('sh_orders', JSON.stringify(orders));

      // Also auto-generate GST Invoice
      const invoices = JSON.parse(localStorage.getItem('sh_invoices'));
      const gstAmount = parseFloat((newOrder.revenue * 0.18).toFixed(2));
      const newInvoice = {
        id: `INV-2026-${Math.floor(100 + Math.random() * 900)}`,
        orderId: newOrder.id,
        amount: newOrder.revenue,
        date: newOrder.date,
        status: 'Paid',
        gstin: claims.gstin || '23AABCS1421D1Z5',
        hsn: '9968', // Logistics Service HSN Code
        gstAmount
      };
      invoices.unshift(newInvoice);
      localStorage.setItem('sh_invoices', JSON.stringify(invoices));

      return {
        status: 201,
        data: newOrder,
        headers: {},
        config
      };
    }

    // Mock Fetch Drivers
    if (path === '/drivers' && method === 'get') {
      const drivers = JSON.parse(localStorage.getItem('sh_drivers'));
      return {
        status: 200,
        data: drivers,
        headers: {},
        config
      };
    }

    // Mock Fetch Invoices
    if (path === '/invoices' && method === 'get') {
      // Owner & Manager can view invoices, Dispatcher cannot!
      if (claims.role === 'dispatcher') {
        return Promise.reject({ response: { status: 403, data: { message: 'Access denied: billing data restricted for dispatchers.' } } });
      }

      const invoices = JSON.parse(localStorage.getItem('sh_invoices'));
      return {
        status: 200,
        data: invoices,
        headers: {},
        config
      };
    }

    // Distance Matrix Mock
    if (path.startsWith('/pricing/matrix') && method === 'get') {
      const queryParams = new URL(url).searchParams;
      const pickup = queryParams.get('pickup') || '';
      const drop = queryParams.get('drop') || '';
      const vehicle = queryParams.get('vehicle') || 'Two-Wheeler';

      // Simple pseudo-random mock distance based on address string length
      const distance = parseFloat(((pickup.length + drop.length) % 15 + 2.4).toFixed(1));
      
      // Pricing matrix: Two-Wheeler (₹15/km, min ₹40), Three-Wheeler (₹35/km, min ₹100), Tata Ace (₹60/km, min ₹250)
      let rate = 15;
      let minCharge = 40;
      if (vehicle === 'Three-Wheeler') {
        rate = 35;
        minCharge = 100;
      } else if (vehicle === 'Tata Ace') {
        rate = 60;
        minCharge = 250;
      }

      const price = Math.max(minCharge, Math.round(distance * rate));

      return {
        status: 200,
        data: { distance, price, vehicle },
        headers: {},
        config
      };
    }

    // Fallback 404
    return Promise.reject({ response: { status: 404, data: { message: 'Not Found' } } });
  };

  return config;
}, (error) => {
  return Promise.reject(error);
});

// Axios Response Interceptor to catch 401 and perform silent refresh
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If it's a 401 error and we haven't retried yet
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        console.log("[Axios Interceptor] Caught 401, attempting silent token refresh...");
        await axios.post(`${API_BASE}/auth/refresh`);
        
        // Re-run the original request with the new access token
        const newToken = mockCookies.get('accessToken');
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        console.error("[Axios Interceptor] Silent refresh failed, redirecting to login...");
        mockCookies.clear('accessToken');
        mockCookies.clear('refreshToken');
        window.dispatchEvent(new CustomEvent('auth-logout'));
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Export Cookie Simulator for UI login helper
export const mockAuthSession = {
  getAccessToken: () => mockCookies.get('accessToken'),
  getRefreshToken: () => mockCookies.get('refreshToken'),
  setTokens: (access, refresh) => {
    mockCookies.set('accessToken', access, 15);
    mockCookies.set('refreshToken', refresh, 30 * 24 * 60);
  },
  clear: () => {
    mockCookies.clear('accessToken');
    mockCookies.clear('refreshToken');
  }
};
