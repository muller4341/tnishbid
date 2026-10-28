import React, { useState, useEffect, useMemo, useCallback, useRef, memo, lazy } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import telebirrLogo from '../assets/telebirr.png';
import cbeLogo from '../assets/cbe.png';
import ChapaEmbeddedModal from '../components/ChapaEmbeddedModal';
import { ConfirmBidModal } from '../components/BidPaymentModal';
import { optimizeImageUrl } from '../utils/imageOptimizer';
import { clearCachedItems } from '../utils/cache';
import { formatEATTimeLeft, isAuctionEndedEAT, formatEATDateTime } from '../utils/timezone';
import {
  ArrowLeft,
  Share2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Tag,
  Smartphone,
  Plus,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Wifi,
  Signal,
  Battery,
  ShieldCheck,
  Info,
  TrendingDown,
  Lock,
  User,
  Trophy,
  ChevronDown,
  ChevronUp,
  X,
  Gavel,
  Package,
  Receipt,
  DollarSign,
  Wallet,
  Phone
} from 'lucide-react';

const BidderAvatar = React.memo(({ src, alt }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    return (
      <div className="w-10 h-10 rounded-full border border-zinc-800 bg-zinc-800/80 flex items-center justify-center text-zinc-300 shrink-0 shadow-sm">
        <User size={20} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className="w-10 h-10 rounded-full object-cover border border-zinc-800 bg-zinc-900 shrink-0"
      onError={() => setHasError(true)}
    />
  );
});

