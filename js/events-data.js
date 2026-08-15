/* =========================================================================
   SPEAKEASY — event loading
   Reads from Supabase when js/config.js is filled in, otherwise from
   assets/data/events.json. Any failure falls back to the JSON so the page
   is never empty. Weekly events are expanded to their next occurrence.
   ========================================================================= */
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

const configured = () => Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/** Next date/time for a weekly event, given weekday (0=Sun) and "HH:MM". */
export function nextWeekly(weekday, time = '19:00') {
  const [h, m] = String(time).split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  let add = (weekday - d.getDay() + 7) % 7;
  if (add === 0 && d.getTime() < Date.now()) add = 7;
  d.setDate(d.getDate() + add);
  return d;
}

/** One shape for both sources; `date` is a real Date used for sorting. */
function normalise(row) {
  const rec = row.recurrence || 'none';
  const date = rec === 'weekly'
    ? nextWeekly(Number(row.weekday ?? 5), row.time || '19:00')
    : (row.starts_at ? new Date(row.starts_at) : null);
  return {
    id: row.id ?? crypto.randomUUID?.() ?? String(Math.random()),
    title: row.title || 'Untitled',
    kicker: row.kicker || '',
    blurb: row.blurb || '',
    category: row.category || 'special',
    recurrence: rec,
    date,
    durationMin: Number(row.duration_min ?? 120),
    priceText: row.price_text || '',
    imageUrl: row.image_url || '',
    ticketUrl: row.ticket_url || '',
  };
}

async function fromJson() {
  const res = await fetch('assets/data/events.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('events.json ' + res.status);
  return res.json();
}

async function fromSupabase() {
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/events`
    + '?select=*&published=eq.true&order=starts_at.asc';
  const res = await fetch(url, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
  });
  if (!res.ok) throw new Error('supabase ' + res.status);
  return res.json();
}

/** Published, upcoming-first, sorted. Never rejects — falls back to JSON. */
export async function loadEvents() {
  let rows = [];
  if (configured()) {
    try { rows = await fromSupabase(); }
    catch (err) { console.warn('[events] Supabase unavailable, using local data:', err.message); }
  }
  if (!rows.length) {
    try { rows = await fromJson(); }
    catch (err) { console.warn('[events] no event data:', err.message); return []; }
  }
  const now = Date.now();
  return rows
    .filter(r => r.published !== false)
    .map(normalise)
    .filter(e => e.date && e.date.getTime() > now - 3 * 60 * 60 * 1000) // keep tonight's
    .sort((a, b) => a.date - b.date);
}

export const source = () => (configured() ? 'supabase' : 'local');
