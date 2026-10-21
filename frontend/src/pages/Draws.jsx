import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import {
  ChevronLeft,
  Trophy,
  Clock,
  Calendar,
  X,
  Phone,
  Info,
  ChevronRight,
  Sparkles,
  Ticket,
  Coins,
  Globe,
  Tag,
  CheckCircle2,
  AlertCircle,
  Hash,
  Users,
  User,
  Search
} from 'lucide-react';
import { optimizeImageUrl } from '../utils/imageOptimizer';

/* Translations */
const TRANSLATIONS = {
  en: {
    draws: 'Draws',
    subtitle: 'Winners & next draws',
    pastDraws: 'Past Draws',
    upcoming: 'Upcoming',
    winner: 'WINNER',
    winningBid: 'Winning bid',
    entry: 'Entry',
    announced: 'Announced',
    drawEnded: 'DRAW ENDED',
    lowestUniqueBidWinner: 'WINNER · LOWEST UNIQUE BID AMOUNT',
    bidFee: 'Bid fee',
    totalBids: 'Total bids',
    auction: 'Auction',
    numberBreakdown: 'Number breakdown',
    uniqueAmounts: 'Unique amounts',
    winningAmount: 'Winning amount',
    byAmount: 'By amount',
    mostPicked: 'Most picked',
    showWinningAmount: 'Show winning amount',
    bids: 'bids',
    players: 'players',
    unique: 'Unique',
    notUnique: 'Not unique',
    noPastDraws: 'No concluded draws yet.',
    noUpcomingDraws: 'No upcoming draws at the moment.',
    viewAndBid: 'View & Place Bid',
    loading: 'Loading draws...',
    back: 'Back',
    noWinner: 'No Winner',
    noUniqueBid: 'No unique bid found in this draw'
  },
  am: {
    draws: 'ዕጣዎች',
    subtitle: 'አሸናፊዎችና ቀጣይ ዕጣዎች',
    pastDraws: 'ያለፉ ዕጣዎች',
    upcoming: 'ቀጣይ ዕጣዎች',
    winner: 'አሸናፊ',
    winningBid: 'አሸናፊ ዋጋ',
    entry: 'ኮድ',
    announced: 'የተገለጸበት',
    drawEnded: 'ዕጣው ተጠናቋል',
    lowestUniqueBidWinner: 'አሸናፊ · ዝቅተኛ ልዩ የጨረታ መጠን',
    bidFee: 'የጨረታ ክፍያ',
    totalBids: 'ጠቅላላ ጨረታዎች',
    auction: 'ጨረታ',
    numberBreakdown: 'የቁጥሮች ዝርዝር',
    uniqueAmounts: 'ልዩ መጠኖች',
    winningAmount: 'አሸናፊ መጠን',
    byAmount: 'በመጠን ቅደም ተከተል',
    mostPicked: 'በብዛት የተመረጡ',
    showWinningAmount: 'አሸናፊውን መጠን አሳይ',
    bids: 'ጨረታዎች',
    players: 'ተሳታፊዎች',
    unique: 'ልዩ',
    notUnique: 'የተደገመ',
    noPastDraws: 'እስካሁን የተጠናቀቁ ዕጣዎች የሉም።',
    noUpcomingDraws: 'በአሁኑ ጊዜ ቀጣይ ዕጣዎች የሉም።',
    viewAndBid: 'ይመልከቱና ይጫረቱ',
    loading: 'ዕጣዎችን በመጫን ላይ...',
    back: 'ተመለስ',
    noWinner: 'አሸናፊ የለም',
    noUniqueBid: 'በዚህ ዕጣ ውስጥ ልዩ ጨረታ አልተገኘም'
  }
};

const formatHumanDateTime = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

const cleanText = (str) => {
  if (!str || typeof str !== 'string') return str || '';
  return str.replace(/onebid-?/gi, '').trim();
};

/* Non-stop celebratory confetti falling animation from top to bottom */
const CELEBRATION_COLORS = [
  '#FF0055', '#FF3366', '#FF007F', '#EC4899', '#F43F5E', // Vivid pinks / magentas
  '#FF5722', '#FF7A00', '#F97316', '#FB923C',             // Electric oranges
  '#FFD700', '#FFEA00', '#FACC15', '#F59E0B', '#FBBF24', // Rich golds & sunburst yellows
  '#00F5D4', '#10B981', '#22C55E', '#14B8A6', '#84CC16', // Emeralds, mints & limes
  '#00E5FF', '#38BDF8', '#3B82F6', '#0284C7', '#2563EB', // Electric blues & cyans
  '#8B5CF6', '#A855F7', '#C084FC', '#7928CA', '#9333EA', // Royal purples & violets
  '#E11D48', '#EF4444'                                     // Crimson reds
];

