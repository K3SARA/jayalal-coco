import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { 
  TrendingUp, 
  TrendingDown, 
  CircleDollarSign, 
  Layers, 
  FileText, 
  UserPlus, 
  CalendarClock, 
  Sliders, 
  DollarSign, 
  Scale 
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/reports/dashboard');
        setStats(response.data);
      } catch (err) {
        setError('තොරතුරු ලබා ගැනීමට නොහැක. (Failed to load dashboard stats)');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('si-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const quickButtons = [
    { label: 'පොල් එකතු කරන්න / Add Coconut', path: '/coconut?add=true', icon: Scale, color: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950' },
    { label: 'ලෙලි එකතු කරන්න / Add Husk', path: '/husk?add=true', icon: Layers, color: 'bg-cyan-500 hover:bg-cyan-400 text-slate-950' },
    { label: 'නව ගනුදෙනුකරු / Add Customer', path: '/customers?add=true', icon: UserPlus, color: 'bg-purple-500 hover:bg-purple-400 text-slate-950' },

    { label: 'පොරොත්තු ගෙවීම් / Pending Payments', path: '/payments', icon: CalendarClock, color: 'bg-amber-500 hover:bg-amber-400 text-slate-950' },
    { label: 'රිසිට් සැකසුම් / Print Settings', path: '/settings/receipt', icon: Sliders, color: 'bg-slate-700 hover:bg-slate-600 text-white' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const isLoss = stats?.totalProfitLoss < 0;

  return (
    <div className="space-y-8 font-sans">
      <div>
        <h1 className="text-3xl font-bold font-display text-white">පාලන පුවරුව / Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">ආයතනයේ දෛනික ව්‍යාපාරික තත්ත්වය / Real-time business logs overview</p>
      </div>

      {error && (
        <div className="bg-rose-950/50 border border-rose-800 p-4 rounded-xl text-rose-200 text-sm">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Today's Transactions */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center justify-between shadow-lg">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">අද ගනුදෙනු / Today's Logs</p>
            <p className="text-3xl font-bold text-white mt-2">{stats?.todayTransactions || 0}</p>
            <p className="text-xs text-slate-500 mt-1">Coconut & Husk entries combined</p>
          </div>
          <div className="bg-emerald-950 text-emerald-400 p-4 rounded-xl">
            <FileText className="h-6 w-6" />
          </div>
        </div>

        {/* Active Batches */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center justify-between shadow-lg">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">සක්‍රීය ගොඩවල් / Active Batches</p>
            <p className="text-3xl font-bold text-white mt-2">
              {stats?.activeCocoBatches + stats?.activeHuskBatches || 0}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              පොල්: {stats?.activeCocoBatches || 0} | ලෙලි: {stats?.activeHuskBatches || 0}
            </p>
          </div>
          <div className="bg-sky-950 text-sky-400 p-4 rounded-xl">
            <Layers className="h-6 w-6" />
          </div>
        </div>

        {/* Pending 21-Day Payments */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center justify-between shadow-lg">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">ලැබීමට ඇති 21-දිනය / 21-Day Pending</p>
            <p className="text-2xl font-bold text-amber-400 mt-2">{formatCurrency(stats?.pendingPaymentsAmount)}</p>
            <p className="text-xs text-slate-500 mt-1">ගොඩවල් ගණන / Batches count: {stats?.pendingPaymentsCount || 0}</p>
          </div>
          <div className="bg-amber-950 text-amber-400 p-4 rounded-xl">
            <CalendarClock className="h-6 w-6" />
          </div>
        </div>

        {/* Total Profit/Loss */}
        <div className={`bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center justify-between shadow-lg border-l-4 ${isLoss ? 'border-l-rose-500' : 'border-l-emerald-500'}`}>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">ඇස්තමේන්තුගත ලාභය / Profit (Loss)</p>
            <p className={`text-2xl font-bold mt-2 ${isLoss ? 'text-rose-400' : 'text-emerald-400'}`}>
              {formatCurrency(stats?.totalProfitLoss)}
            </p>
            <p className="text-xs text-slate-500 mt-1">Expected Revenue - Expenses</p>
          </div>
          <div className={`p-4 rounded-xl ${isLoss ? 'bg-rose-950 text-rose-400' : 'bg-emerald-950 text-emerald-400'}`}>
            {isLoss ? <TrendingDown className="h-6 w-6" /> : <TrendingUp className="h-6 w-6" />}
          </div>
        </div>
      </div>

      {/* Accounting Net Position Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-lg font-bold text-white mb-4">මූල්‍ය තත්ත්වය / Financial Position</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl">
            <p className="text-xs font-medium text-slate-400">ලැබීමට ඇති මුළු මුදල / Total Receivables (Customers)</p>
            <p className="text-2xl font-bold text-emerald-400 mt-2 font-mono">{formatCurrency(stats?.totalReceivable)}</p>
            <p className="text-xs text-slate-500 mt-1">Outstanding customer balances</p>
          </div>

          <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl">
            <p className="text-xs font-medium text-slate-400">ගෙවීමට ඇති මුළු මුදල / Total Payables (Suppliers)</p>
            <p className="text-2xl font-bold text-rose-400 mt-2 font-mono">{formatCurrency(stats?.totalPayable)}</p>
            <p className="text-xs text-slate-500 mt-1">Outstanding supplier balances</p>
          </div>

          <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl">
            <p className="text-xs font-medium text-slate-400">ශුද්ධ මූල්‍ය තත්ත්වය / Net Position</p>
            <p className={`text-2xl font-bold mt-2 font-mono ${stats?.netPosition >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(stats?.netPosition)}
            </p>
            <p className="text-xs text-slate-500 mt-1">Receivables minus Payables</p>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-lg font-bold text-white mb-4">කඩිනම් බොත්තම් / Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {quickButtons.map((btn) => {
            const Icon = btn.icon;
            return (
              <button
                key={btn.label}
                onClick={() => navigate(btn.path)}
                className={`flex flex-col items-center justify-center p-4 rounded-xl transition duration-150 gap-2 shadow font-semibold text-xs text-center ${btn.color}`}
              >
                <Icon className="h-6 w-6" />
                <span>{btn.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
