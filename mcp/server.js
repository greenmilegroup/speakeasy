#!/usr/bin/env node
/* =========================================================================
   Speakeasy Tapas Lounge — events MCP server
   Lets Claude read and write the venue's events.

   Storage:
     • SUPABASE_URL + SUPABASE_SERVICE_KEY set → the Supabase `events` table
     • otherwise                               → ../assets/data/events.json
   The JSON fallback means this works before Supabase exists.
   ========================================================================= */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const JSON_PATH = resolve(HERE, '..', 'assets', 'data', 'events.json');

const URL_ = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const KEY = process.env.SUPABASE_SERVICE_KEY || '';
const useDb = Boolean(URL_ && KEY);
const CATEGORIES = ['music', 'comedy', 'special'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/* ---------------------------------------------------------------- storage */
async function readAll() {
  if (!useDb) {
    try { return JSON.parse(await readFile(JSON_PATH, 'utf8')); }
    catch { return []; }
  }
  const res = await fetch(`${URL_}/rest/v1/events?select=*&order=starts_at.asc`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  if (!res.ok) throw new Error(`Supabase read failed (${res.status})`);
  return res.json();
}

async function writeAll(rows) {
  if (useDb) throw new Error('writeAll is JSON-mode only');
  await writeFile(JSON_PATH, JSON.stringify(rows, null, 2) + '\n', 'utf8');
}

async function dbInsert(row) {
  const res = await fetch(`${URL_}/rest/v1/events`, {
    method: 'POST',
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(row),
  });
  if (!res.ok) throw new Error(`Supabase insert failed (${res.status}): ${await res.text()}`);
  return (await res.json())[0];
}

async function dbPatch(id, patch) {
  const res = await fetch(`${URL_}/rest/v1/events?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`Supabase update failed (${res.status})`);
  return (await res.json())[0];
}

async function dbDelete(id) {
  const res = await fetch(`${URL_}/rest/v1/events?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  if (!res.ok) throw new Error(`Supabase delete failed (${res.status})`);
}

/* ---------------------------------------------------------------- helpers */
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 40);

/** Accepts ISO, "2026-08-23 20:00", or "Friday 8pm" / "next Friday 8pm". */
function parseWhen(input) {
  if (!input) return null;
  const direct = new Date(input);
  if (!Number.isNaN(direct.getTime()) && /\d{4}-\d{2}-\d{2}/.test(input)) return direct;

  const text = String(input).toLowerCase();
  const day = DAYS.findIndex(d => text.includes(d.toLowerCase()));
  const tm = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
  if (day === -1 && !tm) return Number.isNaN(direct.getTime()) ? null : direct;

  const d = new Date();
  let h = tm ? parseInt(tm[1], 10) : 19;
  const min = tm && tm[2] ? parseInt(tm[2], 10) : 0;
  if (tm && tm[3] === 'pm' && h < 12) h += 12;
  if (tm && tm[3] === 'am' && h === 12) h = 0;
  if (!tm || (!tm[3] && h < 9)) h += 12;           // "at 8" for a lounge means 8 PM
  d.setHours(h, min, 0, 0);
  if (day !== -1) {
    let add = (day - d.getDay() + 7) % 7;
    if (add === 0 && d.getTime() < Date.now()) add = 7;
    if (text.includes('next') && add < 7) add += 7;
    d.setDate(d.getDate() + add);
  } else if (d.getTime() < Date.now()) {
    d.setDate(d.getDate() + 1);
  }
  return d;
}

function pretty(row) {
  const when = row.recurrence === 'weekly'
    ? `every ${DAYS[row.weekday ?? 5]} at ${row.time || '19:00'}`
    : (row.starts_at ? new Date(row.starts_at).toLocaleString('en-CA', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'no date');
  const flags = [row.published === false ? 'hidden' : null, row.price_text || null].filter(Boolean);
  return `• ${row.title} — ${when}${flags.length ? ` (${flags.join(', ')})` : ''}  [id: ${row.id}]`;
}

async function findOne(idOrTitle) {
  const rows = await readAll();
  const needle = String(idOrTitle).toLowerCase();
  return rows.find(r => String(r.id).toLowerCase() === needle)
      || rows.find(r => (r.title || '').toLowerCase() === needle)
      || rows.find(r => (r.title || '').toLowerCase().includes(needle));
}

const ok = (text) => ({ content: [{ type: 'text', text }] });
const store = () => (useDb ? 'Supabase' : 'assets/data/events.json');

/* ---------------------------------------------------------------- tools */
const TOOLS = [
  { name: 'list_events',
    description: 'List the venue\'s events. Use before updating or deleting so you have the right id.',
    inputSchema: { type: 'object', properties: {
      include_hidden: { type: 'boolean', description: 'Also show unpublished events (default false)' } } } },

  { name: 'create_event',
    description: 'Add an event to the Speakeasy site. For a one-off pass `when` (e.g. "2026-08-23 20:00" or "Friday 8pm"). For something that repeats every week pass recurrence="weekly" with weekday (0=Sun..6=Sat) and time ("20:00").',
    inputSchema: { type: 'object', required: ['title'], properties: {
      title: { type: 'string' },
      when: { type: 'string', description: 'Date/time for a one-off event' },
      recurrence: { type: 'string', enum: ['none', 'weekly'], description: 'Default "none"' },
      weekday: { type: 'integer', minimum: 0, maximum: 6, description: 'Weekly only: 0=Sun … 6=Sat' },
      time: { type: 'string', description: 'Weekly only, "HH:MM" 24h' },
      category: { type: 'string', enum: CATEGORIES, description: 'Default "special"' },
      kicker: { type: 'string', description: 'Small label above the title, e.g. "On the stage"' },
      blurb: { type: 'string', description: 'One or two sentences shown on the card' },
      price_text: { type: 'string', description: 'e.g. "No cover", "$10", "Ages 35–45"' },
      image_url: { type: 'string', description: 'e.g. "assets/img/ig-sax.jpg" or a full URL' },
      ticket_url: { type: 'string', description: 'Defaults to the venue Eventbrite page' },
      ticketed: { type: 'boolean', description: 'Put it under "The Main Event" (true) or the live-music schedule (false). Omit to infer from ticket_url/category.' },
      duration_min: { type: 'integer' } } } },

  { name: 'update_event',
    description: 'Change fields on an existing event. Identify it by id or by (part of) its title.',
    inputSchema: { type: 'object', required: ['event'], properties: {
      event: { type: 'string', description: 'id or title' },
      title: { type: 'string' }, when: { type: 'string' }, blurb: { type: 'string' },
      kicker: { type: 'string' }, price_text: { type: 'string' }, image_url: { type: 'string' },
      ticket_url: { type: 'string' }, category: { type: 'string', enum: CATEGORIES },
      recurrence: { type: 'string', enum: ['none', 'weekly'] },
      weekday: { type: 'integer', minimum: 0, maximum: 6 }, time: { type: 'string' },
      ticketed: { type: 'boolean' }, duration_min: { type: 'integer' } } } },

  { name: 'delete_event',
    description: 'Permanently remove an event. To hide one temporarily use set_published instead.',
    inputSchema: { type: 'object', required: ['event'], properties: {
      event: { type: 'string', description: 'id or title' } } } },

  { name: 'set_published',
    description: 'Show or hide an event on the site without deleting it.',
    inputSchema: { type: 'object', required: ['event', 'published'], properties: {
      event: { type: 'string' }, published: { type: 'boolean' } } } },
];

/* ---------------------------------------------------------------- server */
const server = new Server({ name: 'speakeasy-events', version: '1.0.0' }, { capabilities: { tools: {} } });
server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: a = {} } = req.params;
  try {
    if (name === 'list_events') {
      const rows = (await readAll()).filter(r => a.include_hidden || r.published !== false);
      if (!rows.length) return ok(`No events yet (storage: ${store()}).`);
      return ok(`${rows.length} event(s) — storage: ${store()}\n\n${rows.map(pretty).join('\n')}`);
    }

    if (name === 'create_event') {
      const recurrence = a.recurrence === 'weekly' ? 'weekly' : 'none';
      if (recurrence === 'none' && !a.when) throw new Error('A one-off event needs `when` (e.g. "Friday 8pm" or "2026-08-23 20:00").');
      const when = recurrence === 'none' ? parseWhen(a.when) : null;
      if (recurrence === 'none' && !when) throw new Error(`Could not understand the date "${a.when}".`);

      const row = {
        title: a.title,
        kicker: a.kicker || '',
        blurb: a.blurb || '',
        category: CATEGORIES.includes(a.category) ? a.category : 'special',
        recurrence,
        starts_at: when ? when.toISOString() : null,
        weekday: recurrence === 'weekly' ? (a.weekday ?? 5) : null,
        time: recurrence === 'weekly' ? (a.time || '19:00') : null,
        duration_min: a.duration_min ?? 120,
        price_text: a.price_text || '',
        image_url: a.image_url || '',
        ticket_url: a.ticket_url || '',
        ticketed: a.ticketed ?? null,
        published: true,
      };

      if (useDb) { const saved = await dbInsert(row); return ok(`Added **${saved.title}** — live on the site now.\n${pretty(saved)}`); }
      const rows = await readAll();
      row.id = slug(a.title) || `event-${Date.now()}`;
      if (rows.some(r => r.id === row.id)) row.id += '-' + Date.now().toString(36).slice(-4);
      rows.push(row); await writeAll(rows);
      return ok(`Added **${row.title}** to ${store()}. Commit and push to publish.\n${pretty(row)}`);
    }

    if (name === 'update_event') {
      const found = await findOne(a.event);
      if (!found) throw new Error(`No event matching "${a.event}". Run list_events first.`);
      const patch = {};
      for (const k of ['title', 'kicker', 'blurb', 'price_text', 'image_url', 'ticket_url', 'ticketed', 'duration_min']) if (a[k] !== undefined) patch[k] = a[k];
      if (a.category && CATEGORIES.includes(a.category)) patch.category = a.category;
      if (a.recurrence) patch.recurrence = a.recurrence;
      if (a.weekday !== undefined) patch.weekday = a.weekday;
      if (a.time) patch.time = a.time;
      if (a.when) { const d = parseWhen(a.when); if (!d) throw new Error(`Could not understand "${a.when}".`); patch.starts_at = d.toISOString(); patch.recurrence = 'none'; }
      if (!Object.keys(patch).length) throw new Error('Nothing to change — pass at least one field.');

      if (useDb) { const saved = await dbPatch(found.id, patch); return ok(`Updated **${saved.title}**.\n${pretty(saved)}`); }
      const rows = await readAll();
      const row = rows.find(r => r.id === found.id);
      Object.assign(row, patch); await writeAll(rows);
      return ok(`Updated **${row.title}** in ${store()}.\n${pretty(row)}`);
    }

    if (name === 'delete_event') {
      const found = await findOne(a.event);
      if (!found) throw new Error(`No event matching "${a.event}".`);
      if (useDb) { await dbDelete(found.id); return ok(`Deleted **${found.title}**.`); }
      const rows = (await readAll()).filter(r => r.id !== found.id);
      await writeAll(rows);
      return ok(`Deleted **${found.title}** from ${store()}.`);
    }

    if (name === 'set_published') {
      const found = await findOne(a.event);
      if (!found) throw new Error(`No event matching "${a.event}".`);
      if (useDb) { const saved = await dbPatch(found.id, { published: !!a.published }); return ok(`**${saved.title}** is now ${a.published ? 'visible' : 'hidden'}.`); }
      const rows = await readAll();
      const row = rows.find(r => r.id === found.id);
      row.published = !!a.published; await writeAll(rows);
      return ok(`**${row.title}** is now ${a.published ? 'visible' : 'hidden'}.`);
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (err) {
    return { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error(`[speakeasy-events] ready — storage: ${store()}`);
