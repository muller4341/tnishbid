import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Clock, Tag, TrendingDown, AlertCircle, CheckCircle2, Info, LogIn, Lock } from 'lucide-react';

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
        const res = await axios.get(`http://localhost:5000/api/items/${id}`);
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
      socket.on('bid_update', (data) => {
        if (data.item_id === parseInt(id)) {
          axios.get(`http://localhost:5000/api/items/${id}`).then(res => {
            setRecentBids(res.data.bids ? res.data.bids.slice(-10).reverse() : []);
          });
        }
      });
    }
    return () => {
      if (socket) socket.off('bid_update');
    };
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
      const res = await axios.post('http://localhost:5000/api/bids/place', {
        item_id: item.id,
        amount
      });
      
      setSuccess(`Bid of ${amount} ETB placed successfully!`);
      setBidAmount('');
      
      if (user && setUser) {
        setUser({ ...user, wallet_balance: user.wallet_balance - 1.0 });
      }
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to place bid');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  if (!item) return <div className="text-center py-12 text-slate-500">Item not found</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Item Image & Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 p-2">
            <div className="aspect-video bg-slate-100 rounded-2xl relative overflow-hidden">
              {item.image_url ? (
                <img src={item.image_url} alt={item.title} className="w-full h-full object-cover transition-all duration-700 ease-out hover:scale-110 hover:-translate-y-2 hover:-rotate-1 cursor-crosshair" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <Tag size={64} />
                </div>
              )}
            </div>
            <div className="p-6 md:p-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-4">{item.title}</h1>
              <p className="text-slate-600 leading-relaxed">{item.description}</p>
            </div>
          </div>
        </div>

        {/* Right Column: Bidding Panel */}
        <div className="space-y-6">
          {/* Time & Price Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8">
            <div className="flex flex-col items-center justify-center py-6 bg-slate-50 rounded-2xl mb-8 border border-slate-100">
              <Clock className="text-indigo-500 mb-2" size={28} />
              <p className="text-sm text-slate-500 font-medium mb-1">Time Remaining</p>
              <p className={`text-3xl font-bold tracking-tight ${timeLeft === 'EXPIRED' ? 'text-red-500' : 'text-slate-900'}`}>
                {timeLeft || 'Calculating...'}
              </p>
            </div>

            <div className="flex justify-between items-end border-b border-slate-100 pb-6 mb-6">
              <div>
                <p className="text-sm text-slate-500 font-medium mb-1">Base Price</p>
                <p className="text-2xl font-bold text-slate-900">{item.base_price.toFixed(2)} ETB</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500 font-medium mb-1">Bid Fee</p>
                <p className="text-lg font-semibold text-slate-700">1.00 ETB</p>
              </div>
            </div>

            {/* Bidding Form or Login Prompt */}
            <div className="mb-6">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <TrendingDown size={18} className="text-indigo-600" />
                Place Unique Bid
              </h3>

              {!user ? (
                <div className="p-5 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl text-center space-y-3">
                  <div className="inline-flex p-3 bg-white rounded-full text-indigo-600 shadow-sm">
                    <Lock size={24} />
                  </div>
                  <h4 className="font-semibold text-slate-800">Login Required to Bid</h4>
                  <p className="text-xs text-slate-600">
                    You can view all products freely! Log in with your phone number starting with 09 or 07 to place a bid.
                  </p>
                  <Link
                    to="/login"
                    state={{ from: `/item/${id}`, message: 'Please log in with your phone number to place a bid.' }}
                    className="inline-flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-md transition-all active:scale-[0.98]"
                  >
                    <LogIn size={18} />
                    Login to Bid
                  </Link>
                </div>
              ) : (
                <>
                  {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex items-start gap-2"><AlertCircle size={16} className="mt-0.5 shrink-0"/>{error}</div>}
                  {success && <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 rounded-xl text-sm border border-emerald-100 flex items-start gap-2"><CheckCircle2 size={16} className="mt-0.5 shrink-0"/>{success}</div>}
                  
                  <form onSubmit={handleBid} className="flex gap-2">
                    <div className="relative flex-grow">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">ETB</span>
                      <input
                        type="number"
                        step="0.01"
                        min={item.base_price + 0.01}
                        required
                        disabled={timeLeft === 'EXPIRED'}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-semibold"
                        placeholder="e.g. 30.12"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={timeLeft === 'EXPIRED'}
                      className="px-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-medium shadow-md transition-all active:scale-[0.98]"
                    >
                      Bid
                    </button>
                  </form>
                  <div className="mt-3 flex items-start gap-1.5 text-xs text-slate-500">
                    <Info size={14} className="shrink-0 mt-0.5 text-indigo-400" />
                    <p>Ensure your bid uses up to two decimal places. It must be unique to win.</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Recent Bids (Live) */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-4">Live Bid Activity</h3>
            <div className="space-y-3">
              {recentBids.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No bids placed yet.</p>
              ) : (
                recentBids.map((bid, i) => (
                  <div key={i} className={`flex justify-between items-center p-3 rounded-xl border ${bid.is_unique ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800' : 'bg-red-50/50 border-red-100 text-red-800'} transition-all`}>
                    <div className="font-medium text-lg">{parseFloat(bid.amount).toFixed(2)} ETB</div>
                    <div className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white bg-opacity-60 shadow-sm">
                      {bid.is_unique ? 'UNIQUE' : 'DUPLICATED'}
                    </div>
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
