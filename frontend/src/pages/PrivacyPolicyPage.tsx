import { Reveal } from "../components/ui/Reveal";
import { Link } from "react-router-dom";

const Section = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
  <section id={id} className="mb-10">
    <h2
      className="mb-4 text-xl font-black"
      style={{ color: "var(--on-surface)", letterSpacing: "-0.01em" }}
    >
      {title}
    </h2>
    <div className="space-y-3 text-sm leading-7" style={{ color: "var(--on-surface-variant)" }}>
      {children}
    </div>
  </section>
);

export function PrivacyPolicyPage() {
  const lastUpdated = "26 May 2025";

  return (
    <main
      className="mx-auto max-w-3xl px-6 py-10"
      style={{ color: "var(--on-surface)" }}
    >
      {/* ── Header ── */}
      <Reveal>
        <div className="section-dark relative overflow-hidden mb-10">
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-20"
            style={{ background: "var(--primary-fixed-dim)", filter: "blur(60px)" }}
          />
          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-amber-400">
              Legal
            </p>
            <h1 className="mt-2 text-3xl font-black text-white">Privacy Policy</h1>
            <p className="mt-2 text-sm text-slate-300">
              Last updated: {lastUpdated}
            </p>
          </div>
        </div>
      </Reveal>

      {/* ── Intro ── */}
      <Reveal delayMs={40}>
        <div
          className="mb-8 rounded-2xl p-5 text-sm leading-7"
          style={{ background: "var(--surface-container-low)", color: "var(--on-surface-variant)" }}
        >
          Welcome to <strong style={{ color: "var(--on-surface)" }}>NearMyColleges</strong> ("we," "us," or "our"). We operate the platform available at <strong style={{ color: "var(--on-surface)" }}>nearmycolleges.in</strong> (the "Platform"). This Privacy Policy explains how we collect, use, store, and protect your personal information when you use our Platform. By creating an account or browsing the Platform, you agree to the terms of this Privacy Policy.
        </div>
      </Reveal>

      {/* ── Sections ── */}
      <Reveal delayMs={60}>
        <div
          className="rounded-2xl p-6 md:p-8"
          style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}
        >
          <Section id="info-collect" title="1. Information We Collect">
            <p>We collect information in the following ways:</p>
            <ul className="ml-5 list-disc space-y-2 mt-2">
              <li>
                <strong style={{ color: "var(--on-surface)" }}>Account Information:</strong> When you register, we collect your name, email address, phone number, and role (student or property owner).
              </li>
              <li>
                <strong style={{ color: "var(--on-surface)" }}>Profile Information:</strong> College name, course details, and profile picture that you voluntarily provide.
              </li>
              <li>
                <strong style={{ color: "var(--on-surface)" }}>Property Listings:</strong> For property owners, we collect listing details including address, photos, amenities, and pricing.
              </li>
              <li>
                <strong style={{ color: "var(--on-surface)" }}>Usage Data:</strong> Automatically collected data including IP addresses, browser type, pages visited, search queries, and shortlisted properties.
              </li>
              <li>
                <strong style={{ color: "var(--on-surface)" }}>Communications:</strong> Messages and inquiries sent through the Platform between students and owners.
              </li>
            </ul>
          </Section>

          <div className="my-6 h-px" style={{ background: "var(--glass-border)" }} />

          <Section id="how-we-use" title="2. How We Use Your Information">
            <p>We use the information we collect to:</p>
            <ul className="ml-5 list-disc space-y-2 mt-2">
              <li>Create and manage your account and authenticate you securely via Firebase.</li>
              <li>Display relevant property listings based on your college and search preferences.</li>
              <li>Facilitate communication between students and property owners for booking inquiries.</li>
              <li>Send you alerts for new listings matching your saved preferences (only if you enable Alerts).</li>
              <li>Improve and personalise the Platform experience.</li>
              <li>Communicate platform updates, changes to Terms, or important notices.</li>
              <li>Comply with legal obligations.</li>
            </ul>
          </Section>

          <div className="my-6 h-px" style={{ background: "var(--glass-border)" }} />

          <Section id="data-sharing" title="3. Data Sharing & Disclosure">
            <p>We do <strong style={{ color: "var(--on-surface)" }}>not sell</strong> your personal information to third parties. We may share your data only in these circumstances:</p>
            <ul className="ml-5 list-disc space-y-2 mt-2">
              <li>
                <strong style={{ color: "var(--on-surface)" }}>With Property Owners:</strong> When you submit a booking inquiry, your name and contact number are shared with the relevant property owner to facilitate the inquiry.
              </li>
              <li>
                <strong style={{ color: "var(--on-surface)" }}>With Students (Limited):</strong> Property owners' publicly listed contact information is visible to registered, verified students.
              </li>
              <li>
                <strong style={{ color: "var(--on-surface)" }}>Service Providers:</strong> We use trusted third-party services including Google Firebase (authentication and database), Render (backend hosting), and Cloudinary (image hosting). These providers process data strictly for platform operation.
              </li>
              <li>
                <strong style={{ color: "var(--on-surface)" }}>Legal Requirements:</strong> We may disclose data if required by law, court order, or government authority.
              </li>
            </ul>
          </Section>

          <div className="my-6 h-px" style={{ background: "var(--glass-border)" }} />

          <Section id="cookies" title="4. Cookies & Local Storage">
            <p>
              We use <strong style={{ color: "var(--on-surface)" }}>cookies</strong> and browser <strong style={{ color: "var(--on-surface)" }}>localStorage</strong> to improve your experience on the Platform:
            </p>
            <ul className="ml-5 list-disc space-y-2 mt-2">
              <li>
                <strong style={{ color: "var(--on-surface)" }}>Essential Cookies:</strong> Firebase authentication uses cookies to manage your login session securely. These are strictly necessary for the Platform to function.
              </li>
              <li>
                <strong style={{ color: "var(--on-surface)" }}>Analytics Cookies:</strong> We use Google Analytics (gtag.js) to understand how visitors interact with the Platform — including page views, session duration, and general traffic patterns. Google Analytics sets cookies such as <code style={{ background: "var(--surface-container)", padding: "0.1em 0.4em", borderRadius: "4px", fontSize: "0.85em" }}>_ga</code> and <code style={{ background: "var(--surface-container)", padding: "0.1em 0.4em", borderRadius: "4px", fontSize: "0.85em" }}>_ga_*</code> to distinguish unique users. This data is anonymised and used solely to improve the Platform.
              </li>
              <li>
                <strong style={{ color: "var(--on-surface)" }}>Local Storage:</strong> We use browser localStorage to remember your theme preference (dark/light mode).
              </li>
            </ul>
            <p className="mt-3">
              We do <strong style={{ color: "var(--on-surface)" }}>not</strong> use advertising cookies or sell data to third-party advertisers. You can clear cookies at any time from your browser settings, though this may affect your login session.
            </p>
          </Section>

          <div className="my-6 h-px" style={{ background: "var(--glass-border)" }} />

          <Section id="data-security" title="5. Data Security">
            <p>
              We implement industry-standard security measures to protect your data:
            </p>
            <ul className="ml-5 list-disc space-y-2 mt-2">
              <li>All data transmitted between your browser and our servers is encrypted via HTTPS/TLS.</li>
              <li>Authentication is handled by Google Firebase, which provides secure, token-based access.</li>
              <li>Passwords are never stored on our servers — Firebase handles all authentication credentials.</li>
              <li>Access to production databases is restricted to authorised personnel only.</li>
            </ul>
            <p className="mt-3">
              While we take security seriously, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security of your data.
            </p>
          </Section>

          <div className="my-6 h-px" style={{ background: "var(--glass-border)" }} />

          <Section id="your-rights" title="6. Your Rights">
            <p>You have the following rights regarding your personal data:</p>
            <ul className="ml-5 list-disc space-y-2 mt-2">
              <li><strong style={{ color: "var(--on-surface)" }}>Access:</strong> Request a copy of the personal data we hold about you.</li>
              <li><strong style={{ color: "var(--on-surface)" }}>Correction:</strong> Update or correct inaccurate information from your Profile page.</li>
              <li><strong style={{ color: "var(--on-surface)" }}>Deletion:</strong> Request deletion of your account and associated data by contacting us.</li>
              <li><strong style={{ color: "var(--on-surface)" }}>Withdrawal of Consent:</strong> Disable email alerts or notifications from your Profile settings at any time.</li>
            </ul>
            <p className="mt-3">
              To exercise these rights, email us at{" "}
              <a href="mailto:support@nearmycolleges.in" className="font-bold transition-colors hover:underline"
                style={{ color: "var(--primary)" }}>
                support@nearmycolleges.in
              </a>.
            </p>
          </Section>

          <div className="my-6 h-px" style={{ background: "var(--glass-border)" }} />

          <Section id="data-retention" title="7. Data Retention">
            <p>
              We retain your account data for as long as your account is active. If you request account deletion, we will delete or anonymise your personal information within 30 days, except where we are required by law to retain it longer.
            </p>
          </Section>

          <div className="my-6 h-px" style={{ background: "var(--glass-border)" }} />

          <Section id="minors" title="8. Children's Privacy">
            <p>
              Our Platform is intended for college students (18 years and older). We do not knowingly collect personal information from anyone under the age of 18. If we become aware that a minor has provided us with personal information, we will delete it promptly.
            </p>
          </Section>

          <div className="my-6 h-px" style={{ background: "var(--glass-border)" }} />

          <Section id="changes" title="9. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any significant changes by updating the "Last Updated" date at the top and, where appropriate, via email or an in-app notification. Continued use of the Platform after changes constitute your acceptance of the revised policy.
            </p>
          </Section>

          <div className="my-6 h-px" style={{ background: "var(--glass-border)" }} />

          <Section id="contact" title="10. Contact Us">
            <p>
              If you have any questions about this Privacy Policy or how we handle your data, please contact us:
            </p>
            <div className="mt-3 rounded-xl p-4 space-y-2" style={{ background: "var(--surface-container)" }}>
              <p><strong style={{ color: "var(--on-surface)" }}>NearMyColleges</strong></p>
              <p>📧 <a href="mailto:support@nearmycolleges.in" className="font-bold" style={{ color: "var(--primary)" }}>support@nearmycolleges.in</a></p>
              <p>📞 <a href="tel:+918152916235" className="font-bold" style={{ color: "var(--primary)" }}>+91 81529 16235</a></p>
              <p>💬 <a href="https://wa.me/918152916235" target="_blank" rel="noopener noreferrer" className="font-bold" style={{ color: "var(--primary)" }}>WhatsApp Support</a></p>
            </div>
          </Section>
        </div>
      </Reveal>

      {/* ── Footer nav ── */}
      <Reveal delayMs={80}>
        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <Link to="/terms-of-service" className="btn-ghost !px-5 !py-2.5 !text-sm">
            Terms of Service →
          </Link>
          <Link to="/discover" className="btn-primary !px-5 !py-2.5 !text-sm">
            Browse Listings →
          </Link>
        </div>
      </Reveal>
    </main>
  );
}
