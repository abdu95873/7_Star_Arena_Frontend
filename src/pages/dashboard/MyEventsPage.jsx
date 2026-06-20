import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/apiClient.js';
import { Button, Card, Badge, Loading, ErrorState, EmptyState } from '../../components/ui.jsx';
import { taka, fmtDate, fmtRange, statusTone } from '../../utils/format.js';

export default function MyEventsPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['my-registrations'],
    queryFn: async () => (await api.get('/events/registrations/mine')).data.data.registrations,
  });

  if (isLoading) return <Loading />;
  if (isError) return <ErrorState onRetry={refetch} />;

  const regs = data || [];
  if (!regs.length) {
    return <EmptyState icon="🏆" title="No event registrations" description="Join a tournament and it'll show up here." action={<Button as={Link} to="/#events" className="mt-2">Browse events</Button>} />;
  }

  return (
    <div className="space-y-4">
      {regs.map((r) => (
        <Card key={r._id} className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white">{r.eventId?.title || 'Event'}</h3>
              <Badge tone={statusTone(r.status)}>{r.status}</Badge>
              <Badge tone={statusTone(r.paymentStatus)}>{r.paymentStatus}</Badge>
            </div>
            <p className="mt-1 text-sm text-ink-400">
              {r.eventId?.venueId?.name} · {fmtDate(r.eventId?.date)} · {fmtRange(r.eventId?.startTime, r.eventId?.endTime)}
            </p>
            {r.teamName && <p className="mt-1 text-xs text-ink-500">Team: {r.teamName} · {r.participantsCount} players</p>}
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-white">{taka(r.totalAmount)}</p>
            <p className="text-xs text-ink-500">Paid {taka(r.amountPaid)}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
