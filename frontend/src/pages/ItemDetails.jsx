import React, { useState, useEffect, useMemo, useCallback, memo, lazy } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import telebirrLogo from '../assets/telebirr.png';
import cbeLogo from '../assets/cbe.png';
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
  Wallet
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
            {/* Subtitle - Centered Vertically and Horizontally */}
            <div className="w-1/3 min-w-[100px] font-bold text-amber-400 text-xs flex items-center justify-start text-center shrink-0 self-center">
              <span>{sec.title || 'Detail'}</span>
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
          src={images[currentIndex]} 
          alt={`${title} - Angle ${currentIndex + 1}`}
          loading="lazy"
          decoding="async"
          className={`w-full h-64 md:h-72 object-cover object-center transition-all duration-500 transform ${
            isTransitioning ? 'opacity-40 scale-95 blur-xs' : 'opacity-100 scale-100'
          }`}
        />

        {/* Category Pill Tag */}
        <span className="absolute top-4 left-4 bg-black/70 backdrop-blur-md text-zinc-200 border border-zinc-700/80 font-bold text-[10px] tracking-wider px-3 py-1 rounded-full uppercase z-10">
          {categoryLabel}
        </span>

        {/* Pool Badge */}
        <span className={`absolute top-4 right-4 backdrop-blur-md border font-extrabold text-[10px] tracking-wider px-3 py-1 rounded-full uppercase shadow-md z-10 ${badgeColorClass}`}>
          {badgeText}
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
              className={`transition-all duration-300 rounded-full cursor-pointer ${
                currentIndex === idx 
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
                className={`relative rounded-xl overflow-hidden border-2 transition-all duration-300 cursor-pointer shrink-0 ${
                  isActive 
                    ? 'border-amber-500 ring-2 ring-amber-500/30 scale-105 shadow-md shadow-amber-500/20' 
                    : 'border-zinc-800/90 opacity-60 hover:opacity-100 hover:border-zinc-600'
                }`}
              >
                <img 
                  src={img} 
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
              navigator.share({ title: title, url: window.location.href }).catch(() => {});
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

// Component for a single Bid Amount Group Row with green "show more" text link
const BidGroupRow = ({ group, winningBidId, currentUserId }) => {
  const [expanded, setExpanded] = useState(false);
  const INITIAL_SHOW = 3;
  const totalCount = group.bids.length;
  const isUnique = totalCount === 1;
  const displayedBids = expanded ? group.bids : group.bids.slice(0, INITIAL_SHOW);

  return (
    <div className="bg-[#0E0F12] border border-zinc-800/80 rounded-2xl p-3.5 flex flex-row items-start justify-between gap-4 shadow-md">
      {/* Column 1 (Left): Bid Amount & Unique/Duplicate Badge */}
      <div className="w-1/3 min-w-[110px] space-y-1.5 shrink-0 pt-0.5">
        <p className="font-mono font-black text-sm md:text-base text-amber-400">
          {group.amount.toFixed(2)} Birr
        </p>
        <div>
          <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
            isUnique 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
              : 'bg-zinc-800 text-zinc-400'
          }`}>
            {isUnique ? 'UNIQUE' : `${totalCount} BIDS`}
          </span>
        </div>
      </div>

      {/* Column 2 (Right): Side-by-Side Phone Numbers List & Green "show more" Link */}
      <div className="flex-1 space-y-1.5">
        <div className={`space-y-1.5 ${expanded ? 'max-h-60 overflow-y-auto pr-1 no-scrollbar' : ''}`}>
          {displayedBids.map((b, i) => {
            const isWinner = winningBidId && winningBidId === b.id;
            const isUser = currentUserId && currentUserId === b.user_id;
            const phoneStr = maskPhoneNumber(b.user?.phone_number);

            return (
              <div 
                key={b.id || i}
                className={`flex items-center justify-between text-xs px-3 py-1.5 rounded-xl transition-all ${
                  isWinner 
                    ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 font-bold shadow-sm' 
                    : isUser
                    ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 font-bold'
                    : 'bg-[#141519] border border-zinc-800/60 text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold tracking-wider">{phoneStr}</span>
                  {isUser && (
                    <span className="text-[8px] font-black px-1.5 py-0.2 bg-emerald-500 text-black rounded uppercase">
                      YOU
                    </span>
                  )}
                  {isWinner && (
                    <span className="text-[8px] font-black px-1.5 py-0.2 bg-amber-400 text-black rounded uppercase flex items-center gap-0.5">
                      <Trophy size={10} /> WINNER
                    </span>
                  )}
                </div>

                <span className="text-[10px] text-zinc-400 font-mono">
                  {b.created_at ? new Date(b.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>
            );
          })}
        </div>

        {/* Green Text Link under the last bidder phone */}
        {totalCount > INITIAL_SHOW && (
          <div className="pt-0.5 text-left">
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="text-emerald-400 hover:text-emerald-300 text-xs font-bold cursor-pointer transition-colors flex items-center gap-1 active:scale-95"
            >
              {expanded ? (
                <>show less <ChevronUp size={12} /></>
              ) : (
                <>show more ({totalCount - INITIAL_SHOW} more) <ChevronDown size={12} /></>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Expired / Settled Auction Component
const ExpiredAuctionView = ({ item, user }) => {
  const allBids = useMemo(() => {
    if (!item?.bids || !Array.isArray(item.bids)) return [];
    return [...item.bids].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [item]);

  const winningBid = useMemo(() => {
    if (allBids.length === 0) return null;
    if (item?.winner_id) {
      const found = allBids.find(b => b.user_id === item.winner_id);
      if (found) return found;
    }
    if (item?.pool_type === 'lub' || item?.pool_type === 'premium') {
      const uniqueBids = allBids.filter(b => b.is_unique);
      if (uniqueBids.length > 0) {
        return [...uniqueBids].sort((a, b) => a.amount - b.amount)[0];
      }
    }
    return [...allBids].sort((a, b) => b.amount - a.amount)[0];
  }, [allBids, item]);

  const winnerUser = item?.winner || winningBid?.user;
  const winnerPhone = maskPhoneNumber(winnerUser?.phone_number || winningBid?.user?.phone_number);
  const winningAmount = winningBid ? winningBid.amount : (item?.base_price || 0);
  const isCurrentUserWinner = user && (user.id === item?.winner_id || user.id === winnerUser?.id);

  // Group bids by exact amount
  const groupedBids = useMemo(() => {
    if (!allBids || allBids.length === 0) return [];

    const map = new Map();
    allBids.forEach(bid => {
      const key = parseFloat(bid.amount).toFixed(2);
      if (!map.has(key)) {
        map.set(key, {
          amount: parseFloat(key),
          bids: []
        });
      }
      map.get(key).bids.push(bid);
    });

    const groups = Array.from(map.values());
    if (item?.pool_type === 'lub' || item?.pool_type === 'premium') {
      return groups.sort((a, b) => a.amount - b.amount);
    }
    return groups.sort((a, b) => b.amount - a.amount);
  }, [allBids, item]);

  return (
    <div className="space-y-4 relative">
      {/* Falling Confetti Celebration Animation Overlay */}
      {(winnerUser || winningBid) && <ConfettiCelebration />}

      {/* Winner Announcement Card */}
      <div className="bg-[#16161A] border border-zinc-800/90 rounded-3xl p-6 md:p-7 shadow-2xl relative overflow-hidden">
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
            ) : (
              <h2 className="text-xl md:text-2xl font-serif font-black text-white pt-1 tracking-tight">
                Auction Winner: <span className="text-amber-400 font-mono">{winnerPhone}</span>
              </h2>
            )}
          </div>

          {/* Winner Details Glassmorphism Card */}
          <div className="w-full bg-[#0A0B0E]/90 border border-zinc-800/90 rounded-2xl p-4 md:p-5 grid grid-cols-2 gap-4 text-left shadow-2xl backdrop-blur-md relative overflow-hidden">
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
                {winningAmount.toFixed(2)} Birr
              </p>
              <span className="inline-block text-[9.5px] font-bold text-amber-300 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-400/30 px-2.5 py-0.5 rounded-md shadow-sm">
                {item?.pool_type === 'open' ? 'Highest Bid' : 'Lowest Unique Bid'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* All Bidders Record Section (2-Column Format: Bid Amount & User Phone) */}
      <div className="bg-[#141519] border border-zinc-800/90 rounded-3xl p-4 md:p-5 shadow-2xl space-y-3">
        <div className="flex justify-between items-center px-1 pb-2 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <User size={16} className="text-amber-400" />
            <h3 className="text-xs font-black uppercase text-white tracking-wider">
              ALL BIDDERS RECORD ({allBids.length})
            </h3>
          </div>
          <span className="text-[10px] font-bold text-zinc-400">
            {groupedBids.length} Bid Amounts
          </span>
        </div>

        {groupedBids.length === 0 ? (
          <div className="p-6 bg-[#0E0F12] border border-zinc-800/80 rounded-2xl text-center text-xs text-zinc-500">
            No bids were placed on this item.
          </div>
        ) : (
          <div className="max-h-[500px] overflow-y-auto space-y-3 pr-1 no-scrollbar">
            {groupedBids.map((group, idx) => (
              <BidGroupRow 
                key={idx} 
                group={group} 
                winningBidId={winningBid?.id} 
                currentUserId={user?.id} 
              />
            ))}
          </div>
        )}
      </div>
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

      <div className="grid grid-cols-3 gap-1.5">
        {/* 1. Telebirr */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onSelectPayment('telebirr')}
          className={`py-2 px-1 rounded-xl border transition-all flex items-center justify-center gap-1.5 cursor-pointer relative ${
            selectedPayment === 'telebirr'
              ? 'bg-sky-950/70 border-sky-400 ring-1 ring-sky-400/40 shadow-sm'
              : 'bg-[#111216] border-zinc-800/80 hover:border-zinc-700 opacity-70 hover:opacity-100'
          }`}
        >
          {selectedPayment === 'telebirr' && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-sky-400"></span>
          )}
          <img src={telebirrLogo} alt="Telebirr" className="h-5.5 max-w-[72px] object-contain rounded-xs shrink-0" />
          <span className="text-[10px] font-bold text-white tracking-wide">Telebirr</span>
        </button>

        {/* 2. CBE */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onSelectPayment('cbe')}
          className={`py-2 px-1 rounded-xl border transition-all flex items-center justify-center gap-1.5 cursor-pointer relative ${
            selectedPayment === 'cbe'
              ? 'bg-purple-950/70 border-purple-400 ring-1 ring-purple-400/40 shadow-sm'
              : 'bg-[#111216] border-zinc-800/80 hover:border-zinc-700 opacity-70 hover:opacity-100'
          }`}
        >
          {selectedPayment === 'cbe' && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-purple-400"></span>
          )}
          <img src={cbeLogo} alt="CBE" className="h-5.5 max-w-[72px] object-contain rounded-xs shrink-0" />
          <span className="text-[10px] font-bold text-white tracking-wide">CBE</span>
        </button>

        {/* 3. Wallet */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onSelectPayment('wallet')}
          className={`py-2 px-1 rounded-xl border transition-all flex items-center justify-center gap-1.5 cursor-pointer relative ${
            selectedPayment === 'wallet'
              ? 'bg-amber-950/70 border-amber-400 ring-1 ring-amber-400/40 shadow-sm'
              : 'bg-[#111216] border-zinc-800/80 hover:border-zinc-700 opacity-70 hover:opacity-100'
          }`}
        >
          {selectedPayment === 'wallet' && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          )}
          <div className="w-5 h-5 rounded bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
            <Wallet size={13} />
          </div>
          <span className="text-[10px] font-bold text-white tracking-wide">Wallet</span>
        </button>
      </div>
    </div>
  );
});

// Pop-up Confirmation Modal (Matches exact screenshot layout)
const ConfirmBidModal = memo(({ 
  isOpen, 
  onClose, 
  onConfirm, 
  itemTitle, 
  bidAmount, 
  bidFee, 
  selectedPayment,
  isSubmitting 
}) => {
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAgreed(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#18191E] border border-zinc-700/80 rounded-3xl max-w-md w-full p-5 md:p-6 shadow-2xl relative text-left text-zinc-100 space-y-4 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/90 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-sm">
              <Gavel size={20} />
            </div>
            <h2 className="font-serif font-black text-lg md:text-xl text-white tracking-tight">
              Confirm Your Bid
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Details List */}
        <div className="space-y-3 text-xs">
          {/* Your Bid Item */}
          <div className="flex items-start gap-3 bg-[#111216] border border-zinc-800/80 p-3.5 rounded-2xl">
            <Package size={18} className="text-zinc-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5 flex-1 min-w-0">
              <p className="text-[11px] font-bold text-zinc-400">Your Bid Item:</p>
              <p className="font-bold text-sky-400 text-xs md:text-sm leading-snug">
                {itemTitle || 'Auction Item'}
              </p>
            </div>
          </div>

          {/* Your Bid Amount */}
          <div className="flex items-center justify-between bg-[#111216] border border-zinc-800/80 p-3.5 rounded-2xl">
            <div className="flex items-center gap-3">
              <DollarSign size={18} className="text-zinc-400 shrink-0" />
              <span className="font-bold text-zinc-400">Your Bid Amount:</span>
            </div>
            <span className="font-mono font-black text-white text-sm md:text-base">
              {parseFloat(bidAmount || 0).toFixed(2)} Br
            </span>
          </div>

          {/* Bid Service Fee */}
          <div className="flex items-center justify-between bg-[#111216] border border-zinc-800/80 p-3.5 rounded-2xl">
            <div className="flex items-center gap-3">
              <Receipt size={18} className="text-zinc-400 shrink-0" />
              <span className="font-bold text-zinc-400">Bid Service Fee:</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-rose-400 text-sm md:text-base">
                {parseFloat(bidFee || 0).toFixed(2)} Br
              </span>
              <span className="bg-rose-500/15 border border-rose-500/30 text-rose-400 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase">
                Non-refundable
              </span>
            </div>
          </div>

          {/* Selected Payment Option Badge */}
          <div className="flex items-center justify-between px-3 py-2 bg-[#111216]/60 border border-zinc-800/60 rounded-xl text-[11px]">
            <span className="text-zinc-400 font-medium">Payment Option:</span>
            <div className="flex items-center gap-2">
              {selectedPayment === 'telebirr' && (
                <span className="font-bold text-sky-400 flex items-center gap-1.5">
                  <img src={telebirrLogo} alt="Telebirr" className="h-4 w-auto object-contain" />
                  Telebirr
                </span>
              )}
              {selectedPayment === 'cbe' && (
                <span className="font-bold text-purple-400 flex items-center gap-1.5">
                  <img src={cbeLogo} alt="CBE" className="h-4 w-auto object-contain" />
                  CBE
                </span>
              )}
              {selectedPayment === 'wallet' && (
                <span className="font-bold text-amber-400 flex items-center gap-1.5">
                  <Wallet size={14} /> Wallet
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Explanation Card (Matches exact screenshot text) */}
        <div className="bg-[#111317] border border-zinc-800/90 rounded-2xl p-4 flex items-start gap-3 shadow-inner">
          <Info size={18} className="text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-zinc-300 leading-relaxed font-normal">
            The bid service fee is non-refundable and is paid to participate in the auction. The amount submitted as a bid is not charged at the time of placing the bid. In this auction, winners are determined based on the lowest unique bid submitted among all participants. Only participants who win the auction will be required to pay the amount of their winning bid, in addition to the participation fee.
          </p>
        </div>

        {/* Agreement Checkbox */}
        <div 
          onClick={() => setAgreed(!agreed)}
          className="flex items-center gap-3 py-1 cursor-pointer select-none group"
        >
          <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
            agreed 
              ? 'bg-amber-500 border-amber-400 text-black' 
              : 'bg-zinc-900 border-zinc-700 text-transparent'
          }`}>
            <CheckCircle2 size={14} className={agreed ? 'text-black' : 'opacity-0'} />
          </div>
          <span className="text-xs font-bold text-zinc-200 group-hover:text-white transition-colors">
            I agree to continue
          </span>
        </div>

        {/* Confirm & Continue Action Button */}
        <button
          type="button"
          onClick={() => {
            if (agreed) onConfirm();
          }}
          disabled={!agreed || isSubmitting}
          className={`w-full font-black text-sm py-4 rounded-2xl shadow-xl transition-all uppercase tracking-wider flex items-center justify-center gap-2 ${
            agreed && !isSubmitting
              ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:brightness-110 text-black cursor-pointer active:scale-95 shadow-amber-500/20'
              : 'bg-gradient-to-r from-amber-500/70 via-amber-500/70 to-amber-600/70 text-black/80 cursor-not-allowed opacity-75 shadow-none'
          }`}
        >
          {isSubmitting ? (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-black border-t-transparent" />
          ) : (
            <>
              <CheckCircle2 size={18} />
              <span>Confirm & Continue</span>
            </>
          )}
        </button>

      </div>
    </div>
  );
});

const ItemDetails = memo(() => {
  const { id } = useParams();
  const navigate = useNavigate();
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

  // Bids streams
  const [recentBidsStream, setRecentBidsStream] = useState([]);
  const [recentLUBBids, setRecentLUBBids] = useState([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchItemDetails();
  }, [id]);

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
    if (socket) {
      const handleUpdate = (data) => {
        if (data.item_id === parseInt(id) && data.bid) {
          // Update item state with new bid
          setItem(prev => {
            if (!prev) return prev;
            const updatedBids = [data.bid, ...(prev.bids || [])];
            return { ...prev, bids: updatedBids };
          });
          // Update recent LUB bids
          setRecentLUBBids(prev => [data.bid, ...prev]);
          // Update recent bids stream (top 3)
          setRecentBidsStream(prev => {
            const combined = [data.bid, ...prev];
            const formatted = combined.slice(0, 3).map((b, idx) => {
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
              const prevBid = combined[idx + 1];
              const diffVal = prevBid ? (b.amount - prevBid.amount) : (b.amount - (item?.base_price || 0));
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
            return formatted;
          });
        }
      };
      socket.on('bid_update', handleUpdate);
      return () => socket.off('bid_update', handleUpdate);
    }
  }, [socket, id, user, item]);

  // Countdown timer calculation
  useEffect(() => {
    if (!item) return;
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(item.end_time).getTime();
      const distance = end - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft('EXPIRED');
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, [item]);

  const isOpenPool = item?.pool_type === 'open';
  const isExpired = item?.status === 'closed' || timeLeft === 'EXPIRED' || (item?.end_time && new Date(item.end_time).getTime() <= Date.now());

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

    if (!user) {
      navigate('/login', {
        state: {
          from: `/item/${id}`,
          message: 'Please sign in with your phone number to place a bid.'
        }
      });
      return;
    }

    const amount = parseFloat(bidAmountToPlace);
    if (isNaN(amount) || amount <= 0) {
      setError('Bid amount must be at least 0.01 Birr');
      return;
    }

    setPendingBidAmount(amount);
    setShowConfirmModal(true);
  };

  // 2. Confirm and Place Bid after Modal Confirmation
  const handleConfirmAndPlaceBid = async () => {
    if (!pendingBidAmount) return;
    setIsSubmittingBid(true);
    setError('');
    setSuccess('');

    try {
      await axios.post('/api/bids/place', {
        item_id: parseInt(id),
        amount: pendingBidAmount,
        payment_method: selectedPayment
      });

      const actualFee = item?.base_price ?? 1.00;
      setSuccess(`Bid of ${pendingBidAmount.toFixed(2)} Birr placed successfully!`);
      setLubBidAmount('');
      
      if (user && setUser && selectedPayment === 'wallet') {
        setUser({ ...user, wallet_balance: Math.max(0, user.wallet_balance - actualFee) });
      }

      setShowConfirmModal(false);
      fetchItemDetails();
      setTimeout(() => {
        setSuccess('');
        setViewMode('detail');
      }, 2500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to place bid. Please try again.');
      setShowConfirmModal(false);
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
    <div className="min-h-screen bg-[#0A0B0E] text-slate-100 pb-28 pt-2 px-3 md:px-6 max-w-lg mx-auto font-sans antialiased">
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
                            className={`p-3 rounded-2xl flex items-center justify-between transition-all shadow-md ${
                              bidder.isUser 
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
                        className={`py-3 rounded-2xl text-xs font-black transition-all cursor-pointer shadow-md ${
                          isSelected
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
                    onChange={(e) => setCustomBidInput(e.target.value)}
                    className="w-full bg-transparent font-mono font-black text-2xl md:text-3xl text-white focus:outline-none"
                    placeholder="e.g. 0.01 or 50.00"
                  />
                  <span className="text-zinc-400 font-bold text-base pl-2">Birr</span>
                </div>
              </div>

              {/* Payment Method Selector (Displays when input is focused) */}
              {isOpenInputFocused && (
                <PaymentMethodSelector 
                  selectedPayment={selectedPayment}
                  onSelectPayment={setSelectedPayment}
                  walletBalance={user?.wallet_balance}
                />
              )}

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
              Premium LUB Pool
            </h1>
            <div className="w-9 h-9" />
          </div>

          {/* Hero Image - Multi Image Animated Carousel */}
          <ProductGalleryCarousel 
            item={item} 
            badgeText="PREMIUM LUB POOL" 
            badgeColorClass="bg-purple-950/80 text-purple-400 border-purple-500/40" 
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
                          className="w-full pl-12 pr-3 py-3 bg-[#111113] border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-mono font-bold text-sm text-white transition-all"
                          placeholder="e.g. 0.01 or 15.20"
                          value={lubBidAmount}
                          onChange={(e) => setLubBidAmount(e.target.value)}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={timeLeft === 'EXPIRED'}
                        className="px-5 bg-gradient-to-r from-amber-400 to-amber-600 hover:brightness-110 text-black rounded-xl font-black text-xs uppercase shadow-md transition-all active:scale-95 disabled:bg-zinc-800 disabled:text-zinc-600 cursor-pointer"
                      >
                        Bid LUB
                      </button>
                    </form>

                    {/* Payment Method Selector (Displays when input is focused) */}
                    {isLubInputFocused && (
                      <PaymentMethodSelector 
                        selectedPayment={selectedPayment}
                        onSelectPayment={setSelectedPayment}
                        walletBalance={user?.wallet_balance}
                      />
                    )}

                    <div className="flex items-start gap-1.5 text-[10px] text-zinc-400 pt-1">
                      <Info size={14} className="shrink-0 mt-0.5 text-amber-400" />
                      <p>Bids require 2 decimal places. Only lowest unique bids win!</p>
                    </div>

                    {/* Timer Banner */}
              <div className="flex flex-col items-center justify-center py-4 bg-[#111113] text-white rounded-2xl border border-zinc-800 shadow-inner">
                <Clock className="text-amber-400 mb-1" size={22} />
                <p className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">Time Remaining</p>
                <p className={`text-xl font-black font-mono tracking-tight ${timeLeft === 'EXPIRED' ? 'text-red-400' : 'text-emerald-400'}`}>
                  {timeLeft || 'Calculating...'}
                </p>
              </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Specifications & Sub-Titles Section */}
          <RenderDescriptionSections description={item?.description} />

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
        </div>
      )}

      {/* Confirm Your Bid Modal Popup (Matches user screenshot) */}
      <ConfirmBidModal 
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmAndPlaceBid}
        itemTitle={productTitle}
        bidAmount={pendingBidAmount}
        bidFee={item?.base_price ?? 50.00}
        selectedPayment={selectedPayment}
        isSubmitting={isSubmittingBid}
      />
    </div>
  );
});

export default ItemDetails;
