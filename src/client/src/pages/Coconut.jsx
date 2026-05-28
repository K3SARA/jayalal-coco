import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api';
import { 
  Search, 
  PlusCircle, 
  Edit, 
  Trash, 
  Printer, 
  DollarSign, 
  X, 
  FileText,
  User,
  Scale
} from 'lucide-react';

export default function Coconut() {
  const [entries, setEntries] = useState([]);
  const [batches, setBatches] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [business, setBusiness] = useState(null);
  const [receiptSettings, setReceiptSettings] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();

  // Filters State
  const [search, setSearch] = useState('');
  const [filterBatch, setFilterBatch] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [activePaymentEntry, setActivePaymentEntry] = useState(null);
  
  // Print preview state
  const [printEntry, setPrintEntry] = useState(null);
  const [printFormat, setPrintFormat] = useState('80mm'); // '80mm' or 'A4'

  // Entry Form State
  const [formData, setFormData] = useState({
    batchId: '',
    date: new Date().toISOString().split('T')[0],
    customerId: '',
    vehicleNumber: '',
    productName: 'Coconut / පොල්',
    firstWeight: '',
    secondWeight: '',
    ratePerKg: '',
    transportCost: '0',
    otherExpenses: '0',
    operatorName: 'Admin',
    driverName: '',
    notes: ''
  });

  // Payment Form State
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'CASH',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const resBatches = await api.get('/batches?type=COCONUT');
      setBatches(resBatches.data);

      const resCustomers = await api.get('/customers');
      setCustomers(resCustomers.data);

      const resBusiness = await api.get('/settings/business');
      setBusiness(resBusiness.data);

      const resReceipt = await api.get('/settings/receipt');
      setReceiptSettings(resReceipt.data);

      const resEntries = await api.get('/coconut');
      setEntries(resEntries.data);
    } catch (err) {
      setError('දත්ත ලබා ගැනීමට නොහැකි විය. (Failed to load Coconut data)');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle URL redirect triggers
  useEffect(() => {
    if (searchParams.get('add') === 'true') {
      handleOpenAddModal();
    }
  }, [searchParams, batches]);

  const handleOpenAddModal = () => {
    setEditingEntry(null);
    
    // Auto-select first active batch if available
    const activeBatch = batches.find(b => b.status === 'ACTIVE');
    
    setFormData({
      batchId: activeBatch ? activeBatch.id.toString() : '',
      date: new Date().toISOString().split('T')[0],
      customerId: '',
      vehicleNumber: '',
      productName: 'Coconut / පොල්',
      firstWeight: '',
      secondWeight: '',
      ratePerKg: '',
      transportCost: '0',
      otherExpenses: '0',
      operatorName: 'Admin',
      driverName: '',
      notes: ''
    });
    setShowAddModal(true);
  };

  const handleOpenEditModal = (e) => {
    setEditingEntry(e);
    setFormData({
      batchId: e.batchId.toString(),
      date: new Date(e.date).toISOString().split('T')[0],
      customerId: e.customerId.toString(),
      vehicleNumber: e.vehicleNumber || '',
      productName: e.productName || 'Coconut / පොල්',
      firstWeight: e.firstWeight.toString(),
      secondWeight: e.secondWeight.toString(),
      ratePerKg: e.ratePerKg ? e.ratePerKg.toString() : '',
      transportCost: e.transportCost.toString(),
      otherExpenses: e.otherExpenses.toString(),
      operatorName: e.operatorName || 'Admin',
      driverName: e.driverName || '',
      notes: e.notes || ''
    });
    setShowAddModal(true);
  };

  const handleEntrySubmit = async (e) => {
    e.preventDefault();
    setError('');

    const first = parseFloat(formData.firstWeight);
    const second = parseFloat(formData.secondWeight);
    
    if (first <= second) {
      setError('පළමු බර දෙවන බරට වඩා වැඩි විය යුතුය. (1st Weight must be greater than 2nd Weight)');
      return;
    }

    try {
      if (editingEntry) {
        await api.put(`/coconut/${editingEntry.id}`, formData);
      } else {
        await api.post('/coconut', formData);
      }
      setShowAddModal(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'සුරැකීමට නොහැකි විය. (Failed to save entry)');
    }
  };

  const handleDeleteEntry = async (id) => {
    if (!window.confirm('මෙම ඇතුලත් කිරීම මකා දැමීමට ඔබට ස්ථිරද? (Are you sure you want to delete this weighbridge entry? Related ledger will be recalculated.)')) return;

    try {
      await api.delete(`/coconut/${id}`);
      fetchData();
    } catch (err) {
      setError('මකා දැමීමට නොහැකි විය. (Delete failed)');
    }
  };

  const handleOpenPaymentModal = (entry) => {
    setActivePaymentEntry(entry);
    setPaymentForm({
      amount: '',
      paymentMethod: 'CASH',
      notes: `Payment for Coconut Entry: ${entry.receiptNumber}`,
      date: new Date().toISOString().split('T')[0]
    });
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      setError('වලංගු මුදලක් ඇතුලත් කරන්න. (Valid amount required)');
      return;
    }

    try {
      await api.post(`/coconut/${activePaymentEntry.id}/payment`, paymentForm);
      setShowPaymentModal(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'ගෙවීම අසාර්ථක විය. (Failed to record payment)');
    }
  };

  const handleTriggerPrint = (entry, format) => {
    setPrintEntry(entry);
    setPrintFormat(format);
    // Timeout to let DOM update before printing
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('si-LK', {
      style: 'currency',
      currency: 'LKR'
    }).format(amount || 0);
  };

  // Selected customer outstanding balance preview
  const selectedCustomerObj = customers.find(c => c.id === parseInt(formData.customerId));

  // Client-side search and filters
  const filteredEntries = entries.filter(e => {
    const matchesSearch = 
      e.receiptNumber.toLowerCase().includes(search.toLowerCase()) ||
      (e.vehicleNumber && e.vehicleNumber.toLowerCase().includes(search.toLowerCase())) ||
      e.customer.name.toLowerCase().includes(search.toLowerCase());
    const matchesBatch = filterBatch ? e.batchId === parseInt(filterBatch) : true;
    const matchesCustomer = filterCustomer ? e.customerId === parseInt(filterCustomer) : true;
    return matchesSearch && matchesBatch && matchesCustomer;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Dynamic Print Area Wrapper */}
      <div id="print-area" className="hidden">
        {printEntry && (
          printFormat === '80mm' ? (
            /* 80mm Thermal Print Layout */
            <div className="thermal-receipt">
              <div className="text-center font-bold">
                {receiptSettings?.showBusinessName && <p className="text-sm uppercase font-display">{business?.name || 'JAYALAL COCO'}</p>}
                {receiptSettings?.showOwnerName && <p className="text-[10px] uppercase font-display">Owner: {business?.ownerName}</p>}
                {receiptSettings?.showAddress && <p className="text-[9px]">{business?.address1}, {business?.address2}</p>}
                {receiptSettings?.showPhoneNumbers && (
                  <p className="text-[8px]">PHONES: {business?.phone1} | {business?.phone2}</p>
                )}
                {receiptSettings?.showRegistrationNumber && business?.regNumber && (
                  <p className="text-[8px]">REG NO: {business?.regNumber}</p>
                )}
                <p className="text-[9px] mt-1 border-t border-b border-black py-0.5 uppercase">WEIGHBRIDGE RECEIPT / බර මිනුම් පත</p>
              </div>

              <div className="mt-2 text-[9px] space-y-1 font-mono">
                <p><strong>Receipt No:</strong> {printEntry.receiptNumber}</p>
                {receiptSettings?.showDateTime && <p><strong>Date/Time:</strong> {new Date(printEntry.date).toLocaleString()}</p>}
                {receiptSettings?.showCustomerName && <p><strong>Party / ගනුදෙනුකරු:</strong> {printEntry.customer.name}</p>}
                <p><strong>Account Type:</strong> {printEntry.customer.type}</p>
                {receiptSettings?.showVehicleNumber && <p><strong>Vehicle / රථය:</strong> {printEntry.vehicleNumber || 'N/A'}</p>}
                {receiptSettings?.showProduct && <p><strong>Product / ද්‍රව්‍ය:</strong> {printEntry.productName}</p>}
                <p><strong>Batch / කාණ්ඩය:</strong> {printEntry.batch.batchNumber}</p>
              </div>

              <table className="w-full text-[9px] font-mono border-t border-b border-black mt-2 text-left">
                <tbody>
                  {receiptSettings?.showFirstWeight && (
                    <tr>
                      <td>1st Weight / පළමු බර:</td>
                      <td className="text-right font-bold">{printEntry.firstWeight.toLocaleString()} kg</td>
                    </tr>
                  )}
                  {receiptSettings?.showSecondWeight && (
                    <tr>
                      <td>2nd Weight / දෙවන බර:</td>
                      <td className="text-right font-bold">{printEntry.secondWeight.toLocaleString()} kg</td>
                    </tr>
                  )}
                  {receiptSettings?.showNetWeight && (
                    <tr className="border-t border-dashed border-black">
                      <td><strong>Net Weight / ශුද්ධ බර:</strong></td>
                      <td className="text-right font-bold underline">{printEntry.netWeight.toLocaleString()} kg</td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="mt-2 text-[9px] font-mono space-y-0.5">
                {printEntry.ratePerKg > 0 && (
                  <p><strong>Rate per kg / මිල:</strong> {formatCurrency(printEntry.ratePerKg)}</p>
                )}
                <p className="text-right text-[10px] font-bold border-t border-black pt-1">
                  Total Amount / මුළු මුදල: {formatCurrency(printEntry.totalAmount)}
                </p>
                <p className="text-xs text-right font-bold">
                  Paid / ගෙවූ මුදල: {formatCurrency(printEntry.payments.reduce((s,p) => s + p.amount, 0))}
                </p>
              </div>

              <div className="mt-2 text-[8px] font-mono space-y-1">
                {receiptSettings?.showOperatorName && <p>Operator: {printEntry.operatorName || 'System'}</p>}
                {receiptSettings?.showDriverName && <p>Driver: {printEntry.driverName || 'N/A'}</p>}
              </div>

              <div className="flex justify-between items-center mt-6 pt-2 border-t border-dashed border-black text-[8px] font-mono">
                {receiptSettings?.showCustomerSignature && <div className="text-center w-20 border-t border-black mt-4">Customer</div>}
                {receiptSettings?.showDriverSignature && <div className="text-center w-20 border-t border-black mt-4">Driver</div>}
              </div>

              {receiptSettings?.showFooter && business?.footerText && (
                <p className="text-[8px] text-center italic mt-4 border-t border-black pt-1">{business.footerText}</p>
              )}
            </div>
          ) : (
            /* A4 Print Layout */
            <div className="a4-receipt">
              <div className="flex justify-between items-start mb-6">
                <div>
                  {receiptSettings?.showBusinessName && <h1 className="text-2xl font-bold font-display uppercase">{business?.name}</h1>}
                  {receiptSettings?.showOwnerName && <p className="text-xs uppercase">Owner: {business?.ownerName}</p>}
                  {receiptSettings?.showAddress && <p className="text-xs">{business?.address1}, {business?.address2}</p>}
                  {receiptSettings?.showRegistrationNumber && business?.regNumber && <p className="text-xs font-mono">Reg: {business.regNumber}</p>}
                </div>
                <div className="text-right">
                  <h2 className="text-lg font-bold uppercase underline">Weighbridge Receipt / බර මිනුම් පත</h2>
                  <p className="text-sm font-mono mt-1">Receipt No: {printEntry.receiptNumber}</p>
                  {receiptSettings?.showDateTime && <p className="text-xs text-slate-500">{new Date(printEntry.date).toLocaleString()}</p>}
                </div>
              </div>

              <hr className="border-black mb-6" />

              <div className="grid grid-cols-2 gap-6 mb-8 text-sm">
                <div className="space-y-1">
                  {receiptSettings?.showCustomerName && <p><strong>Customer Name / පාර්ශවය:</strong> {printEntry.customer.name}</p>}
                  <p><strong>Address / ලිපිනය:</strong> {printEntry.customer.address || 'N/A'}</p>
                  <p><strong>Phone / දුරකථනය:</strong> {printEntry.customer.phone || 'N/A'}</p>
                  <p><strong>Account Type:</strong> {printEntry.customer.type}</p>
                </div>
                <div className="space-y-1 text-right">
                  {receiptSettings?.showVehicleNumber && <p><strong>Vehicle Number / රථ අංකය:</strong> {printEntry.vehicleNumber || 'N/A'}</p>}
                  {receiptSettings?.showProduct && <p><strong>Product Name / ද්‍රව්‍ය වර්ගය:</strong> {printEntry.productName}</p>}
                  <p><strong>Batch / කාණ්ඩ අංකය:</strong> {printEntry.batch.batchNumber} - {printEntry.batch.name}</p>
                </div>
              </div>

              <table className="w-full text-sm border-collapse border border-black mb-6">
                <thead>
                  <tr className="bg-gray-100 border-b border-black">
                    <th className="border border-black px-4 py-2 text-left">Weighbridge Description / බර විස්තරය</th>
                    <th className="border border-black px-4 py-2 text-right">Weight (kg)</th>
                  </tr>
                </thead>
                <tbody>
                  {receiptSettings?.showFirstWeight && (
                    <tr className="border-b border-black">
                      <td className="border border-black px-4 py-2">1st Gross Weight / පළමු බර (වාහනය + බඩු)</td>
                      <td className="border border-black px-4 py-2 text-right font-mono font-semibold">{printEntry.firstWeight.toLocaleString()} kg</td>
                    </tr>
                  )}
                  {receiptSettings?.showSecondWeight && (
                    <tr className="border-b border-black">
                      <td className="border border-black px-4 py-2">2nd Tare Weight / දෙවන බර (හිස් වාහනය)</td>
                      <td className="border border-black px-4 py-2 text-right font-mono font-semibold">{printEntry.secondWeight.toLocaleString()} kg</td>
                    </tr>
                  )}
                  {receiptSettings?.showNetWeight && (
                    <tr className="border-b border-black bg-slate-50 font-bold">
                      <td className="border border-black px-4 py-2 text-emerald-800">Net Product Weight / ශුද්ධ බර</td>
                      <td className="border border-black px-4 py-2 text-right font-mono text-lg underline text-emerald-800">{printEntry.netWeight.toLocaleString()} kg</td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="flex justify-between items-start text-sm">
                <div className="space-y-1">
                  {receiptSettings?.showOperatorName && <p><strong>Operator:</strong> {printEntry.operatorName || 'System Admin'}</p>}
                  {receiptSettings?.showDriverName && <p><strong>Driver:</strong> {printEntry.driverName || 'N/A'}</p>}
                  {printEntry.notes && <p className="text-xs italic mt-2"><strong>Notes:</strong> {printEntry.notes}</p>}
                </div>
                <div className="w-80 text-right space-y-2 border-t border-black pt-4">
                  {printEntry.ratePerKg > 0 && (
                    <div className="flex justify-between font-mono">
                      <span>Rate per kg:</span>
                      <span>{formatCurrency(printEntry.ratePerKg)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold font-mono">
                    <span>Total Bill:</span>
                    <span>{formatCurrency(printEntry.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold font-mono text-slate-700">
                    <span>Paid / ගෙවූ මුදල:</span>
                    <span>{formatCurrency(printEntry.payments.reduce((s,p) => s + p.amount, 0))}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold font-mono text-rose-700 border-t border-black pt-1">
                    <span>Balance Due:</span>
                    <span>{formatCurrency(printEntry.totalAmount - printEntry.payments.reduce((s,p) => s + p.amount, 0))}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center mt-20 text-sm">
                {receiptSettings?.showCustomerSignature && (
                  <div className="text-center w-48 border-t border-black pt-2">
                    <p>Customer Signature</p>
                  </div>
                )}
                {receiptSettings?.showDriverSignature && (
                  <div className="text-center w-48 border-t border-black pt-2">
                    <p>Driver / Carrier Signature</p>
                  </div>
                )}
              </div>

              {receiptSettings?.showFooter && business?.footerText && (
                <div className="text-center italic mt-16 text-xs text-slate-600 border-t border-black pt-2">
                  {business.footerText}
                </div>
              )}
            </div>
          )
        )}
      </div>

      {/* Interface */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-white">පොල් කිරුම් ලේඛනය / Coconut Weighbridge</h1>
          <p className="text-slate-400 text-sm mt-1">කිරුම් කටයුතු සහ ගෙවීම් ලේඛනය / Coconut lot scales & billing records</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-3 rounded-xl font-semibold text-sm shadow-lg shadow-emerald-500/10 self-start sm:self-center"
        >
          <PlusCircle className="h-5 w-5" />
          නව කිරුම / Add Entry
        </button>
      </div>

      {error && (
        <div className="bg-rose-950/40 border border-rose-800 p-4 rounded-xl text-rose-200 text-sm">
          {error}
        </div>
      )}

      {/* Filter Options */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between shadow">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="h-5 w-5" />
          </div>
          <input
            type="text"
            placeholder="සොයන්න (රිසිට්පත / වාහනය / ගනුදෙනුකරු)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 w-full md:w-auto">
          {/* Batches select */}
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

          {/* Customer select */}
          <div className="flex-1 md:flex-none">
            <select
              value={filterCustomer}
              onChange={(e) => setFilterCustomer(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Parties / සියලු ගනුදෙනුකරුවන්</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Entries List */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 p-12 text-center rounded-2xl">
          <Scale className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">කිසිදු වාර්තාවක් හමු නොවීය. (No weighbridge entries found)</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Mobile Card List */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredEntries.map((e) => {
              const paid = e.payments.reduce((s, p) => s + p.amount, 0);
              const balance = e.totalAmount - paid;
              return (
                <div key={e.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div>
                      <span className="text-xs font-mono font-bold text-emerald-400 block">{e.receiptNumber}</span>
                      <span className="text-[10px] text-slate-500 font-mono">Batch: {e.batch.batchNumber}</span>
                    </div>
                    <span className="text-xs text-slate-400">{new Date(e.date).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="block text-slate-500 font-semibold uppercase tracking-wider text-[9px]">Party / Customer</span>
                      <span className="font-semibold text-white text-sm">{e.customer.name}</span>
                      {e.vehicleNumber && <span className="block text-slate-400 text-[10px]">Vehicle: {e.vehicleNumber}</span>}
                    </div>
                    <div className="text-right">
                      <span className="block text-slate-500 font-semibold uppercase tracking-wider text-[9px]">Weights</span>
                      <span className="block text-slate-400 text-[10px]">1st: {e.firstWeight.toLocaleString()} kg</span>
                      <span className="block text-slate-400 text-[10px]">2nd: {e.secondWeight.toLocaleString()} kg</span>
                      <span className="block font-bold text-white underline">Net: {e.netWeight.toLocaleString()} kg</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800/60">
                    <div>
                      <span className="block text-slate-500 font-semibold uppercase tracking-wider text-[9px]">Bill Amount</span>
                      <span className="text-sm font-bold text-white font-mono">{formatCurrency(e.totalAmount)}</span>
                      {e.ratePerKg > 0 && <span className="block text-[10px] text-slate-500 font-sans">@{formatCurrency(e.ratePerKg)}/kg</span>}
                    </div>
                    <div className="text-right font-mono">
                      <span className="block text-slate-500 font-semibold uppercase tracking-wider text-[9px] font-sans">Payment / Due</span>
                      <span className="block text-emerald-400 text-[11px]">Paid: {formatCurrency(paid)}</span>
                      <span className={`block text-[11px] ${balance > 0 ? 'text-amber-400 font-bold' : 'text-slate-500'}`}>
                        Bal: {formatCurrency(balance)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleTriggerPrint(e, '80mm')}
                        className="px-3 py-1.5 bg-slate-950 text-slate-300 hover:text-white rounded-lg border border-slate-800 text-[10px] font-semibold flex items-center gap-1"
                      >
                        <Printer className="h-3 w-3 text-emerald-400" />
                        80mm
                      </button>
                      <button
                        onClick={() => handleTriggerPrint(e, 'A4')}
                        className="px-3 py-1.5 bg-slate-950 text-slate-300 hover:text-white rounded-lg border border-slate-800 text-[10px] font-semibold flex items-center gap-1"
                      >
                        <Printer className="h-3 w-3 text-emerald-400" />
                        A4
                      </button>
                    </div>

                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleOpenPaymentModal(e)}
                        className="p-2 bg-slate-950 text-emerald-400 hover:bg-emerald-950 hover:text-white rounded-lg transition disabled:opacity-30"
                        title={balance <= 0 ? "No balance outstanding" : "Add Payment"}
                        disabled={balance <= 0}
                      >
                        <DollarSign className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(e)}
                        className="p-2 bg-slate-950 text-sky-400 hover:bg-sky-950 hover:text-white rounded-lg transition"
                        title="Edit Entry"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEntry(e.id)}
                        className="p-2 bg-slate-950 text-rose-400 hover:bg-rose-950 hover:text-white rounded-lg transition"
                        title="Delete"
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
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Receipt / Date</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Customer / Vehicle</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Weights (kg)</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Bill Amount</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Paid / Bal</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Print</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900 text-slate-300">
                  {filteredEntries.map((e) => {
                    const paid = e.payments.reduce((s, p) => s + p.amount, 0);
                    const balance = e.totalAmount - paid;
                    return (
                      <tr key={e.id} className="hover:bg-slate-850 transition">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-xs font-mono font-bold text-white">{e.receiptNumber}</div>
                          <div className="text-xs text-slate-500">{new Date(e.date).toLocaleDateString()}</div>
                          <div className="text-[10px] text-slate-500 font-mono">Batch: {e.batch.batchNumber}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-semibold text-white">{e.customer.name}</div>
                          <div className="text-xs text-slate-400">Vehicle: {e.vehicleNumber || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-mono">
                          <div>1st: {e.firstWeight.toLocaleString()}</div>
                          <div>2nd: {e.secondWeight.toLocaleString()}</div>
                          <div className="font-bold text-white underline">Net: {e.netWeight.toLocaleString()} kg</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold font-mono text-white">
                          {formatCurrency(e.totalAmount)}
                          {e.ratePerKg > 0 && <span className="block text-[10px] font-sans text-slate-500">@{formatCurrency(e.ratePerKg)}/kg</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-mono">
                          <div className="text-emerald-400">Paid: {formatCurrency(paid)}</div>
                          <div className={balance > 0 ? 'text-amber-400 font-bold' : 'text-slate-500'}>
                            Bal: {formatCurrency(balance)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                          <div className="flex gap-1 justify-center">
                            <button
                              onClick={() => handleTriggerPrint(e, '80mm')}
                              className="px-2 py-1 bg-slate-950 text-slate-300 hover:text-white rounded border border-slate-800 text-[10px] font-semibold"
                            >
                              80mm
                            </button>
                            <button
                              onClick={() => handleTriggerPrint(e, 'A4')}
                              className="px-2 py-1 bg-slate-950 text-slate-300 hover:text-white rounded border border-slate-800 text-[10px] font-semibold"
                            >
                              A4
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenPaymentModal(e)}
                              className="p-2 bg-slate-950 text-emerald-400 hover:bg-emerald-950 hover:text-white rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-slate-950 disabled:hover:text-emerald-400"
                              title={balance <= 0 ? "No balance outstanding" : "Add Payment"}
                              disabled={balance <= 0}
                            >
                              <DollarSign className="h-4.5 w-4.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(e)}
                              className="p-2 bg-slate-950 text-sky-400 hover:bg-sky-955 hover:text-white rounded-lg transition"
                              title="Edit Entry"
                            >
                              <Edit className="h-4.5 w-4.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteEntry(e.id)}
                              className="p-2 bg-slate-950 text-rose-400 hover:bg-rose-955 hover:text-white rounded-lg transition"
                              title="Delete"
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

      {/* Add / Edit Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-850 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800 flex-shrink-0">
              <h2 className="text-lg font-bold font-display text-white flex items-center gap-2">
                <Scale className="h-5 w-5 text-emerald-400" />
                {editingEntry ? 'කිරුම් පත්‍රය සංස්කරණය / Edit Weighbridge Log' : 'නව පොල් කිරුම් වාර්තාවක් ඇතුලත් කිරීම / Add Weighbridge Log'}
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEntrySubmit} className="p-6 space-y-4 overflow-y-auto">
              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Batch Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">කාණ්ඩය / Batch Lot *</label>
                  <select
                    required
                    value={formData.batchId}
                    onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none text-sm text-white"
                  >
                    <option value="">Select Batch Lot...</option>
                    {batches.map(b => (
                      <option key={b.id} value={b.id}>{b.batchNumber} - {b.name} ({b.status})</option>
                    ))}
                  </select>
                </div>

                {/* Entry Date */}
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

                {/* Customer / Supplier lookup */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">ගනුදෙනුකරු (සපයන්නා) / Party Account *</label>
                  <select
                    required
                    value={formData.customerId}
                    onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none text-sm text-white"
                  >
                    <option value="">Select Party Account...</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.type === 'CUSTOMER' ? 'Receivable' : c.type === 'SUPPLIER' ? 'Payable' : 'Both'})
                      </option>
                    ))}
                  </select>
                  {/* Instantly show outstanding balance if customer selected */}
                  {selectedCustomerObj && (
                    <div className="mt-1.5 px-3 py-1 bg-slate-950/40 rounded border border-slate-850 text-xs flex justify-between">
                      <span className="text-slate-400">outstanding Balance / ශේෂය:</span>
                      {selectedCustomerObj.type === 'CUSTOMER' && (
                        <span className="text-emerald-400 font-bold font-mono">
                          Receivable: {formatCurrency(selectedCustomerObj.currentBalance)}
                        </span>
                      )}
                      {selectedCustomerObj.type === 'SUPPLIER' && (
                        <span className="text-rose-400 font-bold font-mono">
                          Payable: {formatCurrency(selectedCustomerObj.currentBalance)}
                        </span>
                      )}
                      {selectedCustomerObj.type === 'BOTH' && (
                        <span className="text-indigo-400 font-bold font-mono">
                          Net Bal: {formatCurrency(selectedCustomerObj.currentBalance)}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Vehicle Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">වාහන අංකය / Vehicle Number</label>
                  <input
                    type="text"
                    value={formData.vehicleNumber}
                    onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none text-sm text-white"
                    placeholder="WP-HN-8902"
                  />
                </div>

                {/* Product Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">ද්‍රව්‍ය විස්තරය / Product Name</label>
                  <input
                    type="text"
                    value={formData.productName}
                    onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none text-sm text-white"
                  />
                </div>

                {/* Driver name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">රියදුරු නම / Driver Name</label>
                  <input
                    type="text"
                    value={formData.driverName}
                    onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none text-sm text-white"
                    placeholder="Bandara"
                  />
                </div>

                {/* 1st Gross Weight */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">පළමු බර (බඩු සමඟ) / 1st Weight (kg) *</label>
                  <input
                    type="number"
                    required
                    value={formData.firstWeight}
                    onChange={(e) => setFormData({ ...formData, firstWeight: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none text-sm text-white font-mono"
                    placeholder="12000"
                  />
                </div>

                {/* 2nd Empty Weight */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">දෙවන බර (හිස් රථය) / 2nd Weight (kg) *</label>
                  <input
                    type="number"
                    required
                    value={formData.secondWeight}
                    onChange={(e) => setFormData({ ...formData, secondWeight: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none text-sm text-white font-mono"
                    placeholder="4000"
                  />
                </div>

                {/* Rate per kg */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">කිලෝවක මිල / Rate per kg (Optional)</label>
                  <input
                    type="number"
                    value={formData.ratePerKg}
                    onChange={(e) => setFormData({ ...formData, ratePerKg: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none text-sm text-white font-mono"
                    placeholder="0.00"
                  />
                </div>

                {/* Operator Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">ක්‍රියාකරු / Operator Name</label>
                  <input
                    type="text"
                    value={formData.operatorName}
                    onChange={(e) => setFormData({ ...formData, operatorName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none text-sm text-white"
                  />
                </div>

                {/* Transport cost */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">ප්‍රවාහන වියදම / Transport Cost</label>
                  <input
                    type="number"
                    value={formData.transportCost}
                    onChange={(e) => setFormData({ ...formData, transportCost: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none text-sm text-white font-mono"
                  />
                </div>

                {/* Other expenses */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">වෙනත් වියදම් / Other Expenses</label>
                  <input
                    type="number"
                    value={formData.otherExpenses}
                    onChange={(e) => setFormData({ ...formData, otherExpenses: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none text-sm text-white font-mono"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">සටහන් / Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none text-sm text-white h-16 resize-none"
                />
              </div>

              {/* Dynamic preview calculations */}
              {parseFloat(formData.firstWeight) > 0 && parseFloat(formData.secondWeight) > 0 && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2 text-xs font-semibold text-slate-400">
                  <div className="flex justify-between">
                    <span>Calculating Net weight / ශුද්ධ බර:</span>
                    <span className="text-white underline font-mono">
                      {(parseFloat(formData.firstWeight) - parseFloat(formData.secondWeight)).toLocaleString()} kg
                    </span>
                  </div>
                  {parseFloat(formData.ratePerKg) > 0 && (
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-emerald-400">Estimated total / මුළු මුදල:</span>
                      <span className="text-emerald-400 font-mono">
                        {formatCurrency(
                          (parseFloat(formData.firstWeight) - parseFloat(formData.secondWeight)) * parseFloat(formData.ratePerKg)
                        )}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
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
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      {showPaymentModal && activePaymentEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-850 rounded-2xl overflow-hidden shadow-2xl text-slate-100">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
              <h2 className="text-lg font-bold font-display flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-400" />
                Add Payment Received / Made
              </h2>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-1.5 text-xs text-slate-400">
                <p><strong>Receipt Number:</strong> {activePaymentEntry.receiptNumber}</p>
                <p><strong>Customer Name:</strong> {activePaymentEntry.customer.name}</p>
                <p><strong>Bill Amount:</strong> {formatCurrency(activePaymentEntry.totalAmount)}</p>
                <p><strong>Already Paid:</strong> {formatCurrency(activePaymentEntry.payments.reduce((s,p)=>s+p.amount, 0))}</p>
                <p className="text-sm font-bold text-white border-t border-slate-850 pt-1.5 flex justify-between">
                  <span>Balance Due:</span>
                  <span className="font-mono">
                    {formatCurrency(activePaymentEntry.totalAmount - activePaymentEntry.payments.reduce((s,p)=>s+p.amount, 0))}
                  </span>
                </p>
              </div>

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
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">ගෙවන මුදල / Amount (LKR) *</label>
                <input
                  type="number"
                  required
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none text-sm text-white font-mono"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">සටහන් / Notes</label>
                <textarea
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none text-sm text-white h-20 resize-none"
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
    </div>
  );
}
