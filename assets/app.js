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
      // Labels default to the novel's "chapter" wording but can be overridden
      // per-toggle (e.g. the short-stories page) via data-label-* attributes.
      const expandLabel = btn.getAttribute("data-label-expand") || "Read the full chapter";
      const collapseLabel = btn.getAttribute("data-label-collapse") || "Collapse chapter";
      if (expanded) {
        target.hidden = true;
        btn.setAttribute("aria-expanded", "false");
        btn.querySelector(".chapter__toggle-label").textContent = expandLabel;
      } else {
        target.hidden = false;
        btn.setAttribute("aria-expanded", "true");
        btn.querySelector(".chapter__toggle-label").textContent = collapseLabel;
      }
    });
  });

  /* ---- Bilingual story language switch -------------------------------- */
  // A story body can hold parallel .story-lang[data-lang="en"|"ru"] blocks.
  // The toggle swaps which is shown and re-labels itself in the other tongue.
  const LANG_LABELS = {
    vasilisa: {
      ru: { title: "Тихое пламя Василисы", sub: "Читать по-русски", aria: "Читать «Тихое пламя Василисы» по-русски" },
      en: { title: "The Quiet Flame of Vasilisa", sub: "Read in English", aria: "Read “The Quiet Flame of Vasilisa” in English" }
    },
    seeker: {
      ru: { title: "Искательница истинных теней", sub: "Читать по-русски", aria: "Читать «Искательница истинных теней» по-русски" },
      en: { title: "The Seeker of True Shadows", sub: "Read in English", aria: "Read “The Seeker of True Shadows” in English" }
    },
    "black-host": {
      ru: { title: "Когда пришло Чёрное Воинство", sub: "Читать по-русски", aria: "Читать «Когда пришло Чёрное Воинство и сгорело Высокое Место» по-русски" },
      en: { title: "When the Black Host Came", sub: "Read in English", aria: "Read “When the Black Host Came and the High Place Burned” in English" }
    },
    "living-water": {
      ru: { title: "Дорога живой воды", sub: "Читать по-русски", aria: "Читать «Дорогу живой воды» по-русски" },
      en: { title: "The Road of the Living Water", sub: "Read in English", aria: "Read “The Road of the Living Water” in English" }
    },
    "golden-cage": {
      ru: { title: "Золотая клетка и имя, которое она не хотела назвать", sub: "Читать по-русски", aria: "Читать «Золотую клетку и имя, которое она не хотела назвать» по-русски" },
      en: { title: "The Golden Cage and the Name She Would Not Claim", sub: "Read in English", aria: "Read “The Golden Cage and the Name She Would Not Claim” in English" }
    }
  };
  document.querySelectorAll("[data-lang-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const inner = btn.closest(".chapter__body-inner");
      if (!inner) return;
      const en = inner.querySelector('.story-lang[data-lang="en"]');
      const ru = inner.querySelector('.story-lang[data-lang="ru"]');
      if (!en || !ru) return;
      const showRu = btn.getAttribute("aria-pressed") !== "true";
      en.hidden = showRu;
      ru.hidden = !showRu;
      btn.setAttribute("aria-pressed", showRu ? "true" : "false");
      // When Russian is showing, the button offers a way back to English.
      const labels = LANG_LABELS[btn.getAttribute("data-lang-toggle")];
      const face = labels ? (showRu ? labels.en : labels.ru) : null;
      if (face) {
        const title = btn.querySelector(".lang-toggle__title");
        const sub = btn.querySelector(".lang-toggle__sub");
        if (title) title.textContent = face.title;
        if (sub) sub.textContent = face.sub;
        btn.setAttribute("aria-label", face.aria);
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
