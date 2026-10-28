import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import {
  Eye, Tag, Gavel, Star, AlertCircle,
  CheckCircle2, ChevronRight, ChevronDown, Minus, Plus, Info, Clock, DollarSign, Grid3X3, CircleDollarSign, Hash,
  Trophy, Repeat2, Target,
  TrendingUp, TrendingDown, Sparkles, Search,
  Coins,
  Ticket,
  Check,
  X
} from 'lucide-react';
import { getCachedItems, setCachedItems, clearCachedItems } from '../utils/cache';
import { 
  formatEATCountdown, 
  countdownColorEAT, 
  isAuctionEndedEAT, 
  parseAuctionDate, 
  getEATRemainingMs 
} from '../utils/timezone';
import { optimizeImageUrl } from '../utils/imageOptimizer';
import { ConfirmBidModal } from '../components/BidPaymentModal';
import ChapaEmbeddedModal from '../components/ChapaEmbeddedModal';
import HomeSupportButton from '../components/HomeSupportButton';
import heroIphoneImg from '../assets/hero_iphone.jpg';
import heroCarImg from '../assets/hero_car.jpg';
import heroLaptopImg from '../assets/hero_laptop.jpg';
import heroWatchImg from '../assets/hero_watch.jpg';
import heroAwardImg from '../assets/hero_award.jpg';

/* Translations */
const TRANSLATIONS = {
  en: {
    langLabel: 'English',
    heroTitle: 'How to Win \u1275\u1295\u123dBid',
    heroRules: [
      { title: 'Lowest unique bid wins', text: 'Submit an amount no other bidder has chosen.', icon: 'target' },
      { title: 'Every bid costs a small fee', text: 'Pay the bid service fee to participate.', icon: 'gavel' },
      { title: 'Bid up to 100 times', text: 'Try different amounts to find a unique bid.', icon: 'repeat' },
      { title: 'Win premium items', text: 'The lowest unique bid takes the prize.', icon: 'trophy' },
    ],
    startBid: 'START BIDDING NOW',
    searchPlaceholder: 'Search products...',
    live: 'Live',
    bidFee: 'Bid Fee',
    auctionCode: 'Auction Code',
    bids: 'bids',
    bidAmount: 'e.g. 0.01',
    submitBid: 'Submit a Bid Amount',
    terms: 'Bids require 2 decimal places. Only lowest unique bids win!',
    expired: 'Ended',
    endedOption: 'Ended',
    viewDetails: 'View Details',
    noItems: 'No active auctions at the moment.',
    noEndedItems: 'No concluded auctions yet.',
    filterTime: 'Time',
    filterPrice: 'Price',
    filterCategory: 'Category',
    allTimes: 'ALL',
    endingIn2Days: 'Ending in 2 days',
    endingIn5Days: 'Ending in 5 days',
    endingIn15Days: 'Ending in 15 days',
    allPrices: 'ALL',
    lowestToHighest: 'Lowest to Highest',
    highestToLowest: 'Highest to Lowest',
    allCategories: 'Category (All)',
    clearFilters: 'Clear filters',
    showingResults: 'results found',
  },
  am: {
    langLabel: '\u12a0\u121b\u122d\u129b',
    heroTitle: '\u1275\u1295\u123dBid \u12a5\u1295\u12f4\u1275 \u121b\u1238\u1290\u134d \u12ed\u127b\u120b\u120d',
    heroRules: [
      { title: '\u12dd\u1245\u1270\u129b \u120d\u12e9 \u1328\u1228\u1273', text: '\u120c\u12ab\u1295\u12f5 \u1308\u12e2 \u12eb\u120d\u1270\u1218\u1228\u1290 \u12e8\u1328\u1228\u1273 \u1218\u1320\u1295 \u12ed\u121d\u1228\u1321\u1362', icon: 'target' },
      { title: '\u12e8\u1328\u1228\u1273 \u12ad\u134d\u12eb', text: '\u1328\u1228\u1273 \u1208\u121b\u12f5\u1228\u130d \u12ed\u1205\u1295 \u12ad\u134d\u12eb \u12ed\u12ab\u120b\u1209\u1362', icon: 'gavel' },
      { title: '\u12a5\u1235\u12a8 100 \u130a\u12dc \u1328\u1228\u1273', text: '\u120d\u12e9 \u12e8\u1328\u1228\u1273 \u1218\u1320\u1296\u127d\u1295 \u1260\u121b\u1230\u1218\u122d \u12ed\u1239\u1229\u1362', icon: 'repeat' },
      { title: '\u12a0\u1238\u1293\u134a \u12a5\u1243', text: '\u12dd\u1245\u1270\u129b \u120d\u12e9 \u1328\u1228\u1273 \u12eb\u1238\u1295\u134b\u120d\u1362', icon: 'trophy' },
    ],
    startBid: '\u12a0\u1201\u1295 \u1328\u1228\u1273 \u1300\u121d\u122d',
    searchPlaceholder: '\u121d\u122d\u1276\u127d\u1295 \u1348\u120d\u130d...',
    live: '\u1240\u1325\u1273',
    bidFee: '\u12e8\u1328\u1228\u1273 \u12ad\u134d\u12eb',
    auctionCode: '\u12e8\u1328\u1228\u1273 \u12ae\u12f5',
    bids: '\u1328\u1228\u1273\u12ce\u127d',
    bidAmount: '\u12e8\u1328\u1228\u1273 \u1218\u1320\u1295',
    submitBid: '\u1328\u1228\u1273 \u12a0\u1245\u122d\u1265',
    terms: '\u12f0\u1295\u1266\u127d\u1293 \u1201\u1294\u1273\u12ce\u127d \u1270\u1348\u133b\u121a \u12ed\u1206\u1293\u1209',
    expired: 'ተጠናቋል',
    endedOption: 'ተጠናቋል',
    viewDetails: '\u12dd\u122d\u12dd\u122d \u12ed\u1218\u120d\u12a8\u1271',
    noItems: '\u1260\u12da\u1205 \u130a\u12dc \u1295\u1261 \u1328\u1228\u1273\u12ce\u127d \u12e8\u1209\u121d\u1362',
    noEndedItems: 'እስካሁን የተጠናቀቁ ጨረታዎች የሉም።',
    filterTime: '\u130a\u12dc',
    filterPrice: '\u12cb\u130b',
    filterCategory: '\u121d\u12f5\u1265',
    allTimes: 'ALL',
    endingIn2Days: 'በ 2 ቀናት የሚያልቁ',
    endingIn5Days: 'በ 5 ቀናት የሚያልቁ',
    endingIn15Days: 'በ 15 ቀናት የሚያልቁ',
    allPrices: 'ALL',
    lowestToHighest: 'ከዝቅተኛ ወደ ከፍተኛ',
    highestToLowest: 'ከከፍተኛ ወደ ዝቅተኛ',
    allCategories: '\u121d\u12f5\u1265 (\u1201\u1209\u121d)',
    clearFilters: '\u12a0\u1323\u122b\u12ce\u127d\u1295 \u12a0\u1325\u134b',
    showingResults: '\u12e8\u1270\u1308\u1299 \u1328\u1228\u1273\u12ce\u127d',
  },
};