// Component to Render Dynamic Sub-Titles & Descriptions
const RenderDescriptionSections = memo(({ description }) => {
  if (!description) return null;

  let sections = [];
  try {
    const parsed = JSON.parse(description);
    if (Array.isArray(parsed) && parsed.length > 0) {
      sections = parsed;
    } else {
      sections = [{ title: 'Overview', description: description }];
    }
  } catch {
    sections = [{ title: 'Overview', description: description }];
  }

  const validSections = sections.filter(s => (s.title && s.title.trim()) || (s.description && s.description.trim()));
  if (validSections.length === 0) return null;

  return (
    <div className="bg-[#141519] border border-zinc-800/90 rounded-3xl p-5 shadow-xl space-y-4 mt-4">
      <h3 className="font-serif font-black text-base text-white tracking-tight flex items-center justify-center gap-2 border-b border-zinc-800 pb-3">
        <Info className="text-amber-400" size={18} />
        Product Specifications & Details
      </h3>

      {/* Single Unified Container for all Sub-Titles & Descriptions */}
      <div className="bg-[#0E0F12] rounded-2xl border border-zinc-800/70 divide-y divide-zinc-800/60 text-xs overflow-hidden">
        {validSections.map((sec, idx) => (
          <div key={idx} className="flex flex-row items-center justify-between p-3.5 gap-3">
            {/* Subtitle - Left-aligned so multi-line titles start at the same left margin as single-line titles */}
            <div className="w-1/3 min-w-[100px] font-bold text-amber-400 text-xs flex items-center justify-start text-left shrink-0 self-center">
              <span className="w-full text-left break-words">{sec.title || 'Detail'}</span>
            </div>

            {/* Description - Full justified alignment so all line endings align except the last line */}
            <div
              className="flex-1 text-xs text-zinc-200 min-w-0"
              style={{
                textAlign: 'justify',
                textJustify: 'inter-word',
                textAlignLast: 'left',
                WebkitTextAlignLast: 'left'
              }}
            >
              <div className="font-medium leading-relaxed whitespace-pre-line break-words">
                {sec.description || 'N/A'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

// Animated Multi-Image Carousel Component
const ProductGalleryCarousel = memo(({ item, badgeText, badgeColorClass }) => {
  const primaryImage = item?.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600';
  const categoryLabel = (item?.category || 'ELECTRONICS').toUpperCase();
  const title = item?.title || 'Auction Item';

  // Construct image gallery array (custom item.images or generated complementary angles)
  const images = useMemo(() => {
    let allImgs = [];
    if (primaryImage) allImgs.push(primaryImage);
    if (item?.images && Array.isArray(item.images) && item.images.length > 0) {
      allImgs = [...allImgs, ...item.images];
    }
    const uniqueImgs = Array.from(new Set(allImgs.filter(Boolean)));
    if (uniqueImgs.length > 1) {
      return uniqueImgs;
    }
    // High-resolution multi-angle preset images based on title/category
    return [
      primaryImage,
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&q=80&w=600'
    ];
  }, [item, primaryImage]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Auto animation slide effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [images.length]);

  const handleNext = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
      setIsTransitioning(false);
    }, 150);
  }, [images.length]);

  const handlePrev = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
      setIsTransitioning(false);
    }, 150);
  }, [images.length]);

  const handleSelect = useCallback((idx) => {
    if (idx === currentIndex) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(idx);
      setIsTransitioning(false);
    }, 150);
  }, [currentIndex, images.length]);

  return (
    <div className="space-y-3">
      {/* Main Image Frame with Smooth Fade & Scale Animation */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-[#16171D] to-[#0A0B0E] border border-zinc-800/80 shadow-2xl group select-none">
        <img
          src={optimizeImageUrl(images[currentIndex], { width: 800 })}
          alt={`${title} - Angle ${currentIndex + 1}`}
          loading="lazy"
          decoding="async"
          className={`w-full h-64 md:h-72 object-cover object-center transition-all duration-500 transform ${isTransitioning ? 'opacity-40 scale-95 blur-xs' : 'opacity-100 scale-100'
            }`}
        />

        {/* Category Pill Tag */}
        <span className="absolute top-4 left-4 bg-black/70 backdrop-blur-md text-zinc-200 border border-zinc-700/80 font-bold text-[10px] tracking-wider px-3 py-1 rounded-full uppercase z-10">
          {categoryLabel}
        </span>

       

        {/* Left Navigation Arrow */}
        <button
          type="button"
          onClick={handlePrev}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-amber-500 hover:text-black text-white flex items-center justify-center backdrop-blur-md border border-zinc-700/50 transition-all opacity-80 group-hover:opacity-100 active:scale-90 cursor-pointer z-20"
          aria-label="Previous Image"
        >
          <ChevronLeft size={20} />
        </button>

        {/* Right Navigation Arrow */}
        <button
          type="button"
          onClick={handleNext}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-amber-500 hover:text-black text-white flex items-center justify-center backdrop-blur-md border border-zinc-700/50 transition-all opacity-80 group-hover:opacity-100 active:scale-90 cursor-pointer z-20"
          aria-label="Next Image"
        >
          <ChevronRight size={20} />
        </button>

        {/* Overlay Pagination Indicators */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full z-20">
          {images.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelect(idx)}
              className={`transition-all duration-300 rounded-full cursor-pointer ${currentIndex === idx
                ? 'w-5 h-2 bg-amber-400 shadow-sm'
                : 'w-2 h-2 bg-zinc-600 hover:bg-zinc-400'
                }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>


      </div>

      {/* Interactive Thumbnail Gallery Row */}
      <div className="flex items-center justify-between gap-2.5 px-1">
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none ml-10">
          {images.map((img, idx) => {
            const isActive = currentIndex === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelect(idx)}
                className={`relative rounded-xl overflow-hidden border-2 transition-all duration-300 cursor-pointer shrink-0 ${isActive
                  ? 'border-amber-500 ring-2 ring-amber-500/30 scale-105 shadow-md shadow-amber-500/20'
                  : 'border-zinc-800/90 opacity-60 hover:opacity-100 hover:border-zinc-600'
                  }`}
              >
                <img
                  src={optimizeImageUrl(img, { width: 120, height: 120 })}
                  alt={`Thumbnail ${idx + 1}`}
                  loading="lazy"
                  decoding="async"
                  className="w-12 h-12 md:w-14 md:h-14 object-cover"
                />
                {isActive && (
                  <span className="absolute inset-0 bg-amber-400/10 pointer-events-none"></span>
                )}
              </button>
            );
          })}
        </div>

        {/* Share Button (Right Side) */}
        <button
          type="button"
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: title, url: window.location.href }).catch(() => { });
            } else {
              navigator.clipboard.writeText(window.location.href);
            }
          }}
          className="w-9 h-9 rounded-full bg-[#141519] border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white transition-colors shrink-0 cursor-pointer shadow-md"
          aria-label="Share"
        >
          <Share2 size={16} />
        </button>
      </div>
    </div>
  );
});

// Mask Phone Number Helper Function (e.g. 0978xxxx90)
const maskPhoneNumber = (phone) => {
  if (!phone) return '0978xxxx90';
  let str = String(phone).replace(/\D/g, '');
  if (str.startsWith('251')) {
    str = '0' + str.slice(3);
  }
  if (str.startsWith('0') && str.length >= 10) {
    const prefix = str.slice(0, 4); // First 2 digits after 09 -> e.g. "0978"
    const suffix = str.slice(-2);   // Last 2 digits -> e.g. "90"
    return `${prefix}xxxx${suffix}`;
  }
  if (str.length >= 8) {
    const prefix = '09' + str.slice(0, 2);
    const suffix = str.slice(-2);
    return `${prefix}xxxx${suffix}`;
  }
  return '0978xxxx90';
};

// Sanitize bid input: non-negative and maximum 2 decimal places
const sanitizeBidAmount = (val) => {
  if (val === '' || val === null || val === undefined) return '';
  let cleaned = String(val).replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    cleaned = parts[0] + '.' + parts.slice(1).join('');
  }
  if (parts.length > 1 && parts[1].length > 2) {
    cleaned = `${parts[0]}.${parts[1].slice(0, 2)}`;
  }
  return cleaned;
};

// Falling Confetti & Sparkles Celebration Component
const ConfettiCelebration = memo(() => {
  const particles = useMemo(() => {
    const colors = ['#F59E0B', '#10B981', '#6366F1', '#EC4899', '#3B82F6', '#FBBF24', '#F43F5E', '#8B5CF6'];
    return Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: colors[i % colors.length],
      width: Math.random() * 8 + 6,
      height: Math.random() * 14 + 8,
      duration: Math.random() * 3 + 2.5,
      delay: Math.random() * 3,
      rotate: Math.random() * 360,
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      <style>{`
        @keyframes confettiFlyDown {
          0% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(105vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-sm shadow-sm"
          style={{
            left: `${p.left}%`,
            top: `-20px`,
            width: `${p.width}px`,
            height: `${p.height}px`,
            backgroundColor: p.color,
            animation: `confettiFlyDown ${p.duration}s linear infinite`,
            animationDelay: `${p.delay}s`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
});

// Helper functions and translations for Expired / Concluded Auctions
const formatHumanDateTime = (dateStr) => {
  return formatEATDateTime(dateStr);
};

const getNetBid = (amt, basePrice = 0) => {
  const a = parseFloat(amt || 0);
  const bp = parseFloat(basePrice || 0);
  if (bp > 0 && a >= bp) {
    const net = parseFloat((a - bp).toFixed(2));
    return net > 0 ? net : parseFloat(a.toFixed(2));
  }
  return parseFloat(a.toFixed(2));
};

const EXPIRED_TRANSLATIONS = {
  en: {
    bidFee: 'Bid fee',
    totalBids: 'Total bids',
    uniqueAmounts: 'Unique amounts',
    byAmount: 'By amount',
    mostPicked: 'Most picked',
    showWinningAmount: 'Show winning amount',
    bids: 'bids',
    players: 'players',
    unique: 'Unique',
    notUnique: 'Not unique',
    noWinner: 'No Winner',
    noUniqueBid: 'No unique bid found in this draw'
  },
  am: {
    bidFee: 'የጨረታ ክፍያ',
    totalBids: 'ጠቅላላ ጨረታዎች',
    uniqueAmounts: 'ልዩ መጠኖች',
    byAmount: 'በመጠን ቅደም ተከተል',
    mostPicked: 'በብዛት የተመረጡ',
    showWinningAmount: 'አሸናፊውን መጠን አሳይ',
    bids: 'ጨረታዎች',
    players: 'ተሳታፊዎች',
    unique: 'ልዩ',
    notUnique: 'የተደገመ',
    noWinner: 'አሸናፊ የለም',
    noUniqueBid: 'በዚህ ዕጣ ውስጥ ልዩ ጨረታ አልተገኘም'
  }
};

// Expired / Settled Auction Component matching Draws.jsx breakdown
const ExpiredAuctionView = ({ item, user }) => {
  const themeContext = useTheme();
  const isLight =
    themeContext?.theme === 'light' ||
    (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'light');

  let lang = 'en';
  try {
    const langCtx = useLanguage();
    if (langCtx?.lang) lang = langCtx.lang;
  } catch (e) {
    lang = 'en';
  }
  const t = EXPIRED_TRANSLATIONS[lang] || EXPIRED_TRANSLATIONS.en;

  const [sortBreakdownBy, setSortBreakdownBy] = useState('amount'); // 'amount' | 'most_picked'
  const [selectedAmountData, setSelectedAmountData] = useState(null);
  const [isWinningHighlighted, setIsWinningHighlighted] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const winningRowRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3200);
  };

  const isLUB = item?.pool_type === 'lub' || item?.pool_type === 'premium';
  const basePrice = parseFloat(item?.base_price || 0);

  const allBids = useMemo(() => {
    if (!item?.bids || !Array.isArray(item.bids)) return [];
    return [...item.bids];
  }, [item]);

  // Group bids by exact amount & determine lowest unique bid or highest bid
  const { amountBreakdown, winnerUser, winningAmount, winningBid } = useMemo(() => {
    if (!allBids || allBids.length === 0) {
      return { amountBreakdown: [], winnerUser: null, winningAmount: null, winningBid: null };
    }

    const grouped = {};
    allBids.forEach((b) => {
      const netVal = isLUB ? getNetBid(b.amount, basePrice) : parseFloat(parseFloat(b.amount).toFixed(2));
      const amtKey = netVal.toFixed(2);
      if (!grouped[amtKey]) {
        grouped[amtKey] = {
          amount: parseFloat(amtKey),
          bids: [],
          userIds: new Set()
        };
      }
      grouped[amtKey].bids.push({
        id: b.id,
        user_id: b.user_id,
        masked_phone: maskPhoneNumber(b.user?.phone_number || b.phone_number),
        created_at: b.created_at,
        user: b.user,
        amount: b.amount
      });
      if (b.user_id) grouped[amtKey].userIds.add(b.user_id);
    });

    let winUser = null;
    let winAmt = null;
    let winB = null;

    if (isLUB) {
      const uniqueKeys = Object.keys(grouped).filter((k) => grouped[k].bids.length === 1);
      if (uniqueKeys.length > 0) {
        uniqueKeys.sort((a, b) => parseFloat(a) - parseFloat(b));
        const lowestUniqueKey = uniqueKeys[0];
        winAmt = parseFloat(lowestUniqueKey);
        winB = grouped[lowestUniqueKey].bids[0];
        const winUid = winB.user_id || winB.user?.id;
        winUser = winB.user || (item?.winner && item.winner.id === winUid ? item.winner : null) || { id: winUid };
      }
    } else {
      const sortedKeys = Object.keys(grouped).sort((a, b) => parseFloat(b) - parseFloat(a));
      if (sortedKeys.length > 0) {
        const highestKey = sortedKeys[0];
        winAmt = parseFloat(highestKey);
        winB = grouped[highestKey].bids[0];
        const winUid = winB.user_id || winB.user?.id;
        winUser = winB.user || (item?.winner && item.winner.id === winUid ? item.winner : null) || { id: winUid };
      }
    }

    // Match item.winner_id if available ONLY if no winning bid was found above
    if (!winB && item?.winner_id) {
      const found = allBids.find((b) => b.user_id === item.winner_id);
      if (found) {
        winB = found;
        winAmt = isLUB ? getNetBid(found.amount, basePrice) : parseFloat(found.amount);
        winUser = found.user || item?.winner;
      }
    }

    const breakdown = Object.keys(grouped).map((amtKey) => {
      const g = grouped[amtKey];
      return {
        amount: g.amount,
        amountFormatted: `${g.amount.toFixed(2)} ETB`,
        bidsCount: g.bids.length,
        playersCount: g.userIds.size,
        isUnique: g.bids.length === 1,
        isWinning: winAmt !== null && Math.abs(g.amount - winAmt) < 0.001,
        bids: g.bids.map((b, idx) => ({
          ...b,
          index: idx + 1
        }))
      };
    });

    breakdown.sort((a, b) => a.amount - b.amount);

    return {
      amountBreakdown: breakdown,
      winnerUser: winUser,
      winningAmount: winAmt,
      winningBid: winB
    };
  }, [allBids, item, isLUB, basePrice]);

  const sortedAmountBreakdown = useMemo(() => {
    if (!amountBreakdown || amountBreakdown.length === 0) return [];
    const list = [...amountBreakdown];
    if (sortBreakdownBy === 'most_picked') {
      list.sort((a, b) => Number(b.bidsCount) - Number(a.bidsCount) || Number(a.amount) - Number(b.amount));
    } else {
      list.sort((a, b) => Number(a.amount) - Number(b.amount));
    }
    return list;
  }, [amountBreakdown, sortBreakdownBy]);

  const maxBidsPerAmount = useMemo(() => {
    return amountBreakdown.length > 0 ? Math.max(...amountBreakdown.map((a) => a.bidsCount)) : 1;
  }, [amountBreakdown]);

  const uniqueAmountsCount = useMemo(() => {
    return amountBreakdown.filter((a) => a.isUnique).length;
  }, [amountBreakdown]);

  const winnerPhone = maskPhoneNumber(winnerUser?.phone_number || winningBid?.user?.phone_number);

  // Strictly check if the currently logged-in user is the actual winner of this auction
  const isCurrentUserWinner = useMemo(() => {
    if (!user || (!winnerUser && !winningBid)) return false;

    const normalizePhoneDigits = (p) => {
      if (!p) return '';
      const str = String(p).replace(/\D/g, '');
      return str.length >= 9 ? str.slice(-9) : str;
    };

    const userPhone = normalizePhoneDigits(user.phone_number || user.phone);
    const winPhone = normalizePhoneDigits(winnerUser?.phone_number || winningBid?.user?.phone_number);

    // If both have phone numbers, phone equality is definitive
    if (userPhone && winPhone) {
      return userPhone === winPhone;
    }

    // Check user ID match against winning bid or winning user
    const winningUid = winningBid?.user_id || winningBid?.user?.id || winnerUser?.id;
    if (user.id && winningUid) {
      return String(user.id) === String(winningUid);
    }

    return false;
  }, [user, winnerUser, winningBid]);

  const handleScrollToWinningAmount = () => {
    const hasWinner = Boolean(winnerUser && amountBreakdown.some((r) => r.isWinning));
    if (!hasWinner) {
      showToast(t.noUniqueBid || 'No unique bid found in this draw');
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
    <div className="space-y-4 relative">
      {/* Celebratory Confetti Animation Overlay ONLY for the actual winner */}
      {isCurrentUserWinner && <ConfettiCelebration />}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[150] px-4 py-2.5 rounded-2xl bg-zinc-900/95 text-amber-400 border border-amber-500/40 shadow-2xl backdrop-blur-md flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top duration-300 pointer-events-none">
          <Info size={16} className="text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Winner Announcement Card */}
      <div className={`border rounded-3xl p-6 md:p-7 shadow-2xl relative overflow-hidden ${
        isLight ? 'bg-white border-zinc-200' : 'bg-[#16161A] border-zinc-800/90'
      }`}>
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col items-center text-center space-y-4 relative z-10">
          {/* Glowing Animated Trophy Badge */}
          <div className="relative">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 blur-md opacity-70 animate-pulse" />
            <div className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 text-black flex items-center justify-center shadow-xl font-black">
              <Trophy size={34} />
            </div>
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border border-amber-400/40 rounded-full text-[10px] font-black uppercase text-amber-300 tracking-wider shadow-sm">
              <Sparkles size={12} className="text-amber-400" />
              AUCTION CLOSED & WINNER DECLARED
            </span>

            {isCurrentUserWinner ? (
              <h2 className="text-2xl md:text-3xl font-serif font-black bg-gradient-to-r from-yellow-100 via-amber-300 to-yellow-400 bg-clip-text text-transparent pt-1 tracking-tight">
                🎉 Congratulations! You Won This Auction!
              </h2>
            ) : winnerUser ? (
              <h2 className={`text-xl md:text-2xl font-serif font-black pt-1 tracking-tight ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                Auction Winner: <span className="text-amber-400 font-mono">{winnerPhone}</span>
              </h2>
            ) : (
              <h2 className={`text-xl md:text-2xl font-serif font-black pt-1 tracking-tight ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                {t.noWinner}
              </h2>
            )}
          </div>

          {/* Winner Details Card */}
          {winnerUser ? (
            <div className={`w-full border rounded-2xl p-4 md:p-5 grid grid-cols-2 gap-4 text-left shadow-2xl backdrop-blur-md relative overflow-hidden ${
              isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-[#0A0B0E]/90 border-zinc-800/90'
            }`}>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <Smartphone size={13} className="text-amber-400" />
                  <p className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">Winner Phone</p>
                </div>
                <p className="text-sm md:text-base font-mono font-black text-amber-400 tracking-wider bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-xl inline-block shadow-sm">
                  {winnerPhone}
                </p>
              </div>

              <div className="text-right space-y-1">
                <div className="flex items-center justify-end gap-1.5">
                  <Trophy size={13} className="text-emerald-400" />
                  <p className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">Winning Bid</p>
                </div>
                <p className="text-base md:text-lg font-mono font-black text-emerald-400 tracking-tight drop-shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                  {winningAmount !== null ? `${winningAmount.toFixed(2)} ETB` : '0.00 ETB'}
                </p>
                <span className="inline-block text-[9.5px] font-bold text-amber-300 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-400/30 px-2.5 py-0.5 rounded-md shadow-sm">
                  {item?.pool_type === 'open' ? 'Highest Bid' : 'Lowest Unique Bid'}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-zinc-400">
              {t.noUniqueBid}
            </p>
          )}
        </div>
      </div>

      {/* Number Breakdown Section matching Screenshot 2 / Draws.jsx */}
      <div className="space-y-3 pt-1">
        {/* 3 Stat Pills matching Screenshot 2 */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className={`border rounded-xl p-2.5 space-y-0.5 ${
            isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-[#161720] border-zinc-800/80'
          }`}>
            <p className="text-[10px] text-zinc-400 font-medium">{t.bidFee}</p>
            <p className="text-xs sm:text-sm font-black text-amber-400 truncate">
              {(item?.base_price || 0).toFixed(2)} ETB
            </p>
          </div>

          <div className={`border rounded-xl p-2.5 space-y-0.5 ${
            isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-[#161720] border-zinc-800/80'
          }`}>
            <p className="text-[10px] text-zinc-400 font-medium">{t.totalBids}</p>
            <p className={`text-xs sm:text-sm font-black truncate ${isLight ? 'text-zinc-900' : 'text-white'}`}>
              {item?._count?.bids ?? item?.bid_count ?? allBids.length}
            </p>
          </div>

          <div className={`border rounded-xl p-2.5 space-y-0.5 ${
            isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-[#161720] border-zinc-800/80'
          }`}>
            <p className="text-[10px] text-zinc-400 font-medium">{t.uniqueAmounts}</p>
            <p className={`text-xs sm:text-sm font-black truncate ${isLight ? 'text-zinc-900' : 'text-white'}`}>
              {uniqueAmountsCount}
            </p>
          </div>
        </div>

        {/* Filter Segmented Control & Show Winning Amount Link matching Screenshot 2 */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div
            className={`flex items-center rounded-xl p-0.5 border shrink-0 transition-all ${
              isLight ? 'bg-zinc-100 border-zinc-200' : 'bg-[#101116] border-zinc-800/90'
            }`}
          >
            <button
              type="button"
              onClick={() => setSortBreakdownBy('amount')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
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
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
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
            className={`ml-auto shrink-0 inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold active:scale-95 border transition-all shadow-xs whitespace-nowrap cursor-pointer ${
              winnerUser && amountBreakdown.some((r) => r.isWinning)
                ? 'text-amber-500 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30'
                : 'text-zinc-400 bg-zinc-800/40 hover:bg-zinc-800/70 border-zinc-700/50'
            }`}
          >
            <Trophy size={12} className="shrink-0" />
            <span>{t.showWinningAmount}</span>
          </button>
        </div>

        {/* Amount Rows with Horizontal Bar Fill matching Screenshot 2 */}
        <div className="space-y-2 pt-1 max-h-[500px] overflow-y-auto pr-0.5 no-scrollbar">
          {sortedAmountBreakdown.length === 0 ? (
            <div className={`p-6 border rounded-2xl text-center text-xs font-bold ${
              isLight ? 'bg-zinc-50 border-zinc-200 text-zinc-500' : 'bg-[#0E0F12] border-zinc-800/80 text-zinc-500'
            }`}>
              No bids were placed on this item.
            </div>
          ) : (
            sortedAmountBreakdown.map((row) => {
              const percent = maxBidsPerAmount > 0
                ? Math.max(10, Math.min(100, (row.bidsCount / maxBidsPerAmount) * 100))
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

                  {/* Left label: e.g. 1.00 ETB */}
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

                  {/* Right label: e.g. 2 bids > */}
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
            })
          )}
        </div>
      </div>

      {/* Specific Bid Amount Centered Modal matching Screenshot 3 / Draws.jsx */}
      {selectedAmountData && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
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
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
              <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-black font-black text-sm px-4 py-1.5 rounded-full shadow-md shadow-amber-500/25 font-mono">
                {selectedAmountData.amountFormatted}
              </div>

              <button
                type="button"
                onClick={() => setSelectedAmountData(null)}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
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
              {/* Summary Chips Row */}
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

              {/* Scrollable Bidder List with visible vertical scrollbar */}
              <div className="space-y-2 overflow-y-auto flex-1 overscroll-contain pr-1.5 modal-scrollbar max-h-[58vh]">
                {selectedAmountData.bids && selectedAmountData.bids.length > 0 ? (
                  selectedAmountData.bids.map((b) => (
                    <div
                      key={b.id || b.index}
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
                          {user?.id && b.user_id === user.id && (
                            <span className="text-[8px] font-black px-1.5 py-0.5 bg-emerald-500 text-black rounded uppercase">
                              YOU
                            </span>
                          )}
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

// Payment Option Selection Component (Telebirr, CBE, Wallet) - Compact
const PaymentMethodSelector = memo(({ selectedPayment, onSelectPayment, walletBalance }) => {
  return (
    <div className="space-y-1 text-left animate-in fade-in slide-in-from-top-1 duration-200 mt-2">
      <label className="text-[9.5px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between px-0.5">
        <span>Payment Method</span>
        <span className="text-[8.5px] text-zinc-500 font-normal">Choose option to pay bid fee</span>
      </label>

      <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
        {/* 1. Telebirr */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onSelectPayment('telebirr')}
          className={`py-2 px-1 rounded-xl border transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer relative min-w-0 ${selectedPayment === 'telebirr'
            ? 'bg-sky-950/70 border-sky-400 ring-1 ring-sky-400/40 shadow-sm'
            : 'bg-[#111216] border-zinc-800/80 hover:border-zinc-700 opacity-70 hover:opacity-100'
            }`}
        >
          {selectedPayment === 'telebirr' && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-sky-400"></span>
          )}
          <img src={telebirrLogo} alt="Telebirr" className="h-4.5 sm:h-5.5 max-w-[55px] sm:max-w-[72px] object-contain rounded-xs shrink-0" />
          <span className="text-[9px] xs:text-[10px] font-bold text-white tracking-wide truncate">Telebirr</span>
        </button>

        {/* 2. CBE */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onSelectPayment('cbe')}
          className={`py-2 px-1 rounded-xl border transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer relative min-w-0 ${selectedPayment === 'cbe'
            ? 'bg-purple-950/70 border-purple-400 ring-1 ring-purple-400/40 shadow-sm'
            : 'bg-[#111216] border-zinc-800/80 hover:border-zinc-700 opacity-70 hover:opacity-100'
            }`}
        >
          {selectedPayment === 'cbe' && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-purple-400"></span>
          )}
          <img src={cbeLogo} alt="CBE" className="h-4.5 sm:h-5.5 max-w-[55px] sm:max-w-[72px] object-contain rounded-xs shrink-0" />
          <span className="text-[9px] xs:text-[10px] font-bold text-white tracking-wide truncate">CBE</span>
        </button>

        {/* 3. Wallet */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onSelectPayment('wallet')}
          className={`py-2 px-1 rounded-xl border transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer relative min-w-0 ${selectedPayment === 'wallet'
            ? 'bg-amber-950/70 border-amber-400 ring-1 ring-amber-400/40 shadow-sm'
            : 'bg-[#111216] border-zinc-800/80 hover:border-zinc-700 opacity-70 hover:opacity-100'
            }`}
        >
          {selectedPayment === 'wallet' && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          )}
          <div className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
            <Wallet size={12} />
          </div>
          <span className="text-[9px] xs:text-[10px] font-bold text-white tracking-wide truncate">Wallet</span>
        </button>
      </div>
    </div>
  );
});


const ItemDetails = memo(() => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, socket, setUser } = useAuth();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timeLeft, setTimeLeft] = useState('');

  // Mode for Open Bid Screen: 'detail' | 'place_bid'
  const [viewMode, setViewMode] = useState('detail');

  // Open Pool Increments
  const [selectedIncrement, setSelectedIncrement] = useState(50);
  const [customBidInput, setCustomBidInput] = useState('');

  // Premium LUB Decimal Bid Amount
  const [lubBidAmount, setLubBidAmount] = useState('');

  // Payment method selection ('telebirr' | 'cbe' | 'wallet')
  const [selectedPayment, setSelectedPayment] = useState('telebirr');

  // Input focus tracking states for showing payment selector on focus
  const [isOpenInputFocused, setIsOpenInputFocused] = useState(false);
  const [isLubInputFocused, setIsLubInputFocused] = useState(false);

  // Confirmation Modal Pop-up state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingBidAmount, setPendingBidAmount] = useState(null);
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState(null);
  const [inlinePayment, setInlinePayment] = useState(null);

  // Bids streams
  const [recentBidsStream, setRecentBidsStream] = useState([]);
  const [recentLUBBids, setRecentLUBBids] = useState([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchItemDetails();
  }, [id]);

  // Restore and hold bid amount registered before login (from state or sessionStorage)
  useEffect(() => {
    let savedBid = location.state?.bidAmount;
    if (!savedBid && id) {
      try {
        savedBid = sessionStorage.getItem(`pending_bid_${id}`);
      } catch (e) {
        console.error(e);
      }
    }

    if (savedBid) {
      const parsed = parseFloat(savedBid);
      if (!isNaN(parsed) && parsed > 0) {
        const formatted = parsed.toFixed(2);
        setLubBidAmount(formatted);
        setCustomBidInput(formatted);

        // If user is authenticated and item details are loaded, pop open the confirmation modal directly
        if (user && item && (location.state?.autoOpenConfirm || location.state?.bidAmount)) {
          setPendingBidAmount(parsed);
          setShowConfirmModal(true);

          try {
            sessionStorage.removeItem(`pending_bid_${id}`);
          } catch (e) {
            console.error(e);
          }
        }
      }
    }
  }, [id, user, item, location.state]);

  const fetchItemDetails = async () => {
    try {
      const res = await axios.get(`/api/items/${id}`);
      setItem(res.data);

      if (res.data.bids && res.data.bids.length > 0) {
        // Sort bids desc
        const sortedBids = [...res.data.bids].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setRecentLUBBids(sortedBids);

        // Open Pool Top 3 Bidders Stream
        const formatted = sortedBids.slice(0, 3).map((b, idx) => {
          const isCurrUser = user?.id === b.user_id;
          const rawName = b.user?.name || `User ${b.user_id}`;
          const parts = rawName.split(' ');
          const uName = parts[0] + (parts[1] ? ' ' + parts[1][0] + '.' : '');

          const now = new Date().getTime();
          const bidTime = new Date(b.created_at).getTime();
          const diffSec = Math.max(1, Math.floor((now - bidTime) / 1000));
          let timeAgo = `${diffSec}s ago`;
          if (diffSec >= 60) {
            timeAgo = `${Math.floor(diffSec / 60)}m ago`;
          }

          const prevBid = sortedBids[idx + 1];
          const diffVal = prevBid ? (b.amount - prevBid.amount) : (b.amount - (res.data.base_price || 0));
          const incStr = diffVal > 0 ? `+${diffVal.toLocaleString()} Birr` : `+${b.amount.toLocaleString()} Birr`;

          const localAvatar = localStorage.getItem(`user_avatar_${b.user_id}`);
          const userAvatar = b.user?.avatar || (isCurrUser ? user?.avatar : null) || localAvatar || null;

          return {
            id: b.id,
            name: isCurrUser ? `${uName} (You)` : uName,
            timeAgo,
            amount: b.amount,
            increment: incStr,
            isUser: isCurrUser,
            badge: isCurrUser ? '10X' : null,
            avatar: userAvatar
          };
        });
        setRecentBidsStream(formatted);
      } else {
        setRecentBidsStream([]);
        setRecentLUBBids([]);
      }
    } catch (err) {
      console.error('Error loading item details:', err);
    } finally {
      setLoading(false);
    }
  };

  // Socket live update
  useEffect(() => {
    let activeSocket = socket;
    let createdSocket = null;
    if (!activeSocket) {
      createdSocket = io();
      activeSocket = createdSocket;
    }

    const handleUpdate = (data) => {
      if (!data || Number(data.item_id) !== Number(id)) return;

      const newBid = data.bid || (data.new_bid_amount ? {
        id: Date.now(),
        item_id: Number(id),
        amount: data.new_bid_amount,
        is_unique: data.is_unique,
        created_at: new Date().toISOString(),
        user: null
      } : null);

      setItem(prev => {
        if (!prev) return prev;
        const currentBids = Array.isArray(prev.bids) ? prev.bids : [];
        const alreadyExists = newBid && newBid.id ? currentBids.some(b => b.id === newBid.id) : false;
        const updatedBids = newBid && !alreadyExists ? [newBid, ...currentBids] : currentBids;
        const curCount = prev._count?.bids ?? prev.bid_count ?? currentBids.length ?? 0;
        const nextCount = typeof data.total_bids === 'number'
          ? data.total_bids
          : (alreadyExists ? curCount : curCount + 1);

        return {
          ...prev,
          bids: updatedBids,
          bid_count: nextCount,
          _count: { ...(prev._count || {}), bids: nextCount }
        };
      });

      if (newBid) {
        setRecentLUBBids(prev => {
          const list = Array.isArray(prev) ? prev : [];
          if (newBid.id && list.some(b => b.id === newBid.id)) return list;
          return [newBid, ...list];
        });

        // Update recent bids stream (top 3)
        setRecentBidsStream(prev => {
          const combined = [newBid, ...(Array.isArray(prev) ? prev : [])];
          return combined.slice(0, 3).map((b, idx) => {
            const isCurrUser = user?.id === b.user_id;
            const rawName = b.user?.name || `User ${b.user_id || ''}`;
            const parts = rawName.trim().split(' ');
            const uName = parts[0] + (parts[1] ? ' ' + parts[1][0] + '.' : '');
            const now = new Date().getTime();
            const bidTime = new Date(b.created_at || now).getTime();
            const diffSec = Math.max(1, Math.floor((now - bidTime) / 1000));
            let timeAgo = `${diffSec}s ago`;
            if (diffSec >= 60) {
              timeAgo = `${Math.floor(diffSec / 60)}m ago`;
            }
            const prevBid = combined[idx + 1];
            const diffVal = prevBid ? (b.amount - prevBid.amount) : (b.amount - (item?.base_price || 0));
            const incStr = diffVal > 0 ? `+${diffVal.toLocaleString()} Birr` : `+${b.amount.toLocaleString()} Birr`;
            const localAvatar = b.user_id ? localStorage.getItem(`user_avatar_${b.user_id}`) : null;
            const userAvatar = b.user?.avatar || b.user?.image_url || (isCurrUser ? user?.avatar : null) || localAvatar || null;
            return {
              id: b.id,
              name: isCurrUser ? `${uName} (You)` : uName,
              timeAgo,
              amount: b.amount,
              increment: incStr,
              isUser: isCurrUser,
              badge: isCurrUser ? '10X' : null,
              avatar: userAvatar
            };
          });
        });
      }
    };

    activeSocket.on('bid_update', handleUpdate);
    return () => {
      activeSocket.off('bid_update', handleUpdate);
      if (createdSocket) createdSocket.close();
    };
  }, [socket, id, user, item?.base_price]);

  // Countdown timer calculation (Strictly aligned with Addis Ababa / Nairobi Time Zone - EAT, UTC+3)
  useEffect(() => {
    if (!item) return;

    const updateTimer = () => {
      const formatted = formatEATTimeLeft(item.end_time);
      setTimeLeft(formatted);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [item]);

  const isOpenPool = item?.pool_type === 'open';
  const isExpired = isAuctionEndedEAT(item) || timeLeft === 'EXPIRED';

  // Highest Bid Calculation for Open Pool
  const currentHighestBid = useMemo(() => {
    if (!item) return 12450;
    if (item.bids && item.bids.length > 0) {
      return Math.max(...item.bids.map(b => b.amount));
    }
    return item.base_price || 12450;
  }, [item]);

  // Leading bidder name
  const leadingBidderName = useMemo(() => {
    if (recentBidsStream.length > 0) {
      return recentBidsStream[0].name;
    }
    return 'No leading bidder yet';
  }, [recentBidsStream]);

  // User's own placed bids on this item
  const userBidsOnThisItem = useMemo(() => {
    if (!user || !recentLUBBids || recentLUBBids.length === 0) return [];
    return recentLUBBids.filter(b => b.user_id === user.id);
  }, [user, recentLUBBids]);

  // Target Bid Amount for Open Pool
  const targetBidAmount = useMemo(() => {
    if (customBidInput) {
      return parseFloat(customBidInput) || (currentHighestBid + selectedIncrement);
    }
    return currentHighestBid + selectedIncrement;
  }, [currentHighestBid, selectedIncrement, customBidInput]);

  const actualBidFee = item?.base_price ?? 50.00;
  const totalCost = targetBidAmount + actualBidFee;

  const handleOpenPlaceBid = (inc = 50) => {
    setSelectedIncrement(inc);
    setCustomBidInput((currentHighestBid + inc).toFixed(2));
    setViewMode('place_bid');
  };

  const handleQuickAddLUB = (increment) => {
    const currentVal = parseFloat(lubBidAmount) || (item ? item.base_price : 0);
    const newAmount = (currentVal + increment).toFixed(2);
    setLubBidAmount(newAmount);
  };

  // 1. Initiate Bid (Opens Pop-up Modal)
  const handleInitiateBid = (bidAmountToPlace) => {
    setError('');
    setSuccess('');

    const amount = parseFloat(bidAmountToPlace);
    if (isNaN(amount) || amount <= 0) {
      setError('Bid amount must be at least 0.01 Birr (cannot be negative or zero)');
      return;
    }

    const decimalParts = String(bidAmountToPlace || '').split('.');
    if (decimalParts.length > 1 && decimalParts[1].length > 2) {
      setError('Bid amount cannot have more than 2 decimal places');
      return;
    }

    const cleanBid = parseFloat(amount.toFixed(2)).toString();

    if (!user) {
      try {
        sessionStorage.setItem(`pending_bid_${id}`, cleanBid);
      } catch (e) {
        console.error(e);
      }
      navigate('/login', {
        state: {
          from: `/item/${id}`,
          bidAmount: cleanBid,
          autoOpenConfirm: true,
          message: 'Please sign in with your phone number to place a bid.'
        }
      });
      return;
    }

    setPendingBidAmount(parseFloat(cleanBid));
    setShowConfirmModal(true);
  };

  // 2. Confirm and Place Bid after Modal Confirmation
  const handleConfirmAndPlaceBid = async (phoneNumber, paymentMethod) => {
    if (!pendingBidAmount) return;
    const paymentToUse = paymentMethod || selectedPayment;
    if (paymentMethod && paymentMethod !== selectedPayment) {
      setSelectedPayment(paymentMethod);
    }
    setIsSubmittingBid(true);
    setError('');
    setSuccess('');

    try {
      if (paymentToUse !== 'wallet') {
        const response = await axios.post('/api/payments/chapa/inline/prepare', {
          item_id: parseInt(id, 10),
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
        item_id: parseInt(id),
        amount: pendingBidAmount,
        payment_method: paymentToUse
      });
      clearCachedItems();

      const actualFee = item?.base_price ?? 1.00;
      setSuccess(`Bid of ${pendingBidAmount.toFixed(2)} Birr placed successfully!`);
      setLubBidAmount('');

      if (user && setUser && paymentToUse === 'wallet') {
        setUser({ ...user, wallet_balance: Math.max(0, user.wallet_balance - actualFee) });
      }

      setItem((prev) => {
        if (!prev) return prev;
        const cur = prev._count?.bids ?? prev.bid_count ?? prev.bids?.length ?? 0;
        return {
          ...prev,
          bid_count: cur + 1,
          _count: { ...(prev._count || {}), bids: cur + 1 }
        };
      });

      fetchItemDetails();
      setTimeout(() => {
        setSuccess('');
        setViewMode('detail');
      }, 2500);
      return { success: true };
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to place bid. Please try again.');
      if (paymentToUse !== 'wallet') {
        setShowConfirmModal(false);
      }
      throw err;
    } finally {
      setIsSubmittingBid(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0B0E] flex flex-col items-center justify-center text-white gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-amber-500 border-t-transparent"></div>
        <p className="text-xs font-bold text-zinc-400">Loading auction details...</p>
      </div>
    );
  }

  const productTitle = item?.title || 'Cartier Santos Green';
  const categoryLabel = (item?.category || 'ELECTRONICS').toUpperCase();
  const productImage = item?.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600';

  return (
    <div className="w-full pb-8 sm:pb-12 pt-1 sm:pt-2 px-0 sm:px-1 max-w-lg mx-auto font-sans antialiased min-w-0">
      {/* Phone Status Header */}


      {/* ========================================================================= */}
      {/* 1. OPEN BID POOL LAYOUT (Matches New Screenshots)                       */}
      {/* ========================================================================= */}
      {isOpenPool ? (
        <>
          {/* VIEW 1: OPEN BID AUCTION DETAIL SCREEN */}
          {viewMode === 'detail' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 px-1">
                <button
                  onClick={() => navigate(-1)}
                  className="w-9 h-9 rounded-full bg-[#141519] border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white transition-colors"
                >
                  <ArrowLeft size={18} />
                </button>
                <h1 className="font-serif font-black text-xl text-white tracking-tight">
                  Auction Detail
                </h1>
                <div className="w-9 h-9" />
              </div>

              {/* Hero Image Box - Multi Image Animated Carousel */}
              <ProductGalleryCarousel
                item={item}
                badgeText="OPEN BID"
                badgeColorClass="bg-emerald-950/80 text-emerald-400 border-emerald-500/40"
              />

              {/* Notifications Alert */}
              {error && (
                <div className="bg-rose-950/80 border border-rose-500/40 text-rose-300 px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-between animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} className="text-rose-400" />
                    <span>{error}</span>
                  </div>
                </div>
              )}

              {success && (
                <div className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-between animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400" />
                    <span>{success}</span>
                  </div>
                </div>
              )}

              {/* Main Detail Card Container */}
              {isExpired ? (
                <ExpiredAuctionView item={item} user={user} />
              ) : (
                <div className="bg-[#141519] border border-zinc-800/90 rounded-3xl p-5 shadow-2xl space-y-4">
                  {/* CURRENT HIGHEST BID */}
                  <div className="text-center py-2 space-y-1">
                    <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
                      CURRENT HIGHEST BID
                    </p>
                    <h2 className="font-serif font-black text-3xl md:text-4xl text-amber-400 tracking-tight">
                      {currentHighestBid.toLocaleString()} Birr
                    </h2>
                    <p className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1">
                      <span>{leadingBidderName}</span>
                    </p>
                    <div className="pt-2 flex items-center justify-center gap-2">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0E0F12] border border-zinc-800 text-xs shadow-inner">
                        <Clock size={13} className="text-amber-400" />
                        <span className="text-zinc-400 font-bold">Ends in:</span>
                        <span className={`font-mono font-black ${timeLeft === 'EXPIRED' ? 'text-red-400' : 'text-emerald-400'}`}>
                          {timeLeft || 'Calculating...'}
                        </span>
                        <span className="text-[9px] text-amber-400/90 font-bold bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                          EAT
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* LIVE BID STREAM */}
                  <div className="space-y-2.5">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-1">
                      LIVE BID STREAM
                    </p>

                    <div className="space-y-2.5">
                      {recentBidsStream.length === 0 ? (
                        <div className="p-4 bg-[#0E0F12] border border-zinc-800/80 rounded-2xl text-center text-xs text-zinc-500">
                          No bids placed yet. Be the first to place an open bid!
                        </div>
                      ) : (
                        recentBidsStream.slice(0, 3).map((bidder) => (
                          <div
                            key={bidder.id}
                            className={`p-3 rounded-2xl flex items-center justify-between transition-all shadow-md ${bidder.isUser
                              ? 'bg-emerald-950/30 border border-emerald-500/50 shadow-emerald-950/20'
                              : 'bg-[#0E0F12] border border-zinc-800/80'
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <BidderAvatar src={bidder.avatar} alt={bidder.name} />
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <p className="font-bold text-sm text-white">{bidder.name}</p>
                                  {bidder.badge && (
                                    <span className="bg-emerald-500 text-black text-[9px] font-black px-1.5 py-0.2 rounded-md uppercase">
                                      {bidder.badge}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-zinc-400 font-medium">
                                  {bidder.timeAgo} • {bidder.amount.toLocaleString()} Birr
                                </p>
                              </div>
                            </div>

                            <span className="text-emerald-400 font-extrabold text-sm tracking-tight">
                              {bidder.increment}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Quick Increment Preset Buttons */}
                  <div className="grid grid-cols-3 gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => handleOpenPlaceBid(50)}
                      className="bg-[#1D1E24] hover:bg-amber-400/10 active:bg-amber-400/20 border border-zinc-800 hover:border-amber-400/40 text-amber-400 font-black text-sm py-3 px-2 rounded-2xl transition-all shadow-sm cursor-pointer"
                    >
                      +50 Birr
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenPlaceBid(100)}
                      className="bg-[#1D1E24] hover:bg-amber-400/10 active:bg-amber-400/20 border border-zinc-800 hover:border-amber-400/40 text-amber-400 font-black text-sm py-3 px-2 rounded-2xl transition-all shadow-sm cursor-pointer"
                    >
                      +100 Birr
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenPlaceBid(250)}
                      className="bg-[#1D1E24] hover:bg-amber-400/10 active:bg-amber-400/20 border border-zinc-800 hover:border-amber-400/40 text-amber-400 font-black text-sm py-3 px-2 rounded-2xl transition-all shadow-sm cursor-pointer"
                    >
                      +250 Birr
                    </button>
                  </div>

                  {/* Primary Action Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenPlaceBid(selectedIncrement)}
                    className="w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:brightness-110 active:scale-95 text-black font-black text-base py-4 rounded-2xl shadow-xl shadow-amber-500/20 transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <span>BID NOW (+{selectedIncrement})</span>
                  </button>
                </div>
              )}

              {/* Specifications & Sub-Titles Section */}
              <RenderDescriptionSections description={item?.description} />
            </div>
          )}

          {/* VIEW 2: PLACE OPEN BID CONFIRMATION SCREEN */}
          {viewMode === 'place_bid' && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 py-2 px-1 border-b border-zinc-800/80 pb-3">
                <button
                  onClick={() => setViewMode('detail')}
                  className="w-9 h-9 rounded-full bg-[#141519] border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white transition-colors"
                >
                  <ArrowLeft size={18} />
                </button>
                <h1 className="font-serif font-black text-xl text-white tracking-tight">
                  Place Bid
                </h1>
              </div>

              <div className="space-y-1">
                <h2 className="font-serif font-black text-2xl md:text-3xl text-white tracking-tight uppercase">
                  PLACE YOUR OPEN BID
                </h2>
                <p className="text-xs text-zinc-400 font-medium">
                  Bid higher than the current highest bid to take the lead.
                </p>
              </div>

              <div className="bg-[#141519] border border-zinc-800/90 p-4 rounded-2xl flex items-center gap-3.5 shadow-lg">
                <img
                  src={productImage}
                  alt={productTitle}
                  className="w-16 h-16 object-cover rounded-xl border border-zinc-800 bg-zinc-900"
                />
                <div>
                  <h3 className="font-serif font-bold text-base text-white">{productTitle}</h3>
                  <p className="text-xs text-zinc-400 mt-0.5 font-medium">
                    Open Auction • Min Increment 50 Birr
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  SUGGESTED INCREMENTS
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {[50, 100, 250, 500].map((inc) => {
                    const isSelected = selectedIncrement === inc;
                    return (
                      <button
                        key={inc}
                        type="button"
                        onClick={() => {
                          setSelectedIncrement(inc);
                          setCustomBidInput((currentHighestBid + inc).toFixed(2));
                        }}
                        className={`py-3 rounded-2xl text-xs font-black transition-all cursor-pointer shadow-md ${isSelected
                          ? 'bg-amber-500 text-black font-black shadow-amber-500/20'
                          : 'bg-[#141519] border border-zinc-800 text-zinc-300 hover:text-white'
                          }`}
                      >
                        +{inc}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  ENTER CUSTOM BID AMOUNT
                </p>
                <div className="relative bg-[#0E0F12] border-2 border-amber-400 rounded-2xl p-4 flex justify-between items-center shadow-lg">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={customBidInput}
                    onFocus={() => setIsOpenInputFocused(true)}
                    onBlur={() => setTimeout(() => setIsOpenInputFocused(false), 200)}
                    onKeyDown={(e) => {
                      if (['-', '+', 'e', 'E'].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => setCustomBidInput(sanitizeBidAmount(e.target.value))}
                    className="w-full bg-transparent font-mono font-black text-2xl md:text-3xl text-white focus:outline-none"
                    placeholder="e.g. 0.01 or 50.00"
                    style={{ fontSize: '24px' }}
                  />
                  <span className="text-zinc-400 font-bold text-base pl-2">Birr</span>
                </div>
              </div>

              {/* Payment Method Selector (Displays when input is focused) */}
              <div className="bg-[#141519] border border-zinc-800/90 rounded-2xl p-4 space-y-2.5 shadow-lg text-xs">
                <div className="flex justify-between items-center text-zinc-300">
                  <span>My Bid Amount</span>
                  <span className="font-mono font-bold text-white">{targetBidAmount.toLocaleString()} Birr</span>
                </div>

                <div className="flex justify-between items-center text-zinc-300">
                  <span>Auction Bid Fee</span>
                  <span className="font-mono font-bold text-zinc-300">{actualBidFee.toFixed(2)} Birr</span>
                </div>

                <div className="border-t border-zinc-800 pt-2 flex justify-between items-center font-bold text-sm">
                  <span className="text-white font-extrabold">Total Cost</span>
                  <span className="font-mono font-black text-amber-400 text-base">
                    {totalCost.toLocaleString()} Birr
                  </span>
                </div>
              </div>

              {error && (
                <div className="bg-rose-950/80 border border-rose-500/40 text-rose-300 px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-between animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} className="text-rose-400" />
                    <span>{error}</span>
                  </div>
                </div>
              )}

              {success && (
                <div className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-between animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400" />
                    <span>{success}</span>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => handleInitiateBid(targetBidAmount)}
                className="w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:brightness-110 active:scale-95 text-black font-black text-base py-4 rounded-2xl shadow-xl shadow-amber-500/20 transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>CONFIRM & PLACE BID</span>
              </button>
            </div>
          )}
        </>
      ) : (
        /* ========================================================================= */
        /* 2. ORIGINAL / PREVIOUS PREMIUM POOL LAYOUT (Lowest Unique Bid Format)     */
        /* ========================================================================= */
        <div className="space-y-6">
          <div className="flex justify-between items-center py-2 px-1">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-full bg-[#141519] border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="font-serif font-black text-xl text-white tracking-tight">
             Item Detail
            </h1>
            <div className="w-9 h-9" />
          </div>

          {/* Hero Image - Multi Image Animated Carousel */}
          <ProductGalleryCarousel
            item={item}
            
            
          />

          {/* Bidding Panel */}
          {/* Expired Auction View OR Active Bidding Form */}
          {isExpired ? (
            <ExpiredAuctionView item={item} user={user} />
          ) : (
            <div className="bg-[#16161A] rounded-3xl border border-zinc-800 p-5 md:p-6 space-y-5 shadow-xl">


              {/* Price Stats */}
              <div className="flex justify-between items-center bg-[#111113] p-3.5 rounded-2xl border border-zinc-800">
                <div>
                  <p className="text-[10px] text-zinc-400 font-bold ">Bid fee</p>
                  <p className="text-lg font-black text-amber-400">{item.base_price ? item.base_price.toFixed(2) : '0.00'} Birr</p>
                </div>
                <div className="text-right">

                  <div>
                    <p className="text-[10px] text-zinc-400 font-bold">Bids</p>
                    <p className="text-lg font-black text-amber-400">
                      {(item?._count?.bids ?? item?.bid_count ?? item?.bids?.length ?? recentLUBBids?.length ?? 0).toLocaleString()}
                    </p>
                  </div>


                </div>
              </div>

              {/* Action Form or Phone Login Prompt */}
              <div>


                {!user ? (
                  <div className="p-4 bg-[#111113] border border-zinc-800 rounded-2xl text-center space-y-3">
                    <div className="w-10 h-10 rounded-full bg-[#1A1A1E] text-amber-400 border border-zinc-800 shadow-sm flex items-center justify-center mx-auto">
                      <Lock size={18} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-xs text-white">Sign in to Place Bids</h4>
                      <p className="text-[11px] text-zinc-400">
                        View items freely! Enter your phone number starting with 09 or 07 to start bidding.
                      </p>
                    </div>
                    <Link
                      to="/login"
                      state={{ from: `/item/${id}`, message: 'Please log in with your phone number to place a bid.' }}
                      className="inline-flex items-center justify-center gap-2 w-full py-3 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
                    >
                      <Smartphone size={16} />
                      Login with Phone
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {error && (
                      <div className="p-3 bg-red-950/40 text-red-300 rounded-xl text-xs border border-red-800/60 flex items-start gap-2">
                        <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-400" />
                        <span>{error}</span>
                      </div>
                    )}
                    {success && (
                      <div className="p-3 bg-emerald-950/40 text-emerald-300 rounded-xl text-xs border border-emerald-800/60 flex items-start gap-2">
                        <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-400" />
                        <span>{success}</span>
                      </div>
                    )}

                    {/* Quick Decimal Increment Preset Buttons
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Quick Increment:</span>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[0.01, 0.10, 0.50, 1.00].map((inc) => (
                          <button
                            key={inc}
                            type="button"
                            onClick={() => handleQuickAddLUB(inc)}
                            className="py-1.5 px-1.5 bg-[#111113] hover:bg-amber-500/10 text-amber-400 font-mono font-bold text-xs rounded-xl border border-zinc-800 hover:border-amber-500/30 transition-all flex items-center justify-center gap-0.5"
                          >
                            <Plus size={10} />
                            {inc.toFixed(2)}
                          </button>
                        ))}
                      </div>
                    </div> */}

                    {/* Payment Method Selector (Telebirr, CBE, Wallet) */}


                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleInitiateBid(lubBidAmount);
                      }}
                      className="flex gap-2"
                    >
                      <div className="relative flex-grow">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-xs">Birr</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          required
                          disabled={timeLeft === 'EXPIRED'}
                          onFocus={() => setIsLubInputFocused(true)}
                          onBlur={() => setTimeout(() => setIsLubInputFocused(false), 200)}
                          onKeyDown={(e) => {
                            if (['-', '+', 'e', 'E'].includes(e.key)) {
                              e.preventDefault();
                            }
                          }}
                          className="w-full pl-12 pr-3 py-3 bg-[#111113] border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-mono font-bold text-[16px] text-white transition-all"
                          placeholder="e.g. 0.01 or 15.20"
                          value={lubBidAmount}
                          onChange={(e) => setLubBidAmount(sanitizeBidAmount(e.target.value))}
                          style={{ fontSize: '16px' }}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={timeLeft === 'EXPIRED'}
                        className="px-5 bg-gradient-to-r from-amber-400 to-amber-600 hover:brightness-110 text-black rounded-xl font-black font-bold text-xs shadow-md transition-all active:scale-95 disabled:bg-zinc-800 disabled:text-zinc-600 cursor-pointer"
                      >
                        Submit Bid
                      </button>
                    </form>

                    {/* Payment Method Selector (Displays when input is focused) */}
                    <div className="flex items-start gap-1.5 text-[10px] text-zinc-400 pt-1">
                      <Info size={14} className="shrink-0 mt-0.5 text-amber-400" />
                      <p>Bids require 2 decimal places. Only lowest unique bids win!</p>
                    </div>

                    {/* Timer Banner */}
                    <div className="flex flex-col items-center justify-center py-4 bg-[#111113] text-white rounded-2xl border border-zinc-800 shadow-inner">
                      <Clock className="text-amber-400 mb-1" size={22} />
                      <div className="flex items-center gap-1.5">
                        <p className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">Time Remaining</p>
                      
                      </div>
                      <p className={`text-xl font-black font-mono tracking-tight mt-1 ${timeLeft === 'EXPIRED' ? 'text-red-400' : 'text-emerald-400'}`}>
                        {timeLeft || 'Calculating...'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}



          {/* User's Placed Bids Notification Card */}
          {user && userBidsOnThisItem.length > 0 && (
            <div className="bg-[#141519] border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between text-xs shadow-xl">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0"></span>
                <div>
                  <p className="font-bold text-amber-400 text-xs">
                    You placed {userBidsOnThisItem.length} bid{userBidsOnThisItem.length > 1 ? 's' : ''} on this product
                  </p>
                  <p className="text-xs text-zinc-300 font-mono font-bold mt-0.5">
                    {userBidsOnThisItem.map(b => `${parseFloat(b.amount).toFixed(2)} Birr`).join(', ')}
                  </p>
                </div>
              </div>
              <span className="bg-amber-400/10 border border-amber-400/30 text-amber-400 text-[10px] font-black px-2.5 py-1 rounded-full uppercase shrink-0">
                YOUR BIDS
              </span>
            </div>
          )}
          {/* Specifications & Sub-Titles Section */}
          <RenderDescriptionSections description={item?.description} />
        </div>
      )}

      {/* Confirm Your Bid Modal Popup (Matches user screenshot) */}
      <ConfirmBidModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setInlinePayment(null);
        }}
        onConfirm={handleConfirmAndPlaceBid}
        itemTitle={productTitle}
        bidAmount={pendingBidAmount}
        bidFee={item?.base_price ?? 50.00}
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
          setLubBidAmount('');
          setItem((prev) => {
            if (!prev) return prev;
            const cur = prev._count?.bids ?? prev.bid_count ?? prev.bids?.length ?? 0;
            return {
              ...prev,
              bid_count: cur + 1,
              _count: { ...(prev._count || {}), bids: cur + 1 }
            };
          });
          fetchItemDetails();
          setSuccess(`Bid of ${pendingBidAmount?.toFixed(2) || ''} Birr placed successfully!`);
          setTimeout(() => setSuccess(''), 5000);
        }}
      />
      {checkoutUrl && (
        <ChapaEmbeddedModal
          checkoutUrl={checkoutUrl}
          onClose={() => setCheckoutUrl(null)}
          onSuccess={() => {
            setPendingBidAmount(null);
            fetchItemDetails();
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
});

export default ItemDetails;
