import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, X, Loader2, ExternalLink } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

/**
 * Embeds Chapa's hosted checkout inside a modal iframe.
 * When payment finishes, Chapa returns to /payment-result, which fires
 * a postMessage to show the success or failure screen directly here.
 */
const ChapaEmbeddedModal = ({ checkoutUrl, onClose, onSuccess, onFailure }) => {
  const navigate = useNavigate();
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [result, setResult] = useState(null); // null | 'success' | 'failed'
  const [resultMessage, setResultMessage] = useState('');
  const iframeRef = useRef(null);

  const themeContext = useTheme();
  const isLight =
    themeContext?.theme === 'light' ||
    (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'light');

  /* Listen for postMessage from /payment-result page */
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'CHAPA_PAYMENT_RESULT') {
        const { status, tx_ref, message } = event.data;
        if (status === 'success') {
          setResult('success');
          onSuccess?.({ tx_ref });
        } else {
          setResult('failed');
          setResultMessage(message || 'Payment was not completed.');
          onFailure?.({ message });
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onSuccess, onFailure]);

  /* Prevent body scroll while modal open */
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleModalClose = () => {
    const wasSuccess = result === 'success';
    onClose?.();
    if (wasSuccess) {
      navigate('/my-bids');
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex flex-col animate-in fade-in duration-200"
      style={{
        background: isLight ? 'rgba(0,0,0,0.65)' : 'rgba(0,0,0,0.92)',
        backdropFilter: 'blur(14px)',
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Chapa Payment"
    >
      {/* Header bar */}
      <div
        className={`flex items-center justify-between px-4 py-3 shrink-0 border-b transition-colors ${
          isLight ? 'bg-white border-orange-500/20 shadow-xs' : 'bg-[#141519] border-zinc-800'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm shadow-sm ${
              isLight
                ? 'bg-orange-50 border border-orange-200 text-orange-600'
                : 'bg-orange-500/15 border border-orange-500/30 text-orange-400'
            }`}
          >
            💳
          </div>
          <div>
            <p className={`text-sm font-bold leading-tight ${isLight ? 'text-zinc-900' : 'text-white'}`}>
              Secure Payment
            </p>
            <p className={`text-[10px] ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
              Powered by Chapa
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!result && (
            <a
              href={checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                isLight
                  ? 'bg-zinc-100 text-zinc-700 hover:text-zinc-900 hover:bg-zinc-200 border-zinc-200'
                  : 'bg-[#202026] text-zinc-300 hover:text-white hover:bg-zinc-700 border-zinc-800'
              }`}
              title="Open checkout in new window"
            >
              <ExternalLink size={13} />
              <span className="hidden sm:inline">Open in new tab</span>
            </a>
          )}
          {!result && (
            <button
              onClick={handleModalClose}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer border ${
                isLight
                  ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900 border-zinc-200'
                  : 'bg-[#202026] hover:bg-zinc-700 text-zinc-400 hover:text-white border-zinc-800'
              }`}
              aria-label="Cancel payment"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className={`flex-1 relative overflow-hidden ${isLight ? 'bg-[#F4F5F7]' : 'bg-[#0A0B0D]'}`}>
        {/* Loading spinner */}
        {!iframeLoaded && !result && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 text-center px-4">
            <Loader2 size={36} className="text-orange-500 animate-spin" />
            <p className={`text-sm font-semibold ${isLight ? 'text-zinc-800' : 'text-zinc-200'}`}>
              Connecting to secure checkout…
            </p>
            <p className={`text-xs max-w-sm ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
              If the payment form does not appear,{' '}
              <a
                href={checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-500 underline font-bold hover:text-orange-600"
              >
                click here to open in a new tab
              </a>
              .
            </p>
          </div>
        )}

        {/* Inline result screen */}
        {result && (
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center gap-5 px-6 text-center z-20 animate-in zoom-in-95 duration-200 ${
              isLight ? 'bg-white' : 'bg-[#141519]'
            }`}
          >
            {result === 'success' ? (
              <>
                <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shadow-sm">
                  <CheckCircle2 size={40} />
                </div>
                <div>
                  <h2 className={`text-2xl font-black tracking-tight ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                    Payment Successful!
                  </h2>
                  <p className={`mt-2 text-sm max-w-md ${isLight ? 'text-zinc-600' : 'text-zinc-300'}`}>
                    Your participation fee was received and your bid has been placed.
                  </p>
                </div>
                <button
                  onClick={handleModalClose}
                  style={{
                    background: 'linear-gradient(100deg, #ea580c, #f97316 45%, #fb923c 75%, #f59e0b)',
                    color: '#ffffff',
                    boxShadow: '0 10px 25px rgba(249, 115, 22, 0.35)',
                  }}
                  className="mt-2 px-8 py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider cursor-pointer transition-all active:scale-95 hover:brightness-110 shadow-lg flex items-center justify-center gap-2"
                >
                  <span>View My Bids</span>
                </button>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-500 shadow-sm">
                  <XCircle size={40} />
                </div>
                <div>
                  <h2 className={`text-2xl font-black tracking-tight ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                    Payment Not Completed
                  </h2>
                  <p className={`mt-2 text-sm max-w-md ${isLight ? 'text-zinc-600' : 'text-zinc-300'}`}>
                    {resultMessage || 'Your bid was not placed. You can try again from the auction.'}
                  </p>
                </div>
                <button
                  onClick={handleModalClose}
                  className={`px-8 py-3.5 rounded-2xl font-bold text-sm uppercase tracking-wider cursor-pointer transition-all active:scale-95 border ${
                    isLight
                      ? 'bg-zinc-200 hover:bg-zinc-300 text-zinc-800 border-zinc-300'
                      : 'bg-[#202026] hover:bg-zinc-700 text-white border-zinc-800'
                  }`}
                >
                  Close
                </button>
              </>
            )}
          </div>
        )}

        {/* Chapa iframe */}
        {!result && (
          <iframe
            ref={iframeRef}
            src={checkoutUrl}
            title="Chapa Checkout"
            className="w-full h-full border-0"
            style={{ opacity: iframeLoaded ? 1 : 0, transition: 'opacity 0.3s ease' }}
            onLoad={() => setIframeLoaded(true)}
            allow="payment *"
          />
        )}
      </div>
    </div>,
    document.body
  );
};

export default ChapaEmbeddedModal;
