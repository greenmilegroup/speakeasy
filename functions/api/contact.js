/* Cloudflare Pages Function — POST /api/contact
 *
 * Takes the site's three forms and emails them to the venue through Resend.
 * The API key lives in the Pages environment, never in the browser, so the
 * page itself carries no credential.
 *
 * Environment:
 *   RESEND_API_KEY  secret, from resend.com/api-keys
 *   CONTACT_TO      where enquiries land (default info@speakeasyottawa.com)
 *   CONTACT_FROM    a verified Resend sender on the domain
 */

const DEFAULT_TO   = 'info@speakeasyottawa.com';
const DEFAULT_FROM = 'Speakeasy Website <website@send.speakeasyottawa.com>';

const LIMITS = { name: 100, email: 200, message: 5000, short: 200 };

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

  if (name.length < 2)   return { error: 'Please give us your name.' };
  if (!emailOK(email))   return { error: 'That email does not look right.' };

  const message = clean(data.message, LIMITS.message);
  if (message.length < 4) return { error: 'Please add a message.' };

  if (form === 'careers') {
    return {
      subject: `Job application — ${name}`,
      replyTo: email,
      rows: [
        ['Name', name], ['Email', email],
        ['Phone', clean(data.phone, LIMITS.short)],
        ['Role', clean(data.role, LIMITS.short)],
        ['Experience', clean(data.experience, LIMITS.short)],
        ['Availability', clean(data.availability, LIMITS.short)],
        ['About', message],
      ],
    };
  }

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

  const form = ['contact', 'careers', 'newsletter'].includes(data.form) ? data.form : 'contact';
  const { error, subject, replyTo, rows } = compose(form, data);
  if (error) return json(400, { error });

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
