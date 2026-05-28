import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const COOKIE_CONSENT_KEY = "nmc_cookie_consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Show banner after a short delay so it doesn't flash on first paint
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "declined");
    // Disable Google Analytics if user declines
    (window as any)["ga-disable-G-E71Q1LTXJQ"] = true;
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[9999] animate-slideUp"
      style={{ pointerEvents: "auto" }}
    >
      <div
        className="mx-auto max-w-4xl px-4 pb-4 sm:px-6"
      >
        <div
          className="flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-2xl p-5 sm:p-6"
          style={{
            background: "rgba(15, 23, 42, 0.95)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 -4px 30px rgba(0,0,0,0.3)",
          }}
        >
          {/* Icon + Text */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <span className="text-2xl shrink-0 mt-0.5">🍪</span>
            <div>
              <p className="text-sm font-bold text-white">We use cookies</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-300">
                We use essential cookies for authentication and Google Analytics to understand how you use NearMyColleges.
                No advertising cookies.{" "}
                <Link
                  to="/privacy-policy#cookies"
                  className="font-bold text-amber-400 underline underline-offset-2 transition-colors hover:text-amber-300"
                >
                  Learn more
                </Link>
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              onClick={handleDecline}
              className="flex-1 sm:flex-none rounded-full px-5 py-2.5 text-xs font-bold text-slate-300 transition-all hover:text-white"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              className="flex-1 sm:flex-none rounded-full px-6 py-2.5 text-xs font-black text-white transition-all hover:scale-105 active:scale-95"
              style={{
                background: "var(--gradient-amber)",
              }}
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
