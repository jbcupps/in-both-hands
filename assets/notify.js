/* The Lit Room — "hear about new work" signups.
 * Client-only: one RPC into Supabase (public.notify_signup — see
 * supabase/schema.sql). The band stays hidden until assets/comments-config.js
 * is filled in, so an unconfigured site simply shows nothing.
 */
(function () {
  var cfg = window.IBH_COMMENTS || {};
  if (!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) return;

  var bands = document.querySelectorAll("[data-notify]");
  if (!bands.length) return;

  bands.forEach(function (band) {
    band.hidden = false;
    var form = band.querySelector(".notify__form");
    var input = band.querySelector(".notify__email");
    var submit = band.querySelector(".notify__submit");
    var status = band.querySelector(".notify__status");
    if (!form || !input || !submit || !status) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = (input.value || "").trim();
      if (!email) return;
      submit.disabled = true;
      status.textContent = "";
      status.classList.remove("notify__status--ok");

      fetch(cfg.SUPABASE_URL + "/rest/v1/rpc/notify_signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: cfg.SUPABASE_ANON_KEY
        },
        body: JSON.stringify({ p_email: email })
      })
        .then(function (res) {
          if (res.ok) {
            form.hidden = true;
            status.classList.add("notify__status--ok");
            status.textContent =
              "You’re on the list. A short note will land in your inbox when something new goes up.";
            return;
          }
          // A raised exception from the function comes back as 400 with a
          // reader-facing message; anything else gets the generic line.
          return res
            .json()
            .catch(function () { return {}; })
            .then(function (body) {
              throw new Error(
                res.status === 400 && body && body.message
                  ? body.message
                  : "Couldn’t sign you up just now. Try again in a minute."
              );
            });
        })
        .catch(function (err) {
          submit.disabled = false;
          status.textContent =
            err && err.message
              ? err.message
              : "Couldn’t sign you up just now. Try again in a minute.";
        });
    });
  });
})();
