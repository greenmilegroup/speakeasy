/* Cloudflare Pages Function — GET /api/join
 *
 * The Join button sends people here rather than straight to Stripe, so the
 * payment link lives in exactly one place: SOCIETY_JOIN_URL, the same variable
 * the approval email already pastes. Changing the link is a dashboard edit and
 * a redeploy, not a code change — and the English and French pages cannot drift
 * apart, because both carry the same href.
 *
 * Environment:
 *   SOCIETY_JOIN_URL   the Stripe payment link for the $50/month membership
 */

/* Only ever hand a visitor to Stripe. If the variable is empty, mistyped, or
   someone pastes the wrong thing into the dashboard, send them to the request
   form on the page they came from rather than off the site or to an error. */
const STRIPE = /^https:\/\/(buy|checkout)\.stripe\.com\/[^\s]+$/i;

const redirect = (to) => new Response(null, {
  status: 302,
  // Never cached: a changed payment link has to take effect at once.
  headers: { location: to, 'cache-control': 'no-store' },
});

export function onRequestGet({ request, env }) {
  const join = String(env.SOCIETY_JOIN_URL || '').trim();
  if (STRIPE.test(join)) return redirect(join);

  /* The language is read from the page they clicked from, not from anything
     they can set, so this cannot be turned into an open redirect. */
  let fr = false;
  try { fr = new URL(request.headers.get('referer') || '').pathname.startsWith('/fr/'); }
  catch { /* no referer, or an unparseable one: English */ }

  console.error('join: SOCIETY_JOIN_URL is not a Stripe payment link');
  return redirect(new URL(fr ? '/fr/society#request' : '/society#request', request.url).toString());
}
