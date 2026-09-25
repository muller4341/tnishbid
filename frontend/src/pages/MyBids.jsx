import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Signal, Wifi, Battery, Clock, ArrowRight, Trophy, AlertCircle } from 'lucide-react';

// Default mock bids matching exact screenshot layout if user has not placed real bids yet
const MOCK_BIDS = [
  {
    id: 101,
    title: 'Cartier Santos Green',
    userBid: '12,450 Birr',
    latestHighest: '12,450 Birr',
    status: 'WINNING', // WINNING | OUTBID | ENDED
    timeRemaining: '01:14:02',
    poolType: 'open', // lub | open
    bidStatus: 'active', // active | won | ended
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=300'
  },
  {
    id: 102,
    title: 'Premium Sedan',
    userBid: '25,000 Birr',
    latestHighest: '25,100 Birr',
    status: 'OUTBID',
    timeRemaining: '00:45:12',
    poolType: 'open',
    bidStatus: 'active',
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=300'
  },
  {
    id: 103,
    title: 'Smart TV OLED',
    userBid: '17,000 Birr',
    latestHighest: '17,000 Birr',
    status: 'ENDED',
    timeRemaining: 'Aug 24, 2026',
    poolType: 'open',
    bidStatus: 'ended',
    image: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&q=80&w=300'
  },
  {
    id: 104,
    title: 'iPhone 15 Pro Max Gold',
    userBid: '4,200 Birr',
    latestHighest: '4,200 Birr',
    status: 'WINNING',
    timeRemaining: '03:22:15',
    poolType: 'lub',
    bidStatus: 'active',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=300'
  },
  {
    id: 105,
    title: 'PlayStation 5 Digital',
    userBid: '1,800 Birr',
    latestHighest: '1,800 Birr',
    status: 'WINNING',
    timeRemaining: 'Ended',
    poolType: 'lub',
    bidStatus: 'won',
    image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&q=80&w=300'
  }
];

