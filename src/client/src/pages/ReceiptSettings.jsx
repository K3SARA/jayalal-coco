import React, { useState, useEffect } from 'react';
import api from '../api';
import { 
  Receipt, 
  Save, 
  CheckCircle, 
  AlertCircle,
  Eye
} from 'lucide-react';

export default function ReceiptSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings/receipt');
      setSettings(res.data);
    } catch (err) {
      setError('මුද්‍රණ සැකසුම් ලබා ගැනීමට නොහැකි විය. (Failed to load receipt settings)');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleCheckboxChange = (field) => {
    setSettings({
      ...settings,
      [field]: !settings[field]
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await api.put('/settings/receipt', settings);
      setSuccess('මුද්‍රණ සැකසුම් සාර්ථකව යාවත්කාලීන කරන ලදී! (Print settings saved successfully!)');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('යාවත්කාලීන කිරීමට අපොහොසත් විය. (Failed to update settings)');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const checkFields = [
    { key: 'showBusinessName', label: 'ආයතනයේ නම / Show Business Name' },
    { key: 'showOwnerName', label: 'අයිතිකරුගේ නම / Show Owner Name' },
    { key: 'showAddress', label: 'ලිපිනය / Show Address' },
    { key: 'showPhoneNumbers', label: 'දුරකථන අංක / Show Phone Numbers' },
    { key: 'showRegistrationNumber', label: 'ලියාපදිංචි අංකය / Show Registration Number' },
    { key: 'showDateTime', label: 'දිනය සහ වේලාව / Show Date/Time' },
    { key: 'showCustomerName', label: 'ගනුදෙනුකරුගේ නම / Show Customer Name' },
    { key: 'showVehicleNumber', label: 'වාහන අංකය / Show Vehicle Number' },
    { key: 'showProduct', label: 'ද්‍රව්‍ය විස්තර / Show Product Details' },
    { key: 'showFirstWeight', label: 'පළමු බර (Gross) / Show 1st Weight' },
    { key: 'showSecondWeight', label: 'දෙවන බර (Tare) / Show 2nd Weight' },
    { key: 'showNetWeight', label: 'ශුද්ධ බර (Net) / Show Net Weight' },
    { key: 'showOperatorName', label: 'ක්‍රියාකරු / Show Operator Name' },
    { key: 'showDriverName', label: 'රියදුරු නම / Show Driver Name' },
    { key: 'showCustomerSignature', label: 'ගනුදෙනුකරුගේ අත්සන / Show Customer Signature' },
    { key: 'showDriverSignature', label: 'රියදුරුගේ අත්සන / Show Driver Signature' },
    { key: 'showFooter', label: 'යටි සටහන / Show Footer Text' },
  ];

  return (
    <div className="space-y-6 font-sans max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold font-display text-white">මුද්‍රණ සැකසුම් / Receipt Template Options</h1>
        <p className="text-slate-400 text-sm mt-1">රිසිට්පතෙහි පෙන්විය යුතු තොරතුරු තෝරන්න / Customize thermal and A4 printed invoice fields</p>
      </div>

      {error && (
        <div className="bg-rose-950/40 border border-rose-800 p-4 rounded-xl text-rose-200 text-sm flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-emerald-950/40 border border-emerald-800 p-4 rounded-xl text-emerald-300 text-sm flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <Receipt className="h-5 w-5 text-emerald-400" />
          මුද්‍රණ සැකසුම් පුවරුව / Toggle Fields
        </h2>

        {/* Checkbox fields grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {checkFields.map((field) => (
            <div key={field.key} className="flex items-start gap-3 p-3 bg-slate-950/40 border border-slate-850 hover:border-slate-800 rounded-xl transition duration-150">
              <input
                type="checkbox"
                id={field.key}
                checked={settings[field.key]}
                onChange={() => handleCheckboxChange(field.key)}
                className="mt-1 rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-emerald-500 h-4 w-4 transition"
              />
              <label htmlFor={field.key} className="text-sm text-slate-300 font-medium select-none cursor-pointer">
                {field.label}
              </label>
            </div>
          ))}
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-4 border-t border-slate-800">
          <button
            type="submit"
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/10 transition"
          >
            <Save className="h-4.5 w-4.5" />
            සැකසුම් සුරකින්න / Save Print Configuration
          </button>
        </div>
      </form>
    </div>
  );
}
