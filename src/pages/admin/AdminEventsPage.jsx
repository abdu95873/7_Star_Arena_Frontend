import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../../lib/apiClient.js';
import { Button, Card, Badge, Loading, ErrorState, EmptyState, Modal, Field, Input, Textarea, Select } from '../../components/ui.jsx';
import { taka, fmtDate, statusTone, apiError } from '../../utils/format.js';

export default function AdminEventsPage() {
  const qc = useQueryClient();
  const [editModal, setEditModal] = useState(null);
  const [regsEvent, setRegsEvent] = useState(null);

  const { data: venues } = useQuery({ queryKey: ['admin-venues'], queryFn: async () => (await api.get('/admin/venues')).data.data.venues });
  const { data: events, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-events'],
    queryFn: async () => (await api.get('/admin/events')).data.data.events,
  });

  const save = useMutation({
    mutationFn: async (e) => (e._id ? api.patch(`/admin/events/${e._id}`, e.payload) : api.post('/admin/events', e.payload)),
    onSuccess: () => { toast.success('Event saved'); qc.invalidateQueries({ queryKey: ['admin-events'] }); setEditModal(null); },
    onError: (err) => toast.error(apiError(err)),
  });

  const del = useMutation({
    mutationFn: async (id) => api.delete(`/admin/events/${id}`),
    onSuccess: () => { toast.success('Event cancelled'); qc.invalidateQueries({ queryKey: ['admin-events'] }); },
    onError: (err) => toast.error(apiError(err)),
  });

  if (isLoading) return <Loading />;
  if (isError) return <ErrorState onRetry={refetch} />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Events</h1>
          <p className="text-sm text-ink-400">Create events and manage registrations.</p>
        </div>
        <Button onClick={() => setEditModal({})} disabled={!venues?.length}>+ New event</Button>
      </div>

      {(events || []).length === 0 ? (
        <EmptyState icon="🏆" title="No events yet" />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-ink-800 text-left text-ink-400">
                <th className="p-3">Title</th><th className="p-3">Date</th><th className="p-3">Fee</th>
                <th className="p-3">Participants</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e._id} className="border-b border-ink-800/60">
                  <td className="p-3 text-ink-100">{e.title}</td>
                  <td className="p-3 text-ink-300">{fmtDate(e.date)}</td>
                  <td className="p-3 text-ink-300">{e.entryFee ? taka(e.entryFee) : 'Free'}</td>
                  <td className="p-3 text-ink-300">{e.currentParticipants}/{e.maxParticipants}</td>
                  <td className="p-3"><Badge tone={statusTone(e.status)}>{e.status}</Badge></td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1.5">
                      <button className="rounded bg-ink-700/50 px-2 py-1 text-xs text-ink-200 hover:bg-ink-700" onClick={() => setRegsEvent(e)}>Registrants</button>
                      <button className="rounded bg-turf-500/15 px-2 py-1 text-xs text-turf-300 hover:bg-turf-500/25" onClick={() => setEditModal(e)}>Edit</button>
                      {e.status !== 'cancelled' && <button className="rounded bg-red-500/15 px-2 py-1 text-xs text-red-300 hover:bg-red-500/25" onClick={() => del.mutate(e._id)}>Cancel</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {editModal && <EventModal event={editModal} venues={venues || []} onClose={() => setEditModal(null)} onSave={save.mutate} saving={save.isPending} />}
      {regsEvent && <RegistrantsModal event={regsEvent} onClose={() => setRegsEvent(null)} />}
    </div>
  );
}

