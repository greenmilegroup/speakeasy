# Talk to Claude to run your events

An MCP server that lets Claude add, edit, hide and delete events on the Speakeasy site.
You just say what you want in plain English.

> **"Add a jazz night this Friday at 8, no cover."**
> **"Hide the comedy night for now."**
> **"What's on next week?"**

## Install

```bash
cd mcp
npm install
```

## Connect it to Claude

**Claude Desktop** — Settings → Developer → Edit Config, then add:

```json
{
  "mcpServers": {
    "speakeasy-events": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/speakeasy/mcp/server.js"],
      "env": {
        "SUPABASE_URL": "https://YOURPROJECT.supabase.co",
        "SUPABASE_SERVICE_KEY": "your-service-role-key"
      }
    }
  }
}
```

**Claude Code** — the same block in `.mcp.json` at the repo root.

Restart Claude, and the tools appear. Use the full absolute path to `server.js`.

## Before you have Supabase

Leave the `env` block out entirely. The server then reads and writes
`assets/data/events.json` instead, so you can use it today — you just commit and push
afterwards to publish. Add the Supabase keys later and it switches over with no other changes.

## The service-role key

It has full write access to your database. Keep it **only** in this config file — never in
`js/config.js`, never in anything committed to GitHub. If it leaks, rotate it in
Supabase → Project Settings → API.

## Tools

| Tool | What it does |
|------|--------------|
| `list_events` | Everything on the books (add `include_hidden` to see hidden ones) |
| `create_event` | Add one. One-off: `when: "Friday 8pm"`. Weekly: `recurrence: "weekly", weekday: 5, time: "20:00"` |
| `update_event` | Change any field — find it by id or by part of the title |
| `delete_event` | Remove permanently |
| `set_published` | Hide/show without deleting |

Dates understand `"2026-08-23 20:00"`, `"Friday 8pm"` and `"next Saturday 9pm"`.
Weekday numbers are `0 = Sunday … 6 = Saturday`.
