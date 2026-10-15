import React, { useId, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, LockKeyhole, Smartphone, X } from 'lucide-react';
import '@chapa_et/inline.js/lib/inline.js';
import { useTheme } from '../context/ThemeContext';

const ChapaPushModal = ({ isOpen, amount, txRef, selectedPayment, mobile, onClose, onSuccess, onFailure }) => {
  const containerId = `chapa-inline-${useId().replace(/:/g, '')}`;
  const [error, setError] = useState('');
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const normalizedMobile = String(mobile || '').replace(/\D/g, '').replace(/^251(?=[97])/, '0');

  useLayoutEffect(() => {
    if (!isOpen || !txRef) return undefined;

    setError('');
    const publicKey = import.meta.env.VITE_CHAPA_PUBLIC_KEY;
    if (!publicKey || publicKey === 'your_chapa_public_key') {
      setError('Chapa public key is not configured. Add VITE_CHAPA_PUBLIC_KEY to the frontend environment.');
      return undefined;
    }

    const checkout = new window.ChapaCheckout({
      publicKey,
      amount: String(amount),
      currency: 'ETB',
      tx_ref: txRef,
      mobile: normalizedMobile,
      availablePaymentMethods: [selectedPayment === 'cbe' ? 'cbebirr' : 'telebirr'],
      showPaymentMethodsNames: true,
      customizations: {
        buttonText: 'Send Payment Push',
        successMessage: 'Payment approved. Your bid is being finalized.',
        styles: `
          #${containerId} { font-family: ui-sans-serif, system-ui, sans-serif; }
          #${containerId} .chapa-phone-input-wrapper {
            background: ${isDark ? '#111216' : '#f7f8fa'};
            border: 1px solid ${isDark ? '#3f3f46' : '#d4d5da'};
            border-radius: 14px;
            padding: 8px 12px;
            box-shadow: 0 8px 24px ${isDark ? 'rgba(0,0,0,.22)' : 'rgba(17,18,24,.06)'};
          }
          #${containerId} .chapa-phone-input-wrapper:hover,
          #${containerId} .chapa-phone-input-wrapper:focus-within {
            border-color: #f97316;
            box-shadow: 0 0 0 3px rgba(249,115,22,.14);
          }
          #${containerId} .chapa-phone-prefix { background: transparent; color: ${isDark ? '#a1a1aa' : '#52525b'}; }
          #${containerId} .chapa-phone-input {
            background: transparent;
            color: ${isDark ? '#fff' : '#111218'};
            border-left-color: ${isDark ? '#3f3f46' : '#d4d5da'};
          }
          #${containerId} .chapa-payment-methods-grid { gap: 10px; margin: 16px 0; justify-content: flex-start; }
          #${containerId} .chapa-payment-method {
            background: ${isDark ? '#111216' : '#fff'};
            color: ${isDark ? '#fff' : '#111218'};
            border: 1px solid ${isDark ? '#3f3f46' : '#d4d5da'};
            border-radius: 14px;
            width: 82px;
            height: 76px;
            box-shadow: 0 8px 18px ${isDark ? 'rgba(0,0,0,.16)' : 'rgba(17,18,24,.06)'};
          }
          #${containerId} .chapa-payment-method:hover,
          #${containerId} .chapa-payment-method.chapa-selected {
            border-color: #f97316;
            background: ${isDark ? 'rgba(249,115,22,.12)' : '#fff7f0'};
            box-shadow: 0 0 0 2px rgba(249,115,22,.18), 0 10px 24px rgba(249,115,22,.12);
          }
          #${containerId} .chapa-payment-icon { width: 34px; height: 34px; }
          #${containerId} .chapa-payment-name { color: ${isDark ? '#d4d4d8' : '#3f3f46'}; font-weight: 700; }
          #${containerId} .chapa-pay-button {
            background: linear-gradient(100deg, #ea580c, #f97316 48%, #fb923c);
            border: 0;
            border-radius: 13px;
            padding: 13px 16px;
            font-weight: 800;
            box-shadow: 0 10px 24px rgba(249,115,22,.25);
          }
          #${containerId} .chapa-pay-button:hover { background: linear-gradient(100deg, #c2410c, #ea580c 48%, #f97316); }
          #${containerId} .chapa-loading { color: ${isDark ? '#a1a1aa' : '#52525b'}; }
        `
      },
      onSuccessfulPayment: async (_result, chapaRef) => {
        try {
          await onSuccess({ txRef, chapaRef });
        } catch (completionError) {
          setError(completionError.response?.data?.error || 'Payment was approved, but the bid could not be finalized.');
        }
      },
      onPaymentFailure: (message) => {
        setError(message || 'The payment was not completed. Close this window and try again for a new payment request.');
        onFailure?.(message);
      },
      onClose: () => undefined
    });

    checkout.initialize(containerId);
    return () => {
      const container = document.getElementById(containerId);
      if (container) container.innerHTML = '';
    };
  }, [amount, containerId, isDark, isOpen, normalizedMobile, onFailure, onSuccess, selectedPayment, txRef]);

  if (!isOpen) return null;

  return createPortal(
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md ${isDark ? 'bg-black/80' : 'bg-zinc-900/35'}`}>
      <div className={`w-full max-w-sm min-h-[560px] max-h-[calc(100vh-2rem)] overflow-y-auto rounded-[1.75rem] border p-5 shadow-2xl ${isDark ? 'border-orange-400/25 bg-[#15161b] text-white shadow-black/50' : 'border-orange-200 bg-white text-[#111218] shadow-orange-950/10'}`}>
        <div className={`-mx-5 -mt-5 mb-5 rounded-t-[1.75rem] border-b px-5 pb-5 pt-5 ${isDark ? 'border-orange-400/20 bg-gradient-to-br from-[#261108] via-[#17171c] to-[#15161b]' : 'border-orange-100 bg-gradient-to-br from-orange-50 via-white to-white'}`}>
          <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-orange-400/40 bg-orange-500/15 text-orange-500 shadow-sm">
              <Smartphone size={19} />
            </div>
            <div>
              <h2 className="font-black tracking-tight">Approve Payment</h2>
              <p className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>A secure prompt will be sent to your phone</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${isDark ? 'bg-zinc-800 text-zinc-400 hover:bg-orange-500/20 hover:text-orange-300' : 'bg-zinc-100 text-zinc-500 hover:bg-orange-100 hover:text-orange-600'}`} aria-label="Close">
            <X size={17} />
          </button>
          </div>
          <div className={`mt-5 flex items-end justify-between rounded-2xl border px-4 py-3 ${isDark ? 'border-orange-400/20 bg-black/20' : 'border-orange-100 bg-white/80'}`}>
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-[0.16em] ${isDark ? 'text-orange-300/70' : 'text-orange-600/70'}`}>Bid service fee</p>
              <p className={`mt-1 text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-[#111218]'}`}>{Number(amount || 0).toFixed(2)} <span className="text-sm font-bold text-orange-500">ETB</span></p>
            </div>
            <div className={`flex items-center gap-1.5 pb-1 text-[10px] font-bold ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
              <LockKeyhole size={13} /> Secure
            </div>
          </div>
        </div>

        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className={`text-[11px] font-black uppercase tracking-[0.14em] ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>Choose payment method</p>
            <p className={`mt-1 text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>Approve the prompt sent to your mobile wallet</p>
          </div>
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500/15 text-orange-500">
            <Smartphone size={14} />
          </div>
        </div>

        <div className="relative">
          <div id={containerId} />
          {error && (
            <div className={`absolute inset-0 rounded-2xl border p-4 text-sm ${isDark ? 'border-rose-500/40 bg-[#15161b] text-rose-200' : 'border-rose-200 bg-white text-rose-700'}`}>
              <p>{error}</p>
              <button
                type="button"
                onClick={onClose}
                className="mt-4 w-full rounded-xl bg-orange-500 px-4 py-3 font-black text-white transition hover:bg-orange-600"
              >
                Close and Try Again
              </button>
            </div>
          )}
        </div>

        <div className={`mt-6 flex items-start gap-2.5 rounded-2xl border px-3.5 py-3 ${isDark ? 'border-zinc-800 bg-[#111216] text-zinc-400' : 'border-zinc-200 bg-zinc-50 text-zinc-500'}`}>
          <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-orange-500" />
          <p className="text-[10px] leading-relaxed">Your payment is processed securely by Chapa. Your bid is added only after the payment is confirmed.</p>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ChapaPushModal;
