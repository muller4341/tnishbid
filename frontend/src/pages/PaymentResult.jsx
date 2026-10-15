import React, { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';

const PaymentResult = () => {
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status');
  const success = status === 'success';
  const message = searchParams.get('message') || '';
  const txRef  = searchParams.get('tx_ref') || '';

  /* If we are inside the ChapaEmbeddedModal iframe, notify the parent
     window so it can close the modal and show the result inline.
     If we are the top-level window (standalone visit), just render normally. */
  useEffect(() => {
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(
          { type: 'CHAPA_PAYMENT_RESULT', status, tx_ref: txRef, message },
          window.location.origin
        );
      }
    } catch {
      // cross-origin guard — ignore silently
    }
  }, [status, txRef, message]);

  return (
    <div className="max-w-md mx-auto py-16 px-4 text-center">
      {success ? (
        <CheckCircle2 className="mx-auto text-emerald-400" size={56} />
      ) : (
        <XCircle className="mx-auto text-rose-400" size={56} />
      )}
      <h1 className="mt-5 text-2xl font-black text-white">
        {success ? 'Payment successful' : 'Payment not completed'}
      </h1>
      <p className="mt-2 text-sm text-zinc-400">
        {success
          ? 'Your participation fee was received and your bid has been placed.'
          : message || 'Your bid was not placed. You can try again from the auction.'}
      </p>
      <Link
        to="/"
        className="inline-flex mt-7 px-5 py-3 rounded-xl bg-amber-500 text-black font-black text-sm"
      >
        Return to auctions
      </Link>
    </div>
  );
};

export default PaymentResult;
