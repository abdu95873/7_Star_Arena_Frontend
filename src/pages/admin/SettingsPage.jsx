import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../lib/apiClient.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Button, Card, Field, Input, Loading, ErrorState } from '../../components/ui.jsx';
import { apiError } from '../../utils/format.js';

export default function SettingsPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => (await api.get('/admin/settings')).data.data.settings,
  });

  const [form, setForm] = useState(null);
  useEffect(() => { if (data) setForm(data); }, [data]);

  const save = useMutation({
    mutationFn: async () => api.patch('/admin/settings', {
      cancellationWindowHours: Number(form.cancellationWindowHours),
      pendingBookingExpiryMinutes: Number(form.pendingBookingExpiryMinutes),
      allowUserSelfCancel: form.allowUserSelfCancel,
    }),
    onSuccess: () => { toast.success('Settings saved'); qc.invalidateQueries({ queryKey: ['settings'] }); },
    onError: (err) => toast.error(apiError(err)),
  });

  if (isLoading || !form) return <Loading />;
  if (isError) return <ErrorState onRetry={refetch} />;

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-ink-400">Business rules for cancellations and reservations.</p>
      </div>

      <Card className="space-y-4 p-6">
        <Field label="Cancellation window (hours)" hint="Free refund only if cancelled more than this many hours before the slot.">
          <Input type="number" min={0} value={form.cancellationWindowHours} disabled={!isAdmin}
            onChange={(e) => setForm((f) => ({ ...f, cancellationWindowHours: e.target.value }))} />
        </Field>
        <Field label="Pending booking expiry (minutes)" hint="Unpaid reservations are released after this many minutes.">
          <Input type="number" min={1} value={form.pendingBookingExpiryMinutes} disabled={!isAdmin}
            onChange={(e) => setForm((f) => ({ ...f, pendingBookingExpiryMinutes: e.target.value }))} />
        </Field>
        <label className="flex items-center gap-3 text-sm text-ink-200">
          <input type="checkbox" checked={form.allowUserSelfCancel} disabled={!isAdmin}
            onChange={(e) => setForm((f) => ({ ...f, allowUserSelfCancel: e.target.checked }))}
            className="h-4 w-4 rounded border-ink-600 bg-ink-900 text-turf-500" />
          Allow users to cancel their own bookings
        </label>
        {isAdmin ? (
          <Button loading={save.isPending} onClick={() => save.mutate()}>Save settings</Button>
        ) : (
          <p className="text-xs text-amber-300">Only admins can change settings (you are staff).</p>
        )}
      </Card>
    </div>
  );
}
