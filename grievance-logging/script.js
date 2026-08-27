(() => {
  "use strict";

  const header = document.querySelector(".site-header");
  const navToggle = document.querySelector(".nav-toggle");
  const siteMenu = document.getElementById("site-menu");

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const setHeaderState = () => {
    if (header) {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    }
  };
  setHeaderState();
  window.addEventListener("scroll", setHeaderState, { passive: true });

  const closeMenu = () => {
    document.body.classList.remove("menu-open");
    if (navToggle) {
      navToggle.setAttribute("aria-expanded", "false");
    }
  };

  if (navToggle && siteMenu) {
    navToggle.addEventListener("click", () => {
      const isOpen = document.body.classList.toggle("menu-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });

    siteMenu.addEventListener("click", (event) => {
      if (event.target.closest("a")) {
        closeMenu();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    });
  }

  const revealables = document.querySelectorAll("[data-reveal]");
  const showAllReveals = () => {
    revealables.forEach((el) => el.classList.add("is-visible"));
  };

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    showAllReveals();
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -48px 0px" }
    );
    revealables.forEach((el) => observer.observe(el));
  }

  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  // --- Supabase demo request form ---
  // SUPABASE_URL and SUPABASE_KEY come from config.js
  const demoForm = document.getElementById("demo-form");
  const demoStatus = document.getElementById("demo-form-status");

  if (demoForm && window.supabase) {
    const supabaseClient = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_KEY
    );

    demoForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const name = document.getElementById("df-name").value.trim();
      const email = document.getElementById("df-email").value.trim();
      const message = document.getElementById("df-message").value.trim();
      const submitBtn = demoForm.querySelector("button[type='submit']");

      submitBtn.disabled = true;
      demoStatus.textContent = "Sending...";

      const { error } = await supabaseClient.from("demo_requests").insert([
        {
          name,
          email,
          message,
          source_page: "grievance-logging",
        },
      ]);

      if (error) {
        demoStatus.textContent =
          "Something went wrong. Please try again.";
        console.error(error);
      } else {
        demoStatus.textContent = "Thank you! We'll be in touch soon.";
        demoForm.reset();
      }

      submitBtn.disabled = false;
    });
  }
})();
