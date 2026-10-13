import React, { memo, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, DollarSign, Gavel, Info, Package, Receipt, Wallet, X } from 'lucide-react';
import telebirrLogo from '../assets/telebirr.png';
import cbeLogo from '../assets/cbe.png';

export const PaymentMethodSelector = memo(({ selectedPayment, onSelectPayment }) => (
  <div className="space-y-1 text-left animate-in fade-in slide-in-from-top-1 duration-200 mt-2">
    <label className="text-[9.5px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between px-0.5">
      <span>Payment Method</span>
      <span className="text-[8.5px] text-zinc-500 font-normal">Choose option to pay bid fee</span>
    </label>
    <div className="grid grid-cols-3 gap-1.5">
      <PaymentOption
        value="telebirr"
        selectedPayment={selectedPayment}
        onSelectPayment={onSelectPayment}
        activeClass="bg-sky-950/70 border-sky-400 ring-1 ring-sky-400/40"
        dotClass="bg-sky-400"
      >
        <img src={telebirrLogo} alt="Telebirr" className="h-5.5 max-w-[72px] object-contain rounded-xs shrink-0" />
        Telebirr
      </PaymentOption>
      <PaymentOption
        value="cbe"
        selectedPayment={selectedPayment}
        onSelectPayment={onSelectPayment}
        activeClass="bg-purple-950/70 border-purple-400 ring-1 ring-purple-400/40"
        dotClass="bg-purple-400"
      >
        <img src={cbeLogo} alt="CBE" className="h-5.5 max-w-[72px] object-contain rounded-xs shrink-0" />
        CBE
      </PaymentOption>
      <PaymentOption
        value="wallet"
        selectedPayment={selectedPayment}
        onSelectPayment={onSelectPayment}
        activeClass="bg-amber-950/70 border-amber-400 ring-1 ring-amber-400/40"
        dotClass="bg-amber-400"
      >
        <span className="w-5 h-5 rounded bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0"><Wallet size={13} /></span>
        Wallet
      </PaymentOption>
    </div>
  </div>
));

