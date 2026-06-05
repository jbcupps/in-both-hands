/* In Both Hands — lightweight comments.
 * Client-only. Supabase Auth (social sign-in) + a single `comments` table with
 * Row-Level Security. No backend, no build step. Stays invisible until
 * assets/comments-config.js is filled in.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cfg = window.IBH_COMMENTS || {};

if (!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) {
  // Not configured yet — do nothing, show nothing.
  console.info("[comments] Supabase not configured; comment sections disabled.");
} else {
  init();
}

function init() {
  const supabase = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  const PROVIDER_LABELS = { google: "Google", apple: "Apple", facebook: "Facebook", azure: "Microsoft" };
  const providers = (cfg.PROVIDERS && cfg.PROVIDERS.length) ? cfg.PROVIDERS : ["google"];
  let session = null;

  // --- Inject one comment section into each chapter body -------------------
  const sections = [];
  document.querySelectorAll('.chapter[id^="chapter-"]').forEach((chapter) => {
    const inner = chapter.querySelector(".chapter__body-inner");
    if (!inner) return;
    const section = document.createElement("section");
    section.className = "comments";
    section.dataset.slug = chapter.id;
    section.innerHTML =
      '<h4 class="comments__title">Margins</h4>' +
      '<div class="comments__auth"></div>' +
      '<ol class="comments__list" aria-live="polite"></ol>';
    const end = inner.querySelector(".chapter__end");
    if (end) inner.insertBefore(section, end);
    else inner.appendChild(section);
    sections.push(section);
  });
  if (!sections.length) return;

  // --- Helpers -------------------------------------------------------------
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const fmt = (iso) => {
    try {
      return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    } catch (_) { return ""; }
  };

  const isAdmin = () =>
    !!(session?.user?.email && cfg.ADMIN_EMAIL &&
       session.user.email.toLowerCase() === cfg.ADMIN_EMAIL.toLowerCase());

  const displayName = (user) => {
    const m = (user && user.user_metadata) || {};
    return m.full_name || m.name || m.user_name ||
      (user && user.email ? user.email.split("@")[0] : "Reader");
  };

  // --- Rendering -----------------------------------------------------------
  function authMarkup() {
    if (session) {
      return (
        '<div class="comments__me">Signed in as <strong>' + esc(displayName(session.user)) + "</strong>" +
        ' <button class="comments__signout" type="button">Sign out</button></div>' +
        '<form class="comments__form">' +
        '<textarea class="comments__input" rows="3" maxlength="4000" required ' +
        'placeholder="Leave a note in the margin…"></textarea>' +
        '<button class="comments__submit" type="submit">Post note</button>' +
        "</form>"
      );
    }
    const buttons = providers.map((p) =>
      '<button class="comments__provider" type="button" data-provider="' + p + '">Continue with ' +
      esc(PROVIDER_LABELS[p] || p) + "</button>").join("");
    return (
      '<p class="comments__prompt">Sign in to leave a note. Only your name and your note are public — nothing else is shared.</p>' +
      '<div class="comments__providers">' + buttons + "</div>"
    );
  }

  function commentMarkup(c, replies) {
    const mine = session && session.user.id === c.user_id;
    const admin = isAdmin();
    const controls =
      (admin || mine)
        ? '<span class="comment__controls">' +
          (admin
            ? '<button class="comment__hide" data-id="' + c.id + '" data-hidden="' + c.hidden + '">' +
              (c.hidden ? "Unhide" : "Hide") + "</button>"
            : "") +
          '<button class="comment__delete" data-id="' + c.id + '">Delete</button>' +
          "</span>"
        : "";
    const replyBtn = (session && !c.parent_id)
      ? '<button class="comment__reply" data-id="' + c.id + '">Reply</button>' : "";
    const repliesHtml = (replies && replies.length)
      ? '<ol class="comment__replies">' + replies.map((r) => commentMarkup(r, [])).join("") + "</ol>" : "";
    return (
      '<li class="comment' + (c.hidden ? " comment--hidden" : "") + '" data-id="' + c.id + '">' +
      '<div class="comment__head"><span class="comment__author">' + esc(c.author_name) + "</span>" +
      '<time class="comment__time">' + fmt(c.created_at) + "</time></div>" +
      '<div class="comment__body">' + esc(c.body) + "</div>" +
      '<div class="comment__actions">' + replyBtn + controls + "</div>" +
      repliesHtml + "</li>"
    );
  }

  function renderAuthAll() {
    sections.forEach((s) => { s.querySelector(".comments__auth").innerHTML = authMarkup(); });
  }

  async function load(section) {
    const list = section.querySelector(".comments__list");
    const { data, error } = await supabase
      .from("comments").select("*")
      .eq("chapter_slug", section.dataset.slug)
      .order("created_at", { ascending: true });
    if (error) {
      list.innerHTML = '<li class="comments__note">Comments couldn’t load right now.</li>';
      return;
    }
    const tops = data.filter((r) => !r.parent_id);
    const byParent = {};
    data.filter((r) => r.parent_id).forEach((r) => { (byParent[r.parent_id] ||= []).push(r); });
    list.innerHTML = tops.length
      ? tops.map((t) => commentMarkup(t, byParent[t.id] || [])).join("")
      : '<li class="comments__note">No notes yet. Be the first.</li>';
  }

  const loadAll = () => sections.forEach(load);

  // --- Events --------------------------------------------------------------
  document.addEventListener("click", async (e) => {
    const provider = e.target.closest(".comments__provider");
    if (provider) {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider.dataset.provider,
        options: { redirectTo: window.location.href.split("#")[0] }
      });
      if (error) alert("Sign-in unavailable for this provider yet: " + error.message);
      return;
    }
    if (e.target.closest(".comments__signout")) { await supabase.auth.signOut(); return; }

    const del = e.target.closest(".comment__delete");
    if (del) {
      if (confirm("Delete this note?")) {
        const { error } = await supabase.from("comments").delete().eq("id", del.dataset.id);
        if (error) alert("Could not delete: " + error.message);
      }
      return;
    }
    const hide = e.target.closest(".comment__hide");
    if (hide) {
      const next = hide.dataset.hidden !== "true";
      const { error } = await supabase.from("comments").update({ hidden: next }).eq("id", hide.dataset.id);
      if (error) alert("Could not update: " + error.message);
      return;
    }
    const reply = e.target.closest(".comment__reply");
    if (reply) { toggleReplyForm(reply); return; }
  });

  document.addEventListener("submit", async (e) => {
    const form = e.target.closest(".comments__form");
    if (!form) return;
    e.preventDefault();
    if (!session) return;
    const section = form.closest(".comments");
    const ta = form.querySelector(".comments__input");
    const body = ta.value.trim();
    if (!body) return;
    const submit = form.querySelector(".comments__submit");
    if (submit) submit.disabled = true;
    const { error } = await supabase.from("comments").insert({
      chapter_slug: section.dataset.slug,
      parent_id: form.dataset.parentId || null,
      user_id: session.user.id,
      author_name: displayName(session.user),
      body
    });
    if (submit) submit.disabled = false;
    if (error) { alert("Could not post: " + error.message); return; }
    ta.value = "";
    if (form.classList.contains("comments__reply-form")) form.remove();
    // Realtime will refresh, but refresh immediately too for snappiness.
    load(section);
  });

  function toggleReplyForm(btn) {
    const li = btn.closest(".comment");
    const existing = li.querySelector(":scope > .comments__reply-form");
    if (existing) { existing.remove(); return; }
    const form = document.createElement("form");
    form.className = "comments__form comments__reply-form";
    form.dataset.parentId = btn.dataset.id;
    form.innerHTML =
      '<textarea class="comments__input" rows="2" maxlength="4000" required placeholder="Reply…"></textarea>' +
      '<button class="comments__submit" type="submit">Reply</button>';
    const replies = li.querySelector(":scope > .comment__replies");
    li.insertBefore(form, replies || null);
    form.querySelector("textarea").focus();
  }

  // --- Auth state + realtime ----------------------------------------------
  supabase.auth.getSession().then(({ data }) => {
    session = data.session;
    renderAuthAll();
    loadAll();
  });

  supabase.auth.onAuthStateChange((_event, newSession) => {
    session = newSession;
    renderAuthAll();
    loadAll();
  });

  supabase
    .channel("comments-stream")
    .on("postgres_changes", { event: "*", schema: "public", table: "comments" }, loadAll)
    .subscribe();
}
