# in-both-hands

Source for **The Lit Room** (thelitroom.com) — the writing of James Cupps:
the novel in progress *In Both Hands* (subtle urban fantasy; voice
counterpoint, working as weather, bar accumulation), plus short stories and
memoirs. A static site (hand-written HTML/CSS/JS) with a client-only Supabase
comments layer.

## Deployment

The **canonical Vercel project is `ibh`** — it owns the production domains
(`thelitroom.com`, `www.thelitroom.com`, `ibh.thelitroom.com`) and
auto-deploys the `main` branch of this repo. That is the single source of
truth for what's live: publish by committing to `main` and letting `ibh`
build.

> Do not connect a second Vercel project to this repo. A duplicate project
> (`in-both-hands`) was previously wired to the same repo, failed every build,
> and was removed — keep `ibh` as the only deploy target so pushes build once,
> on the working path.

Avoid `vercel --prod` deploys from a local working copy: a "dirty" CLI deploy
pins production to whatever is on disk (not a committed state) and is
overwritten — and lost — on the next git build. Always publish through `main`.
