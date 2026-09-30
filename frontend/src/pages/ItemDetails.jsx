import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, 
  Share2, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Tag, 
  Smartphone, 
  Plus, 
  ChevronLeft,
  ChevronRight, 
  Sparkles,
  Wifi,
  Signal,
  Battery,
  ShieldCheck,
  Info,
  TrendingDown,
  Lock,
  User
} from 'lucide-react';

const BidderAvatar = ({ src, alt }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    return (
      <div className="w-10 h-10 rounded-full border border-zinc-800 bg-zinc-800/80 flex items-center justify-center text-zinc-300 shrink-0 shadow-sm">
        <User size={20} />
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt={alt}
      className="w-10 h-10 rounded-full object-cover border border-zinc-800 bg-zinc-900 shrink-0"
      onError={() => setHasError(true)}
    />
  );
};

// Animated Multi-Image Carousel Component
const ProductGalleryCarousel = ({ item, badgeText, badgeColorClass }) => {
  const primaryImage = item?.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600';
  const categoryLabel = (item?.category || 'ELECTRONICS').toUpperCase();
  const title = item?.title || 'Auction Item';

  // Construct image gallery array (custom item.images or generated complementary angles)
  const images = useMemo(() => {
    let allImgs = [];
    if (primaryImage) allImgs.push(primaryImage);
    if (item?.images && Array.isArray(item.images) && item.images.length > 0) {
      allImgs = [...allImgs, ...item.images];
    }
    const uniqueImgs = Array.from(new Set(allImgs.filter(Boolean)));
    if (uniqueImgs.length > 1) {
      return uniqueImgs;
    }
    // High-resolution multi-angle preset images based on title/category
    return [
      primaryImage,
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&q=80&w=600'
    ];
  }, [item, primaryImage]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Auto animation slide effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [images.length]);

  const handleNext = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
      setIsTransitioning(false);
    }, 150);
  };

  const handlePrev = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
      setIsTransitioning(false);
    }, 150);
  };

  const handleSelect = (idx) => {
    if (idx === currentIndex) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(idx);
      setIsTransitioning(false);
    }, 150);
  };

  return (
    <div className="space-y-3">
      {/* Main Image Frame with Smooth Fade & Scale Animation */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-[#16171D] to-[#0A0B0E] border border-zinc-800/80 shadow-2xl group select-none">
        <img 
          src={images[currentIndex]} 
          alt={`${title} - Angle ${currentIndex + 1}`}
          className={`w-full h-64 md:h-72 object-cover object-center transition-all duration-500 transform ${
            isTransitioning ? 'opacity-40 scale-95 blur-xs' : 'opacity-100 scale-100'
          }`}
        />

        {/* Category Pill Tag */}
        <span className="absolute top-4 left-4 bg-black/70 backdrop-blur-md text-zinc-200 border border-zinc-700/80 font-bold text-[10px] tracking-wider px-3 py-1 rounded-full uppercase z-10">
          {categoryLabel}
        </span>

        {/* Pool Badge */}
        <span className={`absolute top-4 right-4 backdrop-blur-md border font-extrabold text-[10px] tracking-wider px-3 py-1 rounded-full uppercase shadow-md z-10 ${badgeColorClass}`}>
          {badgeText}
        </span>

        {/* Left Navigation Arrow */}
        <button
          type="button"
          onClick={handlePrev}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-amber-500 hover:text-black text-white flex items-center justify-center backdrop-blur-md border border-zinc-700/50 transition-all opacity-80 group-hover:opacity-100 active:scale-90 cursor-pointer z-20"
          aria-label="Previous Image"
        >
          <ChevronLeft size={20} />
        </button>

        {/* Right Navigation Arrow */}
        <button
          type="button"
          onClick={handleNext}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-amber-500 hover:text-black text-white flex items-center justify-center backdrop-blur-md border border-zinc-700/50 transition-all opacity-80 group-hover:opacity-100 active:scale-90 cursor-pointer z-20"
          aria-label="Next Image"
        >
          <ChevronRight size={20} />
        </button>

        {/* Overlay Pagination Indicators */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full z-20">
          {images.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelect(idx)}
              className={`transition-all duration-300 rounded-full cursor-pointer ${
                currentIndex === idx 
                  ? 'w-5 h-2 bg-amber-400 shadow-sm' 
                  : 'w-2 h-2 bg-zinc-600 hover:bg-zinc-400'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Interactive Thumbnail Gallery Row */}
      <div className="flex items-center justify-center gap-2.5 px-1 overflow-x-auto pb-1 scrollbar-none">
        {images.map((img, idx) => {
          const isActive = currentIndex === idx;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelect(idx)}
              className={`relative rounded-xl overflow-hidden border-2 transition-all duration-300 cursor-pointer shrink-0 ${
                isActive 
                  ? 'border-amber-500 ring-2 ring-amber-500/30 scale-105 shadow-md shadow-amber-500/20' 
                  : 'border-zinc-800/90 opacity-60 hover:opacity-100 hover:border-zinc-600'
              }`}
            >
              <img 
                src={img} 
                alt={`Thumbnail ${idx + 1}`} 
                className="w-12 h-12 md:w-14 md:h-14 object-cover"
              />
              {isActive && (
                <span className="absolute inset-0 bg-amber-400/10 pointer-events-none"></span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const ItemDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, socket, setUser } = useAuth();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timeLeft, setTimeLeft] = useState('');

  // Mode for Open Bid Screen: 'detail' | 'place_bid'
  const [viewMode, setViewMode] = useState('detail');

  // Open Pool Increments
  const [selectedIncrement, setSelectedIncrement] = useState(50);
  const [customBidInput, setCustomBidInput] = useState('');

  // Premium LUB Decimal Bid Amount
  const [lubBidAmount, setLubBidAmount] = useState('');

  // Bids streams
  const [recentBidsStream, setRecentBidsStream] = useState([]);
  const [recentLUBBids, setRecentLUBBids] = useState([]);

  useEffect(() => {
    fetchItemDetails();
  }, [id]);

  const fetchItemDetails = async () => {
    try {
      const res = await axios.get(`/api/items/${id}`);
      setItem(res.data);

      if (res.data.bids && res.data.bids.length > 0) {
        // Sort bids desc
        const sortedBids = [...res.data.bids].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setRecentLUBBids(sortedBids);

        // Open Pool Top 3 Bidders Stream
        const formatted = sortedBids.slice(0, 3).map((b, idx) => {
          const isCurrUser = user?.id === b.user_id;
          const rawName = b.user?.name || `User ${b.user_id}`;
          const parts = rawName.split(' ');
          const uName = parts[0] + (parts[1] ? ' ' + parts[1][0] + '.' : '');
          
          const now = new Date().getTime();
          const bidTime = new Date(b.created_at).getTime();
          const diffSec = Math.max(1, Math.floor((now - bidTime) / 1000));
          let timeAgo = `${diffSec}s ago`;
          if (diffSec >= 60) {
            timeAgo = `${Math.floor(diffSec / 60)}m ago`;
          }

          const prevBid = sortedBids[idx + 1];
          const diffVal = prevBid ? (b.amount - prevBid.amount) : (b.amount - (res.data.base_price || 0));
          const incStr = diffVal > 0 ? `+${diffVal.toLocaleString()} Birr` : `+${b.amount.toLocaleString()} Birr`;

          const localAvatar = localStorage.getItem(`user_avatar_${b.user_id}`);
          const userAvatar = b.user?.avatar || (isCurrUser ? user?.avatar : null) || localAvatar || null;

          return {
            id: b.id,
            name: isCurrUser ? `${uName} (You)` : uName,
            timeAgo,
            amount: b.amount,
            increment: incStr,
            isUser: isCurrUser,
            badge: isCurrUser ? '10X' : null,
            avatar: userAvatar
          };
        });
        setRecentBidsStream(formatted);
      } else {
        setRecentBidsStream([]);
        setRecentLUBBids([]);
      }
    } catch (err) {
      console.error('Error loading item details:', err);
    } finally {
      setLoading(false);
    }
  };

  // Socket live update
  useEffect(() => {
    if (socket) {
      const handleUpdate = (data) => {
        if (data.item_id === parseInt(id)) {
          fetchItemDetails();
        }
      };
      socket.on('bid_update', handleUpdate);
      return () => socket.off('bid_update', handleUpdate);
    }
  }, [socket, id]);

  // Countdown timer calculation
  useEffect(() => {
    if (!item) return;
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(item.end_time).getTime();
      const distance = end - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft('EXPIRED');
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, [item]);

  const isOpenPool = item?.pool_type === 'open';

  // Highest Bid Calculation for Open Pool
  const currentHighestBid = useMemo(() => {
    if (!item) return 12450;
    if (item.bids && item.bids.length > 0) {
      return Math.max(...item.bids.map(b => b.amount));
    }
    return item.base_price || 12450;
  }, [item]);

  // Leading bidder name
  const leadingBidderName = useMemo(() => {
    if (recentBidsStream.length > 0) {
      return recentBidsStream[0].name;
    }
    return 'No leading bidder yet';
  }, [recentBidsStream]);

  // User's own placed bids on this item
  const userBidsOnThisItem = useMemo(() => {
    if (!user || !recentLUBBids || recentLUBBids.length === 0) return [];
    return recentLUBBids.filter(b => b.user_id === user.id);
  }, [user, recentLUBBids]);

  // Target Bid Amount for Open Pool
  const targetBidAmount = useMemo(() => {
    if (customBidInput) {
      return parseFloat(customBidInput) || (currentHighestBid + selectedIncrement);
    }
    return currentHighestBid + selectedIncrement;
  }, [currentHighestBid, selectedIncrement, customBidInput]);

  const bidFee = 5.00;
  const totalCost = targetBidAmount + bidFee;

  const handleOpenPlaceBid = (inc = 50) => {
    setSelectedIncrement(inc);
    setCustomBidInput((currentHighestBid + inc).toFixed(2));
    setViewMode('place_bid');
  };

  const handleQuickAddLUB = (increment) => {
    const currentVal = parseFloat(lubBidAmount) || (item ? item.base_price : 0);
    const newAmount = (currentVal + increment).toFixed(2);
    setLubBidAmount(newAmount);
  };

  // Place Bid Handler (Supports Open & LUB Bids)
  const handleBidSubmit = async (bidAmountToPlace) => {
    setError('');
    setSuccess('');

    if (!user) {
      navigate('/login', {
        state: {
          from: `/item/${id}`,
          message: 'Please sign in with your phone number to place a bid.'
        }
      });
      return;
    }

    const amount = parseFloat(bidAmountToPlace);
    if (!amount || amount <= (item?.base_price || 0)) {
      setError(`Bid amount must be greater than base price (${item?.base_price || 0} Birr)`);
      return;
    }

    try {
      await axios.post('/api/bids/place', {
        item_id: parseInt(id),
        amount
      });

      setSuccess(`Bid of ${amount.toLocaleString()} Birr placed successfully!`);
      setLubBidAmount('');
      
      if (user && setUser) {
        setUser({ ...user, wallet_balance: Math.max(0, user.wallet_balance - 1.0) });
      }

      fetchItemDetails();
      setTimeout(() => {
        setSuccess('');
        setViewMode('detail');
      }, 2500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to place bid. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0B0E] flex flex-col items-center justify-center text-white gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-amber-500 border-t-transparent"></div>
        <p className="text-xs font-bold text-zinc-400">Loading auction details...</p>
      </div>
    );
  }

  const productTitle = item?.title || 'Cartier Santos Green';
  const categoryLabel = (item?.category || 'ELECTRONICS').toUpperCase();
  const productImage = item?.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600';

  return (
    <div className="min-h-screen bg-[#0A0B0E] text-slate-100 pb-28 pt-2 px-3 md:px-6 max-w-lg mx-auto font-sans antialiased">
      {/* Phone Status Header */}
      

      {/* ========================================================================= */}
      {/* 1. OPEN BID POOL LAYOUT (Matches New Screenshots)                       */}
      {/* ========================================================================= */}
      {isOpenPool ? (
        <>
          {/* VIEW 1: OPEN BID AUCTION DETAIL SCREEN */}
          {viewMode === 'detail' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 px-1">
                <button 
                  onClick={() => navigate(-1)}
                  className="w-9 h-9 rounded-full bg-[#141519] border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white transition-colors"
                >
                  <ArrowLeft size={18} />
                </button>
                <h1 className="font-serif font-black text-xl text-white tracking-tight">
                  Auction Detail
                </h1>
                <button className="w-9 h-9 rounded-full bg-[#141519] border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white transition-colors">
                  <Share2 size={16} />
                </button>
              </div>

              {/* Hero Image Box - Multi Image Animated Carousel */}
              <ProductGalleryCarousel 
                item={item} 
                badgeText="OPEN BID" 
                badgeColorClass="bg-emerald-950/80 text-emerald-400 border-emerald-500/40" 
              />

              {/* Notifications Alert */}
              {error && (
                <div className="bg-rose-950/80 border border-rose-500/40 text-rose-300 px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-between animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} className="text-rose-400" />
                    <span>{error}</span>
                  </div>
                </div>
              )}

              {success && (
                <div className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-between animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400" />
                    <span>{success}</span>
                  </div>
                </div>
              )}

              {/* Main Detail Card Container */}
              <div className="bg-[#141519] border border-zinc-800/90 rounded-3xl p-5 shadow-2xl space-y-4">
                {/* CURRENT HIGHEST BID */}
                <div className="text-center py-2 space-y-1">
                  <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
                    CURRENT HIGHEST BID
                  </p>
                  <h2 className="font-serif font-black text-3xl md:text-4xl text-amber-400 tracking-tight">
                    {currentHighestBid.toLocaleString()} Birr
                  </h2>
                  <p className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1">
                    <span>{leadingBidderName}</span>
                  </p>
                </div>

                {/* LIVE BID STREAM */}
                <div className="space-y-2.5">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-1">
                    LIVE BID STREAM
                  </p>

                  <div className="space-y-2.5">
                    {recentBidsStream.length === 0 ? (
                      <div className="p-4 bg-[#0E0F12] border border-zinc-800/80 rounded-2xl text-center text-xs text-zinc-500">
                        No bids placed yet. Be the first to place an open bid!
                      </div>
                    ) : (
                      recentBidsStream.slice(0, 3).map((bidder) => (
                        <div 
                          key={bidder.id}
                          className={`p-3 rounded-2xl flex items-center justify-between transition-all shadow-md ${
                            bidder.isUser 
                              ? 'bg-emerald-950/30 border border-emerald-500/50 shadow-emerald-950/20' 
                              : 'bg-[#0E0F12] border border-zinc-800/80'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <BidderAvatar src={bidder.avatar} alt={bidder.name} />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="font-bold text-sm text-white">{bidder.name}</p>
                                {bidder.badge && (
                                  <span className="bg-emerald-500 text-black text-[9px] font-black px-1.5 py-0.2 rounded-md uppercase">
                                    {bidder.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-zinc-400 font-medium">
                                {bidder.timeAgo} • {bidder.amount.toLocaleString()} Birr
                              </p>
                            </div>
                          </div>

                          <span className="text-emerald-400 font-extrabold text-sm tracking-tight">
                            {bidder.increment}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Quick Increment Preset Buttons */}
                <div className="grid grid-cols-3 gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => handleOpenPlaceBid(50)}
                    className="bg-[#1D1E24] hover:bg-amber-400/10 active:bg-amber-400/20 border border-zinc-800 hover:border-amber-400/40 text-amber-400 font-black text-sm py-3 px-2 rounded-2xl transition-all shadow-sm cursor-pointer"
                  >
                    +50 Birr
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenPlaceBid(100)}
                    className="bg-[#1D1E24] hover:bg-amber-400/10 active:bg-amber-400/20 border border-zinc-800 hover:border-amber-400/40 text-amber-400 font-black text-sm py-3 px-2 rounded-2xl transition-all shadow-sm cursor-pointer"
                  >
                    +100 Birr
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenPlaceBid(250)}
                    className="bg-[#1D1E24] hover:bg-amber-400/10 active:bg-amber-400/20 border border-zinc-800 hover:border-amber-400/40 text-amber-400 font-black text-sm py-3 px-2 rounded-2xl transition-all shadow-sm cursor-pointer"
                  >
                    +250 Birr
                  </button>
                </div>

                {/* Primary Action Button */}
                <button
                  type="button"
                  onClick={() => handleOpenPlaceBid(selectedIncrement)}
                  className="w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:brightness-110 active:scale-95 text-black font-black text-base py-4 rounded-2xl shadow-xl shadow-amber-500/20 transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <span>BID NOW (+{selectedIncrement})</span>
                </button>
              </div>
            </div>
          )}

          {/* VIEW 2: PLACE OPEN BID CONFIRMATION SCREEN */}
          {viewMode === 'place_bid' && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 py-2 px-1 border-b border-zinc-800/80 pb-3">
                <button 
                  onClick={() => setViewMode('detail')}
                  className="w-9 h-9 rounded-full bg-[#141519] border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white transition-colors"
                >
                  <ArrowLeft size={18} />
                </button>
                <h1 className="font-serif font-black text-xl text-white tracking-tight">
                  Place Bid
                </h1>
              </div>

              <div className="space-y-1">
                <h2 className="font-serif font-black text-2xl md:text-3xl text-white tracking-tight uppercase">
                  PLACE YOUR OPEN BID
                </h2>
                <p className="text-xs text-zinc-400 font-medium">
                  Bid higher than the current highest bid to take the lead.
                </p>
              </div>

              <div className="bg-[#141519] border border-zinc-800/90 p-4 rounded-2xl flex items-center gap-3.5 shadow-lg">
                <img 
                  src={productImage} 
                  alt={productTitle} 
                  className="w-16 h-16 object-cover rounded-xl border border-zinc-800 bg-zinc-900"
                />
                <div>
                  <h3 className="font-serif font-bold text-base text-white">{productTitle}</h3>
                  <p className="text-xs text-zinc-400 mt-0.5 font-medium">
                    Open Auction • Min Increment 50 Birr
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  SUGGESTED INCREMENTS
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {[50, 100, 250, 500].map((inc) => {
                    const isSelected = selectedIncrement === inc;
                    return (
                      <button
                        key={inc}
                        type="button"
                        onClick={() => {
                          setSelectedIncrement(inc);
                          setCustomBidInput((currentHighestBid + inc).toFixed(2));
                        }}
                        className={`py-3 rounded-2xl text-xs font-black transition-all cursor-pointer shadow-md ${
                          isSelected
                            ? 'bg-amber-500 text-black font-black shadow-amber-500/20'
                            : 'bg-[#141519] border border-zinc-800 text-zinc-300 hover:text-white'
                        }`}
                      >
                        +{inc}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  ENTER CUSTOM BID AMOUNT
                </p>
                <div className="relative bg-[#0E0F12] border-2 border-amber-400 rounded-2xl p-4 flex justify-between items-center shadow-lg">
                  <input 
                    type="number"
                    step="50"
                    min={currentHighestBid + 1}
                    value={customBidInput}
                    onChange={(e) => setCustomBidInput(e.target.value)}
                    className="w-full bg-transparent font-mono font-black text-2xl md:text-3xl text-white focus:outline-none"
                  />
                  <span className="text-zinc-400 font-bold text-base pl-2">Birr</span>
                </div>
              </div>

              <div className="bg-[#141519] border border-zinc-800/90 rounded-2xl p-4 space-y-2.5 shadow-lg text-xs">
                <div className="flex justify-between items-center text-zinc-300">
                  <span>My Bid Amount</span>
                  <span className="font-mono font-bold text-white">{targetBidAmount.toLocaleString()} Birr</span>
                </div>

                <div className="flex justify-between items-center text-zinc-300">
                  <span>Auction Bid Fee</span>
                  <span className="font-mono font-bold text-zinc-300">{bidFee.toFixed(2)} Birr</span>
                </div>

                <div className="border-t border-zinc-800 pt-2 flex justify-between items-center font-bold text-sm">
                  <span className="text-white font-extrabold">Total Cost</span>
                  <span className="font-mono font-black text-amber-400 text-base">
                    {totalCost.toLocaleString()} Birr
                  </span>
                </div>
              </div>

              {error && (
                <div className="bg-rose-950/80 border border-rose-500/40 text-rose-300 px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-between animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} className="text-rose-400" />
                    <span>{error}</span>
                  </div>
                </div>
              )}

              {success && (
                <div className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-between animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400" />
                    <span>{success}</span>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => handleBidSubmit(targetBidAmount)}
                className="w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:brightness-110 active:scale-95 text-black font-black text-base py-4 rounded-2xl shadow-xl shadow-amber-500/20 transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>CONFIRM & PLACE BID</span>
              </button>
            </div>
          )}
        </>
      ) : (
        /* ========================================================================= */
        /* 2. ORIGINAL / PREVIOUS PREMIUM POOL LAYOUT (Lowest Unique Bid Format)     */
        /* ========================================================================= */
        <div className="space-y-6">
          <div className="flex justify-between items-center py-2 px-1">
            <button 
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-full bg-[#141519] border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="font-serif font-black text-xl text-white tracking-tight">
              Premium LUB Pool
            </h1>
            <button className="w-9 h-9 rounded-full bg-[#141519] border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white transition-colors">
              <Share2 size={16} />
            </button>
          </div>

          {/* Hero Image - Multi Image Animated Carousel */}
          <ProductGalleryCarousel 
            item={item} 
            badgeText="PREMIUM LUB POOL" 
            badgeColorClass="bg-purple-950/80 text-purple-400 border-purple-500/40" 
          />

          {/* Bidding Panel */}
          {/* Closed Auction Winner Announcement Box OR Active Bidding Form */}
          {item.status === 'closed' ? (
            <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-amber-500/10 border border-amber-500/40 rounded-3xl p-6 text-center space-y-4 shadow-xl">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 text-black flex items-center justify-center font-black mx-auto shadow-lg shadow-amber-500/20">
                <Trophy size={28} />
              </div>
              
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-400/10 border border-amber-400/30 px-3 py-1 rounded-full">
                  Auction Closed
                </span>
                <h3 className="text-xl font-black text-white pt-2">
                  {item.winner_id === user?.id 
                    ? '🎉 Congratulations! You Won This Auction!' 
                    : `Winner Announced: ${item.winner?.name || 'Declared Winner'}`}
                </h3>
                <p className="text-xs text-zinc-300 font-mono">
                  {item.winner_id === user?.id 
                    ? 'Your unique bid was declared the winning Lowest Unique Bid by the admin!' 
                    : 'The admin has officially settled this auction and declared the winner.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-[#16161A] rounded-3xl border border-zinc-800 p-5 md:p-6 space-y-5 shadow-xl">
              {/* Timer Banner */}
              <div className="flex flex-col items-center justify-center py-4 bg-[#111113] text-white rounded-2xl border border-zinc-800 shadow-inner">
                <Clock className="text-amber-400 mb-1" size={22} />
                <p className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">Time Remaining</p>
                <p className={`text-xl font-black font-mono tracking-tight ${timeLeft === 'EXPIRED' ? 'text-red-400' : 'text-emerald-400'}`}>
                  {timeLeft || 'Calculating...'}
                </p>
              </div>

              {/* Price Stats */}
              <div className="flex justify-between items-center bg-[#111113] p-3.5 rounded-2xl border border-zinc-800">
                <div>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase">Lowest Unique Base</p>
                  <p className="text-lg font-black text-amber-400">{item.base_price ? item.base_price.toFixed(2) : '0.00'} Birr</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-zinc-400 font-bold uppercase">Bid Fee</p>
                  <p className="text-xs font-bold text-zinc-300">1.00 Birr</p>
                </div>
              </div>

              {/* Action Form or Phone Login Prompt */}
              <div>
                <h3 className="text-xs font-bold text-zinc-300 mb-3 flex items-center gap-2">
                  <TrendingDown size={16} className="text-amber-400" />
                  Place Phone Unique Bid
                </h3>

                {!user ? (
                  <div className="p-4 bg-[#111113] border border-zinc-800 rounded-2xl text-center space-y-3">
                    <div className="w-10 h-10 rounded-full bg-[#1A1A1E] text-amber-400 border border-zinc-800 shadow-sm flex items-center justify-center mx-auto">
                      <Lock size={18} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-xs text-white">Sign in to Place Bids</h4>
                      <p className="text-[11px] text-zinc-400">
                        View items freely! Enter your phone number starting with 09 or 07 to start bidding.
                      </p>
                    </div>
                    <Link
                      to="/login"
                      state={{ from: `/item/${id}`, message: 'Please log in with your phone number to place a bid.' }}
                      className="inline-flex items-center justify-center gap-2 w-full py-3 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
                    >
                      <Smartphone size={16} />
                      Login with Phone
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {error && (
                      <div className="p-3 bg-red-950/40 text-red-300 rounded-xl text-xs border border-red-800/60 flex items-start gap-2">
                        <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-400" />
                        <span>{error}</span>
                      </div>
                    )}
                    {success && (
                      <div className="p-3 bg-emerald-950/40 text-emerald-300 rounded-xl text-xs border border-emerald-800/60 flex items-start gap-2">
                        <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-400" />
                        <span>{success}</span>
                      </div>
                    )}

                    {/* Quick Decimal Increment Preset Buttons */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Quick Increment:</span>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[0.01, 0.10, 0.50, 1.00].map((inc) => (
                          <button
                            key={inc}
                            type="button"
                            onClick={() => handleQuickAddLUB(inc)}
                            className="py-1.5 px-1.5 bg-[#111113] hover:bg-amber-500/10 text-amber-400 font-mono font-bold text-xs rounded-xl border border-zinc-800 hover:border-amber-500/30 transition-all flex items-center justify-center gap-0.5"
                          >
                            <Plus size={10} />
                            {inc.toFixed(2)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleBidSubmit(lubBidAmount);
                      }} 
                      className="flex gap-2"
                    >
                      <div className="relative flex-grow">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-xs">Birr</span>
                        <input
                          type="number"
                          step="0.01"
                          min={(item.base_price || 0) + 0.01}
                          required
                          disabled={timeLeft === 'EXPIRED'}
                          className="w-full pl-12 pr-3 py-3 bg-[#111113] border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-mono font-bold text-sm text-white transition-all"
                          placeholder="e.g. 15.20"
                          value={lubBidAmount}
                          onChange={(e) => setLubBidAmount(e.target.value)}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={timeLeft === 'EXPIRED'}
                        className="px-5 bg-gradient-to-r from-amber-400 to-amber-600 hover:brightness-110 text-black rounded-xl font-black text-xs uppercase shadow-md transition-all active:scale-95 disabled:bg-zinc-800 disabled:text-zinc-600"
                      >
                        Bid LUB
                      </button>
                    </form>

                    <div className="flex items-start gap-1.5 text-[10px] text-zinc-400 pt-1">
                      <Info size={14} className="shrink-0 mt-0.5 text-amber-400" />
                      <p>Bids require 2 decimal places. Only lowest unique bids win!</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* User's Placed Bids Notification Card */}
          {user && userBidsOnThisItem.length > 0 && (
            <div className="bg-[#141519] border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between text-xs shadow-xl">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0"></span>
                <div>
                  <p className="font-bold text-amber-400 text-xs">
                    You placed {userBidsOnThisItem.length} bid{userBidsOnThisItem.length > 1 ? 's' : ''} on this product
                  </p>
                  <p className="text-xs text-zinc-300 font-mono font-bold mt-0.5">
                    {userBidsOnThisItem.map(b => `${parseFloat(b.amount).toFixed(2)} Birr`).join(', ')}
                  </p>
                </div>
              </div>
              <span className="bg-amber-400/10 border border-amber-400/30 text-amber-400 text-[10px] font-black px-2.5 py-1 rounded-full uppercase shrink-0">
                YOUR BIDS
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ItemDetails;
