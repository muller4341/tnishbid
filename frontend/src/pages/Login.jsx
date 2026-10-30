import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Phone, Lock, AlertCircle, ArrowLeft, Smartphone, Loader2 } from 'lucide-react';
import logoDark from '../assets/logo1.png';
import logoLight from '../assets/logo2.png';

const PHONE_REGEX = /^(09|07)\d{8}$/;

const Login = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isSubmitting = useRef(false);

  const redirectPath = location.state?.from || '/';

  // If user is already logged in (e.g. pressed browser back button),
  // redirect them away — but NOT after a form login (handled by handleSubmit)
  useEffect(() => {
    if (user && !isSubmitting.current) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');

    const cleanPhone = phoneNumber.trim();
    if (!PHONE_REGEX.test(cleanPhone)) {
      setError('Phone number must start with 09 and have 10 digits (e.g. 09******** )');
      return;
    }

    try {
      setLoading(true);
      isSubmitting.current = true;
      const loggedUser = await login(cleanPhone, password);
      if (loggedUser && loggedUser.role === 'admin') {
        navigate('/admin');
      } else {
        navigate(redirectPath, {
          state: {
            bidAmount: location.state?.bidAmount,
            autoOpenConfirm: location.state?.autoOpenConfirm,
          }
        });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check phone number and password.');
    } finally {
      setLoading(false);
      isSubmitting.current = false;
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
          <Link to="/" className="inline-block group focus:outline-none">
            <div className="relative inline-flex items-center justify-center p-2 rounded-2xl group-hover:border-amber-500/40 transition-colors">
              <img
                src={theme === 'light' ? logoLight : logoDark}
                alt="ትንሽBid"
                className="h-12 sm:h-12 w-auto object-contain transition-transform group-hover:scale-105 filter drop-shadow-[0_2px_10px_rgba(245,158,11,0.2)]"
              />
            </div>
          </Link>
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-white tracking-tight">Phone Sign In</h1>
          </div>
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
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">Phone Number </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Phone className="h-4 w-4 text-amber-400" />
              </div>
              <input
                type="tel"
                required
                disabled={loading}
                maxLength={10}
                style={{ fontSize: '16px' }}
                className="w-full pl-10 pr-4 py-3 bg-[#111113] border border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-[16px] font-mono font-bold text-white transition-all disabled:opacity-60"
                placeholder="09xxxxxxxx"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
            <p className="mt-1 text-[10px] text-zinc-500">Must start with 09  (10 digits)</p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold text-zinc-300">Password</label>

            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-amber-400" />
              </div>
              <input
                type="password"
                required
                disabled={loading}
                style={{ fontSize: '16px' }}
                className="w-full pl-10 pr-4 py-3 bg-[#111113] border border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-[16px] font-medium text-white transition-all disabled:opacity-60"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className='flex justify-end py-4'>
              <Link
                to="/forgot-password"
                className="text-xs font-bold text-amber-400 hover:text-amber-300 hover:underline transition-colors justify-end"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 bg-gradient-to-r from-amber-400 to-amber-600 hover:brightness-110 text-black rounded-2xl font-black text-xs uppercase tracking-wider shadow-md shadow-amber-500/10 transition-all active:scale-[0.98] flex justify-center items-center gap-2 ${
              loading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin text-black" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <Smartphone size={16} />
                <span>Sign In with Phone</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-zinc-400 pt-4 border-t border-zinc-800/80">
          Don't have a phone account?{' '}
          <Link
            to="/register"
            state={{
              from: redirectPath,
              bidAmount: location.state?.bidAmount,
              autoOpenConfirm: location.state?.autoOpenConfirm,
            }}
            className="text-amber-400 font-extrabold hover:underline"
          >
            Register Phone
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
