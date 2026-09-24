import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { SlidersHorizontal, Tag, Search, ArrowLeft } from 'lucide-react';

const formatCountdownShort = (endTime) => {
  if (!endTime) return '00h 00m';
  const now = new Date().getTime();
  const end = new Date(endTime).getTime();
  const distance = end - now;

  if (distance <= 0) return 'EXPIRED';

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

  const pad = (n) => (n < 10 ? '0' + n : n);
  if (days > 0) {
    return `${days}d ${pad(hours)}h`;
  }
  return `${pad(hours)}h ${pad(minutes)}m`;
};

const CATEGORY_MAP = [
  { label: 'All', value: 'all' },
  { label: 'Cars', value: 'Supercars & Vehicles' },
  { label: 'Scooters', value: 'Supercars & Vehicles' },
  { label: 'Phones', value: 'Electronics' },
  { label: 'Electronics', value: 'Electronics' },
  { label: 'Cosmetics', value: 'Cosmetics' },
  { label: 'Fashion', value: 'Fashion & Luxury' },
  { label: 'Appliances', value: 'Appliances' }
];

const Discover = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPool = searchParams.get('pool') === 'premium' ? 'premium' : 'open';
  
  const [activePool, setActivePool] = useState(initialPool); // 'premium' | 'open'
  const [activeCategory, setActiveCategory] = useState('All');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await axios.get('/api/items');
        setItems(res.data);
      } catch (err) {
        console.error('Error fetching discover items:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  // Sync state with URL query param if changed
  useEffect(() => {
    const poolParam = searchParams.get('pool');
    if (poolParam === 'premium' || poolParam === 'open') {
      setActivePool(poolParam);
    }
  }, [searchParams]);

  const handlePoolChange = (pool) => {
    setActivePool(pool);
    setSearchParams({ pool });
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // 1. Pool filter
      const matchesPool = activePool === 'premium' 
        ? item.pool_type === 'premium' 
        : (item.pool_type === 'open' || !item.pool_type);

      // 2. Category filter
      let matchesCategory = true;
      if (activeCategory !== 'All') {
        if (activeCategory === 'Cars' || activeCategory === 'Scooters') {
          matchesCategory = item.category === 'Supercars & Vehicles' || item.title.toLowerCase().includes(activeCategory.toLowerCase());
        } else if (activeCategory === 'Phones') {
          matchesCategory = item.category === 'Electronics' || item.title.toLowerCase().includes('phone') || item.title.toLowerCase().includes('iphone');
        } else if (activeCategory === 'Fashion') {
          matchesCategory = item.category === 'Fashion & Luxury';
        } else {
          matchesCategory = item.category === activeCategory;
        }
      }

      // 3. Search query
      const matchesSearch = searchQuery === '' || 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesPool && matchesCategory && matchesSearch;
    });
  }, [items, activePool, activeCategory, searchQuery]);

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-8">
      
      {/* Top Bar Header */}
      <div className="flex justify-between items-center pt-1 px-1">
        <div className="flex items-center gap-3">
          <Link 
            to="/" 
            className="w-9 h-9 rounded-full bg-[#16161A] border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white transition-all"
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            Discover Auctions
          </h1>
        </div>

        <button className="w-10 h-10 rounded-2xl bg-[#16161A] border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white transition-all shadow-md">
          <SlidersHorizontal size={20} />
        </button>
      </div>

      {/* Segmented Pool Switch (LUB Bids vs Open Bids) */}
      <div className="bg-[#141417] p-1.5 rounded-2xl border border-zinc-800/90 grid grid-cols-2 gap-2 shadow-xl">
        <button
          onClick={() => handlePoolChange('premium')}
          className={`py-3 rounded-xl text-xs md:text-sm font-black transition-all ${
            activePool === 'premium'
              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/10 scale-[1.01]'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Active premium Bids
        </button>

        <button
          onClick={() => handlePoolChange('open')}
          className={`py-3 rounded-xl text-xs md:text-sm font-black transition-all ${
            activePool === 'open'
              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/10 scale-[1.01]'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Open Bids
        </button>
      </div>

      {/* Horizontal Category Filter Chips */}
      <div className="overflow-x-auto no-scrollbar py-1 flex items-center gap-2" style={{ scrollbarWidth: 'none' }}>
        {CATEGORY_MAP.map((cat) => {
          const isActive = activeCategory === cat.label;
          return (
            <button
              key={cat.label}
              onClick={() => setActiveCategory(cat.label)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                isActive
                  ? 'bg-emerald-950/90 text-emerald-400 border-emerald-500 shadow-md shadow-emerald-500/10 scale-105'
                  : 'bg-[#16161A] text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Search Input Filter */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by keyword..."
          className="w-full pl-10 pr-4 py-2.5 bg-[#141417] border border-zinc-800/80 rounded-xl text-xs font-medium text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
        />
      </div>

      {/* Vertical List of Auction Cards (Matching Screenshot) */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-3 border-amber-500 border-t-transparent"></div>
          <p className="text-xs font-bold text-zinc-500">Loading auction items...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12 space-y-2 bg-[#141417] rounded-3xl border border-zinc-800/80">
          <p className="text-sm font-bold text-white">No auction items found</p>
          <p className="text-xs text-zinc-500">Try switching categories or adjusting search terms</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredItems.map((item) => (
            <Link
              key={item.id}
              to={`/item/${item.id}`}
              className="bg-[#141417] hover:bg-[#1A1A1E] border border-zinc-800/90 hover:border-amber-500/50 rounded-2xl p-3 md:p-4 flex items-center justify-between gap-3 md:gap-4 shadow-xl transition-all duration-300 group block"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Left Thumbnail Image */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 bg-zinc-900 rounded-xl overflow-hidden shrink-0 border border-zinc-800/80 relative">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-700">
                      <Tag size={28} />
                    </div>
                  )}
                </div>

                {/* Right Item Details */}
                <div className="space-y-1.5 min-w-0">
                  <h3 className="font-bold text-white text-sm md:text-base line-clamp-1 group-hover:text-amber-400 transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-xs md:text-sm font-medium text-zinc-400">
                    Min Bid: <span className="font-black text-amber-400 font-mono">{item.base_price.toFixed(2)} Birr</span>
                  </p>

                  <p className="text-[11px] text-zinc-500 font-medium">
                    {item.bids ? item.bids.length : (Math.floor(Math.random() * 300) + 50)} Bids
                  </p>
                </div>
              </div>

              {/* Right Side Countdown Pill */}
              <div className="shrink-0">
                <span className="bg-emerald-950/90 text-emerald-400 border border-emerald-800/60 px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1 shadow-md">
                  {formatCountdownShort(item.end_time)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

    </div>
  );
};

export default Discover;
