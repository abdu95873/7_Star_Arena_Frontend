import { format, parseISO } from 'date-fns';

export const taka = (n) => `৳${Number(n || 0).toLocaleString('en-BD')}`;

export const fmtDate = (d) => {
  if (!d) return '';
  try {
    return format(typeof d === 'string' ? parseISO(d) : d, 'PP');
  } catch {
    return String(d);
  }
};

export const fmtDateTime = (d) => {
  if (!d) return '';
  try {
    return format(typeof d === 'string' ? parseISO(d) : d, 'PP p');
  } catch {
    return String(d);
  }
};

// Convert a 24h "HH:mm" string to a 12h AM/PM label, e.g. "21:00" -> "9:00 PM".
export const fmtTime = (hhmm) => {
  if (!hhmm || typeof hhmm !== 'string') return hhmm || '';
  const [h, m] = hhmm.split(':').map(Number);
  if (Number.isNaN(h)) return hhmm;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m || 0).padStart(2, '0')} ${period}`;
};

// "06:00", "07:30" -> "6:00 AM – 7:30 AM"
export const fmtRange = (start, end) => `${fmtTime(start)} – ${fmtTime(end)}`;

// Map a status string to a Badge tone.
export const statusTone = (status) => {
  const map = {
    available: 'green',
    booked: 'red',
    blocked: 'gray',
    confirmed: 'green',
    completed: 'blue',
    pending: 'amber',
    cancelled: 'gray',
    'no-show': 'red',
    paid: 'green',
    partial: 'amber',
    refunded: 'blue',
    failed: 'red',
    success: 'green',
    initiated: 'amber',
    upcoming: 'green',
    ongoing: 'orange',
  };
  return map[status] || 'gray';
};

export const apiError = (err, fallback = 'Something went wrong') =>
  err?.response?.data?.message || err?.message || fallback;
