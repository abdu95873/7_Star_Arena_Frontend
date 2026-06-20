import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../lib/apiClient.js';
import { Button, Card, Badge, Loading, ErrorState, EmptyState, Modal } from '../../components/ui.jsx';
import { taka, fmtDate, fmtRange, statusTone, apiError } from '../../utils/format.js';

async function downloadInvoice(id) {
  const res = await api.get(`/bookings/${id}/invoice`, { responseType: 'blob' });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = `invoice-${id}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function MyBookingsPage() {
  const qc = useQueryClient();
  const [cancelId, setCancelId] = useState(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: async () => (await api.get('/bookings/my')).data.data.bookings,
  });

  const cancel = useMutation({
    mutationFn: async (id) => (await api.patch(`/bookings/${id}/cancel`)).data,
    onSuccess: (res) => {
      toast.success(res.message || 'Booking cancelled');
      qc.invalidateQueries({ queryKey: ['my-bookings'] });
      setCancelId(null);
    },
    onError: (err) => { toast.error(apiError(err)); setCancelId(null); },
  });

  if (isLoading) return <Loading />;
  if (isError) return <ErrorState onRetry={refetch} />;

  const bookings = data || [];
  if (!bookings.length) {
    return <EmptyState icon="🗓️" title="No bookings yet" description="Reserve your first turf slot to see it here." action={<Button as={Link} to="/#book" className="mt-2">Book a slot</Button>} />;
  }

  return (
    <div className="space-y-4">
      {bookings.map((b) => {
        const canCancel = ['pending', 'confirmed'].includes(b.bookingStatus);
        const needsPayment = b.bookingStatus === 'pending' && b.paymentStatus !== 'paid';
        return (
          <Card key={b._id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white">{b.venueId?.name || 'Venue'}</h3>
                  <Badge tone={statusTone(b.bookingStatus)}>{b.bookingStatus}</Badge>
                  <Badge tone={statusTone(b.paymentStatus)}>{b.paymentStatus}</Badge>
                </div>
                <div className="mt-2 space-y-1 text-sm text-ink-400">
                  {b.slotIds?.map((s) => (
                    <div key={s._id}>{fmtDate(s.date)} · {fmtRange(s.startTime, s.endTime)}</div>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-white">{taka(b.totalAmount)}</p>
                <p className="text-xs text-ink-500">Paid {taka(b.advancePaid)} · Due {taka(b.dueAmount)}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 border-t border-ink-800 pt-4">
              {needsPayment && <Button as={Link} to={`/checkout/booking/${b._id}`} className="!py-2">Complete payment</Button>}
              {b.paymentStatus !== 'pending' && (
                <Button variant="outline" className="!py-2" onClick={() => downloadInvoice(b._id).catch(() => toast.error('Could not download'))}>
                  Download invoice
                </Button>
              )}
              {canCancel && <Button variant="ghost" className="!py-2 text-red-400" onClick={() => setCancelId(b._id)}>Cancel</Button>}
            </div>
          </Card>
        );
      })}

      <Modal
        open={Boolean(cancelId)}
        onClose={() => setCancelId(null)}
        title="Cancel booking?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCancelId(null)}>Keep it</Button>
            <Button variant="danger" loading={cancel.isPending} onClick={() => cancel.mutate(cancelId)}>Yes, cancel</Button>
          </>
        }
      >
        Refunds apply only if cancelled more than 48 hours before the slot. Within 48 hours, the advance is non-refundable.
      </Modal>
    </div>
  );
}
