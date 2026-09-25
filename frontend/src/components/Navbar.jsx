import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bell, Wallet, LogOut, Crown, Smartphone, ShieldCheck } from 'lucide-react';
import axios from 'axios';

const Navbar = () => {
  const { user, logout, socket } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (user) {
      axios.get('/api/users/notifications').then(res => {
        setNotifications(res.data);
      }).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    if (socket) {
      const handleDup = (data) => {
        setNotifications(prev => [{
          id: Date.now(),
          message: data.message,
          is_read: false,
          created_at: new Date()
        }, ...prev]);
      };
      socket.on('bid_duplicated', handleDup);
      return () => socket.off('bid_duplicated', handleDup);
    }
  }, [socket]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <nav className="bg-[#0D0E11]/90 backdrop-blur-md shadow-md border-b border-zinc-800/80 sticky top-0 z-40">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Brand Logo & Crown Icon matching Screenshot */}
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2 text-xl md:text-2xl font-black tracking-tight text-white group">
            <Crown size={24} className="text-amber-400 fill-amber-400/20 group-hover:scale-110 transition-transform" />
            <span>
            ትንሽ<span className="text-amber-400">Bid</span>
            </span>
          </Link>
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            Phone Auctions
          </span>

          {user?.role !== 'admin' && (
            <Link to="/my-bids" className="hidden md:inline-flex text-xs font-bold text-zinc-300 hover:text-amber-400 transition-colors ml-2">
              My Bids
            </Link>
          )}
        </div>
        
        {/* Top Right Actions */}
        <div className="flex items-center gap-2.5 md:gap-4">
          {user ? (
            <>
              {user.role === 'admin' && (
                <Link to="/admin" className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 px-3 py-1.5 rounded-full transition-colors">
                  <ShieldCheck size={14} />
                  Admin Portal
                </Link>
              )}
              
              <Link 
                to="/profile" 
                className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 hover:text-white bg-[#16161A] hover:bg-[#202026] px-3 py-1.5 rounded-full border border-zinc-800 transition-colors"
                title="View Profile"
              >
                <Smartphone size={13} className="text-amber-400" />
                <span className="font-mono text-xs">{user.name || user.phone_number}</span>
              </Link>

              <div className="flex items-center gap-1.5 text-xs md:text-sm font-bold text-amber-400 bg-amber-400/10 border border-amber-400/25 px-3 py-1.5 rounded-full">
                <Wallet size={15} className="text-amber-400" />
                <span>{user.wallet_balance} ETB</span>
              </div>
              
              {/* Dark Styled Notifications Bell */}
              <div className="relative">
                <button 
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="w-9 h-9 flex items-center justify-center bg-[#18181C] hover:bg-[#222228] text-zinc-300 hover:text-white rounded-full border border-zinc-800 transition-colors relative"
                  aria-label="Notifications"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-[#18181C] animate-pulse"></span>
                  )}
                </button>
                
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-72 md:w-80 bg-[#141418] text-white rounded-2xl shadow-2xl border border-zinc-800 overflow-hidden z-50">
                    <div className="p-3 bg-[#1A1A20] border-b border-zinc-800/80 font-bold text-xs flex justify-between items-center text-zinc-200">
                      <span>Notifications</span>
                      {unreadCount > 0 && (
                        <span className="text-[10px] font-bold bg-amber-500 text-black px-2 py-0.5 rounded-full">{unreadCount} new</span>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-zinc-500">No recent notifications</div>
                      ) : (
                        notifications.map((n, i) => (
                          <div key={i} className={`p-3 text-xs border-b border-zinc-800/60 ${n.is_read ? 'text-zinc-500' : 'text-zinc-200 bg-amber-500/10 font-medium'}`}>
                            {n.message}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <button 
                onClick={handleLogout}
                className="w-9 h-9 flex items-center justify-center bg-[#18181C] hover:bg-red-950/40 text-zinc-400 hover:text-red-400 rounded-full border border-zinc-800 transition-colors"
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link 
                to="/login" 
                className="px-3.5 py-1.5 text-xs md:text-sm font-semibold text-zinc-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link 
                to="/register" 
                className="px-4 py-1.5 text-xs md:text-sm font-bold bg-gradient-to-r from-amber-500 to-amber-600 text-black rounded-full hover:brightness-110 transition-all shadow-md shadow-amber-500/10 active:scale-95"
              >
                Register Phone
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
