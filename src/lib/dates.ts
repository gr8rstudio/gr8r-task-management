const DAY = 864e5;

export function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function today() {
  return startOfDay(new Date());
}

export function toIso(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function parseIso(value: string | null | undefined) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

export function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function daysFromToday(amount: number) {
  return toIso(addDays(today(), amount));
}

export function diffDays(a: Date, b: Date) {
  return Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / DAY);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function formatDate(value: string | null | undefined) {
  const date = typeof value === "string" ? parseIso(value) : null;
  if (!date) return "";
  const year = date.getFullYear() !== today().getFullYear() ? `, ${date.getFullYear()}` : "";
  return `${MONTHS[date.getMonth()]} ${date.getDate()}${year}`;
}

export function formatLongDate(date = today()) {
  return `${WEEKDAYS_LONG[date.getDay()]}, ${MONTHS_LONG[date.getMonth()]} ${date.getDate()}`;
}

export function relativeDate(value: string | null | undefined) {
  const date = parseIso(value);
  if (!date || !value) return "";
  const delta = diffDays(date, today());
  if (delta === 0) return "Today";
  if (delta === 1) return "Tomorrow";
  if (delta === -1) return "Yesterday";
  if (delta > 1 && delta < 7) return WEEKDAYS[date.getDay()];
  return formatDate(value);
}

export function ago(timestamp: number) {
  const minutes = Math.round((Date.now() - timestamp) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(toIso(new Date(timestamp)));
}

export function minutesAgo(minutes: number) {
  return Date.now() - minutes * 60000;
}

export function dayBucket(timestamp: number) {
  const delta = diffDays(new Date(timestamp), today());
  if (delta === 0) return "Today";
  if (delta === -1) return "Yesterday";
  if (delta > -7) return "This week";
  return "Earlier";
}

export function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export { MONTHS, WEEKDAYS };
