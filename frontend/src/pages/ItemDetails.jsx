import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Clock, Tag, TrendingDown, AlertCircle, CheckCircle2, Info, Lock, ArrowLeft, Smartphone, Plus } from 'lucide-react';

const ItemDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timeLeft, setTimeLeft] = useState('');
  const { user, socket, setUser } = useAuth();
  const [recentBids, setRecentBids] = useState([]);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const res = await axios.get(`/api/items/${id}`);
        setItem(res.data);
        setRecentBids(res.data.bids ? res.data.bids.slice(-10).reverse() : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id]);

  useEffect(() => {
    if (socket) {
      const handleUpdate = (data) => {
        if (data.item_id === parseInt(id)) {
          axios.get(`/api/items/${id}`).then(res => {
            setRecentBids(res.data.bids ? res.data.bids.slice(-10).reverse() : []);
          }).catch(() => {});
        }
      };
      socket.on('bid_update', handleUpdate);
      return () => socket.off('bid_update', handleUpdate);
    }
  }, [socket, id]);

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

  const handleQuickAdd = (increment) => {
    const currentVal = parseFloat(bidAmount) || (item ? item.base_price : 0);
    const newAmount = (currentVal + increment).toFixed(2);
    setBidAmount(newAmount);
  };

  const handleBid = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!user) {
      navigate('/login', {
        state: {
          from: `/item/${id}`,
          message: 'Please log in with your phone number to place a bid.'
        }
      });
      return;
    }

    try {
      const amount = parseFloat(bidAmount);
      await axios.post('/api/bids/place', {
        item_id: item.id,
        amount
      });
      
      setSuccess(`Bid of ${amount.toFixed(2)} Birr placed successfully!`);
      setBidAmount('');
      
      if (user && setUser) {
        setUser({ ...user, wallet_balance: user.wallet_balance - 1.0 });
      }
      
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to place bid');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-amber-500 border-t-transparent"></div>
        <p className="text-xs font-bold text-zinc-500 animate-pulse">Loading item details...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-2xl font-bold text-white">Auction item not found</h2>
        <Link to="/" className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-black font-bold text-xs rounded-xl">
          <ArrowLeft size={16} /> Return to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back Navigation Bar */}
      <div>
        <Link 
          to="/" 
          className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-300 hover:text-white bg-[#16161A] px-3.5 py-2 rounded-2xl border border-zinc-800 shadow-sm transition-all"
        >
          <ArrowLeft size={14} className="text-amber-400" />
          Back to Live Auctions
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        
        {/* Left Column: Image & Description */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#16161A] rounded-3xl overflow-hidden border border-zinc-800 p-3 md:p-4 space-y-4 shadow-xl">
            <div className="aspect-[4/3] bg-zinc-900 rounded-2xl relative overflow-hidden">
              {item.image_url ? (
                <img 
                  src={item.image_url} 
                  alt={item.title} 
                  className="w-full h-full object-cover transition-transform duration-700 ease-out hover:scale-105" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-700">
                  <Tag size={64} />
                </div>
              )}
            </div>
            
            <div className="p-3 md:p-4 space-y-2">
              <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">
                {item.title}
              </h1>
              <p className="text-xs md:text-sm text-zinc-400 leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Bidding Panel & Live Feed */}
        <div className="space-y-6">
          {/* Bidding Control Panel */}
          <div className="bg-[#16161A] rounded-3xl border border-zinc-800 p-5 md:p-6 space-y-5 shadow-xl">
            
            {/* Timer Banner */}
            <div className="flex flex-col items-center justify-center py-4 bg-[#111113] text-white rounded-2xl border border-zinc-800 shadow-inner">
              <Clock className="text-amber-400 mb-1" size={22} />
              <p className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">Time Remaining</p>
              <p className={`text-xl font-black font-mono tracking-tight ${timeLeft === 'EXPIRED' ? 'text-red-400' : 'text-emerald-400'}`}>
                {timeLeft || 'Calculating...'}
              </p>
            </div>

            {/* Price Stats */}
            <div className="flex justify-between items-center bg-[#111113] p-3.5 rounded-2xl border border-zinc-800">
              <div>
                <p className="text-[10px] text-zinc-400 font-bold uppercase">Lowest Unique</p>
                <p className="text-lg font-black text-amber-400">{item.base_price.toFixed(2)} Birr</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-zinc-400 font-bold uppercase">Bid Fee</p>
                <p className="text-xs font-bold text-zinc-300">1.00 Birr</p>
              </div>
            </div>

            {/* Action Form or Phone Login Prompt */}
            <div>
              <h3 className="text-xs font-bold text-zinc-300 mb-3 flex items-center gap-2">
                <TrendingDown size={16} className="text-amber-400" />
                Place Phone Unique Bid
              </h3>

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

                  {/* Quick Preset Buttons */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Quick Increment:</span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[0.01, 0.10, 0.50, 1.00].map((inc) => (
                        <button
                          key={inc}
                          type="button"
                          onClick={() => handleQuickAdd(inc)}
                          className="py-1.5 px-1.5 bg-[#111113] hover:bg-amber-500/10 text-amber-400 font-mono font-bold text-xs rounded-xl border border-zinc-800 hover:border-amber-500/30 transition-all flex items-center justify-center gap-0.5"
                        >
                          <Plus size={10} />
                          {inc.toFixed(2)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <form onSubmit={handleBid} className="flex gap-2">
                    <div className="relative flex-grow">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-xs">Birr</span>
                      <input
                        type="number"
                        step="0.01"
                        min={item.base_price + 0.01}
                        required
                        disabled={timeLeft === 'EXPIRED'}
                        className="w-full pl-12 pr-3 py-3 bg-[#111113] border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-mono font-bold text-sm text-white transition-all"
                        placeholder="e.g. 15.20"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={timeLeft === 'EXPIRED'}
                      className="px-5 bg-gradient-to-r from-amber-400 to-amber-600 hover:brightness-110 text-black rounded-xl font-black text-xs uppercase shadow-md transition-all active:scale-95 disabled:bg-zinc-800 disabled:text-zinc-600"
                    >
                      Bid
                    </button>
                  </form>

                  <div className="flex items-start gap-1.5 text-[10px] text-zinc-400 pt-1">
                    <Info size={14} className="shrink-0 mt-0.5 text-amber-400" />
                    <p>Bids require 2 decimal places. Only lowest unique bids win!</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Live Activity Feed */}
          <div className="bg-[#16161A] rounded-3xl border border-zinc-800 p-5 space-y-3 shadow-xl">
            <h3 className="font-bold text-zinc-200 text-xs border-b border-zinc-800 pb-3 flex justify-between items-center">
              <span>Live Bids Feed</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </h3>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {recentBids.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-4">No bids placed yet. Be the first!</p>
              ) : (
                recentBids.map((bid, i) => (
                  <div 
                    key={i} 
                    className={`flex justify-between items-center p-2.5 rounded-xl border text-xs font-mono font-bold ${
                      bid.is_unique 
                        ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300' 
                        : 'bg-red-950/30 border-red-800/60 text-red-300'
                    }`}
                  >
                    <div>{parseFloat(bid.amount).toFixed(2)} Birr</div>
                    <span className="text-[9px] font-sans font-extrabold px-2 py-0.5 rounded-full bg-[#111113] border border-zinc-800">
                      {bid.is_unique ? 'UNIQUE' : 'DUPLICATE'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default ItemDetails;
