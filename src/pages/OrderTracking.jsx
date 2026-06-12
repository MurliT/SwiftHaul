import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE } from '../services/mockApi';
import { MockWebSocket } from '../services/mockWebSocket';
import { 
  MapPin, 
  Phone, 
  Send, 
  MessageSquare, 
  UserCheck, 
  Clock, 
  Navigation,
  CheckCircle,
  Circle,
  PlayCircle,
  Smartphone
} from 'lucide-react';

const OrderTracking = () => {
  const { showToast } = useAuth();
  
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Real-time states
  const [gpsDescription, setGpsDescription] = useState('Awaiting GPS signal...');
  const [driverPos, setDriverPos] = useState({ lat: 22.7533, lng: 75.8937 });
  const [wsStatus, setWsStatus] = useState('disconnected');
  const wsRef = useRef(null);

  // Fetch orders
  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('cookie_accessToken');
      const res = await axios.get(`${API_BASE}/orders`, {
        headers: token ? { 'Authorization': `Bearer ${JSON.parse(token).value}` } : {}
      });
      setOrders(res.data);
      if (res.data.length > 0 && !selectedOrderId) {
        setSelectedOrderId(res.data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch tracking orders:', err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Sync selected order object on select change
  useEffect(() => {
    if (selectedOrderId) {
      const match = orders.find(o => o.id === selectedOrderId);
      if (match) {
        setSelectedOrder(match);
      }
    }
  }, [selectedOrderId, orders]);

  // Connect to tracking WebSocket when selected order changes
  useEffect(() => {
    if (!selectedOrderId) return;

    setWsStatus('connecting');
    
    // Instantiate WebSocket
    wsRef.current = new MockWebSocket(`wss://api.swifthaul.in/ws/tracking?orderId=${selectedOrderId}`);
    
    wsRef.current.onopen = () => {
      setWsStatus('connected');
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'tracking_update' && data.orderId === selectedOrderId) {
        setDriverPos({ lat: data.lat, lng: data.lng });
        setGpsDescription(`${data.zone} - ${data.description}`);
        
        // Refresh orders list to pull updated steps from mock database
        fetchOrders();
      }
    };

    wsRef.current.onclose = () => {
      setWsStatus('disconnected');
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [selectedOrderId]);

  // Generate WhatsApp tracking link (no-install)
  const getWhatsAppShareLink = () => {
    if (!selectedOrder) return '';
    const phoneClean = selectedOrder.customerPhone.replace(/\D/g, '');
    const message = `Hi ${selectedOrder.customerName}, your SwiftHaul delivery of ${selectedOrder.vehicle} from Indore is en route. Track your driver Amit Sharma live here: https://swifthaul.in/track/${selectedOrder.id}`;
    return `https://wa.me/${phoneClean}?text=${encodeURIComponent(message)}`;
  };

  const shareOnWhatsApp = () => {
    const link = getWhatsAppShareLink();
    if (link) {
      window.open(link, '_blank');
      showToast('WhatsApp tracking message template generated!', 'success');
    }
  };

  // Render Step Icon
  const getStepIcon = (status) => {
    if (status === 'completed') {
      return <CheckCircle className="h-6 w-6 text-emerald-500 bg-white" />;
    } else if (status === 'current') {
      return <PlayCircle className="h-6 w-6 text-brand-blue bg-white animate-pulse" />;
    } else {
      return <Circle className="h-6 w-6 text-slate-300 bg-white" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Selection Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">Select Order to Track</h2>
          <p className="text-xs text-slate-400 font-medium">Real-time GPS coordination feeds</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedOrderId}
            onChange={(e) => setSelectedOrderId(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-700 focus:outline-none focus:border-brand-blue"
          >
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.id} ({o.customerName.split(' ')[0]})
              </option>
            ))}
          </select>
          
          <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold">
            <span className={`h-2 w-2 rounded-full ${wsStatus === 'connected' ? 'bg-emerald-500 animate-ping' : 'bg-slate-300'}`}></span>
            <span className={wsStatus === 'connected' ? 'text-emerald-700' : 'text-slate-500'}>
              {wsStatus === 'connected' ? 'Live Stream' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {selectedOrder ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* 5-Step Delivery Timeline */}
          <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Active Timeline</span>
                <h3 className="text-sm font-extrabold text-slate-900 mt-0.5">{selectedOrder.id} Route</h3>
              </div>
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-sky-50 text-brand-blue border border-sky-100">
                {selectedOrder.vehicle}
              </span>
            </div>

            {/* Vertical timeline steps */}
            <div className="relative pl-8 space-y-8 py-2">
              {/* Timeline Connector Line */}
              <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-slate-100 -z-10"></div>
              
              {selectedOrder.deliverySteps.map((step, idx) => (
                <div key={idx} className="relative flex justify-between items-start gap-4">
                  {/* Icon */}
                  <div className="absolute -left-11 top-0">
                    {getStepIcon(step.status)}
                  </div>
                  
                  <div className="space-y-0.5">
                    <span className={`font-bold text-sm ${
                      step.status === 'completed' ? 'text-slate-900' :
                      step.status === 'current' ? 'text-brand-blue' :
                      'text-slate-400'
                    }`}>
                      {step.name}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {step.status === 'completed' ? 'Activity verified' :
                       step.status === 'current' ? 'Pending driver updates' :
                       'Scheduled'}
                    </span>
                  </div>

                  <span className="text-xs font-bold text-slate-500 text-right">
                    {step.time || '--:--'}
                  </span>
                </div>
              ))}
            </div>

            {/* Share link button */}
            <div className="pt-5 border-t border-slate-100 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-slate-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">End-Customer Link</span>
                  <span className="text-xs font-medium text-slate-500 block truncate max-w-[200px] sm:max-w-sm">
                    {`https://swifthaul.in/track/${selectedOrder.id}`}
                  </span>
                </div>
              </div>

              <button
                onClick={shareOnWhatsApp}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center gap-2 shadow-md shadow-emerald-500/10 transition-all shrink-0"
              >
                <MessageSquare className="h-4 w-4" />
                Share WhatsApp
              </button>
            </div>
          </div>

          {/* Driver Contact Card & GPS readout */}
          <div className="space-y-6">
            
            {/* GPS Position Panel */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <Navigation className="h-5 w-5 text-brand-blue animate-pulse" />
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Live Coordinates</span>
              </div>
              <div className="p-3 bg-slate-950 text-white rounded-xl font-mono text-[10px] space-y-1">
                <div>Latitude: {driverPos.lat.toFixed(6)}</div>
                <div>Longitude: {driverPos.lng.toFixed(6)}</div>
              </div>
              <div className="text-xs text-slate-500 leading-relaxed font-semibold">
                📍 {gpsDescription}
              </div>
            </div>

            {/* Driver Profile card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center font-bold text-brand-blue">
                  AS
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">Amit Sharma</h4>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">SwiftHaul Elite Driver</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-semibold py-2.5 border-y border-slate-100">
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase tracking-wider">Vehicle Plate</span>
                  <span className="text-slate-800">MP-09-AB-1234</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase tracking-wider">Driver Rating</span>
                  <span className="text-slate-800">★ 4.8 / 5.0</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <a
                  href="tel:+919893012345"
                  className="py-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-center font-bold text-xs text-slate-600 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Phone className="h-3.5 w-3.5" />
                  Call Driver
                </a>
                <a
                  href={`https://wa.me/919893012345?text=Hi%20Amit,%20where%20have%20you%20reached%20with%20my%20shipment?`}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2.5 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-100 text-emerald-700 rounded-xl text-center font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  WhatsApp
                </a>
              </div>
            </div>

          </div>

        </div>
      ) : (
        <div className="bg-white p-10 rounded-2xl border border-slate-100 shadow-sm text-center">
          <Clock className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base">No active orders available</h3>
          <p className="text-xs text-slate-400 mt-1">Please create a new booking first to start tracking live deliveries.</p>
        </div>
      )}

    </div>
  );
};

export default OrderTracking;