/* Helpers aligned with East Africa Time (Addis Ababa / Nairobi, UTC+3) */
const formatCountdown = formatEATCountdown;
const countdownColor = countdownColorEAT;

/* Hero / Game Description — Swipeable Carousel */
const ruleIcons = { trophy: Trophy, repeat: Repeat2, target: Target, gavel: Gavel };

const HERO_SLIDES = [
  {
    isRule: true,
    image: heroAwardImg,
    badge: 'HOW TO PLAY & WIN',
    accentColor: 'rgba(251, 191, 36, 0.65)',
  },
  {
    image: heroIphoneImg,
    badge: 'WIN PREMIUM PHONES',
    title: 'Bid Small,\nWin Big',
    subtitle: 'Place the lowest unique bid and take home the latest smartphones.',
    highlight: { label: 'Starting from', value: '0.01 Birr' },
    accentColor: 'rgba(251, 191, 36, 0.6)',
  },
  {
    isRule: true,
    image: heroAwardImg, 
    badge: 'TOP BIDDER AWARDS',
    title: 'Bid More, Win up to 100,000 Birr',
    rules: [
      { title: 'Place multiple bids', text: 'Submit as many bids as you want to climb the leaderboard.', icon: 'repeat' },
      { title: 'Be the top bidder', text: 'The user with the most bids gets the 2nd award.', icon: 'target' },
      { title: 'Win 2nd winner award', text: 'The user with the second most bids gets the 1st award.', icon: 'trophy' },
      { title: 'Double your chance', text: 'Win via lowest unique bid OR as the top bidder.', icon: 'gavel' },
    ],
    accentColor: 'rgba(251, 191, 36, 0.65)',
  },
  {
    image: heroCarImg,
    badge: 'LATEST CARS',
    title: 'Drive Your\nDream Car',
    subtitle: 'Win latest cars with a smart bidding strategy.',
    highlight: { label: 'Up to', value: '100 Bids' },
    accentColor: 'rgba(249, 115, 22, 0.6)',
  },
  {
    image: heroLaptopImg,
    badge: 'EXCLUSIVE ELECTRONICS',
    title: 'Power Up\nYour Gear',
    subtitle: 'Latest laptops and computers await the smartest bidder.',
    highlight: { label: 'Unique & small', value: 'wins' },
    accentColor: 'rgba(168, 162, 158, 0.5)',
  },
  {
    image: heroWatchImg,
    badge: 'EXCLUSIVE PRIZES',
    title: 'Wear Your\nVictory',
    subtitle: 'Luxury watches and accessories, only the lowest unique bid wins and the top bidders win.',
    highlight: { label: 'New posts', value: 'Daily' },
    accentColor: 'rgba(234, 179, 8, 0.6)',
  },
];

