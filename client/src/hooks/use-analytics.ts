import { useEffect } from "react";
import { useLocation } from "wouter";

function getVisitorId(): string {
  let visitorId = localStorage.getItem("dwc-visitor-id");
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem("dwc-visitor-id", visitorId);
  }
  return visitorId;
}

export function usePageAnalytics() {
  const [location] = useLocation();

  useEffect(() => {
    const trackPageView = async () => {
      try {
        await fetch("/api/analytics/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pageSlug: location || "/",
            visitorId: getVisitorId(),
            referrer: document.referrer || null,
            userAgent: navigator.userAgent,
          }),
        });
      } catch (error) {
        // Silently fail - analytics should never break the app
      }
    };

    trackPageView();
  }, [location]);
}