const CelebrationRain = ({ containerClass = "fixed inset-0 pointer-events-none z-20 overflow-hidden", count = 55, durationSeconds = 5 }) => {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!durationSeconds || durationSeconds <= 0) return;

    // Start fading out slightly before 5 seconds
    const fadeTimer = setTimeout(() => {
      setFading(true);
    }, Math.max(500, (durationSeconds - 0.9) * 1000));

    // Completely turn off after 5 seconds
    const removeTimer = setTimeout(() => {
      setVisible(false);
    }, durationSeconds * 1000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [durationSeconds]);

  const pieces = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const size = 6 + (i % 9);
      const isRibbon = i % 5 === 0;
      const isCircle = i % 5 === 1;
      const isStar = i % 5 === 2;
      const isSparkle = i % 5 === 3;
      return {
        id: i,
        left: `${(i * 1.9 + (i % 9) * 2.7) % 98}%`,
        color: CELEBRATION_COLORS[i % CELEBRATION_COLORS.length],
        duration: `${2.8 + (i % 6) * 0.6}s`,
        delay: `-${(i * 0.18).toFixed(2)}s`,
        size,
        isRibbon,
        isCircle,
        isStar,
        isSparkle,
        swayAmount: 14 + (i % 18)
      };
    });
  }, [count]);

  if (!visible) return null;

  return (
    <div
      className={`${containerClass} transition-opacity duration-700 ease-out ${fading ? 'opacity-0' : 'opacity-100'}`}
      aria-hidden="true"
    >
      <style>{`
        @keyframes celebrationFall {
          0% {
            transform: translate3d(0, -32px, 0) rotate(0deg) rotateX(0deg);
            opacity: 1;
          }
          50% {
            opacity: 0.95;
          }
          100% {
            transform: translate3d(var(--sway, 18px), 105vh, 0) rotate(720deg) rotateX(360deg);
            opacity: 0.25;
          }
        }
      `}</style>
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute block will-change-transform"
          style={{
            left: p.left,
            top: '-32px',
            backgroundColor: p.isStar || p.isSparkle ? 'transparent' : p.color,
            width: p.isRibbon ? `${Math.max(3.5, p.size * 0.45)}px` : `${p.size}px`,
            height: p.isRibbon ? `${p.size * 2.4}px` : `${p.size}px`,
            borderRadius: p.isCircle ? '50%' : '2px',
            boxShadow: p.isStar || p.isSparkle ? 'none' : `0 0 7px ${p.color}66`,
            animation: `celebrationFall ${p.duration} linear infinite`,
            animationDelay: p.delay,
            '--sway': `${(p.id % 2 === 0 ? 1 : -1) * p.swayAmount}px`
          }}
        >
          {(p.isStar || p.isSparkle) && (
            <span
              style={{
                color: p.color,
                fontSize: `${p.size + (p.isSparkle ? 5 : 3)}px`,
                lineHeight: 1,
                display: 'block',
                textShadow: `0 0 10px ${p.color}`
              }}
            >
              {p.isSparkle ? '✦' : '★'}
            </span>
          )}
        </span>
      ))}
    </div>
  );
};

