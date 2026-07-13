import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../../lib/apiClient.js';
import { Button, Card, Badge, Loading, ErrorState, EmptyState, Modal, Field, Input, Textarea, Select } from '../../components/ui.jsx';
import { taka, fmtRange, apiError } from '../../utils/format.js';

const DAY_OPTS = [
  { value: 'sun', label: 'Sunday' },
  { value: 'mon', label: 'Monday' },
  { value: 'tue', label: 'Tuesday' },
  { value: 'wed', label: 'Wednesday' },
  { value: 'thu', label: 'Thursday' },
  { value: 'fri', label: 'Friday' },
  { value: 'sat', label: 'Saturday' },
];

const emptyWeekdayRule = () => ({ day: 'thu', label: '', price: '', minimumBookingAmount: '' });
const emptyDateRule = () => ({ recurring: true, month: 12, day: 16, date: '', label: 'Victory Day', price: '', minimumBookingAmount: '' });

function buildPricingPayload(state) {
  return {
    specialWeekdayPricing: (state.specialWeekdayPricing || [])
      .filter((r) => r.day && r.price !== '')
      .map((r) => ({
        day: r.day,
        label: r.label || '',
        price: Number(r.price),
        minimumBookingAmount: Number(r.minimumBookingAmount || 0),
      })),
    specialDatePricing: (state.specialDatePricing || [])
      .filter((r) => r.price !== '')
      .map((r) => {
        const base = {
          label: r.label || '',
          price: Number(r.price),
          minimumBookingAmount: Number(r.minimumBookingAmount || 0),
        };
        if (r.recurring !== false) {
          return { ...base, recurring: true, month: Number(r.month), day: Number(r.day) };
        }
        return { ...base, recurring: false, date: r.date };
      }),
  };
}

function templateToEditing(t) {
  return {
    _id: t._id,
    name: t.name || '',
    startTime: t.startTime,
    endTime: t.endTime,
    durationMinutes: t.durationMinutes,
    price: t.price,
    minimumBookingAmount: t.minimumBookingAmount,
    specialWeekdayPricing: (t.specialWeekdayPricing || []).map((r) => ({
      day: r.day,
      label: r.label || '',
      price: r.price,
      minimumBookingAmount: r.minimumBookingAmount ?? '',
    })),
    specialDatePricing: (t.specialDatePricing || []).map((r) => ({
      recurring: r.recurring !== false,
      month: r.month ?? '',
      day: r.day ?? '',
      date: r.date ? format(new Date(r.date), 'yyyy-MM-dd') : '',
      label: r.label || '',
      price: r.price,
      minimumBookingAmount: r.minimumBookingAmount ?? '',
    })),
  };
}

