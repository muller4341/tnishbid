import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import telebirrLogo from '../assets/telebirr.png';
import cbeLogo from '../assets/cbe.png';
import ChapaEmbeddedModal from '../components/ChapaEmbeddedModal';
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

const Profile = () => {
  const { user, logout, setUser, socket } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSubPage, setActiveSubPage] = useState(null); // 'payment', 'notifications', 'faq', 'legal' | null
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Add Funds state (Telebirr & CBE automated deposits)
  const [depositMode, setDepositMode] = useState('automatic'); // 'automatic' (Chapa Real-Time) | 'manual' (Direct Transfer Ref)
  const [selectedMethod, setSelectedMethod] = useState('telebirr'); // 'telebirr' | 'cbe'
  const [selectedPreset, setSelectedPreset] = useState(100); // 25, 50, 100, 250, 500, 1000, 'custom'
  const [customAmount, setCustomAmount] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [isSubmittingFund, setIsSubmittingFund] = useState(false);
  const [fundError, setFundError] = useState('');
  const [depositSuccessData, setDepositSuccessData] = useState(null);
  const [chapaCheckoutUrl, setChapaCheckoutUrl] = useState(null);
  const [activeChapaTxRef, setActiveChapaTxRef] = useState(null);

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

  // Notification toggles
  const [notifSettings, setNotifSettings] = useState({
    bidDrops: true,
    outbid: true,
    wins: true,
    promos: false
  });

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

  const handleCopyAccount = (text) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    }
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  const handleChapaDeposit = async () => {
    setFundError('');
    if (!effectiveAmount || effectiveAmount < 10) {
      setFundError('Please select or enter an amount of at least 10 Birr');
      return;
    }

    setIsSubmittingFund(true);
    try {
      const res = await axios.post('/api/payments/chapa/wallet/initialize', {
        amount: effectiveAmount,
        method: selectedMethod,
        phone_number: senderPhone || user?.phone_number || ''
      });

      if (res.data?.checkout_url) {
        setChapaCheckoutUrl(res.data.checkout_url);
        setActiveChapaTxRef(res.data.tx_ref);
      } else {
        setFundError('Could not start Chapa payment session.');
      }
    } catch (err) {
      console.error('Failed to initialize deposit:', err);
      setFundError(err.response?.data?.error || 'Could not connect to payment gateway. Please try again.');
    } finally {
      setIsSubmittingFund(false);
    }
  };

  const handleChapaSuccess = async ({ tx_ref }) => {
    const refToVerify = tx_ref || activeChapaTxRef;
    if (!refToVerify) return;

    setIsSubmittingFund(true);
    try {
      const res = await axios.post('/api/payments/chapa/wallet/verify', {
        tx_ref: refToVerify
      });

      const newBalance = res.data.wallet_balance;
      setProfileData(prev => prev ? { ...prev, wallet_balance: newBalance } : null);
      if (setUser) {
        setUser(prev => prev ? { ...prev, wallet_balance: newBalance } : null);
      }

      setDepositSuccessData({
        amount: res.data.amount || effectiveAmount,
        method: res.data.method || (selectedMethod === 'cbe' ? 'CBE Birr' : 'Telebirr'),
        transaction_id: refToVerify,
        newBalance
      });
      setChapaCheckoutUrl(null);
      setActiveChapaTxRef(null);
    } catch (err) {
      console.error('Chapa verification error:', err);
      setFundError(err.response?.data?.error || 'Payment could not be verified by Chapa. No funds were credited.');
      setChapaCheckoutUrl(null);
    } finally {
      setIsSubmittingFund(false);
    }
  };

  const handleAddFunds = async (e) => {
    if (e) e.preventDefault();
    setFundError('');

    if (!effectiveAmount || effectiveAmount < 10) {
      setFundError('Please enter an amount of at least 10 Birr');
      return;
    }

    if (!transactionId.trim()) {
      setFundError(
        selectedMethod === 'cbe'
          ? 'Please enter your CBE FT Transaction Reference (from SMS or receipt)'
          : 'Please enter your Telebirr Transaction Reference / SMS Code'
      );
      return;
    }

    setIsSubmittingFund(true);
    try {
      const res = await axios.post('/api/users/add-funds', {
        amount: effectiveAmount,
        method: selectedMethod,
        transaction_id: transactionId.trim(),
        phone_number: senderPhone || user?.phone_number || ''
      });

      const newBalance = res.data.wallet_balance;
      setProfileData(prev => prev ? { ...prev, wallet_balance: newBalance } : null);
      if (setUser) {
        setUser(prev => prev ? { ...prev, wallet_balance: newBalance } : null);
      }

      setDepositSuccessData({
        amount: effectiveAmount,
        method: selectedMethod,
        transaction_id: transactionId.trim(),
        newBalance
      });
      setTransactionId('');
    } catch (err) {
      console.error('Failed to add funds:', err);
      setFundError(err.response?.data?.error || 'Verification failed. Please check your transaction reference and try again.');
    } finally {
      setIsSubmittingFund(false);
    }
  };

  // Format member date
  const memberSince = profileData?.created_at 
    ? new Date(profileData.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'Oct 2023';

  const totalBids = profileData?.totalBids ?? 142;
  const auctionsWon = profileData?.auctionsWon ?? 3;
  const activePools = profileData?.activePools ?? 12;

  const displayName = profileData?.name || user?.name || "Hassan Al-Fayed";

  // Sub-page View 1: Payment Methods & Add Funds to Wallet
  if (activeSubPage === 'payment') {
    const isTelebirr = selectedMethod === 'telebirr';
    const companyAccount = isTelebirr ? '0943 41 80 20' : '1000 4821 9382 1';
    const companyAccountHolder = isTelebirr ? 'ትንሽBid (TinishBid Official)' : 'ትንሽBid / Commercial Bank of Ethiopia';

    return (
      <div className="w-full pb-12 pt-1 sm:pt-2 px-0 sm:px-1 max-w-lg mx-auto font-sans antialiased space-y-4 animate-in fade-in duration-200 min-w-0">
        {/* Chapa Embedded Checkout Modal */}
        {chapaCheckoutUrl && (
          <ChapaEmbeddedModal
            checkoutUrl={chapaCheckoutUrl}
            onClose={() => setChapaCheckoutUrl(null)}
            onSuccess={handleChapaSuccess}
            onFailure={({ message }) => {
              setFundError(message || 'Payment cancelled or rejected. No funds were added.');
              setChapaCheckoutUrl(null);
            }}
          />
        )}

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
                <span>Add Funds / Deposit</span>
                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  Instant Coins
                </span>
              </h1>
              <p className="text-[11px] text-zinc-400">Transfer with Telebirr or CBE to receive exact coins</p>
            </div>
          </div>
        </div>

        {/* Current Available Balance Banner */}
        <div className="bg-gradient-to-r from-[#181920] via-[#1E1C14] to-[#181920] border border-amber-500/40 rounded-3xl p-5 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex justify-between items-center relative z-10">
            <div>
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Wallet size={14} className="text-amber-400" />
                <span>Available Wallet Balance</span>
              </p>
              <p className="text-3xl font-black text-amber-400 font-mono tracking-tight mt-1">
                {(profileData?.wallet_balance ?? user?.wallet_balance ?? 0).toFixed(2)}{' '}
                <span className="text-lg text-amber-300/80 font-sans font-bold">Birr</span>
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-400/15 border border-amber-400/30 px-2.5 py-0.5 rounded-full">
                  <Coins size={12} className="text-amber-400" />
                  1 Birr = 1 Bid Coin
                </span>
                <span className="text-[11px] text-zinc-400 font-medium">Automatic balance credit</span>
              </div>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/35 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
              <Coins size={28} className="animate-pulse" />
            </div>
          </div>
        </div>

        {/* Verification Mode Selector: Instant Chapa vs Offline Reference */}
        <div className="bg-[#141519] border border-zinc-800 p-1.5 rounded-2xl grid grid-cols-2 gap-1.5 shadow-md">
          <button
            type="button"
            onClick={() => { setDepositMode('automatic'); setFundError(''); }}
            className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              depositMode === 'automatic'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-lg shadow-amber-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <Zap size={14} className={depositMode === 'automatic' ? 'fill-black' : 'text-amber-400'} />
            <span>⚡ Instant Telebirr/CBE (Chapa)</span>
          </button>
          <button
            type="button"
            onClick={() => { setDepositMode('manual'); setFundError(''); }}
            className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              depositMode === 'manual'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-lg shadow-amber-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <FileText size={14} />
            <span>Manual Transfer Ref</span>
          </button>
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
                  {depositSuccessData.newBalance.toFixed(2)} Birr
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
                <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-black flex items-center justify-center">1</span>
                  <span>Select Payment Method</span>
                </h3>
                <span className="text-[11px] text-zinc-400">Telebirr or CBE</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Telebirr Option */}
                <button
                  type="button"
                  onClick={() => { setSelectedMethod('telebirr'); setFundError(''); }}
                  className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                    isTelebirr 
                      ? 'bg-[#008FE6]/10 border-[#008FE6] shadow-[0_0_20px_rgba(0,143,230,0.2)] ring-1 ring-[#008FE6]' 
                      : 'bg-[#0E0F12] border-zinc-800 hover:border-zinc-700 opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-3">
                    <img 
                      src={telebirrLogo} 
                      alt="Telebirr" 
                      className="h-7 w-auto object-contain rounded" 
                    />
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      isTelebirr ? 'border-[#008FE6] bg-[#008FE6] text-white' : 'border-zinc-700'
                    }`}>
                      {isTelebirr && <Check size={12} className="stroke-[3]" />}
                    </div>
                  </div>
                  <div>
                    <p className="font-extrabold text-sm text-white flex items-center gap-1">
                      <span>Telebirr</span>
                      <span className="text-[10px] text-zinc-400 font-normal">ቴሌብር</span>
                    </p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">Instant Real-time Verification</p>
                  </div>
                </button>

                {/* CBE Option */}
                <button
                  type="button"
                  onClick={() => { setSelectedMethod('cbe'); setFundError(''); }}
                  className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                    !isTelebirr 
                      ? 'bg-[#9B2349]/10 border-[#9B2349] shadow-[0_0_20px_rgba(155,35,73,0.2)] ring-1 ring-[#9B2349]' 
                      : 'bg-[#0E0F12] border-zinc-800 hover:border-zinc-700 opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-3">
                    <img 
                      src={cbeLogo} 
                      alt="CBE" 
                      className="h-7 w-auto object-contain rounded" 
                    />
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      !isTelebirr ? 'border-[#9B2349] bg-[#9B2349] text-white' : 'border-zinc-700'
                    }`}>
                      {!isTelebirr && <Check size={12} className="stroke-[3]" />}
                    </div>
                  </div>
                  <div>
                    <p className="font-extrabold text-sm text-white flex items-center gap-1">
                      <span>CBE Birr</span>
                      <span className="text-[10px] text-zinc-400 font-normal">ንብ / CBE</span>
                    </p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">Commercial Bank of Ethiopia</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Step 2: Choose Coins / Amount */}
            <div className="bg-[#141519] border border-zinc-800 rounded-3xl p-5 shadow-2xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-black flex items-center justify-center">2</span>
                  <span>Amount to Deposit (Coins)</span>
                </h3>
                <span className="text-[11px] font-bold text-amber-400">1 Birr = 1 Coin</span>
              </div>

              {/* Preset Chips */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 25, label: '25 Br', coins: '25 Coins' },
                  { value: 50, label: '50 Br', coins: '50 Coins' },
                  { value: 100, label: '100 Br', coins: '100 Coins', badge: 'POPULAR' },
                  { value: 250, label: '250 Br', coins: '250 Coins' },
                  { value: 500, label: '500 Br', coins: '500 Coins' },
                  { value: 1000, label: '1000 Br', coins: '1000 Coins', badge: 'BEST' },
                ].map((item) => {
                  const isSelected = selectedPreset === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => { setSelectedPreset(item.value); setCustomAmount(''); setFundError(''); }}
                      className={`relative py-2.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected 
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
                      value={selectedPreset === 'custom' ? customAmount : ''}
                      onChange={(e) => {
                        setSelectedPreset('custom');
                        setCustomAmount(e.target.value);
                        setFundError('');
                      }}
                      onFocus={() => setSelectedPreset('custom')}
                      className={`w-full bg-[#0E0F12] border rounded-xl pl-12 pr-4 py-2.5 text-sm text-white focus:outline-none transition-colors ${
                        selectedPreset === 'custom' ? 'border-amber-400' : 'border-zinc-800 focus:border-amber-400'
                      }`}
                    />
                  </div>
                  {selectedPreset === 'custom' && customAmount && (
                    <div className="bg-amber-400/10 border border-amber-400/30 text-amber-400 px-3 py-2 rounded-xl text-xs font-bold shrink-0">
                      +{parseFloat(customAmount) || 0} Coins
                    </div>
                  )}
                </div>
              </div>

              {/* Live Coins preview */}
              <div className="bg-[#0E0F12] border border-amber-500/25 rounded-xl p-3 flex items-center justify-between">
                <span className="text-xs text-zinc-400 font-medium">Exact Coins to be added:</span>
                <span className="text-base font-black text-amber-400 font-mono flex items-center gap-1">
                  <Coins size={16} />
                  +{effectiveAmount} Coins
                </span>
              </div>
            </div>

            {/* Error banner if any */}
            {fundError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-start gap-2 text-xs text-red-400">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{fundError}</span>
              </div>
            )}

            {/* Content for AUTOMATIC (CHAPA) vs MANUAL */}
            {depositMode === 'automatic' ? (
              <div className="bg-[#141519] border border-zinc-800 rounded-3xl p-5 shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-black flex items-center justify-center">3</span>
                    <span>Direct Real-Time Verification (Chapa)</span>
                  </h3>
                  <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded-full">
                    Instant Bank Sync
                  </span>
                </div>

                <div className="bg-[#0E0F12] border border-zinc-800 rounded-2xl p-4 space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-300 block">
                      Phone Number (Telebirr / CBE Birr)
                    </label>
                    <div className="relative">
                      <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="tel"
                        placeholder="e.g. 0912345678"
                        value={senderPhone}
                        onChange={(e) => setSenderPhone(e.target.value)}
                        className="w-full bg-[#141519] border border-zinc-800 focus:border-amber-400 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none transition-colors"
                      />
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      You will receive the official payment prompt to authorize the exact amount on your phone.
                    </p>
                  </div>

                  <div className="border-t border-zinc-800/80 pt-3 space-y-1.5 text-[11px] text-zinc-400">
                    <p className="flex items-center gap-1.5 text-zinc-300">
                      <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                      <span>Authorizes real payment directly through Chapa gateway</span>
                    </p>
                    <p className="flex items-center gap-1.5 text-zinc-300">
                      <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                      <span>Coins are credited automatically as soon as your bank confirms</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleChapaDeposit}
                  disabled={isSubmittingFund || !effectiveAmount}
                  className="w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:brightness-110 active:scale-98 disabled:opacity-50 disabled:pointer-events-none text-black font-black text-sm py-4 px-6 rounded-xl transition-all shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                >
                  {isSubmittingFund ? (
                    <>
                      <RefreshCw size={18} className="animate-spin stroke-[2.5]" />
                      <span>Connecting to Payment Gateway...</span>
                    </>
                  ) : (
                    <>
                      <Zap size={18} className="fill-black" />
                      <span>Pay & Add {effectiveAmount} Coins with {isTelebirr ? 'Telebirr' : 'CBE Birr'}</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Step 3: Company Transfer Account Details */}
                <div className="bg-[#141519] border border-zinc-800 rounded-3xl p-5 shadow-2xl space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-black flex items-center justify-center">3</span>
                      <span>Transfer to Our Official Account</span>
                    </h3>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                      isTelebirr 
                        ? 'bg-[#008FE6]/10 border-[#008FE6]/40 text-[#008FE6]' 
                        : 'bg-[#9B2349]/10 border-[#9B2349]/40 text-rose-300'
                    }`}>
                      {isTelebirr ? 'Telebirr Channel' : 'CBE Account'}
                    </span>
                  </div>

                  {/* Account Card with 1-click Copy */}
                  <div className="bg-[#0E0F12] border border-zinc-800 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                          {isTelebirr ? 'Recipient Telebirr Phone / Number' : 'Commercial Bank of Ethiopia (CBE) Account'}
                        </p>
                        <p className="text-xl font-mono font-black text-white tracking-wider mt-0.5">
                          {companyAccount}
                        </p>
                        <p className="text-[11px] text-amber-400/90 font-medium mt-0.5">
                          Account Name: <span className="font-bold text-zinc-200">{companyAccountHolder}</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyAccount(companyAccount)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1A1C22] hover:bg-zinc-800 text-amber-400 rounded-xl text-xs font-bold border border-zinc-700 transition-all active:scale-95 cursor-pointer shadow"
                      >
                        {copiedAccount ? (
                          <>
                            <Check size={14} className="text-emerald-400 stroke-[3]" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={14} />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="border-t border-zinc-800/80 pt-2.5 space-y-1.5 text-[11px] text-zinc-400">
                      <p className="flex items-start gap-1.5">
                        <span className="font-bold text-amber-400">Step 1:</span>
                        <span>
                          Open your {isTelebirr ? 'Telebirr app or dial *127#' : 'CBE Mobile Banking or CBE Birr app'}.
                        </span>
                      </p>
                      <p className="flex items-start gap-1.5">
                        <span className="font-bold text-amber-400">Step 2:</span>
                        <span>
                          Transfer <strong className="text-white font-mono">{effectiveAmount} Birr</strong> to{' '}
                          <strong className="text-white font-mono">{companyAccount}</strong>.
                        </span>
                      </p>
                      <p className="flex items-start gap-1.5">
                        <span className="font-bold text-amber-400">Step 3:</span>
                        <span>
                          Copy the transaction reference ID from your SMS confirmation and enter it below.
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Step 4: Verification Form */}
                <form onSubmit={handleAddFunds} className="bg-[#141519] border border-zinc-800 rounded-3xl p-5 shadow-2xl space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-black flex items-center justify-center">4</span>
                      <span>Confirm Transfer & Credit Coins</span>
                    </h3>
                  </div>

                  {/* Sender Phone Number Input */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-300 block">
                      Sender Phone Number
                    </label>
                    <div className="relative">
                      <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="tel"
                        placeholder="e.g. 0912345678"
                        value={senderPhone}
                        onChange={(e) => setSenderPhone(e.target.value)}
                        className="w-full bg-[#0E0F12] border border-zinc-800 focus:border-amber-400 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Transaction Reference / SMS Code Input */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-300 block">
                      {isTelebirr 
                        ? 'Telebirr Transaction Reference / SMS Code' 
                        : 'CBE Transaction FT Number (from SMS or receipt)'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={isTelebirr ? 'e.g. TB10823481' : 'e.g. FT261099824'}
                      value={transactionId}
                      onChange={(e) => { setTransactionId(e.target.value); setFundError(''); }}
                      className="w-full bg-[#0E0F12] border border-zinc-800 focus:border-amber-400 rounded-xl px-4 py-2.5 text-sm text-white font-mono placeholder:font-sans focus:outline-none transition-colors"
                    />
                    <p className="text-[10px] text-zinc-400">
                      {isTelebirr 
                        ? 'Valid 8+ character SMS reference number.' 
                        : "Must be a valid CBE 'FT' reference code from your SMS receipt."}
                    </p>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmittingFund || !effectiveAmount}
                    className="w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:brightness-110 active:scale-98 disabled:opacity-50 disabled:pointer-events-none text-black font-black text-sm py-3.5 px-6 rounded-xl transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                  >
                    {isSubmittingFund ? (
                      <>
                        <RefreshCw size={18} className="animate-spin stroke-[2.5]" />
                        <span>Verifying Transfer Code...</span>
                      </>
                    ) : (
                      <>
                        <Coins size={18} className="stroke-[2.5]" />
                        <span>Verify & Add {effectiveAmount} Coins</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Support helpline card */}
            <div className="bg-[#141519] border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between text-xs text-zinc-400">
              <div className="flex items-center gap-2.5">
                <Phone size={16} className="text-amber-400" />
                <div>
                  <p className="font-bold text-zinc-300">Need help with your deposit?</p>
                  <p className="text-[10px] text-zinc-400">24/7 Ethiopian Support line: 0943 41 80 20</p>
                </div>
              </div>
              <a 
                href="tel:0943418020" 
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-[11px] transition-colors"
              >
                Call Support
              </a>
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
            <div className="flex items-center justify-between p-4 bg-[#0E0F12] border border-zinc-800/80 rounded-2xl">
              <div>
                <p className="text-sm font-bold text-white">Unique Bid Drop Alerts</p>
                <p className="text-xs text-zinc-400 mt-0.5">Get notified immediately when your bid becomes duplicate</p>
              </div>
              <input 
                type="checkbox" 
                checked={notifSettings.bidDrops}
                onChange={(e) => setNotifSettings(prev => ({ ...prev, bidDrops: e.target.checked }))}
                className="w-5 h-5 accent-amber-400 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-[#0E0F12] border border-zinc-800/80 rounded-2xl">
              <div>
                <p className="text-sm font-bold text-white">Outbid Warnings</p>
                <p className="text-xs text-zinc-400 mt-0.5">Receive alerts if a lower unique bid takes the lead</p>
              </div>
              <input 
                type="checkbox" 
                checked={notifSettings.outbid}
                onChange={(e) => setNotifSettings(prev => ({ ...prev, outbid: e.target.checked }))}
                className="w-5 h-5 accent-amber-400 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-[#0E0F12] border border-zinc-800/80 rounded-2xl">
              <div>
                <p className="text-sm font-bold text-white">Auction Win Notifications</p>
                <p className="text-xs text-zinc-400 mt-0.5">Instant notification when timer ends and you win</p>
              </div>
              <input 
                type="checkbox" 
                checked={notifSettings.wins}
                onChange={(e) => setNotifSettings(prev => ({ ...prev, wins: e.target.checked }))}
                className="w-5 h-5 accent-amber-400 rounded cursor-pointer"
              />
            </div>
          </div>

          <p className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 pt-2">
            <CheckCircle2 size={16} /> Preferences are saved automatically
          </p>
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
          <span>Verified Platinum Member since</span>
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
        <button
          onClick={() => setActiveSubPage('payment')}
          className="w-full bg-[#141519] hover:bg-[#1A1C22] active:bg-[#1f2129] border border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl p-4 transition-all duration-200 text-left flex items-center justify-between group shadow-md cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
              <CreditCard size={20} />
            </div>
            <div>
              <h2 className="text-sm md:text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                Secure Payment Methods
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5 font-normal">
                Configure wallets, banks & digital cards
              </p>
            </div>
          </div>
          <ChevronRight size={18} className="text-zinc-500 group-hover:text-zinc-300 transition-colors" />
        </button>

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

