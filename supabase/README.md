# Supabase setup (events)

The site works without this — it falls back to `assets/data/events.json`. Do this when you want
events to update live without a redeploy.

1. Create a project at [supabase.com](https://supabase.com) (free tier is plenty).
2. **SQL Editor** → paste `schema.sql` → Run.
3. **Project Settings → API**, then:
   - copy **Project URL** and the **anon/public key** into `js/config.js`
   - copy the **service_role key** into the MCP server's environment (see `../mcp/README.md`)

```js
// js/config.js
export const SUPABASE_URL      = 'https://YOURPROJECT.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGci...';   // anon key — safe to ship
```

## Security

| Key | Where it goes | Why |
|-----|---------------|-----|
| **anon** | `js/config.js` (public) | Read-only, and RLS limits it to `published = true`. |
| **service_role** | MCP server env only — **never committed, never in the browser** | Full write access. Anyone holding it can edit your events. |

If a service-role key is ever pasted into a public file, rotate it in Project Settings → API.

## Adding events

Three ways, all writing to the same table:
1. **Talk to Claude** — the MCP server in `../mcp` (fastest).
2. **Supabase Table Editor** — click *Insert row*.
3. **`assets/data/events.json`** — the fallback file, used when no keys are set.
