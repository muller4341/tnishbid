import React, { memo, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Check, CheckCircle2, Gavel, Info, Package, Smartphone, Wallet, X, AlertCircle } from 'lucide-react';
import telebirrLogo from '../assets/telebirr.png';
import cbeLogo from '../assets/cbe.png';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import '@chapa_et/inline.js/lib/inline.js';

const ChapaPushEngine = ({ isOpen, amount, txRef, selectedPayment, mobile, onSuccess, onFailure }) => {
  const containerId = `chapa-inline-${useId().replace(/:/g, '')}`;
  const submitTimer = useRef(null);
  const successRef = useRef(onSuccess);
  const failureRef = useRef(onFailure);
  const normalizedMobile = String(mobile || '').replace(/\D/g, '').replace(/^251(?=[97])/, '0');

  successRef.current = onSuccess;
  failureRef.current = onFailure;

  useLayoutEffect(() => {
    if (!isOpen || !txRef || selectedPayment === 'wallet') return undefined;
    const publicKey = import.meta.env.VITE_CHAPA_PUBLIC_KEY || 'CHAPUBK_TEST-rsrOoHDhR3XQe4yEwiRspYqDn81Qky6a';
    if (!publicKey || publicKey === 'your_chapa_public_key') {
      failureRef.current?.('Chapa public key is not configured.');
      return undefined;
    }

    try {
      const checkout = new window.ChapaCheckout({
        publicKey,
        amount: String(amount),
        currency: 'ETB',
        tx_ref: txRef,
        mobile: normalizedMobile,
        availablePaymentMethods: [
          selectedPayment === 'cbe' ? 'cbebirr' : 'telebirr'
        ],
        showPaymentMethodsNames: false,
        customizations: { buttonText: 'Send Payment Push' },
        onSuccessfulPayment: async (_result, chapaRef) => {
          try {
            await successRef.current({ txRef, chapaRef });
          } catch (error) {
            failureRef.current?.(error.response?.data?.error || 'Payment was approved, but the bid could not be finalized.');
          }
        },
        onPaymentFailure: (message) => failureRef.current?.(message || 'Payment push failed or was cancelled.'),
        onClose: () => undefined
      });

      checkout.initialize(containerId);
      submitTimer.current = window.setTimeout(() => {
        try {
          const input = document.querySelector(`#${containerId} #chapa-phone-number`) || document.getElementById("chapa-phone-number");
          if (input && normalizedMobile) {
            input.value = normalizedMobile;
          }
          checkout.handlePayment();
        } catch (err) {
          console.error('Chapa checkout payment error:', err);
          failureRef.current?.(err.message || 'Failed to trigger payment push');
        }
      }, 50);

      return () => {
        if (submitTimer.current) window.clearTimeout(submitTimer.current);
        const container = document.getElementById(containerId);
        if (container) container.innerHTML = '';
      };
    } catch (err) {
      console.error('Chapa initialization error:', err);
      failureRef.current?.(err.message || 'Failed to initialize Chapa push');
    }
  }, [amount, containerId, isOpen, normalizedMobile, selectedPayment, txRef]);

  if (!isOpen || selectedPayment === 'wallet') return null;
  return <div id={containerId} className="hidden" aria-hidden="true" />;
};

