import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';

const PaymentResult = () => {
  const [searchParams] = useSearchParams();
  const success = searchParams.get('status') === 'success';

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
          : searchParams.get('message') || 'Your bid was not placed. You can try again from the auction.'}
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
