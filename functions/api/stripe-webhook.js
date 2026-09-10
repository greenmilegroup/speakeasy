/* Cloudflare Pages Function — POST /api/stripe-webhook
 *
 * Stripe tells the site when a Society membership starts or ends, so the
 * member list keeps itself. Nobody has to watch a dashboard.
 *
 * On a new membership: the venue is emailed, and the person is marked a member
 * in the Resend list they are probably already on (they applied for a card
 * first). On a cancellation: the venue is emailed, and the mark is removed —
 * the card is no longer good at the door.
 *
 * Stripe does the hard parts on its own and needs no code here: charging every
 * month, retrying a card that fails, emailing the receipt, and letting a member
 * change their card or cancel from the billing portal. See DEPLOY.md.
 *
 * Environment:
 *   STRIPE_WEBHOOK_SECRET   the whsec_… signing secret for this endpoint
 *   RESEND_API_KEY          shared with the contact form
 *   CONTACT_TO / CONTACT_FROM / RESEND_SEGMENT   likewise
 */

const DEFAULT_TO      = 'info@speakeasyottawa.com';
const DEFAULT_FROM    = 'Speakeasy Website <website@send.speakeasyottawa.com>';
const DEFAULT_SEGMENT = '9adafa40-6d15-4b03-bd25-70fca8c56f6e';   // "General"

const TOLERANCE = 300;   // seconds; older than this is a replay, not a delivery

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

const esc = (s) => String(s ?? '').replace(/[&<>"']/g,
  (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const money = (cents, cur) =>
  typeof cents === 'number' ? `${(cents / 100).toFixed(2)} ${String(cur || 'cad').toUpperCase()}` : '';

/* ---------- signature ----------
   Stripe signs "<timestamp>.<raw body>" with the endpoint secret. The body must
   be the bytes as sent: parsing and re-serialising changes the whitespace and
   the signature stops matching, which is the classic way this fails. */
async function verify(raw, header, secret) {
  if (!raw || !header || !secret) return false;

  const parts = Object.create(null);
  const v1 = [];
  for (const piece of header.split(',')) {
    const i = piece.indexOf('=');
    if (i < 0) continue;
    const k = piece.slice(0, i).trim(), v = piece.slice(i + 1).trim();
    if (k === 'v1') v1.push(v); else parts[k] = v;
  }
  const t = Number(parts.t);
  if (!Number.isFinite(t) || !v1.length) return false;
  // A signature from last week is a replay of a real one, so time matters.
  if (Math.abs(Math.floor(Date.now() / 1000) - t) > TOLERANCE) return false;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  const signed = enc.encode(`${t}.${raw}`);

  /* Several v1 signatures arrive while a secret is being rotated; any one
     matching is enough. crypto.subtle.verify compares in constant time, which
     a === on two hex strings would not. */
  for (const hex of v1) {
    if (!/^[0-9a-f]+$/i.test(hex) || hex.length % 2) continue;
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    if (await crypto.subtle.verify('HMAC', key, bytes, signed)) return true;
  }
  return false;
}

/* ---------- Resend ---------- */

async function email(env, subject, rows) {
  const live = rows.filter(([, v]) => v);
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: env.CONTACT_FROM || DEFAULT_FROM,
      to: [env.CONTACT_TO || DEFAULT_TO],
      subject,
      text: live.map(([k, v]) => `${k}: ${v}`).join('\n'),
      html: `<table style="font:15px/1.5 system-ui,sans-serif;border-collapse:collapse">${
        live.map(([k, v]) =>
          `<tr><td style="padding:4px 16px 4px 0;color:#666;vertical-align:top">${esc(k)}</td>` +
          `<td style="padding:4px 0">${esc(v)}</td></tr>`).join('')
      }</table>`,
    }),
  });
  if (!res.ok) console.error('resend email', res.status, await res.text());
  return res.ok;
}

/* Mark someone a member, or no longer one. Best effort, exactly as the contact
   form treats its contact write: a list that will not take the update must
   never cost the venue its notification. */
