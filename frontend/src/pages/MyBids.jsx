import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import { ArrowLeft, Trophy, Clock, Package } from 'lucide-react';
import { optimizeImageUrl } from '../utils/imageOptimizer';

const formatActiveRemaining = (distance) => {
  if (distance <= 0) return 'Ended';
  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);
  const pad = (n) => (n < 10 ? '0' + n : n);
  return `${days}d : ${pad(hours)}h : ${pad(minutes)}m : ${pad(seconds)}s`;
};

const formatEndDate = (dateStr) => {
  if (!dateStr) return 'Ended';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Ended';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const MyBids = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const themeContext = useTheme();
  const isLight =
    themeContext?.theme === 'light' ||
    (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'light');

  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'won' | 'ended'
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
          // Group bids by product item.id
          const groupsMap = new Map();

          res.data.forEach((b) => {
            if (!b.item) return;
            const itemId = b.item.id;
            if (!groupsMap.has(itemId)) {
              groupsMap.set(itemId, {
                itemId: b.item.id,
                item: b.item,
                title: b.item.title,
                image:
                  optimizeImageUrl(b.item.image_url, { width: 200 }) ||
                  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=300',
                basePrice: `${(b.item.base_price ?? 0).toLocaleString()} Birr`,
                endTime: b.item.end_time,
                winnerId: b.item.winner_id,
                itemStatus: b.item.status,
                latestBidTime: new Date(b.created_at || 0).getTime(),
                bids: [],
              });
            }

            const group = groupsMap.get(itemId);
            group.bids.push({
              id: b.id,
              amount: b.amount,
              createdAt: b.created_at,
            });
            if (new Date(b.created_at || 0).getTime() > group.latestBidTime) {
              group.latestBidTime = new Date(b.created_at || 0).getTime();
            }
          });

          // Format grouped items
          const groupedList = Array.from(groupsMap.values()).map((g) => {
            const isWon = g.winnerId === user.id;
            const isEnded = g.itemStatus === 'closed' || (g.endTime && new Date(g.endTime) <= new Date());

            let status = 'ACTIVE';
            if (isWon) {
              status = 'WINNER';
            } else if (isEnded) {
              status = 'ENDED';
            } else {
              status = 'ACTIVE';
            }

            const now = new Date().getTime();
            const end = g.endTime ? new Date(g.endTime).getTime() : 0;
            const distance = end - now;

            const timeStr = formatActiveRemaining(distance);
            const endDateStr = formatEndDate(g.endTime);

            // Sort individual bids by amount ascending
            const sortedBids = [...g.bids].sort((a, b) => a.amount - b.amount);

            return {
              id: `item-${g.itemId}`,
              itemId: g.itemId,
              title: g.title,
              basePrice: g.basePrice,
              status,
              timeRemaining: timeStr,
              endDateFormatted: endDateStr,
              bidStatus: isWon ? 'won' : isEnded ? 'ended' : 'active',
              image: g.image,
              bids: sortedBids,
              totalBidsCount: sortedBids.length,
              latestBidTime: g.latestBidTime,
              endTime: g.endTime,
            };
          });

          // Sort by latest activity (most recently placed bids first)
          groupedList.sort((a, b) => b.latestBidTime - a.latestBidTime);

          setBids(groupedList);
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

  // Live ticker for active countdowns
  useEffect(() => {
    const timer = setInterval(() => {
      setBids((prev) =>
        prev.map((g) => {
          if (!g.endTime || g.bidStatus !== 'active') return g;
          const distance = new Date(g.endTime).getTime() - Date.now();
          if (distance <= 0) {
            return {
              ...g,
              timeRemaining: 'Ended',
              endDateFormatted: formatEndDate(g.endTime),
              status: g.bidStatus === 'won' ? 'WINNER' : 'ENDED',
              bidStatus: g.bidStatus === 'won' ? 'won' : 'ended',
            };
          }
          return {
            ...g,
            timeRemaining: formatActiveRemaining(distance),
          };
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter logic (status filter only)
  const filteredBids = bids.filter((bid) => {
    if (statusFilter === 'all') return true;
    return bid.bidStatus === statusFilter;
  });

  // Calculate counts for filter pills
  const totalCount = bids.length;
  const activeCount = bids.filter((b) => b.bidStatus === 'active').length;
  const wonCount = bids.filter((b) => b.bidStatus === 'won').length;
  const endedCount = bids.filter((b) => b.bidStatus === 'ended').length;

  return (
    <div
      className={`w-full pb-8 sm:pb-12 pt-1 sm:pt-2 px-0 sm:px-1 max-w-lg mx-auto font-sans antialiased transition-colors min-w-0 ${
        isLight ? 'bg-[#F8F9FA] text-zinc-900' : 'bg-[#0A0B0E] text-slate-100'
      }`}
    >
      {/* Header with Back Button */}
      <div className="flex items-center gap-2.5 sm:gap-3 mb-5">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md shrink-0 border ${
            isLight
              ? 'bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              : 'bg-[#141519] border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800'
          }`}
          aria-label="Go Back"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <h1
            className={`text-xl sm:text-2xl font-black tracking-tight truncate ${
              isLight ? 'text-zinc-900' : 'text-white'
            }`}
          >
            My Bids
          </h1>
          
        </div>
      </div>

      {/* Status Filter Pills (All, Active, Won, Ended) */}
      <div className="flex items-center gap-1.5 sm:gap-2 mb-5 overflow-x-auto pb-1.5 scrollbar-none w-full">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          style={
            statusFilter === 'all'
              ? {
                  background: 'linear-gradient(100deg, #ea580c, #f97316 45%, #fb923c 75%, #f59e0b)',
                  color: '#ffffff',
                  boxShadow: '0 4px 14px rgba(249, 115, 22, 0.3)',
                }
              : undefined
          }
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer border ${
            statusFilter === 'all'
              ? 'border-transparent'
              : isLight
              ? 'bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900'
              : 'bg-[#141519] border-zinc-800 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          All ({totalCount})
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('active')}
          style={
            statusFilter === 'active'
              ? {
                  background: 'linear-gradient(100deg, #ea580c, #f97316 45%, #fb923c 75%, #f59e0b)',
                  color: '#ffffff',
                  boxShadow: '0 4px 14px rgba(249, 115, 22, 0.3)',
                }
              : undefined
          }
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer border ${
            statusFilter === 'active'
              ? 'border-transparent'
              : isLight
              ? 'bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900'
              : 'bg-[#141519] border-zinc-800 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Active ({activeCount})
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('won')}
          style={
            statusFilter === 'won'
              ? {
                  background: 'linear-gradient(100deg, #ea580c, #f97316 45%, #fb923c 75%, #f59e0b)',
                  color: '#ffffff',
                  boxShadow: '0 4px 14px rgba(249, 115, 22, 0.3)',
                }
              : undefined
          }
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer border ${
            statusFilter === 'won'
              ? 'border-transparent'
              : isLight
              ? 'bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900'
              : 'bg-[#141519] border-zinc-800 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Won ({wonCount})
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('ended')}
          style={
            statusFilter === 'ended'
              ? {
                  background: 'linear-gradient(100deg, #ea580c, #f97316 45%, #fb923c 75%, #f59e0b)',
                  color: '#ffffff',
                  boxShadow: '0 4px 14px rgba(249, 115, 22, 0.3)',
                }
              : undefined
          }
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer border ${
            statusFilter === 'ended'
              ? 'border-transparent'
              : isLight
              ? 'bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900'
              : 'bg-[#141519] border-zinc-800 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Ended ({endedCount})
        </button>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-3.5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`rounded-2xl p-4 border animate-pulse ${
                isLight ? 'bg-white border-zinc-200' : 'bg-[#141519] border-zinc-800'
              }`}
            >
              <div className="flex gap-3">
                <div
                  className={`w-14 h-14 rounded-xl ${isLight ? 'bg-zinc-200' : 'bg-zinc-800'}`}
                />
                <div className="flex-1 space-y-2">
                  <div
                    className={`h-4 w-3/4 rounded ${isLight ? 'bg-zinc-200' : 'bg-zinc-800'}`}
                  />
                  <div
                    className={`h-3 w-1/2 rounded ${isLight ? 'bg-zinc-200' : 'bg-zinc-800'}`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Bids List */
        <div className="space-y-3.5">
          {filteredBids.length === 0 ? (
            <div
              className={`border rounded-2xl p-8 text-center space-y-3 my-4 ${
                isLight
                  ? 'bg-white border-zinc-200 text-zinc-500 shadow-sm'
                  : 'bg-[#141519] border-zinc-800/80 text-zinc-400'
              }`}
            >
              <Trophy className="mx-auto text-orange-500" size={38} />
              <p
                className={`text-sm font-bold ${
                  isLight ? 'text-zinc-800' : 'text-zinc-200'
                }`}
              >
                No {statusFilter !== 'all' ? statusFilter : ''} bids found
              </p>
              <p className="text-xs text-zinc-500">
                Explore active auctions and place your secret lowest unique bid!
              </p>
              <Link
                to="/"
                style={{
                  background: 'linear-gradient(100deg, #ea580c, #f97316 45%, #fb923c 75%, #f59e0b)',
                  color: '#ffffff',
                  boxShadow: '0 4px 14px rgba(249, 115, 22, 0.35)',
                }}
                className="inline-block font-black text-xs px-5 py-2.5 rounded-xl transition-all hover:brightness-110 active:scale-95 shadow-md mt-2 uppercase tracking-wider"
              >
                Explore Auctions
              </Link>
            </div>
          ) : (
            filteredBids.map((itemGroup) => (
              <div
                key={itemGroup.id}
                className={`border rounded-2xl p-4 shadow-lg space-y-3 transition-all hover:border-orange-500/30 ${
                  isLight
                    ? 'bg-white border-zinc-200 text-zinc-900 shadow-zinc-200/50'
                    : 'bg-[#141519] border-zinc-800 text-white'
                }`}
              >
                {/* Card Header Top Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={itemGroup.image}
                      alt={itemGroup.title}
                      loading="lazy"
                      decoding="async"
                      className={`w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-xl border shrink-0 ${
                        isLight
                          ? 'border-zinc-200 bg-zinc-100'
                          : 'border-zinc-800 bg-zinc-900'
                      }`}
                    />
                    <div className="min-w-0">
                      <h3
                        className={`font-bold text-sm sm:text-base leading-tight truncate ${
                          isLight ? 'text-zinc-900' : 'text-white'
                        }`}
                      >
                        {itemGroup.title}
                      </h3>
                      
                      {/* Bids Count Badge */}
                      <div className="mt-1 flex items-center gap-2">
                        <span
                          className={`inline-flex items-center text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                            itemGroup.totalBidsCount > 1
                              ? isLight
                                ? 'bg-zinc-100 border-zinc-200 text-zinc-600'
                              : 'bg-zinc-800/80 border-zinc-700 text-zinc-400'
                              : isLight
                              ? 'bg-zinc-100 border-zinc-200 text-zinc-600'
                              : 'bg-zinc-800/80 border-zinc-700 text-zinc-400'
                          }`}
                        >
                          {itemGroup.totalBidsCount} {itemGroup.totalBidsCount === 1 ? 'Bid Placed' : 'Bids Placed'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge: WINNER, ACTIVE, or ENDED */}
                  <div className="shrink-0">
                    {itemGroup.status === 'WINNER' ? (
                      <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-[10px] font-black tracking-wider px-2.5 py-1 rounded-lg uppercase shadow-xs">
                        WINNER 🎉
                      </span>
                    ) : itemGroup.status === 'ACTIVE' ? (
                      <span
                        className={`text-[10px] font-black tracking-wider px-2.5 py-1 rounded-lg uppercase border ${
                          isLight
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                            : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                        }`}
                      >
                        ACTIVE
                      </span>
                    ) : (
                      <span
                        className={`text-[10px] font-black tracking-wider px-2.5 py-1 rounded-lg uppercase border ${
                          isLight
                            ? 'bg-red-50 border-red-200 text-red-600'
                            : 'bg-red-500/15 border-red-500/30 text-red-400'
                        }`}
                      >
                        ENDED
                      </span>
                    )}
                  </div>
                </div>

                {/* Placed Bids Amounts Section */}
                <div
                  className={`rounded-xl p-2.5 border ${
                    isLight
                      ? 'bg-zinc-50/70 border-zinc-200/80'
                      : 'bg-[#0f1013] border-zinc-800/60'
                  }`}
                >
                  <p
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      isLight ? 'text-zinc-500' : 'text-zinc-400'
                    }`}
                  >
                    {itemGroup.totalBidsCount === 1
                      ? 'Your Bid Amount:'
                      : `Your Bid Amounts (${itemGroup.totalBidsCount}):`}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {itemGroup.bids.map((b) => (
                      <span
                        key={b.id}
                        className={`font-mono text-xs font-black px-2.5 py-1 rounded-lg border transition-all ${
                          isLight
                            ? 'bg-white border-orange-200 text-orange-600 shadow-2xs'
                            : 'bg-[#18191f] border-orange-500/30 text-orange-400 shadow-2xs'
                        }`}
                      >
                        {parseFloat(b.amount || 0).toFixed(2)} Birr
                      </span>
                    ))}
                  </div>
                </div>

                {/* Divider Line */}
                <div
                  className={`border-t ${
                    isLight ? 'border-zinc-100' : 'border-zinc-800/70'
                  }`}
                />

                {/* Card Bottom Info Row */}
                <div className="flex items-center justify-between text-xs">
                  {/* FEE / BASE PRICE */}
                  <div>
                    <p
                      className={`text-[10px] uppercase font-bold tracking-wider ${
                        isLight ? 'text-zinc-400' : 'text-zinc-500'
                      }`}
                    >
                      Bid Fee
                    </p>
                    <p
                      className={`text-xs sm:text-sm font-black mt-0.5 font-mono ${
                        isLight ? 'text-zinc-800' : 'text-zinc-200'
                      }`}
                    >
                      {itemGroup.basePrice}
                    </p>
                  </div>

                  {/* TIME REMAINING / END DATE */}
                  <div>
                    <p
                      className={`text-[10px] uppercase font-bold tracking-wider ${
                        isLight ? 'text-zinc-400' : 'text-zinc-500'
                      }`}
                    >
                      {itemGroup.bidStatus === 'active' ? 'Time Remaining' : 'End Date'}
                    </p>
                    <p
                      className={`text-xs sm:text-sm font-bold mt-0.5 font-mono ${
                        itemGroup.status === 'WINNER'
                          ? 'text-emerald-500'
                          : itemGroup.bidStatus === 'active'
                          ? isLight
                            ? 'text-emerald-600'
                            : 'text-emerald-400'
                          : isLight
                          ? 'text-red-600'
                          : 'text-red-400'
                      }`}
                    >
                      {itemGroup.bidStatus === 'active' ? itemGroup.timeRemaining : itemGroup.endDateFormatted}
                    </p>
                  </div>

                  {/* View Action Button */}
                  <button
                    type="button"
                    onClick={() => navigate(`/item/${itemGroup.itemId}`)}
                    style={{
                      background: 'linear-gradient(100deg, #ea580c, #f97316 45%, #fb923c 75%, #f59e0b)',
                      color: '#ffffff',
                    }}
                    className="font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer hover:brightness-110"
                  >
                    View
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default MyBids;
