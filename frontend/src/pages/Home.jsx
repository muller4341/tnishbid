import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import {
  Eye, Tag, Gavel, Star, AlertCircle,
  CheckCircle2, ChevronRight, Globe, Minus, Plus, Info,
  TrendingDown, Sparkles, Search
} from 'lucide-react';
import { getCachedItems, setCachedItems } from '../utils/cache';
import { ConfirmBidModal, PaymentMethodSelector } from '../components/BidPaymentModal';

/* Translations */
const TRANSLATIONS = {
  en: {
    langLabel: 'English',
    heroTitle: 'How to Win \u1275\u1295\u123dBid',
    heroDesc:
      '\u1275\u1295\u123dBid is a Lowest Unique Bid Auction — the participant who submits the lowest unique bid wins. ' +
      'For example, if ETB 1.00 is submitted twice, ETB 2.00 once, ETB 3.00 twice, and ETB 4.00 once, ' +
      'the lowest unique bid is ETB 2.00, so it wins. Only the lowest AND unique bid wins. ' +
      'Bidders can submit different amounts up to 100 times for a single auction. ' +
      'Win premium items at a fraction of their actual price!',
    startBid: 'START BIDDING NOW',
    searchPlaceholder: 'Search products...',
    live: 'Live',
    bidFee: 'Bid Service Fee',
    auctionCode: 'Auction Code',
    bids: 'bids',
    bidAmount: 'Bid amount',
    submitBid: 'Submit a Bid Amount',
    terms: 'TERMS AND CONDITIONS WILL APPLY',
    expired: 'EXPIRED',
    viewDetails: 'View Details',
    noItems: 'No active auctions at the moment.',
  },
  am: {
    langLabel: '\u12a0\u121b\u122d\u129b',
    heroTitle: '\u1275\u1295\u123dBid \u12a5\u1295\u12f4\u1275 \u121b\u1238\u1290\u134d \u12ed\u127b\u120b\u120d',
    heroDesc:
      '\u1275\u1295\u123dBid \u12dd\u1245\u1270\u129b \u120d\u12e9 \u1328\u1228\u1273 \u1235\u122d\u12d3\u1275 \u1290\u12cd ' +
      '\u2014 \u12dd\u1245\u1270\u129b \u120d\u12e9 \u1328\u1228\u1273 \u12eb\u1240\u1228\u1260 \u1270\u1233\u1273\u134a \u12eb\u1238\u1295\u134b\u120d\u1362 ' +
      '\u1208\u121d\u1233\u1ac4\u1363 1.00 \u1265\u122d \u1201\u1208\u1274\u1363 2.00 \u1265\u122d \u12a0\u1295\u12f5 \u130a\u12dc\u1363 ' +
      '3.00 \u1265\u122d \u1201\u1208\u1274 \u1240\u122d\u1265 \u12ab\u1208 \u12dd\u1245\u1270\u129b \u120d\u12e9 \u1328\u1228\u1273 2.00 \u1265\u122d \u1290\u12cd\u1362 ' +
      '\u1265\u127b \u12dd\u1245\u1270\u129b \u12a5\u1293 \u120d\u12e9 \u1328\u1228\u1273 \u12eb\u1238\u1295\u134b\u120d\u1362 \u1270\u132b\u122b\u127e\u127d \u12a5\u1235\u12a8 100 \u130a\u12dc \u120a\u1240\u122d\u1261 \u12ed\u127d\u120b\u1209\u1362',
    startBid: '\u12a0\u1201\u1295 \u1328\u1228\u1273 \u1300\u121d\u122d',
    searchPlaceholder: '\u121d\u122d\u1276\u127d\u1295 \u1348\u120d\u130d...',
    live: '\u1240\u1325\u1273',
    bidFee: '\u12e8\u1328\u1228\u1273 \u12ad\u134d\u12eb',
    auctionCode: '\u12e8\u1328\u1228\u1273 \u12ae\u12f5',
    bids: '\u1328\u1228\u1273\u12ce\u127d',
    bidAmount: '\u12e8\u1328\u1228\u1273 \u1218\u1320\u1295',
    submitBid: '\u1328\u1228\u1273 \u12a0\u1245\u122d\u1265',
    terms: '\u12f0\u1295\u1266\u127d\u1293 \u1201\u1294\u1273\u12ce\u127d \u1270\u1348\u133b\u121a \u12ed\u1206\u1293\u1209',
    expired: '\u130a\u12dc\u12cd \u12a0\u120d\u134f\u120d',
    viewDetails: '\u12dd\u122d\u12dd\u122d \u12ed\u1218\u120d\u12a8\u1271',
    noItems: '\u1260\u12da\u1205 \u130a\u12dc \u1295\u1261 \u1328\u1228\u1273\u12ce\u127d \u12e8\u1209\u121d\u1362',
  },
};

