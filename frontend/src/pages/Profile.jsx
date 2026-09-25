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
  Camera
} from 'lucide-react';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null); // 'payment', 'notifications', 'faq', 'legal'
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
      reader.onloadend = () => {
        const result = reader.result;
        setAvatarUrl(result);
        localStorage.setItem(avatarStorageKey, result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = (e) => {
    e.stopPropagation();
    setAvatarUrl(null);
    localStorage.removeItem(avatarStorageKey);
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

      {/* 3 Stats Grid */}
      <div className="grid grid-cols-3 gap-3 my-6">
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
          onClick={() => setActiveModal('payment')}
          className="w-full bg-[#141519] hover:bg-[#1A1C22] active:bg-[#1f2129] border border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl p-4 transition-all duration-200 text-left flex items-center justify-between group shadow-md"
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
          onClick={() => setActiveModal('notifications')}
          className="w-full bg-[#141519] hover:bg-[#1A1C22] active:bg-[#1f2129] border border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl p-4 transition-all duration-200 text-left flex items-center justify-between group shadow-md"
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
          onClick={() => setActiveModal('faq')}
          className="w-full bg-[#141519] hover:bg-[#1A1C22] active:bg-[#1f2129] border border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl p-4 transition-all duration-200 text-left flex items-center justify-between group shadow-md"
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
          onClick={() => setActiveModal('legal')}
          className="w-full bg-[#141519] hover:bg-[#1A1C22] active:bg-[#1f2129] border border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl p-4 transition-all duration-200 text-left flex items-center justify-between group shadow-md"
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
          className="w-full bg-[#141519] hover:bg-rose-950/20 active:bg-rose-950/30 border border-zinc-800/80 hover:border-rose-900/50 rounded-2xl p-4 transition-all duration-200 text-left flex items-center justify-between group shadow-md"
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

      {/* --- MODALS FOR INTERACTIVE MENU ITEMS --- */}

      {/* Payment Methods Modal */}
      {activeModal === 'payment' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#141519] border border-zinc-800 w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-5 animate-in fade-in slide-in-from-bottom duration-200">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2.5">
                <CreditCard className="text-amber-400" size={22} />
                <h3 className="font-bold text-lg text-white">Payment Methods & Balance</h3>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="bg-[#0E0F12] border border-zinc-800 rounded-2xl p-4 flex justify-between items-center">
              <div>
                <p className="text-xs text-zinc-400 font-medium">Available Wallet Balance</p>
                <p className="text-2xl font-black text-amber-400 mt-0.5">
                  {profileData?.wallet_balance ?? user?.wallet_balance ?? 0} ETB
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
                <Wallet size={20} />
              </div>
            </div>

            <form onSubmit={handleAddFunds} className="space-y-3">
              <label className="text-xs font-bold text-zinc-300 block">Add Funds to Wallet (ETB)</label>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  min="10"
                  step="10"
                  placeholder="Enter amount (e.g. 500)"
                  value={addFundsAmount}
                  onChange={(e) => setAddFundsAmount(e.target.value)}
                  className="flex-1 bg-[#0E0F12] border border-zinc-800 focus:border-amber-400 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                />
                <button 
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-sm px-5 py-2.5 rounded-xl transition-all shadow-lg flex items-center gap-1.5"
                >
                  <Plus size={16} />
                  Deposit
                </button>
              </div>
              {fundingSuccess && (
                <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1 mt-1">
                  <CheckCircle2 size={14} /> Funds added successfully!
                </p>
              )}
            </form>

            <div className="space-y-2 pt-2">
              <p className="text-xs font-bold text-zinc-400">Connected Payment Options</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#0E0F12] border border-zinc-800 p-3 rounded-xl flex items-center gap-2 text-xs font-semibold text-zinc-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  Telebirr (Active)
                </div>
                <div className="bg-[#0E0F12] border border-zinc-800 p-3 rounded-xl flex items-center gap-2 text-xs font-semibold text-zinc-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  CBE Birr (Active)
                </div>
                <div className="bg-[#0E0F12] border border-zinc-800 p-3 rounded-xl flex items-center gap-2 text-xs font-semibold text-zinc-300">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  Chapa Gateway
                </div>
                <div className="bg-[#0E0F12] border border-zinc-800 p-3 rounded-xl flex items-center gap-2 text-xs font-semibold text-zinc-300">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  Bank Cards
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Settings Modal */}
      {activeModal === 'notifications' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#141519] border border-zinc-800 w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-5 animate-in fade-in duration-200">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2.5">
                <Bell className="text-amber-400" size={22} />
                <h3 className="font-bold text-lg text-white">Notification Preferences</h3>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 bg-[#0E0F12] border border-zinc-800/80 rounded-2xl">
                <div>
                  <p className="text-sm font-bold text-white">Unique Bid Drop Alerts</p>
                  <p className="text-xs text-zinc-400">Get notified immediately when your bid becomes duplicate</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={notifSettings.bidDrops}
                  onChange={(e) => setNotifSettings(prev => ({ ...prev, bidDrops: e.target.checked }))}
                  className="w-5 h-5 accent-amber-400 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 bg-[#0E0F12] border border-zinc-800/80 rounded-2xl">
                <div>
                  <p className="text-sm font-bold text-white">Outbid Warnings</p>
                  <p className="text-xs text-zinc-400">Receive alerts if a lower unique bid takes the lead</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={notifSettings.outbid}
                  onChange={(e) => setNotifSettings(prev => ({ ...prev, outbid: e.target.checked }))}
                  className="w-5 h-5 accent-amber-400 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 bg-[#0E0F12] border border-zinc-800/80 rounded-2xl">
                <div>
                  <p className="text-sm font-bold text-white">Auction Win Notifications</p>
                  <p className="text-xs text-zinc-400">Instant notification when timer ends and you win</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={notifSettings.wins}
                  onChange={(e) => setNotifSettings(prev => ({ ...prev, wins: e.target.checked }))}
                  className="w-5 h-5 accent-amber-400 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help & FAQ Modal */}
      {activeModal === 'faq' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#141519] border border-zinc-800 w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <HelpCircle className="text-amber-400" size={22} />
                <h3 className="font-bold text-lg text-white">System Help & Tactics</h3>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-sm text-zinc-300">
              <div className="bg-[#0E0F12] border border-zinc-800 p-4 rounded-2xl">
                <h4 className="font-bold text-amber-400 text-sm mb-1">What is a Lowest Unique Bid?</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  In our auction pools, the winner is the user who places the lowest bid amount that NO OTHER user has placed! If two users place the exact same bid, it becomes duplicate and non-unique.
                </p>
              </div>

              <div className="bg-[#0E0F12] border border-zinc-800 p-4 rounded-2xl">
                <h4 className="font-bold text-amber-400 text-sm mb-1">How do I win iPhone & Samsung pools?</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Analyze current price ranges, place strategic decimal bids, and monitor real-time websocket duplicate notifications to adjust your bids before the timer expires.
                </p>
              </div>

              <div className="bg-[#0E0F12] border border-zinc-800 p-4 rounded-2xl">
                <h4 className="font-bold text-amber-400 text-sm mb-1">Are deposits instantly credited?</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Yes, Telebirr and bank integrations update your wallet balance in real-time.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legal Rules Modal */}
      {activeModal === 'legal' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#141519] border border-zinc-800 w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <FileText className="text-amber-400" size={22} />
                <h3 className="font-bold text-lg text-white">BidWin Legal & Fair Play</h3>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-zinc-400 leading-relaxed">
              <div className="bg-[#0E0F12] border border-zinc-800 p-4 rounded-2xl space-y-1">
                <h4 className="font-bold text-zinc-200 text-sm flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-amber-400" /> Anti-Bot Guarantee
                </h4>
                <p>
                  All bids are cryptographically verified and bound to validated phone numbers to guarantee 100% human competition.
                </p>
              </div>

              <div className="bg-[#0E0F12] border border-zinc-800 p-4 rounded-2xl space-y-1">
                <h4 className="font-bold text-zinc-200 text-sm flex items-center gap-1.5">
                  <Sparkles size={16} className="text-amber-400" /> Transparency Policy
                </h4>
                <p>
                  Full audit logs of bid uniqueness and winning history are published immediately upon pool settlement.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
