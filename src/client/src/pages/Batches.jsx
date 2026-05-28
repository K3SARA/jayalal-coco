import React, { useState, useEffect } from 'react';
import api from '../api';
import { 
  Layers, 
  PlusCircle, 
  Search, 
  FileText, 
  CheckCircle, 
  X, 
  Lock,
  Unlock,
  TrendingUp,
  TrendingDown,
  DollarSign
} from 'lucide-react';

export default function Batches() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filter state
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [activeSummary, setActiveSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    batchNumber: '',
    batchType: 'COCONUT',
    name: '',
    startDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterType !== 'ALL') params.type = filterType;
      if (filterStatus !== 'ALL') params.status = filterStatus;
      
      const response = await api.get('/batches', { params });
      
      // Client-side search filter
      const list = response.data.filter(b => 
        b.batchNumber.toLowerCase().includes(search.toLowerCase()) ||
        b.name.toLowerCase().includes(search.toLowerCase())
      );

      setBatches(list);
    } catch (err) {
      setError('ගොඩවල් විස්තර ලබා ගැනීමට නොහැක. (Failed to load batches)');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, [filterType, filterStatus, search]);

  const handleOpenAddModal = () => {
    // Auto-generate batch number based on timestamp & type
    const prefix = formData.batchType === 'COCONUT' ? 'COCO' : 'HUSK';
    const num = `B-${new Date().getFullYear()}-${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
    
    setFormData({
      batchNumber: num,
      batchType: formData.batchType,
      name: '',
      startDate: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setShowAddModal(true);
  };

  // Re-generate batch number if batchType changes
  const handleTypeChange = (type) => {
    const prefix = type === 'COCONUT' ? 'COCO' : 'HUSK';
    const num = `B-${new Date().getFullYear()}-${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
    setFormData({
      ...formData,
      batchType: type,
      batchNumber: num
    });
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await api.post('/batches', formData);
      setShowAddModal(false);
      fetchBatches();
    } catch (err) {
      setError(err.response?.data?.error || 'ගොඩ ඇතුලත් කිරීමට නොහැකි විය. (Failed to create batch)');
    }
  };

  const handleCloseBatch = async (id) => {
    if (!window.confirm('මෙම ගොඩවල් වසා දැමීමට ඔබට ස්ථිරද? (Are you sure you want to close this batch? No more entries can be added.)')) return;

    try {
      await api.post(`/batches/${id}/close`);
      fetchBatches();
    } catch (err) {
      setError('ගොඩ වසා දැමීමට නොහැකි විය. (Failed to close batch)');
    }
  };

  const handleViewSummary = async (id) => {
    try {
      setSummaryLoading(true);
      setShowSummaryModal(true);
      const res = await api.get(`/batches/${id}/summary`);
      setActiveSummary(res.data);
    } catch (err) {
      setError('ගොඩේ වාර්තාව ලබා ගැනීමට නොහැකි විය. (Failed to load batch summary)');
      setShowSummaryModal(false);
    } finally {
      setSummaryLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('si-LK', {
      style: 'currency',
      currency: 'LKR'
    }).format(amount || 0);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-white">කාණ්ඩ කළමනාකරණය / Batch Lots</h1>
          <p className="text-slate-400 text-sm mt-1">පොල් සහ ලෙලි තොග ගොඩවල් කළමනාකරණය / Manage weighbridge & kiln batches</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-3 rounded-xl font-semibold text-sm shadow-lg shadow-emerald-500/10 self-start sm:self-center"
        >
          <PlusCircle className="h-5 w-5" />
          නව ගොඩක් / New Batch
        </button>
      </div>

      {error && (
        <div className="bg-rose-950/40 border border-rose-800 p-4 rounded-xl text-rose-200 text-sm">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between shadow">
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
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition"
          />
        </div>

        {/* Filters Select */}
        <div className="flex flex-wrap gap-4 w-full md:w-auto">
          {/* Type Filter */}
          <div className="flex-1 md:flex-none">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Types / සියලුම වර්ග</option>
              <option value="COCONUT">Coconut / පොල්</option>
              <option value="COCO_HUSK">Coco Husk / ලෙලි</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex-1 md:flex-none">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Status / සියලු තත්ත්වයන්</option>
              <option value="ACTIVE">Active / සක්‍රීය</option>
              <option value="CLOSED">Closed / වසා දැමූ</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid view */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      ) : batches.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 p-12 text-center rounded-2xl">
          <Layers className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">කිසිදු කාණ්ඩයක් හමු නොවීය. (No batches found)</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {batches.map((b) => (
            <div key={b.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-xl hover:border-slate-700 transition duration-150">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    b.batchType === 'COCONUT' ? 'bg-emerald-950 text-emerald-400' : 'bg-cyan-950 text-cyan-400'
                  }`}>
                    {b.batchType}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    b.status === 'ACTIVE' ? 'bg-sky-950 text-sky-400' : 'bg-slate-850 text-slate-500'
                  }`}>
                    {b.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">{b.name}</h3>
                  <p className="text-xs text-slate-500 font-mono mt-1">Number: {b.batchNumber}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 pt-2 border-t border-slate-850">
                  <div>
                    <span className="block text-slate-500">Start Date</span>
                    <span className="font-semibold">{new Date(b.startDate).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500">End Date</span>
                    <span className="font-semibold">{b.endDate ? new Date(b.endDate).toLocaleDateString() : '-'}</span>
                  </div>
                </div>

                {b.notes && (
                  <p className="text-xs text-slate-400 bg-slate-950/40 p-2.5 rounded-lg border border-slate-850 line-clamp-2">
                    {b.notes}
                  </p>
                )}
              </div>

              <div className="flex gap-2 mt-6 pt-4 border-t border-slate-850">
                <button
                  onClick={() => handleViewSummary(b.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-slate-950 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition"
                >
                  <FileText className="h-4 w-4" />
                  වාර්තාව / Summary
                </button>
                {b.status === 'ACTIVE' && (
                  <button
                    onClick={() => handleCloseBatch(b.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold border border-rose-500/20 transition"
                  >
                    <Lock className="h-4 w-4" />
                    වසා දමන්න / Close
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Batch Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-850 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
              <h2 className="text-lg font-bold font-display text-white flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-emerald-400" />
                නව කාණ්ඩයක් ඇතුලත් කිරීම / Add Batch Lot
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">කාණ්ඩ වර්ගය / Batch Type *</label>
                <select
                  value={formData.batchType}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none text-sm text-white"
                >
                  <option value="COCONUT">Coconut / පොල්</option>
                  <option value="COCO_HUSK">Coco Husk / ලෙලි</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">කාණ්ඩ අංකය / Batch Number (Unique) *</label>
                <input
                  type="text"
                  required
                  value={formData.batchNumber}
                  onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none text-sm text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">කාණ්ඩයේ නම / Batch Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none text-sm text-white"
                  placeholder="Coconut Yala Season Lot A"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">ආරම්භක දිනය / Start Date *</label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">සටහන් / Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none text-sm text-white h-20 resize-none"
                  placeholder="Batch description..."
                />
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 border border-slate-800 text-slate-300 font-semibold rounded-xl text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-xl text-sm transition"
                >
                  Save Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Summary Report Modal */}
      {showSummaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-850 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 text-slate-100">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
              <h2 className="text-lg font-bold font-display flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-400" />
                කාණ්ඩ වාර්තාව / Batch Lot Summary Report
              </h2>
              <button onClick={() => setShowSummaryModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {summaryLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
              </div>
            ) : !activeSummary ? (
              <div className="p-6 text-center text-slate-400 text-sm">
                වාර්තාව ලබා ගැනීමට නොහැකි විය. (No details loaded)
              </div>
            ) : (
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">{activeSummary.batch.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 font-mono">Lot Number: {activeSummary.batch.batchNumber}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl">
                    <span className="block text-xs text-slate-500">Total Entries count / ඇතුලත් කිරීම්</span>
                    <span className="text-xl font-bold text-white mt-1 block">{activeSummary.summary.totalEntries}</span>
                  </div>

                  <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl">
                    <span className="block text-xs text-slate-500">Total Weight / මුළු බර</span>
                    <span className="text-xl font-bold text-white mt-1 block font-mono">
                      {activeSummary.summary.totalWeight.toLocaleString()} kg
                    </span>
                  </div>
                </div>

                <div className="space-y-3 bg-slate-950/40 p-4 rounded-xl border border-slate-850 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Expected Income / බලාපොරොත්තු ආදායම:</span>
                    <span className="font-semibold font-mono text-white">
                      {formatCurrency(activeSummary.summary.expectedIncome)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Received Income / ලැබුණු ආදායම:</span>
                    <span className="font-semibold font-mono text-emerald-400">
                      {formatCurrency(activeSummary.summary.receivedIncome)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-850 pt-2">
                    <span className="text-slate-400">Total Batch Expenses / මුළු වියදම්:</span>
                    <span className="font-semibold font-mono text-rose-400">
                      {formatCurrency(activeSummary.summary.totalExpenses)}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 pl-4 space-y-1">
                    <div className="flex justify-between">
                      <span>• Direct Batch Expenses (standalone):</span>
                      <span>{formatCurrency(activeSummary.summary.directExpenses)}</span>
                    </div>
                    {activeSummary.batch.batchType === 'COCO_HUSK' ? (
                      <div className="flex justify-between">
                        <span>• Husk purchase + processing costs:</span>
                        <span>{formatCurrency(activeSummary.summary.totalExpenses - activeSummary.summary.directExpenses)}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between">
                        <span>• Coconut raw weighbridge cost:</span>
                        <span>{formatCurrency(activeSummary.summary.totalExpenses - activeSummary.summary.directExpenses)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className={`p-4 rounded-xl flex items-center justify-between border ${
                  activeSummary.summary.profitLoss >= 0 
                    ? 'bg-emerald-950/30 border-emerald-800 text-emerald-400' 
                    : 'bg-rose-950/30 border-rose-800 text-rose-400'
                }`}>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    <span className="font-semibold text-sm">කාණ්ඩයේ ශුද්ධ ලාභය (පාඩුව) / Net Profit (Loss):</span>
                  </div>
                  <span className="text-lg font-bold font-mono">
                    {formatCurrency(activeSummary.summary.profitLoss)}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-800 text-center">
                  <button
                    onClick={() => setShowSummaryModal(false)}
                    className="px-6 py-2.5 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs transition"
                  >
                    Close Summary
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
