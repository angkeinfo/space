"use strict";

if (!reducedMotion.matches) {
  const contentReveals = new IntersectionObserver((entries, observer) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      if (!entry.target.matches(":focus-within")) {
        entry.target.classList.add("content-visible");
      }
      observer.unobserve(entry.target);
    }
  }, { rootMargin: "0px 0px -32px 0px" });

  document.querySelectorAll(".home-section-heading, .home-content-card, .catalog-card, .detail-reveal").forEach((element) => {
    contentReveals.observe(element);
    element.addEventListener("focusin", () => element.classList.remove("content-visible"));
  });
}
