import { Link } from "react-router-dom";

export function SiteFooter() {
  return (
    <footer
      className="mt-20"
      style={{
        background: "var(--surface-container-low)",
        borderTop: "1px solid var(--glass-border)",
      }}
    >
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5">
              <span
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-sm font-black"
                style={{ background: "var(--gradient-amber)", color: "var(--on-primary)" }}
              >
                C
              </span>
              <span className="text-lg font-black tracking-tight" style={{ color: "var(--on-surface)" }}>
                ApnaStay
              </span>
            </div>
            <p className="mt-4 text-sm leading-6" style={{ color: "var(--outline)" }}>
              Built for students to find better rentals around campus. Trusted by thousands of students across India.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h4
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: "var(--outline)", letterSpacing: "0.1em" }}
            >
              Explore
            </h4>
            <nav className="mt-4 flex flex-col gap-3 text-sm" style={{ color: "var(--on-surface-variant)" }}>
              <Link to="/discover" className="transition-colors" style={{ color: "inherit" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--on-surface-variant)")}
              >
                Discover Listings
              </Link>
              <Link to="/shortlists" className="transition-colors" style={{ color: "inherit" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--on-surface-variant)")}
              >
                Saved Listings
              </Link>
              <Link to="/alerts" className="transition-colors" style={{ color: "inherit" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--on-surface-variant)")}
              >
                My Alerts
              </Link>
            </nav>
          </div>

          {/* For Owners */}
          <div>
            <h4
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: "var(--outline)", letterSpacing: "0.1em" }}
            >
              For Owners
            </h4>
            <nav className="mt-4 flex flex-col gap-3 text-sm" style={{ color: "var(--on-surface-variant)" }}>
              <Link to="/owner" className="transition-colors" style={{ color: "inherit" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--on-surface-variant)")}
              >
                Owner Dashboard
              </Link>
              <Link to="/login" className="transition-colors" style={{ color: "inherit" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--on-surface-variant)")}
              >
                List Your Property
              </Link>
            </nav>
          </div>

          {/* Account */}
          <div>
            <h4
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: "var(--outline)", letterSpacing: "0.1em" }}
            >
              Account
            </h4>
            <nav className="mt-4 flex flex-col gap-3 text-sm" style={{ color: "var(--on-surface-variant)" }}>
              <Link to="/login" className="transition-colors" style={{ color: "inherit" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--on-surface-variant)")}
              >
                Login / Sign Up
              </Link>
              <Link to="/profile" className="transition-colors" style={{ color: "inherit" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--on-surface-variant)")}
              >
                My Profile
              </Link>
            </nav>
          </div>
        </div>

        <div
          className="mt-10 pt-6 text-center text-xs font-semibold"
          style={{
            borderTop: "1px solid var(--glass-border)",
            color: "var(--outline)",
          }}
        >
          © {new Date().getFullYear()} ApnaStay. Curated student living. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
