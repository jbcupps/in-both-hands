/* The Lit Room — auto-refresh when new content is published.
 *
 * Every file is served with `Cache-Control: max-age=0, must-revalidate` and an
 * ETag, so a normal navigation or refresh always revalidates with the server
 * and pulls the newest build. The one gap that leaves is a tab the reader
 * leaves open (or one restored from the back/forward cache): it can keep
 * showing an old version indefinitely, because nothing triggers a revalidation.
 *
 * This script closes that gap. It records the version (ETag) of the page when
 * it loads, then — whenever the tab regains focus or is restored from cache —
 * asks the server whether the page has changed. If it has, a new version was
 * published, so it reloads once to pick it up. It deliberately does NOT reload
 * while the tab is actively in the foreground, so it never yanks the page out
 * from under someone mid-read.
 */
(function () {
  if (!window.fetch) return;

  // Ignore any cache-busting query string; we want the document's own version.
  var path = location.pathname;
  var baseline = null;   // the version we are currently showing
  var busy = false;

  function serverVersion() {
    return fetch(path, { method: "HEAD", cache: "no-store" })
      .then(function (r) {
        if (!r.ok) return null;
        return r.headers.get("etag") || r.headers.get("last-modified");
      })
      .catch(function () { return null; });
  }

  // Belt-and-suspenders against reload loops, in case a version ever flaps.
  function mayReload() {
    try {
      var now = Date.now();
      var last = +sessionStorage.getItem("litRoomReloadAt") || 0;
      if (now - last < 30000) return false;
      sessionStorage.setItem("litRoomReloadAt", String(now));
    } catch (e) { /* sessionStorage unavailable — allow the reload */ }
    return true;
  }

  function check() {
    if (busy) return;
    busy = true;
    serverVersion().then(function (v) {
      busy = false;
      if (!v) return;
      if (baseline === null) { baseline = v; return; }
      if (v !== baseline && mayReload()) {
        baseline = v;
        location.reload();
      }
    });
  }

  // Establish the baseline as soon as we can.
  serverVersion().then(function (v) { if (baseline === null) baseline = v; });

  // The two non-disruptive moments to refresh: returning to the tab, and
  // arriving via the back/forward (b)cache.
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") check();
  });
  window.addEventListener("pageshow", function (e) {
    if (e.persisted) check();
  });
})();
