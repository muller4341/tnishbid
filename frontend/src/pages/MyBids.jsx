import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Signal, Wifi, Battery, Clock, ArrowLeft, ArrowRight, Trophy, AlertCircle } from 'lucide-react';

const MyBids = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [poolType, setPoolType] = useState('lub'); // 'lub' | 'open'
  const [statusFilter, setStatusFilter] = useState('active'); // 'active' | 'won' | 'ended'
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserBids = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await axios.get('/api/bids/my-bids');
        if (res.data && Array.isArray(res.data)) {
          // Transform backend bids strictly for this user
          const formatted = res.data.map(b => {
            const isWon = b.item.winner_id === user.id;
            const isEnded = b.item.status === 'closed' || new Date(b.item.end_time) <= new Date();
            const isLUB = b.item.is_lub || b.item.pool_type === 'lub' || b.item.pool_type === 'premium';
            
            let status = 'PLACED';
            if (isWon) {
              status = 'WINNER';
            } else if (isEnded) {
              status = 'ENDED';
            } else {
              if (isLUB) {
                status = b.is_unique ? 'UNIQUE' : 'DUPLICATED';
              } else {
                const itemBids = b.item.bids || [];
                const maxBid = itemBids.length > 0 ? Math.max(...itemBids.map(x => x.amount)) : b.item.base_price;
                status = b.amount >= maxBid ? 'WINNING' : 'OUTBID';
              }
            }

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

            const itemBids = b.item.bids || [];
            const maxBid = itemBids.length > 0 ? Math.max(...itemBids.map(x => x.amount)) : b.item.base_price;

            return {
              id: b.id,
              itemId: b.item.id,
              title: b.item.title,
              userBid: `${b.amount.toLocaleString()} Birr`,
              latestHighest: `${maxBid.toLocaleString()} Birr`,
              status,
              timeRemaining: timeStr,
              poolType: isLUB ? 'lub' : 'open',
              bidStatus: isWon ? 'won' : (isEnded ? 'ended' : 'active'),
              image: b.item.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=300'
            };
          });

          setBids(formatted);
        } else {
          setBids([]);
        }
      } catch (err) {
        console.error('Failed to fetch user bids:', err);
        setBids([]);
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
      {/* Header with Back Button */}
      <div className="flex items-center gap-3 mb-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-[#141519] border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer shadow-md shrink-0"
          aria-label="Go Back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight font-serif">
          My Bids
        </h1>
      </div>

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
                      Your Bid: <span className="text-amber-400 font-bold">{bid.userBid}</span>
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                <div>
                  {bid.status === 'WINNER' && (
                    <span className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-[10px] font-extrabold tracking-wider px-2.5 py-1 rounded-lg uppercase shadow-sm">
                      WINNER 🎉
                    </span>
                  )}
                  {bid.status === 'WINNING' && (
                    <span className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-[10px] font-extrabold tracking-wider px-2.5 py-1 rounded-lg uppercase shadow-sm">
                      HIGHEST BID
                    </span>
                  )}
                  {bid.status === 'UNIQUE' && (
                    <span className="bg-amber-950/80 border border-amber-500/40 text-amber-400 text-[10px] font-extrabold tracking-wider px-2.5 py-1 rounded-lg uppercase shadow-sm">
                      UNIQUE BID
                    </span>
                  )}
                  {bid.status === 'DUPLICATED' && (
                    <span className="bg-rose-950/80 border border-rose-500/40 text-rose-400 text-[10px] font-extrabold tracking-wider px-2.5 py-1 rounded-lg uppercase shadow-sm">
                      DUPLICATED
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
                    {bid.poolType === 'lub' ? 'BASE PRICE' : 'LATEST HIGHEST'}
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
                      bid.status === 'WINNING' || bid.status === 'WINNER' || bid.status === 'UNIQUE'
                        ? 'text-emerald-400 font-mono'
                        : bid.status === 'OUTBID' || bid.status === 'DUPLICATED'
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
                  onClick={() => navigate(`/item/${bid.itemId}`)}
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



// // Set up this Neon project in the current working directory.

// // 1. `npm i -g neon@latest && neon login`
// // 2. `neon skills -y`
// // 3. `neon mcp -y`
// // 4. `neon link --project-id raspy-waterfall-65438059 --branch production -y`
// // 5. `neon config init`
// // 6. Update `neon.ts`:

// // ```ts
// // import { defineConfig } from "@neon/config/v1";

// // export default defineConfig({});
// // ```

// // 7. `neon deploy`

// postgresql://neondb_owner:npg_CJ2Ed0kNUAXv@ep-tiny-surf-zabwk1cn-pooler.c-2.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require