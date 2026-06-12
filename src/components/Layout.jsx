import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  PlusCircle, 
  MapPin, 
  FileText, 
  Users, 
  LogOut, 
  Menu, 
  X, 
  Map, 
  Building,
  Bell,
  AlertTriangle
} from 'lucide-react';

const Layout = () => {
  const { user, logout, toasts } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['owner', 'manager', 'dispatcher'] },
    { name: 'New Booking', href: '/booking', icon: PlusCircle, roles: ['owner', 'manager', 'dispatcher'] },
    { name: 'Order Tracking', href: '/tracking', icon: MapPin, roles: ['owner', 'manager', 'dispatcher'] },
    { name: 'Invoices', href: '/invoices', icon: FileText, roles: ['owner', 'manager'] }, // dispatcher excluded
    { name: 'Driver Roster', href: '/drivers', icon: Users, roles: ['owner', 'manager', 'dispatcher'] },
  ];

  const filteredNavigation = navigation.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'manager': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'dispatcher': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      
      {/* Mobile Top Navbar */}
      <div className="flex md:hidden items-center justify-between bg-brand-navy text-white px-4 py-3 shadow-md z-45">
        <div className="flex items-center gap-2">
          <Building className="h-6 w-6 text-brand-blue" />
          <span className="font-extrabold text-lg tracking-wider">SwiftHaul</span>
        </div>
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1 rounded-lg hover:bg-slate-800 transition-colors focus:outline-none"
        >
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-brand-navy text-white flex flex-col transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header/Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Building className="h-7 w-7 text-sky-400" />
            <span className="font-black text-xl tracking-wider bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">SwiftHaul</span>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Profile Summary */}
        {user && (
          <div className="px-6 py-5 border-b border-slate-800 bg-slate-900/40">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-sky-400 border border-slate-600">
                {user.role[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate text-slate-100">{user.businessName}</p>
                <p className="text-xs text-slate-400 truncate">{user.phone}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${getRoleBadgeColor(user.role)}`}>
                {user.role.toUpperCase()}
              </span>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                Indore Active
              </span>
            </div>
          </div>
        )}

        {/* Menu Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {filteredNavigation.map((item) => {
            const isActive = location.pathname === item.href || 
                             (item.href !== '/' && location.pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3.5 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-150 ${
                  isActive 
                    ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20' 
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/20">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3.5 px-4 py-3 text-sm font-medium text-slate-400 hover:bg-red-950/30 hover:text-red-400 rounded-xl transition-colors"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Background overlay for mobile menu */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/60 md:hidden backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen">
        {/* Header Bar */}
        <header className="h-16 bg-white border-b border-slate-100 px-6 shrink-0 flex items-center justify-between z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-slate-900 capitalize hidden md:block">
              {location.pathname === '/' ? 'Overview Dashboard' : location.pathname.substring(1).replace('-', ' ')}
            </h1>
            <div className="flex items-center gap-2 text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-semibold border border-slate-200">
              <Map className="h-3.5 w-3.5 text-slate-500" />
              Indore Zone
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span className="hidden sm:inline font-medium text-slate-400">June 2026 Pilot</span>
            <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="font-semibold text-slate-700">API Live</span>
            </div>
          </div>
        </header>

        {/* Content Outlet */}
        <div className="p-6 flex-1 max-w-7xl w-full mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
