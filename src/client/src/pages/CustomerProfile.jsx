import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  ArrowLeft, 
  PlusCircle, 
  Printer, 
  Download,
  AlertCircle,
  X,
  PlusSquare,
  Building
} from 'lucide-react';

export default function CustomerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [totals, setTotals] = useState({});
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSide, setPaymentSide] = useState('CUSTOMER'); // CUSTOMER or SUPPLIER
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'CASH',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Adjustment Modal State
  const [showAdjModal, setShowAdjModal] = useState(false);
  const [adjSide, setAdjSide] = useState('CUSTOMER');
  const [adjForm, setAdjForm] = useState({
    amount: '',
    type: 'DEBIT', // DEBIT or CREDIT
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const resProfile = await api.get(`/reports/customer/${id}`);
      setCustomer(resProfile.data.customer);
      setLedger(resProfile.data.ledger);
      setTotals(resProfile.data.totals);
      
      const resBusiness = await api.get('/settings/business');
      setBusiness(resBusiness.data);
    } catch (err) {
      setError('ගිණුම් විස්තර පැටවීමට අපොහොසත් විය. (Failed to load customer profile)');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [id]);

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      setError('වලංගු මුදලක් ඇතුලත් කරන්න. (Valid amount is required)');
      return;
    }

    try {
      await api.post(`/customers/${id}/payment`, {
        amount: parseFloat(paymentForm.amount),
        paymentMethod: paymentForm.paymentMethod,
        notes: paymentForm.notes,
        date: new Date(paymentForm.date),
        transactionSide: paymentSide
      });
      
      setShowPaymentModal(false);
      setPaymentForm({
        amount: '',
        paymentMethod: 'CASH',
        notes: '',
        date: new Date().toISOString().split('T')[0]
      });
      fetchProfileData();
    } catch (err) {
      setError(err.response?.data?.error || 'ගෙවීම ඇතුලත් කිරීමට නොහැකි විය. (Payment failed)');
    }
  };

  const handleAdjSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!adjForm.amount || parseFloat(adjForm.amount) <= 0) {
      setError('වලංගු මුදලක් ඇතුලත් කරන්න. (Valid amount is required)');
      return;
    }

    try {
      await api.post(`/customers/${id}/adjustment`, {
        amount: parseFloat(adjForm.amount),
        type: adjForm.type,
        description: adjForm.description,
        date: new Date(adjForm.date),
        transactionSide: adjSide
      });

      setShowAdjModal(false);
      setAdjForm({
        amount: '',
        type: 'DEBIT',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      fetchProfileData();
    } catch (err) {
      setError(err.response?.data?.error || 'සංශෝධනය ඇතුලත් කිරීමට නොහැකි විය. (Adjustment failed)');
    }
  };

  const exportToCSV = () => {
    if (ledger.length === 0) return;
    
    const headers = ['Date', 'Type', 'Description', 'Debit (LKR)', 'Credit (LKR)', 'Running Balance (LKR)'];
    const rows = ledger.map(e => [
      new Date(e.createdAt).toLocaleDateString(),
      e.transactionType,
      e.description || '',
      e.debit,
      e.credit,
      e.balanceAfter
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${customer.name.replace(/\s+/g, '_')}_ledger.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('si-LK', {
      style: 'currency',
      currency: 'LKR'
    }).format(amount || 0);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="bg-rose-950/40 border border-rose-800 p-6 rounded-xl text-rose-200 text-center">
        ගනුදෙනුකරු හමු නොවුණි (Customer not found).
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Printable Area Wrapper */}
      <div id="print-area" className="hidden">
        <div className="a4-receipt">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold uppercase">{business?.name || 'JAYALAL COCO'}</h1>
            <p className="text-xs uppercase">{business?.secondaryName || 'JS COCO Products'}</p>
            <p className="text-xs">{business?.address1}, {business?.address2}</p>
            <p className="text-xs">Phones: {business?.phone1} | {business?.phone2}</p>
            <hr className="border-black my-4" />
            <h2 className="text-lg font-bold">ගිණුම් ප්‍රකාශය / CUSTOMER LEDGER STATEMENT</h2>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div>
              <p><strong>Name / නම:</strong> {customer.name}</p>
              <p><strong>Phone / දුරකථනය:</strong> {customer.phone || 'N/A'}</p>
              <p><strong>Address / ලිපිනය:</strong> {customer.address || 'N/A'}</p>
            </div>
            <div className="text-right">
              <p><strong>Statement Date:</strong> {new Date().toLocaleDateString()}</p>
              <p><strong>Account Type:</strong> {customer.type}</p>
              {customer.type === 'CUSTOMER' && <p><strong>Receivable / ලැබීමට ඇති මුදල:</strong> {formatCurrency(customer.currentBalance)}</p>}
              {customer.type === 'SUPPLIER' && <p><strong>Payable / ගෙවීමට ඇති මුදල:</strong> {formatCurrency(customer.currentBalance)}</p>}
              {customer.type === 'BOTH' && (
                <>
                  <p><strong>Receivable Balance:</strong> {formatCurrency(totals?.dynamicReceivable)}</p>
                  <p><strong>Payable Balance:</strong> {formatCurrency(totals?.dynamicPayable)}</p>
                </>
              )}
            </div>
          </div>

          <table className="min-w-full text-xs border border-collapse border-black">
            <thead>
              <tr className="bg-gray-150 border-b border-black">
                <th className="border border-black px-2 py-2 text-left">Date</th>
                <th className="border border-black px-2 py-2 text-left">Type</th>
                <th className="border border-black px-2 py-2 text-left">Description</th>
                <th className="border border-black px-2 py-2 text-right">Debit</th>
                <th className="border border-black px-2 py-2 text-right">Credit</th>
                <th className="border border-black px-2 py-2 text-right">Running Balance</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((e, idx) => (
                <tr key={idx} className="border-b border-black">
                  <td className="border border-black px-2 py-1.5">{new Date(e.createdAt).toLocaleDateString()}</td>
                  <td className="border border-black px-2 py-1.5 uppercase font-bold">{e.transactionType}</td>
                  <td className="border border-black px-2 py-1.5">{e.description || '-'}</td>
                  <td className="border border-black px-2 py-1.5 text-right font-mono">{e.debit > 0 ? formatCurrency(e.debit) : '-'}</td>
                  <td className="border border-black px-2 py-1.5 text-right font-mono">{e.credit > 0 ? formatCurrency(e.credit) : '-'}</td>
                  <td className="border border-black px-2 py-1.5 text-right font-mono font-bold">{formatCurrency(e.balanceAfter)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="flex justify-between items-center mt-12 text-sm">
            <div className="text-center w-48 border-t border-black pt-2">
              <p>Operator Signature</p>
            </div>
            <div className="text-center w-48 border-t border-black pt-2">
              <p>Customer Signature</p>
            </div>
          </div>
        </div>
      </div>

      {/* Screen Interface */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/customers')}
          className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold font-display text-white">{customer.name}</h1>
          <p className="text-slate-400 text-sm mt-1">ගිණුම් ඉතිහාසය සහ ගෙවීම් / Ledger sheet & payment inputs</p>
        </div>
      </div>

      {/* Top Cards Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact details */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow">
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">සබඳතා තොරතුරු / Profile Info</h2>
            <div className="flex items-center gap-3 text-slate-300">
              <Phone className="h-5 w-5 text-slate-500" />
              <span>{customer.phone || 'No phone number'}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
              <MapPin className="h-5 w-5 text-slate-500" />
              <span>{customer.address || 'No address details'}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
              <Calendar className="h-5 w-5 text-slate-500" />
              <span>Joined: {new Date(customer.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-850">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              customer.type === 'CUSTOMER' ? 'bg-emerald-950 text-emerald-400' : customer.type === 'SUPPLIER' ? 'bg-rose-950 text-rose-400' : 'bg-indigo-950 text-indigo-400'
            }`}>
              Type: {customer.type}
            </span>
          </div>
        </div>

        {/* Balance card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow border-l-4 border-l-emerald-500">
          <div>
            {customer.type === 'CUSTOMER' && (
              <>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">ලැබීමට ඇති මුදල / Receivable Balance</p>
                <p className="text-3xl font-bold text-emerald-400 mt-2 font-mono">{formatCurrency(customer.currentBalance)}</p>
                <p className="text-xs text-slate-500 mt-2">Amount customer owes the business</p>
              </>
            )}
            {customer.type === 'SUPPLIER' && (
              <>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">ගෙවීමට ඇති මුදල / Payable Balance</p>
                <p className="text-3xl font-bold text-rose-400 mt-2 font-mono">{formatCurrency(customer.currentBalance)}</p>
                <p className="text-xs text-slate-500 mt-2">Amount we owe the supplier</p>
              </>
            )}
            {customer.type === 'BOTH' && (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">ලැබීමට ඇති මුදල / Receivable Balance</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-1 font-mono">{formatCurrency(totals?.dynamicReceivable)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">ගෙවීමට ඇති මුදල / Payable Balance</p>
                  <p className="text-2xl font-bold text-rose-400 mt-1 font-mono">{formatCurrency(totals?.dynamicPayable)}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow space-y-3">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">ගනුදෙනු ඇතුලත් කිරීම් / Actions</h2>
          
          {(customer.type === 'CUSTOMER' || customer.type === 'BOTH') && (
            <button
              onClick={() => { setPaymentSide('CUSTOMER'); setShowPaymentModal(true); }}
              className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold py-3 px-4 rounded-xl text-xs transition"
            >
              <PlusCircle className="h-4.5 w-4.5" />
              Add Payment Received / ලැබුණු මුදල්
            </button>
          )}

          {(customer.type === 'SUPPLIER' || customer.type === 'BOTH') && (
            <button
              onClick={() => { setPaymentSide('SUPPLIER'); setShowPaymentModal(true); }}
              className="w-full flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-450 text-slate-950 font-semibold py-3 px-4 rounded-xl text-xs transition"
            >
              <PlusCircle className="h-4.5 w-4.5" />
              Add Payment Made / ගෙවූ මුදල්
            </button>
          )}

          <button
            onClick={() => { setAdjSide(customer.type === 'BOTH' ? 'CUSTOMER' : customer.type); setShowAdjModal(true); }}
            className="w-full flex items-center justify-center gap-2 bg-slate-950 hover:bg-slate-800 text-indigo-400 border border-slate-800 font-semibold py-2.5 px-4 rounded-xl text-xs transition"
          >
            <PlusSquare className="h-4.5 w-4.5" />
            Add Balance Adjustment
          </button>
        </div>
      </div>

      {/* Ledger history table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white font-display">පොත් තැබීම් ඉතිහාසය / Ledger Statement</h2>
          <div className="flex gap-2">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs transition"
            >
              <Download className="h-4 w-4" />
              CSV Export
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 text-slate-950 hover:bg-emerald-400 rounded-xl text-xs font-semibold transition"
            >
              <Printer className="h-4 w-4" />
              මුද්‍රණය කරන්න / Print Statement
            </button>
          </div>
        </div>

        {ledger.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            මෙහි කිසිදු ලේඛනයක් නැත. (No transactions available in ledger)
          </div>
        ) : (
          <div className="space-y-4">
            {/* Mobile Card List */}
            <div className="grid grid-cols-1 gap-4 md:hidden p-4">
              {ledger.map((e, idx) => (
                <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        e.transactionType === 'SALE' ? 'bg-indigo-950 text-indigo-400' :
                        e.transactionType === 'PURCHASE' ? 'bg-amber-950 text-amber-400' :
                        e.transactionType.startsWith('PAYMENT') ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {e.transactionType}
                      </span>
                      {e.partyType && <span className="text-[10px] text-slate-500 font-semibold uppercase block mt-1">Side: {e.partyType}</span>}
                    </div>
                    <span className="text-xs text-slate-400 font-mono">{new Date(e.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div className="text-xs text-slate-300 font-medium">
                    {e.description || '-'}
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t border-slate-800/60 font-mono text-center">
                    <div>
                      <span className="block text-slate-500 font-semibold uppercase tracking-wider text-[9px] font-sans">Debit (Dr)</span>
                      <span className="block text-emerald-400 font-semibold mt-0.5">{e.debit > 0 ? formatCurrency(e.debit) : '-'}</span>
                    </div>
                    <div>
                      <span className="block text-slate-500 font-semibold uppercase tracking-wider text-[9px] font-sans">Credit (Cr)</span>
                      <span className="block text-rose-400 font-semibold mt-0.5">{e.credit > 0 ? formatCurrency(e.credit) : '-'}</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-slate-500 font-semibold uppercase tracking-wider text-[9px] font-sans">Balance</span>
                      <span className="block text-white font-bold mt-0.5">{formatCurrency(e.balanceAfter)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800 text-left">
                <thead className="bg-slate-950">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Side</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Debit (Dr)</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Credit (Cr)</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Balance After</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900 text-slate-300">
                  {ledger.map((e, idx) => (
                    <tr key={idx} className="hover:bg-slate-850/50 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400 font-mono">
                        {new Date(e.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs">
                        <span className={`px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                          e.transactionType === 'SALE' ? 'bg-indigo-950 text-indigo-400' :
                          e.transactionType === 'PURCHASE' ? 'bg-amber-950 text-amber-400' :
                          e.transactionType.startsWith('PAYMENT') ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {e.transactionType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400 font-semibold uppercase">
                        {e.partyType}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        {e.description || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold font-mono text-emerald-400">
                        {e.debit > 0 ? formatCurrency(e.debit) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold font-mono text-rose-400">
                        {e.credit > 0 ? formatCurrency(e.credit) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold font-mono text-white">
                        {formatCurrency(e.balanceAfter)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Payment Received/Made Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-slate-900 border border-slate-850 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800 flex-shrink-0">
              <h2 className="text-lg font-bold font-display text-white flex items-center gap-2">
                <Building className="h-5 w-5 text-emerald-400" />
                {paymentSide === 'CUSTOMER' ? 'මුදල් ලැබීම ඇතුලත් කරන්න / Add Payment Received' : 'මුදල් ගෙවීම ඇතුලත් කරන්න / Add Payment Made'}
              </h2>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4 overflow-y-auto">
              {customer.type === 'BOTH' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Direction Side</label>
                  <select
                    value={paymentSide}
                    onChange={(e) => setPaymentSide(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none text-sm text-white"
                  >
                    <option value="CUSTOMER">Customer Side (Received Payment / Credit)</option>
                    <option value="SUPPLIER">Supplier Side (Payment Made / Debit)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">දිනය / Date</label>
                <input
                  type="date"
                  value={paymentForm.date}
                  onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">ගෙවීම් ක්‍රමය / Payment Method</label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none text-sm text-white"
                >
                  <option value="CASH">Cash / මුදල්</option>
                  <option value="CHEQUE">Cheque / චෙක්පත්</option>
                  <option value="BANK_TRANSFER">Bank Transfer / බැංකු ප්‍රේෂණ</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">මුදල / Amount (LKR) *</label>
                <input
                  type="number"
                  required
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none text-sm text-white"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">සටහන් / Notes</label>
                <textarea
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none text-sm text-white h-20 resize-none"
                  placeholder="Reference, bank details..."
                />
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 py-3 border border-slate-800 text-slate-300 font-semibold rounded-xl text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-xl text-sm transition"
                >
                  Save Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjustment Modal */}
      {showAdjModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-slate-900 border border-slate-850 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800 flex-shrink-0">
              <h2 className="text-lg font-bold font-display text-white flex items-center gap-2">
                <Building className="h-5 w-5 text-emerald-400" />
                Add Ledger Balance Adjustment
              </h2>
              <button onClick={() => setShowAdjModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAdjSubmit} className="p-6 space-y-4 overflow-y-auto">
              {customer.type === 'BOTH' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Direction Side</label>
                  <select
                    value={adjSide}
                    onChange={(e) => setAdjSide(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none text-sm text-white"
                  >
                    <option value="CUSTOMER">Customer Side (debit increases, credit decreases receivable)</option>
                    <option value="SUPPLIER">Supplier Side (credit increases, debit decreases payable)</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">දිනය / Date</label>
                  <input
                    type="date"
                    value={adjForm.date}
                    onChange={(e) => setAdjForm({ ...adjForm, date: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Adjustment Type</label>
                  <select
                    value={adjForm.type}
                    onChange={(e) => setAdjForm({ ...adjForm, type: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none text-sm text-white"
                  >
                    <option value="DEBIT">Debit (Dr) / හරපත</option>
                    <option value="CREDIT">Credit (Cr) / බැරපත</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">මුදල / Amount *</label>
                <input
                  type="number"
                  required
                  value={adjForm.amount}
                  onChange={(e) => setAdjForm({ ...adjForm, amount: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none text-sm text-white"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">විස්තරය / Description *</label>
                <input
                  type="text"
                  required
                  value={adjForm.description}
                  onChange={(e) => setAdjForm({ ...adjForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none text-sm text-white"
                  placeholder="Opening adjustment, outstanding debt, etc."
                />
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAdjModal(false)}
                  className="flex-1 py-3 border border-slate-800 text-slate-300 font-semibold rounded-xl text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-xl text-sm transition"
                >
                  Save Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
