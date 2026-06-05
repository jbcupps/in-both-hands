# New-chapter notifications

A small, manual GitHub Action that emails your readers when a chapter goes up.
It is intentionally **not** automatic — nothing is ever sent until *you* run it.

## How it works

- Workflow: `.github/workflows/notify-readers.yml`
- Trigger: **manual only** (`workflow_dispatch`). It cannot fire on a push,
  a deploy, or a schedule — so there are no surprise emails.
- Sends one email via Gmail SMTP. You are the visible recipient; the reader
  list is **BCC'd**, so readers never see each other's addresses.

## One-time setup

1. **Create a Gmail App Password** (not your normal password):
   Google Account → Security → 2-Step Verification → App passwords → generate one
   for "Mail". Copy the 16-character value.

2. **Add three repository secrets** (GitHub repo → Settings → Secrets and
   variables → Actions → New repository secret):

   | Secret | Value |
   | --- | --- |
   | `GMAIL_USERNAME` | the Gmail address you send from (e.g. `jbcupps@gmail.com`) |
   | `GMAIL_APP_PASSWORD` | the 16-character app password from step 1 |
   | `NOTIFY_RECIPIENTS` | comma-separated reader emails, e.g. `a@x.com,b@y.com` |

## Sending an announcement

1. GitHub repo → **Actions** tab → **Notify readers of a new chapter**.
2. Click **Run workflow**.
3. Fill in the chapter title (and optionally a link), then **Run workflow**.
4. The digest goes out to everyone in `NOTIFY_RECIPIENTS`.

## Notes / honest limits

- The reader list lives in a single secret. For a handful of friends that's
  fine; if the list grows past a couple dozen, a real mailing-list service
  (Buttondown, Mailchimp) is the better tool.
- Gmail SMTP has daily send limits (~500/day on consumer accounts). Far beyond
  this site's needs, but worth knowing.
- A self-serve "notify me" signup form for readers would need a tiny backend or
  a form service — that's a separate piece, not built here.
