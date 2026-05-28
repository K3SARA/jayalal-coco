import React, { useState, useEffect } from 'react';
import api from '../api';
import { 
  Building, 
  Save, 
  CheckCircle, 
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';

export default function BusinessSettings() {
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchBusiness = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings/business');
      setBusiness(res.data);
    } catch (err) {
      setError('ආයතන සැකසුම් ලබා ගැනීමට නොහැකි විය. (Failed to load business settings)');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusiness();
  }, []);

  const handleInputChange = (field, val) => {
    setBusiness({
      ...business,
      [field]: val
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await api.put('/settings/business', business);
      setSuccess('ආයතන විස්තර සාර්ථකව යාවත්කාලීන කරන ලදී! (Business details saved successfully!)');
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

  return (
    <div className="space-y-6 font-sans max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold font-display text-white">ආයතන සැකසුම් / Business Profile Settings</h1>
        <p className="text-slate-400 text-sm mt-1">රිසිට්පතෙහි මුද්‍රණය වන ආයතන විස්තර වෙනස් කරන්න / Edit legal company details, header & footer lines</p>
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
          <Building className="h-5 w-5 text-emerald-400" />
          ආයතනික තොරතුරු / Business Profile Info
        </h2>

        {/* Name Fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">ආයතනයේ නම / Business Name *</label>
            <input
              type="text"
              required
              value={business.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none text-sm text-white"
              placeholder="JAYALAL COCO"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">උප නාමය / Secondary Name</label>
            <input
              type="text"
              value={business.secondaryName || ''}
              onChange={(e) => handleInputChange('secondaryName', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none text-sm text-white"
              placeholder="JS COCO Products"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">හිමිකරුගේ නම / Owner Name</label>
            <input
              type="text"
              value={business.ownerName || ''}
              onChange={(e) => handleInputChange('ownerName', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">ලියාපදිංචි අංකය / Registration Number</label>
            <input
              type="text"
              value={business.regNumber || ''}
              onChange={(e) => handleInputChange('regNumber', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none text-sm text-white"
              placeholder="PV-89012"
            />
          </div>
        </div>

        {/* Address Lines */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">ලිපිනය (පේළිය 1) / Address Line 1</label>
            <input
              type="text"
              value={business.address1 || ''}
              onChange={(e) => handleInputChange('address1', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none text-sm text-white"
              placeholder="No. 12, Negombo Road"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">ලිපිනය (පේළිය 2) / Address Line 2</label>
            <input
              type="text"
              value={business.address2 || ''}
              onChange={(e) => handleInputChange('address2', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none text-sm text-white"
              placeholder="Dankotuwa"
            />
          </div>
        </div>

        {/* Phone Numbers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">දුරකථන අංකය 1 / Phone 1 *</label>
            <input
              type="text"
              required
              value={business.phone1}
              onChange={(e) => handleInputChange('phone1', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none text-sm text-white"
              placeholder="0312234567"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">දුරකථන අංකය 2 / Phone 2</label>
            <input
              type="text"
              value={business.phone2 || ''}
              onChange={(e) => handleInputChange('phone2', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none text-sm text-white"
              placeholder="0771234567"
            />
          </div>
        </div>

        {/* Header/Footer Text */}
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">යටි සටහන (මුද්‍රණය වන) / Footer Print Note</label>
            <textarea
              value={business.footerText || ''}
              onChange={(e) => handleInputChange('footerText', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none text-sm text-white h-20 resize-none"
              placeholder="Thank you for your business!"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-4 border-t border-slate-800">
          <button
            type="submit"
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/10 transition"
          >
            <Save className="h-4.5 w-4.5" />
            ආයතන විස්තර සුරකින්න / Save Profile
          </button>
        </div>
      </form>
    </div>
  );
}
