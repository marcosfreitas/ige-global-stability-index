# Overview Page(s) Analysis — Social Media API

Using the interface-design skill (intent-first, product domain, information hierarchy) and project goals + current feature structure.

---

## Two “overview” surfaces

| Surface | Route | Audience | Purpose |
|--------|--------|----------|---------|
| **Root home** | `/` (`src/app/page.tsx`) | Anyone hitting the app (unauthenticated or not) | Entry: what this is, where to go next |
| **Dashboard overview** | `/dashboard` | Authenticated users (developers, indie hackers, automation operators) | Assess health at a glance; quiet when healthy |

---

## Root home page (`/`)

**Current state:** Icon + “Social Media API” + “Multi-platform video posting” + two links (API Reference, Open Dashboard). No explanation of who it’s for, what they get, or what to do first.

**Intent (from context + system.md):**  
Who: Developers, indie hackers, AI automation operators.  
What they must do: Get to the dashboard to connect accounts and create API keys, or hit the API with a key.  
Feel: Maintenance control panel; precision over warmth; no marketing fluff.

**Gaps:**

1. **No one-line value prop** — “Multi-platform video posting” is feature-level; it doesn’t say “post to 7 platforms in one API call” or “automate posting from your pipeline.”
2. **No audience cue** — New visitors don’t see that this is for developers/automation (API keys, OAuth, pipelines).
3. **Unclear first step** — “Open Dashboard” assumes they’re logged in. If not, they land on dashboard and get redirected to login; the root page doesn’t mention Sign in / Sign up, so the path isn’t obvious.
4. **No information hierarchy** — Both links have similar visual weight; the primary path (dashboard for setup, then API) isn’t emphasized.

**Conclusion:** The root page is **not adequate** for new or returning users. It doesn’t answer “what is this?”, “who is it for?”, or “what do I do first?” in a way that matches project goals and current features (Connect, API Keys, POST /post with task_id, etc.).

**Recommendation:** Keep it minimal (no marketing landing) but add: (1) one clear value sentence, (2) a short “for developers / automation” line, (3) primary CTA = Dashboard (or Sign in if we want to make auth explicit), (4) secondary = API Reference. Optionally a “Sign in” link when unauthenticated so the path is obvious.

---

## Dashboard overview (`/dashboard`)

**Current state:** Platform connection matrix (7 platforms, status badges, Connect/Reconnect), API key summary (count + link to create), Quick Start card with `POST /api/v1/post` example.

**Intent (from DASHBOARD_PAGES.md + system.md):**  
Let the user assess health at a glance. If all connected and keys exist, the page should be quiet. Primary action when something is wrong: Reconnect or Create key.

**What works:**

- Platform matrix is the headline; scan all platforms quickly.
- API key summary + link to keys matches “maintain” verb.
- Quick Start points to the API and gives a concrete example.

**Gaps:**

1. **Quick Start snippet is outdated** — Shows `video_url`; the API uses `medias` (array of `{ url, type, caption }`) and `caption` at root. New users copying the snippet will get validation errors or wrong behavior.
2. **No mention of async flow** — API returns 202 with `task_id`; clients should poll `GET /api/v1/tasks/{id}`. The snippet doesn’t say that, so users may not know how to check if a post succeeded.
3. **Optional: execution mode** — No indication of inline vs queued (EXECUTION_MODE). For “maintain” focus this can stay hidden, but one line could avoid confusion (“Posts may complete immediately or be queued; poll the task ID for status.”).

**Conclusion:** The dashboard overview is **largely adequate** for “assess health + quiet when healthy,” but the **information presented in Quick Start is wrong (video_url) and incomplete (task_id / polling)**. Fixing the snippet and adding one line about task status brings it in line with current API and project goals.

---

## Summary

| Page | Adequate? | Main change |
|------|-----------|-------------|
| **Root `/`** | No | Add value prop, audience cue, clear primary path (Dashboard / Sign in), optional Sign in link. |
| **Dashboard `/dashboard`** | Partially | Use current API in Quick Start (`medias`, `caption`, `platforms`); add one line about 202 + `task_id` and polling. |

Both changes keep the existing feel (maintenance panel, precision, no marketing) and align information presentation with project goals and current feature structure (Connect, Keys, post + task polling, optional queue).
