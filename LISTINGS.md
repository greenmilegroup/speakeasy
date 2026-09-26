# What the listings should say

The venue's details live in five places: this site, Google Business Profile,
OpenTable, Eventbrite, and the social accounts. Only the site is under version
control, where a wrong hour shows up in a diff and a build guard catches it.
The other four are forms somebody typed into once, and nothing tells you when
one of them goes stale.

Two have already gone wrong this way — Google carried a happy hour starting at
**4 a.m.**, and the private events page named the **Shaw Centre** for nearly two
years after it was renamed. Both were found by eye, months late.

This file is the thing to check them against. Work down it when anything
changes, and when nothing has, once a quarter.

## The details

| | |
| --- | --- |
| Name | **Speakeasy Ottawa** |
| Address | 55 York Street, Ottawa, ON K1N 9B7 |
| Phone | 613-241-6221 |
| Email | info@speakeasyottawa.com |
| Site | https://speakeasyottawa.com |
| Price range | $$ |
| Cuisine | Tapas · International · Cocktail Bar |
| Instagram | https://www.instagram.com/speakeasy_ottawa/ |
| Facebook | https://www.facebook.com/speakeasyottawa |

**Opening hours**

| | |
| --- | --- |
| Monday | **Closed** |
| Tuesday – Thursday | 4 PM – 11 PM |
| Friday – Saturday | 4 PM – 1 AM |
| Sunday | 4 PM – 11 PM |

**Happy hour** — 4 to 6 PM and 10 PM to close, every day we are open.

**Nearby landmarks**, if a description mentions them: **Rogers Centre Ottawa**
(renamed from the Shaw Centre in October 2024) and the Rideau Centre.

## Where these come from

Opening hours are written once, in **`js/hours.js`**. `tools/check-hours.mjs`
fails the build if any hand-written sentence on the site stops agreeing with
that schedule, which is why the site cannot drift from itself.

**It cannot guard this file.** If the schedule ever changes, change
`js/hours.js`, then change the table above by hand, then work down the list
below. Nothing will remind you.

Everything else above is in the page markup and the JSON-LD the build emits;
`dist/index.html` carries the `Restaurant` schema with the address, phone,
hours and rating in one place.

## The listings to check

**Google Business Profile** — business.google.com, or search the venue's own
name while signed in. The one that matters most: it is what people see before
they ever reach the site.

- Name, address, phone
- Opening hours, and **Closed on Mondays**
- More hours → Happy hour (this is where the 4 a.m. was)
- The description, for the old venue name or the Shaw Centre
- Photos and menu link

**OpenTable** — https://www.opentable.com/r/speakeasy-tapas-lounge-ottawa

**Eventbrite** — https://www.eventbrite.ca/o/speakeasy-tapas-lounge-57744410063

**Instagram and Facebook** — bio link, hours if listed, the name itself.

## Known to be wrong

- **OpenTable and Eventbrite still carry the retired name**, *Speakeasy Tapas
  Lounge*, in their page titles and in their URLs. Both URLs above are the ones
  the site links to, so they cannot simply be abandoned: renaming on those
  platforms may change the address, and `_redirects`, `js/site.js` and
  `js/events.js` point at them. Change the site's links in the same pass.
- **Google's happy hour** read 4 a.m. instead of 4 p.m. Fix it in More hours,
  and check the main opening hours while there — a listing that sends people to
  a closed door costs more than a wrong happy hour.

## The one that flows the other way

The rating on the home page — **4.5 from 368 reviews** — is copied *from*
Google, not published to it. When it drifts far enough to look wrong, update it
in the markup; `tools/add-schema.mjs` reads it from the visible page and puts it
in the schema, so the two cannot disagree.
