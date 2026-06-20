import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import api from '../../lib/apiClient.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Button, Card, Badge, Loading, EmptyState, Spinner } from '../../components/ui.jsx';
import { taka, fmtDate, fmtRange, apiError } from '../../utils/format.js';

const HERO_BG = 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=1600';
const GALLERY = [
  'https://images.unsplash.com/photo-1556056504-5c7696c4c28d?w=800',
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
  'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800',
  'https://images.unsplash.com/photo-1518604666860-9ed391f76460?w=800',
  'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=800',
  'https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=800',
];

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <img src={HERO_BG} alt="Turf" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-ink-950/80 via-ink-950/70 to-ink-950" />
      <div className="relative mx-auto max-w-7xl px-6 py-28 sm:py-36">
        <Badge tone="green">⚽ Bangladesh's premium turf booking</Badge>
        <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-tight text-white sm:text-6xl">
          Book your football turf in <span className="text-turf-400">seconds</span>, play in style.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-ink-300">
          Pick a slot, pay the advance with bKash, and you're set. Floodlit, FIFA-standard turf — open from dawn to midnight.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Button as="a" href="#book" variant="primary" className="!px-6 !py-3 text-base">Book a Slot Now</Button>
          <Button as="a" href="#events" variant="outline" className="!px-6 !py-3 text-base">Upcoming Events</Button>
        </div>
        <div className="mt-12 flex flex-wrap gap-8 text-sm text-ink-300">
          <div><span className="text-2xl font-bold text-white">90min</span><br />slots</div>
          <div><span className="text-2xl font-bold text-white">6AM–12AM</span><br />daily</div>
          <div><span className="text-2xl font-bold text-white">bKash</span><br />secure pay</div>
        </div>
      </div>
    </section>
  );
}

function Gallery({ venueImages = [] }) {
  const imgs = [...new Set([...venueImages, ...GALLERY])].slice(0, 6);
  return (
    <section id="gallery" className="mx-auto max-w-7xl px-6 py-20">
      <SectionHeading kicker="Gallery" title="Step onto the pitch" subtitle="A look at our floodlit, professionally maintained turf." />
      <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3">
        {imgs.map((src, i) => (
          <div key={src} className={`overflow-hidden rounded-2xl ${i === 0 ? 'col-span-2 row-span-2' : ''}`}>
            <img src={src} alt="Turf" className="h-full w-full object-cover transition duration-500 hover:scale-105" loading="lazy" />
          </div>
        ))}
      </div>
    </section>
  );
}

function SectionHeading({ kicker, title, subtitle }) {
  return (
    <div className="max-w-2xl">
      {kicker && <span className="text-sm font-semibold uppercase tracking-wider text-turf-400">{kicker}</span>}
      <h2 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-3 text-ink-400">{subtitle}</p>}
    </div>
  );
}

