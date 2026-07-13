/** Business timezone — this app is operated from Bangladesh. */
export const APP_TIMEZONE = 'Asia/Dhaka';
const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000;

const dhakaDateFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: APP_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function timeToMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function dateKey(input) {
  if (!input) return dhakaDateFmt.format(new Date());
  if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}/.test(input)) return input.slice(0, 10);
  return dhakaDateFmt.format(new Date(input));
}

export function dhakaLocalToUtc(dateKeyStr, hhmm = '00:00', ss = 0) {
  const [y, mo, d] = dateKeyStr.split('-').map(Number);
  const [h, mi] = hhmm.split(':').map(Number);
  return new Date(Date.UTC(y, mo - 1, d, h, mi, ss) - DHAKA_OFFSET_MS);
}

export function slotStartInstant(date, startTime) {
  return dhakaLocalToUtc(dateKey(date), startTime);
}

function addDaysToDateKey(key, days) {
  const [y, mo, d] = key.split('-').map(Number);
  const next = new Date(Date.UTC(y, mo - 1, d + days));
  return next.toISOString().slice(0, 10);
}

export function slotEndInstant(date, endTime, startTime) {
  const key = dateKey(date);
  if (startTime && timeToMinutes(endTime) <= timeToMinutes(startTime)) {
    return dhakaLocalToUtc(addDaysToDateKey(key, 1), endTime);
  }
  return dhakaLocalToUtc(key, endTime);
}

export function todayKeyDhaka() {
  return dateKey(new Date());
}
