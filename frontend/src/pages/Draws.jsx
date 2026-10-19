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
    back: 'Back'
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
    back: 'ተመለስ'
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

  const winningRowRef = useRef(null);

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
      list.sort((a, b) => b.bidsCount - a.bidsCount || a.amount - b.amount);
    } else {
      list.sort((a, b) => a.amount - b.amount);
    }
    return list;
  }, [drawDetails?.amountBreakdown, sortBreakdownBy]);

  const handleScrollToWinningAmount = () => {
    if (winningRowRef.current) {
      winningRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto pb-20 min-w-0">
      {/* Top Header matching Screenshot 1 */}
      <div className="flex items-center justify-between mb-4 pt-1">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
            isLight
              ? 'bg-white hover:bg-zinc-100 text-zinc-700 shadow-sm border border-zinc-200'
              : 'bg-[#16171E] hover:bg-[#20222B] text-zinc-300 border border-zinc-800'
          }`}
          aria-label={t.back}
        >
          <ChevronLeft size={18} />
        </button>

        <div className="text-center">
          <h1 className="text-lg font-black tracking-tight text-white">{t.draws}</h1>
          <p className="text-[11px] font-medium text-zinc-400">{t.subtitle}</p>
        </div>

        {/* Language switch */}
        <button
          type="button"
          onClick={() => setLang(lang === 'en' ? 'am' : 'en')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
            isLight
              ? 'bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-200 shadow-sm'
              : 'bg-[#16171E] hover:bg-[#20222B] text-zinc-300 border border-zinc-800'
          }`}
        >
          <Globe size={13} className="text-amber-400" />
          <span>{lang === 'en' ? 'Eng' : 'አማ'}</span>
        </button>
      </div>

      {/* Segmented Tab Switcher matching Screenshot 1 */}
      <div
        className={`p-1 rounded-2xl flex items-center mb-5 border ${
          isLight
            ? 'bg-zinc-200/80 border-zinc-300/80'
            : 'bg-[#121318] border-zinc-800/90'
        }`}
      >
        <button
          type="button"
          onClick={() => setActiveTab('past')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 ${
            activeTab === 'past'
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
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 ${
            activeTab === 'upcoming'
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
                className={`group rounded-3xl overflow-hidden border transition-all duration-200 cursor-pointer active:scale-[0.99] shadow-xl ${
                  isLight
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

                  {/* WINNER Badge top-left */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500 text-black font-black text-[11px] shadow-lg tracking-wide uppercase">
                    <Trophy size={13} className="fill-black" />
                    <span>{t.winner}</span>
                  </div>

                  {/* WINNING BID Badge bottom-right matching Screenshot 1 */}
                  <div className="absolute bottom-3 right-3 flex flex-col items-center justify-center w-16 h-16    rounded-full bg-black/90 backdrop-blur-md border border-amber-500/60 shadow-2xl text-center">
                    <span className="text-[9px] font-bold text-amber-400 tracking-tight leading-none mb-0.5">
                      {t.winningBid}
                    </span>
                    <span className="text-base font-black text-white font-mono leading-none">
                      {Number(draw.winning_amount || 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Card Details */}
                <div className="p-4 space-y-2.5">
                  <h2 className="text-base sm:text-lg font-black text-white leading-snug line-clamp-1 group-hover:text-amber-400 transition-colors">
                    {draw.title}
                  </h2>

                  <div className="flex items-center gap-2 text-xs flex-wrap">
                    <span className="bg-zinc-800/90 text-amber-300 font-bold px-2 py-0.5 rounded-md text-[10px] tracking-wide border border-zinc-700/60">
                      {draw.auction_code}
                    </span>
                    <span className="text-zinc-400 text-[11px] font-medium">
                      {draw.entry_code}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-medium pt-0.5 ">
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
                className={`group rounded-3xl overflow-hidden border transition-all duration-200 cursor-pointer active:scale-[0.99] shadow-xl ${
                  isLight
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

                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/90 text-black font-black text-[10px] uppercase">
                    <Clock size={12} />
                    <span>Live Auction</span>
                  </div>

                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-white text-xs font-bold">
                    <Coins size={13} className="text-amber-400" />
                    <span>Entry: {(item.base_price || 0).toFixed(2)} Br</span>
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
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedDrawId(null);
          }}
        >
          <div
            className={`w-full max-w-lg max-h-[90vh] rounded-t-[2rem] sm:rounded-[2rem] overflow-hidden flex flex-col border transition-all animate-in slide-in-from-bottom-6 duration-200 ${
              isLight
                ? 'bg-white border-zinc-200 text-zinc-900 shadow-2xl'
                : 'bg-[#14151B] border-zinc-800/90 text-white shadow-2xl shadow-black/90'
            }`}
          >
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

            {/* Scrollable Content */}
            <div className="overflow-y-auto p-4 space-y-4 overscroll-contain">
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
                  <div className="rounded-2xl p-4 bg-[#0E0F14] border border-amber-500/40 shadow-lg shadow-amber-500/10 flex items-center gap-3.5">
                    {/* Golden Circle with Winning Amount */}
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-black flex items-center justify-center font-black text-base font-mono shadow-md shadow-amber-500/40 shrink-0">
                      {Number(drawDetails.winner.winning_amount || 0).toFixed(2)}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                        {t.lowestUniqueBidWinner}
                      </p>
                      <p className="text-sm font-black text-white flex items-center gap-1.5">
                        <Phone size={13} className="text-amber-400 shrink-0" />
                        <span>{drawDetails.winner.masked_phone}</span>
                      </p>
                      <p className="text-[11px] font-medium text-zinc-400 truncate">
                        {drawDetails.winner.entry_code}
                      </p>
                    </div>
                  </div>

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
                      <p className="text-[10px] text-zinc-400 font-medium">{t.auction}</p>
                      <p className="text-xs sm:text-sm font-black text-white truncate">{drawDetails.stats.auctionCode}</p>
                    </div>
                  </div>

                  {/* Number breakdown Section matching Screenshot 2 */}
                  <div className="space-y-3 pt-2">
                    <h3 className="text-sm font-black text-white">{t.numberBreakdown}</h3>

                    {/* Chips Row */}
                    <div className="flex items-center gap-1.5 flex-wrap text-xs">
                      <span className="bg-[#161720] text-zinc-300 font-semibold px-2.5 py-1 rounded-lg border border-zinc-800 text-[11px]">
                        {t.totalBids}: {drawDetails.stats.totalBids}
                      </span>
                      <span className="bg-[#161720] text-zinc-300 font-semibold px-2.5 py-1 rounded-lg border border-zinc-800 text-[11px] flex items-center gap-1">
                        {t.uniqueAmounts}: {drawDetails.stats.uniqueAmountsCount} <Info size={11} className="text-zinc-500" />
                      </span>
                      <span className="bg-amber-500/15 text-amber-300 font-bold px-2.5 py-1 rounded-lg border border-amber-500/40 text-[11px]">
                        {t.winningAmount}: {drawDetails.stats.winningAmount}
                      </span>
                    </div>

                    {/* Filter Segmented Control & Show Winning Amount Link */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center bg-[#101116] border border-zinc-800/90 rounded-xl p-0.5">
                        <button
                          type="button"
                          onClick={() => setSortBreakdownBy('amount')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            sortBreakdownBy === 'amount'
                              ? 'bg-[#1C1E28] text-white shadow-xs'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          {t.byAmount}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSortBreakdownBy('most_picked')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            sortBreakdownBy === 'most_picked'
                              ? 'bg-[#1C1E28] text-white shadow-xs'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          {t.mostPicked}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleScrollToWinningAmount}
                        className="text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
                      >
                        {t.showWinningAmount}
                      </button>
                    </div>

                    {/* Amount Rows with Horizontal Bar Fill matching Screenshot 2 */}
                    <div className="space-y-2 pt-1 max-h-72 overflow-y-auto overscroll-contain pr-1">
                      {sortedAmountBreakdown.map((row) => {
                        const percent = drawDetails.stats.maxBidsPerAmount > 0
                          ? Math.max(10, Math.min(100, (row.bidsCount / drawDetails.stats.maxBidsPerAmount) * 100))
                          : 20;

                        return (
                          <div
                            key={row.amount}
                            ref={row.isWinning ? winningRowRef : null}
                            onClick={() => setSelectedAmountData(row)}
                            className={`relative rounded-xl p-3 flex items-center justify-between cursor-pointer border transition-all active:scale-[0.99] overflow-hidden ${
                              row.isWinning
                                ? 'bg-amber-500/10 border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                                : 'bg-[#161720] border-zinc-800/80 hover:border-zinc-700'
                            }`}
                          >
                            {/* Horizontal visual progress fill */}
                            <div
                              className={`absolute top-0 bottom-0 left-0 transition-all pointer-events-none rounded-xl ${
                                row.isWinning ? 'bg-amber-500/25' : 'bg-zinc-800/50'
                              }`}
                              style={{ width: `${percent}%` }}
                            />

                            {/* Left label: e.g. 0.01 ETB */}
                            <div className="relative z-10 flex items-center gap-2">
                              <span className="text-xs font-extrabold text-white font-mono">
                                {row.amountFormatted}
                              </span>
                              {row.isWinning && (
                                <span className="bg-amber-400 text-black text-[9px] font-black px-1.5 py-0.5 rounded-md">
                                  WINNER
                                </span>
                              )}
                            </div>

                            {/* Right label: e.g. 28 bids > */}
                            <div className="relative z-10 flex items-center gap-1.5 text-xs font-bold text-zinc-300">
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
          className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedAmountData(null);
          }}
        >
          <div
            className={`w-full max-w-md max-h-[85vh] rounded-[2rem] sm:rounded-[2.25rem] overflow-hidden flex flex-col border shadow-2xl transition-all animate-in zoom-in-95 duration-200 ${
              isLight
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
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  isLight
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
                <span className={`font-bold px-3 py-1.5 rounded-xl border ${
                  isLight
                    ? 'bg-zinc-200/80 text-zinc-800 border-zinc-300/80'
                    : 'bg-[#1C1E26] text-zinc-200 border-zinc-800'
                }`}>
                  {selectedAmountData.bidsCount} {t.bids}
                </span>

                <span className={`font-bold px-3 py-1.5 rounded-xl border ${
                  isLight
                    ? 'bg-zinc-200/80 text-zinc-800 border-zinc-300/80'
                    : 'bg-[#1C1E26] text-zinc-200 border-zinc-800'
                }`}>
                  {selectedAmountData.playersCount} {t.players}
                </span>

                <span
                  className={`font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1 ${
                    selectedAmountData.isUnique
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
                      className={`rounded-2xl p-3 flex items-center justify-between text-xs border transition-colors ${
                        isLight
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

                      <span className={`text-[11px] font-medium shrink-0 ml-2 ${
                        isLight ? 'text-zinc-500' : 'text-zinc-400'
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