function BookingSection({ venue }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selected, setSelected] = useState([]);

  const { data, isLoading } = useQuery({
    queryKey: ['slots', venue?._id, date],
    queryFn: async () => (await api.get(`/venues/${venue._id}/slots?date=${date}`)).data.data.slots,
    enabled: Boolean(venue?._id),
  });

  const slots = data || [];
  const toggle = (slot) => {
    if (slot.status !== 'available') return;
    setSelected((prev) => (prev.includes(slot._id) ? prev.filter((id) => id !== slot._id) : [...prev, slot._id]));
  };

  const selectedSlots = useMemo(() => slots.filter((s) => selected.includes(s._id)), [slots, selected]);
  const total = selectedSlots.reduce((sum, s) => sum + s.price, 0);
  const advance = selectedSlots.reduce((sum, s) => sum + s.minimumBookingAmount, 0);

  const createBooking = useMutation({
    mutationFn: async () => (await api.post('/bookings', { slotIds: selected })).data.data.booking,
    onSuccess: (booking) => {
      toast.success('Slots reserved! Complete payment to confirm.');
      navigate(`/checkout/booking/${booking._id}`);
    },
    onError: (err) => toast.error(apiError(err, 'Could not reserve slots')),
  });

  const proceed = () => {
    if (!selected.length) return;
    if (!isAuthenticated) {
      toast('Please log in to book.', { icon: '🔒' });
      navigate('/login', { state: { from: { pathname: '/' } } });
      return;
    }
    createBooking.mutate();
  };

  const minDate = format(new Date(), 'yyyy-MM-dd');

  return (
    <section id="book" className="border-y border-ink-800 bg-ink-900/30">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <SectionHeading kicker="Book a slot" title="Pick your time" subtitle={venue ? `${venue.name} · ${venue.address}` : ''} />

        <div className="mt-10 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="mb-5 flex flex-wrap items-center gap-4">
              <label className="text-sm font-medium text-ink-300">Date</label>
              <input
                type="date"
                min={minDate}
                value={date}
                onChange={(e) => { setDate(e.target.value); setSelected([]); }}
                className="input max-w-[200px]"
              />
              <div className="flex items-center gap-4 text-xs text-ink-400">
                <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded-full bg-turf-500" /> Available</span>
                <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded-full bg-accent-500" /> Selected</span>
                <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded-full bg-ink-700" /> Booked</span>
              </div>
            </div>

            {isLoading ? (
              <Loading label="Loading slots…" />
            ) : slots.length === 0 ? (
              <EmptyState icon="📅" title="No slots for this date" description="Try another date or check back soon." />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {slots.map((slot) => {
                  const isSel = selected.includes(slot._id);
                  const isAvail = slot.status === 'available';
                  return (
                    <button
                      key={slot._id}
                      onClick={() => toggle(slot)}
                      disabled={!isAvail}
                      className={`rounded-xl border p-3 text-left text-sm transition ${
                        isSel
                          ? 'border-accent-500 bg-accent-500/15 text-white'
                          : isAvail
                          ? 'border-ink-700 bg-ink-900 hover:border-turf-500 hover:bg-turf-500/5'
                          : 'cursor-not-allowed border-ink-800 bg-ink-800/40 text-ink-600'
                      }`}
                    >
                      <div className="font-semibold">{fmtRange(slot.startTime, slot.endTime)}</div>
                      <div className="text-xs text-ink-400">{taka(slot.price)}</div>
                      {!isAvail && <div className="mt-1 text-[10px] uppercase text-ink-600">Booked</div>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Summary */}
          <Card className="h-fit p-6">
            <h3 className="text-lg font-bold text-white">Your selection</h3>
            <p className="mt-1 text-sm text-ink-400">{fmtDate(date)}</p>
            <div className="mt-4 space-y-2">
              {selectedSlots.length === 0 ? (
                <p className="text-sm text-ink-500">No slots selected yet.</p>
              ) : (
                selectedSlots.map((s) => (
                  <div key={s._id} className="flex justify-between text-sm">
                    <span className="text-ink-300">{fmtRange(s.startTime, s.endTime)}</span>
                    <span className="text-ink-200">{taka(s.price)}</span>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 space-y-1.5 border-t border-ink-800 pt-4 text-sm">
              <div className="flex justify-between"><span className="text-ink-400">Total</span><span className="font-semibold text-white">{taka(total)}</span></div>
              <div className="flex justify-between"><span className="text-ink-400">Advance (bKash)</span><span className="font-semibold text-turf-300">{taka(advance)}</span></div>
              <div className="flex justify-between"><span className="text-ink-400">Due at venue</span><span className="text-ink-300">{taka(total - advance)}</span></div>
            </div>
            <Button className="mt-5 w-full" disabled={!selected.length} loading={createBooking.isPending} onClick={proceed}>
              {createBooking.isPending ? 'Reserving…' : 'Proceed to payment'}
            </Button>
            <p className="mt-3 text-center text-xs text-ink-500">Advance is non-refundable within 48h of the slot.</p>
          </Card>
        </div>
      </div>
    </section>
  );
}

function EventsSection() {
  const { data, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: async () => (await api.get('/events')).data.data.events,
  });
  const events = data || [];

  return (
    <section id="events" className="mx-auto max-w-7xl px-6 py-20">
      <SectionHeading kicker="Events" title="Compete & have fun" subtitle="Join tournaments and community matches at our turf." />
      {isLoading ? (
        <Loading />
      ) : events.length === 0 ? (
        <EmptyState icon="🏆" title="No upcoming events" description="New tournaments are announced regularly. Stay tuned!" />
      ) : (
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((ev) => (
            <Card key={ev._id} className="overflow-hidden transition hover:border-turf-600">
              <img src={ev.images?.[0] || GALLERY[2]} alt={ev.title} className="h-44 w-full object-cover" />
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <Badge tone="orange">{ev.status}</Badge>
                  <span className="text-sm font-semibold text-turf-300">{ev.entryFee ? taka(ev.entryFee) : 'Free'}</span>
                </div>
                <h3 className="mt-3 text-lg font-bold text-white">{ev.title}</h3>
                <p className="mt-1 text-sm text-ink-400">{fmtDate(ev.date)} · {fmtRange(ev.startTime, ev.endTime)}</p>
                <p className="mt-1 text-xs text-ink-500">{ev.currentParticipants}/{ev.maxParticipants} registered</p>
                <Button as={Link} to={`/events/${ev._id}`} variant="outline" className="mt-4 w-full">View & Register</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

function MapSection({ venue }) {
  const coords = venue?.location?.coordinates;
  const q = coords && coords.length === 2 ? `${coords[1]},${coords[0]}` : encodeURIComponent(venue?.address || 'Dhaka');
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <SectionHeading kicker="Location" title="Find us" subtitle={venue?.address} />
      <div className="mt-8 overflow-hidden rounded-2xl border border-ink-800">
        <iframe
          title="Venue location"
          width="100%"
          height="400"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={`https://www.google.com/maps?q=${q}&output=embed`}
        />
      </div>
    </section>
  );
}

function ContactSection({ venue }) {
  const submit = (e) => {
    e.preventDefault();
    toast.success('Thanks! We will get back to you shortly.');
    e.target.reset();
  };
  return (
    <section id="contact" className="border-t border-ink-800 bg-ink-900/30">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 md:grid-cols-2">
        <div>
          <SectionHeading kicker="Contact" title="Get in touch" subtitle="Questions about bookings or events? Reach out." />
          <div className="mt-8 space-y-4 text-ink-300">
            <p className="flex items-center gap-3">📞 <span>{venue?.contactPhone || '01700-000000'}</span></p>
            <p className="flex items-center gap-3">✉️ <span>{venue?.contactEmail || 'hello@turf.example'}</span></p>
            <p className="flex items-center gap-3">📍 <span>{venue?.address || 'Gulshan Avenue, Dhaka'}</span></p>
            <p className="flex items-center gap-3">🕒 <span>{venue?.openingTime || '06:00'} – {venue?.closingTime || '23:59'} daily</span></p>
          </div>
        </div>
        <Card className="p-6">
          <form onSubmit={submit} className="space-y-4">
            <input required placeholder="Your name" className="input" />
            <input required type="email" placeholder="Your email" className="input" />
            <textarea required placeholder="Your message" className="input min-h-[120px]" />
            <Button type="submit" className="w-full">Send message</Button>
          </form>
        </Card>
      </div>
    </section>
  );
}

export default function LandingPage() {
  const { data: venues, isLoading } = useQuery({
    queryKey: ['venues'],
    queryFn: async () => (await api.get('/venues')).data.data.venues,
  });
  const venue = venues?.[0];

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner className="h-10 w-10 text-turf-400" />
      </div>
    );
  }

  return (
    <>
      <Hero />
      <Gallery venueImages={venue?.images} />
      <BookingSection venue={venue} />
      <EventsSection />
      <MapSection venue={venue} />
      <ContactSection venue={venue} />
    </>
  );
}
