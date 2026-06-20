import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../lib/apiClient.js';
import { Button, Card, Loading, ErrorState, Badge } from '../../components/ui.jsx';
import { taka, fmtDate, fmtRange, apiError, statusTone } from '../../utils/format.js';

function Countdown({ expiresAt }) {
  const [left, setLeft] = useState(() => Math.max(0, new Date(expiresAt) - Date.now()));
  useEffect(() => {
    const t = setInterval(() => setLeft(Math.max(0, new Date(expiresAt) - Date.now())), 1000);
    return () => clearInterval(t);
  }, [expiresAt]);
  if (!expiresAt) return null;
  const m = Math.floor(left / 60000);
  const s = Math.floor((left % 60000) / 1000);
  return (
    <span className={left < 120000 ? 'text-red-400' : 'text-amber-300'}>
      {left > 0 ? `Reserved for ${m}:${String(s).padStart(2, '0')}` : 'Reservation expired'}
    </span>
  );
}

export default function CheckoutPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['booking', id],
    queryFn: async () => (await api.get(`/bookings/${id}`)).data.data.booking,
  });

  const pay = useMutation({
    mutationFn: async () => (await api.post(`/bookings/${id}/initiate-payment`)).data.data,
    onSuccess: ({ bkashURL }) => {
      if (bkashURL) window.location.href = bkashURL;
      else toast.error('Could not start payment');
    },
    onError: (err) => toast.error(apiError(err, 'Payment could not be started')),
  });

  if (isLoading) return <div className="mx-auto max-w-2xl px-6 py-16"><Loading /></div>;
  if (isError || !data) return <div className="mx-auto max-w-2xl px-6 py-16"><ErrorState onRetry={refetch} /></div>;

  const booking = data;
  const alreadyPaid = ['paid', 'partial'].includes(booking.paymentStatus);

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-bold text-white">Complete your booking</h1>
      <p className="mt-1 text-sm text-ink-400">{booking.venueId?.name}</p>

      <Card className="mt-6 p-6">
        <div className="flex items-center justify-between">
          <Badge tone={statusTone(booking.bookingStatus)}>{booking.bookingStatus}</Badge>
          {booking.bookingStatus === 'pending' && <Countdown expiresAt={booking.expiresAt} />}
        </div>

        <div className="mt-5 space-y-2">
          {booking.slotIds?.map((s) => (
            <div key={s._id} className="flex justify-between rounded-lg bg-ink-900/60 px-4 py-2.5 text-sm">
              <span className="text-ink-200">{fmtDate(s.date)} · {fmtRange(s.startTime, s.endTime)}</span>
              <span className="text-ink-300">{taka(s.price)}</span>
            </div>
          ))}
        </div>

        <div className="mt-5 space-y-1.5 border-t border-ink-800 pt-4 text-sm">
          <div className="flex justify-between"><span className="text-ink-400">Total</span><span className="font-semibold text-white">{taka(booking.totalAmount)}</span></div>
          <div className="flex justify-between"><span className="text-ink-400">Advance (pay now)</span><span className="font-semibold text-turf-300">{taka(booking.advanceDue)}</span></div>
          <div className="flex justify-between"><span className="text-ink-400">Due at venue</span><span className="text-ink-300">{taka(booking.dueAmount)}</span></div>
        </div>

        {alreadyPaid ? (
          <div className="mt-6 text-center">
            <p className="text-turf-300">✅ This booking is already confirmed.</p>
            <Button as={Link} to="/dashboard" className="mt-3">Go to my bookings</Button>
          </div>
        ) : (
          <>
            <Button className="mt-6 w-full !bg-[#e2136e] hover:!bg-[#c30e5e]" loading={pay.isPending} onClick={() => pay.mutate()}>
              Pay {taka(booking.advanceDue)} with bKash
            </Button>
            {import.meta.env.VITE_BKASH_MODE === 'sandbox' && (
              <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-left text-xs text-amber-200/90">
                <p className="font-semibold text-amber-200">Sandbox test mode</p>
                <p className="mt-1">Use any sandbox bKash wallet number. OTP: <strong>123456</strong> · PIN: <strong>12121</strong></p>
                <p className="mt-1 text-amber-200/70">No real money is charged.</p>
              </div>
            )}
            <button onClick={() => navigate('/')} className="mt-3 w-full text-center text-sm text-ink-500 hover:text-ink-300">
              Cancel and go back
            </button>
          </>
        )}
      </Card>
    </div>
  );
}
