# Reader sign-in (Supabase Auth) — configured and verified

All auth setup is **complete** (verified from outside on 2026-08-02):

Project: `nfaxjuiafyvfxjgcmvlk` → https://supabase.com/dashboard/project/nfaxjuiafyvfxjgcmvlk

## Current state

- **Email magic link**: enabled; Site URL is `https://www.thelitroom.com`,
  allow-list covers `https://www.thelitroom.com/**`, `https://thelitroom.com/**`
  and `http://localhost:8123/**` (local testing). Probed: error redirects land
  on www, apex and localhost redirects are honored, and a hostile
  `redirect_to` is rejected (falls back to Site URL).
- **Google sign-in**: enabled. OAuth client `litroom-supabase` lives in the
  dedicated GCP project **`litroom-auth`** (number 250980731534, account
  jbcupps@gmail.com) which holds the client and nothing else — no APIs, no
  billing. Probed: `/auth/v1/authorize?provider=google` 302s to Google with
  the right client ID, the Supabase callback
  (`https://nfaxjuiafyvfxjgcmvlk.supabase.co/auth/v1/callback`) and basic
  `email profile` scopes only.
- `comments` table + RLS policies (readers post/delete their own; you can
  hide/delete anything as `jbcupps@gmail.com`).
- `notify_subscribers` table + signup/unsubscribe/list functions
  (see docs/notifications.md).
- `assets/comments-config.js` filled with the project URL + publishable key.

## If Google sign-in ever fails for readers

Check the app's publish status — Google Auth Platform → Audience for
project `litroom-auth`
(https://console.cloud.google.com/auth/audience?project=litroom-auth).
If it still says **Testing**, only listed test users can sign in; click
**Publish app**. With only basic identity scopes there is no Google
verification hurdle.

To rotate the client secret: Google console → Clients → `litroom-supabase`
→ new secret, then paste into Supabase → Authentication → Providers →
Google. The secret lives only in those two consoles.

## Note on auth emails

Magic-link emails ship via Supabase's built-in sender, which is fine to start
but rate-limited (a few per hour) and sends from a generic address. If sign-in
takes off, configure custom SMTP: Authentication → Emails → SMTP Settings
(the Gmail app password from docs/notifications.md works here too).
