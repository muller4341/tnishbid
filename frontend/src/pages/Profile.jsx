import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
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
  ArrowLeft
} from 'lucide-react';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSubPage, setActiveSubPage] = useState(null); // 'payment', 'notifications', 'faq', 'legal' | null
  const [addFundsAmount, setAddFundsAmount] = useState('');
  const [fundingSuccess, setFundingSuccess] = useState(false);

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

  const handleAddFunds = async (e) => {
    e.preventDefault();
    const amount = parseFloat(addFundsAmount);
    if (!amount || amount <= 0) return;

    try {
      const res = await axios.post('/api/users/add-funds', { amount });
      setProfileData(prev => prev ? { ...prev, wallet_balance: res.data.wallet_balance } : null);
      setFundingSuccess(true);
      setAddFundsAmount('');
      setTimeout(() => setFundingSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to add funds:', err);
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

  // Sub-page View 1: Payment Methods & Wallet
  if (activeSubPage === 'payment') {
    return (
      <div className="min-h-screen bg-[#0A0B0E] text-slate-100 pb-28 pt-2 px-3 md:px-6 max-w-lg mx-auto font-sans antialiased space-y-5 animate-in fade-in duration-200">
        <div className="flex items-center gap-3 py-2 px-1 border-b border-zinc-800/80">
          <button 
            onClick={() => setActiveSubPage(null)}
            className="w-9 h-9 rounded-full bg-[#141519] border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-serif font-black text-xl text-white tracking-tight">
            Payment Methods & Wallet
          </h1>
        </div>

        <div className="bg-[#141519] border border-zinc-800 rounded-3xl p-5 shadow-2xl space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Available Wallet Balance</p>
              <p className="text-3xl font-black text-amber-400 font-mono tracking-tight mt-1">
                {(profileData?.wallet_balance ?? user?.wallet_balance ?? 0).toFixed(2)} Birr
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md">
              <Wallet size={24} />
            </div>
          </div>

          <form onSubmit={handleAddFunds} className="space-y-3 pt-2">
            <label className="text-xs font-bold text-zinc-300 block">Add Funds to Wallet (Birr)</label>
            <div className="flex gap-2">
              <input 
                type="number" 
                min="10"
                step="10"
                placeholder="Enter amount (e.g. 500)"
                value={addFundsAmount}
                onChange={(e) => setAddFundsAmount(e.target.value)}
                className="flex-1 bg-[#0E0F12] border border-zinc-800 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
              />
              <button 
                type="submit"
                className="bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:brightness-110 active:scale-95 text-black font-extrabold text-sm px-6 py-3 rounded-xl transition-all shadow-lg flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
              >
                <Plus size={16} className="stroke-[3]" />
                Deposit
              </button>
            </div>
            {fundingSuccess && (
              <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1 mt-1">
                <CheckCircle2 size={14} /> Funds added successfully!
              </p>
            )}
          </form>
        </div>

        <div className="bg-[#141519] border border-zinc-800 rounded-3xl p-5 shadow-2xl space-y-3">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Connected Payment Options</h3>
          <div className="space-y-2.5">
            <div className="bg-[#0E0F12] border border-zinc-800 p-4 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
                  TB
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Telebirr Integration</p>
                  <p className="text-xs text-zinc-400">Instant Automated Deposits</p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black rounded-full uppercase">
                Active
              </span>
            </div>

            <div className="bg-[#0E0F12] border border-zinc-800 p-4 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs">
                  CBE
                </div>
                <div>
                  <p className="text-sm font-bold text-white">CBE Birr App</p>
                  <p className="text-xs text-zinc-400">Direct Bank Transfer</p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black rounded-full uppercase">
                Active
              </span>
            </div>

            <div className="bg-[#0E0F12] border border-zinc-800 p-4 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xs">
                  CP
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Chapa Gateway</p>
                  <p className="text-xs text-zinc-400">Cards & Mobile Money</p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-black rounded-full uppercase">
                Available
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Sub-page View 2: Notification Preferences
  if (activeSubPage === 'notifications') {
    return (
      <div className="min-h-screen bg-[#0A0B0E] text-slate-100 pb-28 pt-2 px-3 md:px-6 max-w-lg mx-auto font-sans antialiased space-y-5 animate-in fade-in duration-200">
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
      <div className="min-h-screen bg-[#0A0B0E] text-slate-100 pb-28 pt-2 px-3 md:px-6 max-w-lg mx-auto font-sans antialiased space-y-5 animate-in fade-in duration-200">
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
      <div className="min-h-screen bg-[#0A0B0E] text-slate-100 pb-28 pt-2 px-3 md:px-6 max-w-lg mx-auto font-sans antialiased space-y-5 animate-in fade-in duration-200">
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
    <div className="min-h-screen bg-[#0A0B0E] text-slate-100 pb-28 pt-2 px-3 md:px-6 max-w-lg mx-auto font-sans antialiased">
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
          onClick={handleLogout}
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
    </div>
  );
};

export default Profile;

