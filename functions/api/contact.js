/* Cloudflare Pages Function — POST /api/contact
 *
 * Takes the site's forms and emails them to the venue through Resend. A
 * Society sign-up is also stored as a Resend contact, so the list exists
 * somewhere a broadcast can be sent to, not only in the inbox.
 * The API key lives in the Pages environment, never in the browser, so the
 * page itself carries no credential.
 *
 * Environment:
 *   RESEND_API_KEY  secret, from resend.com/api-keys
 *   CONTACT_TO      where enquiries land (default info@speakeasyottawa.com)
 *   CONTACT_FROM    a verified Resend sender on the domain
 *   RESEND_SEGMENT  the Resend segment (audience) new contacts join
 */

const DEFAULT_TO   = 'info@speakeasyottawa.com';
const DEFAULT_FROM = 'Speakeasy Website <website@send.speakeasyottawa.com>';
const DEFAULT_SEGMENT = '9adafa40-6d15-4b03-bd25-70fca8c56f6e';   // "General"

const LIMITS = { name: 100, email: 200, message: 5000, short: 200, feedback: 1000 };

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

const clean = (v, max) => String(v ?? '').trim().slice(0, max);
const emailOK = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const esc = (s) => String(s).replace(/[&<>"']/g,
  (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* Each form becomes a subject line and an ordered set of fields. */
function compose(form, data) {
  const name  = clean(data.name, LIMITS.name);
  const email = clean(data.email, LIMITS.email);

  if (form === 'newsletter') {
    if (!emailOK(email)) return { error: 'A valid email, please.' };
    return { subject: 'Newsletter signup', replyTo: email, rows: [['Email', email]] };
  }

  if (form === 'society') {
    if (!emailOK(email)) return { error: 'A valid email, please.' };
    const member   = data.member === true || data.member === 'true';
    const feedback = clean(data.feedback, LIMITS.feedback);
    const source   = clean(data.source, 40);
    return {
      subject: member ? `Society signup · wants the membership — ${name || email}` : `Society signup — ${name || email}`,
      replyTo: email,
      rows: [['Name', name], ['Email', email], ['Membership interest', member ? 'Yes' : 'No'],
             ['What would make it worth it', feedback], ['Signed up from', source]],
      contact: { email, name, member, feedback, source },
    };
  }

  if (form === 'membership') {
    const phone = clean(data.phone, 40);
    const often = clean(data.often, 60);
    const first = clean(data.first, LIMITS.name);
    if (name.length < 3)  return { error: 'Please give us your name.' };
    if (!emailOK(email))  return { error: 'That email does not look right.' };
    if (phone.replace(/\D/g, '').length < 10) return { error: 'A phone number we can reach you on, please.' };
    return {
      subject: `Society card request — ${name} · ${often || 'frequency not given'}`,
      replyTo: email,
      rows: [['Name', name], ['Email', email], ['Phone', phone], ['How often', often]],
      contact: { email, name: first || name, member: 'applied', feedback: '', source: 'society-request' },
    };
  }

  if (form === 'event') {
    const date   = clean(data.date, LIMITS.short);
    const guests = clean(data.guests, 40);
    const phone  = clean(data.phone, 40);
    const note   = clean(data.message, LIMITS.short);
    if (name.length < 2)     return { error: 'Please give us your name.' };
    if (!emailOK(email))     return { error: 'That email does not look right.' };
    if (date.length < 2)     return { error: 'Tell us roughly when.' };
    if (!/\d/.test(guests))  return { error: 'Roughly how many people?' };
    return {
      subject: `Private event enquiry — ${name} · ${guests} people · ${date}`,
      replyTo: email,
      rows: [['Name', name], ['Email', email], ['Phone', phone], ['When', date], ['How many', guests], ['Occasion', note]],
    };
  }

  if (name.length < 2)   return { error: 'Please give us your name.' };
  if (!emailOK(email))   return { error: 'That email does not look right.' };

  const message = clean(data.message, LIMITS.message);
  if (message.length < 4) return { error: 'Please add a message.' };

  return {
    subject: `Website enquiry — ${name}`,
    replyTo: email,
    rows: [['Name', name], ['Email', email], ['Message', message]],
  };
}

const render = (rows) => ({
  text: rows.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join('\n'),
  html: `<table style="font:15px/1.5 system-ui,sans-serif;border-collapse:collapse">${
    rows.filter(([, v]) => v).map(([k, v]) =>
      `<tr><td style="padding:4px 16px 4px 0;color:#666;vertical-align:top">${esc(k)}</td>` +
      `<td style="padding:4px 0">${esc(v).replace(/\n/g, '<br>')}</td></tr>`).join('')
  }</table>`,
});

/* Add the person to the list. Resend's current contacts API takes the segment
   and custom properties in one call; the older audiences endpoint takes only
   the basics. Try the first, fall back to the second, and never let either
   stop the notification email — a sign-up that reaches the inbox is not lost
   even if the list is unreachable. */
async function addContact(env, c) {
  const headers = { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' };
  const segment = env.RESEND_SEGMENT || DEFAULT_SEGMENT;
  const base = { email: c.email, unsubscribed: false, ...(c.name ? { first_name: c.name } : {}) };

  let res = await fetch('https://api.resend.com/contacts', {
    method: 'POST', headers,
    body: JSON.stringify({
      ...base,
      segments: [{ id: segment }],   // Resend wants objects here, not ids: "expected object, received string"
      properties: {
        society_interest: c.member === 'applied' ? 'applied' : (c.member ? 'yes' : 'no'),
        ...(c.feedback ? { society_feedback: c.feedback } : {}),
        ...(c.source ? { signup_source: c.source } : {}),
      },
    }),
  });
  if (res.ok || res.status === 409) return 'contacts';

  const first = `${res.status} ${await res.text()}`;
  res = await fetch(`https://api.resend.com/audiences/${segment}/contacts`, {
    method: 'POST', headers, body: JSON.stringify(base),
  });
  if (res.ok || res.status === 409) return 'audiences';

  console.error('Resend would not store the contact', first, '|', res.status, await res.text());
  return null;
}

export async function onRequestPost({ request, env }) {
  if (!env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set');
    return json(500, { error: 'The form is not configured yet. Please call us on 613-241-6221.' });
  }

  let data;
  try { data = await request.json(); }
  catch { return json(400, { error: 'Could not read that submission.' }); }

  // Bots fill in every field they find; people never see this one.
  if (clean(data.company, LIMITS.short)) return json(200, { ok: true });

  const form = ['contact', 'newsletter', 'society', 'event', 'membership'].includes(data.form) ? data.form : 'contact';
  const { error, subject, replyTo, rows, contact } = compose(form, data);
  if (error) return json(400, { error });

  const stored = contact ? await addContact(env, contact) : null;
  if (contact) rows.push(['Stored in Resend', stored ? `yes (${stored})` : 'NO — add by hand']);

  const { text, html } = render(rows);
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from: env.CONTACT_FROM || DEFAULT_FROM,
      to: [env.CONTACT_TO || DEFAULT_TO],
      reply_to: replyTo,
      subject,
      text,
      html,
    }),
  });

  if (!res.ok) {
    console.error('Resend rejected the message', res.status, await res.text());
    return json(502, { error: 'We could not send that. Please call us on 613-241-6221.' });
  }

  return json(200, { ok: true });
}

/* The form only ever posts; anything else is a mistake or a crawler. */
export const onRequestGet = () => json(405, { error: 'Method not allowed' });
