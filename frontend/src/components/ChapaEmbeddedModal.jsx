import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, XCircle, X, Loader2 } from 'lucide-react';

/**
 * Embeds Chapa's hosted checkout inside a full-screen modal iframe.
 * When the iframe lands on /payment-result (our own origin), it fires
 * a postMessage so we can detect completion without a page redirect.
 */
const ChapaEmbeddedModal = ({ checkoutUrl, onClose, onSuccess, onFailure }) => {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [result, setResult] = useState(null); // null | 'success' | 'failed'
  const [resultMessage, setResultMessage] = useState('');
  const iframeRef = useRef(null);

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

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)' }}
      role="dialog"
      aria-modal="true"
      aria-label="Chapa Payment"
    >
      {/* Header bar */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ background: 'linear-gradient(90deg,#0f0700,#3d1400)', borderBottom: '1px solid rgba(249,115,22,0.35)' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-orange-400"
            style={{ background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.4)' }}
          >
            💳
          </div>
          <div>
            <p className="text-sm font-black text-white leading-tight">Secure Payment</p>
            <p className="text-[10px] text-orange-400/80">Powered by Chapa</p>
          </div>
        </div>
        {!result && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all"
            aria-label="Cancel payment"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Content area */}
      <div className="flex-1 relative overflow-hidden">

        {/* Loading spinner */}
        {!iframeLoaded && !result && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
            <Loader2 size={36} className="text-orange-400 animate-spin" />
            <p className="text-sm text-zinc-400 font-medium">Loading payment page…</p>
          </div>
        )}

        {/* Inline result screen */}
        {result && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-6 text-center z-20"
            style={{ background: 'linear-gradient(135deg,#0f0700,#1c0800 50%,#0f0700)' }}
          >
            {result === 'success' ? (
              <>
                <CheckCircle2 size={64} className="text-emerald-400" />
                <div>
                  <h2 className="text-2xl font-black text-white">Payment Successful!</h2>
                  <p className="mt-2 text-sm text-zinc-300">Your bid fee was received and your bid has been placed.</p>
                </div>
                <button
                  onClick={onClose}
                  className="mt-2 px-8 py-3 rounded-2xl font-black text-sm text-white uppercase tracking-wider"
                  style={{ background: 'linear-gradient(100deg,#ea580c,#f97316,#fb923c)', boxShadow: '0 8px 24px rgba(249,115,22,0.4)' }}
                >
                  Back to Auctions
                </button>
              </>
            ) : (
              <>
                <XCircle size={64} className="text-rose-400" />
                <div>
                  <h2 className="text-2xl font-black text-white">Payment Not Completed</h2>
                  <p className="mt-2 text-sm text-zinc-300">{resultMessage || 'Your bid was not placed. You can try again.'}</p>
                </div>
                <button
                  onClick={onClose}
                  className="px-6 py-3 rounded-2xl font-black text-sm text-white bg-zinc-800 hover:bg-zinc-700 transition-all uppercase tracking-wider"
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
            allow="payment"
          />
        )}
      </div>
    </div>,
    document.body
  );
};

export default ChapaEmbeddedModal;