export const PaymentMethodSelector = memo(({ selectedPayment, onSelectPayment, showLabel = true }) => {
  const themeContext = useTheme();
  const isLight =
    themeContext?.theme === 'light' ||
    (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'light');

  const options = [
    {
      id: 'telebirr',
      name: 'Telebirr',
      logo: (
        <img
          src={telebirrLogo}
          alt="Telebirr"
          className="w-full h-full object-contain rounded"
        />
      ),
    },
    {
      id: 'cbe',
      name: 'CBE Birr',
      logo: (
        <img
          src={cbeLogo}
          alt="CBE Birr"
          className="w-full h-full object-contain rounded"
        />
      ),
    },
    {
      id: 'wallet',
      name: 'Wallet',
      logo: (
        <Wallet size={15} className={isLight ? 'text-orange-600' : 'text-orange-400'} />
      ),
    },
  ];

  return (
    <div className="space-y-1 text-left animate-in fade-in slide-in-from-top-1 duration-200">
      {showLabel && (
        <label className={`text-[11px] font-bold block ${isLight ? 'text-zinc-800' : 'text-zinc-200'}`}>
          Payment Option
        </label>
      )}
      <div className="grid grid-cols-3 gap-2">
        {options.map((opt) => {
          const isSelected = selectedPayment === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onSelectPayment?.(opt.id)}
              className={`p-2 rounded-xl border transition-all text-left flex flex-col justify-between cursor-pointer relative min-h-[58px] ${
                isSelected
                  ? isLight
                    ? 'bg-[#FFF5ED] border-[#ea580c] ring-1 ring-[#ea580c]/30 shadow-xs'
                    : 'bg-[#1e150d] border-[#f97316] ring-1 ring-[#f97316]/40 shadow-xs'
                  : isLight
                  ? 'bg-white border-zinc-200 hover:border-orange-300 hover:bg-orange-50/30 text-zinc-700'
                  : 'bg-[#111216] border-zinc-800/80 hover:border-zinc-700 hover:bg-[#16171d] text-zinc-300'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div
                  className={`w-6 h-6 rounded-md p-0.5 flex items-center justify-center shrink-0 ${
                    isLight ? 'bg-zinc-100 border border-zinc-200' : 'bg-[#1a1b22] border border-white/5'
                  }`}
                >
                  {opt.logo}
                </div>
                {isSelected ? (
                  <div
                    className="w-4 h-4 rounded-full flex items-center justify-center text-white shadow-xs shrink-0"
                    style={{ background: 'linear-gradient(100deg, #ea580c, #f97316 45%, #fb923c 75%, #f59e0b)', color: '#ffffff' }}
                  >
                    <Check size={9} strokeWidth={3.5} />
                  </div>
                ) : (
                  <div
                    className={`w-4 h-4 rounded-full border shrink-0 ${
                      isLight ? 'border-zinc-300 bg-white' : 'border-zinc-700 bg-transparent'
                    }`}
                  />
                )}
              </div>
              <span
                className={`mt-1 text-[11px] font-bold tracking-tight block truncate ${
                  isSelected
                    ? isLight
                      ? 'text-[#ea580c]'
                      : 'text-orange-400'
                    : isLight
                    ? 'text-zinc-800'
                    : 'text-zinc-200'
                }`}
              >
                {opt.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
});

export const ConfirmBidModal = memo(({
  isOpen,
  onClose,
  onConfirm,
  itemTitle,
  bidAmount,
  bidFee,
  selectedPayment: propSelectedPayment = 'telebirr',
  onSelectPayment,
  showPaymentSelector = false,
  isSubmitting,
  inlinePayment,
  onInlineClose,
  onInlineSuccess,
  mobile
}) => {
  const navigate = useNavigate();
  const themeContext = useTheme();
  const { user } = useAuth() || {};

  const isLight =
    themeContext?.theme === 'light' ||
    (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'light');

  const [agreed, setAgreed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(mobile || '');
  const [selectedMethod, setSelectedMethod] = useState(propSelectedPayment || 'telebirr');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [walletError, setWalletError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAgreed(false);
      setShowDetails(false);
      setPaymentSuccess(false);
      setWalletError('');
      setPhoneNumber(mobile || '');
      if (propSelectedPayment) {
        setSelectedMethod(propSelectedPayment);
      }
    }
  }, [isOpen, mobile, propSelectedPayment]);

  const activePayment = selectedMethod;
  const isWallet = activePayment === 'wallet';
  const walletBalance = Number(user?.wallet_balance || 0);
  const requiredFee = parseFloat(bidFee || 0);
  const hasSufficientBalance = !isWallet || walletBalance >= requiredFee;

  const handleSelectPayment = (method) => {
    setSelectedMethod(method);
    setWalletError('');
    onSelectPayment?.(method);
  };

  const handleModalClose = () => {
    const wasSuccess = paymentSuccess;
    setPaymentSuccess(false);
    onClose();
    if (wasSuccess) {
      navigate('/my-bids');
    }
  };

  const handleInlineSuccessInternal = async (data) => {
    try {
      if (onInlineSuccess) {
        await onInlineSuccess(data);
      }
      setPaymentSuccess(true);
    } catch (err) {
      onInlineClose?.(err?.response?.data?.error || err?.message || 'Finalizing your bid failed.');
    }
  };

  const handleConfirmClick = async () => {
    if (!agreed || isSubmitting) return;

    if (isWallet) {
      if (!hasSufficientBalance) {
        setWalletError(`Insufficient wallet balance. Fee is ${requiredFee.toFixed(2)} Br, but your balance is ${walletBalance.toFixed(2)} Br.`);
        return;
      }
      try {
        setWalletError('');
        const res = await onConfirm('', 'wallet');
        if (res !== false) {
          setPaymentSuccess(true);
        }
      } catch (err) {
        setWalletError(err.response?.data?.error || err.message || 'Failed to place bid with wallet.');
      }
      return;
    }

    onConfirm(phoneNumber, activePayment);
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200 backdrop-blur-md ${
        isLight ? 'bg-zinc-950/45' : 'bg-black/80'
      }`}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleModalClose();
      }}
    >
      <div
        className={`rounded-t-[24px] sm:rounded-3xl max-w-md w-full max-h-[92vh] overflow-y-auto px-4 py-3.5 sm:p-5 relative text-left space-y-3 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 border ${
          isLight
            ? 'bg-white border-orange-500/20 text-zinc-900 shadow-2xl shadow-orange-950/15'
            : 'bg-[#141519] border-zinc-800 text-zinc-100 shadow-2xl'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-summary-title"
      >
        {/* Top Handle */}
        <div className={`mx-auto mb-1 h-1 w-9 rounded-full ${isLight ? 'bg-zinc-300' : 'bg-zinc-700'}`} />

        {/* Header */}
        <div
          className={`flex items-center justify-between pb-2 border-b ${
            isLight ? 'border-orange-500/15' : 'border-zinc-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-xs ${
                paymentSuccess
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-500'
                  : isLight
                  ? 'bg-orange-50 border border-orange-200 text-orange-600'
                  : 'bg-orange-500/15 border border-orange-500/30 text-orange-400'
              }`}
            >
              {paymentSuccess ? <CheckCircle2 size={16} /> : <Gavel size={16} />}
            </div>
            <div>
              <h2
                id="payment-summary-title"
                className={`font-black text-base sm:text-lg tracking-tight ${
                  isLight ? 'text-zinc-900' : 'text-white'
                }`}
              >
                {paymentSuccess ? 'Payment Successful' : 'Payment Summary'}
              </h2>
              <p className={`text-[10px] sm:text-[11px] font-normal leading-none mt-0.5 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                {paymentSuccess ? 'Your bid has been successfully placed' : 'Review your bid before confirming'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleModalClose}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer border ${
              isLight
                ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900 border-zinc-200'
                : 'bg-[#1f2026] hover:bg-zinc-700 text-zinc-400 hover:text-white border-zinc-800'
            }`}
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>

        {/* Inline Chapa Push Engine (only for online payments) */}
        {inlinePayment && !paymentSuccess && !isWallet && (
          <ChapaPushEngine
            isOpen
            amount={inlinePayment.amount}
            txRef={inlinePayment.txRef}
            selectedPayment={activePayment}
            mobile={phoneNumber || mobile}
            onSuccess={handleInlineSuccessInternal}
            onFailure={(msg) => onInlineClose?.(msg)}
          />
        )}

        {paymentSuccess ? (
          <div className="py-4 px-2 text-center space-y-3.5 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-500 shadow-xs">
              <CheckCircle2 size={28} />
            </div>
            <div>
              <h3 className={`text-lg sm:text-xl font-black tracking-tight ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                Payment Successful!
              </h3>
              <p className={`mt-1.5 text-xs leading-relaxed max-w-xs mx-auto ${isLight ? 'text-zinc-600' : 'text-zinc-300'}`}>
                {isWallet ? (
                  <>Your participation fee was deducted from your wallet and your bid of </>
                ) : (
                  <>Your participation fee was received and your bid of </>
                )}
                <span className={`font-bold ${isLight ? 'text-orange-600' : 'text-orange-400'}`}>
                  {parseFloat(bidAmount || 0).toFixed(2)} Br
                </span>{' '}
                has been placed successfully.
              </p>
            </div>
            <button
              type="button"
              onClick={handleModalClose}
              style={{
                background: 'linear-gradient(100deg, #ea580c, #f97316 45%, #fb923c 75%, #f59e0b)',
                color: '#ffffff',
                boxShadow: '0 8px 20px rgba(249, 115, 22, 0.3)',
              }}
              className="mt-2 w-full py-2.5 sm:py-3 px-5 rounded-xl font-black text-xs uppercase tracking-wider cursor-pointer transition-all active:scale-95 hover:brightness-110 shadow-md flex items-center justify-center gap-2"
            >
              <span>View My Bids</span>
            </button>
          </div>
        ) : inlinePayment && !isWallet ? (
          <div className="py-5 px-3 text-center space-y-3 animate-in fade-in zoom-in-95 duration-200">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto shadow-md ${
                isLight
                  ? 'bg-orange-50 border border-orange-200 text-orange-600 shadow-orange-500/10'
                  : 'bg-orange-500/15 border border-orange-500/30 text-orange-400 shadow-orange-500/10'
              }`}
            >
              <Smartphone size={24} className="animate-pulse" />
            </div>
            <div>
              <h3 className={`text-base sm:text-lg font-black tracking-tight ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                Payment Push Sent!
              </h3>
              <p className={`mt-1.5 text-[11px] leading-relaxed max-w-xs mx-auto ${isLight ? 'text-zinc-600' : 'text-zinc-300'}`}>
                A payment authorization prompt of{' '}
                <span className={`font-bold ${isLight ? 'text-orange-600' : 'text-orange-400'}`}>
                  {parseFloat(bidFee || 0).toFixed(2)} Br
                </span>{' '}
                has been sent to your phone (
                <span className={`font-bold ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                  +251 {phoneNumber.replace(/^0/, '')}
                </span>
                ) via{' '}
                <span className={`font-bold ${isLight ? 'text-orange-600' : 'text-orange-400'}`}>
                  {activePayment === 'cbe' ? 'CBE Birr' : 'Telebirr'}
                </span>
                .
              </p>
              <p className={`mt-1 text-[10px] ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                Please check your phone and enter your PIN to approve the bid fee.
              </p>
            </div>
            <div className="flex items-center justify-center gap-1.5 text-xs text-orange-500 pt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" />
              <span className="font-bold text-[11px] tracking-tight">Waiting for authorization…</span>
            </div>
            <button
              type="button"
              onClick={onInlineClose}
              className={`mt-2 text-[11px] underline cursor-pointer transition-colors block mx-auto ${
                isLight ? 'text-zinc-500 hover:text-zinc-800' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Cancel Payment
            </button>
          </div>
        ) : (
          <>
            {/* Bid Details Card */}
            <div
              className={`rounded-xl border p-2.5 text-xs transition-colors ${
                isLight
                  ? 'bg-[#FFF9F5] border-orange-500/20 shadow-xs'
                  : 'bg-[#111216] border-zinc-800/80'
              }`}
            >
              <div
                className={`flex items-start gap-2 border-b pb-2 ${
                  isLight ? 'border-orange-500/15' : 'border-zinc-800'
                }`}
              >
                <Package size={14} className={`mt-0.5 shrink-0 ${isLight ? 'text-orange-600' : 'text-zinc-400'}`} />
                <div className="min-w-0 flex-1 flex items-center justify-between">
                  <p className={`text-[11px] font-medium truncate ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                    Item: <span className={`font-bold ${isLight ? 'text-zinc-900' : 'text-white'}`}>{itemTitle || 'Auction Item'}</span>
                  </p>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className={`text-[11px] font-medium ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                  Your Bid Amount:
                </span>
                <span className={`font-mono font-bold text-xs sm:text-sm ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                  {parseFloat(bidAmount || 0).toFixed(2)} Br
                </span>
              </div>
              <div className="mt-1.5 flex items-center justify-between">
                <div>
                  <span className={`text-[11px] font-medium ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                    Participation Fee:
                  </span>
                  <span
                    className={`ml-1.5 inline-block rounded px-1.5 py-0.5 text-[8.5px] font-black uppercase tracking-wider border ${
                      isLight
                        ? 'bg-rose-50 border-rose-200 text-rose-600'
                        : 'bg-rose-950/60 border-rose-500/30 text-rose-400'
                    }`}
                  >
                    NON-REFUNDABLE
                  </span>
                </div>
                <span
                  className={`font-mono font-black text-base sm:text-lg ${
                    isLight ? 'text-[#ea580c]' : 'text-orange-400'
                  }`}
                >
                  {parseFloat(bidFee || 0).toFixed(2)} Br
                </span>
              </div>
            </div>

            {/* Payment Option Selector */}
            <div>
              <p className={`mb-1 text-[11px] font-bold ${isLight ? 'text-zinc-900' : 'text-zinc-100'}`}>
                Payment Option
              </p>
              <PaymentMethodSelector
                selectedPayment={activePayment}
                onSelectPayment={handleSelectPayment}
                showLabel={false}
              />
            </div>

            {/* Wallet Balance Display OR Phone Number Input */}
            {isWallet ? (
              <div
                className={`rounded-xl border p-2.5 transition-colors ${
                  !hasSufficientBalance
                    ? isLight
                      ? 'bg-red-50/80 border-red-300'
                      : 'bg-red-950/30 border-red-900/60'
                    : isLight
                    ? 'bg-orange-50/70 border-orange-200'
                    : 'bg-[#16171d] border-zinc-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isLight
                          ? 'bg-white text-orange-600 border border-orange-200'
                          : 'bg-[#111216] text-orange-400 border border-zinc-800'
                      }`}
                    >
                      <Wallet size={14} />
                    </div>
                    <div>
                      <span className={`text-[10px] font-medium block leading-none ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                        Available Wallet
                      </span>
                      <span className={`text-sm font-black font-mono leading-tight mt-0.5 block ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                        {walletBalance.toFixed(2)} Br
                      </span>
                    </div>
                  </div>
                  {hasSufficientBalance ? (
                    <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Sufficient
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold text-red-500 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Low Balance
                    </span>
                  )}
                </div>
                {!hasSufficientBalance && (
                  <p className="mt-1.5 text-[11px] font-semibold text-red-500 flex items-center gap-1">
                    <AlertCircle size={12} className="shrink-0" />
                    Insufficient fee ({requiredFee.toFixed(2)} Br). Choose Telebirr or CBE Birr.
                  </p>
                )}
                {walletError && (
                  <p className="mt-1.5 text-[11px] font-semibold text-red-500">{walletError}</p>
                )}
              </div>
            ) : (
              <div>
                <label className={`mb-1 block text-[11px] font-semibold ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>
                  {activePayment === 'cbe' ? 'CBE Birr Phone' : 'Telebirr Phone'}
                </label>
                <div
                  className={`flex items-center rounded-xl border px-3 py-2 transition-colors focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500/30 ${
                    isLight
                      ? 'bg-white border-zinc-300'
                      : 'bg-[#111216] border-zinc-800'
                  }`}
                >
                  <Smartphone size={14} className="mr-2 text-zinc-400 shrink-0" />
                  <span
                    className={`border-r pr-2 text-xs font-medium ${
                      isLight ? 'border-zinc-200 text-zinc-500' : 'border-zinc-800 text-zinc-400'
                    }`}
                  >
                    +251
                  </span>
                  <input
                    type="tel"
                    value={phoneNumber.replace(/^0/, '')}
                    onChange={(event) => setPhoneNumber(event.target.value.replace(/\D/g, ''))}
                    placeholder="91 234 5678"
                    className={`min-w-0 flex-1 bg-transparent pl-2.5 text-xs sm:text-sm font-bold outline-none ${
                      isLight
                        ? 'text-zinc-900 placeholder:text-zinc-400'
                        : 'text-white placeholder:text-zinc-600'
                    }`}
                  />
                </div>
              </div>
            )}

            {/* Before You Continue Box */}
            <div
              className={`rounded-xl border p-2.5 text-left ${
                isLight
                  ? 'bg-[#FFF9F5] border-orange-500/18 text-zinc-700'
                  : 'bg-[#111216] border-zinc-800/80 text-zinc-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Info size={14} className="text-orange-500 shrink-0" />
                  <span className={`text-[11px] font-bold ${isLight ? 'text-zinc-800' : 'text-zinc-200'}`}>
                    Participation Notice
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDetails((prev) => !prev)}
                  className="text-[10px] font-bold text-orange-500 hover:text-orange-600 hover:underline cursor-pointer"
                >
                  {showDetails ? 'Hide details' : 'Learn more'}
                </button>
              </div>
              <p className="mt-1 text-[10.5px] leading-relaxed font-normal">
                Fee is non-refundable; your bid isn't charged now. Lowest unique bid wins and only the winner pays their bid.
              </p>
              {showDetails && (
                <p
                  className={`mt-1.5 text-[10.5px] leading-relaxed pt-1.5 border-t animate-in fade-in duration-150 ${
                    isLight
                      ? 'text-zinc-800 border-orange-500/15'
                      : 'text-zinc-300 border-zinc-800/80'
                  }`}
                >
                  {isWallet
                    ? `The participation fee of ${requiredFee.toFixed(2)} Br will be deducted directly from your wallet balance without requiring an online payment push.`
                    : `Make sure your phone number is active to receive the payment prompt. Once confirmed, you will be prompted to authorize the transaction via your chosen provider (${activePayment === 'cbe' ? 'CBE Birr' : 'Telebirr'}).`}
                </p>
              )}
            </div>

            {/* Agreement Checkbox */}
            <div
              onClick={() => setAgreed(!agreed)}
              className="flex items-center gap-2.5 py-0.5 cursor-pointer select-none group"
            >
              <div
                className={`w-[17px] h-[17px] rounded-md border flex items-center justify-center transition-all shrink-0 ${
                  agreed
                    ? 'border-orange-500 text-white shadow-xs'
                    : isLight
                    ? 'bg-white border-zinc-300 group-hover:border-orange-400'
                    : 'bg-[#111216] border-zinc-700 group-hover:border-zinc-500'
                }`}
                style={
                  agreed
                    ? {
                        background: 'linear-gradient(100deg, #ea580c, #f97316 45%, #fb923c 75%, #f59e0b)',
                        color: '#ffffff',
                      }
                    : undefined
                }
              >
                {agreed && <Check size={11} strokeWidth={3.5} style={{ color: '#ffffff' }} />}
              </div>
              <span
                className={`text-[11px] font-medium transition-colors ${
                  isLight
                    ? 'text-zinc-700 group-hover:text-zinc-900'
                    : 'text-zinc-300 group-hover:text-white'
                }`}
              >
                I agree to continue
              </span>
            </div>

            {/* Confirm Button */}
            <button
              type="button"
              onClick={handleConfirmClick}
              disabled={!agreed || isSubmitting || (isWallet && !hasSufficientBalance)}
              style={
                agreed && !isSubmitting && (!isWallet || hasSufficientBalance)
                  ? {
                      background: 'linear-gradient(100deg, #ea580c, #f97316 45%, #fb923c 75%, #f59e0b)',
                      color: '#ffffff',
                      boxShadow: '0 8px 20px rgba(249, 115, 22, 0.3)',
                    }
                  : undefined
              }
              className={`w-full font-black text-xs py-3 px-4 rounded-xl transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 ${
                agreed && !isSubmitting && (!isWallet || hasSufficientBalance)
                  ? 'cursor-pointer active:scale-[0.98] hover:brightness-110 shadow-md'
                  : isLight
                  ? 'bg-[#E4E5EA] text-zinc-400 border border-zinc-300 cursor-not-allowed shadow-none'
                  : 'bg-[#202026] text-zinc-500 border border-zinc-800/80 cursor-not-allowed shadow-none'
              }`}
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <CheckCircle2 size={15} style={{ color: agreed && (!isWallet || hasSufficientBalance) ? '#ffffff' : undefined }} />
                  <span style={{ color: agreed && (!isWallet || hasSufficientBalance) ? '#ffffff' : undefined }}>
                    {isWallet ? 'Pay with Wallet & Place Bid' : 'Confirm & Continue'}
                  </span>
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>,
    document.body
  );
});

export const PaymentBadge = ({ selectedPayment }) => {
  const themeContext = useTheme();
  const isLight =
    themeContext?.theme === 'light' ||
    (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'light');

  const colorClass = isLight ? 'text-orange-600' : 'text-orange-400';

  if (selectedPayment === 'telebirr') {
    return (
      <span className={`font-bold flex items-center gap-1.5 ${colorClass}`}>
        <img src={telebirrLogo} alt="Telebirr" className="h-4 w-auto object-contain rounded" />
        Telebirr
      </span>
    );
  }
  if (selectedPayment === 'cbe') {
    return (
      <span className={`font-bold flex items-center gap-1.5 ${colorClass}`}>
        <img src={cbeLogo} alt="CBE Birr" className="h-4 w-auto object-contain rounded" />
        CBE Birr
      </span>
    );
  }
  return (
    <span className={`font-bold flex items-center gap-1.5 ${colorClass}`}>
      <Wallet size={14} /> Wallet
    </span>
  );
};


