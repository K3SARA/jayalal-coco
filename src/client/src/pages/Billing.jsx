import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import {
  User,
  Calendar,
  Plus,
  Minus,
  Trash2,
  Share2,
  Printer,
  Save,
  ChevronDown,
  Calculator,
  Settings,
  ShoppingBag,
  BookOpen,
  Store,
  History,
  Users,
  Search,
  X,
  FileText,
  Check,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  DollarSign
} from 'lucide-react';

export default function Billing() {
  // Navigation Tab: 'home' (Billing), 'items', 'cashbook', 'history', 'customers'
  const [activeTab, setActiveTab] = useState('home');

  // Master Data
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [businessSettings, setBusinessSettings] = useState(null);

  // Active Billing Form State
  const [invoiceType, setInvoiceType] = useState('Invoice'); // Invoice / Estimate
  const [acType, setAcType] = useState('AC'); // AC / Non-AC
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customCustomerName, setCustomCustomerName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState([{ id: Date.now(), name: '', qty: 1, unit: 'Unit', rate: 0, total: 0 }]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [taxPercent, setTaxPercent] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('CASH'); // CASH / CREDIT
  const [notes, setNotes] = useState('');

  // Modals & Panels State
  const [showCalculator, setShowCalculator] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [selectedHistoryInvoice, setSelectedHistoryInvoice] = useState(null);
  const [printInvoice, setPrintInvoice] = useState(null);

  // New Entity Forms State
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', address: '', type: 'CUSTOMER' });
  const [newProduct, setNewProduct] = useState({ name: '', unit: 'Unit', defaultRate: '' });

  // Autocomplete suggestions for items name
  const [focusedItemIndex, setFocusedItemIndex] = useState(null);

  // Calculator State
  const [calcInput, setCalcInput] = useState('');
  const [calcTargetField, setCalcTargetField] = useState(null); // { itemIndex, field: 'qty' | 'rate' }

  // Load Initial Data
  useEffect(() => {
    fetchCustomers();
    fetchProducts();
    fetchInvoices();
    fetchBusinessSettings();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers');
      setCustomers(response.data);
    } catch (err) {
      console.error('Failed to fetch customers', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get('/invoice-products');
      setProducts(response.data);
    } catch (err) {
      console.error('Failed to fetch invoice products', err);
    }
  };

  const fetchInvoices = async () => {
    try {
      const response = await api.get('/invoices');
      setInvoices(response.data);
    } catch (err) {
      console.error('Failed to fetch invoices', err);
    }
  };

  const fetchBusinessSettings = async () => {
    try {
      const response = await api.get('/settings/business');
      setBusinessSettings(response.data);
    } catch (err) {
      console.error('Failed to fetch business settings', err);
    }
  };

  // Calculations
  const subTotal = items.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);

  // Sync discounts
  const handleDiscountPercentChange = (val) => {
    const percent = parseFloat(val) || 0;
    setDiscountPercent(percent);
    setDiscountAmount(((subTotal * percent) / 100).toFixed(2));
  };

  const handleDiscountAmountChange = (val) => {
    const amt = parseFloat(val) || 0;
    setDiscountAmount(amt);
    setDiscountPercent(subTotal > 0 ? ((amt / subTotal) * 100).toFixed(2) : 0);
  };

  // Tax calculations
  const calculatedTaxAmount = ((subTotal - discountAmount) * (taxPercent / 100));
  const totalAmount = Math.max(0, subTotal - discountAmount + calculatedTaxAmount);

  // Auto-recalculate totals when items or subtotal changes
  useEffect(() => {
    setDiscountAmount(((subTotal * discountPercent) / 100).toFixed(2));
  }, [subTotal, discountPercent]);

  // Items Form Logic
  const handleAddItem = () => {
    setItems([...items, { id: Date.now(), name: '', qty: 1, unit: 'Unit', rate: 0, total: 0 }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length === 1) {
      setItems([{ id: Date.now(), name: '', qty: 1, unit: 'Unit', rate: 0, total: 0 }]);
    } else {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;

    if (field === 'qty' || field === 'rate') {
      const q = parseFloat(newItems[index].qty) || 0;
      const r = parseFloat(newItems[index].rate) || 0;
      newItems[index].total = (q * r).toFixed(2);
    }
    setItems(newItems);
  };

  const selectProductForItem = (index, product) => {
    const newItems = [...items];
    newItems[index].name = product.name;
    newItems[index].unit = product.unit;
    newItems[index].rate = product.defaultRate;
    const q = parseFloat(newItems[index].qty) || 0;
    const r = parseFloat(product.defaultRate) || 0;
    newItems[index].total = (q * r).toFixed(2);
    setItems(newItems);
    setFocusedItemIndex(null);
  };

  // Add Customer Inline
  const handleAddCustomerSubmit = async (e) => {
    e.preventDefault();
    if (!newCustomer.name) return;
    try {
      const response = await api.post('/customers', {
        ...newCustomer,
        openingBalance: 0,
      });
      setCustomers([...customers, response.data]);
      setSelectedCustomerId(response.data.id);
      setCustomCustomerName(response.data.name);
      setShowAddCustomerModal(false);
      setNewCustomer({ name: '', phone: '', address: '', type: 'CUSTOMER' });
    } catch (err) {
      alert('Failed to add customer. ' + (err.response?.data?.error || err.message));
    }
  };

  // Add Billing Product Inline
  const handleAddProductSubmit = async (e) => {
    e.preventDefault();
    if (!newProduct.name) return;
    try {
      const response = await api.post('/invoice-products', {
        name: newProduct.name,
        unit: newProduct.unit,
        defaultRate: parseFloat(newProduct.defaultRate) || 0
      });
      setProducts([...products, response.data]);
      setShowAddProductModal(false);
      setNewProduct({ name: '', unit: 'Unit', defaultRate: '' });
    } catch (err) {
      alert('Failed to add product. ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.delete(`/invoice-products/${id}`);
      setProducts(products.filter(p => p.id !== id));
    } catch (err) {
      alert('Failed to delete product.');
    }
  };

  // Save Invoice
  const handleSaveInvoice = async () => {
    if (!selectedCustomerId) {
      alert('Please select a customer.');
      return;
    }
    const validItems = items.filter(item => item.name && item.qty > 0);
    if (validItems.length === 0) {
      alert('Please add at least one valid item.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        date: new Date(date).toISOString(),
        customerId: parseInt(selectedCustomerId),
        customerName: customCustomerName,
        items: validItems.map(i => ({ name: i.name, qty: parseFloat(i.qty), unit: i.unit, rate: parseFloat(i.rate), total: parseFloat(i.total) })),
        subTotal,
        discountPercent: parseFloat(discountPercent),
        discountAmount: parseFloat(discountAmount),
        taxPercent: parseFloat(taxPercent),
        taxAmount: parseFloat(calculatedTaxAmount),
        totalAmount: parseFloat(totalAmount),
        paymentMethod,
        notes
      };

      const res = await api.post('/invoices', payload);
      alert(`Invoice saved successfully! Number: ${res.data.invoiceNumber}`);
      
      // Reset form
      setItems([{ id: Date.now(), name: '', qty: 1, unit: 'Unit', rate: 0, total: 0 }]);
      setDiscountPercent(0);
      setDiscountAmount(0);
      setTaxPercent(0);
      setPaymentMethod('CASH');
      setNotes('');
      fetchInvoices();
      fetchCustomers(); // Refresh balances
    } catch (err) {
      alert('Failed to save invoice. ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Delete Invoice
  const handleDeleteInvoice = async (id) => {
    if (!window.confirm('Delete this invoice? This will also remove the ledger adjustments.')) return;
    try {
      await api.delete(`/invoices/${id}`);
      fetchInvoices();
      fetchCustomers();
      if (selectedHistoryInvoice?.id === id) {
        setSelectedHistoryInvoice(null);
      }
    } catch (err) {
      alert('Failed to delete invoice.');
    }
  };

  // Share Text Invoice
  const handleShareInvoice = (inv) => {
    const activeInv = inv || {
      invoiceNumber: 'DRAFT',
      date,
      customerName: customCustomerName || 'Guest Customer',
      items: items.filter(i => i.name),
      totalAmount
    };

    let text = `*${businessSettings?.name || 'JAYALAL COCO'}*\n`;
    text += `Bill No: ${activeInv.invoiceNumber}\n`;
    text += `Date: ${activeInv.date ? new Date(activeInv.date).toLocaleDateString() : ''}\n`;
    text += `Customer: ${activeInv.customerName}\n`;
    text += `---------------------------\n`;
    activeInv.items.forEach((item, index) => {
      text += `${index + 1}. ${item.name}\n   ${item.qty} ${item.unit} x ${item.rate} = LKR ${item.total}\n`;
    });
    text += `---------------------------\n`;
    text += `*Total: LKR ${activeInv.totalAmount.toFixed(2)}*\n`;
    text += `${businessSettings?.footerText || 'Thank You!'}`;

    if (navigator.share) {
      navigator.share({
        title: 'Invoice',
        text: text,
      }).catch(err => {
        navigator.clipboard.writeText(text);
        alert('Invoice details copied to clipboard!');
      });
    } else {
      navigator.clipboard.writeText(text);
      alert('Invoice details copied to clipboard!');
    }
  };

  // Trigger Native Print Dialog using standard DOM container (compatible with Android/iOS WebViews)
  const handlePrint = (invoiceData) => {
    const billToPrint = invoiceData ? { ...invoiceData } : {
      invoiceNumber: 'DRAFT',
      date: date,
      customerName: customCustomerName || 'Guest Customer',
      items: items.filter(i => i.name),
      subTotal,
      discountAmount,
      discountPercent,
      taxPercent,
      taxAmount: calculatedTaxAmount,
      totalAmount,
      paymentMethod,
      notes
    };

    // Safely parse items if it came from history (which uses itemsJson string)
    if (!billToPrint.items && billToPrint.itemsJson) {
      try {
        billToPrint.items = JSON.parse(billToPrint.itemsJson);
      } catch (err) {
        billToPrint.items = [];
        console.error('Failed to parse itemsJson during printing', err);
      }
    }

    setPrintInvoice(billToPrint);

    // Give React a brief moment to update the hidden DOM print-area before calling print dialog
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Calculator Handler
  const handleCalculatorKey = (key) => {
    if (key === 'C') {
      setCalcInput('');
    } else if (key === '←') {
      setCalcInput(calcInput.slice(0, -1));
    } else if (key === '=') {
      try {
        // Safe evaluation
        const result = Function(`"use strict"; return (${calcInput})`)();
        setCalcInput(String(result));
      } catch (err) {
        setCalcInput('Error');
      }
    } else {
      setCalcInput(calcInput + key);
    }
  };

  const applyCalculatorValue = () => {
    const val = parseFloat(calcInput);
    if (!isNaN(val) && calcTargetField !== null) {
      handleItemChange(calcTargetField.itemIndex, calcTargetField.field, val);
    }
    setShowCalculator(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 p-0 md:p-6 flex flex-col items-center justify-center font-sans">
      
      {/* Desktop Wrapper styled as a high fidelity smartphone */}
      <div className="w-full max-w-md bg-white text-slate-800 shadow-2xl rounded-none md:rounded-[36px] overflow-hidden border-0 md:border-8 border-slate-800 relative flex flex-col md:aspect-[9/19] h-screen md:h-[calc(100vh-48px)] max-h-none md:max-h-[850px] min-h-0 md:min-h-[680px]">
        
        {/* Dynamic Screen Area */}
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-20 bg-slate-50">
          
          {/* 1. HOME (BILLING) TAB */}
          {activeTab === 'home' && (
            <div className="space-y-4">
              
              {/* Header Bar */}
              <div className="flex items-center justify-between border-b pb-2">
                <div className="relative">
                  <button 
                    onClick={() => setInvoiceType(invoiceType === 'Invoice' ? 'Estimate' : 'Invoice')}
                    className="flex items-center gap-1 font-bold text-lg text-slate-800 hover:text-sky-600 transition-colors"
                  >
                    {invoiceType} <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* AC Non-AC Toggle */}
                  <button 
                    onClick={() => setAcType(acType === 'AC' ? 'Non-AC' : 'AC')}
                    className={`px-3 py-1 text-xs font-bold rounded-full border transition-all ${
                      acType === 'AC' 
                        ? 'bg-sky-100 text-sky-700 border-sky-300' 
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {acType}
                  </button>
                  
                  {/* Calculator Button */}
                  <button 
                    onClick={() => {
                      setCalcInput('');
                      setCalcTargetField(null);
                      setShowCalculator(true);
                    }}
                    className="p-1.5 text-slate-500 hover:text-sky-600 bg-slate-100 rounded-lg"
                    title="Calculator"
                  >
                    <Calculator className="h-5 w-5" />
                  </button>
                  
                  {/* Settings Button */}
                  <button 
                    onClick={() => setShowSettingsModal(true)}
                    className="p-1.5 text-slate-500 hover:text-sky-600 bg-slate-100 rounded-lg"
                    title="Settings"
                  >
                    <Settings className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Customer Selector Card */}
              <div className="bg-slate-100 rounded-2xl p-3 shadow-sm space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <User className="h-5 w-5 text-slate-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <select
                        value={selectedCustomerId}
                        onChange={(e) => {
                          setSelectedCustomerId(e.target.value);
                          const c = customers.find(cust => cust.id === parseInt(e.target.value));
                          setCustomCustomerName(c ? c.name : '');
                        }}
                        className="w-full bg-transparent border-none text-slate-800 font-bold focus:outline-none focus:ring-0 p-0 text-sm appearance-none pr-6 relative"
                        style={{ 
                          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23475569'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/></svg>")`, 
                          backgroundPosition: 'right center', 
                          backgroundRepeat: 'no-repeat', 
                          backgroundSize: '1rem' 
                        }}
                      >
                        <option value="">ගනුදෙනුකරු තෝරන්න / Select Customer</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.type}) - Bal: LKR {c.currentBalance.toFixed(0)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowAddCustomerModal(true)}
                    className="p-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg shrink-0"
                    title="Quick Add Customer"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between border-t border-slate-200/60 pt-2 text-xs text-slate-500">
                  <span className="font-semibold">දිනය / Date:</span>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="italic bg-transparent border-none focus:outline-none text-right cursor-pointer font-bold text-slate-700 p-0"
                  />
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={item.id} className="border-b pb-3 relative">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <span className="text-sm text-slate-400 font-medium shrink-0">{index + 1}.</span>
                        <div className="relative flex-1 min-w-0">
                          <input
                            type="text"
                            placeholder="Item description"
                            value={item.name}
                            onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                            onFocus={() => setFocusedItemIndex(index)}
                            onBlur={() => setTimeout(() => setFocusedItemIndex(null), 200)}
                            className="w-full border-b border-slate-200 focus:border-sky-500 py-0.5 px-0 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none bg-transparent"
                          />
                          
                          {/* Autocomplete suggestions */}
                          {focusedItemIndex === index && products.length > 0 && (
                            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-25 max-h-40 overflow-y-auto">
                              {products
                                .filter(p => p.name.toLowerCase().includes((item.name || '').toLowerCase()))
                                .map(p => (
                                  <button
                                    key={p.id}
                                    onMouseDown={() => selectProductForItem(index, p)}
                                    className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-slate-50 text-slate-700 border-b last:border-b-0"
                                  >
                                    {p.name} ({p.unit}) - LKR {p.defaultRate}
                                  </button>
                                ))
                              }
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveItem(index)}
                        className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                        title="Remove item"
                      >
                        <Minus className="h-4.5 w-4.5" />
                      </button>
                    </div>

                    {/* Qty, Unit, Rate, Total row */}
                    <div className="flex items-center justify-between mt-2 gap-2 pl-4">
                      {/* Qty input */}
                      <div className="flex items-center gap-1 w-14 shrink-0">
                        <input
                          type="number"
                          placeholder="0"
                          value={item.qty}
                          inputMode="none"
                          onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                          onClick={(e) => {
                            e.target.blur();
                            setCalcTargetField({ itemIndex: index, field: 'qty' });
                            setCalcInput(String(item.qty || ''));
                            setShowCalculator(true);
                          }}
                          className="w-full border-b border-slate-200 focus:border-sky-500 py-0.5 text-center text-sm font-bold text-slate-800 focus:outline-none bg-transparent"
                        />
                      </div>

                      {/* Unit dropdown */}
                      <div className="relative w-16 shrink-0">
                        <select
                          value={item.unit}
                          onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                          className="w-full border-b border-slate-200 focus:border-sky-500 py-0.5 text-xs font-semibold text-slate-600 focus:outline-none bg-transparent appearance-none text-center cursor-pointer"
                        >
                          <option value="Unit">Unit</option>
                          <option value="Kg">Kg</option>
                          <option value="Husk">Husk</option>
                          <option value="Piece">Piece</option>
                          <option value="Load">Load</option>
                        </select>
                      </div>

                      {/* Rate input */}
                      <div className="flex items-center gap-1 w-20 shrink-0">
                        <input
                          type="number"
                          placeholder="0.00"
                          value={item.rate}
                          inputMode="none"
                          onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                          onClick={(e) => {
                            e.target.blur();
                            setCalcTargetField({ itemIndex: index, field: 'rate' });
                            setCalcInput(String(item.rate || ''));
                            setShowCalculator(true);
                          }}
                          className="w-full border-b border-slate-200 focus:border-sky-500 py-0.5 text-center text-sm font-bold text-slate-800 focus:outline-none bg-transparent"
                        />
                      </div>

                      {/* Total calculated price display */}
                      <div className="text-right flex-1 min-w-0">
                        <span className="text-sm font-bold text-slate-700 truncate block">
                          {(parseFloat(item.total) || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Item trigger */}
              <button 
                onClick={handleAddItem}
                className="w-full py-2 border border-dashed border-slate-300 rounded-xl text-slate-500 hover:text-sky-600 hover:border-sky-500 transition-colors flex items-center justify-center gap-1.5 text-xs font-bold"
              >
                <Plus className="h-4 w-4" /> Add Row
              </button>

              {/* Totals Summary Panel (matching light blue screenshot styles) */}
              <div className="bg-sky-50 rounded-2xl p-3.5 space-y-2 border border-sky-100 shadow-sm text-sm">
                <div className="flex justify-between font-semibold text-slate-600">
                  <span>Sub total</span>
                  <span className="font-mono">{subTotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center text-slate-600 gap-2">
                  <span>Discount</span>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center border-b border-sky-200">
                      <input
                        type="number"
                        placeholder="0.00"
                        value={discountPercent || ''}
                        onChange={(e) => handleDiscountPercentChange(e.target.value)}
                        className="w-10 bg-transparent border-none text-right font-semibold text-slate-800 p-0 text-xs focus:outline-none"
                      />
                      <span className="text-xs text-slate-500 ml-0.5">%</span>
                    </div>
                    
                    <div className="flex items-center border-b border-sky-200">
                      <input
                        type="number"
                        placeholder="0.00"
                        value={discountAmount || ''}
                        onChange={(e) => handleDiscountAmountChange(e.target.value)}
                        className="w-14 bg-transparent border-none text-right font-semibold text-slate-800 p-0 text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Tax component */}
                <div className="flex justify-between items-center text-slate-600">
                  <span>Tax</span>
                  {taxPercent > 0 ? (
                    <button 
                      onClick={() => setTaxPercent(0)}
                      className="text-xs font-semibold text-rose-600 hover:underline flex items-center gap-1"
                    >
                      {taxPercent}% (LKR {calculatedTaxAmount.toFixed(2)}) <X className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <select
                      value={taxPercent}
                      onChange={(e) => setTaxPercent(parseFloat(e.target.value))}
                      className="bg-transparent border-none text-xs font-bold text-sky-600 focus:outline-none focus:ring-0 p-0 text-right cursor-pointer"
                    >
                      <option value="0">Add Tax</option>
                      <option value="5">GST (5%)</option>
                      <option value="12">VAT (12%)</option>
                      <option value="15">VAT (15%)</option>
                      <option value="18">VAT (18%)</option>
                    </select>
                  )}
                </div>

                {/* Grand Total */}
                <div className="flex justify-between items-center pt-2 border-t border-sky-200/60 font-bold text-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-base">Total</span>
                    
                    {/* Payment Method Switcher */}
                    <div className="flex bg-slate-200/60 p-0.5 rounded-full text-[10px]">
                      <button
                        onClick={() => setPaymentMethod('CASH')}
                        className={`px-2.5 py-0.5 rounded-full font-bold transition-all ${
                          paymentMethod === 'CASH' 
                            ? 'bg-sky-600 text-white' 
                            : 'text-slate-600'
                        }`}
                      >
                        Cash
                      </button>
                      <button
                        onClick={() => setPaymentMethod('CREDIT')}
                        className={`px-2.5 py-0.5 rounded-full font-bold transition-all ${
                          paymentMethod === 'CREDIT' 
                            ? 'bg-sky-600 text-white' 
                            : 'text-slate-600'
                        }`}
                      >
                        Credit
                      </button>
                    </div>
                  </div>
                  
                  <span className="text-lg font-bold font-mono text-sky-700">
                    {totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Action Buttons (Save, Share, Print) */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <button
                  onClick={handleSaveInvoice}
                  disabled={loading}
                  className="bg-sky-700 hover:bg-sky-600 disabled:bg-slate-400 text-white font-bold py-2.5 px-4 rounded-full flex items-center justify-center gap-1.5 shadow-md transition-all text-sm"
                >
                  <Save className="h-4.5 w-4.5" /> Save
                </button>
                
                <button
                  onClick={() => handleShareInvoice(null)}
                  className="bg-sky-700 hover:bg-sky-600 text-white font-bold py-2.5 px-4 rounded-full flex items-center justify-center gap-1.5 shadow-md transition-all text-sm"
                >
                  <Share2 className="h-4.5 w-4.5" /> Share
                </button>

                <button
                  onClick={() => handlePrint(null)}
                  className="bg-sky-700 hover:bg-sky-600 text-white font-bold py-2.5 px-4 rounded-full flex items-center justify-center gap-1.5 shadow-md transition-all text-sm"
                >
                  <Printer className="h-4.5 w-4.5" /> Print
                </button>
              </div>

            </div>
          )}

          {/* 2. ITEMS TAB */}
          {activeTab === 'items' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800">Quick Items</h2>
                <button 
                  onClick={() => setShowAddProductModal(true)}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow"
                >
                  <Plus className="h-4 w-4" /> Add Product
                </button>
              </div>

              {products.length === 0 ? (
                <div className="bg-white border rounded-2xl p-6 text-center text-slate-500 text-sm">
                  No billing products configured. Add a product to autocomplete invoice items.
                </div>
              ) : (
                <div className="bg-white border rounded-2xl divide-y overflow-hidden shadow-sm">
                  {products.map(p => (
                    <div key={p.id} className="p-3 flex items-center justify-between text-sm">
                      <div>
                        <p className="font-semibold text-slate-800">{p.name}</p>
                        <p className="text-xs text-slate-500">Unit: {p.unit} | Default Rate: LKR {p.defaultRate.toFixed(2)}</p>
                      </div>
                      
                      <button 
                        onClick={() => handleDeleteProduct(p.id)}
                        className="text-slate-400 hover:text-rose-500 p-2"
                        title="Delete product"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. CASHBOOK TAB */}
          {activeTab === 'cashbook' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-800">Cashbook Log</h2>
              
              {/* Cash Position summary */}
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Cash In Hand Today</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1 font-mono">
                    LKR {invoices
                      .filter(inv => inv.paymentMethod === 'CASH' && inv.date.startsWith(new Date().toISOString().split('T')[0]))
                      .reduce((sum, inv) => sum + inv.totalAmount, 0)
                      .toFixed(2)}
                  </p>
                  <p className="text-[10px] text-emerald-500 mt-0.5">Calculated from quick cash invoices today</p>
                </div>
                <div className="bg-emerald-500 text-white p-3 rounded-xl">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>

              {/* Cash Transactions List */}
              <div className="bg-white border rounded-2xl p-3 shadow-sm space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase">Recent Cash Bills</p>
                
                {invoices.filter(inv => inv.paymentMethod === 'CASH').length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No cash invoices saved yet.</p>
                ) : (
                  <div className="divide-y max-h-80 overflow-y-auto">
                    {invoices
                      .filter(inv => inv.paymentMethod === 'CASH')
                      .slice(0, 15)
                      .map(inv => (
                        <div key={inv.id} className="py-2.5 flex items-center justify-between text-xs">
                          <div className="min-w-0">
                            <p className="font-bold text-slate-700 truncate">{inv.customerName}</p>
                            <p className="text-[10px] text-slate-400">{new Date(inv.date).toLocaleDateString()} | {inv.invoiceNumber}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-mono font-bold text-emerald-600">+ LKR {inv.totalAmount.toFixed(2)}</span>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. HISTORY TAB */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-800">Invoice History</h2>
              
              {invoices.length === 0 ? (
                <div className="bg-white border rounded-2xl p-6 text-center text-slate-500 text-sm shadow-sm">
                  No invoices generated yet. Save a bill to see it here.
                </div>
              ) : (
                <div className="space-y-3">
                  {invoices.map(inv => (
                    <div 
                      key={inv.id} 
                      className="bg-white border rounded-2xl p-3 shadow-sm hover:border-sky-300 transition-all cursor-pointer relative"
                      onClick={() => setSelectedHistoryInvoice(inv)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            inv.invoiceNumber.startsWith('EST') ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'
                          }`}>
                            {inv.invoiceNumber}
                          </span>
                          <h3 className="font-bold text-slate-800 text-sm mt-1">{inv.customerName}</h3>
                          <p className="text-xs text-slate-500">{new Date(inv.date).toLocaleDateString()} | Method: {inv.paymentMethod}</p>
                        </div>
                        
                        <div className="text-right">
                          <p className="font-mono font-bold text-slate-800 text-sm">LKR {inv.totalAmount.toFixed(2)}</p>
                          
                          <div className="flex gap-1 mt-2 justify-end">
                            <button
                              onClick={(e) => { e.stopPropagation(); handlePrint(inv); }}
                              className="p-1 bg-slate-100 text-slate-600 rounded-lg hover:text-sky-600"
                              title="Print Invoice"
                            >
                              <Printer className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleShareInvoice(inv); }}
                              className="p-1 bg-slate-100 text-slate-600 rounded-lg hover:text-sky-600"
                              title="Share Invoice"
                            >
                              <Share2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteInvoice(inv.id); }}
                              className="p-1 bg-slate-100 text-slate-600 rounded-lg hover:text-rose-600"
                              title="Delete Invoice"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 5. CUSTOMERS TAB */}
          {activeTab === 'customers' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-800">Billing Customers</h2>

              <div className="bg-white border rounded-2xl divide-y overflow-hidden shadow-sm">
                {customers.map(c => (
                  <div key={c.id} className="p-3 flex items-center justify-between text-sm hover:bg-slate-50">
                    <div>
                      <p className="font-semibold text-slate-800">{c.name}</p>
                      <p className="text-xs text-slate-500">Phone: {c.phone || 'N/A'} | Type: {c.type}</p>
                      <p className="text-xs font-semibold text-slate-600 mt-0.5">
                        Balance: LKR <span className={c.currentBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}>{c.currentBalance.toFixed(2)}</span>
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedCustomerId(c.id);
                        setCustomCustomerName(c.name);
                        setActiveTab('home');
                      }}
                      className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow"
                    >
                      <Plus className="h-3 w-3" /> Start Bill
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* 2. TAB NAVIGATION BOTTOM BAR (Matching 100% of screenshot icons) */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 px-4 flex items-center justify-between shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-20">
          {/* Items */}
          <button 
            onClick={() => setActiveTab('items')}
            className={`flex flex-col items-center justify-center flex-1 gap-1 text-[10px] font-bold ${
              activeTab === 'items' ? 'text-sky-600' : 'text-slate-400'
            }`}
          >
            <ShoppingBag className="h-5 w-5" />
            <span>Items</span>
          </button>
          
          {/* Cashbook */}
          <button 
            onClick={() => setActiveTab('cashbook')}
            className={`flex flex-col items-center justify-center flex-1 gap-1 text-[10px] font-bold ${
              activeTab === 'cashbook' ? 'text-sky-600' : 'text-slate-400'
            }`}
          >
            <BookOpen className="h-5 w-5" />
            <span>Cashbook</span>
          </button>

          {/* Home (Active background light purple highlight from screenshot) */}
          <button 
            onClick={() => setActiveTab('home')}
            className="flex-1 flex flex-col items-center justify-center"
          >
            <div className={`flex flex-col items-center justify-center gap-1 py-1 px-4 text-[10px] font-bold ${
              activeTab === 'home' 
                ? 'bg-purple-100 text-purple-700 rounded-2xl' 
                : 'text-slate-400'
            }`}>
              <Store className="h-5 w-5" />
              <span>Home</span>
            </div>
          </button>

          {/* History */}
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center justify-center flex-1 gap-1 text-[10px] font-bold ${
              activeTab === 'history' ? 'text-sky-600' : 'text-slate-400'
            }`}
          >
            <History className="h-5 w-5" />
            <span>History</span>
          </button>

          {/* Customers */}
          <button 
            onClick={() => setActiveTab('customers')}
            className={`flex flex-col items-center justify-center flex-1 gap-1 text-[10px] font-bold ${
              activeTab === 'customers' ? 'text-sky-600' : 'text-slate-400'
            }`}
          >
            <Users className="h-5 w-5" />
            <span>Customers</span>
          </button>
        </div>

      </div>

      {/* ================================================= */}
      {/* MODAL WINDOWS                                     */}
      {/* ================================================= */}

      {/* 1. CALCULATOR MODAL (Working Micro Calculator) */}
      {showCalculator && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl w-72 p-4 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                <Calculator className="h-4 w-4" /> Quick Calculator
              </span>
              <button 
                onClick={() => setShowCalculator(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Screen */}
            <div className="bg-slate-950 rounded-xl p-3 border border-slate-850 text-right min-h-12 flex flex-col justify-end">
              <span className="text-xs text-slate-500 font-mono select-none block overflow-hidden text-ellipsis whitespace-nowrap">{calcInput || '0'}</span>
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-4 gap-2 text-sm font-semibold">
              {['C', '←', '/', '*'].map(k => (
                <button key={k} onClick={() => handleCalculatorKey(k)} className="h-10 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-xl">{k}</button>
              ))}
              {['7', '8', '9', '-'].map(k => (
                <button key={k} onClick={() => handleCalculatorKey(k)} className="h-10 bg-slate-850 hover:bg-slate-800 rounded-xl">{k}</button>
              ))}
              {['4', '5', '6', '+'].map(k => (
                <button key={k} onClick={() => handleCalculatorKey(k)} className="h-10 bg-slate-850 hover:bg-slate-800 rounded-xl">{k}</button>
              ))}
              {['1', '2', '3', '='].map(k => (
                k === '=' 
                  ? <button key={k} onClick={() => handleCalculatorKey(k)} className="h-22 col-start-4 row-span-2 bg-sky-600 hover:bg-sky-500 rounded-xl">=</button>
                  : <button key={k} onClick={() => handleCalculatorKey(k)} className="h-10 bg-slate-850 hover:bg-slate-800 rounded-xl">{k}</button>
              ))}
              <button onClick={() => handleCalculatorKey('0')} className="h-10 col-span-2 bg-slate-850 hover:bg-slate-800 rounded-xl">0</button>
              <button onClick={() => handleCalculatorKey('.')} className="h-10 bg-slate-850 hover:bg-slate-800 rounded-xl">.</button>
            </div>

            {/* Apply Action */}
            {calcTargetField !== null && (
              <button 
                onClick={applyCalculatorValue}
                className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
              >
                <Check className="h-4 w-4" /> Use Value
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. RECEIPT / INVOICE SETTINGS MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-800 border rounded-3xl w-full max-w-sm p-4 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-sm font-bold text-slate-800 flex items-center gap-1">
                <Settings className="h-4.5 w-4.5" /> Billing Settings
              </span>
              <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <p>Customize standard print configuration and receipt data. Changes are pulled dynamically from business settings.</p>
              
              <div className="bg-slate-50 p-3 rounded-2xl border space-y-2">
                <div className="flex justify-between font-semibold">
                  <span>Business Name:</span>
                  <span className="text-slate-800">{businessSettings?.name || 'Loading...'}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Owner:</span>
                  <span className="text-slate-800">{businessSettings?.ownerName || 'Loading...'}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Footer:</span>
                  <span className="text-slate-800 truncate max-w-40">{businessSettings?.footerText || 'Loading...'}</span>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setShowSettingsModal(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* 3. ADD CUSTOMER MODAL */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-800 border rounded-3xl w-full max-w-sm p-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-2 mb-4">
              <span className="text-sm font-bold text-slate-800">Add New Customer</span>
              <button onClick={() => setShowAddCustomerModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomerSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Customer Name</label>
                <input
                  type="text"
                  required
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  placeholder="e.g. පද්මා මහත්මිය"
                  className="w-full border rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Phone Number</label>
                <input
                  type="text"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  placeholder="e.g. 0766184030"
                  className="w-full border rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Address</label>
                <input
                  type="text"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  placeholder="e.g. Negombo"
                  className="w-full border rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Party Type</label>
                <select
                  value={newCustomer.type}
                  onChange={(e) => setNewCustomer({ ...newCustomer, type: e.target.value })}
                  className="w-full border rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="CUSTOMER">Customer</option>
                  <option value="SUPPLIER">Supplier</option>
                  <option value="BOTH">Both</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="flex-1 py-2 border rounded-xl hover:bg-slate-50 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. ADD PRODUCT MODAL */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-800 border rounded-3xl w-full max-w-sm p-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-2 mb-4">
              <span className="text-sm font-bold text-slate-800">Add New Product</span>
              <button onClick={() => setShowAddProductModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddProductSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="e.g. Coconut / Copra / Husk"
                  className="w-full border rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Default Unit</label>
                <select
                  value={newProduct.unit}
                  onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                  className="w-full border rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500 font-semibold text-slate-700"
                >
                  <option value="Unit">Unit</option>
                  <option value="Kg">Kg</option>
                  <option value="Husk">Husk</option>
                  <option value="Piece">Piece</option>
                  <option value="Load">Load</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Default Rate (LKR)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newProduct.defaultRate}
                  onChange={(e) => setNewProduct({ ...newProduct, defaultRate: e.target.value })}
                  placeholder="e.g. 80.00"
                  className="w-full border rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500 font-semibold"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="flex-1 py-2 border rounded-xl hover:bg-slate-50 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. VIEW INVOICE DETAIL MODAL */}
      {selectedHistoryInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-800 border rounded-3xl w-full max-w-sm p-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b pb-2 mb-4 shrink-0">
              <span className="text-sm font-bold text-slate-800">
                Invoice Details - {selectedHistoryInvoice.invoiceNumber}
              </span>
              <button 
                onClick={() => setSelectedHistoryInvoice(null)} 
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable invoice details */}
            <div className="flex-1 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2 text-slate-500 bg-slate-50 p-3 rounded-2xl border">
                <div>
                  <p>Customer:</p>
                  <p className="font-bold text-slate-800">{selectedHistoryInvoice.customerName}</p>
                </div>
                <div>
                  <p>Date:</p>
                  <p className="font-bold text-slate-800">
                    {new Date(selectedHistoryInvoice.date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p>Payment Mode:</p>
                  <p className="font-bold text-slate-800">{selectedHistoryInvoice.paymentMethod}</p>
                </div>
                <div>
                  <p>Created At:</p>
                  <p className="font-bold text-slate-800">
                    {new Date(selectedHistoryInvoice.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <p className="font-bold text-slate-700">Line Items</p>
                <div className="border rounded-2xl overflow-hidden divide-y">
                  {JSON.parse(selectedHistoryInvoice.itemsJson).map((item, index) => (
                    <div key={index} className="p-2.5 flex justify-between items-center bg-slate-50/50">
                      <div>
                        <p className="font-semibold text-slate-800">{item.name}</p>
                        <p className="text-[10px] text-slate-400">{item.qty} {item.unit} x LKR {parseFloat(item.rate).toFixed(2)}</p>
                      </div>
                      <span className="font-bold font-mono text-slate-700">LKR {parseFloat(item.total).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals details */}
              <div className="bg-sky-50 rounded-2xl p-3 border border-sky-100 space-y-1.5 font-semibold text-slate-600">
                <div className="flex justify-between">
                  <span>Sub total:</span>
                  <span>LKR {selectedHistoryInvoice.subTotal.toFixed(2)}</span>
                </div>
                {selectedHistoryInvoice.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount ({selectedHistoryInvoice.discountPercent}%):</span>
                    <span>- LKR {selectedHistoryInvoice.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                {selectedHistoryInvoice.taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Tax ({selectedHistoryInvoice.taxPercent}%):</span>
                    <span>+ LKR {selectedHistoryInvoice.taxAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-slate-800 border-t pt-1.5 text-sm">
                  <span>Total Amount:</span>
                  <span className="text-sky-700 font-mono">LKR {selectedHistoryInvoice.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {selectedHistoryInvoice.notes && (
                <div className="p-3 bg-slate-50 border rounded-2xl">
                  <p className="font-bold text-slate-600 mb-1">Notes / Remarks:</p>
                  <p className="text-slate-500">{selectedHistoryInvoice.notes}</p>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex gap-2 mt-4 pt-3 border-t shrink-0">
              <button
                onClick={() => handleDeleteInvoice(selectedHistoryInvoice.id)}
                className="py-2.5 px-3 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 text-xs font-bold rounded-xl flex items-center justify-center gap-1 border transition-all"
                title="Delete Invoice"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
              
              <button
                onClick={() => handleShareInvoice(selectedHistoryInvoice)}
                className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow"
              >
                <Share2 className="h-4 w-4" /> Share
              </button>

              <button
                onClick={() => handlePrint(selectedHistoryInvoice)}
                className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow"
              >
                <Printer className="h-4 w-4" /> Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden print container - activated via media print queries in index.css */}
      <div id="print-area" className="hidden">
        {printInvoice && (
          <div className="a4-receipt mx-auto">
            {/* Header */}
            <div className="text-center mb-8 border-b-2 border-slate-200 pb-4">
              <h1 className="text-2xl font-bold uppercase tracking-wider text-slate-800">
                {businessSettings?.name || 'JAYALAL COCO'}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                {businessSettings?.secondaryName || 'Quality Coconut Products & Husks'}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                {businessSettings?.address1}, {businessSettings?.address2}
                {businessSettings?.phone1 && ` | Tel: ${businessSettings?.phone1}`}
                {businessSettings?.phone2 && ` / ${businessSettings?.phone2}`}
              </p>
            </div>

            {/* Title */}
            <h2 className="text-lg font-bold text-center uppercase tracking-widest text-slate-800 mb-6">
              {printInvoice.invoiceNumber.startsWith('EST') ? 'ESTIMATE' : 'INVOICE'}
            </h2>

            {/* Metadata Info */}
            <div className="grid grid-cols-2 text-xs mb-6 gap-y-1">
              <div>
                <span className="font-semibold text-slate-500">Bill To: </span>
                <span className="text-slate-800 font-bold">{printInvoice.customerName}</span>
              </div>
              <div className="text-right">
                <span className="font-semibold text-slate-500">Bill No: </span>
                <span className="text-slate-850 font-bold">{printInvoice.invoiceNumber}</span>
              </div>
              <div>
                {/* Empty */}
              </div>
              <div className="text-right">
                <span className="font-semibold text-slate-500">Date: </span>
                <span className="text-slate-800">{new Date(printInvoice.date).toLocaleDateString()}</span>
              </div>
              <div>
                {/* Empty */}
              </div>
              <div className="text-right">
                <span className="font-semibold text-slate-500">Payment Mode: </span>
                <span className="text-slate-800 font-bold">{printInvoice.paymentMethod}</span>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full text-xs border-collapse border-b border-slate-350 mb-6">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-300 text-slate-700">
                  <th className="py-2 text-left w-10">S.No</th>
                  <th className="py-2 text-left">Description</th>
                  <th className="py-2 text-center w-16">Qty</th>
                  <th className="py-2 text-center w-16">Unit</th>
                  <th className="py-2 text-right w-24">Rate</th>
                  <th className="py-2 text-right w-24">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {printInvoice.items.map((item, index) => (
                  <tr key={index} className="text-slate-800">
                    <td className="py-2.5 text-left">{index + 1}</td>
                    <td className="py-2.5 text-left font-medium">{item.name}</td>
                    <td className="py-2.5 text-center">{item.qty}</td>
                    <td className="py-2.5 text-center">{item.unit}</td>
                    <td className="py-2.5 text-right font-mono">{parseFloat(item.rate).toFixed(2)}</td>
                    <td className="py-2.5 text-right font-mono font-bold">{parseFloat(item.total).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals Summary block */}
            <div className="flex justify-end mb-8">
              <div className="w-64 text-xs space-y-1.5 text-slate-600">
                <div className="flex justify-between">
                  <span>Sub Total:</span>
                  <span className="font-mono text-slate-800">LKR {parseFloat(printInvoice.subTotal).toFixed(2)}</span>
                </div>
                {parseFloat(printInvoice.discountAmount) > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Discount ({printInvoice.discountPercent}%):</span>
                    <span className="font-mono">- LKR {parseFloat(printInvoice.discountAmount).toFixed(2)}</span>
                  </div>
                )}
                {parseFloat(printInvoice.taxAmount) > 0 && (
                  <div className="flex justify-between">
                    <span>Tax ({printInvoice.taxPercent}%):</span>
                    <span className="font-mono text-slate-800">+ LKR {parseFloat(printInvoice.taxAmount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-slate-800 border-t border-slate-400 pt-2">
                  <span>Grand Total:</span>
                  <span className="font-mono text-sky-700">LKR {parseFloat(printInvoice.totalAmount).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {printInvoice.notes && (
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 text-[10px] text-slate-500 mb-8 max-w-md">
                <span className="font-bold text-slate-600 block mb-1">Notes / Remarks:</span>
                {printInvoice.notes}
              </div>
            )}

            {/* Footer */}
            <div className="text-center text-[10px] text-slate-400 border-t border-slate-200 pt-4 mt-12">
              <p className="font-medium">{businessSettings?.footerText || 'Thank You! Come Again.'}</p>
              <p className="text-[8px] text-slate-400 mt-1">Generated via Jaye Coco Quick Billing System</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
