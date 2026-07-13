import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../../lib/apiClient.js';
import { Button, Card, Badge, Loading, ErrorState, EmptyState, Modal, Field, Input, Select } from '../../components/ui.jsx';
import { taka, fmtDate, fmtDateTime, fmtRange, statusTone, apiError } from '../../utils/format.js';
import { isAdminBookableSlot, todayKeyDhaka, shouldHideBookingActions, isBookingFullyEnded } from '../../utils/slots.js';

export default function AdminBookingsPage() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState({ status: '', paymentStatus: '', q: '', from: '', to: '' });
  const [action, setAction] = useState(null); // { type, booking }
  const [showNew, setShowNew] = useState(false);

  const query = new URLSearchParams(Object.entries(filters).filter(([, v]) => v)).toString();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-bookings', query],
    queryFn: async () => (await api.get(`/admin/bookings?${query}`)).data.data,
  });

  const mutate = useMutation({
    mutationFn: async ({ type, booking, amount, discount }) => {
      if (type === 'cancel') return api.patch(`/admin/bookings/${booking._id}/cancel`);
      if (type === 'mark-paid') {
        return api.patch(`/admin/bookings/${booking._id}/mark-paid`, {
          amount: amount ?? 0,
          discount: discount ?? 0,
        });
      }
      if (type === 'mark-absent') return api.patch(`/admin/bookings/${booking._id}/mark-absent`);
      if (type === 'refund') return api.post(`/admin/bookings/${booking._id}/refund`, amount ? { amount } : {});
      return null;
    },
    onSuccess: (res) => {
      toast.success(res?.data?.message || 'Done');
      qc.invalidateQueries({ queryKey: ['admin-bookings'] });
      setAction(null);
    },
    onError: (err) => { toast.error(apiError(err)); setAction(null); },
  });

  const bookings = data?.bookings || [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Bookings</h1>
          <p className="text-sm text-ink-400">Search, filter, and manage all bookings.</p>
        </div>
        <Button onClick={() => setShowNew(true)}>+ New booking</Button>
      </div>

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Input placeholder="Search name/email/phone" value={filters.q} onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))} />
          <Select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
            <option value="">All statuses</option>
            {['pending', 'confirmed', 'cancelled', 'completed', 'no-show'].map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Select value={filters.paymentStatus} onChange={(e) => setFilters((f) => ({ ...f, paymentStatus: e.target.value }))}>
            <option value="">All payments</option>
            {['pending', 'partial', 'paid', 'refunded', 'failed'].map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Input type="date" value={filters.from} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))} />
          <Input type="date" value={filters.to} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))} />
        </div>
      </Card>

      {isLoading ? (
        <Loading />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : bookings.length === 0 ? (
        <EmptyState icon="🗓️" title="No bookings match your filters" />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="border-b border-ink-800 text-left text-ink-400">
                <th className="p-3">Customer</th><th className="p-3">Slots</th><th className="p-3">Amount</th>
                <th className="p-3">Status</th><th className="p-3">Created</th><th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b._id} className="border-b border-ink-800/60 align-top">
                  <td className="p-3">
                    <div className="font-medium text-ink-100">{b.userId?.name}</div>
                    <div className="text-xs text-ink-500">{b.userId?.phone}</div>
                  </td>
                  <td className="p-3 text-xs text-ink-300">
                    {b.slotIds?.map((s) => <div key={s._id}>{fmtDate(s.date)} {fmtRange(s.startTime, s.endTime)}</div>)}
                  </td>
                  <td className="p-3">
                    <div className="text-ink-100">{taka(b.totalAmount)}</div>
                    {b.discount > 0 && <div className="text-xs text-turf-400">Disc −{taka(b.discount)}</div>}
                    <div className="text-xs text-ink-500">Due {taka(b.dueAmount)}</div>
                  </td>
                  <td className="p-3 space-y-1">
                    <Badge tone={statusTone(b.bookingStatus)}>{b.bookingStatus}</Badge>{' '}
                    <Badge tone={statusTone(b.paymentStatus)}>{b.paymentStatus}</Badge>
                  </td>
                  <td className="p-3 text-xs text-ink-400">{fmtDateTime(b.createdAt)}</td>
                  <td className="p-3">
                    {shouldHideBookingActions(b) ? (
                      <span className="block text-right text-xs text-ink-600">Completed</span>
                    ) : (
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {b.dueAmount > 0 && b.bookingStatus !== 'cancelled' && (
                        <button className="rounded bg-turf-500/15 px-2 py-1 text-xs text-turf-300 hover:bg-turf-500/25" onClick={() => setAction({ type: 'mark-paid', booking: b })}>Pay due</button>
                      )}
                      {['pending', 'confirmed'].includes(b.bookingStatus) && !isBookingFullyEnded(b) && (
                        <button className="rounded bg-ink-700/50 px-2 py-1 text-xs text-ink-200 hover:bg-ink-700" onClick={() => setAction({ type: 'mark-absent', booking: b })}>No-show</button>
                      )}
                      {b.advancePaid > 0 && b.paymentStatus !== 'refunded' && (
                        <button className="rounded bg-sky-500/15 px-2 py-1 text-xs text-sky-300 hover:bg-sky-500/25" onClick={() => setAction({ type: 'refund', booking: b })}>Refund</button>
                      )}
                      {!['cancelled', 'completed'].includes(b.bookingStatus) && (
                        <button className="rounded bg-red-500/15 px-2 py-1 text-xs text-red-300 hover:bg-red-500/25" onClick={() => setAction({ type: 'cancel', booking: b })}>Cancel</button>
                      )}
                    </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <ActionModal
        key={action ? `${action.type}-${action.booking._id}` : 'none'}
        action={action}
        onClose={() => setAction(null)}
        onConfirm={(amount, discount) => mutate.mutate({ ...action, amount, discount })}
        loading={mutate.isPending}
      />

      {showNew && (
        <NewBookingModal
          onClose={() => setShowNew(false)}
          onCreated={() => {
            qc.invalidateQueries({ queryKey: ['admin-bookings'] });
            setShowNew(false);
          }}
        />
      )}
    </div>
  );
}

function ActionModal({ action, onClose, onConfirm, loading }) {
  const due = action?.type === 'mark-paid' ? Number(action.booking.dueAmount || 0) : 0;

  const [amount, setAmount] = useState(() => {
    if (action?.type === 'mark-paid') return String(action.booking.dueAmount ?? '');
    if (action?.type === 'refund') return String(action.booking.advancePaid ?? '');
    return '';
  });
  const [discount, setDiscount] = useState('0');
  const amountTouched = useRef(false);

  const discountNum = action?.type === 'mark-paid'
    ? Math.min(Math.max(0, Number(discount) || 0), due)
    : 0;
  const collectAfterDiscount = Math.max(0, due - discountNum);
  const remainingAfterSubmit = Math.max(0, due - discountNum - (Number(amount) || 0));

  const handleDiscountChange = (value) => {
    setDiscount(value);
    if (!amountTouched.current) {
      const nextDiscount = Math.min(Math.max(0, Number(value) || 0), due);
      setAmount(String(Math.max(0, due - nextDiscount)));
    }
  };

  if (!action) return null;
  const labels = {
    cancel: { title: 'Cancel booking', body: 'This will cancel the booking and release its slots.', cta: 'Cancel booking', variant: 'danger' },
    'mark-paid': {
      title: 'Collect due payment',
      body: 'Apply an optional discount, then enter the cash collected. Amount defaults to due minus discount.',
      cta: 'Pay due',
      variant: 'primary',
      amount: true,
      discount: true,
    },
    'mark-absent': { title: 'Mark as no-show', body: 'Flag this booking as a no-show.', cta: 'Mark no-show', variant: 'outline' },
    refund: { title: 'Refund booking', body: 'Defaults to the full advance paid. Adjust for a partial refund.', cta: 'Process refund', variant: 'primary', amount: true },
  }[action.type];

  const submitMarkPaid = () => {
    const pay = Number(amount) || 0;
    if (pay <= 0 && discountNum <= 0) {
      toast.error('Enter an amount to collect or apply a discount');
      return;
    }
    if (pay + discountNum > due) {
      toast.error(`Discount + amount cannot exceed due (${taka(due)})`);
      return;
    }
    onConfirm(pay, discountNum);
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={labels.title}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button
            variant={labels.variant}
            loading={loading}
            onClick={() => (action.type === 'mark-paid' ? submitMarkPaid() : onConfirm(amount ? Number(amount) : undefined))}
          >
            {labels.cta}
          </Button>
        </>
      }
    >
      <p>{labels.body}</p>
      {labels.discount && (
        <div className="mt-3 space-y-2">
          <Field label={`Outstanding due: ${taka(due)}`}>
            <Input type="number" min={0} max={due} placeholder="Discount (BDT)" value={discount} onChange={(e) => handleDiscountChange(e.target.value)} />
          </Field>
          {discountNum > 0 && (
            <p className="text-xs text-turf-300">Suggested collection after discount: {taka(collectAfterDiscount)}</p>
          )}
        </div>
      )}
      {labels.amount && (
        <div className="mt-3 space-y-2">
          <Field label={labels.discount ? 'Amount collected (BDT)' : 'Amount (BDT)'}>
            <Input
              type="number"
              min={0}
              max={labels.discount ? collectAfterDiscount : undefined}
              placeholder="Amount (BDT)"
              value={amount}
              onChange={(e) => {
                amountTouched.current = true;
                setAmount(e.target.value);
              }}
            />
          </Field>
          {labels.discount && (discountNum > 0 || Number(amount) > 0) && (
            <p className="text-xs text-ink-500">Remaining due after this: {taka(remainingAfterSubmit)}</p>
          )}
        </div>
      )}
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Manual booking: admin books on a customer's behalf and records manual payment.
// ---------------------------------------------------------------------------
function NewBookingModal({ onClose, onCreated }) {
  // Customer selection
  const [term, setTerm] = useState('');
  const [debounced, setDebounced] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [addNew, setAddNew] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', phone: '', email: '' });

  // Slots
  const [venueId, setVenueId] = useState('');
  const [date, setDate] = useState(todayKeyDhaka());
  const [slotIds, setSlotIds] = useState([]);

  // Payment / contact
  const [contact, setContact] = useState({ name: '', phone: '' });
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(term.trim()), 300);
    return () => clearTimeout(t);
  }, [term]);

  const { data: userResults, isFetching: searching } = useQuery({
    queryKey: ['user-search', debounced],
    queryFn: async () => (await api.get(`/admin/users/search?q=${encodeURIComponent(debounced)}`)).data.data.users,
    enabled: debounced.length >= 2 && !selectedUser && !addNew,
  });

  const { data: venues } = useQuery({
    queryKey: ['admin-venues'],
    queryFn: async () => (await api.get('/admin/venues')).data.data.venues,
  });

  const { data: slotData, isFetching: loadingSlots } = useQuery({
    queryKey: ['admin-available-slots', venueId, date],
    queryFn: async () => (await api.get(`/admin/slots?venueId=${venueId}&date=${date}&status=available&forBooking=true`)).data.data,
    enabled: Boolean(venueId && date),
  });

  const slots = (slotData?.slots || []).filter((s) => isAdminBookableSlot(s));
  const selectedSlots = useMemo(() => slots.filter((s) => slotIds.includes(s._id)), [slots, slotIds]);
  const total = selectedSlots.reduce((sum, s) => sum + s.price, 0);
  const advanceDue = selectedSlots.reduce((sum, s) => sum + (s.minimumBookingAmount || 0), 0);

  // Default the amount to the advance due as slots change (unless the admin edited it).
  const [amountTouched, setAmountTouched] = useState(false);
  useEffect(() => {
    if (!amountTouched) setAmount(advanceDue ? String(advanceDue) : '');
  }, [advanceDue, amountTouched]);

  // Prefill contact from the chosen customer.
  const pickUser = (u) => {
    setSelectedUser(u);
    setContact({ name: u.name || '', phone: u.phone || '' });
  };
  useEffect(() => {
    if (addNew) setContact({ name: newUser.name, phone: newUser.phone });
  }, [addNew, newUser.name, newUser.phone]);

  const toggleSlot = (id) => setSlotIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const create = useMutation({
    mutationFn: async () => {
      const payload = {
        slotIds,
        contactName: contact.name,
        contactPhone: contact.phone,
        method,
        ...(amount !== '' ? { amount: Number(amount) } : {}),
        ...(notes ? { notes } : {}),
        ...(selectedUser
          ? { userId: selectedUser._id }
          : { newUser: { name: newUser.name, phone: newUser.phone, ...(newUser.email ? { email: newUser.email } : {}) } }),
      };
      return api.post('/admin/bookings', payload);
    },
    onSuccess: (res) => { toast.success(res?.data?.message || 'Booking created'); onCreated(); },
    onError: (err) => toast.error(apiError(err)),
  });

  const customerReady = selectedUser || (addNew && newUser.name.trim().length >= 2 && newUser.phone.trim().length >= 6);
  const canSubmit = customerReady && slotIds.length > 0 && contact.name.trim() && contact.phone.trim();

  return (
    <Modal
      open
      onClose={onClose}
      title="New booking (manual)"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button loading={create.isPending} disabled={!canSubmit} onClick={() => create.mutate()}>Create booking</Button>
        </>
      }
    >
      <div className="max-h-[65vh] space-y-5 overflow-y-auto pr-1">
        {/* Customer */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-white">1 · Customer</h4>
            <button className="text-xs text-turf-300 hover:underline" onClick={() => { setAddNew((v) => !v); setSelectedUser(null); }}>
              {addNew ? 'Search existing' : '+ Add new customer'}
            </button>
          </div>

          {selectedUser ? (
            <div className="flex items-center justify-between rounded-lg border border-turf-700/50 bg-ink-900/60 p-3 text-sm">
              <div>
                <div className="font-medium text-ink-100">{selectedUser.name}</div>
                <div className="text-xs text-ink-500">{selectedUser.phone} · {selectedUser.email}</div>
              </div>
              <button className="text-xs text-red-400 hover:underline" onClick={() => setSelectedUser(null)}>Change</button>
            </div>
          ) : addNew ? (
            <div className="grid gap-2 sm:grid-cols-3">
              <Input placeholder="Full name" value={newUser.name} onChange={(e) => setNewUser((u) => ({ ...u, name: e.target.value }))} />
              <Input placeholder="Phone (01XXXXXXXXX)" value={newUser.phone} onChange={(e) => setNewUser((u) => ({ ...u, phone: e.target.value }))} />
              <Input placeholder="Email (optional)" value={newUser.email} onChange={(e) => setNewUser((u) => ({ ...u, email: e.target.value }))} />
            </div>
          ) : (
            <div className="space-y-2">
              <Input placeholder="Search by name, phone or email…" value={term} onChange={(e) => setTerm(e.target.value)} />
              {debounced.length >= 2 && (
                <div className="max-h-40 overflow-y-auto rounded-lg border border-ink-800">
                  {searching ? (
                    <p className="p-3 text-sm text-ink-500">Searching…</p>
                  ) : (userResults || []).length === 0 ? (
                    <p className="p-3 text-sm text-ink-500">No match. Use “+ Add new customer”.</p>
                  ) : (
                    userResults.map((u) => (
                      <button key={u._id} onClick={() => pickUser(u)} className="flex w-full items-center justify-between border-b border-ink-800/60 p-2.5 text-left text-sm last:border-0 hover:bg-ink-800/50">
                        <span className="text-ink-100">{u.name}</span>
                        <span className="text-xs text-ink-500">{u.phone}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Slots */}
        <section className="space-y-2 border-t border-ink-800 pt-4">
          <h4 className="font-semibold text-white">2 · Slots</h4>
          <div className="grid grid-cols-2 gap-2">
            <Select value={venueId} onChange={(e) => { setVenueId(e.target.value); setSlotIds([]); }}>
              <option value="">Select venue</option>
              {(venues || []).map((v) => <option key={v._id} value={v._id}>{v.name}</option>)}
            </Select>
            <Input type="date" value={date} onChange={(e) => { setDate(e.target.value); setSlotIds([]); }} />
          </div>
          {!venueId ? (
            <p className="text-sm text-ink-500">Pick a venue and date to see available slots.</p>
          ) : loadingSlots ? (
            <p className="text-sm text-ink-500">Loading slots…</p>
          ) : slots.length === 0 ? (
            <p className="text-sm text-ink-500">No available slots for this date.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {slots.map((s) => {
                const on = slotIds.includes(s._id);
                return (
                  <button
                    key={s._id}
                    type="button"
                    onClick={() => toggleSlot(s._id)}
                    className={`rounded-lg border p-2 text-left text-xs transition ${
                      on
                        ? 'border-turf-500 bg-turf-500/15 text-turf-100'
                        : 'border-ink-800 bg-ink-900/40 text-ink-300 hover:border-ink-700'
                    }`}
                  >
                    <div className="font-medium">{fmtRange(s.startTime, s.endTime)}</div>
                    <div className="text-ink-500">{taka(s.price)}</div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Payment & contact */}
        <section className="space-y-3 border-t border-ink-800 pt-4">
          <h4 className="font-semibold text-white">3 · Contact &amp; payment</h4>
          {slotIds.length > 0 && (
            <div className="rounded-lg bg-ink-900/60 p-3 text-sm text-ink-300">
              {slotIds.length} slot(s) · Total <span className="text-ink-100">{taka(total)}</span> · Advance due <span className="text-ink-100">{taka(advanceDue)}</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Contact name"><Input value={contact.name} onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))} /></Field>
            <Field label="Contact number"><Input value={contact.phone} onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))} placeholder="01XXXXXXXXX" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Amount collected (BDT)">
              <Input type="number" min={0} value={amount} onChange={(e) => { setAmount(e.target.value); setAmountTouched(true); }} />
            </Field>
            <Field label="Method">
              <Select value={method} onChange={(e) => setMethod(e.target.value)}>
                <option value="cash">Cash</option>
                <option value="manual">Manual / other</option>
              </Select>
            </Field>
          </div>
          <Field label="Notes (optional)"><Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any remarks" /></Field>
          <p className="text-xs text-ink-500">Booking is confirmed automatically once the collected amount covers the advance due.</p>
        </section>
      </div>
    </Modal>
  );
}
