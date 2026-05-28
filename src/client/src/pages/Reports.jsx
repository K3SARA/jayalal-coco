import React, { useState, useEffect } from 'react';
import api from '../api';
import { 
  FileText, 
  Calendar, 
  Printer, 
  Download, 
  Search, 
  TrendingUp, 
  TrendingDown,
  Scale,
  CircleDollarSign,
  DollarSign
} from 'lucide-react';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('daily'); // 'daily' or 'pl'

  // Daily report states
  const [dailyDate, setDailyDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyData, setDailyData] = useState(null);
  const [dailyLoading, setDailyLoading] = useState(false);

  // Profit/Loss states
  const [plStartDate, setPlStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [plEndDate, setPlEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [plData, setPlData] = useState(null);
  const [plLoading, setPlLoading] = useState(false);

  const [business, setBusiness] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        const res = await api.get('/settings/business');
        setBusiness(res.data);
      } catch (err) {
        // Ignored
      }
    };
    fetchBusiness();
  }, []);

  const runDailyReport = async () => {
    setError('');
    setDailyLoading(true);
    try {
      const res = await api.get(`/reports/daily`, { params: { date: dailyDate } });
      setDailyData(res.data);
    } catch (err) {
      setError('දෛනික වාර්තාව සැකසීමට නොහැකි විය. (Failed to load daily report)');
    } finally {
      setDailyLoading(false);
    }
  };

  const runPLReport = async () => {
    setError('');
    setPlLoading(true);
    try {
      const res = await api.get(`/reports/profit-loss`, {
        params: { startDate: plStartDate, endDate: plEndDate }
      });
      setPlData(res.data);
    } catch (err) {
      setError('ලාභාලාභ වාර්තාව සැකසීමට නොහැකි විය. (Failed to load Profit & Loss report)');
    } finally {
      setPlLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'daily') {
      runDailyReport();
    } else {
      runPLReport();
    }
  }, [activeTab]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('si-LK', {
      style: 'currency',
      currency: 'LKR'
    }).format(amount || 0);
  };

  const handlePrint = () => {
    window.print();
  };

  const exportDailyCSV = () => {
    if (!dailyData) return;
    
    let csvRows = [];
    csvRows.push(['Daily Activity Report for', dailyDate]);
    csvRows.push([]);

    // Coconut Section
    csvRows.push(['COCONUT WEIGHBRIDGE LOGS']);
    csvRows.push(['Receipt', 'Customer', 'Vehicle', 'Net Weight (kg)', 'Rate (LKR)', 'Amount (LKR)']);
    dailyData.coconut.forEach(e => {
      csvRows.push([e.receiptNumber, e.customer.name, e.vehicleNumber || '', e.netWeight, e.ratePerKg || 0, e.totalAmount]);
    });
    csvRows.push([]);

    // Husk Section
    csvRows.push(['COCO HUSK WEIGHBRIDGE LOGS']);
    csvRows.push(['Receipt', 'Customer', 'Vehicle', 'Net Weight (kg)', 'Rate (LKR)', 'Amount (LKR)']);
    dailyData.husk.forEach(e => {
      csvRows.push([e.receiptNumber, e.customer.name, e.vehicleNumber || '', e.totalWeightKg || 0, e.ratePerHusk || 0, e.expectedIncome]);
    });
    csvRows.push([]);

    // Expenses Section
    csvRows.push(['OPERATIONAL EXPENSES']);
    csvRows.push(['Category', 'Paid To', 'Description', 'Amount (LKR)']);
    dailyData.expenses.forEach(e => {
      csvRows.push([e.category, e.paidTo || '', e.description || '', e.amount]);
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `daily_report_${dailyDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Printable area */}
      <div id="print-area" className="hidden">
        <div className="a4-receipt">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold uppercase">{business?.name || 'JAYALAL COCO'}</h1>
            <p className="text-xs uppercase">{business?.secondaryName || 'JS COCO Products'}</p>
            <p className="text-xs">{business?.address1}, {business?.address2}</p>
            <p className="text-xs">Phones: {business?.phone1} | {business?.phone2}</p>
            <hr className="border-black my-4" />
          </div>

          {activeTab === 'daily' && dailyData && (
            <div>
              <h2 className="text-lg font-bold text-center underline uppercase mb-6">Daily Activity Statement - {dailyDate}</h2>
              
              <h3 className="font-bold text-sm border-b border-black pb-1 mb-2">1. COCONUT RECEIPTS / පොල් කිරුම්</h3>
              <table className="min-w-full text-xs border border-collapse border-black mb-6">
                <thead>
                  <tr className="bg-gray-100 border-b border-black">
                    <th className="border border-black px-2 py-1 text-left">Receipt</th>
                    <th className="border border-black px-2 py-1 text-left">Party</th>
                    <th className="border border-black px-2 py-1 text-right">Net Weight</th>
                    <th className="border border-black px-2 py-1 text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyData.coconut.map((e, idx) => (
                    <tr key={idx} className="border-b border-black">
                      <td className="border border-black px-2 py-1 font-mono">{e.receiptNumber}</td>
                      <td className="border border-black px-2 py-1">{e.customer.name}</td>
                      <td className="border border-black px-2 py-1 text-right font-mono">{e.netWeight.toLocaleString()} kg</td>
                      <td className="border border-black px-2 py-1 text-right font-mono">{formatCurrency(e.totalAmount)}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-bold border-t border-black">
                    <td colSpan="2" className="border border-black px-2 py-1">Total Coconut Logs</td>
                    <td className="border border-black px-2 py-1 text-right font-mono">{dailyData.coconut.reduce((s,e)=>s+e.netWeight,0).toLocaleString()} kg</td>
                    <td className="border border-black px-2 py-1 text-right font-mono">{formatCurrency(dailyData.coconut.reduce((s,e)=>s+e.totalAmount,0))}</td>
                  </tr>
                </tbody>
              </table>

              <h3 className="font-bold text-sm border-b border-black pb-1 mb-2">2. COCO HUSK RECEIPTS / ලෙලි කිරුම්</h3>
              <table className="min-w-full text-xs border border-collapse border-black mb-6">
                <thead>
                  <tr className="bg-gray-100 border-b border-black">
                    <th className="border border-black px-2 py-1 text-left">Receipt</th>
                    <th className="border border-black px-2 py-1 text-left">Party</th>
                    <th className="border border-black px-2 py-1 text-right">Net Weight</th>
                    <th className="border border-black px-2 py-1 text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyData.husk.map((e, idx) => (
                    <tr key={idx} className="border-b border-black">
                      <td className="border border-black px-2 py-1 font-mono">{e.receiptNumber}</td>
                      <td className="border border-black px-2 py-1">{e.customer.name}</td>
                      <td className="border border-black px-2 py-1 text-right font-mono">{(e.totalWeightKg || 0).toLocaleString()} kg</td>
                      <td className="border border-black px-2 py-1 text-right font-mono">{formatCurrency(e.expectedIncome)}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-bold border-t border-black">
                    <td colSpan="2" className="border border-black px-2 py-1">Total Husk Logs</td>
                    <td className="border border-black px-2 py-1 text-right font-mono">{(dailyData.husk.reduce((s,e)=>s+(e.totalWeightKg || 0),0)).toLocaleString()} kg</td>
                    <td className="border border-black px-2 py-1 text-right font-mono">{formatCurrency(dailyData.husk.reduce((s,e)=>s+(e.expectedIncome || 0),0))}</td>
                  </tr>
                </tbody>
              </table>

              <h3 className="font-bold text-sm border-b border-black pb-1 mb-2">3. GENERAL / ALL EXPENSES / වියදම්</h3>
              <table className="min-w-full text-xs border border-collapse border-black">
                <thead>
                  <tr className="bg-gray-100 border-b border-black">
                    <th className="border border-black px-2 py-1 text-left">Category</th>
                    <th className="border border-black px-2 py-1 text-left">Paid To</th>
                    <th className="border border-black px-2 py-1 text-left">Description</th>
                    <th className="border border-black px-2 py-1 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyData.expenses.map((e, idx) => (
                    <tr key={idx} className="border-b border-black">
                      <td className="border border-black px-2 py-1 uppercase font-semibold">{e.category}</td>
                      <td className="border border-black px-2 py-1">{e.paidTo || '-'}</td>
                      <td className="border border-black px-2 py-1">{e.description || '-'}</td>
                      <td className="border border-black px-2 py-1 text-right font-mono">{formatCurrency(e.amount)}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-bold border-t border-black">
                    <td colSpan="3" className="border border-black px-2 py-1">Total Expenses</td>
                    <td className="border border-black px-2 py-1 text-right font-mono">{formatCurrency(dailyData.expenses.reduce((s,e)=>s+e.amount,0))}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'pl' && plData && (
            <div>
              <h2 className="text-lg font-bold text-center underline uppercase mb-6">
                Profit & Loss Statement ({plStartDate} to {plEndDate})
              </h2>

              <div className="space-y-4 border border-black p-6 rounded-lg text-sm font-mono">
                <div className="flex justify-between border-b border-black pb-2 font-bold">
                  <span>REVENUE / SALES / බලාපොරොත්තු ආදායම</span>
                  <span>{formatCurrency(plData.revenue)}</span>
                </div>
                <div className="pl-4 space-y-1">
                  <div className="flex justify-between text-xs text-slate-700">
                    <span>• Coconut weighbridge sales logs:</span>
                    <span>{formatCurrency(plData.details.coconutSales)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-700">
                    <span>• Husk weighbridge sales logs:</span>
                    <span>{formatCurrency(plData.details.huskSales)}</span>
                  </div>
                </div>

                <div className="flex justify-between border-b border-black pb-2 pt-4 font-bold text-red-900">
                  <span>LESS: COST OF PURCHASES / අමුද්‍රව්‍ය මිලදීගැනීම්</span>
                  <span>({formatCurrency(plData.details.coconutPurchases + plData.details.huskPurchases)})</span>
                </div>
                <div className="pl-4 space-y-1 text-xs text-slate-700">
                  <div className="flex justify-between">
                    <span>• Coconut raw purchases (Supplier entries):</span>
                    <span>{formatCurrency(plData.details.coconutPurchases)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• Husk raw purchases (Supplier entries):</span>
                    <span>{formatCurrency(plData.details.huskPurchases)}</span>
                  </div>
                </div>

                <div className="flex justify-between border-b border-black pb-2 pt-4 font-bold text-red-900">
                  <span>LESS: OPERATING EXPENSES / මෙහෙයුම් වියදම්</span>
                  <span>({formatCurrency(plData.expenses)})</span>
                </div>
                <div className="pl-4 space-y-1 text-xs text-slate-700">
                  <div className="flex justify-between">
                    <span>• Standalone wages, fuel, repairs, transport:</span>
                    <span>{formatCurrency(plData.expenses)}</span>
                  </div>
                </div>

                <div className="flex justify-between border-t border-black pt-4 text-lg font-bold">
                  <span>NET ESTIMATED PROFIT (LOSS) / ශුද්ධ ලාභය:</span>
                  <span className={plData.profitLoss >= 0 ? 'text-emerald-800' : 'text-rose-800'}>
                    {formatCurrency(plData.profitLoss)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mt-20 text-sm">
            <div className="text-center w-48 border-t border-black pt-2">
              <p>Operator Signature</p>
            </div>
            <div className="text-center w-48 border-t border-black pt-2">
              <p>Auditor Signature</p>
            </div>
          </div>
        </div>
      </div>

      {/* Screen view */}
      <div>
        <h1 className="text-3xl font-bold font-display text-white">ව්‍යාපාරික වාර්තා / Reports Runner</h1>
        <p className="text-slate-400 text-sm mt-1">දෛනික මෙහෙයුම් සහ ලාභාලාභ විග්‍රහය / System audits & accounting statements</p>
      </div>

      {error && (
        <div className="bg-rose-950/40 border border-rose-800 p-4 rounded-xl text-rose-200 text-sm font-sans">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-800">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('daily')}
            className={`py-3.5 px-4 font-semibold text-sm border-b-2 transition ${
              activeTab === 'daily' ? 'border-emerald-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            දෛනික ගනුදෙනු ලේඛනය / Daily Activity
          </button>
          <button
            onClick={() => setActiveTab('pl')}
            className={`py-3.5 px-4 font-semibold text-sm border-b-2 transition ${
              activeTab === 'pl' ? 'border-emerald-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            ලාභාලාභ ගිණුම / Profit & Loss Statement
          </button>
        </div>
      </div>

      {/* Daily tab runner inputs */}
      {activeTab === 'daily' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-wrap gap-4 items-center justify-between shadow">
            <div className="flex items-center gap-4">
              <Calendar className="h-5 w-5 text-emerald-400" />
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">දිනය තෝරන්න / Date</label>
                <input
                  type="date"
                  value={dailyDate}
                  onChange={(e) => setDailyDate(e.target.value)}
                  className="bg-slate-950 border border-slate-850 px-4 py-2 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={runDailyReport}
                className="flex items-center gap-1.5 px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold transition"
              >
                <Search className="h-4.5 w-4.5" />
                වාර්තාව සකසන්න / Run Report
              </button>
              {dailyData && (
                <>
                  <button
                    onClick={exportDailyCSV}
                    className="flex items-center gap-1.5 px-3 py-3 bg-slate-950 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs transition"
                  >
                    <Download className="h-4.5 w-4.5" />
                    CSV Export
                  </button>
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-1.5 px-3 py-3 bg-slate-950 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs transition"
                  >
                    <Printer className="h-4.5 w-4.5" />
                    A4 Print
                  </button>
                </>
              )}
            </div>
          </div>

          {dailyLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
          ) : !dailyData ? (
            <div className="bg-slate-900 border border-slate-800 p-12 text-center rounded-2xl">
              <FileText className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">කරුණාකර දින එකක් තෝරා වාර්තාව ක්‍රියාත්මක කරන්න. (Select date and run report)</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Daily Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900 border border-slate-850 p-6 rounded-2xl">
                  <span className="text-xs text-slate-400 uppercase font-semibold block mb-1">Total Coconut Net Weight</span>
                  <span className="text-2xl font-bold text-white font-mono">
                    {dailyData.coconut.reduce((s,e)=>s+e.netWeight,0).toLocaleString()} kg
                  </span>
                </div>
                <div className="bg-slate-900 border border-slate-850 p-6 rounded-2xl">
                  <span className="text-xs text-slate-400 uppercase font-semibold block mb-1">Total Coco Husk Net Weight</span>
                  <span className="text-2xl font-bold text-white font-mono">
                    {(dailyData.husk.reduce((s,e)=>s+(e.totalWeightKg || 0),0)).toLocaleString()} kg
                  </span>
                </div>
                <div className="bg-slate-900 border border-slate-850 p-6 rounded-2xl">
                  <span className="text-xs text-slate-400 uppercase font-semibold block mb-1">Today's Operating Costs</span>
                  <span className="text-2xl font-bold text-rose-455 font-mono">
                    {formatCurrency(dailyData.expenses.reduce((s,e)=>s+e.amount,0))}
                  </span>
                </div>
              </div>

              {/* Coconut Table preview */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow overflow-hidden">
                <div className="px-6 py-4 bg-slate-950 border-b border-slate-850">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <Scale className="h-4.5 w-4.5 text-emerald-400" />
                    Coconut Weighings
                  </h3>
                </div>
                {dailyData.coconut.length === 0 ? (
                  <p className="p-6 text-slate-500 text-xs text-center">No coconut logs found for this date.</p>
                ) : (
                  <div>
                    {/* Mobile Card List */}
                    <div className="grid grid-cols-1 gap-3 p-4 md:hidden">
                      {dailyData.coconut.map((e, idx) => (
                        <div key={idx} className="bg-slate-900/60 border border-slate-850 rounded-xl p-3.5 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-white">{e.customer.name}</span>
                            <span className="font-mono text-slate-500">No: {e.receiptNumber}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-855">
                            <div>
                              <span className="block text-slate-500 text-[9px] uppercase font-bold">Net Weight</span>
                              <span className="font-mono text-slate-300">{e.netWeight.toLocaleString()} kg</span>
                            </div>
                            <div className="text-right">
                              <span className="block text-slate-500 text-[9px] uppercase font-bold">Total Amount</span>
                              <span className="font-mono text-emerald-450 font-semibold">{formatCurrency(e.totalAmount)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="min-w-full text-xs text-left">
                        <thead className="bg-slate-950">
                          <tr>
                            <th className="px-6 py-3 font-semibold text-slate-400">Receipt</th>
                            <th className="px-6 py-3 font-semibold text-slate-400">Customer</th>
                            <th className="px-6 py-3 text-right font-semibold text-slate-400">Net Weight</th>
                            <th className="px-6 py-3 text-right font-semibold text-slate-400">Total Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {dailyData.coconut.map((e, idx) => (
                            <tr key={idx} className="hover:bg-slate-850">
                              <td className="px-6 py-3 font-mono">{e.receiptNumber}</td>
                              <td className="px-6 py-3 font-medium text-white">{e.customer.name}</td>
                              <td className="px-6 py-3 text-right font-mono">{e.netWeight.toLocaleString()} kg</td>
                              <td className="px-6 py-3 text-right font-mono text-white">{formatCurrency(e.totalAmount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Husk Table preview */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow overflow-hidden">
                <div className="px-6 py-4 bg-slate-950 border-b border-slate-850">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <Scale className="h-4.5 w-4.5 text-cyan-400" />
                    Coco Husk Weighings
                  </h3>
                </div>
                {dailyData.husk.length === 0 ? (
                  <p className="p-6 text-slate-500 text-xs text-center">No husk logs found for this date.</p>
                ) : (
                  <div>
                    {/* Mobile Card List */}
                    <div className="grid grid-cols-1 gap-3 p-4 md:hidden">
                      {dailyData.husk.map((e, idx) => (
                        <div key={idx} className="bg-slate-900/60 border border-slate-850 rounded-xl p-3.5 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-white">{e.customer.name}</span>
                            <span className="font-mono text-slate-500">No: {e.receiptNumber}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-855">
                            <div>
                              <span className="block text-slate-500 text-[9px] uppercase font-bold">Net Weight</span>
                              <span className="font-mono text-slate-300">{(e.totalWeightKg || 0).toLocaleString()} kg</span>
                            </div>
                            <div className="text-right">
                              <span className="block text-slate-500 text-[9px] uppercase font-bold">Total Amount</span>
                              <span className="font-mono text-emerald-450 font-semibold">{formatCurrency(e.expectedIncome)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="min-w-full text-xs text-left">
                        <thead className="bg-slate-950">
                          <tr>
                            <th className="px-6 py-3 font-semibold text-slate-400">Receipt</th>
                            <th className="px-6 py-3 font-semibold text-slate-400">Customer</th>
                            <th className="px-6 py-3 text-right font-semibold text-slate-400">Net Weight</th>
                            <th className="px-6 py-3 text-right font-semibold text-slate-400">Total Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {dailyData.husk.map((e, idx) => (
                            <tr key={idx} className="hover:bg-slate-850">
                              <td className="px-6 py-3 font-mono">{e.receiptNumber}</td>
                              <td className="px-6 py-3 font-medium text-white">{e.customer.name}</td>
                              <td className="px-6 py-3 text-right font-mono">{(e.totalWeightKg || 0).toLocaleString()} kg</td>
                              <td className="px-6 py-3 text-right font-mono text-white">{formatCurrency(e.expectedIncome)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Profit & Loss statement tab */}
      {activeTab === 'pl' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-wrap gap-4 items-center justify-between shadow">
            <div className="flex flex-wrap items-center gap-4 font-sans">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-emerald-400" />
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Start Date</label>
                  <input
                    type="date"
                    value={plStartDate}
                    onChange={(e) => setPlStartDate(e.target.value)}
                    className="bg-slate-950 border border-slate-850 px-4 py-2 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">End Date</label>
                  <input
                    type="date"
                    value={plEndDate}
                    onChange={(e) => setPlEndDate(e.target.value)}
                    className="bg-slate-950 border border-slate-850 px-4 py-2 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={runPLReport}
                className="flex items-center gap-1.5 px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold transition"
              >
                <Search className="h-4.5 w-4.5" />
                විශ්ලේෂණය කරන්න / Run P&L
              </button>
              {plData && (
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-3 bg-slate-950 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs transition"
                >
                  <Printer className="h-4.5 w-4.5" />
                  A4 Print P&L
                </button>
              )}
            </div>
          </div>

          {plLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
          ) : !plData ? (
            <div className="bg-slate-900 border border-slate-800 p-12 text-center rounded-2xl">
              <CircleDollarSign className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">කාල පරාසය තෝරා ලාභාලාභ ගිණුම සකසන්න. (Select range and run statement)</p>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl max-w-2xl mx-auto">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-white tracking-tight">ලාභාලාභ ප්‍රකාශය / Profit & Loss Statement</h3>
                <p className="text-xs text-slate-500 mt-1">Period: {plStartDate} to {plEndDate}</p>
              </div>

              <div className="space-y-4 border-t border-slate-800 pt-6 text-sm">
                {/* Revenue */}
                <div className="flex justify-between items-center text-base font-bold text-white pb-2 border-b border-slate-850">
                  <span>Gross Sales Income / ලැබුණු හෝ ලැබීමට ඇති මුළු ආදායම</span>
                  <span className="text-emerald-450 font-mono">{formatCurrency(plData.revenue)}</span>
                </div>
                <div className="pl-4 space-y-1.5 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>• Coconut Lot Logs:</span>
                    <span className="font-mono">{formatCurrency(plData.details.coconutSales)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• Coco Husk Lot Logs:</span>
                    <span className="font-mono">{formatCurrency(plData.details.huskSales)}</span>
                  </div>
                </div>

                {/* Purchases Cost */}
                <div className="flex justify-between items-center text-sm font-bold text-slate-200 pb-2 border-b border-slate-850 pt-4">
                  <span>Less: Direct Lot Purchases / අමුද්‍රව්‍ය මිලදී ගැනීමේ වියදම්</span>
                  <span className="text-rose-400 font-mono">({formatCurrency(plData.details.coconutPurchases + plData.details.huskPurchases)})</span>
                </div>
                <div className="pl-4 space-y-1.5 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>• Raw Coconut buys:</span>
                    <span className="font-mono">{formatCurrency(plData.details.coconutPurchases)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• Raw Husk buys:</span>
                    <span className="font-mono">{formatCurrency(plData.details.huskPurchases)}</span>
                  </div>
                </div>

                {/* Operating Costs */}
                <div className="flex justify-between items-center text-sm font-bold text-slate-200 pb-2 border-b border-slate-850 pt-4">
                  <span>Less: Operational Expenses / මෙහෙයුම් වියදම්</span>
                  <span className="text-rose-400 font-mono">({formatCurrency(plData.expenses)})</span>
                </div>
                <div className="pl-4 space-y-1.5 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>• Salaries, fuel, transport, repairs, misc:</span>
                    <span className="font-mono">{formatCurrency(plData.expenses)}</span>
                  </div>
                </div>

                {/* Profit/Loss summation */}
                <div className={`mt-8 p-4 rounded-xl flex items-center justify-between border ${
                  plData.profitLoss >= 0 
                    ? 'bg-emerald-950/30 border-emerald-800 text-emerald-400' 
                    : 'bg-rose-950/30 border-rose-800 text-rose-455'
                }`}>
                  <span className="font-bold text-sm">Net Expected Profit (Loss) / ඇස්තමේන්තුගත ලාභය:</span>
                  <span className="text-xl font-bold font-mono">
                    {formatCurrency(plData.profitLoss)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