const Draws = () => {
  const navigate = useNavigate();
  const { lang, setLang } = useLanguage();
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const themeContext = useTheme();
  const isLight =
    themeContext?.theme === 'light' ||
    (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'light');

  const [activeTab, setActiveTab] = useState('past'); // 'past' | 'upcoming'
  const [pastDraws, setPastDraws] = useState([]);
  const [upcomingDraws, setUpcomingDraws] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal Sheet states
  const [selectedDrawId, setSelectedDrawId] = useState(null);
  const [drawDetails, setDrawDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [sortBreakdownBy, setSortBreakdownBy] = useState('amount'); // 'amount' | 'most_picked'
  const [selectedAmountData, setSelectedAmountData] = useState(null);
  const [isWinningHighlighted, setIsWinningHighlighted] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const winningRowRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3200);
  };

  // Fetch Draws
  useEffect(() => {
    const fetchDraws = async () => {
      setLoading(true);
      try {
        const res = await axios.get('/api/draws');
        setPastDraws(res.data.pastDraws || []);
        setUpcomingDraws(res.data.upcomingDraws || []);
      } catch (err) {
        console.error('Failed to load draws:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDraws();
  }, []);

  // Fetch single draw details when opened
  useEffect(() => {
    if (!selectedDrawId) {
      setDrawDetails(null);
      setSelectedAmountData(null);
      setIsWinningHighlighted(false);
      return;
    }

    const fetchDetails = async () => {
      setLoadingDetails(true);
      try {
        const res = await axios.get(`/api/draws/${selectedDrawId}`);
        setDrawDetails(res.data);
      } catch (err) {
        console.error('Failed to load draw details:', err);
      } finally {
        setLoadingDetails(false);
      }
    };
    fetchDetails();
  }, [selectedDrawId]);

  // Processed Amount Breakdown based on sort
  const sortedAmountBreakdown = useMemo(() => {
    if (!drawDetails?.amountBreakdown) return [];
    const list = [...drawDetails.amountBreakdown];
    if (sortBreakdownBy === 'most_picked') {
      // Most repeated bids to the lowest
      list.sort((a, b) => Number(b.bidsCount) - Number(a.bidsCount) || Number(a.amount) - Number(b.amount));
    } else {
      // Lowest to highest bid order
      list.sort((a, b) => Number(a.amount) - Number(b.amount));
    }
    return list;
  }, [drawDetails?.amountBreakdown, sortBreakdownBy]);

  const handleScrollToWinningAmount = () => {
    const hasWinner = Boolean(drawDetails?.winner && drawDetails?.amountBreakdown?.some((r) => r.isWinning));
    if (!hasWinner) {
      showToast(t.noUniqueBid || 'No winner (No unique bid found in this draw)');
      return;
    }

    if (winningRowRef.current) {
      winningRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setIsWinningHighlighted(true);
      setTimeout(() => setIsWinningHighlighted(false), 2400);
    } else {
      setSortBreakdownBy('amount');
      setTimeout(() => {
        if (winningRowRef.current) {
          winningRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setIsWinningHighlighted(true);
          setTimeout(() => setIsWinningHighlighted(false), 2400);
        }
      }, 100);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto pb-20 min-w-0 relative">
      {/* Congratulations / Celebratory Falling Animation (Stops after 5 seconds) */}
      {activeTab === 'past' && <CelebrationRain key="past-celebration" durationSeconds={5} />}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[150] px-4 py-2.5 rounded-2xl bg-zinc-900/95 text-amber-400 border border-amber-500/40 shadow-2xl backdrop-blur-md flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top duration-300 pointer-events-none">
          <Info size={16} className="text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Centered */}
      <div className="relative flex items-center justify-center mb-4 pt-1">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className={`absolute left-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors ${isLight
            ? 'bg-white hover:bg-zinc-100 text-zinc-700 shadow-sm border border-zinc-200'
            : 'bg-[#16171E] hover:bg-[#20222B] text-zinc-300 border border-zinc-800'
            }`}
          aria-label={t.back}
        >
          <ChevronLeft size={18} />
        </button>

        <div className="text-center">
          <h1 className={`text-lg font-black tracking-tight ${isLight ? 'text-zinc-900' : 'text-white'}`}>{t.draws}</h1>
          <p className="text-[11px] font-medium text-zinc-400">{t.subtitle}</p>
        </div>
      </div>

      {/* Segmented Tab Switcher matching Screenshot 1 */}
      <div
        className={`p-1 rounded-2xl flex items-center mb-5 border ${isLight
          ? 'bg-zinc-200/80 border-zinc-300/80'
          : 'bg-[#121318] border-zinc-800/90'
          }`}
      >
        <button
          type="button"
          onClick={() => setActiveTab('past')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 ${activeTab === 'past'
            ? isLight
              ? 'bg-white text-zinc-900 shadow-md'
              : 'bg-[#1C1E26] text-amber-300 shadow-md shadow-black/40 border border-amber-500/30'
            : 'text-zinc-400 hover:text-white'
            }`}
        >
          <Trophy size={14} className={activeTab === 'past' ? 'text-amber-400' : 'text-zinc-500'} />
          <span>{t.pastDraws}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('upcoming')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 ${activeTab === 'upcoming'
            ? isLight
              ? 'bg-white text-zinc-900 shadow-md'
              : 'bg-[#1C1E26] text-amber-300 shadow-md shadow-black/40 border border-amber-500/30'
            : 'text-zinc-400 hover:text-white'
            }`}
        >
          <Clock size={14} className={activeTab === 'upcoming' ? 'text-amber-400' : 'text-zinc-500'} />
          <span>{t.upcoming}</span>
        </button>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-amber-500 border-t-transparent" />
          <p className="text-xs font-bold text-zinc-500 animate-pulse">{t.loading}</p>
        </div>
      ) : activeTab === 'past' ? (
        /* PAST DRAWS LIST matching Screenshot 1 */
        pastDraws.length === 0 ? (
          <div className="text-center py-16 text-zinc-500 text-xs font-bold">
            {t.noPastDraws}
          </div>
        ) : (
          <div className="space-y-4">
            {pastDraws.map((draw) => (
              <div
                key={draw.id}
                onClick={() => setSelectedDrawId(draw.id)}
                className={`group rounded-3xl overflow-hidden border transition-all duration-200 cursor-pointer active:scale-[0.99] shadow-xl ${isLight
                  ? 'bg-white border-zinc-200/90 hover:border-amber-400 shadow-zinc-900/5'
                  : 'bg-[#141519] border-zinc-800/90 hover:border-amber-500/60 shadow-black/50 hover:shadow-[0_8px_30px_rgba(245,158,11,0.15)]'
                  }`}
              >
                {/* Image Banner with Badges */}
                <div className="relative h-48 sm:h-56 w-full bg-zinc-900 overflow-hidden">
                  {draw.image_url ? (
                    <img
                      src={optimizeImageUrl(draw.image_url, { width: 600 })}
                      alt={draw.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-700">
                      <Tag size={48} className="opacity-30" />
                    </div>
                  )}

                  {/* Gradient overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                  {/* Badge top-left */}
                  {draw.has_winner !== false && draw.winner ? (
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500 text-black font-black text-[11px] shadow-lg tracking-wide uppercase">
                      <Trophy size={13} className="fill-black" />
                      <span>{t.winner}</span>
                    </div>
                  ) : (
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-800/90 text-zinc-300 font-bold text-[11px] shadow-lg tracking-wide border border-zinc-700/60 uppercase">
                      <AlertCircle size={13} className="text-zinc-400" />
                      <span>{t.noWinner}</span>
                    </div>
                  )}
                </div>

                {/* Card Details */}
                <div className="p-4 space-y-3">
                  <h2
                    className={`text-base sm:text-lg font-black leading-snug line-clamp-1 transition-colors ${isLight
                        ? 'text-zinc-900 group-hover:text-amber-600'
                        : 'text-white group-hover:text-amber-400'
                      }`}
                  >
                    {draw.title}
                  </h2>

                  {/* Winner Spotlight Card */}
                  {draw.has_winner !== false && draw.winner ? (
                    <div
                      className={`rounded-2xl p-3 sm:p-3.5 border flex items-center gap-3.5 transition-all ${isLight
                          ? 'bg-gradient-to-r from-amber-50/90 via-amber-50/50 to-white border-amber-300/80 shadow-xs'
                          : 'bg-gradient-to-r from-[#14151D] via-[#101117] to-[#0D0E12] border-amber-500/40 shadow-lg shadow-black/40'
                        }`}
                    >
                      {/* Golden Circle with Winning Bid text, Amount, and Birr */}
                      <div className="w-12 h-12 sm:w-18 sm:h-18 rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 text-black flex flex-col items-center justify-center font-black shadow-lg shadow-amber-500/30 shrink-0 text-center p-1 select-none">
                        <span className="text-xs sm:text-sm font-black font-mono leading-tight my-0.5">
                          {Number(draw.winning_amount || 0).toFixed(2)}
                        </span>
                        <span className="text-[8px] sm:text-[9px] font-black uppercase leading-none">
                          Birr
                        </span>
                      </div>

                      <div className="min-w-0 flex-1 space-y-1.5">
                        {draw.winner?.name && draw.winner.name !== 'Winner Announced' && draw.winner.name !== draw.winner.masked_phone && (
                          <p className={`text-xs sm:text-sm font-bold flex items-center gap-1.5 truncate ${isLight ? 'text-zinc-700' : 'text-zinc-200'}`}>
                            <User size={13} className="text-amber-400 shrink-0" />
                            <span className="truncate">{draw.winner.name}</span>
                          </p>
                        )}
                        <p className={`text-xs sm:text-sm font-black flex items-center gap-1.5 font-mono ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                          <Phone size={13} className="text-amber-400 shrink-0" />
                          <span>{draw.winner?.masked_phone || 'Winner'}</span>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`rounded-2xl p-3 sm:p-3.5 border flex items-center gap-3 transition-all ${isLight
                          ? 'bg-zinc-50 border-zinc-200'
                          : 'bg-[#101116] border-zinc-800'
                        }`}
                    >
                      <div className="w-11 h-11 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center shrink-0 border border-zinc-700">
                        <AlertCircle size={20} className="text-zinc-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-black ${isLight ? 'text-zinc-800' : 'text-zinc-200'}`}>
                          {t.noWinner}
                        </p>
                        <p className={`text-[11px] truncate ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                          {t.noUniqueBid}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className={`flex items-center gap-1.5 text-[11px] font-medium pt-0.5 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    <Calendar size={12} className="text-zinc-500 shrink-0" />
                    <span>
                      {t.announced} {formatHumanDateTime(draw.announced_at)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* UPCOMING DRAWS LIST */
        upcomingDraws.length === 0 ? (
          <div className="text-center py-16 text-zinc-500 text-xs font-bold">
            {t.noUpcomingDraws}
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingDraws.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/item/${item.id}`)}
                className={`group rounded-3xl overflow-hidden border transition-all duration-200 cursor-pointer active:scale-[0.99] shadow-xl ${isLight
                  ? 'bg-white border-zinc-200/90 hover:border-amber-400'
                  : 'bg-[#141519] border-zinc-800/90 hover:border-amber-500/60'
                  }`}
              >
                <div className="relative h-44 sm:h-52 w-full bg-zinc-900 overflow-hidden">
                  {item.image_url ? (
                    <img
                      src={optimizeImageUrl(item.image_url, { width: 600 })}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-700">
                      <Tag size={48} className="opacity-30" />
                    </div>
                  )}

                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/80 backdrop-blur-md text-green-500 font-black text-[10px] uppercase">
                    <Clock size={12} />
                    <span>Live </span>
                  </div>

                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-white text-xs font-bold">

                    <span>Bid fee: {(item.base_price || 0).toFixed(2)} Br</span>
                  </div>
                </div>

                <div className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm sm:text-base font-black text-white truncate">
                      {item.title}
                    </h2>
                    <p className="text-[11px] text-zinc-400 mt-0.5 font-medium">
                      {item.total_bids} bids placed so far
                    </p>
                  </div>
                  <span className="shrink-0 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black px-3.5 py-2 rounded-xl transition-all">
                    {t.viewAndBid}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* SCREENSHOT 2: DRAW DETAILS BOTTOM SHEET */}
      {selectedDrawId && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 pb-[calc(3.75rem+env(safe-area-inset-bottom,0px))] sm:pb-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedDrawId(null);
          }}
        >
          <div
            className={`w-full max-w-lg h-[75vh] max-h-[80vh] rounded-t-[2rem] rounded-b-none sm:rounded-[2rem] overflow-hidden flex flex-col border border-b-0 sm:border-b transition-all animate-in slide-in-from-bottom-6 duration-200 relative shadow-2xl ${isLight
              ? 'bg-white border-zinc-200 text-zinc-900 shadow-2xl'
              : 'bg-[#14151B] border-zinc-800/90 text-white shadow-2xl shadow-black/95'
              }`}
          >
            {/* Celebration Confetti falling inside Bottom Sheet (Stops after 5 seconds) */}
            <CelebrationRain key={`sheet-rain-${selectedDrawId}`} containerClass="absolute inset-0 pointer-events-none z-30 overflow-hidden" count={45} durationSeconds={5} />
            {/* Sheet Header with Close & "DRAW ENDED" badge */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800/60 shrink-0">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider">
                <Trophy size={12} className="text-amber-400" />
                <span>{t.drawEnded}</span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDrawId(null)}
                className="w-8 h-8 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Vertically Scrollable Content with guaranteed min-h-0 and clearance */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 pb-12 space-y-4 overscroll-contain touch-pan-y">
              {loadingDetails || !drawDetails ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-amber-500 border-t-transparent" />
                  <p className="text-xs font-bold text-zinc-400">{t.loading}</p>
                </div>
              ) : (
                <>
                  {/* Product Image */}
                  <div className="rounded-2xl overflow-hidden h-44 sm:h-52 w-full bg-zinc-900 relative">
                    {drawDetails.item.image_url ? (
                      <img
                        src={optimizeImageUrl(drawDetails.item.image_url, { width: 600 })}
                        alt={drawDetails.item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-700">
                        <Tag size={48} className="opacity-30" />
                      </div>
                    )}
                  </div>

                  {/* Product Title & Date matching Screenshot 2 */}
                  <div className="text-center space-y-1">
                    <h2 className="text-lg sm:text-xl font-black text-white leading-snug">
                      {drawDetails.item.title}
                    </h2>
                    <p className="text-xs text-zinc-400 flex items-center justify-center gap-1.5 font-medium">
                      <Calendar size={13} className="text-zinc-500" />
                      <span>{t.announced} {formatHumanDateTime(drawDetails.item.announced_at)}</span>
                    </p>
                  </div>

                  {/* Winner Spotlight Card matching Screenshot 2 */}
                  {drawDetails.winner ? (
                    <div
                      className={`rounded-2xl p-4 border flex items-center gap-3.5 transition-all ${isLight
                          ? 'bg-gradient-to-r from-amber-50/90 via-amber-50/50 to-white border-amber-300/80 shadow-xs'
                          : 'bg-[#0E0F14] border-amber-500/40 shadow-lg shadow-amber-500/10'
                        }`}
                    >
                      {/* Golden Circle with Winning Bid text, Amount, and Birr */}
                      <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 text-black flex flex-col items-center justify-center font-black shadow-lg shadow-amber-500/30 shrink-0 text-center p-1 select-none">
                        <span className="text-xs sm:text-sm font-black font-mono leading-tight my-0.5">
                          {Number(drawDetails.winner.winning_amount || 0).toFixed(2)}
                        </span>
                        <span className="text-[8px] sm:text-[9px] font-black uppercase leading-none">
                          Birr
                        </span>
                      </div>

                      <div className="min-w-0 flex-1 space-y-1.5">
                        {drawDetails.winner.name && drawDetails.winner.name !== 'Winner' && (
                          <p className={`text-xs sm:text-sm font-bold flex items-center gap-1.5 truncate ${isLight ? 'text-zinc-700' : 'text-zinc-200'}`}>
                            <User size={13} className="text-amber-400 shrink-0" />
                            <span className="truncate">{drawDetails.winner.name}</span>
                          </p>
                        )}
                        <p className={`text-xs sm:text-sm font-black flex items-center gap-1.5 font-mono ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                          <Phone size={13} className="text-amber-400 shrink-0" />
                          <span>{drawDetails.winner.masked_phone}</span>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`rounded-2xl p-4 border flex items-center gap-3.5 transition-all ${isLight
                          ? 'bg-zinc-100 border-zinc-200'
                          : 'bg-[#101116] border-zinc-800'
                        }`}
                    >
                      <div className="w-14 h-14 rounded-full bg-zinc-800 text-zinc-400 flex flex-col items-center justify-center font-black shrink-0 text-center p-1 border border-zinc-700">
                        <AlertCircle size={22} className="text-zinc-400" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className={`text-sm font-black ${isLight ? 'text-zinc-800' : 'text-zinc-200'}`}>
                          {t.noWinner}
                        </p>
                        <p className={`text-xs ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                          {t.noUniqueBid}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 3 Stat Pills matching Screenshot 2 */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-[#161720] border border-zinc-800/80 rounded-xl p-2.5 space-y-0.5">
                      <p className="text-[10px] text-zinc-400 font-medium">{t.bidFee}</p>
                      <p className="text-xs sm:text-sm font-black text-amber-400 truncate">{drawDetails.stats.bidFee}</p>
                    </div>

                    <div className="bg-[#161720] border border-zinc-800/80 rounded-xl p-2.5 space-y-0.5">
                      <p className="text-[10px] text-zinc-400 font-medium">{t.totalBids}</p>
                      <p className="text-xs sm:text-sm font-black text-white truncate">{drawDetails.stats.totalBids}</p>
                    </div>

                    <div className="bg-[#161720] border border-zinc-800/80 rounded-xl p-2.5 space-y-0.5">
                      <p className="text-[10px] text-zinc-400 font-medium">{t.uniqueAmounts}</p>
                      <p className="text-xs sm:text-sm font-black text-white truncate"> {drawDetails.stats.uniqueAmountsCount} </p>
                    </div>
                  </div>

                  {/* Number breakdown Section matching Screenshot 2 */}
                  <div className="space-y-3 pt-2">
                    
                    {/* Filter Segmented Control & Show Winning Amount Link */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div
                        className={`flex items-center rounded-xl p-0.5 border shrink-0 transition-all ${
                          isLight ? 'bg-zinc-100 border-zinc-200' : 'bg-[#101116] border-zinc-800/90'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setSortBreakdownBy('amount')}
                          className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                            sortBreakdownBy === 'amount'
                              ? isLight
                                ? 'bg-white text-zinc-900 shadow-xs border border-zinc-200/80'
                                : 'bg-[#1C1E28] text-white shadow-xs border border-zinc-700/60'
                              : isLight
                                ? 'text-zinc-500 hover:text-zinc-900'
                                : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          {t.byAmount}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSortBreakdownBy('most_picked')}
                          className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                            sortBreakdownBy === 'most_picked'
                              ? isLight
                                ? 'bg-white text-zinc-900 shadow-xs border border-zinc-200/80'
                                : 'bg-[#1C1E28] text-white shadow-xs border border-zinc-700/60'
                              : isLight
                                ? 'text-zinc-500 hover:text-zinc-900'
                                : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          {t.mostPicked}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleScrollToWinningAmount}
                        className={`ml-auto shrink-0 inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold active:scale-95 border transition-all shadow-xs whitespace-nowrap ${
                          drawDetails.winner
                            ? 'text-amber-500 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30'
                            : 'text-zinc-400 bg-zinc-800/40 hover:bg-zinc-800/70 border-zinc-700/50'
                        }`}
                      >
                        <Trophy size={12} className="shrink-0" />
                        <span>{t.showWinningAmount}</span>
                      </button>
                    </div>

                    {/* Amount Rows with Horizontal Bar Fill matching Screenshot 2 */}
                    <div className="space-y-2 pt-1">
                      {sortedAmountBreakdown.map((row) => {
                        const percent = drawDetails.stats.maxBidsPerAmount > 0
                          ? Math.max(10, Math.min(100, (row.bidsCount / drawDetails.stats.maxBidsPerAmount) * 100))
                          : 20;

                        return (
                          <div
                            key={row.amount}
                            ref={row.isWinning ? winningRowRef : null}
                            onClick={() => setSelectedAmountData(row)}
                            className={`relative rounded-xl p-3 flex items-center justify-between cursor-pointer border transition-all duration-300 active:scale-[0.99] overflow-hidden ${
                              row.isWinning
                                ? isWinningHighlighted
                                  ? 'bg-amber-500/25 border-amber-400 ring-2 ring-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.4)] scale-[1.01]'
                                  : 'bg-amber-500/10 border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                                : isLight
                                  ? 'bg-zinc-50 border-zinc-200 hover:border-zinc-300'
                                  : 'bg-[#161720] border-zinc-800/80 hover:border-zinc-700'
                            }`}
                          >
                            {/* Horizontal visual progress fill */}
                            <div
                              className={`absolute top-0 bottom-0 left-0 transition-all pointer-events-none rounded-xl ${
                                row.isWinning
                                  ? 'bg-amber-500/25'
                                  : isLight
                                    ? 'bg-zinc-200/60'
                                    : 'bg-zinc-800/50'
                              }`}
                              style={{ width: `${percent}%` }}
                            />

                            {/* Left label: e.g. 0.01 ETB */}
                            <div className="relative z-10 flex items-center gap-2">
                              <span
                                className={`text-xs font-extrabold font-mono ${
                                  isLight ? 'text-zinc-900' : 'text-white'
                                }`}
                              >
                                {row.amountFormatted}
                              </span>
                              {row.isWinning && (
                                <span className="bg-amber-400 text-black text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-xs">
                                  WINNER
                                </span>
                              )}
                            </div>

                            {/* Right label: e.g. 28 bids > */}
                            <div
                              className={`relative z-10 flex items-center gap-1.5 text-xs font-bold ${
                                isLight ? 'text-zinc-600' : 'text-zinc-300'
                              }`}
                            >
                              <span>
                                {row.bidsCount} {t.bids}
                              </span>
                              <ChevronRight size={14} className="text-zinc-500" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SCREENSHOT 3: SPECIFIC BID AMOUNT CENTERED POPUP MODAL */}
      {selectedAmountData && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedAmountData(null);
          }}
        >
          <div
            className={`w-full max-w-md max-h-[85vh] rounded-[2rem] sm:rounded-[2.25rem] overflow-hidden flex flex-col border shadow-2xl transition-all animate-in zoom-in-95 duration-200 ${isLight
              ? 'bg-[#FAFAFA] border-zinc-200 text-zinc-900 shadow-2xl'
              : 'bg-[#14151C] border-zinc-800/90 text-white shadow-2xl shadow-black/90'
              }`}
          >
            {/* Header matching Screenshot 3 */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
              {/* Golden Pill with Bid Amount */}
              <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-black font-black text-sm px-4 py-1.5 rounded-full shadow-md shadow-amber-500/25 font-mono">
                {selectedAmountData.amountFormatted}
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedAmountData(null)}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isLight
                  ? 'bg-zinc-200/90 hover:bg-zinc-300 text-zinc-700'
                  : 'bg-zinc-800/90 hover:bg-zinc-700 text-zinc-300 hover:text-white'
                  }`}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content & List of Bidders */}
            <div className="px-5 pb-5 space-y-3.5 flex-1 overflow-hidden flex flex-col min-h-0">
              {/* Summary Chips Row matching Screenshot 3 */}
              <div className="flex items-center gap-2 text-xs shrink-0 flex-wrap">
                <span className={`font-bold px-3 py-1.5 rounded-xl border ${isLight
                  ? 'bg-zinc-200/80 text-zinc-800 border-zinc-300/80'
                  : 'bg-[#1C1E26] text-zinc-200 border-zinc-800'
                  }`}>
                  {selectedAmountData.bidsCount} {t.bids}
                </span>

                <span className={`font-bold px-3 py-1.5 rounded-xl border ${isLight
                  ? 'bg-zinc-200/80 text-zinc-800 border-zinc-300/80'
                  : 'bg-[#1C1E26] text-zinc-200 border-zinc-800'
                  }`}>
                  {selectedAmountData.playersCount} {t.players}
                </span>

                <span
                  className={`font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1 ${selectedAmountData.isUnique
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                    : isLight
                      ? 'bg-zinc-200/80 text-zinc-600 border-zinc-300/80'
                      : 'bg-zinc-800/60 text-zinc-400 border-zinc-700/60'
                    }`}
                >
                  {selectedAmountData.isUnique ? t.unique : t.notUnique} <Info size={11} />
                </span>
              </div>

              {/* Scrollable Bidder List with visible vertical scrollbar matching Screenshot 3 */}
              <div className="space-y-2 overflow-y-auto flex-1 overscroll-contain pr-1.5 modal-scrollbar max-h-[58vh]">
                {selectedAmountData.bids && selectedAmountData.bids.length > 0 ? (
                  selectedAmountData.bids.map((b) => (
                    <div
                      key={b.id}
                      className={`rounded-2xl p-3 flex items-center justify-between text-xs border transition-colors ${isLight
                        ? 'bg-[#EDEDF0] border-zinc-200/90 text-zinc-800'
                        : 'bg-[#1A1C24] border-zinc-800/80 text-zinc-200'
                        }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-zinc-500 font-mono font-bold text-xs w-6 shrink-0">
                          #{b.index}
                        </span>
                        <div className="flex items-center gap-1.5 font-bold truncate">
                          <Phone size={12} className="text-amber-400 shrink-0" />
                          <span className="truncate">{b.masked_phone}</span>
                        </div>
                      </div>

                      <span className={`text-[11px] font-medium shrink-0 ml-2 ${isLight ? 'text-zinc-500' : 'text-zinc-400'
                        }`}>
                        {formatHumanDateTime(b.created_at)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-zinc-500 text-xs font-bold">
                    No bids recorded for this amount.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Draws;