const HeroSection = ({ t, onScrollToItems }) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const autoPlayRef = useRef(null);
  const slideCount = HERO_SLIDES.length;

  const goToSlide = useCallback((index) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setActiveSlide(index);
    setTimeout(() => setIsTransitioning(false), 600);
  }, [isTransitioning]);

  const nextSlide = useCallback(() => {
    goToSlide((activeSlide + 1) % slideCount);
  }, [activeSlide, slideCount, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide((activeSlide - 1 + slideCount) % slideCount);
  }, [activeSlide, slideCount, goToSlide]);

  // Auto-play
  useEffect(() => {
    autoPlayRef.current = setInterval(nextSlide, 10000);
    return () => clearInterval(autoPlayRef.current);
  }, [nextSlide]);

  // Reset auto-play on manual interaction
  const resetAutoPlay = useCallback(() => {
    clearInterval(autoPlayRef.current);
    autoPlayRef.current = setInterval(nextSlide, 10000);
  }, [nextSlide]);

  // Touch handlers
  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;
    if (Math.abs(distance) >= minSwipeDistance) {
      if (distance > 0) nextSlide();
      else prevSlide();
      resetAutoPlay();
    }
  };

  const slide = HERO_SLIDES[activeSlide];

  return (
    <div
      className="light-theme-hero home-hero relative rounded-[1rem] overflow-hidden mb-6"
      style={{ minHeight: '320px' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background images — all preloaded, only active is visible */}
      {HERO_SLIDES.map((s, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-all duration-700 ease-out"
          style={{
            opacity: i === activeSlide ? 1 : 0,
            transform: i === activeSlide ? 'scale(1)' : 'scale(1.08)',
          }}
        >
          <img
            src={s.image}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            loading={i === 0 ? 'eager' : 'lazy'}
          />
          {/* Dark gradient overlay for text readability */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.65) 50%, rgba(0,0,0,0.4) 100%)`,
            }}
          />
          {/* Accent color glow per slide */}
          <div
            className="absolute -bottom-20 -right-20 w-60 h-60 rounded-full blur-[80px] pointer-events-none"
            style={{ background: s.accentColor }}
          />
        </div>
      ))}

      {/* Content overlay */}
      <div className="relative z-10 p-5 sm:p-6 flex flex-col justify-between" style={{ minHeight: '320px' }}>
        {/* Top: Badge */}
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase w-fit transition-all duration-500"
          style={{
            background: 'rgba(251, 191, 36, 0.15)',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            color: '#fbbf24',
            backdropFilter: 'blur(8px)',
            opacity: isTransitioning ? 0 : 1,
            transform: isTransitioning ? 'translateY(-8px)' : 'translateY(0)',
          }}
        >
          <Sparkles size={11} />
          {slide.badge}
        </div>

        {/* Middle: Either Rules steps OR Title + Subtitle */}
        {(slide.isRules || slide.isRule) ? (
          <div className="flex-1 flex flex-col justify-center py-2">
            <h1
              className="text-xl sm:text-2xl font-black leading-tight tracking-tight mb-2.5 transition-all duration-500"
              style={{
                color: '#fff',
                textShadow: '0 2px 20px rgba(249,115,22,0.4)',
                opacity: isTransitioning ? 0 : 1,
                transform: isTransitioning ? 'translateY(12px)' : 'translateY(0)',
              }}
            >
              {slide.title || t.heroTitle}
            </h1>

            <div
              className="grid gap-2 transition-all duration-500 delay-75"
              style={{
                opacity: isTransitioning ? 0 : 1,
                transform: isTransitioning ? 'translateY(8px)' : 'translateY(0)',
              }}
            >
              {(slide.rules || t.heroRules).map((rule) => {
                const RuleIcon = ruleIcons[rule.icon] || Sparkles;
                return (
                  <div key={rule.title} className="flex items-start gap-2.5 rounded-xl px-1 py-0.5">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20 shadow-sm shadow-amber-500/10">
                      <RuleIcon size={14} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-amber-300">{rule.title}</p>
                      <p className="mt-0.5 text-[11px] sm:text-xs leading-relaxed text-white/75">{rule.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center py-3">
            <h1
              className="text-[1.75rem] sm:text-3xl md:text-4xl font-black leading-[1.1] tracking-tight transition-all duration-500 whitespace-pre-line"
              style={{
                color: '#fff',
                textShadow: '0 2px 30px rgba(0,0,0,0.5)',
                opacity: isTransitioning ? 0 : 1,
                transform: isTransitioning ? 'translateY(16px)' : 'translateY(0)',
              }}
            >
              {slide.title}
            </h1>
            <p
              className="mt-2 text-xs sm:text-sm leading-relaxed max-w-[280px] transition-all duration-500 delay-75"
              style={{
                color: 'rgba(255,255,255,0.75)',
                opacity: isTransitioning ? 0 : 1,
                transform: isTransitioning ? 'translateY(12px)' : 'translateY(0)',
              }}
            >
              {slide.subtitle}
            </p>

            {/* Highlight chip */}
            {slide.highlight && (
              <div
                className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl w-fit transition-all duration-500 delay-100"
                style={{
                  background: 'rgba(251, 191, 36, 0.1)',
                  border: '1px solid rgba(251, 191, 36, 0.2)',
                  backdropFilter: 'blur(8px)',
                  opacity: isTransitioning ? 0 : 1,
                  transform: isTransitioning ? 'translateY(10px)' : 'translateY(0)',
                }}
              >
                <span className="text-[10px] text-amber-300/70 font-medium uppercase tracking-wider">{slide.highlight.label}</span>
                <span className="text-xs text-amber-300 font-black">{slide.highlight.value}</span>
              </div>
            )}
          </div>
        )}

        {/* Bottom: CTA + dots */}
        <div className="space-y-3">
          <button
            onClick={onScrollToItems}
            className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-amber-600 hover:brightness-110 text-black rounded-2xl font-black font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98] flex justify-center items-center gap-2"
          >
            {t.startBid} <Sparkles size={16} />
          </button>

          {/* Dot indicators */}
          <div className="flex items-center justify-center gap-2">
            {HERO_SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => { goToSlide(i); resetAutoPlay(); }}
                className="transition-all duration-300 rounded-full"
                style={{
                  width: i === activeSlide ? '20px' : '6px',
                  height: '6px',
                  background: i === activeSlide
                    ? 'linear-gradient(90deg, #f59e0b, #f97316)'
                    : 'rgba(255,255,255,0.3)',
                  cursor: 'pointer',
                  border: 'none',
                  padding: 0,
                }}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};



const sanitizeBidAmount = (val) => {
  if (val === '' || val === null || val === undefined) return '';
  // Strip any character that is not a digit or decimal point
  let cleaned = String(val).replace(/[^0-9.]/g, '');
  // Keep only the first decimal point
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    cleaned = parts[0] + '.' + parts.slice(1).join('');
  }
  // Allow at most 2 decimal places
  if (parts.length > 1 && parts[1].length > 2) {
    cleaned = `${parts[0]}.${parts[1].slice(0, 2)}`;
  }
  return cleaned;
};

/* Single Product Bid Card */
const ProductBidCard = ({ item, t, user, navigate }) => {
  const [bidInput, setBidInput] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const currentItemBidCount = item._count?.bids ?? item.bid_count ?? item.bids?.length ?? 0;
  const [localBidCount, setLocalBidCount] = useState(currentItemBidCount);

  useEffect(() => {
    setLocalBidCount(item._count?.bids ?? item.bid_count ?? item.bids?.length ?? 0);
  }, [item._count?.bids, item.bid_count, item.bids?.length]);
  const [wished, setWished] = useState(false);
  const [countdown, setCountdown] = useState(() => formatCountdown(item.end_time));
  const [selectedPayment, setSelectedPayment] = useState('telebirr');
  const [isBidInputFocused, setIsBidInputFocused] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);
  const [pendingBidAmount, setPendingBidAmount] = useState(null);
  const [inlinePayment, setInlinePayment] = useState(null);
  const [checkoutUrl, setCheckoutUrl] = useState(null);

  const isExpired = isAuctionEndedEAT(item);

  useEffect(() => {
    if (isExpired) return;
    const iv = setInterval(() => setCountdown(formatCountdown(item.end_time)), 1000);
    return () => clearInterval(iv);
  }, [item.end_time, isExpired]);

  const handleDecrement = () => {
    const cur = parseFloat(bidInput) || 0;
    if (cur > 1) {
      setBidInput((cur - 1).toFixed(2));
    } else {
      setBidInput('0.01');
    }
  };

  const handleIncrement = () => {
    const cur = parseFloat(bidInput) || 0;
    setBidInput((cur + 1).toFixed(2));
  };

  const handleSubmit = () => {
    const amount = parseFloat(bidInput);
    if (isNaN(amount) || amount <= 0) {
      setError('Enter a valid bid amount (must be positive)');
      setTimeout(() => setError(''), 3000);
      return;
    }
    const decimalParts = String(bidInput).split('.');
    if (decimalParts.length > 1 && decimalParts[1].length > 2) {
      setError('Bid amount can have at most 2 decimal places');
      setTimeout(() => setError(''), 3000);
      return;
    }

    const cleanBid = parseFloat(amount.toFixed(2)).toString();

    if (!user) {
      try {
        sessionStorage.setItem(`pending_bid_${item.id}`, cleanBid);
      } catch (e) {
        console.error(e);
      }
      navigate('/login', {
        state: {
          from: `/item/${item.id}`,
          bidAmount: cleanBid,
          autoOpenConfirm: true,
        }
      });
      return;
    }

    setPendingBidAmount(parseFloat(cleanBid));
    setShowConfirmModal(true);
  };

  const { setUser } = useAuth();

  const handleConfirmBid = async (phoneNumber, paymentMethod) => {
    if (!pendingBidAmount) return;
    const paymentToUse = paymentMethod || selectedPayment;
    if (paymentMethod && paymentMethod !== selectedPayment) {
      setSelectedPayment(paymentMethod);
    }
    setIsSubmittingBid(true);
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      if (paymentToUse !== 'wallet') {
        const response = await axios.post('/api/payments/chapa/inline/prepare', {
          item_id: item.id,
          amount: pendingBidAmount,
        });
        setInlinePayment({
          txRef: response.data.tx_ref,
          amount: response.data.amount,
          mobile: phoneNumber || user?.phone_number
        });
        return;
      }

      await axios.post('/api/bids/place', {
        item_id: item.id,
        amount: pendingBidAmount,
        payment_method: paymentToUse,
      });
      const actualFee = item?.base_price ?? 1.0;
      if (user && setUser) {
        setUser({ ...user, wallet_balance: Math.max(0, (user.wallet_balance || 0) - actualFee) });
      }
      setSuccess(`Bid of ${pendingBidAmount.toFixed(2)} Br placed!`);
      setLocalBidCount((c) => c + 1);
      clearCachedItems();
      setBidInput('');
      setTimeout(() => setSuccess(''), 3000);
      return { success: true };
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to place bid.');
      setTimeout(() => setError(''), 4000);
      throw err;
    } finally {
      setSubmitting(false);
      setIsSubmittingBid(false);
    }
  };

  const cdColor = isExpired ? 'text-red-500' : countdownColor(item.end_time, isExpired);
  const bidCount = localBidCount;

  return (
    <div className="home-auction-card rounded-[1.75rem] overflow-hidden mb-5">
      {/* Image */}
      <div className="home-card-image relative">
        <Link to={`/item/${item.id}`}>
          {item.image_url ? (
            <img
              src={optimizeImageUrl(item.image_url, { width: 600 })}
              alt={item.title}
              loading="lazy"
              decoding="async"
              className="w-full h-56 sm:h-64 object-cover"
            />
          ) : (
            <div className="w-full h-56 sm:h-64 flex items-center justify-center text-zinc-700">
              <Tag size={48} className="opacity-30" />
            </div>
          )}
        </Link>

        {/* Category badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/75 backdrop-blur-md text-amber-300 text-[10px] font-black px-2.5 py-1 rounded-lg border border-amber-500/60 shadow-lg">

          {item.category || 'Auction'}
        </div>


      </div>

      {/* Body */}
      <div className="home-card-body p-4 space-y-3">
        <Link to={`/item/${item.id}`}>
          <h2 className="text-lg font-black text-white leading-snug hover:text-amber-400 transition-colors">
            {item.title}
          </h2>
        </Link>

        <div className="text-center">
          <span className={`text-xl font-black font-outfit ${isExpired ? 'text-red-500' : cdColor}`}>
            {isExpired ? (t.expired || 'Ended') : countdown}
          </span>
          
        </div>

        {/* Bid Fee & Bid Count */}
        <div className="grid grid-cols-2 gap-2">
          <div className="home-card-panel flex gap-1 rounded-xl p-2 flex-col">
            <div className="flex items-center gap-1 flex-row">
              <Coins size={13} className="text-amber-400 shrink-0" />
              <p className="text-[10px] text-amber-400 font-bold">{t.bidFee}</p>
            </div>
            <p className="text-xs sm:text-sm font-black text-white font-mono">
              {(item.base_price || 0).toFixed(2)} Br
            </p>
          </div>

          <div className="home-card-panel flex gap-1 rounded-xl p-2 flex-col">
            <div className="flex items-center gap-1 flex-row">
              <Ticket size={13} className="text-amber-400 shrink-0" />
              <p className="text-[10px] text-amber-400 font-bold">{t.bids}</p>
            </div>
            <p className="text-xs sm:text-sm font-black text-white font-mono">{bidCount}</p>
          </div>
        </div>

        {/* Bid input + submit */}
        {!isExpired ? (
          <>
            <div className="home-bid-input flex items-center rounded-xl overflow-hidden">
              <button
                onClick={handleDecrement}
                className="w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors shrink-0"
                aria-label="Decrease"
              >
                <Minus size={15} />
              </button>
              <input
                type="number"
                value={bidInput}
                onFocus={() => setIsBidInputFocused(true)}
                onBlur={() => setTimeout(() => setIsBidInputFocused(false), 200)}
                onKeyDown={(e) => {
                  if (['-', '+', 'e', 'E'].includes(e.key)) {
                    e.preventDefault();
                  }
                }}
                onChange={(e) => setBidInput(sanitizeBidAmount(e.target.value))}
                placeholder={t.bidAmount}
                min="0.01"
                step="0.01"
                className="flex-1 bg-transparent text-center text-white text-[16px] font-bold placeholder-zinc-500 focus:outline-none py-2 placeholder:text-sm
                "
                style={{ fontSize: '16px' }}
              />
              <button
                onClick={handleIncrement}
                className="w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors shrink-0"
                aria-label="Increase"
              >
                <Plus size={15} />
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs text-red-400 font-bold bg-red-950/50 border border-red-500/30 rounded-xl px-2.5 py-1.5">
                <AlertCircle size={13} /> {error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold bg-emerald-950/50 border border-emerald-500/30 rounded-xl px-2.5 py-1.5">
                <CheckCircle2 size={13} /> {success}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-amber-600 font-bold hover:brightness-110 text-black rounded-xl font-black text-xs uppercase tracking-wider shadow-md shadow-amber-500/10 transition-all active:scale-[0.98] flex justify-center items-center gap-2"
            >
              {submitting ? (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : t.submitBid}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-500 font-bold">
              <Info size={11} className="text-green-400" />
              {t.terms}
            </div>
          </>
        ) : (
          <Link
            to={`/item/${item.id}`}
            className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-amber-600 hover:brightness-110 text-black rounded-2xl font-black text-xs uppercase tracking-wider shadow-md shadow-amber-500/10 transition-all active:scale-[0.98] flex justify-center items-center gap-2"
          >
            {t.viewDetails} <ChevronRight size={16} />
          </Link>
        )}
      </div>
      <ConfirmBidModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setInlinePayment(null);
        }}
        onConfirm={handleConfirmBid}
        itemTitle={item.title}
        bidAmount={pendingBidAmount}
        bidFee={item.base_price || 0}
        selectedPayment={selectedPayment}
        onSelectPayment={setSelectedPayment}
        isSubmitting={isSubmittingBid}
        inlinePayment={inlinePayment}
        mobile={inlinePayment?.mobile || user?.phone_number}
        onInlineClose={(msg) => {
          setInlinePayment(null);
          if (msg && typeof msg === 'string') {
            setError(msg);
            setTimeout(() => setError(''), 4500);
          }
        }}
        onInlineSuccess={async ({ txRef, chapaRef }) => {
          await axios.post('/api/payments/chapa/inline/complete', { tx_ref: txRef, chapa_ref: chapaRef });
          setLocalBidCount((count) => count + 1);
          setBidInput('');
          setSuccess(`Bid of ${pendingBidAmount?.toFixed(2) || ''} Br placed!`);
          setTimeout(() => setSuccess(''), 4000);
        }}
      />
      {checkoutUrl && (
        <ChapaEmbeddedModal
          checkoutUrl={checkoutUrl}
          onClose={() => setCheckoutUrl(null)}
          onSuccess={() => {
            setBidInput('');
            setLocalBidCount((count) => count + 1);
            setPendingBidAmount(null);
            setTimeout(() => {
              setCheckoutUrl(null);
              navigate('/my-bids');
            }, 1000);
          }}
          onFailure={({ message }) => setError(message || 'Payment was not completed.')}
        />
      )}
    </div>
  );
};

/* Custom Sleek Filter Dropdown Component */
const FilterDropdown = ({
  id,
  label,
  icon: Icon,
  isActive,
  isOpen,
  onToggle,
  options,
  selectedValue,
  onSelect,
  align = 'left',
  isLight,
  dropdownTitle,
}) => {
  const getAlignClass = () => {
    if (align === 'left') return 'left-0';
    if (align === 'center') return 'left-1/2 -translate-x-1/2';
    return 'right-0';
  };

  return (
    <div className={`relative min-w-0 ${isOpen ? 'z-[130]' : 'z-10'}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={onToggle}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full rounded-xl sm:rounded-2xl border transition-all duration-200 min-w-0 flex items-center justify-between px-2.5 sm:px-3 py-2 sm:py-2.5 cursor-pointer select-none active:scale-[0.98] ${isOpen
          ? isLight
            ? 'bg-amber-50/90 border-amber-500 text-amber-900 shadow-md ring-2 ring-amber-400/40'
            : 'bg-[#1C1E28] border-amber-500/80 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.25)] ring-2 ring-amber-500/50'
          : isActive
            ? isLight
              ? 'bg-amber-50 border-amber-400/70 text-amber-900 shadow-xs ring-1 ring-amber-400/30 font-bold'
              : 'bg-gradient-to-r from-amber-500/20 via-amber-500/15 to-amber-600/20 border-amber-500/60 text-amber-300 shadow-[0_0_16px_rgba(245,158,11,0.2)] ring-1 ring-amber-500/40 font-bold'
            : isLight
              ? 'bg-white hover:bg-zinc-50 border-zinc-200/90 text-zinc-700 shadow-xs'
              : 'bg-[#15171E] hover:bg-[#1B1E28] border-zinc-800/90 hover:border-zinc-700/80 text-zinc-300 hover:text-white shadow-md shadow-black/30'
          }`}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <Icon
            size={13}
            className={`shrink-0 transition-colors ${isActive || isOpen
              ? 'text-amber-400'
              : isLight
                ? 'text-zinc-500'
                : 'text-zinc-400'
              }`}
          />
          <span className="text-[11px] sm:text-xs font-bold truncate">
            {label}
          </span>
        </div>
        <ChevronDown
          size={12}
          className={`shrink-0 transition-transform duration-200 ml-1 ${isOpen ? 'rotate-180 text-amber-400' : isActive ? 'text-amber-400' : isLight ? 'text-zinc-400' : 'text-zinc-500'
            }`}
        />
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          className={`absolute top-full mt-2 ${getAlignClass()} w-56 sm:w-60 max-w-[calc(100vw-24px)] rounded-2xl p-1.5 shadow-2xl backdrop-blur-2xl border transition-all z-[140] animate-in fade-in zoom-in-95 duration-150 ${isLight
            ? 'bg-white/98 border-zinc-200 shadow-2xl shadow-zinc-900/15'
            : 'bg-[#161720]/98 border-zinc-800/90 shadow-[0_16px_48px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.06)]'
            }`}
        >
          {dropdownTitle && (
            <div className={`px-2.5 py-1.5 mb-1 text-[10px] font-black uppercase tracking-wider flex items-center justify-between border-b ${isLight ? 'text-zinc-400 border-zinc-100' : 'text-zinc-400 border-zinc-800/60'
              }`}>
              <span>{dropdownTitle}</span>
              <span className="text-[9px] font-normal lowercase opacity-70">
                {options.length} {options.length === 1 ? 'option' : 'options'}
              </span>
            </div>
          )}

          <div className="space-y-0.5 max-h-[min(340px,calc(100vh-220px))] overflow-y-auto overscroll-contain pr-0.5">
            {options.map((opt) => {
              const isSelected = selectedValue === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => onSelect(opt.value)}
                  className={`w-full flex items-center justify-between gap-2 px-2.5 py-2.5 rounded-xl text-left text-xs transition-all duration-150 active:scale-[0.99] ${isSelected
                    ? isLight
                      ? 'bg-amber-500/15 text-amber-900 font-black border border-amber-400/40 shadow-xs'
                      : 'bg-amber-500/15 text-amber-300 font-black border border-amber-500/40 shadow-xs'
                    : isLight
                      ? 'text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 active:bg-zinc-200 font-semibold'
                      : 'text-zinc-300 hover:text-white hover:bg-zinc-800/60 active:bg-zinc-800 font-semibold'
                    }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {opt.icon && (
                      <span className={`shrink-0 ${isSelected ? 'text-amber-400' : 'text-zinc-400'}`}>
                        {opt.icon}
                      </span>
                    )}
                    <span className="truncate">{opt.label}</span>
                  </div>

                  {isSelected && (
                    <span className={`flex items-center justify-center w-4 h-4 rounded-full shrink-0 ${isLight ? 'bg-amber-500 text-white' : 'bg-amber-400 text-black'
                      }`}>
                      <Check size={10} strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

/* Home Page */
const Home = () => {
  const { lang } = useLanguage();
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const cached = getCachedItems();
  const [items, setItems] = useState(cached || []);
  const [loading, setLoading] = useState(!cached);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [openDropdown, setOpenDropdown] = useState(null); // 'time' | 'price' | 'category' | null
  const filtersContainerRef = useRef(null);
  const { user, socket } = useAuth();
  const themeContext = useTheme();
  const isLight =
    themeContext?.theme === 'light' ||
    (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'light');
  const navigate = useNavigate();
  const location = useLocation();

  // Close dropdown on outside click or escape key
  useEffect(() => {
    if (!openDropdown) return;
    const handleClickOutside = (e) => {
      if (filtersContainerRef.current && !filtersContainerRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setOpenDropdown(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openDropdown]);

  const timeFilterLabels = {
    all: t.filterTime || 'Time',
    '2days': t.endingIn2Days || 'Ending in 2 days',
    '5days': t.endingIn5Days || 'Ending in 5 days',
    '15days': t.endingIn15Days || 'Ending in 15 days',
    ended: t.endedOption || t.expired || 'Ended',
  };

  const priceFilterLabels = {
    all: t.filterPrice || 'Price',
    low_to_high: t.lowestToHighest || 'Lowest to Highest',
    high_to_low: t.highestToLowest || 'Highest to Lowest',
  };

  const categoryFilterLabel = categoryFilter === 'all' ? (t.filterCategory || 'Category') : categoryFilter;

  const itemsRef = useRef(null);
  const handleScrollToItems = () => {
    itemsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const fetchItems = useCallback(async (silent = false) => {
    try {
      if (!silent && !getCachedItems()) setLoading(true);
      const res = await axios.get('/api/items', {
        headers: { 'Cache-Control': 'no-cache' }
      });
      setCachedItems(res.data);
      setItems(res.data);
    } catch (err) {
      console.error('Error fetching items:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch when entering/returning to Home route
  useEffect(() => {
    fetchItems(true);
  }, [location.key, fetchItems]);

  // Also re-fetch when browser window/tab gains focus
  useEffect(() => {
    const handleFocus = () => {
      fetchItems(true);
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchItems]);

  useEffect(() => {
    let activeSocket = socket;
    let createdSocket = null;
    if (!activeSocket) {
      createdSocket = io();
      activeSocket = createdSocket;
    }
    const handleBidUpdate = (data) => {
      if (data?.item_id) {
        const targetId = Number(data.item_id);
        setItems((prev) =>
          prev.map((item) => {
            if (Number(item.id) === targetId) {
              const cur = item._count?.bids ?? item.bid_count ?? item.bids?.length ?? 0;
              const nextCount = typeof data.total_bids === 'number' ? data.total_bids : cur + 1;
              return {
                ...item,
                bid_count: nextCount,
                _count: { ...(item._count || {}), bids: nextCount },
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

  const categories = [...new Set(items.map((item) => item.category).filter(Boolean))].sort();

  const timeOptions = [
    { value: 'all', label: t.allTimes || 'ALL', icon: <Clock size={13} /> },
    { value: '2days', label: t.endingIn2Days || 'Ending in 2 days', icon: <Clock size={13} className="text-red-400" /> },
    { value: '5days', label: t.endingIn5Days || 'Ending in 5 days', icon: <Clock size={13} className="text-amber-400" /> },
    { value: '15days', label: t.endingIn15Days || 'Ending in 15 days', icon: <Clock size={13} className="text-emerald-400" /> },
    { value: 'ended', label: t.endedOption || t.expired || 'Ended', icon: <CheckCircle2 size={13} className="text-zinc-400" /> },
  ];

  const priceOptions = [
    { value: 'all', label: t.allPrices || 'ALL', icon: <DollarSign size={13} /> },
    { value: 'low_to_high', label: t.lowestToHighest || 'Lowest to Highest', icon: <TrendingUp size={13} className="text-emerald-400" /> },
    { value: 'high_to_low', label: t.highestToLowest || 'Highest to Lowest', icon: <TrendingDown size={13} className="text-purple-400" /> },
  ];

  const categoryOptions = [
    { value: 'all', label: t.allCategories || 'Category (All)', icon: <Grid3X3 size={13} /> },
    ...categories.map((category) => ({
      value: category,
      label: category,
      icon: <Tag size={13} className="text-amber-400/80" />,
    })),
  ];

  const now = Date.now();
  const isItemEnded = (item) => isAuctionEndedEAT(item);

  const filteredItems = items
    .filter((item) => {
      const ended = isItemEnded(item);
      // By default show only active items. If timeFilter is 'ended', show only ended items
      if (timeFilter === 'ended') {
        if (!ended) return false;
      } else {
        if (ended) return false;
      }

      const query = searchQuery.toLowerCase();
      const matchesSearch = item.title.toLowerCase().includes(query) || item.description?.toLowerCase().includes(query);
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      const remaining = getEATRemainingMs(item.end_time);
      const matchesTime =
        timeFilter === 'all' ||
        timeFilter === 'ended' ||
        (timeFilter === '2days' && remaining > 0 && remaining <= 2 * 24 * 60 * 60 * 1000) ||
        (timeFilter === '5days' && remaining > 0 && remaining <= 5 * 24 * 60 * 60 * 1000) ||
        (timeFilter === '15days' && remaining > 0 && remaining <= 15 * 24 * 60 * 60 * 1000);
      return matchesSearch && matchesCategory && matchesTime;
    })
    .sort((a, b) => {
      if (priceFilter === 'low_to_high') {
        return Number(a.base_price || 0) - Number(b.base_price || 0);
      }
      if (priceFilter === 'high_to_low') {
        return Number(b.base_price || 0) - Number(a.base_price || 0);
      }
      // For active items: sorted from shortest time to end to highest remaining time (soonest ending first)
      if (timeFilter !== 'ended') {
        const aTime = parseAuctionDate(a.end_time)?.getTime() ?? Infinity;
        const bTime = parseAuctionDate(b.end_time)?.getTime() ?? Infinity;
        return aTime - bTime;
      }
      // For ended items: most recently ended first
      const aTime = parseAuctionDate(a.end_time)?.getTime() ?? 0;
      const bTime = parseAuctionDate(b.end_time)?.getTime() ?? 0;
      return bTime - aTime;
    });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-amber-500 border-t-transparent" />
        <p className="text-xs font-bold text-zinc-500 animate-pulse">Loading auctions...</p>
      </div>
    );
  }

  return (
    <div className="home-page w-full max-w-lg mx-auto pb-4 sm:pb-8 min-w-0">

      {/* Hero */}
      <HeroSection t={t} onScrollToItems={handleScrollToItems} />

      {/* Search */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1 min-w-0">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full pl-9 pr-4 py-2.5 bg-[#16161A] border border-zinc-800/90 rounded-2xl text-[16px] sm:text-xs font-medium text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all"
            style={{ fontSize: '16px' }}
          />
        </div>
      </div>

      {/* Mobile Backdrop for active dropdown */}
      {openDropdown && (
        <div
          className="fixed inset-0 z-[125] bg-black/40 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-150"
          onClick={() => setOpenDropdown(null)}
          aria-hidden="true"
        />
      )}

      {/* Filters Toolbar */}
      <div ref={filtersContainerRef} className={`relative mb-5 transition-all ${openDropdown ? 'z-[130]' : 'z-30'}`}>
        <div className="grid grid-cols-3 gap-2">
          {/* 1. Time Filter Dropdown */}
          <FilterDropdown
            id="time"
            label={timeFilterLabels[timeFilter] || t.filterTime}
            icon={Clock}
            isActive={timeFilter !== 'all'}
            isOpen={openDropdown === 'time'}
            onToggle={() => setOpenDropdown((prev) => (prev === 'time' ? null : 'time'))}
            options={timeOptions}
            selectedValue={timeFilter}
            onSelect={(val) => {
              setTimeFilter(val);
              setOpenDropdown(null);
            }}
            align="left"
            isLight={isLight}
            dropdownTitle={t.filterTime}
          />

          {/* 2. Price Filter Dropdown */}
          <FilterDropdown
            id="price"
            label={priceFilterLabels[priceFilter] || t.filterPrice}
            icon={DollarSign}
            isActive={priceFilter !== 'all'}
            isOpen={openDropdown === 'price'}
            onToggle={() => setOpenDropdown((prev) => (prev === 'price' ? null : 'price'))}
            options={priceOptions}
            selectedValue={priceFilter}
            onSelect={(val) => {
              setPriceFilter(val);
              setOpenDropdown(null);
            }}
            align="center"
            isLight={isLight}
            dropdownTitle={t.filterPrice}
          />

          {/* 3. Category Filter Dropdown */}
          <FilterDropdown
            id="category"
            label={categoryFilterLabel}
            icon={Grid3X3}
            isActive={categoryFilter !== 'all'}
            isOpen={openDropdown === 'category'}
            onToggle={() => setOpenDropdown((prev) => (prev === 'category' ? null : 'category'))}
            options={categoryOptions}
            selectedValue={categoryFilter}
            onSelect={(val) => {
              setCategoryFilter(val);
              setOpenDropdown(null);
            }}
            align="right"
            isLight={isLight}
            dropdownTitle={t.filterCategory}
          />
        </div>

        {/* Active Filter Chips / Clear button */}
        {(timeFilter !== 'all' || priceFilter !== 'all' || categoryFilter !== 'all' || searchQuery) && (
          <div className="flex items-center justify-between mt-2.5 px-1 text-xs">
            <span className="text-[11px] font-medium text-zinc-400">
              {filteredItems.length} {t.showingResults || 'results found'}
            </span>
            <button
              type="button"
              onClick={() => {
                setTimeFilter('all');
                setPriceFilter('all');
                setCategoryFilter('all');
                setSearchQuery('');
                setOpenDropdown(null);
              }}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 transition-colors"
            >
              <X size={12} /> {t.clearFilters || 'Clear filters'}
            </button>
          </div>
        )}
      </div>

      {/* Products */}
      <div ref={itemsRef}>
        {filteredItems.length === 0 ? (
          <div className="text-center py-16 text-zinc-500 text-sm font-bold">
            {timeFilter === 'ended'
              ? t.noEndedItems || 'No concluded auctions yet.'
              : t.noItems || 'No active auctions at the moment.'}
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

      {/* Floating Support & Social Media Button (Home Page Only) */}
      <HomeSupportButton />
    </div>
  );
};

export default Home;
