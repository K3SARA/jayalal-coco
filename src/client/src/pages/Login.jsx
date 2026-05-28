import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Lock, User, AlertCircle } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Run auto-setup on load to make sure admin exists
  useEffect(() => {
    const autoSetup = async () => {
      try {
        await axios.post('/api/auth/setup-admin');
      } catch (err) {
        // Ignored if already setup
      }
    };

    // If already logged in, redirect
    const token = localStorage.getItem('jayalal_coco_token');
    if (token) {
      navigate('/');
    } else {
      autoSetup();
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/login', { username, password });
      
      const { token, user } = response.data;
      localStorage.setItem('jayalal_coco_token', token);
      localStorage.setItem('jayalal_coco_user', JSON.stringify(user));
      
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'ලොගින් වීමට නොහැක. නැවත උත්සාහ කරන්න. (Login Failed)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <span className="inline-flex bg-emerald-500 text-slate-950 p-4 rounded-2xl text-4xl mb-4 shadow-xl shadow-emerald-500/10">🥥</span>
        <h2 className="text-3xl font-bold font-display text-white tracking-tight">JAYALAL COCO</h2>
        <p className="mt-2 text-sm text-slate-400">
          කළමනාකරණ පද්ධතිය / Management System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 border border-slate-800 py-8 px-4 shadow-2xl rounded-2xl sm:px-10 mx-4 sm:mx-0">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-rose-950/40 border border-rose-800 text-rose-200 text-sm p-4 rounded-xl flex items-start gap-3">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-300">
                පරිශීලක නාමය / Username
              </label>
              <div className="mt-2 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="h-5 w-5" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  placeholder="admin"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                මුරපදය / Password
              </label>
              <div className="mt-2 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 shadow-lg shadow-emerald-500/10"
              >
                {loading ? 'ලොග් වෙමින් පවතී...' : 'ලොග් වන්න / Sign In'}
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-800 pt-6 text-center">
            <span className="text-xs text-slate-500">
              Default: admin / admin123
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
