import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Search, Tag, Clock, ChevronLeft, ChevronRight, Flame, Trophy, Package, Sparkles } from 'lucide-react';

const formatCountdown = (endTime) => {
  if (!endTime) return '00h : 00m : 00s';
  const now = new Date().getTime();
  const end = new Date(endTime).getTime();
  const distance = end - now;

  if (distance <= 0) return 'EXPIRED';

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);

  const pad = (n) => (n < 10 ? '0' + n : n);
  if (days > 0) {
    return `${days}d : ${pad(hours)}h : ${pad(minutes)}m : ${pad(seconds)}s`;
  }
  return `${pad(hours)}h : ${pad(minutes)}m : ${pad(seconds)}s`;
};

// Animated Ping-Pong 4-Second Sliding Featured Carousel Component
const FeaturedItemsCarousel = ({ items }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const dirRef = useRef(1); // 1 = forward (right-to-left), -1 = backward (left-to-right)
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const count = items ? items.length : 0;

  useEffect(() => {
    if (count <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const total = itemsRef.current ? itemsRef.current.length : 0;
        if (total <= 1) return 0;

        let nextIndex = prevIndex + dirRef.current;
        if (nextIndex >= total) {
          dirRef.current = -1;
          nextIndex = total - 2;
          if (nextIndex < 0) nextIndex = 0;
        } else if (nextIndex < 0) {
          dirRef.current = 1;
          nextIndex = 1;
          if (nextIndex >= total) nextIndex = 0;
        }
        return nextIndex;
      });
    }, 4000);

    return () => clearInterval(timer);
  }, [count, isPaused]);

  if (!items || items.length === 0) return null;

  const handlePrev = () => {
    dirRef.current = -1;
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      setCurrentIndex(items.length - 1);
    }
  };

  const handleNext = () => {
    dirRef.current = 1;
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      className="bg-[#16161A] rounded-3xl overflow-hidden border border-zinc-800/90 p-3 md:p-4 shadow-2xl relative space-y-4 transition-all duration-500"
    >
      {/* Sliding Track Viewport */}
      <div className="overflow-hidden rounded-2xl relative">
        <div
          className="flex transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {items.map((item, idx) => (
            <div key={item.id} className="w-full shrink-0 space-y-4">
              {/* Top Banner Image with Overlay */}
              <div className="aspect-[16/9] md:aspect-[21/9] bg-zinc-900 rounded-2xl relative overflow-hidden group">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-700">
                    <Tag size={56} className="opacity-30" />
                  </div>
                )}

                {/* Featured Badge */}
                <div className="absolute top-3 left-3 bg-[#111113]/90 backdrop-blur-md text-amber-400 border border-amber-400/40 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5 z-10">
                  <Sparkles size={12} className="text-amber-400 animate-pulse" />
                  FEATURED ITEM ({idx + 1}/{items.length})
                </div>

                {/* Time Remaining Pill overlay */}
                <div className="absolute bottom-3 right-3 bg-black/85 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-mono font-bold text-emerald-400 border border-white/10 flex items-center gap-1.5 shadow-lg z-10">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  {formatCountdown(item.end_time)}
                </div>
              </div>

              {/* Item Details */}
              <div className="px-2 space-y-3">
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-white tracking-tight leading-snug">
                    {item.title}
                  </h2>
                  <p className="text-xs text-zinc-400 font-medium mt-0.5">
                    Category: <span className="text-amber-400 font-bold">{item.category || 'General'}</span> • Starting Bid: 1 Birr
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 py-2 border-y border-zinc-800/60">
                  <div>
                    <p className="text-[11px] text-zinc-400 font-semibold">Current Lowest Unique</p>
                    <p className="text-lg md:text-xl font-black text-amber-400 font-mono">
                      {item.base_price.toFixed(2)} Birr
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] text-zinc-400 font-semibold">Registration Pool</p>
                    <span className={`inline-block mt-0.5 px-2.5 py-0.5 text-[10px] font-black rounded-full uppercase ${
                      item.pool_type === 'premium'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    }`}>
                      {item.pool_type === 'premium' ? 'PREMIUM POOL' : 'OPEN BID'}
                    </span>
                  </div>
                </div>

                <Link
                  to={`/item/${item.id}`}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:brightness-110 text-black font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-amber-500/10 flex justify-center items-center transition-all active:scale-[0.98]"
                >
                  PLACE BID (1 Birr Fee)
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Carousel Prev / Next Controls Overlay */}
        {items.length > 1 && (
          <div className="absolute top-[28%] md:top-[30%] inset-x-2 flex justify-between items-center pointer-events-none z-20">
            <button
              onClick={handlePrev}
              className="pointer-events-auto w-9 h-9 rounded-full bg-black/70 hover:bg-black/90 text-white backdrop-blur-md border border-white/10 flex items-center justify-center transition-all active:scale-90 shadow-xl"
              aria-label="Previous Featured Item"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleNext}
              className="pointer-events-auto w-9 h-9 rounded-full bg-black/70 hover:bg-black/90 text-white backdrop-blur-md border border-white/10 flex items-center justify-center transition-all active:scale-90 shadow-xl"
              aria-label="Next Featured Item"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}

        {/* Indicator Dots Overlay */}
        {items.length > 1 && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 z-20">
            {items.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentIndex ? 'w-5 bg-amber-400' : 'w-1.5 bg-zinc-500 hover:bg-zinc-300'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Static Horizontal Carousel with "See All" Link
const StaticItemCarousel = ({ title, items, icon: Icon, isFeeMode = false, poolType = 'open' }) => {
  const containerRef = useRef(null);

  if (!items || items.length === 0) return null;

  return (
    <section className="space-y-3.5 py-1">
      {/* Header Row */}
      <div className="flex justify-between items-center px-1">
        <h3 className="text-base md:text-lg font-black text-white tracking-tight flex items-center gap-2">
          {Icon ? <Icon size={20} className="text-amber-400" /> : <Package size={20} className="text-amber-400" />}
          {title} ({items.length})
        </h3>

        <Link
          to={`/discover?pool=${poolType}`}
          className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20 hover:border-amber-500/40 transition-all active:scale-95 shadow-sm"
        >
          See All <ChevronRight size={14} />
        </Link>
      </div>

      {/* Manual Scrollable Track */}
      <div
        ref={containerRef}
        className="overflow-x-auto py-1.5 px-0.5 no-scrollbar rounded-2xl flex gap-3.5 md:gap-4 scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        {items.map((item) => (
          <div key={item.id} className="w-[240px] sm:w-[270px] md:w-[280px] shrink-0">
            <Link
              to={`/item/${item.id}`}
              className="bg-[#16161A] hover:bg-[#1C1C22] rounded-2xl p-3 border border-zinc-800/90 hover:border-amber-500/60 shadow-xl hover:shadow-amber-500/10 hover:scale-[1.02] transition-all duration-300 group flex flex-col justify-between space-y-3 h-full block"
            >
              <div className="aspect-[4/3] bg-zinc-900 rounded-xl overflow-hidden relative border border-zinc-800/60">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-700">
                    <Tag size={32} />
                  </div>
                )}

                <div className="absolute bottom-2 right-2 bg-black/85 backdrop-blur-md px-2 py-0.5 rounded-lg text-[9.5px] font-mono font-bold text-emerald-400 border border-white/10 flex items-center gap-1 shadow-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {formatCountdown(item.end_time)}
                </div>
              </div>

              <div className="px-1 space-y-1">
                <h4 className="font-bold text-white text-xs md:text-sm line-clamp-1 group-hover:text-amber-400 transition-colors">
                  {item.title}
                </h4>

                <div className="flex justify-between items-baseline pt-1 border-t border-zinc-800/60">
                  <span className="text-[10px] text-zinc-400 font-medium">
                    {isFeeMode ? 'Bid Fee' : 'Lowest Unique'}
                  </span>
                  <span className="text-xs md:text-sm font-black text-amber-400 font-mono">
                    {isFeeMode ? `Fee: ${item.base_price.toFixed(0)} Birr` : `${item.base_price.toFixed(2)} Birr`}
                  </span>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
};

const Home = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [nowTime, setNowTime] = useState(Date.now());
  const { user } = useAuth();

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await axios.get('/api/items');
        setItems(res.data);
      } catch (err) {
        console.error('Error fetching items:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setNowTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const filteredItems = items.filter(item => {
    return item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           item.description?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // FILTERING BASED ON ADMIN POOL REGISTRATION (pool_type: "premium" vs "open")
  const premiumPools = filteredItems.filter(item => item.pool_type === 'premium');
  const openBids = filteredItems.filter(item => item.pool_type === 'open' || !item.pool_type);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-amber-500 border-t-transparent"></div>
        <p className="text-xs font-bold text-zinc-500 animate-pulse">Loading BidWin auctions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 max-w-4xl mx-auto pb-6">

      {/* Search Bar */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search luxury cars, electronics..."
          className="w-full pl-11 pr-4 py-3.5 bg-[#16161A] border border-zinc-800/90 rounded-2xl text-xs font-medium text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all shadow-inner"
        />
      </div>

      {/* Featured Auction Animated Auto-Carousel */}
      <FeaturedItemsCarousel items={filteredItems} />

      {/* Active Premium Pools (Static Horizontal Carousel with "See All") */}
      <StaticItemCarousel
        title="Active Premium Pools"
        items={premiumPools}
        icon={Flame}
        isFeeMode={true}
        poolType="premium"
      />

      {/* Active Open Bids (Static Horizontal Carousel with "See All") */}
      <StaticItemCarousel
        title="Active Open Bids"
        items={openBids}
        icon={Trophy}
        isFeeMode={false}
        poolType="open"
      />

    </div>
  );
};

export default Home;
