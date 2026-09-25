import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, Hourglass, User, LogIn, ShieldCheck } from 'lucide-react';

const MobileNav = () => {
  const location = useLocation();
  const { user } = useAuth();
  const currentPath = location.pathname;

  const isAdmin = user?.role === 'admin';

  const navItems = isAdmin 
    ? [
        {
          label: 'Admin Portal',
          path: '/admin',
          icon: ShieldCheck,
        },
        {
          label: 'Catalog',
          path: '/',
          icon: Home,
          exact: true
        },
        {
          label: 'Profile',
          path: '/profile',
          icon: User
        }
      ]
    : [
        {
          label: 'Home',
          path: '/',
          icon: Home,
          exact: true
        },
        {
          label: 'My Bids',
          path: '/my-bids',
          icon: Hourglass,
        },
        {
          label: 'Profile',
          path: user ? '/profile' : '/login',
          icon: User
        }
      ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0E0F12]/95 backdrop-blur-xl border-t border-zinc-800/80 shadow-[0_-4px_25px_rgba(0,0,0,0.5)] px-4 py-2">
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact 
            ? currentPath === item.path 
            : currentPath.startsWith(item.path) && item.path !== '/';

          return (
            <Link
              key={item.label}
              to={item.path}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 relative ${
                isActive 
                  ? 'text-amber-400 font-bold scale-105' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <div className="relative">
                <Icon size={22} className={isActive ? 'stroke-[2.5px]' : 'stroke-[1.75px]'} />
                {item.badge && (
                  <span className="absolute -top-1.5 -right-4 bg-amber-500 text-black text-[9px] font-black px-1.5 py-0.2 rounded-full shadow-sm">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1 font-medium tracking-tight">
                {item.label}
              </span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-amber-400 mt-0.5 animate-pulse"></span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default MobileNav;
