/* The Lit Room — site backend configuration (comments + notify signups).
 *
 * These two values are PUBLIC by design and safe to commit:
 *   - the project URL
 *   - the publishable (public) key — data is protected by Row-Level Security.
 *
 * NEVER put the service_role key here. It bypasses all security and this file
 * ships to every reader's browser.
 *
 * If these are ever blanked out, the comment sections and the notify signup
 * stay completely invisible on the site — nothing breaks.
 */
window.IBH_COMMENTS = {
  SUPABASE_URL: "https://nfaxjuiafyvfxjgcmvlk.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_SKYSU_1FnVl3So3VncPiNg_C2Mw-klb",
  ADMIN_EMAIL: "jbcupps@gmail.com",
  // OAuth providers shown as buttons. Email magic-link is always offered separately
  // and is not listed here. Only list providers actually enabled in
  // Supabase → Authentication → Providers. ("azure" would be Microsoft.)
  PROVIDERS: ["google"]
};
