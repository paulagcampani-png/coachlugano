/* ============================================
   COACH FRÀ — MAIN SITE SCRIPT
   ============================================ */
document.addEventListener("DOMContentLoaded", () => {

  CoachFraAnalytics.trackPageView();
  CoachFraAnalytics.initScrollDepthTracking();

  /* ---------- Header scroll state ---------- */
  const header = document.querySelector(".site-header");
  window.addEventListener("scroll", () => {
    header.classList.toggle("scrolled", window.scrollY > 8);
  }, { passive: true });

  /* ---------- Mobile nav ---------- */
  const navToggle = document.querySelector(".nav-toggle");
  const mobilePanel = document.querySelector(".mobile-panel");
  navToggle.addEventListener("click", () => {
    const willOpen = !navToggle.classList.contains("open");
    navToggle.classList.toggle("open", willOpen);
    mobilePanel.classList.toggle("open", willOpen);
    document.body.style.overflow = willOpen ? "hidden" : "";
  });
  mobilePanel.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navToggle.classList.remove("open");
      mobilePanel.classList.remove("open");
      document.body.style.overflow = "";
    });
  });

  /* ---------- Reveal-on-scroll ---------- */
  const revealEls = document.querySelectorAll(".reveal");
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealEls.forEach((el) => revealObserver.observe(el));

  /* ---------- CTA click tracking (any element with data-cta) ---------- */
  document.querySelectorAll("[data-cta]").forEach((el) => {
    el.addEventListener("click", () => {
      CoachFraAnalytics.trackCTAClick(
        el.getAttribute("data-cta"),
        el.getAttribute("data-cta-location") || "unknown"
      );
    });
  });

  /* ---------- Contact channel tracking ---------- */
  document.querySelectorAll("[data-contact='whatsapp']").forEach((el) => {
    el.addEventListener("click", () => CoachFraAnalytics.trackWhatsAppClick(el.getAttribute("data-cta-location") || "unknown"));
  });
  document.querySelectorAll("[data-contact='phone']").forEach((el) => {
    el.addEventListener("click", () => CoachFraAnalytics.trackPhoneClick(el.getAttribute("data-cta-location") || "unknown"));
  });
  document.querySelectorAll("[data-contact='email']").forEach((el) => {
    el.addEventListener("click", () => CoachFraAnalytics.trackEmailClick(el.getAttribute("data-cta-location") || "unknown"));
  });

  /* ---------- Package duration switcher (45 / 60 min) ---------- */
  const pkgSwitchBtns = document.querySelectorAll(".pkg-switch button");
  const pkgPanels = document.querySelectorAll(".pkg-panel");
  pkgSwitchBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-pkg-target");
      pkgSwitchBtns.forEach((b) => b.classList.toggle("active", b === btn));
      pkgPanels.forEach((p) => p.classList.toggle("active", p.id === target));
      CoachFraAnalytics.trackPackageView(btn.textContent.trim());
    });
  });
  document.querySelectorAll("[data-pkg-tier]").forEach((el) => {
    el.addEventListener("click", () => {
      const duration = el.closest(".pkg-panel")?.querySelector("[data-pkg-duration]")?.dataset.pkgDuration || "unknown";
      CoachFraAnalytics.trackPackageSelect(duration, el.getAttribute("data-pkg-tier"));
    });
  });

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll(".faq-item").forEach((item) => {
    const q = item.querySelector(".faq-q");
    const a = item.querySelector(".faq-a");
    q.addEventListener("click", () => {
      const isOpen = item.classList.contains("open");
      document.querySelectorAll(".faq-item.open").forEach((openItem) => {
        if (openItem !== item) {
          openItem.classList.remove("open");
          openItem.querySelector(".faq-a").style.maxHeight = null;
        }
      });
      item.classList.toggle("open", !isOpen);
      a.style.maxHeight = !isOpen ? a.scrollHeight + "px" : null;
      if (!isOpen) {
        CoachFraAnalytics.trackFAQOpen(q.textContent.trim());
      }
    });
  });

  /* ---------- Map interaction tracking ---------- */
  const mapEl = document.querySelector(".studio-map");
  if (mapEl) {
    let fired = false;
    mapEl.addEventListener("click", () => {
      if (!fired) { fired = true; CoachFraAnalytics.trackMapInteraction(); }
    });
  }

  /* ---------- Contact form: validation + Mailchimp + GA4 ---------- */
  const form = document.getElementById("contact-form");
  if (form) {
    let startTracked = false;
    const formStatus = document.getElementById("form-status");

    form.querySelectorAll("input, select, textarea").forEach((field) => {
      field.addEventListener("focus", () => {
        if (!startTracked) {
          startTracked = true;
          CoachFraAnalytics.trackFormStart();
        }
      });
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      formStatus.className = "form-status";
      formStatus.textContent = "";

      const submitBtn = form.querySelector("button[type='submit']");
      const formData = new FormData(form);
      const payload = {
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        goal: formData.get("goal"),
        message: formData.get("message"),
      };

      if (!payload.firstName || !payload.email || !payload.goal) {
        formStatus.textContent = "Please fill in the required fields (first name, email, goal).";
        formStatus.classList.add("show", "error");
        CoachFraAnalytics.trackFormError("validation_failed");
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = "Sending…";

      try {
        // See ANALYTICS_SETUP.md / MAILCHIMP_SETUP.md for the proxy this calls.
        const response = await fetch(window.MAILCHIMP_PROXY_URL || "/api/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error("network_error");

        formStatus.textContent = "Thank you! Your request has been sent — Francesco will reply within 24h.";
        formStatus.classList.add("show", "success");
        CoachFraAnalytics.trackFormSubmit(payload);
        form.reset();
        startTracked = false;
      } catch (err) {
        formStatus.textContent = "Something went wrong sending your request. Please WhatsApp Francesco directly using the button below.";
        formStatus.classList.add("show", "error");
        CoachFraAnalytics.trackFormError(err.message || "unknown_error");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Send My Request";
      }
    });
  }

});
