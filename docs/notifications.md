# Reader signups & new-chapter notifications

Two halves, both live:

1. **Registration** — a "Hear when something new goes up" band on the landing
   page, the novel page, and the short-stories page. A reader leaves an email;
   it lands in the Supabase `notify_subscribers` table. Client-only — no
   backend of ours, no form service.
2. **Sending** — a GitHub Action that emails every subscriber when you run it.
   It is intentionally **not** automatic: nothing is ever sent until *you*
   open the Actions tab and run it.

## How registration works

- The signup band is in `index.html`, `in-both-hands.html`, and
  `short-stories.html` (`assets/notify.js` + `assets/notify.css`). It stays
  hidden unless `assets/comments-config.js` has the Supabase URL + key.
- Submitting calls the `notify_signup` Postgres function (see
  `supabase/schema.sql`). The table itself is unreachable from the browser —
  no policy allows reads, so the list can never be harvested. Duplicate
  signups are a silent no-op.
- Every row gets a secret `unsubscribe_token`. The notification email includes
  a personal link to `unsubscribe.html?token=…`, which calls
  `notify_unsubscribe` and deletes the row. No sign-in needed either way.

## How sending works

- Workflow: `.github/workflows/notify-readers.yml`
- Trigger: **manual only** (`workflow_dispatch`). It cannot fire on a push,
  a deploy, or a schedule — so there are no surprise emails.
- Recipients are fetched live from `notify_subscribers` via the `notify_list`
  function, authenticated with `NOTIFY_LIST_SECRET` — a dedicated credential
  that can read the subscriber list and do **nothing else** (the service-role
  key never leaves Supabase). The list is merged with the optional legacy
  `NOTIFY_RECIPIENTS` secret, then de-duplicated. Each reader gets an
  **individual** email via Gmail SMTP with their own unsubscribe link — no
  shared BCC, no exposed addresses.
- A **dry run** checkbox on the run form counts recipients without sending.

## One-time setup

1. **Create a Gmail App Password** (not your normal password):
   Google Account → Security → 2-Step Verification → App passwords → generate
   one for "Mail". Copy the 16-character value.

2. **Add repository secrets** (GitHub repo → Settings → Secrets and
   variables → Actions → New repository secret):

   | Secret | Value | Status |
   | --- | --- | --- |
   | `NOTIFY_LIST_SECRET` | list-read credential (matches `private.notify_api` in Supabase) | ✅ set 2026-08-02 |
   | `GMAIL_USERNAME` | the Gmail address you send from (e.g. `jbcupps@gmail.com`) | ⬜ needed before a real send |
   | `GMAIL_APP_PASSWORD` | the 16-character app password from step 1 | ⬜ needed before a real send |
   | `NOTIFY_RECIPIENTS` | *(optional)* comma-separated extra emails added by hand | ⬜ optional |

   Dry runs only need `NOTIFY_LIST_SECRET`. Real sends also need the two
   Gmail secrets. To rotate the list secret: insert a new value into
   `private.notify_api` (see supabase/schema.sql) and update the GitHub
   secret to match.

## Sending an announcement

1. GitHub repo → **Actions** tab → **Notify readers of a new chapter**.
2. Click **Run workflow**.
3. Fill in the title (and optionally a link). Tick **dry run** first if you
   just want the recipient count.
4. **Run workflow**. The log shows masked addresses and a sent/failed tally.

## Peeking at the list

The list never leaves Supabase. To see it: dashboard → Table Editor →
`notify_subscribers` (or the MCP/SQL editor: `select email, created_at from
notify_subscribers order by created_at`).

## Notes / honest limits

- Gmail SMTP allows ~500 sends/day on consumer accounts, and the workflow
  waits 1s between sends. Fine for hundreds of readers; past that, a real
  mailing-list service (Buttondown, Mailchimp) is the better tool.
- Signup is single opt-in (no confirmation email) — someone could subscribe
  an address that isn't theirs. Every email carries that address's own
  unsubscribe link, which also undoes a prank signup. At this site's scale
  that trade is fine; double opt-in would need a sending backend.
- The `notify_signup` endpoint is public by design (that's what makes the
  form work without a backend). It validates format, lower-cases, de-dupes,
  and hard-caps the table at 5,000 rows as a stuffing valve.
