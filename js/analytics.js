/* ============================================
   COACH FRÀ — ANALYTICS / DATA LAYER
   ------------------------------------------------
   This file centralizes every event the site sends
   to Google Tag Manager's dataLayer. GA4 (via GTM)
   reads from window.dataLayer, so every interaction
   we care about gets pushed here in one place.

   HOW TO WIRE THIS UP (see ANALYTICS_SETUP.md):
   1. Create a GTM container, paste its snippet in
      index.html where marked.
   2. In GTM, create a GA4 Configuration tag.
   3. Create GA4 Event tags that fire on the custom
      events below (Trigger = Custom Event, name
      matches event names here exactly).
   4. Publish the container.
   ============================================ */

window.dataLayer = window.dataLayer || [];

const CoachFraAnalytics = (() => {

  /** Push a structured event to the dataLayer */
  function pushEvent(eventName, payload = {}) {
    const event = {
      event: eventName,
      ...payload,
      event_timestamp: new Date().toISOString(),
    };
    window.dataLayer.push(event);
    // Helpful while wiring things up: remove or gate behind a debug flag in production.
    if (window.CF_DEBUG) console.log("[dataLayer push]", event);
  }

  /** Fires once, on initial page load, with page-level context */
  function trackPageView() {
    pushEvent("page_view_custom", {
      page_path: window.location.pathname,
      page_title: document.title,
      page_location: window.location.href,
    });
  }

  /** CTA / booking button clicks anywhere on the site */
  function trackCTAClick(ctaLabel, ctaLocation) {
    pushEvent("cta_click", {
      cta_label: ctaLabel,
      cta_location: ctaLocation, // e.g. "hero", "header", "sticky_mobile", "pricing"
    });
  }

  /** WhatsApp click-to-chat */
  function trackWhatsAppClick(location) {
    pushEvent("contact_whatsapp_click", {
      contact_method: "whatsapp",
      cta_location: location,
    });
  }

  /** Phone number click */
  function trackPhoneClick(location) {
    pushEvent("contact_phone_click", {
      contact_method: "phone",
      cta_location: location,
    });
  }

  /** Email link click */
  function trackEmailClick(location) {
    pushEvent("contact_email_click", {
      contact_method: "email",
      cta_location: location,
    });
  }

  /** Pricing package viewed / tab switched (45 vs 60 min) */
  function trackPackageView(durationLabel) {
    pushEvent("package_view", {
      package_duration: durationLabel, // "45-min" | "60-min"
    });
  }

  /** Specific session tier selected within a package (e.g. "12 sessions") */
  function trackPackageSelect(durationLabel, tierLabel) {
    pushEvent("package_select", {
      package_duration: durationLabel,
      package_tier: tierLabel,
    });
  }

  /** FAQ accordion opened — signals intent/objection-handling content read */
  function trackFAQOpen(question) {
    pushEvent("faq_open", {
      faq_question: question,
    });
  }

  /** Fires when the contact form is started (first field focus) */
  function trackFormStart() {
    pushEvent("generate_lead_start", {
      form_id: "contact_form",
    });
  }

  /**
   * Fires on successful form submission.
   * This is the primary conversion event — mirror its name
   * ("generate_lead") in GA4 as a marked Conversion.
   */
  function trackFormSubmit(formData) {
    pushEvent("generate_lead", {
      form_id: "contact_form",
      lead_goal: formData.goal || "not_specified",
      // NOTE: do not push personally identifiable info (name, email, phone)
      // into the dataLayer/GA4. Keep PII inside Mailchimp only.
    });
  }

  /** Fires if the form submission fails client- or server-side */
  function trackFormError(reason) {
    pushEvent("generate_lead_error", {
      form_id: "contact_form",
      error_reason: reason,
    });
  }

  /** Map interaction — proxy for "checking how close the studio is" */
  function trackMapInteraction() {
    pushEvent("studio_map_interact", {});
  }

  /** Scroll depth milestones, useful for measuring content engagement */
  function trackScrollDepth(percent) {
    pushEvent("scroll_depth", {
      scroll_percent: percent,
    });
  }

  function initScrollDepthTracking() {
    const milestones = [25, 50, 75, 90];
    const fired = new Set();
    window.addEventListener("scroll", () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );
      milestones.forEach((m) => {
        if (scrollPercent >= m && !fired.has(m)) {
          fired.add(m);
          trackScrollDepth(m);
        }
      });
    }, { passive: true });
  }

  return {
    pushEvent,
    trackPageView,
    trackCTAClick,
    trackWhatsAppClick,
    trackPhoneClick,
    trackEmailClick,
    trackPackageView,
    trackPackageSelect,
    trackFAQOpen,
    trackFormStart,
    trackFormSubmit,
    trackFormError,
    trackMapInteraction,
    initScrollDepthTracking,
  };
})();
