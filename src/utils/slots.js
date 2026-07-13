import { dateKey, slotEndInstant, slotStartInstant } from './time.js';

export function isSlotTimedOut(slot, now = new Date()) {
  if (slot.timedOut !== undefined) return slot.timedOut;
  if (!slot.date || !slot.endTime) return false;
  return slotEndInstant(slot.date, slot.endTime, slot.startTime) <= now;
}

export function isAdminBookableSlot(slot, graceMinutes = 30, now = new Date()) {
  if (slot.status && slot.status !== 'available') return false;
  if (isSlotTimedOut(slot, now)) return false;
  if (slot.bookable === true) return true;
  if (slot.bookable === false) return false;
  const deadline = new Date(slotStartInstant(slot.date, slot.startTime).getTime() + graceMinutes * 60 * 1000);
  return now <= deadline;
}

/** Public user booking — available, not started, not ended. */
export function isUserBookableSlot(slot, now = new Date()) {
  if (slot.bookable === true) return true;
  if (slot.bookable === false) return false;
  if (slot.status !== 'available') return false;
  if (isSlotTimedOut(slot, now)) return false;
  return slotStartInstant(slot.date, slot.startTime) > now;
}

/** True when every slot in the booking has ended (BD time). */
export function isBookingFullyEnded(booking, now = new Date()) {
  if (!booking?.slotIds?.length) return false;
  return booking.slotIds.every((s) => isSlotTimedOut(s, now));
}

/** Past booking with nothing left to collect — no admin actions needed. */
export function shouldHideBookingActions(booking, now = new Date()) {
  return isBookingFullyEnded(booking, now) && Number(booking?.dueAmount || 0) <= 0;
}

export { dateKey, todayKeyDhaka } from './time.js';
