import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE } from '../services/mockApi';
import { 
  Users, 
  Star, 
  MapPin, 
  Truck, 
  ShieldCheck, 
  ShieldAlert, 
  Phone,
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const DriverRoster = () => {
  const [drivers, setDrivers] = useState([]);
  const [filteredDrivers, setFilteredDrivers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [zoneFilter, setZoneFilter] = useState('All');

  const fetchDrivers = async () => {
    try {
      const token = localStorage.getItem('cookie_accessToken');
      const res = await axios.get(`${API_BASE}/drivers`, {
        headers: token ? { 'Authorization': `Bearer ${JSON.parse(token).value}` } : {}
      });
      setDrivers(res.data);
      setFilteredDrivers(res.data);
    } catch (err) {
      console.error('Failed to fetch driver roster:', err);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  // Search & Filter
  useEffect(() => {
    let result = drivers;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(d => 
        d.name.toLowerCase().includes(query) || 
        d.phone.includes(query) || 
        d.id.toLowerCase().includes(query)
      );
    }

    if (zoneFilter !== 'All') {
      result = result.filter(d => d.zone === zoneFilter);
    }

    setFilteredDrivers(result);
  }, [searchQuery, zoneFilter, drivers]);

  return (
    <div className="space-y-6">
      
      {/* Header & Filter Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">Registered Driver Roster</h2>
          <p className="text-xs text-slate-400 font-medium">Verify onboarding, ratings, and BGV checks per MV Act norms</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search bar */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search driver name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-brand-blue placeholder-slate-400"
            />
          </div>

          {/* Zone filter */}
          <select
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-brand-blue"
          >
            <option value="All">All Indore Zones</option>
            <option value="Vijay Nagar">Vijay Nagar</option>
            <option value="Palasia">Palasia</option>
            <option value="Bhanwarkuan">Bhanwarkuan</option>
            <option value="Annapurna">Annapurna</option>
            <option value="Rajwada">Rajwada</option>
          </select>
        </div>
      </div>

      {/* Driver roster grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDrivers.map((driver) => (
          <div 
            key={driver.id} 
            className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4 hover:shadow-md hover:border-slate-200/80 transition-all flex flex-col justify-between"
          >
            <div>
              {/* Header: Name and status */}
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">{driver.id}</span>
                  <h3 className="font-extrabold text-slate-900 text-sm truncate mt-0.5">{driver.name}</h3>
                  <a 
                    href={`tel:${driver.phone}`}
                    className="text-xs text-brand-blue font-bold flex items-center gap-1 mt-1 hover:text-sky-700 transition-colors"
                  >
                    <Phone className="h-3 w-3 shrink-0" />
                    {driver.phone}
                  </a>
                </div>

                <div className="flex flex-col items-end shrink-0">
                  <span className="flex items-center gap-1 text-xs font-bold text-slate-800 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                    <Star className="h-3.5 w-3.5 fill-amber-400 stroke-amber-400" />
                    {driver.rating}
                  </span>
                </div>
              </div>

              {/* Vehicle & Zone Details */}
              <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-50 text-xs font-semibold mt-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Vehicle Type</span>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <Truck className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    {driver.vehicle}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Assigned Zone</span>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    {driver.zone}
                  </div>
                </div>
              </div>
            </div>

            {/* BGV verification Badge details */}
            <div className="pt-2">
              <div className={`p-3 rounded-xl border flex items-center justify-between ${
                driver.bgvStatus === 'Verified' 
                  ? 'bg-emerald-50/60 border-emerald-100/80 text-emerald-800' 
                  : 'bg-amber-50/60 border-amber-100/80 text-amber-800'
              }`}>
                <div className="flex items-center gap-2">
                  {driver.bgvStatus === 'Verified' ? (
                    <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
                  ) : (
                    <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0" />
                  )}
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">BGV Status</span>
                    <span className="text-xs font-bold block mt-0.5">{driver.bgvStatus}</span>
                  </div>
                </div>
                
                <span className="px-2 py-0.5 bg-white border rounded text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                  {driver.bgvProvider}
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold mt-4">
                <span className="flex items-center gap-1 text-emerald-500">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Active in Duty
                </span>
                <span>Onboarding Stage 3</span>
              </div>
            </div>

          </div>
        ))}
        {filteredDrivers.length === 0 && (
          <div className="col-span-full bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center">
            <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800 text-sm">No drivers found</h3>
            <p className="text-xs text-slate-400 mt-1">Try resetting the search query or zone filter.</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default DriverRoster;
