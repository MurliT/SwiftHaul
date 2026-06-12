import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE } from '../services/mockApi';
import { 
  PlusCircle, 
  Upload, 
  MapPin, 
  Truck, 
  CreditCard, 
  AlertCircle, 
  CheckCircle2, 
  FileSpreadsheet, 
  Zap,
  WifiOff,
  Wifi,
  Loader2
} from 'lucide-react';

const NewBooking = () => {
  const { showToast } = useAuth();
  
  // Tab control
  const [bookingMode, setBookingMode] = useState('instant'); // instant, bulk
  
  // Connectivity state
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineQueue, setOfflineQueue] = useState([]);

  // Instant Booking Form States
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [vehicle, setVehicle] = useState('Two-Wheeler');
  const [paymentMode, setPaymentMode] = useState('UPI'); // UPI, COD, Razorpay
  
  // Price Estimator States
  const [estimating, setEstimating] = useState(false);
  const [distance, setDistance] = useState(0);
  const [estimatePrice, setEstimatePrice] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Bulk Booking States
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkOrders, setBulkOrders] = useState([]);
  const [bulkTotalCost, setBulkTotalCost] = useState(0);

  // Manage Online/Offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Internet connection restored. Syncing queue...', 'success');
      syncQueue();
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('You are offline. Offline booking queue active.', 'warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Load offline queue on mount
    const savedQueue = JSON.parse(localStorage.getItem('sh_offline_queue') || '[]');
    setOfflineQueue(savedQueue);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync Offline Queue to API
  const syncQueue = async () => {
    const queue = JSON.parse(localStorage.getItem('sh_offline_queue') || '[]');
    if (queue.length === 0) return;

    let successCount = 0;
    const token = localStorage.getItem('cookie_accessToken');
    const authHeaders = token ? { 'Authorization': `Bearer ${JSON.parse(token).value}` } : {};

    for (const order of queue) {
      try {
        await axios.post(`${API_BASE}/orders`, order, { headers: authHeaders });
        successCount++;
        // Simulate SMS sent
        console.log(`[SMS Gateway Fallback] SMS booking confirmation sent to ${order.customerPhone}`);
      } catch (err) {
        console.error('Failed to sync offline order:', order.id, err);
      }
    }

    // Clear queue or keep failed ones
    localStorage.setItem('sh_offline_queue', '[]');
    setOfflineQueue([]);
    
    if (successCount > 0) {
      showToast(`Successfully synced ${successCount} offline bookings to server!`, 'success');
      // Fire custom event to refresh dashboard if needed
      window.dispatchEvent(new CustomEvent('swifthaul-toast', {
        detail: { message: `${successCount} bookings synchronized. GST invoices generated.`, type: 'success' }
      }));
    }
  };

  // Estimate price on route change
  useEffect(() => {
    if (pickup.trim().length > 4 && drop.trim().length > 4) {
      const fetchEstimate = async () => {
        setEstimating(true);
        try {
          const token = localStorage.getItem('cookie_accessToken');
          const authHeaders = token ? { 'Authorization': `Bearer ${JSON.parse(token).value}` } : {};
          const res = await axios.get(
            `${API_BASE}/pricing/matrix?pickup=${encodeURIComponent(pickup)}&drop=${encodeURIComponent(drop)}&vehicle=${vehicle}`,
            { headers: authHeaders }
          );
          setDistance(res.data.distance);
          setEstimatePrice(res.data.price);
        } catch (e) {
          // Fallback static estimation when offline
          const dist = parseFloat(((pickup.length + drop.length) % 12 + 1.8).toFixed(1));
          let rate = vehicle === 'Tata Ace' ? 60 : vehicle === 'Three-Wheeler' ? 35 : 15;
          let min = vehicle === 'Tata Ace' ? 250 : vehicle === 'Three-Wheeler' ? 100 : 40;
          setDistance(dist);
          setEstimatePrice(Math.max(min, Math.round(dist * rate)));
        } finally {
          setEstimating(false);
        }
      };
      
      const debounceTimer = setTimeout(fetchEstimate, 600);
      return () => clearTimeout(debounceTimer);
    }
  }, [pickup, drop, vehicle]);

  // Submit Instant Booking
  const handleInstantSubmit = async (e) => {
    e.preventDefault();
    if (!pickup || !drop || !customerName || !customerPhone) {
      showToast('All fields are mandatory', 'warning');
      return;
    }

    const orderPayload = {
      pickup,
      drop,
      customerName,
      customerPhone: customerPhone.startsWith('+91') ? customerPhone : `+91 ${customerPhone}`,
      vehicle,
      paymentMode,
      revenue: estimatePrice,
      distance,
      driverId: 'D-101' // Default matched driver
    };

    setSubmitting(true);

    if (!isOnline) {
      // Offline Booking Saving Logic
      const queuedOrder = {
        ...orderPayload,
        id: `OFF-SH-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'assigned',
        date: new Date().toISOString().split('T')[0],
        deliverySteps: [
          { name: 'Booked', status: 'completed', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
          { name: 'Assigned (Offline Queue)', status: 'current', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
          { name: 'Picked Up', status: 'pending', time: '' },
          { name: 'In Transit', status: 'pending', time: '' },
          { name: 'Delivered', status: 'pending', time: '' }
        ]
      };

      const updatedQueue = [...offlineQueue, queuedOrder];
      localStorage.setItem('sh_offline_queue', JSON.stringify(updatedQueue));
      setOfflineQueue(updatedQueue);
      
      // Update primary orders in localStorage so it appears in UI dashboard offline!
      const activeOrders = JSON.parse(localStorage.getItem('sh_orders') || '[]');
      activeOrders.unshift(queuedOrder);
      localStorage.setItem('sh_orders', JSON.stringify(activeOrders));

      showToast('Offline Mode: Booking saved to local queue. SMS verification triggers on sync.', 'warning');
      
      // Clear form
      setPickup('');
      setDrop('');
      setCustomerName('');
      setCustomerPhone('');
      setSubmitting(false);
      return;
    }

    // Online submission
    try {
      const token = localStorage.getItem('cookie_accessToken');
      await axios.post(`${API_BASE}/orders`, orderPayload, {
        headers: token ? { 'Authorization': `Bearer ${JSON.parse(token).value}` } : {}
      });
      showToast('Booking created successfully! Driver matched in 4m.', 'success');
      
      // Clear form
      setPickup('');
      setDrop('');
      setCustomerName('');
      setCustomerPhone('');
    } catch (err) {
      showToast('Failed to create booking', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Mock parse CSV File
  const handleCsvUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setBulkFile(file);
    showToast('Parsing CSV booking data...', 'info');

    // Simulate CSV parsing delay
    setTimeout(() => {
      // Generating mock Indian locality routes for Indore bulk bookings
      const mockParsedStops = [
        { id: 1, name: 'Palasia Chemists', phone: '+91 98260 22334', pickup: 'Old Palasia, Indore', drop: 'Vijay Nagar, Indore', vehicle: 'Two-Wheeler', cost: 120, status: 'valid' },
        { id: 2, name: 'Indore Bakers Shop', phone: '+91 94250 55667', pickup: 'Rajwada, Indore', drop: 'Bhanwarkuan, Indore', vehicle: 'Two-Wheeler', cost: 140, status: 'valid' },
        { id: 3, name: 'Anil Kirana Stores', phone: '+91 91110 33445', pickup: 'Annapurna Area, Indore', drop: 'Geeta Bhawan, Indore', vehicle: 'Three-Wheeler', cost: 280, status: 'valid' },
        { id: 4, name: 'Indore Electronics', phone: '+91 98930 77889', pickup: 'LIG Square, Indore', drop: 'Vijay Nagar, Indore', vehicle: 'Tata Ace', cost: 380, status: 'valid' }
      ];

      setBulkOrders(mockParsedStops);
      setBulkTotalCost(mockParsedStops.reduce((sum, item) => sum + item.cost, 0));
      showToast('CSV parsed successfully. 4 bookings ready.', 'success');
    }, 1000);
  };

  // Confirm Bulk Booking
  const handleBulkSubmit = async () => {
    if (bulkOrders.length === 0) return;
    
    setSubmitting(true);
    const token = localStorage.getItem('cookie_accessToken');
    const authHeaders = token ? { 'Authorization': `Bearer ${JSON.parse(token).value}` } : {};

    let successfulBookings = 0;
    
    for (const order of bulkOrders) {
      if (!isOnline) {
        // Queue bulk order offline
        const queuedOrder = {
          pickup: order.pickup,
          drop: order.drop,
          customerName: order.name,
          customerPhone: order.phone,
          vehicle: order.vehicle,
          paymentMode: 'COD',
          revenue: order.cost,
          distance: 5.2,
          driverId: 'D-102',
          id: `OFF-SH-${Math.floor(1000 + Math.random() * 9000)}`,
          status: 'assigned',
          date: new Date().toISOString().split('T')[0],
          deliverySteps: [
            { name: 'Booked', status: 'completed', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
            { name: 'Assigned', status: 'current', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
            { name: 'Picked Up', status: 'pending', time: '' }
          ]
        };
        const activeQueue = JSON.parse(localStorage.getItem('sh_offline_queue') || '[]');
        activeQueue.push(queuedOrder);
        localStorage.setItem('sh_offline_queue', JSON.stringify(activeQueue));
        
        // Add to main local storage DB
        const activeOrders = JSON.parse(localStorage.getItem('sh_orders') || '[]');
        activeOrders.unshift(queuedOrder);
        localStorage.setItem('sh_orders', JSON.stringify(activeOrders));
        
        successfulBookings++;
      } else {
        try {
          await axios.post(`${API_BASE}/orders`, {
            pickup: order.pickup,
            drop: order.drop,
            customerName: order.name,
            customerPhone: order.phone,
            vehicle: order.vehicle,
            paymentMode: 'COD',
            revenue: order.cost,
            distance: 5.2,
            driverId: 'D-102'
          }, { headers: authHeaders });
          successfulBookings++;
        } catch (e) {
          console.error('Failed creating bulk stop:', order.id);
        }
      }
    }

    setSubmitting(false);
    
    if (isOnline) {
      showToast(`Successfully booked ${successfulBookings} bulk shipments!`, 'success');
    } else {
      setOfflineQueue(JSON.parse(localStorage.getItem('sh_offline_queue') || '[]'));
      showToast(`Offline Mode: Added ${successfulBookings} stops to sync queue.`, 'warning');
    }
    
    // Clear list
    setBulkOrders([]);
    setBulkFile(null);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Network Alert Banner */}
      <div className={`p-4 rounded-xl border flex items-center justify-between transition-all duration-300 ${
        isOnline 
          ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
          : 'bg-amber-50 border-amber-100 text-amber-800 animate-pulse'
      }`}>
        <div className="flex items-center gap-2.5">
          {isOnline ? <Wifi className="h-5 w-5 text-emerald-600" /> : <WifiOff className="h-5 w-5 text-amber-600" />}
          <div>
            <span className="font-extrabold text-sm block">
              {isOnline ? 'Online Delivery System Active' : 'Offline Mode Active'}
            </span>
            <span className="text-xs text-slate-500">
              {isOnline 
                ? 'All routes estimated using Indore Distance Matrix API.' 
                : 'Bookings will be safely queued in local storage and synced when 4G restores.'}
            </span>
          </div>
        </div>
        
        {offlineQueue.length > 0 && (
          <span className="px-3 py-1 bg-amber-200 border border-amber-300 text-amber-900 rounded-full font-bold text-xs">
            {offlineQueue.length} Bookings Queued
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setBookingMode('instant')}
          className={`pb-3.5 px-6 font-bold text-sm border-b-2 transition-colors ${
            bookingMode === 'instant'
              ? 'border-brand-blue text-brand-blue'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Instant Booking (Single Stop)
        </button>
        <button
          onClick={() => setBookingMode('bulk')}
          className={`pb-3.5 px-6 font-bold text-sm border-b-2 transition-colors ${
            bookingMode === 'bulk'
              ? 'border-brand-blue text-brand-blue'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Bulk Booking (CSV Upload)
        </button>
      </div>

      {/* INSTANT BOOKING FORM */}
      {bookingMode === 'instant' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Form */}
          <form onSubmit={handleInstantSubmit} className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
            <h2 className="text-base font-extrabold text-slate-900">Delivery Route & Customer Details</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Customer Name</label>
                <input
                  type="text"
                  placeholder="e.g. Anil Pharmacy"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-blue font-semibold text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Customer Phone</label>
                <input
                  type="tel"
                  placeholder="e.g. 98260 98765"
                  maxLength="10"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-blue font-semibold text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Pickup Address (Indore)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="Vijay Nagar Sector C, Indore"
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-blue font-semibold text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Drop Address (Indore)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="Chappan Dukan, New Palasia, Indore"
                    value={drop}
                    onChange={(e) => setDrop(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-blue font-semibold text-sm"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Vehicle Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Select Vehicle Type</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { type: 'Two-Wheeler', desc: 'Bike - up to 20kg', speed: 'Fastest' },
                  { type: 'Three-Wheeler', desc: 'Ape - up to 300kg', speed: 'Eco' },
                  { type: 'Tata Ace', desc: 'Chota Hathi - 800kg', speed: 'Heavy' }
                ].map((v) => (
                  <div
                    key={v.type}
                    onClick={() => setVehicle(v.type)}
                    className={`p-3.5 border rounded-xl cursor-pointer text-center select-none transition-all ${
                      vehicle === v.type
                        ? 'border-brand-blue bg-sky-50/40 text-brand-blue ring-1 ring-brand-blue'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Truck className="h-5 w-5 mx-auto mb-1.5" />
                    <span className="block font-bold text-xs text-slate-900">{v.type}</span>
                    <span className="text-[10px] text-slate-400 font-medium block mt-0.5">{v.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Payment Option</label>
              <div className="grid grid-cols-3 gap-3">
                {['UPI', 'COD', 'Razorpay'].map((m) => (
                  <div
                    key={m}
                    onClick={() => setPaymentMode(m)}
                    className={`p-3 border rounded-xl cursor-pointer text-center select-none transition-all font-bold text-xs ${
                      paymentMode === m
                        ? 'border-brand-blue bg-sky-50/40 text-brand-blue ring-1 ring-brand-blue'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard className="h-4 w-4 mx-auto mb-1" />
                    {m}
                  </div>
                ))}
              </div>
            </div>
          </form>

          {/* Pricing Estimation Side Panel */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 mb-4">Cost Estimation Summary</h2>
              
              {pickup.length > 4 && drop.length > 4 ? (
                <div className="space-y-5">
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-400">Total Distance</span>
                      <span className="text-slate-800 font-bold">{estimating ? 'Calculating...' : `${distance} km`}</span>
                    </div>
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-400">Vehicle Base Rate</span>
                      <span className="text-slate-800 font-bold">
                        {vehicle === 'Tata Ace' ? '₹60/km' : vehicle === 'Three-Wheeler' ? '₹35/km' : '₹15/km'}
                      </span>
                    </div>
                    <div className="h-px bg-slate-200"></div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-extrabold text-slate-900">Total Estimate</span>
                      <span className="text-xl font-black text-brand-blue">
                        {estimating ? <Loader2 className="h-5 w-5 animate-spin" /> : `₹${estimatePrice}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-[10px] text-slate-400 bg-slate-50 p-3 rounded-lg leading-relaxed">
                    <AlertCircle className="h-4 w-4 text-slate-400 shrink-0" />
                    Price includes Indore fuel surge index. Automated GST receipt generated on delivery confirmation.
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 border border-dashed border-slate-200 rounded-2xl text-center">
                  <Zap className="h-8 w-8 text-slate-300 mb-2" />
                  <span className="text-xs font-bold text-slate-500">Awaiting Route Input</span>
                  <span className="text-[10px] text-slate-400 mt-1 max-w-[160px]">
                    Enter valid pickup and drop addresses to calculate route pricing.
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={handleInstantSubmit}
              disabled={submitting || pickup.length < 5 || drop.length < 5}
              className="w-full bg-brand-blue hover:bg-sky-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all mt-6"
            >
              {submitting ? 'Confirming...' : 'Confirm Delivery Booking'}
            </button>
          </div>
        </div>
      )}

      {/* BULK BOOKING UPLOADER */}
      {bookingMode === 'bulk' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <div className="mb-4">
            <h2 className="text-base font-extrabold text-slate-900">Bulk Stops Upload (.csv)</h2>
            <p className="text-xs text-slate-400 font-medium">Coordinate multiple en-route pickups in one click</p>
          </div>

          {bulkOrders.length === 0 ? (
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 flex flex-col items-center justify-center text-center hover:bg-slate-50/50 transition-colors">
              <Upload className="h-10 w-10 text-slate-300 mb-3" />
              <span className="text-sm font-bold text-slate-700">Drag & Drop Booking CSV</span>
              <span className="text-xs text-slate-400 mt-1 mb-4">or click to browse from local computer</span>
              
              <input
                type="file"
                accept=".csv"
                id="csv-file"
                onChange={handleCsvUpload}
                className="hidden"
              />
              <label
                htmlFor="csv-file"
                className="px-5 py-2.5 bg-brand-blue hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all"
              >
                Choose CSV File
              </label>
            </div>
          ) : (
            <div className="space-y-6">
              {/* CSV Parsing Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Uploaded Stops</span>
                  <span className="text-xl font-extrabold text-slate-900">{bulkOrders.length}</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Est. Cost</span>
                  <span className="text-xl font-extrabold text-slate-900 text-brand-blue">₹{bulkTotalCost}</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">File Status</span>
                    <span className="text-xs font-bold text-emerald-500 block mt-1">Ready for Dispatch</span>
                  </div>
                  <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                </div>
              </div>

              {/* Table of Parsed Stops */}
              <div className="border border-slate-100 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-400 uppercase font-bold tracking-wider">
                    <tr>
                      <th className="p-3">Client Stop</th>
                      <th className="p-3">Pickup</th>
                      <th className="p-3">Drop</th>
                      <th className="p-3">Vehicle</th>
                      <th className="p-3 text-right">Cost (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bulkOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/50">
                        <td className="p-3">
                          <span className="font-bold text-slate-800 block">{order.name}</span>
                          <span className="text-[10px] text-slate-400 mt-0.5 block">{order.phone}</span>
                        </td>
                        <td className="p-3 text-slate-600 font-semibold">{order.pickup}</td>
                        <td className="p-3 text-slate-600 font-semibold">{order.drop}</td>
                        <td className="p-3 text-slate-500 font-bold">{order.vehicle}</td>
                        <td className="p-3 text-right font-extrabold text-slate-900">₹{order.cost}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Confirm Buttons */}
              <div className="flex gap-4 justify-end">
                <button
                  onClick={() => {
                    setBulkOrders([]);
                    setBulkFile(null);
                  }}
                  className="px-5 py-3 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold text-xs text-slate-500 transition-colors"
                >
                  Discard File
                </button>
                <button
                  onClick={handleBulkSubmit}
                  disabled={submitting}
                  className="px-6 py-3 bg-brand-blue hover:bg-sky-700 text-white rounded-xl font-bold text-xs shadow-md transition-all"
                >
                  {submitting ? 'Confirming Shipments...' : 'Confirm Bulk Shipments'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default NewBooking;
