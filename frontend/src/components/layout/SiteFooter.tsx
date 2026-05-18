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
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-5">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5">
              <span
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-sm font-black"
                style={{ background: "var(--gradient-amber)", color: "var(--on-primary)" }}
              >
                N
              </span>
              <span className="text-lg font-black tracking-tight" style={{ color: "var(--on-surface)" }}>
                NearMyColleges
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

          {/* Support Helpline */}
          <div>
            <h4
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: "var(--outline)", letterSpacing: "0.1em" }}
            >
              Support Helpline
            </h4>
            <div className="mt-4 flex flex-col gap-4 text-xs font-semibold" style={{ color: "var(--on-surface-variant)" }}>
              <div className="flex flex-col gap-1">
                <span className="font-bold text-[11px]" style={{ color: "var(--on-surface)" }}>Support Helpline 1:</span>
                <span className="font-mono text-xs text-slate-800 dark:text-slate-200">8152916235</span>
                <div className="flex gap-2.5 mt-1">
                  <a href="tel:+918152916235" className="hover:underline text-amber-500 font-bold transition-opacity hover:opacity-80">📞 Call</a>
                  <a href="https://wa.me/918152916235" target="_blank" rel="noopener noreferrer" className="hover:underline text-emerald-500 font-bold transition-opacity hover:opacity-80">💬 WhatsApp</a>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-bold text-[11px]" style={{ color: "var(--on-surface)" }}>Support Helpline 2:</span>
                <span className="font-mono text-xs text-slate-800 dark:text-slate-200">9002252480</span>
                <div className="flex gap-2.5 mt-1">
                  <a href="tel:+919002252480" className="hover:underline text-amber-500 font-bold transition-opacity hover:opacity-80">📞 Call</a>
                  <a href="https://wa.me/919002252480" target="_blank" rel="noopener noreferrer" className="hover:underline text-emerald-500 font-bold transition-opacity hover:opacity-80">💬 WhatsApp</a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className="mt-10 pt-6 text-center text-xs font-semibold"
          style={{
            borderTop: "1px solid var(--glass-border)",
            color: "var(--outline)",
          }}
        >
          © {new Date().getFullYear()} NearMyColleges. Curated student living. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
