import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';
import { 
  Users, 
  Search, 
  UserPlus, 
  Edit, 
  Trash, 
  Eye, 
  UserCheck, 
  UserX,
  X,
  Building
} from 'lucide-react';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filter state
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    type: 'CUSTOMER',
    openingBalance: '0',
    notes: '',
    isActive: true
  });

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // If redirected with add=true, open add modal
  useEffect(() => {
    if (searchParams.get('add') === 'true') {
      setShowModal(true);
    }
  }, [searchParams]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/customers', {
        params: { search, type: filterType }
      });
      setCustomers(response.data);
    } catch (err) {
      setError('ගනුදෙනුකරුවන් පැටවීමට නොහැක. (Failed to load customers)');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 300); // Debounce search
    return () => clearTimeout(timer);
  }, [search, filterType]);

  const handleOpenAddModal = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      phone: '',
      address: '',
      type: 'CUSTOMER',
      openingBalance: '0',
      notes: '',
      isActive: true
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (c) => {
    setEditingCustomer(c);
    setFormData({
      name: c.name,
      phone: c.phone || '',
      address: c.address || '',
      type: c.type,
      openingBalance: c.openingBalance.toString(),
      notes: c.notes || '',
      isActive: c.isActive
    });
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.type) {
      setError('නම සහ වර්ගය අනිවාර්ය වේ. (Name and Type required)');
      return;
    }

    try {
      if (editingCustomer) {
        // Edit API
        await api.put(`/customers/${editingCustomer.id}`, {
          ...formData,
          openingBalance: parseFloat(formData.openingBalance) || 0
        });
      } else {
        // Add API
        await api.post('/customers', {
          ...formData,
          openingBalance: parseFloat(formData.openingBalance) || 0
        });
      }
      setShowModal(false);
      fetchCustomers();
    } catch (err) {
      setError(err.response?.data?.error || 'සුරැකීමට නොහැක. (Save failed)');
    }
  };

  const handleToggleActive = async (c) => {
    try {
      await api.put(`/customers/${c.id}`, {
        ...c,
        isActive: !c.isActive
      });
      fetchCustomers();
    } catch (err) {
      setError('තත්ත්වය වෙනස් කිරීමට නොහැකි විය. (Failed to change active status)');
    }
  };

  const handleDeleteCustomer = async (id) => {
    if (!window.confirm('මෙම ගනුදෙනුකරුවා සහ සියලුම ගිණුම් වාර්තා මකා දැමීමට ඔබට ස්ථිරද? (Are you sure you want to delete this customer and all ledger data?)')) return;

    try {
      await api.delete(`/customers/${id}`);
      fetchCustomers();
    } catch (err) {
      setError('ගනුදෙනුකරු මකා දැමීමට නොහැකි විය. (Delete failed)');
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
          <h1 className="text-3xl font-bold font-display text-white">ගනුදෙනුකරුවන් සහ සපයන්නන් / Customers & Suppliers</h1>
          <p className="text-slate-400 text-sm mt-1">ආයතනයේ ගිණුම් ලේඛනය / Ledger accounts directory</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-3 rounded-xl font-semibold text-sm shadow-lg shadow-emerald-500/10 self-start sm:self-center"
        >
          <UserPlus className="h-5 w-5" />
          එක් කරන්න / Add Account
        </button>
      </div>

      {error && (
        <div className="bg-rose-950/40 border border-rose-800 p-4 rounded-xl text-rose-200 text-sm">
          {error}
        </div>
      )}

      {/* Filter panel */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="h-5 w-5" />
          </div>
          <input
            type="text"
            placeholder="සොයන්න (නම / දුරකථනය)... Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition"
          />
        </div>

        {/* Type Filter */}
        <div className="flex gap-2 w-full md:w-auto">
          {['ALL', 'CUSTOMER', 'SUPPLIER', 'BOTH'].map((type) => (
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
              {type === 'CUSTOMER' && 'ගනුදෙනුකරුවන් / Customers'}
              {type === 'SUPPLIER' && 'සපයන්නන් / Suppliers'}
              {type === 'BOTH' && 'දෙකම / Both'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      ) : customers.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 p-12 text-center rounded-2xl">
          <Users className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">කිසිදු ගනුදෙනුකරුවකු හමු නොවීය. (No accounts found)</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Mobile Card List */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {customers.map((c) => {
              const balanceVal = c.currentBalance;
              return (
                <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div>
                      <span className="font-semibold text-white text-base">{c.name}</span>
                      <span className="block text-[11px] text-slate-500">{c.address || 'No Address'}</span>
                    </div>
                    <button
                      onClick={() => handleToggleActive(c)}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 ${
                        c.isActive 
                          ? 'bg-emerald-950 text-emerald-400' 
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {c.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="block text-slate-500 font-semibold uppercase tracking-wider text-[9px]">Account Type</span>
                      <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        c.type === 'CUSTOMER' 
                          ? 'bg-emerald-950 text-emerald-400' 
                          : c.type === 'SUPPLIER' 
                            ? 'bg-rose-950 text-rose-400' 
                            : 'bg-indigo-950 text-indigo-400'
                      }`}>
                        {c.type}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="block text-slate-500 font-semibold uppercase tracking-wider text-[9px]">Phone</span>
                      <span className="text-white text-sm">{c.phone || '-'}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                    <div>
                      <span className="block text-slate-500 font-semibold uppercase tracking-wider text-[9px]">Balance</span>
                      <div className="text-sm font-bold font-mono">
                        {c.type === 'CUSTOMER' && (
                          <span className={balanceVal > 0 ? 'text-emerald-400' : 'text-slate-400'}>
                            {formatCurrency(balanceVal)} <span className="text-[9px] font-normal font-sans text-slate-500">(Receivable)</span>
                          </span>
                        )}
                        {c.type === 'SUPPLIER' && (
                          <span className={balanceVal > 0 ? 'text-rose-400' : 'text-slate-400'}>
                            {formatCurrency(balanceVal)} <span className="text-[9px] font-normal font-sans text-slate-500">(Payable)</span>
                          </span>
                        )}
                        {c.type === 'BOTH' && (
                          <span className="text-indigo-400">
                            {formatCurrency(balanceVal)} <span className="text-[9px] font-normal font-sans text-slate-500">(Net)</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-1.5">
                      <button
                        onClick={() => navigate(`/customers/${c.id}`)}
                        className="p-2.5 bg-slate-950 text-emerald-400 hover:bg-emerald-950 hover:text-white rounded-lg transition"
                        title="View Ledger Statement"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(c)}
                        className="p-2.5 bg-slate-950 text-sky-400 hover:bg-sky-955 hover:text-white rounded-lg transition"
                        title="Edit Details"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCustomer(c.id)}
                        className="p-2.5 bg-slate-950 text-rose-400 hover:bg-rose-955 hover:text-white rounded-lg transition"
                        title="Delete Customer"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800">
                <thead className="bg-slate-950">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">නම / Name</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">දුරකථනය / Phone</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">වර්ගය / Type</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">ශේෂය / Balance</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">තත්ත්වය / Status</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">ක්‍රියාකාරකම් / Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900 text-slate-300">
                  {customers.map((c) => {
                    const balanceVal = c.currentBalance;
                    return (
                      <tr key={c.id} className="hover:bg-slate-850 transition duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-semibold text-white">{c.name}</div>
                          <div className="text-xs text-slate-500">{c.address || 'No Address'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {c.phone || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs">
                          <span className={`px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                            c.type === 'CUSTOMER' 
                              ? 'bg-emerald-950 text-emerald-400' 
                              : c.type === 'SUPPLIER' 
                                ? 'bg-rose-950 text-rose-400' 
                                : 'bg-indigo-950 text-indigo-400'
                          }`}>
                            {c.type === 'CUSTOMER' && 'CUSTOMER / ගැණුම්කරු'}
                            {c.type === 'SUPPLIER' && 'SUPPLIER / සපයන්නා'}
                            {c.type === 'BOTH' && 'BOTH / දෙකම'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold font-mono">
                          {c.type === 'CUSTOMER' && (
                            <span className={balanceVal > 0 ? 'text-emerald-400' : 'text-slate-400'}>
                              {formatCurrency(balanceVal)} <span className="text-[10px] block font-sans text-slate-500">ලැබීමට (Receivable)</span>
                            </span>
                          )}
                          {c.type === 'SUPPLIER' && (
                            <span className={balanceVal > 0 ? 'text-rose-400' : 'text-slate-400'}>
                              {formatCurrency(balanceVal)} <span className="text-[10px] block font-sans text-slate-500">ගෙවීමට (Payable)</span>
                            </span>
                          )}
                          {c.type === 'BOTH' && (
                            <span className="text-indigo-400">
                              {formatCurrency(balanceVal)} <span className="text-[10px] block font-sans text-slate-500">ශුද්ධ ශේෂය / Net Balance</span>
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => handleToggleActive(c)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                              c.isActive 
                                ? 'bg-emerald-950 text-emerald-400' 
                                : 'bg-slate-800 text-slate-500'
                            }`}
                            title="Toggle Status"
                          >
                            {c.isActive ? (
                              <>
                                <UserCheck className="h-3.5 w-3.5" />
                                Active
                              </>
                            ) : (
                              <>
                                <UserX className="h-3.5 w-3.5" />
                                Inactive
                              </>
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => navigate(`/customers/${c.id}`)}
                              className="p-2 bg-slate-950 text-emerald-400 hover:bg-emerald-950 hover:text-white rounded-lg transition"
                              title="View Ledger Statement"
                            >
                              <Eye className="h-4.5 w-4.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(c)}
                              className="p-2 bg-slate-950 text-sky-400 hover:bg-sky-955 hover:text-white rounded-lg transition"
                              title="Edit Details"
                            >
                              <Edit className="h-4.5 w-4.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCustomer(c.id)}
                              className="p-2 bg-slate-950 text-rose-400 hover:bg-rose-950 hover:text-white rounded-lg transition"
                              title="Delete Customer"
                            >
                              <Trash className="h-4.5 w-4.5" />
                            </button>
                          </div>
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

      {/* Account Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-slate-900 border border-slate-850 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 text-slate-100 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800 flex-shrink-0">
              <h2 className="text-lg font-bold font-display flex items-center gap-2">
                <Building className="h-5 w-5 text-emerald-400" />
                {editingCustomer ? 'ගනුදෙනුකරු සංස්කරණය / Edit Account' : 'නව ගනුදෙනුකරුවකු ඇතුලත් කිරීම / Add Account'}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">නම / Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition"
                  placeholder="Sunil Perera"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">දුරකථනය / Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition"
                    placeholder="0771234567"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">ගිණුම් වර්ගය / Account Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition text-white"
                  >
                    <option value="CUSTOMER">Customer / ගැණුම්කරු</option>
                    <option value="SUPPLIER">Supplier / සපයන්නා</option>
                    <option value="BOTH">Both / දෙකම</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">ලිපිනය / Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition"
                  placeholder="Dankotuwa"
                />
              </div>

              {!editingCustomer && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">ආරම්භක ශේෂය / Opening Balance (LKR)</label>
                  <input
                    type="number"
                    value={formData.openingBalance}
                    onChange={(e) => setFormData({ ...formData, openingBalance: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition"
                    placeholder="0"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Customer types owe us (Receivables), Suppliers we owe them (Payables).
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">සටහන් / Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition h-20 resize-none"
                  placeholder="Other details..."
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-emerald-500 h-4 w-4"
                />
                <label htmlFor="isActive" className="text-sm text-slate-300">
                  සක්‍රීය ගිණුමකි / Account is active
                </label>
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold rounded-xl text-sm transition"
                >
                  අවලංගු කරන්න / Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-xl text-sm transition"
                >
                  සුරකින්න / Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
