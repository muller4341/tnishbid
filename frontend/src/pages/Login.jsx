import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Phone, Lock, AlertCircle } from 'lucide-react';

const PHONE_REGEX = /^(09|07)\d{8}$/;

const Login = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanPhone = phoneNumber.trim();
    if (!PHONE_REGEX.test(cleanPhone)) {
      setError('Phone number must start with 09 or 07 and be followed by 8 digits (e.g. 0912345678 or 0712345678)');
      return;
    }

    try {
      await login(cleanPhone, password);
      navigate(redirectPath);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Welcome Back</h1>
        <p className="text-slate-500">Sign in with your phone number to place unique bids</p>
      </div>

      {location.state?.message && (
        <div className="mb-6 p-3 bg-amber-50 text-amber-700 rounded-lg text-sm border border-amber-200 flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{location.state.message}</span>
        </div>
      )}
      
      {error && <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">{error}</div>}
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone Number</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Phone className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="tel"
              required
              maxLength={10}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
              placeholder="0912345678 or 0712345678"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>
          <p className="mt-1 text-xs text-slate-400">Must start with 09 or 07 (10 digits in total)</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="password"
              required
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>
        
        <button
          type="submit"
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-md shadow-indigo-200 transition-all active:scale-[0.98]"
        >
          Sign In
        </button>
      </form>
      
      <p className="mt-6 text-center text-slate-500 text-sm">
        Don't have an account? <Link to="/register" state={{ from: redirectPath }} className="text-indigo-600 font-semibold hover:underline">Create one</Link>
      </p>
    </div>
  );
};

export default Login;
