import React, { useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const PaymentResult = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status');
  const success = status === 'success';
  const message = searchParams.get('message') || '';
  const txRef = searchParams.get('tx_ref') || '';

  const themeContext = useTheme();
  const isLight =
    themeContext?.theme === 'light' ||
    (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'light');

  // Extract itemId from txRef format: tinish-bid-{userId}-{itemId}-{timestamp}-{random}
  const targetItemId = useMemo(() => {
    const match = txRef.match(/tinish-(?:bid|inline)-\d+-(\d+)-/);
    return match ? match[1] : null;
  }, [txRef]);

  /* If inside ChapaEmbeddedModal iframe or popup, notify the parent window */
  useEffect(() => {
    const payload = { type: 'CHAPA_PAYMENT_RESULT', status, tx_ref: txRef, message };
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(payload, window.location.origin);
      }
    } catch {
      // ignore
    }
    try {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(payload, window.location.origin);
      }
    } catch {
      // ignore
    }
  }, [status, txRef, message]);

  /* Auto-navigate to /my-bids after 1 second if on standalone page */
  useEffect(() => {
    if (success && (!window.parent || window.parent === window)) {
      const timer = setTimeout(() => {
        navigate('/my-bids');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [success, navigate]);

  return (
    <div className="max-w-md mx-auto py-16 px-4 text-center animate-in fade-in duration-300">
      <div
        className={`rounded-3xl p-8 border transition-all ${
          isLight
            ? 'bg-white border-orange-500/20 shadow-2xl shadow-orange-950/10 text-zinc-900'
            : 'bg-[#141519] border-zinc-800 shadow-2xl text-white'
        }`}
      >
        {success ? (
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-500 shadow-sm">
            <CheckCircle2 size={40} />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-500 shadow-sm">
            <XCircle size={40} />
          </div>
        )}
        <h1 className={`mt-5 text-2xl font-black tracking-tight ${isLight ? 'text-zinc-900' : 'text-white'}`}>
          {success ? 'Payment Successful!' : 'Payment Not Completed'}
        </h1>
        <p className={`mt-2.5 text-sm leading-relaxed ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
          {success
            ? 'Your participation fee was received and your bid has been placed successfully.'
            : message || 'Your bid was not placed. You can try again from the auction page.'}
        </p>
        {success && (
          <p className={`mt-3 text-xs font-medium animate-pulse ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
            Redirecting to your bids…
          </p>
        )}
        <Link
          to={success ? '/my-bids' : targetItemId ? `/item/${targetItemId}` : '/'}
          style={{
            background: 'linear-gradient(100deg, #ea580c, #f97316 45%, #fb923c 75%, #f59e0b)',
            color: '#ffffff',
            boxShadow: '0 10px 25px rgba(249, 115, 22, 0.35)',
          }}
          className="inline-flex items-center gap-2 mt-7 px-6 py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider transition-all hover:brightness-110 active:scale-95 shadow-lg"
        >
          <ArrowLeft size={16} style={{ color: '#ffffff' }} />
          <span style={{ color: '#ffffff' }}>
            {success ? 'View My Bids' : targetItemId ? 'Return to Auction' : 'Return to Auctions'}
          </span>
        </Link>
      </div>
    </div>
  );
};

export default PaymentResult;

