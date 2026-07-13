import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../lib/apiClient.js';
import {
  Button, Card, Badge, Loading, ErrorState, EmptyState, Select, Input, Modal, Field, Textarea,
} from '../../components/ui.jsx';
import { fmtDateTime, apiError } from '../../utils/format.js';

export default function AdminContactPage() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState({ read: '', q: '' });
  const [selected, setSelected] = useState(null);

  const query = new URLSearchParams(Object.entries(filters).filter(([, v]) => v)).toString();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-contact', query],
    queryFn: async () => (await api.get(`/admin/contact?${query}`)).data.data,
  });

  const markRead = useMutation({
    mutationFn: (id) => api.patch(`/admin/contact/${id}/read`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-contact'] });
      setSelected((m) => (m ? { ...m, read: true } : null));
    },
    onError: (err) => toast.error(apiError(err, 'Could not update message')),
  });

  const remove = useMutation({
    mutationFn: (id) => api.delete(`/admin/contact/${id}`),
    onSuccess: () => {
      toast.success('Message deleted');
      qc.invalidateQueries({ queryKey: ['admin-contact'] });
      setSelected(null);
    },
    onError: (err) => toast.error(apiError(err, 'Could not delete message')),
  });

  const messages = data?.messages || [];
  const unread = data?.unread ?? 0;

  const openMessage = (msg) => {
    setSelected(msg);
    if (!msg.read) markRead.mutate(msg._id);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Messages</h1>
          <p className="mt-1 text-sm text-ink-400">Contact form submissions from the public site.</p>
        </div>
        {unread > 0 && <Badge tone="amber">{unread} unread</Badge>}
      </div>

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Search">
            <Input
              placeholder="Name, email, or message…"
              value={filters.q}
              onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            />
          </Field>
          <Field label="Status">
            <Select value={filters.read} onChange={(e) => setFilters((f) => ({ ...f, read: e.target.value }))}>
              <option value="">All</option>
              <option value="false">Unread</option>
              <option value="true">Read</option>
            </Select>
          </Field>
        </div>
      </Card>

      {isLoading ? (
        <Loading />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : messages.length === 0 ? (
        <EmptyState icon="✉️" title="No messages yet" description="Submissions from the contact form will appear here." />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-ink-800 text-left text-xs uppercase tracking-wide text-ink-500">
                <th className="p-3">Date</th>
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Preview</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((m) => (
                <tr
                  key={m._id}
                  className={`cursor-pointer border-b border-ink-800/60 transition hover:bg-white/5 ${!m.read ? 'bg-turf-500/5' : ''}`}
                  onClick={() => openMessage(m)}
                >
                  <td className="p-3 text-xs text-ink-400">{fmtDateTime(m.createdAt)}</td>
                  <td className="p-3 font-medium text-ink-200">{m.name}</td>
                  <td className="p-3 text-ink-300">{m.email}</td>
                  <td className="max-w-xs truncate p-3 text-ink-400">{m.message}</td>
                  <td className="p-3">
                    <Badge tone={m.read ? 'gray' : 'green'}>{m.read ? 'Read' : 'New'}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data?.pagination && (
            <div className="border-t border-ink-800 p-3 text-xs text-ink-500">
              Showing {messages.length} of {data.pagination.total}
            </div>
          )}
        </Card>
      )}

      {selected && (
        <Modal
          open
          size="lg"
          onClose={() => setSelected(null)}
          title="Message"
          footer={
            <>
              <Button
                variant="danger"
                loading={remove.isPending}
                onClick={() => {
                  if (window.confirm('Delete this message?')) remove.mutate(selected._id);
                }}
              >
                Delete
              </Button>
              <Button variant="ghost" onClick={() => setSelected(null)}>Close</Button>
            </>
          }
        >
          <div className="space-y-3 text-sm">
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-ink-400">
              <span><strong className="text-ink-300">From:</strong> {selected.name}</span>
              <span><strong className="text-ink-300">Email:</strong> {selected.email}</span>
              <span><strong className="text-ink-300">Date:</strong> {fmtDateTime(selected.createdAt)}</span>
            </div>
            <div className="rounded-lg border border-ink-800 bg-ink-900/50 p-4 whitespace-pre-wrap text-ink-200">
              {selected.message}
            </div>
            <a href={`mailto:${selected.email}`} className="inline-block text-turf-400 hover:text-turf-300">
              Reply via email →
            </a>
          </div>
        </Modal>
      )}
    </div>
  );
}
