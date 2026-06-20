import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../lib/apiClient.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Button, Card, Badge, Loading, ErrorState, Field, Input } from '../../components/ui.jsx';
import { taka, fmtDate, fmtRange, apiError } from '../../utils/format.js';

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [teamName, setTeamName] = useState('');
  const [count, setCount] = useState(1);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['event', id],
    queryFn: async () => (await api.get(`/events/${id}`)).data.data.event,
  });

  const registerMut = useMutation({
    mutationFn: async () => (await api.post(`/events/${id}/register`, { teamName, participantsCount: Number(count) })).data.data,
    onSuccess: async ({ registration, requiresPayment }) => {
      if (!requiresPayment) {
        toast.success('Registered! (free event)');
        navigate('/dashboard/events');
        return;
      }
      try {
        const { data: pay } = await api.post(`/events/registrations/${registration._id}/initiate-payment`);
        if (pay.data.bkashURL) window.location.href = pay.data.bkashURL;
      } catch (err) {
        toast.error(apiError(err, 'Could not start payment'));
      }
    },
    onError: (err) => toast.error(apiError(err, 'Registration failed')),
  });

  if (isLoading) return <div className="mx-auto max-w-4xl px-6 py-16"><Loading /></div>;
  if (isError || !data) return <div className="mx-auto max-w-4xl px-6 py-16"><ErrorState onRetry={refetch} /></div>;

  const ev = data;
  const full = ev.currentParticipants >= ev.maxParticipants;
  const closed = new Date(ev.registrationDeadline) < new Date() || !['upcoming', 'ongoing'].includes(ev.status);

  const handleRegister = () => {
    if (!isAuthenticated) {
      toast('Please log in to register.', { icon: '🔒' });
      navigate('/login', { state: { from: { pathname: `/events/${id}` } } });
      return;
    }
    registerMut.mutate();
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <Link to="/#events" className="text-sm text-ink-400 hover:text-turf-300">← All events</Link>
      <Card className="mt-4 overflow-hidden">
        <img src={ev.images?.[0] || 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=1200'} alt={ev.title} className="h-60 w-full object-cover" />
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="orange">{ev.status}</Badge>
            <Badge tone={full ? 'red' : 'green'}>{ev.currentParticipants}/{ev.maxParticipants} registered</Badge>
          </div>
          <h1 className="mt-4 text-3xl font-extrabold text-white">{ev.title}</h1>
          <p className="mt-2 text-ink-400">{ev.venueId?.name} · {fmtDate(ev.date)} · {fmtRange(ev.startTime, ev.endTime)}</p>
          <p className="mt-5 whitespace-pre-line text-ink-300">{ev.description}</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <Card className="p-4"><p className="text-xs text-ink-500">Entry fee</p><p className="text-lg font-bold text-turf-300">{ev.entryFee ? taka(ev.entryFee) : 'Free'}</p></Card>
            <Card className="p-4"><p className="text-xs text-ink-500">Deadline</p><p className="text-lg font-bold text-white">{fmtDate(ev.registrationDeadline)}</p></Card>
            <Card className="p-4"><p className="text-xs text-ink-500">Spots left</p><p className="text-lg font-bold text-white">{Math.max(0, ev.maxParticipants - ev.currentParticipants)}</p></Card>
          </div>

          {closed || full ? (
            <p className="mt-6 rounded-lg bg-ink-900/60 p-4 text-center text-sm text-ink-400">
              {full ? 'This event is fully booked.' : 'Registration is closed for this event.'}
            </p>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Team name (optional)">
                <Input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="e.g. Dhaka Strikers" />
              </Field>
              <Field label="Participants" hint={ev.entryFee ? `Total: ${taka(ev.entryFee * count)}` : 'Free entry'}>
                <Input type="number" min={1} max={Math.max(1, ev.maxParticipants - ev.currentParticipants)} value={count} onChange={(e) => setCount(e.target.value)} />
              </Field>
              <div className="sm:col-span-2">
                <Button className="w-full" loading={registerMut.isPending} onClick={handleRegister}>
                  {ev.entryFee ? `Register & pay ${taka(ev.entryFee * count)}` : 'Register for free'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
