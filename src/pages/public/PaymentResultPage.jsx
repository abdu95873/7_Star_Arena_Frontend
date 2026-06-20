import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../lib/apiClient.js';
import { Button, Card, Spinner } from '../../components/ui.jsx';

// Frontend landing page after the bKash redirect. The backend callback already
// finalized the payment server-side; we re-verify (idempotent) for a clean UI state.
export default function PaymentResultPage() {
  const [params] = useSearchParams();
  const status = params.get('status');
  const paymentID = params.get('paymentID');
  const kind = params.get('kind');
  const [state, setState] = useState(status === 'success' ? 'verifying' : 'failed');

  useEffect(() => {
    if (status !== 'success') return;
    // If we have a paymentID, confirm; otherwise trust the callback's success flag.
    if (!paymentID) {
      setState('success');
      return;
    }
    api
      .post('/bookings/payment/verify', { paymentID })
      .then((r) => setState(r.data.data.verified ? 'success' : 'failed'))
      .catch(() => setState('success')); // callback already finalized; treat as success
  }, [status, paymentID]);

  const isEvent = kind === 'event';
  const next = isEvent ? '/dashboard/events' : '/dashboard';

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-24 text-center">
      <Card className="w-full p-10">
        {state === 'verifying' && (
          <div className="flex flex-col items-center gap-4">
            <Spinner className="h-10 w-10 text-turf-400" />
            <p className="text-ink-300">Verifying your payment…</p>
          </div>
        )}
        {state === 'success' && (
          <div className="flex flex-col items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-turf-500/15 text-3xl">✅</div>
            <h1 className="text-2xl font-bold text-white">Payment successful!</h1>
            <p className="text-ink-400">
              Your {isEvent ? 'event registration' : 'booking'} is confirmed. A confirmation email is on its way.
            </p>
            <Button as={Link} to={next} className="mt-2">View my {isEvent ? 'events' : 'bookings'}</Button>
          </div>
        )}
        {state === 'failed' && (
          <div className="flex flex-col items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-red-500/15 text-3xl">❌</div>
            <h1 className="text-2xl font-bold text-white">Payment {status === 'cancel' ? 'cancelled' : 'failed'}</h1>
            <p className="text-ink-400">Your slot reservation was not confirmed. You can try again from your dashboard.</p>
            <div className="flex gap-3">
              <Button as={Link} to="/" variant="outline">Home</Button>
              <Button as={Link} to={next}>My dashboard</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
