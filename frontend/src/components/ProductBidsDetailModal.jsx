import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  Filter, 
  Trophy, 
  Flame, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  Wallet, 
  ArrowUpDown, 
  Sparkles, 
  Tag, 
  Layers, 
  DollarSign, 
  RefreshCw,
  Award
} from 'lucide-react';

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
    second: '2-digit',
    hour12: true
  });
};

const ProductBidsDetailModal = ({ product, onClose, onAdjustWallet, onRefresh }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'unique' | 'duplicated'
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'amount_asc' | 'amount_desc'
  const [refreshing, setRefreshing] = useState(false);

  if (!product) return null;

  const bids = product.bids || [];
  const lowestUniqueBid = product.lowestUniqueBid;

  // Filter & Sort Bids
  const processedBids = useMemo(() => {
    let result = [...bids];

    // Filter by Uniqueness
    if (filterType === 'unique') {
      result = result.filter(b => b.is_unique);
    } else if (filterType === 'duplicated') {
      result = result.filter(b => !b.is_unique);
    }

    // Filter by Search Query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(b => 
        (b.user_name && b.user_name.toLowerCase().includes(q)) ||
        (b.user_phone && b.user_phone.toLowerCase().includes(q)) ||
        (b.user_email && b.user_email.toLowerCase().includes(q)) ||
        (b.amount && b.amount.toString().includes(q)) ||
        (b.id && b.id.toString().includes(q))
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at) - new Date(a.created_at);
      } else if (sortBy === 'oldest') {
        return new Date(a.created_at) - new Date(b.created_at);
      } else if (sortBy === 'amount_asc') {
        return a.amount - b.amount;
      } else if (sortBy === 'amount_desc') {
        return b.amount - a.amount;
      }
      return 0;
    });

    return result;
  }, [bids, filterType, searchQuery, sortBy]);

  const handleRefreshClick = async () => {
    if (onRefresh) {
      setRefreshing(true);
      await onRefresh();
      setRefreshing(false);
    }
  };

  const totalRevenue = (bids.length * 1.0).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 md:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#12141A] border border-zinc-800 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* MODAL HEADER */}
        <div className="bg-[#181A22] border-b border-zinc-800/90 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <img 
              src={product.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=200'} 
              alt={product.title} 
              className="w-14 h-14 object-cover rounded-2xl border border-zinc-700 bg-zinc-900 shadow-md"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black text-white tracking-tight">{product.title}</h2>
                <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                  product.status === 'closed' 
                    ? 'bg-rose-950/80 text-rose-400 border-rose-500/40' 
                    : 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40'
                }`}>
                  {product.status === 'closed' ? 'Closed' : 'Active Auction'}
                </span>
                <span className="text-[10px] font-extrabold bg-amber-400/10 text-amber-400 border border-amber-400/30 px-2.5 py-0.5 rounded-full">
                  {product.category}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 flex items-center gap-3 flex-wrap">
                <span>Base Price: <strong className="text-amber-400">{product.base_price} ETB</strong></span>
                <span>•</span>
                <span>Pool: <strong className="text-cyan-400">{product.pool_type === 'lub' ? 'Lowest Unique Bid (LUB)' : 'Open Pool'}</strong></span>
                <span>•</span>
                <span>Created: {formatHumanDate(product.start_time)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {onRefresh && (
              <button 
                onClick={handleRefreshClick}
                disabled={refreshing}
                className="bg-[#222530] hover:bg-[#2C303E] text-zinc-300 border border-zinc-700/80 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                title="Refresh Bids Data"
              >
                <RefreshCw size={14} className={refreshing ? 'animate-spin text-amber-400' : ''} />
                <span>Refresh</span>
              </button>
            )}
            <button 
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors border border-zinc-700/50"
              title="Close detailed view"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* MODAL BODY (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          
          {/* PRODUCT METRICS CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Card 1: Total Bids & Revenue */}
            <div className="bg-[#171922] border border-zinc-800 p-3.5 rounded-2xl">
              <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold">
                <span>Total Bids</span>
                <Flame size={16} className="text-amber-400" />
              </div>
              <p className="text-2xl font-black text-white mt-1">{product.totalBids}</p>
              <p className="text-[10px] text-emerald-400 font-bold mt-0.5">
                {totalRevenue} ETB Fee Revenue
              </p>
            </div>

            {/* Card 2: Unique vs Duplicated */}
            <div className="bg-[#171922] border border-zinc-800 p-3.5 rounded-2xl">
              <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold">
                <span>Bid Health</span>
                <Sparkles size={16} className="text-emerald-400" />
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-lg font-black text-emerald-400">{product.uniqueBidsCount}</span>
                <span className="text-xs text-zinc-500 font-bold">Unique</span>
                <span className="text-zinc-600">/</span>
                <span className="text-lg font-black text-rose-400">{product.duplicatedBidsCount}</span>
                <span className="text-xs text-zinc-500 font-bold">Dup</span>
              </div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden flex">
                <div 
                  style={{ width: `${product.totalBids ? (product.uniqueBidsCount / product.totalBids) * 100 : 0}%` }}
                  className="bg-emerald-500 h-full"
                ></div>
                <div 
                  style={{ width: `${product.totalBids ? (product.duplicatedBidsCount / product.totalBids) * 100 : 0}%` }}
                  className="bg-rose-500 h-full"
                ></div>
              </div>
            </div>

            {/* Card 3: Lowest Unique Bid (LUB) */}
            <div className="bg-[#171922] border border-zinc-800 p-3.5 rounded-2xl relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold">
                <span>Lowest Unique Bid (LUB)</span>
                <Trophy size={16} className="text-amber-400" />
              </div>
              {lowestUniqueBid ? (
                <div>
                  <p className="text-2xl font-black text-emerald-400 mt-1">{lowestUniqueBid} ETB</p>
                  <p className="text-[10px] text-zinc-400 font-medium truncate mt-0.5">
                    Bidder: <span className="text-white font-bold">{product.lowestUniqueBidder?.name || 'Leading Bidder'}</span>
                  </p>
                </div>
              ) : (
                <p className="text-sm font-bold text-zinc-500 mt-2">No unique bid yet</p>
              )}
            </div>

            {/* Card 4: Highest Bid */}
            <div className="bg-[#171922] border border-zinc-800 p-3.5 rounded-2xl">
              <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold">
                <span>Highest Bid</span>
                <DollarSign size={16} className="text-cyan-400" />
              </div>
              <p className="text-2xl font-black text-cyan-400 mt-1">
                {product.highestBid ? `${product.highestBid} ETB` : 'N/A'}
              </p>
              <p className="text-[10px] text-zinc-500 font-medium mt-0.5">
                Target Pool: {product.pool_type.toUpperCase()}
              </p>
            </div>
          </div>

          {/* WINNER BANNER (IF CLOSED OR HAS WINNER) */}
          {product.winner && (
            <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-amber-500/10 border border-amber-500/40 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-black flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
                  <Award size={22} />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black tracking-widest text-amber-400">Official Winner</span>
                  <h4 className="text-sm font-black text-white">{product.winner.name}</h4>
                  <p className="text-xs text-zinc-300 font-mono flex items-center gap-3 mt-0.5">
                    <span>📞 {product.winner.phone_number}</span>
                    {product.winner.email && <span>✉️ {product.winner.email}</span>}
                  </p>
                </div>
              </div>
              {lowestUniqueBid && (
                <div className="text-right">
                  <span className="text-[10px] text-zinc-400 font-medium block">Winning LUB Amount</span>
                  <span className="text-lg font-black text-emerald-400">{lowestUniqueBid} ETB</span>
                </div>
              )}
            </div>
          )}

          {/* SEARCH & FILTERS BAR FOR BIDS */}
          <div className="bg-[#171922] border border-zinc-800/90 p-4 rounded-2xl space-y-3 md:space-y-0 md:flex md:items-center md:justify-between gap-4">
            
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-[#101216] p-1 rounded-xl border border-zinc-800">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterType === 'all'
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                All Bids ({bids.length})
              </button>
              <button
                onClick={() => setFilterType('unique')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterType === 'unique'
                    ? 'bg-emerald-500 text-black shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Unique Only ({product.uniqueBidsCount})
              </button>
              <button
                onClick={() => setFilterType('duplicated')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterType === 'duplicated'
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Duplicated Only ({product.duplicatedBidsCount})
              </button>
            </div>

            <div className="flex items-center gap-2 flex-1 md:max-w-md">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-2.5 text-zinc-500" />
                <input 
                  type="text"
                  placeholder="Search bidder name, phone, email, or amount..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#101216] border border-zinc-800 focus:border-amber-400 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-zinc-500 hover:text-white"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-[#101216] border border-zinc-800 text-xs font-semibold text-zinc-300 rounded-xl px-3 py-2 focus:outline-none cursor-pointer pr-8"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="amount_asc">Amount: Low to High</option>
                  <option value="amount_desc">Amount: High to Low</option>
                </select>
              </div>
            </div>

          </div>

          {/* BIDS DETAILED TABLE */}
          <div className="bg-[#171922] border border-zinc-800/90 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-[#101216] border-b border-zinc-800 text-zinc-400 uppercase font-bold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 w-12 text-center">#</th>
                    <th className="py-3.5 px-4">Bidder Information</th>
                    <th className="py-3.5 px-4">Bid Amount</th>
                    <th className="py-3.5 px-4">Uniqueness Status</th>
                    <th className="py-3.5 px-4">Timestamp</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-medium">
                  {processedBids.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-12 text-zinc-500">
                        <div className="flex flex-col items-center gap-2">
                          <Flame size={28} className="text-zinc-700" />
                          <p className="font-bold text-xs text-zinc-400">No bids match the filter criteria</p>
                          <p className="text-[11px] text-zinc-600">Try adjusting your search query or status filter.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    processedBids.map((bid, index) => {
                      const isLub = lowestUniqueBid && bid.is_unique && bid.amount === lowestUniqueBid;

                      return (
                        <tr 
                          key={bid.id} 
                          className={`hover:bg-[#1E212D] transition-colors ${
                            isLub ? 'bg-amber-500/5 hover:bg-amber-500/10' : ''
                          }`}
                        >
                          {/* Row Index */}
                          <td className="py-3.5 px-4 text-center font-mono text-zinc-500 text-[11px]">
                            {index + 1}
                          </td>

                          {/* Bidder Info */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              {bid.user_image || bid.user_avatar || bid.image_url || localStorage.getItem(`user_avatar_${bid.user_id}`) ? (
                                <img 
                                  src={bid.user_image || bid.user_avatar || bid.image_url || localStorage.getItem(`user_avatar_${bid.user_id}`)} 
                                  alt={bid.user_name} 
                                  className="w-8 h-8 rounded-full object-cover border border-zinc-700 bg-zinc-800"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-zinc-800 text-amber-400 flex items-center justify-center text-xs border border-zinc-700">
                                  <User size={16} />
                                </div>
                              )}
                              <div>
                                <p className="font-bold text-sm text-white flex items-center gap-1.5">
                                  <span>{bid.user_name}</span>
                                  {product.winner_id === bid.user_id && (
                                    <span className="text-[9px] bg-amber-400 text-black font-extrabold px-1.5 py-0.2 rounded-md">WINNER</span>
                                  )}
                                </p>
                                <p className="text-[11px] text-zinc-400 font-mono flex items-center gap-2">
                                  <span>📞 {bid.user_phone}</span>
                                  {bid.user_email && <span>✉️ {bid.user_email}</span>}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Bid Amount */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-sm text-amber-400 font-mono">
                                {bid.amount.toFixed(2)} ETB
                              </span>
                              {isLub && (
                                <span className="bg-gradient-to-r from-amber-500 to-amber-400 text-black font-extrabold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                                  <Trophy size={11} />
                                  LUB Winner
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Uniqueness Status */}
                          <td className="py-3.5 px-4">
                            {bid.is_unique ? (
                              <span className="inline-flex items-center gap-1.5 bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 text-[10px] font-extrabold px-2.5 py-1 rounded-lg">
                                <CheckCircle2 size={12} />
                                Unique
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 bg-rose-950/80 text-rose-400 border border-rose-500/40 text-[10px] font-extrabold px-2.5 py-1 rounded-lg">
                                <XCircle size={12} />
                                Duplicated
                              </span>
                            )}
                          </td>

                          {/* Timestamp */}
                          <td className="py-3.5 px-4 text-zinc-400 text-[11px] font-mono">
                            <div className="flex items-center gap-1">
                              <Clock size={12} className="text-zinc-500" />
                              <span>{formatHumanDate(bid.created_at)}</span>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            {onAdjustWallet && (
                              <button
                                onClick={() => onAdjustWallet({
                                  id: bid.user_id,
                                  name: bid.user_name,
                                  phone_number: bid.user_phone
                                })}
                                className="bg-[#222530] hover:bg-[#2C303E] text-amber-400 hover:text-amber-300 border border-zinc-700/80 px-2.5 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 transition-colors"
                                title="Adjust wallet balance for this user"
                              >
                                <Wallet size={12} />
                                <span>Wallet</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Footer Summary */}
            <div className="bg-[#101216] border-t border-zinc-800 px-4 py-3 text-xs text-zinc-400 flex flex-col sm:flex-row justify-between items-center gap-2 font-medium">
              <span>Showing {processedBids.length} of {bids.length} total bids for this product</span>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Unique: {product.uniqueBidsCount}
                </span>
                <span className="flex items-center gap-1 text-rose-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-rose-400"></span> Duplicated: {product.duplicatedBidsCount}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* MODAL FOOTER */}
        <div className="bg-[#181A22] border-t border-zinc-800/90 px-6 py-3.5 flex justify-between items-center">
          <span className="text-xs text-zinc-500 font-mono">Product ID: #{product.id}</span>
          <button 
            onClick={onClose}
            className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-black px-6 py-2 rounded-xl transition-all shadow-md active:scale-95"
          >
            Done / Close View
          </button>
        </div>

      </div>
    </div>
  );
};

export default ProductBidsDetailModal;