const PaymentOption = ({ value, selectedPayment, onSelectPayment, activeClass, dotClass, children }) => (
  <button
    type="button"
    onMouseDown={(event) => event.preventDefault()}
    onClick={() => onSelectPayment(value)}
    className={`py-2 px-1 rounded-xl border transition-all flex items-center justify-center gap-1.5 cursor-pointer relative ${selectedPayment === value ? activeClass : 'bg-[#111216] border-zinc-800/80 hover:border-zinc-700 opacity-70 hover:opacity-100'}`}
  >
    {selectedPayment === value && <span className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${dotClass}`} />}
    <span className="text-[10px] font-bold text-white tracking-wide flex items-center gap-1.5">{children}</span>
  </button>
);

export const ConfirmBidModal = memo(({ isOpen, onClose, onConfirm, itemTitle, bidAmount, bidFee, selectedPayment, onSelectPayment, showPaymentSelector = false, isSubmitting }) => {
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    if (isOpen) setAgreed(false);
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <>
    <div
      className="fixed inset-0 bg-black/75 backdrop-blur-xl z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
      style={{ backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)' }}
      role="presentation"
    >
      <div
        className="bg-[#18191E]/95 border border-amber-400/20 rounded-3xl max-w-md w-full p-5 md:p-6 shadow-2xl shadow-black/40 relative text-left text-zinc-100 space-y-4 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-summary-title"
      >
        <div className="flex items-center justify-between border-b border-zinc-800/90 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-sm"><Gavel size={20} /></div>
            <div>
              <h2 id="payment-summary-title" className="font-serif font-black text-lg md:text-xl text-white tracking-tight">Payment Summary</h2>
              <p className="text-[10px] text-zinc-400 font-medium mt-0.5">Review your bid before confirming</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer" aria-label="Close"><X size={18} /></button>
        </div>

        {showPaymentSelector && (
          <PaymentMethodSelector selectedPayment={selectedPayment} onSelectPayment={onSelectPayment} />
        )}

        <div className="space-y-3 text-xs">
          <div className="flex items-start gap-3 bg-[#111216] border border-zinc-800/80 p-3.5 rounded-2xl">
            <Package size={18} className="text-zinc-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5 flex-1 min-w-0"><p className="text-[11px] font-bold text-zinc-400">Your Bid Item:</p><p className="font-bold text-sky-400 text-xs md:text-sm leading-snug">{itemTitle || 'Auction Item'}</p></div>
          </div>
          <div className="flex items-center justify-between bg-[#111216] border border-zinc-800/80 p-3.5 rounded-2xl">
            <div className="flex items-center gap-3"><DollarSign size={18} className="text-zinc-400 shrink-0" /><span className="font-bold text-zinc-400">Your Bid Amount:</span></div>
            <span className="font-mono font-black text-white text-sm md:text-base">{parseFloat(bidAmount || 0).toFixed(2)} Br</span>
          </div>
          <div className="flex items-center justify-between bg-[#111216] border border-zinc-800/80 p-3.5 rounded-2xl">
            <div className="flex items-center gap-3"><Receipt size={18} className="text-zinc-400 shrink-0" /><span className="font-bold text-zinc-400">Bid Service Fee:</span></div>
            <div className="flex items-center gap-2"><span className="font-mono font-black text-rose-400 text-sm md:text-base">{parseFloat(bidFee || 0).toFixed(2)} Br</span><span className="bg-rose-500/15 border border-rose-500/30 text-rose-400 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase">Non-refundable</span></div>
          </div>
          <div className="flex items-center justify-between px-3 py-2 bg-[#111216]/60 border border-zinc-800/60 rounded-xl text-[11px]">
            <span className="text-zinc-400 font-medium">Payment Option:</span>
            <PaymentBadge selectedPayment={selectedPayment} />
          </div>
        </div>

        <div className="bg-[#111317] border border-zinc-800/90 rounded-2xl p-4 flex items-start gap-3 shadow-inner"><Info size={18} className="text-emerald-400 shrink-0 mt-0.5" /><p className="text-[11px] text-zinc-300 leading-relaxed font-normal">The bid service fee is non-refundable and is paid to participate in the auction. The amount submitted as a bid is not charged at the time of placing the bid. In this auction, winners are determined based on the lowest unique bid submitted among all participants. Only participants who win the auction will be required to pay the amount of their winning bid, in addition to the participation fee.</p></div>

        <div onClick={() => setAgreed(!agreed)} className="flex items-center gap-3 py-1 cursor-pointer select-none group">
          <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${agreed ? 'bg-amber-500 border-amber-400 text-black' : 'bg-zinc-900 border-zinc-700 text-transparent'}`}><CheckCircle2 size={14} className={agreed ? 'text-black' : 'opacity-0'} /></div>
          <span className="text-xs font-bold text-zinc-200 group-hover:text-white transition-colors">I agree to continue</span>
        </div>
        <button type="button" onClick={() => agreed && onConfirm()} disabled={!agreed || isSubmitting} className={`w-full font-black text-sm py-4 rounded-2xl shadow-xl transition-all uppercase tracking-wider flex items-center justify-center gap-2 ${agreed && !isSubmitting ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:brightness-110 text-black cursor-pointer active:scale-95 shadow-amber-500/20' : 'bg-gradient-to-r from-amber-500/70 via-amber-500/70 to-amber-600/70 text-black/80 cursor-not-allowed opacity-75 shadow-none'}`}>
          {isSubmitting ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-black border-t-transparent" /> : <><CheckCircle2 size={18} /><span>Confirm & Continue</span></>}
        </button>
      </div>
    </div>
    </>,
    document.body
  );
});

const PaymentBadge = ({ selectedPayment }) => {
  if (selectedPayment === 'telebirr') return <span className="font-bold text-sky-400 flex items-center gap-1.5"><img src={telebirrLogo} alt="Telebirr" className="h-4 w-auto object-contain" />Telebirr</span>;
  if (selectedPayment === 'cbe') return <span className="font-bold text-purple-400 flex items-center gap-1.5"><img src={cbeLogo} alt="CBE" className="h-4 w-auto object-contain" />CBE</span>;
  return <span className="font-bold text-amber-400 flex items-center gap-1.5"><Wallet size={14} />Wallet</span>;
};
