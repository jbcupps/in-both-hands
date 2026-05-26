/* In Both Hands — small site script.
   Reveal-on-scroll + chapter expand/collapse. No frameworks. */

(function () {
  "use strict";

  /* ---- Reveal on scroll ----------------------------------------------- */
  const revealEls = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---- Chapter expand / collapse -------------------------------------- */
  const toggles = document.querySelectorAll(".chapter__toggle");
  toggles.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      const target = document.getElementById(targetId);
      if (!target) return;
      const expanded = btn.getAttribute("aria-expanded") === "true";
      if (expanded) {
        target.hidden = true;
        btn.setAttribute("aria-expanded", "false");
        btn.querySelector(".chapter__toggle-label").textContent =
          "Read the full chapter";
      } else {
        target.hidden = false;
        btn.setAttribute("aria-expanded", "true");
        btn.querySelector(".chapter__toggle-label").textContent =
          "Collapse chapter";
      }
    });
  });

  /* ---- Smooth-scroll offset for sticky nav (fallback only) ------------ */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href").slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      // Native smooth-scroll via CSS is enabled; this just keeps focus moving.
      target.setAttribute("tabindex", "-1");
      setTimeout(() => target.focus({ preventScroll: true }), 600);
    });
  });
})();
