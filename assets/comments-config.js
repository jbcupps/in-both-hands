/* In Both Hands — comments configuration.
 *
 * These two values are PUBLIC by design and safe to commit:
 *   - the project URL
 *   - the anon (public) key   — your data is protected by Row-Level Security.
 *
 * NEVER put the service_role key here. It bypasses all security and this file
 * ships to every reader's browser.
 *
 * Until SUPABASE_URL and SUPABASE_ANON_KEY are filled in, the comment sections
 * stay completely invisible on the site — nothing breaks.
 */
window.IBH_COMMENTS = {
  SUPABASE_URL: "",            // e.g. https://xxxxxxxx.supabase.co
  SUPABASE_ANON_KEY: "",       // the long key labelled "anon" / "public"
  ADMIN_EMAIL: "jbcupps@gmail.com",
  // OAuth providers shown as buttons. Email magic-link is always offered separately
  // and is not listed here. Only list providers actually enabled in
  // Supabase → Authentication → Providers. ("azure" would be Microsoft.)
  PROVIDERS: ["google"]
};
