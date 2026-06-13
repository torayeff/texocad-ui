import posthog from "posthog-js";

const posthogToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

if (posthogToken && posthogHost) {
  posthog.init(posthogToken, {
    addTracingHeaders: typeof window === "undefined" ? [] : [window.location.host],
    api_host: posthogHost,
    autocapture: {
      capture_copied_text: true,
      dom_event_allowlist: ["click", "change", "submit"],
      element_allowlist: ["a", "button", "form", "input", "select", "textarea", "label"],
    },
    capture_dead_clicks: true,
    capture_exceptions: {
      capture_console_errors: true,
      capture_unhandled_errors: true,
      capture_unhandled_rejections: true,
    },
    capture_heatmaps: true,
    capture_pageview: "history_change",
    capture_performance: {
      network_timing: true,
      web_vitals: true,
      web_vitals_attribution: true,
    },
    defaults: "2026-01-30",
    enable_recording_console_log: true,
    mask_all_element_attributes: false,
    mask_all_text: false,
    rageclick: true,
    session_recording: {
      captureCanvas: {
        canvasFps: 4,
        canvasQuality: "0.5",
        recordCanvas: true,
      },
      maskAllInputs: false,
      maskInputOptions: {
        password: true,
      },
      recordCrossOriginIframes: true,
    },
  });
}