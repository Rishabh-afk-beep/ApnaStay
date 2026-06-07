import { Link } from "react-router-dom";

export function SiteFooter() {
  return (
    <footer className="mt-24 relative overflow-hidden" style={{ background: "var(--surface-container)", borderTop: "1px solid var(--outline-variant)" }}>
      {/* Ambient glow blobs */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-64 w-64 rounded-full opacity-10" style={{ background: "var(--primary)", filter: "blur(80px)" }} />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-48 w-48 rounded-full opacity-10" style={{ background: "var(--primary-container)", filter: "blur(60px)" }} />

      <div className="relative mx-auto max-w-6xl px-6 pt-16 pb-6">
        {/* ── Top grid ── */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-6">

          {/* Brand col — spans 2 */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3">
              <span
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-base font-black shadow-lg"
                style={{ background: "var(--gradient-amber)", color: "var(--on-primary)" }}
              >
                N
              </span>
              <span className="text-xl font-black tracking-tight" style={{ color: "var(--on-surface)" }}>NearMyColleges</span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-7" style={{ color: "var(--on-surface-variant)" }}>
              India's most trusted student housing platform. Find verified PGs, flats &amp; hostels near your campus — zero broker fees.
            </p>

            {/* Trust badges */}
            <div className="mt-6 flex flex-wrap gap-2">
              {["🛡️ Admin Verified", "🎓 Built for Students", "📍 Pan India"].map((badge) => (
                <span
                  key={badge}
                  className="rounded-full px-3 py-1 text-[10px] font-bold"
                  style={{ background: "var(--surface-container-high)", color: "var(--on-surface-variant)", border: "1px solid var(--outline-variant)" }}
                >
                  {badge}
                </span>
              ))}
            </div>

            {/* Social / contact strip */}
            <div className="mt-6 flex gap-3">
              <a
                href="https://wa.me/918152916235"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-xl transition-all hover:scale-110"
                style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80" }}
                title="WhatsApp"
              >
                💬
              </a>
              <a
                href="tel:+918152916235"
                className="flex h-9 w-9 items-center justify-center rounded-xl transition-all hover:scale-110"
                style={{ background: "var(--surface-container-high)", color: "var(--on-surface-variant)" }}
                title="Call us"
              >
                📞
              </a>
              <a
                href="mailto:support@nearmycolleges.in"
                className="flex h-9 w-9 items-center justify-center rounded-xl transition-all hover:scale-110"
                style={{ background: "var(--surface-container-high)", color: "var(--on-surface-variant)" }}
                title="Email"
              >
                ✉️
              </a>
            </div>
          </div>

          {/* Explore */}
          <FooterCol title="Explore">
            <FooterLink to="/discover">🔍 Discover Listings</FooterLink>
            <FooterLink to="/shortlists">❤️ Saved Listings</FooterLink>
            <FooterLink to="/alerts">🔔 My Alerts</FooterLink>
          </FooterCol>

          {/* For Owners */}
          <FooterCol title="For Owners">
            <FooterLink to="/owner">📊 Owner Dashboard</FooterLink>
            <FooterLink to="/login/owner">🏠 List Your Property</FooterLink>
          </FooterCol>

          {/* Account */}
          <FooterCol title="Account">
            <FooterLink to="/login">🔑 Login / Sign Up</FooterLink>
            <FooterLink to="/profile">👤 My Profile</FooterLink>
          </FooterCol>

          {/* Legal */}
          <FooterCol title="Legal">
            <FooterLink to="/privacy-policy">🔒 Privacy Policy</FooterLink>
            <FooterLink to="/terms-of-service">📋 Terms of Service</FooterLink>
          </FooterCol>
        </div>

        {/* ── Divider ── */}
        <div className="mt-12 h-px w-full" style={{ background: "var(--glass-border)" }} />

        {/* ── Bottom bar ── */}
        <div className="mt-6 flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
          <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
            © {new Date().getFullYear()} NearMyColleges · Curated student living. All rights reserved.
          </p>
          <div className="flex gap-5 text-xs flex-wrap justify-center sm:justify-end" style={{ color: "var(--on-surface-variant)" }}>
              <Link to="/privacy-policy" className="transition-colors hover:opacity-70">Privacy Policy</Link>
              <Link to="/terms-of-service" className="transition-colors hover:opacity-70">Terms of Service</Link>
              <a href="mailto:support@nearmycolleges.in" className="transition-colors hover:opacity-70">Contact Support</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ── Helpers ── */
function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4
        className="mb-4 text-[10px] font-black uppercase tracking-[0.15em]"
        style={{ color: "var(--outline)" }}
      >
        {title}
      </h4>
      <nav className="flex flex-col gap-3">{children}</nav>
    </div>
  );
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-2 text-sm transition-all"
      style={{ color: "var(--on-surface-variant)" }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--on-surface)")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--on-surface-variant)")}
    >
      {children}
    </Link>
  );
}
