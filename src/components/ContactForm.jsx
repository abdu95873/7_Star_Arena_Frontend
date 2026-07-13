import { useState } from 'react';
import toast from 'react-hot-toast';
import { Button, Card, Field, Input, Textarea } from './ui.jsx';
import { submitContactMessage, contactErrorMessage } from '../lib/contactApi.js';

const MIN_MESSAGE = 5;

function validate({ name, email, message }) {
  const errors = {};
  const n = name.trim();
  const e = email.trim();
  const m = message.trim();

  if (n.length < 2) errors.name = 'Name must be at least 2 characters';
  if (!e || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) errors.email = 'Enter a valid email address';
  if (m.length < MIN_MESSAGE) errors.message = `Message must be at least ${MIN_MESSAGE} characters`;

  return errors;
}

export default function ContactForm({ venue }) {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const nextErrors = validate(form);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setSending(true);
    setErrors({});
    try {
      await submitContactMessage(form);
      setSent(true);
      setForm({ name: '', email: '', message: '' });
      toast.success('Message sent! We will get back to you soon.');
    } catch (err) {
      toast.error(contactErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const messageLen = form.message.trim().length;

  return (
    <section id="contact" className="border-t border-ink-800 bg-ink-900/30">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 md:grid-cols-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-turf-400">Contact</p>
          <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl">Get in touch</h2>
          <p className="mt-3 text-ink-400">Questions about bookings or events? Send a message or reach us directly.</p>
          <div className="mt-8 space-y-4 text-ink-300">
            <p className="flex items-center gap-3">
              <span aria-hidden>📞</span>
              <a href={`tel:${venue?.contactPhone || '01700000000'}`} className="hover:text-white">
                {venue?.contactPhone || '01700-000000'}
              </a>
            </p>
            <p className="flex items-center gap-3">
              <span aria-hidden>✉️</span>
              <a href={`mailto:${venue?.contactEmail || 'hello@turf.example'}`} className="hover:text-white">
                {venue?.contactEmail || 'hello@turf.example'}
              </a>
            </p>
            <p className="flex items-center gap-3">
              <span aria-hidden>📍</span>
              <span>{venue?.address || 'Gulshan Avenue, Dhaka'}</span>
            </p>
            <p className="flex items-center gap-3">
              <span aria-hidden>🕒</span>
              <span>{venue?.openingTime || '06:00'} – {venue?.closingTime || '23:59'} daily</span>
            </p>
          </div>
        </div>

        <Card className="p-6">
          {sent ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
              <div className="text-4xl" aria-hidden>✅</div>
              <h3 className="mt-4 text-xl font-semibold text-white">Message sent</h3>
              <p className="mt-2 max-w-sm text-ink-400">Thanks for reaching out. Our team will reply as soon as possible.</p>
              <Button type="button" variant="outline" className="mt-6" onClick={() => setSent(false)}>
                Send another message
              </Button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4" noValidate>
              <Field label="Your name" required error={errors.name}>
                <Input
                  name="name"
                  autoComplete="name"
                  placeholder="Your name"
                  value={form.name}
                  onChange={set('name')}
                  error={errors.name}
                />
              </Field>
              <Field label="Your email" required error={errors.email}>
                <Input
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={set('email')}
                  error={errors.email}
                />
              </Field>
              <Field
                label="Your message"
                required
                error={errors.message}
                hint={`At least ${MIN_MESSAGE} characters (${messageLen}/${MIN_MESSAGE})`}
              >
                <Textarea
                  name="message"
                  placeholder="How can we help you?"
                  className="min-h-[120px]"
                  value={form.message}
                  onChange={set('message')}
                  error={errors.message}
                />
              </Field>
              <Button type="submit" className="w-full" loading={sending}>
                Send message
              </Button>
            </form>
          )}
        </Card>
      </div>
    </section>
  );
}
