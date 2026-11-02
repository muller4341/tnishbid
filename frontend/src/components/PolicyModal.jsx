import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, FileText, CheckCircle2, Lock, Scale, Sparkles, AlertCircle } from 'lucide-react';

const PolicyModal = ({ isOpen, initialTab = 'terms', onClose, onAccept }) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] bg-[#141519] border border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-zinc-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800/80 flex items-center justify-between bg-[#101115]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              {activeTab === 'privacy' ? <ShieldCheck size={20} /> : <FileText size={20} />}
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white tracking-tight">
                Tinish Bid Legal & Policies
              </h2>
              <p className="text-[11px] text-zinc-400">
                Transparent rules and data protection for all auction participants
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-zinc-800/80 bg-[#0E0F12] p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'terms'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
            }`}
          >
            <Scale size={14} />
            Terms of Service
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
            }`}
          >
            <ShieldCheck size={14} />
            Privacy Policy
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs text-zinc-300 leading-relaxed font-normal">
          {activeTab === 'terms' ? (
            /* TERMS OF SERVICE CONTENT */
            <div className="space-y-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-2.5">
                <Sparkles size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-300 font-medium leading-relaxed">
                  Welcome to <strong>Tinish Bid (ትንሽBid)</strong>! By registering an account or participating in auctions, you agree to comply with the rules below.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-extrabold text-white mb-1.5 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-400 text-[10px] flex items-center justify-center font-bold">1</span>
                  Eligibility & Registration Bonus
                </h3>
                <p className="pl-7 text-zinc-400">
                  You must be at least 18 years of age to participate. Each participant is identified uniquely by their Ethiopian phone number (09xxxxxxxx or 07xxxxxxxx). Every newly registered verified account receives a <strong>10 ETB welcome bonus</strong> credited directly to their wallet for auction participation. Creating duplicate accounts to exploit welcome bonuses is strictly forbidden.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-extrabold text-white mb-1.5 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-400 text-[10px] flex items-center justify-center font-bold">2</span>
                  Auction Formats & Bidding Mechanics
                </h3>
                <ul className="pl-7 space-y-1.5 text-zinc-400 list-disc list-inside">
                  <li>
                    <strong>Lowest Unique Bid (LUB) Pools:</strong> The winning bid is strictly the lowest monetary bid that has not been placed by any other participant (unique). If multiple users place the same bid amount, it is duplicated and disqualified from winning until a participant places an undisputed unique bid.
                  </li>
                  <li>
                    <strong>Open Pool Auctions:</strong> The winning participant is the one who submits the highest valid bid before the auction deadline ends.
                  </li>
                  <li>
                    <strong>Decimal Format:</strong> All bids must have up to 2 decimal places (e.g. 1.25 ETB). Each bid participation consumes a nominal participation fee as indicated on the item post.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-extrabold text-white mb-1.5 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-400 text-[10px] flex items-center justify-center font-bold">3</span>
                  Auction Expiration & Winner Settlement
                </h3>
                <p className="pl-7 text-zinc-400">
                  Every auction possesses a strict, tamper-proof end time anchored to East Africa Time (EAT, UTC+3). When the deadline is reached, the status automatically shifts from active to <strong>Ended</strong>, and the system permanently declares and persists the verified winner in public audit logs.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-extrabold text-white mb-1.5 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-400 text-[10px] flex items-center justify-center font-bold">4</span>
                  Prize Delivery & Redemption
                </h3>
                <p className="pl-7 text-zinc-400">
                  Winners are notified immediately via SMS, in-app notifications, and live alerts. The winner must present the registered phone number and a valid government ID (Kebele / Passport / National ID) upon collecting the physical item. Prizes cannot be transferred to unverified third parties.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-extrabold text-white mb-1.5 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-400 text-[10px] flex items-center justify-center font-bold">5</span>
                  Fair Play & Disqualification
                </h3>
                <p className="pl-7 text-zinc-400">
                  Any attempt to manipulate the system using automated bots, fraudulent payment methods, or malicious multi-accounting will result in immediate disqualification, wallet freezing, and legal escalation.
                </p>
              </div>
            </div>
          ) : (
            /* PRIVACY POLICY CONTENT */
            <div className="space-y-4">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-2.5">
                <Lock size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-emerald-300 font-medium leading-relaxed">
                  Your privacy is critically important. We protect your personal data with enterprise-grade encryption and will never sell your information.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-extrabold text-white mb-1.5 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-400/20 text-emerald-400 text-[10px] flex items-center justify-center font-bold">1</span>
                  Information We Collect
                </h3>
                <p className="pl-7 text-zinc-400">
                  When you register and use Tinish Bid, we collect:
                </p>
                <ul className="pl-7 mt-1.5 space-y-1 text-zinc-400 list-disc list-inside">
                  <li><strong>Account Credentials:</strong> Full name, phone number, and bcrypt-hashed passwords.</li>
                  <li><strong>Financial Data:</strong> Wallet balances, deposit/withdrawal history, and transaction references via official payment gateways (Telebirr, CBE, Chapa). We never store your payment PINs or private banking keys.</li>
                  <li><strong>Activity Logs:</strong> Timestamped bid entries, auction participation records, and won items.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-extrabold text-white mb-1.5 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-400/20 text-emerald-400 text-[10px] flex items-center justify-center font-bold">2</span>
                  Public Transparency & Phone Masking
                </h3>
                <p className="pl-7 text-zinc-400">
                  To ensure 100% fair play and public trust, winning records and draw history are displayed openly. However, <strong>your phone number is always masked</strong> on all public leaderboards and announcements (e.g., <code>0943***20</code>) so your private identity remains protected.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-extrabold text-white mb-1.5 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-400/20 text-emerald-400 text-[10px] flex items-center justify-center font-bold">3</span>
                  How We Use Your Data
                </h3>
                <p className="pl-7 text-zinc-400">
                  We use your details strictly to authenticate your account, verify winning bids, process wallet transactions, send SMS auction alerts, and dispatch prize redemption codes.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-extrabold text-white mb-1.5 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-400/20 text-emerald-400 text-[10px] flex items-center justify-center font-bold">4</span>
                  Security & Data Retention
                </h3>
                <p className="pl-7 text-zinc-400">
                  All communications are encrypted using modern TLS standards. Database transactions and user records are stored securely with automated access controls.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-extrabold text-white mb-1.5 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-400/20 text-emerald-400 text-[10px] flex items-center justify-center font-bold">5</span>
                  Your Rights
                </h3>
                <p className="pl-7 text-zinc-400">
                  You have the right to inspect your transaction and bid history at any time from your Profile, update your contact details, or request account closure by contacting our support team.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-zinc-800/80 bg-[#101115] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-zinc-500 text-center sm:text-left">
            Last updated: November 2026 • Tinish Bid Ethiopia
          </p>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800 text-xs font-bold text-zinc-300 transition-colors cursor-pointer"
            >
              Close
            </button>
            {onAccept && (
              <button
                type="button"
                onClick={() => {
                  onAccept();
                  onClose();
                }}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-black text-xs font-black shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <CheckCircle2 size={15} />
                I Understand & Accept
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PolicyModal;
