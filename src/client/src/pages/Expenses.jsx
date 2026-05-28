import React, { useState, useEffect } from 'react';
import api from '../api';
import { 
  CircleDollarSign, 
  Search, 
  PlusCircle, 
  Edit, 
  Trash, 
  X, 
  Tag, 
  Calendar,
  Layers
} from 'lucide-react';

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filter state
  const [search, setSearch] = useState('');
  const [filterBatch, setFilterBatch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    category: 'WAGES',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    paidTo: '',
    batchId: ''
  });

  const categories = [
    { value: 'FUEL', label: 'Fuel / ඉන්ධන' },
    { value: 'KILN_PROCESSING', label: 'Kiln Processing / පෝරණුව සකස්කිරීම්' },
    { value: 'BATCH_RAW_MATERIAL', label: 'Raw Materials / අමුද්‍රව්‍ය' },
    { value: 'WAGES', label: 'Wages / වැටුප්' },
    { value: 'REPAIRS', label: 'Repairs & Maintenance / අලුත්වැඩියාවන්' },
    { value: 'TRANSPORT', label: 'Transport / ප්‍රවාහන වියදම්' },
    { value: 'MISCELLANEOUS', label: 'Miscellaneous / වෙනත්' }
  ];

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const resExp = await api.get('/expenses');
      setExpenses(resExp.data);

      const resBatches = await api.get('/batches');
      setBatches(resBatches.data);
    } catch (err) {
      setError('වියදම් දත්ත ලබා ගැනීමට නොහැක. (Failed to load expenses data)');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleOpenAddModal = () => {
    setEditingExpense(null);
    setFormData({
      category: 'WAGES',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      paidTo: '',
      batchId: ''
    });
    setShowAddModal(true);
  };

  const handleOpenEditModal = (e) => {
    setEditingExpense(e);
    setFormData({
      category: e.category,
      amount: e.amount.toString(),
      date: new Date(e.date).toISOString().split('T')[0],
      description: e.description || '',
      paidTo: e.paidTo || '',
      batchId: e.batchId ? e.batchId.toString() : ''
    });
    setShowAddModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (parseFloat(formData.amount) <= 0) {
      setError('වලංගු වියදම් මුදලක් ඇතුලත් කරන්න. (Valid expense amount required)');
      return;
    }

    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
        batchId: formData.batchId ? parseInt(formData.batchId) : null
      };

      if (editingExpense) {
        await api.put(`/expenses/${editingExpense.id}`, payload);
      } else {
        await api.post('/expenses', payload);
      }
      setShowAddModal(false);
      fetchExpenses();
    } catch (err) {
      setError(err.response?.data?.error || 'සුරැකීමට නොහැකි විය. (Failed to save expense)');
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('මෙම වියදම් වාර්තාව මකා දැමීමට ඔබට ස්ථිරද? (Are you sure you want to delete this expense log?)')) return;

    try {
      await api.delete(`/expenses/${id}`);
      fetchExpenses();
    } catch (err) {
      setError('වියදම මකා දැමීමට නොහැකි විය. (Delete failed)');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('si-LK', {
      style: 'currency',
      currency: 'LKR'
    }).format(amount || 0);
  };

  // Client-side search and filters
  const filteredExpenses = expenses.filter(e => {
    const matchesSearch = 
      e.description?.toLowerCase().includes(search.toLowerCase()) ||
      (e.paidTo && e.paidTo.toLowerCase().includes(search.toLowerCase()));
    const matchesBatch = filterBatch ? e.batchId === parseInt(filterBatch) : true;
    const matchesCategory = filterCategory ? e.category === filterCategory : true;
    return matchesSearch && matchesBatch && matchesCategory;
  });

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-white">වියදම් කළමනාකරණය / Operation Expenses</h1>
          <p className="text-slate-400 text-sm mt-1">ආයතනයේ දෛනික මෙහෙයුම් වියදම් සටහන / Daily business expenditure logs</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-3 rounded-xl font-semibold text-sm shadow-lg shadow-emerald-500/10 self-start sm:self-center"
        >
          <PlusCircle className="h-5 w-5" />
          වියදමක් එක් කරන්න / Record Expense
        </button>
      </div>

      {error && (
        <div className="bg-rose-950/40 border border-rose-800 p-4 rounded-xl text-rose-200 text-sm">
          {error}
        </div>
      )}

      {/* Top Cost Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center justify-between shadow border-l-4 border-l-rose-500">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">මුළු පද්ධති වියදම් / Total System Expenses</p>
            <p className="text-3xl font-bold text-rose-400 mt-2 font-mono">
              {formatCurrency(expenses.reduce((s, e) => s + e.amount, 0))}
            </p>
            <p className="text-xs text-slate-500 mt-1">Total recorded costs in DB</p>
          </div>
          <div className="bg-rose-950 text-rose-455 p-4 rounded-xl">
            <CircleDollarSign className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center justify-between shadow">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">කාණ්ඩගත වියදම් / Batch Allocated Costs</p>
            <p className="text-3xl font-bold text-white mt-2 font-mono">
              {formatCurrency(expenses.filter(e => e.batchId).reduce((s, e) => s + e.amount, 0))}
            </p>
            <p className="text-xs text-slate-500 mt-1">Linked directly to coconut/husk lots</p>
          </div>
          <div className="bg-slate-950 text-slate-400 p-4 rounded-xl">
            <Layers className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between shadow">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="h-5 w-5" />
          </div>
          <input
            type="text"
            placeholder="සොයන්න (විස්තරය / ගෙවූ පාර්ශවය)... Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition"
          />
        </div>

        {/* Filters options */}
        <div className="flex flex-wrap gap-4 w-full md:w-auto font-sans">
          {/* Categories */}
          <div className="flex-1 md:flex-none">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Categories / සියලු වර්ග</option>
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          {/* Batches selector */}
          <div className="flex-1 md:flex-none">
            <select
              value={filterBatch}
              onChange={(e) => setFilterBatch(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Batches / සියලුම ගොඩවල්</option>
              {batches.map(b => (
                <option key={b.id} value={b.id}>{b.batchNumber} - {b.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      ) : filteredExpenses.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 p-12 text-center rounded-2xl">
          <CircleDollarSign className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">කිසිදු වියදමක් හමු නොවීය. (No expenses found)</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Mobile Card List */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredExpenses.map((exp) => (
              <div key={exp.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div>
                    <span className="font-semibold text-white text-base">{exp.paidTo || 'General'}</span>
                    <span className="block text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Calendar className="h-3 w-3" />
                      {new Date(exp.date).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="text-sm font-bold font-mono text-rose-455">
                    {formatCurrency(exp.amount)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="block text-slate-500 font-semibold uppercase tracking-wider text-[9px]">Category</span>
                    <span className="bg-slate-800 text-emerald-400 px-2 py-0.5 rounded uppercase flex items-center gap-1.5 w-fit mt-0.5 text-[10px]">
                      <Tag className="h-3 w-3" />
                      {categories.find(c => c.value === exp.category)?.label || exp.category}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block text-slate-500 font-semibold uppercase tracking-wider text-[9px]">Linked Batch</span>
                    <span className="block text-xs font-mono font-bold text-slate-300 mt-0.5">
                      {exp.batch ? (
                        <span className="text-cyan-400">
                          {exp.batch.batchNumber}
                        </span>
                      ) : (
                        <span className="text-slate-500">General (None)</span>
                      )}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-300 font-medium pt-1">
                  {exp.description || '-'}
                </div>

                <div className="pt-2 border-t border-slate-800 flex justify-end gap-2">
                  <button
                    onClick={() => handleOpenEditModal(exp)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-sky-400 hover:text-white rounded-lg text-xs font-semibold transition"
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteExpense(exp.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-rose-400 hover:text-white rounded-lg text-xs font-semibold transition"
                    title="Delete"
                  >
                    <Trash className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800 text-left">
                <thead className="bg-slate-950">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Date / Paid To</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Linked Batch</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900 text-slate-300">
                  {filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-850 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-white">{exp.paidTo || 'N/A'}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3 w-3" />
                          {new Date(exp.date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold">
                        <span className="bg-slate-800 text-emerald-400 px-2 py-0.5 rounded uppercase flex items-center gap-1.5 w-fit">
                          <Tag className="h-3 w-3" />
                          {categories.find(c => c.value === exp.category)?.label || exp.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        {exp.description || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-mono font-bold text-slate-400">
                        {exp.batch ? (
                          <span className="text-cyan-400">
                            {exp.batch.batchNumber}
                          </span>
                        ) : (
                          <span className="text-slate-600">General (None)</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold font-mono text-rose-455">
                        {formatCurrency(exp.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(exp)}
                            className="p-2 bg-slate-950 text-sky-400 hover:bg-sky-950 hover:text-white rounded-lg transition"
                            title="Edit"
                          >
                            <Edit className="h-4.5 w-4.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(exp.id)}
                            className="p-2 bg-slate-950 text-rose-400 hover:bg-rose-950 hover:text-white rounded-lg transition"
                            title="Delete"
                          >
                            <Trash className="h-4.5 w-4.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 text-slate-100 overflow-y-auto">
          <div className="w-full max-w-md bg-slate-900 border border-slate-850 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800 flex-shrink-0">
              <h2 className="text-lg font-bold font-display flex items-center gap-2">
                <CircleDollarSign className="h-5 w-5 text-emerald-400" />
                {editingExpense ? 'වියදම් සංස්කරණය / Edit Expense Log' : 'නව වියදම් සටහනක් ඇතුලත් කිරීම / Add Expense Log'}
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 font-sans overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">වියදම් වර්ගය / Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none text-sm text-white"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">දිනය / Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">වියදම (LKR) *</label>
                  <input
                    type="number"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none text-sm text-white font-mono"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">ගෙවූ පාර්ශවය / Paid To (Name)</label>
                <input
                  type="text"
                  value={formData.paidTo}
                  onChange={(e) => setFormData({ ...formData, paidTo: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none text-sm text-white"
                  placeholder="Employee, shop owner..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">අදාළ කාණ්ඩය / Link Batch (Optional)</label>
                <select
                  value={formData.batchId}
                  onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none text-sm text-white"
                >
                  <option value="">Not linked (General system expense)</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>{b.batchNumber} - {b.name} ({b.batchType})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">වියදම් විස්තරය / Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none text-sm text-white h-20 resize-none"
                  placeholder="Repair parts, fuel liters, wages for packaging..."
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
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
