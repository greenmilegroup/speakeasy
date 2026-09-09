/* =========================================================================
   The Speakeasy Society — the sign-up block.

   One block, rendered wherever a page carries <section id="society">. The
   markup is a plain string so the same function serves the browser (site.js
   builds it on load) and the build (tools/prerender-nav.mjs writes it into
   dist/ so it is in the HTML before any script runs).

   What it asks for: an email, a first name if they like, and — the part the
   block is really for — whether they would want a paid membership, with a
   line on what would make it worth it. Submissions go to /api/contact as
   form "society".
   ========================================================================= */

export const SOCIETY_SEGMENT = '9adafa40-6d15-4b03-bd25-70fca8c56f6e';  // Resend segment "General"

export function societyHtml() {
  return `
  <div class="society__inner">
    <div class="society__pitch">
      <p class="kicker">The Speakeasy Society</p>
      <h2 class="h-display">Your name <em>on the card.</em></h2>
      <p class="society__lead">A membership for the people who are already here. $50 a month.</p>
      <ul class="society__perks">
        <li><span class="society__ico" aria-hidden="true">✦</span><div><strong>Free admission to shows, you and a guest</strong><p>Every concert and comedy night on our stage.</p></div></li>
        <li><span class="society__ico" aria-hidden="true">✦</span><div><strong>Priority seating and 10% off your table</strong><p>Your name on the reservation, the better table held.</p></div></li>
        <li><span class="society__ico" aria-hidden="true">✦</span><div><strong>Invite-only nights</strong><p>The nights that are never announced. Members hear first; only members come.</p></div></li>
      </ul>
      <a class="btn btn--gold" href="society.html">Request your card</a>
    </div>
    <form class="form society__form" id="societyForm" novalidate>
      <div class="hp" aria-hidden="true"><label>Company<input name="company" type="text" tabindex="-1" autocomplete="off"/></label></div>
      <p class="kicker">Not ready for the card?</p>
      <h3 class="h-sub society__form-title">The Guest List</h3>
      <p class="form__hint">Hear what is on before anyone else. Free.</p>
      <div class="field-row">
        <div class="field"><label for="sf-name">First name</label><input id="sf-name" name="name" type="text" autocomplete="given-name" placeholder="Optional"/></div>
        <div class="field"><label for="sf-email">Email</label><input id="sf-email" name="email" type="email" autocomplete="email" placeholder="you@email.com" required/></div>
      </div>
      <button class="btn btn--ghost" type="submit">Join the Guest List</button>
      <p class="society__consent">You will get email from Speakeasy Ottawa: what is on, the invitations, the occasional password. Unsubscribe any time.</p>
      <p class="form__note" id="sfNote" role="status"></p>
    </form>
  </div>`;
}
