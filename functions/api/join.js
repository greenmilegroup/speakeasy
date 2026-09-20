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

/* Only ever hand a visitor to Stripe, and only to a link that can actually
   take their money. Anything else — empty, mistyped, the wrong thing pasted
   into the dashboard, or a test-mode link — sends them to the request form
   instead, which is a real way in rather than a dead end.

   A test-mode link is the dangerous case, because it is a genuine Stripe URL
   and looks entirely normal: the visitor reaches a real-looking checkout that
   silently declines every real card, and the venue never hears about it. */
function payable(raw) {
  let u;
  try { u = new URL(String(raw || '').trim()); } catch { return null; }
  if (u.protocol !== 'https:') return null;
  // Exact hostnames: "buy.stripe.com.example.invalid" is not Stripe.
  if (u.hostname !== 'buy.stripe.com' && u.hostname !== 'checkout.stripe.com') return null;
  if (u.pathname.length < 2) return null;
  // Stripe marks test mode in the path: /test_… on a payment link,
  // /c/pay/cs_test_… on a checkout session.
  if (/(?:^|\/)(?:cs_)?test_/i.test(u.pathname)) return 'test';
  return u.toString();
}

const redirect = (to) => new Response(null, {
  status: 302,
  // Never cached: a changed payment link has to take effect at once.
  headers: { location: to, 'cache-control': 'no-store' },
});

export function onRequestGet({ request, env }) {
  const link = payable(env.SOCIETY_JOIN_URL);
  if (link && link !== 'test') return redirect(link);

  /* The language is read from the page they clicked from, not from anything
     they can set, so this cannot be turned into an open redirect. */
  let fr = false;
  try { fr = new URL(request.headers.get('referer') || '').pathname.startsWith('/fr/'); }
  catch { /* no referer, or an unparseable one: English */ }

  console.error(link === 'test'
    ? 'join: SOCIETY_JOIN_URL is a Stripe TEST link — no real card can pay it'
    : 'join: SOCIETY_JOIN_URL is not a Stripe payment link');
  return redirect(new URL(fr ? '/fr/society#request' : '/society#request', request.url).toString());
}
