---
name: sync-events
description: Refresh the Speakeasy events board from the Google Sheet line-up and from an Eventbrite screenshot. Use when asked to update the events, add the month's performers, sync the line-up, or when an Eventbrite screenshot is pasted.
---

# Refresh the events board

Two sources feed `assets/data/events.json`. Keep both in one pass.

## 1. Live music, from the Google Sheet

**Sheet:** "Speakeasy Music/Event Schedule", Drive id
`19k3ODwFoV3hIuhB-8TyMbwYrpdws9lRkTpOjjxAipFI` (owner andrewculbert04@gmail.com,
shared with the account). Read it with `mcp__Google_Drive__read_file_content`.

The sheet has one tab per month. Each tab repeats the same shape:

- The authoritative data is the **`Date | Event`** column pair on the left, one
  row per night, e.g. `Oct 2 | Claudia Caird - Singer`. Use this.
- The calendar grid to its right is a **duplicate view** of the same rows. Do
  not read both or every night is counted twice.
- Rows carry no year. Months before the current one belong to the next year.
- Tabs overlap at the edges (a tab often repeats the last week of the previous
  month), so de-duplicate on date plus title.

**Times** come from the sheet's own day-of-week header, not from guesswork:

| Days | Header | Use |
| --- | --- | --- |
| Sun, Tue, Wed, Thu | Live Music 7-8pm | starts 19:00, 60 min |
| Fri, Sat | Live Music 7-8 & 9-10 | starts 19:00, 180 min, note the second set |

A row may override this inline: `Raphaelle Cello Event 6pm`,
`Darya DJ event 11pm`, `Peter Woods and Kyle Jordan 4-7 pm`. Inline wins.

**Mapping a row**

- `Claudia Caird - Singer` splits into title `Claudia Caird`, kicker `Singer`.
- `category` is `music`; `ticketed` is `false`; `price_text` is `No cover`.
  Live music runs during dinner service and needs no ticket.
- A row naming an event rather than a performer (`Speed Dating`,
  `Nat King Cole Tribute Event`, `Gee Gethiga Comedy Show`, `Candlelit Concert`)
  is **not** live music: `ticketed: true`, and `category` `comedy` or `special`.
- Skip private bookings (`Bachlorette Party Upstairs`, `Upstairs B-Day Dinner`)
  and blank rows. They are not public events.
- Drop anything already past.

## 2. Ticketed shows, from an Eventbrite screenshot

Eventbrite cannot be reached from this environment: the egress proxy answers
403 to CONNECT for `eventbrite.ca` and `eventbriteapi.com`. So the owner pastes
a screenshot of the organiser page instead. Read each tile and take:

title · date · start time · price · the event image if identifiable.

Set `ticketed: true`, `category` `comedy` or `special`, and leave `ticket_url`
empty so it falls back to `EVENTBRITE_URL` in `js/config.js`. If a tile is
ambiguous, ask rather than guess: a wrong date on a ticketed show is worse than
a missing one.

## Writing the file

`assets/data/events.json` is an array of records shaped like:

```json
{ "id": "claudia-caird-2026-10-02", "title": "Claudia Caird", "kicker": "Singer",
  "category": "music", "blurb": "...", "starts_at": "2026-10-02T19:00:00-04:00",
  "recurrence": "none", "duration_min": 180, "price_text": "No cover",
  "image_url": "", "ticket_url": "", "ticketed": false, "published": true }
```

- `id` is `slug(title)-YYYY-MM-DD`, so re-running is idempotent.
- Dated nights use `recurrence: "none"` with a real `starts_at`. Only use
  `weekly` for a genuinely standing night with no end.
- Offsets: `-04:00` during EDT, `-05:00` from early November.

## After writing

1. `python3 -c "import json;json.load(open('assets/data/events.json'))"`
2. Serve and load `events.html`; check the calendar month, the dot count and
   the listed nights agree.
3. Confirm no console errors and no horizontal overflow at 1440 and 390.
