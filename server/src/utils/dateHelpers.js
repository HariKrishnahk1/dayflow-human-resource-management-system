/**
 * Date helpers that stay in the server's local timezone.
 *
 * Date#toISOString() converts to UTC first, so in any zone ahead of UTC
 * (IST, for example) local midnight formats as the *previous* calendar day.
 * Attendance and leave are calendar-day concepts, so every conversion here
 * reads the local components instead.
 */

const pad = (n) => String(n).padStart(2, '0');

/** Format a Date as yyyy-mm-dd using its local calendar day. */
export function toISODate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Parse yyyy-mm-dd into a Date at local midnight. */
export function fromISODate(s) {
  const [y, m, d] = String(s).split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Today's local calendar date as yyyy-mm-dd. */
export const today = () => toISODate(new Date());

/** Current local wall-clock time as hh:mm:ss. */
export const nowTime = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

/** The Monday-anchored week containing `dateStr`. */
export function weekRange(dateStr) {
  const d = fromISODate(dateStr);
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Monday = 0
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { from: toISODate(monday), to: toISODate(sunday) };
}

/** Every calendar date from `from` to `to`, inclusive. */
export function eachDate(from, to) {
  const out = [];
  const d = fromISODate(from);
  const end = fromISODate(to);
  while (d <= end) {
    out.push(toISODate(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

/** Inclusive day count between two yyyy-mm-dd strings. */
export function inclusiveDays(from, to) {
  return Math.round((fromISODate(to) - fromISODate(from)) / 86400000) + 1;
}
