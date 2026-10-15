import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Bell, Wallet, Crown, Smartphone, ShieldCheck, Sun, Moon, Globe } from 'lucide-react';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';

const LanguageSwitcher = () => {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const languageRef = useRef(null);
  const languages = [
    { code: 'en', label: 'Eng' },
    { code: 'am', label: '\u12a0\u121b' },
  ];
  const current = languages.find((language) => language.code === lang) || languages[0];

  useEffect(() => {
    if (!open) return undefined;

    const closeOnOutsideClick = (event) => {
      if (languageRef.current && !languageRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('touchstart', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('touchstart', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  return (
    <div className="relative" ref={languageRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-[#18181C] px-3 py-1.5 text-xs font-bold text-amber-400 transition-all hover:bg-amber-500/10"
        aria-label="Choose language"
      >
        <Globe size={13} />
        <span>{current.flag}</span>
        <span>{current.label}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-1.5 min-w-[130px] overflow-hidden rounded-xl border border-zinc-700 bg-[#1C1C24] shadow-2xl z-50">
          {languages.map((language) => (
            <button
              type="button"
              key={language.code}
              onClick={() => { setLang(language.code); setOpen(false); }}
              className={`flex w-full items-center gap-2 px-4 py-2.5 text-xs font-bold transition-colors ${lang === language.code ? 'bg-amber-500/20 text-amber-400' : 'text-zinc-300 hover:bg-zinc-800'}`}
            >
              <span>{language.flag}</span>{language.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const Navbar = () => {
  const { user, socket } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const notificationRef = useRef(null);

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showDropdown]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <nav
      className="backdrop-blur-md shadow-md sticky top-0 z-40 transition-colors duration-300"
      style={{
        backgroundColor: theme === 'light' ? 'rgba(255,255,255,0.95)' : 'rgba(13,14,17,0.90)',
        borderBottom: theme === 'light' ? '1px solid #D4D5DA' : '1px solid rgba(39,39,42,0.8)',
      }}
    >
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Brand Logo & Crown Icon matching Screenshot */}
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2 text-xl md:text-2xl font-black tracking-tight text-white group">
            <Crown size={24} className="text-amber-400 fill-amber-400/20 group-hover:scale-110 transition-transform" />
            <span>
            ትንሽ<span className="text-amber-400">Bid</span>
            </span>
          </Link>
          {user && user.role !== 'admin' && (
            <Link 
              to="/my-bids" 
              className="hidden md:inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-400 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 px-3 py-1.5 rounded-full transition-colors ml-3"
            >
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
              
              {/* <Link 
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
              </div> */}
              
              
              
              {/* Theme Toggle */}
              <LanguageSwitcher />
              <button
                onClick={toggleTheme}
                className="w-9 h-9 flex items-center justify-center bg-[#18181C] hover:bg-amber-500/10 text-zinc-400 hover:text-amber-400 rounded-full border border-zinc-800 transition-colors"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>

            </>
          ) : (
            <div className="flex items-center gap-2">
              {/* Theme Toggle for logged-out users too */}
              <LanguageSwitcher />
              <button
                onClick={toggleTheme}
                className="w-9 h-9 flex items-center justify-center bg-[#18181C] hover:bg-amber-500/10 text-zinc-400 hover:text-amber-400 rounded-full border border-zinc-800 transition-colors"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <Link
                to={location.pathname === '/login' ? '/register' : '/login'}
                className={`px-4 py-1.5 text-xs md:text-sm font-bold rounded-full transition-all active:scale-95 ${location.pathname === '/login' ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-md shadow-amber-500/10' : 'text-zinc-300 hover:text-white border border-zinc-800 bg-[#18181C]'}`}
              >
                {location.pathname === '/login' ? 'Register' : 'Sign In'}
              </Link>
            </div>

            
          )}

          {/* Dark Styled Notifications Bell */}
              <div className="relative" ref={notificationRef}>
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
        </div>
        
      </div>
    </nav>
  );
};

export default Navbar;
