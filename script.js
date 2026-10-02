(() => {
  "use strict";
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const menu = document.querySelector(".mobile-menu");
  const header = document.querySelector(".site-header");
  let observer;
  let frame = 0;

  // A disclosure, not a modal: native keyboard semantics and no focus trap.
  if (menu) {
    menu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        menu.open = false;
        const target = document.querySelector(link.getAttribute("href"));
        if (target) {
          target.setAttribute("tabindex", "-1");
          target.focus({ preventScroll: true });
        }
      });
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menu.open) {
        menu.open = false;
        menu.querySelector("summary").focus();
      }
    });
    document.addEventListener("click", (event) => {
      if (menu.open && !menu.contains(event.target)) menu.open = false;
    });
    window.matchMedia("(min-width: 701px)").addEventListener("change", (event) => {
      if (event.matches) menu.open = false;
    });
  }

  // Enhancement only: content is readable even if JS or the observer fails.
  function setupMotion() {
    if (observer) observer.disconnect();
    document.querySelectorAll(".is-arriving").forEach((el) => el.classList.remove("is-arriving"));
    if (motion.matches || !("IntersectionObserver" in window)) return;
    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-arriving");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    document.querySelectorAll("[data-reveal]").forEach((el) => observer.observe(el));
  }
  function updateProgress() {
    frame = 0;
    if (motion.matches || !header) return;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
    header.style.setProperty("--read-progress", progress.toFixed(4));
  }
  function scheduleProgress() {
    if (!frame) frame = window.requestAnimationFrame(updateProgress);
  }
  window.addEventListener("scroll", scheduleProgress, { passive: true });
  window.addEventListener("resize", scheduleProgress, { passive: true });
  motion.addEventListener("change", () => { setupMotion(); scheduleProgress(); });
  setupMotion();
  updateProgress();
})();
