import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE } from '../services/mockApi';
import { MockWebSocket } from '../services/mockWebSocket';
import { 
  TrendingUp, 
  Truck, 
  MapPin, 
  IndianRupee, 
  Users, 
  Compass, 
  Clock, 
  Layers, 
  Navigation 
} from 'lucide-react';

const Dashboard = () => {
  const { user, showToast } = useAuth();
  const [orders, setOrders] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [metrics, setMetrics] = useState({
    activeOrders: 0,
    driversOnRoute: 0,
    todayRevenue: 0,
    onTimeRate: '96.2%'
  });
  
  // Real-time map positions
  const [liveDriverPositions, setLiveDriverPositions] = useState([
    { id: 'D-101', name: 'Amit Sharma', lat: 22.7533, lng: 75.8937, vehicle: 'Two-Wheeler', zone: 'Vijay Nagar' },
    { id: 'D-102', name: 'Rajesh Khan', lat: 22.7200, lng: 75.8780, vehicle: 'Three-Wheeler', zone: 'Palasia' }
  ]);

  const wsRef = useRef(null);

  // Fetch initial data
  const fetchData = async () => {
    try {
      const ordersRes = await axios.get(`${API_BASE}/orders`);
      const driversRes = await axios.get(`${API_BASE}/drivers`);
      setOrders(ordersRes.data);
      setDrivers(driversRes.data.filter(d => d.active));
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };

  useEffect(() => {
    fetchData();

    // Setup Live WebSocket tracking updates
    wsRef.current = new MockWebSocket('wss://api.swifthaul.in/ws/tracking');
    
    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'gps_tick') {
        // Update general map positions
        setLiveDriverPositions(prev => 
          prev.map(p => {
            const match = data.drivers.find(d => d.id === p.id);
            return match ? { ...p, lat: match.lat, lng: match.lng } : p;
          })
        );
      } else if (data.type === 'tracking_update') {
        // Update specific driver position
        setLiveDriverPositions(prev => 
          prev.map(p => 
            p.id === data.driverId ? { ...p, lat: data.lat, lng: data.lng, zone: data.zone } : p
          )
        );
        // Refresh orders list to show updated steps
        fetchData();
      }
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Calculate metrics whenever orders update
  useEffect(() => {
    if (orders.length === 0) return;
    
    const active = orders.filter(o => ['assigned', 'pickup', 'in_transit'].includes(o.status)).length;
    const onRoute = orders.filter(o => ['in_transit'].includes(o.status)).length;
    
    // Calculate today's revenue (Indore local timezone mock)
    const todayStr = new Date().toISOString().split('T')[0];
    const revenue = orders
      .filter(o => o.date === todayStr)
      .reduce((sum, o) => sum + o.revenue, 0);

    setMetrics({
      activeOrders: active,
      driversOnRoute: onRoute || 2, // Ensure realistic minimum
      todayRevenue: revenue,
      onTimeRate: '95.8%'
    });
  }, [orders]);

  // Status badge style helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'delivered':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Delivered</span>;
      case 'in_transit':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-orange-50 text-orange-700 border border-orange-200 animate-pulse">In Transit</span>;
      case 'pickup':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">Pickup</span>;
      case 'assigned':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200">Assigned</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-50 text-slate-600 border border-slate-200">{status}</span>;
    }
  };

  // Indore Vector Map Coordinate Normalisation (22.7000 to 22.7700 Lat, 75.8400 to 75.9100 Lng)
  // Maps gps lat/lng coordinates to SVG viewbox (0,0 to 500,400)
  const getSvgCoordinates = (lat, lng) => {
    const minLat = 22.7000;
    const maxLat = 22.7700;
    const minLng = 75.8400;
    const maxLng = 75.9100;
    
    const x = ((lng - minLng) / (maxLng - minLng)) * 500;
    const y = 400 - (((lat - minLat) / (maxLat - minLat)) * 400); // SVG invert Y-axis
    return { x, y };
  };

  const zonesHotspots = [
    { name: 'Vijay Nagar', lat: 22.7533, lng: 75.8937, radius: 45, color: 'fill-blue-100 stroke-blue-300' },
    { name: 'Palasia', lat: 22.7200, lng: 75.8780, radius: 40, color: 'fill-purple-100 stroke-purple-300' },
    { name: 'Rajwada', lat: 22.7244, lng: 75.8569, radius: 35, color: 'fill-orange-100 stroke-orange-300' },
    { name: 'Bhanwarkuan', lat: 22.7001, lng: 75.8600, radius: 40, color: 'fill-emerald-100 stroke-emerald-300' }
  ];

  return (
    <div className="space-y-6">
      
      {/* 1. Live Metrics row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-brand-blue/10 text-brand-blue rounded-xl">
            <Truck className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Orders</span>
            <span className="text-2xl font-extrabold text-slate-900">{metrics.activeOrders}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
            <Compass className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">On Route</span>
            <span className="text-2xl font-extrabold text-slate-900">{metrics.driversOnRoute}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <IndianRupee className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Today's Revenue</span>
            <span className="text-2xl font-extrabold text-slate-900">₹{metrics.todayRevenue}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">On-Time %</span>
            <span className="text-2xl font-extrabold text-slate-900">{metrics.onTimeRate}</span>
          </div>
        </div>

      </div>

      {/* 2. Map & Drivers section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Vector Indore Live Map */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Indore Locality Live GPS</h2>
              <p className="text-xs text-slate-400 font-medium">Real-time driver location updates via WebSockets</p>
            </div>
            <div className="flex items-center gap-1.5 bg-sky-50 text-sky-700 px-2.5 py-1 rounded-full text-xs font-semibold">
              <Navigation className="h-3 w-3 animate-bounce" />
              Live Tracking Mode
            </div>
          </div>
          
          {/* Custom SVG Vector Map Container */}
          <div className="flex-1 bg-slate-950 rounded-xl relative overflow-hidden border border-slate-800 min-h-[350px] flex items-center justify-center">
            <svg 
              viewBox="0 0 500 400" 
              className="w-full h-full max-h-[380px] p-4 text-slate-700 select-none"
            >
              {/* Grid Lines for layout feeling */}
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1E293B" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              
              {/* Major Roads representation */}
              <line x1="250" y1="0" x2="250" y2="400" stroke="#334155" strokeWidth="1.5" strokeDasharray="4,4" /> {/* AB Road */}
              <line x1="0" y1="200" x2="500" y2="200" stroke="#334155" strokeWidth="1.5" strokeDasharray="4,4" /> {/* Ring Road */}
              
              {/* Localities Hotspots */}
              {zonesHotspots.map((zone) => {
                const { x, y } = getSvgCoordinates(zone.lat, zone.lng);
                return (
                  <g key={zone.name}>
                    <circle cx={x} cy={y} r={zone.radius} className={`${zone.color} fill-slate-900/40 stroke-dashed`} strokeWidth="1" strokeDasharray="3,3" />
                    <text x={x} y={y - 12} textAnchor="middle" className="fill-slate-500 font-bold text-[9px] uppercase tracking-wider">{zone.name}</text>
                  </g>
                );
              })}

              {/* Live Drivers Markers */}
              {liveDriverPositions.map((driver) => {
                const { x, y } = getSvgCoordinates(driver.lat, driver.lng);
                return (
                  <g key={driver.id} className="transition-all duration-1000 ease-out">
                    {/* Ripple halo effect */}
                    <circle cx={x} cy={y} r="10" className="fill-brand-blue/30 animate-ping" />
                    {/* Marker pin */}
                    <circle cx={x} cy={y} r="5.5" className="fill-brand-blue stroke-white" strokeWidth="1.5" />
                    {/* Driver tag */}
                    <rect x={x - 25} y={y + 8} width="50" height="12" rx="3" className="fill-slate-900/90 stroke-slate-800" strokeWidth="0.5" />
                    <text x={x} y={y + 16} textAnchor="middle" className="fill-white font-semibold text-[7px]">{driver.name.split(' ')[0]}</text>
                  </g>
                );
              })}
            </svg>
            
            {/* Map Legend */}
            <div className="absolute bottom-3 left-3 bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 text-[9px] text-slate-400 space-y-1">
              <span className="font-bold text-white block uppercase tracking-wider">Locality legend</span>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-blue"></span>
                <span>Active Drivers</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-px bg-slate-700 border-dashed border"></span>
                <span>Indore Arterial Roads</span>
              </div>
            </div>
          </div>
        </div>

        {/* Available Drivers List */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
          <div className="mb-4">
            <h2 className="text-base font-extrabold text-slate-900">Drivers in Active Zones</h2>
            <p className="text-xs text-slate-400 font-medium">Top performing drivers near Indore hubs</p>
          </div>
          
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[350px] pr-1">
            {drivers.map((driver) => (
              <div 
                key={driver.id} 
                className="p-3.5 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 truncate">{driver.name}</span>
                    <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-slate-100 text-slate-600 rounded">
                      {driver.vehicle}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 block font-medium mt-1">Zone: {driver.zone}</span>
                </div>
                
                <div className="text-right shrink-0">
                  <span className="flex items-center gap-1 text-xs font-bold text-slate-800">
                    ★ {driver.rating}
                  </span>
                  <span className="text-[10px] text-emerald-500 font-semibold bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded block mt-1">
                    Available
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 3. Live Orders Table & Zone stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Live Orders table */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Today's Live Shipments</h2>
              <p className="text-xs text-slate-400 font-medium">Real-time update streams for client orders</p>
            </div>
            <button 
              onClick={fetchData} 
              className="text-xs font-bold text-brand-blue hover:text-sky-700 bg-sky-50 px-3 py-1.5 rounded-lg transition-colors border border-sky-100"
            >
              Force Sync
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3 font-semibold">ID / Customer</th>
                  <th className="pb-3 font-semibold">Routes</th>
                  <th className="pb-3 font-semibold">Vehicle</th>
                  <th className="pb-3 font-semibold text-center">Status</th>
                  <th className="pb-3 font-semibold text-right">Cost (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-all">
                    <td className="py-3.5">
                      <span className="font-bold text-slate-900 block">{order.id}</span>
                      <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">{order.customerName}</span>
                    </td>
                    <td className="py-3.5 max-w-[200px] truncate">
                      <span className="font-semibold text-slate-700 block truncate">{order.pickup.split(',')[0]}</span>
                      <span className="text-[10px] text-slate-400 block truncate mt-0.5">→ {order.drop.split(',')[0]}</span>
                    </td>
                    <td className="py-3.5">
                      <span className="font-semibold text-slate-600 block">{order.vehicle}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{order.distance} km</span>
                    </td>
                    <td className="py-3.5 text-center">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="py-3.5 text-right font-extrabold text-slate-950">
                      ₹{order.revenue}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Zone Performance Bars */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="mb-4">
              <h2 className="text-base font-extrabold text-slate-900">Zone Performance</h2>
              <p className="text-xs text-slate-400 font-medium">On-time delivery rates across Indore hubs</p>
            </div>
            
            <div className="space-y-4">
              {[
                { name: 'Vijay Nagar', pct: 98, count: '14 orders' },
                { name: 'Palasia', pct: 95, count: '9 orders' },
                { name: 'Bhanwarkuan', pct: 92, count: '7 orders' },
                { name: 'Rajwada', pct: 88, count: '12 orders' }
              ].map((zone) => (
                <div key={zone.name} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>{zone.name}</span>
                    <span className="text-slate-500 font-bold">{zone.pct}% ({zone.count})</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        zone.pct >= 95 ? 'bg-emerald-500' :
                        zone.pct >= 90 ? 'bg-brand-blue' :
                        'bg-amber-500'
                      }`}
                      style={{ width: `${zone.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-5 p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-emerald-500 shrink-0" />
            <span className="text-[11px] text-slate-500 leading-relaxed">
              Indore zone on-time metrics have increased by **2.4%** since adding SMS fallback notifications.
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
