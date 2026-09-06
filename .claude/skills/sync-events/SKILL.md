---
name: sync-events
description: Refresh the Speakeasy events board from the owner's Google Drive booking tracker. Use when asked to update the events, add the month's performers, sync the line-up, or when an Eventbrite screenshot is pasted.
---

# Refresh the events board

## The source of truth

Google Drive folder `1Y8iN8-lc29C-FgUzlM7pKqpGtozKXDOW` →
**Speakeasy_Ottawa_Live_Music_Events_Calendar.xlsx**
(file id `1EU0nb-bMFKOroicQSaEYIYCcDXTerJJw`).

Read it with `mcp__Google_Drive__read_file_content`. List the folder first with
`search_files` and `parentId = '1Y8iN8-lc29C-FgUzlM7pKqpGtozKXDOW'`, in case the
owner has added a newer workbook.

The **Events Calendar** sheet has one row per event. The columns that matter:

| Column | Use |
| --- | --- |
| Booking Status | Publish `Confirmed` only. Holds, tentatives and inquiries are not public. |
| Event Date, Start Time, End Time | `starts_at` and `duration_min`. |
| Artist / Vendor | `title`. |
| Production / Setup | `kicker` — this is where the instrument lives. |
| Ticket / Event Link | Present means `ticketed: true` and `ticket_url`. |
| Notes | Ticket prices and door times. Read, do not paraphrase loosely. |

This workbook **replaces** the older "Speakeasy Music/Event Schedule" sheet
(`19k3ODwFoV3hIuhB-8TyMbwYrpdws9lRkTpOjjxAipFI`). That one ran behind: it was
missing every September Thursday and was wrong on the 6th and the 12th. Do not
fall back to it without asking.

## Rules that have already been broken once

- **Write no prose the tracker does not state.** `blurb` stays empty for the
  no-cover nights. Descriptions invented to fill the field ("a voice, the low
  light and the room leaning in") shipped once and had to be pulled.
- **Start time is 7 PM** unless the tracker gives one (owner, 6 Sep 2026:
  "no covers aside from martin start time is 7pm").
- **A month with no confirmed rows is not an error.** The page shows
  "coming soon" for any month inside its three-month window. Do not pad it.

## Ticketed shows

Eventbrite cannot be reached from this environment: the egress proxy answers
403 to CONNECT for `eventbrite.ca` and `eventbriteapi.com`. The tracker's
Ticket / Event Link column is the normal route. If the owner pastes a
screenshot of the organiser page for a show the tracker does not carry yet,
take title, date, start time and price from the tile, and say in your reply
that it is not in the tracker.

Note that Eventbrite tiles show the **fee-inclusive** price ("From $43.63")
while the tracker records the **face** price (GA $35). Prefer the tracker's
figure and state the options in the blurb.

## The record shape

```json
{ "id": "claudia-caird-2026-09-18", "title": "Claudia Caird", "kicker": "Vocals",
  "category": "music", "blurb": "", "starts_at": "2026-09-18T19:00:00-04:00",
  "recurrence": "none", "duration_min": 60, "price_text": "No cover",
  "image_url": "", "ticket_url": "", "ticketed": false, "published": true }
```

- `id` is `slug(title)-YYYY-MM-DD`, so re-running is idempotent.
- Offsets: `-04:00` on EDT, `-05:00` from the first Sunday in November.
- Event artwork lives in `assets/img/events/`, named `<id>.jpg`, 1600px wide.

## Timezone

`js/events.js` renders every date part through `America/Toronto`, so a 7 PM set
reads 7 PM from any country. Never reintroduce `getHours()`, `getDate()` or
`getDay()` on an event date; use the `vp()` helper.

## After writing

1. `python3 -c "import json;json.load(open('assets/data/events.json'))"`
2. Serve and load `events.html`; check the calendar dots, the night count and
   the listed nights agree, and that the ticketed shows carry their artwork.
3. Confirm no console errors and no horizontal overflow at 1440 and 390.
