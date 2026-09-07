/* =========================================================================
   The Speakeasy Society — the sign-up block.

   One block, rendered wherever a page carries <section id="society">. The
   markup is a plain string so the same function serves the browser (site.js
   builds it on load) and the build (tools/prerender-nav.mjs writes it into
   dist/ so it is in the HTML before any script runs).

   What it asks for: an email, a first name if they like, and — the part the
   raffle is really for — whether they would want a paid membership, with a
   line on what would make it worth it. Submissions go to /api/contact as
   form "society".
   ========================================================================= */

export const SOCIETY_SEGMENT = '9adafa40-6d15-4b03-bd25-70fca8c56f6e';  // Resend segment "General"

export function societyHtml() {
  return `
  <div class="society__inner">
    <div class="society__pitch">
      <p class="kicker">The Speakeasy Society</p>
      <h2 class="h-display">Join the <em>Society.</em></h2>
      <p class="society__lead">The people on this list hear first, and sometimes get in free.</p>
      <ul class="society__perks">
        <li><span class="society__ico" aria-hidden="true">✦</span><div><strong>Monthly raffle</strong><p>Free entry for every member, every month.</p></div></li>
        <li><span class="society__ico" aria-hidden="true">✦</span><div><strong>Free tickets to shows</strong><p>For the ticketed nights on the stage.</p></div></li>
        <li><span class="society__ico" aria-hidden="true">✦</span><div><strong>Prizes</strong><p>Announced to the list. You have to be on it.</p></div></li>
      </ul>
    </div>
    <form class="form society__form" id="societyForm" novalidate>
      <div class="hp" aria-hidden="true"><label>Company<input name="company" type="text" tabindex="-1" autocomplete="off"/></label></div>
      <div class="field-row">
        <div class="field"><label for="sf-name">First name</label><input id="sf-name" name="name" type="text" autocomplete="given-name" placeholder="Optional"/></div>
        <div class="field"><label for="sf-email">Email</label><input id="sf-email" name="email" type="email" autocomplete="email" placeholder="you@email.com" required/></div>
      </div>
      <label class="society__check">
        <input id="sf-member" name="member" type="checkbox"/>
        <span class="society__box" aria-hidden="true"></span>
        <span>We are building a paid Society membership for the regulars. <strong>I would want to hear about it.</strong></span>
      </label>
      <div class="field society__more" id="sf-more" hidden>
        <label for="sf-why">What would make it worth joining?</label>
        <textarea id="sf-why" name="feedback" rows="3" placeholder="Tell us what you would want from it."></textarea>
      </div>
      <button class="btn btn--gold" type="submit">Join the Society</button>
      <p class="society__consent">You will get email from Speakeasy Ottawa: what is on, the raffle, the occasional password. Unsubscribe any time. <a class="link-underline" href="society-rules.html">Raffle rules</a></p>
      <p class="form__note" id="sfNote" role="status"></p>
    </form>
  </div>`;
}
