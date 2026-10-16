import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import { ArrowLeft, Trophy, Clock, Package } from 'lucide-react';
import { optimizeImageUrl } from '../utils/imageOptimizer';

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
          // Transform backend bids strictly for this user without exposing secret status
          const formatted = res.data.map((b) => {
            const isWon = b.item.winner_id === user.id;
            const isEnded = b.item.status === 'closed' || new Date(b.item.end_time) <= new Date();

            let status = 'ACTIVE';
            if (isWon) {
              status = 'WINNER';
            } else if (isEnded) {
              status = 'ENDED';
            } else {
              status = 'ACTIVE';
            }

            const now = new Date().getTime();
            const end = new Date(b.item.end_time).getTime();
            const distance = end - now;

            let timeStr = 'Ended';
            if (distance > 0) {
              const hours = Math.floor(distance / (1000 * 60 * 60));
              const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
              const seconds = Math.floor((distance % (1000 * 60)) / 1000);
              const pad = (n) => (n < 10 ? '0' + n : n);
              timeStr = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
            } else {
              timeStr = new Date(b.item.end_time).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });
            }

            return {
              id: b.id,
              itemId: b.item.id,
              title: b.item.title,
              userBid: `${b.amount.toLocaleString()} Birr`,
              basePrice: `${(b.item.base_price ?? 0).toLocaleString()} Birr`,
              status,
              timeRemaining: timeStr,
              bidStatus: isWon ? 'won' : isEnded ? 'ended' : 'active',
              image:
                optimizeImageUrl(b.item.image_url, { width: 200 }) ||
                'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=300',
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

  // Filter logic (status filter only, open bids tab removed)
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
      className={`min-h-screen pb-28 pt-3 px-3 md:px-6 max-w-lg mx-auto font-sans antialiased transition-colors ${
        isLight ? 'bg-[#F8F9FA] text-zinc-900' : 'bg-[#0A0B0E] text-slate-100'
      }`}
    >
      {/* Header with Back Button */}
      <div className="flex items-center gap-3 mb-5">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md shrink-0 border ${
            isLight
              ? 'bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              : 'bg-[#141519] border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800'
          }`}
          aria-label="Go Back"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1
            className={`text-2xl font-black tracking-tight ${
              isLight ? 'text-zinc-900' : 'text-white'
            }`}
          >
            My Bids
          </h1>
          <p className={`text-xs ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
            Track your bids across all ongoing and past auctions
          </p>
        </div>
      </div>

      {/* Status Filter Pills (All, Active, Won, Ended) */}
      <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1 scrollbar-none">
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
            filteredBids.map((bid) => (
              <div
                key={bid.id}
                className={`border rounded-2xl p-4 shadow-lg space-y-3 transition-all hover:border-orange-500/30 ${
                  isLight
                    ? 'bg-white border-zinc-200 text-zinc-900 shadow-zinc-200/50'
                    : 'bg-[#141519] border-zinc-800 text-white'
                }`}
              >
                {/* Card Header Top Row */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={bid.image}
                      alt={bid.title}
                      loading="lazy"
                      decoding="async"
                      className={`w-14 h-14 object-cover rounded-xl border shrink-0 ${
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
                        {bid.title}
                      </h3>
                      <p
                        className={`text-xs font-medium mt-1 ${
                          isLight ? 'text-zinc-500' : 'text-zinc-400'
                        }`}
                      >
                        Your Bid:{' '}
                        <span
                          className={`font-black font-mono ${
                            isLight ? 'text-orange-600' : 'text-orange-400'
                          }`}
                        >
                          {bid.userBid}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Status Badge: Only WINNER, ACTIVE, or ENDED (never leak UNIQUE or DUPLICATED) */}
                  <div className="shrink-0">
                    {bid.status === 'WINNER' ? (
                      <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-[10px] font-black tracking-wider px-2.5 py-1 rounded-lg uppercase shadow-xs">
                        WINNER 🎉
                      </span>
                    ) : bid.status === 'ACTIVE' ? (
                      <span
                        className={`text-[10px] font-black tracking-wider px-2.5 py-1 rounded-lg uppercase border ${
                          isLight
                            ? 'bg-orange-50 border-orange-200 text-orange-600'
                            : 'bg-orange-500/15 border-orange-500/30 text-orange-400'
                        }`}
                      >
                        ACTIVE
                      </span>
                    ) : (
                      <span
                        className={`text-[10px] font-black tracking-wider px-2.5 py-1 rounded-lg uppercase border ${
                          isLight
                            ? 'bg-zinc-100 border-zinc-200 text-zinc-500'
                            : 'bg-zinc-800/80 border-zinc-700 text-zinc-400'
                        }`}
                      >
                        ENDED
                      </span>
                    )}
                  </div>
                </div>

                {/* Divider Line */}
                <div
                  className={`border-t pt-2.5 ${
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
                      {bid.basePrice}
                    </p>
                  </div>

                  {/* TIME REMAINING */}
                  <div>
                    <p
                      className={`text-[10px] uppercase font-bold tracking-wider ${
                        isLight ? 'text-zinc-400' : 'text-zinc-500'
                      }`}
                    >
                      Time Remaining
                    </p>
                    <p
                      className={`text-xs sm:text-sm font-bold mt-0.5 font-mono ${
                        bid.status === 'WINNER'
                          ? 'text-emerald-500'
                          : bid.status === 'ACTIVE'
                          ? isLight
                            ? 'text-orange-600'
                            : 'text-orange-400'
                          : isLight
                          ? 'text-zinc-500'
                          : 'text-zinc-400'
                      }`}
                    >
                      {bid.timeRemaining}
                    </p>
                  </div>

                  {/* View Action Button */}
                  <button
                    type="button"
                    onClick={() => navigate(`/item/${bid.itemId}`)}
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
