import React, { useState, useEffect, useRef, useId, useLayoutEffect, memo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import telebirrLogo from '../assets/telebirr.png';
import cbeLogo from '../assets/cbe.png';
import '@chapa_et/inline.js/lib/inline.js';
import {
  CreditCard,
  Bell,
  HelpCircle,
  FileText,
  LogOut,
  CheckCircle2,
  ChevronRight,
  X,
  Plus,
  ShieldCheck,
  Sparkles,
  Wifi,
  Signal,
  Battery,
  Phone,
  Smartphone,
  Info,
  Wallet,
  User,
  Camera,
  ArrowLeft,
  Copy,
  Check,
  Coins,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  CheckCheck,
  Zap
} from 'lucide-react';

/* Chapa Push Engine for inline USSD / App Push without site redirect */
const ChapaPushEngine = ({ isOpen, amount, txRef, selectedPayment, mobile, onSuccess, onFailure }) => {
  const containerId = `chapa-inline-deposit-${useId().replace(/:/g, '')}`;
  const submitTimer = useRef(null);
  const successRef = useRef(onSuccess);
  const failureRef = useRef(onFailure);
  const normalizedMobile = String(mobile || '').replace(/\D/g, '').replace(/^251(?=[97])/, '0');

  successRef.current = onSuccess;
  failureRef.current = onFailure;

  useLayoutEffect(() => {
    if (!isOpen || !txRef) return undefined;
    const publicKey = import.meta.env.VITE_CHAPA_PUBLIC_KEY || 'CHAPUBK-cjRlKJzo9HXQPNWcLAxnHYchL5kEuu0J';
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
          document.getElementById('popup-container')?.remove();
          try {
            await successRef.current?.({ txRef, chapaRef });
          } catch (error) {
            failureRef.current?.(error.response?.data?.error || 'Payment was approved, but wallet could not be updated.');
          } finally {
            document.getElementById('popup-container')?.remove();
          }
        },
        onPaymentFailure: (message) => {
          document.getElementById('popup-container')?.remove();
          failureRef.current?.(message || 'Payment push failed or was cancelled.');
        },
        onClose: () => {
          document.getElementById('popup-container')?.remove();
        }
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

  if (!isOpen) return null;
  return <div id={containerId} className="hidden" aria-hidden="true" />;
};

/* Deposit Confirmation Pop-up Modal matching BidPaymentModal UI */
const DepositPaymentModal = memo(({
  isOpen,
  onClose,
  amount,
  selectedMethod,
  phone,
  onChangePhone,
  onConfirm,
  isSubmitting,
  inlinePayment,
  onInlineClose,
  onInlineSuccess,
  successData,
  onSuccessDone,
  errorMessage
}) => {
  const themeContext = useTheme();
  const isLight =
    themeContext?.theme === 'light' ||
    (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'light');

  const [agreed, setAgreed] = useState(false);
  const prevIsOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      setAgreed(false);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[100] flex justify-center animate-in fade-in duration-200 backdrop-blur-md ${successData || inlinePayment
        ? 'items-center p-4'
        : 'items-end p-0 sm:items-center sm:p-4'
        } ${isLight ? 'bg-zinc-950/45' : 'bg-black/80'}`}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting && !inlinePayment) onClose?.();
      }}
    >
      <div
        className={`max-w-lg w-full max-h-[88vh] sm:max-h-[92vh] overflow-y-auto px-4 py-4 sm:py-5 sm:px-6 pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))] sm:pb-6 relative text-left space-y-3.5 sm:space-y-4 animate-in duration-200 border ${successData || inlinePayment
          ? 'rounded-3xl zoom-in-95'
          : 'rounded-t-[28px] rounded-b-none sm:rounded-3xl slide-in-from-bottom-4 sm:zoom-in-95'
          } ${isLight
            ? 'bg-white border-orange-500/20 text-zinc-900 shadow-2xl shadow-orange-950/15'
            : 'bg-[#141519] border-zinc-800 text-zinc-100 shadow-2xl'
          }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="deposit-summary-title"
      >
        {/* Top Handle (bottom sheet only) */}
        {!successData && !inlinePayment && (
          <div className={`mx-auto mb-1 h-1.5 w-12 rounded-full shrink-0 ${isLight ? 'bg-zinc-300' : 'bg-zinc-700'}`} />
        )}

        {/* Header */}
        <div
          className={`flex items-center justify-between pb-3 border-b shrink-0 ${isLight ? 'border-orange-500/15' : 'border-zinc-800'
            }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shadow-xs shrink-0 ${successData
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-500'
                : isLight
                  ? 'bg-orange-50 border border-orange-200 text-orange-600'
                  : 'bg-orange-500/15 border border-orange-500/30 text-orange-400'
                }`}
            >
              {successData ? <CheckCircle2 size={18} /> : <Wallet size={18} />}
            </div>
            <div>
              <h2
                id="deposit-summary-title"
                className={`font-black text-lg sm:text-xl tracking-tight ${isLight ? 'text-zinc-900' : 'text-white'
                  }`}
              >
                {successData ? 'Deposit Successful' : inlinePayment ? 'Payment Push Sent' : 'Deposit Summary'}
              </h2>
              <p className={`text-[11px] font-medium ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                {successData ? 'Funds added to your wallet' : inlinePayment ? 'Waiting for PIN authorization' : 'Instant Automatic Wallet Credit'}
              </p>
            </div>
          </div>
          {!successData && !inlinePayment && (
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer border shrink-0 ${isLight
                ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900 border-zinc-200'
                : 'bg-[#1f2026] hover:bg-zinc-700 text-zinc-400 hover:text-white border-zinc-800'
                }`}
              aria-label="Close"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Inline Chapa Push Engine */}
        {inlinePayment && !successData && (
          <ChapaPushEngine
            isOpen
            amount={inlinePayment.amount}
            txRef={inlinePayment.txRef}
            selectedPayment={inlinePayment.selectedPayment || selectedMethod}
            mobile={phone}
            onSuccess={onInlineSuccess}
            onFailure={(msg) => onInlineClose?.(msg)}
          />
        )}

        {successData ? (
          <div className="py-3 px-1 text-center space-y-3.5 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-500 shadow-md">
              <CheckCircle2 size={32} className="stroke-[2.5]" />
            </div>
            <div>
              <h3 className={`text-lg sm:text-xl font-black tracking-tight ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                Deposit Successful! 🎉
              </h3>
              <p className={`mt-1.5 text-xs leading-relaxed max-w-xs mx-auto ${isLight ? 'text-zinc-600' : 'text-zinc-300'}`}>
                <span className={`font-bold ${isLight ? 'text-orange-600' : 'text-orange-400'}`}>
                  +{successData.amount} Coins
                </span>{' '}
                have been added to your wallet automatically.
              </p>
            </div>
            <div className={`border rounded-2xl p-3.5 text-xs text-left space-y-2 ${isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-[#0E0F12] border-zinc-800'
              }`}>
              <div className={`flex justify-between items-center py-0.5 border-b ${isLight ? 'border-zinc-200' : 'border-zinc-800/80'}`}>
                <span className={isLight ? 'text-zinc-500' : 'text-zinc-400'}>Payment Channel</span>
                <span className={`font-bold flex items-center gap-1.5 ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                  <img
                    src={successData.method?.toLowerCase().includes('cbe') ? cbeLogo : telebirrLogo}
                    alt="channel"
                    className="w-4 h-4 object-contain rounded"
                  />
                  {successData.method}
                </span>
              </div>
              <div className={`flex justify-between items-center py-0.5 border-b ${isLight ? 'border-zinc-200' : 'border-zinc-800/80'}`}>
                <span className={isLight ? 'text-zinc-500' : 'text-zinc-400'}>Coins Credited</span>
                <span className="font-bold text-emerald-500 font-mono">+{successData.amount} Coins (ETB)</span>
              </div>
              <div className="flex justify-between items-center py-0.5 pt-1">
                <span className={`font-bold uppercase text-[11px] ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>
                  New Wallet Balance
                </span>
                <span className={`font-mono text-base font-black ${isLight ? 'text-orange-600' : 'text-amber-400'}`}>
                  {Number(successData.newBalance || 0).toFixed(2)} Birr
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onSuccessDone || onClose}
              style={{
                background: 'linear-gradient(100deg, #ea580c, #f97316 45%, #fb923c 75%, #f59e0b)',
                color: '#ffffff',
                boxShadow: '0 8px 24px rgba(249, 115, 22, 0.35)',
              }}
              className="w-full py-3.5 px-4 font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer text-center active:scale-95"
            >
              Done
            </button>
          </div>
        ) : inlinePayment ? (
          <div className="py-4 px-2 text-center space-y-3.5 animate-in fade-in zoom-in-95 duration-200">
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto shadow-md ${isLight
                ? 'bg-orange-50 border border-orange-200 text-orange-600 shadow-orange-500/10'
                : 'bg-orange-500/15 border border-orange-500/30 text-orange-400 shadow-orange-500/10'
                }`}
            >
              <Smartphone size={28} className="animate-pulse" />
            </div>
            <div>
              <h3 className={`text-base sm:text-lg font-black tracking-tight ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                Payment Push Sent!
              </h3>
              <p className={`mt-1.5 text-xs leading-relaxed max-w-xs mx-auto ${isLight ? 'text-zinc-600' : 'text-zinc-300'}`}>
                A payment authorization prompt of{' '}
                <span className={`font-bold ${isLight ? 'text-orange-600' : 'text-orange-400'}`}>
                  {parseFloat(amount || 0).toFixed(2)} Br
                </span>{' '}
                has been sent to your phone (
                <span className={`font-bold ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                  +251 {String(phone || '').replace(/^(\+?251|0)/, '')}
                </span>
                ) via{' '}
                <span className={`font-bold ${isLight ? 'text-orange-600' : 'text-orange-400'}`}>
                  {selectedMethod === 'cbe' ? 'CBE Birr' : 'Telebirr'}
                </span>
                .
              </p>
              <p className={`mt-1 text-[11px] ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                Please check your phone and enter your PIN to approve the deposit.
              </p>
            </div>
            <div className="flex items-center justify-center gap-1.5 text-xs text-orange-500 pt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" />
              <span className="font-bold text-xs tracking-tight">Waiting for authorization…</span>
            </div>
            <button
              type="button"
              onClick={() => onInlineClose?.()}
              className={`mt-2 text-xs underline cursor-pointer transition-colors block mx-auto ${isLight ? 'text-zinc-500 hover:text-zinc-800' : 'text-zinc-500 hover:text-zinc-300'
                }`}
            >
              Cancel Payment
            </button>
          </div>
        ) : (
          <>
            {/* Deposit Details Card */}
            <div
              className={`rounded-2xl border p-3.5 sm:p-4 text-sm transition-colors space-y-2.5 ${isLight
                ? 'bg-[#FFF9F5] border-orange-500/20 shadow-xs'
                : 'bg-[#111216] border-zinc-800/80'
                }`}
            >
              <div
                className={`flex items-start gap-2.5 border-b pb-2.5 ${isLight ? 'border-orange-500/15' : 'border-zinc-800'
                  }`}
              >
                <Coins size={16} className={`mt-0.5 shrink-0 ${isLight ? 'text-orange-600' : 'text-amber-400'}`} />
                <div className="min-w-0 flex-1 flex items-center justify-between">
                  <p className={`text-sm font-medium truncate ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                    Purpose: <span className={`font-bold ${isLight ? 'text-zinc-900' : 'text-white'}`}>Wallet Deposit (Coins)</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-xs sm:text-[13px] font-medium ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                  Coins to Credit:
                </span>
                <span className="font-mono font-bold text-sm sm:text-base text-emerald-500 flex items-center gap-1">
                  +{parseFloat(amount || 0)} Coins
                </span>
              </div>
              <div className="flex items-center justify-between pt-0.5">
                <div className="flex items-center">
                  <span className={`text-xs sm:text-[13px] font-medium ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                    Total Payable:
                  </span>
                  <span
                    className={`ml-2 inline-block rounded-md px-2 py-0.5 text-[9.5px] font-black uppercase tracking-wider border ${isLight
                      ? 'bg-orange-50 border-orange-200 text-orange-600'
                      : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                      }`}
                  >
                    INSTANT SYNC
                  </span>
                </div>
                <span
                  className={`font-mono font-black text-lg sm:text-xl ${isLight ? 'text-[#ea580c]' : 'text-orange-400'
                    }`}
                >
                  {parseFloat(amount || 0).toFixed(2)} Birr
                </span>
              </div>
            </div>

            {/* Phone Number Input */}
            <div>
              <label className={`mb-1.5 block text-xs sm:text-sm font-bold ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>
                {selectedMethod === 'cbe' ? 'CBE Birr Phone' : 'Telebirr Phone'}
              </label>
              <div
                className={`flex items-center rounded-2xl border px-3.5 py-2.5 sm:py-3 transition-colors focus-within:border-orange-500 focus-within:ring-1.5 focus-within:ring-orange-500/30 ${isLight ? 'bg-white border-zinc-300' : 'bg-[#111216] border-zinc-800'
                  }`}
              >
                <Smartphone size={16} className="mr-2.5 text-zinc-400 shrink-0" />
                <span
                  className={`border-r pr-3 text-sm font-bold ${isLight ? 'border-zinc-200 text-zinc-600' : 'border-zinc-800 text-zinc-300'
                    }`}
                >
                  +251
                </span>
                <input
                  type="tel"
                  value={String(phone || '').replace(/^(\+?251|0)/, '')}
                  onChange={(event) => onChangePhone?.(event.target.value.replace(/\D/g, ''))}
                  placeholder="91 234 5678"
                  style={{ fontSize: '16px' }}
                  className={`min-w-0 flex-1 bg-transparent pl-3 text-[16px] sm:text-base font-bold outline-none ${isLight
                    ? 'text-zinc-900 placeholder:text-zinc-400'
                    : 'text-white placeholder:text-zinc-600'
                    }`}
                />
              </div>
            </div>

            {/* Error Message if any */}
            {errorMessage && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-2.5 flex items-start gap-2 text-xs text-red-400">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Agreement Checkbox */}
            <div
              onClick={() => setAgreed(!agreed)}
              className="flex items-center gap-2.5 py-1 cursor-pointer select-none group"
            >
              <div
                className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all shrink-0 ${agreed
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
                {agreed && <Check size={12} strokeWidth={3.5} style={{ color: '#ffffff' }} />}
              </div>
              <span
                className={`text-xs sm:text-sm font-semibold transition-colors ${isLight
                  ? 'text-zinc-700 group-hover:text-zinc-900'
                  : 'text-zinc-300 group-hover:text-white'
                  }`}
              >
                I agree to continue and deposit {parseFloat(amount || 0).toFixed(2)} Br
              </span>
            </div>

            {/* Confirm Button */}
            <button
              type="button"
              onClick={onConfirm}
              disabled={!agreed || isSubmitting || !amount || amount < 10}
              style={
                agreed && !isSubmitting && amount >= 10
                  ? {
                    background: 'linear-gradient(100deg, #ea580c, #f97316 45%, #fb923c 75%, #f59e0b)',
                    color: '#ffffff',
                    boxShadow: '0 8px 24px rgba(249, 115, 22, 0.35)',
                  }
                  : undefined
              }
              className={`w-full font-black text-sm sm:text-base py-3 sm:py-3.5 px-5 rounded-2xl transition-all uppercase tracking-wider flex items-center justify-center gap-2 ${agreed && !isSubmitting && amount >= 10
                ? 'cursor-pointer active:scale-[0.98] hover:brightness-110 shadow-lg'
                : isLight
                  ? 'bg-[#E4E5EA] text-zinc-400 border border-zinc-300 cursor-not-allowed shadow-none'
                  : 'bg-[#202026] text-zinc-500 border border-zinc-800/80 cursor-not-allowed shadow-none'
                }`}
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <CheckCircle2 size={18} style={{ color: agreed && amount >= 10 ? '#ffffff' : undefined }} />
                  <span style={{ color: agreed && amount >= 10 ? '#ffffff' : undefined }}>
                    Pay & Deposit {parseFloat(amount || 0).toFixed(2)} Br
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

const Profile = () => {
  const { user, logout, setUser, socket } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSubPage, setActiveSubPage] = useState(null); // 'payment', 'notifications', 'faq', 'legal' | null
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Add Funds state (Telebirr & CBE automated deposits via Chapa)
  const [selectedMethod, setSelectedMethod] = useState('telebirr'); // 'telebirr' | 'cbe'
  const [selectedPreset, setSelectedPreset] = useState(100); // 25, 50, 100, 250, 500, 1000, 'custom'
  const [customAmount, setCustomAmount] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [isSubmittingFund, setIsSubmittingFund] = useState(false);
  const [fundError, setFundError] = useState('');
  const [depositSuccessData, setDepositSuccessData] = useState(null);
  const [inlineDeposit, setInlineDeposit] = useState(null); // { txRef, amount, selectedPayment, mobile }
  const [showDepositModal, setShowDepositModal] = useState(false);

  // Close logout confirmation on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showLogoutConfirm) {
        setShowLogoutConfirm(false);
      }
    };
    if (showLogoutConfirm) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [showLogoutConfirm]);

  // Dynamic Avatar state (defaults to human icon, user can upload custom photo)
  const avatarStorageKey = user?.id ? `user_avatar_${user.id}` : 'user_avatar_guest';
  const [avatarUrl, setAvatarUrl] = useState(() => {
    return localStorage.getItem(avatarStorageKey) || null;
  });

  const handleAvatarUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const result = reader.result;
        setAvatarUrl(result);
        localStorage.setItem(avatarStorageKey, result);
        try {
          await axios.put('/api/users/profile-image', { image_url: result });
        } catch (err) {
          console.error('Failed to sync avatar with server:', err);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = async (e) => {
    e.stopPropagation();
    setAvatarUrl(null);
    localStorage.removeItem(avatarStorageKey);
    try {
      await axios.put('/api/users/profile-image', { image_url: '' });
    } catch (err) {
      console.error('Failed to remove avatar on server:', err);
    }
  };

  // Notification toggles & persistence
  const notifStorageKey = user?.id ? `notif_settings_${user.id}` : 'notif_settings_guest';
  const [notifSettings, setNotifSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(notifStorageKey);
      if (saved) return JSON.parse(saved);
    } catch { }
    return {
      bidDrops: true,
      wins: true
    };
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      axios.get('/api/users/notification-preferences')
        .then(res => {
          if (res.data) {
            const loaded = {
              bidDrops: res.data.bidDrops !== false,
              wins: res.data.wins !== false
            };
            setNotifSettings(loaded);
            localStorage.setItem(notifStorageKey, JSON.stringify(loaded));
          }
        })
        .catch(err => console.warn('Could not fetch notification preferences:', err.message));
    }
  }, [user, notifStorageKey]);

  const handleTogglePreference = async (key, val) => {
    const updated = {
      ...notifSettings,
      [key]: val
    };
    setNotifSettings(updated);
    localStorage.setItem(notifStorageKey, JSON.stringify(updated));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2200);

    try {
      await axios.put('/api/users/notification-preferences', updated);
    } catch (err) {
      console.warn('Could not sync notification preferences:', err.message);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get('/api/users/profile');
        setProfileData(res.data);
        if (res.data.image_url) {
          setAvatarUrl(res.data.image_url);
          localStorage.setItem(avatarStorageKey, res.data.image_url);
        }
      } catch (err) {
        console.error('Failed to load profile data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Initialize sender phone
  useEffect(() => {
    if (user?.phone_number && !senderPhone) {
      setSenderPhone(user.phone_number);
    }
  }, [user, senderPhone]);

  // Real-time wallet update listener
  useEffect(() => {
    if (socket) {
      const handleWalletUpdated = (data) => {
        if (data?.wallet_balance !== undefined) {
          setProfileData(prev => prev ? { ...prev, wallet_balance: data.wallet_balance } : null);
        }
      };
      socket.on('wallet_updated', handleWalletUpdated);
      return () => socket.off('wallet_updated', handleWalletUpdated);
    }
  }, [socket]);

  const effectiveAmount = selectedPreset === 'custom'
    ? (parseFloat(customAmount) || 0)
    : (parseFloat(selectedPreset) || 0);

  const handleInitiateDeposit = async (overrideParams = {}) => {
    setFundError('');
    const amt = overrideParams.amount !== undefined ? overrideParams.amount : effectiveAmount;
    const method = overrideParams.method || selectedMethod;
    const phone = overrideParams.phone !== undefined ? overrideParams.phone : (senderPhone || user?.phone_number || '');

    if (!amt || amt < 10) {
      setFundError('Please select or enter an amount of at least 10 Birr');
      return;
    }

    setIsSubmittingFund(true);
    try {
      const res = await axios.post('/api/payments/chapa/wallet/inline/prepare', {
        amount: amt,
        method: method
      });

      setInlineDeposit({
        txRef: res.data.tx_ref,
        amount: res.data.amount,
        selectedPayment: res.data.method || method,
        mobile: phone
      });
    } catch (err) {
      console.error('Failed to prepare inline deposit:', err);
      setFundError(err.response?.data?.error || 'Could not initiate payment. Please try again.');
    } finally {
      setIsSubmittingFund(false);
    }
  };

  const handleInlineDepositSuccess = async ({ txRef }) => {
    setIsSubmittingFund(true);
    try {
      const res = await axios.post('/api/payments/chapa/wallet/verify', {
        tx_ref: txRef,
        method: selectedMethod
      });

      const newBalance = res.data.wallet_balance;
      setProfileData(prev => prev ? { ...prev, wallet_balance: newBalance } : null);
      if (setUser) {
        setUser(prev => prev ? { ...prev, wallet_balance: newBalance } : null);
      }

      setDepositSuccessData({
        amount: res.data.amount || effectiveAmount,
        method: res.data.method || (selectedMethod === 'cbe' ? 'CBE Birr' : 'Telebirr'),
        transaction_id: txRef,
        newBalance
      });
      setInlineDeposit(null);
    } catch (err) {
      console.error('Deposit verification error:', err);
      setFundError(err.response?.data?.error || 'Payment was approved, but could not be verified automatically. Please contact support.');
      setInlineDeposit(null);
    } finally {
      setIsSubmittingFund(false);
    }
  };

  const handleInlineDepositClose = (msg) => {
    setInlineDeposit(null);
    if (msg && typeof msg === 'string') {
      setFundError(msg);
      setTimeout(() => setFundError(''), 4500);
    }
  };

  const handleCloseDepositModal = () => {
    setShowDepositModal(false);
    setInlineDeposit(null);
    setDepositSuccessData(null);
    setFundError('');
  };

  // Format member date
  const memberSince = profileData?.created_at
    ? new Date(profileData.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'Oct 2023';

  const totalBids = profileData?.totalBids ?? '';
  const auctionsWon = profileData?.auctionsWon ?? '';
  const activePools = profileData?.activePools ?? '';

  const displayName = profileData?.name || user?.name || "Hassan Al-Fayed";

  // Sub-page View 1: Payment Methods & Add Funds to Wallet
  if (activeSubPage === 'payment') {
    const isTelebirr = selectedMethod === 'telebirr';

    return (
      <div className="w-full pb-12 pt-1 sm:pt-2 px-0 sm:px-1 max-w-lg mx-auto font-sans antialiased space-y-4 animate-in fade-in duration-200 min-w-0">
        {/* Deposit Payment Modal (Inline USSD / App Push - no Chapa site redirect) */}
        <DepositPaymentModal
          isOpen={showDepositModal}
          onClose={handleCloseDepositModal}
          amount={effectiveAmount}
          selectedMethod={selectedMethod}
          phone={senderPhone}
          onChangePhone={(val) => setSenderPhone(val)}
          onConfirm={() => {
            handleInitiateDeposit({
              amount: effectiveAmount,
              method: selectedMethod,
              phone: senderPhone
            });
          }}
          isSubmitting={isSubmittingFund}
          inlinePayment={inlineDeposit}
          onInlineClose={handleInlineDepositClose}
          onInlineSuccess={handleInlineDepositSuccess}
          successData={depositSuccessData}
          onSuccessDone={handleCloseDepositModal}
          errorMessage={fundError}
        />

        {/* Header */}
        <div className="flex items-center justify-between py-2 px-1 border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setActiveSubPage(null); setDepositSuccessData(null); }}
              className="w-9 h-9 rounded-full bg-[#141519] border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white hover:border-amber-500/40 transition-colors cursor-pointer"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="font-serif font-black text-xl text-white tracking-tight flex items-center gap-2">
                <span>Add Funds</span>
              </h1>
            </div>
          </div>
        </div>

        {/* Current Available Balance Banner */}
        <div className="bg-gradient-to-r from-[#181920] via-[#1E1C14] to-[#181920] border border-amber-500/40 rounded-3xl p-5 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex justify-between items-center relative z-10">
            <div>
              <p className="text-xs text-zinc-400 font-bold tracking-wider flex items-center gap-1.5">
                <Wallet size={10} className="text-amber-400" />
                <span>Available Wallet Balance</span>
              </p>
              <p className="text-xl font-black text-amber-400 font-mono tracking-tight mt-1">
                {(profileData?.wallet_balance ?? user?.wallet_balance ?? 0).toFixed(2)}{' '}
                <span className="text-lg text-amber-300/80 font-sans font-bold">Birr</span>
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-400/15 border border-amber-400/30 px-2.5 py-0.5 rounded-full">
                  <Coins size={10} className="text-amber-400" />
                  1 Birr = 1 Bid Coin
                </span>
              </div>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/35 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
              <Coins size={28} className="animate-pulse" />
            </div>
          </div>
        </div>

        {/* Celebratory Success Screen if payment just completed */}
        {depositSuccessData ? (
          <div className="bg-[#141519] border border-emerald-500/40 rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle2 size={36} className="stroke-[2.5]" />
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                Deposit Successful! 🎉
              </h2>
              <p className="text-sm text-zinc-300">
                <span className="font-extrabold text-amber-400 text-lg">
                  +{depositSuccessData.amount} Coins
                </span>{' '}
                have been added to your wallet automatically.
              </p>
            </div>

            <div className="bg-[#0E0F12] border border-zinc-800 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-zinc-800/80">
                <span className="text-zinc-400 font-medium">Payment Channel</span>
                <span className="font-bold text-white flex items-center gap-1.5">
                  <img
                    src={depositSuccessData.method?.toLowerCase().includes('cbe') ? cbeLogo : telebirrLogo}
                    alt="channel"
                    className="w-4 h-4 object-contain rounded"
                  />
                  {depositSuccessData.method}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-zinc-800/80">
                <span className="text-zinc-400 font-medium">Transaction Reference</span>
                <span className="font-mono font-bold text-amber-400">{depositSuccessData.transaction_id}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-zinc-800/80">
                <span className="text-zinc-400 font-medium">Coins Credited</span>
                <span className="font-bold text-emerald-400">+{depositSuccessData.amount} Coins (ETB)</span>
              </div>
              <div className="flex justify-between items-center py-1 pt-2">
                <span className="text-zinc-300 font-bold uppercase">New Wallet Balance</span>
                <span className="font-mono text-base font-black text-amber-400">
                  {Number(depositSuccessData.newBalance || 0).toFixed(2)} Birr
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setDepositSuccessData(null)}
                className="w-full py-3 px-4 bg-[#1A1C22] hover:bg-[#22242D] text-zinc-200 font-bold text-xs uppercase tracking-wider rounded-xl border border-zinc-700/80 transition-colors cursor-pointer text-center"
              >
                Deposit More
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:brightness-110 active:scale-95 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer text-center flex items-center justify-center gap-1"
              >
                <span>Bid on Items</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Step 1: Choose Payment Method */}
            <div className="bg-[#141519] border border-zinc-800 rounded-3xl p-5 shadow-2xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-zinc-300 tracking-wider flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-black flex items-center justify-center">1</span>
                  <span>Select Payment Method</span>
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Telebirr Option */}
                <button
                  type="button"
                  onClick={() => { setSelectedMethod('telebirr'); setFundError(''); }}
                  className={`py-2 px-3 rounded-xl border text-left transition-all relative flex flex-col gap-1.5 cursor-pointer active:scale-[0.98] ${isTelebirr
                    ? 'bg-[#008FE6]/10 border-[#008FE6] shadow-[0_0_15px_rgba(0,143,230,0.2)] ring-1 ring-[#008FE6]'
                    : 'bg-[#0E0F12] border-zinc-800 hover:border-zinc-700 opacity-80 hover:opacity-100'
                    }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <img
                      src={telebirrLogo}
                      alt="Telebirr"
                      className="h-5.5 w-auto object-contain rounded"
                    />
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${isTelebirr ? 'border-[#008FE6] bg-[#008FE6] text-white' : 'border-zinc-700'
                      }`}>
                      {isTelebirr && <Check size={10} className="stroke-[3]" />}
                    </div>
                  </div>
                  <div>
                    <p className="font-extrabold text-xs sm:text-sm text-white">
                      Telebirr
                    </p>
                  </div>
                </button>

                {/* CBE Option */}
                <button
                  type="button"
                  onClick={() => { setSelectedMethod('cbe'); setFundError(''); }}
                  className={`py-2 px-3 rounded-xl border text-left transition-all relative flex flex-col gap-1.5 cursor-pointer active:scale-[0.98] ${!isTelebirr
                    ? 'bg-[#9B2349]/10 border-[#9B2349] shadow-[0_0_15px_rgba(155,35,73,0.2)] ring-1 ring-[#9B2349]'
                    : 'bg-[#0E0F12] border-zinc-800 hover:border-zinc-700 opacity-80 hover:opacity-100'
                    }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <img
                      src={cbeLogo}
                      alt="CBE"
                      className="h-5.5 w-auto object-contain rounded"
                    />
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${!isTelebirr ? 'border-[#9B2349] bg-[#9B2349] text-white' : 'border-zinc-700'
                      }`}>
                      {!isTelebirr && <Check size={10} className="stroke-[3]" />}
                    </div>
                  </div>
                  <div>
                    <p className="font-extrabold text-xs sm:text-sm text-white">
                      CBE Birr
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Step 2: Choose Coins / Amount */}
            <div className="bg-[#141519] border border-zinc-800 rounded-3xl p-5 shadow-2xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-zinc-300 tracking-wider flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-black flex items-center justify-center">2</span>
                  <span>Amount to Deposit (Coins)</span>
                </h3>
                <span className="text-[11px] font-bold text-amber-400">1 Birr = 1 Coin</span>
              </div>

              {/* Preset Chips */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 27, label: '25 Br', coins: '27 Coins' },
                  { value: 55, label: '50 Br', coins: '55 Coins' },
                  { value: 113, label: '100 Br', coins: '113 Coins', badge: 'POPULAR' },
                  { value: 270, label: '250 Br', coins: '270 Coins' },
                  { value: 530, label: '500 Br', coins: '530 Coins' },
                  { value: 1050, label: '1000 Br', coins: '1050 Coins', badge: 'BEST' },
                ].map((item) => {
                  const isSelected = selectedPreset === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => { setSelectedPreset(item.value); setCustomAmount(`${item.value}`); setFundError(''); }}
                      className={`relative py-2.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${isSelected
                        ? 'bg-gradient-to-b from-amber-500/20 to-amber-500/5 border-amber-400 text-white shadow-md'
                        : 'bg-[#0E0F12] border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white'
                        }`}
                    >
                      {item.badge && (
                        <span className="absolute -top-2 right-2 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-black text-[8px] px-1.5 py-0.2 rounded-full uppercase tracking-wider shadow">
                          {item.badge}
                        </span>
                      )}
                      <p className="font-extrabold text-sm">{item.label}</p>
                      <p className={`text-[10px] font-semibold ${isSelected ? 'text-amber-400' : 'text-zinc-500'}`}>
                        +{item.coins}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Custom Amount option */}
              <div className="pt-1">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                      ETB
                    </span>
                    <input
                      type="number"
                      min="10"
                      step="1"
                      placeholder="Or enter custom amount..."
                      value={selectedPreset === 'custom' ? customAmount : `${effectiveAmount}`}
                      onChange={(e) => {
                        setSelectedPreset('custom');
                        setCustomAmount(e.target.value);
                        setFundError('');
                      }}
                      onFocus={() => setSelectedPreset('custom')}
                      style={{ fontSize: '16px' }}
                      className={`w-full bg-[#0E0F12] border rounded-xl pl-12 pr-4 py-2.5 text-[16px] text-white focus:outline-none transition-colors ${selectedPreset === 'custom' ? 'border-amber-400' : 'border-zinc-800 focus:border-amber-400'
                        }`}
                    />
                  </div>

                  <div className="bg-amber-400/10 border border-amber-400/30 text-amber-400 px-3 py-2 rounded-xl text-xs font-bold shrink-0">
                    +{parseFloat(effectiveAmount) || 0} Coins
                  </div>

                </div>
              </div>


            </div>

            {/* Error banner if any */}
            {fundError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-start gap-2 text-xs text-red-400">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{fundError}</span>
              </div>
            )}

            {/* Step 3: Trigger Pop-up Modal */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  if (!effectiveAmount || effectiveAmount < 1) {
                    setFundError('Please select or enter an amount of at least 10 Birr');
                    return;
                  }
                  setFundError('');
                  setShowDepositModal(true);
                }}
                disabled={!effectiveAmount || effectiveAmount < 1}
                style={{


                  boxShadow: '0 8px 24px rgba(249, 115, 22, 0.35)',
                }}
                className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-amber-600 hover:brightness-110 text-black rounded-2xl font-black text-xs uppercase tracking-wider shadow-md shadow-amber-500/10 transition-all active:scale-[0.98] flex justify-center items-center gap-2"
              >

                <span>Deposit Coins</span>
              </button>
            </div>

          </div>
        )}
      </div>
    );
  }

  // Sub-page View 2: Notification Preferences
  if (activeSubPage === 'notifications') {
    return (
      <div className="w-full pb-8 sm:pb-12 pt-1 sm:pt-2 px-0 sm:px-1 max-w-lg mx-auto font-sans antialiased space-y-5 animate-in fade-in duration-200 min-w-0">
        <div className="flex items-center gap-3 py-2 px-1 border-b border-zinc-800/80">
          <button
            onClick={() => setActiveSubPage(null)}
            className="w-9 h-9 rounded-full bg-[#141519] border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-serif font-black text-xl text-white tracking-tight">
            Notification Preferences
          </h1>
        </div>

        <div className="bg-[#141519] border border-zinc-800 rounded-3xl p-5 shadow-2xl space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-[#0E0F12] border border-zinc-800/80 rounded-2xl hover:border-zinc-700/80 transition-colors">
              <div>
                <p className="text-sm font-bold text-white flex items-center gap-2">
                  <span>New Bid Post</span>
                  {notifSettings.bidDrops && (
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      Active
                    </span>
                  )}
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">Get notified immediately when a new bid is posted</p>
              </div>
              <input
                type="checkbox"
                checked={Boolean(notifSettings.bidDrops)}
                onChange={(e) => handleTogglePreference('bidDrops', e.target.checked)}
                className="w-5 h-5 accent-amber-400 rounded cursor-pointer transition-transform active:scale-95"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-[#0E0F12] border border-zinc-800/80 rounded-2xl hover:border-zinc-700/80 transition-colors">
              <div>
                <p className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Auction Win Notifications</span>
                  {notifSettings.wins && (
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      Active
                    </span>
                  )}
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">Instant notification when timer ends and you win</p>
              </div>
              <input
                type="checkbox"
                checked={Boolean(notifSettings.wins)}
                onChange={(e) => handleTogglePreference('wins', e.target.checked)}
                className="w-5 h-5 accent-amber-400 rounded cursor-pointer transition-transform active:scale-95"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
              <CheckCircle2 size={16} className={saveSuccess ? "animate-bounce text-emerald-400" : "text-emerald-500"} />
              <span>{saveSuccess ? 'Preferences saved successfully!' : 'Preferences are saved automatically'}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Sub-page View 3: Help & FAQ
  if (activeSubPage === 'faq') {
    return (
      <div className="w-full pb-8 sm:pb-12 pt-1 sm:pt-2 px-0 sm:px-1 max-w-lg mx-auto font-sans antialiased space-y-5 animate-in fade-in duration-200 min-w-0">
        <div className="flex items-center gap-3 py-2 px-1 border-b border-zinc-800/80">
          <button
            onClick={() => setActiveSubPage(null)}
            className="w-9 h-9 rounded-full bg-[#141519] border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-serif font-black text-xl text-white tracking-tight">
            System Help & FAQ Support
          </h1>
        </div>

        <div className="space-y-3.5">
          <div className="bg-[#141519] border border-zinc-800 p-5 rounded-3xl shadow-xl space-y-1">
            <h4 className="font-bold text-amber-400 text-sm">What is a Lowest Unique Bid?</h4>
            <p className="text-xs text-zinc-400 leading-relaxed pt-1">
              In our auction pools, the winner is the user who places the lowest bid amount that NO OTHER user has placed! If two users place the exact same bid, it becomes duplicate and non-unique.
            </p>
          </div>

          <div className="bg-[#141519] border border-zinc-800 p-5 rounded-3xl shadow-xl space-y-1">
            <h4 className="font-bold text-amber-400 text-sm">How do I win iPhone & Luxury pools?</h4>
            <p className="text-xs text-zinc-400 leading-relaxed pt-1">
              Analyze current price ranges, place strategic decimal bids, and monitor real-time websocket duplicate notifications to adjust your bids before the timer expires.
            </p>
          </div>

          <div className="bg-[#141519] border border-zinc-800 p-5 rounded-3xl shadow-xl space-y-1">
            <h4 className="font-bold text-amber-400 text-sm">Are deposits instantly credited?</h4>
            <p className="text-xs text-zinc-400 leading-relaxed pt-1">
              Yes, Telebirr, CBE Birr, and bank integrations update your wallet balance in real-time.
            </p>
          </div>

          <div className="bg-[#141519] border border-zinc-800 p-5 rounded-3xl shadow-xl space-y-1">
            <h4 className="font-bold text-amber-400 text-sm">How do I claim my won item?</h4>
            <p className="text-xs text-zinc-400 leading-relaxed pt-1">
              When an auction settles and you win, our admin team contacts you via your registered phone number to arrange instant item delivery or pickup.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Sub-page View 4: Legal & Policies
  if (activeSubPage === 'legal') {
    return (
      <div className="w-full pb-8 sm:pb-12 pt-1 sm:pt-2 px-0 sm:px-1 max-w-lg mx-auto font-sans antialiased space-y-5 animate-in fade-in duration-200 min-w-0">
        <div className="flex items-center gap-3 py-2 px-1 border-b border-zinc-800/80">
          <button
            onClick={() => setActiveSubPage(null)}
            className="w-9 h-9 rounded-full bg-[#141519] border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-serif font-black text-xl text-white tracking-tight">
            BidWin Legal Rules & Policies
          </h1>
        </div>

        <div className="space-y-4">
          <div className="bg-[#141519] border border-zinc-800 p-5 rounded-3xl shadow-xl space-y-2">
            <h4 className="font-bold text-amber-400 text-sm flex items-center gap-2">
              <ShieldCheck size={18} className="text-amber-400" /> Anti-Bot & Fair Play Guarantee
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              All bids are cryptographically verified and bound to validated phone numbers to guarantee 100% human competition with zero bot manipulation.
            </p>
          </div>

          <div className="bg-[#141519] border border-zinc-800 p-5 rounded-3xl shadow-xl space-y-2">
            <h4 className="font-bold text-amber-400 text-sm flex items-center gap-2">
              <Sparkles size={18} className="text-amber-400" /> Transparency Policy
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Full audit logs of bid uniqueness and winning history are published immediately upon pool settlement for full public verification.
            </p>
          </div>

          <div className="bg-[#141519] border border-zinc-800 p-5 rounded-3xl shadow-xl space-y-2">
            <h4 className="font-bold text-amber-400 text-sm flex items-center gap-2">
              <FileText size={18} className="text-amber-400" /> Terms of Service
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              By participating in BidWin auctions, users agree to follow fair bidding guidelines and maintain valid contact details for prize redemption.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full pb-8 sm:pb-12 pt-1 sm:pt-2 px-0 sm:px-1 max-w-lg mx-auto font-sans antialiased min-w-0">
      {/* Top Mobile Status Header (matching Screenshot frame aesthetic) */}


      {/* User Header Section */}
      <div className="flex flex-col items-center text-center mt-2 mb-6">
        <div
          className="relative group cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
          title="Click to upload profile photo"
        >
          {/* Hidden File Input for Custom Image Upload */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleAvatarUpload}
            className="hidden"
          />

          <div className="w-24 h-24 md:w-28 md:h-28 rounded-full p-1 bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600 shadow-[0_0_25px_rgba(251,191,36,0.35)] flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform duration-200">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-full h-full object-cover rounded-full bg-zinc-900 border-2 border-[#0A0B0E]"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-[#15171C] border-2 border-[#0A0B0E] flex items-center justify-center text-amber-400">
                <User size={52} className="stroke-[1.75]" />
              </div>
            )}

            {/* Subtle Overlay Hint on Hover */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex flex-col items-center justify-center text-white text-[10px] font-bold">
              <Camera size={18} className="text-amber-400 mb-0.5" />
              <span>{avatarUrl ? 'Change Photo' : 'Upload Photo'}</span>
            </div>
          </div>

          {/* Camera Badge Icon on bottom right */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="absolute bottom-0 right-0 w-8 h-8 bg-amber-400 hover:bg-amber-300 text-black border-2 border-[#0A0B0E] rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95"
            title="Upload photo"
          >
            <Camera size={14} className="font-extrabold stroke-[2.5]" />
          </button>
        </div>

        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mt-4">
          {displayName}
        </h1>

        <p className="text-xs md:text-sm font-medium text-zinc-400 mt-1 flex items-center gap-1">
          <span>Verified Member since</span>
          <span className="text-zinc-300 font-semibold">{memberSince}</span>
        </p>

        <p
          onClick={() => fileInputRef.current?.click()}
          className="text-[11px] font-semibold text-amber-400/80 hover:text-amber-400 cursor-pointer mt-1 flex items-center gap-1 transition-colors"
        >
          <Camera size={12} />
          <span>{avatarUrl ? 'Change profile photo' : 'Tap to upload custom profile photo'}</span>
        </p>
      </div>

      {/* Wallet Balance Banner */}
      <div className="bg-gradient-to-r from-[#181920] via-[#1C1E26] to-[#181920] border border-amber-500/35 rounded-2xl p-4 my-4 flex items-center justify-between shadow-xl relative overflow-hidden group">
        <div className="flex items-center gap-3.5 z-10">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-md">
            <Wallet size={22} className="stroke-[2.2]" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">Available Wallet Balance</p>
            <p className="text-xl md:text-2xl font-black text-amber-400 font-mono tracking-tight mt-0.5">
              {(profileData?.wallet_balance ?? user?.wallet_balance ?? 0).toFixed(2)} Birr
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActiveSubPage('payment')}
          className="z-10 px-3.5 py-2 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:brightness-110 active:scale-95 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus size={14} className="stroke-[3]" />
          <span>Add Funds</span>
        </button>
      </div>

      {/* 3 Stats Grid */}
      <div className="grid grid-cols-3 gap-3 my-4">
        {/* Total Bids */}
        <div className="bg-[#141519] border border-zinc-800/80 rounded-2xl p-3.5 text-center flex flex-col items-center justify-center shadow-lg transition-transform hover:scale-[1.02]">
          <span className="text-2xl md:text-3xl font-black text-amber-400 tracking-tight">
            {totalBids}
          </span>
          <span className="text-[11px] md:text-xs text-zinc-400 font-medium mt-1">
            Total Bids
          </span>
        </div>

        {/* Auctions Won */}
        <div className="bg-[#141519] border border-zinc-800/80 rounded-2xl p-3.5 text-center flex flex-col items-center justify-center shadow-lg transition-transform hover:scale-[1.02]">
          <span className="text-2xl md:text-3xl font-black text-emerald-400 tracking-tight">
            {auctionsWon}
          </span>
          <span className="text-[11px] md:text-xs text-zinc-400 font-medium mt-1">
            Auctions Won
          </span>
        </div>

        {/* Active pools */}
        <div className="bg-[#141519] border border-zinc-800/80 rounded-2xl p-3.5 text-center flex flex-col items-center justify-center shadow-lg transition-transform hover:scale-[1.02]">
          <span className="text-2xl md:text-3xl font-black text-white tracking-tight">
            {activePools}
          </span>
          <span className="text-[11px] md:text-xs text-zinc-400 font-medium mt-1">
            Active pools
          </span>
        </div>
      </div>

      {/* Action Menu List */}
      <div className="space-y-3 mt-4">
        {/* 1. Secure Payment Methods */}


        {/* 2. Notification Settings */}
        <button
          onClick={() => setActiveSubPage('notifications')}
          className="w-full bg-[#141519] hover:bg-[#1A1C22] active:bg-[#1f2129] border border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl p-4 transition-all duration-200 text-left flex items-center justify-between group shadow-md cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
              <Bell size={20} />
            </div>
            <div>
              <h2 className="text-sm md:text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                Notification Settings
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5 font-normal">
                Get real-time unique bid drop alerts
              </p>
            </div>
          </div>
          <ChevronRight size={18} className="text-zinc-500 group-hover:text-zinc-300 transition-colors" />
        </button>

        {/* 3. System Help & FAQ Support */}
        <button
          onClick={() => setActiveSubPage('faq')}
          className="w-full bg-[#141519] hover:bg-[#1A1C22] active:bg-[#1f2129] border border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl p-4 transition-all duration-200 text-left flex items-center justify-between group shadow-md cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
              <HelpCircle size={20} />
            </div>
            <div>
              <h2 className="text-sm md:text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                System Help & FAQ Support
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5 font-normal">
                Learn bid game tactics & secure operations
              </p>
            </div>
          </div>
          <ChevronRight size={18} className="text-zinc-500 group-hover:text-zinc-300 transition-colors" />
        </button>

        {/* 4. BidWin Legal Rules & Policies */}
        <button
          onClick={() => setActiveSubPage('legal')}
          className="w-full bg-[#141519] hover:bg-[#1A1C22] active:bg-[#1f2129] border border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl p-4 transition-all duration-200 text-left flex items-center justify-between group shadow-md cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-sm md:text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                BidWin Legal Rules & Policies
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5 font-normal">
                Transparent operations conditions
              </p>
            </div>
          </div>
          <ChevronRight size={18} className="text-zinc-500 group-hover:text-zinc-300 transition-colors" />
        </button>

        {/* 5. Sign Out Profile Session */}
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full bg-[#141519] hover:bg-rose-950/20 active:bg-rose-950/30 border border-zinc-800/80 hover:border-rose-900/50 rounded-2xl p-4 transition-all duration-200 text-left flex items-center justify-between group shadow-md cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 group-hover:scale-105 transition-transform">
              <LogOut size={20} />
            </div>
            <div>
              <h2 className="text-sm md:text-base font-bold text-rose-400 group-hover:text-rose-300 transition-colors">
                Sign Out Profile Session
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5 font-normal">
                Logout cleanly from device
              </p>
            </div>
          </div>
          <ChevronRight size={18} className="text-zinc-600 group-hover:text-rose-400 transition-colors" />
        </button>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-[#141519] border border-zinc-800/90 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200"
          >
            {/* Top ambient glow */}
            <div className="absolute -top-16 -right-16 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-start justify-between gap-3 relative z-10 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/25 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-500/10">
                <LogOut size={22} />
              </div>
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="w-8 h-8 rounded-full bg-zinc-800/70 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>

            <div className="relative z-10 text-left">
              <h3 className="text-lg font-bold text-white tracking-tight">
                Sign Out of BidWin?
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1.5 leading-relaxed">
                Are you sure you want to end your session? You will need to sign back in with your phone number to place bids and access your wallet.
              </p>
              {user?.phone && (
                <div className="mt-3.5 py-2 px-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 text-xs text-zinc-400 flex items-center gap-2">
                  <Phone size={13} className="text-zinc-500 shrink-0" />
                  <span className="truncate">Active account: <strong className="text-zinc-200">{user.phone}</strong></span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5 mt-6 relative z-10">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-zinc-800/90 hover:bg-zinc-800 active:bg-zinc-700 text-zinc-200 border border-zinc-700/60 transition-all cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-600 active:scale-[0.98] text-white shadow-lg shadow-rose-600/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;

