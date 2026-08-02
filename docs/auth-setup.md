# Reader sign-in (Supabase Auth) — remaining dashboard setup

The comments sign-in (email magic link + Google) is live in code and the
database schema is applied. Two settings live only in the Supabase dashboard
and need a human with the account:

Project: `nfaxjuiafyvfxjgcmvlk` → https://supabase.com/dashboard/project/nfaxjuiafyvfxjgcmvlk

## 1. Site URL + redirect allow-list (makes magic links land on the site)

Authentication → URL Configuration:

- **Site URL**: `https://www.thelitroom.com`
- **Redirect URLs** — add:
  - `https://www.thelitroom.com/**`
  - `https://thelitroom.com/**`
  - `http://localhost:8123/**` (local testing)

Until this is set, magic-link emails may redirect readers to the default
localhost URL instead of the site. This is the one step that blocks
email sign-in from working end to end.

## 2. Google sign-in (optional — magic link works without it)

The "Continue with Google" button renders but Google is not yet enabled as a
provider (checked 2026-08-02: only `email` is active). Until then the button
shows "Sign-in unavailable for this provider yet." To enable:

1. Google Cloud console → create an OAuth 2.0 Client ID (Web application).
   - Authorized redirect URI: `https://nfaxjuiafyvfxjgcmvlk.supabase.co/auth/v1/callback`
2. Supabase → Authentication → Providers → Google → paste client ID + secret,
   enable, save.

## Already done (no action needed)

- `comments` table + RLS policies (readers post/delete their own; you can
  hide/delete anything as `jbcupps@gmail.com`).
- `notify_subscribers` table + signup/unsubscribe functions
  (see docs/notifications.md).
- `assets/comments-config.js` filled with the project URL + publishable key.
- Email magic-link provider: enabled by default, confirmed active.

## Note on auth emails

Magic-link emails ship via Supabase's built-in sender, which is fine to start
but rate-limited (a few per hour) and sends from a generic address. If sign-in
takes off, configure custom SMTP: Authentication → Emails → SMTP Settings
(the Gmail app password from docs/notifications.md works here too).