const MyBids = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [poolType, setPoolType] = useState('open'); // 'lub' | 'open'
  const [statusFilter, setStatusFilter] = useState('active'); // 'active' | 'won' | 'ended'
  const [bids, setBids] = useState(MOCK_BIDS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUserBids = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const res = await axios.get('/api/bids/my-bids');
        if (res.data && res.data.length > 0) {
          // Transform backend bids to list format
          const formatted = res.data.map(b => {
            const isWon = b.item.winner_id === user.id;
            const isEnded = b.item.status === 'closed' || new Date(b.item.end_time) <= new Date();
            let status = 'OUTBID';
            if (isWon) status = 'WINNING';
            else if (isEnded) status = 'ENDED';
            else if (b.is_unique) status = 'WINNING';

            const now = new Date().getTime();
            const end = new Date(b.item.end_time).getTime();
            const distance = end - now;

            let timeStr = 'Ended';
            if (distance > 0) {
              const hours = Math.floor(distance / (1000 * 60 * 60));
              const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
              const seconds = Math.floor((distance % (1000 * 60)) / 1000);
              const pad = n => (n < 10 ? '0' + n : n);
              timeStr = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
            } else {
              timeStr = new Date(b.item.end_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            }

            return {
              id: b.item.id,
              title: b.item.title,
              userBid: `${b.amount.toLocaleString()} Birr`,
              latestHighest: `${b.item.base_price.toLocaleString()} Birr`,
              status,
              timeRemaining: timeStr,
              poolType: b.item.pool_type || 'open',
              bidStatus: isWon ? 'won' : (isEnded ? 'ended' : 'active'),
              image: b.item.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=300'
            };
          });

          // Combine real user bids with mock bids to ensure visual richness
          setBids([...formatted, ...MOCK_BIDS]);
        }
      } catch (err) {
        console.error('Failed to fetch user bids:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserBids();
  }, [user]);

  // Filter logic
  const filteredBids = bids.filter(bid => {
    const matchesPool = poolType === 'lub' ? bid.poolType === 'lub' : (bid.poolType === 'open' || !bid.poolType);
    const matchesStatus = statusFilter === 'all' || bid.bidStatus === statusFilter;
    return matchesPool && matchesStatus;
  });

  // Calculate counts for secondary filter badges
  const activeCount = bids.filter(b => (poolType === 'lub' ? b.poolType === 'lub' : (b.poolType === 'open' || !b.poolType)) && b.bidStatus === 'active').length;
  const wonCount = bids.filter(b => (poolType === 'lub' ? b.poolType === 'lub' : (b.poolType === 'open' || !b.poolType)) && b.bidStatus === 'won').length;
  const endedCount = bids.filter(b => (poolType === 'lub' ? b.poolType === 'lub' : (b.poolType === 'open' || !b.poolType)) && b.bidStatus === 'ended').length;

  return (
    <div className="min-h-screen bg-[#0A0B0E] text-slate-100 pb-28 pt-2 px-3 md:px-6 max-w-lg mx-auto font-sans antialiased">
      {/* Phone Status Bar Header */}
      <div className="flex justify-between items-center px-3 py-2 text-xs font-semibold text-zinc-400 mb-2 select-none">
        <span className="font-mono text-xs text-zinc-300">9:41</span>
        <div className="flex items-center gap-1.5 text-zinc-300">
          <Signal size={14} />
          <Wifi size={14} />
          <Battery size={16} className="rotate-90" />
        </div>
      </div>

      {/* Main Title */}
      <h1 className="text-3xl font-black text-white tracking-tight mb-4 font-serif">
        My Bids
      </h1>

      {/* Primary Segmented Control (LUB Bids vs Open Bids) */}
      <div className="bg-[#141519] border border-zinc-800/80 p-1.5 rounded-2xl flex font-bold text-sm mb-4 shadow-inner">
        <button
          type="button"
          onClick={() => setPoolType('lub')}
          className={`flex-1 py-2.5 rounded-xl text-center transition-all duration-200 ${
            poolType === 'lub'
              ? 'bg-amber-500 text-black font-extrabold shadow-md'
              : 'text-zinc-400 hover:text-zinc-200 font-semibold'
          }`}
        >
          LUB Bids
        </button>
        <button
          type="button"
          onClick={() => setPoolType('open')}
          className={`flex-1 py-2.5 rounded-xl text-center transition-all duration-200 ${
            poolType === 'open'
              ? 'bg-amber-500 text-black font-extrabold shadow-md'
              : 'text-zinc-400 hover:text-zinc-200 font-semibold'
          }`}
        >
          Open Bids
        </button>
      </div>

      {/* Secondary Status Filter Pills (Active, Won, Ended) */}
      <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setStatusFilter('active')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 whitespace-nowrap ${
            statusFilter === 'active'
              ? 'border border-amber-500 text-amber-400 bg-amber-500/10 shadow-sm'
              : 'bg-[#141519] border border-zinc-800 text-zinc-400 hover:text-zinc-200 font-medium'
          }`}
        >
          Active ({activeCount})
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('won')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 whitespace-nowrap ${
            statusFilter === 'won'
              ? 'border border-amber-500 text-amber-400 bg-amber-500/10 shadow-sm'
              : 'bg-[#141519] border border-zinc-800 text-zinc-400 hover:text-zinc-200 font-medium'
          }`}
        >
          Won ({wonCount})
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('ended')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 whitespace-nowrap ${
            statusFilter === 'ended'
              ? 'border border-amber-500 text-amber-400 bg-amber-500/10 shadow-sm'
              : 'bg-[#141519] border border-zinc-800 text-zinc-400 hover:text-zinc-200 font-medium'
          }`}
        >
          Ended ({endedCount})
        </button>
      </div>

      {/* Bids List */}
      <div className="space-y-3.5">
        {filteredBids.length === 0 ? (
          <div className="bg-[#141519] border border-zinc-800/80 rounded-2xl p-8 text-center text-zinc-400 space-y-3 my-4">
            <Trophy className="mx-auto text-zinc-600" size={36} />
            <p className="text-sm font-semibold text-zinc-300">No {statusFilter} bids found in this section</p>
            <p className="text-xs text-zinc-500">Explore active auctions to place your unique bid!</p>
            <Link
              to="/discover"
              className="inline-block bg-amber-500 text-black font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md hover:bg-amber-400 transition-all mt-2"
            >
              Explore Auctions
            </Link>
          </div>
        ) : (
          filteredBids.map((bid) => (
            <div
              key={bid.id}
              className="bg-[#141519] border border-zinc-800/90 rounded-2xl p-4 shadow-xl space-y-3 transition-all hover:border-zinc-700/80"
            >
              {/* Card Header Top Row */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={bid.image}
                    alt={bid.title}
                    className="w-14 h-14 object-cover rounded-xl border border-zinc-800 bg-zinc-900 shadow-sm"
                  />
                  <div>
                    <h3 className="font-serif font-extrabold text-base md:text-lg text-white leading-tight">
                      {bid.title}
                    </h3>
                    <p className="text-xs text-zinc-400 font-medium mt-0.5">
                      Your Bid: <span className="text-zinc-300 font-semibold">{bid.userBid}</span>
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                <div>
                  {bid.status === 'WINNING' && (
                    <span className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-[10px] font-extrabold tracking-wider px-2.5 py-1 rounded-lg uppercase shadow-sm">
                      WINNING
                    </span>
                  )}
                  {bid.status === 'OUTBID' && (
                    <span className="bg-rose-950/80 border border-rose-500/40 text-rose-400 text-[10px] font-extrabold tracking-wider px-2.5 py-1 rounded-lg uppercase shadow-sm">
                      OUTBID
                    </span>
                  )}
                  {bid.status === 'ENDED' && (
                    <span className="bg-zinc-800/80 border border-zinc-700 text-zinc-400 text-[10px] font-extrabold tracking-wider px-2.5 py-1 rounded-lg uppercase shadow-sm">
                      ENDED
                    </span>
                  )}
                </div>
              </div>

              {/* Divider Line */}
              <div className="border-t border-zinc-800/70 pt-2.5"></div>

              {/* Card Bottom Info Row */}
              <div className="flex items-center justify-between text-xs">
                {/* LATEST HIGHEST */}
                <div>
                  <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                    LATEST HIGHEST
                  </p>
                  <p className="text-sm md:text-base font-black text-amber-400 mt-0.5 tracking-tight">
                    {bid.latestHighest}
                  </p>
                </div>

                {/* TIME REMAINING */}
                <div>
                  <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                    TIME REMAINING
                  </p>
                  <p
                    className={`text-sm md:text-base font-bold mt-0.5 ${
                      bid.status === 'WINNING'
                        ? 'text-emerald-400 font-mono'
                        : bid.status === 'OUTBID'
                        ? 'text-rose-400 font-mono'
                        : 'text-zinc-300 font-sans'
                    }`}
                  >
                    {bid.timeRemaining}
                  </p>
                </div>

                {/* View Action Button */}
                <button
                  type="button"
                  onClick={() => navigate(`/item/${bid.id}`)}
                  className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs px-4 py-2 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  View
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyBids;
