import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../../lib/apiClient.js';
import { Card, Badge, Loading, ErrorState, EmptyState, Select, Input } from '../../components/ui.jsx';
import { taka, fmtTime, apiError } from '../../utils/format.js';

export default function AdminSlotsPage() {
  const qc = useQueryClient();
  const [venueId, setVenueId] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [status, setStatus] = useState('all');

  const { data: venues } = useQuery({ queryKey: ['admin-venues'], queryFn: async () => (await api.get('/admin/venues')).data.data.venues });
  const activeVenue = venueId || venues?.[0]?._id || '';

  const params = new URLSearchParams({ date, status, ...(activeVenue ? { venueId: activeVenue } : {}) }).toString();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-slots', params],
    queryFn: async () => (await api.get(`/admin/slots?${params}`)).data.data,
    enabled: Boolean(activeVenue),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, next }) => api.patch(`/admin/slots/${id}/status`, { status: next }),
    onSuccess: () => { toast.success('Slot updated'); qc.invalidateQueries({ queryKey: ['admin-slots'] }); },
    onError: (err) => toast.error(apiError(err)),
  });

  const slots = data?.slots || [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Slot checking</h1>
        <p className="text-sm text-ink-400">View availability and block/unblock slots.</p>
      </div>

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Select value={activeVenue} onChange={(e) => setVenueId(e.target.value)}>
            {(venues || []).map((v) => <option key={v._id} value={v._id}>{v.name}</option>)}
          </Select>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            {['all', 'available', 'booked', 'blocked'].map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>
        {data?.counts && (
          <div className="mt-3 flex gap-4 text-sm">
            <span className="text-turf-300">● {data.counts.available} available</span>
            <span className="text-red-300">● {data.counts.booked} booked</span>
            <span className="text-ink-400">● {data.counts.blocked} blocked</span>
          </div>
        )}
      </Card>

      {isLoading ? (
        <Loading />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : slots.length === 0 ? (
        <EmptyState icon="🟩" title="No slots for this date" description="Generate slots from a template under Venues." />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {slots.map((s) => (
            <Card key={s._id} className="p-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">{fmtTime(s.startTime)}</span>
                <Badge tone={s.status === 'available' ? 'green' : s.status === 'booked' ? 'red' : 'gray'}>{s.status}</Badge>
              </div>
              <p className="mt-1 text-xs text-ink-500">{fmtTime(s.endTime)} · {taka(s.price)}</p>
              {s.status !== 'booked' && (
                <button
                  className="mt-2 w-full rounded bg-ink-800 py-1 text-xs text-ink-200 hover:bg-ink-700"
                  onClick={() => toggle.mutate({ id: s._id, next: s.status === 'blocked' ? 'available' : 'blocked' })}
                >
                  {s.status === 'blocked' ? 'Unblock' : 'Block'}
                </button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
