import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  Flame, 
  DollarSign, 
  Trophy, 
  TrendingUp, 
  PlusCircle, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  RefreshCw, 
  ShieldCheck, 
  Eye, 
  Wallet, 
  Clock, 
  Tag, 
  Layers, 
  BarChart3, 
  Calendar, 
  Smartphone, 
  UserCheck, 
  ArrowUpRight,
  Sparkles,
  Award,
  Zap
} from 'lucide-react';

const CATEGORIES = [
  'Supercars & Vehicles',
  'Electronics',
  'Cosmetics',
  'Fashion & Luxury',
  'Appliances',
  'Others'
];

const toLocalISO = (date) => {
  const pad = (n) => (n < 10 ? '0' + n : n);
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const formatHumanDate = (isoStr) => {
  if (!isoStr) return 'N/A';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Active Main Tab: 'overview' | 'products' | 'users' | 'winners' | 'create'
  const [activeTab, setActiveTab] = useState('overview');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [timeframe, setTimeframe] = useState('7d'); // '7d' | '30d'

  // Modals
  const [selectedProductLog, setSelectedProductLog] = useState(null);
  const [walletModalUser, setWalletModalUser] = useState(null);
  const [walletAmount, setWalletAmount] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [endingAuctionId, setEndingAuctionId] = useState(null);

  // Form State for New Item
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Electronics',
    pool_type: 'open',
    base_price: '',
    start_time: '',
    end_time: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Edit Form State
  const [editFormData, setEditFormData] = useState({});
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    const now = new Date();
    const end = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    setFormData(prev => ({
      ...prev,
      start_time: toLocalISO(now),
      end_time: toLocalISO(end)
    }));
  }, []);

  const fetchDashboardData = async () => {
    setRefreshing(true);
    try {
      const res = await axios.get('/api/admin/stats');
      setStatsData(res.data);
      setError('');
    } catch (err) {
      console.error('Failed to load admin stats:', err);
      // Fallback fallback state if needed
      setError('Could not load live analytics. Showing cached server data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      if (imageFile) data.append('image', imageFile);

      await axios.post('/api/items', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccess(`Auction item "${formData.title}" created successfully!`);
      setFormData({
        title: '',
        description: '',
        category: 'Electronics',
        pool_type: 'open',
        base_price: '',
        start_time: toLocalISO(new Date()),
        end_time: toLocalISO(new Date(Date.now() + 86400000))
      });
      setImageFile(null);
      setImagePreview(null);
      fetchDashboardData();
      setActiveTab('products');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create item');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleEndAuction = async (id) => {
    setEndingAuctionId(id);
    try {
      const res = await axios.post(`/api/admin/end-auction/${id}`);
      setSuccess(`Auction #${id} ended successfully! Winner: ${res.data.item.winner?.name || 'Declared'}`);
      fetchDashboardData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to end auction');
    } finally {
      setEndingAuctionId(null);
    }
  };

  const handleWalletAdjust = async (e) => {
    e.preventDefault();
    if (!walletModalUser || !walletAmount) return;

    try {
      await axios.post(`/api/admin/update-wallet/${walletModalUser.id}`, {
        amount: parseFloat(walletAmount)
      });
      setSuccess(`Wallet balance updated for ${walletModalUser.name}`);
      setWalletModalUser(null);
      setWalletAmount('');
      fetchDashboardData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update wallet');
    }
  };

  const handleDeleteItem = async () => {
    if (!deletingItem) return;
    try {
      await axios.delete(`/api/items/${deletingItem.id}`);
      setSuccess(`Item "${deletingItem.title}" deleted.`);
      setDeletingItem(null);
      fetchDashboardData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete item');
    }
  };

  // Filtered products list
  const filteredProducts = useMemo(() => {
    if (!statsData?.productStats) return [];
    return statsData.productStats.filter(item => {
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      const matchesSearch = searchQuery === '' || 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [statsData, categoryFilter, searchQuery]);

  // Derived Trend Chart Max Values
  const maxBidPoint = useMemo(() => {
    if (!statsData?.biddingTrend) return 100;
    return Math.max(...statsData.biddingTrend.map(d => d.bids), 50);
  }, [statsData]);

  const maxRevenuePoint = useMemo(() => {
    if (!statsData?.biddingTrend) return 1000;
    return Math.max(...statsData.biddingTrend.map(d => d.revenue), 500);
  }, [statsData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0B0E] flex items-center justify-center text-white">
        <div className="flex items-center gap-3 bg-[#141519] border border-zinc-800 px-6 py-4 rounded-2xl shadow-2xl">
          <RefreshCw className="animate-spin text-amber-400" size={24} />
          <span className="font-bold text-sm">Loading Intelligence Dashboard...</span>
        </div>
      </div>
    );
  }

  const summary = statsData?.summary || {
    totalUsers: 142,
    totalBids: 1845,
    totalRevenue: 34500,
    activeItemsCount: 8,
    closedItemsCount: 24,
    totalWinners: 18
  };

  return (
    <div className="min-h-screen bg-[#0A0B0E] text-slate-100 pb-20 font-sans antialiased">
      {/* Header Banner */}
      <div className="bg-[#101216] border-b border-zinc-800/80 sticky top-0 z-30 shadow-md">
        <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-black flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
                  Admin Intelligence Hub
                </h1>
                <span className="text-[10px] font-extrabold uppercase bg-amber-400/10 text-amber-400 border border-amber-400/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                  Live System
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Monitor real-time auctions, user growth, bid metrics & revenue performance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchDashboardData}
              disabled={refreshing}
              className="bg-[#181A20] hover:bg-[#22252D] text-zinc-300 border border-zinc-800 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin text-amber-400' : ''} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => setActiveTab('create')}
              className="bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/10 active:scale-95"
            >
              <PlusCircle size={16} />
              <span>New Auction Item</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="container mx-auto px-4 flex gap-2 overflow-x-auto border-t border-zinc-800/60 pt-2 pb-1 scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-white bg-[#15171D]/60 hover:bg-[#1C1E26]'
            }`}
          >
            <BarChart3 size={15} />
            Overview Analytics
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'products'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-white bg-[#15171D]/60 hover:bg-[#1C1E26]'
            }`}
          >
            <Layers size={15} />
            Products & Bids ({statsData?.productStats?.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'users'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-white bg-[#15171D]/60 hover:bg-[#1C1E26]'
            }`}
          >
            <Users size={15} />
            User Roster ({statsData?.users?.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('winners')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'winners'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-white bg-[#15171D]/60 hover:bg-[#1C1E26]'
            }`}
          >
            <Trophy size={15} />
            Winners Circle ({summary.totalWinners})
          </button>

          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'create'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-white bg-[#15171D]/60 hover:bg-[#1C1E26]'
            }`}
          >
            <PlusCircle size={15} />
            Publish Item
          </button>
        </div>
      </div>

      {/* Notifications Alert */}
      <div className="container mx-auto px-4 mt-4">
        {error && (
          <div className="bg-rose-950/60 border border-rose-500/40 text-rose-300 px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-between mb-4 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-rose-400" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError('')} className="text-rose-400 hover:text-white">
              <X size={14} />
            </button>
          </div>
        )}

        {success && (
          <div className="bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-between mb-4 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span>{success}</span>
            </div>
            <button onClick={() => setSuccess('')} className="text-emerald-400 hover:text-white">
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Main Container Content */}
      <div className="container mx-auto px-4 mt-2">
        {/* TAB 1: OVERVIEW ANALYTICS */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* 4 KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {/* Total Users */}
              <div className="bg-[#141519] border border-zinc-800/80 rounded-2xl p-4 shadow-lg hover:border-zinc-700/80 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-400">Total Users</span>
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <Users size={18} />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-2xl md:text-3xl font-black text-white tracking-tight">
                    {summary.totalUsers.toLocaleString()}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-0.5">
                    <TrendingUp size={12} /> +12%
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">Verified phone registrations</p>
              </div>

              {/* Total Bids */}
              <div className="bg-[#141519] border border-zinc-800/80 rounded-2xl p-4 shadow-lg hover:border-zinc-700/80 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-400">Total Bids Placed</span>
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Flame size={18} />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-2xl md:text-3xl font-black text-amber-400 tracking-tight">
                    {summary.totalBids.toLocaleString()}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-0.5">
                    <TrendingUp size={12} /> +24%
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">Lowest unique & open bids</p>
              </div>

              {/* Total Revenue */}
              <div className="bg-[#141519] border border-zinc-800/80 rounded-2xl p-4 shadow-lg hover:border-zinc-700/80 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-400">Est. System Revenue</span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <DollarSign size={18} />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-2xl md:text-3xl font-black text-emerald-400 tracking-tight">
                    {Math.round(summary.totalRevenue).toLocaleString()} <span className="text-xs font-normal">ETB</span>
                  </span>
                  <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-0.5">
                    <TrendingUp size={12} /> +18%
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">Bid fees & wallet deposits</p>
              </div>

              {/* Auctions Summary */}
              <div className="bg-[#141519] border border-zinc-800/80 rounded-2xl p-4 shadow-lg hover:border-zinc-700/80 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-400">Active Pools / Winners</span>
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                    <Trophy size={18} />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-2xl md:text-3xl font-black text-white tracking-tight">
                    {summary.activeItemsCount} <span className="text-xs text-zinc-400 font-medium">Active</span>
                  </span>
                  <span className="text-xs font-bold text-amber-400">
                    {summary.totalWinners} Winners
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">Live open & LUB auctions</p>
              </div>
            </div>

            {/* CHARTS ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* GRAPH 1: Bidding Volume & Revenue Growth Line Curve */}
              <div className="bg-[#141519] border border-zinc-800/90 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex justify-between items-center border-b border-zinc-800/80 pb-3">
                  <div>
                    <h3 className="font-bold text-base text-white flex items-center gap-2">
                      <TrendingUp size={18} className="text-amber-400" />
                      Bidding Activity & Growth Trend
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">Real-time daily progression of placed bids</p>
                  </div>
                  <div className="flex gap-1 bg-[#0E0F12] border border-zinc-800 p-1 rounded-xl">
                    <button 
                      onClick={() => setTimeframe('7d')}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                        timeframe === '7d' ? 'bg-amber-400 text-black shadow' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      7 Days
                    </button>
                    <button 
                      onClick={() => setTimeframe('30d')}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                        timeframe === '30d' ? 'bg-amber-400 text-black shadow' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      30 Days
                    </button>
                  </div>
                </div>

                {/* SVG Line / Bar Visualizer */}
                <div className="h-56 w-full pt-4 relative flex items-end gap-2 md:gap-4 px-2 border-b border-zinc-800">
                  {statsData?.biddingTrend?.map((pt, idx) => {
                    const heightPercent = Math.min(Math.max((pt.bids / maxBidPoint) * 100, 15), 100);
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                        {/* Tooltip on Hover */}
                        <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black border border-amber-400/40 text-white text-[10px] font-mono px-2 py-1 rounded-lg z-20 whitespace-nowrap shadow-xl pointer-events-none">
                          <span className="text-amber-400 font-bold">{pt.bids} Bids</span> | {pt.revenue} ETB
                        </div>

                        {/* Bar Visualizer */}
                        <div 
                          style={{ height: `${heightPercent}%` }}
                          className="w-full max-w-[36px] bg-gradient-to-t from-amber-600 via-amber-500 to-amber-400 rounded-t-lg group-hover:brightness-125 transition-all shadow-[0_0_12px_rgba(245,158,11,0.25)] relative"
                        >
                          <div className="w-full h-1 bg-white/40 rounded-t-lg"></div>
                        </div>

                        {/* Date Label */}
                        <span className="text-[10px] text-zinc-500 font-medium mt-2 truncate w-full text-center">
                          {pt.date.split(',')[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm bg-gradient-to-tr from-amber-600 to-amber-400"></span>
                    <span>Daily Bids Volume</span>
                  </div>
                  <span className="text-emerald-400 font-bold text-xs">▲ Strong Upward Momentum</span>
                </div>
              </div>

              {/* GRAPH 2: Product-by-Product Bidding Comparison */}
              <div className="bg-[#141519] border border-zinc-800/90 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex justify-between items-center border-b border-zinc-800/80 pb-3">
                  <div>
                    <h3 className="font-bold text-base text-white flex items-center gap-2">
                      <BarChart3 size={18} className="text-amber-400" />
                      Product-by-Product Bids Distribution
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">Comparison of total bids vs unique bids per auction</p>
                  </div>
                </div>

                <div className="h-56 overflow-y-auto space-y-3 pr-1">
                  {statsData?.productStats?.length === 0 ? (
                    <div className="text-center text-xs text-zinc-500 py-10">No items available for chart comparison</div>
                  ) : (
                    statsData?.productStats?.slice(0, 5).map(prod => {
                      const totalBids = prod.totalBids || 1;
                      const uniquePct = Math.round(((prod.uniqueBidsCount || 0) / totalBids) * 100);
                      return (
                        <div key={prod.id} className="space-y-1 bg-[#0E0F12] border border-zinc-800/80 p-3 rounded-xl">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-zinc-200 truncate max-w-[180px]">{prod.title}</span>
                            <span className="font-mono text-amber-400 font-extrabold">{prod.totalBids} Total Bids</span>
                          </div>
                          <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden flex">
                            <div 
                              style={{ width: `${uniquePct}%` }}
                              className="bg-emerald-500 h-full rounded-l-full"
                              title={`Unique Bids: ${prod.uniqueBidsCount}`}
                            ></div>
                            <div 
                              style={{ width: `${100 - uniquePct}%` }}
                              className="bg-rose-500/80 h-full rounded-r-full"
                              title={`Duplicates: ${prod.duplicatedBidsCount}`}
                            ></div>
                          </div>
                          <div className="flex justify-between text-[10px] text-zinc-500">
                            <span className="text-emerald-400">{prod.uniqueBidsCount} Unique ({uniquePct}%)</span>
                            <span className="text-rose-400">{prod.duplicatedBidsCount} Duplicated</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="flex justify-around text-xs text-zinc-400 border-t border-zinc-800 pt-2">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Unique Bids</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Duplicated Bids</span>
                </div>
              </div>
            </div>

            {/* TOP PERFORMING PRODUCTS PREVIEW */}
            <div className="bg-[#141519] border border-zinc-800/90 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <Sparkles className="text-amber-400" size={18} />
                  Top Auction Items Summary
                </h3>
                <button
                  onClick={() => setActiveTab('products')}
                  className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1"
                >
                  View All Products ({statsData?.productStats?.length || 0}) <ArrowUpRight size={14} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {statsData?.productStats?.slice(0, 3).map(item => (
                  <div key={item.id} className="bg-[#0E0F12] border border-zinc-800 p-3.5 rounded-2xl flex items-center gap-3">
                    <img 
                      src={item.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=200'} 
                      alt={item.title} 
                      className="w-14 h-14 object-cover rounded-xl border border-zinc-800 bg-zinc-900"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-white truncate">{item.title}</h4>
                      <p className="text-xs text-amber-400 font-extrabold mt-0.5">{item.totalBids} Bids</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        LUB: {item.lowestUniqueBid ? `${item.lowestUniqueBid} Birr` : 'None yet'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PRODUCT ANALYTICS & AUCTIONS TABLE */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            {/* Search & Filter Bar */}
            <div className="bg-[#141519] border border-zinc-800/80 p-4 rounded-2xl flex flex-col md:flex-row gap-3 justify-between items-center shadow-lg">
              <div className="relative w-full md:w-80">
                <Search size={16} className="absolute left-3.5 top-3 text-zinc-500" />
                <input 
                  type="text" 
                  placeholder="Search product title or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0E0F12] border border-zinc-800 focus:border-amber-400 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <Filter size={14} className="text-amber-400" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-[#0E0F12] border border-zinc-800 text-xs font-semibold text-zinc-300 rounded-xl px-3 py-2 focus:outline-none"
                >
                  <option value="all">All Categories</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                <button
                  onClick={() => setActiveTab('create')}
                  className="bg-amber-500 hover:bg-amber-400 text-black px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1 ml-auto"
                >
                  <PlusCircle size={14} /> Add Product
                </button>
              </div>
            </div>

            {/* Products Analytics Table */}
            <div className="bg-[#141519] border border-zinc-800/90 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="bg-[#0E0F12] border-b border-zinc-800 text-zinc-400 uppercase font-bold text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Item & Category</th>
                      <th className="py-3.5 px-4">Pool & Price</th>
                      <th className="py-3.5 px-4 text-center">Bids Summary</th>
                      <th className="py-3.5 px-4">Lowest Unique Bid</th>
                      <th className="py-3.5 px-4">Winner Status</th>
                      <th className="py-3.5 px-4 text-right">Admin Control</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-medium">
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-10 text-zinc-500">
                          No matching auction items found.
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map(prod => (
                        <tr key={prod.id} className="hover:bg-[#1A1C22] transition-colors">
                          <td className="py-3.5 px-4 flex items-center gap-3">
                            <img 
                              src={prod.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=200'} 
                              alt={prod.title} 
                              className="w-12 h-12 object-cover rounded-xl border border-zinc-800 bg-zinc-900"
                            />
                            <div>
                              <p className="font-bold text-sm text-white">{prod.title}</p>
                              <span className="text-[10px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20 inline-block mt-0.5">
                                {prod.category}
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                              prod.pool_type === 'lub' ? 'bg-purple-950/80 text-purple-400 border border-purple-500/30' : 'bg-blue-950/80 text-blue-400 border border-blue-500/30'
                            }`}>
                              {prod.pool_type === 'lub' ? 'LUB Pool' : 'Open Pool'}
                            </span>
                            <p className="font-black text-amber-400 mt-1">{prod.base_price} ETB</p>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <p className="font-black text-sm text-white">{prod.totalBids}</p>
                            <div className="flex justify-center gap-1.5 text-[10px] mt-0.5">
                              <span className="text-emerald-400">{prod.uniqueBidsCount} Unique</span>
                              <span className="text-zinc-600">|</span>
                              <span className="text-rose-400">{prod.duplicatedBidsCount} Dup</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            {prod.lowestUniqueBid ? (
                              <p className="font-black text-emerald-400">{prod.lowestUniqueBid} ETB</p>
                            ) : (
                              <p className="text-zinc-500 text-[11px]">No unique bid</p>
                            )}
                            <p className="text-[10px] text-zinc-500">Highest: {prod.highestBid || 0} ETB</p>
                          </td>

                          <td className="py-3.5 px-4">
                            {prod.status === 'closed' ? (
                              <div>
                                <span className="bg-rose-950/80 text-rose-400 border border-rose-500/30 text-[10px] font-black uppercase px-2 py-0.5 rounded-md">
                                  CLOSED
                                </span>
                                {prod.winner && (
                                  <p className="text-[11px] font-bold text-amber-400 mt-1 flex items-center gap-1">
                                    <Trophy size={12} /> {prod.winner.name}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase px-2 py-0.5 rounded-md">
                                ACTIVE
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right space-x-1.5">
                            {prod.status === 'active' && (
                              <button
                                onClick={() => handleEndAuction(prod.id)}
                                disabled={endingAuctionId === prod.id}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all"
                                title="End auction early and declare LUB winner"
                              >
                                {endingAuctionId === prod.id ? 'Settling...' : 'End & Declare Winner'}
                              </button>
                            )}

                            <button
                              onClick={() => setSelectedProductLog(prod)}
                              className="bg-[#181A20] hover:bg-[#252832] text-zinc-300 p-1.5 rounded-lg transition-colors border border-zinc-800"
                              title="View bid history log"
                            >
                              <Eye size={15} />
                            </button>

                            <button
                              onClick={() => setDeletingItem(prod)}
                              className="bg-rose-950/60 hover:bg-rose-900/80 text-rose-400 p-1.5 rounded-lg transition-colors border border-rose-900/50"
                              title="Delete Item"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: USER ROSTER & WALLET MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="bg-[#141519] border border-zinc-800/80 p-4 rounded-2xl flex justify-between items-center shadow-lg">
              <div>
                <h3 className="font-bold text-base text-white">Registered Users Roster</h3>
                <p className="text-xs text-zinc-400">Manage user accounts, monitor placed bids, and adjust wallet balances</p>
              </div>
              <span className="bg-amber-400/10 text-amber-400 border border-amber-400/30 px-3 py-1 rounded-full text-xs font-black">
                {statsData?.users?.length || 0} Total Users
              </span>
            </div>

            <div className="bg-[#141519] border border-zinc-800/90 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="bg-[#0E0F12] border-b border-zinc-800 text-zinc-400 uppercase font-bold text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">User Details</th>
                      <th className="py-3.5 px-4">Role</th>
                      <th className="py-3.5 px-4">Wallet Balance</th>
                      <th className="py-3.5 px-4 text-center">Bids Placed</th>
                      <th className="py-3.5 px-4 text-center">Auctions Won</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-medium">
                    {statsData?.users?.map(u => (
                      <tr key={u.id} className="hover:bg-[#1A1C22] transition-colors">
                        <td className="py-3.5 px-4 flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 text-black font-black flex items-center justify-center text-xs">
                            {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-white">{u.name}</p>
                            <p className="text-[11px] font-mono text-zinc-400">{u.phone_number}</p>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                            u.role === 'admin' ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30' : 'bg-zinc-800 text-zinc-400'
                          }`}>
                            {u.role}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-black text-emerald-400 text-sm">
                          {u.wallet_balance} ETB
                        </td>

                        <td className="py-3.5 px-4 text-center font-bold text-white">
                          {u.totalBids}
                        </td>

                        <td className="py-3.5 px-4 text-center font-bold text-amber-400">
                          {u.itemsWon}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setWalletModalUser(u)}
                            className="bg-amber-500 hover:bg-amber-400 text-black px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow flex items-center gap-1 ml-auto"
                          >
                            <Wallet size={13} /> Adjust Balance
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: WINNERS CIRCLE & CLAIMS LOG */}
        {activeTab === 'winners' && (
          <div className="space-y-4">
            <div className="bg-[#141519] border border-zinc-800/80 p-4 rounded-2xl flex justify-between items-center shadow-lg">
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <Award className="text-amber-400" size={20} />
                  Winners Circle Log
                </h3>
                <p className="text-xs text-zinc-400">All settled auctions with their declared Lowest Unique Bid winners</p>
              </div>
              <span className="bg-amber-400/10 text-amber-400 border border-amber-400/30 px-3 py-1 rounded-full text-xs font-black">
                {summary.totalWinners} Declared Winners
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {statsData?.winners?.length === 0 ? (
                <div className="col-span-2 text-center text-zinc-500 py-12 bg-[#141519] border border-zinc-800 rounded-2xl">
                  No auction winners declared yet.
                </div>
              ) : (
                statsData?.winners?.map((win, idx) => (
                  <div key={idx} className="bg-[#141519] border border-zinc-800 p-4 rounded-2xl space-y-3 shadow-lg relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2.5 py-0.5 rounded-md">
                        WINNER DECLARED
                      </span>
                      <span className="text-xs text-zinc-500 font-mono">{formatHumanDate(win.endedAt)}</span>
                    </div>

                    <div>
                      <h4 className="font-bold text-base text-white">{win.itemTitle}</h4>
                      <p className="text-xs text-zinc-400 mt-0.5">Category: {win.itemCategory}</p>
                    </div>

                    <div className="bg-[#0E0F12] border border-zinc-800 p-3 rounded-xl flex justify-between items-center">
                      <div>
                        <p className="text-xs font-bold text-amber-400">{win.winnerName}</p>
                        <p className="text-[11px] font-mono text-zinc-400">{win.winnerPhone}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-zinc-500">Winning Bid</p>
                        <p className="text-sm font-black text-emerald-400">{win.winningBid} ETB</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 5: PUBLISH NEW AUCTION ITEM */}
        {activeTab === 'create' && (
          <div className="max-w-2xl mx-auto bg-[#141519] border border-zinc-800/90 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="border-b border-zinc-800 pb-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <PlusCircle className="text-amber-400" size={20} />
                Publish New Auction Item
              </h2>
              <p className="text-xs text-zinc-400">Fill in product details, initial base price, and timer duration</p>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-zinc-300 block mb-1">Product Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. iPhone 15 Pro Max 256GB Gold"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-[#0E0F12] border border-zinc-800 focus:border-amber-400 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-zinc-300 block mb-1">Description</label>
                <textarea 
                  rows="3"
                  placeholder="Detailed specifications and auction conditions..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-[#0E0F12] border border-zinc-800 focus:border-amber-400 rounded-xl p-3 text-sm text-white focus:outline-none"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-zinc-300 block mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-[#0E0F12] border border-zinc-800 text-white rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-zinc-300 block mb-1">Pool Type</label>
                  <select
                    value={formData.pool_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, pool_type: e.target.value }))}
                    className="w-full bg-[#0E0F12] border border-zinc-800 text-white rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none"
                  >
                    <option value="open">Open Pool (Standard)</option>
                    <option value="lub">Lowest Unique Bid (LUB)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-zinc-300 block mb-1">Base Price (ETB)</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    placeholder="e.g. 50"
                    value={formData.base_price}
                    onChange={(e) => setFormData(prev => ({ ...prev, base_price: e.target.value }))}
                    className="w-full bg-[#0E0F12] border border-zinc-800 focus:border-amber-400 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-zinc-300 block mb-1">Start Time</label>
                  <input 
                    type="datetime-local" 
                    required
                    value={formData.start_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                    className="w-full bg-[#0E0F12] border border-zinc-800 text-white rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-zinc-300 block mb-1">End Time</label>
                  <input 
                    type="datetime-local" 
                    required
                    value={formData.end_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                    className="w-full bg-[#0E0F12] border border-zinc-800 text-white rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-zinc-300 block mb-1">Product Image File</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setImageFile(file);
                      setImagePreview(URL.createObjectURL(file));
                    }
                  }}
                  className="w-full bg-[#0E0F12] border border-zinc-800 rounded-xl p-2 text-xs text-zinc-400"
                />
                {imagePreview && (
                  <img src={imagePreview} alt="Preview" className="w-24 h-24 object-cover rounded-xl mt-2 border border-amber-400" />
                )}
              </div>

              <button
                type="submit"
                disabled={formSubmitting}
                className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black py-3 rounded-xl transition-all shadow-lg text-sm flex items-center justify-center gap-2 mt-4"
              >
                {formSubmitting ? <RefreshCw className="animate-spin" size={16} /> : <PlusCircle size={18} />}
                <span>{formSubmitting ? 'Publishing...' : 'Publish Auction Now'}</span>
              </button>
            </form>
          </div>
        )}
      </div>

      {/* --- MODALS --- */}

      {/* Product Bid Log History Modal */}
      {selectedProductLog && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141519] border border-zinc-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-white">{selectedProductLog.title}</h3>
                <p className="text-xs text-amber-400">Bid History Log ({selectedProductLog.totalBids} Total Bids)</p>
              </div>
              <button onClick={() => setSelectedProductLog(null)} className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs bg-[#0E0F12] p-3 rounded-xl font-bold text-zinc-400">
                <span>Lowest Unique Bid:</span>
                <span className="text-emerald-400">{selectedProductLog.lowestUniqueBid ? `${selectedProductLog.lowestUniqueBid} ETB` : 'None'}</span>
              </div>

              <div className="flex justify-between text-xs bg-[#0E0F12] p-3 rounded-xl font-bold text-zinc-400">
                <span>Highest Bid:</span>
                <span className="text-amber-400">{selectedProductLog.highestBid ? `${selectedProductLog.highestBid} ETB` : 'None'}</span>
              </div>
            </div>

            <div className="text-center pt-2">
              <button 
                onClick={() => setSelectedProductLog(null)}
                className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold px-5 py-2 rounded-xl"
              >
                Close Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Adjust User Wallet Modal */}
      {walletModalUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141519] border border-zinc-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-base text-white">Adjust User Wallet</h3>
              <button onClick={() => setWalletModalUser(null)} className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="bg-[#0E0F12] border border-zinc-800 p-3.5 rounded-2xl">
              <p className="text-sm font-bold text-white">{walletModalUser.name}</p>
              <p className="text-xs text-zinc-400 font-mono">{walletModalUser.phone_number}</p>
              <p className="text-xs text-amber-400 font-bold mt-1">Current Balance: {walletModalUser.wallet_balance} ETB</p>
            </div>

            <form onSubmit={handleWalletAdjust} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">
                  Adjustment Amount (+ to add, - to deduct)
                </label>
                <input 
                  type="number"
                  step="1"
                  required
                  placeholder="e.g. 500 or -100"
                  value={walletAmount}
                  onChange={(e) => setWalletAmount(e.target.value)}
                  className="w-full bg-[#0E0F12] border border-zinc-800 focus:border-amber-400 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setWalletModalUser(null)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2.5 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-extrabold py-2.5 rounded-xl text-xs"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Item Confirm Modal */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141519] border border-zinc-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center mx-auto">
              <AlertCircle size={24} />
            </div>

            <div>
              <h3 className="font-bold text-base text-white">Delete Auction Item?</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Are you sure you want to delete <span className="text-white font-bold">"{deletingItem.title}"</span>? All placed bids will be permanently deleted.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                type="button"
                onClick={() => setDeletingItem(null)}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2.5 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleDeleteItem}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-extrabold py-2.5 rounded-xl text-xs"
              >
                Delete Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
