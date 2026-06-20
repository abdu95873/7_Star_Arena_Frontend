import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../../lib/apiClient.js';
import { Button, Card, Badge, Loading, ErrorState, Modal, Field, Input, Textarea } from '../../components/ui.jsx';
import { taka, fmtRange, apiError } from '../../utils/format.js';

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
              <div className="mt-4 flex gap-2">
                <Button variant="outline" className="!py-2" onClick={() => setVenueModal(v)}>Edit</Button>
                <Button variant="ghost" className="!py-2" onClick={() => setTplVenue(v)}>Slot templates</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {venueModal && <VenueModal venue={venueModal} onClose={() => setVenueModal(null)} onSave={(v) => saveVenue.mutate(v)} saving={saveVenue.isPending} />}
      {tplVenue && <TemplateModal venue={tplVenue} onClose={() => setTplVenue(null)} />}
    </div>
  );
}

function VenueModal({ venue, onClose, onSave, saving }) {
  const [form, setForm] = useState({
    name: venue.name || '', address: venue.address || '', description: venue.description || '',
    contactPhone: venue.contactPhone || '', contactEmail: venue.contactEmail || '',
    openingTime: venue.openingTime || '06:00', closingTime: venue.closingTime || '23:59',
    longitude: venue.location?.coordinates?.[0] ?? '', latitude: venue.location?.coordinates?.[1] ?? '',
  });
  const [images, setImages] = useState(venue.images || []);
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

  return (
    <Modal open onClose={onClose} title={venue._id ? 'Edit venue' : 'New venue'}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button loading={saving} onClick={submit}>Save</Button></>}>
      <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
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

function TemplateModal({ venue, onClose }) {
  const qc = useQueryClient();
  const { data: templates, isLoading } = useQuery({
    queryKey: ['templates', venue._id],
    queryFn: async () => (await api.get(`/admin/slot-templates?venueId=${venue._id}`)).data.data.templates,
  });

  const [form, setForm] = useState({ name: '', startTime: '06:00', endTime: '23:59', durationMinutes: 90, price: 2500, minimumBookingAmount: 1000 });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const create = useMutation({
    mutationFn: async () => api.post('/admin/slot-templates', { venueId: venue._id, ...form, durationMinutes: Number(form.durationMinutes), price: Number(form.price), minimumBookingAmount: Number(form.minimumBookingAmount) }),
    onSuccess: () => { toast.success('Template created'); qc.invalidateQueries({ queryKey: ['templates', venue._id] }); },
    onError: (err) => toast.error(apiError(err)),
  });

  // Inline editing of an existing template.
  const [editing, setEditing] = useState(null); // { _id, name, startTime, endTime, durationMinutes, price, minimumBookingAmount }
  const setEdit = (k) => (e) => setEditing((s) => ({ ...s, [k]: e.target.value }));

  const update = useMutation({
    mutationFn: async () =>
      api.patch(`/admin/slot-templates/${editing._id}`, {
        name: editing.name,
        startTime: editing.startTime,
        endTime: editing.endTime,
        durationMinutes: Number(editing.durationMinutes),
        price: Number(editing.price),
        minimumBookingAmount: Number(editing.minimumBookingAmount),
      }),
    onSuccess: () => { toast.success('Template updated'); qc.invalidateQueries({ queryKey: ['templates', venue._id] }); setEditing(null); },
    onError: (err) => toast.error(apiError(err)),
  });

  const remove = useMutation({
    mutationFn: async (tplId) => api.delete(`/admin/slot-templates/${tplId}`),
    onSuccess: () => { toast.success('Template deleted'); qc.invalidateQueries({ queryKey: ['templates', venue._id] }); },
    onError: (err) => toast.error(apiError(err)),
  });

  const [range, setRange] = useState({ startDate: format(new Date(), 'yyyy-MM-dd'), endDate: format(new Date(Date.now() + 29 * 864e5), 'yyyy-MM-dd') });
  const generate = useMutation({
    mutationFn: async (tplId) => api.post(`/admin/slot-templates/${tplId}/generate`, range),
    onSuccess: (res) => toast.success(res.data.message),
    onError: (err) => toast.error(apiError(err)),
  });

  return (
    <Modal open onClose={onClose} title={`Slot templates — ${venue.name}`}
      footer={<Button variant="ghost" onClick={onClose}>Close</Button>}>
      <div className="max-h-[65vh] space-y-5 overflow-y-auto pr-1">
        <div>
          <h4 className="mb-2 font-semibold text-white">Existing templates</h4>
          {isLoading ? <p className="text-sm text-ink-500">Loading…</p> : (templates || []).length === 0 ? (
            <p className="text-sm text-ink-500">No templates yet.</p>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Input type="date" value={range.startDate} onChange={(e) => setRange((r) => ({ ...r, startDate: e.target.value }))} />
                <Input type="date" value={range.endDate} onChange={(e) => setRange((r) => ({ ...r, endDate: e.target.value }))} />
              </div>
              {templates.map((t) =>
                editing?._id === t._id ? (
                  <div key={t._id} className="space-y-3 rounded-lg border border-turf-700/50 bg-ink-900/60 p-3">
                    <Field label="Name"><Input value={editing.name} onChange={setEdit('name')} placeholder="Template name" /></Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Start time"><Input type="time" value={editing.startTime} onChange={setEdit('startTime')} /></Field>
                      <Field label="End time"><Input type="time" value={editing.endTime} onChange={setEdit('endTime')} /></Field>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <Field label="Duration (min)"><Input type="number" value={editing.durationMinutes} onChange={setEdit('durationMinutes')} /></Field>
                      <Field label="Price"><Input type="number" value={editing.price} onChange={setEdit('price')} /></Field>
                      <Field label="Advance"><Input type="number" value={editing.minimumBookingAmount} onChange={setEdit('minimumBookingAmount')} /></Field>
                    </div>
                    <div className="flex gap-2">
                      <Button className="!py-1.5 text-xs" loading={update.isPending} onClick={() => update.mutate()}>Save changes</Button>
                      <Button variant="ghost" className="!py-1.5 text-xs" onClick={() => setEditing(null)}>Cancel</Button>
                    </div>
                    <p className="text-xs text-ink-500">Editing affects slots generated afterwards; already-generated slots keep their original times.</p>
                  </div>
                ) : (
                  <div key={t._id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-ink-900/60 p-3 text-sm">
                    <div>
                      <div className="text-ink-200">{t.name || 'Template'} · {fmtRange(t.startTime, t.endTime)}</div>
                      <div className="text-xs text-ink-500">{t.durationMinutes}min · {taka(t.price)} · adv {taka(t.minimumBookingAmount)}</div>
                    </div>
                    <div className="flex gap-1.5">
                      <Button variant="outline" className="!py-1.5 text-xs" onClick={() => setEditing({ _id: t._id, name: t.name || '', startTime: t.startTime, endTime: t.endTime, durationMinutes: t.durationMinutes, price: t.price, minimumBookingAmount: t.minimumBookingAmount })}>Edit</Button>
                      <Button className="!py-1.5 text-xs" loading={generate.isPending} onClick={() => generate.mutate(t._id)}>Generate</Button>
                      <Button variant="ghost" className="!py-1.5 text-xs text-red-400" onClick={() => { if (confirm('Delete this template?')) remove.mutate(t._id); }}>Delete</Button>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        <div className="border-t border-ink-800 pt-4">
          <h4 className="mb-2 font-semibold text-white">New template</h4>
          <div className="space-y-3">
            <Field label="Name"><Input value={form.name} onChange={set('name')} placeholder="Standard 90-min slots" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start time"><Input type="time" value={form.startTime} onChange={set('startTime')} /></Field>
              <Field label="End time"><Input type="time" value={form.endTime} onChange={set('endTime')} /></Field>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Duration (min)"><Input type="number" value={form.durationMinutes} onChange={set('durationMinutes')} /></Field>
              <Field label="Price"><Input type="number" value={form.price} onChange={set('price')} /></Field>
              <Field label="Advance"><Input type="number" value={form.minimumBookingAmount} onChange={set('minimumBookingAmount')} /></Field>
            </div>
            <Button className="w-full" loading={create.isPending} onClick={() => create.mutate()}>Create template</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
