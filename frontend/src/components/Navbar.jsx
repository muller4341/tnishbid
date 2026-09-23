import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bell, Wallet, LogOut, User as UserIcon } from 'lucide-react';
import axios from 'axios';

const Navbar = () => {
  const { user, logout, socket } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (user) {
      axios.get('http://localhost:5000/api/users/notifications').then(res => {
        setNotifications(res.data);
      });
    }
  }, [user]);

  useEffect(() => {
    if (socket) {
      socket.on('bid_duplicated', (data) => {
        setNotifications(prev => [{
          id: Date.now(),
          message: data.message,
          is_read: false,
          created_at: new Date()
        }, ...prev]);
      });
    }
  }, [socket]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Tinish Bid
        </Link>
        
        <div className="flex items-center gap-6">
          {user ? (
            <>
              {user.role === 'admin' && (
                <Link to="/admin" className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors">
                  Admin Dashboard
                </Link>
              )}
              <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
                <UserIcon size={14} className="text-indigo-600" />
                <span>{user.phone_number || user.name}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full font-medium">
                <Wallet size={18} className="text-emerald-500" />
                <span>{user.wallet_balance} ETB</span>
              </div>
              
              <div className="relative">
                <button 
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors relative"
                >
                  <Bell size={22} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                  )}
                </button>
                
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden">
                    <div className="p-3 border-b border-slate-100 font-semibold text-slate-800">Notifications</div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-slate-500">No notifications</div>
                      ) : (
                        notifications.map((n, i) => (
                          <div key={i} className={`p-4 text-sm border-b border-slate-50 ${n.is_read ? 'text-slate-500' : 'text-slate-800 bg-indigo-50/30'}`}>
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
                className="flex items-center gap-2 text-slate-500 hover:text-red-500 transition-colors"
              >
                <LogOut size={20} />
              </button>
            </>
          ) : (
            <div className="flex gap-3">
              <Link to="/login" className="px-4 py-2 text-slate-600 font-medium hover:text-indigo-600 transition-colors">Login</Link>
              <Link to="/register" className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200">Register</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