function SpecialPricingEditor({ value, onChange }) {
  const weekdays = value.specialWeekdayPricing || [];
  const dates = value.specialDatePricing || [];

  const setWeekdays = (next) => onChange({ ...value, specialWeekdayPricing: next });
  const setDates = (next) => onChange({ ...value, specialDatePricing: next });

  return (
    <div className="space-y-4 rounded-lg border border-ink-800 bg-ink-950/40 p-3">
      <div>
        <p className="text-sm font-medium text-ink-200">Special weekday rates</p>
        <p className="text-xs text-ink-500">e.g. Thursday / Friday peak pricing.</p>
        <div className="mt-2 space-y-2">
          {weekdays.map((row, idx) => (
            <div key={`wd-${idx}`} className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              <Select value={row.day} onChange={(e) => setWeekdays(weekdays.map((r, i) => (i === idx ? { ...r, day: e.target.value } : r)))}>
                {DAY_OPTS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </Select>
              <Input placeholder="Label" value={row.label} onChange={(e) => setWeekdays(weekdays.map((r, i) => (i === idx ? { ...r, label: e.target.value } : r)))} />
              <Input type="number" min={0} placeholder="Price" value={row.price} onChange={(e) => setWeekdays(weekdays.map((r, i) => (i === idx ? { ...r, price: e.target.value } : r)))} />
              <Input type="number" min={0} placeholder="Advance" value={row.minimumBookingAmount} onChange={(e) => setWeekdays(weekdays.map((r, i) => (i === idx ? { ...r, minimumBookingAmount: e.target.value } : r)))} />
              <Button variant="ghost" className="!py-1.5 text-xs text-red-400" type="button" onClick={() => setWeekdays(weekdays.filter((_, i) => i !== idx))}>Remove</Button>
            </div>
          ))}
          <Button variant="outline" type="button" className="!py-1.5 text-xs" onClick={() => setWeekdays([...weekdays, emptyWeekdayRule()])}>+ Weekday rate</Button>
        </div>
      </div>

      <div className="border-t border-ink-800 pt-3">
        <p className="text-sm font-medium text-ink-200">Special date rates</p>
        <p className="text-xs text-ink-500">Recurring (every year) or one-off dates, e.g. 16 Dec Victory Day.</p>
        <div className="mt-2 space-y-2">
          {dates.map((row, idx) => (
            <div key={`dt-${idx}`} className="space-y-2 rounded-md border border-ink-800/80 p-2">
              <div className="flex flex-wrap items-center gap-2 text-xs text-ink-400">
                <label className="flex items-center gap-1.5">
                  <input type="radio" checked={row.recurring !== false} onChange={() => setDates(dates.map((r, i) => (i === idx ? { ...r, recurring: true } : r)))} />
                  Every year
                </label>
                <label className="flex items-center gap-1.5">
                  <input type="radio" checked={row.recurring === false} onChange={() => setDates(dates.map((r, i) => (i === idx ? { ...r, recurring: false } : r)))} />
                  One-off date
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {row.recurring !== false ? (
                  <>
                    <Input type="number" min={1} max={12} placeholder="Month" value={row.month} onChange={(e) => setDates(dates.map((r, i) => (i === idx ? { ...r, month: e.target.value } : r)))} />
                    <Input type="number" min={1} max={31} placeholder="Day" value={row.day} onChange={(e) => setDates(dates.map((r, i) => (i === idx ? { ...r, day: e.target.value } : r)))} />
                  </>
                ) : (
                  <Input type="date" className="sm:col-span-2" value={row.date} onChange={(e) => setDates(dates.map((r, i) => (i === idx ? { ...r, date: e.target.value } : r)))} />
                )}
                <Input placeholder="Label" value={row.label} onChange={(e) => setDates(dates.map((r, i) => (i === idx ? { ...r, label: e.target.value } : r)))} />
                <Input type="number" min={0} placeholder="Price" value={row.price} onChange={(e) => setDates(dates.map((r, i) => (i === idx ? { ...r, price: e.target.value } : r)))} />
                <Input type="number" min={0} placeholder="Advance" value={row.minimumBookingAmount} onChange={(e) => setDates(dates.map((r, i) => (i === idx ? { ...r, minimumBookingAmount: e.target.value } : r)))} />
              </div>
              <Button variant="ghost" className="!py-1.5 text-xs text-red-400" type="button" onClick={() => setDates(dates.filter((_, i) => i !== idx))}>Remove</Button>
            </div>
          ))}
          <Button variant="outline" type="button" className="!py-1.5 text-xs" onClick={() => setDates([...dates, emptyDateRule()])}>+ Date rate</Button>
        </div>
      </div>
      <p className="text-xs text-ink-500">Date rates override weekday rates. Re-generate slots to apply new prices to future dates.</p>
    </div>
  );
}

function specialRateCount(t) {
  return (t.specialWeekdayPricing?.length || 0) + (t.specialDatePricing?.length || 0);
}

export default function AdminVenuesPage() {
  const qc = useQueryClient();
  const [venueModal, setVenueModal] = useState(null); // venue obj or {} for new
  const [tplVenue, setTplVenue] = useState(null); // venue to manage templates for

  const { data: venues, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-venues'],
    queryFn: async () => (await api.get('/admin/venues')).data.data.venues,
  });

  const saveVenue = useMutation({
    mutationFn: async (v) => (v._id ? api.patch(`/admin/venues/${v._id}`, v) : api.post('/admin/venues', v)),
    onSuccess: () => { toast.success('Venue saved'); qc.invalidateQueries({ queryKey: ['admin-venues'] }); setVenueModal(null); },
    onError: (err) => toast.error(apiError(err)),
  });

  const deleteVenue = useMutation({
    mutationFn: async (id) => api.delete(`/admin/venues/${id}`),
    onSuccess: () => {
      toast.success('Venue deactivated');
      qc.invalidateQueries({ queryKey: ['admin-venues'] });
      setVenueModal(null);
    },
    onError: (err) => toast.error(apiError(err)),
  });

  if (isLoading) return <Loading />;
  if (isError) return <ErrorState onRetry={refetch} />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Venues</h1>
          <p className="text-sm text-ink-400">Manage venues and their slot templates.</p>
        </div>
        <Button onClick={() => setVenueModal({})}>+ New venue</Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {(venues || []).map((v) => (
          <Card key={v._id} className="overflow-hidden">
            <img src={v.images?.[0] || 'https://images.unsplash.com/photo-1556056504-5c7696c4c28d?w=800'} alt={v.name} className="h-36 w-full object-cover" />
            <div className="p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white">{v.name}</h3>
                <Badge tone={v.isActive ? 'green' : 'gray'}>{v.isActive ? 'active' : 'inactive'}</Badge>
              </div>
              <p className="mt-1 text-sm text-ink-400">{v.address}</p>
              <p className="mt-1 text-xs text-ink-500">{v.openingTime}–{v.closingTime}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" className="!py-2" onClick={() => setVenueModal(v)}>Edit</Button>
                <Button variant="ghost" className="!py-2" onClick={() => setTplVenue(v)}>Slot templates</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {venueModal && (
        <VenueModal
          venue={venueModal}
          onClose={() => setVenueModal(null)}
          onSave={(v) => saveVenue.mutate(v)}
          onDelete={venueModal._id && venueModal.isActive !== false ? () => deleteVenue.mutate(venueModal._id) : undefined}
          deleting={deleteVenue.isPending}
          saving={saveVenue.isPending}
        />
      )}
      {tplVenue && <TemplateModal venue={tplVenue} onClose={() => setTplVenue(null)} />}
    </div>
  );
}

function VenueModal({ venue, onClose, onSave, onDelete, saving, deleting }) {
  const [form, setForm] = useState({
    name: venue.name || '', address: venue.address || '', description: venue.description || '',
    contactPhone: venue.contactPhone || '', contactEmail: venue.contactEmail || '',
    openingTime: venue.openingTime || '06:00', closingTime: venue.closingTime || '23:59',
    longitude: venue.location?.coordinates?.[0] ?? '', latitude: venue.location?.coordinates?.[1] ?? '',
  });
  const [images, setImages] = useState(venue.images || []);
  const [deleteArmed, setDeleteArmed] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = () => {
    const payload = {
      ...(venue._id ? { _id: venue._id } : {}),
      name: form.name, address: form.address, description: form.description,
      contactPhone: form.contactPhone, contactEmail: form.contactEmail || undefined,
      openingTime: form.openingTime, closingTime: form.closingTime,
      images,
      ...(form.longitude !== '' ? { longitude: Number(form.longitude) } : {}),
      ...(form.latitude !== '' ? { latitude: Number(form.latitude) } : {}),
    };
    onSave(payload);
  };

  const handleDelete = () => {
    if (!deleteArmed) {
      setDeleteArmed(true);
      return;
    }
    if (!window.confirm(`Deactivate "${form.name || venue.name}"? It will be hidden from public booking.`)) {
      setDeleteArmed(false);
      return;
    }
    onDelete?.();
  };

  return (
    <Modal open onClose={onClose} title={venue._id ? 'Edit venue' : 'New venue'} size="2xl"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button loading={saving} onClick={submit}>Save</Button></>}>
      <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1 lg:max-h-[75vh]">
        <Field label="Name"><Input value={form.name} onChange={set('name')} /></Field>
        <Field label="Address"><Input value={form.address} onChange={set('address')} /></Field>
        <Field label="Description"><Textarea value={form.description} onChange={set('description')} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Opening"><Input value={form.openingTime} onChange={set('openingTime')} placeholder="06:00" /></Field>
          <Field label="Closing"><Input value={form.closingTime} onChange={set('closingTime')} placeholder="23:59" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Contact phone"><Input value={form.contactPhone} onChange={set('contactPhone')} /></Field>
          <Field label="Contact email"><Input value={form.contactEmail} onChange={set('contactEmail')} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Longitude"><Input value={form.longitude} onChange={set('longitude')} /></Field>
          <Field label="Latitude"><Input value={form.latitude} onChange={set('latitude')} /></Field>
        </div>
        <ImageUploader images={images} onChange={setImages} folder="venues" />

        {onDelete && (
          <div className="mt-6 space-y-3 rounded-lg border border-red-900/40 bg-red-950/20 p-4">
            <p className="text-sm font-medium text-red-300">Danger zone</p>
            <p className="text-xs text-ink-400">
              Deactivating hides this venue from public booking. Existing bookings are kept.
            </p>
            <Button
              type="button"
              variant="ghost"
              className={`!py-2 text-xs ${deleteArmed ? 'border border-red-500 text-red-300' : 'text-red-400'}`}
              loading={deleting}
              onClick={handleDelete}
            >
              {deleteArmed ? 'Click again to confirm deactivation' : 'Deactivate venue'}
            </Button>
            {deleteArmed && (
              <button type="button" className="ml-3 text-xs text-ink-500 hover:text-ink-300" onClick={() => setDeleteArmed(false)}>
                Cancel
              </button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

// Dynamic image uploader: picks files, uploads them to the server (Cloudinary, or
// a local-disk fallback in dev), and stores the returned URLs.
function ImageUploader({ images, onChange, folder = 'turf' }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;
    const fd = new FormData();
    files.forEach((f) => fd.append('images', f));
    setUploading(true);
    try {
      // Let the browser/axios set multipart Content-Type (with boundary) automatically.
      const res = await api.post(`/uploads/images?folder=${encodeURIComponent(folder)}`, fd);
      const urls = res.data.data.urls || [];
      onChange([...images, ...urls]);
      toast.success(`${urls.length} image${urls.length > 1 ? 's' : ''} uploaded`);
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removeAt = (idx) => onChange(images.filter((_, i) => i !== idx));

  return (
    <Field label="Images">
      <div className="space-y-3">
        {images.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {images.map((url, idx) => (
              <div key={`${url}-${idx}`} className="group relative overflow-hidden rounded-lg border border-ink-800">
                <img src={url} alt={`venue ${idx + 1}`} className="h-20 w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeAt(idx)}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-xs text-white opacity-0 transition group-hover:opacity-100"
                  aria-label="Remove image"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Button type="button" variant="outline" className="w-full" loading={uploading} onClick={() => inputRef.current?.click()}>
          {uploading ? 'Uploading…' : '+ Upload images'}
        </Button>
        <p className="text-xs text-ink-500">JPG, PNG, WEBP or GIF · up to 5MB each. The first image is used as the cover.</p>
      </div>
    </Field>
  );
}

const emptyTemplateForm = () => ({
  name: '',
  startTime: '06:00',
  endTime: '23:59',
  durationMinutes: 90,
  price: 2500,
  minimumBookingAmount: 1000,
  specialWeekdayPricing: [],
  specialDatePricing: [],
});

function TemplateFormFields({ form, setForm }) {
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-3">
      <Field label="Name"><Input value={form.name} onChange={set('name')} placeholder="Standard 90-min slots" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Start time"><Input type="time" value={form.startTime} onChange={set('startTime')} /></Field>
        <Field label="End time"><Input type="time" value={form.endTime} onChange={set('endTime')} /></Field>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Duration (min)"><Input type="number" value={form.durationMinutes} onChange={set('durationMinutes')} /></Field>
        <Field label="Default price"><Input type="number" value={form.price} onChange={set('price')} /></Field>
        <Field label="Default advance"><Input type="number" value={form.minimumBookingAmount} onChange={set('minimumBookingAmount')} /></Field>
      </div>
      <SpecialPricingEditor value={form} onChange={setForm} />
    </div>
  );
}

function TemplateFormModal({ venue, template, onBack }) {
  const qc = useQueryClient();
  const isEdit = Boolean(template?._id);
  const [form, setForm] = useState(() => (isEdit ? templateToEditing(template) : emptyTemplateForm()));

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        startTime: form.startTime,
        endTime: form.endTime,
        durationMinutes: Number(form.durationMinutes),
        price: Number(form.price),
        minimumBookingAmount: Number(form.minimumBookingAmount),
        ...buildPricingPayload(form),
      };
      if (isEdit) return api.patch(`/admin/slot-templates/${template._id}`, payload);
      return api.post('/admin/slot-templates', { venueId: venue._id, ...payload });
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Template updated' : 'Template created');
      qc.invalidateQueries({ queryKey: ['templates', venue._id] });
      onBack();
    },
    onError: (err) => toast.error(apiError(err)),
  });

  return (
    <Modal
      open
      size="2xl"
      onClose={onBack}
      title={isEdit ? `Edit template — ${venue.name}` : `New template — ${venue.name}`}
      footer={(
        <>
          <Button variant="ghost" onClick={onBack}>Back to list</Button>
          <Button loading={save.isPending} onClick={() => save.mutate()}>{isEdit ? 'Save changes' : 'Create template'}</Button>
        </>
      )}
    >
      <div className="max-h-[75vh] space-y-3 overflow-y-auto pr-1 lg:max-h-[80vh]">
        <TemplateFormFields form={form} setForm={setForm} />
        {isEdit && (
          <p className="text-xs text-ink-500">Changes apply to slots generated afterwards; existing slots keep their original values.</p>
        )}
      </div>
    </Modal>
  );
}

function TemplateListModal({ venue, onClose, onNew, onEdit }) {
  const qc = useQueryClient();
  const { data: templates, isLoading } = useQuery({
    queryKey: ['templates', venue._id],
    queryFn: async () => (await api.get(`/admin/slot-templates?venueId=${venue._id}`)).data.data.templates,
  });

  const [deletingId, setDeletingId] = useState(null);
  const [range, setRange] = useState({
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(Date.now() + 29 * 864e5), 'yyyy-MM-dd'),
  });

  const confirmDelete = (tpl) => {
    if (!window.confirm(`Delete "${tpl.name || 'this template'}"? Unbooked slots from this template will also be removed.`)) return;
    setDeletingId(tpl._id);
    remove.mutate(tpl._id);
  };

  const remove = useMutation({
    mutationFn: async (tplId) => api.delete(`/admin/slot-templates/${tplId}`),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Template deleted');
      qc.invalidateQueries({ queryKey: ['templates', venue._id] });
      qc.invalidateQueries({ queryKey: ['admin-slots'] });
    },
    onError: (err) => toast.error(apiError(err)),
    onSettled: () => setDeletingId(null),
  });

  const generate = useMutation({
    mutationFn: async (tplId) => api.post(`/admin/slot-templates/${tplId}/generate`, range),
    onSuccess: (res) => toast.success(res.data.message),
    onError: (err) => toast.error(apiError(err)),
  });

  return (
    <Modal
      open
      size="2xl"
      onClose={onClose}
      title={`Slot templates — ${venue.name}`}
      footer={<Button variant="ghost" onClick={onClose}>Close</Button>}
    >
      <div className="max-h-[75vh] space-y-4 overflow-y-auto pr-1 lg:max-h-[80vh]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-ink-400">Manage templates and generate bookable slots.</p>
          <Button onClick={onNew}>+ New template</Button>
        </div>

        {isLoading ? (
          <p className="text-sm text-ink-500">Loading…</p>
        ) : (templates || []).length === 0 ? (
          <EmptyState icon="📅" title="No templates yet" description="Create a template to start generating slots." />
        ) : (
          <div className="space-y-3">
            <Field label="Generate slots for date range">
              <div className="grid grid-cols-2 gap-2">
                <Input type="date" value={range.startDate} onChange={(e) => setRange((r) => ({ ...r, startDate: e.target.value }))} />
                <Input type="date" value={range.endDate} onChange={(e) => setRange((r) => ({ ...r, endDate: e.target.value }))} />
              </div>
            </Field>

            <div className="space-y-2">
              {templates.map((t) => (
                <div key={t._id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-ink-900/60 p-3 text-sm">
                  <div>
                    <div className="text-ink-200">{t.name || 'Template'} · {fmtRange(t.startTime, t.endTime)}</div>
                    <div className="text-xs text-ink-500">
                      {t.durationMinutes}min · default {taka(t.price)} · adv {taka(t.minimumBookingAmount)}
                      {specialRateCount(t) > 0 && ` · ${specialRateCount(t)} special rate(s)`}
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <Button variant="outline" className="!py-1.5 text-xs" onClick={() => onEdit(t)}>Edit</Button>
                    <Button className="!py-1.5 text-xs" loading={generate.isPending} onClick={() => generate.mutate(t._id)}>Generate</Button>
                    <Button
                      variant="ghost"
                      className="!py-1.5 text-xs text-red-400"
                      loading={deletingId === t._id && remove.isPending}
                      onClick={() => confirmDelete(t)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

function TemplateModal({ venue, onClose }) {
  const [formMode, setFormMode] = useState(null); // null | 'new' | template object

  if (formMode) {
    return (
      <TemplateFormModal
        venue={venue}
        template={formMode === 'new' ? null : formMode}
        onBack={() => setFormMode(null)}
      />
    );
  }

  return (
    <TemplateListModal
      venue={venue}
      onClose={onClose}
      onNew={() => setFormMode('new')}
      onEdit={(t) => setFormMode(t)}
    />
  );
}