/* Helpers */
const formatCountdown = (endTime) => {
  if (!endTime) return '00h : 00m : 00s';
  const now = Date.now();
  const end = new Date(endTime).getTime();
  const dist = end - now;
  if (dist <= 0) return 'EXPIRED';
  const d = Math.floor(dist / (1000 * 60 * 60 * 24));
  const h = Math.floor((dist % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const m = Math.floor((dist % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((dist % (1000 * 60)) / 1000);
  const pad = (n) => (n < 10 ? '0' + n : n);
  if (d > 0) return `${d}d : ${pad(h)}h : ${pad(m)}m : ${pad(s)}s`;
  return `${pad(h)}h : ${pad(m)}m : ${pad(s)}s`;
};

const countdownColor = (endTime) => {
  if (!endTime) return 'text-red-400';
  const dist = new Date(endTime).getTime() - Date.now();
  if (dist <= 0) return 'text-red-400';
  if (dist / (1000 * 60 * 60 * 24) <= 5) return 'text-yellow-400';
  return 'text-emerald-400';
};

/* Language Selector */
const LanguageSelector = ({ lang, setLang }) => {
  const [open, setOpen] = useState(false);
  const langs = [
    { code: 'en', label: 'English', flag: '\ud83c\uddec\ud83c\udde7' },
    { code: 'am', label: '\u12a0\u121b\u122d\u129b', flag: '\ud83c\uddea\ud83c\uddf9' },
  ];
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1C1C24] border border-amber-500/30 text-xs font-bold text-amber-400 hover:bg-amber-500/10 transition-all"
      >
        <Globe size={13} />
        <span>{langs.find((l) => l.code === lang)?.flag}</span>
        <span>{langs.find((l) => l.code === lang)?.label}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-1.5 bg-[#1C1C24] border border-zinc-700 rounded-xl shadow-2xl z-50 overflow-hidden min-w-[130px]">
          {langs.map((l) => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-colors
                ${lang === l.code ? 'bg-amber-500/20 text-amber-400' : 'text-zinc-300 hover:bg-zinc-800'}`}
            >
              <span>{l.flag}</span> {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* Hero / Game Description */
const HeroSection = ({ t, onScrollToItems }) => (
  <div className="light-theme-hero home-hero relative rounded-[2rem] overflow-hidden mb-6">
    <div className="home-hero-glow home-hero-glow-amber absolute -top-16 -right-10 pointer-events-none" />
    <div className="home-hero-glow home-hero-glow-green absolute -bottom-20 -left-10 pointer-events-none" />

    <div className="relative p-5 space-y-4">
      

      <h1 className="text-2xl md:text-3xl font-black text-white leading-tight tracking-tight">
        {t.heroTitle}
      </h1>

      <p className="text-sm text-white/90 leading-relaxed font-medium max-w-lg">
        {t.heroDesc}
      </p>

      <button
        onClick={onScrollToItems}
        className="home-primary-action inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider transition-all active:scale-95 text-white"
      >
        {t.startBid} <Sparkles size={16} />
      </button>
    </div>
  </div>
);

/* Single Product Bid Card */
const ProductBidCard = ({ item, t, user, navigate }) => {
  const [bidInput, setBidInput] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localBidCount, setLocalBidCount] = useState(
    item._count?.bids ?? item.bid_count ?? item.bids?.length ?? 0
  );
  const [wished, setWished] = useState(false);
  const [countdown, setCountdown] = useState(() => formatCountdown(item.end_time));
  const [selectedPayment, setSelectedPayment] = useState('telebirr');
  const [isBidInputFocused, setIsBidInputFocused] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);
  const [pendingBidAmount, setPendingBidAmount] = useState(null);

  const isExpired =
    item.status === 'closed' ||
    (item.end_time && new Date(item.end_time).getTime() <= Date.now());

  useEffect(() => {
    if (isExpired) return;
    const iv = setInterval(() => setCountdown(formatCountdown(item.end_time)), 1000);
    return () => clearInterval(iv);
  }, [item.end_time, isExpired]);

  const handleDecrement = () => {
    const cur = parseFloat(bidInput) || 0;
    if (cur > 0) setBidInput((cur - 1).toFixed(2));
  };

  const handleIncrement = () => {
    const cur = parseFloat(bidInput) || 0;
    setBidInput((cur + 1).toFixed(2));
  };

  const handleSubmit = () => {
    if (!user) {
      navigate('/login', { state: { from: `/item/${item.id}` } });
      return;
    }
    const amount = parseFloat(bidInput);
    if (isNaN(amount) || amount <= 0) {
      setError('Enter a valid bid amount');
      setTimeout(() => setError(''), 3000);
      return;
    }
    setPendingBidAmount(amount);
    setShowConfirmModal(true);
  };

  const handleConfirmBid = async () => {
    if (!pendingBidAmount) return;
    setIsSubmittingBid(true);
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      if (selectedPayment !== 'wallet') {
        const response = await axios.post('/api/payments/chapa/initialize', {
          item_id: item.id,
          amount: pendingBidAmount,
        });
        if (!response.data?.checkout_url) throw new Error('Chapa did not return a checkout URL');
        window.location.assign(response.data.checkout_url);
        return;
      }

      await axios.post('/api/bids/place', {
        item_id: item.id,
        amount: pendingBidAmount,
        payment_method: selectedPayment,
      });
      setSuccess(`Bid of ${pendingBidAmount.toFixed(2)} Br placed!`);
      setLocalBidCount((c) => c + 1);
      setBidInput('');
      setShowConfirmModal(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to place bid.');
      setTimeout(() => setError(''), 4000);
    } finally {
      setSubmitting(false);
      setIsSubmittingBid(false);
    }
  };

  const cdColor = countdownColor(item.end_time);
  const bidCount = localBidCount;
  const auctionCode = item.auction_code || item.id;

  return (
    <div className="home-auction-card rounded-[1.75rem] overflow-hidden mb-5">
      {/* Image */}
      <div className="home-card-image relative">
        <Link to={`/item/${item.id}`}>
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.title}
              loading="lazy"
              className="w-full h-56 sm:h-64 object-cover"
            />
          ) : (
            <div className="w-full h-56 sm:h-64 flex items-center justify-center text-zinc-700">
              <Tag size={48} className="opacity-30" />
            </div>
          )}
        </Link>

        {/* LIVE badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600 text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow-lg">
          {!isExpired && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
          {isExpired ? t.expired : t.live}
        </div>

        {/* Views */}
        <div className="absolute top-3 right-12 flex items-center gap-1 bg-black/50 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1 rounded-lg">
          <Eye size={12} className="text-amber-400" />
          {bidCount > 1000 ? (bidCount / 1000).toFixed(1) + 'K' : bidCount}
        </div>

        {/* Wishlist star */}
        <button
          onClick={() => setWished((w) => !w)}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center transition-all hover:scale-110"
          aria-label="Wishlist"
        >
          <Star size={15} className={wished ? 'fill-amber-400 text-amber-400' : 'text-zinc-300'} />
        </button>
      </div>

      {/* Body */}
      <div className="home-card-body p-4 space-y-3">
        <Link to={`/item/${item.id}`}>
          <h2 className="text-lg font-black text-white leading-snug hover:text-amber-400 transition-colors">
            {item.title}
          </h2>
        </Link>

        <div className="border-t border-zinc-800/60" />

        {/* Bid Fee & Auction Code */}
        <div className="grid grid-cols-2 gap-2">
          <div className="home-card-panel flex items-center gap-2 rounded-xl p-2.5">
            <Gavel size={15} className="text-emerald-400 shrink-0" />
            <div>
              <p className="text-[10px] text-emerald-400 font-bold">{t.bidFee}</p>
              <p className="text-sm font-black text-white font-mono">
                {(item.base_price || 0).toFixed(2)} Br
              </p>
            </div>
          </div>

          <div className="home-card-panel flex items-center gap-2 rounded-xl p-2.5">
            <Tag size={15} className="text-amber-400 shrink-0" />
            <div>
              <p className="text-[10px] text-amber-400 font-bold">{t.auctionCode}</p>
              <p className="text-sm font-black text-white font-mono">{auctionCode}</p>
            </div>
          </div>
        </div>

        {/* Countdown & bid count */}
        <div className="flex items-center justify-between px-1">
          <span className={`text-sm font-black font-mono ${cdColor}`}>
            {isExpired ? t.expired : countdown}
          </span>
          <span className="text-sm font-black text-emerald-400">
            {bidCount} {t.bids}
          </span>
        </div>

        {/* Bid input + submit */}
        {!isExpired ? (
          <>
            <div className="home-bid-input flex items-center rounded-2xl overflow-hidden">
              <button
                onClick={handleDecrement}
                className="w-11 h-11 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors shrink-0"
                aria-label="Decrease"
              >
                <Minus size={18} />
              </button>
              <input
                type="number"
                value={bidInput}
                onFocus={() => setIsBidInputFocused(true)}
                onBlur={() => setTimeout(() => setIsBidInputFocused(false), 200)}
                onChange={(e) => setBidInput(e.target.value)}
                placeholder={t.bidAmount}
                min="0"
                step="0.01"
                className="flex-1 bg-transparent text-center text-white text-sm font-bold placeholder-zinc-500 focus:outline-none py-3"
              />
              <button
                onClick={handleIncrement}
                className="w-11 h-11 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors shrink-0"
                aria-label="Increase"
              >
                <Plus size={18} />
              </button>
            </div>

            {isBidInputFocused && (
              <PaymentMethodSelector
                selectedPayment={selectedPayment}
                onSelectPayment={setSelectedPayment}
              />
            )}

            {error && (
              <div className="flex items-center gap-2 text-xs text-red-400 font-bold bg-red-950/50 border border-red-500/30 rounded-xl px-3 py-2">
                <AlertCircle size={13} /> {error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold bg-emerald-950/50 border border-emerald-500/30 rounded-xl px-3 py-2">
                <CheckCircle2 size={13} /> {success}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="home-primary-action w-full py-3.5 rounded-2xl font-black text-sm text-white uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {submitting ? (
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              ) : t.submitBid}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-500 font-bold">
              <Info size={11} className="text-emerald-500" />
              {t.terms}
            </div>
          </>
        ) : (
          <Link
            to={`/item/${item.id}`}
            className="home-primary-action w-full py-3 rounded-2xl font-black text-sm text-center text-white flex items-center justify-center gap-1.5 transition-all active:scale-95"
          >
            {t.viewDetails} <ChevronRight size={16} />
          </Link>
        )}
      </div>
      <ConfirmBidModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmBid}
        itemTitle={item.title}
        bidAmount={pendingBidAmount}
        bidFee={item.base_price || 0}
        selectedPayment={selectedPayment}
        isSubmitting={isSubmittingBid}
      />
    </div>
  );
};

/* Home Page */
const Home = () => {
  const [lang, setLang] = useState('en');
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const cached = getCachedItems();
  const [items, setItems] = useState(cached || []);
  const [loading, setLoading] = useState(!cached);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, socket } = useAuth();
  const navigate = useNavigate();

  const itemsRef = useRef(null);
  const handleScrollToItems = () => {
    itemsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await axios.get('/api/items');
        setCachedItems(res.data);
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
    let activeSocket = socket;
    let createdSocket = null;
    if (!activeSocket) {
      createdSocket = io();
      activeSocket = createdSocket;
    }
    const handleBidUpdate = (data) => {
      if (data?.item_id) {
        setItems((prev) =>
          prev.map((item) => {
            if (item.id === data.item_id) {
              const cur = item._count?.bids ?? item.bid_count ?? item.bids?.length ?? 0;
              return {
                ...item,
                bid_count: cur + 1,
                _count: { ...item._count, bids: cur + 1 },
              };
            }
            return item;
          })
        );
      }
    };
    activeSocket.on('bid_update', handleBidUpdate);
    return () => {
      activeSocket.off('bid_update', handleBidUpdate);
      if (createdSocket) createdSocket.close();
    };
  }, [socket]);

  const filteredItems = items.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-amber-500 border-t-transparent" />
        <p className="text-xs font-bold text-zinc-500 animate-pulse">Loading auctions...</p>
      </div>
    );
  }

  return (
    <div className="home-page max-w-lg mx-auto pb-8">

      {/* Search + Language */}
      <div className="home-toolbar flex items-center gap-2 mb-4 sticky top-[56px] z-30 backdrop-blur-md py-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full pl-9 pr-4 py-2.5 bg-[#16161A] border border-zinc-800/90 rounded-2xl text-xs font-medium text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all"
          />
        </div>
        <LanguageSelector lang={lang} setLang={setLang} />
      </div>

      {/* Hero */}
      <HeroSection t={t} onScrollToItems={handleScrollToItems} />

      {/* Products */}
      <div ref={itemsRef}>
        {filteredItems.length === 0 ? (
          <div className="text-center py-16 text-zinc-500 text-sm font-bold">
            {t.noItems}
          </div>
        ) : (
          filteredItems.map((item) => (
            <ProductBidCard
              key={item.id}
              item={item}
              t={t}
              user={user}
              navigate={navigate}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Home;