function EventModal({ event, venues, onClose, onSave, saving }) {
  const [form, setForm] = useState({
    title: event.title || '', description: event.description || '',
    venueId: event.venueId?._id || event.venueId || venues[0]?._id || '',
    date: event.date ? format(new Date(event.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    startTime: event.startTime || '16:00', endTime: event.endTime || '20:00',
    entryFee: event.entryFee ?? 500, maxParticipants: event.maxParticipants ?? 16,
    registrationDeadline: event.registrationDeadline ? format(new Date(event.registrationDeadline), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    images: (event.images || []).join(', '),
    status: event.status || 'upcoming',
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = () => {
    const payload = {
      title: form.title, description: form.description, venueId: form.venueId,
      date: form.date, startTime: form.startTime, endTime: form.endTime,
      entryFee: Number(form.entryFee), maxParticipants: Number(form.maxParticipants),
      registrationDeadline: form.registrationDeadline,
      images: form.images ? form.images.split(',').map((s) => s.trim()).filter(Boolean) : [],
      ...(event._id ? { status: form.status } : {}),
    };
    onSave({ _id: event._id, payload });
  };

  return (
    <Modal open onClose={onClose} title={event._id ? 'Edit event' : 'New event'}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button loading={saving} onClick={submit}>Save</Button></>}>
      <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
        <Field label="Title"><Input value={form.title} onChange={set('title')} /></Field>
        <Field label="Venue"><Select value={form.venueId} onChange={set('venueId')}>{venues.map((v) => <option key={v._id} value={v._id}>{v.name}</option>)}</Select></Field>
        <Field label="Description"><Textarea value={form.description} onChange={set('description')} /></Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Date"><Input type="date" value={form.date} onChange={set('date')} /></Field>
          <Field label="Start"><Input value={form.startTime} onChange={set('startTime')} /></Field>
          <Field label="End"><Input value={form.endTime} onChange={set('endTime')} /></Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Entry fee"><Input type="number" value={form.entryFee} onChange={set('entryFee')} /></Field>
          <Field label="Max participants"><Input type="number" value={form.maxParticipants} onChange={set('maxParticipants')} /></Field>
          <Field label="Reg. deadline"><Input type="date" value={form.registrationDeadline} onChange={set('registrationDeadline')} /></Field>
        </div>
        {event._id && (
          <Field label="Status"><Select value={form.status} onChange={set('status')}>{['upcoming', 'ongoing', 'completed', 'cancelled'].map((s) => <option key={s} value={s}>{s}</option>)}</Select></Field>
        )}
        <Field label="Image URLs (comma separated)"><Textarea value={form.images} onChange={set('images')} /></Field>
      </div>
    </Modal>
  );
}

function RegistrantsModal({ event, onClose }) {
  const { data, isLoading } = useQuery({
    queryKey: ['event-regs', event._id],
    queryFn: async () => (await api.get(`/admin/events/${event._id}/registrations`)).data.data.registrations,
  });

  const exportCsv = async () => {
    try {
      const res = await api.get(`/admin/events/${event._id}/registrations/export`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url; a.download = `registrants-${event._id}.csv`; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Export failed'); }
  };

  const regs = data || [];
  return (
    <Modal open onClose={onClose} title={`Registrants — ${event.title}`}
      footer={<><Button variant="outline" onClick={exportCsv} disabled={!regs.length}>Export CSV</Button><Button variant="ghost" onClick={onClose}>Close</Button></>}>
      <div className="max-h-[55vh] overflow-y-auto">
        {isLoading ? <Loading /> : regs.length === 0 ? <EmptyState icon="📭" title="No registrants yet" /> : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-ink-800 text-left text-ink-400"><th className="py-2">Name</th><th className="py-2">Team</th><th className="py-2">Players</th><th className="py-2">Paid</th><th className="py-2">Status</th></tr></thead>
            <tbody>
              {regs.map((r) => (
                <tr key={r._id} className="border-b border-ink-800/60">
                  <td className="py-2 text-ink-200">{r.userId?.name}<div className="text-xs text-ink-500">{r.userId?.phone}</div></td>
                  <td className="py-2 text-ink-300">{r.teamName || '—'}</td>
                  <td className="py-2 text-ink-300">{r.participantsCount}</td>
                  <td className="py-2 text-ink-300">{taka(r.amountPaid)}</td>
                  <td className="py-2"><Badge tone={statusTone(r.status)}>{r.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Modal>
  );
}
