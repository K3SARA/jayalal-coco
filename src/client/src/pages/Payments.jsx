import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { 
  CalendarClock, 
  Search, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  HelpCircle,
  Eye,
  Layers,
  Sparkles
} from 'lucide-react';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const navigate = useNavigate();

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports/payments');
      setPayments(res.data);
    } catch (err) {
      setError('ගෙවීම් දිනසූචිය පැටවීමට නොහැකි විය. (Failed to load 21-day payment timeline)');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('si-LK', {
      style: 'currency',
      currency: 'LKR'
    }).format(amount || 0);
  };

  // Client-side search and filters
  const filteredPayments = payments.filter(p => {
    const matchesSearch = 
      p.batchNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'ALL' ? true : p.batchType === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-3xl font-bold font-display text-white">21-දිනය ගෙවීම් පුවරුව / 21-Day Payments</h1>
        <p className="text-slate-400 text-sm mt-1">තොග ගොඩවල් සඳහා ගෙවීම් අපේක්ෂිත කාලසීමාවන් ලේඛනය / Track lot settlements timelines</p>
      </div>

      {error && (
        <div className="bg-rose-950/40 border border-rose-800 p-4 rounded-xl text-rose-200 text-sm">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center justify-between shadow">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">පොරොත්තු ගොඩවල් / Pending Lots</p>
            <p className="text-3xl font-bold text-white mt-2">
              {payments.filter(p => p.daysRemaining > 0 && p.outstandingBalance > 0).length}
            </p>
            <p className="text-xs text-slate-500 mt-1">Within 21-day timeline</p>
          </div>
          <div className="bg-emerald-950 text-emerald-400 p-4 rounded-xl">
            <Clock className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center justify-between shadow border-l-4 border-l-rose-500">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">කල් ඉකුත් වූ ගොඩවල් / Overdue Lots</p>
            <p className="text-3xl font-bold text-rose-450 mt-2">
              {payments.filter(p => p.daysRemaining <= 0 && p.outstandingBalance > 0).length}
            </p>
            <p className="text-xs text-slate-500 mt-1">Exceeded 21 days</p>
          </div>
          <div className="bg-rose-950 text-rose-400 p-4 rounded-xl">
            <AlertCircle className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center justify-between shadow">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">පොරොත්තු මුළු මුදල / Outstanding Balance</p>
            <p className="text-2xl font-bold text-amber-400 mt-2">
              {formatCurrency(payments.reduce((s, p) => s + p.outstandingBalance, 0))}
            </p>
            <p className="text-xs text-slate-500 mt-1">Sum of unpaid batch balances</p>
          </div>
          <div className="bg-amber-950 text-amber-400 p-4 rounded-xl">
            <CalendarClock className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Filter panel */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="h-5 w-5" />
          </div>
          <input
            type="text"
            placeholder="සොයන්න (අංකය / නම)... Search batches..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition"
          />
        </div>

        {/* Filter select */}
        <div className="flex gap-2 w-full md:w-auto">
          {['ALL', 'COCONUT', 'COCO_HUSK'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`flex-1 md:flex-none px-4 py-2 text-xs font-semibold rounded-xl border transition ${
                filterType === type
                  ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {type === 'ALL' && 'සියල්ල / All'}
              {type === 'COCONUT' && 'පොල් / Coconut'}
              {type === 'COCO_HUSK' && 'ලෙලි / Coco Husk'}
            </button>
          ))}
        </div>
      </div>

      {/* Board List */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 p-12 text-center rounded-2xl">
          <CalendarClock className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">කිසිදු සක්‍රීය ගෙවීමක් නැත. (No pending batch timelines found)</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Mobile Card List */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredPayments.map((p) => {
              const isOverdue = p.daysRemaining <= 0;
              const absDays = Math.abs(p.daysRemaining);
              return (
                <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div>
                      <span className="font-semibold text-white text-base">{p.name}</span>
                      <span className="block text-xs text-slate-500 font-mono">No: {p.batchNumber}</span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      p.outstandingBalance <= 0
                        ? 'bg-slate-800 text-slate-400'
                        : isOverdue 
                          ? 'bg-rose-950 text-rose-455' 
                          : 'bg-emerald-950 text-emerald-400'
                    }`}>
                      {p.outstandingBalance <= 0 ? 'SETTLED' : isOverdue ? 'OVERDUE' : 'PENDING'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="block text-slate-500 font-semibold uppercase tracking-wider text-[9px]">Timeline Remaining</span>
                      <div className="mt-0.5">
                        {p.outstandingBalance <= 0 ? (
                          <span className="text-slate-500 flex items-center gap-1 font-semibold text-[11px]">
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> Settled
                          </span>
                        ) : isOverdue ? (
                          <span className="text-rose-400 font-bold flex items-center gap-1 text-[11px] animate-pulse">
                            <AlertCircle className="h-3.5 w-3.5" /> Overdue by {absDays}d
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
                            <Clock className="h-3.5 w-3.5 text-slate-500" /> {absDays}d left
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block text-slate-500 font-semibold uppercase tracking-wider text-[9px]">Type</span>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        p.batchType === 'COCONUT' ? 'bg-emerald-950 text-emerald-400' : 'bg-cyan-950 text-cyan-400'
                      }`}>
                        {p.batchType}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800/60 font-mono">
                    <div>
                      <span className="block text-slate-500 font-semibold uppercase tracking-wider text-[9px] font-sans">Start / Deadline</span>
                      <span className="block text-slate-300 text-[11px]">{new Date(p.startDate).toLocaleDateString()}</span>
                      <span className="block text-slate-500 text-[10px]">{new Date(p.deadlineDate).toLocaleDateString()}</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-slate-500 font-semibold uppercase tracking-wider text-[9px] font-sans">Outstanding</span>
                      <span className="block text-white text-[11px] font-bold">{formatCurrency(p.totalCostOrIncome)} (Est)</span>
                      <span className={`block text-[11px] font-bold ${p.outstandingBalance > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                        Bal: {formatCurrency(p.outstandingBalance)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex justify-end">
                    <button
                      onClick={() => navigate('/batches')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-sky-400 hover:text-white rounded-lg text-xs font-semibold transition"
                    >
                      <Eye className="h-4 w-4" />
                      Inspect Batch
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800 text-left">
                <thead className="bg-slate-950">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Batch Description</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Start Date</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">21-Day Deadline</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Timeline Remaining</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Estimated Total</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Outstanding</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900 text-slate-300">
                  {filteredPayments.map((p) => {
                    const isOverdue = p.daysRemaining <= 0;
                    const absDays = Math.abs(p.daysRemaining);
                    return (
                      <tr key={p.id} className="hover:bg-slate-850 transition">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-semibold text-white">{p.name}</div>
                          <div className="text-xs text-slate-500 font-mono">No: {p.batchNumber}</div>
                          <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            p.batchType === 'COCONUT' ? 'bg-emerald-950 text-emerald-400' : 'bg-cyan-950 text-cyan-400'
                          }`}>
                            {p.batchType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                          {new Date(p.startDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                          {new Date(p.deadlineDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {p.outstandingBalance <= 0 ? (
                            <span className="text-slate-500 flex items-center gap-1.5 font-semibold">
                              <CheckCircle className="h-4.5 w-4.5 text-emerald-500" /> Settled
                            </span>
                          ) : isOverdue ? (
                            <span className="text-rose-400 font-bold flex items-center gap-1.5 animate-pulse">
                              <AlertCircle className="h-4.5 w-4.5" /> Overdue by {absDays} days
                            </span>
                          ) : (
                            <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                              <Clock className="h-4.5 w-4.5 text-slate-500" /> {absDays} days left
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold font-mono text-white">
                          {formatCurrency(p.totalCostOrIncome)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold font-mono">
                          <span className={p.outstandingBalance > 0 ? 'text-amber-400' : 'text-slate-500'}>
                            {formatCurrency(p.outstandingBalance)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            p.outstandingBalance <= 0
                              ? 'bg-slate-800 text-slate-400'
                              : isOverdue 
                                ? 'bg-rose-950 text-rose-455' 
                                : 'bg-emerald-950 text-emerald-400'
                          }`}>
                            {p.outstandingBalance <= 0 ? 'SETTLED' : isOverdue ? 'OVERDUE / පමාවූ' : 'PENDING / පොරොත්තු'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => navigate('/batches')}
                            className="p-2 bg-slate-950 text-sky-400 hover:bg-sky-950 hover:text-white rounded-lg transition"
                            title="View Batch"
                          >
                            <Eye className="h-4.5 w-4.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
