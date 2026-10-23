import React, { useState } from 'react';
import { 
  Headphones, 
  X, 
  Phone, 
  Mail, 
  Copy, 
  Check, 
  ChevronRight
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function HomeSupportButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const handleCopy = (text, key, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const contactChannels = [
    {
      id: 'telegram',
      title: 'Telegram',
      subtitle: '@tnishbid',
      value: '@tnishbid',
      actionUrl: 'https://t.me/tnishbid',
      bgColor: 'rgba(34, 158, 217, 0.14)',
      borderColor: 'rgba(34, 158, 217, 0.3)',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" style={{ color: '#229ED9' }}>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
        </svg>
      )
    },
    {
      id: 'phone',
      title: 'Phone Call',
      subtitle: '+251 91 123 4567',
      value: '+251911234567',
      actionUrl: 'tel:+251911234567',
      bgColor: 'rgba(245, 158, 11, 0.14)',
      borderColor: 'rgba(245, 158, 11, 0.3)',
      icon: <Phone className="w-5 h-5 text-amber-500" />
    },
    {
      id: 'whatsapp',
      title: 'WhatsApp',
      subtitle: '+251 91 123 4567',
      value: '+251911234567',
      actionUrl: 'https://wa.me/251911234567',
      bgColor: 'rgba(37, 211, 102, 0.14)',
      borderColor: 'rgba(37, 211, 102, 0.3)',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" style={{ color: '#25D366' }}>
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.53 7.34C9.36 7.34 9.08 7.41 8.84 7.67C8.6 7.93 7.93 8.55 7.93 9.82C7.93 11.09 8.86 12.31 9 12.47C9.13 12.64 10.82 15.25 13.41 16.37C15.57 17.3 16.01 17.11 16.47 17.07C16.94 17.03 17.98 16.45 18.2 15.84C18.41 15.23 18.41 14.7 18.35 14.6C18.29 14.5 18.12 14.43 17.87 14.31C17.61 14.19 16.37 13.58 16.14 13.49C15.91 13.41 15.74 13.37 15.57 13.62C15.41 13.88 14.94 14.43 14.79 14.6C14.65 14.77 14.5 14.8 14.25 14.67C14 14.55 13.19 14.28 12.23 13.43C11.49 12.77 10.98 11.95 10.84 11.7C10.7 11.45 10.83 11.31 10.95 11.19C11.07 11.07 11.21 10.89 11.34 10.74C11.47 10.59 11.51 10.48 11.6 10.31C11.69 10.14 11.64 10 11.58 9.87C11.52 9.75 11.05 8.59 10.86 8.12C10.67 7.67 10.48 7.73 10.33 7.72C10.2 7.72 10.04 7.72 9.88 7.72L9.53 7.34Z" />
        </svg>
      )
    },
    {
      id: 'tiktok',
      title: 'TikTok',
      subtitle: '@tnishbid',
      value: '@tnishbid',
      actionUrl: 'https://www.tiktok.com/@tnishbid',
      bgColor: 'rgba(254, 44, 85, 0.14)',
      borderColor: 'rgba(254, 44, 85, 0.3)',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" style={{ color: '#FE2C55' }}>
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
        </svg>
      )
    },
    {
      id: 'email',
      title: 'Email',
      subtitle: 'support@tnishbid.com',
      value: 'support@tnishbid.com',
      actionUrl: 'mailto:support@tnishbid.com',
      bgColor: 'rgba(139, 92, 246, 0.14)',
      borderColor: 'rgba(139, 92, 246, 0.3)',
      icon: <Mail className="w-5 h-5 text-purple-400" />
    }
  ];

  return (
    <>
      {/* Floating Trigger Button (Positioned comfortably above bottom navigation bar) */}
      <aside aria-label="Support Options">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Contact and support"
          className="fixed right-4 bottom-[92px] sm:bottom-8 sm:right-6 z-40 w-12 h-12 rounded-full flex items-center justify-center bg-[#141519] hover:bg-[#1E2028] text-white border border-zinc-700/80 shadow-[0_8px_24px_rgba(0,0,0,0.65)] hover:border-amber-500/70 transition-all duration-200 active:scale-95 cursor-pointer group"
        >
          {/* Active online pulse dot */}
          <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-[#141519]" />
          </span>

          {/* Headphone icon */}
          <Headphones 
            size={22} 
            className="text-white group-hover:text-amber-400 transition-colors" 
          />
        </button>
      </aside>

      {/* Modal / Dialog Overlay */}
      {isOpen && (
        <div
          role="presentation"
          className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="support-dialog-title"
            className={`w-full max-w-sm flex flex-col rounded-t-[26px] sm:rounded-3xl border shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 ${
              isLight
                ? 'bg-white border-zinc-200 text-zinc-900 shadow-zinc-900/15'
                : 'bg-[#14151B] border-zinc-800 text-zinc-100 shadow-[0_20px_50px_rgba(0,0,0,0.9)]'
            }`}
          >
            {/* Top Sheet Handle on Mobile */}
            <div className="sm:hidden pt-2.5 pb-1 flex justify-center">
              <div className={`h-1 w-10 rounded-full ${isLight ? 'bg-zinc-300' : 'bg-zinc-700'}`} />
            </div>

            {/* Header */}
            <div className={`flex items-center justify-between px-5 pt-3 pb-3 border-b ${
              isLight ? 'border-zinc-100' : 'border-zinc-800/80'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-black flex items-center justify-center shadow-xs shrink-0">
                  <Headphones size={17} />
                </div>
                <div>
                  <h2 id="support-dialog-title" className="font-black text-base tracking-tight leading-none">
                    Contact Us
                  </h2>
                  <p className={`text-[11px] mt-1 flex items-center gap-1.5 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block shrink-0" />
                    Online support & social channels
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className={`w-7 h-7 rounded-full flex items-center justify-center border transition-colors cursor-pointer shrink-0 ${
                  isLight
                    ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-500 border-zinc-200'
                    : 'bg-[#1C1E26] hover:bg-zinc-700 text-zinc-400 hover:text-white border-zinc-800'
                }`}
                aria-label="Close"
              >
                <X size={15} />
              </button>
            </div>

            {/* Clean, Simple Channel List */}
            <div className="p-3.5 space-y-2">
              {contactChannels.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    if (item.actionUrl.startsWith('http')) {
                      window.open(item.actionUrl, '_blank', 'noopener,noreferrer');
                    } else {
                      window.location.href = item.actionUrl;
                    }
                  }}
                  className={`group rounded-2xl border p-2.5 sm:p-3 flex items-center justify-between gap-3 cursor-pointer transition-all duration-150 active:scale-[0.99] ${
                    isLight
                      ? 'bg-zinc-50 hover:bg-amber-50/50 border-zinc-200/90 hover:border-amber-300 shadow-xs'
                      : 'bg-[#101115] hover:bg-[#181920] border-zinc-800/80 hover:border-zinc-700 shadow-xs'
                  }`}
                >
                  {/* Left: Icon & Title */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                      style={{
                        backgroundColor: item.bgColor,
                        borderColor: item.borderColor
                      }}
                    >
                      {item.icon}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-bold truncate leading-tight ${
                        isLight ? 'text-zinc-900 group-hover:text-amber-600' : 'text-white group-hover:text-amber-400'
                      }`}>
                        {item.title}
                      </p>
                      <p className={`text-xs truncate mt-0.5 font-medium ${
                        isLight ? 'text-zinc-500' : 'text-zinc-400'
                      }`}>
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Right: Copy & Arrow */}
                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={(e) => handleCopy(item.value, item.id, e)}
                      title="Copy"
                      className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                        copiedKey === item.id
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : isLight
                            ? 'bg-white hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 border-zinc-200'
                            : 'bg-[#17181F] hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-zinc-800'
                      }`}
                    >
                      {copiedKey === item.id ? (
                        <Check size={14} className="text-emerald-500" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (item.actionUrl.startsWith('http')) {
                          window.open(item.actionUrl, '_blank', 'noopener,noreferrer');
                        } else {
                          window.location.href = item.actionUrl;
                        }
                      }}
                      title="Open"
                      className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                        isLight
                          ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 border-amber-300'
                          : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Safe Area Padding */}
            <div className="pb-safe sm:pb-2" />
          </div>
        </div>
      )}
    </>
  );
}
