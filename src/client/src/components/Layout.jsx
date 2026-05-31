import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Layers, 
  CircleDot, 
  Users, 
  CalendarClock, 
  CircleDollarSign, 
  Receipt, 
  Settings, 
  FileText, 
  LogOut,
  Menu,
  X,
  UserCheck
} from 'lucide-react';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [dateTimeStr, setDateTimeStr] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('jayalal_coco_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate('/login');
    }

    // Dynamic Clock
    const timer = setInterval(() => {
      const now = new Date();
      setDateTimeStr(now.toLocaleString('si-LK', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('jayalal_coco_token');
    localStorage.removeItem('jayalal_coco_user');
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Quick Billing / බිල්පත්', path: '/billing', icon: Receipt },
    { name: 'පොල් / Coconut', path: '/coconut', icon: CircleDot },
    { name: 'පොල් ලෙලි / Coco Husk', path: '/husk', icon: Layers },
    { name: 'Batches / ගොඩවල්', path: '/batches', icon: Layers },
    { name: 'Customers / ගනුදෙනුකරුවන්', path: '/customers', icon: Users },
    { name: 'Payments / 21-දිනය', path: '/payments', icon: CalendarClock },
    { name: 'Expenses / වියදම්', path: '/expenses', icon: CircleDollarSign },
    { name: 'Reports / වාර්තා', path: '/reports', icon: FileText },
    { name: 'Receipt Settings / රිසිට් පත්', path: '/settings/receipt', icon: Receipt },
    { name: 'Business Settings / ආයතනය', path: '/settings/business', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden font-sans">
      {/* Sidebar for Desktop */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-72 dark-glass border-r border-slate-800">
          <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
            {/* Business Logo Section */}
            <div className="flex items-center flex-shrink-0 px-6 mb-6">
              <span className="text-2xl font-bold font-display text-white tracking-wide flex items-center gap-2">
                <span className="bg-emerald-500 text-slate-900 p-1.5 rounded-lg text-lg">🥥</span>
                JAYALAL COCO
              </span>
            </div>
            
            {/* Navigation links */}
            <nav className="flex-1 px-4 space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-emerald-500 text-slate-950 font-semibold shadow-lg shadow-emerald-500/20'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-slate-950' : 'text-slate-400 group-hover:text-white'}`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          
          {/* User info & Logout */}
          <div className="flex-shrink-0 flex border-t border-slate-800 p-4 bg-slate-950/40">
            <div className="flex items-center w-full justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-slate-800 p-2 rounded-full text-emerald-400">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{user?.username || 'Admin'}</p>
                  <p className="text-xs text-slate-400">ක්‍රියාකරු / Operator</p>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 transition-colors"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div className={`lg:hidden fixed inset-0 flex z-40 transition-opacity duration-300 ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)}></div>
        <div className={`relative flex flex-col max-w-xs w-full bg-slate-950 border-r border-slate-800 pt-5 pb-4 transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              onClick={() => setMobileOpen(false)}
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white bg-slate-900 text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="flex-shrink-0 flex items-center px-6 mb-6">
            <span className="text-2xl font-bold font-display text-white tracking-wide flex items-center gap-2">
              <span className="bg-emerald-500 text-slate-900 p-1.5 rounded-lg text-lg">🥥</span>
              JAYALAL COCO
            </span>
          </div>
          <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950 font-semibold shadow-lg shadow-emerald-500/20'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-slate-950' : 'text-slate-400 group-hover:text-white'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="flex-shrink-0 flex border-t border-slate-800 p-4 bg-slate-900">
            <div className="flex items-center w-full justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-slate-800 p-2 rounded-full text-emerald-400">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{user?.username || 'Admin'}</p>
                  <p className="text-xs text-slate-400">ක්‍රියාකරු / Operator</p>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Viewport */}
      <div className="flex flex-col flex-1 overflow-hidden bg-slate-950">
        {/* Navbar */}
        <header className="flex-shrink-0 flex items-center justify-between h-16 bg-slate-900 border-b border-slate-800 px-4 lg:px-8">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="hidden sm:block text-slate-300 text-sm font-medium">
            පොල් සහ ලෙලි ව්‍යාපාර කළමනාකරණ පද්ධතිය / Coconut & Husk Management
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-slate-400">වත්මන් වේලාව / System Time</p>
              <p className="text-sm font-semibold text-emerald-400 font-mono">{dateTimeStr || 'Loading...'}</p>
            </div>
          </div>
        </header>

        {/* Dynamic page outlet */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-slate-950 text-slate-100">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