async function mark(env, address, state, name) {
  if (!address) return null;
  const headers = { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' };
  const segment = env.RESEND_SEGMENT || DEFAULT_SEGMENT;
  const properties = { society_interest: state, signup_source: 'society-membership' };

  // Already on the list from applying for a card, so update before create.
  let res = await fetch(`https://api.resend.com/contacts/${encodeURIComponent(address)}`, {
    method: 'PATCH', headers, body: JSON.stringify({ properties, unsubscribed: false }),
  });
  if (res.ok) return 'updated';

  const first = `${res.status} ${await res.text()}`;
  res = await fetch('https://api.resend.com/contacts', {
    method: 'POST', headers,
    body: JSON.stringify({
      email: address, unsubscribed: false, ...(name ? { first_name: name } : {}),
      segments: [{ id: segment }], properties,
    }),
  });
  if (res.ok || res.status === 409) return 'created';

  console.error('resend contact', first, '|', res.status, await res.text());
  return null;
}

/* ---------- the events worth acting on ---------- */

async function onSubscriptionStart(env, session) {
  const d = session.customer_details || {};
  const stored = await mark(env, d.email, 'member', (d.name || '').split(' ')[0]);
  await email(env, `New Society member — ${d.name || d.email || 'unknown'}`, [
    ['Name', d.name],
    ['Email', d.email],
    ['Phone', d.phone],
    ['First payment', money(session.amount_total, session.currency)],
    ['Marked a member in Resend', stored ? `yes (${stored})` : 'NO — mark by hand'],
    ['Next', 'Make their card. They are on the door list from tonight.'],
  ]);
}

async function onSubscriptionEnd(env, sub) {
  // A cancelled subscription carries no email address, only a customer id.
  let name = '', address = '';
  try {
    if (env.STRIPE_SECRET_KEY && typeof sub.customer === 'string') {
      const r = await fetch(`https://api.stripe.com/v1/customers/${sub.customer}`, {
        headers: { authorization: `Bearer ${env.STRIPE_SECRET_KEY}` },
      });
      if (r.ok) { const c = await r.json(); name = c.name || ''; address = c.email || ''; }
    }
  } catch (err) { console.error('stripe customer lookup', err); }

  const stored = address ? await mark(env, address, 'lapsed', name.split(' ')[0]) : null;
  await email(env, `Society membership ended — ${name || address || sub.customer}`, [
    ['Name', name],
    ['Email', address],
    ['Stripe customer', sub.customer],
    ['Marked lapsed in Resend', address ? (stored ? `yes (${stored})` : 'NO — mark by hand') : 'no email on the event'],
    ['Next', 'Their card is no longer good at the door.'],
  ]);
}

/* ---------- boot ---------- */

export async function onRequestPost({ request, env }) {
  if (!env.STRIPE_WEBHOOK_SECRET || !env.RESEND_API_KEY) {
    console.error('stripe-webhook: STRIPE_WEBHOOK_SECRET or RESEND_API_KEY is not set');
    return json(500, { error: 'not configured' });
  }

  const raw = await request.text();
  const ok = await verify(raw, request.headers.get('stripe-signature'), env.STRIPE_WEBHOOK_SECRET);
  if (!ok) return json(400, { error: 'bad signature' });

  let event;
  try { event = JSON.parse(raw); }
  catch { return json(400, { error: 'unreadable body' }); }

  /* Past this point always answer 200, whatever happens. A non-2xx makes
     Stripe deliver the same event again, which would email the venue twice;
     Stripe's own dashboard remains the record of who paid, so a notification
     that fails is recoverable and a duplicate one is not worth risking. */
  try {
    const o = event.data?.object || {};
    if (event.type === 'checkout.session.completed'
        && o.mode === 'subscription' && o.payment_status === 'paid') {
      await onSubscriptionStart(env, o);
    } else if (event.type === 'customer.subscription.deleted') {
      await onSubscriptionEnd(env, o);
    }
  } catch (err) {
    console.error('stripe-webhook: handling', event?.type, err);
  }
  return json(200, { received: true });
}

/* Stripe only ever posts; anything else is a mistake or a crawler. */
export const onRequestGet = () => json(405, { error: 'Method not allowed' });
