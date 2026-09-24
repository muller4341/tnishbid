import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Phone, Lock, AlertCircle, ArrowLeft, Smartphone, Crown } from 'lucide-react';

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
      setError('Phone number must start with 09 or 07 and have 10 digits (e.g. 0912345678 or 0712345678)');
      return;
    }

    try {
      await login(cleanPhone, password);
      navigate(redirectPath);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check phone number and password.');
    }
  };

  return (
    <div className="max-w-md mx-auto py-4 sm:py-8 space-y-4">
      {/* Back to Home Button */}
      <Link 
        to="/" 
        className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-300 hover:text-white bg-[#16161A] px-3.5 py-2 rounded-2xl border border-zinc-800 shadow-sm transition-all"
      >
        <ArrowLeft size={14} className="text-amber-400" />
        Back to Public Catalog
      </Link>

      <div className="bg-[#16161A] rounded-3xl shadow-2xl p-6 md:p-8 border border-zinc-800/90 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#111113] border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400 shadow-inner">
            <Crown size={24} />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Phone Sign In</h1>
          <p className="text-xs text-zinc-400">Sign in with your phone number to place unique bids</p>
        </div>

        {location.state?.message && (
          <div className="p-3.5 bg-amber-950/40 text-amber-200 rounded-2xl text-xs border border-amber-800/50 flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-400" />
            <span>{location.state.message}</span>
          </div>
        )}
        
        {error && (
          <div className="p-3.5 bg-red-950/40 text-red-300 rounded-2xl text-xs border border-red-800/50 flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-400" />
            <span>{error}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">Phone Number (Ethiopian)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Phone className="h-4 w-4 text-amber-400" />
              </div>
              <input
                type="tel"
                required
                maxLength={10}
                className="w-full pl-10 pr-4 py-3 bg-[#111113] border border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm font-mono font-bold text-white transition-all"
                placeholder="0912345678 or 0712345678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
            <p className="mt-1 text-[10px] text-zinc-500">Must start with 09 or 07 (10 digits)</p>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-amber-400" />
              </div>
              <input
                type="password"
                required
                className="w-full pl-10 pr-4 py-3 bg-[#111113] border border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm font-medium text-white transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          
          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-amber-600 hover:brightness-110 text-black rounded-2xl font-black text-xs uppercase tracking-wider shadow-md shadow-amber-500/10 transition-all active:scale-[0.98] flex justify-center items-center gap-2"
          >
            <Smartphone size={16} />
            Sign In with Phone
          </button>
        </form>
        
        <div className="text-center text-xs text-zinc-400 pt-4 border-t border-zinc-800/80">
          Don't have a phone account?{' '}
          <Link to="/register" state={{ from: redirectPath }} className="text-amber-400 font-extrabold hover:underline">
            Register Phone
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
